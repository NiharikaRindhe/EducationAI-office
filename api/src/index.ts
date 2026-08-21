import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './lib/env.js';
import { logger } from './lib/logger.js';
import { connectRedis, disconnectRedis, redisHealth } from './lib/redis.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { superAdminRouter } from './routes/superAdmin.routes.js';
import { schoolAdminRouter } from './routes/schoolAdmin.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { teacherRouter } from './routes/teacher.routes.js';
import { studentRouter } from './routes/student.routes.js';
import { labInchargeRouter } from './routes/labIncharge.routes.js';
import { ticketRouter } from './routes/ticket.routes.js';

// Background jobs deliberately do NOT run here — they live in their own
// process (src/worker.ts). Ingestion is a long synchronous block that used to
// freeze every in-flight student request when it ran in-process, and the cron
// jobs would double-fire from every replica. Keeping this process stateless is
// what makes it safe to run several API containers behind nginx.

const app = express();

app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
// 8mb: vision doubt-solving sends a base64 photo (~4MB image → ~5.4MB JSON)
app.use(express.json({ limit: '8mb' }));
app.use(pinoHttp({ logger }));

app.get('/health', async (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    env: env.nodeEnv,
    redis: await redisHealth(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/super-admin', superAdminRouter);
app.use('/api/school-admin', schoolAdminRouter);
app.use('/api/teacher', teacherRouter);
app.use('/api/student', studentRouter);
app.use('/api/lab-incharge', labInchargeRouter);
app.use('/api/tickets', ticketRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.port, () => {
  logger.info(`EduAI API listening on http://localhost:${env.port}`);
  void connectRedis();
});

// Rolling restarts and `docker compose up -d` send SIGTERM. Without this the
// process dies instantly and every request in flight — a student mid-exam
// submission, a teacher saving grades — fails with a connection reset. Stop
// accepting new connections, let the ones already open finish, then exit.
const SHUTDOWN_GRACE_MS = 15_000;

function shutdown(signal: string) {
  logger.info({ signal }, 'API shutting down…');
  server.close(() => {
    void disconnectRedis().finally(() => {
      logger.info('API stopped cleanly');
      process.exit(0);
    });
  });
  // A hung upstream (a stalled LLM call) must not keep the container alive
  // forever — past the grace period, exit anyway.
  setTimeout(() => {
    logger.warn('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, SHUTDOWN_GRACE_MS).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
