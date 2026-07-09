"use client";

import { useActionState } from "react";
import {
  resolveDuplicate,
  type DuplicateResolution,
} from "@/lib/admin/actions";
import type { ActionResult } from "@/types/admin";
import { ActionFeedback } from "@/components/admin/ActionFeedback";

const BUTTONS: Array<{
  resolution: DuplicateResolution;
  label: string;
  tone: "ok" | "neutral" | "danger";
  confirm?: string;
}> = [
  {
    resolution: "block",
    label: "Bloquear",
    tone: "danger",
    confirm: "Bloquear este envio como duplicado?",
  },
  {
    resolution: "publish_anyway",
    label: "Publicar mesmo assim",
    tone: "ok",
    confirm: "Publicar mesmo sendo possível duplicado?",
  },
  {
    resolution: "merge",
    label: "Mesclar",
    tone: "neutral",
    confirm:
      "Marcar como mesclado na NEWS existente? (a mescla de conteúdo em si é editorial)",
  },
  {
    resolution: "update_existing",
    label: "Atualizar existente",
    tone: "neutral",
    confirm: "Marcar como atualização da NEWS existente?",
  },
  {
    resolution: "archive",
    label: "Arquivar envio",
    tone: "danger",
    confirm: "Arquivar este envio?",
  },
];

const TONE_CLASS = {
  ok: "border-ok/50 text-ok hover:bg-ok/10",
  neutral: "border-line text-ink hover:border-accent",
  danger: "border-danger/50 text-danger hover:bg-danger/10",
} as const;

export function DuplicateActions({ newsId }: { newsId: string }) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(resolveDuplicate, null);

  return (
    <div className="space-y-1.5">
      <form
        action={formAction}
        className="flex flex-wrap gap-1.5"
        onSubmit={(event) => {
          const submitter = (event.nativeEvent as SubmitEvent)
            .submitter as HTMLButtonElement | null;
          const confirmMessage = submitter?.dataset.confirm;
          if (confirmMessage && !window.confirm(confirmMessage)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="newsId" value={newsId} />
        {BUTTONS.map(({ resolution, label, tone, confirm }) => (
          <button
            key={resolution}
            type="submit"
            name="resolution"
            value={resolution}
            data-confirm={confirm}
            disabled={pending}
            className={`rounded-md border px-2 py-1 text-xs disabled:opacity-50 ${TONE_CLASS[tone]}`}
          >
            {label}
          </button>
        ))}
      </form>
      <ActionFeedback state={state} />
    </div>
  );
}
