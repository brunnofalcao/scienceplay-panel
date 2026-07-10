import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { fetchProductionOverview } from "@/lib/admin/production";
import { getPanelDb } from "@/lib/db/panel";
import { formatNumber } from "@/lib/formatters";
import { hasSiteInternalSecret } from "@/lib/site/internal";
import {
  BatchForm,
  CaptureForm,
  GradeForm,
  ThemeForm,
} from "@/components/admin/production/ProductionForms";
import { Card, StatCard } from "@/components/ui/Card";
import { NotConfigured } from "@/components/ui/NotConfigured";
import { QueryDegradation } from "@/components/ui/QueryDegradation";
import { GuidedTour } from "@/components/ui/GuidedTour";
import { TOURS } from "@/lib/tours";

export const metadata: Metadata = { title: "Produção de NEWS" };

export default async function ProductionPage() {
  const guard = await requireAdmin();
  if (!guard.configured) return <NotConfigured />;
  const panel = await getPanelDb();
  if (!panel) return <NotConfigured />;

  const overview = await fetchProductionOverview(panel.db);
  const ready = hasSiteInternalSecret();

  return (
    <>
      <div>
        <h1 className="text-lg font-semibold">Produção de NEWS</h1>
        <p className="text-sm text-muted">
          Capture estudos, gere NEWS e acompanhe a produção automática de
          conteúdo científico da Science Play.
        </p>
      </div>
      <QueryDegradation errors={overview.errors} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Geradas hoje" value={formatNumber(overview.today)} />
        <StatCard label="Geradas no mês" value={formatNumber(overview.month)} />
        <StatCard
          label="Fila de duplicados"
          value={formatNumber(overview.possibleDuplicates)}
          tone={overview.possibleDuplicates > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Precisam de revisão"
          value={formatNumber(overview.needsReview)}
          tone={overview.needsReview > 0 ? "warn" : "default"}
        />
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/production/queue" className="rounded-lg border border-line px-3 py-1.5 hover:border-accent">
          Fila de Produção →
        </Link>
        <Link href="/production/daily" className="rounded-lg border border-line px-3 py-1.5 hover:border-accent">
          Produção Diária →
        </Link>
        <Link href="/production/costs" className="rounded-lg border border-line px-3 py-1.5 hover:border-accent">
          Custos de IA →
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          tourAnchor="capturar"
          title="Capturar estudos novos"
          subtitle="POST {SITE}/api/internal/admin/capture-sources"
        >
          <CaptureForm ready={ready} />
        </Card>
        <Card
          tourAnchor="grade"
          title="Gerar por grau de evidência"
          subtitle="POST {SITE}/api/internal/admin/generate-news-batch · mode=grade"
        >
          <GradeForm ready={ready} />
        </Card>
        <Card
          tourAnchor="batch"
          title="Gerar lote"
          subtitle="POST {SITE}/api/internal/admin/generate-news-batch · mode=batch"
        >
          <BatchForm ready={ready} />
        </Card>
        <Card
          tourAnchor="theme"
          title="Gerar por tema"
          subtitle="POST {SITE}/api/internal/admin/generate-news-batch · mode=theme"
        >
          <ThemeForm ready={ready} />
        </Card>
      </div>
      <GuidedTour screen="Produção de NEWS" sections={TOURS["Produção de NEWS"]} />
    </>
  );
}
