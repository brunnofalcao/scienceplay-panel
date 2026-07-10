# ENDPOINTS INTERNOS NECESSÁRIOS NO SITE (scienceplay-platform)

> **Atualização 2026-07-10:** o item 4 (motor diário) foi ENTREGUE pelo SITE em
> formato diferente do proposto: `GET /api/cron/daily-news` com
> `Authorization: Bearer {CRON_SECRET}` (em vez de POST + x-internal-secret).
> O painel já integra: o disparo manual em /production/daily usa
> `SITE_INTERNAL_API_SECRET` = valor do `CRON_SECRET` do SITE, e as execuções
> são lidas de `usage_events` (evento `cron_daily_news`), onde o job grava o
> resumo. Os itens 1–3 continuam pendentes.

O painel (`/production`) orquestra a produção de NEWS, mas o **motor científico
vive no SITE**. Enquanto estes endpoints não existirem, o painel mostra estado
honesto ("Endpoint do SITE ainda não configurado") — nenhuma geração é
simulada.

## Segurança (todos os endpoints)

- Header obrigatório: `x-internal-secret: {SITE_INTERNAL_API_SECRET}`
- Secret compartilhado via env **server-side nos dois projetos** — nunca no
  client, nunca `NEXT_PUBLIC_*`, nunca logado.
- Requisição sem secret válido → `401`.
- Toda chamada deve ser logada pelo SITE (mínimo: rota, payload resumido,
  resultado). O painel já audita o disparo em `admin_audit_logs`
  (`production.*`).

## 1. Capturar fontes

```txt
POST /api/internal/admin/capture-sources
```

```json
{
  "window": "30d",            // "24h" | "7d" | "30d" | "90d" | "1y"
  "source": "pubmed",         // "pubmed" | "crossref" | "all"
  "theme": "gut-brain axis",  // opcional
  "area": "Gastroenterologia",// opcional
  "limit": 20
}
```

Resposta sugerida: `{ "captured": 12, "skipped_duplicates": 3 }`.
Destino dos capturados: tabela `source_candidates` (migration proposta em
`db/migrations/proposed/`), status `captured`.

## 2. Gerar NEWS individual

```txt
POST /api/internal/admin/generate-news
```

```json
{
  "source_id": "uuid",
  "publish": true,
  "origin_type": "team_automated",
  "content_type": "science_news"
}
```

## 3. Gerar lote (grau / lote / tema)

```txt
POST /api/internal/admin/generate-news-batch
```

O painel envia três modos no mesmo endpoint:

```json
{ "mode": "grade", "grade": "A", "limit": 3, "area": null, "publish": false }
```

```json
{ "mode": "batch", "limit": 5, "content_type": "science_news",
  "queue_source": "captured", "publish": false }
```

```json
{ "mode": "theme", "theme": "gut-brain axis", "source": "all",
  "window": "90d", "limit": 3, "area": null, "min_grade": "B" }
```

Regras invioláveis (já são do motor): duplicata exata não gasta IA; possível
duplicata → `status='possible_duplicate'` (fila de /duplicates); falha de
validação → `needs_review`.

Resposta sugerida: `{ "generated": 3, "published": 1, "possible_duplicates": 1, "failed": 0 }`.

## 4. Motor diário (disparo manual)

```txt
POST /api/internal/daily-news
```

```json
{ "mode": "manual", "limit": 5, "area": null, "theme": null }
```

Deve gravar execução em `cron_logs` (job, status, started_at, finished_at,
detail com contagens).

## Contrato de resposta comum

- `2xx` com JSON de contagens → o painel exibe a mensagem.
- `401` secret inválido · `404/405` → o painel trata como "endpoint pendente".
- Erros de domínio: `4xx/5xx` com `{ "error": "mensagem" }`.
