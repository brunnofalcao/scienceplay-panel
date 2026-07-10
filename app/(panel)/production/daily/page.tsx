import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { fetchCostAnalytics } from "@/lib/admin/costs";
import { fetchProductionOverview } from "@/lib/admin/production";
import { getPanelDb } from "@/lib/db/panel";
import {
  formatDateTime,
  formatMs,
  formatNumber,
  formatUsd,
  pickString,
} from "@/lib/formatters";
import { hasSiteInternalSecret } from "@/lib/site/internal";
import { DailyTriggerForm } from "@/components/admin/production/ProductionForms";
import { BarList } from "@/components/charts/BarList";
import { Card, StatCard } from "@/components/ui/Card";
import { NotConfigured } from "@/components/ui/NotConfigured";
import { QueryDegradation } from "@/components/ui/QueryDegradation";

export const metadata: Metadata = { title: "Produção Diária" };

export default async function ProductionDailyPage() {
  const guard = await requireAdmin();
  if (!guard.configured) return <NotConfigured />;
  const panel = await getPanelDb();
  if (!panel) return <NotConfigured />;

  const [overview, costs] = await Promise.all([
    fetchProductionOverview(panel.db),
    fetchCostAnalytics(panel.db),
  ]);
  const ready = hasSiteInternalSecret();
  const last = overview.lastCron;

  return (
    <>
      <h1 className="text-lg font-semibold">Produção Diária</h1>
      <p className="text-sm text-muted">
        Visão executiva do motor diário. Detalhe técnico das execuções continua
        em /cron.
      </p>
      <QueryDegradation errors={[...overview.errors, ...costs.errors_]} />

      <Card title="Motor diário" subtitle="POST {SITE}/api/internal/daily-news">
        <div className="mb-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div>
            <p className="text-xs text-muted">Última execução</p>
            <p>
              {last
                ? formatDateTime(pickString(last, ["started_at", "created_at"]))
                : "nenhuma registrada"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Status</p>
            <p className="font-mono">{last ? (pickString(last, ["status"]) ?? "—") : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Próxima execução</p>
            <p className="text-warn">agendamento ainda não configurado no SITE</p>
          </div>
          <div>
            <p className="text-xs text-muted">Detalhe</p>
            <p className="truncate font-mono text-xs text-muted">
              {last?.detail ? JSON.stringify(last.detail) : "—"}
            </p>
          </div>
        </div>
        <DailyTriggerForm ready={ready} />
      </Card>

      <h2 className="pt-1 text-xs uppercase tracking-widest text-muted">Pipeline de hoje</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="NEWS geradas hoje" value={formatNumber(overview.today)} />
        <StatCard label="Publicadas hoje" value={formatNumber(overview.publishedToday)} tone="ok" />
        <StatCard
          label="Possíveis duplicadas"
          value={formatNumber(overview.possibleDuplicates)}
          tone={overview.possibleDuplicates > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Com falha (needs_review)"
          value={formatNumber(overview.needsReview)}
          tone={overview.needsReview > 0 ? "danger" : "ok"}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Geradas no mês" value={formatNumber(overview.month)} />
        <StatCard label="Auto-publicadas no mês" value={formatNumber(overview.autoPublishedMonth)} />
        <StatCard label="Custo IA hoje" value={formatUsd(costs.totals.costToday)} />
        <StatCard label="Custo IA no mês" value={formatUsd(costs.totals.costMonth)} />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Tempo médio de geração"
          value={costs.totals.avgLatencyMs !== null ? formatMs(costs.totals.avgLatencyMs) : "—"}
          hint="latência média das chamadas de IA"
        />
        <StatCard
          label="Erros de IA"
          value={formatNumber(costs.totals.errors)}
          tone={costs.totals.errors > 0 ? "danger" : "ok"}
        />
        <StatCard
          label="Failovers"
          value={formatNumber(costs.totals.fallbacks)}
          tone={costs.totals.fallbacks > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Provider/modelo principal"
          value={costs.byProvider[0]?.name ?? "—"}
          hint={costs.byModel[0]?.name}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Produção por área" subtitle="NEWS do mês">
          <BarList items={overview.byArea} emptyMessage="Sem produção no mês." />
        </Card>
        <Card title="Produção por grau">
          <BarList items={overview.byGrade} emptyMessage="Sem produção no mês." />
        </Card>
        <Card title="Produção por origem">
          <BarList items={overview.byOrigin} emptyMessage="Sem produção no mês." />
        </Card>
        <Card title="Custo por modelo" subtitle="amostra de ai_logs">
          <BarList
            items={costs.byModel.slice(0, 8).map((b) => ({
              name: `${b.name} · ${formatUsd(b.costUsd)}`,
              count: b.count,
            }))}
            emptyMessage="Sem chamadas de IA."
          />
        </Card>
        <Card title="Custo por dia" subtitle="últimos 30 dias com dados">
          <BarList
            items={costs.byDay.map((b) => ({
              name: `${b.name} · ${formatUsd(b.costUsd)}`,
              count: b.count,
            }))}
            emptyMessage="Sem chamadas de IA."
          />
        </Card>
      </div>
    </>
  );
}
