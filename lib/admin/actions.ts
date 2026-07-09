"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminActionContext } from "@/lib/admin/action-context";
import { writeAuditLog } from "@/lib/admin/audit";
import type { ActionResult } from "@/types/admin";
import type { EditorialStatus } from "@/types/database";

// ---- Moderação de NEWS (§6 do contrato — toda ação gera admin_audit_logs) ----

const NEWS_MODERATION_ACTIONS = {
  publish: { status: "published", label: "Publicar" },
  unpublish: { status: "approved", label: "Despublicar" },
  approve: { status: "approved", label: "Aprovar" },
  reject: { status: "rejected", label: "Rejeitar" },
  archive: { status: "archived", label: "Arquivar" },
  mark_duplicate: { status: "possible_duplicate", label: "Marcar duplicado" },
} as const satisfies Record<string, { status: EditorialStatus; label: string }>;

export type NewsModerationAction = keyof typeof NEWS_MODERATION_ACTIONS;

const moderateNewsSchema = z.object({
  newsId: z.string().min(1),
  action: z.enum(
    Object.keys(NEWS_MODERATION_ACTIONS) as [
      NewsModerationAction,
      ...NewsModerationAction[],
    ],
  ),
});

export async function moderateNews(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = moderateNewsSchema.safeParse({
    newsId: formData.get("newsId"),
    action: formData.get("action"),
  });
  if (!parsed.success) return { ok: false, error: "Parâmetros inválidos." };

  const ctx = await getAdminActionContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const { newsId, action } = parsed.data;
  const target = NEWS_MODERATION_ACTIONS[action];

  const { data: before, error: fetchError } = await ctx.db
    .from("news_reviews")
    .select("*")
    .eq("id", newsId)
    .maybeSingle();
  if (fetchError) return { ok: false, error: fetchError.message };
  if (!before) return { ok: false, error: "NEWS não encontrada." };

  const patch: Record<string, unknown> = { status: target.status };
  if (action === "publish") {
    patch.published_at = new Date().toISOString();
  } else if (action === "unpublish") {
    patch.published_at = null;
  }

  const { error: updateError } = await ctx.db
    .from("news_reviews")
    .update(patch)
    .eq("id", newsId);
  if (updateError) return { ok: false, error: updateError.message };

  const auditError = await writeAuditLog(ctx.db, {
    adminId: ctx.profile.id,
    action: `news.${action}`,
    entity: "news_reviews",
    entityId: newsId,
    before: { status: before.status, published_at: before.published_at },
    after: patch,
  });

  revalidatePath("/news");
  revalidatePath(`/news/${newsId}`);
  revalidatePath("/duplicates");
  revalidatePath("/");

  if (auditError) {
    return {
      ok: false,
      error: `Ação aplicada, mas falhou ao gravar audit log: ${auditError}`,
    };
  }
  return { ok: true, message: `${target.label}: ok.` };
}

// ---- Edição de metadados (título / meta description) em news_i18n ----

const editNewsMetaSchema = z.object({
  newsId: z.string().min(1),
  locale: z.string().min(2).default("pt"),
  title: z.string().trim().min(1).max(300).optional(),
  metaDescription: z.string().trim().max(400).optional(),
});

