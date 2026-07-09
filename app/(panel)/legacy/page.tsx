import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { fetchLegacyData } from "@/lib/admin/queries";
import { getPanelDb } from "@/lib/db/panel";
import { formatNumber, pickBoolean, pickString, truncate } from "@/lib/formatters";
import { LegacyIndexableToggle } from "@/components/admin/LegacyIndexableToggle";
import { Table, Td } from "@/components/tables/Table";
import { Card, StatCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotConfigured, ServiceRoleMissing } from "@/components/ui/NotConfigured";
import { QueryDegradation } from "@/components/ui/QueryDegradation";

export const metadata: Metadata = { title: "Legacy" };

export default async function LegacyPage() {
  const guard = await requireAdmin();
  if (!guard.configured) return <NotConfigured />;
  const panel = await getPanelDb();
  if (!panel) return <NotConfigured />;

  const data = await fetchLegacyData(panel.db);

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Legacy posts</h1>
        {!panel.serviceRole ? <ServiceRoleMissing /> : null}
      </div>
      <p className="text-sm text-muted">
        Posts legados importados (<code className="font-mono">/post/{"{slug}"}</code>).
        Ação permitida: alternar <code className="font-mono">indexable</code> — sem
        edição de conteúdo em massa.
      </p>
      <QueryDegradation errors={data.errors} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total" value={formatNumber(data.total)} />
        <StatCard label="indexable = true" value={formatNumber(data.indexable)} tone="ok" />
        <StatCard label="indexable = false" value={formatNumber(data.notIndexable)} />
        <StatCard
          label="Com acento"
          value={formatNumber(data.withAccent)}
          hint={`na amostra de ${formatNumber(data.sampleSize)}`}
        />
        <StatCard
          label="Com imagem"
          value={formatNumber(data.withImage)}
          hint={`na amostra de ${formatNumber(data.sampleSize)}`}
        />
        <StatCard
          label="Sem corpo"
          value={formatNumber(data.withoutBody)}
          tone={data.withoutBody > 0 ? "warn" : "default"}
          hint={`na amostra de ${formatNumber(data.sampleSize)}`}
        />
      </div>

      <Card title="Amostra de posts" subtitle="primeiros 50 da amostra">
        {data.recent.length === 0 ? (
          <EmptyState message="Nenhum post legado encontrado." />
        ) : (
          <Table head={["Título", "URL", "Indexable"]}>
            {data.recent.map((post) => {
              const slug = pickString(post, ["slug"]);
              return (
                <tr key={String(post.id)} className="hover:bg-panel-2">
                  <Td className="max-w-96">
                    {truncate(pickString(post, ["title"]) ?? "(sem título)", 90)}
                  </Td>
                  <Td className="max-w-72 truncate font-mono text-xs text-muted">
                    {slug ? `/post/${slug}` : "—"}
                  </Td>
                  <Td>
                    <LegacyIndexableToggle
                      postId={String(post.id)}
                      indexable={pickBoolean(post, ["indexable"])}
                    />
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </>
  );
}
