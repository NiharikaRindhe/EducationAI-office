import type { Request, Response, NextFunction } from 'express';
import { loginSchema, pinLoginSchema, pinRosterQuerySchema } from '../schemas/auth.schema.js';
import * as authService from '../services/auth.service.js';
import { ApiError } from '../lib/errors.js';
import { supabaseAdmin } from '../lib/supabase.js';

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      role: result.role,
      schoolId: result.schoolId,
      fullName: result.fullName,
      redirectPath: result.redirectPath,
    });
  } catch (err) {
    next(err);
  }
}

export async function pinRosterController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = pinRosterQuerySchema.parse(req.query);
    res.json(await authService.getPinRoster(query));
  } catch (err) {
    next(err);
  }
}

export async function pinLoginController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = pinLoginSchema.parse(req.body);
    const result = await authService.pinLogin(input);
    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      role: result.role,
      schoolId: result.schoolId,
      fullName: result.fullName,
      redirectPath: result.redirectPath,
    });
  } catch (err) {
    next(err);
  }
}

export async function meController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError('UNAUTHORIZED', 'Not authenticated');

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, role, school_id, full_name, student_profiles(class_num, section, batch_id, avatar, xp, streak)')
      .eq('id', req.user.id)
      .single();

    if (error || !data) throw new ApiError('NOT_FOUND', 'Profile not found');
    res.json(data);
  } catch (err) {
    next(err);
  }
}
