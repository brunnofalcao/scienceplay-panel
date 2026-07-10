-- PROPOSTA (não aplicada) — fila de candidatos capturados para produção de NEWS.
-- Aditiva. Aplicar via scienceplay-platform/db/migrations (dono do schema).

create table if not exists public.source_candidates (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources(id),
  title text not null,
  doi text,
  pmid text,
  canonical_url text,
  journal text,
  year int,
  authors text,
  area text,
  tags text[] default '{}',
  evidence_grade_estimated text,
  status text not null default 'captured',
  -- captured | queued | processing | generated | published |
  -- possible_duplicate | failed | archived
  duplicate_of uuid references public.news_reviews(id),
  duplicate_score numeric,
  duplicate_reason text,
  captured_by uuid references public.users(id) on delete set null,
  captured_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists idx_source_candidates_status
  on public.source_candidates(status);
create unique index if not exists idx_source_candidates_doi
  on public.source_candidates(doi) where doi is not null;

alter table public.source_candidates enable row level security;

drop policy if exists "admin manages source_candidates" on public.source_candidates;
create policy "admin manages source_candidates" on public.source_candidates
  for all using (is_admin()) with check (is_admin());
