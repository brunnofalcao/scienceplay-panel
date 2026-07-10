import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import {
  fetchEditorialQueue,
  fetchSourceCandidates,
} from "@/lib/admin/production";
import { getPanelDb } from "@/lib/db/panel";
import { formatDateTime, formatNumber, pickString, truncate } from "@/lib/formatters";
import { NewsActions } from "@/components/admin/NewsActions";
import { Table, Td } from "@/components/tables/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotConfigured } from "@/components/ui/NotConfigured";
import { QueryDegradation } from "@/components/ui/QueryDegradation";
import { GuidedTour } from "@/components/ui/GuidedTour";
import { TOURS } from "@/lib/tours";

export const metadata: Metadata = { title: "Fila de Produção" };

export default async function ProductionQueuePage() {
  const guard = await requireAdmin();
  if (!guard.configured) return <NotConfigured />;
  const panel = await getPanelDb();
  if (!panel) return <NotConfigured />;

  const [queue, candidates] = await Promise.all([
    fetchEditorialQueue(panel.db),
    fetchSourceCandidates(panel.db),
  ]);

  return (
    <>
      <h1 className="text-lg font-semibold">Fila de Produção</h1>
      <p className="text-sm text-muted">
        Candidatos capturados e NEWS em estados não-finais, prontos para ação
        editorial.
      </p>
      <QueryDegradation errors={queue.errors} />

      <Card
        tourAnchor="queue-candidates"
        title="Candidatos capturados (source_candidates)"
        subtitle="alimentada pela captura de estudos"
      >
        {!candidates.available ? (
          <div className="space-y-2 text-sm">
            <p className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-warn">
              A tabela <code className="font-mono">source_candidates</code> ainda
              não existe no schema. Migration aditiva proposta em{" "}
              <code className="font-mono">db/migrations/proposed/</code> —
              aplicar via repo SITE (dono do schema). Nenhum dado é simulado.
            </p>
            <p className="text-muted">
              Quando a migration for aplicada e a captura estiver ligada, esta
              fila lista automaticamente: título, fonte, DOI/PMID, periódico,
              ano, área, grau estimado, status e duplicidade.
            </p>
          </div>
        ) : candidates.rows.length === 0 ? (
          <EmptyState message="Nenhum candidato capturado ainda — use a captura em /production." />
        ) : (
          <Table head={["Título", "Fonte", "DOI/PMID", "Ano", "Área", "Grau est.", "Status", "Capturado em"]}>
            {candidates.rows.map((row) => (
              <tr key={String(row.id)} className="hover:bg-panel-2">
                <Td className="max-w-80">{truncate(pickString(row, ["title"]) ?? "—", 90)}</Td>
                <Td className="font-mono text-xs">{pickString(row, ["source", "kind"]) ?? "—"}</Td>
                <Td className="max-w-40 truncate font-mono text-xs">
                  {pickString(row, ["doi"]) ?? pickString(row, ["pmid"]) ?? "—"}
                </Td>
                <Td className="font-mono text-xs">{pickString(row, ["year"]) ?? "—"}</Td>
                <Td className="text-xs">{pickString(row, ["area"]) ?? "—"}</Td>
                <Td className="font-mono text-xs">{pickString(row, ["evidence_grade_estimated"]) ?? "—"}</Td>
                <Td><StatusBadge status={pickString(row, ["status"]) ?? "—"} /></Td>
                <Td className="whitespace-nowrap text-xs text-muted">
                  {formatDateTime(pickString(row, ["captured_at", "created_at"]))}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card
        tourAnchor="queue-editorial"
        title={`Fila editorial (${formatNumber(queue.items.length)})`}
        subtitle="NEWS em generated / needs_review / possible_duplicate / draft — ações reais, auditadas"
      >
        {queue.items.length === 0 ? (
          <EmptyState message="Fila vazia — nenhuma NEWS aguardando decisão editorial." />
        ) : (
          <Table
            head={["Título", "Status", "Origem", "GRADE", "DOI/PMID", "Duplicidade", "Data", "Ações"]}
          >
            {queue.items.map((item) => (
              <tr key={item.id} className="hover:bg-panel-2">
                <Td className="max-w-72">
                  <Link href={`/news/${item.id}`} className="text-accent hover:underline">
                    {truncate(item.title, 80)}
                  </Link>
                </Td>
                <Td><StatusBadge status={item.status} /></Td>
                <Td className="font-mono text-xs">{item.origin}</Td>
                <Td className="font-mono text-xs">{item.grade}</Td>
                <Td className="max-w-40 truncate font-mono text-xs">{item.doiOrPmid}</Td>
                <Td className="text-xs text-muted">
                  {item.duplicateScore !== null ? `score ${item.duplicateScore}` : "—"}
                </Td>
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
      </Card>
      <GuidedTour screen="Fila de Produção" sections={TOURS["Fila de Produção"]} />
    </>
  );
}
