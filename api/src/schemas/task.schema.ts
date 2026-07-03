import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(2),
  subject: z.string().min(1),
  taskType: z.enum(['quiz', 'reading', 'practice', 'pyq', 'custom']).default('custom'),
  instructions: z.string().optional(),
  xpReward: z.number().int().min(0).max(1000).default(10),
  dueDate: z.string().optional(), // YYYY-MM-DD
  assignTo: z.discriminatedUnion('mode', [
    z.object({ mode: z.literal('students'), studentIds: z.array(z.string().uuid()).min(1) }),
    z.object({ mode: z.literal('class'), classNum: z.number().int().min(1).max(10), section: z.string().min(1) }),
    z.object({ mode: z.literal('batch'), batchId: z.number().int().min(1).max(3) }),
  ]),
});

export const cycleStatusSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'in_review', 'completed']).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
