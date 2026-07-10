# CONTRATO DE ATRIBUIÇÃO DE CUSTO DE IA

> **STATUS 2026-07-10: IMPLEMENTADO** — migration `0017_ai_logs_attribution`
> aplicada ao banco; o motor do SITE (PR #2) preenche
> `entity_type/entity_id/feature_run_id/request_group_id` para NEWS, E2A e
> Studio. O painel mostra custo EXATO por NEWS em /production/costs assim que
> as primeiras gerações com atribuição acontecerem. Gerações anteriores
> permanecem sem vínculo (não rastreáveis, declaradas como tal).

## Situação atual (schema real, verificado)

`ai_logs` tem: `user_id, feature, provider, model, input_tokens, output_tokens,
cost_usd, latency_ms, status, error, created_at`.

O que isso permite HOJE (e o painel já entrega em /production/costs):

| Dimensão | Precisão |
|---|---|
| Custo por período (dia/mês) | **Exato** |
| Custo por provider / modelo / feature | **Exato** |
| Custo por usuário / plano | **Exato** (via `user_id`) |
| Custo E2A / Content Studio | **Estimado** (heurística pelo nome da feature) |
| Custo por NEWS | **Não rastreável** — não há vínculo com a NEWS gerada |
| Custo por job/lote de produção | **Não rastreável** |

Regra do painel: **nunca fingir precisão** — cada card indica a classificação
(exato / estimado / não rastreável).

## Proposta de mudança no SITE (aditiva, sem quebrar nada)

Adicionar a `ai_logs` (todas nullable — zero impacto no código atual):

```sql
alter table public.ai_logs
  add column if not exists entity_type text,        -- 'news' | 'e2a' | 'studio' | 'daily_job' | ...
  add column if not exists entity_id uuid,          -- id da NEWS/geração/tradução
  add column if not exists feature_run_id uuid,     -- agrupa as N chamadas de uma mesma execução
  add column if not exists request_group_id uuid;   -- agrupa um lote inteiro (batch/cron)
```

Alternativa mínima, se preferirem direto: só `news_id uuid null` — resolve o
custo por NEWS, mas não agrupa lote/execução.

## O que o SITE precisa passar a gravar

1. Geração de NEWS: `entity_type='news'`, `entity_id=news_reviews.id`,
   `feature_run_id` único por artigo processado.
2. E2A: `entity_type='e2a'`, `entity_id=practice_translations.id`.
3. Studio: `entity_type='studio'`, `entity_id=content_generations.id`.
4. Lote/cron: mesmo `request_group_id` para todas as chamadas do job, e o
   id gravado também em `cron_logs.detail`.

## O que o painel entrega em troca (sem mudança adicional)

Custo exato por NEWS, por E2A, por peça do Studio, por usuário, por job e por
lote — os agregadores de `/production/costs` já leem colunas de forma
tolerante e passam a usar os vínculos automaticamente quando existirem.

## Processo

Migration aditiva criada pelo SITE (dono do schema) em `db/migrations`,
seguindo a numeração; o painel apenas consome. Nada destrutivo.
