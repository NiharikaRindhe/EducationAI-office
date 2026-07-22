// Verifies lib/pdfExtract.ts end-to-end against a locally generated PDF:
// chapter detection (heading + manual map), chunking, figure extraction
// with caption pairing. Run: npx tsx scripts/testPdfExtract.ts
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { extractPdf, parseChapterMap } from '../src/lib/pdfExtract.js';

async function makeTestPdf(): Promise<Buffer> {
  const figPng = await QRCode.toBuffer('figure-payload-'.repeat(40), { width: 300 });
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const bufs: Buffer[] = [];
    doc.on('data', (b: Buffer) => bufs.push(b));
    doc.on('end', () => resolve(Buffer.concat(bufs)));

    doc.fontSize(22).text('CHAPTER 1');
    doc.fontSize(18).text('Nutrition in Plants');
    doc.moveDown();
    doc.fontSize(11).text('Plants make their own food by the process of photosynthesis using sunlight water and carbon dioxide. '.repeat(40));

    doc.addPage();
    doc.fontSize(11).text('Leaves are the food factories of plants and contain chlorophyll. '.repeat(12));
    doc.image(figPng, 100, 250, { width: 200 });
    doc.fontSize(10).text('Fig. 1.1 Cross-section of a leaf showing stomata', 100, 470);

    doc.addPage();
    doc.fontSize(22).text('CHAPTER 2');
    doc.fontSize(18).text('Nutrition in Animals');
    doc.moveDown();
    doc.fontSize(11).text('Animal nutrition includes nutrient requirement mode of intake and its utilisation in the body. '.repeat(30));
    doc.end();
  });
}

function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    console.error(`  ✗ FAILED: ${label}`);
    process.exitCode = 1;
  }
}

const pdf = await makeTestPdf();
console.log(`Generated test PDF: ${pdf.length} bytes`);

// ── Heading-based chapter detection ──────────────────────────
console.log('\n[1] Heading-based detection:');
const r1 = await extractPdf(pdf, { minFigureBytes: 1000, targetChunkTokens: 200, overlapTokens: 30 });
assert(r1.totalPages === 3, `totalPages = 3 (got ${r1.totalPages})`);
assert(r1.chunks.length >= 3, `multiple chunks produced (got ${r1.chunks.length})`);
const ch1 = r1.chunks.filter((c) => c.chapterNum === 1);
const ch2 = r1.chunks.filter((c) => c.chapterNum === 2);
assert(ch1.length > 0 && ch1[0]!.chapterTitle === 'Nutrition in Plants', `chapter 1 detected with title (got "${ch1[0]?.chapterTitle}")`);
assert(ch2.length > 0 && ch2[0]!.chapterTitle === 'Nutrition in Animals', `chapter 2 detected with title (got "${ch2[0]?.chapterTitle}")`);
assert(ch2.every((c) => !c.content.includes('photosynthesis')), 'no chunk crosses the chapter boundary');
assert(r1.chunks.every((c) => c.content.length > 0 && c.pageNum >= 1 && c.pageNum <= 3), 'every chunk has content + valid page');

console.log('\n[2] Figure extraction:');
assert(r1.figures.length === 1, `exactly 1 figure (got ${r1.figures.length})`);
const fig = r1.figures[0];
assert(fig?.pageNum === 2, `figure on page 2 (got ${fig?.pageNum})`);
assert(/^Fig\. 1\.1/.test(fig?.caption ?? ''), `caption paired (got "${fig?.caption}")`);
assert(fig?.chapterNum === 1, `figure tagged chapter 1 (got ${fig?.chapterNum})`);
assert((fig?.png.length ?? 0) > 1000, 'figure PNG has real bytes');

// ── Manual chapter map override ───────────────────────────────
console.log('\n[3] Manual chapter map override:');
const map = parseChapterMap('[{"chapter":7,"title":"Weather and Climate","fromPage":1,"toPage":2},{"chapter":8,"title":"Winds","fromPage":3,"toPage":3}]');
const r2 = await extractPdf(pdf, { chapterMap: map, minFigureBytes: 1000 });
assert(r2.chunks.every((c) => c.pageNum <= 2 ? c.chapterNum === 7 : c.chapterNum === 8), 'map page-ranges override headings');
assert(r2.chunks.some((c) => c.chapterTitle === 'Weather and Climate'), 'map titles applied');

// ── Small-image filtering ─────────────────────────────────────
console.log('\n[4] Decorative-image filtering:');
const r3 = await extractPdf(pdf, { minFigureBytes: 1_000_000 });
assert(r3.figures.length === 0, 'images below minFigureBytes are skipped');

console.log(process.exitCode ? '\nSOME CHECKS FAILED' : '\nAll checks passed.');
