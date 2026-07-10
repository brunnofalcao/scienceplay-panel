import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  pickBoolean,
  pickNumber,
  pickString,
  spMonthStartIso,
} from "@/lib/formatters";
import {
  REAL_USAGE_EVENTS,
  type GenericRow,
  type UsageEventRow,
} from "@/types/database";

type Db = SupabaseClient;

/** Coleta um erro por tabela sem derrubar a página — degradação honesta. */
export type QueryErrors = string[];

export async function safeCount(
  db: Db,
  table: string,
  errors: QueryErrors,
  build?: (query: unknown) => unknown,
): Promise<number> {
  try {
    let query = db.from(table).select("*", { count: "exact", head: true });
    if (build) {
      query = build(query) as typeof query;
    }
    const { count, error } = await query;
    if (error) {
      errors.push(`${table}: ${error.message}`);
      return 0;
    }
    return count ?? 0;
  } catch (e) {
    errors.push(`${table}: ${e instanceof Error ? e.message : "erro"}`);
    return 0;
  }
}

export async function safeSelect(
  db: Db,
  table: string,
  columns: string,
  errors: QueryErrors,
  build?: (query: unknown) => unknown,
  limit = 500,
): Promise<GenericRow[]> {
  try {
    let query = db.from(table).select(columns).limit(limit);
    if (build) {
      query = build(query) as typeof query;
    }
    const { data, error } = await query;
    if (error) {
      errors.push(`${table}: ${error.message}`);
      return [];
    }
    return (data ?? []) as unknown as GenericRow[];
  } catch (e) {
    errors.push(`${table}: ${e instanceof Error ? e.message : "erro"}`);
    return [];
  }
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function countBy<T>(
  rows: T[],
  key: (row: T) => string | null,
): Array<{ name: string; count: number }> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const k = key(row);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------- Dashboard

export interface DashboardData {
  users: {
    total: number;
    new7d: number;
    new30d: number;
    active30d: number;
  };
  news: {
    published: number;
    generated: number;
    possibleDuplicates: number;
    needsReview: number;
    byOrigin: { userUpload: number; teamAutomated: number; teamManual: number };
  };
  usage: {
    e2aUsed: number;
    studioUsed: number;
    limitsHit: { news: number; e2a: number; studio: number };
  };
  ai: {
    calls: number;
    errors: number;
    fallbacks: number;
    costUsd: number;
  };
  legacyTotal: number;
  tops: {
    tags: Array<{ name: string; count: number }>;
    areasProduced: Array<{ name: string; count: number }>;
    areasSubmitted: Array<{ name: string; count: number }>;
    professions: Array<{ name: string; count: number }>;
    formats: Array<{ name: string; count: number }>;
    activeUsers: Array<{ name: string; count: number }>;
  };
  demandVsProduction: { userUpload: number; team: number };
  errors: QueryErrors;
}

export async function getDashboardData(db: Db): Promise<DashboardData> {
  const errors: QueryErrors = [];
  const eq =
    (column: string, value: string | boolean) => (q: unknown) =>
      (q as { eq: (c: string, v: unknown) => unknown }).eq(column, value);
  const gte =
    (column: string, value: string) => (q: unknown) =>
      (q as { gte: (c: string, v: unknown) => unknown }).gte(column, value);

  const [
    usersTotal,
    usersNew7d,
    usersNew30d,
    newsPublished,
    newsGenerated,
    newsPossibleDup,
    newsNeedsReview,
    originUser,
    originAutomated,
    originManual,
    legacyTotal,
    usageRows,
    aiRows,
    tagRows,
    usersRows,
  ] = await Promise.all([
    safeCount(db, "users", errors),
    safeCount(db, "users", errors, gte("created_at", daysAgoIso(7))),
    safeCount(db, "users", errors, gte("created_at", daysAgoIso(30))),
    safeCount(db, "news_reviews", errors, eq("status", "published")),
    safeCount(db, "news_reviews", errors, eq("status", "generated")),
    safeCount(db, "news_reviews", errors, eq("status", "possible_duplicate")),
    safeCount(db, "news_reviews", errors, eq("status", "needs_review")),
    safeCount(db, "news_reviews", errors, eq("origin_type", "user_upload")),
    safeCount(db, "news_reviews", errors, eq("origin_type", "team_automated")),
    safeCount(db, "news_reviews", errors, eq("origin_type", "team_manual")),
    safeCount(db, "legacy_posts", errors),
    safeSelect(
      db,
      "usage_events",
      "user_id, event, meta, created_at",
      errors,
      (q) =>
        (q as { order: (c: string, o: unknown) => unknown }).order("created_at", {
          ascending: false,
        }),
      10000,
    ),
    safeSelect(
      db,
      "ai_logs",
      "*",
      errors,
      (q) =>
        (q as { order: (c: string, o: unknown) => unknown }).order("created_at", {
          ascending: false,
        }),
      2000,
    ),
    safeSelect(db, "news_tags", "tag_id, tags(name)", errors, undefined, 5000),
    safeSelect(db, "users", "*", errors, undefined, 2000),
  ]);

  const events = usageRows as UsageEventRow[];
  const cutoff30d = daysAgoIso(30);

  const activeUserIds = new Set<string>();
  let e2aUsed = 0;
  let studioUsed = 0;
  const limitsHit = { news: 0, e2a: 0, studio: 0 };
  const eventsPerUser = new Map<string, number>();
  const e2aProfessions: string[] = [];
  const studioFormats: string[] = [];

  for (const event of events) {
    if (event.user_id && event.created_at >= cutoff30d) {
      activeUserIds.add(String(event.user_id));
    }
    if (event.user_id) {
      const id = String(event.user_id);
      eventsPerUser.set(id, (eventsPerUser.get(id) ?? 0) + 1);
    }
    switch (event.event) {
      case "e2a_used": {
        e2aUsed += 1;
        const profession = event.meta?.profession;
        if (typeof profession === "string") e2aProfessions.push(profession);
        break;
      }
      case "studio_used": {
        studioUsed += 1;
        const format = event.meta?.format;
        if (typeof format === "string") studioFormats.push(format);
        break;
      }
      case "news_limit":
        limitsHit.news += 1;
        break;
      case "e2a_limit":
        limitsHit.e2a += 1;
        break;
      case "studio_limit":
        limitsHit.studio += 1;
        break;
    }
  }

  let aiErrors = 0;
  let aiFallbacks = 0;
  let aiCost = 0;
  for (const row of aiRows) {
    const status = pickString(row, ["status"]) ?? "";
    if (/error|fail/i.test(status) || pickString(row, ["error", "error_message"])) {
      aiErrors += 1;
    }
    if (
      pickBoolean(row, ["fallback", "is_fallback", "used_fallback"]) === true ||
      /fallback|failover/i.test(status)
    ) {
      aiFallbacks += 1;
    }
    aiCost += pickNumber(row, ["cost_usd", "estimated_cost_usd", "cost"]) ?? 0;
  }

  // Traduz profession_id → nome real da profissão
  const professionRows = await safeSelect(db, "professions", "id, name", errors, undefined, 500);
  const professionNameById = new Map(
    professionRows.map((r) => [String(r.id), pickString(r, ["name"]) ?? String(r.id)]),
  );

  const userEmailById = new Map<string, string>();
  const professionCounts: string[] = [];
  for (const row of usersRows) {
    const id = row.id != null ? String(row.id) : null;
    const email = pickString(row, ["email", "first_name"]);
    if (id && email) userEmailById.set(id, email);
    const professionId = pickString(row, ["profession_id"]);
    if (professionId) {
      professionCounts.push(professionNameById.get(professionId) ?? professionId);
    }
  }

  const topTags = countBy(tagRows, (row) => {
    const tag = row.tags as GenericRow | GenericRow[] | null;
    if (Array.isArray(tag)) return pickString(tag[0] ?? {}, ["name"]);
    return tag ? pickString(tag, ["name"]) : null;
  }).slice(0, 10);

  // "Áreas" produzidas vs demandadas: agregadas por categoria da NEWS quando a
  // coluna existir no schema real (validar com credenciais conectadas).
  const newsAreaRows = await safeSelect(
    db,
    "news_reviews",
    "origin_type, area, categories(name)",
    [],
    undefined,
    5000,
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
  const areasProduced = countBy(
    newsAreaRows.filter((r) => r.origin_type !== "user_upload"),
    areaName,
  ).slice(0, 10);
  const areasSubmitted = countBy(
    newsAreaRows.filter((r) => r.origin_type === "user_upload"),
    areaName,
  ).slice(0, 10);

  return {
    users: {
      total: usersTotal,
      new7d: usersNew7d,
      new30d: usersNew30d,
      active30d: activeUserIds.size,
    },
    news: {
      published: newsPublished,
      generated: newsGenerated,
      possibleDuplicates: newsPossibleDup,
      needsReview: newsNeedsReview,
      byOrigin: {
        userUpload: originUser,
        teamAutomated: originAutomated,
        teamManual: originManual,
      },
    },
    usage: { e2aUsed, studioUsed, limitsHit },
    ai: { calls: aiRows.length, errors: aiErrors, fallbacks: aiFallbacks, costUsd: aiCost },
    legacyTotal,
    tops: {
      tags: topTags,
      areasProduced,
      areasSubmitted,
      professions: countBy(professionCounts.map((p) => ({ p })), (r) => r.p).slice(0, 10),
      formats: countBy(studioFormats.map((f) => ({ f })), (r) => r.f).slice(0, 10),
      activeUsers: [...eventsPerUser.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id, count]) => ({
          name: userEmailById.get(id) ?? id,
          count,
        })),
    },
    demandVsProduction: {
      userUpload: originUser,
      team: originAutomated + originManual,
    },
    errors,
  };
}

