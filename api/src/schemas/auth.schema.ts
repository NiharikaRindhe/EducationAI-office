import { z } from 'zod';

// Credentials reach teachers on printed slips and in emails, so they arrive
// pasted — and a pasted value routinely carries a trailing space or newline.
// Untrimmed, that surfaced as a bare "invalid email or password" (or a 422)
// with nothing on screen hinting at whitespace, which is indistinguishable
// from a genuinely wrong password. Trimming is safe here: emails never contain
// surrounding whitespace, and every password this system issues comes from
// `generatePassword()`, which emits alphanumerics only.
export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().trim().min(1),
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
