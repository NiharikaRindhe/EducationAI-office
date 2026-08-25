import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { requireFeature } from '../middleware/requireFeature.js';
import {
  activeSessionForStudentController,
  joinSessionController,
  joinByCodeController,
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
import { getStudentSyllabusController } from '../controllers/syllabus.controller.js';
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
import { craftCompoundController, freeReactController } from '../controllers/chemistryLab.controller.js';
import { getMyStudentTimetableController, getMyStudentOccurrencesController } from '../controllers/timetable.controller.js';
import {
  listBooksController,
  getPdfUrlController,
  getAnnotationsController,
  chatController,
  explainController,
  explainSelectionController,
  generateController,
  simBriefController,
  listNotesController as listSimNotesController,
  createNoteController as createSimNoteController,
  updateNoteController as updateSimNoteController,
  deleteNoteController as deleteSimNoteController,
} from '../controllers/sim.controller.js';

export const studentRouter = Router();

studentRouter.use(requireAuth, requireRole('student'));

studentRouter.get('/badges', getStudentBadgesController);
studentRouter.get('/streak-calendar', getStudentStreakCalendarController);
studentRouter.get('/profile', getStudentProfileController);
studentRouter.patch('/profile/avatar', updateStudentAvatarController);
studentRouter.get('/daily-challenges', getDailyChallengesController);
studentRouter.get('/pyq', requireFeature('pyq_hub'), listPyqsController);

studentRouter.get('/games', requireFeature('games'), listGamesForStudentController);
studentRouter.post('/games/:gameId/attempts', requireFeature('games'), submitGameAttemptController);

// Paths mirror the original EducationAI-Games-master FastAPI endpoints so the
// ported Chemistry Lab UI calls them with only its base-URL constant changed.
const chemistryLimiter = rateLimit({ windowMs: 60 * 60_000, max: 40, keyFn: (req) => `chem:${req.user!.id}` });
studentRouter.post('/chemistry/craft_compound', requireFeature('virtual_labs'), chemistryLimiter, craftCompoundController);
studentRouter.post('/chemistry/free_react', requireFeature('virtual_labs'), chemistryLimiter, freeReactController);

studentRouter.get('/sessions/active', activeSessionForStudentController);
studentRouter.post('/sessions/join', joinSessionController);
// Lab sessions are joined by code, because students in a lab period may come
// from more than one section and roster membership is no longer the gate.
studentRouter.post('/sessions/join-by-code', joinByCodeController);
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

studentRouter.get('/leaderboard', requireFeature('leaderboard'), getLeaderboardForStudentController);

studentRouter.get('/exams/:examId/admit-card', downloadOwnAdmitCardController);

studentRouter.get('/english/items', requireFeature('games'), getItemsController);
studentRouter.post('/english/submit', requireFeature('games'), submitAttemptController);
studentRouter.get('/english/progress', requireFeature('games'), getProgressController);

studentRouter.get('/subjects', listMySubjectsController);
studentRouter.get('/curriculum', getStudentCurriculumController);
// Classes 5-10 syllabus, derived from the school's indexed books rather than
// the Batch-1-only `curriculum_chapters` seed. See syllabus.service.ts.
studentRouter.get('/syllabus', getStudentSyllabusController);
studentRouter.get('/timetable', getMyStudentTimetableController);
studentRouter.get('/timetable/occurrences', getMyStudentOccurrencesController);

const chatLimiter = rateLimit({ windowMs: 24 * 60 * 60_000, max: 50, keyFn: (req) => `chat:${req.user!.id}` });

// Every chat path is gated, not just the message send — listing or creating
// a session for a feature the school hasn't bought would leave the tutor UI
// looking half-alive rather than cleanly unavailable.
studentRouter.post('/chat/sessions', requireFeature('ai_tutor'), createSessionController);
studentRouter.get('/chat/sessions', requireFeature('ai_tutor'), listSessionsController);
studentRouter.patch('/chat/sessions/:id', requireFeature('ai_tutor'), renameSessionController);
studentRouter.delete('/chat/sessions/:id', requireFeature('ai_tutor'), deleteSessionController);
studentRouter.get('/chat/sessions/:id/history', requireFeature('ai_tutor'), getHistoryController);
studentRouter.post('/chat/sessions/:id/message', requireFeature('ai_tutor'), chatLimiter, sendMessageController);

// ─── PDF Simulator ──────────────────────────────────────────
// Ported from pdf-simulation-master — see api/src/services/sim*.service.ts
// for the porting notes. Every AI-calling endpoint is rate-limited per
// student, same reasoning as chemistryLimiter above: these cost real money
// per call and a single student's lab-period usage must not blow the
// school's AI budget. Book access itself (class/subject/school scope) is
// enforced inside simAccess.service.ts's requireReadableBook, not here.
const simChatLimiter = rateLimit({ windowMs: 60 * 60_000, max: 60, keyFn: (req) => `sim-chat:${req.user!.id}` });
const simExplainLimiter = rateLimit({ windowMs: 60 * 60_000, max: 60, keyFn: (req) => `sim-explain:${req.user!.id}` });
const simGenerateLimiter = rateLimit({ windowMs: 60 * 60_000, max: 20, keyFn: (req) => `sim-generate:${req.user!.id}` });

studentRouter.get('/sim/books', requireFeature('pdf_simulator'), listBooksController);
studentRouter.get('/sim/books/:jobId/pdf-url', requireFeature('pdf_simulator'), getPdfUrlController);
studentRouter.get('/sim/books/:jobId/annotations', requireFeature('pdf_simulator'), getAnnotationsController);
studentRouter.post('/sim/chat', requireFeature('pdf_simulator'), simChatLimiter, chatController);
studentRouter.post('/sim/explain', requireFeature('pdf_simulator'), simExplainLimiter, explainController);
studentRouter.post('/sim/explain-selection', requireFeature('pdf_simulator'), simExplainLimiter, explainSelectionController);
studentRouter.post('/sim/generate', requireFeature('pdf_simulator'), simGenerateLimiter, generateController);
// No LLM call — reads a stored/derived brief. Ungated by the rate limiter,
// gated by the feature flag like every other sim route.
studentRouter.post('/sim/sim-brief', requireFeature('pdf_simulator'), simBriefController);

studentRouter.get('/sim/notes/:jobId', requireFeature('pdf_simulator'), listSimNotesController);
studentRouter.post('/sim/notes', requireFeature('pdf_simulator'), createSimNoteController);
studentRouter.patch('/sim/notes/:noteId', requireFeature('pdf_simulator'), updateSimNoteController);
studentRouter.delete('/sim/notes/:noteId', requireFeature('pdf_simulator'), deleteSimNoteController);
