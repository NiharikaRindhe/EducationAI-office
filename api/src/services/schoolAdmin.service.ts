import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { revokeUserSessions } from '../lib/sessions.js';
import { writeAuditLog } from './auditLog.service.js';
import { generatePassword, generatePin, generateUsername } from '../lib/credentials.js';
import { ensureSectionExists } from './classSection.service.js';
import {
  studentCsvRowSchema,
  teacherCsvRowSchema,
  type StudentCsvRow,
  type TeacherCsvRow,
  type updateStudentProfileSchema,
  type updateTeacherProfileSchema,
} from '../schemas/schoolAdmin.schema.js';
import type { z } from 'zod';

type UpdateStudentInput = z.infer<typeof updateStudentProfileSchema>;
type UpdateTeacherInput = z.infer<typeof updateTeacherProfileSchema>;

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
//  EDITING EXISTING ACCOUNTS
//
//  Until now the only way to correct a misspelled name or a wrong class was
//  to delete the account and re-import it, which threw away the child's XP,
//  streak, exam history and login. These are the in-place edits.
//
//  Every function re-reads the row scoped to schoolId BEFORE writing. The id
//  arrives from the client and is untrusted: without that check a School Admin
//  could edit any account on the platform by guessing a uuid.
// ─────────────────────────────────────────────────────────────

/** Load a student and prove they belong to this school. */
async function assertStudentInSchool(schoolId: string, studentId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, student_profiles(class_num, section, roll_number)')
    .eq('id', studentId)
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .maybeSingle();
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to read student', error.message);
  if (!data) throw new ApiError('NOT_FOUND', 'Student not found in this school');
  return data;
}

export async function updateStudentProfile(
  schoolId: string,
  studentId: string,
  input: UpdateStudentInput,
  actorId: string,
) {
  const before = await assertStudentInSchool(schoolId, studentId);
  const sp = Array.isArray(before.student_profiles) ? before.student_profiles[0] : before.student_profiles;

  if (input.fullName !== undefined) {
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({ full_name: input.fullName, updated_at: new Date().toISOString() })
      .eq('id', studentId);
    if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to update name', error.message);
  }

  const profilePatch: Record<string, unknown> = {};
  if (input.classNum !== undefined) profilePatch.class_num = input.classNum;
  if (input.section !== undefined) profilePatch.section = input.section.trim().toUpperCase();
  if (input.rollNumber !== undefined) profilePatch.roll_number = input.rollNumber;

  if (Object.keys(profilePatch).length > 0) {
    // A section must exist before a student can be moved into it, or the
    // roster shows a child in a class the timetable has never heard of.
    const targetClass = (profilePatch.class_num as number | undefined) ?? sp?.class_num;
    const targetSection = (profilePatch.section as string | undefined) ?? sp?.section;
    if (targetClass && targetSection) await ensureSectionExists(schoolId, targetClass, targetSection);

    const { error } = await supabaseAdmin.from('student_profiles').update(profilePatch).eq('user_id', studentId);
    if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to update student details', error.message);
  }

  // Crossing the Class 4/5 boundary swaps PIN login for password login. The
  // caller is told so it can prompt for a credential reset; batch_id is a
  // generated column so it follows the class automatically.
  const crossedBatch =
    input.classNum !== undefined && sp ? (sp.class_num <= 4) !== (input.classNum <= 4) : false;

  await writeAuditLog({
    schoolId,
    actorId,
    action: 'student.updated',
    entity: 'student',
    entityId: studentId,
    metadata: {
      before: { fullName: before.full_name, classNum: sp?.class_num, section: sp?.section, rollNumber: sp?.roll_number },
      after: input,
      crossedBatch,
    },
  });

  return { ...(await assertStudentInSchool(schoolId, studentId)), crossedBatch };
}

async function assertTeacherInSchool(schoolId: string, teacherId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, is_active, teacher_profiles(employee_id, specialization, classes_taught)')
    .eq('id', teacherId)
    .eq('school_id', schoolId)
    .eq('role', 'teacher')
    .maybeSingle();
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to read teacher', error.message);
  if (!data) throw new ApiError('NOT_FOUND', 'Teacher not found in this school');
  return data;
}

