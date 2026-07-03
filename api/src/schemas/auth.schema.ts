import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const pinRosterQuerySchema = z.object({
  schoolCode: z.string().min(3),
  classNum: z.coerce.number().int().min(1).max(4), // PIN login is Batch 1 only
  section: z.string().min(1).max(4),
});

export const pinLoginSchema = z.object({
  schoolCode: z.string().min(3),
  studentId: z.string().uuid(),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type PinRosterQuery = z.infer<typeof pinRosterQuerySchema>;
export type PinLoginInput = z.infer<typeof pinLoginSchema>;
