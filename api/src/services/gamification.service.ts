import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';

export interface StudentStats {
  xp: number;
  streak: number;
  completedTasks: number;
  highestExamScorePct: number | null;
  avgEnglishAccuracy: number | null;
  avgEnglishFluency: number | null;
}

/**
 * The only place student_profiles.xp is ever written. Every feature that
 * earns XP (tasks, exams, English assessment) routes through here so the
 * badge check always runs — this is the "students can't self-award XP"
 * boundary the RLS guard triggers protect on the client side; this is its
 * server-side counterpart.
 */
export async function addXp(studentId: string, amount: number): Promise<{ newXp: number; newBadges: BadgeAward[] }> {
  const { data: student, error } = await supabaseAdmin
    .from('student_profiles')
    .select('xp')
    .eq('user_id', studentId)
    .single();
  if (error || !student) throw new ApiError('NOT_FOUND', 'Student not found');

  const newXp = student.xp + amount;
  const { error: updateError } = await supabaseAdmin
    .from('student_profiles')
    .update({ xp: newXp })
    .eq('user_id', studentId);
  if (updateError) throw new ApiError('INTERNAL_ERROR', 'Failed to update XP', updateError.message);

  const newBadges = await evaluateAndAwardBadges(studentId);
  return { newXp, newBadges };
}

/** Idempotent per calendar day — logging in/acting twice today doesn't double-count. */
export async function logStreakActivity(studentId: string, xpEarnedToday = 0): Promise<{ streak: number }> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabaseAdmin
    .from('streak_logs')
    .select('id, xp_earned')
    .eq('student_id', studentId)
    .eq('logged_date', today)
    .maybeSingle();

  if (existing) {
    if (xpEarnedToday > 0) {
      await supabaseAdmin
        .from('streak_logs')
        .update({ xp_earned: existing.xp_earned + xpEarnedToday })
        .eq('id', existing.id);
    }
  } else {
    await supabaseAdmin.from('streak_logs').insert({ student_id: studentId, logged_date: today, xp_earned: xpEarnedToday });
  }

  // Was yesterday also logged? If so the streak continues; otherwise it restarts at 1.
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const { data: yesterdayLog } = await supabaseAdmin
    .from('streak_logs')
    .select('id')
    .eq('student_id', studentId)
    .eq('logged_date', yesterday)
    .maybeSingle();

  const { data: student } = await supabaseAdmin
    .from('student_profiles')
    .select('streak, longest_streak')
    .eq('user_id', studentId)
    .single();

  let newStreak = 1;
  if (existing) {
    newStreak = student?.streak ?? 1; // already logged today, streak unchanged
  } else if (yesterdayLog) {
    newStreak = (student?.streak ?? 0) + 1;
  }

  const newLongest = Math.max(newStreak, student?.longest_streak ?? 0);
  await supabaseAdmin
    .from('student_profiles')
    .update({ streak: newStreak, longest_streak: newLongest })
    .eq('user_id', studentId);

  return { streak: newStreak };
}

async function getStudentStats(studentId: string): Promise<StudentStats> {
  const { data: sp } = await supabaseAdmin
    .from('student_profiles')
    .select('xp, streak')
    .eq('user_id', studentId)
    .single();

  const { count: completedTasks } = await supabaseAdmin
    .from('task_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('status', 'completed');

  const { data: submissions } = await supabaseAdmin
    .from('exam_submissions')
    .select('total_score, max_score')
    .eq('student_id', studentId)
    .not('submitted_at', 'is', null);

  const scorePcts = (submissions ?? [])
    .filter((s) => s.max_score && s.max_score > 0)
    .map((s) => (Number(s.total_score) / Number(s.max_score)) * 100);
  const highestExamScorePct = scorePcts.length > 0 ? Math.max(...scorePcts) : null;

  const { data: englishAttempts } = await supabaseAdmin
    .from('english_assessment_attempts')
    .select('accuracy_score, fluency_score')
    .eq('student_id', studentId);

  const accuracyScores = (englishAttempts ?? []).map((a) => a.accuracy_score).filter((v): v is number => v !== null);
  const fluencyScores = (englishAttempts ?? []).map((a) => a.fluency_score).filter((v): v is number => v !== null);

  return {
    xp: sp?.xp ?? 0,
    streak: sp?.streak ?? 0,
    completedTasks: completedTasks ?? 0,
    highestExamScorePct,
    avgEnglishAccuracy:
      accuracyScores.length > 0 ? (accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length) * 10 : null, // 0-10 -> 0-100
    avgEnglishFluency:
      fluencyScores.length > 0 ? (fluencyScores.reduce((a, b) => a + b, 0) / fluencyScores.length) * 10 : null,
  };
}

interface BadgeAward {
  id: string;
  name: string;
  icon: string | null;
}

export async function evaluateAndAwardBadges(studentId: string): Promise<BadgeAward[]> {
  const stats = await getStudentStats(studentId);

  const { data: allBadges } = await supabaseAdmin.from('badges').select('id, name, icon, criteria_type, criteria_value');
  const { data: earned } = await supabaseAdmin.from('student_badges').select('badge_id').eq('student_id', studentId);
  const earnedIds = new Set((earned ?? []).map((b) => b.badge_id));

  const newlyAwarded: BadgeAward[] = [];

  for (const badge of allBadges ?? []) {
    if (earnedIds.has(badge.id)) continue;

    let qualifies = false;
    switch (badge.criteria_type) {
      case 'streak':
        qualifies = stats.streak >= badge.criteria_value;
        break;
      case 'xp':
        qualifies = stats.xp >= badge.criteria_value;
        break;
      case 'tasks_done':
        qualifies = stats.completedTasks >= badge.criteria_value;
        break;
      case 'exam_score':
        qualifies = (stats.highestExamScorePct ?? 0) >= badge.criteria_value;
        break;
      case 'english_accuracy':
        qualifies = (stats.avgEnglishAccuracy ?? 0) >= badge.criteria_value;
        break;
      case 'english_fluency':
        qualifies = (stats.avgEnglishFluency ?? 0) >= badge.criteria_value;
        break;
    }

    if (qualifies) {
      const { error } = await supabaseAdmin.from('student_badges').insert({ student_id: studentId, badge_id: badge.id });
      if (!error) newlyAwarded.push({ id: badge.id, name: badge.name, icon: badge.icon });
    }
  }

  return newlyAwarded;
}
