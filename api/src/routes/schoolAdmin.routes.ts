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
  resetStudentCredentialController,
  resetTeacherPasswordController,
  listLabInchargesController,
  addSingleLabInchargeController,
  resetLabInchargePasswordController,
} from '../controllers/schoolAdmin.controller.js';
import {
  listSectionsController,
  addSectionController,
  updateSectionController,
  listClassSubjectsController,
  listTeachingAssignmentsController,
  addTeachingAssignmentController,
  removeTeachingAssignmentController,
} from '../controllers/classSection.controller.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const schoolAdminRouter = Router();

schoolAdminRouter.use(requireAuth, requireRole('school_admin'));

schoolAdminRouter.get('/students', listStudentsController);
schoolAdminRouter.post('/students', addSingleStudentController);
schoolAdminRouter.post('/students/import', upload.single('file'), importStudentsController);
schoolAdminRouter.post('/students/:id/reset-credentials', resetStudentCredentialController);

schoolAdminRouter.get('/teachers', listTeachersController);
schoolAdminRouter.post('/teachers', addSingleTeacherController);
schoolAdminRouter.post('/teachers/import', upload.single('file'), importTeachersController);
schoolAdminRouter.post('/teachers/:id/reset-password', resetTeacherPasswordController);

schoolAdminRouter.get('/class-sections', listSectionsController);
schoolAdminRouter.post('/class-sections', addSectionController);
schoolAdminRouter.patch('/class-sections/:id', updateSectionController);

schoolAdminRouter.get('/subjects', listClassSubjectsController);

schoolAdminRouter.get('/teaching-assignments', listTeachingAssignmentsController);
schoolAdminRouter.post('/teaching-assignments', addTeachingAssignmentController);
schoolAdminRouter.delete('/teaching-assignments/:id', removeTeachingAssignmentController);

schoolAdminRouter.get('/lab-incharges', listLabInchargesController);
schoolAdminRouter.post('/lab-incharges', addSingleLabInchargeController);
schoolAdminRouter.post('/lab-incharges/:id/reset-password', resetLabInchargePasswordController);
