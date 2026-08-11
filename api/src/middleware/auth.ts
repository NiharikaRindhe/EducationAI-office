import type { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import type { Role } from '../types/index.js';

/**
 * Absolute session lifetime. A Supabase session refreshes forever, so without
 * this a sign-in on a shared lab machine stays valid indefinitely — the access
 * token's `exp` only bounds the token, not the session behind it.
 *
 * Twelve hours by default: longer than any school day, so it never interrupts
 * a lesson, but a session left behind on Monday cannot be picked up on Tuesday.
 */
const MAX_SESSION_HOURS = Number(process.env.SESSION_ABSOLUTE_MAX_HOURS ?? 12);
const MAX_SESSION_MS = MAX_SESSION_HOURS * 60 * 60_000;

/**
 * session_id -> session start (ms).
 *
 * A session's creation time never changes, so this is cached for the life of
 * the process rather than with a TTL. Without it every authenticated request
 * would pay a third database round-trip. Bounded so a long-running instance
 * cannot accumulate entries for every session it has ever seen.
 */
const sessionStartCache = new Map<string, number>();
const SESSION_CACHE_MAX = 10_000;

/** Read `session_id` from an already-verified token. */
function sessionIdFrom(token: string): string | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { session_id?: string };
    return json.session_id ?? null;
  } catch {
    return null;
  }
}

/**
 * Throws when the session behind this token started too long ago.
 *
 * Deliberately does NOT throw when the session's age cannot be determined: a
 * failed lookup is an infrastructure problem, and turning it into a mass
 * sign-out mid-lab-period would be a far worse outcome than one session
 * outliving its window. The token itself is already verified by this point.
 */
async function assertSessionWithinAbsoluteLimit(token: string): Promise<void> {
  const sessionId = sessionIdFrom(token);
  if (!sessionId) return;

  let startedAt = sessionStartCache.get(sessionId);

  if (startedAt === undefined) {
    const { data, error } = await supabaseAdmin.rpc('session_started_at', { p_session_id: sessionId });
    if (error) {
      logger.warn({ err: error.message }, 'Could not read session start; skipping absolute-expiry check');
      return;
    }
    if (!data) return; // session row already gone — getUser would have rejected it
    startedAt = new Date(data as string).getTime();

    if (sessionStartCache.size >= SESSION_CACHE_MAX) sessionStartCache.clear();
    sessionStartCache.set(sessionId, startedAt);
  }

  if (Date.now() - startedAt > MAX_SESSION_MS) {
    sessionStartCache.delete(sessionId);
    // Kill it server-side too, so a refresh token cannot immediately mint
    // another access token for the same expired session.
    void supabaseAdmin.auth.admin.signOut(token, 'local').catch(() => {});
    throw new ApiError('UNAUTHORIZED', 'Session expired — please sign in again');
  }
}

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

    await assertSessionWithinAbsoluteLimit(token);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role, school_id, is_active, last_seen_at, schools(is_active)')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) throw new ApiError('UNAUTHORIZED', 'No profile for this account');
    if (!profile.is_active) throw new ApiError('FORBIDDEN', 'Account has been deactivated');

    // A school suspended by the Super Admin (non-payment, policy violation, off-
    // boarding) must lock out every already-logged-in session immediately, not
    // just block future logins — this check runs on every request, not only at
    // sign-in. super_admin has no school_id and is exempt.
    const school = Array.isArray(profile.schools) ? profile.schools[0] : profile.schools;
    if (profile.school_id && school && !school.is_active) {
      throw new ApiError('FORBIDDEN', "This school's access has been suspended by EduAI. Contact your administrator.");
    }

    req.user = {
      id: authData.user.id,
      email: authData.user.email ?? null,
      role: profile.role as Role,
      schoolId: profile.school_id as string | null,
    };
    req.accessToken = token;
    touchLastSeen(authData.user.id, profile.last_seen_at as string | null);
    next();
  } catch (err) {
    next(err);
  }
}

const LAST_SEEN_THROTTLE_MS = 5 * 60_000;

/** Fire-and-forget heartbeat, throttled to once per 5 min per user — cheap
 *  enough to run on the request path without a DB write on every call.
 *  Powers the "active now" panels on the School/Super Admin dashboards. */
function touchLastSeen(userId: string, lastSeenAt: string | null): void {
  if (lastSeenAt && Date.now() - new Date(lastSeenAt).getTime() < LAST_SEEN_THROTTLE_MS) return;
  void supabaseAdmin
    .from('user_profiles')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', userId)
    .then(() => {});
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
