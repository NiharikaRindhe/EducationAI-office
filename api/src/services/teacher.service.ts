import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { currentAcademicYear } from '../lib/academicYear.js';

// ─────────────────────────────────────────────────────────────
//  TEACHING SCOPE
//  Source of truth: teaching_assignments (teacher x section x subject)
//  plus class_sections.class_teacher_id (the class-teacher role, who
//  sees their whole section even with no subject assignment). Teachers
//  the admin hasn't mapped yet fall back to the legacy
//  teacher_profiles.classes_taught[] so existing schools keep working.
// ─────────────────────────────────────────────────────────────
export interface TeachingSection {
  classSectionId: string;
  classNum: number;
  section: string;
  subjects: string[];
  isClassTeacher: boolean;
}

export interface TeachingScope {
  sections: TeachingSection[];
  classNums: number[];
  /** true when built from legacy classes_taught[] (no assignments yet) */
  legacyFallback: boolean;
}

export async function getTeachingScope(teacherId: string, schoolId: string): Promise<TeachingScope> {
  const year = currentAcademicYear();

  const { data: assignments, error: aError } = await supabaseAdmin
    .from('teaching_assignments')
    .select('subject, class_sections!inner(id, class_num, section_label, academic_year, is_active)')
    .eq('teacher_id', teacherId)
    .eq('class_sections.academic_year', year)
    .eq('class_sections.is_active', true);
  if (aError) throw new ApiError('INTERNAL_ERROR', 'Failed to load teaching assignments', aError.message);

  const { data: ownSections, error: sError } = await supabaseAdmin
    .from('class_sections')
    .select('id, class_num, section_label')
    .eq('class_teacher_id', teacherId)
    .eq('academic_year', year)
    .eq('is_active', true);
  if (sError) throw new ApiError('INTERNAL_ERROR', 'Failed to load class-teacher sections', sError.message);

  const byId = new Map<string, TeachingSection>();

  for (const row of assignments ?? []) {
    const cs = Array.isArray(row.class_sections) ? row.class_sections[0] : row.class_sections;
    if (!cs) continue;
    const existing = byId.get(cs.id);
    if (existing) {
      if (!existing.subjects.includes(row.subject)) existing.subjects.push(row.subject);
    } else {
      byId.set(cs.id, {
        classSectionId: cs.id,
        classNum: cs.class_num,
        section: cs.section_label,
        subjects: [row.subject],
        isClassTeacher: false,
      });
    }
  }

  for (const cs of ownSections ?? []) {
    const existing = byId.get(cs.id);
    if (existing) {
      existing.isClassTeacher = true;
    } else {
      byId.set(cs.id, {
        classSectionId: cs.id,
        classNum: cs.class_num,
        section: cs.section_label,
        subjects: [],
        isClassTeacher: true,
      });
    }
  }

  if (byId.size > 0) {
    const sections = [...byId.values()].sort((a, b) => a.classNum - b.classNum || a.section.localeCompare(b.section));
    const classNums = [...new Set(sections.map((s) => s.classNum))].sort((a, b) => a - b);
    return { sections, classNums, legacyFallback: false };
  }

  // Legacy fallback: expand classes_taught[] to whatever sections exist for
  // those classes (subjects unknown — the UI offers the class whitelist).
  const { data: profile } = await supabaseAdmin
    .from('teacher_profiles')
    .select('classes_taught')
    .eq('user_id', teacherId)
    .single();
  const classesTaught = ((profile?.classes_taught as number[]) ?? []).filter((n) => Number.isInteger(n));
  if (classesTaught.length === 0) return { sections: [], classNums: [], legacyFallback: true };

  const { data: fallbackSections } = await supabaseAdmin
    .from('class_sections')
    .select('id, class_num, section_label')
    .eq('school_id', schoolId)
    .eq('academic_year', year)
    .eq('is_active', true)
    .in('class_num', classesTaught);

  return {
    sections: (fallbackSections ?? [])
      .map((cs) => ({
        classSectionId: cs.id,
        classNum: cs.class_num,
        section: cs.section_label,
        subjects: [],
        isClassTeacher: false,
      }))
      .sort((a, b) => a.classNum - b.classNum || a.section.localeCompare(b.section)),
    classNums: classesTaught,
    legacyFallback: true,
  };
}

/** PostgREST or-filter matching students to the teacher's exact
 *  (class, section) pairs — a teacher of 7A must not see 7B. */
function sectionPairsOrFilter(sections: TeachingSection[]): string {
  return sections
    .map((s) => `and(class_num.eq.${s.classNum},section.eq.${s.section.replace(/[^A-Za-z0-9]/g, '')})`)
    .join(',');
}

// NOT async on purpose: PostgREST builders are thenables, so returning one
// from an async function would execute the query instead of returning it.
// The select string is dynamic, so rows come back untyped.
function scopedStudentQuery(scope: TeachingScope, schoolId: string, select: string) {
  let query = supabaseAdmin
    .from('user_profiles')
    .select(select)
    .eq('school_id', schoolId)
    .eq('role', 'student');

  if (!scope.legacyFallback) {
    query = query.or(sectionPairsOrFilter(scope.sections), { referencedTable: 'student_profiles' });
  } else {
    query = query.in('student_profiles.class_num', scope.classNums);
  }
  return query;
}

