export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicEnv() !== null;
}

/** Presença da service role — nunca retorna o valor. Só usar em código server. */
export function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getPanelEnvName(): string {
  return process.env.ADMIN_PANEL_ENV ?? "staging";
}

export function getPublicSiteUrl(): string {
  return process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "https://www.scienceplay.com";
}

export function getPanelUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://panel.scienceplay.com";
}
