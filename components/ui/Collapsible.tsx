import type { ReactNode } from "react";

/**
 * Seção secundária colapsável — usa <details> nativo (acessível, sem JS,
 * estado preservado pelo browser). Fechada por padrão para manter a dobra
 * do Command Center enxuta.
 */
export function Collapsible({
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-line bg-panel px-4 py-2.5 hover:border-line-strong">
        <span className="flex items-baseline gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-faint">
            {title}
          </span>
          {hint ? <span className="text-xs text-muted">{hint}</span> : null}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className="group-open:hidden">Ver detalhes</span>
          <span className="hidden group-open:inline">Ocultar</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            className="transition-transform group-open:rotate-180"
            aria-hidden
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </summary>
      <div className="space-y-3 pt-3">{children}</div>
    </details>
  );
}
