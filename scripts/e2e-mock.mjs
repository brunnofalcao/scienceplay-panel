/**
 * E2E do caminho AUTENTICADO usando o Supabase FALSO local — roda em qualquer
 * ambiente, sem rede e sem credenciais reais. Foi este harness que pegou o
 * bug "use server file can only export async functions" em produção.
 *
 * Uso:
 *   1. node scripts/mock-supabase.mjs        (deixa rodando)
 *   2. .env.local apontando para o mock:
 *        NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
 *        NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key
 *        SUPABASE_SERVICE_ROLE_KEY=mock-service-role-key
 *      npm run build && npm run start
 *   3. node scripts/e2e-mock.mjs             (PANEL_URL p/ porta diferente)
 */
import { chromium } from "playwright";

const BASE = process.env.PANEL_URL ?? "http://localhost:3000";
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
    : {},
);
const ctx = await browser.newContext();
const page = await ctx.newPage();
let failures = 0;

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", "mockadmin@test.dev");
await page.fill("#password", "whatever");
await Promise.all([
  page
    .waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20000 })
    .catch(() => null),
  page.locator('form button[type="submit"]').click(),
]);
await page.waitForLoadState("networkidle");
const afterLogin = new URL(page.url()).pathname;
console.log(`${afterLogin === "/" ? "PASS" : "FAIL"} | login mock admin → ${afterLogin}`);
if (afterLogin !== "/") failures++;

const routes = [
  "/",
  "/users",
  "/users/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
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
  const resp = await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  const text = (await page.textContent("body")) ?? "";
  const crashed = text.includes("Application error");
  if (crashed) failures++;
  console.log(`${crashed ? "FAIL" : "PASS"} | render autenticado ${route} (${resp?.status()})`);
}

// server action: criar tag (o caso que quebrou em produção)
await page.goto(`${BASE}/taxonomies`, { waitUntil: "networkidle" });
const tagForm = page.locator('form:has(input[name="table"][value="tags"])');
await tagForm.locator('input[name="name"]').fill("teste-smoke");
await tagForm.locator('button[type="submit"]').click();
await page.waitForTimeout(3000);
const after = (await page.textContent("body")) ?? "";
const actionOk = after.includes("criado em tags") && !after.includes("Application error");
if (!actionOk) failures++;
console.log(`${actionOk ? "PASS" : "FAIL"} | server action criar tag`);

await browser.close();
console.log(`\n${failures === 0 ? "TODOS PASS" : failures + " FAIL"}`);
process.exit(failures ? 1 : 0);
