import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { currentAcademicYear } from '../lib/academicYear.js';
import type { CreateSlotInput, UpdateSlotInput, CreateExceptionInput } from '../schemas/timetable.schema.js';

const SLOT_SELECT =
  'id, class_section_id, day_of_week, period_no, starts_at, ends_at, subject, teacher_id, lab_id, ' +
  'class_sections(class_num, section_label), teacher_profiles(user_profiles(full_name)), labs(name, seat_capacity)';

function shapeSlot(row: any) {
  const cs = row.class_sections as { class_num: number; section_label: string } | null;
  const tp = row.teacher_profiles as { user_profiles: { full_name: string } | { full_name: string }[] | null } | null;
  const up = tp?.user_profiles ? (Array.isArray(tp.user_profiles) ? tp.user_profiles[0] : tp.user_profiles) : null;
  const lab = row.labs as { name: string; seat_capacity: number } | { name: string; seat_capacity: number }[] | null;
  const labRow = Array.isArray(lab) ? lab[0] : lab;
  return {
    id: row.id,
    classSectionId: row.class_section_id,
    classNum: cs?.class_num ?? null,
    sectionLabel: cs?.section_label ?? null,
    dayOfWeek: row.day_of_week,
    periodNo: row.period_no,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    subject: row.subject,
    teacherId: row.teacher_id,
    teacherName: up?.full_name ?? null,
    labId: row.lab_id,
    labName: labRow?.name ?? null,
    labSeatCapacity: labRow?.seat_capacity ?? null,
  };
}

async function assertSectionInSchool(schoolId: string, classSectionId: string) {
  const { data } = await supabaseAdmin
    .from('class_sections')
    .select('id')
    .eq('id', classSectionId)
    .eq('school_id', schoolId)
    .maybeSingle();
  if (!data) throw new ApiError('VALIDATION_ERROR', 'Section not found in this school');
}

async function assertTeacherInSchool(schoolId: string, teacherId: string) {
  const { data } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('id', teacherId)
    .eq('school_id', schoolId)
    .eq('role', 'teacher')
    .maybeSingle();
  if (!data) throw new ApiError('VALIDATION_ERROR', 'Teacher not found in this school');
}

async function assertLabInSchool(schoolId: string, labId: string) {
  const { data } = await supabaseAdmin.from('labs').select('id').eq('id', labId).eq('school_id', schoolId).maybeSingle();
  if (!data) throw new ApiError('VALIDATION_ERROR', 'Lab not found in this school');
}

function friendlyConflictError(message: string): ApiError {
  if (message.includes('timetable_slots_teacher_period_uq')) {
    return new ApiError('VALIDATION_ERROR', 'That teacher is already teaching another section in this period');
  }
  if (message.includes('timetable_slots_section_period_uq')) {
    return new ApiError('VALIDATION_ERROR', 'This section already has a subject scheduled for this period');
  }
  if (message.includes('timetable_slots_lab_period_uq')) {
    return new ApiError('VALIDATION_ERROR', 'That lab is already booked by another section in this period');
  }
  return new ApiError('INTERNAL_ERROR', 'Failed to save timetable slot', message);
}

