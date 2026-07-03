import { z } from 'zod';

export const createChatSessionSchema = z.object({
  classNum: z.number().int().min(1).max(10),
  subject: z.string().min(1),
});

export const sendMessageSchema = z.object({
  text: z.string().min(1),
});

export type CreateChatSessionInput = z.infer<typeof createChatSessionSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
