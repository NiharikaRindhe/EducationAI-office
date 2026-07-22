import { supabaseAdmin } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { runIngestionPipeline } from '../services/superAdminContent.service.js';

// ─────────────────────────────────────────────────────────────
//  NCERT INGESTION WORKER — in-process poll loop.
//
//  The ncert_ingestion_jobs table IS the queue: it survives
//  restarts, the portal dashboard reads it directly, and a school
//  server doesn't need Redis/BullMQ for a task that runs ~30-40
//  times total (once per book) before a school year starts.
//
//  Single concurrency on purpose: ingestion is CPU-heavy (PDF
//  parsing + embedding) and is an admin task done before rollout,
//  not during a lab period — it must never compete with live
//  chat/exam traffic for the box.
// ─────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 15_000;

let busy = false;

/** Jobs stranded mid-stage by a crash/restart go back to the queue — safe
 *  because every pipeline run is idempotent (delete-then-insert per book). */
async function requeueStrandedJobs() {
  const { data, error } = await supabaseAdmin
    .from('ncert_ingestion_jobs')
    .update({ status: 'queued' })
    .in('status', ['chunking', 'embedding'])
    .select('id');
  if (error) {
    logger.error({ error: error.message }, '[ingestion-worker] failed to requeue stranded jobs');
  } else if (data && data.length > 0) {
    logger.warn({ jobIds: data.map((j) => j.id) }, '[ingestion-worker] requeued jobs stranded by a restart');
  }
}

async function processNextJob() {
  if (busy) return;
  busy = true;
  try {
    const { data: job } = await supabaseAdmin
      .from('ncert_ingestion_jobs')
      .select('id, book_title, class_num, subject')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!job) return;

    logger.info({ jobId: job.id, book: job.book_title }, '[ingestion-worker] starting job');
    await runIngestionPipeline(job.id);
    logger.info({ jobId: job.id, book: job.book_title }, '[ingestion-worker] job done');
  } catch (err) {
    // runIngestionPipeline already wrote status='error' + message to the job row.
    logger.error({ err }, '[ingestion-worker] job failed');
  } finally {
    busy = false;
  }
}

export function startIngestionWorker() {
  void requeueStrandedJobs();
  setInterval(() => void processNextJob(), POLL_INTERVAL_MS);
  logger.info(`[ingestion-worker] polling every ${POLL_INTERVAL_MS / 1000}s`);
}
