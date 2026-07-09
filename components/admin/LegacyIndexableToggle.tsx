"use client";

import { useActionState } from "react";
import { toggleLegacyIndexable } from "@/lib/admin/actions";
import type { ActionResult } from "@/types/admin";

export function LegacyIndexableToggle({
  postId,
  indexable,
}: {
  postId: string;
  indexable: boolean | null;
}) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(toggleLegacyIndexable, null);

  const next = !(indexable === true);

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="next" value={String(next)} />
      <button
        type="submit"
        disabled={pending}
        className={`rounded-md border px-2 py-0.5 font-mono text-[11px] disabled:opacity-50 ${
          indexable
            ? "border-ok/50 text-ok hover:bg-ok/10"
            : "border-line text-muted hover:border-accent"
        }`}
        title="Alternar indexable"
      >
        {pending ? "…" : indexable ? "indexable" : "noindex"}
      </button>
      {state && !state.ok ? (
        <span className="text-[11px] text-danger">{state.error}</span>
      ) : null}
    </form>
  );
}
