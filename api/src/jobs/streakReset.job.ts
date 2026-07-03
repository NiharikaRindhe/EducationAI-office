import cron from 'node-cron';
import { supabaseAdmin } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

/** Any student with no streak_logs row for today gets their streak zeroed. Runs once daily, just after midnight IST (18:30 UTC). */
async function resetBrokenStreaks() {
  const today = new Date().toISOString().slice(0, 10);

  const { data: loggedToday } = await supabaseAdmin.from('streak_logs').select('student_id').eq('logged_date', today);
  const loggedIds = new Set((loggedToday ?? []).map((r) => r.student_id));

  const { data: activeStreaks } = await supabaseAdmin.from('student_profiles').select('user_id').gt('streak', 0);

  const toReset = (activeStreaks ?? []).map((s) => s.user_id).filter((id) => !loggedIds.has(id));
  if (toReset.length === 0) return;

  const { error } = await supabaseAdmin.from('student_profiles').update({ streak: 0 }).in('user_id', toReset);
  if (error) {
    logger.error({ err: error }, 'Streak reset job failed');
    return;
  }
  logger.info({ count: toReset.length }, 'Streak reset job: reset streak for inactive students');
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
