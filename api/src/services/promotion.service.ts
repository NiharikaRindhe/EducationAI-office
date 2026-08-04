import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { currentAcademicYear } from '../lib/academicYear.js';
import { generatePassword } from '../lib/credentials.js';

function getNextAcademicYear(currentYear: string): string {
  const parts = currentYear.split('-');
  const startStr = parts[0] || '2026';
  const endStr = parts[1] || '27';
  const start = parseInt(startStr, 10);
  const nextStart = start + 1;
  const nextEnd = (parseInt(endStr, 10) + 1) % 100;
  return `${nextStart}-${String(nextEnd).padStart(2, '0')}`;
}

export type PromotionAction = 'promote' | 'pass_out' | 'convert_credentials';

export interface PromotionPreviewRow {
  classNum: number;
  studentsCount: number;
  action: PromotionAction;
  /** Class this cohort lands in next year; null for Class 10 (they leave). */
  nextClassNum: number | null;
}

export interface PromotionStudent {
  id: string;
  fullName: string;
  classNum: number;
  section: string;
  rollNumber: string | null;
}

/** Where one section's students land in the class above. */
export interface SectionMoveRow {
  fromClass: number;
  fromSection: string;
  studentCount: number;
  toClass: number;
  /** Section labels the school already runs for `toClass`. */
  availableSections: string[];
  /**
   * True when `fromSection` has no counterpart in the class above — the case
   * that used to strand students in a section the school does not have. The
   * wizard must collect an answer for these and only these.
   */
  needsDecision: boolean;
}

/** One admin decision: send `fromClass`-`fromSection` into `toSection`. */
export interface SectionMapEntry {
  fromClass: number;
  fromSection: string;
  toSection: string;
}

/**
 * The dry run. Everything the wizard needs to describe the rollover before
 * anything is written.
 *
 * The shape here is what the UI actually consumes. It previously returned a
 * `byClass` map while the wizard read `preview.summary[]`, so the page threw
 * `Cannot read properties of undefined (reading 'map')` on mount and the
 * entire feature was unreachable.
 */
