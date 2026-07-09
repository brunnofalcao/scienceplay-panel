"use client";

import { useActionState } from "react";
import { moderateNews, type NewsModerationAction } from "@/lib/admin/actions";
import type { ActionResult } from "@/types/admin";
import { ActionFeedback } from "@/components/admin/ActionFeedback";

const BUTTONS: Array<{
  action: NewsModerationAction;
  label: string;
  tone: "ok" | "neutral" | "danger";
  confirm?: string;
}> = [
  { action: "publish", label: "Publicar", tone: "ok" },
  {
    action: "unpublish",
    label: "Despublicar",
    tone: "neutral",
    confirm: "Despublicar esta NEWS? Ela sai do site público.",
  },
  { action: "approve", label: "Aprovar", tone: "neutral" },
  {
    action: "reject",
    label: "Rejeitar",
    tone: "danger",
    confirm: "Rejeitar esta NEWS?",
  },
  {
    action: "archive",
    label: "Arquivar",
    tone: "danger",
    confirm: "Arquivar esta NEWS?",
  },
  {
    action: "mark_duplicate",
    label: "Marcar duplicado",
    tone: "neutral",
    confirm: "Marcar como possível duplicado? Vai para a fila de duplicados.",
  },
];

const TONE_CLASS = {
  ok: "border-ok/50 text-ok hover:bg-ok/10",
  neutral: "border-line text-ink hover:border-accent",
  danger: "border-danger/50 text-danger hover:bg-danger/10",
} as const;

export function NewsActions({
  newsId,
  compact = false,
}: {
  newsId: string;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(moderateNews, null);

  const buttons = compact
    ? BUTTONS.filter((b) => ["publish", "reject", "mark_duplicate"].includes(b.action))
    : BUTTONS;

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
        {buttons.map(({ action, label, tone, confirm }) => (
          <button
            key={action}
            type="submit"
            name="action"
            value={action}
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
