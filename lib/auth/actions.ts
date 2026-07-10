"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSessionProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/server";

export type LoginState = { error: string } | null;

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

/**
 * Login em SERVER ACTION com redirect server-side (não depende de
 * router.push) — padrão do HANDOFF §4.
 */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Informe e-mail e senha válidos." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      error:
        "Supabase não configurado. Conecte NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Credenciais inválidas." };

  const profile = await getSessionProfile();
  redirect(profile?.role === "admin" ? "/" : "/unauthorized");
}

export async function logout(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}

// ---- Redefinição de senha ----

export type ResetRequestState = { sent: boolean; error?: string } | null;

/**
 * Envia o e-mail de redefinição apontando para o PAINEL (não para o site
 * público). Requer `${painel}/auth/confirm` na allowlist de Redirect URLs do
 * Supabase. Resposta é sempre genérica — não revela se o e-mail existe.
 */
export async function requestPasswordReset(
  _prev: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const parsed = z.string().trim().email().safeParse(formData.get("email"));
  if (!parsed.success) return { sent: false, error: "Informe um e-mail válido." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { sent: false, error: "Supabase não configurado." };
  }

  const panelUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://panel.scienceplay.com";
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${panelUrl}/auth/confirm?next=/reset-password`,
  });

  return { sent: true };
}

export type UpdatePasswordState = { error: string } | null;

/** Define a nova senha (exige sessão de recuperação já estabelecida). */
export async function updatePassword(
  _prev: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) {
    return { error: "A senha precisa de pelo menos 8 caracteres." };
  }
  if (password !== confirm) return { error: "As senhas não conferem." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase não configurado." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error:
        "Link de redefinição inválido ou expirado. Peça um novo em /forgot-password.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  const profile = await getSessionProfile();
  redirect(profile?.role === "admin" ? "/" : "/unauthorized");
}
