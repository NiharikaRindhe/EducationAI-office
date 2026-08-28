import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { requireFeature } from '../middleware/requireFeature.js';
import {
  importStudentsController,
  importTeachersController,
  addSingleStudentController,
  addSingleTeacherController,
  listStudentsController,
  listTeachersController,
  resetStudentCredentialController,
  updateStudentProfileController,
  updateTeacherProfileController,
  setStaffActiveController,
  exitStaffController,
  reinstateStaffController,
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
  updateAcademicYearSettingsController,
  exportGraduatesController,
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
  importTimetableController,
} from '../controllers/timetable.controller.js';
import { listLabsController, createLabController, updateLabController } from '../controllers/lab.controller.js';
import {
  schoolAdminListController,
  schoolAdminIdsController,
  schoolAdminExportController,
  bulkResetCredentialsController,
  bulkMoveController,
  bulkSetActiveController,
  bulkExitController,
  bulkReinstateController,
} from '../controllers/studentDirectory.controller.js';
import {
  listSchoolIngestionJobsController,
  uploadSchoolNcertPdfController,
  retrySchoolIngestionJobController,
  deleteSchoolIngestionJobController,
} from '../controllers/schoolContent.controller.js';
import {
  listGeneratableChaptersController,
  generateQuestionsController,
  saveGeneratedQuestionsController,
} from '../controllers/examGenerator.controller.js';
import {
  uploadOwnLogoController,
  removeOwnLogoController,
} from '../controllers/schoolBranding.controller.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
// PDFs run far larger than the CSV/XLSX imports above — same 150MB ceiling
// as the Super Admin's NCERT upload (see superAdmin.routes.ts).
const pdfUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 150 * 1024 * 1024 } });
// Logos are small; the service re-checks size and MIME so this is only the
// outer guard that stops a huge upload being buffered into memory at all.
const logoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

export const schoolAdminRouter = Router();

schoolAdminRouter.use(requireAuth, requireRole('school_admin'));

// Paged/filtered/sorted roster backing the student directory table. The
// legacy unpaged /students is kept for callers that still expect a plain
// array (e.g. pickers), but the directory UI uses /students/directory.
schoolAdminRouter.get('/students/directory', schoolAdminListController);
schoolAdminRouter.get('/students/directory/ids', schoolAdminIdsController);
schoolAdminRouter.get('/students/directory/export', schoolAdminExportController);
schoolAdminRouter.post('/students/bulk/reset-credentials', bulkResetCredentialsController);
schoolAdminRouter.post('/students/bulk/move', bulkMoveController);
schoolAdminRouter.post('/students/bulk/active', bulkSetActiveController);
// Archiving a leaver, and undoing it. Deliberately not a DELETE —
// student_profiles is referenced NO ACTION by twelve tables, and a leaver's
// marks remain part of their record.
schoolAdminRouter.post('/students/bulk/exit', bulkExitController);
schoolAdminRouter.post('/students/bulk/reinstate', bulkReinstateController);

schoolAdminRouter.get('/students', listStudentsController);
schoolAdminRouter.post('/students', addSingleStudentController);
schoolAdminRouter.post('/students/import', upload.single('file'), importStudentsController);
schoolAdminRouter.patch('/students/:id', updateStudentProfileController);
schoolAdminRouter.post('/students/:id/reset-credentials', resetStudentCredentialController);

schoolAdminRouter.get('/teachers', listTeachersController);
schoolAdminRouter.post('/teachers', addSingleTeacherController);
schoolAdminRouter.post('/teachers/import', upload.single('file'), importTeachersController);
schoolAdminRouter.patch('/teachers/:id', updateTeacherProfileController);
schoolAdminRouter.post('/teachers/:id/active', setStaffActiveController);
// Removing a teacher archives them and releases their classes. Not a DELETE:
// tasks, exams and live_sessions reference teacher_profiles with NO ACTION.
schoolAdminRouter.post('/teachers/:id/exit', exitStaffController);
schoolAdminRouter.post('/teachers/:id/reinstate', reinstateStaffController);
schoolAdminRouter.post('/teachers/:id/reset-password', resetTeacherPasswordController);

