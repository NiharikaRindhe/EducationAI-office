import type { Request, Response, NextFunction } from 'express';
import * as promotionService from '../services/promotion.service.js';
import * as extrasService from '../services/schoolAdminExtras.service.js';
import { requireSchoolId } from '../lib/httpParams.js';
import { z } from 'zod';

const updateFeaturesSchema = z.object({
  classNum: z.number().int().min(1).max(10),
  aiChatEnabled: z.boolean(),
  leaderboardEnabled: z.boolean(),
});

export async function getPromotionPreviewController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const result = await promotionService.getPromotionPreview(schoolId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

const academicYearSettingsSchema = z.object({
  academicYearStartMonth: z.number().int().min(1).max(12),
});

export async function updateAcademicYearSettingsController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const { academicYearStartMonth } = academicYearSettingsSchema.parse(req.body);
    const result = await promotionService.updateAcademicYearStartMonth(schoolId, academicYearStartMonth);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

const executePromotionSchema = z.object({
  /** Students repeating their current class rather than advancing. */
  holdBackIds: z.array(z.string().uuid()).max(2000).optional(),
  /**
   * Where a promoting section lands when the class above has no section of
   * the same name. `fromClass` stops at 9 because Class 10 leaves rather than
   * promoting, so it maps nowhere. Section labels match the 1-4 char limit
   * that class_sections itself enforces.
   */
  sectionMap: z
    .array(
      z.object({
        fromClass: z.number().int().min(1).max(9),
        fromSection: z.string().trim().min(1).max(4),
        toSection: z.string().trim().min(1).max(4),
      }),
    )
    .max(200)
    .optional(),
});

export async function executePromotionController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const { holdBackIds, sectionMap } = executePromotionSchema.parse(req.body ?? {});
    const result = await promotionService.executePromotion(
      schoolId,
      req.user!.id,
      holdBackIds ?? [],
      sectionMap ?? [],
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/** Class 10 leavers as a CSV, so the school keeps a record before the
 *  rollover deactivates those accounts. */
export async function exportGraduatesController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const rows = await promotionService.getGraduatingStudents(schoolId);

    const header = 'full_name,class,section,roll_number';
    const body = rows
      .map((r) => [r.fullName, r.classNum, r.section, r.rollNumber ?? '']
        // Quote every field: names contain commas, roll numbers can contain
        // anything a school types into a spreadsheet.
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="class-10-graduates.csv"');
    res.send(`${header}\n${body}`);
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
