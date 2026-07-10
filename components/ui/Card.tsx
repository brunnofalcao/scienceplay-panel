import type { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-line bg-panel p-5 ${className}`}
    >
      {title ? (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 text-xs leading-relaxed text-muted">
                {subtitle}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

const TONE = {
  default: { value: "text-ink", accent: "bg-faint/40" },
  ok: { value: "text-ok", accent: "bg-ok" },
  warn: { value: "text-warn", accent: "bg-warn" },
  danger: { value: "text-danger", accent: "bg-danger" },
} as const;

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: keyof typeof TONE;
}) {
  const t = TONE[tone];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-panel px-4 py-3.5">
      {/* filete de tom à esquerda: sinaliza estado sem poluir */}
      <span
        className={`absolute inset-y-3 left-0 w-0.5 rounded-full ${t.accent}`}
        aria-hidden
      />
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
        {label}
      </p>
      {/* Sora nos números de impacto (Brandbook §14) */}
      <p
        className={`mt-1.5 font-display text-[26px] font-bold leading-none tabular-nums ${t.value}`}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 text-[11px] leading-snug text-faint">{hint}</p>
      ) : null}
    </div>
  );
}
