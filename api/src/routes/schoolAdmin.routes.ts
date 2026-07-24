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
import {
  getPromotionPreviewController,
  executePromotionController,
  getClassFeaturesController,
  updateClassFeaturesController,
  getPrincipalReportController,
  getActivityController,
} from '../controllers/schoolAdminExtras.controller.js';
import {
  listTimetableController,
  createSlotController,
  updateSlotController,
  deleteSlotController,
  createExceptionController,
  getSchoolOccurrencesController,
} from '../controllers/timetable.controller.js';
import { listLabsController, createLabController, updateLabController } from '../controllers/lab.controller.js';
import {
  listSchoolIngestionJobsController,
  uploadSchoolNcertPdfController,
  retrySchoolIngestionJobController,
  deleteSchoolIngestionJobController,
} from '../controllers/schoolContent.controller.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
// PDFs run far larger than the CSV/XLSX imports above — same 150MB ceiling
// as the Super Admin's NCERT upload (see superAdmin.routes.ts).
const pdfUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 150 * 1024 * 1024 } });

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

// ── Content library (own school's supplementary books) ────────
schoolAdminRouter.get('/ncert/jobs', listSchoolIngestionJobsController);
schoolAdminRouter.post('/ncert/upload', pdfUpload.single('file'), uploadSchoolNcertPdfController);
schoolAdminRouter.post('/ncert/jobs/:id/retry', retrySchoolIngestionJobController);
schoolAdminRouter.delete('/ncert/jobs/:id', deleteSchoolIngestionJobController);

schoolAdminRouter.get('/teaching-assignments', listTeachingAssignmentsController);
schoolAdminRouter.post('/teaching-assignments', addTeachingAssignmentController);
schoolAdminRouter.delete('/teaching-assignments/:id', removeTeachingAssignmentController);

schoolAdminRouter.get('/lab-incharges', listLabInchargesController);
schoolAdminRouter.post('/lab-incharges', addSingleLabInchargeController);
schoolAdminRouter.post('/lab-incharges/:id/reset-password', resetLabInchargePasswordController);

schoolAdminRouter.get('/promotion/preview', getPromotionPreviewController);
schoolAdminRouter.post('/promotion/execute', executePromotionController);
schoolAdminRouter.get('/features', getClassFeaturesController);
schoolAdminRouter.post('/features', updateClassFeaturesController);
schoolAdminRouter.get('/reports/principal', getPrincipalReportController);
schoolAdminRouter.get('/activity', getActivityController);

schoolAdminRouter.get('/labs', listLabsController);
schoolAdminRouter.post('/labs', createLabController);
schoolAdminRouter.patch('/labs/:id', updateLabController);

schoolAdminRouter.get('/timetable', listTimetableController);
schoolAdminRouter.post('/timetable', createSlotController);
schoolAdminRouter.patch('/timetable/:id', updateSlotController);
schoolAdminRouter.delete('/timetable/:id', deleteSlotController);
schoolAdminRouter.post('/timetable/:slotId/exceptions', createExceptionController);
schoolAdminRouter.get('/timetable/occurrences', getSchoolOccurrencesController);
