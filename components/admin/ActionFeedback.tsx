import type { ActionResult } from "@/types/admin";

// Rótulos amigáveis para as chaves de resumo devolvidas pelos endpoints do SITE.
const LABELS: Record<string, string> = {
  discovered: "descobertos",
  captured: "capturados",
  skipped_already_queued: "já na fila",
  failed: "falhas",
  processed: "processadas",
  requested: "pedidas",
  published: "publicadas",
  generated: "geradas",
  needs_review: "em revisão",
  deduped: "duplicadas",
  possible_duplicates: "possíveis dup.",
  unresolved: "não resolvidas",
  errors: "erros",
};

// chaves com destaque de alerta quando > 0
const ALERT_KEYS = new Set(["failed", "errors", "unresolved", "needs_review"]);
const GOOD_KEYS = new Set(["captured", "published", "generated"]);

type Pill = { label: string; value: number; tone: "ok" | "warn" | "neutral" };

/** Transforma a resposta JSON do SITE em chips legíveis (não em JSON cru). */
function parseSummary(message: string): Pill[] | null {
  let data: unknown;
  try {
    data = JSON.parse(message);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;

  const pills: Pill[] = [];
  for (const [key, label] of Object.entries(LABELS)) {
    const raw = obj[key];
    if (typeof raw !== "number") continue;
    const tone: Pill["tone"] =
      ALERT_KEYS.has(key) && raw > 0
        ? "warn"
        : GOOD_KEYS.has(key) && raw > 0
          ? "ok"
          : "neutral";
    pills.push({ label, value: raw, tone });
  }
  return pills.length > 0 ? pills : null;
}

const PILL_TONE = {
  ok: "border-ok/40 bg-ok/10 text-ok",
  warn: "border-warn/40 bg-warn/10 text-warn",
  neutral: "border-line-strong bg-panel-2 text-muted",
} as const;

export function ActionFeedback({ state }: { state: ActionResult | null }) {
  if (!state) return null;

  if (!state.ok) {
    return (
      <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs leading-relaxed text-danger">
        {state.error}
      </p>
    );
  }

  const summary = state.message ? parseSummary(state.message) : null;
  if (summary) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-ok/30 bg-ok/[0.06] px-2.5 py-2">
        <span className="text-xs font-medium text-ok">✓ concluído</span>
        {summary.map((pill) => (
          <span
            key={pill.label}
            className={`rounded-md border px-1.5 py-0.5 text-[11px] tabular-nums ${PILL_TONE[pill.tone]}`}
          >
            <span className="font-semibold">{pill.value}</span> {pill.label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <p className="rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-xs text-ok">
      {state.message ?? "Ação concluída."}
    </p>
  );
}
