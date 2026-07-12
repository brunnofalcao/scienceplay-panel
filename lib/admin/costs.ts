import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapAiLog,
  safeSelect,
  type AiLogItem,
  type QueryErrors,
} from "@/lib/admin/queries";
import { pickString, spDayStartIso, spMonthStartIso } from "@/lib/formatters";

/**
 * Analytics de custo de IA sobre ai_logs (+ users/plans para atribuição).
 * Agregação em memória sobre amostra limitada (mesmo padrão do user-stats) —
 * o tamanho da amostra é reportado para nunca fingir precisão total.
 *
 * ⚠️ Custo por NEWS: NÃO rastreável no schema atual (ai_logs não tem vínculo
 * com news_id) — ver docs/AI-COST-ATTRIBUTION-CONTRACT.md.
 */

const SAMPLE_LIMIT = 5000;

export interface CostFilters {
  from?: string;
  to?: string;
  feature?: string;
  userId?: string;
  plan?: string;
  provider?: string;
  model?: string;
  status?: string;
  errorsOnly?: boolean;
}

export interface CostRow extends AiLogItem {
  userEmail: string;
  plan: string;
}

export interface CostBucket {
  name: string;
  count: number;
  costUsd: number;
}

export interface CostAnalytics {
  rows: CostRow[];
  sampleSize: number;
  sampleTruncated: boolean;
  totals: {
    costToday: number;
    costMonth: number;
    costSample: number;
    calls: number;
    errors: number;
    needsReview: number;
    fallbacks: number;
    avgCostPerCall: number;
    avgLatencyMs: number | null;
  };
  byUser: CostBucket[];
  byPlan: CostBucket[];
  byFeature: CostBucket[];
  byProvider: CostBucket[];
  byModel: CostBucket[];
  byDay: CostBucket[];
  /** Custo EXATO por NEWS via ai_logs.entity_type/entity_id (migration 0017).
   *  Vazio enquanto não houver gerações com atribuição. */
  byNews: CostBucket[];
  newsAttributionActive: boolean;
  /** heurística por nome de feature — rotulado como estimado na UI */
  e2aCost: number;
  studioCost: number;
  errors_: QueryErrors;
}

function bucketize(
  rows: CostRow[],
  key: (row: CostRow) => string | null,
): CostBucket[] {
  const map = new Map<string, { count: number; costUsd: number }>();
  for (const row of rows) {
    const k = key(row);
    if (!k) continue;
    const entry = map.get(k) ?? { count: 0, costUsd: 0 };
    entry.count += 1;
    entry.costUsd += row.costUsd ?? 0;
    map.set(k, entry);
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.costUsd - a.costUsd);
}

