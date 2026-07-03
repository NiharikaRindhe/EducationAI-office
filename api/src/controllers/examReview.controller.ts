import type { Request, Response, NextFunction } from 'express';
import { finalizeScoreSchema } from '../schemas/exam.schema.js';
import * as examReviewService from '../services/examReview.service.js';
import { ApiError } from '../lib/errors.js';

function requireId(req: Request, name = 'id'): string {
  const value = req.params[name];
  if (!value) throw new ApiError('VALIDATION_ERROR', `Missing ${name} in path`);
  return value;
}

export async function listSubmissionsController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await examReviewService.listSubmissions(req.user!.id, requireId(req, 'examId')));
  } catch (err) {
    next(err);
  }
}

export async function getSubmissionDetailController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await examReviewService.getSubmissionDetail(req.user!.id, requireId(req, 'examId'), requireId(req, 'submissionId')),
    );
  } catch (err) {
    next(err);
  }
}

export async function finalizeAnswerScoreController(req: Request, res: Response, next: NextFunction) {
  try {
    const { finalScore, teacherNote } = finalizeScoreSchema.parse(req.body);
    await examReviewService.finalizeAnswerScore(
      req.user!.id,
      requireId(req, 'examId'),
      requireId(req, 'answerId'),
      finalScore,
      teacherNote,
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getMeritListController(req: Request, res: Response, next: NextFunction) {
  try {
    const cutoffPct = req.query.cutoffPct ? Number(req.query.cutoffPct) : 0;
    res.json(await examReviewService.getMeritList(req.user!.id, requireId(req, 'examId'), cutoffPct));
  } catch (err) {
    next(err);
  }
}
