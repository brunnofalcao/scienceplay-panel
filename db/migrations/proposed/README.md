# Migrations PROPOSTAS — NÃO APLICADAS

Diferente de `db/migrations/` (espelho de policies já aplicadas e mergeadas no
SITE via PR #1), os arquivos desta pasta são **propostas**: ainda NÃO foram
aplicados ao banco. O painel detecta a ausência das tabelas em runtime e mostra
estado honesto (ex.: fila de candidatos em `/production/queue`).

Processo correto (ordem do comando de Content Factory):

1. Revisar a proposta.
2. Copiar para `scienceplay-platform/db/migrations/` com a numeração oficial.
3. Aplicar via SITE (dono do schema).
4. O painel passa a usar automaticamente (leitura tolerante).

| Arquivo | O que cria | Usado por |
|---|---|---|
| `source_candidates.sql` | fila de estudos capturados aguardando geração | `/production/queue`, captura de estudos |
| `content_production_jobs.sql` | rastreio de jobs/lotes de geração | `/production/daily`, custo por lote |
