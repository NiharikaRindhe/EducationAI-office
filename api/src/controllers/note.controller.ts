import type { Request, Response, NextFunction } from 'express';
import { createNoteSchema, updateNoteSchema } from '../schemas/note.schema.js';
import * as noteService from '../services/note.service.js';
import { ApiError } from '../lib/errors.js';

function requireId(req: Request): string {
  const value = req.params.id;
  if (!value) throw new ApiError('VALIDATION_ERROR', 'Missing note id');
  return value;
}

export async function createNoteController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
    const input = createNoteSchema.parse(req.body);
    res.status(201).json(await noteService.createNote(req.user.id, req.user.schoolId, input));
  } catch (err) {
    next(err);
  }
}

export async function listNotesController(req: Request, res: Response, next: NextFunction) {
  try {
    const subject = typeof req.query.subject === 'string' ? req.query.subject : undefined;
    res.json(await noteService.listNotes(req.user!.id, { subject }));
  } catch (err) {
    next(err);
  }
}

export async function updateNoteController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateNoteSchema.parse(req.body);
    res.json(await noteService.updateNote(req.user!.id, requireId(req), input));
  } catch (err) {
    next(err);
  }
}

export async function deleteNoteController(req: Request, res: Response, next: NextFunction) {
  try {
    await noteService.deleteNote(req.user!.id, requireId(req));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
