import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { currentAcademicYear } from '../lib/academicYear.js';

export interface SectionRow {
  id: string;
  class_num: number;
  section_label: string;
  academic_year: string;
  is_active: boolean;
  class_teacher_id: string | null;
  classTeacherName: string | null;
  studentCount: number;
}

// ─────────────────────────────────────────────────────────────
//  SECTIONS
// ─────────────────────────────────────────────────────────────
export async function listSections(schoolId: string): Promise<SectionRow[]> {
  const year = currentAcademicYear();

  const { data: sections, error } = await supabaseAdmin
    .from('class_sections')
    .select('id, class_num, section_label, academic_year, is_active, class_teacher_id, teacher_profiles(user_profiles(full_name))')
    .eq('school_id', schoolId)
    .eq('academic_year', year)
    .order('class_num')
    .order('section_label');

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list sections', error.message);

  // Student counts per (class, section) in one query rather than N.
  const { data: students, error: countError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, student_profiles!inner(class_num, section)')
    .eq('school_id', schoolId)
    .eq('role', 'student');
  if (countError) throw new ApiError('INTERNAL_ERROR', 'Failed to count students', countError.message);

  const counts = new Map<string, number>();
  for (const s of students ?? []) {
    const sp = Array.isArray(s.student_profiles) ? s.student_profiles[0] : s.student_profiles;
    if (!sp) continue;
    const key = `${sp.class_num}-${sp.section}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return (sections ?? []).map((s) => {
    const tp = Array.isArray(s.teacher_profiles) ? s.teacher_profiles[0] : s.teacher_profiles;
    const up = tp && (Array.isArray(tp.user_profiles) ? tp.user_profiles[0] : tp.user_profiles);
    return {
      id: s.id,
      class_num: s.class_num,
      section_label: s.section_label,
      academic_year: s.academic_year,
      is_active: s.is_active,
      class_teacher_id: s.class_teacher_id,
      classTeacherName: up?.full_name ?? null,
      studentCount: counts.get(`${s.class_num}-${s.section_label}`) ?? 0,
    };
  });
}

export async function addSection(schoolId: string, classNum: number, sectionLabel: string) {
  const label = sectionLabel.trim().toUpperCase();

  const { data, error } = await supabaseAdmin
    .from('class_sections')
    .insert({ school_id: schoolId, class_num: classNum, section_label: label })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new ApiError('VALIDATION_ERROR', `Class ${classNum} already has a section ${label}`);
    }
    throw new ApiError('INTERNAL_ERROR', 'Failed to add section', error.message);
  }
  return data;
}

/** Idempotent: called whenever a student is created, so a class+section
 *  that arrives via import always exists as a section row too. */
export async function ensureSectionExists(schoolId: string, classNum: number, sectionLabel: string) {
  await supabaseAdmin
    .from('class_sections')
    .upsert(
      {
        school_id: schoolId,
        academic_year: currentAcademicYear(),
        class_num: classNum,
        section_label: sectionLabel.trim().toUpperCase(),
      },
      { onConflict: 'school_id,academic_year,class_num,section_label', ignoreDuplicates: true },
    );
}

export async function updateSection(
  schoolId: string,
  sectionId: string,
  patch: { classTeacherId?: string | null; isActive?: boolean },
) {
  if (patch.classTeacherId) {
    // The class teacher must be a teacher of this school.
    const { data: teacher } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', patch.classTeacherId)
      .eq('school_id', schoolId)
      .eq('role', 'teacher')
      .maybeSingle();
    if (!teacher) throw new ApiError('VALIDATION_ERROR', 'Class teacher must be a teacher of this school');
  }

  const updates: Record<string, unknown> = {};
  if (patch.classTeacherId !== undefined) updates.class_teacher_id = patch.classTeacherId;
  if (patch.isActive !== undefined) updates.is_active = patch.isActive;

  const { data, error } = await supabaseAdmin
    .from('class_sections')
    .update(updates)
    .eq('id', sectionId)
    .eq('school_id', schoolId)
    .select()
    .single();

  if (error || !data) throw new ApiError('NOT_FOUND', 'Section not found');
  return data;
}

// ─────────────────────────────────────────────────────────────
//  SUBJECTS (class_subjects whitelist, read-only for the admin UI)
// ─────────────────────────────────────────────────────────────
export async function listClassSubjects() {
  const { data, error } = await supabaseAdmin
    .from('class_subjects')
    .select('class_num, subject, has_exams')
    .order('class_num')
    .order('subject');
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list subjects', error.message);
  return data;
}

// ─────────────────────────────────────────────────────────────
//  TEACHING ASSIGNMENTS (teacher x section x subject)
// ─────────────────────────────────────────────────────────────
export async function listTeachingAssignments(schoolId: string) {
  const { data, error } = await supabaseAdmin
    .from('teaching_assignments')
    .select('id, teacher_id, class_section_id, subject')
    .eq('school_id', schoolId);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list teaching assignments', error.message);
  return data;
}

export async function addTeachingAssignment(
  schoolId: string,
  input: { teacherId: string; classSectionId: string; subject: string },
) {
  const { data: section } = await supabaseAdmin
    .from('class_sections')
    .select('id, class_num')
    .eq('id', input.classSectionId)
    .eq('school_id', schoolId)
    .maybeSingle();
  if (!section) throw new ApiError('NOT_FOUND', 'Section not found in this school');

  const { data: teacher } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('id', input.teacherId)
    .eq('school_id', schoolId)
    .eq('role', 'teacher')
    .maybeSingle();
  if (!teacher) throw new ApiError('VALIDATION_ERROR', 'Teacher not found in this school');

  // Same whitelist rule as tasks/exams/chat: the subject must exist for that class.
  const { data: subjectRow } = await supabaseAdmin
    .from('class_subjects')
    .select('subject')
    .eq('class_num', section.class_num)
    .eq('subject', input.subject)
    .maybeSingle();
  if (!subjectRow) {
    throw new ApiError('VALIDATION_ERROR', `"${input.subject}" is not a valid subject for Class ${section.class_num}`);
  }

  const { data, error } = await supabaseAdmin
    .from('teaching_assignments')
    .upsert(
      { school_id: schoolId, teacher_id: input.teacherId, class_section_id: input.classSectionId, subject: input.subject },
      { onConflict: 'teacher_id,class_section_id,subject', ignoreDuplicates: false },
    )
    .select()
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to add teaching assignment', error.message);

  // Keep the legacy classes_taught[] roughly in sync so anything still
  // reading it (and the fallback path) sees this teacher's classes.
  await syncClassesTaught(input.teacherId, schoolId);

  return data;
}

export async function removeTeachingAssignment(schoolId: string, assignmentId: string) {
  const { data, error } = await supabaseAdmin
    .from('teaching_assignments')
    .delete()
    .eq('id', assignmentId)
    .eq('school_id', schoolId)
    .select()
    .single();
  if (error || !data) throw new ApiError('NOT_FOUND', 'Teaching assignment not found');

  await syncClassesTaught(data.teacher_id as string, schoolId);
  return data;
}

async function syncClassesTaught(teacherId: string, schoolId: string) {
  const { data } = await supabaseAdmin
    .from('teaching_assignments')
    .select('class_sections(class_num)')
    .eq('teacher_id', teacherId)
    .eq('school_id', schoolId);

  const classNums = [
    ...new Set(
      (data ?? [])
        .map((r) => {
          const cs = Array.isArray(r.class_sections) ? r.class_sections[0] : r.class_sections;
          return cs?.class_num as number | undefined;
        })
        .filter((n): n is number => typeof n === 'number'),
    ),
  ].sort((a, b) => a - b);

  if (classNums.length > 0) {
    await supabaseAdmin.from('teacher_profiles').update({ classes_taught: classNums }).eq('user_id', teacherId);
  }
}
