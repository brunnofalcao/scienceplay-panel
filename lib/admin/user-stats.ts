import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { pickString } from "@/lib/formatters";
import type { CommercialSignal, UserStats } from "@/types/admin";
import type { GenericRow, UsageEventRow } from "@/types/database";

/**
 * Agregação de inteligência de usuário em memória com poucas queries —
 * padrão validado no admin antigo do SITE (suficiente pré-lançamento;
 * migrar para view/RPC se a base crescer — §6 do HANDOFF).
 */

export interface PanelUser {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  profession: string;
  specialty: string;
  createdAt: string | null;
  raw: GenericRow;
}

export interface UserWithStats {
  user: PanelUser;
  stats: UserStats;
  signals: CommercialSignal[];
}

const LIMIT_EVENTS = ["news_limit", "e2a_limit", "studio_limit"] as const;

async function fetchAll(
  db: SupabaseClient,
  table: string,
  columns: string,
  limit: number,
  errors: string[],
  order?: { column: string; ascending: boolean },
): Promise<GenericRow[]> {
  try {
    let query = db.from(table).select(columns).limit(limit);
    if (order) query = query.order(order.column, { ascending: order.ascending });
    const { data, error } = await query;
    if (error) {
      errors.push(`${table}: ${error.message}`);
      return [];
    }
    return (data ?? []) as unknown as GenericRow[];
  } catch (e) {
    errors.push(`${table}: ${e instanceof Error ? e.message : "erro desconhecido"}`);
    return [];
  }
}

async function fetchNameMap(
  db: SupabaseClient,
  table: string,
  errors: string[],
): Promise<Map<string, string>> {
  const rows = await fetchAll(db, table, "*", 500, errors);
  const map = new Map<string, string>();
  for (const row of rows) {
    const id = row.id != null ? String(row.id) : null;
    const name = pickString(row, ["name", "title", "label"]);
    if (id && name) map.set(id, name);
  }
  return map;
}

export function mapPanelUser(
  row: GenericRow,
  maps: {
    plans: Map<string, string>;
    professions: Map<string, string>;
    specialties: Map<string, string>;
  },
): PanelUser {
  const planId = pickString(row, ["plan_id", "plan"]);
  const professionId = pickString(row, ["profession_id", "profession"]);
  const specialtyId = pickString(row, ["specialty_id", "specialty"]);
  const fullName = [pickString(row, ["first_name"]), pickString(row, ["last_name"])]
    .filter(Boolean)
    .join(" ");
  return {
    id: String(row.id),
    email: pickString(row, ["email"]) ?? "—",
    name: fullName || (pickString(row, ["email"]) ?? "—"),
    role: pickString(row, ["role"]) ?? "user",
    plan: (planId && maps.plans.get(planId)) ?? planId ?? "—",
    profession:
      (professionId && maps.professions.get(professionId)) ?? professionId ?? "—",
    specialty:
      (specialtyId && maps.specialties.get(specialtyId)) ?? specialtyId ?? "—",
    createdAt: pickString(row, ["created_at"]),
    raw: row,
  };
}

function emptyStats(userId: string): UserStats {
  return {
    userId,
    newsSubmitted: 0,
    newsSaved: 0,
    e2aUsed: 0,
    studioUsed: 0,
    limitsHit: 0,
    possibleDuplicates: 0,
    eventsTotal: 0,
    lastActivity: null,
  };
}