export async function getPromotionPreview(schoolId: string) {
  const currentYear = currentAcademicYear();
  const nextYear = getNextAcademicYear(currentYear);

  const { data: students, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, student_profiles!inner(class_num, section, roll_number)')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .eq('is_active', true);

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to fetch student counts', error.message);

  const roster: PromotionStudent[] = (students ?? []).flatMap((s) => {
    const sp = Array.isArray(s.student_profiles) ? s.student_profiles[0] : s.student_profiles;
    if (!sp || sp.class_num < 1 || sp.class_num > 10) return [];
    return [{
      id: s.id as string,
      fullName: s.full_name as string,
      classNum: sp.class_num as number,
      section: (sp.section as string) ?? 'A',
      rollNumber: (sp.roll_number as string | null) ?? null,
    }];
  });

  const byClass: Record<number, number> = {};
  for (let c = 1; c <= 10; c++) byClass[c] = 0;
  for (const s of roster) byClass[s.classNum] = (byClass[s.classNum] ?? 0) + 1;

  // One row per class that actually has students, in the order they'll be
  // acted on. Class 4 is called out separately because its cohort also
  // switches from PIN login to a password, which produces credential slips
  // the school has to print.
  const summary: PromotionPreviewRow[] = [];
  for (let c = 1; c <= 10; c++) {
    if (byClass[c] === 0) continue;
    summary.push({
      classNum: c,
      studentsCount: byClass[c]!,
      action: c === 10 ? 'pass_out' : c === 4 ? 'convert_credentials' : 'promote',
      nextClassNum: c === 10 ? null : c + 1,
    });
  }

  // Which sections the school actually runs, per class, this year. The
  // rollover copies this structure forward verbatim, so it is also the set of
  // sections that will exist next year.
  const { data: sectionRows, error: secErr } = await supabaseAdmin
    .from('class_sections')
    .select('class_num, section_label')
    .eq('school_id', schoolId)
    .eq('academic_year', currentYear)
    .eq('is_active', true);

  if (secErr) throw new ApiError('INTERNAL_ERROR', 'Failed to load sections', secErr.message);

  const sectionsByClass = new Map<number, string[]>();
  for (const r of sectionRows ?? []) {
    const list = sectionsByClass.get(r.class_num as number) ?? [];
    list.push(r.section_label as string);
    sectionsByClass.set(r.class_num as number, list);
  }
  for (const list of sectionsByClass.values()) list.sort();

  // Head-count per occupied (class, section), taken from the students
  // themselves rather than the section table — a section can be empty, and an
  // import can put a child in a section that was never formally created.
  const occupancy = new Map<string, number>();
  for (const s of roster) {
    if (s.classNum > 9) continue; // Class 10 leaves; it maps nowhere.
    const key = `${s.classNum}|${s.section.trim().toUpperCase()}`;
    occupancy.set(key, (occupancy.get(key) ?? 0) + 1);
  }

  const sectionPlan: SectionMoveRow[] = [];
  for (const [key, studentCount] of occupancy) {
    const [classStr, fromSection] = key.split('|');
    const fromClass = parseInt(classStr!, 10);
    const toClass = fromClass + 1;
    const availableSections = sectionsByClass.get(toClass) ?? [];
    sectionPlan.push({
      fromClass,
      fromSection: fromSection!,
      studentCount,
      toClass,
      availableSections,
      needsDecision: !availableSections.includes(fromSection!),
    });
  }
  sectionPlan.sort((a, b) => a.fromClass - b.fromClass || a.fromSection.localeCompare(b.fromSection));

  // Has this school already rolled this year over? The unique index would
  // reject a second run anyway; surfacing it here means the wizard can say so
  // up front instead of failing at the last click.
  const { data: existingRun } = await supabaseAdmin
    .from('promotion_runs')
    .select('id, status, completed_at')
    .eq('school_id', schoolId)
    .eq('from_year', currentYear)
    .in('status', ['running', 'completed'])
    .maybeSingle();

  return {
    currentYear,
    nextYear,
    byClass,
    summary,
    roster,
    sectionPlan,
    sectionDecisionsNeeded: sectionPlan.filter((r) => r.needsDecision).length,
    eligibleCount: roster.length,
    class4Count: byClass[4] ?? 0,
    class10Count: byClass[10] ?? 0,
    /** Class 1 empties out on rollover — the wizard prompts for a new intake. */
    incomingClass1Needed: true,
    alreadyRun: Boolean(existingRun),
    alreadyRunAt: existingRun?.completed_at ?? null,
  };
}

/** Class 10 leavers, for the CSV a school keeps before they're deactivated. */
export async function getGraduatingStudents(schoolId: string): Promise<PromotionStudent[]> {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, student_profiles!inner(class_num, section, roll_number)')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .eq('is_active', true)
    .eq('student_profiles.class_num', 10);

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load graduating students', error.message);

  return (data ?? []).flatMap((s) => {
    const sp = Array.isArray(s.student_profiles) ? s.student_profiles[0] : s.student_profiles;
    if (!sp) return [];
    return [{
      id: s.id as string,
      fullName: s.full_name as string,
      classNum: sp.class_num as number,
      section: (sp.section as string) ?? 'A',
      rollNumber: (sp.roll_number as string | null) ?? null,
    }];
  });
}

/** Postgres unique-violation. Raised by `promotion_runs_school_year_uq` when a
 *  promotion for this school-year has already run or is running. */
const UNIQUE_VIOLATION = '23505';

/**
 * Academic-year rollover.
 *
 * Two properties this must have, both of which it previously lacked:
 *
 * **Idempotent.** Claiming a `promotion_runs` row is the first thing that
 * happens, and a partial unique index means a second attempt for the same
 * school-year cannot insert. A double-clicked button or a retried request now
 * gets a clean 409 instead of promoting every student a second time (Class 3
 * → Class 5, with no record of the original class to recover from).
 *
 * **Atomic.** Every roster mutation happens inside the `promote_school()`
 * function, i.e. one transaction — it all lands or none of it does. This
 * matters most for the Class 4 → 5 cohort: they switch from PIN login to
 * password login, and the old code could leave a child with the PIN cleared
 * but still in Class 4, which locked them out of the platform for good.
 *
 * The GoTrue password writes are the one part that cannot join the
 * transaction, so they are done *first*, deliberately: a Class 4 student logs
 * in by PIN, so an account that receives a password but never gets promoted
 * (because the transaction rolled back) is entirely unharmed, and the retry
 * simply issues a fresh password.
 */
export async function executePromotion(
  schoolId: string,
  actorId?: string,
  /** Students repeating their current class instead of advancing. */
  holdBackIds: string[] = [],
  /** Where sections with no counterpart in the class above should land. */
  sectionMap: SectionMapEntry[] = [],
) {
  const currentYear = currentAcademicYear();
  const nextYear = getNextAcademicYear(currentYear);
  const holdBack = new Set(holdBackIds);

  // Normalised once, and reused for the credential slips below so a printed
  // slip never disagrees with where the child actually ends up.
  const normalisedMap = sectionMap.map((m) => ({
    fromClass: m.fromClass,
    fromSection: m.fromSection.trim().toUpperCase(),
    toSection: m.toSection.trim().toUpperCase(),
  }));
  const sectionFor = (fromClass: number, fromSection: string) =>
    normalisedMap.find((m) => m.fromClass === fromClass && m.fromSection === fromSection.trim().toUpperCase())
      ?.toSection ?? fromSection;

  // 1. Claim the run. This is the idempotency guard and must come first.
  const { data: run, error: claimErr } = await supabaseAdmin
    .from('promotion_runs')
    .insert({
      school_id: schoolId,
      from_year: currentYear,
      to_year: nextYear,
      status: 'running',
      started_by: actorId ?? null,
    })
    .select('id')
    .single();

  if (claimErr) {
    if (claimErr.code === UNIQUE_VIOLATION) {
      throw new ApiError(
        'CONFLICT',
        `Promotion for ${currentYear} has already been run for this school. Each academic year can only be rolled over once.`,
      );
    }
    throw new ApiError('INTERNAL_ERROR', 'Failed to start promotion', claimErr.message);
  }

  const runId = run.id as string;

  /** Mark the claimed run failed so the school can retry — the partial unique
   *  index excludes 'failed', which is what makes a retry possible at all. */
  const failRun = async (message: string) => {
    await supabaseAdmin
      .from('promotion_runs')
      .update({ status: 'failed', error_message: message.slice(0, 500), completed_at: new Date().toISOString() })
      .eq('id', runId);
  };

  try {
    // 2. Snapshot the cohorts before anything changes.
    const { data: students, error: sErr } = await supabaseAdmin
      .from('user_profiles')
      .select('id, full_name, student_profiles!inner(class_num, section)')
      .eq('school_id', schoolId)
      .eq('role', 'student')
      .eq('is_active', true);

    if (sErr) throw new ApiError('INTERNAL_ERROR', 'Failed to fetch students for promotion', sErr.message);

    if (!students || students.length === 0) {
      await supabaseAdmin
        .from('promotion_runs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', runId);
      return {
        message: 'No active students to promote',
        oldYear: currentYear,
        newYear: nextYear,
        passedOutCount: 0,
        promotedCount: 0,
        heldBackCount: 0,
        class4To5Credentials: [],
      };
    }

    // Only Class 4 students who are actually advancing need a password: a
    // held-back child stays in Class 4, keeps their PIN, and issuing them a
    // credential slip would tell the school to hand out a login they don't use.
    const class4Students = students.filter((s) => {
      const sp = Array.isArray(s.student_profiles) ? s.student_profiles[0] : s.student_profiles;
      return sp?.class_num === 4 && !holdBack.has(s.id as string);
    });

    // 3. Issue passwords to the Class 4 cohort BEFORE the transaction.
    //    Safe to do early: they still log in by PIN until step 4 commits.
    const class4To5Credentials: {
      fullName: string;
      username: string;
      password: string;
      classNum: number;
      section: string;
    }[] = [];

    for (const student of class4Students) {
      const sp = Array.isArray(student.student_profiles) ? student.student_profiles[0] : student.student_profiles;
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(student.id);
      const username = authUser?.user?.email ?? '';

      const newPassword = generatePassword(8);
      const { error: pwErr } = await supabaseAdmin.auth.admin.updateUserById(student.id, { password: newPassword });
      if (pwErr) {
        throw new ApiError(
          'INTERNAL_ERROR',
          `Failed to set password for ${student.full_name}. No student records were changed — you can safely retry.`,
          pwErr.message,
        );
      }

      class4To5Credentials.push({
        fullName: student.full_name,
        username,
        password: newPassword,
        classNum: 5,
        // The section they land in, not the one they're leaving — these slips
        // get printed and handed out, so a remapped child must not be told to
        // report to their old section.
        section: sectionFor(4, sp?.section ?? 'A'),
      });
    }

    // 4. Every roster mutation, atomically.
    const { data: result, error: rpcErr } = await supabaseAdmin.rpc('promote_school', {
      p_school_id: schoolId,
      p_from_year: currentYear,
      p_to_year: nextYear,
      p_run_id: runId,
      p_hold_back: holdBackIds,
      p_section_map: normalisedMap,
    });

    if (rpcErr) {
      throw new ApiError(
        'INTERNAL_ERROR',
        'Promotion failed and was rolled back — no student records were changed. You can safely retry.',
        rpcErr.message,
      );
    }

    const row = Array.isArray(result) ? result[0] : result;
    const promotedCount = row?.promoted_count ?? 0;
    const passedOutCount = row?.passed_out_count ?? 0;
    const heldBackCount = row?.held_back_count ?? 0;

    return {
      message: 'Promotion completed successfully',
      oldYear: currentYear,
      newYear: nextYear,
      heldBackCount,
      passedOutCount,
      promotedCount,
      // What the rollover carried into the new year, so the wizard can report
      // it rather than leaving the admin to guess whether staffing survived.
      sectionsCreated: row?.sections_created ?? 0,
      assignmentsCarried: row?.assignments_carried ?? 0,
      timetableCarried: row?.timetable_carried ?? 0,
      announcementsClosed: row?.announcements_closed ?? 0,
      class4To5Credentials,
    };
  } catch (err) {
    await failRun(err instanceof Error ? err.message : 'Unknown error');
    throw err;
  }
}
