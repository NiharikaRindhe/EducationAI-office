import type { Request, Response, NextFunction } from 'express';
import * as timetableService from '../services/timetable.service.js';
import { createSlotSchema, updateSlotSchema, createExceptionSchema } from '../schemas/timetable.schema.js';
import { ApiError } from '../lib/errors.js';

function requireSchoolId(req: Request): string {
  if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
  return req.user.schoolId;
}

function requireDateRange(req: Request): { fromDate: string; toDate: string } {
  const fromDate = typeof req.query.from === 'string' ? req.query.from : undefined;
  const toDate = typeof req.query.to === 'string' ? req.query.to : undefined;
  if (!fromDate || !toDate) throw new ApiError('VALIDATION_ERROR', 'Both ?from and ?to (YYYY-MM-DD) are required');
  return { fromDate, toDate };
}

export async function listTimetableController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const classSectionId = typeof req.query.classSectionId === 'string' ? req.query.classSectionId : undefined;
    const slots = await timetableService.listTimetable(schoolId, classSectionId);
    res.json(slots);
  } catch (err) {
    next(err);
  }
}

export async function createSlotController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const input = createSlotSchema.parse(req.body);
    const slot = await timetableService.createSlot(schoolId, input);
    res.status(201).json(slot);
  } catch (err) {
    next(err);
  }
}

export async function updateSlotController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing slot id');
    const patch = updateSlotSchema.parse(req.body);
    const slot = await timetableService.updateSlot(schoolId, id, patch);
    res.json(slot);
  } catch (err) {
    next(err);
  }
}

export async function deleteSlotController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing slot id');
    await timetableService.deleteSlot(schoolId, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getMyTeacherTimetableController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError('UNAUTHORIZED', 'Not authenticated');
    const schoolId = requireSchoolId(req);
    const slots = await timetableService.listForTeacher(schoolId, req.user.id);
    res.json(slots);
  } catch (err) {
    next(err);
  }
}

export async function getMyStudentTimetableController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError('UNAUTHORIZED', 'Not authenticated');
    const schoolId = requireSchoolId(req);
    const slots = await timetableService.listForStudent(schoolId, req.user.id);
    res.json(slots);
  } catch (err) {
    next(err);
  }
}

export async function createExceptionController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError('UNAUTHORIZED', 'Not authenticated');
    const schoolId = requireSchoolId(req);
    const { slotId } = req.params;
    if (!slotId) throw new ApiError('VALIDATION_ERROR', 'Missing slot id');
    const input = createExceptionSchema.parse(req.body);
    const exception = await timetableService.createException(
      schoolId,
      { userId: req.user.id, role: req.user.role },
      slotId,
      input,
    );
    res.status(201).json(exception);
  } catch (err) {
    next(err);
  }
}

export async function getSchoolOccurrencesController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const { fromDate, toDate } = requireDateRange(req);
    const classSectionId = typeof req.query.classSectionId === 'string' ? req.query.classSectionId : undefined;
    const occurrences = await timetableService.getOccurrences(schoolId, fromDate, toDate, { classSectionId });
    res.json(occurrences);
  } catch (err) {
    next(err);
  }
}

export async function getMyTeacherOccurrencesController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError('UNAUTHORIZED', 'Not authenticated');
    const schoolId = requireSchoolId(req);
    const { fromDate, toDate } = requireDateRange(req);
    const occurrences = await timetableService.getOccurrencesForTeacher(schoolId, req.user.id, fromDate, toDate);
    res.json(occurrences);
  } catch (err) {
    next(err);
  }
}

export async function getMyStudentOccurrencesController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError('UNAUTHORIZED', 'Not authenticated');
    const schoolId = requireSchoolId(req);
    const { fromDate, toDate } = requireDateRange(req);
    const occurrences = await timetableService.getOccurrencesForStudent(schoolId, req.user.id, fromDate, toDate);
    res.json(occurrences);
  } catch (err) {
    next(err);
  }
}
