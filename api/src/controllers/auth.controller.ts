import type { Request, Response, NextFunction } from 'express';
import { loginSchema, pinLoginSchema, pinRosterQuerySchema, changePasswordSchema } from '../schemas/auth.schema.js';
import * as authService from '../services/auth.service.js';
import { ApiError } from '../lib/errors.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { getSchoolFeatures } from '../lib/entitlements.js';

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

export async function changePasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError('UNAUTHORIZED', 'Not authenticated');
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await authService.changeOwnPassword(req.user, currentPassword, newPassword);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function meController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError('UNAUTHORIZED', 'Not authenticated');

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select(
        'id, role, school_id, full_name, student_profiles(class_num, section, batch_id, avatar, xp, streak), schools(name, code, logo_path)',
      )
      .eq('id', req.user.id)
      .single();

    if (error || !data) throw new ApiError('NOT_FOUND', 'Profile not found');

    // Which paid features this school has. Purely so the UI can hide nav for
    // things the school never bought — the API gates each one independently
    // via requireFeature(), so this list is a convenience, never the control.
    const features = await getSchoolFeatures(req.user.schoolId);

    // The school's own name/logo, so every portal can brand itself for the
    // school its user belongs to. Super Admin has no school and gets null,
    // keeping the platform-level EduAI identity.
    const joined = data.schools as unknown;
    const schoolRow = (Array.isArray(joined) ? joined[0] : joined) as
      | { name: string; code: string; logo_path: string | null }
      | null
      | undefined;

    res.json({
      ...data,
      email: req.user.email,
      features,
      school: schoolRow
        ? { name: schoolRow.name, code: schoolRow.code, logoPath: schoolRow.logo_path }
        : null,
    });
  } catch (err) {
    next(err);
  }
}
