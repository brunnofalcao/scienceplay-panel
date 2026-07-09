const STATUS_TONES: Record<string, string> = {
  published: "border-ok/50 bg-ok/10 text-ok",
  approved: "border-accent/50 bg-accent/10 text-accent",
  generated: "border-line bg-panel-2 text-muted",
  draft: "border-line bg-panel-2 text-muted",
  needs_review: "border-warn/50 bg-warn/10 text-warn",
  possible_duplicate: "border-warn/50 bg-warn/10 text-warn",
  rejected: "border-danger/50 bg-danger/10 text-danger",
  blocked_duplicate: "border-danger/50 bg-danger/10 text-danger",
  archived: "border-line bg-panel-2 text-muted",
  merged: "border-accent/50 bg-accent/10 text-accent",
  updated_existing: "border-accent/50 bg-accent/10 text-accent",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONES[status] ?? "border-line bg-panel-2 text-muted";
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[11px] ${tone}`}
    >
      {status}
    </span>
  );
}
