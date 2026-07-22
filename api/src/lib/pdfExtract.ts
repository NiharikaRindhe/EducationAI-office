import * as mupdf from 'mupdf';
import { createHash } from 'node:crypto';
import { logger } from './logger.js';

// ─────────────────────────────────────────────────────────────
//  PDF EXTRACTION — the real Stage 1 of the NCERT ingestion
//  pipeline (replaces the _mockChunkPdf placeholder).
//
//  MuPDF (WASM, pure Node — no Python sidecar) handles NCERT's
//  two-column layouts well. Output is chapter-tagged ~500-token
//  chunks that never cross a chapter boundary, plus embedded
//  figures ≥15kB with their nearest "Fig./Table/Activity" caption.
//
//  Chapter detection is heading-regex based, with an optional
//  manual chapter map (page ranges typed in the upload form) that
//  overrides it entirely — NCERT books are stable, and ten
//  minutes of mapping beats a heuristic silently mis-tagging.
// ─────────────────────────────────────────────────────────────

export interface ChapterMapEntry {
  chapter: number;
  title?: string;
  fromPage: number; // 1-based, inclusive
  toPage: number; // 1-based, inclusive
}

export interface ExtractedChunk {
  content: string;
  pageNum: number; // page the chunk starts on (1-based)
  chapterNum: number | null;
  chapterTitle: string | null;
  tokenCount: number;
}

export interface ExtractedFigure {
  png: Buffer;
  pageNum: number;
  chapterNum: number | null;
  chapterTitle: string | null;
  caption: string | null;
  width: number;
  height: number;
}

export interface PdfExtractResult {
  totalPages: number;
  chunks: ExtractedChunk[];
  figures: ExtractedFigure[];
}

export interface ExtractOptions {
  chapterMap?: ChapterMapEntry[];
  /** Embedded images smaller than this (as PNG) are decorative — skipped. */
  minFigureBytes?: number;
  targetChunkTokens?: number;
  overlapTokens?: number;
}

// Rough token estimate (~1.33 tokens/word for English prose) — chunk sizing
// only needs to be in the right ballpark, not exact.
const TOKENS_PER_WORD = 1.33;

interface PageLine {
  text: string;
  x: number;
  y: number; // top
  w: number;
  h: number;
  fontSize: number;
}

interface PageImage {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  png: Buffer;
  width: number;
  height: number;
}

interface StBlock {
  type: string;
  bbox: { x: number; y: number; w: number; h: number };
  lines?: { bbox: { x: number; y: number; w: number; h: number }; font?: { size?: number }; text?: string }[];
}

const CHAPTER_HEADING = /^\s*chapter\s+(\d{1,2})\b[\s:.\-–—]*(.*)$/i;
const CAPTION_PATTERN = /^\s*(fig|figure|table|activity)\b/i;
/** A caption may sit up to this many points below the figure's bottom edge. */
const CAPTION_SEARCH_BAND = 90;
/** An image appearing on more pages than this is a decoration (logo/watermark), not a figure. */
const MAX_PAGES_PER_FIGURE = 3;

