import { z } from 'zod';

export const startSessionSchema = z.object({
  classNum: z.number().int().min(1).max(10),
  section: z.string().min(1).max(4),
  subject: z.string().optional(),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
