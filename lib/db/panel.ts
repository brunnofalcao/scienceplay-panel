import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/db/admin";
import { createSupabaseServerClient } from "@/lib/db/server";

export type PanelDb = {
  db: SupabaseClient;
  /** true quando está usando a service role (leitura completa, bypass RLS). */
  serviceRole: boolean;
};

/**
 * Client de LEITURA para as telas do painel (sempre depois do guard admin):
 * usa a service role quando disponível; senão degrada para o client da sessão
 * (RLS com is_admin() ainda permite leitura de admin).
 */
export async function getPanelDb(): Promise<PanelDb | null> {
  const admin = createSupabaseAdminClient();
  if (admin) return { db: admin, serviceRole: true };

  const session = await createSupabaseServerClient();
  if (session) return { db: session, serviceRole: false };

  return null;
}
