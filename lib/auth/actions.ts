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
