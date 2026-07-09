import type { ActionResult } from "@/types/admin";

export function ActionFeedback({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  return state.ok ? (
    <p className="rounded-md border border-ok/40 bg-ok/10 px-2 py-1 text-xs text-ok">
      {state.message ?? "Ação concluída."}
    </p>
  ) : (
    <p className="rounded-md border border-danger/40 bg-danger/10 px-2 py-1 text-xs text-danger">
      {state.error}
    </p>
  );
}
