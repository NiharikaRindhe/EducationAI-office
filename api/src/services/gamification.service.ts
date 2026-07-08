import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';

// A daily streak is guaranteed to break for a lab used 1-3x/week — the whole
// point of a streak is to reward showing up again, not to punish a schedule
// the student never controlled. Instead of "logged yesterday exactly", the
// streak continues as long as the gap since the last log is within this
// grace window (comfortably covers a weekly lab period + a holiday or two);
// beyond it, the streak has genuinely lapsed and restarts at 1.
export const STREAK_GRACE_DAYS = 9;

function daysBetween(fromDateStr: string, toDateStr: string): number {
  const msPerDay = 86_400_000;
  return Math.round((new Date(toDateStr).getTime() - new Date(fromDateStr).getTime()) / msPerDay);
}

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

/** Idempotent per calendar day — logging in/acting twice today doesn't double-count.
 *  Called both when a student earns XP (task/exam/English) AND simply when they
 *  join a live lab session (xpEarnedToday=0) — attendance alone should count. */
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

  // Continue the streak if the most recent PRIOR log is within the grace
  // window (not "exactly yesterday" — a school lab period is often days apart).
  const { data: lastPriorLog } = await supabaseAdmin
    .from('streak_logs')
    .select('logged_date')
    .eq('student_id', studentId)
    .lt('logged_date', today)
    .order('logged_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: student } = await supabaseAdmin
    .from('student_profiles')
    .select('streak, longest_streak')
    .eq('user_id', studentId)
    .single();

  let newStreak = 1;
  if (existing) {
    newStreak = student?.streak ?? 1; // already logged today, streak unchanged
  } else if (lastPriorLog && daysBetween(lastPriorLog.logged_date, today) <= STREAK_GRACE_DAYS) {
    newStreak = (student?.streak ?? 0) + 1;
  }

  const newLongest = Math.max(newStreak, student?.longest_streak ?? 0);
  await supabaseAdmin
    .from('student_profiles')
    .update({ streak: newStreak, longest_streak: newLongest })
    .eq('user_id', studentId);

  return { streak: newStreak };
}

export async function getStudentStats(studentId: string): Promise<StudentStats> {
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

/** Last `days` days of streak_logs as a calendar, oldest first — powers
 *  the streak calendar/heatmap UI. Days with no log simply have xpEarned=0. */
export async function getStreakCalendar(studentId: string, days = 60) {
  const { data: student, error } = await supabaseAdmin
    .from('student_profiles')
    .select('streak, longest_streak')
    .eq('user_id', studentId)
    .single();
  if (error || !student) throw new ApiError('NOT_FOUND', 'Student not found');

  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - (days - 1));
  const fromDateStr = fromDate.toISOString().slice(0, 10);

  const { data: logs } = await supabaseAdmin
    .from('streak_logs')
    .select('logged_date, xp_earned')
    .eq('student_id', studentId)
    .gte('logged_date', fromDateStr)
    .order('logged_date', { ascending: true });

  const logsByDate = new Map((logs ?? []).map((l) => [l.logged_date, l.xp_earned]));

  const calendar: { date: string; active: boolean; xpEarned: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(fromDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    calendar.push({ date: dateStr, active: logsByDate.has(dateStr), xpEarned: logsByDate.get(dateStr) ?? 0 });
  }

  return {
    streak: student.streak,
    longestStreak: student.longest_streak,
    graceDays: STREAK_GRACE_DAYS,
    calendar,
  };
}

interface BadgeAward {
  id: string;
  name: string;
  icon: string | null;
}

/** Current value of whatever a badge's criteria_type measures — shared by
 *  the award check and the "how close am I" progress shown on the badges page. */
function statValueFor(criteriaType: string, stats: StudentStats): number {
  switch (criteriaType) {
    case 'streak':
      return stats.streak;
    case 'xp':
      return stats.xp;
    case 'tasks_done':
      return stats.completedTasks;
    case 'exam_score':
      return stats.highestExamScorePct ?? 0;
    case 'english_accuracy':
      return stats.avgEnglishAccuracy ?? 0;
    case 'english_fluency':
      return stats.avgEnglishFluency ?? 0;
    default:
      return 0;
  }
}

export async function evaluateAndAwardBadges(studentId: string): Promise<BadgeAward[]> {
  const stats = await getStudentStats(studentId);

  const { data: allBadges } = await supabaseAdmin.from('badges').select('id, name, icon, criteria_type, criteria_value');
  const { data: earned } = await supabaseAdmin.from('student_badges').select('badge_id').eq('student_id', studentId);
  const earnedIds = new Set((earned ?? []).map((b) => b.badge_id));

  const newlyAwarded: BadgeAward[] = [];

  for (const badge of allBadges ?? []) {
    if (earnedIds.has(badge.id)) continue;

    const qualifies = statValueFor(badge.criteria_type, stats) >= badge.criteria_value;

    if (qualifies) {
      const { error } = await supabaseAdmin.from('student_badges').insert({ student_id: studentId, badge_id: badge.id });
      if (!error) newlyAwarded.push({ id: badge.id, name: badge.name, icon: badge.icon });
    }
  }

  return newlyAwarded;
}

/** All badges relevant to this student (their batch or batch-agnostic ones),
 *  each flagged earned/not with a progress fraction toward the unearned ones. */
export async function getBadgesForStudent(studentId: string, batchId: number) {
  const stats = await getStudentStats(studentId);

  const { data: allBadges, error } = await supabaseAdmin
    .from('badges')
    .select('id, name, description, icon, batch_id, criteria_type, criteria_value')
    .or(`batch_id.is.null,batch_id.eq.${batchId}`);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load badges', error.message);

  const { data: earned, error: earnedError } = await supabaseAdmin
    .from('student_badges')
    .select('badge_id, earned_at')
    .eq('student_id', studentId);
  if (earnedError) throw new ApiError('INTERNAL_ERROR', 'Failed to load earned badges', earnedError.message);

  const earnedByBadgeId = new Map((earned ?? []).map((b) => [b.badge_id, b.earned_at]));

  return (allBadges ?? []).map((badge) => {
    const currentValue = statValueFor(badge.criteria_type, stats);
    return {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      criteriaType: badge.criteria_type,
      criteriaValue: badge.criteria_value,
      earned: earnedByBadgeId.has(badge.id),
      earnedAt: earnedByBadgeId.get(badge.id) ?? null,
      progress: Math.min(1, currentValue / badge.criteria_value),
    };
  });
}
