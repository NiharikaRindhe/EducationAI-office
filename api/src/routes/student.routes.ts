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
  listExamsForStudentController,
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
import {
  listMySubjectsController,
  createSessionController,
  listSessionsController,
  getHistoryController,
  sendMessageController,
  renameSessionController,
  deleteSessionController,
} from '../controllers/chat.controller.js';
import { rateLimit } from '../middleware/rateLimit.js';
import {
  getStudentBadgesController,
  getStudentStreakCalendarController,
  getStudentProfileController,
  updateStudentAvatarController,
  getDailyChallengesController,
  listPyqsController,
  getStudentCurriculumController,
} from '../controllers/student.controller.js';
import { listGamesForStudentController, submitGameAttemptController } from '../controllers/games.controller.js';
import { getMyStudentTimetableController, getMyStudentOccurrencesController } from '../controllers/timetable.controller.js';

export const studentRouter = Router();

studentRouter.use(requireAuth, requireRole('student'));

studentRouter.get('/badges', getStudentBadgesController);
studentRouter.get('/streak-calendar', getStudentStreakCalendarController);
studentRouter.get('/profile', getStudentProfileController);
studentRouter.patch('/profile/avatar', updateStudentAvatarController);
studentRouter.get('/daily-challenges', getDailyChallengesController);
studentRouter.get('/pyq', listPyqsController);

studentRouter.get('/games', listGamesForStudentController);
studentRouter.post('/games/:gameId/attempts', submitGameAttemptController);

studentRouter.get('/sessions/active', activeSessionForStudentController);
studentRouter.post('/sessions/join', joinSessionController);
studentRouter.patch('/sessions/:id/raise-hand', raiseHandController);

studentRouter.get('/announcements', listAnnouncementsForStudentController);

studentRouter.get('/tasks', listTasksForStudentController);
studentRouter.patch('/tasks/:id/status', cycleTaskStatusController);

studentRouter.get('/exams', listExamsForStudentController);
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

studentRouter.get('/subjects', listMySubjectsController);
studentRouter.get('/curriculum', getStudentCurriculumController);
studentRouter.get('/timetable', getMyStudentTimetableController);
studentRouter.get('/timetable/occurrences', getMyStudentOccurrencesController);

const chatLimiter = rateLimit({ windowMs: 24 * 60 * 60_000, max: 50, keyFn: (req) => `chat:${req.user!.id}` });

studentRouter.post('/chat/sessions', createSessionController);
studentRouter.get('/chat/sessions', listSessionsController);
studentRouter.patch('/chat/sessions/:id', renameSessionController);
studentRouter.delete('/chat/sessions/:id', deleteSessionController);
studentRouter.get('/chat/sessions/:id/history', getHistoryController);
studentRouter.post('/chat/sessions/:id/message', chatLimiter, sendMessageController);
