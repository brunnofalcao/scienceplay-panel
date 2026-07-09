import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  countBy,
  enrichNewsRows,
  safeSelect,
  type QueryErrors,
} from "@/lib/admin/queries";
import { commercialSignals, mapPanelUser } from "@/lib/admin/user-stats";
import { pickString } from "@/lib/formatters";
import type { UserStats } from "@/types/admin";
import type { UsageEventRow } from "@/types/database";

const nameMap = async (
  db: SupabaseClient,
  table: string,
  errors: QueryErrors,
): Promise<Map<string, string>> => {
  const rows = await safeSelect(db, table, "*", errors, undefined, 500);
  const map = new Map<string, string>();
  for (const row of rows) {
    const id = row.id != null ? String(row.id) : null;
    const name = pickString(row, ["name", "title", "label"]);
    if (id && name) map.set(id, name);
  }
  return map;
};

export async function fetchUserDetail(db: SupabaseClient, userId: string) {
  const errors: QueryErrors = [];

  const [userRows, plans, professions, specialties] = await Promise.all([
    safeSelect(
      db,
      "users",
      "*",
      errors,
      (q) => (q as { eq: (c: string, v: string) => unknown }).eq("id", userId),
      1,
    ),
    nameMap(db, "plans", errors),
    nameMap(db, "professions", errors),
    nameMap(db, "specialties", errors),
  ]);

  const userRow = userRows[0];
  if (!userRow) return null;

  const user = mapPanelUser(userRow, { plans, professions, specialties });

  const byUser =
    (column: string) => (q: unknown) =>
      (
        q as {
          eq: (c: string, v: string) => { order: (c: string, o: unknown) => unknown };
        }
      )
        .eq(column, userId)
        .order("created_at", { ascending: false });

  const [events, savedNews, submittedNews, generations] = await Promise.all([
    safeSelect(db, "usage_events", "*", errors, byUser("user_id"), 2000) as Promise<
      UsageEventRow[]
    >,
    safeSelect(db, "saved_news", "*", errors, byUser("user_id"), 2000),
    safeSelect(db, "news_reviews", "*", errors, byUser("created_by"), 500),
    safeSelect(db, "content_generations", "*", errors, byUser("user_id"), 1000),
  ]);

  const stats: UserStats = {
    userId,
    newsSubmitted: submittedNews.filter((r) => r.origin_type === "user_upload").length,
    newsSaved: savedNews.filter(
      (r) => pickString(r, ["relationship"]) !== "submitted",
    ).length,
    e2aUsed: events.filter((e) => e.event === "e2a_used").length,
    studioUsed: events.filter((e) => e.event === "studio_used").length,
    limitsHit: events.filter((e) =>
      ["news_limit", "e2a_limit", "studio_limit"].includes(e.event),
    ).length,
    possibleDuplicates: submittedNews.filter(
      (r) => r.status === "possible_duplicate",
    ).length,
    eventsTotal: events.length,
    lastActivity: events[0]?.created_at ?? null,
  };

  const submittedItems = await enrichNewsRows(db, submittedNews, errors);

  // Consumo: NEWS salvas na biblioteca pessoal
  const savedNewsIds = [
    ...new Set(
      savedNews
        .map((r) => (r.news_id != null ? String(r.news_id) : null))
        .filter((v): v is string => Boolean(v)),
    ),
  ];
  let savedItems: Awaited<ReturnType<typeof enrichNewsRows>> = [];
  if (savedNewsIds.length) {
    const rows = await safeSelect(
      db,
      "news_reviews",
      "*",
      errors,
      (q) =>
        (q as { in: (c: string, v: string[]) => unknown }).in("id", savedNewsIds),
      savedNewsIds.length,
    );
    savedItems = await enrichNewsRows(db, rows, errors);
  }

  const e2aEvents = events.filter((e) => e.event === "e2a_used");
  const studioEvents = events.filter((e) => e.event === "studio_used");

  const e2a = {
    total: e2aEvents.length,
    professions: countBy(e2aEvents, (e) =>
      typeof e.meta?.profession === "string" ? e.meta.profession : null,
    ),
    contexts: countBy(e2aEvents, (e) =>
      typeof e.meta?.context === "string" ? e.meta.context : null,
    ),
    topNews: countBy(e2aEvents, (e) =>
      e.entity_id ? String(e.entity_id) : null,
    ).slice(0, 5),
    limits: events.filter((e) => e.event === "e2a_limit").length,
  };

  const studio = {
    total: studioEvents.length,
    formats: countBy(studioEvents, (e) =>
      typeof e.meta?.format === "string" ? e.meta.format : null,
    ),
    generationFormats: countBy(generations, (g) =>
      pickString(g, ["format", "type", "kind"]),
    ),
    limits: events.filter((e) => e.event === "studio_limit").length,
  };

  const consumption = {
    savedItems,
    topTags: countBy(
      savedItems.flatMap((item) => {
        const body = item.raw.body as { tags?: unknown } | null;
        return Array.isArray(body?.tags)
          ? body.tags.filter((t): t is string => typeof t === "string")
          : [];
      }),
      (t) => t,
    ).slice(0, 10),
  };

  const timeline = events.slice(0, 100);

  return {
    user,
    stats,
    signals: commercialSignals(stats, user.plan),
    submittedItems,
    consumption,
    e2a,
    studio,
    timeline,
    errors,
  };
}

export type UserDetail = NonNullable<Awaited<ReturnType<typeof fetchUserDetail>>>;
