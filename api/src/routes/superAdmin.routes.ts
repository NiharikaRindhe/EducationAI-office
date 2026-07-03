import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createSchoolController,
  listSchoolsController,
  setSchoolActiveController,
} from '../controllers/superAdmin.controller.js';

export const superAdminRouter = Router();

superAdminRouter.use(requireAuth, requireRole('super_admin'));

superAdminRouter.get('/schools', listSchoolsController);
superAdminRouter.post('/schools', createSchoolController);
superAdminRouter.patch('/schools/:id/active', setSchoolActiveController);
