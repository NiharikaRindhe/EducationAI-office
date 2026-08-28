import { hostname } from 'node:os';
import { supabaseAdmin } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { extractPageTexts } from '../lib/pdfExtract.js';
import { NCERT_BUCKET } from '../services/superAdminContent.service.js';
import { upsertSimPage, processPageIngestion } from '../services/simIngest.service.js';

// ─────────────────────────────────────────────────────────────
//  SIMULATING WORKER — poll loop, runs in the same worker process as
//  ingestionWorker.job.ts (src/worker.ts), on its own decoupled queue.
//
//  Deliberately NOT folded into the RAG ingestion pipeline: a book's
//  `status` reaching 'done' means "the AI tutor can answer from this
//  book" and must not wait on simulation tagging. `sim_status` is its
//  own lane (claim_next_sim_job / requeue_stale_sim_jobs).
//
//  Placement is hardcoded page metadata (ncertPageTags) — no LLM per page.
// ─────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 15_000;
const PAGE_CONCURRENCY = 8;
const WORKER_ID = `${hostname()}:${process.pid}`;

let busy = false;
let stopping = false;
let timer: NodeJS.Timeout | null = null;
let sweepTimer: NodeJS.Timeout | null = null;

interface ClaimedSimJob {
  id: string;
  class_num: number;
  subject: string;
  book_title: string;
  storage_path: string | null;
  school_id: string | null;
}

async function requeueStaleJobs() {
  const { data, error } = await supabaseAdmin.rpc('requeue_stale_sim_jobs');
  if (error) {
    logger.error({ error: error.message }, '[sim-worker] failed to requeue stale jobs');
  } else if (data && data.length > 0) {
    logger.warn({ jobIds: data.map((j: { id: string }) => j.id) }, '[sim-worker] requeued jobs abandoned by a dead worker');
  }
}

async function updateSimStatus(
  jobId: string,
  update: { sim_status: 'running' | 'ready' | 'error'; sim_pages_total?: number; sim_pages_done?: number; sim_error?: string },
): Promise<void> {
  const payload: Record<string, unknown> = { sim_status: update.sim_status };
  if (update.sim_pages_total !== undefined) payload.sim_pages_total = update.sim_pages_total;
  if (update.sim_pages_done !== undefined) payload.sim_pages_done = update.sim_pages_done;
  if (update.sim_error !== undefined) payload.sim_error = update.sim_error;
  // Lock lifecycle mirrors ingestionWorker.job.ts's own status writes: a
  // terminal state releases the lock so a retry can claim cleanly.
  if (update.sim_status === 'running') {
    payload.sim_locked_at = new Date().toISOString();
  } else {
    payload.sim_locked_at = null;
    payload.sim_locked_by = null;
  }
  const { error } = await supabaseAdmin.from('ncert_ingestion_jobs').update(payload).eq('id', jobId);
  if (error) logger.error({ error: error.message, jobId }, '[sim-worker] failed to update sim_status');
}

