# ADMIN PANEL — DATA CONTRACT (resumo operacional)

Derivado do `SHARED-DATA-CONTRACT.md` compartilhado com o SITE (`scienceplay-platform`).
O SITE é o dono do schema; este painel **consome** o mesmo Supabase e **não faz
migration destrutiva**. Mantenha este arquivo alinhado com o contrato compartilhado.

- Project ref: `wetvjyfrmnfxargsynnn` · região sa-east-1
- URL: `https://wetvjyfrmnfxargsynnn.supabase.co`
- Auth: um único `public.users` (mesmo login para SITE e ADMIN).

## Tabelas usadas pelo painel

| Tabela | Uso no ADMIN |
|---|---|
| `users` | lê todos; role/plano (edição de role via SQL/dashboard nesta fase) |
| `plans` | lê (limites Free em `limits` JSON) |
| `professions`, `specialties` | lê/gerencia (criar/renomear) |
| `news_reviews` | lê tudo, modera (status) |
| `news_i18n` | lê/edita (título, meta description) |
| `sources` | lê (DOI/PMID/URL/content_key) |
| `news_tags`, `tags`, `categories` | lê/gerencia |
| `saved_news` | lê (consumo por usuário; `relationship`: submitted/saved) |
| `content_generations` | lê (Content Studio) |
| `practice_translations` | lê (cache E2A) |
| `usage_events` | lê (dashboards) — nunca escreve |
| `ai_logs` | lê — sem prompt bruto, sem chaves |
| `admin_audit_logs` | **escreve** (toda ação admin) |
| `legacy_posts` | lê; toggle `indexable` |
| `cron_logs` | lê |
| `newsletter_campaigns`, `whatsapp_templates`, `webhook_events`, `rdstation_events` | **não ativar** (integrações futuras) |

## Enums oficiais (não inventar valores)

- `editorial_status`: `draft, generated, needs_review, possible_duplicate, approved, published, archived, rejected, blocked_duplicate, merged, updated_existing`
- `origin_type`: `user_upload, team_automated, team_manual, external_source, legacy_import, admin_created, system_generated`
- `content_type`: `scientific_article, article_summary, science_news, clinical_analysis, guideline_update, evidence_update, editorial_note, manual_content, user_submitted_article`
- `source_kind`: `doi, pmid, crossref, url, pdf, text`
- `user_role`: `user, editor, admin`
- GRADE: `A | B | C | D`

## `usage_events.event` — REAL vs PLANEJADO

**Emitidos hoje** (os únicos que o painel consulta):
`signup · theme_search · news_generated · news_deduped · possible_duplicate · e2a_used · studio_used · news_limit · e2a_limit · studio_limit · cron_daily_news`

> `cron_daily_news` (novo, 2026-07-10): emitido pelo job diário do SITE
> (`GET /api/cron/daily-news`) com o resumo da execução em `meta`
> (`published/discovered/needsReview/deduped/errors/items`). É a fonte oficial
> das execuções do motor diário — `cron_logs` segue vazia por enquanto.

**Planejados, ainda NÃO emitidos** (não usar como se existissem):
`login, news_saved, content_copied, collection_created, daily_news_generated, cron_error`

- "E2A gerados" = `event = 'e2a_used'` (NÃO `e2a_generated`).
- "Studio gerados" = `event = 'studio_used'`.
- Colunas: `user_id` (null p/ anônimo), `event`, `entity_id`, `ip_hash`, `meta`, `created_at`.
- `meta` do E2A: `{profession, context, mock}` · Studio: `{format, mock}` · limites: `{used, limit}`.

## Regras de publicação (invioláveis)

- Só `status='published'` aparece no site público e nos sitemaps.
- `auto_published=true` só quando virou público sem passar por editor.
- Toda NEWS tem `do_not_claim` e GRADE (A|B|C|D).

## Dedup

- `sources.content_key` = chave canônica (DOI/PMID/URL/hash de texto).
- Duplicata exata → reusa a NEWS existente (não chega à fila).
- Possível duplicata (trigram `match_source_title`, threshold ~0.6) →
  `status='possible_duplicate'`, `duplicate_of`, `duplicate_score`,
  `duplicate_reason` → fila em `/duplicates`.

## Ações admin (todas geram `admin_audit_logs`)

- NEWS: publicar, despublicar, aprovar, rejeitar, arquivar, marcar duplicado,
  editar (título/meta description).
- Duplicados: bloquear (`blocked_duplicate`), publicar mesmo assim (`published`),
  mesclar (`merged`), atualizar existente (`updated_existing`), arquivar envio (`archived`).
