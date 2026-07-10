import Link from "next/link";

export interface AttentionItem {
  label: string;
  count: number;
  href: string;
  cta: string;
  tone: "warn" | "danger";
}

/**
 * Command Center — faixa "Precisa de atenção": o que exige ação AGORA,
 * priorizado, com destino direto. Só aparece quando há algo a fazer;
 * caso contrário, um estado calmo de "tudo em dia".
 */
export function AttentionRow({ items }: { items: AttentionItem[] }) {
  const active = items.filter((i) => i.count > 0);

  if (active.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-ok/25 bg-ok/[0.06] px-4 py-3 text-sm">
        <span className="h-2 w-2 rounded-full bg-ok" aria-hidden />
        <span className="text-ink">Tudo em dia.</span>
        <span className="text-muted">
          Nada pendente de revisão, duplicados ou erros de IA no momento.
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-panel p-2">
      <ul className="flex flex-col divide-y divide-line/70 sm:flex-row sm:divide-x sm:divide-y-0">
        {active.map((item) => (
          <li key={item.label} className="flex-1">
            <Link
              href={item.href}
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-panel-2"
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display text-sm font-bold tabular-nums ${
                    item.tone === "danger"
                      ? "bg-danger/12 text-danger"
                      : "bg-warn/12 text-warn"
                  }`}
                >
                  {item.count}
                </span>
                <span className="text-sm text-ink">{item.label}</span>
              </span>
              <span className="shrink-0 text-xs text-accent">{item.cta} →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
