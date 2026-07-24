import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/errors.js';
import { parseChapterMap } from '../lib/pdfExtract.js';
import * as contentService from '../services/superAdminContent.service.js';

// ─── Validation schemas ───────────────────────────────────────
const questionTypeEnum = z.enum(['mcq', 'true_false', 'short_answer', 'long_answer', 'fill_blank']);
const optionSchema = z.object({ id: z.string(), text: z.string(), isCorrect: z.boolean() });

const addGlobalQuestionSchema = z.object({
  classNum: z.number().int().min(1).max(10),
  subject: z.string().min(1),
  chapterNum: z.number().int().optional(),
  type: questionTypeEnum,
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  text: z.string().min(2),
  options: z.array(optionSchema).optional(),
  correctAnswer: z.string().optional(),
  rubric: z.string().optional(),
  marks: z.number().int().min(1).max(20).default(1),
  isPyq: z.boolean().default(false),
  pyqYear: z.number().int().optional(),
  pyqSource: z.string().optional(),
});

const updateJobStatusSchema = z.object({
  status: z.enum(['queued', 'chunking', 'embedding', 'done', 'error']),
  totalPages: z.number().int().optional(),
  chunksCreated: z.number().int().optional(),
  chunksEmbedded: z.number().int().optional(),
  errorMessage: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────
//  GLOBAL QUESTION BANK
// ─────────────────────────────────────────────────────────────
export async function listGlobalQuestionBankController(req: Request, res: Response, next: NextFunction) {
  try {
    const classNum = req.query.classNum ? Number(req.query.classNum) : undefined;
    const subject = typeof req.query.subject === 'string' ? req.query.subject : undefined;
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const isPyq = req.query.isPyq !== undefined ? req.query.isPyq === 'true' : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    const result = await contentService.listGlobalQuestionBank({ classNum, subject, type, isPyq, search });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function addGlobalQuestionController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError('UNAUTHORIZED', 'Not authenticated');
    const input = addGlobalQuestionSchema.parse(req.body);
    const result = await contentService.addGlobalQuestion(req.user.id, {
      classNum: input.classNum,
      subject: input.subject,
      chapterNum: input.chapterNum,
      type: input.type,
      difficulty: input.difficulty,
      text: input.text,
      options: input.options,
      correctAnswer: input.correctAnswer,
      rubric: input.rubric,
      marks: input.marks,
      isPyq: input.isPyq,
      pyqYear: input.pyqYear,
      pyqSource: input.pyqSource,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteGlobalQuestionController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing question id');
    const result = await contentService.deleteGlobalQuestion(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function bulkImportGlobalQuestionsController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError('UNAUTHORIZED', 'Not authenticated');
    if (!req.file) throw new ApiError('VALIDATION_ERROR', 'No file uploaded — attach a CSV or XLSX file as "file"');
    const result = await contentService.bulkImportGlobalQuestions(
      req.user.id,
      req.file.buffer,
      req.file.originalname,
    );
    res.status(result.errors.length > 0 ? 207 : 201).json(result);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  NCERT INGESTION
// ─────────────────────────────────────────────────────────────
export async function listIngestionJobsController(req: Request, res: Response, next: NextFunction) {
  try {
    const classNum = req.query.classNum ? Number(req.query.classNum) : undefined;
    const subject = typeof req.query.subject === 'string' ? req.query.subject : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const result = await contentService.listIngestionJobs({ classNum, subject, status });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function uploadNcertPdfController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError('UNAUTHORIZED', 'Not authenticated');
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

    // Optional manual chapter map (JSON string in the multipart form):
    // [{ "chapter": 1, "title": "...", "fromPage": 1, "toPage": 14 }, ...]
    // Validated here so a typo fails the upload, not the background job.
    let chapterMap: unknown;
    if (req.body.chapterMap) {
      try {
        chapterMap = parseChapterMap(req.body.chapterMap);
      } catch (e) {
        throw new ApiError('VALIDATION_ERROR', e instanceof Error ? e.message : 'Invalid chapterMap JSON');
      }
    }

    const originalFilename = req.file.originalname;
    const storagePath = `pdfs/class-${classNum}/${subject.replace(/\s+/g, '_')}/${Date.now()}_${originalFilename}`;

    // The PDF goes to Storage BEFORE the job row exists: the worker (and any
    // later retry) downloads it from there, so a crash after this point never
    // loses the upload.
    await contentService.uploadPdfToStorage(storagePath, req.file.buffer);

    const job = await contentService.createIngestionJob(req.user.id, {
      classNum,
      subject,
      bookTitle,
      originalFilename,
      storagePath,
      chapterMap,
    });

    // The in-process worker (jobs/ingestionWorker.job.ts) picks queued jobs up
    // within its poll interval; the frontend polls GET /ncert/jobs for progress.
    res.status(202).json({
      message: 'Ingestion job queued. Poll GET /ncert/jobs for progress.',
      jobId: job.id,
      storagePath,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteIngestionJobController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing job id');
    await contentService.deleteIngestionJob(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function retryIngestionJobController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing job id');
    res.json(await contentService.retryIngestionJob(id));
  } catch (err) {
    next(err);
  }
}

export async function updateIngestionJobStatusController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing job id');
    const input = updateJobStatusSchema.parse(req.body);
    const result = await contentService.updateIngestionJobStatus(id, {
      status: input.status,
      totalPages: input.totalPages,
      chunksCreated: input.chunksCreated,
      chunksEmbedded: input.chunksEmbedded,
      errorMessage: input.errorMessage,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
