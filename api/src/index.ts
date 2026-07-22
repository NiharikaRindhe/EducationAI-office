import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './lib/env.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { superAdminRouter } from './routes/superAdmin.routes.js';
import { schoolAdminRouter } from './routes/schoolAdmin.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { teacherRouter } from './routes/teacher.routes.js';
import { studentRouter } from './routes/student.routes.js';
import { labInchargeRouter } from './routes/labIncharge.routes.js';
import { ticketRouter } from './routes/ticket.routes.js';
import { startStreakResetJob } from './jobs/streakReset.job.js';
import { startLeaderboardRecomputeJob } from './jobs/leaderboardRecompute.job.js';
import { startIngestionWorker } from './jobs/ingestionWorker.job.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
// 8mb: vision doubt-solving sends a base64 photo (~4MB image → ~5.4MB JSON)
app.use(express.json({ limit: '8mb' }));
app.use(pinoHttp({ logger }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), env: env.nodeEnv });
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

app.listen(env.port, () => {
  logger.info(`EduAI API listening on http://localhost:${env.port}`);
  startStreakResetJob();
  startLeaderboardRecomputeJob();
  startIngestionWorker();
});
