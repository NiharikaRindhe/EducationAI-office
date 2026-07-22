import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { getTeachingScope } from './teacher.service.js';

async function verifySectionAccess(teacherId: string, schoolId: string, classNum: number, section: string) {
  const scope = await getTeachingScope(teacherId, schoolId);
  const hasAccess = scope.legacyFallback
    ? scope.classNums.includes(classNum)
    : scope.sections.some((s) => s.classNum === classNum && s.section === section);
  if (!hasAccess) {
    throw new ApiError('FORBIDDEN', 'You do not have access to this section');
  }
}

export async function getClassPerformanceHeatmap(
  teacherId: string,
  schoolId: string,
  classNum: number,
  section: string,
) {
  await verifySectionAccess(teacherId, schoolId, classNum, section);

  // Get active students
  const { data: students, error: sErr } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, student_profiles!inner(roll_number, xp)')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .eq('is_active', true)
    .eq('student_profiles.class_num', classNum)
    .eq('student_profiles.section', section)
    .order('full_name');

  if (sErr) throw new ApiError('INTERNAL_ERROR', 'Failed to fetch students', sErr.message);
  if (!students || students.length === 0) {
    return { students: [], exams: [], matrix: [] };
  }

  // Get exams for this class
  const { data: exams, error: exErr } = await supabaseAdmin
    .from('exams')
    .select('id, title')
    .eq('school_id', schoolId)
    .eq('class_num', classNum)
    .neq('status', 'draft')
    .order('created_at', { ascending: true });

  if (exErr) throw new ApiError('INTERNAL_ERROR', 'Failed to fetch exams', exErr.message);

  const studentIds = students.map((s) => s.id);

  // Get submissions
  const { data: submissions, error: subErr } = await supabaseAdmin
    .from('exam_submissions')
    .select('exam_id, student_id, total_score, max_score, submitted_at')
    .in('student_id', studentIds)
    .not('submitted_at', 'is', null);

  if (subErr) throw new ApiError('INTERNAL_ERROR', 'Failed to fetch exam submissions', subErr.message);

  const submissionsMap = new Map<string, number>();
  submissions?.forEach((sub) => {
    if (sub.max_score && sub.max_score > 0 && sub.total_score !== null) {
      const pct = (Number(sub.total_score) / Number(sub.max_score)) * 100;
      submissionsMap.set(`${sub.student_id}_${sub.exam_id}`, pct);
    }
  });

  const studentAverages = students.map((student) => {
    const pcts: number[] = [];
    exams?.forEach((exam) => {
      const pct = submissionsMap.get(`${student.id}_${exam.id}`);
      if (pct !== undefined) pcts.push(pct);
    });
    const avg = pcts.length > 0 ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null;
    const sp = Array.isArray(student.student_profiles) ? student.student_profiles[0] : student.student_profiles;
    return {
      id: student.id,
      fullName: student.full_name,
      rollNumber: sp?.roll_number ?? null,
      xp: sp?.xp ?? 0,
      averageScorePct: avg !== null ? Math.round(avg * 10) / 10 : null,
    };
  });

  const examAverages = (exams ?? []).map((exam) => {
    const pcts: number[] = [];
    students.forEach((student) => {
      const pct = submissionsMap.get(`${student.id}_${exam.id}`);
      if (pct !== undefined) pcts.push(pct);
    });
    const avg = pcts.length > 0 ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null;
    return {
      id: exam.id,
      title: exam.title,
      averageScorePct: avg !== null ? Math.round(avg * 10) / 10 : null,
    };
  });

  const matrix: { studentId: string; examId: string; scorePct: number | null; submitted: boolean }[] = [];
  students.forEach((student) => {
    exams?.forEach((exam) => {
      const pct = submissionsMap.get(`${student.id}_${exam.id}`);
      matrix.push({
        studentId: student.id,
        examId: exam.id,
        scorePct: pct !== undefined ? Math.round(pct * 10) / 10 : null,
        submitted: pct !== undefined,
      });
    });
  });

  return { students: studentAverages, exams: examAverages, matrix };
}

