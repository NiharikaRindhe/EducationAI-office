import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createSchoolController,
  listSchoolsController,
  setSchoolActiveController,
  getOverviewController,
  getSchoolDetailController,
  updateSchoolController,
  addSchoolAdminController,
  resetSchoolAdminPasswordController,
  listAuditLogsController,
} from '../controllers/superAdmin.controller.js';
import {
  getAiSettingsController,
  updateAiSettingsController,
  getAiUsageController,
} from '../controllers/aiConsole.controller.js';
import {
  listGlobalQuestionBankController,
  addGlobalQuestionController,
  deleteGlobalQuestionController,
  bulkImportGlobalQuestionsController,
  listIngestionJobsController,
  uploadNcertPdfController,
  updateIngestionJobStatusController,
  retryIngestionJobController,
  deleteIngestionJobController,
} from '../controllers/superAdminContent.controller.js';
import {
  listClassSubjectsController,
  addClassSubjectController,
  removeClassSubjectController,
} from '../controllers/classSection.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  // Real NCERT PDFs routinely exceed 50MB once diagrams/maps are embedded
  // (e.g. a genuine Class 9 Social Science book is ~66MB) — 50MB rejected
  // legitimate uploads outright. 150MB gives real books headroom while still
  // being a bounded, sane ceiling (buffered in memory via memoryStorage()).
  limits: { fileSize: 150 * 1024 * 1024 },
});

export const superAdminRouter = Router();

superAdminRouter.use(requireAuth, requireRole('super_admin'));

// ── Overview ────────────────────────────────────────────────
superAdminRouter.get('/overview', getOverviewController);

// ── Schools ─────────────────────────────────────────────────
superAdminRouter.get('/schools', listSchoolsController);
superAdminRouter.post('/schools', createSchoolController);
superAdminRouter.get('/schools/:id', getSchoolDetailController);
superAdminRouter.patch('/schools/:id', updateSchoolController);
superAdminRouter.patch('/schools/:id/active', setSchoolActiveController);
superAdminRouter.post('/schools/:id/admins', addSchoolAdminController);
superAdminRouter.post('/schools/:id/admins/:userId/reset-password', resetSchoolAdminPasswordController);

// ── Audit log ───────────────────────────────────────────────
superAdminRouter.get('/audit-log', listAuditLogsController);

// ── AI Console ──────────────────────────────────────────────
superAdminRouter.get('/ai/settings', getAiSettingsController);
superAdminRouter.patch('/ai/settings', updateAiSettingsController);
superAdminRouter.get('/ai/usage', getAiUsageController);

// ── Class → Subject whitelist ──────────────────────────────────
superAdminRouter.get('/class-subjects', listClassSubjectsController);
superAdminRouter.post('/class-subjects', addClassSubjectController);
superAdminRouter.delete('/class-subjects/:classNum/:subject', removeClassSubjectController);

// ── Global question bank ─────────────────────────────────────
superAdminRouter.get('/question-bank', listGlobalQuestionBankController);
superAdminRouter.post('/question-bank', addGlobalQuestionController);
superAdminRouter.delete('/question-bank/:id', deleteGlobalQuestionController);
superAdminRouter.post(
  '/question-bank/import',
  upload.single('file'),
  bulkImportGlobalQuestionsController,
);

// ── NCERT ingestion ──────────────────────────────────────────
superAdminRouter.get('/ncert/jobs', listIngestionJobsController);
superAdminRouter.post('/ncert/upload', upload.single('file'), uploadNcertPdfController);
// Called by the pipeline worker to report stage progress
superAdminRouter.patch('/ncert/jobs/:id/status', updateIngestionJobStatusController);
// Re-queue a failed/finished job — the worker re-runs it idempotently
superAdminRouter.post('/ncert/jobs/:id/retry', retryIngestionJobController);
superAdminRouter.delete('/ncert/jobs/:id', deleteIngestionJobController);

