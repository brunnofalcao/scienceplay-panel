import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { fetchNewsList } from "@/lib/admin/queries";
import { getPanelDb } from "@/lib/db/panel";
import { formatDateTime, formatNumber, truncate } from "@/lib/formatters";
import {
  CONTENT_TYPES,
  EDITORIAL_STATUSES,
  EVIDENCE_GRADES,
  ORIGIN_TYPES,
} from "@/types/database";
import { NewsActions } from "@/components/admin/NewsActions";
import { Table, Td } from "@/components/tables/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotConfigured, ServiceRoleMissing } from "@/components/ui/NotConfigured";
import { QueryDegradation } from "@/components/ui/QueryDegradation";

export const metadata: Metadata = { title: "NEWS" };

type SearchParams = Record<string, string | string[] | undefined>;
const param = (sp: SearchParams, key: string): string => {
  const v = sp[key];
  return typeof v === "string" ? v.trim() : "";
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const guard = await requireAdmin();
  if (!guard.configured) return <NotConfigured />;
  const panel = await getPanelDb();
  if (!panel) return <NotConfigured />;

  const sp = await searchParams;
  const { items, errors } = await fetchNewsList(panel.db, {
    q: param(sp, "q") || undefined,
    status: param(sp, "status") || undefined,
    origin: param(sp, "origin") || undefined,
    contentType: param(sp, "type") || undefined,
    grade: param(sp, "grade") || undefined,
    autoPublished: param(sp, "auto") || undefined,
    doi: param(sp, "doi") || undefined,
    pmid: param(sp, "pmid") || undefined,
    from: param(sp, "from") || undefined,
    to: param(sp, "to") || undefined,
    duplicatesOnly: param(sp, "dup") === "true",
  });

  const selectClass =
    "rounded-lg border border-line bg-panel-2 px-2 py-1.5 outline-none focus:border-accent";

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">
          NEWS{" "}
          <span className="text-sm font-normal text-muted">
            ({formatNumber(items.length)} exibidas, máx. 100)
          </span>
        </h1>
        {!panel.serviceRole ? <ServiceRoleMissing /> : null}
      </div>
      <QueryDegradation errors={errors} />

      <form method="get" className="flex flex-wrap items-end gap-2 text-sm">
        <input
          name="q"
          defaultValue={param(sp, "q")}
          placeholder="Buscar título…"
          className="w-52 rounded-lg border border-line bg-panel-2 px-3 py-1.5 outline-none focus:border-accent"
        />
        <select name="status" defaultValue={param(sp, "status")} className={selectClass}>
          <option value="">Status: todos</option>
          {EDITORIAL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="origin" defaultValue={param(sp, "origin")} className={selectClass}>
          <option value="">Origem: todas</option>
          {ORIGIN_TYPES.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <select name="type" defaultValue={param(sp, "type")} className={selectClass}>
          <option value="">Tipo: todos</option>
          {CONTENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select name="grade" defaultValue={param(sp, "grade")} className={selectClass}>
          <option value="">GRADE: todos</option>
          {EVIDENCE_GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select name="auto" defaultValue={param(sp, "auto")} className={selectClass}>
          <option value="">Auto-publicado: todos</option>
          <option value="true">sim</option>
          <option value="false">não</option>
        </select>
        <input
          name="doi"
          defaultValue={param(sp, "doi")}
          placeholder="DOI"
          className="w-32 rounded-lg border border-line bg-panel-2 px-3 py-1.5 outline-none focus:border-accent"
        />
        <input
          name="pmid"
          defaultValue={param(sp, "pmid")}
          placeholder="PMID"
          className="w-28 rounded-lg border border-line bg-panel-2 px-3 py-1.5 outline-none focus:border-accent"
        />
        <input
          type="date"
          name="from"
          defaultValue={param(sp, "from")}
          className={selectClass}
        />
        <input type="date" name="to" defaultValue={param(sp, "to")} className={selectClass} />
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" name="dup" value="true" defaultChecked={param(sp, "dup") === "true"} />
          só duplicidade
        </label>
        <button
          type="submit"
          className="rounded-lg border border-accent/60 px-3 py-1.5 text-xs text-accent hover:bg-accent/10"
        >
          Filtrar
        </button>
      </form>

      {items.length === 0 ? (
        <EmptyState message="Nenhuma NEWS encontrada com estes filtros." />
      ) : (
        <Table
          head={[
            "Título",
            "Status",
            "Origem",
            "Tipo",
            "GRADE",
            "DOI/PMID",
            "Usuário/origem",
            "Auto",
            "Data",
            "Ações",
          ]}
        >
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-panel-2">
              <Td className="max-w-72">
                <Link href={`/news/${item.id}`} className="text-accent hover:underline">
                  {truncate(item.title, 80)}
                </Link>
              </Td>
              <Td>
                <StatusBadge status={item.status} />
              </Td>
              <Td className="font-mono text-xs">{item.origin}</Td>
              <Td className="font-mono text-xs">{item.contentType}</Td>
              <Td className="font-mono text-xs">{item.grade}</Td>
              <Td className="max-w-40 truncate font-mono text-xs">{item.doiOrPmid}</Td>
              <Td className="max-w-44 truncate text-xs">{item.creator}</Td>
              <Td className="text-xs">{item.autoPublished ? "sim" : "—"}</Td>
              <Td className="whitespace-nowrap text-xs text-muted">
                {formatDateTime(item.createdAt)}
              </Td>
              <Td>
                <NewsActions newsId={item.id} compact />
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
