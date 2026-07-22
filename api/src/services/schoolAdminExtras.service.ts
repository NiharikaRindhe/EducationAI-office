import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';

export async function getClassFeatures(schoolId: string) {
  const { data, error } = await supabaseAdmin
    .from('class_features')
    .select('class_num, ai_chat_enabled, leaderboard_enabled')
    .eq('school_id', schoolId);

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load class features', error.message);

  const featureMap = new Map(data?.map((f) => [f.class_num, f]));

  const features = [];
  for (let c = 1; c <= 10; c++) {
    const f = featureMap.get(c);
    features.push({
      classNum: c,
      aiChatEnabled: f ? f.ai_chat_enabled : true,
      leaderboardEnabled: f ? f.leaderboard_enabled : true,
    });
  }

  return features;
}

export async function updateClassFeatures(
  schoolId: string,
  classNum: number,
  aiChatEnabled: boolean,
  leaderboardEnabled: boolean,
) {
  if (classNum < 1 || classNum > 10) {
    throw new ApiError('VALIDATION_ERROR', 'Class number must be between 1 and 10');
  }

  const { data, error } = await supabaseAdmin
    .from('class_features')
    .upsert(
      {
        school_id: schoolId,
        class_num: classNum,
        ai_chat_enabled: aiChatEnabled,
        leaderboard_enabled: leaderboardEnabled,
      },
      { onConflict: 'school_id,class_num' },
    )
    .select()
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to update class features', error.message);
  return data;
}

export async function getActivity(schoolId: string) {
  const activeSince = new Date(Date.now() - 15 * 60_000).toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ data: activeUsers, error: activeErr }, { count: todayLoginCount, error: loginErr }, { data: sessions, error: sessErr }] =
    await Promise.all([
      supabaseAdmin
        .from('user_profiles')
        .select('id, full_name, role, last_seen_at')
        .eq('school_id', schoolId)
        .gte('last_seen_at', activeSince)
        .order('last_seen_at', { ascending: false }),
      supabaseAdmin
        .from('login_events')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .gte('created_at', todayStart.toISOString()),
      supabaseAdmin
        .from('live_sessions')
        .select('id, class_num, section, subject, started_at, teacher_profiles(user_profiles(full_name))')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('started_at', { ascending: false }),
    ]);

  if (activeErr) throw new ApiError('INTERNAL_ERROR', 'Failed to load active users', activeErr.message);
  if (loginErr) throw new ApiError('INTERNAL_ERROR', "Failed to load today's logins", loginErr.message);
  if (sessErr) throw new ApiError('INTERNAL_ERROR', 'Failed to load live sessions', sessErr.message);

  return {
    activeNow: (activeUsers ?? []).map((u) => ({
      userId: u.id,
      fullName: u.full_name,
      role: u.role,
      lastSeenAt: u.last_seen_at,
    })),
    todayLoginCount: todayLoginCount ?? 0,
    liveSessions: (sessions ?? []).map((s) => {
      const tp = Array.isArray(s.teacher_profiles) ? s.teacher_profiles[0] : s.teacher_profiles;
      const up = tp && (Array.isArray(tp.user_profiles) ? tp.user_profiles[0] : tp.user_profiles);
      return {
        id: s.id,
        classNum: s.class_num,
        section: s.section,
        subject: s.subject,
        startedAt: s.started_at,
        teacherName: up?.full_name ?? null,
      };
    }),
  };
}

export async function getPrincipalUsageReport(schoolId: string) {
  // 1. Enrollment
  const { data: students, error: sErr } = await supabaseAdmin
    .from('user_profiles')
    .select('id, student_profiles!inner(class_num)')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .eq('is_active', true);

  if (sErr) throw new ApiError('INTERNAL_ERROR', 'Failed to fetch enrollment data', sErr.message);

  const studentList = students ?? [];
  const enrollmentBreakdown: Record<number, number> = {};
  for (let c = 1; c <= 10; c++) {
    enrollmentBreakdown[c] = 0;
  }
  studentList.forEach((s) => {
    const sp = Array.isArray(s.student_profiles) ? s.student_profiles[0] : s.student_profiles;
    if (sp && sp.class_num >= 1 && sp.class_num <= 10) {
      const classNum = sp.class_num;
      enrollmentBreakdown[classNum] = (enrollmentBreakdown[classNum] ?? 0) + 1;
    }
  });

  const totalEnrollment = studentList.length;

  // 2. Weekly Active Students
  const todayStr = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  const { data: activeLogs, error: logErr } = await supabaseAdmin
    .from('streak_logs')
    .select('student_id')
    .gte('logged_date', sevenDaysAgoStr)
    .lte('logged_date', todayStr);

  if (logErr) throw new ApiError('INTERNAL_ERROR', 'Failed to fetch active logs', logErr.message);

  const studentIds = new Set(studentList.map((s) => s.id));
  const activeStudentIds = new Set(activeLogs?.map((l) => l.student_id));
  const weeklyActiveCount = [...activeStudentIds].filter((id) => studentIds.has(id)).length;

  // 3. Sessions Held Per Teacher
  const { data: sessions, error: sesErr } = await supabaseAdmin
    .from('live_sessions')
    .select('teacher_id')
    .eq('school_id', schoolId);

  if (sesErr) throw new ApiError('INTERNAL_ERROR', 'Failed to fetch live sessions', sesErr.message);

  const sessionCountByTeacher = new Map<string, number>();
  sessions?.forEach((s) => {
    sessionCountByTeacher.set(s.teacher_id, (sessionCountByTeacher.get(s.teacher_id) ?? 0) + 1);
  });

  const { data: teachers, error: tErr } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name')
    .eq('school_id', schoolId)
    .eq('role', 'teacher')
    .eq('is_active', true);

  if (tErr) throw new ApiError('INTERNAL_ERROR', 'Failed to fetch teachers', tErr.message);

  const sessionsHeldPerTeacher = teachers?.map((t) => ({
    teacherId: t.id,
    fullName: t.full_name,
    sessionCount: sessionCountByTeacher.get(t.id) ?? 0,
  })) ?? [];

  // 4. Exams Conducted
  const { count: examsCount, error: exErr } = await supabaseAdmin
    .from('exams')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .neq('status', 'draft');

  if (exErr) throw new ApiError('INTERNAL_ERROR', 'Failed to fetch exams count', exErr.message);

  return {
    totalEnrollment,
    enrollmentBreakdown,
    weeklyActiveCount,
    sessionsHeldPerTeacher,
    examsConducted: examsCount ?? 0,
  };
}
