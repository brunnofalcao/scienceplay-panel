import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSessionProfile } from "@/lib/auth/session";
import { getPanelDb } from "@/lib/db/panel";
import type { SessionProfile } from "@/types/admin";

export type AdminActionContext = {
  db: SupabaseClient;
  serviceRole: boolean;
  profile: SessionProfile;
};

/**
 * Contexto comum das server actions administrativas: exige sessão com
 * role=admin e um client de escrita. Retorna string de erro (nunca lança)
 * para a UI mostrar mensagem honesta.
 */
export async function getAdminActionContext(): Promise<
  AdminActionContext | { error: string }
> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Sessão expirada. Faça login novamente." };
  if (profile.role !== "admin") {
    return { error: "Acesso não autorizado." };
  }

  const panel = await getPanelDb();
  if (!panel) {
    return {
      error:
        "Supabase não configurado. Conecte NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  // Sem service role, as ações rodam com a sessão do admin — a RLS do banco
  // (is_admin()/is_editor_or_admin() + policy de INSERT em admin_audit_logs)
  // ainda garante que só admin escreve. Tabelas sem policy de escrita admin
  // (ex.: professions/specialties) falham com o erro real do Postgres.
  return { db: panel.db, serviceRole: panel.serviceRole, profile };
}
