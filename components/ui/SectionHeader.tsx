import type { ReactNode } from "react";

/** Rótulo de seção sóbrio — estrutura sem gritar. */
export function SectionHeader({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 pt-2">
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">
        {children}
      </h2>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
