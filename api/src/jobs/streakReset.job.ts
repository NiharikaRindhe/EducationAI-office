import cron from 'node-cron';
import { supabaseAdmin } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { STREAK_GRACE_DAYS } from '../services/gamification.service.js';

/**
 * A school lab is used 1-3x/week, not daily — resetting anyone who didn't
 * log activity on the exact previous calendar day would zero every streak
 * the very next day it's checked. Instead, a streak is only actually broken
 * once the gap since the student's last logged day exceeds the same grace
 * window `logStreakActivity` uses to decide whether to continue it — this
 * job just cleans up streaks for students who never came back to trigger
 * that check themselves. Runs once daily, just after midnight IST (18:30 UTC).
 */
async function resetBrokenStreaks() {
  const today = new Date().toISOString().slice(0, 10);

  const { data: activeStreaks } = await supabaseAdmin.from('student_profiles').select('user_id').gt('streak', 0);
  if (!activeStreaks || activeStreaks.length === 0) return;

  const { data: lastLogs } = await supabaseAdmin
    .from('streak_logs')
    .select('student_id, logged_date')
    .in('student_id', activeStreaks.map((s) => s.user_id))
    .order('logged_date', { ascending: false });

  const lastLogByStudent = new Map<string, string>();
  for (const log of lastLogs ?? []) {
    if (!lastLogByStudent.has(log.student_id)) lastLogByStudent.set(log.student_id, log.logged_date);
  }

  const msPerDay = 86_400_000;
  const toReset = activeStreaks
    .map((s) => s.user_id)
    .filter((id) => {
      const lastLogged = lastLogByStudent.get(id);
      if (!lastLogged) return true; // has a streak but somehow no log at all — stale, reset
      const gapDays = Math.round((new Date(today).getTime() - new Date(lastLogged).getTime()) / msPerDay);
      return gapDays > STREAK_GRACE_DAYS;
    });
  if (toReset.length === 0) return;

  const { error } = await supabaseAdmin.from('student_profiles').update({ streak: 0 }).in('user_id', toReset);
  if (error) {
    logger.error({ err: error }, 'Streak reset job failed');
    return;
  }
  logger.info({ count: toReset.length }, 'Streak reset job: reset streak for students inactive beyond the grace window');
}

export function startStreakResetJob() {
  // 18:30 UTC = 00:00 IST. A single-timezone assumption is fine for the
  // school-lab MVP (one country, one board, one timezone); revisit if a
  // school outside IST ever comes on board.
  cron.schedule('30 18 * * *', () => {
    resetBrokenStreaks().catch((err) => logger.error({ err }, 'Streak reset job crashed'));
  });
  logger.info('Streak reset job scheduled (daily, 18:30 UTC)');
}