// ---------------------------------------------------------------- NEWS

export interface NewsListFilters {
  q?: string;
  status?: string;
  origin?: string;
  contentType?: string;
  grade?: string;
  autoPublished?: string;
  doi?: string;
  pmid?: string;
  userId?: string;
  userEmail?: string;
  area?: string;
  tag?: string;
  from?: string;
  to?: string;
  duplicatesOnly?: boolean;
}

export interface NewsListItem {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  origin: string;
  contentType: string;
  grade: string;
  doiOrPmid: string;
  creator: string;
  autoPublished: boolean | null;
  createdAt: string | null;
  duplicateScore: number | null;
  duplicateReason: string | null;
  duplicateOf: string | null;
  raw: GenericRow;
}

export async function fetchNewsList(
  db: Db,
  filters: NewsListFilters,
): Promise<{ items: NewsListItem[]; errors: QueryErrors }> {
  const errors: QueryErrors = [];

  // Busca por título / DOI / PMID resolve ids primeiro (sem depender de joins).
  let idFilter: string[] | null = null;
  if (filters.q) {
    const i18n = await safeSelect(
      db,
      "news_i18n",
      "news_id, title",
      errors,
      (q) =>
        (q as { ilike: (c: string, v: string) => unknown }).ilike(
          "title",
          `%${filters.q}%`,
        ),
      200,
    );
    idFilter = i18n.map((r) => String(r.news_id));
    if (idFilter.length === 0) return { items: [], errors };
  }

  // Filtro por tag: tags.name → news_tags → news_ids (interseção com busca)
  if (filters.tag) {
    const tagRows = await safeSelect(
      db,
      "tags",
      "id",
      errors,
      (q) =>
        (q as { ilike: (c: string, v: string) => unknown }).ilike(
          "name",
          `%${filters.tag}%`,
        ),
      20,
    );
    const tagIds = tagRows.map((r) => String(r.id));
    if (tagIds.length === 0) return { items: [], errors };
    const newsTagRows = await safeSelect(
      db,
      "news_tags",
      "news_id",
      errors,
      (q) => (q as { in: (c: string, v: string[]) => unknown }).in("tag_id", tagIds),
      500,
    );
    const tagged = newsTagRows.map((r) => String(r.news_id));
    idFilter = idFilter ? idFilter.filter((id) => tagged.includes(id)) : tagged;
    if (idFilter.length === 0) return { items: [], errors };
  }

  // Filtro por e-mail do usuário que enviou
  let creatorFilter: string[] | null = null;
  if (filters.userEmail) {
    const userRows = await safeSelect(
      db,
      "users",
      "id",
      errors,
      (q) =>
        (q as { ilike: (c: string, v: string) => unknown }).ilike(
          "email",
          `%${filters.userEmail}%`,
        ),
      20,
    );
    creatorFilter = userRows.map((r) => String(r.id));
    if (creatorFilter.length === 0) return { items: [], errors };
  }

  let sourceIdFilter: string[] | null = null;
  if (filters.doi || filters.pmid) {
    const column = filters.doi ? "doi" : "pmid";
    const value = filters.doi ?? filters.pmid ?? "";
    const sources = await safeSelect(
      db,
      "sources",
      "id",
      errors,
      (q) =>
        (q as { ilike: (c: string, v: string) => unknown }).ilike(
          column,
          `%${value}%`,
        ),
      100,
    );
    sourceIdFilter = sources.map((r) => String(r.id));
    if (sourceIdFilter.length === 0) return { items: [], errors };
  }

  const rows = await safeSelect(
    db,
    "news_reviews",
    "*",
    errors,
    (q) => {
      let query = q as {
        eq: (c: string, v: unknown) => typeof query;
        in: (c: string, v: unknown[]) => typeof query;
        gte: (c: string, v: string) => typeof query;
        lte: (c: string, v: string) => typeof query;
        order: (c: string, o: unknown) => typeof query;
      };
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.duplicatesOnly) query = query.eq("status", "possible_duplicate");
      if (filters.origin) query = query.eq("origin_type", filters.origin);
      if (filters.contentType) query = query.eq("content_type", filters.contentType);
      if (filters.grade) query = query.eq("evidence_grade", filters.grade);
      if (filters.autoPublished === "true") query = query.eq("auto_published", true);
      if (filters.autoPublished === "false") query = query.eq("auto_published", false);
      if (filters.userId) query = query.eq("created_by", filters.userId);
      if (filters.area) {
        query = (
          query as unknown as { ilike: (c: string, v: string) => typeof query }
        ).ilike("area", `%${filters.area}%`);
      }
      if (creatorFilter) query = query.in("created_by", creatorFilter);
      if (filters.from) query = query.gte("created_at", filters.from);
      if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59`);
      if (idFilter) query = query.in("id", idFilter);
      if (sourceIdFilter) query = query.in("source_id", sourceIdFilter);
      return query.order("created_at", { ascending: false });
    },
    100,
  );

  const items = await enrichNewsRows(db, rows, errors);
  return { items, errors };
}

export async function enrichNewsRows(
  db: Db,
  rows: GenericRow[],
  errors: QueryErrors,
): Promise<NewsListItem[]> {
  const newsIds = rows.map((r) => String(r.id));
  const sourceIds = [
    ...new Set(rows.map((r) => r.source_id).filter(Boolean).map(String)),
  ];
  const creatorIds = [
    ...new Set(rows.map((r) => r.created_by).filter(Boolean).map(String)),
  ];

  const [i18nRows, sourceRows, creatorRows] = await Promise.all([
    newsIds.length
      ? safeSelect(
          db,
          "news_i18n",
          "news_id, locale, title, slug",
          errors,
          (q) => (q as { in: (c: string, v: string[]) => unknown }).in("news_id", newsIds),
          newsIds.length * 3,
        )
      : Promise.resolve([] as GenericRow[]),
    sourceIds.length
      ? safeSelect(
          db,
          "sources",
          "*",
          errors,
          (q) => (q as { in: (c: string, v: string[]) => unknown }).in("id", sourceIds),
          sourceIds.length,
        )
      : Promise.resolve([] as GenericRow[]),
    creatorIds.length
      ? safeSelect(
          db,
          "users",
          "*",
          errors,
          (q) => (q as { in: (c: string, v: string[]) => unknown }).in("id", creatorIds),
          creatorIds.length,
        )
      : Promise.resolve([] as GenericRow[]),
  ]);

  const titleByNews = new Map<string, { title: string; slug: string | null }>();
  for (const row of i18nRows) {
    const newsId = String(row.news_id);
    const existing = titleByNews.get(newsId);
    // preferir pt; senão o primeiro locale disponível
    if (!existing || row.locale === "pt") {
      titleByNews.set(newsId, {
        title: pickString(row, ["title"]) ?? "(sem título)",
        slug: pickString(row, ["slug"]),
      });
    }
  }

  const sourceById = new Map(sourceRows.map((r) => [String(r.id), r]));
  const creatorById = new Map(creatorRows.map((r) => [String(r.id), r]));

  return rows.map((row) => {
    const id = String(row.id);
    const i18n = titleByNews.get(id);
    const source = row.source_id ? sourceById.get(String(row.source_id)) : undefined;
    const creator = row.created_by
      ? creatorById.get(String(row.created_by))
      : undefined;
    const doi = source ? pickString(source, ["doi"]) : null;
    const pmid = source ? pickString(source, ["pmid"]) : null;
    return {
      id,
      title: i18n?.title ?? "(sem título)",
      slug: i18n?.slug ?? null,
      status: pickString(row, ["status"]) ?? "—",
      origin: pickString(row, ["origin_type"]) ?? "—",
      contentType: pickString(row, ["content_type"]) ?? "—",
      grade: pickString(row, ["evidence_grade"]) ?? "—",
      doiOrPmid: doi ?? pmid ?? "—",
      creator: creator
        ? (pickString(creator, ["email", "name", "full_name"]) ?? "—")
        : "—",
      autoPublished: pickBoolean(row, ["auto_published"]),
      createdAt: pickString(row, ["created_at"]),
      duplicateScore: pickNumber(row, ["duplicate_score"]),
      duplicateReason: pickString(row, ["duplicate_reason"]),
      duplicateOf: row.duplicate_of != null ? String(row.duplicate_of) : null,
      raw: row,
    };
  });
}

export async function fetchNewsDetail(db: Db, id: string) {
  const errors: QueryErrors = [];
  const rows = await safeSelect(
    db,
    "news_reviews",
    "*",
    errors,
    (q) => (q as { eq: (c: string, v: string) => unknown }).eq("id", id),
    1,
  );
  const news = rows[0] ?? null;
  if (!news) return { news: null, errors };

  const [item] = await enrichNewsRows(db, [news], errors);

  // ai_logs não tem coluna news_id no schema real (só user_id) — sem vínculo direto.
  const [i18nRows, sourceRows, usageEvents, auditLogs] = await Promise.all([
    safeSelect(
      db,
      "news_i18n",
      "*",
      errors,
      (q) => (q as { eq: (c: string, v: string) => unknown }).eq("news_id", id),
      10,
    ),
    news.source_id
      ? safeSelect(
          db,
          "sources",
          "*",
          errors,
          (q) =>
            (q as { eq: (c: string, v: string) => unknown }).eq(
              "id",
              String(news.source_id),
            ),
          1,
        )
      : Promise.resolve([] as GenericRow[]),
    safeSelect(
      db,
      "usage_events",
      "*",
      errors,
      (q) => (q as { eq: (c: string, v: string) => unknown }).eq("entity_id", id),
      50,
    ),
    safeSelect(
      db,
      "admin_audit_logs",
      "*",
      errors,
      (q) =>
        (
          q as {
            eq: (c: string, v: string) => { order: (c: string, o: unknown) => unknown };
          }
        )
          .eq("entity_id", id)
          .order("created_at", { ascending: false }),
      50,
    ),
  ]);

  return {
    news,
    item,
    i18nRows,
    source: sourceRows[0] ?? null,
    usageEvents,
    auditLogs,
    errors,
  };
}

// ---- Cards executivos do acervo (/news) ----

export interface NewsStats {
  published: number;
  gradeAB: number;
  gradeC: number;
  gradeD: number;
  possibleDuplicates: number;
  generatedMonth: number;
  aiCostMonth: number;
  errors: QueryErrors;
}

export async function fetchNewsStats(db: Db): Promise<NewsStats> {
  const errors: QueryErrors = [];
  const monthStart = spMonthStartIso();
  const eq =
    (column: string, value: string) => (q: unknown) =>
      (q as { eq: (c: string, v: unknown) => unknown }).eq(column, value);

  const [published, gradeA, gradeB, gradeC, gradeD, possibleDup, generatedMonth, costRows] =
    await Promise.all([
      safeCount(db, "news_reviews", errors, eq("status", "published")),
      safeCount(db, "news_reviews", errors, eq("evidence_grade", "A")),
      safeCount(db, "news_reviews", errors, eq("evidence_grade", "B")),
      safeCount(db, "news_reviews", errors, eq("evidence_grade", "C")),
      safeCount(db, "news_reviews", errors, eq("evidence_grade", "D")),
      safeCount(db, "news_reviews", errors, eq("status", "possible_duplicate")),
      safeCount(db, "news_reviews", errors, (q) =>
        (q as { gte: (c: string, v: string) => unknown }).gte("created_at", monthStart),
      ),
      safeSelect(
        db,
        "ai_logs",
        "cost_usd, created_at",
        errors,
        (q) => (q as { gte: (c: string, v: string) => unknown }).gte("created_at", monthStart),
        5000,
      ),
    ]);

  return {
    published,
    gradeAB: gradeA + gradeB,
    gradeC,
    gradeD,
    possibleDuplicates: possibleDup,
    generatedMonth,
    aiCostMonth: costRows.reduce(
      (sum, r) => sum + (pickNumber(r, ["cost_usd"]) ?? 0),
      0,
    ),
    errors,
  };
}

// ---------------------------------------------------------------- Duplicados

export async function fetchDuplicatesQueue(db: Db) {
  const { items, errors } = await fetchNewsList(db, { duplicatesOnly: true });

  const targetIds = [
    ...new Set(items.map((i) => i.duplicateOf).filter((v): v is string => Boolean(v))),
  ];
  let targets: NewsListItem[] = [];
  if (targetIds.length) {
    const rows = await safeSelect(
      db,
      "news_reviews",
      "*",
      errors,
      (q) => (q as { in: (c: string, v: string[]) => unknown }).in("id", targetIds),
      targetIds.length,
    );
    targets = await enrichNewsRows(db, rows, errors);
  }
  const targetById = new Map(targets.map((t) => [t.id, t]));

  return {
    queue: items.map((item) => ({
      item,
      existing: item.duplicateOf ? (targetById.get(item.duplicateOf) ?? null) : null,
    })),
    errors,
  };
}

// ---------------------------------------------------------------- Usage

export interface UsageFilters {
  event?: string;
  userId?: string;
  from?: string;
  to?: string;
}

export async function fetchUsageData(db: Db, filters: UsageFilters) {
  const errors: QueryErrors = [];

  const countEntries = await Promise.all(
    REAL_USAGE_EVENTS.map(async (event) => ({
      event,
      count: await safeCount(db, "usage_events", errors, (q) =>
        (q as { eq: (c: string, v: string) => unknown }).eq("event", event),
      ),
    })),
  );

  const recent = (await safeSelect(
    db,
    "usage_events",
    "*",
    errors,
    (q) => {
      let query = q as {
        eq: (c: string, v: unknown) => typeof query;
        gte: (c: string, v: string) => typeof query;
        lte: (c: string, v: string) => typeof query;
        order: (c: string, o: unknown) => typeof query;
      };
      if (filters.event) query = query.eq("event", filters.event);
      if (filters.userId) query = query.eq("user_id", filters.userId);
      if (filters.from) query = query.gte("created_at", filters.from);
      if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59`);
      return query.order("created_at", { ascending: false });
    },
    5000,
  )) as UsageEventRow[];

  const userIds = [
    ...new Set(recent.map((r) => r.user_id).filter(Boolean).map(String)),
  ];
  const userRows = userIds.length
    ? await safeSelect(
        db,
        "users",
        "*",
        errors,
        (q) => (q as { in: (c: string, v: string[]) => unknown }).in("id", userIds),
        userIds.length,
      )
    : [];
  const userById = new Map(
    userRows.map((r) => [String(r.id), pickString(r, ["email", "name"]) ?? String(r.id)]),
  );

  // Visão por plano: user_id → plan_id → nome do plano
  const planRows = await safeSelect(db, "plans", "id, name, key", errors, undefined, 20);
  const planNameById = new Map(
    planRows.map((r) => [String(r.id), pickString(r, ["name", "key"]) ?? "—"]),
  );
  const planByUserId = new Map(
    userRows.map((r) => {
      const planId = pickString(r, ["plan_id"]);
      return [String(r.id), (planId && planNameById.get(planId)) ?? "sem plano"];
    }),
  );

  const perDay = countBy(recent, (r) => r.created_at?.slice(0, 10) ?? null)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-30);

  const topUsers = countBy(recent, (r) =>
    r.user_id ? (userById.get(String(r.user_id)) ?? String(r.user_id)) : null,
  ).slice(0, 10);

  const byPlan = countBy(recent, (r) =>
    r.user_id ? (planByUserId.get(String(r.user_id)) ?? "sem plano") : "anônimo",
  ).slice(0, 10);

  const topProfessions = countBy(recent, (r) =>
    r.event === "e2a_used" && typeof r.meta?.profession === "string"
      ? r.meta.profession
      : null,
  ).slice(0, 10);

  const topFormats = countBy(recent, (r) =>
    r.event === "studio_used" && typeof r.meta?.format === "string"
      ? r.meta.format
      : null,
  ).slice(0, 10);

  const limitsHit = recent.filter((r) =>
    ["news_limit", "e2a_limit", "studio_limit"].includes(r.event),
  ).length;

  return {
    counts: countEntries,
    recent: recent.slice(0, 200),
    userById,
    perDay,
    topUsers,
    byPlan,
    topProfessions,
    topFormats,
    limitsHit,
    errors,
  };
}

