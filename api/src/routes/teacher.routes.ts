import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { requireFeature } from '../middleware/requireFeature.js';
import {
  dashboardController,
  listStudentsController,
  studentDrillDownController,
  atRiskController,
  mySectionsController,
} from '../controllers/teacher.controller.js';
import {
  startSessionController,
  endSessionController,
  activeSessionForTeacherController,
  participantsController,
} from '../controllers/liveSession.controller.js';
import { createAnnouncementController, deleteAnnouncementController } from '../controllers/announcement.controller.js';
import {
  teacherListController,
  teacherIdsController,
  teacherExportController,
} from '../controllers/studentDirectory.controller.js';
import { createTaskController, listTasksForTeacherController } from '../controllers/task.controller.js';
import { addToBankController, listBankController } from '../controllers/questionBank.controller.js';
import {
  createExamController,
  listExamsController,
  getExamController,
  duplicateExamController,
  addQuestionController,
  addQuestionsFromBankController,
  removeQuestionController,
  publishExamController,
  updateDraftExamController,
  deleteDraftExamController,
  setResultsReleasedController,
  closeExamController,
} from '../controllers/exam.controller.js';
import {
  listPendingReviewsController,
  listSubmissionsController,
  getSubmissionDetailController,
  finalizeAnswerScoreController,
  getMeritListController,
} from '../controllers/examReview.controller.js';
import {
  listGeneratableChaptersController,
  generateQuestionsController,
  saveGeneratedQuestionsController,
} from '../controllers/examGenerator.controller.js';
import { deleteFromBankController } from '../controllers/questionBank.controller.js';
import { recomputeLeaderboardController } from '../controllers/leaderboard.controller.js';
import { downloadAllAdmitCardsController } from '../controllers/admitCard.controller.js';
import {
  getClassPerformanceHeatmapController,
  getEnglishAssessmentReportController,
  getTaskCompletionMatrixController,
  getPtmReportController,
} from '../controllers/teacherReport.controller.js';
import {
  getMyTeacherTimetableController,
  createExceptionController,
  getMyTeacherOccurrencesController,
} from '../controllers/timetable.controller.js';
import { listLabsController } from '../controllers/lab.controller.js';

export const teacherRouter = Router();

teacherRouter.use(requireAuth, requireRole('teacher'));

teacherRouter.get('/dashboard', dashboardController);
teacherRouter.get('/my-sections', mySectionsController);
// Paged roster for the directory table, scoped to this teacher's sections.
// Declared before /students/:id so "directory" isn't captured as an id.
teacherRouter.get('/students/directory', teacherListController);
teacherRouter.get('/students/directory/ids', teacherIdsController);
teacherRouter.get('/students/directory/export', teacherExportController);

teacherRouter.get('/students', listStudentsController);
teacherRouter.get('/students/:id', studentDrillDownController);
teacherRouter.get('/at-risk', atRiskController);
teacherRouter.get('/timetable', getMyTeacherTimetableController);
teacherRouter.get('/timetable/occurrences', getMyTeacherOccurrencesController);
teacherRouter.post('/timetable/:slotId/exceptions', createExceptionController);
teacherRouter.get('/labs', requireFeature('virtual_labs'), listLabsController);

teacherRouter.post('/sessions/start', startSessionController);
teacherRouter.post('/sessions/:id/end', endSessionController);
teacherRouter.get('/sessions/active', activeSessionForTeacherController);
teacherRouter.get('/sessions/:id/participants', participantsController);

teacherRouter.post('/announcements', createAnnouncementController);
teacherRouter.delete('/announcements/:id', deleteAnnouncementController);

teacherRouter.post('/tasks', createTaskController);
teacherRouter.get('/tasks', listTasksForTeacherController);

teacherRouter.post('/question-bank', addToBankController);
teacherRouter.get('/question-bank', listBankController);
// A teacher may delete their own school's questions (never global EduAI ones).
teacherRouter.delete('/question-bank/:id', deleteFromBankController);

// ── AI question generation from uploaded books ────────────────
// Generation never persists; the teacher reviews and then POSTs /save.
teacherRouter.get('/exam-generator/chapters', requireFeature('ai_exam_generator'), listGeneratableChaptersController);
teacherRouter.post('/exam-generator/generate', requireFeature('ai_exam_generator'), generateQuestionsController);
teacherRouter.post('/exam-generator/save', requireFeature('ai_exam_generator'), saveGeneratedQuestionsController);

// Exams with subjective answers still awaiting this teacher's sign-off.
teacherRouter.get('/pending-reviews', listPendingReviewsController);

teacherRouter.post('/exams', createExamController);
teacherRouter.get('/exams', listExamsController);
teacherRouter.get('/exams/:id', getExamController);
teacherRouter.patch('/exams/:id', updateDraftExamController);
teacherRouter.delete('/exams/:id', deleteDraftExamController);
teacherRouter.post('/exams/:id/results-released', setResultsReleasedController);
teacherRouter.post('/exams/:id/questions', addQuestionController);
teacherRouter.post('/exams/:id/questions/from-bank', addQuestionsFromBankController);
teacherRouter.delete('/exams/:examId/questions/:questionId', removeQuestionController);
teacherRouter.post('/exams/:id/publish', publishExamController);
teacherRouter.post('/exams/:id/close', closeExamController);
teacherRouter.post('/exams/:id/duplicate', duplicateExamController);

teacherRouter.get('/exams/:examId/submissions', listSubmissionsController);
teacherRouter.get('/exams/:examId/submissions/:submissionId', getSubmissionDetailController);
teacherRouter.put('/exams/:examId/answers/:answerId/score', finalizeAnswerScoreController);
teacherRouter.get('/exams/:examId/merit-list', getMeritListController);

teacherRouter.post('/leaderboard/recompute', requireFeature('leaderboard'), recomputeLeaderboardController);

teacherRouter.get('/exams/:examId/admit-cards', downloadAllAdmitCardsController);

teacherRouter.get('/reports/performance', requireFeature('reports_analytics'), getClassPerformanceHeatmapController);
teacherRouter.get('/reports/english', requireFeature('reports_analytics'), getEnglishAssessmentReportController);
teacherRouter.get('/reports/tasks', requireFeature('reports_analytics'), getTaskCompletionMatrixController);
teacherRouter.get('/reports/ptm', requireFeature('reports_analytics'), getPtmReportController);
