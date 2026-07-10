"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const SECTIONS: Array<{
  label: string;
  items: Array<{ href: string; label: string }>;
}> = [
  {
    label: "Geral",
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

const STORAGE_KEY = "sp-nav-collapsed";

function isActiveHref(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/production") return pathname === "/production";
  return pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  // Seções colapsadas por rótulo. Estado inicial = nada colapsado (bate com o
  // SSR e evita hydration mismatch); localStorage é aplicado após montar.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCollapsed(JSON.parse(raw));
    } catch {
      // localStorage indisponível — segue com tudo aberto
    }
  }, []);

  const activeLabel = SECTIONS.find((s) =>
    s.items.some((i) => isActiveHref(pathname, i.href)),
  )?.label;

  const toggle = (label: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignora falha de persistência
      }
      return next;
    });
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
      <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-3">
        {SECTIONS.map((section) => {
          // A seção da rota atual nunca fica escondida (ou o usuário perde o
          // contexto de onde está); as demais respeitam o estado salvo.
          const isOpen = section.label === activeLabel || !collapsed[section.label];
          const panelId = `nav-${section.label}`;
          return (
            <div key={section.label}>
              <button
                type="button"
                onClick={() => toggle(section.label)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="group flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-faint hover:text-muted"
              >
                <span>{section.label}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={`transition-transform ${isOpen ? "" : "-rotate-90"}`}
                  aria-hidden
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {isOpen ? (
                <div id={panelId} className="mt-0.5 space-y-0.5">
                  {section.items.map(({ href, label }) => {
                    const active = isActiveHref(pathname, href);
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
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
