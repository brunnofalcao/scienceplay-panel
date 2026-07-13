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

type Summary = Record<string, unknown>;

function parseJson(message: string): Summary | null {
  let data: unknown;
  try {
    data = JSON.parse(message);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  return data as Summary;
}

function num(obj: Summary, key: string): number {
  const raw = obj[key];
  return typeof raw === "number" ? raw : 0;
}

/** Transforma a resposta JSON do SITE em chips legíveis (não em JSON cru). */
function toPills(obj: Summary): Pill[] | null {
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

function windowLabel(days: number): string {
  if (!days) return "—";
  return days >= 365 ? `${Math.round(days / 365)} ano(s)` : `${days} dias`;
}

/** Distribuição por grau (ex.: {A:1, C:2}) → "1A · 2C". */
function gradeBreakdown(v: unknown): string {
  if (!v || typeof v !== "object") return "";
  const entries = Object.entries(v as Record<string, unknown>)
    .filter(([, n]) => typeof n === "number" && (n as number) > 0)
    .sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([g, n]) => `${n as number}${g}`).join(" · ");
}

/**
 * Painel premium do PORTÃO DE GRAU: quando o SITE devolve min_grade, mostramos
 * o resultado editorial (aceitas × descartadas por grau, janela usada, mensagem
 * honesta) em vez de JSON cru. A resposta técnica fica num accordion colapsado.
 */
function GradeGateResult({ obj }: { obj: Summary }) {
  const minGrade = String(obj.min_grade ?? "");
  const requested = num(obj, "requested");
  const accepted = num(obj, "accepted");
  const discarded = num(obj, "discarded_grade_below_min");
  const evaluated = num(obj, "candidates_evaluated");
  const windowDays = num(obj, "window_final_days");
  const errors = num(obj, "errors");
  const needsReview = num(obj, "needs_review");
  const dups = num(obj, "possible_duplicates") + num(obj, "deduped");
  const message = typeof obj.message === "string" ? obj.message : "";

  const acceptedBy = gradeBreakdown(obj.accepted_by_grade);
  const discardedBy = gradeBreakdown(obj.discarded_by_grade);

  const tone: "ok" | "warn" | "empty" =
    accepted >= requested && accepted > 0 ? "ok" : accepted > 0 ? "warn" : "empty";
  const statusChip = {
    ok: { text: "Concluído", cls: "border-ok/40 bg-ok/10 text-ok" },
    warn: { text: "Parcial", cls: "border-warn/40 bg-warn/10 text-warn" },
    empty: { text: `Sem evidência ${minGrade}`, cls: "border-line-strong bg-panel-2 text-muted" },
  }[tone];

  const acceptedTone =
    tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "text-muted";

  return (
    <div className="space-y-3 rounded-xl border border-line-strong bg-panel-2/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
            Resultado da produção
          </p>
          <h4 className="mt-0.5 font-display text-sm font-semibold text-ink">
            Grau mínimo {minGrade} — porta de corte ativa
          </h4>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusChip.cls}`}
        >
          {statusChip.text}
        </span>
      </div>

      {message ? <p className="text-sm leading-relaxed text-muted">{message}</p> : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-panel px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-wide text-faint">
            Aceitas (grau ≥ {minGrade})
          </p>
          <p className={`mt-0.5 text-2xl font-bold tabular-nums ${acceptedTone}`}>
            {accepted}
            <span className="text-sm font-medium text-faint"> / {requested}</span>
          </p>
          {acceptedBy ? <p className="mt-0.5 text-[11px] text-ok">{acceptedBy}</p> : null}
        </div>
        <div className="rounded-lg border border-line bg-panel px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-wide text-faint">
            Descartadas (grau abaixo)
          </p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-muted">{discarded}</p>
          {discardedBy ? <p className="mt-0.5 text-[11px] text-warn">{discardedBy}</p> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint">
        <span>
          Candidatos avaliados: <span className="text-muted tabular-nums">{evaluated}</span>
        </span>
        <span aria-hidden>·</span>
        <span>
          Janela usada: até <span className="text-muted">{windowLabel(windowDays)}</span>
        </span>
        {needsReview > 0 ? (
          <>
            <span aria-hidden>·</span>
            <span>
              Em revisão: <span className="text-muted tabular-nums">{needsReview}</span>
            </span>
          </>
        ) : null}
        {dups > 0 ? (
          <>
            <span aria-hidden>·</span>
            <span>
              Duplicadas: <span className="text-muted tabular-nums">{dups}</span>
            </span>
          </>
        ) : null}
        {errors > 0 ? (
          <>
            <span aria-hidden>·</span>
            <span className="text-warn">
              Erros: <span className="tabular-nums">{errors}</span>
            </span>
          </>
        ) : null}
      </div>

      <details className="group">
        <summary className="cursor-pointer list-none text-[11px] text-faint hover:text-muted">
          <span className="underline decoration-dotted underline-offset-2">
            Ver resposta técnica
          </span>
        </summary>
        <pre className="mt-2 max-h-56 overflow-auto rounded-lg border border-line bg-panel-2 p-2 text-[10px] leading-relaxed text-muted">
          {JSON.stringify(obj, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export function ActionFeedback({ state }: { state: ActionResult | null }) {
  if (!state) return null;

  if (!state.ok) {
    return (
      <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs leading-relaxed text-danger">
        {state.error}
      </p>
    );
  }

  const obj = state.message ? parseJson(state.message) : null;

  // Portão de grau → painel premium.
  if (obj && "min_grade" in obj) {
    return <GradeGateResult obj={obj} />;
  }

  // Demais respostas com números conhecidos → chips.
  const summary = obj ? toPills(obj) : null;
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

  // Texto simples do SITE (mensagem sem JSON) — evita JSON cru no fallback.
  const plain =
    obj && typeof obj.message === "string"
      ? obj.message
      : state.message && !state.message.trim().startsWith("{")
        ? state.message
        : "Ação concluída.";
  return (
    <p className="rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-xs text-ok">{plain}</p>
  );
}
