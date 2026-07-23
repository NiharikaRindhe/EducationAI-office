import type { Request, Response, NextFunction } from 'express';
import { createChatSessionSchema, renameChatSessionSchema, sendMessageSchema } from '../schemas/chat.schema.js';
import * as chatService from '../services/chat.service.js';
import { ApiError } from '../lib/errors.js';

function requireId(req: Request, name = 'id'): string {
  const value = req.params[name];
  if (!value) throw new ApiError('VALIDATION_ERROR', `Missing ${name} in path`);
  return value;
}

export async function listMySubjectsController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await chatService.listMySubjects(req.user!.id));
  } catch (err) {
    next(err);
  }
}

export async function createSessionController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createChatSessionSchema.parse(req.body);
    res.status(201).json(await chatService.createSession(req.user!.id, input));
  } catch (err) {
    next(err);
  }
}

export async function listSessionsController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await chatService.listSessions(req.user!.id));
  } catch (err) {
    next(err);
  }
}

export async function getHistoryController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await chatService.getHistory(req.user!.id, requireId(req)));
  } catch (err) {
    next(err);
  }
}

export async function sendMessageController(req: Request, res: Response, next: NextFunction) {
  try {
    const { text, imageBase64 } = sendMessageSchema.parse(req.body);
    res.json(await chatService.sendMessage(req.user!.id, requireId(req), text, imageBase64));
  } catch (err) {
    next(err);
  }
}

export async function renameSessionController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = renameChatSessionSchema.parse(req.body);
    res.json(await chatService.renameSession(req.user!.id, requireId(req), input));
  } catch (err) {
    next(err);
  }
}

export async function deleteSessionController(req: Request, res: Response, next: NextFunction) {
  try {
    await chatService.deleteSession(req.user!.id, requireId(req));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
