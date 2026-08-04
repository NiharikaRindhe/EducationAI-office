import { api, ApiClientError } from './api';

/**
 * Client for the teacher's AI question generator.
 *
 * Generation is deliberately a two-step flow: /generate returns candidates
 * that are NOT saved, the teacher edits them, and /save persists only what
 * they kept. That review gate is the point — an AI-written question with a
 * wrong answer key that reaches 60 students is far more expensive than the
 * extra click.
 */

export type QuestionType = 'mcq' | 'true_false' | 'short_answer' | 'long_answer' | 'fill_blank';
export type Difficulty = 'easy' | 'medium' | 'hard';

export const QUESTION_TYPES: { value: QuestionType; label: string; short: string }[] = [
  { value: 'mcq', label: 'Multiple choice', short: 'MCQ' },
  { value: 'true_false', label: 'True / False', short: 'T/F' },
  { value: 'short_answer', label: 'Short answer', short: 'Short' },
  { value: 'long_answer', label: 'Long answer', short: 'Long' },
  { value: 'fill_blank', label: 'Fill in the blank', short: 'Blank' },
];

export const MAX_QUESTIONS = 25;

export interface GeneratorOption {
  text: string;
  isCorrect: boolean;
}

export interface GeneratedQuestion {
  type: QuestionType;
  text: string;
  options?: GeneratorOption[];
  correctAnswer?: string;
  rubric?: string;
  marks: number;
  difficulty: Difficulty;
  sourcePages?: number[];
}

export interface Citation {
  bookTitle: string;
  chapterNum: number | null;
  chapterTitle: string | null;
  pages: number[];
  excerptsUsed: number;
}

export interface GenerateResult {
  questions: GeneratedQuestion[];
  /** Questions the server rejected as unusable (no correct option, no rubric…). */
  discarded: number;
  citation: Citation;
}

/**
 * One scope a teacher can generate from. Real uploaded books fall into three
 * states — clean chapter numbers, numbers with junk titles, or no chapter
 * structure at all — so the server sends either a chapter or a page band and
 * the UI just renders the label it's given.
 */
export interface GeneratableChapter {
  kind: 'chapter' | 'pages';
  label: string;
  chapterNum: number | null;
  chapterTitle: string | null;
  bookTitle: string;
  chunks: number;
  fromPage: number | null;
  toPage: number | null;
}

export interface GeneratableChaptersResult {
  /** Whether any book is indexed at all for this class+subject — the correct
   *  signal for "no book uploaded". A few real books have every chunk on one
   *  page (extraction artifact) and so have zero `options` despite being
   *  indexed; `options.length` alone can't tell the two cases apart. */
  hasIndexedContent: boolean;
  options: GeneratableChapter[];
}

export interface MixRow {
  type: QuestionType;
  count: number;
  marks: number;
}

/** Which portal's routes to call. Both mount the same controllers; the server
 *  derives the caller's real scope from their authenticated role, so this only
 *  picks the URL prefix the caller is authorised to hit. */
export type GeneratorPortal = 'teacher' | 'school-admin';

const base = (portal: GeneratorPortal) => `/${portal}/exam-generator`;

export async function fetchGeneratableChapters(
  classNum: number,
  subject: string,
  portal: GeneratorPortal = 'teacher',
): Promise<GeneratableChaptersResult> {
  return api.get<GeneratableChaptersResult>(`${base(portal)}/chapters`, { classNum, subject });
}

export async function generateQuestions(
  input: {
    classNum: number;
    subject: string;
    chapterNum?: number;
    fromPage?: number;
    toPage?: number;
    mix: MixRow[];
    difficulty: Difficulty | 'mixed';
    instructions?: string;
  },
  portal: GeneratorPortal = 'teacher',
): Promise<GenerateResult> {
  return api.post<GenerateResult>(`${base(portal)}/generate`, input);
}

export async function saveGeneratedQuestions(
  input: {
    classNum: number;
    subject: string;
    chapterNum?: number;
    questions: GeneratedQuestion[];
    citation?: Citation;
  },
  portal: GeneratorPortal = 'teacher',
): Promise<{ saved: number; ids: string[] }> {
  return api.post<{ saved: number; ids: string[] }>(`${base(portal)}/save`, input);
}

/** Turns the API's error codes into something a teacher can act on. */
export function describeGeneratorError(err: unknown): string {
  if (!(err instanceof ApiClientError)) return 'Something went wrong while generating. Try again.';
  switch (err.code) {
    case 'NO_CONTENT':
      return err.message;
    case 'AI_UNAVAILABLE':
      return 'The question generator is currently unavailable. Ask your school admin to raise a ticket with the platform team.';
    case 'AI_BAD_OUTPUT':
      return 'The model returned something unusable. Try generating again — this is usually temporary.';
    case 'AI_RATE_LIMIT':
    case 'RATE_LIMITED':
      return 'The AI service is busy right now. Wait a moment and try again.';
    case 'FORBIDDEN':
      return err.message;
    default:
      return err.message || 'Generation failed. Try again.';
  }
}

/** A question the teacher hasn't fixed yet shouldn't be savable. */
export function validateQuestion(q: GeneratedQuestion): string | null {
  if (q.text.trim().length < 5) return 'Question text is too short.';
  if (q.type === 'mcq') {
    if (!q.options || q.options.length < 2) return 'Needs at least 2 options.';
    const correct = q.options.filter((o) => o.isCorrect).length;
    if (correct !== 1) return 'Mark exactly one option as correct.';
    if (q.options.some((o) => !o.text.trim())) return 'Every option needs text.';
  }
  if (q.type === 'true_false' && !/^(true|false)$/i.test((q.correctAnswer ?? '').trim())) {
    return 'Answer must be True or False.';
  }
  if (q.type === 'fill_blank') {
    if (!q.text.includes('____')) return 'Include ____ where the blank goes.';
    if (!q.correctAnswer?.trim()) return 'Needs the correct answer.';
  }
  if ((q.type === 'short_answer' || q.type === 'long_answer') && !q.rubric?.trim()) {
    return 'Needs a marking rubric.';
  }
  return null;
}
