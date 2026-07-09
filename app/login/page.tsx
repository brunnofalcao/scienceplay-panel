import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "@/components/auth/LoginForm";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export const metadata: Metadata = { title: "Login" };

// Nunca pré-renderizar estático: o estado "Supabase não configurado" seria
// congelado no build mesmo com env presente em runtime (gotcha §9 do HANDOFF).
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const configured = isSupabaseConfigured();

  if (configured) {
    const profile = await getSessionProfile();
    if (profile?.role === "admin") redirect("/");
    if (profile) redirect("/unauthorized");
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-line bg-panel p-8">
        <div className="flex items-start justify-between gap-2">
          <p className="font-display text-xs font-bold uppercase tracking-widest text-accent">
            Science Play
          </p>
          <ThemeToggle />
        </div>
        <h1 className="mt-1 text-xl font-semibold">Panel — acesso interno</h1>
        <p className="mt-2 text-sm text-muted">
          Uso restrito à equipe. Todas as ações são auditadas.
        </p>

        {!configured ? (
          <div className="mt-6 rounded-lg border border-warn/40 bg-warn/10 p-4 text-sm text-warn">
            Supabase não configurado. Conecte{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
            para habilitar o login.
          </div>
        ) : (
          <LoginForm />
        )}
      </div>
    </main>
  );
}
