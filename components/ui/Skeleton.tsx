/** Placeholder de carregamento sóbrio (pulse leve, respeita reduced-motion). */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-panel-2 ${className}`} />
  );
}

/** Grade de cartões de métrica em carregamento. */
export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-line bg-panel px-4 py-3.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Página em carregamento: título + duas fileiras de KPIs. */
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-52" />
      <StatGridSkeleton />
      <StatGridSkeleton />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}