// ---------------------------------------------------------------- AI Logs

export interface AiLogFilters {
  provider?: string;
  model?: string;
  status?: string;
  feature?: string;
  errorsOnly?: boolean;
  fallbackOnly?: boolean;
}

export interface AiLogItem {
  createdAt: string | null;
  feature: string;
  provider: string;
  model: string;
  status: string;
  latencyMs: number | null;
  tokensIn: number | null;
  tokensOut: number | null;
  costUsd: number | null;
  error: string | null;
  fallback: boolean;
  userId: string | null;
  entityType: string | null;
  entityId: string | null;
}

export function mapAiLog(row: GenericRow): AiLogItem {
  const status = pickString(row, ["status"]) ?? "—";
  return {
    createdAt: pickString(row, ["created_at"]),
    feature: pickString(row, ["feature", "context", "operation"]) ?? "—",
    provider: pickString(row, ["provider"]) ?? "—",
    model: pickString(row, ["model", "model_name"]) ?? "—",
    status,
    latencyMs: pickNumber(row, ["latency_ms", "duration_ms", "latency"]),
    tokensIn: pickNumber(row, ["tokens_in", "input_tokens", "prompt_tokens"]),
    tokensOut: pickNumber(row, ["tokens_out", "output_tokens", "completion_tokens"]),
    costUsd: pickNumber(row, ["cost_usd", "estimated_cost_usd", "cost"]),
    error: pickString(row, ["error", "error_message"]),
    // schema real não tem coluna fallback — detectado via status/feature
    fallback:
      pickBoolean(row, ["fallback", "is_fallback", "used_fallback"]) === true ||
      /fallback|failover/i.test(status) ||
      /fallback|failover/i.test(pickString(row, ["feature"]) ?? ""),
    userId: row.user_id != null ? String(row.user_id) : null,
    entityType: pickString(row, ["entity_type"]),
    entityId: row.entity_id != null ? String(row.entity_id) : null,
  };
}

