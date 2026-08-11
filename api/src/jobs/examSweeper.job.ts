import { supabaseAdmin } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { gradeSubmission } from '../services/grading.service.js';

/**
 * EXAM SWEEPER — two safety nets that must not live on a request path.
 *
 * 1. EXPIRY. An attempt whose deadline passed while the student's browser was
 *    closed, crashed, or simply abandoned would otherwise sit `submitted_at
 *    null` forever: never graded, never in the merit list, and blocking the
 *    student from ever reopening the paper. Answers already saved are kept —
 *    the sweep only closes the attempt and queues grading.
 *
 * 2. GRADING RETRY. submitExam() commits the submission and fires grading
 *    best-effort, so an AI provider outage no longer fails a student's
 *    submit. That only works if something eventually retries — this does.
 *
 * Runs in the singleton worker. Both queries claim rows by flipping state
 * before doing work, so a second worker (which shouldn't exist, but might
 * during a rolling deploy) cannot double-process the same row.
 */

const SWEEP_INTERVAL_MS = 60_000;
const GRADING_BATCH = 5;
/** Give up after this many tries so one poison submission can't be retried
 *  forever. It stays 'failed' with its error for a human to look at. */
const MAX_GRADING_ATTEMPTS = 5;

let timer: NodeJS.Timeout | null = null;
let running = false;

async function autoSubmitExpired(): Promise<number> {
  const nowIso = new Date().toISOString();

  const { data: expired, error } = await supabaseAdmin
    .from('exam_submissions')
    .select('id')
    .is('submitted_at', null)
    .not('deadline_at', 'is', null)
    .lt('deadline_at', nowIso)
    .limit(50);

  if (error) {
    logger.error({ err: error.message }, '[exam-sweeper] failed to query expired attempts');
    return 0;
  }
  if (!expired || expired.length === 0) return 0;

  let closed = 0;
  for (const row of expired) {
    // Re-assert `submitted_at is null` in the UPDATE itself: if the student
    // submitted between our SELECT and now, this matches nothing and we
    // correctly leave their real submission alone.
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('exam_submissions')
      .update({
        submitted_at: nowIso,
        auto_submitted: true,
        auto_submit_reason: 'expired',
        grading_status: 'pending',
      })
      .eq('id', row.id)
      .is('submitted_at', null)
      .select('id');

    if (updateError) {
      logger.error({ id: row.id, err: updateError.message }, '[exam-sweeper] auto-submit failed');
      continue;
    }
    if (updated && updated.length > 0) closed += 1;
  }

  if (closed > 0) logger.info({ closed }, '[exam-sweeper] auto-submitted expired attempts');
  return closed;
}

async function retryPendingGrading(): Promise<number> {
  const { data: pending, error } = await supabaseAdmin
    .from('exam_submissions')
    .select('id, grading_attempts')
    .not('submitted_at', 'is', null)
    .in('grading_status', ['pending', 'failed'])
    .lt('grading_attempts', MAX_GRADING_ATTEMPTS)
    .limit(GRADING_BATCH);

  if (error) {
    logger.error({ err: error.message }, '[exam-sweeper] failed to query ungraded submissions');
    return 0;
  }
  if (!pending || pending.length === 0) return 0;

  let graded = 0;
  for (const row of pending) {
    try {
      // gradeSubmission owns its own state transitions (in_progress → graded
      // / failed) and increments the attempt counter, so a permanently
      // failing row eventually exceeds MAX_GRADING_ATTEMPTS and drops out of
      // this query instead of spinning forever.
      await gradeSubmission(row.id as string);
      graded += 1;
    } catch {
      /* already recorded on the row by gradeSubmission */
    }
  }

  if (graded > 0) logger.info({ graded }, '[exam-sweeper] graded pending submissions');
  return graded;
}

async function sweep() {
  if (running) return; // a slow AI batch must not stack overlapping sweeps
  running = true;
  try {
    await autoSubmitExpired();
    await retryPendingGrading();
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, '[exam-sweeper] sweep failed');
  } finally {
    running = false;
  }
}

export function startExamSweeper() {
  logger.info(`[exam-sweeper] polling every ${SWEEP_INTERVAL_MS / 1000}s`);
  timer = setInterval(() => void sweep(), SWEEP_INTERVAL_MS);
  void sweep();
}

export function stopExamSweeper() {
  if (timer) clearInterval(timer);
  timer = null;
}