export async function editNewsMeta(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = editNewsMetaSchema.safeParse({
    newsId: formData.get("newsId"),
    locale: formData.get("locale") || "pt",
    title: formData.get("title") || undefined,
    metaDescription: formData.get("metaDescription") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "Parâmetros inválidos." };

  const { newsId, locale, title, metaDescription } = parsed.data;
  if (!title && metaDescription === undefined) {
    return { ok: false, error: "Nada para atualizar." };
  }

  const ctx = await getAdminActionContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const { data: before, error: fetchError } = await ctx.db
    .from("news_i18n")
    .select("*")
    .eq("news_id", newsId)
    .eq("locale", locale)
    .maybeSingle();
  if (fetchError) return { ok: false, error: fetchError.message };
  if (!before) {
    return { ok: false, error: `news_i18n não encontrado para locale ${locale}.` };
  }

  const patch: Record<string, unknown> = {};
  if (title) patch.title = title;
  // Coluna real no schema: news_i18n.seo_description
  if (metaDescription !== undefined) patch.seo_description = metaDescription;

  const { error: updateError } = await ctx.db
    .from("news_i18n")
    .update(patch)
    .eq("news_id", newsId)
    .eq("locale", locale);
  if (updateError) return { ok: false, error: updateError.message };

  const auditError = await writeAuditLog(ctx.db, {
    adminId: ctx.profile.id,
    action: "news.edit_meta",
    entity: "news_i18n",
    entityId: newsId,
    before: {
      title: before.title,
      seo_description: (before as Record<string, unknown>).seo_description ?? null,
    },
    after: patch,
  });

  revalidatePath("/news");
  revalidatePath(`/news/${newsId}`);

  if (auditError) {
    return {
      ok: false,
      error: `Edição aplicada, mas falhou ao gravar audit log: ${auditError}`,
    };
  }
  return { ok: true, message: "Metadados atualizados." };
}

// ---- Fila de duplicados (§6 do contrato) ----

const DUPLICATE_RESOLUTIONS = {
  block: { status: "blocked_duplicate", label: "Bloquear" },
  publish_anyway: { status: "published", label: "Publicar mesmo assim" },
  merge: { status: "merged", label: "Mesclar" },
  update_existing: { status: "updated_existing", label: "Atualizar existente" },
  archive: { status: "archived", label: "Arquivar envio" },
} as const satisfies Record<string, { status: EditorialStatus; label: string }>;

export type DuplicateResolution = keyof typeof DUPLICATE_RESOLUTIONS;

const resolveDuplicateSchema = z.object({
  newsId: z.string().min(1),
  resolution: z.enum(
    Object.keys(DUPLICATE_RESOLUTIONS) as [
      DuplicateResolution,
      ...DuplicateResolution[],
    ],
  ),
});

export async function resolveDuplicate(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resolveDuplicateSchema.safeParse({
    newsId: formData.get("newsId"),
    resolution: formData.get("resolution"),
  });
  if (!parsed.success) return { ok: false, error: "Parâmetros inválidos." };

  const ctx = await getAdminActionContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const { newsId, resolution } = parsed.data;
  const target = DUPLICATE_RESOLUTIONS[resolution];

  const { data: before, error: fetchError } = await ctx.db
    .from("news_reviews")
    .select("*")
    .eq("id", newsId)
    .maybeSingle();
  if (fetchError) return { ok: false, error: fetchError.message };
  if (!before) return { ok: false, error: "NEWS não encontrada." };

  const patch: Record<string, unknown> = { status: target.status };
  if (resolution === "publish_anyway") {
    patch.published_at = new Date().toISOString();
  }

  const { error: updateError } = await ctx.db
    .from("news_reviews")
    .update(patch)
    .eq("id", newsId);
  if (updateError) return { ok: false, error: updateError.message };

  const auditError = await writeAuditLog(ctx.db, {
    adminId: ctx.profile.id,
    action: `duplicate.${resolution}`,
    entity: "news_reviews",
    entityId: newsId,
    before: {
      status: before.status,
      duplicate_of: before.duplicate_of,
      duplicate_score: before.duplicate_score,
      duplicate_reason: before.duplicate_reason,
    },
    after: patch,
  });

  revalidatePath("/duplicates");
  revalidatePath("/news");
  revalidatePath(`/news/${newsId}`);
  revalidatePath("/");

  if (auditError) {
    return {
      ok: false,
      error: `Ação aplicada, mas falhou ao gravar audit log: ${auditError}`,
    };
  }
  return { ok: true, message: `${target.label}: ok.` };
}

// ---- Legacy: alternar indexable ----

const toggleLegacySchema = z.object({
  postId: z.string().min(1),
  next: z.enum(["true", "false"]),
});

export async function toggleLegacyIndexable(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = toggleLegacySchema.safeParse({
    postId: formData.get("postId"),
    next: formData.get("next"),
  });
  if (!parsed.success) return { ok: false, error: "Parâmetros inválidos." };

  const ctx = await getAdminActionContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const { postId } = parsed.data;
  const next = parsed.data.next === "true";

  const { data: before, error: fetchError } = await ctx.db
    .from("legacy_posts")
    .select("id, indexable")
    .eq("id", postId)
    .maybeSingle();
  if (fetchError) return { ok: false, error: fetchError.message };
  if (!before) return { ok: false, error: "Post legado não encontrado." };

  const { error: updateError } = await ctx.db
    .from("legacy_posts")
    .update({ indexable: next })
    .eq("id", postId);
  if (updateError) return { ok: false, error: updateError.message };

  const auditError = await writeAuditLog(ctx.db, {
    adminId: ctx.profile.id,
    action: "legacy.toggle_indexable",
    entity: "legacy_posts",
    entityId: postId,
    before: { indexable: before.indexable },
    after: { indexable: next },
  });

  revalidatePath("/legacy");

  if (auditError) {
    return {
      ok: false,
      error: `Alterado, mas falhou ao gravar audit log: ${auditError}`,
    };
  }
  return { ok: true, message: `indexable → ${next ? "true" : "false"}` };
}
