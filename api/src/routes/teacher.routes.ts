import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  dashboardController,
  listStudentsController,
  studentDrillDownController,
  atRiskController,
} from '../controllers/teacher.controller.js';
import {
  startSessionController,
  endSessionController,
  activeSessionForTeacherController,
  participantsController,
} from '../controllers/liveSession.controller.js';
import { createAnnouncementController, deleteAnnouncementController } from '../controllers/announcement.controller.js';
import { createTaskController, listTasksForTeacherController } from '../controllers/task.controller.js';
import { addToBankController, listBankController } from '../controllers/questionBank.controller.js';
import {
  createExamController,
  listExamsController,
  getExamController,
  addQuestionController,
  addQuestionsFromBankController,
  removeQuestionController,
  publishExamController,
  closeExamController,
} from '../controllers/exam.controller.js';
import {
  listSubmissionsController,
  getSubmissionDetailController,
  finalizeAnswerScoreController,
  getMeritListController,
} from '../controllers/examReview.controller.js';
import { recomputeLeaderboardController } from '../controllers/leaderboard.controller.js';
import { downloadAllAdmitCardsController } from '../controllers/admitCard.controller.js';

export const teacherRouter = Router();

teacherRouter.use(requireAuth, requireRole('teacher'));

teacherRouter.get('/dashboard', dashboardController);
teacherRouter.get('/students', listStudentsController);
teacherRouter.get('/students/:id', studentDrillDownController);
teacherRouter.get('/at-risk', atRiskController);

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

teacherRouter.post('/exams', createExamController);
teacherRouter.get('/exams', listExamsController);
teacherRouter.get('/exams/:id', getExamController);
teacherRouter.post('/exams/:id/questions', addQuestionController);
teacherRouter.post('/exams/:id/questions/from-bank', addQuestionsFromBankController);
teacherRouter.delete('/exams/:examId/questions/:questionId', removeQuestionController);
teacherRouter.post('/exams/:id/publish', publishExamController);
teacherRouter.post('/exams/:id/close', closeExamController);

teacherRouter.get('/exams/:examId/submissions', listSubmissionsController);
teacherRouter.get('/exams/:examId/submissions/:submissionId', getSubmissionDetailController);
teacherRouter.put('/exams/:examId/answers/:answerId/score', finalizeAnswerScoreController);
teacherRouter.get('/exams/:examId/merit-list', getMeritListController);

teacherRouter.post('/leaderboard/recompute', recomputeLeaderboardController);

teacherRouter.get('/exams/:examId/admit-cards', downloadAllAdmitCardsController);
