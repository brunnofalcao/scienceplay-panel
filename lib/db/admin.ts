import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

let cached: SupabaseClient | null = null;

/**
 * Client com SERVICE ROLE — bypassa RLS. SOMENTE server (este módulo importa
 * "server-only" e quebra o build se for puxado para um client component).
 * Retorna null quando a service role não está configurada; quem chamar deve
 * degradar com mensagem honesta, nunca fingir sucesso.
 */
export function createSupabaseAdminClient(): SupabaseClient | null {
  const env = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env || !serviceRoleKey) return null;

  if (!cached) {
    cached = createClient(env.url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return cached;
}
