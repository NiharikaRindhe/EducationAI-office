import { z } from 'zod';

export const englishItemsQuerySchema = z.object({
  classNum: z.coerce.number().int().min(1).max(8),
  type: z.enum(['word_repeat', 'word_see_say', 'sentence_read', 'passage_read', 'listen_respond']).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export const submitEnglishAttemptSchema = z.object({
  itemId: z.string().uuid(),
  // Transcribed client-side (Web Speech API in the lab browser) so the
  // backend never needs to touch raw audio or run its own ASR service.
  transcript: z.string().min(1),
  durationSec: z.number().positive().optional(),
});

export type EnglishItemsQuery = z.infer<typeof englishItemsQuerySchema>;
export type SubmitEnglishAttemptInput = z.infer<typeof submitEnglishAttemptSchema>;
