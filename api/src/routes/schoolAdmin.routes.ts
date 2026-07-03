import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  importStudentsController,
  importTeachersController,
  addSingleStudentController,
  addSingleTeacherController,
  listStudentsController,
  listTeachersController,
} from '../controllers/schoolAdmin.controller.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const schoolAdminRouter = Router();

schoolAdminRouter.use(requireAuth, requireRole('school_admin'));

schoolAdminRouter.get('/students', listStudentsController);
schoolAdminRouter.post('/students', addSingleStudentController);
schoolAdminRouter.post('/students/import', upload.single('file'), importStudentsController);

schoolAdminRouter.get('/teachers', listTeachersController);
schoolAdminRouter.post('/teachers', addSingleTeacherController);
schoolAdminRouter.post('/teachers/import', upload.single('file'), importTeachersController);
