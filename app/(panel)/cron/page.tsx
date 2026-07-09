import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { fetchCronLogs } from "@/lib/admin/queries";
import { getPanelDb } from "@/lib/db/panel";
import { formatDateTime, pickNumber, pickString } from "@/lib/formatters";
import { Table, Td } from "@/components/tables/Table";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotConfigured } from "@/components/ui/NotConfigured";
import { QueryDegradation } from "@/components/ui/QueryDegradation";

export const metadata: Metadata = { title: "Cron" };

export default async function CronPage() {
  const guard = await requireAdmin();
  if (!guard.configured) return <NotConfigured />;
  const panel = await getPanelDb();
  if (!panel) return <NotConfigured />;

  const { rows, errors } = await fetchCronLogs(panel.db);
  const last = rows[0] ?? null;

  return (
    <>
      <h1 className="text-lg font-semibold">Cron — motor diário</h1>
      <QueryDegradation errors={errors} />

      <Card title="Disparo manual">
        <p className="text-sm text-warn">
          Endpoint diário ainda não configurado no SITE.
        </p>
        <p className="mt-1 text-sm text-muted">
          Quando o SITE expuser{" "}
          <code className="font-mono text-xs">
            POST {"{PUBLIC_SITE_URL}"}/api/internal/daily-news
          </code>{" "}
          (com segredo server-side), o disparo manual será habilitado aqui.
          Nenhuma integração falsa foi criada.
        </p>
      </Card>

      {last ? (
        <Card title="Última execução">
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div>
              <p className="text-xs text-muted">Data</p>
              <p>{formatDateTime(pickString(last, ["created_at", "started_at"]))}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Status</p>
              <p className="font-mono">{pickString(last, ["status"]) ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">NEWS geradas</p>
              <p className="tabular-nums">
                {pickNumber(last, ["news_generated", "generated_count", "created_count"]) ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Duplicados encontrados</p>
              <p className="tabular-nums">
                {pickNumber(last, ["duplicates_found", "duplicate_count"]) ?? "—"}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <Card title="Execuções (cron_logs)">
        {rows.length === 0 ? (
          <EmptyState message="Nenhuma execução registrada em cron_logs — o cron diário roda no SITE (quando ativo)." />
        ) : (
          <Table head={["Data", "Status", "NEWS geradas", "Duplicados", "Erros", "Latência", "Detalhe"]}>
            {rows.map((row, index) => (
              <tr key={index}>
                <Td className="whitespace-nowrap font-mono text-xs text-muted">
                  {formatDateTime(pickString(row, ["created_at", "started_at"]))}
                </Td>
                <Td className="font-mono text-xs">{pickString(row, ["status"]) ?? "—"}</Td>
                <Td className="font-mono text-xs tabular-nums">
                  {pickNumber(row, ["news_generated", "generated_count", "created_count"]) ?? "—"}
                </Td>
                <Td className="font-mono text-xs tabular-nums">
                  {pickNumber(row, ["duplicates_found", "duplicate_count"]) ?? "—"}
                </Td>
                <Td className="font-mono text-xs text-danger">
                  {pickString(row, ["error", "error_message", "errors"]) ?? "—"}
                </Td>
                <Td className="font-mono text-xs">
                  {pickNumber(row, ["duration_ms", "latency_ms"]) ?? "—"}
                </Td>
                <Td className="max-w-72 truncate font-mono text-[11px] text-muted">
                  {pickString(row, ["message", "detail", "summary"]) ?? "—"}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