export async function fetchCostAnalytics(
  db: SupabaseClient,
  filters: CostFilters = {},
): Promise<CostAnalytics> {
  const errors: QueryErrors = [];

  const [logRows, userRows, planRows] = await Promise.all([
    safeSelect(
      db,
      "ai_logs",
      "*",
      errors,
      (q) => {
        let query = q as {
          gte: (c: string, v: string) => typeof query;
          lte: (c: string, v: string) => typeof query;
          eq: (c: string, v: string) => typeof query;
          order: (c: string, o: unknown) => typeof query;
        };
        if (filters.from) query = query.gte("created_at", filters.from);
        if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59-03:00`);
        if (filters.userId) query = query.eq("user_id", filters.userId);
        return query.order("created_at", { ascending: false });
      },
      SAMPLE_LIMIT,
    ),
    safeSelect(db, "users", "*", errors, undefined, 2000),
    safeSelect(db, "plans", "*", errors, undefined, 20),
  ]);

  const planNameById = new Map(
    planRows.map((r) => [String(r.id), pickString(r, ["name", "key"]) ?? "—"]),
  );
  const userById = new Map(
    userRows.map((r) => [
      String(r.id),
      {
        email: pickString(r, ["email"]) ?? String(r.id),
        plan: (() => {
          const planId = pickString(r, ["plan_id"]);
          return (planId && planNameById.get(planId)) ?? "—";
        })(),
      },
    ]),
  );

  let rows: CostRow[] = logRows.map((raw) => {
    const item = mapAiLog(raw);
    const user = item.userId ? userById.get(item.userId) : undefined;
    return {
      ...item,
      userEmail: user?.email ?? (item.userId ? item.userId : "sistema/anônimo"),
      plan: user?.plan ?? "—",
    };
  });

  const contains = (value: string, needle?: string) =>
    !needle || value.toLowerCase().includes(needle.toLowerCase());
  rows = rows.filter(
    (r) =>
      contains(r.feature, filters.feature) &&
      contains(r.provider, filters.provider) &&
      contains(r.model, filters.model) &&
      contains(r.status, filters.status) &&
      contains(r.plan, filters.plan) &&
      (!filters.errorsOnly || Boolean(r.error) || r.status === "error"),
  );

  const dayStart = spDayStartIso();
  const monthStart = spMonthStartIso();
  const cost = (subset: CostRow[]) =>
    subset.reduce((sum, r) => sum + (r.costUsd ?? 0), 0);

  const latencies = rows
    .map((r) => r.latencyMs)
    .filter((v): v is number => v !== null && v > 0);

  const byDay = bucketize(rows, (r) => r.createdAt?.slice(0, 10) ?? null)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-30);

  // Custo exato por NEWS: chamadas com entity_type='news' (0017). Enriquecemos
  // os títulos das top NEWS para a leitura executiva.
  const newsCostRows = rows.filter((r) => r.entityType === "news" && r.entityId);
  let byNews = bucketize(newsCostRows, (r) => r.entityId).slice(0, 10);
  if (byNews.length > 0) {
    const titles = await safeSelect(
      db,
      "news_i18n",
      "news_id, title",
      errors,
      (q) =>
        (q as { in: (c: string, v: string[]) => unknown }).in(
          "news_id",
          byNews.map((b) => b.name),
        ),
      byNews.length * 3,
    );
    const titleByNews = new Map(
      titles.map((t) => [String(t.news_id), pickString(t, ["title"]) ?? String(t.news_id)]),
    );
    byNews = byNews.map((b) => ({
      ...b,
      name: titleByNews.get(b.name) ?? b.name,
    }));
  }

  return {
    rows,
    sampleSize: logRows.length,
    sampleTruncated: logRows.length >= SAMPLE_LIMIT,
    totals: {
      costToday: cost(rows.filter((r) => (r.createdAt ?? "") >= dayStart)),
      costMonth: cost(rows.filter((r) => (r.createdAt ?? "") >= monthStart)),
      costSample: cost(rows),
      calls: rows.length,
      // Erro DURO = a chamada falhou de vez (status "error"). "failover" é
      // SUCESSO (o secundário entregou) e "needs_review" é conteúdo sinalizado
      // para revisão (surge na fila editorial) — nenhum dos dois é erro de IA.
      errors: rows.filter((r) => r.status === "error").length,
      needsReview: rows.filter((r) => r.status === "needs_review").length,
      fallbacks: rows.filter((r) => r.fallback || r.status === "failover").length,
      avgCostPerCall: rows.length ? cost(rows) / rows.length : 0,
      avgLatencyMs: latencies.length
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : null,
    },
    byUser: bucketize(rows, (r) => r.userEmail),
    byPlan: bucketize(rows, (r) => r.plan),
    byFeature: bucketize(rows, (r) => r.feature),
    byProvider: bucketize(rows, (r) => r.provider),
    byModel: bucketize(rows, (r) => r.model),
    byDay,
    byNews,
    newsAttributionActive: newsCostRows.length > 0,
    e2aCost: cost(rows.filter((r) => /e2a|practice/i.test(r.feature))),
    studioCost: cost(rows.filter((r) => /studio|content/i.test(r.feature))),
    errors_: errors,
  };
}
