import type { Request, Response, NextFunction } from 'express';
import * as aiConsoleService from '../services/aiConsole.service.js';
import { updateAiSettingsSchema, usageQuerySchema } from '../schemas/aiConsole.schema.js';
import { ApiError } from '../lib/errors.js';

export async function getAiSettingsController(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await aiConsoleService.getAiSettings();
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

export async function updateAiSettingsController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError('UNAUTHORIZED', 'Not authenticated');
    const input = updateAiSettingsSchema.parse(req.body);
    const settings = await aiConsoleService.updateAiSettings(input, req.user.id);
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

export async function getAiUsageController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = usageQuerySchema.parse(req.query);
    const usage = await aiConsoleService.getAiUsage(query);
    res.json(usage);
  } catch (err) {
    next(err);
  }
}
