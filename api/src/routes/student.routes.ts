import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  activeSessionForStudentController,
  joinSessionController,
  raiseHandController,
} from '../controllers/liveSession.controller.js';
import { listAnnouncementsForStudentController } from '../controllers/announcement.controller.js';
import { listTasksForStudentController, cycleTaskStatusController } from '../controllers/task.controller.js';
import {
  getExamPaperController,
  saveAnswerController,
  proctorEventController,
  submitExamController,
} from '../controllers/examTaking.controller.js';

export const studentRouter = Router();

studentRouter.use(requireAuth, requireRole('student'));

studentRouter.get('/sessions/active', activeSessionForStudentController);
studentRouter.post('/sessions/join', joinSessionController);
studentRouter.patch('/sessions/:id/raise-hand', raiseHandController);

studentRouter.get('/announcements', listAnnouncementsForStudentController);

studentRouter.get('/tasks', listTasksForStudentController);
studentRouter.patch('/tasks/:id/status', cycleTaskStatusController);

studentRouter.get('/exams/:examId/paper', getExamPaperController);
studentRouter.put('/exam-submissions/:submissionId/answer', saveAnswerController);
studentRouter.post('/exam-submissions/:submissionId/submit', submitExamController);
studentRouter.post('/proctor-event', proctorEventController);
