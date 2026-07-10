import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/db/server";

/**
 * Destino dos links de e-mail do Supabase (recuperação de senha etc.).
 * Troca o `code` (fluxo PKCE) ou o `token_hash` (fluxo OTP) por uma sessão —
 * route handler pode gravar cookies — e segue para `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextPath = searchParams.get("next") ?? "/reset-password";
  // só caminhos internos — nunca redirecionar para fora do painel
  const safeNext = nextPath.startsWith("/") ? nextPath : "/reset-password";

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    } else if (tokenHash && type) {
      await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    }
  }

  redirect(safeNext);
}
