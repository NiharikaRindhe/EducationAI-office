import { parse } from 'csv-parse/sync';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { generatePassword, generatePin, generateUsername } from '../lib/credentials.js';
import {
  studentCsvRowSchema,
  teacherCsvRowSchema,
  type StudentCsvRow,
  type TeacherCsvRow,
} from '../schemas/schoolAdmin.schema.js';

const AVATARS = ['🦁', '🐯', '🦊', '🐼', '🐸', '🦋', '🦄', '🐉', '🚀', '⭐', '🎯', '🏆'];
const randomAvatar = () => AVATARS[Math.floor(Math.random() * AVATARS.length)]!;

export interface ImportError {
  row: number;
  fullName?: string;
  reason: string;
}

export interface StudentCredential {
  fullName: string;
  classNum: number;
  section: string;
  username: string;
  password?: string; // Batch 2-3
  pin?: string; // Batch 1
}

export interface TeacherCredential {
  fullName: string;
  username: string;
  password: string;
}

async function getSchoolCode(schoolId: string): Promise<string> {
  const { data, error } = await supabaseAdmin.from('schools').select('code').eq('id', schoolId).single();
  if (error || !data) throw new ApiError('SCHOOL_INVALID', 'School not found');
  return data.code as string;
}

// ─────────────────────────────────────────────────────────────
//  CSV PARSING
// ─────────────────────────────────────────────────────────────
export function parseStudentCsv(buffer: Buffer): { rows: StudentCsvRow[]; errors: ImportError[] } {
  const rawRows: Record<string, string>[] = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const rows: StudentCsvRow[] = [];
  const errors: ImportError[] = [];

  rawRows.forEach((raw, index) => {
    const parsed = studentCsvRowSchema.safeParse(raw);
    if (parsed.success) {
      rows.push(parsed.data);
    } else {
      errors.push({ row: index + 2, fullName: raw.full_name, reason: parsed.error.issues[0]?.message ?? 'Invalid row' });
    }
  });

  return { rows, errors };
}

export function parseTeacherCsv(buffer: Buffer): { rows: TeacherCsvRow[]; errors: ImportError[] } {
  const rawRows: Record<string, string>[] = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const rows: TeacherCsvRow[] = [];
  const errors: ImportError[] = [];

  rawRows.forEach((raw, index) => {
    const parsed = teacherCsvRowSchema.safeParse(raw);
    if (parsed.success) {
      rows.push(parsed.data);
    } else {
      errors.push({ row: index + 2, fullName: raw.full_name, reason: parsed.error.issues[0]?.message ?? 'Invalid row' });
    }
  });

  return { rows, errors };
}

// ─────────────────────────────────────────────────────────────
//  ONE STUDENT — the unit both CSV import and single-add share.
//  Batch 1 (class 1-4) gets a PIN; Batch 2-3 (class 5-10) gets a password.
// ─────────────────────────────────────────────────────────────
async function createOneStudent(
  schoolId: string,
  schoolCode: string,
  row: StudentCsvRow,
): Promise<StudentCredential> {
  const disambiguator = randomUUID();
  const username = generateUsername(row.full_name, schoolCode, disambiguator);
  const isBatch1 = row.class_num <= 4;
  const password = isBatch1 ? generatePassword(16) : generatePassword(8); // Batch 1 password is unused but required by GoTrue
  const pin = isBatch1 ? generatePin() : undefined;

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: username,
    password,
    email_confirm: true,
  });
  if (authError || !authUser.user) {
    throw new ApiError('CSV_IMPORT_ERROR', authError?.message ?? 'Failed to create auth account');
  }

  const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
    id: authUser.user.id,
    school_id: schoolId,
    role: 'student',
    full_name: row.full_name,
  });

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id); // avoid an orphaned auth account
    throw new ApiError('CSV_IMPORT_ERROR', `Profile creation failed: ${profileError.message}`);
  }

  const pinHash = pin ? await bcrypt.hash(pin, 10) : null;

  const { error: studentError } = await supabaseAdmin.from('student_profiles').insert({
    user_id: authUser.user.id,
    class_num: row.class_num,
    section: row.section,
    roll_number: row.roll_number ?? null,
    avatar: randomAvatar(),
    pin_hash: pinHash,
  });

  if (studentError) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    throw new ApiError('CSV_IMPORT_ERROR', `Student profile creation failed: ${studentError.message}`);
  }

  return {
    fullName: row.full_name,
    classNum: row.class_num,
    section: row.section,
    username,
    password: isBatch1 ? undefined : password,
    pin,
  };
}

