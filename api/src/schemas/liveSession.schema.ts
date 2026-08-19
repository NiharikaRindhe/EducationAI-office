import { z } from 'zod';

export const startSessionSchema = z.object({
  classNum: z.number().int().min(1).max(10),
  section: z.string().min(1).max(4),
  subject: z.string().optional(),
  /** Supplying a lab makes this a lab session: it gets a join code and, if the
   *  timetable has a period running now, a countdown to the end of it. */
  labId: z.string().uuid().optional(),
  /** Overrides the end time derived from the timetable (a double period, or a
   *  session started off-timetable that still needs a clock). */
  endsAtExpected: z.string().datetime().optional(),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;

export const joinByCodeSchema = z.object({
  code: z.string().trim().min(4).max(8),
});

export const markAttendanceSchema = z.object({
  studentId: z.string().uuid(),
  present: z.boolean(),
});
