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
