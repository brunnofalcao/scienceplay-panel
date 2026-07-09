# RUNBOOK — Smoke real do ADMIN PANEL (para o Brunno)

Tempo estimado: **5–10 minutos**. Requisitos: máquina com Node 20+ e acesso
normal à internet (a sandbox do Claude Code bloqueia `*.supabase.co`; sua
máquina não).

## Passo 0 — Pegar a service role (1 min)

Supabase Dashboard → projeto **scienceplay-platform** (`wetvjyfrmnfxargsynnn`)
→ Settings → API → **service_role** (secret). Copie o valor. Nunca commitar,
nunca colar em chat/print.

## Passo 1 — Clonar e configurar (2 min)

```bash
git clone https://github.com/brunnofalcao/scienceplay-panel
cd scienceplay-panel
git checkout claude/scienceplay-admin-panel-f6dnol
npm install
cp .env.example .env.local
```

Preencha o `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wetvjyfrmnfxargsynnn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # anon key (Settings → API → anon public)
SUPABASE_SERVICE_ROLE_KEY=       # a secret copiada no Passo 0
```

## Passo 2 — Build de produção (2 min)

```bash
npm run build        # esperado: EXIT 0, zero warnings
npx tsc --noEmit     # esperado: EXIT 0
npm run start        # deixe rodando (porta 3000)
```

## Passo 3 — Smoke automatizado (2 min, outro terminal)

```bash
npx playwright install chromium   # só na primeira vez
PANEL_ADMIN_EMAIL=falcao@scienceplay.com \
PANEL_ADMIN_PASSWORD='sua-senha' \
node scripts/e2e-smoke.mjs
```

Saída esperada: **todas as linhas PASS** (`anônimo→/login`, `admin→/`,
navegação das 10 telas, sessão persistente, sem segredo no HTML) e
`N/N PASS` no final. Opcional: adicionar
`PANEL_USER_EMAIL=yasmin@scienceplay.com PANEL_USER_PASSWORD=...` para o
teste de usuário comum → /unauthorized.

## Passo 4 — Checagem visual (2 min, navegador)

Logado como `falcao@scienceplay.com` em `http://localhost:3000`:

1. **/** — Command Center com números reais (18 NEWS, 1.825 legado, custo IA).
2. **/users** — 2 usuários; abrir a **Yasmin** → deve mostrar a NEWS salva
   dela (Consumo), E2A/Studio e eventos na timeline.
3. **/settings** — "SUPABASE_SERVICE_ROLE_KEY (server-only): **presente**".
4. **/taxonomies** — criar a tag `teste-smoke`; deve aparecer feedback de
   sucesso.
5. Confirmar auditoria: Supabase Dashboard → Table Editor →
   `admin_audit_logs` → última linha deve ser `taxonomy.create.tags` com o
   seu `admin_id`. (Reverter depois, se quiser: apagar a tag `teste-smoke`
   pelo Table Editor — o audit log fica como evidência.)

## Passo 5 — Evidência

Mandar no chat do DEV/IA: o output do smoke (`N/N PASS`) e um print do
`/users/[id]` da Yasmin. Com isso o painel fecha os critérios de aprovação
final do CTO.

## Se algo falhar

- `FAIL admin após login` ou volta para /login ao navegar → me mande o output
  e o trecho do terminal do `npm run start` (é o gotcha de sessão §9; o painel
  usa `cache()` + middleware exatamente para isso, mas quero o log real).
- Erro `fetch failed` no login → a máquina não está alcançando
  `wetvjyfrmnfxargsynnn.supabase.co` (VPN/firewall).
- Qualquer tela com "consulta degradada" → me mande o texto expandido do
  aviso (tabela + mensagem).
