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
  if (!panel.serviceRole) {
    return {
      error:
        "Service role ausente para ações administrativas. Configure SUPABASE_SERVICE_ROLE_KEY (server-only).",
    };
  }

  return { db: panel.db, serviceRole: panel.serviceRole, profile };
}
