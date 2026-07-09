import { requireAdmin } from "@/lib/admin/guard";
import { getDashboardData } from "@/lib/admin/queries";
import { getPanelDb } from "@/lib/db/panel";
import { formatNumber, formatUsd } from "@/lib/formatters";
import { BarList } from "@/components/charts/BarList";
import { Card, StatCard } from "@/components/ui/Card";
import { NotConfigured, ServiceRoleMissing } from "@/components/ui/NotConfigured";
import { QueryDegradation } from "@/components/ui/QueryDegradation";

export default async function DashboardPage() {
  const guard = await requireAdmin();
  if (!guard.configured) return <NotConfigured />;

  const panel = await getPanelDb();
  if (!panel) return <NotConfigured />;

  const data = await getDashboardData(panel.db);
  const limitsTotal =
    data.usage.limitsHit.news + data.usage.limitsHit.e2a + data.usage.limitsHit.studio;

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Command Center</h1>
        {!panel.serviceRole ? <ServiceRoleMissing /> : null}
      </div>
      <QueryDegradation errors={data.errors} />

      <h2 className="pt-2 text-xs uppercase tracking-widest text-muted">Usuários</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total de usuários" value={formatNumber(data.users.total)} />
        <StatCard label="Novos (7d)" value={formatNumber(data.users.new7d)} tone="ok" />
        <StatCard label="Novos (30d)" value={formatNumber(data.users.new30d)} />
        <StatCard
          label="Ativos (30d)"
          value={formatNumber(data.users.active30d)}
          hint="com usage_events no período"
        />
      </div>

      <h2 className="pt-2 text-xs uppercase tracking-widest text-muted">Editorial</h2>
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

      <h2 className="pt-2 text-xs uppercase tracking-widest text-muted">
        Origem do conteúdo
      </h2>
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

      <h2 className="pt-2 text-xs uppercase tracking-widest text-muted">
        Produto &amp; IA
      </h2>
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
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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

      <div className="grid gap-4 pt-2 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Produção Science Play × demanda dos usuários">
          <BarList
            items={[
              { name: "Time (automatizado + manual)", count: data.demandVsProduction.team },
              { name: "Enviado por usuários", count: data.demandVsProduction.userUpload },
            ]}
          />
        </Card>
        <Card title="Top áreas produzidas" subtitle="NEWS do time, por área">
          <BarList items={data.tops.areasProduced} emptyMessage="Sem dados de área (validar schema)." />
        </Card>
        <Card title="Top áreas enviadas por usuários">
          <BarList items={data.tops.areasSubmitted} emptyMessage="Sem dados de área (validar schema)." />
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
    </>
  );
}
