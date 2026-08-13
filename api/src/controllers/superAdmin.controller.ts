import type { Request, Response, NextFunction } from 'express';
import {
  createSchoolSchema,
  updateSchoolSchema,
  addSchoolAdminSchema,
  auditLogQuerySchema,
  auditLogExportQuerySchema,
  setEntitlementsSchema,
} from '../schemas/superAdmin.schema.js';
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

export async function listSchoolsController(req: Request, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    res.json(await superAdminService.listSchools({ page, pageSize, search }));
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
    const school = await superAdminService.setSchoolActive(id, isActive, req.user!.id);
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
    const credential = await superAdminService.resetSchoolAdminPassword(id, userId, req.user!.id);
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

export async function listAuditActionsController(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await superAdminService.listAuditActions());
  } catch (err) {
    next(err);
  }
}

export async function exportAuditLogsController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = auditLogExportQuerySchema.parse(req.query);
    const csv = await superAdminService.exportAuditLogsCsv(query);
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="eduai-audit-log-${stamp}.csv"`);
    // BOM so Excel opens UTF-8 names (Hindi, accented) correctly instead of
    // rendering them as mojibake — these exports go to non-technical readers.
    res.send('﻿' + csv);
  } catch (err) {
    next(err);
  }
}

export async function getSchoolEntitlementsController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing school id in path');
    const entitlements = await superAdminService.getSchoolEntitlements(id);
    res.json(entitlements);
  } catch (err) {
    next(err);
  }
}

export async function setSchoolEntitlementsController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing school id in path');
    const { features } = setEntitlementsSchema.parse(req.body);
    const updated = await superAdminService.setSchoolEntitlements(id, features, req.user!.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
