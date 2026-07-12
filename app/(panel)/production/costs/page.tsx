import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { fetchCostAnalytics } from "@/lib/admin/costs";
import { getPanelDb } from "@/lib/db/panel";
import { formatDateTime, formatMs, formatNumber, formatUsd } from "@/lib/formatters";
import { BarList } from "@/components/charts/BarList";
import { Table, Td } from "@/components/tables/Table";
import { Card, StatCard } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotConfigured } from "@/components/ui/NotConfigured";
import { QueryDegradation } from "@/components/ui/QueryDegradation";
import { GuidedTour } from "@/components/ui/GuidedTour";
import { TOURS } from "@/lib/tours";

export const metadata: Metadata = { title: "Custos de IA" };

type SearchParams = Record<string, string | string[] | undefined>;
const param = (sp: SearchParams, key: string): string => {
  const v = sp[key];
  return typeof v === "string" ? v.trim() : "";
};

// barra proporcional ao custo; valor à direita, nome limpo
function usdBars(buckets: Array<{ name: string; count: number; costUsd: number }>) {
  return buckets.slice(0, 10).map((b) => ({
    name: b.name,
    count: Math.round(b.costUsd * 1_000_000) || b.count,
    hint: formatUsd(b.costUsd),
  }));
}

export default async function ProductionCostsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const guard = await requireAdmin();
  if (!guard.configured) return <NotConfigured />;
  const panel = await getPanelDb();
  if (!panel) return <NotConfigured />;

  const sp = await searchParams;
  const costs = await fetchCostAnalytics(panel.db, {
    from: param(sp, "from") || undefined,
    to: param(sp, "to") || undefined,
    feature: param(sp, "feature") || undefined,
    plan: param(sp, "plan") || undefined,
    provider: param(sp, "provider") || undefined,
    model: param(sp, "model") || undefined,
    status: param(sp, "status") || undefined,
    userId: param(sp, "user") || undefined,
    errorsOnly: param(sp, "errors") === "true",
  });

  const inputClass =
    "rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-sm outline-none focus:border-accent";

  return (
    <>
      <h1 className="text-lg font-semibold">Custos de IA</h1>
      <p className="text-sm text-muted">
        Atribuição via <code className="font-mono">ai_logs</code>
        {costs.sampleTruncated
          ? ` — amostra limitada às ${formatNumber(costs.sampleSize)} chamadas mais recentes`
          : ""}
        . Valores em horário de Brasília.
      </p>
      <QueryDegradation errors={costs.errors_} />

      <div data-tour="cost-totals" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Custo hoje" value={formatUsd(costs.totals.costToday)} />
        <StatCard label="Custo no mês" value={formatUsd(costs.totals.costMonth)} />
        <StatCard
          label="Custo total (amostra)"
          value={formatUsd(costs.totals.costSample)}
          hint={`${formatNumber(costs.totals.calls)} chamadas`}
        />
        <StatCard
          label="Custo médio por chamada"
          value={formatUsd(costs.totals.avgCostPerCall)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Erros de IA"
          value={formatNumber(costs.totals.errors)}
          tone={costs.totals.errors > 0 ? "danger" : "ok"}
          hint={
            costs.totals.needsReview > 0
              ? `${formatNumber(costs.totals.needsReview)} em revisão (não é erro duro)`
              : "falha total da chamada"
          }
        />
        <StatCard
          label="Failovers"
          value={formatNumber(costs.totals.fallbacks)}
          tone={costs.totals.fallbacks > 0 ? "warn" : "default"}
          hint="secundário assumiu — geração OK"
        />
        <StatCard
          label="Custo E2A"
          value={formatUsd(costs.e2aCost)}
          hint="estimado por nome de feature"
        />
        <StatCard
          label="Custo Content Studio"
          value={formatUsd(costs.studioCost)}
          hint="estimado por nome de feature"
        />
      </div>

      {costs.newsAttributionActive ? null : (
        <p className="rounded-lg border border-line bg-panel px-3 py-2 text-xs text-muted">
          <span className="font-semibold text-warn">
            Custo por NEWS: aguardando as primeiras gerações com atribuição
          </span>{" "}
          — as colunas de vínculo (entity_type/entity_id, migration 0017) já
          existem; o motor passa a preenchê-las a partir do deploy do PR #2 do
          SITE. Gerações antigas permanecem sem vínculo (honestamente não
          rastreáveis).
        </p>
      )}

      <form data-tour="cost-filters" method="get" className="flex flex-wrap items-end gap-2 text-sm">
        <input type="date" name="from" defaultValue={param(sp, "from")} className={inputClass} />
        <input type="date" name="to" defaultValue={param(sp, "to")} className={inputClass} />
        <input name="feature" defaultValue={param(sp, "feature")} placeholder="Feature" className={`${inputClass} w-32`} />
        <input name="user" defaultValue={param(sp, "user")} placeholder="user_id" className={`${inputClass} w-40 font-mono text-xs`} />
        <input name="plan" defaultValue={param(sp, "plan")} placeholder="Plano" className={`${inputClass} w-28`} />
        <input name="provider" defaultValue={param(sp, "provider")} placeholder="Provider" className={`${inputClass} w-28`} />
        <input name="model" defaultValue={param(sp, "model")} placeholder="Modelo" className={`${inputClass} w-32`} />
        <input name="status" defaultValue={param(sp, "status")} placeholder="Status" className={`${inputClass} w-24`} />
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" name="errors" value="true" defaultChecked={param(sp, "errors") === "true"} />
          só erros
        </label>
        <button type="submit" className="rounded-lg border border-accent/60 px-3 py-1.5 text-xs text-accent hover:bg-accent/10">
          Filtrar
        </button>
      </form>

      <div data-tour="cost-breakdowns" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {costs.newsAttributionActive ? (
          <Card title="Custo por NEWS (exato)" subtitle="via ai_logs.entity_id · top 10">
            <BarList items={usdBars(costs.byNews)} />
          </Card>
        ) : null}
        <Card title="Custo por usuário">
          <BarList items={usdBars(costs.byUser)} emptyMessage="Sem dados." />
        </Card>
        <Card title="Custo por plano">
          <BarList items={usdBars(costs.byPlan)} emptyMessage="Sem dados." />
        </Card>
        <Card title="Custo por feature">
          <BarList items={usdBars(costs.byFeature)} emptyMessage="Sem dados." />
        </Card>
        <Card title="Custo por provider">
          <BarList items={usdBars(costs.byProvider)} emptyMessage="Sem dados." />
        </Card>
        <Card title="Custo por modelo">
          <BarList items={usdBars(costs.byModel)} emptyMessage="Sem dados." />
        </Card>
        <Card title="Custo por dia" subtitle="últimos 30 dias com dados">
          <BarList items={usdBars(costs.byDay)} emptyMessage="Sem dados." />
        </Card>
      </div>

      <Card title="Chamadas (filtro atual)" subtitle="máx. 200 exibidas">
        {costs.rows.length === 0 ? (
          <EmptyState message="Nenhuma chamada de IA no filtro." />
        ) : (
          <Table
            head={["Data", "Feature", "Usuário", "Plano", "Provider", "Modelo", "Tokens in", "Tokens out", "Custo", "Latência", "Status", "Erro"]}
          >
            {costs.rows.slice(0, 200).map((row, index) => (
              <tr key={index} className="hover:bg-panel-2">
                <Td className="whitespace-nowrap font-mono text-xs text-muted">
                  {formatDateTime(row.createdAt)}
                </Td>
                <Td className="font-mono text-xs">{row.feature}</Td>
                <Td className="max-w-44 truncate text-xs">{row.userEmail}</Td>
                <Td className="text-xs">{row.plan}</Td>
                <Td className="font-mono text-xs">{row.provider}</Td>
                <Td className="max-w-36 truncate font-mono text-xs">{row.model}</Td>
                <Td className="font-mono text-xs tabular-nums">{row.tokensIn ?? "—"}</Td>
                <Td className="font-mono text-xs tabular-nums">{row.tokensOut ?? "—"}</Td>
                <Td className="font-mono text-xs">{row.costUsd !== null ? formatUsd(row.costUsd) : "—"}</Td>
                <Td className="font-mono text-xs">{formatMs(row.latencyMs)}</Td>
                <Td>
                  <StatusBadge status={row.status} />
                </Td>
                <Td className="max-w-48 truncate text-xs text-danger">{row.error ?? "—"}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      <GuidedTour screen="Custos de IA" sections={TOURS["Custos de IA"]} />
    </>
  );
}
