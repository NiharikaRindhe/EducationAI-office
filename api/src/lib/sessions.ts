import { supabaseAdmin } from './supabase.js';
import { logger } from './logger.js';

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
export async function revokeUserSessions(userId: string, reason: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.auth.admin.signOut(userId, 'global');
    if (error) {
      logger.error({ userId, reason, err: error.message }, 'Failed to revoke sessions');
      return;
    }
    logger.info({ userId, reason }, 'Revoked all sessions for user');
  } catch (err) {
    logger.error(
      { userId, reason, err: err instanceof Error ? err.message : String(err) },
      'Failed to revoke sessions',
    );
  }
}

/** Bulk variant for school suspension / bulk deactivation. Sequential on
 *  purpose: this runs rarely and a burst of parallel admin calls against
 *  GoTrue is more likely to rate-limit than to finish faster. */
export async function revokeSessionsForUsers(userIds: string[], reason: string): Promise<void> {
  for (const id of userIds) {
    await revokeUserSessions(id, reason);
  }
}
