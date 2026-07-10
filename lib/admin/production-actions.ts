"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminActionContext } from "@/lib/admin/action-context";
import { writeAuditLog } from "@/lib/admin/audit";
import { callSiteDailyNews, callSiteInternal } from "@/lib/site/internal";
import type { ActionResult } from "@/types/admin";

/**
 * Ações de produção — o motor científico vive no SITE; o painel orquestra
 * via endpoints internos (docs/SITE-INTERNAL-ENDPOINTS-NEEDED.md).
 * Nenhuma geração é simulada: sem endpoint, o retorno é o estado honesto.
 * Toda tentativa real de disparo é auditada em admin_audit_logs.
 */

async function runSiteCommand(
  auditAction: string,
  path: string,
  payload: Record<string, unknown>,
): Promise<ActionResult> {
  const ctx = await getAdminActionContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const result = await callSiteInternal(path, payload);

  // Audita a tentativa (sem segredo no log) — inclusive falhas reais,
  // mas não o estado "pendente de configuração" (nada foi executado).
  if (!result.pending) {
    await writeAuditLog(ctx.db, {
      adminId: ctx.profile.id,
      action: auditAction,
      entity: "site_internal",
      entityId: null,
      before: null,
      after: { path, payload, ok: result.ok, message: result.message.slice(0, 200) },
    });
  }

  revalidatePath("/production");
  revalidatePath("/production/queue");
  revalidatePath("/production/daily");

  if (result.ok) return { ok: true, message: result.message };
  return { ok: false, error: result.message };
}

// ---- 5.1 Capturar estudos novos ----

const captureSchema = z.object({
  window: z.enum(["24h", "7d", "30d", "90d", "1y"]),
  source: z.enum(["pubmed", "crossref", "all"]),
  theme: z.string().trim().max(200).optional(),
  area: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100),
});

export async function captureSources(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = captureSchema.safeParse({
    window: formData.get("window"),
    source: formData.get("source"),
    theme: formData.get("theme") || undefined,
    area: formData.get("area") || undefined,
    limit: formData.get("limit"),
  });
  if (!parsed.success) return { ok: false, error: "Parâmetros inválidos." };

  return runSiteCommand(
    "production.capture_sources",
    "/api/internal/admin/capture-sources",
    {
      window: parsed.data.window,
      source: parsed.data.source,
      theme: parsed.data.theme ?? null,
      area: parsed.data.area ?? null,
      limit: parsed.data.limit,
    },
  );
}

// ---- 5.2 Gerar por grau de evidência ----

const gradeSchema = z.object({
  grade: z.enum(["A", "B", "C", "D"]),
  limit: z.coerce.number().int().min(1).max(20),
  area: z.string().trim().max(120).optional(),
  publish: z.enum(["true", "false"]),
});

export async function generateByGrade(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = gradeSchema.safeParse({
    grade: formData.get("grade"),
    limit: formData.get("limit"),
    area: formData.get("area") || undefined,
    publish: formData.get("publish"),
  });
  if (!parsed.success) return { ok: false, error: "Parâmetros inválidos." };

  return runSiteCommand(
    "production.generate_by_grade",
    "/api/internal/admin/generate-news-batch",
    {
      mode: "grade",
      grade: parsed.data.grade,
      limit: parsed.data.limit,
      area: parsed.data.area ?? null,
      publish: parsed.data.publish === "true",
    },
  );
}

// ---- 5.3 Gerar lote ----

const batchSchema = z.object({
  limit: z.coerce.number().int().min(1).max(20),
  contentType: z.enum([
    "science_news",
    "clinical_analysis",
    "article_summary",
    "evidence_update",
    "guideline_update",
  ]),
  queueSource: z.enum(["captured", "sources", "any"]),
  publish: z.enum(["true", "false"]),
});

export async function generateBatch(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = batchSchema.safeParse({
    limit: formData.get("limit"),
    contentType: formData.get("contentType"),
    queueSource: formData.get("queueSource"),
    publish: formData.get("publish"),
  });
  if (!parsed.success) return { ok: false, error: "Parâmetros inválidos." };

  return runSiteCommand(
    "production.generate_batch",
    "/api/internal/admin/generate-news-batch",
    {
      mode: "batch",
      limit: parsed.data.limit,
      content_type: parsed.data.contentType,
      queue_source: parsed.data.queueSource,
      publish: parsed.data.publish === "true",
    },
  );
}

// ---- 5.4 Gerar por tema ----

const themeSchema = z.object({
  theme: z.string().trim().min(3).max(200),
  source: z.enum(["pubmed", "crossref", "all"]),
  window: z.enum(["24h", "7d", "30d", "90d", "1y"]),
  limit: z.coerce.number().int().min(1).max(20),
  area: z.string().trim().max(120).optional(),
  minGrade: z.enum(["A", "B", "C", "D", "any"]),
});

export async function generateByTheme(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = themeSchema.safeParse({
    theme: formData.get("theme"),
    source: formData.get("source"),
    window: formData.get("window"),
    limit: formData.get("limit"),
    area: formData.get("area") || undefined,
    minGrade: formData.get("minGrade"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Informe um tema válido (mín. 3 caracteres)." };
  }

  return runSiteCommand(
    "production.generate_by_theme",
    "/api/internal/admin/generate-news-batch",
    {
      mode: "theme",
      theme: parsed.data.theme,
      source: parsed.data.source,
      window: parsed.data.window,
      limit: parsed.data.limit,
      area: parsed.data.area ?? null,
      min_grade: parsed.data.minGrade === "any" ? null : parsed.data.minGrade,
    },
  );
}

// ---- Disparo manual do motor diário (endpoint REAL do SITE) ----

export async function triggerDailyNews(
  _prev: ActionResult | null,
  _formData: FormData,
): Promise<ActionResult> {
  const ctx = await getAdminActionContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const result = await callSiteDailyNews();

  if (!result.pending) {
    await writeAuditLog(ctx.db, {
      adminId: ctx.profile.id,
      action: "production.daily_news",
      entity: "site_internal",
      entityId: null,
      before: null,
      after: {
        path: "/api/cron/daily-news",
        ok: result.ok,
        message: result.message.slice(0, 300),
      },
    });
  }

  revalidatePath("/production/daily");
  revalidatePath("/production");
  revalidatePath("/cron");

  if (result.ok) return { ok: true, message: result.message };
  return { ok: false, error: result.message };
}