/** Non-blocking heads-up when a lab is smaller than the section being seated in it. */
async function capacityWarning(schoolId: string, classSectionId: string, labId: string | null | undefined): Promise<string | null> {
  if (!labId) return null;

  const { data: lab } = await supabaseAdmin.from('labs').select('name, seat_capacity').eq('id', labId).maybeSingle();
  if (!lab) return null;

  const { data: section } = await supabaseAdmin
    .from('class_sections')
    .select('class_num, section_label')
    .eq('id', classSectionId)
    .maybeSingle();
  if (!section) return null;

  const { count } = await supabaseAdmin
    .from('user_profiles')
    .select('id, student_profiles!inner(class_num, section)', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .eq('student_profiles.class_num', section.class_num)
    .eq('student_profiles.section', section.section_label);

  if (count !== null && count > lab.seat_capacity) {
    return `${section.class_num}-${section.section_label} has ${count} students but "${lab.name}" only seats ${lab.seat_capacity}`;
  }
  return null;
}

export async function listTimetable(schoolId: string, classSectionId?: string) {
  let query = supabaseAdmin
    .from('timetable_slots')
    .select(SLOT_SELECT)
    .eq('school_id', schoolId)
    .eq('academic_year', currentAcademicYear())
    .order('day_of_week')
    .order('period_no');

  if (classSectionId) query = query.eq('class_section_id', classSectionId);

  const { data, error } = await query;
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load timetable', error.message);
  return (data ?? []).map(shapeSlot);
}

export async function createSlot(schoolId: string, input: CreateSlotInput) {
  await assertSectionInSchool(schoolId, input.classSectionId);
  if (input.teacherId) await assertTeacherInSchool(schoolId, input.teacherId);
  if (input.labId) await assertLabInSchool(schoolId, input.labId);

  const { data, error } = await supabaseAdmin
    .from('timetable_slots')
    .insert({
      school_id: schoolId,
      class_section_id: input.classSectionId,
      day_of_week: input.dayOfWeek,
      period_no: input.periodNo,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      subject: input.subject,
      teacher_id: input.teacherId ?? null,
      lab_id: input.labId ?? null,
    })
    .select(SLOT_SELECT)
    .single();

  if (error) {
    if (error.code === '23505') throw friendlyConflictError(error.message);
    throw new ApiError('INTERNAL_ERROR', 'Failed to create timetable slot', error.message);
  }
  const warning = await capacityWarning(schoolId, input.classSectionId, input.labId);
  return { ...shapeSlot(data), capacityWarning: warning };
}

export async function updateSlot(schoolId: string, slotId: string, patch: UpdateSlotInput) {
  if (patch.classSectionId) await assertSectionInSchool(schoolId, patch.classSectionId);
  if (patch.teacherId) await assertTeacherInSchool(schoolId, patch.teacherId);
  if (patch.labId) await assertLabInSchool(schoolId, patch.labId);

  const updates: Record<string, unknown> = {};
  if (patch.classSectionId !== undefined) updates.class_section_id = patch.classSectionId;
  if (patch.dayOfWeek !== undefined) updates.day_of_week = patch.dayOfWeek;
  if (patch.periodNo !== undefined) updates.period_no = patch.periodNo;
  if (patch.startsAt !== undefined) updates.starts_at = patch.startsAt;
  if (patch.endsAt !== undefined) updates.ends_at = patch.endsAt;
  if (patch.subject !== undefined) updates.subject = patch.subject;
  if (patch.teacherId !== undefined) updates.teacher_id = patch.teacherId;
  if (patch.labId !== undefined) updates.lab_id = patch.labId;

  const { data, error } = await supabaseAdmin
    .from('timetable_slots')
    .update(updates)
    .eq('id', slotId)
    .eq('school_id', schoolId)
    .select(SLOT_SELECT)
    .single();

  if (error) {
    if (error.code === '23505') throw friendlyConflictError(error.message);
    throw new ApiError('NOT_FOUND', 'Timetable slot not found');
  }
  const shaped = shapeSlot(data);
  const warning = patch.labId ? await capacityWarning(schoolId, shaped.classSectionId, patch.labId) : null;
  return { ...shaped, capacityWarning: warning };
}

export async function deleteSlot(schoolId: string, slotId: string) {
  const { data, error } = await supabaseAdmin
    .from('timetable_slots')
    .delete()
    .eq('id', slotId)
    .eq('school_id', schoolId)
    .select('id')
    .maybeSingle();

  if (error || !data) throw new ApiError('NOT_FOUND', 'Timetable slot not found');
}

export async function listForTeacher(schoolId: string, teacherId: string) {
  const { data, error } = await supabaseAdmin
    .from('timetable_slots')
    .select(SLOT_SELECT)
    .eq('school_id', schoolId)
    .eq('teacher_id', teacherId)
    .eq('academic_year', currentAcademicYear())
    .order('day_of_week')
    .order('period_no');

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load your timetable', error.message);
  return (data ?? []).map(shapeSlot);
}

async function getStudentSectionId(schoolId: string, studentId: string): Promise<string | null> {
  const { data: profile } = await supabaseAdmin
    .from('student_profiles')
    .select('class_num, section')
    .eq('user_id', studentId)
    .maybeSingle();
  if (!profile) throw new ApiError('NOT_FOUND', 'Student profile not found');

  const { data: section } = await supabaseAdmin
    .from('class_sections')
    .select('id')
    .eq('school_id', schoolId)
    .eq('academic_year', currentAcademicYear())
    .eq('class_num', profile.class_num)
    .eq('section_label', profile.section)
    .maybeSingle();
  return section?.id ?? null;
}

export async function listForStudent(schoolId: string, studentId: string) {
  const sectionId = await getStudentSectionId(schoolId, studentId);
  if (!sectionId) return [];
  return listTimetable(schoolId, sectionId);
}

// ═════════════════════════════════════════════════════════════
//  EXCEPTIONS — cancel/reschedule a single occurrence of a slot.
// ═════════════════════════════════════════════════════════════

async function getSlotOwned(schoolId: string, slotId: string) {
  const { data, error } = await supabaseAdmin
    .from('timetable_slots')
    .select(SLOT_SELECT)
    .eq('id', slotId)
    .eq('school_id', schoolId)
    .maybeSingle();
  if (error || !data) throw new ApiError('NOT_FOUND', 'Timetable slot not found');
  return shapeSlot(data);
}

export async function createException(
  schoolId: string,
  actor: { userId: string; role: string },
  slotId: string,
  input: CreateExceptionInput,
) {
  const slot = await getSlotOwned(schoolId, slotId);

  // Teachers may only reschedule/cancel their own periods; school admins may touch any.
  if (actor.role === 'teacher' && slot.teacherId !== actor.userId) {
    throw new ApiError('FORBIDDEN', 'You can only reschedule your own periods');
  }

  if (input.status === 'rescheduled' && input.newLabId) {
    await assertLabInSchool(schoolId, input.newLabId);
  }

  const insert: Record<string, unknown> = {
    school_id: schoolId,
    timetable_slot_id: slotId,
    exception_date: input.exceptionDate,
    status: input.status,
    reason: input.reason,
    created_by: actor.userId,
  };
  if (input.status === 'rescheduled') {
    insert.new_date = input.newDate;
    insert.new_period_no = input.newPeriodNo;
    insert.new_lab_id = input.newLabId ?? slot.labId;
  }

  const { data, error } = await supabaseAdmin.from('timetable_exceptions').insert(insert).select().single();
  if (error) {
    if (error.code === '23505') {
      throw new ApiError('VALIDATION_ERROR', 'This period already has an exception recorded for that date');
    }
    throw new ApiError('INTERNAL_ERROR', 'Failed to save the schedule change', error.message);
  }
  return data;
}

const DAY_MS = 24 * 60 * 60_000;
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return new Date(d.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}
/** Monday=1 .. Saturday=6, Sunday=0 (no school) — matches timetable_slots.day_of_week. */
function dayOfWeekOf(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00Z').getUTCDay();
}

export interface Occurrence {
  date: string;
  dayOfWeek: number;
  slotId: string;
  classSectionId: string;
  classNum: number | null;
  sectionLabel: string | null;
  periodNo: number;
  startsAt: string;
  endsAt: string;
  subject: string;
  teacherId: string | null;
  teacherName: string | null;
  labId: string | null;
  labName: string | null;
  status: 'scheduled' | 'cancelled' | 'rescheduled_out' | 'rescheduled_in';
  reason?: string | null;
  movedTo?: { date: string; periodNo: number } | null;
  movedFrom?: string | null;
}

/** Merges the recurring weekly plan with dated exceptions into a flat list of
 *  real occurrences across [fromDate, toDate] (inclusive, YYYY-MM-DD) —
 *  what teachers/students/admins actually see on the calendar. */
export async function getOccurrences(
  schoolId: string,
  fromDate: string,
  toDate: string,
  filter: { classSectionId?: string; teacherId?: string } = {},
): Promise<Occurrence[]> {
  let slotQuery = supabaseAdmin
    .from('timetable_slots')
    .select(SLOT_SELECT)
    .eq('school_id', schoolId)
    .eq('academic_year', currentAcademicYear());
  if (filter.classSectionId) slotQuery = slotQuery.eq('class_section_id', filter.classSectionId);
  if (filter.teacherId) slotQuery = slotQuery.eq('teacher_id', filter.teacherId);

  const { data: slotRows, error: slotErr } = await slotQuery;
  if (slotErr) throw new ApiError('INTERNAL_ERROR', 'Failed to load timetable', slotErr.message);
  const slots = (slotRows ?? []).map(shapeSlot);
  const slotById = new Map(slots.map((s) => [s.id, s]));

  const { data: excRows, error: excErr } = await supabaseAdmin
    .from('timetable_exceptions')
    .select('id, timetable_slot_id, exception_date, status, reason, new_date, new_period_no, new_lab_id, labs(name)')
    .eq('school_id', schoolId)
    .or(
      `and(exception_date.gte.${fromDate},exception_date.lte.${toDate}),and(new_date.gte.${fromDate},new_date.lte.${toDate})`,
    );
  if (excErr) throw new ApiError('INTERNAL_ERROR', 'Failed to load schedule changes', excErr.message);

  const byOriginalDate = new Map<string, any>(); // key: slotId|date
  const rescheduledIn: any[] = [];
  for (const e of excRows ?? []) {
    byOriginalDate.set(`${e.timetable_slot_id}|${e.exception_date}`, e);
    if (e.status === 'rescheduled' && e.new_date && e.new_date >= fromDate && e.new_date <= toDate) {
      rescheduledIn.push(e);
    }
  }

  const occurrences: Occurrence[] = [];

  for (let d = fromDate; d <= toDate; d = addDays(d, 1)) {
    const dow = dayOfWeekOf(d);
    if (dow === 0) continue; // Sunday — no school

    for (const slot of slots) {
      if (slot.dayOfWeek !== dow) continue;
      const exc = byOriginalDate.get(`${slot.id}|${d}`);

      if (!exc) {
        occurrences.push({
          date: d,
          dayOfWeek: dow,
          slotId: slot.id,
          classSectionId: slot.classSectionId,
          classNum: slot.classNum,
          sectionLabel: slot.sectionLabel,
          periodNo: slot.periodNo,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          subject: slot.subject,
          teacherId: slot.teacherId,
          teacherName: slot.teacherName,
          labId: slot.labId,
          labName: slot.labName,
          status: 'scheduled',
        });
      } else if (exc.status === 'cancelled') {
        occurrences.push({
          date: d,
          dayOfWeek: dow,
          slotId: slot.id,
          classSectionId: slot.classSectionId,
          classNum: slot.classNum,
          sectionLabel: slot.sectionLabel,
          periodNo: slot.periodNo,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          subject: slot.subject,
          teacherId: slot.teacherId,
          teacherName: slot.teacherName,
          labId: slot.labId,
          labName: slot.labName,
          status: 'cancelled',
          reason: exc.reason,
        });
      } else {
        // rescheduled out of this date
        occurrences.push({
          date: d,
          dayOfWeek: dow,
          slotId: slot.id,
          classSectionId: slot.classSectionId,
          classNum: slot.classNum,
          sectionLabel: slot.sectionLabel,
          periodNo: slot.periodNo,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          subject: slot.subject,
          teacherId: slot.teacherId,
          teacherName: slot.teacherName,
          labId: slot.labId,
          labName: slot.labName,
          status: 'rescheduled_out',
          reason: exc.reason,
          movedTo: exc.new_date && exc.new_period_no ? { date: exc.new_date, periodNo: exc.new_period_no } : null,
        });
      }
    }
  }

  for (const exc of rescheduledIn) {
    const slot = slotById.get(exc.timetable_slot_id);
    if (!slot) continue;
    const labRow = Array.isArray(exc.labs) ? exc.labs[0] : exc.labs;
    occurrences.push({
      date: exc.new_date!,
      dayOfWeek: dayOfWeekOf(exc.new_date!),
      slotId: slot.id,
      classSectionId: slot.classSectionId,
      classNum: slot.classNum,
      sectionLabel: slot.sectionLabel,
      periodNo: exc.new_period_no!,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      subject: slot.subject,
      teacherId: slot.teacherId,
      teacherName: slot.teacherName,
      labId: exc.new_lab_id ?? slot.labId,
      labName: labRow?.name ?? slot.labName,
      status: 'rescheduled_in',
      reason: exc.reason,
      movedFrom: exc.exception_date,
    });
  }

  occurrences.sort((a, b) => (a.date === b.date ? a.periodNo - b.periodNo : a.date < b.date ? -1 : 1));
  return occurrences;
}

export async function getOccurrencesForTeacher(schoolId: string, teacherId: string, fromDate: string, toDate: string) {
  return getOccurrences(schoolId, fromDate, toDate, { teacherId });
}

export async function getOccurrencesForStudent(schoolId: string, studentId: string, fromDate: string, toDate: string) {
  const sectionId = await getStudentSectionId(schoolId, studentId);
  if (!sectionId) return [];
  return getOccurrences(schoolId, fromDate, toDate, { classSectionId: sectionId });
}
