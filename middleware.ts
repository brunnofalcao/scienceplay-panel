import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Middleware do painel:
 * 1. Renova a sessão Supabase (mesmo padrão do SITE) — é aqui que os cookies
 *    de refresh são persistidos com segurança.
 * 2. Aplica X-Robots-Tag: noindex, nofollow em TODAS as respostas — o painel
 *    é interno e nunca deve ser indexado.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const env = getSupabasePublicEnv();
  if (env) {
    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    // Não remover: mantém o token renovado ANTES dos Server Components
    // rodarem (evita a rotação de refresh token dentro do RSC — §9 do contrato).
    await supabase.auth.getUser();
  }

  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
