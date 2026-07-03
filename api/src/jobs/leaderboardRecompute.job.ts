import cron from 'node-cron';
import { supabaseAdmin } from '../lib/supabase.js';
import { computeLeaderboardForBatch } from '../services/leaderboard.service.js';
import { logger } from '../lib/logger.js';

async function recomputeAll() {
  const { data: schools } = await supabaseAdmin.from('schools').select('id').eq('is_active', true);

  for (const school of schools ?? []) {
    for (const batchId of [1, 2, 3]) {
      for (const period of ['weekly', 'monthly', 'all_time'] as const) {
        try {
          await computeLeaderboardForBatch(school.id, batchId, period);
        } catch (err) {
          logger.error({ err, schoolId: school.id, batchId, period }, 'Leaderboard recompute failed for one batch/period');
        }
      }
    }
  }
}

export function startLeaderboardRecomputeJob() {
  cron.schedule('0 * * * *', () => {
    recomputeAll().catch((err) => logger.error({ err }, 'Leaderboard recompute job crashed'));
  });
  logger.info('Leaderboard recompute job scheduled (hourly)');
}