// mupdf's WASM binding hands back Userdata objects (Page, StructuredText,
// Image, Pixmap) backed by native heap memory that Node's GC does NOT
// reclaim promptly — they're only freed on .destroy() or, eventually, a
// FinalizationRegistry callback that can't keep up with a tight per-page
// loop over a multi-hundred-page book. Left undestroyed, the WASM heap
// fills up over the course of one book and allocation starts failing
// outright ("malloc failed") — this bit an image-heavy NCERT Math book
// (lots of figures) even though a text-only English book sailed through.
// Every object created here is destroyed as soon as its data is copied
// into a plain JS value (Buffer/string/number), never left for GC.
// Custom/broken-encoded embedded fonts (NCERT PDFs use plenty — see the
// "non-embedded font using identity encoding" warnings MuPDF logs) sometimes
// have no real Unicode mapping for a glyph (often a decorative bullet/icon),
// so MuPDF emits a Private Use Area codepoint instead. Those bytes are
// meaningless outside that specific font and reliably crash Ollama's
// embedding endpoint with a 500 (root-caused live: every chunk containing
// U+F076 failed to embed, consistently, across three ingestion runs at three
// different concurrency levels — it was never a load/timing issue). Strip
// them at the source so nothing downstream (embedding, or the LLM's own
// tokenizer at answer time) ever sees one.
const PRIVATE_USE_AREA = /[\u{E000}-\u{F8FF}\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/gu;
const stripPrivateUseChars = (s: string) => s.replace(PRIVATE_USE_AREA, ' ').replace(/ {2,}/g, ' ').trim();

function extractPageContent(page: mupdf.Page): { lines: PageLine[]; images: PageImage[] } {
  const st = page.toStructuredText('preserve-whitespace,preserve-images');
  try {
    const json = JSON.parse(st.asJSON()) as { blocks: StBlock[] };
    const lines: PageLine[] = [];
    for (const block of json.blocks ?? []) {
      if (block.type !== 'text') continue;
      for (const line of block.lines ?? []) {
        const text = stripPrivateUseChars(line.text ?? '');
        if (!text) continue;
        lines.push({
          text,
          x: line.bbox.x,
          y: line.bbox.y,
          w: line.bbox.w,
          h: line.bbox.h,
          fontSize: line.font?.size ?? 0,
        });
      }
    }
    // Reading order: top-to-bottom, then left-to-right. Good enough for
    // chunking — NCERT column text stays coherent because columns rarely
    // interleave sentences at the same y.
    lines.sort((a, b) => a.y - b.y || a.x - b.x);

    const images: PageImage[] = [];
    st.walk({
      onImageBlock(bbox: number[], _transform: unknown, image: mupdf.Image) {
        try {
          const pixmap = image.toPixmap();
          try {
            const png = Buffer.from(pixmap.asPNG());
            images.push({
              x0: bbox[0] ?? 0,
              y0: bbox[1] ?? 0,
              x1: bbox[2] ?? 0,
              y1: bbox[3] ?? 0,
              png,
              width: image.getWidth(),
              height: image.getHeight(),
            });
          } finally {
            pixmap.destroy();
          }
        } catch {
          // Unsupported image encoding — skip rather than fail the book.
        } finally {
          image.destroy();
        }
      },
    });

    return { lines, images };
  } finally {
    st.destroy();
  }
}

function findCaption(img: PageImage, lines: PageLine[]): string | null {
  const horizontalOverlap = (l: PageLine) => l.x < img.x1 && l.x + l.w > img.x0;
  const below = lines.filter(
    (l) => l.y >= img.y1 - 5 && l.y <= img.y1 + CAPTION_SEARCH_BAND && horizontalOverlap(l),
  );

  const explicit = below.find((l) => CAPTION_PATTERN.test(l.text));
  if (explicit) {
    // A caption often wraps onto following lines — take up to 2 continuation
    // lines that sit directly under it and aren't a new caption/heading.
    const startIdx = below.indexOf(explicit);
    const parts = [explicit.text];
    for (const next of below.slice(startIdx + 1, startIdx + 3)) {
      if (CAPTION_PATTERN.test(next.text) || CHAPTER_HEADING.test(next.text)) break;
      if (next.y - (explicit.y + explicit.h) > 40) break;
      parts.push(next.text);
    }
    return parts.join(' ').trim();
  }

  // No explicit "Fig/Table/Activity" line nearby — DON'T guess by grabbing
  // whatever body text happens to sit below the image (that produced garbage
  // captions like a random sentence fragment, which then drove image
  // retrieval — a student asking about that sentence would get a completely
  // unrelated diagram back). Better to admit we don't have a caption; the
  // caller falls back to the chapter title as a weak-but-honest retrieval key.
  return null;
}

interface ChapterState {
  num: number | null;
  title: string | null;
}

/** Heading-based detection: "CHAPTER 7" (title on same or next line). */
function detectChapterFromLines(lines: PageLine[], current: ChapterState): ChapterState {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const m = CHAPTER_HEADING.exec(line.text);
    if (!m) continue;
    const num = Number(m[1]);
    let title = (m[2] ?? '').trim();
    if (!title) {
      // NCERT style: big "CHAPTER 7" line, title as the next heading line.
      const next = lines[i + 1];
      if (next && next.fontSize >= 13 && !CHAPTER_HEADING.test(next.text)) title = next.text;
    }
    return { num, title: title || null };
  }
  return current;
}

function chapterForPage(pageNum: number, map: ChapterMapEntry[]): ChapterState {
  const entry = map.find((e) => pageNum >= e.fromPage && pageNum <= e.toPage);
  return entry ? { num: entry.chapter, title: entry.title ?? null } : { num: null, title: null };
}

