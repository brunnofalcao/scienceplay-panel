-- ADMIN PANEL (não-destrutiva): permite que admins logados gravem auditoria
-- via sessão (RLS), conforme SHARED-DATA-CONTRACT §1 ("admin_audit_logs: ADMIN escreve").
-- Antes desta policy só a service role conseguia inserir.
create policy "admin writes audit" on public.admin_audit_logs
  for insert with check (is_admin());
