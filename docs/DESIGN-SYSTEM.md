# Sistema de design — Science Play Panel

Tipo de interface: **Admin / Painel Operacional**, com o Dashboard operando
como **Command Center**. Princípio: minimalismo com função — reduzir esforço
mental, guiar a próxima ação, transformar complexidade em clareza.

## Tokens (CSS vars em `app/globals.css`)

Núcleo de marca fixo (Brandbook §12–14): roxo `#652E78`, violeta `#A855F7`.
Superfícies em escala de elevação; cor de acento aparece pouco, com força.

| Papel | Dark | Claro |
|---|---|---|
| bg | `#0b0810` | `#f6f4f9` |
| panel (card) | `#14101c` | `#ffffff` |
| panel-2 (inset/hover) | `#1b1526` | `#f2eef7` |
| panel-3 (controle) | `#241d31` | `#eae3f2` |
| line / line-strong | `#271f36` / `#372d4b` | `#e5e0ec` / `#d3cbe0` |
| ink / muted / faint | `#f2eef7` / `#a29bb0` / `#6f6880` | `#1c1622` / `#665f73` / `#938ca3` |
| accent / accent-soft | `#b16cf7` / 14% | `#7e2bd4` / 10% |
| brand / brand-strong | `#652e78` / `#7c399a` | idem / `#532562` |
| ok / warn / danger | `#3ddc97` / `#f5b53d` / `#f4677a` | `#0f9d63` / `#b06d0a` / `#d22429` |

Cada cor tem função: **ok** progresso, **warn** atenção, **danger** risco,
**accent** ação/navegação, **brand** CTA primário. Nunca cor decorativa.

## Tipografia

- **Sora** (display): H1, wordmark, números de impacto (StatCard).
- **Inter** (UI/corpo): interface e leitura.
- **Geist Mono**: dados, ids, métricas em tabela.

Escala aplicada: H1 `text-xl` tracking-tight · seção `SectionHeader`
(11px uppercase, tracking-widest, faint) · métrica `26px` Sora bold · corpo
`text-sm` · apoio `text-xs` · micro `11px`.

## Espaçamento e grid

Base 8px. `main` com `max-w-[1400px]` centralizado (largura de leitura),
`space-y-6` entre blocos, KPIs em grid de 2 (mobile) / 4 (desktop).

## Componentes (em `components/`)

`ui/Card` · `ui/Card.StatCard` (filete de tom à esquerda) · `ui/AttentionRow`
(faixa "precisa de atenção" do Command Center) · `ui/SectionHeader` ·
`ui/StatusBadge` (dot + rótulo PT) · `ui/EmptyState` (orientador) ·
`ui/Skeleton` (+ `PageSkeleton`, via `loading.tsx`) · `charts/BarList`
(sequencial, valor à direita) · `tables/Table` · `admin/ActionFeedback`
(chips a partir do JSON do SITE) · `layout/{Sidebar,Header,ThemeToggle}`.

## Estados

- **Loading**: `loading.tsx` por rota pesada → `PageSkeleton`.
- **Empty**: `EmptyState` com título + mensagem orientadora (o que aparecerá
  aqui) e ação opcional.
- **Error/degradação**: `QueryDegradation` (consultas parciais), `NotConfigured`
  (sem Supabase), `ServiceRoleMissing`.
- **Success**: `ActionFeedback` (chips verdes com o resumo da ação).

## Microcopy

Curta, humana, orientadora. "Visão geral" (não "Dashboard"), "Revisar",
"Resolver", "Investigar", "Produzir NEWS", "Salvar alteração". Sem "Clique
aqui", sem urgência falsa, sem tom infantil.

## Acessibilidade

`:focus-visible` com anel de acento (teclado); estados nunca só por cor
(dot + rótulo nos badges); `prefers-reduced-motion` respeitado; `aria-current`
no item ativo da navegação; alvos de toque ≥ 32px; contraste calibrado.

## Responsividade

Sidebar fixa em desktop; conteúdo fluido com container; grids colapsam para
2 col (tablet) e 1–2 (mobile); header esconde o bloco textual do usuário em
telas pequenas (mantém avatar + sair); tabelas rolam em `overflow-x-auto`.

## Critérios de aceite (QA visual)

Ação principal evidente (faixa de atenção lidera) · hierarquia por espaço e
peso, não por cor · paleta restrita com função · cards com propósito · botões
não competem (1 primário por contexto) · sem JSON cru, sem status cortado,
sem rótulo grudado · estados loading/empty/error/success presentes · premium,
não template.
