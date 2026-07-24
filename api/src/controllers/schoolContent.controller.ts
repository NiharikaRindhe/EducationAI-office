import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../lib/errors.js';
import { parseChapterMap } from '../lib/pdfExtract.js';
import * as contentService from '../services/superAdminContent.service.js';

function requireSchoolId(req: Request): string {
  const schoolId = req.user?.schoolId;
  if (!schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
  return schoolId;
}

export async function listSchoolIngestionJobsController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const classNum = req.query.classNum ? Number(req.query.classNum) : undefined;
    const subject = typeof req.query.subject === 'string' ? req.query.subject : undefined;
    const result = await contentService.listIngestionJobs({ classNum, subject, schoolId });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function uploadSchoolNcertPdfController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError('UNAUTHORIZED', 'Not authenticated');
    const schoolId = requireSchoolId(req);
    if (!req.file) throw new ApiError('VALIDATION_ERROR', 'No file uploaded — attach a PDF as "file"');

    const classNumRaw = req.body.classNum;
    const subject = req.body.subject;
    const bookTitle = req.body.bookTitle;

    if (!classNumRaw || isNaN(Number(classNumRaw))) {
      throw new ApiError('VALIDATION_ERROR', 'classNum (1–10) is required in the request body');
    }
    if (!subject || typeof subject !== 'string') {
      throw new ApiError('VALIDATION_ERROR', 'subject is required in the request body');
    }
    if (!bookTitle || typeof bookTitle !== 'string') {
      throw new ApiError('VALIDATION_ERROR', 'bookTitle is required in the request body');
    }

    const classNum = Number(classNumRaw);
    if (classNum < 1 || classNum > 10) {
      throw new ApiError('VALIDATION_ERROR', 'classNum must be between 1 and 10');
    }

    let chapterMap: unknown;
    if (req.body.chapterMap) {
      try {
        chapterMap = parseChapterMap(req.body.chapterMap);
      } catch (e) {
        throw new ApiError('VALIDATION_ERROR', e instanceof Error ? e.message : 'Invalid chapterMap JSON');
      }
    }

    const job = await contentService.createSchoolIngestionJob(req.user.id, schoolId, {
      classNum,
      subject,
      bookTitle,
      originalFilename: req.file.originalname,
      pdfBuffer: req.file.buffer,
      chapterMap,
    });

    res.status(202).json({
      message: 'Ingestion job queued. Poll GET /school-admin/ncert/jobs for progress.',
      jobId: job.id,
    });
  } catch (err) {
    next(err);
  }
}

export async function retrySchoolIngestionJobController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing job id');
    await contentService.requireJobOwnedBySchool(id, schoolId);
    res.json(await contentService.retryIngestionJob(id));
  } catch (err) {
    next(err);
  }
}

export async function deleteSchoolIngestionJobController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing job id');
    await contentService.requireJobOwnedBySchool(id, schoolId);
    await contentService.deleteIngestionJob(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
