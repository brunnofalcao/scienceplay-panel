import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { fetchCronLogs } from "@/lib/admin/queries";
import { getPanelDb } from "@/lib/db/panel";
import { formatDateTime, pickString } from "@/lib/formatters";
import type { GenericRow } from "@/types/database";

function cronDuration(row: GenericRow): string {
  const start = pickString(row, ["started_at"]);
  const end = pickString(row, ["finished_at"]);
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(ms) || ms < 0) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}
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
              <p className="text-xs text-muted">Job</p>
              <p className="font-mono">{pickString(last, ["job"]) ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Início</p>
              <p>{formatDateTime(pickString(last, ["started_at", "created_at"]))}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Status</p>
              <p className="font-mono">{pickString(last, ["status"]) ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Duração</p>
              <p className="font-mono">{cronDuration(last)}</p>
            </div>
          </div>
        </Card>
      ) : null}

      <Card
        title="Execuções (cron_logs)"
        subtitle="colunas reais: job, status, started_at, finished_at, detail (NEWS geradas/duplicados/erros vêm no detail)"
      >
        {rows.length === 0 ? (
          <EmptyState message="Nenhuma execução registrada em cron_logs — o cron diário roda no SITE (quando ativo)." />
        ) : (
          <Table head={["Job", "Início", "Fim", "Status", "Duração", "Detail"]}>
            {rows.map((row, index) => (
              <tr key={index}>
                <Td className="font-mono text-xs">{pickString(row, ["job"]) ?? "—"}</Td>
                <Td className="whitespace-nowrap font-mono text-xs text-muted">
                  {formatDateTime(pickString(row, ["started_at", "created_at"]))}
                </Td>
                <Td className="whitespace-nowrap font-mono text-xs text-muted">
                  {formatDateTime(pickString(row, ["finished_at"]))}
                </Td>
                <Td
                  className={`font-mono text-xs ${
                    /error|fail/i.test(pickString(row, ["status"]) ?? "")
                      ? "text-danger"
                      : ""
                  }`}
                >
                  {pickString(row, ["status"]) ?? "—"}
                </Td>
                <Td className="font-mono text-xs">{cronDuration(row)}</Td>
                <Td className="max-w-96 truncate font-mono text-[11px] text-muted">
                  {row.detail ? JSON.stringify(row.detail) : "—"}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
