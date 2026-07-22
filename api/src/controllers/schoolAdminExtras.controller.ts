import type { Request, Response, NextFunction } from 'express';
import * as promotionService from '../services/promotion.service.js';
import * as extrasService from '../services/schoolAdminExtras.service.js';
import { ApiError } from '../lib/errors.js';
import { z } from 'zod';

const updateFeaturesSchema = z.object({
  classNum: z.number().int().min(1).max(10),
  aiChatEnabled: z.boolean(),
  leaderboardEnabled: z.boolean(),
});

function requireSchoolId(req: Request): string {
  if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
  return req.user.schoolId;
}

export async function getPromotionPreviewController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const result = await promotionService.getPromotionPreview(schoolId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function executePromotionController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const result = await promotionService.executePromotion(schoolId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getClassFeaturesController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const result = await extrasService.getClassFeatures(schoolId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateClassFeaturesController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const { classNum, aiChatEnabled, leaderboardEnabled } = updateFeaturesSchema.parse(req.body);
    const result = await extrasService.updateClassFeatures(schoolId, classNum, aiChatEnabled, leaderboardEnabled);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getActivityController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const result = await extrasService.getActivity(schoolId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getPrincipalReportController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const result = await extrasService.getPrincipalUsageReport(schoolId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
