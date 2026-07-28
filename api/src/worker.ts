import http from 'node:http';
import { env } from './lib/env.js';
import { logger } from './lib/logger.js';
import { startStreakResetJob } from './jobs/streakReset.job.js';
import { startLeaderboardRecomputeJob } from './jobs/leaderboardRecompute.job.js';
import { startIngestionWorker, stopIngestionWorker } from './jobs/ingestionWorker.job.js';

// ─────────────────────────────────────────────────────────────
//  BACKGROUND WORKER — every scheduled/queued job, in a process
//  of its own. Same image as the API, different entrypoint.
//
//  These used to start inside app.listen(), which had two costs
//  once more than one student is using the platform at a time:
//
//   1. NCERT ingestion (PDF extract → chunk → embed) is a long
//      synchronous block. Sharing a process with the API meant
//      one book upload froze every in-flight request for that
//      whole school until it finished.
//   2. It pinned the API to exactly one replica. The cron jobs
//      below are not idempotent-by-design — running them from N
//      API containers would recompute every leaderboard N times
//      concurrently and race each other's writes — so the API
//      could never be scaled out while it owned them.
//
//  Splitting them means the API is now stateless and free to run
//  as many replicas as the load needs, and heavy ingestion can
//  never touch student-facing latency.
//
//  IMPORTANT: run exactly ONE of these. Ingestion itself is safe
//  to run concurrently (jobs are claimed atomically — see
//  migration 20250101000130), but the cron jobs here are not:
//  a second worker would double-fire them.
// ─────────────────────────────────────────────────────────────

startStreakResetJob();
startLeaderboardRecomputeJob();
startIngestionWorker();

// Minimal health endpoint so Docker/orchestrators can tell a live worker from
// a crash-looping one. Deliberately not Express — this serves one route and
// must stay responsive while the ingestion loop is busy.
const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', role: 'worker', uptime: process.uptime() }));
    return;
  }
  res.writeHead(404).end();
});

healthServer.listen(env.workerPort, () => {
  logger.info(`EduAI worker running (health on :${env.workerPort})`);
});

// Finish the book we're in the middle of rather than abandoning it for the
// stale-lock sweep to re-run from scratch 15 minutes later.
async function shutdown(signal: string) {
  logger.info({ signal }, 'Worker shutting down…');
  healthServer.close();
  await stopIngestionWorker();
  logger.info('Worker stopped cleanly');
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
