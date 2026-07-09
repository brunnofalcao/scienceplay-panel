"use client";

import { useActionState } from "react";
import { createTaxonomyItem } from "@/lib/admin/taxonomy-actions";
import type { ActionResult } from "@/types/admin";
import { ActionFeedback } from "@/components/admin/ActionFeedback";

export function TaxonomyCreator({ table }: { table: string }) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(createTaxonomyItem, null);

  return (
    <div className="space-y-1.5">
      <form action={formAction} className="flex gap-2">
        <input type="hidden" name="table" value={table} />
        <input
          name="name"
          required
          minLength={2}
          placeholder={`Novo item em ${table}…`}
          className="flex-1 rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-accent/60 px-3 py-1.5 text-xs text-accent hover:bg-accent/10 disabled:opacity-50"
        >
          {pending ? "Criando…" : "Criar"}
        </button>
      </form>
      <ActionFeedback state={state} />
    </div>
  );
}
