import { z } from 'zod';

export const studentCsvRowSchema = z.object({
  full_name: z.string().min(2),
  class_num: z.coerce.number().int().min(1).max(10),
  section: z.string().min(1).max(4).default('A'),
  roll_number: z.string().optional(),
});

export const teacherCsvRowSchema = z.object({
  full_name: z.string().min(2),
  employee_id: z.string().optional(),
  specialization: z.string().optional(),
  // Pipe-separated in the CSV, e.g. "6|7|8"
  classes_taught: z
    .string()
    .optional()
    .transform((val) =>
      (val ?? '')
        .split(/[|,]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number)
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= 10),
    ),
});

export const addSingleStudentSchema = z.object({
  fullName: z.string().min(2),
  classNum: z.number().int().min(1).max(10),
  section: z.string().min(1).max(4).default('A'),
  rollNumber: z.string().optional(),
});

export const addSingleTeacherSchema = z.object({
  fullName: z.string().min(2),
  employeeId: z.string().optional(),
  specialization: z.string().optional(),
  classesTaught: z.array(z.number().int().min(1).max(10)).default([]),
});

/**
 * Edits to an existing student.
 *
 * Every field is optional — this is a partial update, so a form that only
 * changes a roll number must not blank out the section. `.refine` rejects an
 * empty body rather than silently succeeding while doing nothing.
 *
 * Note what is NOT editable here: role, school_id, xp, streak and login
 * credentials. Those are either privilege boundaries (a School Admin must not
 * be able to move a child into another school) or earned state that an
 * administrator editing a name has no business rewriting.
 */
export const updateStudentProfileSchema = z
  .object({
    fullName: z.string().min(2).max(120).optional(),
    classNum: z.number().int().min(1).max(10).optional(),
    section: z.string().min(1).max(4).optional(),
    rollNumber: z.string().max(20).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

/** Same reasoning as students: identity and assignment only, never credentials. */
export const updateTeacherProfileSchema = z
  .object({
    fullName: z.string().min(2).max(120).optional(),
    employeeId: z.string().max(40).nullable().optional(),
    specialization: z.string().max(80).nullable().optional(),
    classesTaught: z.array(z.number().int().min(1).max(10)).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

/** Enable or disable a staff login. Reversible; never deletes the account. */
export const setStaffActiveSchema = z.object({
  isActive: z.boolean(),
});

export const addSingleLabInchargeSchema = z.object({
  fullName: z.string().min(2),
});

export const addSectionSchema = z.object({
  classNum: z.number().int().min(1).max(10),
  sectionLabel: z.string().min(1).max(4),
});

export const updateSectionSchema = z.object({
  classTeacherId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const addTeachingAssignmentSchema = z.object({
  teacherId: z.string().uuid(),
  classSectionId: z.string().uuid(),
  subject: z.string().min(1),
});

// Multipart text fields arrive as strings; when present they pin every
// imported row to one class+section (the "scoped import" flow).
export const importScopeSchema = z.object({
  classNum: z.coerce.number().int().min(1).max(10).optional(),
  section: z.string().min(1).max(4).optional(),
});

export type StudentCsvRow = z.infer<typeof studentCsvRowSchema>;
export type TeacherCsvRow = z.infer<typeof teacherCsvRowSchema>;

/** Optional free-text note recorded when a staff member leaves. */
export const exitStaffSchema = z.object({
  reason: z.string().trim().max(200).optional(),
});
