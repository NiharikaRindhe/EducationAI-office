import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const pinLoginSchema = z.object({
  studentId: z.string().uuid(),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type PinLoginInput = z.infer<typeof pinLoginSchema>;
