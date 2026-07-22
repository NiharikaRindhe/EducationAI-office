import type { Request, Response, NextFunction } from 'express';
import * as reportService from '../services/teacherReport.service.js';
import { ApiError } from '../lib/errors.js';

function getParams(req: Request) {
  if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
  const classNum = req.query.classNum ? Number(req.query.classNum) : undefined;
  const section = typeof req.query.section === 'string' ? req.query.section : undefined;

  if (classNum === undefined || isNaN(classNum)) {
    throw new ApiError('VALIDATION_ERROR', 'Missing or invalid classNum query parameter');
  }
  if (!section) {
    throw new ApiError('VALIDATION_ERROR', 'Missing section query parameter');
  }

  return { teacherId: req.user.id, schoolId: req.user.schoolId, classNum, section };
}

export async function getClassPerformanceHeatmapController(req: Request, res: Response, next: NextFunction) {
  try {
    const { teacherId, schoolId, classNum, section } = getParams(req);
    const result = await reportService.getClassPerformanceHeatmap(teacherId, schoolId, classNum, section);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getEnglishAssessmentReportController(req: Request, res: Response, next: NextFunction) {
  try {
    const { teacherId, schoolId, classNum, section } = getParams(req);
    const result = await reportService.getEnglishAssessmentReport(teacherId, schoolId, classNum, section);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getTaskCompletionMatrixController(req: Request, res: Response, next: NextFunction) {
  try {
    const { teacherId, schoolId, classNum, section } = getParams(req);
    const result = await reportService.getTaskCompletionMatrix(teacherId, schoolId, classNum, section);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getPtmReportController(req: Request, res: Response, next: NextFunction) {
  try {
    const { teacherId, schoolId, classNum, section } = getParams(req);
    const result = await reportService.getPtmReport(teacherId, schoolId, classNum, section);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
