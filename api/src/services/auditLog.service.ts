import { supabaseAdmin } from '../lib/supabase.js';

export async function writeAuditLog(params: {
  schoolId: string | null;
  actorId: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  await supabaseAdmin.from('audit_logs').insert({
    school_id: params.schoolId,
    actor_id: params.actorId,
    action: params.action,
    entity: params.entity,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? null,
  });
}