export async function updateTeacherProfile(
  schoolId: string,
  teacherId: string,
  input: UpdateTeacherInput,
  actorId: string,
) {
  const before = await assertTeacherInSchool(schoolId, teacherId);
  const tp = Array.isArray(before.teacher_profiles) ? before.teacher_profiles[0] : before.teacher_profiles;

  if (input.fullName !== undefined) {
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({ full_name: input.fullName, updated_at: new Date().toISOString() })
      .eq('id', teacherId);
    if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to update name', error.message);
  }

  const profilePatch: Record<string, unknown> = {};
  if (input.employeeId !== undefined) profilePatch.employee_id = input.employeeId;
  if (input.specialization !== undefined) profilePatch.specialization = input.specialization;
  if (input.classesTaught !== undefined) profilePatch.classes_taught = input.classesTaught;

  if (Object.keys(profilePatch).length > 0) {
    const { error } = await supabaseAdmin.from('teacher_profiles').update(profilePatch).eq('user_id', teacherId);
    if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to update teacher details', error.message);
  }

  await writeAuditLog({
    schoolId,
    actorId,
    action: 'teacher.updated',
    entity: 'teacher',
    entityId: teacherId,
    metadata: {
      before: {
        fullName: before.full_name,
        employeeId: tp?.employee_id,
        specialization: tp?.specialization,
        classesTaught: tp?.classes_taught,
      },
      after: input,
    },
  });

  return assertTeacherInSchool(schoolId, teacherId);
}

/**
 * Enable or disable a staff login (teacher or lab in-charge).
 *
 * Students already had this through the bulk directory actions; staff did not,
 * so a teacher who left the school could only be dealt with by resetting their
 * password and hoping. Reversible — this never deletes the account, because the
 * exams and tasks they authored still reference them.
 */
