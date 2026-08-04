import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { chatCompletion, aiConfigured } from '../lib/ai.js';
import { getTeachingScope } from './teacher.service.js';
import { requireWhitelistedSubject } from '../lib/classSubjects.js';
import type { GenerateQuestionsInput, SaveGeneratedInput } from '../schemas/examGenerator.schema.js';

/**
 * AI exam/quiz generation grounded in the books a school has actually
 * uploaded.
 *
 * The important design decision here is that generation is *retrieval-first
 * and chapter-scoped*, not free-form prompting. A model asked "write 5
 * questions about photosynthesis for Class 7" writes plausible questions from
 * its own memory, which drift from the syllabus the class is actually being
 * taught. Instead we pull the real chunks of the real uploaded chapter and
 * instruct the model to write questions answerable *only* from those excerpts
 * — and record which book/chapter/pages each batch came from, so a teacher can
 * verify before it reaches 60 students.
 *
 * Nothing is persisted by generation. The teacher reviews, edits and then
 * explicitly saves — see saveGeneratedQuestions.
 */

const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq: 'multiple choice with exactly 4 options, exactly one correct',
  true_false: 'a statement that is either true or false',
  short_answer: 'a question answerable in 1-2 sentences',
  long_answer: 'a question requiring a paragraph-length explanation',
  fill_blank: 'a sentence with exactly one blank written as ____',
};

/** How much of the book to feed the model. Chapters run long; this keeps the
 *  prompt inside a sane context window while still covering the chapter. */
const MAX_CHUNKS = 24;
const MAX_CHUNK_CHARS = 1200;

export interface BookChunk {
  content: string;
  book_title: string;
  chapter_num: number | null;
  chapter_title: string | null;
  page_num: number | null;
}

/**
 * Running headers and front/back matter that the ingest-time chapter detector
 * mistakes for chapter titles. Real books produce these constantly — the Class 6
 * maths PDF in our own library has every one of its ten chapters titled
 * "SOLUTIONS" — and showing them to a teacher as chapter names is worse than
 * showing no name at all.
 */
const JUNK_TITLE = /^(solutions?|answers?|contents?|index|preface|syllabus|appendix|glossary|notes?|exercise|chapter|unit|page \d+|\d+)$/i;

function cleanTitle(title: string | null): string | null {
  const t = (title ?? '').trim();
  if (!t || JUNK_TITLE.test(t)) return null;
  return t;
}

export interface ChapterOption {
  /** 'chapter' filters by chapter_num; 'pages' filters by a page window. */
  kind: 'chapter' | 'pages';
  label: string;
  chapterNum: number | null;
  chapterTitle: string | null;
  bookTitle: string;
  chunks: number;
  fromPage: number | null;
  toPage: number | null;
}

/** Books where chapter detection failed get page bands instead, so a teacher can
 *  still aim at part of a 240-page book rather than only its opening pages. */
const PAGE_BAND_SIZE = 40;

export interface GeneratableChaptersResult {
  /** Whether ANY indexed content exists for this class+subject at all — this
   *  is the correct signal for "ask your School Admin to upload a book",
   *  never `options.length`. See the note on `options` below for why the two
   *  can disagree. */
  hasIndexedContent: boolean;
  /**
   * Chapter/page-band choices worth offering the teacher a pick from. This is
   * deliberately allowed to be EMPTY even when `hasIndexedContent` is true: a
   * few real books (confirmed: `c1-math`, `c2-math`, `c9-english`) have every
   * chunk collapsed onto a single page number by the ingest pipeline — no
   * chapter numbers and no page spread — so there is nothing to subdivide by.
   * That is not the same fact as "no book indexed", and generation still
   * works fine over the whole subject in that case (`fetchChunks` below has
   * no dependency on this list — it queries `text_chunks` directly). Callers
   * must gate "book missing" UI on `hasIndexedContent`, not on this array.
   */
  options: ChapterOption[];
}

/**
 * What a teacher can actually scope generation to for this class+subject.
 *
 * Derived from the indexed book rather than a seeded chapter list, because the
 * seeded `curriculum_chapters` titles and the uploaded PDFs genuinely disagree
 * (different NCERT editions), and the uploaded book is the thing questions will
 * be generated from. Handles the three real states of our library: chapter
 * numbers detected cleanly, numbers detected but titles junk, and no chapter
 * structure detected at all.
 */
