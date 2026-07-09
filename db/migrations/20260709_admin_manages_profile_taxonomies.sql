-- ADMIN PANEL (aditiva, não-destrutiva) — SHARED-DATA-CONTRACT §1:
-- professions/specialties: ADMIN "lê/gerencia". Antes só havia SELECT público.
--
-- ⚠️ JÁ APLICADA ao projeto wetvjyfrmnfxargsynnn em 2026-07-09
-- ("admin_manages_profile_taxonomies"). IDEMPOTENTE (drop/create).
drop policy if exists "admin manages professions" on public.professions;
create policy "admin manages professions" on public.professions
  for all using (is_admin()) with check (is_admin());

drop policy if exists "admin manages specialties" on public.specialties;
create policy "admin manages specialties" on public.specialties
  for all using (is_admin()) with check (is_admin());
