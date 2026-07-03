import type { Request, Response, NextFunction } from 'express';
import { addQuestionBankSchema } from '../schemas/exam.schema.js';
import * as questionBankService from '../services/questionBank.service.js';
import { ApiError } from '../lib/errors.js';

export async function addToBankController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
    const input = addQuestionBankSchema.parse(req.body);
    res.status(201).json(await questionBankService.addToBank(req.user.id, req.user.schoolId, input));
  } catch (err) {
    next(err);
  }
}

export async function listBankController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
    const classNum = req.query.classNum ? Number(req.query.classNum) : undefined;
    const subject = typeof req.query.subject === 'string' ? req.query.subject : undefined;
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    res.json(await questionBankService.listBank(req.user.schoolId, { classNum, subject, type }));
  } catch (err) {
    next(err);
  }
}
