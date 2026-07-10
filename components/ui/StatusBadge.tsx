// dot + rótulo curto: legível de relance, sem monospace poluído
const STATUS_TONES: Record<string, { dot: string; label?: string }> = {
  published: { dot: "bg-ok", label: "publicada" },
  approved: { dot: "bg-accent", label: "aprovada" },
  generated: { dot: "bg-faint", label: "gerada" },
  draft: { dot: "bg-faint", label: "rascunho" },
  needs_review: { dot: "bg-warn", label: "revisão" },
  possible_duplicate: { dot: "bg-warn", label: "poss. dup." },
  rejected: { dot: "bg-danger", label: "rejeitada" },
  blocked_duplicate: { dot: "bg-danger", label: "bloqueada" },
  archived: { dot: "bg-faint", label: "arquivada" },
  merged: { dot: "bg-accent", label: "mesclada" },
  updated_existing: { dot: "bg-accent", label: "atualizada" },
  // status técnicos (fila/lote)
  captured: { dot: "bg-accent", label: "capturado" },
  processing: { dot: "bg-warn", label: "processando" },
  done: { dot: "bg-ok", label: "concluído" },
  failed: { dot: "bg-danger", label: "falhou" },
  ok: { dot: "bg-ok" },
  failover: { dot: "bg-warn" },
  error: { dot: "bg-danger" },
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONES[status] ?? { dot: "bg-faint" };
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line-strong bg-panel-2 px-2 py-0.5 text-[11px] text-ink/85">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} aria-hidden />
      {tone.label ?? status}
    </span>
  );
}
