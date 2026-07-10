-- PROPOSTA (não aplicada) — rastreio de jobs/lotes de produção de NEWS.
-- Aditiva. Aplicar via scienceplay-platform/db/migrations (dono do schema).

create table if not exists public.content_production_jobs (
  id uuid primary key default gen_random_uuid(),
  mode text not null, -- grade | batch | theme | daily | capture
  payload jsonb not null default '{}',
  status text not null default 'queued',
  -- queued | processing | done | failed
  requested_by uuid references public.users(id) on delete set null,
  generated_count int default 0,
  published_count int default 0,
  duplicate_count int default 0,
  failed_count int default 0,
  cost_usd numeric default 0, -- preenchível quando ai_logs tiver request_group_id
  started_at timestamptz,
  finished_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists idx_production_jobs_status
  on public.content_production_jobs(status);

alter table public.content_production_jobs enable row level security;

drop policy if exists "admin manages production jobs" on public.content_production_jobs;
create policy "admin manages production jobs" on public.content_production_jobs
  for all using (is_admin()) with check (is_admin());