export async function importStudents(schoolId: string, rows: StudentCsvRow[]) {
  const schoolCode = await getSchoolCode(schoolId);
  const credentials: StudentCredential[] = [];
  const errors: ImportError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    try {
      credentials.push(await createOneStudent(schoolId, schoolCode, row));
    } catch (err) {
      errors.push({
        row: i + 2,
        fullName: row.full_name,
        reason: err instanceof ApiError ? err.message : 'Unknown error',
      });
    }
  }

  return { created: credentials.length, errors, credentials };
}

// ─────────────────────────────────────────────────────────────
//  ONE TEACHER
// ─────────────────────────────────────────────────────────────
async function createOneTeacher(
  schoolId: string,
  schoolCode: string,
  row: TeacherCsvRow,
): Promise<TeacherCredential> {
  const disambiguator = randomUUID();
  const username = generateUsername(row.full_name, schoolCode, disambiguator);
  const password = generatePassword(10);

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: username,
    password,
    email_confirm: true,
  });
  if (authError || !authUser.user) {
    throw new ApiError('CSV_IMPORT_ERROR', authError?.message ?? 'Failed to create auth account');
  }

  const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
    id: authUser.user.id,
    school_id: schoolId,
    role: 'teacher',
    full_name: row.full_name,
  });

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    throw new ApiError('CSV_IMPORT_ERROR', `Profile creation failed: ${profileError.message}`);
  }

  const { error: teacherError } = await supabaseAdmin.from('teacher_profiles').insert({
    user_id: authUser.user.id,
    employee_id: row.employee_id ?? null,
    specialization: row.specialization ?? null,
    classes_taught: row.classes_taught,
  });

  if (teacherError) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    throw new ApiError('CSV_IMPORT_ERROR', `Teacher profile creation failed: ${teacherError.message}`);
  }

  return { fullName: row.full_name, username, password };
}

export async function importTeachers(schoolId: string, rows: TeacherCsvRow[]) {
  const schoolCode = await getSchoolCode(schoolId);
  const credentials: TeacherCredential[] = [];
  const errors: ImportError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    try {
      credentials.push(await createOneTeacher(schoolId, schoolCode, row));
    } catch (err) {
      errors.push({
        row: i + 2,
        fullName: row.full_name,
        reason: err instanceof ApiError ? err.message : 'Unknown error',
      });
    }
  }

  return { created: credentials.length, errors, credentials };
}

// ─────────────────────────────────────────────────────────────
//  SINGLE ADD (mid-year admissions / new hires)
// ─────────────────────────────────────────────────────────────
export async function addSingleStudent(schoolId: string, row: StudentCsvRow) {
  const schoolCode = await getSchoolCode(schoolId);
  return createOneStudent(schoolId, schoolCode, row);
}

export async function addSingleTeacher(schoolId: string, row: TeacherCsvRow) {
  const schoolCode = await getSchoolCode(schoolId);
  return createOneTeacher(schoolId, schoolCode, row);
}

// ─────────────────────────────────────────────────────────────
//  LISTING
// ─────────────────────────────────────────────────────────────
export async function listStudents(schoolId: string, filters: { classNum?: number; section?: string } = {}) {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, is_active, has_logged_in_ever, student_profiles(class_num, section, roll_number, avatar, xp, streak)')
    .eq('school_id', schoolId)
    .eq('role', 'student');

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list students', error.message);

  let rows = data ?? [];
  if (filters.classNum !== undefined) {
    rows = rows.filter((r) => {
      const sp = Array.isArray(r.student_profiles) ? r.student_profiles[0] : r.student_profiles;
      return sp?.class_num === filters.classNum;
    });
  }
  if (filters.section) {
    rows = rows.filter((r) => {
      const sp = Array.isArray(r.student_profiles) ? r.student_profiles[0] : r.student_profiles;
      return sp?.section === filters.section;
    });
  }
  return rows;
}

export async function listTeachers(schoolId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, is_active, has_logged_in_ever, teacher_profiles(employee_id, specialization, classes_taught)')
    .eq('school_id', schoolId)
    .eq('role', 'teacher');

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list teachers', error.message);
  return data;
}
