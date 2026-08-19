import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { resetStudentCredential } from './schoolAdmin.service.js';
import { assertStudentsInSchool } from './studentDirectory.service.js';
import { revokeSessionsForUsers } from '../lib/sessions.js';
import { writeAuditLog } from './auditLog.service.js';
import type { StudentCredential } from './schoolAdmin.service.js';

/**
 * Bulk roster operations behind the student directory's selection bar.
 *
 * Every function re-verifies that the ids belong to the caller's school
 * before writing — the ids arrive from the client, so they are treated as
 * untrusted input no matter which portal sent them.
 */

export interface BulkOutcome {
  succeeded: number;
  failed: { studentId: string; reason: string }[];
}

/**
 * Regenerate PIN (Class 1-4) or password (Class 5-10) for each selected
 * student and return the new credentials for printing.
 *
 * Deliberately sequential: each reset is an auth-admin write, and firing
 * hundreds concurrently gets rate-limited and leaves the roster in a
 * half-reset state that's impossible to reconcile against printed slips.
 * One failure does not abort the rest — the caller gets both lists, so a
 * partial run is still usable and the failures are visible.
 */
export async function bulkResetStudentCredentials(
  schoolId: string,
  studentIds: string[],
  actorId: string,
): Promise<BulkOutcome & { credentials: StudentCredential[] }> {
  await assertStudentsInSchool(studentIds, schoolId);

  const credentials: StudentCredential[] = [];
  const failed: BulkOutcome['failed'] = [];

  for (const studentId of studentIds) {
    try {
      credentials.push(await resetStudentCredential(schoolId, studentId, actorId));
    } catch (err) {
      failed.push({
        studentId,
        reason: err instanceof ApiError ? err.message : 'Reset failed',
      });
    }
  }

  return { succeeded: credentials.length, failed, credentials };
}

/**
 * Move students into another class-section (transfers, section rebalancing).
 *
 * Note this can change a student's batch: moving Class 4 -> 5 flips them from
 * PIN login to password login, and batch_id is a generated column so it
 * follows automatically. Their existing PIN hash stays until a credential
 * reset is run, which the UI prompts for after a cross-batch move.
 */
export async function bulkMoveStudents(
  schoolId: string,
  studentIds: string[],
  target: { classNum: number; section: string },
): Promise<BulkOutcome & { crossBatch: number }> {
  await assertStudentsInSchool(studentIds, schoolId);

  if (target.classNum < 1 || target.classNum > 10) {
    throw new ApiError('VALIDATION_ERROR', 'Class must be between 1 and 10');
  }
  const section = target.section.trim().toUpperCase();
  if (!section) throw new ApiError('VALIDATION_ERROR', 'Section is required');

  // Count how many cross the Class 4/5 PIN-vs-password boundary so the UI can
  // tell the admin their logins need reissuing.
  const { data: before, error: beforeError } = await supabaseAdmin
    .from('student_profiles')
    .select('user_id, class_num')
    .in('user_id', studentIds);
  if (beforeError) throw new ApiError('INTERNAL_ERROR', 'Failed to read students', beforeError.message);

  const targetIsBatch1 = target.classNum <= 4;
  const crossBatch = (before ?? []).filter((r) => (r.class_num <= 4) !== targetIsBatch1).length;

  const { error } = await supabaseAdmin
    .from('student_profiles')
    .update({ class_num: target.classNum, section })
    .in('user_id', studentIds);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to move students', error.message);

  return { succeeded: studentIds.length, failed: [], crossBatch };
}

/**
 * Enable or disable logins in bulk (students who left, or locking a cohort
 * out during an exam window). Reversible — this never deletes a record.
 */
export async function bulkSetStudentActive(
  schoolId: string,
  studentIds: string[],
  isActive: boolean,
  actorId: string,
): Promise<BulkOutcome> {
  await assertStudentsInSchool(studentIds, schoolId);

  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .in('id', studentIds);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to update student accounts', error.message);

  // One entry for the batch, not one per student: this is a single
  // administrative decision, and a 300-row burst would bury the log.
  await writeAuditLog({
    schoolId,
    actorId,
    action: isActive ? 'student.reactivated' : 'student.deactivated',
    entity: 'student',
    metadata: { count: studentIds.length, studentIds },
  });

  // requireAuth re-reads is_active per request, so a deactivated student is
  // refused on their very next call regardless. Revoking as well closes the
  // token they are still holding on a shared lab machine right now.
  if (!isActive) {
    await revokeSessionsForUsers(studentIds, 'account_deactivated', { actorId, schoolId });
  }

  return { succeeded: studentIds.length, failed: [] };
}

/**
 * Record that students have left the school.
 *
 * This is what the roster's "remove" action does, and it is deliberately not a
 * DELETE. Twelve tables reference student_profiles with NO ACTION, so deleting
 * a student who has ever sat an exam is rejected by the database — and even
 * where it would succeed, discarding a leaver's marks is the wrong outcome. An
 * exited student leaves the active roster and loses their login; their
 * submissions, badges and results stay attached to them.
 *
 * Reversible via reinstateStudents, because "left" is frequently entered by
 * mistake on the wrong row.
 */
export async function exitStudents(
  schoolId: string,
  studentIds: string[],
  reason: string | null,
  actorId: string,
): Promise<BulkOutcome> {
  await assertStudentsInSchool(studentIds, schoolId);

  const now = new Date().toISOString();

  // Exit and login-disable are one write: both live on user_profiles, and a
  // leaver who stayed signed in because the second update failed would be a
  // security hole rather than a cosmetic bug.
  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({ exited_at: now, exit_reason: reason, is_active: false, updated_at: now })
    .in('id', studentIds);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to archive students', error.message);

  // Close out this year's enrolment so the promotion run doesn't carry a
  // student who has left into the next class.
  await supabaseAdmin
    .from('student_enrollments')
    .update({ outcome: 'left' })
    .in('student_id', studentIds)
    .eq('outcome', 'enrolled');

  await writeAuditLog({
    schoolId,
    actorId,
    action: 'student.exited',
    entity: 'student',
    metadata: { count: studentIds.length, studentIds, reason },
  });

  await revokeSessionsForUsers(studentIds, 'student_exited', { actorId, schoolId });

  return { succeeded: studentIds.length, failed: [] };
}

/** Undo an exit — the student never left, or has come back. */
export async function reinstateStudents(
  schoolId: string,
  studentIds: string[],
  actorId: string,
): Promise<BulkOutcome> {
  await assertStudentsInSchool(studentIds, schoolId);

  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({ exited_at: null, exit_reason: null, is_active: true, updated_at: now })
    .in('id', studentIds);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to reinstate students', error.message);

  await supabaseAdmin
    .from('student_enrollments')
    .update({ outcome: 'enrolled' })
    .in('student_id', studentIds)
    .eq('outcome', 'left');

  await writeAuditLog({
    schoolId,
    actorId,
    action: 'student.reinstated',
    entity: 'student',
    metadata: { count: studentIds.length, studentIds },
  });

  return { succeeded: studentIds.length, failed: [] };
}