// Service-role queries bypass RLS entirely, so the "only sections this
// teacher teaches" scoping that RLS enforces for direct client queries has
// to be re-applied explicitly here — the Node API is not exempt from that rule.
export async function listStudentsForTeacher(
  teacherId: string,
  schoolId: string,
  filters: { classNum?: number; section?: string; search?: string } = {},
) {
  const scope = await getTeachingScope(teacherId, schoolId);
  if (scope.sections.length === 0 && scope.classNums.length === 0) return [];

  let query = scopedStudentQuery(
    scope,
    schoolId,
    'id, full_name, is_active, student_profiles!inner(class_num, section, roll_number, avatar, xp, streak, batch_id)',
  );

  if (filters.classNum !== undefined) query = query.eq('student_profiles.class_num', filters.classNum);
  if (filters.section) query = query.eq('student_profiles.section', filters.section);
  if (filters.search) query = query.ilike('full_name', `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list students', error.message);
  return data;
}

export async function getStudentDrillDown(teacherId: string, studentId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select(
      `id, full_name, school_id,
       student_profiles(class_num, section, roll_number, avatar, xp, level, streak, longest_streak),
       subject_progress(subject, class_num, chapters_done, total_chapters),
       student_badges(badge_id, earned_at, badges(name, icon))`,
    )
    .eq('id', studentId)
    .single();

  if (error || !data) throw new ApiError('NOT_FOUND', 'Student not found');

  const sp = Array.isArray(data.student_profiles) ? data.student_profiles[0] : data.student_profiles;
  const scope = await getTeachingScope(teacherId, data.school_id as string);

  const inScope =
    sp &&
    (scope.legacyFallback
      ? scope.classNums.includes(sp.class_num)
      : scope.sections.some((s) => s.classNum === sp.class_num && s.section === sp.section));
  if (!inScope) {
    throw new ApiError('FORBIDDEN', 'This student is not in one of your classes');
  }

  return data;
}

// At-risk = no activity logged in the last 3 days (streak reset to 0) OR
// average of their last 3 exam submissions is below 50%. Exam-based
// detection naturally yields nothing until exams exist in the system —
// that's expected, not a bug, for a freshly onboarded school.
export async function getAtRiskStudents(teacherId: string, schoolId: string) {
  const scope = await getTeachingScope(teacherId, schoolId);
  if (scope.sections.length === 0 && scope.classNums.length === 0) return [];

  const query = scopedStudentQuery(
    scope,
    schoolId,
    'id, full_name, student_profiles!inner(class_num, section, streak, xp)',
  );

  const { data, error } = await query;
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load students for at-risk check', error.message);
  const students = (data ?? []) as unknown as {
    id: string;
    full_name: string;
    student_profiles: { class_num: number; section: string; streak: number; xp: number } | { class_num: number; section: string; streak: number; xp: number }[];
  }[];

  const flagged = [];
  for (const student of students) {
    const sp = Array.isArray(student.student_profiles) ? student.student_profiles[0] : student.student_profiles;
    if (!sp) continue;

    const risks: { type: string; label: string }[] = [];
    if (sp.streak === 0) risks.push({ type: 'streak_broken', label: 'No recent activity' });

    const { data: recentSubmissions } = await supabaseAdmin
      .from('exam_submissions')
      .select('total_score, max_score')
      .eq('student_id', student.id)
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: false })
      .limit(3);

    if (recentSubmissions && recentSubmissions.length > 0) {
      const scores = recentSubmissions
        .filter((s) => s.max_score && s.max_score > 0)
        .map((s) => (Number(s.total_score) / Number(s.max_score)) * 100);
      const avg = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
      if (scores.length > 0 && avg < 50) {
        risks.push({ type: 'low_score', label: `Avg score ${avg.toFixed(0)}% in last ${scores.length} exams` });
      }
    }

    if (risks.length > 0) flagged.push({ id: student.id, fullName: student.full_name, classInfo: sp, risks });
  }

  return flagged;
}

export async function getDashboardStats(teacherId: string, schoolId: string) {
  const scope = await getTeachingScope(teacherId, schoolId);

  let studentCount = 0;
  if (scope.sections.length > 0 || scope.classNums.length > 0) {
    const { data } = await scopedStudentQuery(scope, schoolId, 'id, student_profiles!inner(class_num)');
    studentCount = (data as unknown[] | null)?.length ?? 0;
  }

  const { count: tasksAssigned } = await supabaseAdmin
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', teacherId);

  const { count: examsCreated } = await supabaseAdmin
    .from('exams')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', teacherId);

  return {
    classesTaught: scope.classNums,
    sectionCount: scope.sections.length,
    totalStudents: studentCount,
    tasksAssigned: tasksAssigned ?? 0,
    examsCreated: examsCreated ?? 0,
  };
}

/** Powers every section picker in the teacher UI (tasks, exams, live
 *  sessions). Includes the class_subjects whitelist for the relevant
 *  classes so the UI never offers an invalid subject. */
export async function getMySections(teacherId: string, schoolId: string) {
  const scope = await getTeachingScope(teacherId, schoolId);

  const subjectsByClass: Record<number, string[]> = {};
  if (scope.classNums.length > 0) {
    const { data: subjects } = await supabaseAdmin
      .from('class_subjects')
      .select('class_num, subject')
      .in('class_num', scope.classNums)
      .order('subject');
    for (const row of subjects ?? []) {
      (subjectsByClass[row.class_num] ??= []).push(row.subject);
    }
  }

  return { sections: scope.sections, legacyFallback: scope.legacyFallback, subjectsByClass };
}