export async function getEnglishAssessmentReport(
  teacherId: string,
  schoolId: string,
  classNum: number,
  section: string,
) {
  await verifySectionAccess(teacherId, schoolId, classNum, section);

  // Get active students
  const { data: students, error: sErr } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, student_profiles!inner(roll_number)')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .eq('is_active', true)
    .eq('student_profiles.class_num', classNum)
    .eq('student_profiles.section', section)
    .order('full_name');

  if (sErr) throw new ApiError('INTERNAL_ERROR', 'Failed to fetch students', sErr.message);
  if (!students || students.length === 0) {
    return { students: [], classAverages: { avgAccuracy: null, avgFluency: null, avgWpm: null }, needsAttention: [] };
  }

  const studentIds = students.map((s) => s.id);

  // Fetch attempts
  const { data: attempts, error: attErr } = await supabaseAdmin
    .from('english_assessment_attempts')
    .select('student_id, accuracy_score, fluency_score, wpm')
    .in('student_id', studentIds);

  if (attErr) throw new ApiError('INTERNAL_ERROR', 'Failed to fetch attempts', attErr.message);

  const attemptsByStudent = new Map<string, typeof attempts>();
  attempts?.forEach((att) => {
    const list = attemptsByStudent.get(att.student_id) ?? [];
    list.push(att);
    attemptsByStudent.set(att.student_id, list);
  });

  let classAccTotal = 0, classAccCount = 0;
  let classFluTotal = 0, classFluCount = 0;
  let classWpmTotal = 0, classWpmCount = 0;

  const studentReport = students.map((student) => {
    const sp = Array.isArray(student.student_profiles) ? student.student_profiles[0] : student.student_profiles;
    const studentAttempts = attemptsByStudent.get(student.id) ?? [];
    const accScores = studentAttempts.map((a) => a.accuracy_score).filter((v): v is number => v !== null);
    const fluScores = studentAttempts.map((a) => a.fluency_score).filter((v): v is number => v !== null);
    const wpms = studentAttempts.map((a) => a.wpm).filter((v): v is number => v !== null);

    const avgAccuracy = accScores.length > 0 ? (accScores.reduce((a, b) => a + b, 0) / accScores.length) * 10 : null; // 0-10 -> 0-100 scale
    const avgFluency = fluScores.length > 0 ? (fluScores.reduce((a, b) => a + b, 0) / fluScores.length) * 10 : null;
    const avgWpm = wpms.length > 0 ? wpms.reduce((a, b) => a + b, 0) / wpms.length : null;

    if (avgAccuracy !== null) {
      classAccTotal += avgAccuracy;
      classAccCount++;
    }
    if (avgFluency !== null) {
      classFluTotal += avgFluency;
      classFluCount++;
    }
    if (avgWpm !== null) {
      classWpmTotal += avgWpm;
      classWpmCount++;
    }

    let status: 'green' | 'yellow' | 'red' | 'no_attempts' = 'no_attempts';
    if (avgAccuracy !== null && avgFluency !== null) {
      if (avgAccuracy >= 75 && avgFluency >= 75) status = 'green';
      else if (avgAccuracy < 50 || avgFluency < 50) status = 'red';
      else status = 'yellow';
    }

    return {
      studentId: student.id,
      fullName: student.full_name,
      rollNumber: sp?.roll_number ?? null,
      avgAccuracy: avgAccuracy !== null ? Math.round(avgAccuracy) : null,
      avgFluency: avgFluency !== null ? Math.round(avgFluency) : null,
      avgWpm: avgWpm !== null ? Math.round(avgWpm) : null,
      totalAttempts: studentAttempts.length,
      status,
    };
  });

  const classAverages = {
    avgAccuracy: classAccCount > 0 ? Math.round(classAccTotal / classAccCount) : null,
    avgFluency: classFluCount > 0 ? Math.round(classFluTotal / classFluCount) : null,
    avgWpm: classWpmCount > 0 ? Math.round(classWpmTotal / classWpmCount) : null,
  };

  const needsAttention = studentReport.filter((s) => {
    if (s.totalAttempts === 0) return false;
    return s.status === 'red' || (s.avgWpm !== null && s.avgWpm < 30);
  });

  return { students: studentReport, classAverages, needsAttention };
}

