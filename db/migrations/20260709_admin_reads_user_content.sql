-- ADMIN PANEL (aditiva, não-destrutiva) — alinha a RLS ao SHARED-DATA-CONTRACT
-- §1: ADMIN lê saved_news, collections e collection_items (visão estratégica
-- por usuário no painel). Policies separadas fazem OR com as de dono.
--
-- ⚠️ JÁ APLICADA ao projeto wetvjyfrmnfxargsynnn em 2026-07-09
-- ("admin_reads_user_content"). IDEMPOTENTE (drop/create).
drop policy if exists "admin reads saved_news" on public.saved_news;
create policy "admin reads saved_news" on public.saved_news
  for select using (is_admin());

drop policy if exists "admin reads collections" on public.collections;
create policy "admin reads collections" on public.collections
  for select using (is_admin());

drop policy if exists "admin reads collection_items" on public.collection_items;
create policy "admin reads collection_items" on public.collection_items
  for select using (is_admin());
