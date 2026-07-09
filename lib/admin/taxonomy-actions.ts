"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminActionContext } from "@/lib/admin/action-context";
import { writeAuditLog } from "@/lib/admin/audit";
import { slugify } from "@/lib/formatters";
import type { ActionResult } from "@/types/admin";

/** Tabelas de taxonomia que o ADMIN gerencia (whitelist — nada fora dela). */
export const TAXONOMY_TABLES = [
  "professions",
  "specialties",
  "categories",
  "tags",
] as const;
export type TaxonomyTable = (typeof TAXONOMY_TABLES)[number];

const createSchema = z.object({
  table: z.enum(TAXONOMY_TABLES),
  name: z.string().trim().min(2).max(120),
});

export async function createTaxonomyItem(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createSchema.safeParse({
    table: formData.get("table"),
    name: formData.get("name"),
  });
  if (!parsed.success) return { ok: false, error: "Nome inválido (mín. 2 caracteres)." };

  const ctx = await getAdminActionContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const { table, name } = parsed.data;

  // O shape exato varia por tabela; tenta name+slug e degrada para name.
  let insertError: string | null = null;
  let inserted: Record<string, unknown> | null = null;

  const payloads: Array<Record<string, unknown>> = [
    { name, slug: slugify(name) },
    { name },
  ];
  for (const payload of payloads) {
    const { data, error } = await ctx.db
      .from(table)
      .insert(payload as never)
      .select("*")
      .maybeSingle();
    if (!error) {
      inserted = (data as Record<string, unknown>) ?? payload;
      insertError = null;
      break;
    }
    insertError = error.message;
    // Só tenta o payload reduzido quando o problema é coluna inexistente.
    if (!/column|slug/i.test(error.message)) break;
  }

  if (insertError) return { ok: false, error: insertError };

  const auditError = await writeAuditLog(ctx.db, {
    adminId: ctx.profile.id,
    action: `taxonomy.create.${table}`,
    entity: table,
    entityId: inserted && typeof inserted.id === "string" ? inserted.id : null,
    before: null,
    after: { name },
  });

  revalidatePath("/taxonomies");

  if (auditError) {
    return {
      ok: false,
      error: `Criado, mas falhou ao gravar audit log: ${auditError}`,
    };
  }
  return { ok: true, message: `"${name}" criado em ${table}.` };
}

const renameSchema = z.object({
  table: z.enum(TAXONOMY_TABLES),
  id: z.string().min(1),
  name: z.string().trim().min(2).max(120),
});

export async function renameTaxonomyItem(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = renameSchema.safeParse({
    table: formData.get("table"),
    id: formData.get("id"),
    name: formData.get("name"),
  });
  if (!parsed.success) return { ok: false, error: "Parâmetros inválidos." };

  const ctx = await getAdminActionContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const { table, id, name } = parsed.data;

  const { data: before, error: fetchError } = await ctx.db
    .from(table)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) return { ok: false, error: fetchError.message };
  if (!before) return { ok: false, error: "Item não encontrado." };

  const { error: updateError } = await ctx.db
    .from(table)
    .update({ name })
    .eq("id", id);
  if (updateError) return { ok: false, error: updateError.message };

  const auditError = await writeAuditLog(ctx.db, {
    adminId: ctx.profile.id,
    action: `taxonomy.rename.${table}`,
    entity: table,
    entityId: id,
    before: { name: (before as Record<string, unknown>).name ?? null },
    after: { name },
  });

  revalidatePath("/taxonomies");

  if (auditError) {
    return {
      ok: false,
      error: `Renomeado, mas falhou ao gravar audit log: ${auditError}`,
    };
  }
  return { ok: true, message: "Item renomeado." };
}
