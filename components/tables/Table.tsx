import type { ReactNode } from "react";

export function Table({
  head,
  children,
}: {
  head: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="bg-panel-2 text-[11px] uppercase tracking-wider text-faint">
          <tr>
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-3.5 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line/70 bg-panel [&>tr:hover]:bg-panel-2/60">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function Td({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={`px-3.5 py-2.5 align-middle ${className}`}>{children}</td>;
}
