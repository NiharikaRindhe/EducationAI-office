import type { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import type { Role } from '../types/index.js';

/**
 * Validates the bearer token against Supabase Auth, then loads role + school_id
 * from user_profiles. This is a DB round-trip per request for now — once the
 * Postgres Auth Hook (custom JWT claims) is wired up, role/school_id can be read
 * straight off the JWT and this lookup can be dropped. Correctness first.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError('UNAUTHORIZED', 'Missing bearer token');

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user) throw new ApiError('UNAUTHORIZED', 'Invalid or expired token');

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role, school_id, is_active')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) throw new ApiError('UNAUTHORIZED', 'No profile for this account');
    if (!profile.is_active) throw new ApiError('FORBIDDEN', 'Account has been deactivated');

    req.user = {
      id: authData.user.id,
      email: authData.user.email ?? null,
      role: profile.role as Role,
      schoolId: profile.school_id as string | null,
    };
    req.accessToken = token;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError('UNAUTHORIZED', 'Not authenticated'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError('FORBIDDEN', `Requires role: ${roles.join(' or ')}`));
    }
    next();
  };
}
