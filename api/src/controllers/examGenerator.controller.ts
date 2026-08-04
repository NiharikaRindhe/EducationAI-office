import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../lib/errors.js';
import { generateQuestionsSchema, saveGeneratedSchema } from '../schemas/examGenerator.schema.js';
import * as generator from '../services/examGenerator.service.js';

/** Chapters with indexed content for this class+subject — drives the chapter
 *  picker so a teacher can't select a chapter that would generate nothing. */
export async function listGeneratableChaptersController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');

    const classNum = Number(req.query.classNum);
    const subject = typeof req.query.subject === 'string' ? req.query.subject : '';
    if (!classNum || isNaN(classNum) || classNum < 1 || classNum > 10) {
      throw new ApiError('VALIDATION_ERROR', 'classNum (1-10) is required');
    }
    if (!subject) throw new ApiError('VALIDATION_ERROR', 'subject is required');

    res.json(await generator.listGeneratableChapters(req.user.schoolId, classNum, subject));
  } catch (err) {
    next(err);
  }
}

/** Teachers are gated to the classes they're assigned; a School Admin covers
 *  their whole school. Derived from the authenticated role, never the body. */
function actorRole(req: Request): generator.GeneratorActor {
  return req.user?.role === 'school_admin' ? 'school_admin' : 'teacher';
}

export async function generateQuestionsController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
    const input = generateQuestionsSchema.parse(req.body);
    res.json(await generator.generateQuestions(req.user.id, req.user.schoolId, input, actorRole(req)));
  } catch (err) {
    next(err);
  }
}

export async function saveGeneratedQuestionsController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
    const input = saveGeneratedSchema.parse(req.body);
    res.status(201).json(
      await generator.saveGeneratedQuestions(req.user.id, req.user.schoolId, input, actorRole(req)),
    );
  } catch (err) {
    next(err);
  }
}
