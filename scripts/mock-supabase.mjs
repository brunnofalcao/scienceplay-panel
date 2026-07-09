// Supabase local FALSO (auth + PostgREST) só para reproduzir o caminho
// autenticado do painel na sandbox. Nunca vai para o repo.
import http from "node:http";

const UID = "11111111-2222-3333-4444-555555555555";
const PROFILE = {
  id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  auth_id: UID,
  email: "mockadmin@test.dev",
  first_name: "Mock",
  last_name: "Admin",
  role: "admin",
  plan_id: null,
  profession_id: null,
  specialty_id: null,
  locale: "pt",
  created_at: "2026-07-01T00:00:00Z",
};
const USER = {
  id: UID,
  aud: "authenticated",
  role: "authenticated",
  email: "mockadmin@test.dev",
  email_confirmed_at: "2026-07-01T00:00:00Z",
  phone: "",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  identities: [],
  created_at: "2026-07-01T00:00:00Z",
  updated_at: "2026-07-01T00:00:00Z",
};

const b64url = (obj) =>
  Buffer.from(JSON.stringify(obj)).toString("base64url");
const accessToken = () =>
  `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url({
    sub: UID,
    role: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600,
  })}.mock`;

const session = () => ({
  access_token: accessToken(),
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: "mock-refresh-token",
  user: USER,
});

function send(res, status, body, headers = {}) {
  const data = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    ...headers,
  });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const accept = req.headers.accept ?? "";
  const wantsObject = accept.includes("vnd.pgrst.object+json");
  let body = "";
  for await (const chunk of req) body += chunk;

  // ---- auth ----
  if (url.pathname === "/auth/v1/token") return send(res, 200, session());
  if (url.pathname === "/auth/v1/user") return send(res, 200, USER);
  if (url.pathname === "/auth/v1/logout") return send(res, 204);
  if (url.pathname.startsWith("/auth/")) return send(res, 200, {});

  // ---- rest ----
  if (url.pathname.startsWith("/rest/v1/")) {
    const table = url.pathname.slice("/rest/v1/".length);

    if (req.method === "HEAD") {
      res.writeHead(200, { "content-range": "*/3" });
      return res.end();
    }
    if (req.method === "GET") {
      if (table === "users" && (url.search.includes("auth_id=eq.") || url.search.includes(`id=eq.${PROFILE.id}`))) {
        return send(res, 200, wantsObject ? PROFILE : [PROFILE], {
          "content-range": "0-0/1",
        });
      }
      if (wantsObject) {
        return send(res, 406, {
          code: "PGRST116",
          message: "JSON object requested, multiple (or no) rows returned",
          details: "The result contains 0 rows",
          hint: null,
        });
      }
      return send(res, 200, [], { "content-range": "*/0" });
    }
    if (req.method === "POST") {
      let parsed = {};
      try { parsed = JSON.parse(body); } catch {}
      const row = { id: "99999999-9999-9999-9999-999999999999", ...(Array.isArray(parsed) ? parsed[0] : parsed) };
      return send(res, 201, wantsObject ? row : [row]);
    }
    if (req.method === "PATCH" || req.method === "DELETE") {
      return send(res, 200, wantsObject ? {} : []);
    }
  }
  send(res, 200, {});
});

server.listen(54321, () =>
  console.log("mock supabase em http://127.0.0.1:54321"),
);
