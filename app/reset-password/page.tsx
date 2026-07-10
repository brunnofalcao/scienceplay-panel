import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Nova senha" };
export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  const configured = isSupabaseConfigured();

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-line bg-panel p-8">
        <div className="flex items-start justify-between gap-2">
          <p className="font-display text-xs font-bold uppercase tracking-widest text-accent">
            Science Play
          </p>
          <ThemeToggle />
        </div>
        <h1 className="mt-1 text-xl font-semibold">Definir nova senha</h1>

        {!configured ? (
          <p className="mt-6 rounded-lg border border-warn/40 bg-warn/10 p-4 text-sm text-warn">
            Supabase não configurado.
          </p>
        ) : (
          <ResetPasswordForm />
        )}

        <Link
          href="/login"
          className="mt-4 block text-center text-sm text-accent hover:underline"
        >
          Voltar ao login
        </Link>
      </div>
    </main>
  );
}
