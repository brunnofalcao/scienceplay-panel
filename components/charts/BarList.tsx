export interface BarItem {
  name: string;
  /** valor que dimensiona a barra */
  count: number;
  /** rótulo à direita (ex.: custo formatado); default = count */
  hint?: string;
}

/**
 * Lista-barra sequencial (dataviz): hue único, sem grade, valor alinhado à
 * direita, nome truncado. Legível em denso.
 */
export function BarList({
  items,
  emptyMessage = "Sem dados.",
}: {
  items: BarItem[];
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return <p className="py-2 text-sm text-faint">{emptyMessage}</p>;
  }
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <ul className="space-y-2.5">
      {items.map((item, index) => (
        <li key={`${item.name}-${index}`} className="text-sm">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-ink/90">{item.name}</span>
            <span className="shrink-0 font-mono text-xs text-muted tabular-nums">
              {item.hint ?? item.count}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-panel-2">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.max((item.count / max) * 100, 3)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
