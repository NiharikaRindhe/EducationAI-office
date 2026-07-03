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

export type StudentCsvRow = z.infer<typeof studentCsvRowSchema>;
export type TeacherCsvRow = z.infer<typeof teacherCsvRowSchema>;
