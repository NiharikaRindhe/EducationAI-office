import { z } from 'zod';

const questionTypeEnum = z.enum(['mcq', 'true_false', 'short_answer', 'long_answer', 'fill_blank']);

/** A single generation request can't be unbounded — each question costs tokens
 *  and a teacher can't meaningfully review 60 questions in one sitting. */
const MAX_QUESTIONS_PER_REQUEST = 25;

export const generateQuestionsSchema = z
  .object({
    classNum: z.number().int().min(1).max(10),
    subject: z.string().min(1),
    /** Omit to draw from the whole subject rather than one chapter. */
    chapterNum: z.number().int().min(1).max(50).optional(),
    /** Page window, for books whose chapter structure wasn't detected at
     *  ingest — without this a teacher could only ever generate from the
     *  opening pages of a 240-page book. */
    fromPage: z.number().int().min(1).max(2000).optional(),
    toPage: z.number().int().min(1).max(2000).optional(),
    /** The paper's shape: how many of each type, and marks each. */
    mix: z
      .array(
        z.object({
          type: questionTypeEnum,
          count: z.number().int().min(1).max(MAX_QUESTIONS_PER_REQUEST),
          marks: z.number().int().min(1).max(20),
        }),
      )
      .min(1),
    difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).default('mixed'),
    instructions: z.string().max(500).optional(),
  })
  .refine(
    (v) => v.mix.reduce((sum, m) => sum + m.count, 0) <= MAX_QUESTIONS_PER_REQUEST,
    { message: `Generate at most ${MAX_QUESTIONS_PER_REQUEST} questions at a time`, path: ['mix'] },
  )
  .refine((v) => v.toPage === undefined || v.fromPage === undefined || v.toPage >= v.fromPage, {
    message: 'toPage must be greater than or equal to fromPage',
    path: ['toPage'],
  });

/** The teacher-reviewed subset, sent back to be persisted. Re-validated here
 *  rather than trusted: the client is free to edit any field before saving, so
 *  what arrives is teacher-authored input, not the model's output. */
export const saveGeneratedSchema = z.object({
  classNum: z.number().int().min(1).max(10),
  subject: z.string().min(1),
  chapterNum: z.number().int().min(1).max(50).optional(),
  questions: z
    .array(
      z.object({
        type: questionTypeEnum,
        text: z.string().min(5),
        options: z.array(z.object({ text: z.string().min(1), isCorrect: z.boolean() })).optional(),
        correctAnswer: z.string().optional(),
        rubric: z.string().optional(),
        marks: z.number().int().min(1).max(20),
        difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
      }),
    )
    .min(1)
    .max(MAX_QUESTIONS_PER_REQUEST),
  citation: z
    .object({
      bookTitle: z.string(),
      chapterNum: z.number().int().nullable(),
      chapterTitle: z.string().nullable(),
      pages: z.array(z.number().int()),
      excerptsUsed: z.number().int(),
    })
    .optional(),
});

export type GenerateQuestionsInput = z.infer<typeof generateQuestionsSchema>;
export type SaveGeneratedInput = z.infer<typeof saveGeneratedSchema>;