- Legacy: alternar `indexable`.
- Taxonomias: criar/renomear.

`admin_audit_logs`: `admin_id` (SET NULL se admin deletado), `action`, `entity`,
`entity_id`, `before`, `after`, `created_at`.

## Segurança

- Admin = `public.users.role = 'admin'`, resolvido por `auth_id = auth.uid()`.
- `SUPABASE_SERVICE_ROLE_KEY` NUNCA no client — só server
  (`lib/db/admin.ts` importa `server-only`).
- Fluxo: anônimo → `/login` · user comum → `/unauthorized` · admin → dashboard.
- `noindex, nofollow` em metadata + `X-Robots-Tag` no middleware + `robots.txt`
  com `Disallow: /`. Sem sitemap público.

## Gotchas de sessão (aprendidos em produção)

1. `getSessionProfile` DEVE ser memoizado com `cache()` do React
   (`lib/auth/session.ts`). Múltiplos `auth.getUser()` por request em RSC
   rotacionam refresh token → `refresh_token_not_found` → sessão zera →
   guard cai em 404.
2. Debug de auth/rotas SÓ vale em `next start` (build de produção) —
   `next dev` mascara o bug acima.
3. Rotas gated por sessão não podem ser pré-renderizadas estáticas —
   o layout do painel usa `dynamic = "force-dynamic"`.

## Schema real — reconciliado em 2026-07-09 (projeto oficial confirmado)

`wetvjyfrmnfxargsynnn` foi confirmado como o Supabase oficial (nome
`scienceplay-platform`, sa-east-1) com todas as tabelas do contrato —
`legacy_posts` com exatamente 1.825 linhas. Tipos oficiais gerados em
`types/database.gen.ts`; `types/database.ts` mantém as constantes do contrato
(enums batem 100% com o banco).

Colunas reais que diferem do que o painel assumia (já corrigidas no código):

| Onde | Esperado antes | Real no banco |
|---|---|---|
| `users` | `name` | `first_name` + `last_name` |
| `news_i18n` | `meta_description` | `seo_description` (há também `seo_title`) |
| `sources` | `url`, `journal`, `year`, `authors` | `canonical_url`, `title_original`; periódico/ano/autores em `metadata` (jsonb) |
| `ai_logs` | `news_id`, `fallback` | **não existem** — só `user_id`; failover detectado por `status`/`feature` |
| `cron_logs` | `news_generated`, `duration_ms` | `job`, `status`, `started_at`, `finished_at`, `detail` (jsonb) |
| `legacy_posts` | `image_url` | `thumb` (+ `original_url`, `redirect_to`) |
| `news_reviews` | — | tem também `area` (text), `study_type`, `population`, `sample`, `method`, `main_result`, `clinical_application`, `reference_text`, `approved_by`, `bottom_line` |

## Migrations aplicadas pelo ADMIN (não-destrutivas, aditivas)

Aplicadas ao projeto oficial em 2026-07-09 e espelhadas em
[`db/migrations/`](../db/migrations/) deste repo — **copiar para
`scienceplay-platform/db/migrations/`** (o SITE é o dono do schema):

1. `admin_writes_audit_logs_policy` — INSERT em `admin_audit_logs` com
   `is_admin()`. O contrato §1 diz que o ADMIN escreve auditoria, mas a RLS só
   tinha SELECT; sem service role nenhuma ação conseguia auditar.
2. `admin_reads_user_content` — SELECT com `is_admin()` em `saved_news`,
   `collections`, `collection_items`. Destrava a visão estratégica por usuário
   (biblioteca/consumo) via sessão admin.
3. `admin_manages_profile_taxonomies` — ALL com `is_admin()` em `professions`
   e `specialties` (contrato §1: "lê/gerencia").

Validação por impersonação RLS no banco real:
- admin grava auditoria com `admin_id`/before/after corretos; usuário comum →
  RLS violation 42501;
- admin lê `saved_news` de outros usuários; usuária comum continua vendo 0
  registros de terceiros;
- admin insere em `professions` (rollback).

## RLS × service role (modelo de operação)

- SITE: RLS de usuário comum, inalterada.
- ADMIN: guard admin obrigatório + policies `is_admin()` acima. A
  `SUPABASE_SERVICE_ROLE_KEY` (server-only) segue **recomendada** para
  operação interna (consultas agregadas sem depender de sessão), mas deixou de
  ser pré-requisito para leitura estratégica e auditoria.
- `news_reviews`: policy de UPDATE existe (moderação ok); INSERT não — o
  painel não cria NEWS, sem impacto.
