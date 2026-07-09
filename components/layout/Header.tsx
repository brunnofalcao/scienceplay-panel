import { logout } from "@/lib/auth/actions";
import { getPanelEnvName } from "@/lib/supabase/env";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import type { SessionProfile } from "@/types/admin";

export function Header({ profile }: { profile: SessionProfile | null }) {
  const env = getPanelEnvName();
  const isProduction = env === "production";

  return (
    <header className="flex items-center justify-between border-b border-line bg-panel px-6 py-3">
      <span
        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${
          isProduction
            ? "border-danger/50 bg-danger/10 text-danger"
            : "border-warn/50 bg-warn/10 text-warn"
        }`}
      >
        {env}
      </span>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        {profile ? (
          <>
            <div className="text-right">
              <p className="text-sm leading-tight">{profile.name}</p>
              <p className="text-xs leading-tight text-muted">
                {profile.email} · {profile.role}
              </p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-ink"
              >
                Sair
              </button>
            </form>
          </>
        ) : (
          <p className="text-xs text-muted">Supabase não configurado</p>
        )}
      </div>
    </header>
  );
}
