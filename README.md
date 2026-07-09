# scienceplay-admin-panel

Cockpit interno da Science Play (COO, editorial e operação). Domínio futuro:
`panel.scienceplay.com`. Projeto independente do site público
(`scienceplay-platform`), usando o **mesmo Supabase** do SITE — não cria banco
nem auth novos e não altera o site público.

## Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind 4 · `@supabase/ssr` ·
`@supabase/supabase-js` · Zod · Server Components/Actions.

## Rodando

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do MESMO Supabase do SITE
npm run dev                   # desenvolvimento
npm run build && npm run start  # validação REAL (auth/sessão só valem em next start)
```

O painel **builda e roda sem credenciais**: sem env, as telas mostram o estado
honesto "Supabase não configurado" (nenhum dado é simulado).

Supabase oficial confirmado: `wetvjyfrmnfxargsynnn` (scienceplay-platform,
sa-east-1). Tipos gerados do banco real em `types/database.gen.ts`.

## Smoke test E2E (rodar onde *.supabase.co é alcançável)

```bash
npm run build && npm run start &
PANEL_ADMIN_EMAIL=... PANEL_ADMIN_PASSWORD=... node scripts/e2e-smoke.mjs
```

Valida anônimo→/login, user comum→/unauthorized, admin→dashboard, navegação
pelas 10 telas sem queda de sessão e ausência de segredos no HTML.

## Segurança

- Anônimo → `/login` · usuário sem role admin → `/unauthorized` · admin → painel.
- Admin = `public.users.role = 'admin'` resolvido por `auth_id = auth.uid()`.
- `SUPABASE_SERVICE_ROLE_KEY` é server-only (`lib/db/admin.ts` importa
  `server-only`); nunca aparece em client, log ou HTML.
- `noindex, nofollow` (metadata + `X-Robots-Tag` + `robots.txt`), sem sitemap.
- Toda ação administrativa grava em `admin_audit_logs`.

## Rotas

`/login` · `/unauthorized` · `/` (dashboard) · `/users` · `/users/[id]` ·
`/news` · `/news/[id]` · `/duplicates` · `/usage` · `/ai-logs` · `/cron` ·
`/legacy` · `/taxonomies` · `/settings`

## Contrato de dados

Fonte de verdade: `SHARED-DATA-CONTRACT.md` (repo do SITE). Resumo operacional
local em [`docs/ADMIN-PANEL-DATA-CONTRACT.md`](docs/ADMIN-PANEL-DATA-CONTRACT.md).
Não inventar status, eventos ou enums fora do contrato.
