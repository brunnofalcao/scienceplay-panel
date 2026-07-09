# Migrations do ADMIN — espelho para o repo SITE

O dono oficial do schema é `scienceplay-platform` (SITE), com migrations em
`db/migrations`. As migrations abaixo foram criadas pelo ADMIN, são
**aditivas e não-destrutivas** (apenas `CREATE POLICY`), e **já foram
aplicadas** ao projeto oficial `wetvjyfrmnfxargsynnn` em 2026-07-09 via
Supabase MCP (aparecem em `supabase_migrations.schema_migrations`).

**Ação pendente no SITE:** copiar estes arquivos para
`scienceplay-platform/db/migrations/` para que o histórico oficial do schema
não dependa de migration registrada só no painel.

| Arquivo | O que faz |
|---|---|
| `20260709_admin_writes_audit_logs_policy.sql` | INSERT em `admin_audit_logs` para `is_admin()` (antes só service role conseguia auditar) |
| `20260709_admin_reads_user_content.sql` | SELECT para `is_admin()` em `saved_news`, `collections`, `collection_items` (visão estratégica por usuário — contrato §1) |
| `20260709_admin_manages_profile_taxonomies.sql` | ALL para `is_admin()` em `professions` e `specialties` (contrato §1: "lê/gerencia") |

Validação executada no banco real (impersonação RLS):
- admin grava auditoria com `admin_id`/before/after corretos; usuário comum
  recebe RLS violation 42501;
- admin lê `saved_news`/`collections` de qualquer usuário; usuário comum
  continua vendo apenas os próprios registros;
- admin insere em `professions` (testado com rollback).
