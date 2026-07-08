import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../lib/errors.js';
import * as schoolAdminService from '../services/schoolAdmin.service.js';
import * as classSectionService from '../services/classSection.service.js';
import * as liveSessionService from '../services/liveSession.service.js';

// The Lab In-charge portal deliberately reuses the same read/reset service
// functions School Admin uses — it's the same data, just a narrower set of
// actions exposed (no CSV import, no single-add, no section/assignment
// editing, nothing exam/task/grade-related). Scoping which controllers get
// wired to this router is what enforces "no grade access", not a separate
// permission check.

function requireSchoolId(req: Request): string {
  const schoolId = req.user?.schoolId;
  if (!schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
  return schoolId;
}

export async function listStudentsController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const classNum = req.query.classNum ? Number(req.query.classNum) : undefined;
    const section = typeof req.query.section === 'string' ? req.query.section : undefined;
    res.json(await schoolAdminService.listStudents(schoolId, { classNum, section }));
  } catch (err) {
    next(err);
  }
}

export async function listTeachersController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await schoolAdminService.listTeachers(requireSchoolId(req)));
  } catch (err) {
    next(err);
  }
}

export async function resetStudentCredentialController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    res.json(await schoolAdminService.resetStudentCredential(schoolId, req.params.id!));
  } catch (err) {
    next(err);
  }
}

export async function resetTeacherPasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    res.json(await schoolAdminService.resetTeacherPassword(schoolId, req.params.id!));
  } catch (err) {
    next(err);
  }
}

export async function listSectionsController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await classSectionService.listSections(requireSchoolId(req)));
  } catch (err) {
    next(err);
  }
}

export async function listActiveSessionsController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await liveSessionService.listActiveSessionsForSchool(requireSchoolId(req)));
  } catch (err) {
    next(err);
  }
}
