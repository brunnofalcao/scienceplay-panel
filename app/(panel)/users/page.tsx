import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { getUsersWithStats, type UserWithStats } from "@/lib/admin/user-stats";
import { getPanelDb } from "@/lib/db/panel";
import { formatDateTime, formatNumber } from "@/lib/formatters";
import { Table, Td } from "@/components/tables/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotConfigured } from "@/components/ui/NotConfigured";
import { QueryDegradation } from "@/components/ui/QueryDegradation";
import { GuidedTour } from "@/components/ui/GuidedTour";
import { TOURS } from "@/lib/tours";

export const metadata: Metadata = { title: "Usuários" };

type SearchParams = Record<string, string | string[] | undefined>;

const param = (sp: SearchParams, key: string): string => {
  const v = sp[key];
  return typeof v === "string" ? v.trim() : "";
};

const SORTS = [
  { value: "active", label: "Mais ativos" },
  { value: "recent", label: "Mais recentes" },
  { value: "news", label: "Mais NEWS enviadas" },
  { value: "e2a", label: "Mais E2A" },
  { value: "studio", label: "Mais Studio" },
  { value: "limits", label: "Mais limites atingidos" },
] as const;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const guard = await requireAdmin();
  if (!guard.configured) return <NotConfigured />;
  const panel = await getPanelDb();
  if (!panel) return <NotConfigured />;

  const sp = await searchParams;
  const q = param(sp, "q").toLowerCase();
  const profession = param(sp, "profession");
  const specialty = param(sp, "specialty");
  const plan = param(sp, "plan");
  const role = param(sp, "role");
  const activity = param(sp, "activity");
  const sort = param(sp, "sort") || "active";

  const { rows, maps, errors } = await getUsersWithStats(panel.db);

  let filtered = rows;
  if (q) {
    filtered = filtered.filter(
      (r) =>
        r.user.name.toLowerCase().includes(q) ||
        r.user.email.toLowerCase().includes(q),
    );
  }
  if (profession) filtered = filtered.filter((r) => r.user.profession === profession);
  if (specialty) filtered = filtered.filter((r) => r.user.specialty === specialty);
  if (plan) filtered = filtered.filter((r) => r.user.plan === plan);
  if (role) filtered = filtered.filter((r) => r.user.role === role);
  if (activity === "active") filtered = filtered.filter((r) => r.stats.eventsTotal > 0);
  if (activity === "inactive") filtered = filtered.filter((r) => r.stats.eventsTotal === 0);

  const sorters: Record<string, (a: UserWithStats, b: UserWithStats) => number> = {
    active: (a, b) => b.stats.eventsTotal - a.stats.eventsTotal,
    recent: (a, b) => (b.user.createdAt ?? "").localeCompare(a.user.createdAt ?? ""),
    news: (a, b) => b.stats.newsSubmitted - a.stats.newsSubmitted,
    e2a: (a, b) => b.stats.e2aUsed - a.stats.e2aUsed,
    studio: (a, b) => b.stats.studioUsed - a.stats.studioUsed,
    limits: (a, b) => b.stats.limitsHit - a.stats.limitsHit,
  };
  filtered = [...filtered].sort(sorters[sort] ?? sorters.active);

  const options = (values: string[]) =>
    [...new Set(values.filter((v) => v && v !== "—"))].sort();

  return (
    <>
      <h1 className="text-lg font-semibold">
        Usuários{" "}
        <span className="text-sm font-normal text-muted">
          ({formatNumber(filtered.length)} de {formatNumber(rows.length)})
        </span>
      </h1>
      <QueryDegradation errors={errors} />

      <form data-tour="users-filters" method="get" className="flex flex-wrap items-end gap-2 text-sm">
        <input
          name="q"
          defaultValue={param(sp, "q")}
          placeholder="Buscar nome ou e-mail…"
          className="w-56 rounded-lg border border-line bg-panel-2 px-3 py-1.5 outline-none focus:border-accent"
        />
        {(
          [
            ["profession", "Profissão", options([...maps.professions.values()])],
            ["specialty", "Especialidade", options([...maps.specialties.values()])],
            ["plan", "Plano", options([...maps.plans.values()])],
            ["role", "Role", ["user", "editor", "admin"]],
          ] as const
        ).map(([name, label, values]) => (
          <select
            key={name}
            name={name}
            defaultValue={param(sp, name)}
            className="rounded-lg border border-line bg-panel-2 px-2 py-1.5 outline-none focus:border-accent"
          >
            <option value="">{label}: todas</option>
            {values.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        ))}
        <select
          name="activity"
          defaultValue={activity}
          className="rounded-lg border border-line bg-panel-2 px-2 py-1.5 outline-none focus:border-accent"
        >
          <option value="">Atividade: todas</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
        <select
          name="sort"
          defaultValue={sort}
          className="rounded-lg border border-line bg-panel-2 px-2 py-1.5 outline-none focus:border-accent"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              Ordenar: {s.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg border border-accent/60 px-3 py-1.5 text-xs text-accent hover:bg-accent/10"
        >
          Filtrar
        </button>
      </form>

      {filtered.length === 0 ? (
        <EmptyState message="Nenhum usuário encontrado com estes filtros." />
      ) : (
        <div data-tour="users-table">
        <Table
          head={[
            "Usuário",
            "Profissão",
            "Plano",
            "Role",
            "Cadastro",
            "Última atividade",
            "NEWS enviadas",
            "NEWS salvas",
            "E2A",
            "Studio",
            "Limites",
          ]}
        >
          {filtered.slice(0, 200).map(({ user, stats }) => (
            <tr key={user.id} className="hover:bg-panel-2">
              <Td>
                <Link href={`/users/${user.id}`} className="text-accent hover:underline">
                  {user.name}
                </Link>
                <p className="text-xs text-muted">{user.email}</p>
              </Td>
              <Td>
                {user.profession}
                {user.specialty !== "—" ? (
                  <p className="text-xs text-muted">{user.specialty}</p>
                ) : null}
              </Td>
              <Td>{user.plan}</Td>
              <Td className="font-mono text-xs">{user.role}</Td>
              <Td className="text-xs text-muted">{formatDateTime(user.createdAt)}</Td>
              <Td className="text-xs text-muted">{formatDateTime(stats.lastActivity)}</Td>
              <Td className="tabular-nums">{stats.newsSubmitted}</Td>
              <Td className="tabular-nums">{stats.newsSaved}</Td>
              <Td className="tabular-nums">{stats.e2aUsed}</Td>
              <Td className="tabular-nums">{stats.studioUsed}</Td>
              <Td className={`tabular-nums ${stats.limitsHit > 0 ? "text-warn" : ""}`}>
                {stats.limitsHit}
              </Td>
            </tr>
          ))}
        </Table>
        </div>
      )}
      <GuidedTour screen="Usuários" sections={TOURS["Usuários"]} />
    </>
  );
}
