# Migrations propostas — PROMOVIDAS ao SITE

**STATUS 2026-07-10:** as duas propostas desta pasta foram promovidas ao repo
dono do schema como `scienceplay-platform/db/migrations/0015` e `0016` (PR #2),
junto com a `0017_ai_logs_attribution` — e as três **já estão aplicadas** ao
projeto `wetvjyfrmnfxargsynnn`. Os arquivos abaixo permanecem apenas como
histórico da proposta original.

| Arquivo | O que cria | Usado por |
|---|---|---|
| `source_candidates.sql` | fila de estudos capturados aguardando geração | `/production/queue`, captura de estudos |
| `content_production_jobs.sql` | rastreio de jobs/lotes de geração | `/production/daily`, custo por lote |
