"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/users", label: "Usuários" },
  { href: "/news", label: "NEWS" },
  { href: "/duplicates", label: "Duplicados" },
  { href: "/usage", label: "Usage" },
  { href: "/ai-logs", label: "AI Logs" },
  { href: "/cron", label: "Cron" },
  { href: "/legacy", label: "Legacy" },
  { href: "/taxonomies", label: "Taxonomias" },
  { href: "/settings", label: "Settings" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-line bg-panel">
      <div className="border-b border-line px-4 py-4">
        <p className="text-xs uppercase tracking-widest text-accent">
          Science Play
        </p>
        <p className="text-sm font-semibold">Panel</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {NAV.map(({ href, label }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`block rounded-md px-3 py-1.5 text-sm ${
                active
                  ? "bg-panel-2 font-medium text-accent"
                  : "text-muted hover:bg-panel-2 hover:text-ink"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
