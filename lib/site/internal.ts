import "server-only";

/**
 * Cliente dos endpoints INTERNOS do SITE (dono do motor científico).
 * Os endpoints ainda não existem no SITE — a especificação completa está em
 * docs/SITE-INTERNAL-ENDPOINTS-NEEDED.md. Enquanto isso, as chamadas retornam
 * estado honesto (pending) em vez de simular sucesso.
 *
 * SITE_INTERNAL_API_SECRET: server-only, nunca no client, nunca logado.
 */

export function hasSiteInternalSecret(): boolean {
  return Boolean(process.env.SITE_INTERNAL_API_SECRET);
}

export type SiteInternalResult = {
  ok: boolean;
  /** true = bloqueado por configuração (secret/endpoint ausentes), não por erro real */
  pending: boolean;
  message: string;
};

/**
 * Motor diário REAL entregue pelo SITE: GET /api/cron/daily-news protegido
 * por `Authorization: Bearer {CRON_SECRET}`. O painel compartilha o valor via
 * SITE_INTERNAL_API_SECRET (= CRON_SECRET do SITE). Pode levar minutos
 * (maxDuration 300s no SITE).
 */
export async function callSiteDailyNews(): Promise<SiteInternalResult> {
  const secret = process.env.SITE_INTERNAL_API_SECRET;
  if (!secret) {
    return {
      ok: false,
      pending: true,
      message:
        "SITE_INTERNAL_API_SECRET ausente — defina com o MESMO valor do CRON_SECRET do SITE para habilitar o disparo manual.",
    };
  }
  const base =
    process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "https://www.scienceplay.com";
  try {
    const response = await fetch(`${base}/api/cron/daily-news`, {
      method: "GET",
      headers: { authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    const body = (await response.text()).slice(0, 400);
    if (response.status === 401) {
      return {
        ok: false,
        pending: false,
        message:
          "SITE recusou o secret (401) — SITE_INTERNAL_API_SECRET precisa ser idêntico ao CRON_SECRET do SITE.",
      };
    }
    if (response.status === 404) {
      return {
        ok: false,
        pending: true,
        message: "Endpoint do SITE ainda não configurado (/api/cron/daily-news).",
      };
    }
    if (!response.ok) {
      return {
        ok: false,
        pending: false,
        message: `SITE respondeu ${response.status}: ${body || "sem detalhe"}`,
      };
    }
    return { ok: true, pending: false, message: body || "Motor diário executado." };
  } catch (e) {
    return {
      ok: false,
      pending: false,
      message: `Falha de rede ao chamar o SITE: ${
        e instanceof Error ? e.message : "erro desconhecido"
      }`,
    };
  }
}

export async function callSiteInternal(
  path: string,
  payload: unknown,
): Promise<SiteInternalResult> {
  const secret = process.env.SITE_INTERNAL_API_SECRET;
  if (!secret) {
    return {
      ok: false,
      pending: true,
      message:
        "SITE_INTERNAL_API_SECRET ausente — configure a variável (server-only) para habilitar as ações de produção.",
    };
  }

  const base =
    process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "https://www.scienceplay.com";

  try {
    const response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": secret,
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (response.status === 404 || response.status === 405) {
      return {
        ok: false,
        pending: true,
        message: `Endpoint do SITE ainda não configurado (${path}). Ver docs/SITE-INTERNAL-ENDPOINTS-NEEDED.md.`,
      };
    }

    const body = (await response.text()).slice(0, 300);
    if (!response.ok) {
      return {
        ok: false,
        pending: false,
        message: `SITE respondeu ${response.status}: ${body || "sem detalhe"}`,
      };
    }
    return { ok: true, pending: false, message: body || "Executado no SITE." };
  } catch (e) {
    return {
      ok: false,
      pending: false,
      message: `Falha de rede ao chamar o SITE: ${
        e instanceof Error ? e.message : "erro desconhecido"
      }`,
    };
  }
}
