"use client";

import { useActionState } from "react";
import { editNewsMeta } from "@/lib/admin/actions";
import type { ActionResult } from "@/types/admin";
import { ActionFeedback } from "@/components/admin/ActionFeedback";

export function EditNewsMetaForm({
  newsId,
  locale,
  currentTitle,
  currentMetaDescription,
}: {
  newsId: string;
  locale: string;
  currentTitle: string;
  currentMetaDescription: string;
}) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(editNewsMeta, null);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="newsId" value={newsId} />
      <input type="hidden" name="locale" value={locale} />
      <div>
        <label htmlFor={`title-${newsId}`} className="block text-xs text-muted">
          Título
        </label>
        <input
          id={`title-${newsId}`}
          name="title"
          defaultValue={currentTitle}
          className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div>
        <label htmlFor={`meta-${newsId}`} className="block text-xs text-muted">
          Meta description
        </label>
        <textarea
          id={`meta-${newsId}`}
          name="metaDescription"
          rows={3}
          defaultValue={currentMetaDescription}
          className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-accent/60 px-3 py-1.5 text-xs text-accent hover:bg-accent/10 disabled:opacity-50"
        >
          {pending ? "Salvando…" : "Salvar metadados"}
        </button>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
