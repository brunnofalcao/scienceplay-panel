/**
 * Tipos derivados do SHARED-DATA-CONTRACT.md (project ref wetvjyfrmnfxargsynnn).
 *
 * ⚠️ Estes tipos são um espelho manual do contrato. Quando as credenciais do
 * Supabase estiverem conectadas, gere os tipos oficiais e substitua:
 *
 *   npx supabase gen types typescript --project-id wetvjyfrmnfxargsynnn > types/database.ts
 *
 * As queries do painel leem colunas de forma defensiva (select('*') + mapeamento
 * tolerante) justamente porque este arquivo ainda não veio do banco real.
 */

// ---- Enums oficiais (Postgres) — NÃO inventar valores fora destes ----

export const EDITORIAL_STATUSES = [
  "draft",
  "generated",
  "needs_review",
  "possible_duplicate",
  "approved",
  "published",
  "archived",
  "rejected",
  "blocked_duplicate",
  "merged",
  "updated_existing",
] as const;
export type EditorialStatus = (typeof EDITORIAL_STATUSES)[number];

export const ORIGIN_TYPES = [
  "user_upload",
  "team_automated",
  "team_manual",
  "external_source",
  "legacy_import",
  "admin_created",
  "system_generated",
] as const;
export type OriginType = (typeof ORIGIN_TYPES)[number];

export const CONTENT_TYPES = [
  "scientific_article",
  "article_summary",
  "science_news",
  "clinical_analysis",
  "guideline_update",
  "evidence_update",
  "editorial_note",
  "manual_content",
  "user_submitted_article",
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const SOURCE_KINDS = ["doi", "pmid", "crossref", "url", "pdf", "text"] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];

export const USER_ROLES = ["user", "editor", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// ---- usage_events.event — REAL vs PLANEJADO (§3 do contrato) ----

/** Eventos emitidos HOJE pelo código do SITE. */
export const REAL_USAGE_EVENTS = [
  "signup",
  "theme_search",
  "news_generated",
  "news_deduped",
  "possible_duplicate",
  "e2a_used",
  "studio_used",
  "news_limit",
  "e2a_limit",
  "studio_limit",
  // emitido pelo job diário do SITE (GET /api/cron/daily-news) com o resumo
  // da execução em meta — adicionado em 2026-07-10
  "cron_daily_news",
  // emitido pelos lotes do painel (POST /api/internal/admin/generate-news-batch)
  "admin_generate_batch",
] as const;
export type RealUsageEvent = (typeof REAL_USAGE_EVENTS)[number];

/** Planejados, ainda NÃO emitidos — não tratar como se existissem. */
export const PLANNED_USAGE_EVENTS = [
  "login",
  "news_saved",
  "content_copied",
  "collection_created",
  "daily_news_generated",
  "cron_error",
] as const;
export type PlannedUsageEvent = (typeof PLANNED_USAGE_EVENTS)[number];

export const EVIDENCE_GRADES = ["A", "B", "C", "D"] as const;
export type EvidenceGrade = (typeof EVIDENCE_GRADES)[number];

// ---- Linhas (shape mínimo conhecido; demais colunas via GenericRow) ----

/** Linha genérica: o painel mapeia colunas de forma tolerante. */
export type GenericRow = Record<string, unknown>;

export interface UserRow extends GenericRow {
  id: string;
  auth_id: string | null;
  email: string | null;
  role: UserRole | null;
  created_at: string | null;
}

export interface NewsReviewRow extends GenericRow {
  id: string;
  source_id: string | null;
  status: EditorialStatus | null;
  origin_type: OriginType | null;
  content_type: ContentType | null;
  evidence_grade: EvidenceGrade | null;
  evidence_grade_rationale: string | null;
  do_not_claim: string | null;
  created_by: string | null;
  auto_published: boolean | null;
  duplicate_of: string | null;
  duplicate_score: number | null;
  duplicate_reason: string | null;
  created_at: string | null;
  published_at: string | null;
}

export interface NewsI18nRow extends GenericRow {
  id?: string;
  news_id: string;
  locale: string;
  title: string | null;
  slug: string | null;
  bottom_line: string | null;
  body: unknown;
}

export interface SourceRow extends GenericRow {
  id: string;
  kind: SourceKind | null;
  content_key: string | null;
  doi?: string | null;
  pmid?: string | null;
  url?: string | null;
}

export interface UsageEventRow extends GenericRow {
  id?: string;
  user_id: string | null;
  event: string;
  entity_id: string | null;
  ip_hash: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export interface AiLogRow extends GenericRow {
  id?: string;
  created_at?: string | null;
}

export interface AdminAuditLogRow extends GenericRow {
  id?: string;
  admin_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  before: unknown;
  after: unknown;
  created_at?: string;
}

export interface LegacyPostRow extends GenericRow {
  id: string;
  slug?: string | null;
  title?: string | null;
  indexable: boolean | null;
}

export interface PlanRow extends GenericRow {
  id: string;
  name?: string | null;
  limits?: Record<string, unknown> | null;
}

export interface TaxonomyRow extends GenericRow {
  id: string;
  name?: string | null;
  slug?: string | null;
}
