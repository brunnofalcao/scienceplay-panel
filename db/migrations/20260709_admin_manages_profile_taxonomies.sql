-- ADMIN PANEL (aditiva, não-destrutiva) — SHARED-DATA-CONTRACT §1:
-- professions/specialties: ADMIN "lê/gerencia". Antes só havia SELECT público.
create policy "admin manages professions" on public.professions
  for all using (is_admin()) with check (is_admin());

create policy "admin manages specialties" on public.specialties
  for all using (is_admin()) with check (is_admin());