export async function listGeneratableChapters(
  schoolId: string,
  classNum: number,
  subject: string,
): Promise<GeneratableChaptersResult> {
  const { data, error } = await supabaseAdmin
    .from('text_chunks')
    .select('book_title, chapter_num, chapter_title, page_num')
    .eq('class_num', classNum)
    .eq('subject', subject)
    .or(`school_id.is.null,school_id.eq.${schoolId}`);

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load indexed chapters', error.message);
  const rows = data ?? [];
  if (rows.length === 0) return { hasIndexedContent: false, options: [] };

  // ── Chapters with a detected number ──────────────────────────
  interface Agg {
    chapterNum: number;
    bookTitle: string;
    chunks: number;
    pages: number[];
    /** Title frequency — the detector often finds several candidates per
     *  chapter, so the most common non-junk one wins rather than the first. */
    titleVotes: Map<string, number>;
  }
  const numbered = new Map<string, Agg>();
  const unnumbered: { bookTitle: string; page: number | null }[] = [];

  for (const row of rows) {
    if (row.chapter_num === null) {
      unnumbered.push({ bookTitle: row.book_title, page: row.page_num });
      continue;
    }
    const key = `${row.book_title}::${row.chapter_num}`;
    let agg = numbered.get(key);
    if (!agg) {
      agg = { chapterNum: row.chapter_num, bookTitle: row.book_title, chunks: 0, pages: [], titleVotes: new Map() };
      numbered.set(key, agg);
    }
    agg.chunks += 1;
    if (row.page_num !== null) agg.pages.push(row.page_num);
    const title = cleanTitle(row.chapter_title);
    if (title) agg.titleVotes.set(title, (agg.titleVotes.get(title) ?? 0) + 1);
  }

  const options: ChapterOption[] = [...numbered.values()]
    .sort((a, b) => a.chapterNum - b.chapterNum)
    .map((agg) => {
      const bestTitle = [...agg.titleVotes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return {
        kind: 'chapter' as const,
        label: `Chapter ${agg.chapterNum}${bestTitle ? ` — ${bestTitle}` : ''}`,
        chapterNum: agg.chapterNum,
        chapterTitle: bestTitle,
        bookTitle: agg.bookTitle,
        chunks: agg.chunks,
        fromPage: agg.pages.length ? Math.min(...agg.pages) : null,
        toPage: agg.pages.length ? Math.max(...agg.pages) : null,
      };
    });

  // ── Books with no chapter structure → page bands ─────────────
  // Only worth offering when there's enough unchaptered content that "whole
  // subject" would silently truncate to the first few pages.
  const byBook = new Map<string, number[]>();
  for (const u of unnumbered) {
    if (u.page === null) continue;
    byBook.set(u.bookTitle, [...(byBook.get(u.bookTitle) ?? []), u.page]);
  }

  for (const [bookTitle, pages] of byBook) {
    if (pages.length < MAX_CHUNKS) continue;
    const min = Math.min(...pages);
    const max = Math.max(...pages);

    const bands: ChapterOption[] = [];
    for (let start = min; start <= max; start += PAGE_BAND_SIZE) {
      const end = Math.min(start + PAGE_BAND_SIZE - 1, max);
      const chunks = pages.filter((p) => p >= start && p <= end).length;
      if (chunks === 0) continue;
      bands.push({
        kind: 'pages',
        label: `Pages ${start}–${end}`,
        chapterNum: null,
        chapterTitle: null,
        bookTitle,
        chunks,
        fromPage: start,
        toPage: end,
      });
    }

    // A single band spans the whole book, which "Whole subject" already covers —
    // offering it as a second identical choice is just noise. (Happens when page
    // extraction collapsed every chunk onto one page number.) The teacher can
    // still generate over the whole subject via the always-available default —
    // `hasIndexedContent: true` below is what keeps that path open even though
    // `options` stays empty here.
    if (bands.length > 1) options.push(...bands);
  }

  return { hasIndexedContent: true, options };
}

/** Who is generating. A School Admin oversees every class in their school, so
 *  the per-teacher assignment check doesn't apply to them — but the subject
 *  still has to be one the class actually takes. */
export type GeneratorActor = 'teacher' | 'school_admin';

async function assertMayGenerate(
  actorId: string,
  schoolId: string,
  classNum: number,
  subject: string,
  actorRole: GeneratorActor,
) {
  if (actorRole === 'school_admin') {
    await requireWhitelistedSubject(classNum, subject);
    return;
  }
  await assertTeachesClassSubject(actorId, schoolId, classNum, subject);
}

/** A teacher may only generate for a class+subject they actually teach. */
async function assertTeachesClassSubject(teacherId: string, schoolId: string, classNum: number, subject: string) {
  const scope = await getTeachingScope(teacherId, schoolId);

  // A legacy-fallback scope (teacher mapped via classes_taught[] rather than
  // teaching_assignments) carries no per-subject detail, so class alone gates it.
  if (scope.legacyFallback) {
    if (!scope.classNums.includes(classNum)) {
      throw new ApiError('FORBIDDEN', `You are not assigned to Class ${classNum}`);
    }
    return;
  }

  const teaches = scope.sections.some(
    (s) => s.classNum === classNum && (s.subjects.length === 0 || s.subjects.includes(subject)),
  );
  if (!teaches) {
    throw new ApiError('FORBIDDEN', `You are not assigned to teach ${subject} to Class ${classNum}`);
  }
}

async function fetchChunks(
  schoolId: string,
  classNum: number,
  subject: string,
  scope: { chapterNum?: number; fromPage?: number; toPage?: number },
): Promise<BookChunk[]> {
  let query = supabaseAdmin
    .from('text_chunks')
    .select('content, book_title, chapter_num, chapter_title, page_num')
    .eq('class_num', classNum)
    .eq('subject', subject)
    .or(`school_id.is.null,school_id.eq.${schoolId}`);

  if (scope.chapterNum !== undefined) query = query.eq('chapter_num', scope.chapterNum);
  if (scope.fromPage !== undefined) query = query.gte('page_num', scope.fromPage);
  if (scope.toPage !== undefined) query = query.lte('page_num', scope.toPage);

  const { data, error } = await query.order('page_num', { ascending: true }).limit(MAX_CHUNKS);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load book content', error.message);
  return (data ?? []) as BookChunk[];
}

/** The model's expected output, validated per-question so one malformed
 *  question doesn't discard the whole batch. */
const generatedQuestionSchema = z.object({
  type: z.enum(['mcq', 'true_false', 'short_answer', 'long_answer', 'fill_blank']),
  text: z.string().min(5),
  options: z.array(z.object({ text: z.string().min(1), isCorrect: z.boolean() })).optional(),
  correctAnswer: z.string().optional(),
  rubric: z.string().optional(),
  marks: z.coerce.number().int().min(1).max(20),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  sourcePages: z.array(z.coerce.number().int()).optional(),
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;

/**
 * Pull a JSON value out of a model reply.
 *
 * Even with json-mode requested, models in practice wrap the object in ```json
 * fences or precede it with a line of commentary — and reasoning models
 * sometimes leak part of their chain-of-thought into `content`. Rather than
 * failing the teacher's request over formatting, take the outermost {...} or
 * [...] span and parse that.
 */
function extractJson(raw: string): unknown | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const candidates = [trimmed];

  // ```json ... ``` or bare ``` ... ```
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());

  // Outermost object/array span, for replies with prose either side.
  for (const [open, close] of [['{', '}'], ['[', ']']] as const) {
    const start = trimmed.indexOf(open);
    const end = trimmed.lastIndexOf(close);
    if (start !== -1 && end > start) candidates.push(trimmed.slice(start, end + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // try the next shape
    }
  }
  return null;
}

/** An MCQ with no correct option, or a fill-blank with no blank, is unusable
 *  in an exam — reject rather than hand a teacher something broken. */
function isUsable(q: GeneratedQuestion): boolean {
  if (q.type === 'mcq') {
    if (!q.options || q.options.length < 2) return false;
    return q.options.filter((o) => o.isCorrect).length === 1;
  }
  if (q.type === 'true_false') {
    return /^(true|false)$/i.test((q.correctAnswer ?? '').trim());
  }
  if (q.type === 'fill_blank') {
    return q.text.includes('____') && Boolean(q.correctAnswer?.trim());
  }
  // short/long answer are graded against a rubric, so a rubric is required.
  return Boolean(q.rubric?.trim());
}

function buildPrompt(input: GenerateQuestionsInput, chunks: BookChunk[]) {
  const excerpts = chunks
    .map((c, i) => {
      const where = [c.chapter_title, c.page_num ? `page ${c.page_num}` : null].filter(Boolean).join(', ');
      return `[Excerpt ${i + 1}${where ? ` — ${where}` : ''}]\n${c.content.slice(0, MAX_CHUNK_CHARS)}`;
    })
    .join('\n\n');

  const mixLines = input.mix
    .map((m) => `- ${m.count} × ${m.type} (${QUESTION_TYPE_LABELS[m.type]}), ${m.marks} mark${m.marks === 1 ? '' : 's'} each`)
    .join('\n');

  const difficultyLine =
    input.difficulty === 'mixed'
      ? 'Spread difficulty across easy, medium and hard.'
      : `Every question should be ${input.difficulty} difficulty.`;

  // Class 1-4 read at a very different level from Class 9-10; a single
  // "write age-appropriate questions" instruction is too vague to change output.
  const readingLevel =
    input.classNum <= 4
      ? 'These are children aged 6-9 who are still learning to read. Use very short sentences, common everyday words, and no clause longer than about 8 words. Never use words the excerpts themselves do not use.'
      : input.classNum <= 8
        ? 'Use clear, plain language suitable for a 10-13 year old. Avoid unnecessary jargon.'
        : 'Use precise academic language appropriate for board-exam preparation.';

  const system = [
    'You are an experienced Indian school teacher writing exam questions for your own class.',
    'You write questions ONLY from the textbook excerpts you are given.',
    '',
    'Hard rules:',
    '1. Every question must be answerable using the excerpts alone. Never use outside knowledge.',
    '2. Never invent facts, numbers, names or definitions that do not appear in the excerpts.',
    '3. If the excerpts do not contain enough material for the number of questions requested, return fewer questions. Returning fewer good questions is correct; padding with invented ones is not.',
    '4. Do not copy a sentence verbatim as a question — rephrase it into a genuine question.',
    '5. For MCQs, the three wrong options must be plausible to a student who has not studied, not obviously silly.',
    '',
    'Reply with JSON only, in this exact shape:',
    '{"questions":[{"type":"mcq","text":"...","options":[{"text":"...","isCorrect":true},{"text":"...","isCorrect":false}],"correctAnswer":"","rubric":"","marks":1,"difficulty":"medium","sourcePages":[41]}]}',
    '',
    'Per type: mcq needs exactly 4 options with exactly one isCorrect:true. true_false needs correctAnswer "True" or "False". fill_blank needs ____ in the text and correctAnswer set. short_answer and long_answer need a rubric describing what earns full marks.',
    'sourcePages: the page numbers of the excerpts the question came from.',
  ].join('\n');

  const user = [
    `Class ${input.classNum} · ${input.subject}${input.chapterNum !== undefined ? ` · Chapter ${input.chapterNum}` : ''}`,
    '',
    readingLevel,
    difficultyLine,
    '',
    'Write exactly this mix:',
    mixLines,
    input.instructions ? `\nAdditional instruction from the teacher: ${input.instructions}` : '',
    '',
    '--- TEXTBOOK EXCERPTS ---',
    excerpts,
  ].join('\n');

  return { system, user };
}

export async function generateQuestions(
  actorId: string,
  schoolId: string,
  input: GenerateQuestionsInput,
  actorRole: GeneratorActor = 'teacher',
) {
  await assertMayGenerate(actorId, schoolId, input.classNum, input.subject, actorRole);

  if (!(await aiConfigured('qgen'))) {
    throw new ApiError(
      'AI_UNAVAILABLE',
      'Question generation is turned off or no AI provider is reachable. Ask the platform team to enable the question-generation model.',
    );
  }

  const chunks = await fetchChunks(schoolId, input.classNum, input.subject, {
    chapterNum: input.chapterNum,
    fromPage: input.fromPage,
    toPage: input.toPage,
  });
  if (chunks.length === 0) {
    const where =
      input.chapterNum !== undefined
        ? ` chapter ${input.chapterNum}`
        : input.fromPage !== undefined
          ? ` pages ${input.fromPage}–${input.toPage ?? '…'}`
          : '';
    throw new ApiError(
      'NO_CONTENT',
      `No indexed content found for Class ${input.classNum} ${input.subject}${where}. Upload the book (or wait for indexing to finish) before generating.`,
    );
  }

  const { system, user } = buildPrompt(input, chunks);

  const raw = await chatCompletion(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { jsonMode: true, tier: 'qgen', usageContext: { schoolId, userId: actorId } },
  );

  const parsed = extractJson(raw);
  if (parsed === null) {
    throw new ApiError(
      'AI_BAD_OUTPUT',
      'The model did not return valid JSON. Try generating again, or ask the platform team to check the question-generation model.',
      // The raw prefix is what makes a bad-model-config problem diagnosable
      // instead of a mystery; it is model output, never student data.
      { rawPrefix: raw.slice(0, 400) },
    );
  }

  const list = Array.isArray(parsed) ? parsed : (parsed as { questions?: unknown[] })?.questions;
  if (!Array.isArray(list)) {
    throw new ApiError('AI_BAD_OUTPUT', 'The model returned an unexpected shape. Try generating again.');
  }

  // Validate and drop anything unusable rather than surfacing a broken
  // question the teacher might not read closely before publishing.
  const questions: GeneratedQuestion[] = [];
  let discarded = 0;
  for (const item of list) {
    const result = generatedQuestionSchema.safeParse(item);
    if (!result.success || !isUsable(result.data)) {
      discarded += 1;
      continue;
    }
    questions.push(result.data);
  }

  if (questions.length === 0) {
    throw new ApiError(
      'AI_BAD_OUTPUT',
      'Every generated question failed validation. Try a different chapter, or generate again.',
    );
  }

  const books = [...new Set(chunks.map((c) => c.book_title))];
  const pages = chunks.map((c) => c.page_num).filter((p): p is number => p !== null);
  const chapterTitle = chunks.find((c) => c.chapter_title)?.chapter_title ?? null;

  return {
    questions,
    discarded,
    citation: {
      bookTitle: books.join(', '),
      chapterNum: input.chapterNum ?? null,
      chapterTitle,
      pages: pages.length > 0 ? [Math.min(...pages), Math.max(...pages)] : [],
      excerptsUsed: chunks.length,
    },
  };
}

/**
 * Persist the questions the teacher kept. Written to the school's own bank
 * scope with source='ai_generated' so an AI-written question is never
 * indistinguishable from a teacher-written one in the bank listing.
 */
export async function saveGeneratedQuestions(
  actorId: string,
  schoolId: string,
  input: SaveGeneratedInput,
  actorRole: GeneratorActor = 'teacher',
) {
  await assertMayGenerate(actorId, schoolId, input.classNum, input.subject, actorRole);

  const rows = input.questions.map((q) => ({
    scope: 'school' as const,
    school_id: schoolId,
    class_num: input.classNum,
    subject: input.subject,
    chapter_num: input.chapterNum ?? null,
    type: q.type,
    difficulty: q.difficulty,
    text: q.text,
    // question_bank stores MCQ options as [{ id, text, is_correct }].
    options: q.options
      ? q.options.map((o, i) => ({ id: String.fromCharCode(97 + i), text: o.text, is_correct: o.isCorrect }))
      : null,
    correct_answer: q.correctAnswer ?? null,
    rubric: q.rubric ?? null,
    marks: q.marks,
    source: 'ai_generated' as const,
    created_by: actorId,
    is_pyq: false,
    source_citation: input.citation ?? null,
  }));

  const { data, error } = await supabaseAdmin.from('question_bank').insert(rows).select('id');
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to save generated questions', error.message);

  return { saved: data?.length ?? 0, ids: (data ?? []).map((r) => r.id) };
}