export async function fetchAiLogs(db: Db, filters: AiLogFilters) {
  const errors: QueryErrors = [];
  const rows = await safeSelect(
    db,
    "ai_logs",
    "*",
    errors,
    (q) =>
      (q as { order: (c: string, o: unknown) => unknown }).order("created_at", {
        ascending: false,
      }),
    2000,
  );

  let items = rows.map(mapAiLog);
  if (filters.provider) {
    items = items.filter((i) =>
      i.provider.toLowerCase().includes(filters.provider!.toLowerCase()),
    );
  }
  if (filters.model) {
    items = items.filter((i) =>
      i.model.toLowerCase().includes(filters.model!.toLowerCase()),
    );
  }
  if (filters.status) {
    items = items.filter((i) =>
      i.status.toLowerCase().includes(filters.status!.toLowerCase()),
    );
  }
  if (filters.feature) {
    items = items.filter((i) =>
      i.feature.toLowerCase().includes(filters.feature!.toLowerCase()),
    );
  }
  if (filters.errorsOnly) items = items.filter((i) => i.error || /error|fail/i.test(i.status));
  if (filters.fallbackOnly) items = items.filter((i) => i.fallback);

  const totals = {
    calls: items.length,
    errors: items.filter((i) => i.error || /error|fail/i.test(i.status)).length,
    fallbacks: items.filter((i) => i.fallback).length,
    costUsd: items.reduce((sum, i) => sum + (i.costUsd ?? 0), 0),
  };

  const groupWithCost = (key: (i: AiLogItem) => string | null) => {
    const map = new Map<string, { count: number; costUsd: number }>();
    for (const item of items) {
      const k = key(item);
      if (!k) continue;
      const entry = map.get(k) ?? { count: 0, costUsd: 0 };
      entry.count += 1;
      entry.costUsd += item.costUsd ?? 0;
      map.set(k, entry);
    }
    return [...map.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count);
  };

  const groups = {
    byDay: groupWithCost((i) => i.createdAt?.slice(0, 10) ?? null)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(-30),
    byFeature: groupWithCost((i) => i.feature).slice(0, 10),
    byProviderModel: groupWithCost((i) => `${i.provider} / ${i.model}`).slice(0, 10),
  };

  return { items: items.slice(0, 200), allItems: items, totals, groups, errors };
}

