export function NotConfigured() {
  return (
    <div className="rounded-xl border border-warn/40 bg-warn/10 p-6">
      <h2 className="text-base font-semibold text-warn">
        Supabase não configurado
      </h2>
      <p className="mt-2 text-sm text-ink/80">
        Conecte o Supabase para carregar dados reais. Preencha no{" "}
        <code className="font-mono">.env.local</code>:
      </p>
      <ul className="mt-2 list-inside list-disc font-mono text-sm text-muted">
        <li>NEXT_PUBLIC_SUPABASE_URL</li>
        <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
        <li>SUPABASE_SERVICE_ROLE_KEY (server-only, para ações admin)</li>
      </ul>
      <p className="mt-2 text-sm text-muted">
        Use o MESMO Supabase do site (project ref{" "}
        <code className="font-mono">wetvjyfrmnfxargsynnn</code>). Nenhum dado é
        simulado sem conexão real.
      </p>
    </div>
  );
}

export function ServiceRoleMissing() {
  return (
    <p className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
      Service role ausente para ações administrativas — leitura via sessão
      (RLS). Configure SUPABASE_SERVICE_ROLE_KEY (server-only) para habilitar
      as ações de moderação.
    </p>
  );
}
