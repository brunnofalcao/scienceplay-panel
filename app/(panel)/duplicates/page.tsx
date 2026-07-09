import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { fetchDuplicatesQueue } from "@/lib/admin/queries";
import { getPanelDb } from "@/lib/db/panel";
import { formatDateTime, formatNumber } from "@/lib/formatters";
import { DuplicateActions } from "@/components/admin/DuplicateActions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotConfigured, ServiceRoleMissing } from "@/components/ui/NotConfigured";
import { QueryDegradation } from "@/components/ui/QueryDegradation";

export const metadata: Metadata = { title: "Duplicados" };

export default async function DuplicatesPage() {
  const guard = await requireAdmin();
  if (!guard.configured) return <NotConfigured />;
  const panel = await getPanelDb();
  if (!panel) return <NotConfigured />;

  const { queue, errors } = await fetchDuplicatesQueue(panel.db);

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">
          Fila de possíveis duplicados{" "}
          <span className="text-sm font-normal text-muted">
            ({formatNumber(queue.length)})
          </span>
        </h1>
        {!panel.serviceRole ? <ServiceRoleMissing /> : null}
      </div>
      <p className="text-sm text-muted">
        Envios com <code className="font-mono">status = possible_duplicate</code>{" "}
        (similaridade de título via trigram, threshold ~0.6). Duplicatas exatas
        por DOI/PMID/content_key são reusadas automaticamente pelo motor e não
        chegam aqui.
      </p>
      <QueryDegradation errors={errors} />

      {queue.length === 0 ? (
        <EmptyState message="Fila vazia — nenhum possível duplicado pendente." />
      ) : (
        <div className="space-y-4">
          {queue.map(({ item, existing }) => (
            <Card key={item.id}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-warn/30 bg-warn/5 p-3">
                  <p className="text-xs uppercase tracking-wide text-warn">
                    Conteúdo novo
                  </p>
                  <Link
                    href={`/news/${item.id}`}
                    className="mt-1 block text-sm font-medium text-accent hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    {item.doiOrPmid !== "—" ? `${item.doiOrPmid} · ` : ""}
                    envio de {item.creator} · {formatDateTime(item.createdAt)}
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-panel-2 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted">
                    Existente provável
                  </p>
                  {existing ? (
                    <>
                      <Link
                        href={`/news/${existing.id}`}
                        className="mt-1 block text-sm font-medium text-accent hover:underline"
                      >
                        {existing.title}
                      </Link>
                      <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                        <StatusBadge status={existing.status} />
                        {formatDateTime(existing.createdAt)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-muted">
                      duplicate_of não preenchido.
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
                <span>
                  score:{" "}
                  <span className="font-mono text-ink">
                    {item.duplicateScore ?? "—"}
                  </span>
                </span>
                <span>
                  motivo:{" "}
                  <span className="font-mono text-ink">
                    {item.duplicateReason ?? "—"}
                  </span>
                </span>
              </div>
              <div className="mt-3">
                <DuplicateActions newsId={item.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
