import type { Request, Response, NextFunction } from 'express';
import { englishItemsQuerySchema, submitEnglishAttemptSchema } from '../schemas/english.schema.js';
import * as englishService from '../services/english.service.js';

export async function getItemsController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = englishItemsQuerySchema.parse(req.query);
    res.json(await englishService.getItems(query));
  } catch (err) {
    next(err);
  }
}

export async function submitAttemptController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = submitEnglishAttemptSchema.parse(req.body);
    res.status(201).json(await englishService.submitAttempt(req.user!.id, input));
  } catch (err) {
    next(err);
  }
}

export async function getProgressController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await englishService.getProgress(req.user!.id));
  } catch (err) {
    next(err);
  }
}
