import type { ReactNode } from "react";

/**
 * Estado vazio orientador (não apenas "sem dados"): diz o que aparecerá aqui
 * e, quando possível, qual a próxima ação.
 */
export function EmptyState({
  title,
  message,
  action,
}: {
  title?: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      {title ? (
        <p className="text-sm font-medium text-ink">{title}</p>
      ) : null}
      <p className="max-w-md text-sm text-muted">{message}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
