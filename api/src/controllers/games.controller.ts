import type { Request, Response, NextFunction } from 'express';
import { submitGameAttemptSchema } from '../schemas/games.schema.js';
import * as gamesService from '../services/games.service.js';
import { ApiError } from '../lib/errors.js';

export async function listGamesForStudentController(req: Request, res: Response, next: NextFunction) {
  try {
    const subject = typeof req.query.subject === 'string' ? req.query.subject : undefined;
    const result = await gamesService.listGamesForStudent(req.user!.id, { subject });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function submitGameAttemptController(req: Request, res: Response, next: NextFunction) {
  try {
    const { gameId } = req.params;
    if (!gameId) throw new ApiError('VALIDATION_ERROR', 'Missing game id');
    const input = submitGameAttemptSchema.parse(req.body);
    const result = await gamesService.submitGameAttempt(req.user!.id, gameId, input);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
