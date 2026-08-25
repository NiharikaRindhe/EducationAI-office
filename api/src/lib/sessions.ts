import { supabaseAdmin } from './supabase.js';
import { logger } from './logger.js';
import { writeAuditLog } from '../services/auditLog.service.js';

/**
 * Who caused a revocation, for the audit trail.
 *
 * Optional because a few revocations are system-initiated (a sweep, a
 * suspension cascade) and have no human actor. When absent the audit entry
 * records the affected user as their own actor rather than being dropped —
 * losing the record entirely would be worse than an imprecise one.
 */
export interface RevocationContext {
  actorId?: string;
  schoolId?: string | null;
}

/**
 * Force every existing session for a user to end.
 *
 * Why this matters more here than on a typical web app: these are SHARED
 * lab computers. Changing a password did not previously invalidate the
 * token already sitting in some browser's localStorage, so:
 *
 *   - A student whose PIN was reset because a classmate learned it — the
 *     classmate's open session kept working.
 *   - A teacher removed from the school kept an active session until the
 *     token happened to expire.
 *
 * Supabase revokes all refresh tokens for the user and marks existing
 * access tokens unusable for refresh. Access tokens already issued remain
 * cryptographically valid until they expire (~1h), but requireAuth
 * re-reads is_active and the school's status from the DB on every request,
 * so a deactivated account is refused immediately regardless.
 *
 * Deliberately never throws: revocation failing must not roll back the
 * password reset that just succeeded — that would leave the caller
 * believing the credential is unchanged when it is not. Logged loudly
 * instead.
 */
export async function revokeUserSessions(
  userId: string,
  reason: string,
  ctx: RevocationContext = {},
): Promise<void> {
  let revoked = false;
  let sessionsDeleted = 0;
  try {
    // NOT auth.admin.signOut(): that takes a JWT, not a user id, so calling it
    // with an id failed on every invocation. This deletes the user's rows in
    // auth.sessions, which cascades to their refresh tokens.
    const { data, error } = await supabaseAdmin.rpc('revoke_user_sessions', { p_user_id: userId });
    if (error) {
      logger.error({ userId, reason, err: error.message }, 'Failed to revoke sessions');
    } else {
      revoked = true;
      sessionsDeleted = Number(data ?? 0);
      logger.info({ userId, reason, sessionsDeleted }, 'Revoked all sessions for user');
    }
  } catch (err) {
    logger.error(
      { userId, reason, err: err instanceof Error ? err.message : String(err) },
      'Failed to revoke sessions',
    );
  }

  // Audited here rather than at each of the nine call sites, so no future
  // caller can forget. The attempt is recorded even when it failed — "we tried
  // to cut this session off and could not" is exactly what an investigation
  // needs to know. writeAuditLog never throws.
  await writeAuditLog({
    schoolId: ctx.schoolId ?? null,
    actorId: ctx.actorId ?? userId,
    action: revoked ? 'session.revoked' : 'session.revoke_failed',
    entity: 'user',
    entityId: userId,
    metadata: { reason, sessionsDeleted },
  });
}

/** Bulk variant for school suspension / bulk deactivation. Sequential on
 *  purpose: this runs rarely and a burst of parallel admin calls against
 *  GoTrue is more likely to rate-limit than to finish faster. */
/**
 * Keep the newest session and drop every older one for this user.
 *
 * Used on login so the same credentials cannot stay open on two lab PCs
 * (sheet items #1 / #34). Must run AFTER the new session exists — otherwise
 * there is nothing to keep.
 */
export async function revokeOtherUserSessions(
  userId: string,
  reason: string,
  ctx: RevocationContext = {},
): Promise<void> {
  let revoked = false;
  let sessionsDeleted = 0;
  try {
    const { data, error } = await supabaseAdmin.rpc('revoke_other_user_sessions', { p_user_id: userId });
    if (error) {
      logger.error({ userId, reason, err: error.message }, 'Failed to revoke other sessions');
    } else {
      revoked = true;
      sessionsDeleted = Number(data ?? 0);
      if (sessionsDeleted > 0) {
        logger.info({ userId, reason, sessionsDeleted }, 'Revoked older sessions for user');
      }
    }
  } catch (err) {
    logger.error(
      { userId, reason, err: err instanceof Error ? err.message : String(err) },
      'Failed to revoke other sessions',
    );
  }

  if (sessionsDeleted === 0) return;

  await writeAuditLog({
    schoolId: ctx.schoolId ?? null,
    actorId: ctx.actorId ?? userId,
    action: revoked ? 'session.replaced' : 'session.revoke_failed',
    entity: 'user',
    entityId: userId,
    metadata: { reason, sessionsDeleted },
  });
}

export async function revokeSessionsForUsers(
  userIds: string[],
  reason: string,
  ctx: RevocationContext = {},
): Promise<void> {
  for (const id of userIds) {
    await revokeUserSessions(id, reason, ctx);
  }
}
