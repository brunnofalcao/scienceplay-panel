import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/guard";
import { fetchUserDetail } from "@/lib/admin/user-detail";
import { getPanelDb } from "@/lib/db/panel";
import { formatDateTime, formatNumber } from "@/lib/formatters";
import { BarList } from "@/components/charts/BarList";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, StatCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotConfigured } from "@/components/ui/NotConfigured";
import { QueryDegradation } from "@/components/ui/QueryDegradation";

export const metadata: Metadata = { title: "Usuário" };

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const guard = await requireAdmin();
  if (!guard.configured) return <NotConfigured />;
  const panel = await getPanelDb();
  if (!panel) return <NotConfigured />;

  const { id } = await params;
  const detail = await fetchUserDetail(panel.db, id);
  if (!detail) notFound();

  const { user, stats, signals, submittedItems, consumption, e2a, studio, timeline } =
    detail;

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <Link href="/users" className="text-xs text-muted hover:text-accent">
            ← Usuários
          </Link>
          <h1 className="text-lg font-semibold">{user.name}</h1>
          <p className="text-sm text-muted">
            {user.email} · {user.profession}
            {user.specialty !== "—" ? ` / ${user.specialty}` : ""} · plano{" "}
            {user.plan} · role <span className="font-mono">{user.role}</span> ·
            cadastro {formatDateTime(user.createdAt)}
          </p>
        </div>
      </div>
      <QueryDegradation errors={detail.errors} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Eventos" value={formatNumber(stats.eventsTotal)} />
        <StatCard label="NEWS enviadas" value={formatNumber(stats.newsSubmitted)} />
        <StatCard label="NEWS salvas" value={formatNumber(stats.newsSaved)} />
        <StatCard label="E2A usados" value={formatNumber(stats.e2aUsed)} />
        <StatCard label="Studio usados" value={formatNumber(stats.studioUsed)} />
        <StatCard
          label="Limites atingidos"
          value={formatNumber(stats.limitsHit)}
          tone={stats.limitsHit > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Duplicados"
          value={formatNumber(stats.possibleDuplicates)}
          tone={stats.possibleDuplicates > 0 ? "warn" : "default"}
        />
      </div>

      <Card
        title="Sinais de intenção"
        subtitle="inteligência comercial — somente leitura, nenhuma mensagem é enviada"
      >
        {signals.length === 0 ? (
          <p className="text-sm text-muted">Sem sinais registrados.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {signals.map((signal) => (
              <li
                key={signal.label}
                className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2"
              >
                <p className="text-sm font-medium text-accent">{signal.label}</p>
                <p className="text-xs text-muted">{signal.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Consumo" subtitle="biblioteca pessoal (saved_news)">
          {consumption.savedItems.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma NEWS salva.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {consumption.savedItems.slice(0, 10).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <Link
                    href={`/news/${item.id}`}
                    className="truncate text-accent hover:underline"
                  >
                    {item.title}
                  </Link>
                  <StatusBadge status={item.status} />
                </li>
              ))}
            </ul>
          )}
          {consumption.topTags.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-xs text-muted">Tags mais consumidas</p>
              <BarList items={consumption.topTags} />
            </div>
          ) : null}
        </Card>

        <Card title="Produção" subtitle="artigos enviados pelo usuário">
          {submittedItems.length === 0 ? (
            <p className="text-sm text-muted">Nenhum envio.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {submittedItems.slice(0, 15).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <Link
                    href={`/news/${item.id}`}
                    className="truncate text-accent hover:underline"
                  >
                    {item.title}
                  </Link>
                  <span className="flex items-center gap-1.5">
                    {item.autoPublished ? (
                      <span className="font-mono text-[11px] text-ok">auto</span>
                    ) : null}
                    <StatusBadge status={item.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Evidence-to-Action" subtitle="event = e2a_used">
          <p className="text-sm">
            {formatNumber(e2a.total)} uso(s) ·{" "}
            <span className={e2a.limits > 0 ? "text-warn" : "text-muted"}>
              {formatNumber(e2a.limits)} limite(s) atingido(s)
            </span>
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs text-muted">Profissões escolhidas</p>
              <BarList items={e2a.professions} emptyMessage="Sem dados." />
            </div>
            <div>
              <p className="mb-2 text-xs text-muted">Contextos escolhidos</p>
              <BarList items={e2a.contexts} emptyMessage="Sem dados." />
            </div>
          </div>
          {e2a.topNews.length > 0 ? (
            <div className="mt-3">
              <p className="mb-2 text-xs text-muted">NEWS mais usadas no E2A</p>
              <ul className="space-y-1 text-xs">
                {e2a.topNews.map((n) => (
                  <li key={n.name}>
                    <Link href={`/news/${n.name}`} className="text-accent hover:underline">
                      {n.name}
                    </Link>{" "}
                    <span className="text-muted">×{n.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>

        <Card title="Content Studio" subtitle="event = studio_used">
          <p className="text-sm">
            {formatNumber(studio.total)} geração(ões) ·{" "}
            <span className={studio.limits > 0 ? "text-warn" : "text-muted"}>
              {formatNumber(studio.limits)} limite(s) atingido(s)
            </span>
          </p>
          <div className="mt-3">
            <p className="mb-2 text-xs text-muted">Formatos mais usados</p>
            <BarList
              items={
                studio.formats.length > 0 ? studio.formats : studio.generationFormats
              }
              emptyMessage="Sem dados."
            />
          </div>
        </Card>
      </div>

      <Card title="Timeline" subtitle="últimos 100 eventos (usage_events)">
        {timeline.length === 0 ? (
          <EmptyState message="Nenhum evento registrado." />
        ) : (
          <ul className="space-y-1 text-sm">
            {timeline.map((event, index) => (
              <li
                key={`${event.created_at}-${index}`}
                className="flex items-baseline gap-3 border-b border-line/50 py-1 last:border-0"
              >
                <span className="w-32 shrink-0 font-mono text-xs text-muted">
                  {formatDateTime(event.created_at)}
                </span>
                <span className="font-mono text-xs text-accent">{event.event}</span>
                {event.meta ? (
                  <span className="truncate text-xs text-muted">
                    {JSON.stringify(event.meta)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
