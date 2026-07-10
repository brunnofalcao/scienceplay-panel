"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS: Array<{
  label: string | null;
  items: Array<{ href: string; label: string }>;
}> = [
  {
    label: null,
    items: [
      { href: "/", label: "Visão geral" },
      { href: "/users", label: "Usuários" },
      { href: "/news", label: "NEWS" },
      { href: "/duplicates", label: "Duplicados" },
    ],
  },
  {
    label: "Produção",
    items: [
      { href: "/production", label: "Produção de NEWS" },
      { href: "/production/queue", label: "Fila de Produção" },
      { href: "/production/daily", label: "Produção Diária" },
      { href: "/production/costs", label: "Custos de IA" },
    ],
  },
  {
    label: "Telemetria",
    items: [
      { href: "/usage", label: "Usage" },
      { href: "/ai-logs", label: "AI Logs" },
      { href: "/cron", label: "Cron" },
    ],
  },
  {
    label: "Base",
    items: [
      { href: "/legacy", label: "Legacy" },
      { href: "/taxonomies", label: "Taxonomias" },
      { href: "/settings", label: "Settings" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/production") return pathname === "/production";
    return pathname.startsWith(href);
  };

  return (
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-line bg-panel">
      <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand font-display text-sm font-bold text-white">
          S
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold">Science Play</p>
          <p className="text-[11px] text-muted">Painel interno</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
        {SECTIONS.map((section, sectionIndex) => (
          <div key={sectionIndex} className={sectionIndex > 0 ? "mt-4" : ""}>
            {section.label ? (
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-faint">
                {section.label}
              </p>
            ) : null}
            {section.items.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative block rounded-lg px-3 py-2 text-sm ${
                    active
                      ? "bg-accent-soft font-medium text-ink"
                      : "text-muted hover:bg-panel-2 hover:text-ink"
                  }`}
                >
                  {active ? (
                    <span
                      className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent"
                      aria-hidden
                    />
                  ) : null}
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
