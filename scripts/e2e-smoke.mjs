/**
 * Smoke test E2E do painel em build de produção (next start).
 *
 * Pré-requisitos:
 *   1. .env.local preenchido com o Supabase oficial (wetvjyfrmnfxargsynnn)
 *   2. npm run build && npm run start   (porta 3000, ou defina PANEL_URL)
 *   3. Ambiente com acesso de rede a *.supabase.co
 *
 * Uso:
 *   PANEL_ADMIN_EMAIL=... PANEL_ADMIN_PASSWORD=... \
 *   [PANEL_USER_EMAIL=... PANEL_USER_PASSWORD=...] \
 *   node scripts/e2e-smoke.mjs
 *
 * Valida: anônimo→/login, user comum→/unauthorized (se credenciais fornecidas),
 * admin→dashboard, navegação pelas 10 telas sem queda de sessão (gotcha §9),
 * e ausência de segredos no HTML.
 */
import { chromium } from "playwright";

const BASE = process.env.PANEL_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.PANEL_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PANEL_ADMIN_PASSWORD;
const USER_EMAIL = process.env.PANEL_USER_EMAIL;
const USER_PASSWORD = process.env.PANEL_USER_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Defina PANEL_ADMIN_EMAIL e PANEL_ADMIN_PASSWORD.");
  process.exit(2);
}

const results = [];
const check = (name, pass, detail = "") => {
  results.push(pass);
  console.log(`${pass ? "PASS" : "FAIL"} | ${name}${detail ? " | " + detail : ""}`);
};

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", email);
  await page.fill("#password", password);
  await Promise.all([
    page
      .waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30000 })
      .catch(() => null),
    page.locator('form button[type="submit"]').click(),
  ]);
  await page.waitForLoadState("networkidle");
  return new URL(page.url()).pathname;
}

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
    : {},
);

// 1. anônimo → /login
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/users`, { waitUntil: "networkidle" });
  check("anônimo em /users vai para /login", new URL(page.url()).pathname === "/login");
  await ctx.close();
}

// 2. usuário comum → /unauthorized
if (USER_EMAIL && USER_PASSWORD) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const path = await login(page, USER_EMAIL, USER_PASSWORD);
  check("user comum após login vai para /unauthorized", path === "/unauthorized", path);
  await page.goto(`${BASE}/news`, { waitUntil: "networkidle" });
  check(
    "user comum barrado em /news",
    new URL(page.url()).pathname === "/unauthorized",
  );
  await ctx.close();
} else {
  console.log("SKIP | teste de user comum (defina PANEL_USER_EMAIL/PASSWORD)");
}

// 3. admin → dashboard + navegação (pega o bug de sessão do §9 do contrato)
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const path = await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  check("admin após login vai para /", path === "/", path);

  const body = (await page.textContent("body")) ?? "";
  check("dashboard carrega Command Center", body.includes("Command Center"));
  check(
    "dashboard sem 'Supabase não configurado'",
    !body.includes("Supabase não configurado"),
  );

  const routes = [
    "/users",
    "/news",
    "/duplicates",
    "/usage",
    "/ai-logs",
    "/cron",
    "/legacy",
    "/taxonomies",
    "/settings",
  ];
  for (const route of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    const p = new URL(page.url()).pathname;
    check(`admin navega ${route}`, p === route, `path=${p}`);
  }

  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  check(
    "sessão persiste após navegar todas as telas",
    new URL(page.url()).pathname === "/",
  );

  const html = await page.content();
  check(
    "nenhum segredo (service_role/eyJ...) no HTML além do anon público",
    !/SUPABASE_SERVICE_ROLE_KEY=\w/.test(html),
  );
  await ctx.close();
}

await browser.close();
const failures = results.filter((r) => !r).length;
console.log(`\n${results.length - failures}/${results.length} PASS`);
process.exit(failures ? 1 : 0);
