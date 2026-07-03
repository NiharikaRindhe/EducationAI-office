import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  classNum: z.number().int().min(1).max(10).optional(),
  section: z.string().min(1).max(4).optional(),
  title: z.string().min(2),
  body: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
