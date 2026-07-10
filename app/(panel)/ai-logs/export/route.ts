import type { NextRequest } from "next/server";
import { fetchAiLogs } from "@/lib/admin/queries";
import { getSessionProfile } from "@/lib/auth/session";
import { getPanelDb } from "@/lib/db/panel";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Export CSV dos AI Logs (mesmos filtros da tela). Route handlers não passam
 * pelo layout — o guard admin é reaplicado aqui. Sem prompt bruto, sem chave.
 */
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return new Response("Supabase não configurado.", { status: 503 });
  }
  const profile = await getSessionProfile();
  if (!profile) return new Response("Não autenticado.", { status: 401 });
  if (profile.role !== "admin") {
    return new Response("Acesso não autorizado.", { status: 403 });
  }

  const panel = await getPanelDb();
  if (!panel) return new Response("Supabase não configurado.", { status: 503 });

  const { searchParams } = new URL(request.url);
  const { allItems } = await fetchAiLogs(panel.db, {
    provider: searchParams.get("provider") ?? undefined,
    model: searchParams.get("model") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    feature: searchParams.get("feature") ?? undefined,
    errorsOnly: searchParams.get("errors") === "true",
    fallbackOnly: searchParams.get("fallback") === "true",
  });

  const escape = (value: string | number | null): string => {
    if (value === null) return "";
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const header = [
    "created_at",
    "feature",
    "provider",
    "model",
    "status",
    "latency_ms",
    "input_tokens",
    "output_tokens",
    "cost_usd",
    "error",
    "fallback",
    "user_id",
  ];
  const lines = [
    header.join(","),
    ...allItems.map((i) =>
      [
        escape(i.createdAt),
        escape(i.feature),
        escape(i.provider),
        escape(i.model),
        escape(i.status),
        escape(i.latencyMs),
        escape(i.tokensIn),
        escape(i.tokensOut),
        escape(i.costUsd),
        escape(i.error),
        escape(i.fallback ? "true" : "false"),
        escape(i.userId),
      ].join(","),
    ),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="ai-logs.csv"',
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