schoolAdminRouter.get('/class-sections', listSectionsController);
schoolAdminRouter.post('/class-sections', addSectionController);
schoolAdminRouter.patch('/class-sections/:id', updateSectionController);

schoolAdminRouter.get('/subjects', listClassSubjectsController);

// ── Content library (own school's supplementary books) ────────
schoolAdminRouter.get('/ncert/jobs', requireFeature('school_content_upload'), listSchoolIngestionJobsController);
schoolAdminRouter.post('/ncert/upload', requireFeature('school_content_upload'), pdfUpload.single('file'), uploadSchoolNcertPdfController);
schoolAdminRouter.post('/ncert/jobs/:id/retry', requireFeature('school_content_upload'), retrySchoolIngestionJobController);
schoolAdminRouter.delete('/ncert/jobs/:id', requireFeature('school_content_upload'), deleteSchoolIngestionJobController);

schoolAdminRouter.get('/teaching-assignments', listTeachingAssignmentsController);
schoolAdminRouter.post('/teaching-assignments', addTeachingAssignmentController);
schoolAdminRouter.delete('/teaching-assignments/:id', removeTeachingAssignmentController);

schoolAdminRouter.get('/lab-incharges', listLabInchargesController);
schoolAdminRouter.post('/lab-incharges', addSingleLabInchargeController);
schoolAdminRouter.post('/lab-incharges/:id/active', setStaffActiveController);
schoolAdminRouter.post('/lab-incharges/:id/exit', exitStaffController);
schoolAdminRouter.post('/lab-incharges/:id/reinstate', reinstateStaffController);
schoolAdminRouter.post('/lab-incharges/:id/reset-password', resetLabInchargePasswordController);

schoolAdminRouter.get('/promotion/preview', getPromotionPreviewController);
schoolAdminRouter.put('/promotion/settings', updateAcademicYearSettingsController);
schoolAdminRouter.post('/promotion/execute', executePromotionController);
schoolAdminRouter.get('/promotion/graduates.csv', exportGraduatesController);
schoolAdminRouter.get('/features', getClassFeaturesController);
schoolAdminRouter.post('/features', updateClassFeaturesController);
schoolAdminRouter.get('/reports/principal', getPrincipalReportController);
schoolAdminRouter.get('/activity', getActivityController);

schoolAdminRouter.get('/labs', listLabsController);
schoolAdminRouter.post('/labs', createLabController);
schoolAdminRouter.patch('/labs/:id', updateLabController);

schoolAdminRouter.get('/timetable', listTimetableController);
schoolAdminRouter.post('/timetable', createSlotController);
// Schools arrive with a timetable already built in a spreadsheet; re-keying it
// by hand is why the builder went unused.
schoolAdminRouter.post('/timetable/import', upload.single('file'), importTimetableController);
schoolAdminRouter.patch('/timetable/:id', updateSlotController);
schoolAdminRouter.delete('/timetable/:id', deleteSlotController);
schoolAdminRouter.post('/timetable/:slotId/exceptions', createExceptionController);
schoolAdminRouter.get('/timetable/occurrences', getSchoolOccurrencesController);

// ── AI question generation ────────────────────────────────────
// Same controllers as the teacher routes; the controller derives the actor
// role from the authenticated user, so a School Admin is scoped to their whole
// school (subject still validated against the class_subjects whitelist) while
// a teacher stays scoped to their own assignments.
schoolAdminRouter.get('/exam-generator/chapters', listGeneratableChaptersController);
schoolAdminRouter.post('/exam-generator/generate', generateQuestionsController);
schoolAdminRouter.post('/exam-generator/save', saveGeneratedQuestionsController);

// ── School branding (own school's logo) ───────────────────────
// Not gated by an entitlement: a school's own identity in the portal
// isn't a paid add-on, it's table stakes for feeling like their platform.
schoolAdminRouter.post('/logo', logoUpload.single('file'), uploadOwnLogoController);
schoolAdminRouter.delete('/logo', removeOwnLogoController);
