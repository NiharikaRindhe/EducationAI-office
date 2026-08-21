import { hostname } from 'node:os';
import { supabaseAdmin } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { runIngestionPipeline } from '../services/superAdminContent.service.js';

// ─────────────────────────────────────────────────────────────
//  NCERT INGESTION WORKER — poll loop, runs in its OWN process
//  (src/worker.ts), never inside the API.
//
//  Why its own process: PDF extraction is a long synchronous
//  loop with no await inside it, so hosting it in the API meant
//  one book upload froze the event loop and every student's chat,
//  exam submission and page load stalled until it finished. The
//  jobs table is still the queue (it survives restarts and the
//  portal reads it directly for the progress bar) — no Redis
//  needed — but claiming is now atomic in Postgres so the worker
//  is safe to restart, redeploy, or (if ingestion ever becomes
//  the bottleneck) run more than one of.
//
//  Concurrency stays at one job per process on purpose: ingestion
//  is CPU-heavy, and the point of moving it out was to stop it
//  competing with anything else, not to make it race itself.
// ─────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 15_000;
/** Identifies which worker holds a job's lock — shows up in ncert_ingestion_jobs.locked_by. */
const WORKER_ID = `${hostname()}:${process.pid}`;

let busy = false;
let stopping = false;
let timer: NodeJS.Timeout | null = null;

interface ClaimedJob {
  id: string;
  book_title: string;
  class_num: number;
  subject: string;
}

/** Jobs whose worker died mid-stage go back to the queue — but only once their
 *  lock has genuinely gone stale. A booting worker must never requeue a job
 *  another live worker is still processing (see the migration comment: the
 *  pipeline is delete-then-insert per book, so two workers on one book
 *  silently corrupt it). Safe to re-run: every pipeline run is idempotent. */
async function requeueStaleJobs() {
  const { data, error } = await supabaseAdmin.rpc('requeue_stale_ingestion_jobs');
  if (error) {
    logger.error({ error: error.message }, '[ingestion-worker] failed to requeue stale jobs');
  } else if (data && data.length > 0) {
    logger.warn({ jobIds: data.map((j: { id: string }) => j.id) }, '[ingestion-worker] requeued jobs abandoned by a dead worker');
  }
}

async function processNextJob() {
  if (busy || stopping) return;
  busy = true;
  try {
    // Atomic: sets status='chunking' and stamps the lock in the same statement
    // that selects the row, so a second worker polling this instant skips it.
    const { data, error } = await supabaseAdmin.rpc('claim_next_ingestion_job', { worker_id: WORKER_ID });
    if (error) {
      logger.error({ error: error.message }, '[ingestion-worker] failed to claim a job');
      return;
    }
    const job = (data as ClaimedJob[] | null)?.[0];
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
  void requeueStaleJobs();
  void processNextJob();
  timer = setInterval(() => void processNextJob(), POLL_INTERVAL_MS);
  logger.info({ workerId: WORKER_ID }, `[ingestion-worker] polling every ${POLL_INTERVAL_MS / 1000}s`);
}

/** Stops polling and waits for the in-flight book to finish, so a redeploy
 *  doesn't leave a half-ingested book to be re-run from scratch 15 minutes
 *  later. Resolves immediately when idle. */
export async function stopIngestionWorker(): Promise<void> {
  stopping = true;
  if (timer) clearInterval(timer);
  if (!busy) return;
  logger.info('[ingestion-worker] waiting for the in-flight job to finish…');
  while (busy) await new Promise((resolve) => setTimeout(resolve, 500));
}
