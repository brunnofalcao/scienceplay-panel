import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { SessionProfile } from "@/types/admin";

export type GuardResult =
  | { configured: false; profile: null }
  | { configured: true; profile: SessionProfile };

/**
 * Guard das rotas internas do painel:
 * - Supabase não configurado → deixa renderizar o estado honesto
 *   "Conecte o Supabase" (não há dado real a proteger sem credenciais).
 * - anônimo → /login
 * - logado sem role admin → /unauthorized
 * - admin → segue.
 */
export async function requireAdmin(): Promise<GuardResult> {
  if (!isSupabaseConfigured()) {
    return { configured: false, profile: null };
  }

  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/unauthorized");

  return { configured: true, profile };
}
