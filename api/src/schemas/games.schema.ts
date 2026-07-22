import { z } from 'zod';

export const submitGameAttemptSchema = z.object({
  stars: z.number().int().min(0).max(3),
  score: z.number().int().min(0).optional(),
});

export type SubmitGameAttemptInput = z.infer<typeof submitGameAttemptSchema>;
