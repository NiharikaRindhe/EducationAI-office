import type { Request, Response, NextFunction } from 'express';
import * as teacherService from '../services/teacher.service.js';
import { ApiError } from '../lib/errors.js';

function requireContext(req: Request) {
  if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
  return { teacherId: req.user.id, schoolId: req.user.schoolId };
}

export async function dashboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const { teacherId, schoolId } = requireContext(req);
    res.json(await teacherService.getDashboardStats(teacherId, schoolId));
  } catch (err) {
    next(err);
  }
}

export async function listStudentsController(req: Request, res: Response, next: NextFunction) {
  try {
    const { teacherId, schoolId } = requireContext(req);
    const classNum = req.query.classNum ? Number(req.query.classNum) : undefined;
    const section = typeof req.query.section === 'string' ? req.query.section : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    res.json(await teacherService.listStudentsForTeacher(teacherId, schoolId, { classNum, section, search }));
  } catch (err) {
    next(err);
  }
}

export async function studentDrillDownController(req: Request, res: Response, next: NextFunction) {
  try {
    const { teacherId } = requireContext(req);
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing student id');
    res.json(await teacherService.getStudentDrillDown(teacherId, id));
  } catch (err) {
    next(err);
  }
}

export async function atRiskController(req: Request, res: Response, next: NextFunction) {
  try {
    const { teacherId, schoolId } = requireContext(req);
    res.json(await teacherService.getAtRiskStudents(teacherId, schoolId));
  } catch (err) {
    next(err);
  }
}
