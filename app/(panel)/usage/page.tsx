import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { fetchUsageData } from "@/lib/admin/queries";
import { getPanelDb } from "@/lib/db/panel";
import { formatDateTime, formatNumber } from "@/lib/formatters";
import { PLANNED_USAGE_EVENTS, REAL_USAGE_EVENTS } from "@/types/database";
import { BarList } from "@/components/charts/BarList";
import { Table, Td } from "@/components/tables/Table";
import { Card, StatCard } from "@/components/ui/Card";
import { NotConfigured } from "@/components/ui/NotConfigured";
import { QueryDegradation } from "@/components/ui/QueryDegradation";

export const metadata: Metadata = { title: "Usage" };

type SearchParams = Record<string, string | string[] | undefined>;
const param = (sp: SearchParams, key: string): string => {
  const v = sp[key];
  return typeof v === "string" ? v.trim() : "";
};

export default async function UsagePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const guard = await requireAdmin();
  if (!guard.configured) return <NotConfigured />;
  const panel = await getPanelDb();
  if (!panel) return <NotConfigured />;

  const sp = await searchParams;
  const data = await fetchUsageData(panel.db, {
    event: param(sp, "event") || undefined,
    userId: param(sp, "user") || undefined,
    from: param(sp, "from") || undefined,
    to: param(sp, "to") || undefined,
  });

  const selectClass =
    "rounded-lg border border-line bg-panel-2 px-2 py-1.5 outline-none focus:border-accent";

  return (
    <>
      <h1 className="text-lg font-semibold">Usage events</h1>
      <p className="text-sm text-muted">
        Somente eventos REAIS emitidos pelo código hoje. Planejados e ainda NÃO
        emitidos (não aparecem aqui):{" "}
        <span className="font-mono text-xs">{PLANNED_USAGE_EVENTS.join(", ")}</span>.
      </p>
      <QueryDegradation errors={data.errors} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {data.counts.map(({ event, count }) => (
          <StatCard key={event} label={event} value={formatNumber(count)} />
        ))}
      </div>

      <form method="get" className="flex flex-wrap items-end gap-2 text-sm">
        <select name="event" defaultValue={param(sp, "event")} className={selectClass}>
          <option value="">Evento: todos</option>
          {REAL_USAGE_EVENTS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <input
          name="user"
          defaultValue={param(sp, "user")}
          placeholder="user_id"
          className="w-64 rounded-lg border border-line bg-panel-2 px-3 py-1.5 font-mono text-xs outline-none focus:border-accent"
        />
        <input type="date" name="from" defaultValue={param(sp, "from")} className={selectClass} />
        <input type="date" name="to" defaultValue={param(sp, "to")} className={selectClass} />
        <button
          type="submit"
          className="rounded-lg border border-accent/60 px-3 py-1.5 text-xs text-accent hover:bg-accent/10"
        >
          Filtrar
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Eventos por dia" subtitle="últimos 30 dias com dados (na amostra filtrada)">
          <BarList items={data.perDay} />
        </Card>
        <Card title="Eventos por plano">
          <BarList items={data.byPlan} />
        </Card>
        <Card title="Top usuários">
          <BarList items={data.topUsers} />
        </Card>
        <Card title="Top profissões (E2A)">
          <BarList items={data.topProfessions} />
        </Card>
        <Card title="Top formatos (Studio)">
          <BarList items={data.topFormats} />
        </Card>
      </div>

      <Card
        title="Eventos recentes"
        subtitle={`limites atingidos na amostra: ${formatNumber(data.limitsHit)}`}
      >
        {data.recent.length === 0 ? (
          <p className="text-sm text-muted">Nenhum evento.</p>
        ) : (
          <Table head={["Data", "Evento", "Usuário", "Entity", "Meta"]}>
            {data.recent.map((event, index) => (
              <tr key={index}>
                <Td className="whitespace-nowrap font-mono text-xs text-muted">
                  {formatDateTime(event.created_at)}
                </Td>
                <Td className="font-mono text-xs text-accent">{event.event}</Td>
                <Td className="max-w-52 truncate text-xs">
                  {event.user_id
                    ? (data.userById.get(String(event.user_id)) ?? String(event.user_id))
                    : "anônimo"}
                </Td>
                <Td className="max-w-40 truncate font-mono text-[11px] text-muted">
                  {event.entity_id ? String(event.entity_id) : "—"}
                </Td>
                <Td className="max-w-72 truncate font-mono text-[11px] text-muted">
                  {event.meta ? JSON.stringify(event.meta) : "—"}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
