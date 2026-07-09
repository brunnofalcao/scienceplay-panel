export function BarList({
  items,
  emptyMessage = "Sem dados.",
}: {
  items: Array<{ name: string; count: number }>;
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">{emptyMessage}</p>;
  }
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.name} className="text-sm">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate">{item.name}</span>
            <span className="font-mono text-xs text-muted tabular-nums">
              {item.count}
            </span>
          </div>
          <div className="mt-0.5 h-1.5 rounded-full bg-panel-2">
            <div
              className="h-1.5 rounded-full bg-accent/70"
              style={{ width: `${Math.max((item.count / max) * 100, 2)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
