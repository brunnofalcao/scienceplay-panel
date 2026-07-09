import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Toda ação administrativa grava em admin_audit_logs (§6 do contrato):
 * admin_id, action, entity, entity_id, before, after, created_at.
 * Retorna erro (string) quando a gravação falha — o chamador decide expor.
 */
export async function writeAuditLog(
  db: SupabaseClient,
  entry: {
    adminId: string;
    action: string;
    entity: string;
    entityId: string | null;
    before: unknown;
    after: unknown;
  },
): Promise<string | null> {
  const { error } = await db.from("admin_audit_logs").insert({
    admin_id: entry.adminId,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId,
    before: entry.before ?? null,
    after: entry.after ?? null,
  });
  return error ? error.message : null;
}
