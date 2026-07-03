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
import {
  createNoteController,
  listNotesController,
  updateNoteController,
  deleteNoteController,
} from '../controllers/note.controller.js';
import { getLeaderboardForStudentController } from '../controllers/leaderboard.controller.js';
import { downloadOwnAdmitCardController } from '../controllers/admitCard.controller.js';
import { getItemsController, submitAttemptController, getProgressController } from '../controllers/english.controller.js';

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

studentRouter.post('/notes', createNoteController);
studentRouter.get('/notes', listNotesController);
studentRouter.put('/notes/:id', updateNoteController);
studentRouter.delete('/notes/:id', deleteNoteController);

studentRouter.get('/leaderboard', getLeaderboardForStudentController);

studentRouter.get('/exams/:examId/admit-card', downloadOwnAdmitCardController);

studentRouter.get('/english/items', getItemsController);
studentRouter.post('/english/submit', submitAttemptController);
studentRouter.get('/english/progress', getProgressController);
