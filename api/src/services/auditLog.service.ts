import { supabaseAdmin } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

/**
 * Append-only record of who did what.
 *
 * Deliberately NEVER throws. An audit write is a side effect of an action that
 * has already happened — if the insert fails, the credential reset or the
 * suspension still occurred, and turning that into a 500 would roll the caller
 * back into an inconsistent belief about the world. A failure is logged loudly
 * instead, so a broken audit table is visible without being destructive.
 *
 * Never put a secret in `metadata`. Credential resets record THAT they
 * happened and for whom, never the PIN or password issued.
 */
export async function writeAuditLog(params: {
  schoolId: string | null;
  actorId: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('audit_logs').insert({
      school_id: params.schoolId,
      actor_id: params.actorId,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? null,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    logger.error(
      {
        err: err instanceof Error ? err.message : String(err),
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        actorId: params.actorId,
      },
      'AUDIT WRITE FAILED — action completed but was not recorded',
    );
  }
}