export async function setStaffActive(
  schoolId: string,
  userId: string,
  isActive: boolean,
  actorId: string,
) {
  const { data: staff, error: readError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .eq('school_id', schoolId)
    .in('role', ['teacher', 'lab_incharge'])
    .maybeSingle();
  if (readError) throw new ApiError('INTERNAL_ERROR', 'Failed to read staff account', readError.message);
  if (!staff) throw new ApiError('NOT_FOUND', 'Staff account not found in this school');

  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to update staff account', error.message);

  await writeAuditLog({
    schoolId,
    actorId,
    action: isActive ? 'staff.reactivated' : 'staff.deactivated',
    entity: staff.role as string,
    entityId: userId,
    metadata: { fullName: staff.full_name },
  });

  // requireAuth re-reads is_active per request, so the next call is refused
  // either way. Revoking as well ends the session they are holding right now.
  if (!isActive) {
    await revokeUserSessions(userId, 'account_deactivated', { actorId, schoolId });
  }

  return { id: userId, fullName: staff.full_name, role: staff.role, isActive };
}

/**
 * Remove a teacher or lab in-charge from the school.
 *
 * This is the "delete" action on the staff lists, and like the student one it
 * records a departure rather than destroying the row. tasks, exams,
 * live_sessions and announcements all reference teacher_profiles with NO
 * ACTION, so the database refuses to delete a teacher who ever set an exam —
 * and an exam's author is part of its record regardless.
 *
 * What the school actually wants happens either way: the person disappears
 * from the staff list, loses their login, and releases anything they were
 * holding. A departing teacher is unassigned from their classes so nobody is
 * left with a ghost class teacher or a timetable slot nobody will turn up to.
 */
export async function exitStaff(
  schoolId: string,
  userId: string,
  reason: string | null,
  actorId: string,
) {
  const { data: staff, error: readError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .eq('school_id', schoolId)
    .in('role', ['teacher', 'lab_incharge'])
    .maybeSingle();
  if (readError) throw new ApiError('INTERNAL_ERROR', 'Failed to read staff account', readError.message);
  if (!staff) throw new ApiError('NOT_FOUND', 'Staff account not found in this school');

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({ exited_at: now, exit_reason: reason, is_active: false, updated_at: now })
    .eq('id', userId);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to remove staff member', error.message);

  // Release their teaching commitments. class_sections.class_teacher_id and
  // timetable_slots.teacher_id are both ON DELETE SET NULL, but nothing is
  // being deleted here, so they have to be cleared explicitly.
  //
  // Exactly what was released is recorded below rather than just how many.
  // A count tells an admin who mis-clicked that something is gone without
  // telling them what to put back, and it makes reinstate unable to undo.
  let released: { classSectionId: string; subject: string }[] = [];
  let releasedSectionIds: string[] = [];
  if (staff.role === 'teacher') {
    const { data: assignments } = await supabaseAdmin
      .from('teaching_assignments')
      .select('class_section_id, subject')
      .eq('teacher_id', userId)
      .eq('school_id', schoolId);
    released = (assignments ?? []).map((a) => ({
      classSectionId: a.class_section_id as string,
      subject: a.subject as string,
    }));

    const { data: sections } = await supabaseAdmin
      .from('class_sections')
      .select('id')
      .eq('class_teacher_id', userId)
      .eq('school_id', schoolId);
    releasedSectionIds = (sections ?? []).map((s) => s.id as string);

    if (released.length) {
      await supabaseAdmin
        .from('teaching_assignments')
        .delete()
        .eq('teacher_id', userId)
        .eq('school_id', schoolId);
    }
    if (releasedSectionIds.length) {
      await supabaseAdmin
        .from('class_sections')
        .update({ class_teacher_id: null })
        .eq('class_teacher_id', userId)
        .eq('school_id', schoolId);
    }
  }

  const releasedAssignments = released.length;
  const releasedSections = releasedSectionIds.length;

  await writeAuditLog({
    schoolId,
    actorId,
    action: 'staff.exited',
    entity: staff.role as string,
    entityId: userId,
    metadata: {
      fullName: staff.full_name,
      reason,
      releasedAssignments,
      releasedSections,
      // The detail reinstate reads back to restore the teacher's timetable.
      assignments: released,
      sectionIds: releasedSectionIds,
    },
  });

  await revokeUserSessions(userId, 'staff_exited', { actorId, schoolId });

  return {
    id: userId,
    fullName: staff.full_name,
    role: staff.role,
    releasedAssignments,
    releasedSections,
  };
}

/**
 * Undo a staff exit, putting back the classes the exit released.
 *
 * Most reinstates are undoing a mis-click on the wrong row, so leaving the
 * teacher present but stripped of every class would be a half-undo that the
 * admin then has to repair by hand. The exit audit entry records exactly what
 * it took away, so this can put it back.
 *
 * Restoration is best-effort: a section deleted since the exit, or a subject
 * already reassigned to someone else, is skipped rather than failing the
 * reinstate. The count of what actually came back is returned so the UI can
 * tell the admin when something needs re-doing manually.
 */
export async function reinstateStaff(schoolId: string, userId: string, actorId: string) {
  const { data: staff, error: readError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .eq('school_id', schoolId)
    .in('role', ['teacher', 'lab_incharge'])
    .maybeSingle();
  if (readError) throw new ApiError('INTERNAL_ERROR', 'Failed to read staff account', readError.message);
  if (!staff) throw new ApiError('NOT_FOUND', 'Staff account not found in this school');

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({ exited_at: null, exit_reason: null, is_active: true, updated_at: now })
    .eq('id', userId);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to reinstate staff member', error.message);

  let restoredAssignments = 0;
  let restoredSections = 0;

  if (staff.role === 'teacher') {
    const { data: lastExit } = await supabaseAdmin
      .from('audit_logs')
      .select('metadata')
      .eq('entity_id', userId)
      .eq('action', 'staff.exited')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const meta = (lastExit?.metadata ?? {}) as {
      assignments?: { classSectionId: string; subject: string }[];
      sectionIds?: string[];
    };

    const assignments = meta.assignments ?? [];
    if (assignments.length) {
      // onConflict ignore: the unique key is (teacher, section, subject), so a
      // row that somehow survived is left alone rather than erroring.
      const { count } = await supabaseAdmin
        .from('teaching_assignments')
        .upsert(
          assignments.map((a) => ({
            school_id: schoolId,
            teacher_id: userId,
            class_section_id: a.classSectionId,
            subject: a.subject,
          })),
          { onConflict: 'teacher_id,class_section_id,subject', ignoreDuplicates: true, count: 'exact' },
        );
      restoredAssignments = count ?? 0;
    }

    const sectionIds = meta.sectionIds ?? [];
    if (sectionIds.length) {
      // Only reclaim sections that are still vacant — if someone else has
      // since been made class teacher, that decision wins.
      const { count } = await supabaseAdmin
        .from('class_sections')
        .update({ class_teacher_id: userId }, { count: 'exact' })
        .in('id', sectionIds)
        .is('class_teacher_id', null)
        .eq('school_id', schoolId);
      restoredSections = count ?? 0;
    }
  }

  await writeAuditLog({
    schoolId,
    actorId,
    action: 'staff.reinstated',
    entity: staff.role as string,
    entityId: userId,
    metadata: { fullName: staff.full_name, restoredAssignments, restoredSections },
  });

  return {
    id: userId,
    fullName: staff.full_name,
    role: staff.role,
    restoredAssignments,
    restoredSections,
  };
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

export async function listLabIncharges(schoolId: string, includeLeft = false) {
  let query = supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, is_active, has_logged_in_ever, exited_at, exit_reason')
    .eq('school_id', schoolId)
    .eq('role', 'lab_incharge');

  // People who have left are out of the list unless asked for, so the staff
  // count on screen is the staff the school actually has.
  if (!includeLeft) query = query.is('exited_at', null);

  const { data, error } = await query;
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list lab in-charges', error.message);
  return data;
}

export async function resetLabInchargePassword(
  schoolId: string,
  id: string,
  actorId: string,
): Promise<TeacherCredential> {
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

  // The old credential is dead — any session still holding it must die too,
  // or a reset prompted by a leaked password leaves the leaker signed in.
  await revokeUserSessions(id, 'credential_reset', { actorId, schoolId });
  // Records THAT a credential was reset and by whom. Never the credential.
  await writeAuditLog({
    schoolId,
    actorId,
    action: 'credential.reset',
    entity: 'lab_incharge',
    entityId: id,
    metadata: { method: 'password' },
  });

  return { fullName: profile.full_name, username, password };
}

export async function listTeachers(schoolId: string, includeLeft = false) {
  let query = supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, is_active, has_logged_in_ever, exited_at, exit_reason, teacher_profiles(employee_id, specialization, classes_taught)')
    .eq('school_id', schoolId)
    .eq('role', 'teacher');

  // Departed teachers are hidden by default so the staff list, and the
  // teacher pickers built from it, only offer people who are still here.
  if (!includeLeft) query = query.is('exited_at', null);

  const { data, error } = await query;
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list teachers', error.message);
  return data;
}

// ─────────────────────────────────────────────────────────────
//  CREDENTIAL RESETS
//  Kids forget PINs weekly and printed slips get lost — the admin
//  (and later the lab in-charge) needs a one-click regenerate that
//  returns the new credential for a fresh printed slip.
// ─────────────────────────────────────────────────────────────
export async function resetStudentCredential(
  schoolId: string,
  studentId: string,
  actorId: string,
): Promise<StudentCredential> {
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
    await revokeUserSessions(studentId, 'pin_reset', { actorId, schoolId });
    await writeAuditLog({
      schoolId,
      actorId,
      action: 'credential.reset',
      entity: 'student',
      entityId: studentId,
      metadata: { method: 'pin', classNum: sp.class_num, section: sp.section },
    });
    return { fullName: profile.full_name, classNum: sp.class_num, section: sp.section, username, pin };
  }

  const password = generatePassword(8);
  const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(studentId, { password });
  if (pwError) throw new ApiError('INTERNAL_ERROR', 'Failed to reset password', pwError.message);
  await revokeUserSessions(studentId, 'credential_reset', { actorId, schoolId });
  await writeAuditLog({
    schoolId,
    actorId,
    action: 'credential.reset',
    entity: 'student',
    entityId: studentId,
    metadata: { method: 'password', classNum: sp.class_num, section: sp.section },
  });
  return { fullName: profile.full_name, classNum: sp.class_num, section: sp.section, username, password };
}

export async function resetTeacherPassword(
  schoolId: string,
  teacherId: string,
  actorId: string,
): Promise<TeacherCredential> {
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

  await revokeUserSessions(teacherId, 'credential_reset', { actorId, schoolId });
  await writeAuditLog({
    schoolId,
    actorId,
    action: 'credential.reset',
    entity: 'teacher',
    entityId: teacherId,
    metadata: { method: 'password' },
  });

  return { fullName: profile.full_name, username, password };
}
