import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../lib/errors.js';
import * as classSectionService from '../services/classSection.service.js';
import {
  addSectionSchema,
  updateSectionSchema,
  addTeachingAssignmentSchema,
} from '../schemas/schoolAdmin.schema.js';
import { addClassSubjectSchema } from '../schemas/superAdmin.schema.js';

function requireSchoolId(req: Request): string {
  const schoolId = req.user?.schoolId;
  if (!schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
  return schoolId;
}

export async function listSectionsController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await classSectionService.listSections(requireSchoolId(req)));
  } catch (err) {
    next(err);
  }
}

export async function addSectionController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = addSectionSchema.parse(req.body);
    const section = await classSectionService.addSection(requireSchoolId(req), input.classNum, input.sectionLabel);
    res.status(201).json(section);
  } catch (err) {
    next(err);
  }
}

export async function updateSectionController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateSectionSchema.parse(req.body);
    const section = await classSectionService.updateSection(requireSchoolId(req), req.params.id!, input);
    res.json(section);
  } catch (err) {
    next(err);
  }
}

export async function listClassSubjectsController(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await classSectionService.listClassSubjects());
  } catch (err) {
    next(err);
  }
}

export async function addClassSubjectController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = addClassSubjectSchema.parse(req.body);
    const row = await classSectionService.addClassSubject(input.classNum, input.subject);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
}

export async function removeClassSubjectController(req: Request, res: Response, next: NextFunction) {
  try {
    const classNum = Number(req.params.classNum);
    if (!Number.isInteger(classNum)) throw new ApiError('VALIDATION_ERROR', 'Invalid class number');
    const subject = req.params.subject!;
    await classSectionService.removeClassSubject(classNum, subject);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function listTeachingAssignmentsController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await classSectionService.listTeachingAssignments(requireSchoolId(req)));
  } catch (err) {
    next(err);
  }
}

export async function addTeachingAssignmentController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = addTeachingAssignmentSchema.parse(req.body);
    const assignment = await classSectionService.addTeachingAssignment(requireSchoolId(req), input);
    res.status(201).json(assignment);
  } catch (err) {
    next(err);
  }
}

export async function removeTeachingAssignmentController(req: Request, res: Response, next: NextFunction) {
  try {
    await classSectionService.removeTeachingAssignment(requireSchoolId(req), req.params.id!);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
