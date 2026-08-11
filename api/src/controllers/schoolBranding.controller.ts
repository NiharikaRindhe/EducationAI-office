import type { Request, Response, NextFunction } from 'express';
import * as brandingService from '../services/schoolBranding.service.js';
import { requireSchoolId } from '../lib/httpParams.js';
import { ApiError } from '../lib/errors.js';

/** School Admin — always scoped to the caller's own school, never a path param. */
export async function uploadOwnLogoController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    if (!req.file) throw new ApiError('VALIDATION_ERROR', 'No logo file uploaded');
    res.json(await brandingService.setSchoolLogo(schoolId, req.file));
  } catch (err) {
    next(err);
  }
}

export async function removeOwnLogoController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    res.json(await brandingService.removeSchoolLogo(schoolId));
  } catch (err) {
    next(err);
  }
}

/** Super Admin — any school, id from the path. */
export async function uploadSchoolLogoController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing school id in path');
    if (!req.file) throw new ApiError('VALIDATION_ERROR', 'No logo file uploaded');
    res.json(await brandingService.setSchoolLogo(id, req.file));
  } catch (err) {
    next(err);
  }
}

export async function removeSchoolLogoController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing school id in path');
    res.json(await brandingService.removeSchoolLogo(id));
  } catch (err) {
    next(err);
  }
}
