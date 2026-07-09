import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Client Supabase para RSC / Server Actions / Route Handlers, com sessão do
 * usuário (cookies). Retorna null quando o Supabase ainda não foi configurado —
 * o painel deve buildar e rodar sem credenciais reais.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  const env = getSupabasePublicEnv();
  if (!env) return null;

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll chamado a partir de um Server Component puro — pode ser
          // ignorado quando o middleware está renovando a sessão.
        }
      },
    },
  });
}