export function commercialSignals(
  stats: UserStats,
  plan: string,
): CommercialSignal[] {
  const signals: CommercialSignal[] = [];
  const isFree = /free/i.test(plan);

  if (stats.limitsHit > 0 && isFree) {
    signals.push({
      label: "Atingiu limite Free",
      detail: `${stats.limitsHit} evento(s) de limite — potencial upgrade Pro.`,
    });
  }
  if (stats.studioUsed >= 10) {
    signals.push({
      label: "Usa muito o Content Studio",
      detail: `${stats.studioUsed} gerações — cria conteúdo com frequência.`,
    });
  }
  if (stats.e2aUsed >= 10) {
    signals.push({
      label: "Usa muito o Evidence-to-Action",
      detail: `${stats.e2aUsed} usos — aplica evidência na prática.`,
    });
  }
  if (stats.newsSubmitted >= 5) {
    signals.push({
      label: "Envia muitos artigos",
      detail: `${stats.newsSubmitted} envios — engajado em produção.`,
    });
  }
  if (stats.newsSaved >= 10) {
    signals.push({
      label: "Salva muitas NEWS",
      detail: `${stats.newsSaved} salvas — consumo recorrente.`,
    });
  }
  if (stats.eventsTotal >= 50) {
    signals.push({
      label: "Alta recorrência",
      detail: `${stats.eventsTotal} eventos — potencial lead para mentoria/evento/certificação.`,
    });
  }
  if (signals.length === 0 && stats.eventsTotal > 0) {
    signals.push({
      label: "Atividade regular",
      detail: "Sem sinais fortes de intenção no momento.",
    });
  }
  return signals;
}

export interface UsersWithStatsResult {
  rows: UserWithStats[];
  maps: {
    plans: Map<string, string>;
    professions: Map<string, string>;
    specialties: Map<string, string>;
  };
  errors: string[];
}

export async function getUsersWithStats(
  db: SupabaseClient,
): Promise<UsersWithStatsResult> {
  const errors: string[] = [];

  const [users, events, savedNews, news, plans, professions, specialties] =
    await Promise.all([
      fetchAll(db, "users", "*", 2000, errors, {
        column: "created_at",
        ascending: false,
      }),
      fetchAll(
        db,
        "usage_events",
        "user_id, event, meta, created_at",
        20000,
        errors,
        { column: "created_at", ascending: false },
      ),
      fetchAll(db, "saved_news", "user_id, relationship", 20000, errors),
      fetchAll(db, "news_reviews", "id, created_by, status, origin_type", 20000, errors),
      fetchNameMap(db, "plans", errors),
      fetchNameMap(db, "professions", errors),
      fetchNameMap(db, "specialties", errors),
    ]);

  const maps = { plans, professions, specialties };
  const statsByUser = new Map<string, UserStats>();
  const ensure = (userId: string): UserStats => {
    let s = statsByUser.get(userId);
    if (!s) {
      s = emptyStats(userId);
      statsByUser.set(userId, s);
    }
    return s;
  };

  for (const event of events as UsageEventRow[]) {
    if (!event.user_id) continue;
    const s = ensure(String(event.user_id));
    s.eventsTotal += 1;
    if (!s.lastActivity || event.created_at > s.lastActivity) {
      s.lastActivity = event.created_at;
    }
    if (event.event === "e2a_used") s.e2aUsed += 1;
    if (event.event === "studio_used") s.studioUsed += 1;
    if ((LIMIT_EVENTS as readonly string[]).includes(event.event)) s.limitsHit += 1;
  }

  for (const row of savedNews) {
    const userId = row.user_id != null ? String(row.user_id) : null;
    if (!userId) continue;
    const s = ensure(userId);
    const relationship = pickString(row, ["relationship"]);
    // "submitted" é contado via news_reviews (origin_type=user_upload) para
    // não duplicar; aqui só o consumo (biblioteca pessoal).
    if (relationship !== "submitted") s.newsSaved += 1;
  }

  for (const row of news) {
    const createdBy = row.created_by != null ? String(row.created_by) : null;
    if (!createdBy) continue;
    const s = ensure(createdBy);
    if (row.origin_type === "user_upload") s.newsSubmitted += 1;
    if (row.status === "possible_duplicate") s.possibleDuplicates += 1;
  }

  const rows: UserWithStats[] = users.map((row) => {
    const user = mapPanelUser(row, maps);
    const stats = statsByUser.get(user.id) ?? emptyStats(user.id);
    return { user, stats, signals: commercialSignals(stats, user.plan) };
  });

  return { rows, maps, errors };
}
