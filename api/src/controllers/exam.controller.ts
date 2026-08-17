import type { Request, Response, NextFunction } from 'express';
import {
  createExamSchema,
  addQuestionSchema,
  addFromBankSchema,
  publishExamSchema,
  updateExamSchema,
  setResultsReleasedSchema,
} from '../schemas/exam.schema.js';
import * as examService from '../services/exam.service.js';
import { ApiError } from '../lib/errors.js';
import { requireId } from '../lib/httpParams.js';
import { writeAuditLog } from '../services/auditLog.service.js';

export async function createExamController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
    const input = createExamSchema.parse(req.body);
    res.status(201).json(await examService.createExam(req.user.id, req.user.schoolId, input));
  } catch (err) {
    next(err);
  }
}

export async function listExamsController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await examService.listExamsForTeacher(req.user!.id));
  } catch (err) {
    next(err);
  }
}

export async function duplicateExamController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
    res.status(201).json(await examService.duplicateExam(req.user.id, req.user.schoolId, requireId(req)));
  } catch (err) {
    next(err);
  }
}

export async function getExamController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await examService.getExamDetail(req.user!.id, requireId(req)));
  } catch (err) {
    next(err);
  }
}

export async function addQuestionController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = addQuestionSchema.parse(req.body);
    res.status(201).json(await examService.addQuestion(req.user!.id, requireId(req), input));
  } catch (err) {
    next(err);
  }
}

export async function addQuestionsFromBankController(req: Request, res: Response, next: NextFunction) {
  try {
    const { bankIds } = addFromBankSchema.parse(req.body);
    res.status(201).json(await examService.addQuestionsFromBank(req.user!.id, requireId(req), bankIds));
  } catch (err) {
    next(err);
  }
}

export async function removeQuestionController(req: Request, res: Response, next: NextFunction) {
  try {
    await examService.removeQuestion(req.user!.id, requireId(req, 'examId'), requireId(req, 'questionId'));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function publishExamController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
    const input = publishExamSchema.parse(req.body);
    res.json(await examService.publishExam(req.user.id, req.user.schoolId, requireId(req), input));
  } catch (err) {
    next(err);
  }
}

export async function updateDraftExamController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateExamSchema.parse(req.body);
    res.json(await examService.updateDraftExam(req.user!.id, requireId(req), input));
  } catch (err) {
    next(err);
  }
}

export async function deleteDraftExamController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await examService.deleteDraftExam(req.user!.id, requireId(req)));
  } catch (err) {
    next(err);
  }
}

export async function setResultsReleasedController(req: Request, res: Response, next: NextFunction) {
  try {
    const { released } = setResultsReleasedSchema.parse(req.body);
    const result = await examService.setResultsReleased(req.user!.id, requireId(req), released);

    // Releasing marks is a decision a parent may later ask about, so it is
    // recorded with who did it and when.
    await writeAuditLog({
      schoolId: req.user!.schoolId,
      actorId: req.user!.id,
      action: released ? 'exam.results_released' : 'exam.results_withheld',
      entity: 'exam',
      entityId: result.id,
      metadata: { title: result.title },
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function closeExamController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await examService.closeExam(req.user!.id, requireId(req)));
  } catch (err) {
    next(err);
  }
}
