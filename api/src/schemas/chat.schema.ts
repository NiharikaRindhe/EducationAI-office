import { z } from 'zod';

export const createChatSessionSchema = z.object({
  // classNum is accepted for backwards compatibility but IGNORED server-side —
  // the session is always bound to the student's own class from their profile,
  // so a Class 5 student can never open a Class 7 tutoring session.
  classNum: z.number().int().min(1).max(10).optional(),
  subject: z.string().min(1),
});

export const sendMessageSchema = z.object({
  text: z.string().min(1),
});

export type CreateChatSessionInput = z.infer<typeof createChatSessionSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
