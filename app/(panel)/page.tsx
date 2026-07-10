import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { fetchCostAnalytics } from "@/lib/admin/costs";
import { fetchProductionOverview } from "@/lib/admin/production";
import { getDashboardData } from "@/lib/admin/queries";
import { getPanelDb } from "@/lib/db/panel";
import { formatNumber, formatUsd } from "@/lib/formatters";
import { BarList } from "@/components/charts/BarList";
import { Card, StatCard } from "@/components/ui/Card";
import { AttentionRow } from "@/components/ui/AttentionRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Collapsible } from "@/components/ui/Collapsible";
import { GuidedTour } from "@/components/ui/GuidedTour";
import { TOURS } from "@/lib/tours";
import { NotConfigured, ServiceRoleMissing } from "@/components/ui/NotConfigured";
import { QueryDegradation } from "@/components/ui/QueryDegradation";

export default async function DashboardPage() {
  const guard = await requireAdmin();
  if (!guard.configured) return <NotConfigured />;

  const panel = await getPanelDb();
  if (!panel) return <NotConfigured />;

  const [data, production, costs] = await Promise.all([
    getDashboardData(panel.db),
    fetchProductionOverview(panel.db),
    fetchCostAnalytics(panel.db),
  ]);
  const limitsTotal =
    data.usage.limitsHit.news + data.usage.limitsHit.e2a + data.usage.limitsHit.studio;

  const attention = [
    {
      label: "NEWS aguardando revisão",
      count: data.news.needsReview,
      href: "/production/queue",
      cta: "Revisar",
      tone: "warn" as const,
    },
    {
      label: "Possíveis duplicados na fila",
      count: data.news.possibleDuplicates,
      href: "/duplicates",
      cta: "Resolver",
      tone: "warn" as const,
    },
    {
      label: "Erros de IA (amostra)",
      count: costs.totals.errors,
      href: "/ai-logs?errors=true",
      cta: "Investigar",
      tone: "danger" as const,
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Command Center</h1>
          <p className="text-sm text-muted">
            O que aconteceu, o que importa e o que precisa de ação.
          </p>
        </div>
        {!panel.serviceRole ? <ServiceRoleMissing /> : null}
      </div>
      <QueryDegradation errors={data.errors} />

      <div data-tour="attention">
        <AttentionRow items={attention} />
      </div>

      <SectionHeader>Usuários</SectionHeader>
      <div data-tour="users-metrics" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total de usuários" value={formatNumber(data.users.total)} />
        <StatCard label="Novos (7d)" value={formatNumber(data.users.new7d)} tone="ok" />
        <StatCard label="Novos (30d)" value={formatNumber(data.users.new30d)} />
        <StatCard
          label="Ativos (30d)"
          value={formatNumber(data.users.active30d)}
          hint="com usage_events no período"
        />
      </div>

      <SectionHeader>Content Factory</SectionHeader>
      <div data-tour="content-factory" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="NEWS geradas hoje" value={formatNumber(production.today)} />
        <StatCard label="NEWS geradas no mês" value={formatNumber(production.month)} />
        <StatCard
          label="Auto-publicadas no mês"
          value={formatNumber(production.autoPublishedMonth)}
        />
        <StatCard
          label="Fila de duplicados"
          value={formatNumber(production.possibleDuplicates)}
          tone={production.possibleDuplicates > 0 ? "warn" : "default"}
        />
      </div>
      <div data-tour="cost" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Custo IA hoje" value={formatUsd(costs.totals.costToday)} />
        <StatCard label="Custo IA no mês" value={formatUsd(costs.totals.costMonth)} />
        <StatCard
          label="Custo médio por NEWS"
          value={
            costs.newsAttributionActive
              ? formatUsd(
                  costs.byNews.reduce((sum, b) => sum + b.costUsd, 0) /
                    costs.byNews.length,
                )
              : "aguardando dados"
          }
          hint={
            costs.newsAttributionActive
              ? "exato · via atribuição em ai_logs"
              : "atribuição ativa a partir das próximas gerações"
          }
        />
        <StatCard
          label="Custo médio por usuário"
          value={formatUsd(
            costs.byUser.length ? costs.totals.costSample / costs.byUser.length : 0,
          )}
          hint={`${formatNumber(costs.byUser.length)} usuários com uso de IA`}
        />
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/production"
          data-tour="produzir"
          className="rounded-lg bg-brand px-3 py-1.5 font-semibold text-white hover:bg-brand-strong"
        >
          Produzir NEWS
        </Link>
        <Link href="/production/queue" className="rounded-lg border border-line px-3 py-1.5 hover:border-accent">
          Fila de Produção
        </Link>
        <Link href="/production/daily" className="rounded-lg border border-line px-3 py-1.5 hover:border-accent">
          Produção Diária
        </Link>
        <Link href="/production/costs" className="rounded-lg border border-line px-3 py-1.5 hover:border-accent">
          Custos de IA
        </Link>
      </div>

      <SectionHeader>Editorial</SectionHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="NEWS publicadas" value={formatNumber(data.news.published)} tone="ok" />
        <StatCard label="NEWS geradas" value={formatNumber(data.news.generated)} />
        <StatCard
          label="Possíveis duplicadas"
          value={formatNumber(data.news.possibleDuplicates)}
          tone={data.news.possibleDuplicates > 0 ? "warn" : "default"}
          hint="fila em /duplicates"
        />
        <StatCard
          label="Precisam de revisão"
          value={formatNumber(data.news.needsReview)}
          tone={data.news.needsReview > 0 ? "warn" : "default"}
        />
      </div>

      {/* Seções secundárias recolhidas — a dobra fica no essencial */}
      <div data-tour="collapsibles" className="space-y-6">
      <Collapsible title="Origem do conteúdo" hint="de onde vêm as NEWS">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Enviados por usuários"
            value={formatNumber(data.news.byOrigin.userUpload)}
          />
          <StatCard
            label="Time automatizado"
            value={formatNumber(data.news.byOrigin.teamAutomated)}
          />
          <StatCard label="Manuais" value={formatNumber(data.news.byOrigin.teamManual)} />
          <StatCard label="Posts legados" value={formatNumber(data.legacyTotal)} />
        </div>
      </Collapsible>

      <Collapsible title="Produto & IA" hint="uso de E2A/Studio, limites e IA">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="E2A usados"
            value={formatNumber(data.usage.e2aUsed)}
            hint="event = e2a_used"
          />
          <StatCard
            label="Content Studio usados"
            value={formatNumber(data.usage.studioUsed)}
            hint="event = studio_used"
          />
          <StatCard
            label="Limites Free atingidos"
            value={formatNumber(limitsTotal)}
            tone={limitsTotal > 0 ? "warn" : "default"}
            hint={`news ${data.usage.limitsHit.news} · e2a ${data.usage.limitsHit.e2a} · studio ${data.usage.limitsHit.studio}`}
          />
          <StatCard
            label="Custo estimado de IA"
            value={formatUsd(data.ai.costUsd)}
            hint={`${formatNumber(data.ai.calls)} chamadas (amostra)`}
          />
          <StatCard
            label="Erros de IA"
            value={formatNumber(data.ai.errors)}
            tone={data.ai.errors > 0 ? "danger" : "ok"}
          />
          <StatCard
            label="Failovers de IA"
            value={formatNumber(data.ai.fallbacks)}
            tone={data.ai.fallbacks > 0 ? "warn" : "default"}
          />
        </div>
      </Collapsible>

      <Collapsible title="Rankings e demanda × produção" hint="top áreas, tags, perfis">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card title="Produção Science Play × demanda dos usuários">
            <BarList
              items={[
                { name: "Time (automatizado + manual)", count: data.demandVsProduction.team },
                { name: "Enviado por usuários", count: data.demandVsProduction.userUpload },
              ]}
            />
          </Card>
          <Card title="Top áreas produzidas" subtitle="NEWS do time, por área">
            <BarList items={data.tops.areasProduced} emptyMessage="Sem dados de área." />
          </Card>
          <Card title="Top áreas enviadas por usuários">
            <BarList items={data.tops.areasSubmitted} emptyMessage="Sem dados de área." />
          </Card>
          <Card title="Top tags">
            <BarList items={data.tops.tags} />
          </Card>
          <Card title="Top profissões" subtitle="perfil dos usuários">
            <BarList items={data.tops.professions} />
          </Card>
          <Card title="Top formatos do Content Studio" subtitle="meta.format de studio_used">
            <BarList items={data.tops.formats} />
          </Card>
          <Card title="Top usuários mais ativos" subtitle="por usage_events">
            <BarList items={data.tops.activeUsers} />
          </Card>
        </div>
      </Collapsible>
      </div>

      <GuidedTour screen="Visão geral" sections={TOURS["Visão geral"]} />
    </>
  );
}
