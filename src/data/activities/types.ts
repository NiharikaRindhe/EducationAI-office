/** Practice question shapes used by Class 5–8 chapter activities. */

export type McqQuestion = {
  type: 'mcq';
  scene?: string;
  prompt: string;
  options: string[];
  correctIdx: number;
  explanation?: string;
};

export type ShortAnswerQuestion = {
  type: 'short_answer';
  scene?: string;
  prompt: string;
  answer: string;
  accepted?: string[];
  rubric?: string;
};

export type PracticeQuestion = McqQuestion | ShortAnswerQuestion;

export interface ChapterActivity {
  gameId: string;
  classNum: 5 | 6 | 7 | 8;
  subject: 'Mathematics' | 'English' | 'World Around Us' | 'Science' | 'Social Science';
  chapterNum: number;
  chapterRef: string;
  chapterTitle: string;
  name: string;
  icon: string;
  description: string;
  questions: PracticeQuestion[];
}

const SUBJECT_SLUG: Record<ChapterActivity['subject'], string> = {
  Mathematics: 'math',
  English: 'eng',
  'World Around Us': 'wau',
  Science: 'sci',
  'Social Science': 'sst',
};

export function activity(input: {
  classNum: 5 | 6 | 7 | 8;
  subject: ChapterActivity['subject'];
  chapterNum: number;
  chapterTitle: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
  questions: PracticeQuestion[];
}): ChapterActivity {
  const chapterRef = `c${input.classNum}-${SUBJECT_SLUG[input.subject]}-${String(input.chapterNum).padStart(2, '0')}`;
  return {
    gameId: `${chapterRef}-${input.slug}`,
    classNum: input.classNum,
    subject: input.subject,
    chapterNum: input.chapterNum,
    chapterRef,
    chapterTitle: input.chapterTitle,
    name: input.name,
    icon: input.icon,
    description: input.description,
    questions: input.questions,
  };
}

type McqExtra = { explanation?: string; scene?: string };
type ShortExtra = { accepted?: string[]; rubric?: string; scene?: string };

export const Q = {
  mcq: (
    prompt: string,
    options: string[],
    correctIdx: number,
    extra?: string | McqExtra,
  ): PracticeQuestion => {
    const meta = typeof extra === 'string' ? { explanation: extra } : extra ?? {};
    return { type: 'mcq', prompt, options, correctIdx, ...meta };
  },
  short: (
    prompt: string,
    answer: string,
    acceptedOrExtra?: string[] | ShortExtra,
    rubric?: string,
  ): PracticeQuestion => {
    if (acceptedOrExtra && !Array.isArray(acceptedOrExtra)) {
      return { type: 'short_answer', prompt, answer, ...acceptedOrExtra };
    }
    return { type: 'short_answer', prompt, answer, accepted: acceptedOrExtra, rubric };
  },
  /** @deprecated Prefer Q.mcq — kept so older sets still compile. */
  tf: (prompt: string, answer: boolean, explanation?: string): PracticeQuestion => ({
    type: 'mcq',
    prompt,
    options: ['True', 'False'],
    correctIdx: answer ? 0 : 1,
    explanation,
  }),
  /** @deprecated Prefer Q.short — kept so older sets still compile. */
  fill: (prompt: string, answer: string, accepted?: string[], explanation?: string): PracticeQuestion => ({
    type: 'short_answer',
    prompt,
    answer,
    accepted,
    rubric: explanation,
  }),
  match: (prompt: string, pairs: { left: string; right: string }[]): PracticeQuestion => ({
    type: 'short_answer',
    scene: prompt,
    prompt: `Match each idea. Write the partners in order, separated by commas: ${pairs.map((p) => p.left).join(', ')}.`,
    answer: pairs.map((p) => p.right).join(', '),
    accepted: [pairs.map((p) => p.right).join(', '), pairs.map((p) => p.right).join(',')],
    rubric: pairs.map((p) => `${p.left} → ${p.right}`).join('; '),
  }),
  seq: (prompt: string, items: { id: string; text: string }[], correctOrder: string[]): PracticeQuestion => ({
    type: 'short_answer',
    scene: prompt,
    prompt: `Write the correct order, separated by arrows (→): ${items.map((i) => i.text).join(', ')}.`,
    answer: correctOrder.map((id) => items.find((i) => i.id === id)?.text ?? id).join(' → '),
    accepted: [
      correctOrder.map((id) => items.find((i) => i.id === id)?.text ?? id).join(' → '),
      correctOrder.map((id) => items.find((i) => i.id === id)?.text ?? id).join('->'),
      correctOrder.map((id) => items.find((i) => i.id === id)?.text ?? id).join(', '),
    ],
  }),
};
