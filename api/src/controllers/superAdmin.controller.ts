import type { Request, Response, NextFunction } from 'express';
import { createSchoolSchema, updateSchoolSchema, addSchoolAdminSchema, auditLogQuerySchema } from '../schemas/superAdmin.schema.js';
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

export async function getOverviewController(_req: Request, res: Response, next: NextFunction) {
  try {
    const overview = await superAdminService.getOverview();
    res.json(overview);
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

export async function getSchoolDetailController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing school id in path');
    const detail = await superAdminService.getSchoolDetail(id);
    res.json(detail);
  } catch (err) {
    next(err);
  }
}

export async function updateSchoolController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing school id in path');
    const patch = updateSchoolSchema.parse(req.body);
    const school = await superAdminService.updateSchool(id, patch);
    res.json(school);
  } catch (err) {
    next(err);
  }
}

export async function addSchoolAdminController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing school id in path');
    const input = addSchoolAdminSchema.parse(req.body);
    const credential = await superAdminService.addSchoolAdmin(id, input);
    res.status(201).json(credential);
  } catch (err) {
    next(err);
  }
}

export async function resetSchoolAdminPasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, userId } = req.params;
    if (!id || !userId) throw new ApiError('VALIDATION_ERROR', 'Missing school or user id in path');
    const credential = await superAdminService.resetSchoolAdminPassword(id, userId);
    res.json(credential);
  } catch (err) {
    next(err);
  }
}

export async function listAuditLogsController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = auditLogQuerySchema.parse(req.query);
    const logs = await superAdminService.listAuditLogs(query);
    res.json(logs);
  } catch (err) {
    next(err);
  }
}
