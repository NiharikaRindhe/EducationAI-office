import type { Request, Response, NextFunction } from 'express';
import { createSchoolSchema } from '../schemas/superAdmin.schema.js';
import * as superAdminService from '../services/superAdmin.service.js';
import { ApiError } from '../lib/errors.js';

export async function createSchoolController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createSchoolSchema.parse(req.body);
    const school = await superAdminService.createSchool(input);
    res.status(201).json(school);
  } catch (err) {
    next(err);
  }
}

export async function listSchoolsController(_req: Request, res: Response, next: NextFunction) {
  try {
    const schools = await superAdminService.listSchools();
    res.json(schools);
  } catch (err) {
    next(err);
  }
}

export async function setSchoolActiveController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing school id in path');
    const { isActive } = req.body as { isActive: boolean };
    const school = await superAdminService.setSchoolActive(id, isActive);
    res.json(school);
  } catch (err) {
    next(err);
  }
}
