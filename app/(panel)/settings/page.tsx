import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { fetchPlans } from "@/lib/admin/queries";
import { getPanelDb } from "@/lib/db/panel";
import { pickString } from "@/lib/formatters";
import {
  getPanelEnvName,
  getPanelUrl,
  getPublicSiteUrl,
  hasServiceRole,
  isSupabaseConfigured,
} from "@/lib/supabase/env";
import { hasSiteInternalSecret } from "@/lib/site/internal";
import { Card } from "@/components/ui/Card";
import { NotConfigured } from "@/components/ui/NotConfigured";
import { QueryDegradation } from "@/components/ui/QueryDegradation";

export const metadata: Metadata = { title: "Settings" };

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line/50 py-2 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span
        className={`font-mono text-sm ${
          ok === undefined ? "" : ok ? "text-ok" : "text-warn"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default async function SettingsPage() {
  const guard = await requireAdmin();
  const configured = isSupabaseConfigured();

  const aiModels = [
    ["AI_PRIMARY_MODEL", process.env.AI_PRIMARY_MODEL],
    ["AI_FALLBACK_MODEL", process.env.AI_FALLBACK_MODEL],
    ["AI_PROVIDER", process.env.AI_PROVIDER],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  let plansSection = null;
  if (guard.configured) {
    const panel = await getPanelDb();
    if (panel) {
      const { rows, errors } = await fetchPlans(panel.db);
      plansSection = (
        <Card title="Limites Free (tabela plans)" subtitle="somente leitura">
          <QueryDegradation errors={errors} />
          {rows.length === 0 ? (
            <p className="text-sm text-muted">Nenhum plano encontrado.</p>
          ) : (
            <ul className="space-y-2">
              {rows.map((plan) => (
                <li key={String(plan.id)} className="rounded-lg border border-line bg-panel-2 p-3">
                  <p className="text-sm font-medium">
                    {pickString(plan, ["name", "title"]) ?? String(plan.id)}
                  </p>
                  <pre className="mt-1 overflow-x-auto font-mono text-[11px] text-muted">
                    {JSON.stringify(plan.limits ?? {}, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </Card>
      );
    }
  }

  return (
    <>
      <h1 className="text-lg font-semibold">Settings</h1>
      <p className="text-sm text-muted">
        Somente leitura — chaves não são editáveis pelo painel e valores de
        segredos nunca são exibidos.
      </p>

      {!configured ? <NotConfigured /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Ambiente">
          <Row label="ADMIN_PANEL_ENV" value={getPanelEnvName()} />
          <Row label="URL do painel" value={getPanelUrl()} />
          <Row label="URL do site público" value={getPublicSiteUrl()} />
        </Card>

        <Card title="Supabase" subtitle="presença das chaves — nunca o valor">
          <Row
            label="NEXT_PUBLIC_SUPABASE_URL + ANON_KEY"
            value={configured ? "configurado" : "ausente"}
            ok={configured}
          />
          <Row
            label="SUPABASE_SERVICE_ROLE_KEY (server-only)"
            value={hasServiceRole() ? "presente" : "ausente"}
            ok={hasServiceRole()}
          />
          <Row
            label="SITE_INTERNAL_API_SECRET (server-only)"
            value={hasSiteInternalSecret() ? "presente" : "ausente"}
            ok={hasSiteInternalSecret()}
          />
        </Card>

        <Card title="Modelos de IA" subtitle="somente se configurados via env">
          {aiModels.length === 0 ? (
            <p className="text-sm text-muted">
              Nenhuma variável de modelo de IA configurada neste ambiente (os
              modelos do motor vivem no SITE).
            </p>
          ) : (
            aiModels.map(([name, value]) => (
              <Row key={name} label={name} value={value} />
            ))
          )}
        </Card>

        <Card title="Robots / indexação">
          <Row label="metadata robots" value="noindex, nofollow" ok />
          <Row label="X-Robots-Tag (middleware)" value="noindex, nofollow" ok />
          <Row label="robots.txt" value="Disallow: /" ok />
          <Row label="Sitemap público" value="inexistente (correto)" ok />
        </Card>
      </div>

      {plansSection}
    </>
  );
}
