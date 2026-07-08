import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listStudentsController,
  listTeachersController,
  resetStudentCredentialController,
  resetTeacherPasswordController,
  listSectionsController,
  listActiveSessionsController,
} from '../controllers/labIncharge.controller.js';

export const labInchargeRouter = Router();

labInchargeRouter.use(requireAuth, requireRole('lab_incharge'));

labInchargeRouter.get('/students', listStudentsController);
labInchargeRouter.post('/students/:id/reset-credentials', resetStudentCredentialController);

labInchargeRouter.get('/teachers', listTeachersController);
labInchargeRouter.post('/teachers/:id/reset-password', resetTeacherPasswordController);

labInchargeRouter.get('/class-sections', listSectionsController);
labInchargeRouter.get('/sessions/active', listActiveSessionsController);
