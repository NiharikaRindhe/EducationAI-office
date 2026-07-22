import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../lib/errors.js';
import * as labService from '../services/lab.service.js';
import { createLabSchema, updateLabSchema } from '../schemas/lab.schema.js';

function requireSchoolId(req: Request): string {
  if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
  return req.user.schoolId;
}

export async function listLabsController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await labService.listLabs(requireSchoolId(req)));
  } catch (err) {
    next(err);
  }
}

export async function createLabController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createLabSchema.parse(req.body);
    const lab = await labService.createLab(requireSchoolId(req), input);
    res.status(201).json(lab);
  } catch (err) {
    next(err);
  }
}

export async function updateLabController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing lab id');
    const patch = updateLabSchema.parse(req.body);
    const lab = await labService.updateLab(requireSchoolId(req), id, patch);
    res.json(lab);
  } catch (err) {
    next(err);
  }
}