// ---------------------------------------------------------------- Cron

export async function fetchCronLogs(db: Db) {
  const errors: QueryErrors = [];
  const rows = await safeSelect(
    db,
    "cron_logs",
    "*",
    errors,
    (q) =>
      (q as { order: (c: string, o: unknown) => unknown }).order("created_at", {
        ascending: false,
      }),
    50,
  );
  return { rows, errors };
}

// ---------------------------------------------------------------- Legacy

export async function fetchLegacyData(db: Db) {
  const errors: QueryErrors = [];
  const eq =
    (column: string, value: boolean) => (q: unknown) =>
      (q as { eq: (c: string, v: unknown) => unknown }).eq(column, value);

  const [total, indexable, notIndexable, sample] = await Promise.all([
    safeCount(db, "legacy_posts", errors),
    safeCount(db, "legacy_posts", errors, eq("indexable", true)),
    safeCount(db, "legacy_posts", errors, eq("indexable", false)),
    safeSelect(db, "legacy_posts", "*", errors, undefined, 2000),
  ]);

  const hasAccent = (value: string | null) =>
    value ? /[à-ÿÀ-Ÿ]/.test(value) : false;

  const withAccent = sample.filter(
    (r) => hasAccent(pickString(r, ["title"])) || hasAccent(pickString(r, ["slug"])),
  ).length;
  // Coluna real de imagem no schema: legacy_posts.thumb
  const withImage = sample.filter((r) => Boolean(pickString(r, ["thumb"]))).length;
  const withoutBody = sample.filter((r) => !pickString(r, ["body"])).length;

  return {
    total,
    indexable,
    notIndexable,
    sampleSize: sample.length,
    withAccent,
    withImage,
    withoutBody,
    recent: sample.slice(0, 50),
    errors,
  };
}

// ---------------------------------------------------------------- Taxonomias

export async function fetchTaxonomies(db: Db) {
  const errors: QueryErrors = [];
  const tables = ["professions", "specialties", "categories", "tags"] as const;
  const results = await Promise.all(
    tables.map((table) => safeSelect(db, table, "*", errors, undefined, 500)),
  );
  return {
    taxonomies: tables.map((table, index) => ({ table, rows: results[index] })),
    errors,
  };
}

// ---------------------------------------------------------------- Settings

export async function fetchPlans(db: Db) {
  const errors: QueryErrors = [];
  const rows = await safeSelect(db, "plans", "*", errors, undefined, 20);
  return { rows, errors };
}