export async function getTaskCompletionMatrix(
  teacherId: string,
  schoolId: string,
  classNum: number,
  section: string,
) {
  await verifySectionAccess(teacherId, schoolId, classNum, section);

  // Get active students
  const { data: students, error: sErr } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, student_profiles!inner(roll_number)')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .eq('is_active', true)
    .eq('student_profiles.class_num', classNum)
    .eq('student_profiles.section', section)
    .order('full_name');

  if (sErr) throw new ApiError('INTERNAL_ERROR', 'Failed to fetch students', sErr.message);
  if (!students || students.length === 0) {
    return { students: [], tasks: [], matrix: [] };
  }

  const studentIds = students.map((s) => s.id);

  // Fetch all assignments for these students
  const { data: assignments, error: aErr } = await supabaseAdmin
    .from('task_assignments')
    .select('task_id, student_id, status, tasks!inner(title, subject)')
    .in('student_id', studentIds);

  if (aErr) throw new ApiError('INTERNAL_ERROR', 'Failed to fetch task assignments', aErr.message);

  const uniqueTasksMap = new Map<string, { id: string; title: string; subject: string }>();
  const studentTaskStatusMap = new Map<string, 'completed' | 'in_progress' | 'not_started' | 'in_review'>();

  assignments?.forEach((a) => {
    const taskData = Array.isArray(a.tasks) ? a.tasks[0] : a.tasks;
    if (taskData) {
      uniqueTasksMap.set(a.task_id, {
        id: a.task_id,
        title: taskData.title,
        subject: taskData.subject,
      });
    }
    studentTaskStatusMap.set(`${a.student_id}_${a.task_id}`, a.status as any);
  });

  const tasksList = [...uniqueTasksMap.values()];

  const studentSummaries = students.map((student) => {
    let completedCount = 0;
    let totalCount = 0;

    tasksList.forEach((task) => {
      const status = studentTaskStatusMap.get(`${student.id}_${task.id}`);
      if (status) {
        totalCount++;
        if (status === 'completed') completedCount++;
      }
    });

    const completionRatePct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const sp = Array.isArray(student.student_profiles) ? student.student_profiles[0] : student.student_profiles;

    return {
      id: student.id,
      fullName: student.full_name,
      rollNumber: sp?.roll_number ?? null,
      completedCount,
      totalCount,
      completionRatePct,
    };
  });

  const matrix: { studentId: string; taskId: string; status: string }[] = [];
  students.forEach((student) => {
    tasksList.forEach((task) => {
      const status = studentTaskStatusMap.get(`${student.id}_${task.id}`) ?? 'not_assigned';
      matrix.push({
        studentId: student.id,
        taskId: task.id,
        status,
      });
    });
  });

  return { students: studentSummaries, tasks: tasksList, matrix };
}

export async function getPtmReport(teacherId: string, schoolId: string, classNum: number, section: string) {
  await verifySectionAccess(teacherId, schoolId, classNum, section);

  const performance = await getClassPerformanceHeatmap(teacherId, schoolId, classNum, section);
  const english = await getEnglishAssessmentReport(teacherId, schoolId, classNum, section);
  const tasks = await getTaskCompletionMatrix(teacherId, schoolId, classNum, section);

  const performanceMap = new Map(performance.students.map((s) => [s.id, s]));
  const englishMap = new Map(english.students.map((s) => [s.studentId, s]));
  const tasksMap = new Map(tasks.students.map((s) => [s.id, s]));

  const { data: profiles, error: pErr } = await supabaseAdmin
    .from('student_profiles')
    .select('user_id, streak')
    .in('user_id', performance.students.map((s) => s.id));

  if (pErr) throw new ApiError('INTERNAL_ERROR', 'Failed to load student profiles for streak data', pErr.message);
  const streakMap = new Map(profiles?.map((p) => [p.user_id, p.streak]));

  return performance.students.map((student) => {
    const perf = performanceMap.get(student.id);
    const eng = englishMap.get(student.id);
    const tsk = tasksMap.get(student.id);
    const streak = streakMap.get(student.id) ?? 0;

    return {
      id: student.id,
      fullName: student.fullName,
      rollNumber: student.rollNumber,
      xp: perf?.xp ?? 0,
      streak,
      avgExamScorePct: perf?.averageScorePct ?? null,
      avgEnglishAccuracy: eng?.avgAccuracy ?? null,
      avgEnglishFluency: eng?.avgFluency ?? null,
      avgEnglishWpm: eng?.avgWpm ?? null,
      taskCompletionRatePct: tsk?.completionRatePct ?? 0,
    };
  });
}
