-- ADMIN PANEL (aditiva, não-destrutiva): permite que admins logados gravem
-- auditoria via sessão (RLS), conforme SHARED-DATA-CONTRACT §1
-- ("admin_audit_logs: ADMIN escreve"). Antes só a service role inseria.
--
-- ⚠️ JÁ APLICADA ao projeto wetvjyfrmnfxargsynnn em 2026-07-09 (via Supabase
-- MCP, registrada em supabase_migrations.schema_migrations como
-- "admin_writes_audit_logs_policy"). Este arquivo reconcilia o repo dono do
-- schema. IDEMPOTENTE: o drop/create recria a policy idêntica sem erro em
-- bancos onde ela já existe.
drop policy if exists "admin writes audit" on public.admin_audit_logs;
create policy "admin writes audit" on public.admin_audit_logs
  for insert with check (is_admin());
