import { z } from 'zod';

export const createChatSessionSchema = z.object({
  // classNum is accepted for backwards compatibility but IGNORED server-side —
  // the session is always bound to the student's own class from their profile,
  // so a Class 5 student can never open a Class 7 tutoring session.
  classNum: z.number().int().min(1).max(10).optional(),
  subject: z.string().min(1),
});

export const renameChatSessionSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(80, 'Keep it under 80 characters'),
});

// A message needs text, a photo (vision doubt-solving: student snaps a
// textbook problem/diagram), or both. ~5.6M base64 chars ≈ a 4MB image.
export const sendMessageSchema = z
  .object({
    text: z.string().max(4000).optional().default(''),
    imageBase64: z
      .string()
      .max(5_600_000, 'Image too large — keep photos under 4MB')
      .regex(/^[A-Za-z0-9+/=]+$/, 'imageBase64 must be plain base64 (no data: prefix)')
      .optional(),
  })
  .refine((v) => v.text.trim().length > 0 || v.imageBase64, {
    message: 'Send some text, a photo, or both',
  });

export type CreateChatSessionInput = z.infer<typeof createChatSessionSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type RenameChatSessionInput = z.infer<typeof renameChatSessionSchema>;
