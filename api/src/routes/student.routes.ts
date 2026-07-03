import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  activeSessionForStudentController,
  joinSessionController,
  raiseHandController,
} from '../controllers/liveSession.controller.js';
import { listAnnouncementsForStudentController } from '../controllers/announcement.controller.js';

export const studentRouter = Router();

studentRouter.use(requireAuth, requireRole('student'));

studentRouter.get('/sessions/active', activeSessionForStudentController);
studentRouter.post('/sessions/join', joinSessionController);
studentRouter.patch('/sessions/:id/raise-hand', raiseHandController);

studentRouter.get('/announcements', listAnnouncementsForStudentController);
