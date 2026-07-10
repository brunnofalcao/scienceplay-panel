import { logout } from "@/lib/auth/actions";
import { getPanelEnvName } from "@/lib/supabase/env";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import type { SessionProfile } from "@/types/admin";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SP";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function Header({ profile }: { profile: SessionProfile | null }) {
  const env = getPanelEnvName();
  const isProduction = env === "production";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-bg/80 px-6 py-3 backdrop-blur-md md:px-10">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ${
          isProduction
            ? "border-danger/40 bg-danger/10 text-danger"
            : "border-warn/40 bg-warn/10 text-warn"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${isProduction ? "bg-danger" : "bg-warn"}`}
          aria-hidden
        />
        {env}
      </span>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        {profile ? (
          <div className="flex items-center gap-3 border-l border-line pl-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{profile.name}</p>
              <p className="text-[11px] leading-tight text-muted">
                {profile.email}
              </p>
            </div>
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold text-white"
              title={`${profile.name} · ${profile.role}`}
            >
              {initials(profile.name)}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:border-line-strong hover:text-ink"
              >
                Sair
              </button>
            </form>
          </div>
        ) : (
          <p className="text-xs text-muted">Supabase não configurado</p>
        )}
      </div>
    </header>
  );
}
