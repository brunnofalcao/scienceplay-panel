import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/guard";
import { fetchNewsDetail, mapAiLog } from "@/lib/admin/queries";
import { getPanelDb } from "@/lib/db/panel";
import {
  formatDateTime,
  formatMs,
  pickNumber,
  pickString,
} from "@/lib/formatters";
import { getPublicSiteUrl } from "@/lib/supabase/env";
import { EditNewsMetaForm } from "@/components/admin/EditNewsMetaForm";
import { NewsActions } from "@/components/admin/NewsActions";
import { Table, Td } from "@/components/tables/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card } from "@/components/ui/Card";
import { NotConfigured, ServiceRoleMissing } from "@/components/ui/NotConfigured";
import { QueryDegradation } from "@/components/ui/QueryDegradation";

export const metadata: Metadata = { title: "NEWS" };

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const guard = await requireAdmin();
  if (!guard.configured) return <NotConfigured />;
  const panel = await getPanelDb();
  if (!panel) return <NotConfigured />;

  const { id } = await params;
  const detail = await fetchNewsDetail(panel.db, id);
  if (!detail.news || !detail.item) notFound();

  const { news, item, i18nRows, source, aiLogs, usageEvents, auditLogs, errors } =
    detail;

  const i18n =
    i18nRows.find((r) => r.locale === "pt") ?? i18nRows[0] ?? null;
  const isPublished = item.status === "published";
  const publicUrl =
    isPublished && item.slug ? `${getPublicSiteUrl()}/news/${item.slug}` : null;

  return (
    <>
      <div>
        <Link href="/news" className="text-xs text-muted hover:text-accent">
          ← NEWS
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold">{item.title}</h1>
          <StatusBadge status={item.status} />
          {item.autoPublished ? (
            <span className="font-mono text-xs text-ok">auto-publicado</span>
          ) : null}
        </div>
        <p className="text-sm text-muted">
          {item.origin} · {item.contentType} · GRADE {item.grade} · criada{" "}
          {formatDateTime(item.createdAt)}
          {news.published_at
            ? ` · publicada ${formatDateTime(news.published_at)}`
            : ""}
          {item.creator !== "—" ? ` · envio de ${item.creator}` : ""}
        </p>
        {publicUrl ? (
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-accent hover:underline"
          >
            Ver no site público ↗
          </a>
        ) : null}
      </div>
      <QueryDegradation errors={errors} />

      <div className="flex items-start justify-between gap-4">
        <Card title="Ações editoriais" className="flex-1">
          <NewsActions newsId={item.id} />
        </Card>
        {!panel.serviceRole ? <ServiceRoleMissing /> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Conteúdo">
          <div className="space-y-3">
            <Field
              label="Bottom line"
              value={i18n ? pickString(i18n, ["bottom_line"]) : null}
            />
            <Field
              label="O que não afirmar (do_not_claim)"
              value={pickString(news, ["do_not_claim"])}
            />
            <Field
              label="Justificativa do GRADE"
              value={pickString(news, ["evidence_grade_rationale"])}
            />
            <Field
              label="Limitações"
              value={pickString(news, ["limitations", "limitations_text"])}
            />
          </div>
        </Card>

        <Card title="Fonte">
          {source ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo" value={pickString(source, ["kind"])} />
              <Field label="DOI" value={pickString(source, ["doi"])} />
              <Field label="PMID" value={pickString(source, ["pmid"])} />
              <Field
                label="Periódico"
                value={pickString(source, ["journal", "journal_name", "container_title"])}
              />
              <Field
                label="Ano"
                value={
                  pickNumber(source, ["year", "publication_year"])?.toString() ?? null
                }
              />
              <Field
                label="Autores"
                value={pickString(source, ["authors", "author_list"])}
              />
              <Field label="URL" value={pickString(source, ["url"])} />
              <Field label="content_key" value={pickString(source, ["content_key"])} />
            </div>
          ) : (
            <p className="text-sm text-muted">Sem fonte vinculada.</p>
          )}
        </Card>

        <Card title="Editar metadados" subtitle="grava em admin_audit_logs">
          <EditNewsMetaForm
            newsId={item.id}
            locale={typeof i18n?.locale === "string" ? i18n.locale : "pt"}
            currentTitle={item.title === "(sem título)" ? "" : item.title}
            currentMetaDescription={
              i18n ? (pickString(i18n, ["meta_description"]) ?? "") : ""
            }
          />
        </Card>

        <Card title="Duplicidade">
          {item.duplicateOf || item.duplicateScore !== null ? (
            <div className="space-y-2 text-sm">
              {item.duplicateOf ? (
                <p>
                  Possível duplicata de{" "}
                  <Link
                    href={`/news/${item.duplicateOf}`}
                    className="font-mono text-accent hover:underline"
                  >
                    {item.duplicateOf}
                  </Link>
                </p>
              ) : null}
              <p className="text-muted">
                score: {item.duplicateScore ?? "—"} · motivo:{" "}
                {item.duplicateReason ?? "—"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted">Sem sinal de duplicidade.</p>
          )}
        </Card>
      </div>

      <Card title="AI Logs relacionados" subtitle="sem prompt bruto, sem chaves">
        {aiLogs.length === 0 ? (
          <p className="text-sm text-muted">Nenhum log de IA vinculado.</p>
        ) : (
          <Table head={["Data", "Feature", "Provider", "Modelo", "Status", "Latência"]}>
            {aiLogs.map(mapAiLog).map((log, index) => (
              <tr key={index}>
                <Td className="whitespace-nowrap text-xs text-muted">
                  {formatDateTime(log.createdAt)}
                </Td>
                <Td className="font-mono text-xs">{log.feature}</Td>
                <Td className="font-mono text-xs">{log.provider}</Td>
                <Td className="font-mono text-xs">{log.model}</Td>
                <Td className="font-mono text-xs">{log.status}</Td>
                <Td className="font-mono text-xs">{formatMs(log.latencyMs)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card title="Usage events relacionados">
        {usageEvents.length === 0 ? (
          <p className="text-sm text-muted">Nenhum evento vinculado.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {usageEvents.map((event, index) => (
              <li key={index} className="flex items-baseline gap-3">
                <span className="w-32 shrink-0 font-mono text-xs text-muted">
                  {formatDateTime(pickString(event, ["created_at"]))}
                </span>
                <span className="font-mono text-xs text-accent">
                  {pickString(event, ["event"]) ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Audit trail" subtitle="admin_audit_logs desta NEWS">
        {auditLogs.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma ação administrativa registrada.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {auditLogs.map((log, index) => (
              <li key={index} className="border-b border-line/50 pb-1.5 last:border-0">
                <span className="font-mono text-xs text-muted">
                  {formatDateTime(pickString(log, ["created_at"]))}
                </span>{" "}
                <span className="font-mono text-xs text-accent">
                  {pickString(log, ["action"]) ?? "—"}
                </span>
                <p className="truncate font-mono text-[11px] text-muted">
                  before: {JSON.stringify(log.before)} → after:{" "}
                  {JSON.stringify(log.after)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
