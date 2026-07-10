import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { fetchAiLogs } from "@/lib/admin/queries";
import { getPanelDb } from "@/lib/db/panel";
import { formatDateTime, formatMs, formatNumber, formatUsd } from "@/lib/formatters";
import { BarList } from "@/components/charts/BarList";
import { Table, Td } from "@/components/tables/Table";
import { Card, StatCard } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotConfigured } from "@/components/ui/NotConfigured";
import { QueryDegradation } from "@/components/ui/QueryDegradation";

export const metadata: Metadata = { title: "AI Logs" };

type SearchParams = Record<string, string | string[] | undefined>;
const param = (sp: SearchParams, key: string): string => {
  const v = sp[key];
  return typeof v === "string" ? v.trim() : "";
};

export default async function AiLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const guard = await requireAdmin();
  if (!guard.configured) return <NotConfigured />;
  const panel = await getPanelDb();
  if (!panel) return <NotConfigured />;

  const sp = await searchParams;
  const { items, totals, groups, errors } = await fetchAiLogs(panel.db, {
    provider: param(sp, "provider") || undefined,
    model: param(sp, "model") || undefined,
    status: param(sp, "status") || undefined,
    feature: param(sp, "feature") || undefined,
    errorsOnly: param(sp, "errors") === "true",
    fallbackOnly: param(sp, "fallback") === "true",
  });

  const inputClass =
    "w-36 rounded-lg border border-line bg-panel-2 px-3 py-1.5 outline-none focus:border-accent";

  return (
    <>
      <h1 className="text-lg font-semibold">AI Logs</h1>
      <p className="text-sm text-muted">
        Telemetria das chamadas de IA. Nunca exibe chave, segredo ou prompt
        bruto sensível.
      </p>
      <QueryDegradation errors={errors} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Chamadas (amostra)" value={formatNumber(totals.calls)} />
        <StatCard
          label="Erros"
          value={formatNumber(totals.errors)}
          tone={totals.errors > 0 ? "danger" : "ok"}
        />
        <StatCard
          label="Failovers"
          value={formatNumber(totals.fallbacks)}
          tone={totals.fallbacks > 0 ? "warn" : "default"}
        />
        <StatCard label="Custo estimado" value={formatUsd(totals.costUsd)} />
      </div>

      <form method="get" className="flex flex-wrap items-end gap-2 text-sm">
        <input name="provider" defaultValue={param(sp, "provider")} placeholder="Provider" className={inputClass} />
        <input name="model" defaultValue={param(sp, "model")} placeholder="Modelo" className={inputClass} />
        <input name="status" defaultValue={param(sp, "status")} placeholder="Status" className={inputClass} />
        <input name="feature" defaultValue={param(sp, "feature")} placeholder="Feature" className={inputClass} />
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" name="errors" value="true" defaultChecked={param(sp, "errors") === "true"} />
          só erros
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" name="fallback" value="true" defaultChecked={param(sp, "fallback") === "true"} />
          só failover
        </label>
        <button
          type="submit"
          className="rounded-lg border border-accent/60 px-3 py-1.5 text-xs text-accent hover:bg-accent/10"
        >
          Filtrar
        </button>
        <a
          href={`/ai-logs/export?${new URLSearchParams(
            Object.entries({
              provider: param(sp, "provider"),
              model: param(sp, "model"),
              status: param(sp, "status"),
              feature: param(sp, "feature"),
              errors: param(sp, "errors"),
              fallback: param(sp, "fallback"),
            }).filter(([, v]) => v),
          ).toString()}`}
          className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-ink"
        >
          Exportar CSV
        </a>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Por dia" subtitle="chamadas e custo">
          <BarList
            items={groups.byDay.map((g) => ({
              name: g.name,
              count: g.count,
              hint: `${g.count} · ${formatUsd(g.costUsd)}`,
            }))}
          />
        </Card>
        <Card title="Por feature">
          <BarList
            items={groups.byFeature.map((g) => ({
              name: g.name,
              count: g.count,
              hint: `${g.count} · ${formatUsd(g.costUsd)}`,
            }))}
          />
        </Card>
        <Card title="Por provider/modelo">
          <BarList
            items={groups.byProviderModel.map((g) => ({
              name: g.name,
              count: g.count,
              hint: `${g.count} · ${formatUsd(g.costUsd)}`,
            }))}
          />
        </Card>
      </div>

      {items.length === 0 ? (
        <EmptyState message="Nenhum log de IA encontrado." />
      ) : (
        <Table
          head={[
            "Data",
            "Feature",
            "Provider",
            "Modelo",
            "Status",
            "Latência",
            "Tokens in",
            "Tokens out",
            "Custo",
            "Erro",
            "Fallback",
            "user_id",
          ]}
        >
          {items.map((log, index) => (
            <tr key={index} className="hover:bg-panel-2">
              <Td className="whitespace-nowrap font-mono text-xs text-muted">
                {formatDateTime(log.createdAt)}
              </Td>
              <Td className="font-mono text-xs">{log.feature}</Td>
              <Td className="font-mono text-xs">{log.provider}</Td>
              <Td className="max-w-44 truncate font-mono text-xs">{log.model}</Td>
              <Td>
                <StatusBadge status={log.status} />
              </Td>
              <Td className="font-mono text-xs">{formatMs(log.latencyMs)}</Td>
              <Td className="font-mono text-xs tabular-nums">{log.tokensIn ?? "—"}</Td>
              <Td className="font-mono text-xs tabular-nums">{log.tokensOut ?? "—"}</Td>
              <Td className="font-mono text-xs">
                {log.costUsd !== null ? formatUsd(log.costUsd) : "—"}
              </Td>
              <Td className="max-w-52 truncate text-xs text-danger">{log.error ?? "—"}</Td>
              <Td className="text-xs">{log.fallback ? "sim" : "—"}</Td>
              <Td className="max-w-28 truncate font-mono text-[11px] text-muted">
                {log.userId ?? "—"}
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
