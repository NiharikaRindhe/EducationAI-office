import type { Request, Response, NextFunction } from 'express';
import { saveAnswerSchema, proctorEventSchema } from '../schemas/exam.schema.js';
import * as examTakingService from '../services/examTaking.service.js';
import { ApiError } from '../lib/errors.js';

function requireId(req: Request, name = 'id'): string {
  const value = req.params[name];
  if (!value) throw new ApiError('VALIDATION_ERROR', `Missing ${name} in path`);
  return value;
}

export async function listExamsForStudentController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await examTakingService.listExamsForStudent(req.user!.id));
  } catch (err) {
    next(err);
  }
}

export async function getExamPaperController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await examTakingService.getExamPaper(req.user!.id, requireId(req, 'examId')));
  } catch (err) {
    next(err);
  }
}

export async function saveAnswerController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = saveAnswerSchema.parse(req.body);
    await examTakingService.saveAnswer(req.user!.id, requireId(req, 'submissionId'), input);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function proctorEventController(req: Request, res: Response, next: NextFunction) {
  try {
    const { examSubmissionId, eventType } = proctorEventSchema.parse(req.body);
    res.json(await examTakingService.logProctorEvent(req.user!.id, examSubmissionId, eventType));
  } catch (err) {
    next(err);
  }
}

export async function submitExamController(req: Request, res: Response, next: NextFunction) {
  try {
    await examTakingService.submitExam(req.user!.id, requireId(req, 'submissionId'));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
