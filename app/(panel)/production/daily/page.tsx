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
import { GuidedTour } from "@/components/ui/GuidedTour";
import { TOURS } from "@/lib/tours";

export const metadata: Metadata = { title: "Produção Diária" };
// O disparo manual espera o motor do SITE terminar (até 300s por lá).
export const maxDuration = 300;

type DailyRunMeta = {
  published?: number;
  discovered?: number;
  needsReview?: number;
  deduped?: number;
  unresolved?: number;
  errors?: number;
};

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
  const lastRun = overview.dailyRuns[0] ?? null;
  const lastMeta = (lastRun?.meta ?? null) as DailyRunMeta | null;

  return (
    <>
      <h1 className="text-lg font-semibold">Produção Diária</h1>
      <p className="text-sm text-muted">
        Visão executiva do motor diário. Detalhe técnico das execuções continua
        em /cron.
      </p>
      <QueryDegradation errors={[...overview.errors, ...costs.errors_]} />

      <Card
        title="Motor diário"
        subtitle="GET {SITE}/api/cron/daily-news · agendado 06:30 BRT (Vercel cron) · publica até 6 NEWS/dia"
      >
        <div className="mb-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div>
            <p className="text-xs text-muted">Última execução</p>
            <p>
              {lastRun
                ? formatDateTime(pickString(lastRun, ["created_at"]))
                : "nenhuma registrada ainda"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Resultado</p>
            <p className="font-mono text-xs">
              {lastMeta
                ? `${lastMeta.published ?? 0} publicadas · ${lastMeta.deduped ?? 0} dedup · ${lastMeta.needsReview ?? 0} revisão · ${lastMeta.unresolved ?? 0} não resolvidas · ${lastMeta.errors ?? 0} erros`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Próxima execução</p>
            <p>06:30 (horário de Brasília) — cron da Vercel no SITE</p>
          </div>
          <div>
            <p className="text-xs text-muted">Descobertos na última</p>
            <p className="tabular-nums">{lastMeta?.discovered ?? "—"}</p>
          </div>
        </div>
        <DailyTriggerForm ready={ready} />
      </Card>

      {overview.dailyRuns.length > 0 ? (
        <Card title="Histórico de execuções" subtitle="usage_events · cron_daily_news">
          <ul className="space-y-1 text-sm">
            {overview.dailyRuns.map((run, index) => {
              const meta = (run.meta ?? {}) as DailyRunMeta;
              return (
                <li key={index} className="flex items-baseline gap-3 border-b border-line/50 py-1 last:border-0">
                  <span className="w-32 shrink-0 font-mono text-xs text-muted">
                    {formatDateTime(pickString(run, ["created_at"]))}
                  </span>
                  <span className="font-mono text-xs">
                    {meta.published ?? 0} publicadas · {meta.discovered ?? 0} descobertas ·{" "}
                    {meta.deduped ?? 0} dedup · {meta.needsReview ?? 0} revisão ·{" "}
                    <span className={meta.unresolved ? "text-warn" : ""}>
                      {meta.unresolved ?? 0} não resolvidas
                    </span>{" "}
                    ·{" "}
                    <span className={meta.errors ? "text-danger" : ""}>
                      {meta.errors ?? 0} erros
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

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
              name: b.name,
              count: b.count,
              hint: formatUsd(b.costUsd),
            }))}
            emptyMessage="Sem chamadas de IA."
          />
        </Card>
        <Card title="Custo por dia" subtitle="últimos 30 dias com dados">
          <BarList
            items={costs.byDay.map((b) => ({
              name: b.name,
              count: b.count,
              hint: formatUsd(b.costUsd),
            }))}
            emptyMessage="Sem chamadas de IA."
          />
        </Card>
      </div>
      <GuidedTour screen="Produção Diária" sections={TOURS["Produção Diária"]} />
    </>
  );
}
