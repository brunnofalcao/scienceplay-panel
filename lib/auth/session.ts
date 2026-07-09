import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/db/server";
import type { SessionProfile } from "@/types/admin";
import type { UserRole } from "@/types/database";

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Resolve o perfil do usuário logado (public.users via auth_id = auth.uid()).
 *
 * ⚠️ GOTCHA CRÍTICO (§9 do SHARED-DATA-CONTRACT): DEVE ser memoizado com
 * cache() do React. Múltiplas chamadas a auth.getUser() no mesmo request em
 * RSC rotacionam o refresh token sem persistir → refresh_token_not_found →
 * sessão zera em produção. Não remover o cache().
 */
export const getSessionProfile = cache(
  async (): Promise<SessionProfile | null> => {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (!profile) return null;

    const raw = profile as Record<string, unknown>;
    const role = (asString(raw.role) ?? "user") as UserRole;

    return {
      id: String(raw.id),
      authId: user.id,
      email: asString(raw.email) ?? user.email ?? "",
      name:
        asString(raw.name) ??
        asString(raw.full_name) ??
        asString(raw.display_name) ??
        asString(raw.email) ??
        user.email ??
        "—",
      role,
      planId: asString(raw.plan_id),
      raw,
    };
  },
);