export async function extractPdf(pdfBuffer: Buffer, opts: ExtractOptions = {}): Promise<PdfExtractResult> {
  // mxbai-embed-large has a hard 512-token context window — Ollama returns
  // "the input length exceeds the context length" (a plain 500 with no other
  // detail unless you read the response body) and the chunk is silently
  // dropped from retrieval forever. 500 target tokens was cutting it far too
  // close: the TOKENS_PER_WORD estimate is a rough average, and real
  // textbook content (tables, numbers, footnote markers, OCR artifacts like
  // "fl owers" splitting one word into two) routinely tokenizes denser than
  // that average — root-caused live: a 503-estimated-token chunk that
  // consistently 500'd, confirmed by calling Ollama directly and reading the
  // actual error body. 350 leaves real margin under the 512 ceiling.
  const { chapterMap, minFigureBytes = 15_000, targetChunkTokens = 350, overlapTokens = 60 } = opts;
  const targetWords = Math.round(targetChunkTokens / TOKENS_PER_WORD);
  const overlapWords = Math.round(overlapTokens / TOKENS_PER_WORD);

  const doc = mupdf.Document.openDocument(pdfBuffer, 'application/pdf');
  try {
    const totalPages = doc.countPages();

    const chunks: ExtractedChunk[] = [];
    const rawFigures: ExtractedFigure[] = [];
    const figurePageCounts = new Map<string, Set<number>>(); // png hash -> pages seen on
    const skippedPages: number[] = [];

    let chapter: ChapterState = { num: null, title: null };
    // Words accumulated for the current chunk + chapter, with overlap carry.
    let pending: string[] = [];
    // Page where this cycle's NEW content began (excludes carried-over overlap
    // words, which have no page of their own tracked). Reset to null on every
    // flush so the next page to contribute fresh lines claims it — checking
    // `pending.length === 0` here instead would miss this on every flush that
    // carries overlap forward (pending is never actually empty then), which is
    // the normal case: chunks kept reporting the page of a chunk several
    // chunks back for the rest of the book once the first overlap carried over.
    let pendingStartPage: number | null = null;

    const flushChunk = (carryOverlap: boolean) => {
      if (pending.length === 0) return;
      const content = pending.join(' ').trim();
      if (content.length > 0) {
        chunks.push({
          content,
          pageNum: pendingStartPage ?? 1,
          chapterNum: chapter.num,
          chapterTitle: chapter.title,
          tokenCount: Math.round(pending.length * TOKENS_PER_WORD),
        });
      }
      pending = carryOverlap ? pending.slice(-overlapWords) : [];
      pendingStartPage = null;
    };

    for (let i = 0; i < totalPages; i++) {
      const pageNum = i + 1;
      const page = doc.loadPage(i);
      try {
        const { lines, images } = extractPageContent(page);

        // Chapter boundary handling — a manual map wins over heading detection.
        const pageChapter = chapterMap?.length
          ? chapterForPage(pageNum, chapterMap)
          : detectChapterFromLines(lines, chapter);
        if (pageChapter.num !== chapter.num) {
          flushChunk(false); // chunks never cross a chapter boundary
          chapter = pageChapter;
          pendingStartPage = pageNum;
        }

        for (const line of lines) {
          if (pendingStartPage === null) pendingStartPage = pageNum;
          pending.push(...line.text.split(/\s+/).filter(Boolean));
          if (pending.length >= targetWords) flushChunk(true);
        }

        for (const img of images) {
          if (img.png.length < minFigureBytes) continue;
          const hash = createHash('sha1').update(img.png).digest('hex');
          let pages = figurePageCounts.get(hash);
          const firstOccurrence = !pages;
          if (!pages) figurePageCounts.set(hash, (pages = new Set()));
          pages.add(pageNum);
          if (!firstOccurrence) continue; // duplicate content — keep only the first occurrence

          rawFigures.push({
            png: img.png,
            pageNum,
            chapterNum: chapter.num,
            chapterTitle: chapter.title,
            caption: findCaption(img, lines),
            width: img.width,
            height: img.height,
          });
        }
      } catch (err) {
        // One malformed page (bad font, broken content stream) shouldn't sink
        // the whole book — skip it and keep going, note it in the result.
        skippedPages.push(pageNum);
        logger.warn({ err, pageNum }, '[pdf-extract] failed to extract one page — skipping it');
      } finally {
        page.destroy();
      }
    }
    flushChunk(false);

    if (skippedPages.length > 0) {
      logger.warn({ skippedPages, totalPages }, '[pdf-extract] finished with some pages skipped');
    }

    // Images repeated across many pages are page furniture (logos, borders),
    // not figures — drop them even though we kept their first occurrence above.
    const figures = rawFigures.filter((f) => {
      const hash = createHash('sha1').update(f.png).digest('hex');
      return (figurePageCounts.get(hash)?.size ?? 1) <= MAX_PAGES_PER_FIGURE;
    });

    return { totalPages, chunks, figures };
  } finally {
    doc.destroy();
  }
}

/** Parses + validates the optional chapter-map JSON typed into the upload form. */
export function parseChapterMap(raw: unknown): ChapterMapEntry[] | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!Array.isArray(value)) throw new Error('chapterMap must be a JSON array');
  return value.map((e, i) => {
    const chapter = Number(e?.chapter);
    const fromPage = Number(e?.fromPage);
    const toPage = Number(e?.toPage);
    if (!Number.isInteger(chapter) || !Number.isInteger(fromPage) || !Number.isInteger(toPage) || fromPage < 1 || toPage < fromPage) {
      throw new Error(`chapterMap entry ${i + 1} is invalid — need { chapter, fromPage, toPage } with fromPage <= toPage`);
    }
    return { chapter, title: typeof e?.title === 'string' ? e.title : undefined, fromPage, toPage };
  });
}
