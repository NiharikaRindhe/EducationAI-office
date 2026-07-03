import type { Request, Response, NextFunction } from 'express';
import { startSessionSchema } from '../schemas/liveSession.schema.js';
import * as liveSessionService from '../services/liveSession.service.js';
import { ApiError } from '../lib/errors.js';
import { supabaseAdmin } from '../lib/supabase.js';

// ─── Teacher side ───────────────────────────────────────────────

export async function startSessionController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
    const input = startSessionSchema.parse(req.body);
    const session = await liveSessionService.startSession(req.user.id, req.user.schoolId, input);
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

export async function endSessionController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing session id');
    res.json(await liveSessionService.endSession(req.user!.id, id));
  } catch (err) {
    next(err);
  }
}

export async function activeSessionForTeacherController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json((await liveSessionService.getActiveSessionForTeacher(req.user!.id)) ?? null);
  } catch (err) {
    next(err);
  }
}

export async function participantsController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing session id');
    res.json(await liveSessionService.getParticipants(req.user!.id, id));
  } catch (err) {
    next(err);
  }
}

// ─── Student side ───────────────────────────────────────────────

async function getStudentClassInfo(studentId: string) {
  const { data, error } = await supabaseAdmin
    .from('student_profiles')
    .select('class_num, section')
    .eq('user_id', studentId)
    .single();
  if (error || !data) throw new ApiError('NOT_FOUND', 'Student profile not found');
  return data;
}

export async function activeSessionForStudentController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
    const { class_num, section } = await getStudentClassInfo(req.user.id);
    res.json((await liveSessionService.getActiveSessionForStudent(req.user.schoolId, class_num, section)) ?? null);
  } catch (err) {
    next(err);
  }
}

export async function joinSessionController(req: Request, res: Response, next: NextFunction) {
  try {
    const { sessionId } = req.body as { sessionId: string };
    if (!sessionId) throw new ApiError('VALIDATION_ERROR', 'sessionId is required');
    res.status(201).json(await liveSessionService.joinSession(req.user!.id, sessionId));
  } catch (err) {
    next(err);
  }
}

export async function raiseHandController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing session id');
    const { raised } = req.body as { raised: boolean };
    res.json(await liveSessionService.setRaisedHand(req.user!.id, id, Boolean(raised)));
  } catch (err) {
    next(err);
  }
}
