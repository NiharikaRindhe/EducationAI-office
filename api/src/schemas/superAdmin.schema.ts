import { z } from 'zod';

export const createSchoolSchema = z.object({
  // School identity
  name: z.string().trim().min(2),
  code: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[A-Z0-9-]+$/, 'School code must be uppercase letters, numbers, and hyphens only'),
  board: z.enum(['CBSE', 'ICSE', 'State', 'IB']).default('CBSE'),
  plan: z.enum(['starter', 'school', 'enterprise']).default('starter'),

  // Location
  address: z.string().trim().max(300).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Pincode must be 6 digits')
    .optional()
    .or(z.literal('').transform(() => undefined)),

  // Primary contact at the school
  contactName: z.string().trim().max(120).optional(),
  contactEmail: z.string().trim().email('Invalid contact email').optional().or(z.literal('').transform(() => undefined)),
  contactPhone: z
    .string()
    .trim()
    .regex(/^[0-9+\-() ]{7,15}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('').transform(() => undefined)),

  // Optional: create the school's admin account in the same step.
  admin: z
    .object({
      fullName: z.string().trim().min(2),
      email: z.string().trim().email('Invalid admin email'),
    })
    .optional(),
});

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;

export const updateSchoolSchema = z.object({
  name: z.string().trim().min(2).optional(),
  board: z.enum(['CBSE', 'ICSE', 'State', 'IB']).optional(),
  plan: z.enum(['starter', 'school', 'enterprise']).optional(),
  address: z.string().trim().max(300).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  state: z.string().trim().max(80).nullable().optional(),
  pincode: z.string().trim().regex(/^\d{6}$/).nullable().optional().or(z.literal('').transform(() => null)),
  contactName: z.string().trim().max(120).nullable().optional(),
  contactEmail: z.string().trim().email().nullable().optional().or(z.literal('').transform(() => null)),
  contactPhone: z.string().trim().regex(/^[0-9+\-() ]{7,15}$/).nullable().optional().or(z.literal('').transform(() => null)),
});

export const addSchoolAdminSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email(),
});

export const auditLogQuerySchema = z.object({
  schoolId: z.string().uuid().optional(),
  days: z.coerce.number().int().min(1).max(365).default(30),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});
