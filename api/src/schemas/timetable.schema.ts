import { z } from 'zod';

const timeString = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Expected HH:MM');

export const createSlotSchema = z.object({
  classSectionId: z.string().uuid(),
  dayOfWeek: z.number().int().min(1).max(6),
  periodNo: z.number().int().min(1).max(12),
  startsAt: timeString,
  endsAt: timeString,
  subject: z.string().trim().min(1).max(80),
  teacherId: z.string().uuid().nullable().optional(),
  labId: z.string().uuid().nullable().optional(),
});
export type CreateSlotInput = z.infer<typeof createSlotSchema>;

export const updateSlotSchema = createSlotSchema.partial();
export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;

export const createExceptionSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('cancelled'),
    exceptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
    reason: z.string().trim().min(1).max(200),
  }),
  z.object({
    status: z.literal('rescheduled'),
    exceptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
    reason: z.string().trim().min(1).max(200),
    newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
    newPeriodNo: z.number().int().min(1).max(12),
    newLabId: z.string().uuid().nullable().optional(),
  }),
]);
export type CreateExceptionInput = z.infer<typeof createExceptionSchema>;
