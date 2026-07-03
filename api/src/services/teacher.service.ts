import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';

async function getClassesTaught(teacherId: string): Promise<number[]> {
  const { data, error } = await supabaseAdmin
    .from('teacher_profiles')
    .select('classes_taught')
    .eq('user_id', teacherId)
    .single();
  if (error || !data) throw new ApiError('NOT_FOUND', 'Teacher profile not found');
  return (data.classes_taught as number[]) ?? [];
}

// Service-role queries bypass RLS entirely, so the "only classes this teacher
// teaches" scoping that RLS enforces for direct client queries has to be
// re-applied explicitly here — the Node API is not exempt from that rule.
export async function listStudentsForTeacher(
  teacherId: string,
  schoolId: string,
  filters: { classNum?: number; section?: string; search?: string } = {},
) {
  const classesTaught = await getClassesTaught(teacherId);
  if (classesTaught.length === 0) return [];

  let query = supabaseAdmin
    .from('user_profiles')
    .select(
      'id, full_name, is_active, student_profiles!inner(class_num, section, roll_number, avatar, xp, streak, batch_id)',
    )
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .in('student_profiles.class_num', filters.classNum ? [filters.classNum] : classesTaught);

  if (filters.section) query = query.eq('student_profiles.section', filters.section);
  if (filters.search) query = query.ilike('full_name', `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list students', error.message);
  return data;
}

export async function getStudentDrillDown(teacherId: string, studentId: string) {
  const classesTaught = await getClassesTaught(teacherId);

  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select(
      `id, full_name,
       student_profiles(class_num, section, roll_number, avatar, xp, level, streak, longest_streak),
       subject_progress(subject, class_num, chapters_done, total_chapters),
       student_badges(badge_id, earned_at, badges(name, icon))`,
    )
    .eq('id', studentId)
    .single();

  if (error || !data) throw new ApiError('NOT_FOUND', 'Student not found');

  const sp = Array.isArray(data.student_profiles) ? data.student_profiles[0] : data.student_profiles;
  if (!sp || !classesTaught.includes(sp.class_num)) {
    throw new ApiError('FORBIDDEN', 'This student is not in one of your classes');
  }

  return data;
}

// At-risk = no activity logged in the last 3 days (streak reset to 0) OR
// average of their last 3 exam submissions is below 50%. Exam-based
// detection naturally yields nothing until exams exist in the system —
// that's expected, not a bug, for a freshly onboarded school.
export async function getAtRiskStudents(teacherId: string, schoolId: string) {
  const classesTaught = await getClassesTaught(teacherId);
  if (classesTaught.length === 0) return [];

  const { data: students, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, student_profiles!inner(class_num, section, streak, xp)')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .in('student_profiles.class_num', classesTaught);

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load students for at-risk check', error.message);

  const flagged = [];
  for (const student of students ?? []) {
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
  const classesTaught = await getClassesTaught(teacherId);

  const { count: studentCount } = await supabaseAdmin
    .from('user_profiles')
    .select('id, student_profiles!inner(class_num)', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .in('student_profiles.class_num', classesTaught.length ? classesTaught : [-1]);

  const { count: tasksAssigned } = await supabaseAdmin
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', teacherId);

  const { count: examsCreated } = await supabaseAdmin
    .from('exams')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', teacherId);

  return {
    classesTaught,
    totalStudents: studentCount ?? 0,
    tasksAssigned: tasksAssigned ?? 0,
    examsCreated: examsCreated ?? 0,
  };
}
