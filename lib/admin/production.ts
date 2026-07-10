import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  countBy,
  enrichNewsRows,
  safeCount,
  safeSelect,
  type NewsListItem,
  type QueryErrors,
} from "@/lib/admin/queries";
import { pickString, spDayStartIso, spMonthStartIso } from "@/lib/formatters";
import type { GenericRow } from "@/types/database";

/** Visão executiva da produção de NEWS (dados reais de news_reviews/cron_logs). */

export interface ProductionOverview {
  today: number;
  month: number;
  publishedToday: number;
  autoPublishedMonth: number;
  possibleDuplicates: number;
  needsReview: number;
  byArea: Array<{ name: string; count: number }>;
  byGrade: Array<{ name: string; count: number }>;
  byOrigin: Array<{ name: string; count: number }>;
  lastCron: GenericRow | null;
  /** Execuções REAIS do motor diário — o SITE grava em usage_events (cron_daily_news) */
  dailyRuns: GenericRow[];
  errors: QueryErrors;
}

export async function fetchProductionOverview(
  db: SupabaseClient,
): Promise<ProductionOverview> {
  const errors: QueryErrors = [];
  const dayStart = spDayStartIso();
  const monthStart = spMonthStartIso();
  const gte =
    (column: string, value: string) => (q: unknown) =>
      (q as { gte: (c: string, v: string) => unknown }).gte(column, value);

  const [today, month, publishedToday, autoPublishedMonth, possibleDup, needsReview, monthRows, cronRows] =
    await Promise.all([
      safeCount(db, "news_reviews", errors, gte("created_at", dayStart)),
      safeCount(db, "news_reviews", errors, gte("created_at", monthStart)),
      safeCount(db, "news_reviews", errors, (q) =>
        (q as { gte: (c: string, v: string) => { eq: (c: string, v: string) => unknown } })
          .gte("created_at", dayStart)
          .eq("status", "published"),
      ),
      safeCount(db, "news_reviews", errors, (q) =>
        (q as { gte: (c: string, v: string) => { eq: (c: string, v: boolean) => unknown } })
          .gte("created_at", monthStart)
          .eq("auto_published", true),
      ),
      safeCount(db, "news_reviews", errors, (q) =>
        (q as { eq: (c: string, v: string) => unknown }).eq("status", "possible_duplicate"),
      ),
      safeCount(db, "news_reviews", errors, (q) =>
        (q as { eq: (c: string, v: string) => unknown }).eq("status", "needs_review"),
      ),
      safeSelect(
        db,
        "news_reviews",
        "area, evidence_grade, origin_type, categories(name)",
        errors,
        (q) => (q as { gte: (c: string, v: string) => unknown }).gte("created_at", monthStart),
        2000,
      ),
      safeSelect(
        db,
        "cron_logs",
        "*",
        errors,
        (q) =>
          (q as { order: (c: string, o: unknown) => unknown }).order("created_at", {
            ascending: false,
          }),
        1,
      ),
    ]);

  const dailyRuns = await safeSelect(
    db,
    "usage_events",
    "*",
    errors,
    (q) =>
      (
        q as {
          eq: (c: string, v: string) => { order: (c: string, o: unknown) => unknown };
        }
      )
        .eq("event", "cron_daily_news")
        .order("created_at", { ascending: false }),
    30,
  );

  const areaName = (row: GenericRow): string | null => {
    const cat = row.categories as GenericRow | GenericRow[] | null;
    const fromCategory = Array.isArray(cat)
      ? pickString(cat[0] ?? {}, ["name"])
      : cat
        ? pickString(cat, ["name"])
        : null;
    return fromCategory ?? pickString(row, ["area"]);
  };

  return {
    today,
    month,
    publishedToday,
    autoPublishedMonth,
    possibleDuplicates: possibleDup,
    needsReview,
    byArea: countBy(monthRows, areaName).slice(0, 10),
    byGrade: countBy(monthRows, (r) => pickString(r, ["evidence_grade"])).slice(0, 6),
    byOrigin: countBy(monthRows, (r) => pickString(r, ["origin_type"])).slice(0, 8),
    lastCron: cronRows[0] ?? null,
    dailyRuns,
    errors,
  };
}

/** Fila editorial real: NEWS em estados não-finais, prontas para ação. */
export async function fetchEditorialQueue(db: SupabaseClient): Promise<{
  items: NewsListItem[];
  errors: QueryErrors;
}> {
  const errors: QueryErrors = [];
  const rows = await safeSelect(
    db,
    "news_reviews",
    "*",
    errors,
    (q) =>
      (
        q as {
          in: (c: string, v: string[]) => { order: (c: string, o: unknown) => unknown };
        }
      )
        .in("status", ["generated", "needs_review", "possible_duplicate", "draft"])
        .order("created_at", { ascending: false }),
    100,
  );
  const items = await enrichNewsRows(db, rows, errors);
  return { items, errors };
}

/**
 * Candidatos de captura: a tabela source_candidates ainda NÃO existe no
 * schema (proposta aditiva em db/migrations/proposed/). Detecta em runtime —
 * se o SITE aplicar a migration, a fila passa a listar automaticamente.
 */
export async function fetchSourceCandidates(db: SupabaseClient): Promise<{
  available: boolean;
  rows: GenericRow[];
}> {
  const probeErrors: QueryErrors = [];
  const rows = await safeSelect(
    db,
    "source_candidates",
    "*",
    probeErrors,
    (q) =>
      (q as { order: (c: string, o: unknown) => unknown }).order("created_at", {
        ascending: false,
      }),
    100,
  );
  const missing = probeErrors.some((e) => /does not exist|relation/i.test(e));
  return { available: !missing, rows };
}
