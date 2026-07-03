import { z } from 'zod';

export const createSchoolSchema = z.object({
  name: z.string().min(2),
  code: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[A-Z0-9-]+$/, 'School code must be uppercase letters, numbers, and hyphens only'),
  city: z.string().optional(),
  state: z.string().optional(),
  board: z.enum(['CBSE', 'ICSE', 'State', 'IB']).default('CBSE'),
  plan: z.enum(['starter', 'school', 'enterprise']).default('starter'),
});

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
