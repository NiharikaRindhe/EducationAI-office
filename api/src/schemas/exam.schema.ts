import { z } from 'zod';

const questionTypeEnum = z.enum(['mcq', 'true_false', 'short_answer', 'long_answer', 'fill_blank']);

export const createExamSchema = z.object({
  title: z.string().min(2),
  subject: z.string().min(1),
  classNum: z.number().int().min(1).max(10),
  durationMin: z.number().int().min(5).max(240).default(30),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

const optionSchema = z.object({ id: z.string(), text: z.string(), isCorrect: z.boolean() });

export const addQuestionSchema = z.object({
  type: questionTypeEnum,
  text: z.string().min(2),
  options: z.array(optionSchema).optional(),
  correctAnswer: z.string().optional(),
  marks: z.number().int().min(1).max(20).default(1),
  rubric: z.string().optional(),
  aiScoring: z.boolean().default(true),
});

export const addFromBankSchema = z.object({
  bankIds: z.array(z.string().uuid()).min(1),
});

export const publishExamSchema = z.object({
  assignTo: z.discriminatedUnion('mode', [
    z.object({ mode: z.literal('students'), studentIds: z.array(z.string().uuid()).min(1) }),
    z.object({ mode: z.literal('class'), classNum: z.number().int().min(1).max(10), section: z.string().min(1) }),
    z.object({ mode: z.literal('batch'), batchId: z.number().int().min(1).max(3) }),
  ]),
  randomizeQuestions: z.boolean().default(true),
  shuffleOptions: z.boolean().default(true),
  autoSubmitOnSwitch: z.boolean().default(true),
  switchLimit: z.number().int().min(1).max(10).default(3),
});

export const saveAnswerSchema = z.object({
  questionId: z.string().uuid(),
  studentAnswer: z.string().optional(),
  selectedOptionId: z.string().optional(),
});

export const proctorEventSchema = z.object({
  examSubmissionId: z.string().uuid(),
  eventType: z.enum(['tab_switch', 'fullscreen_exit']),
});

export const finalizeScoreSchema = z.object({
  finalScore: z.number().min(0),
  teacherNote: z.string().optional(),
});

export const addQuestionBankSchema = z.object({
  classNum: z.number().int().min(1).max(10),
  subject: z.string().min(1),
  chapterNum: z.number().int().optional(),
  type: questionTypeEnum,
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  text: z.string().min(2),
  options: z.array(optionSchema).optional(),
  correctAnswer: z.string().optional(),
  rubric: z.string().optional(),
  marks: z.number().int().min(1).max(20).default(1),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type AddQuestionInput = z.infer<typeof addQuestionSchema>;
export type PublishExamInput = z.infer<typeof publishExamSchema>;
export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;
export type AddQuestionBankInput = z.infer<typeof addQuestionBankSchema>;
