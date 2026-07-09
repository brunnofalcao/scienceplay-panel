-- ADMIN PANEL (aditiva, não-destrutiva) — alinha a RLS ao SHARED-DATA-CONTRACT §1:
-- ADMIN lê saved_news, collections e collection_items (visão estratégica por usuário).
-- Policies separadas fazem OR com as policies de dono já existentes.
create policy "admin reads saved_news" on public.saved_news
  for select using (is_admin());

create policy "admin reads collections" on public.collections
  for select using (is_admin());

create policy "admin reads collection_items" on public.collection_items
  for select using (is_admin());
