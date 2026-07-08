import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { generatePassword, generatePin, generateUsername } from '../lib/credentials.js';
import { ensureSectionExists } from './classSection.service.js';
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
//  SPREADSHEET PARSING (.csv and .xlsx)
//  School offices live in Excel, and hand-exported CSVs regularly
//  arrive with broken encodings for Indian names — so .xlsx is
//  accepted natively. Headers are normalized ("Full Name" ->
//  "full_name") since real files rarely match the template exactly.
// ─────────────────────────────────────────────────────────────
const normalizeHeader = (h: string) => h.trim().toLowerCase().replace(/\s+/g, '_');

async function bufferToRecords(buffer: Buffer, filename: string): Promise<Record<string, string>[]> {
  const lower = filename.toLowerCase();

  if (lower.endsWith('.xls')) {
    throw new ApiError('VALIDATION_ERROR', 'Old .xls format is not supported — save the file as .xlsx or .csv');
  }

  if (lower.endsWith('.xlsx')) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) return [];

    const headers: string[] = [];
    sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
      headers[col] = normalizeHeader(cell.text ?? '');
    });

    const records: Record<string, string>[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const record: Record<string, string> = {};
      let hasValue = false;
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        const key = headers[col];
        if (!key) return;
        const value = (cell.text ?? '').trim();
        record[key] = value;
        if (value) hasValue = true;
      });
      if (hasValue) records.push(record);
    });
    return records;
  }

  return parse(buffer, {
    columns: (header: string[]) => header.map(normalizeHeader),
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });
}

/** When `scope` is set (scoped per-section import), every row is pinned to
 *  that class+section and the sheet only needs full_name (+ roll_number). */
export async function parseStudentSheet(
  buffer: Buffer,
  filename: string,
  scope?: { classNum: number; section: string },
): Promise<{ rows: StudentCsvRow[]; errors: ImportError[] }> {
  const rawRows = await bufferToRecords(buffer, filename);

  const rows: StudentCsvRow[] = [];
  const errors: ImportError[] = [];

  rawRows.forEach((raw, index) => {
    const candidate = scope ? { ...raw, class_num: String(scope.classNum), section: scope.section } : raw;
    const parsed = studentCsvRowSchema.safeParse(candidate);
    if (parsed.success) {
      rows.push(parsed.data);
    } else {
      errors.push({ row: index + 2, fullName: raw.full_name, reason: parsed.error.issues[0]?.message ?? 'Invalid row' });
    }
  });

  return { rows, errors };
}

export async function parseTeacherSheet(
  buffer: Buffer,
  filename: string,
): Promise<{ rows: TeacherCsvRow[]; errors: ImportError[] }> {
  const rawRows = await bufferToRecords(buffer, filename);

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
  row.section = row.section.trim().toUpperCase();
  // Importing students into a section registers that section automatically,
  // so class_sections never drifts out of sync with the roster.
  await ensureSectionExists(schoolId, row.class_num, row.section);

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

// ─────────────────────────────────────────────────────────────
//  LAB IN-CHARGE — PIN/password reset support without grade access.
//  No student_profiles/teacher_profiles row needed (same as school_admin/
//  super_admin, per the schema comment): user_profiles alone covers it.
//  No bulk import — a school typically has one or two, so a single-add
//  form is all this needs, unlike students/teachers.
// ─────────────────────────────────────────────────────────────
export async function addSingleLabIncharge(schoolId: string, fullName: string): Promise<TeacherCredential> {
  const schoolCode = await getSchoolCode(schoolId);
  const disambiguator = randomUUID();
  const username = generateUsername(fullName, schoolCode, disambiguator);
  const password = generatePassword(10);

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: username,
    password,
    email_confirm: true,
  });
  if (authError || !authUser.user) {
    throw new ApiError('INTERNAL_ERROR', authError?.message ?? 'Failed to create auth account');
  }

  const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
    id: authUser.user.id,
    school_id: schoolId,
    role: 'lab_incharge',
    full_name: fullName,
  });
  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    throw new ApiError('INTERNAL_ERROR', `Profile creation failed: ${profileError.message}`);
  }

  return { fullName, username, password };
}

export async function listLabIncharges(schoolId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, is_active, has_logged_in_ever')
    .eq('school_id', schoolId)
    .eq('role', 'lab_incharge');

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list lab in-charges', error.message);
  return data;
}

export async function resetLabInchargePassword(schoolId: string, id: string): Promise<TeacherCredential> {
  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name')
    .eq('id', id)
    .eq('school_id', schoolId)
    .eq('role', 'lab_incharge')
    .single();
  if (error || !profile) throw new ApiError('NOT_FOUND', 'Lab in-charge not found in this school');

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id);
  const username = authUser?.user?.email ?? '';

  const password = generatePassword(10);
  const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
  if (pwError) throw new ApiError('INTERNAL_ERROR', 'Failed to reset password', pwError.message);

  return { fullName: profile.full_name, username, password };
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

// ─────────────────────────────────────────────────────────────
//  CREDENTIAL RESETS
//  Kids forget PINs weekly and printed slips get lost — the admin
//  (and later the lab in-charge) needs a one-click regenerate that
//  returns the new credential for a fresh printed slip.
// ─────────────────────────────────────────────────────────────
export async function resetStudentCredential(schoolId: string, studentId: string): Promise<StudentCredential> {
  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, school_id, role, student_profiles(class_num, section)')
    .eq('id', studentId)
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .single();
  if (error || !profile) throw new ApiError('NOT_FOUND', 'Student not found in this school');

  const sp = Array.isArray(profile.student_profiles) ? profile.student_profiles[0] : profile.student_profiles;
  if (!sp) throw new ApiError('NOT_FOUND', 'Student profile missing');

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(studentId);
  const username = authUser?.user?.email ?? '';
  const isBatch1 = sp.class_num <= 4;

  if (isBatch1) {
    const pin = generatePin();
    const pinHash = await bcrypt.hash(pin, 10);
    const { error: pinError } = await supabaseAdmin
      .from('student_profiles')
      .update({ pin_hash: pinHash })
      .eq('user_id', studentId);
    if (pinError) throw new ApiError('INTERNAL_ERROR', 'Failed to reset PIN', pinError.message);
    return { fullName: profile.full_name, classNum: sp.class_num, section: sp.section, username, pin };
  }

  const password = generatePassword(8);
  const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(studentId, { password });
  if (pwError) throw new ApiError('INTERNAL_ERROR', 'Failed to reset password', pwError.message);
  return { fullName: profile.full_name, classNum: sp.class_num, section: sp.section, username, password };
}

export async function resetTeacherPassword(schoolId: string, teacherId: string): Promise<TeacherCredential> {
  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name')
    .eq('id', teacherId)
    .eq('school_id', schoolId)
    .eq('role', 'teacher')
    .single();
  if (error || !profile) throw new ApiError('NOT_FOUND', 'Teacher not found in this school');

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(teacherId);
  const username = authUser?.user?.email ?? '';

  const password = generatePassword(10);
  const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(teacherId, { password });
  if (pwError) throw new ApiError('INTERNAL_ERROR', 'Failed to reset password', pwError.message);

  return { fullName: profile.full_name, username, password };
}