async function runSimPipeline(job: ClaimedSimJob): Promise<void> {
  if (!job.storage_path) throw new Error('Job has no stored PDF to simulate');

  const { data: pdfBlob, error: downloadError } = await supabaseAdmin.storage.from(NCERT_BUCKET).download(job.storage_path);
  if (downloadError || !pdfBlob) throw new Error(`Could not download PDF from storage: ${downloadError?.message}`);
  const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

  const pages = await extractPageTexts(pdfBuffer);

  // Idempotent re-run: this job's previously-simulated pages/annotations go
  // away before re-insert, matching the RAG pipeline's own delete-then-
  // insert-per-book convention (runIngestionPipeline in
  // superAdminContent.service.ts).
  await supabaseAdmin.from('sim_annotations').delete().eq('job_id', job.id);
  await supabaseAdmin.from('sim_pages').delete().eq('job_id', job.id);

  await updateSimStatus(job.id, { sim_status: 'running', sim_pages_total: pages.length, sim_pages_done: 0 });

  // Bounded-concurrency pool: PAGE_CONCURRENCY lanes each pull the next
  // unclaimed page off the shared `next` cursor and run it to completion.
  // `next`/`done` are only ever touched between `await`s, never inside a
  // multi-step critical section, so JS's single-threaded execution keeps
  // them race-free despite the concurrent lanes — no locking needed.
  let next = 0;
  let done = 0;
  async function lane(): Promise<void> {
    while (next < pages.length) {
      const page = pages[next++];
      if (!page) continue;
      await upsertSimPage(job.id, page.pageNumber, page.text, page.wordCount);

      if (page.text.trim()) {
        try {
          await processPageIngestion({
            jobId: job.id,
            pageNumber: page.pageNumber,
            pageText: page.text,
            classNum: job.class_num,
            subject: job.subject,
            bookTitle: job.book_title,
          });
        } catch (err) {
          logger.warn({ err, jobId: job.id, pageNumber: page.pageNumber }, '[sim-worker] page tagging failed — continuing');
        }
      }

      done += 1;
      // Progress writes from different lanes can land out of order (network
      // latency varies per request) — worst case the done-count flickers
      // back down by a page or two on the Content Portal for a moment. Not
      // worth an atomic RPC to prevent; the terminal write below is what
      // actually has to be correct, and it only happens once, after every
      // lane has finished.
      await updateSimStatus(job.id, { sim_status: 'running', sim_pages_done: done });
    }
  }

  await Promise.all(Array.from({ length: Math.min(PAGE_CONCURRENCY, pages.length) }, () => lane()));

  await updateSimStatus(job.id, { sim_status: 'ready', sim_pages_done: done });
}

async function processNextJob() {
  if (busy || stopping) return;
  busy = true;
  try {
    const { data, error } = await supabaseAdmin.rpc('claim_next_sim_job', { worker_id: WORKER_ID });
    if (error) {
      logger.error({ error: error.message }, '[sim-worker] failed to claim a job');
      return;
    }
    const job = (data as ClaimedSimJob[] | null)?.[0];
    if (!job) return;

    logger.info({ jobId: job.id, book: job.book_title }, '[sim-worker] starting job');
    try {
      await runSimPipeline(job);
      logger.info({ jobId: job.id, book: job.book_title }, '[sim-worker] job done');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await updateSimStatus(job.id, { sim_status: 'error', sim_error: message });
      logger.error({ err, jobId: job.id }, '[sim-worker] job failed');
    }
  } finally {
    busy = false;
  }
}

/** Independent of POLL_INTERVAL_MS: this only needs to run often enough to
 *  reclaim a job abandoned by a worker that died mid-run (crash, or — as
 *  found while debugging a slow book locally — a dev-server restart mid-job)
 *  well before a student notices. Only ran once at boot until now, which
 *  meant a job could sit orphaned for up to the full 15-minute staleness
 *  window if no restart happened to trigger another boot in the meantime. */
const REQUEUE_SWEEP_MS = 5 * 60_000;

export function startSimWorker() {
  void requeueStaleJobs();
  void processNextJob();
  timer = setInterval(() => void processNextJob(), POLL_INTERVAL_MS);
  sweepTimer = setInterval(() => void requeueStaleJobs(), REQUEUE_SWEEP_MS);
  logger.info({ workerId: WORKER_ID }, `[sim-worker] polling every ${POLL_INTERVAL_MS / 1000}s`);
}

/** Stops polling and waits for the in-flight book to finish, so a redeploy
 *  doesn't leave a half-simulated book to be re-run from scratch. */
export async function stopSimWorker(): Promise<void> {
  stopping = true;
  if (timer) clearInterval(timer);
  if (sweepTimer) clearInterval(sweepTimer);
  if (!busy) return;
  logger.info('[sim-worker] waiting for the in-flight job to finish…');
  while (busy) await new Promise((resolve) => setTimeout(resolve, 500));
}
