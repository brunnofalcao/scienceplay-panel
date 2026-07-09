import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { fetchTaxonomies } from "@/lib/admin/queries";
import { getPanelDb } from "@/lib/db/panel";
import { formatNumber, pickString } from "@/lib/formatters";
import { TaxonomyCreator } from "@/components/admin/TaxonomyCreator";
import { Card } from "@/components/ui/Card";
import { NotConfigured, ServiceRoleMissing } from "@/components/ui/NotConfigured";
import { QueryDegradation } from "@/components/ui/QueryDegradation";

export const metadata: Metadata = { title: "Taxonomias" };

const LABELS: Record<string, string> = {
  professions: "Profissões",
  specialties: "Especialidades",
  categories: "Categorias (áreas)",
  tags: "Tags",
};

export default async function TaxonomiesPage() {
  const guard = await requireAdmin();
  if (!guard.configured) return <NotConfigured />;
  const panel = await getPanelDb();
  if (!panel) return <NotConfigured />;

  const { taxonomies, errors } = await fetchTaxonomies(panel.db);

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Taxonomias</h1>
        {!panel.serviceRole ? <ServiceRoleMissing /> : null}
      </div>
      <p className="text-sm text-muted">
        Criação gera <code className="font-mono">admin_audit_logs</code>.
        Arquivamento/remoção em massa não está habilitado nesta fase.
      </p>
      <QueryDegradation errors={errors} />

      <div className="grid gap-4 md:grid-cols-2">
        {taxonomies.map(({ table, rows }) => (
          <Card
            key={table}
            title={LABELS[table] ?? table}
            subtitle={`${table} · ${formatNumber(rows.length)} item(ns)`}
          >
            <TaxonomyCreator table={table} />
            {rows.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Nenhum item.</p>
            ) : (
              <ul className="mt-3 flex max-h-72 flex-wrap gap-1.5 overflow-y-auto">
                {rows.map((row) => (
                  <li
                    key={String(row.id)}
                    className="rounded-full border border-line bg-panel-2 px-2.5 py-0.5 text-xs"
                    title={pickString(row, ["slug"]) ?? undefined}
                  >
                    {pickString(row, ["name", "title", "label"]) ?? String(row.id)}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
