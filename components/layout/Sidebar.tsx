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
      { href: "/", label: "Dashboard" },
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
    <aside className="flex w-52 shrink-0 flex-col border-r border-line bg-panel">
      <div className="border-b border-line px-4 py-4">
        <p className="font-display text-xs font-bold uppercase tracking-widest text-accent">
          Science Play
        </p>
        <p className="font-display text-sm font-semibold">Panel</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {SECTIONS.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.label ? (
              <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted">
                {section.label}
              </p>
            ) : null}
            {section.items.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`block rounded-md px-3 py-1.5 text-sm ${
                  isActive(href)
                    ? "bg-panel-2 font-medium text-accent"
                    : "text-muted hover:bg-panel-2 hover:text-ink"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
