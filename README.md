# iflows-mcp

Model Context Protocol (MCP) server for iFlow ERP. (Formerly published on npm as `iflow-mcp`.)

## Quick start (about 10 minutes)

### 1. Requirements
- Node.js 20+
- iFlow API credentials (Bearer Token)

### 2. Setup
```bash
git clone ...
cd iflow-mcp
npm install
npm run build
```

Optional global CLI (after build):

```bash
npm link
# MCP "command" can be: iflows-mcp (stdio; same as node dist/index.js)
```

CLI flags (no `IFLOW_*` env required):

- `iflows-mcp --version` / `-v` — print package version
- `iflows-mcp --help` / `-h` — short usage

### Remote HTTP transport (optional)

Set **`IFLOW_MCP_TRANSPORT=http`** to serve MCP over SSE instead of **stdio** (the default). The HTTP server listens when `IFLOW_MCP_TRANSPORT=http` (default port from `PORT` or `3000`). **`IFLOW_READ_ONLY`** defaults to **`0`** (writes allowed unless broker policies apply); set **`IFLOW_READ_ONLY=1`** for read-only HTTP deployments. The process listens on **`IFLOW_HTTP_BIND_HOST`** (default **`127.0.0.1`**; use **`0.0.0.0`** in Docker). Responses include **`X-Request-Id`** (echoed from the incoming header or generated). **`GET /healthz`** (liveness) is unauthenticated. **`GET /readyz`** is unauthenticated but returns **503** when `IFLOW_MCP_TRANSPORT=http` and the full OAuth trio (`IFLOW_OAUTH_ISSUER`, `IFLOW_OAUTH_JWKS_URL`, `IFLOW_MCP_AUDIENCE`) is missing, when OAuth is only partly set, or when all three are set but the JWKS URL is unreachable or not a valid JWKS document. Use **`/healthz`** for minimal container probes if you have not configured OAuth yet.

**SSE sessions:** each **`GET /sse`** connection creates an isolated MCP server instance. The SSE endpoint returns a URL for **`POST /messages`** that includes a **`sessionId`** query parameter; clients must post JSON-RPC to that URL (same Bearer token) so messages reach the correct session.

**`GET /sse`** and **`POST /messages`** require a Bearer token and JWT verification (desktop-style MCP over SSE). **`POST /`** accepts the same auth and serves **stateless JSON-RPC** `tools/list` and `tools/call` for the Django BFF (`iflow01` `mcp_broker.py` posting to `IFLOW_MCP_BASE_URL` without opening an SSE session). Sample proxy and Compose files: [`ops/nginx.conf.sample`](ops/nginx.conf.sample), [`ops/compose.sample.yml`](ops/compose.sample.yml).

**Optional tool-name contract check** (after `npm run build`): `IFLOW01_ROOT=/path/to/iflow01 npm run check:mcp-contract` ensures every Django MCP registry key is implemented in TS (extra TS-only tools such as `health` are allowed). Keys are read from `myintranet/scripts/dump_mcp_builtin_registry_keys.py` in the Django tree when present (no Django install); otherwise the script falls back to `get_merged_registry()`. Django logical endpoints `diff_diagnose_metric` / `diff_diagnose_events` are accepted when the composite TS tool `diff_diagnose` is registered. GitHub Actions on the Django repo runs this against `b25/iflow-mcp` (override with repository variable `IFLOW_MCP_CONTRACT_REPO`).

### 3. Configuration
Copy `.env.example` to `.env` and fill in your credentials.
The server uses environment variables for configuration.

**Django MCP broker (token from `/integrations/mcp/settings/`):** set `IFLOW_MCP_INTEGRATION_UUID` to the CompanyIntegrations `integration_uuid` (shown on that page). Use the opaque Bearer from **Generează token** as `IFLOW_API_BEARER`. HTTP calls then go to `GET|POST {IFLOW_BASE_URL}/v1/<uuid>/<logical_endpoint>/` instead of `/api-external/v1/<uuid>/`. You can set `IFLOW_API_POINTS` to `{}` in broker mode. Cursor sample: [`examples/cursor.broker.mcp.json`](examples/cursor.broker.mcp.json).

### 4. Tool schemas

`tools/list` exposes **JSON Schema** for each tool’s inputs (from Zod via `zod-to-json-schema`), so clients can validate arguments before calling iflow.

### 5. Client integration

**Where to configure:** secrets and URLs go in **`.env`** (see [`.env.example`](.env.example)). Each MCP client uses a **`mcpServers`** block: `command` + `args` pointing at `dist/index.js`, plus the same variables under `env`. Tool → UUID mapping is **`IFLOW_API_POINTS`** JSON aligned with Django **Api Points** — template [`examples/iflow-api-points.sample.json`](examples/iflow-api-points.sample.json). Snippet index: [`examples/README.md`](examples/README.md).

**Cursor — MCP favorizat în fiecare chat:** copiază **`iflow-mcp/examples/cursor-rules/iflow-mcp-aggressive-priority.mdc`** în **`.cursor/rules/`** la rădăcina workspace-ului Cursor (păstrează `alwaysApply: true`). Regula spune agentului să apeleze mai întâi tool-urile MCP (flux `mcp_assistant_intro` → `mcp_clarify` → `mcp_plan` / `mcp_data_dictionary` + restul) la întrebări despre business sau date iFlow, fără cifre inventate. Dacă monorepo-ul tău are deja fișierul la rădăcină (ex. `ionut/.cursor/rules/`), același conținut se aplică.

**Prompt for Cursor / Claude / ChatGPT:** copy the block below (same idea as the JSON snippets — one fenced block to grab). Extended notes and the *where to save* table: **[`examples/configure-iflow-mcp-prompt.md`](examples/configure-iflow-mcp-prompt.md)**.

#### Assistant prompt (copy-paste)

```text
Ești un asistent care mă ajută să conectez serverul MCP **iflows-mcp** (iFlow ERP) la editorul meu sau la Claude Desktop.

Context tehnic:
- iflows-mcp este un server Node (>=20); binarul rulează cu `node <cale>/dist/index.js` sau comanda `iflows-mcp` după `npm run build`.
- Variabilele obligatorii sunt documentate în `iflow-mcp/.env.example`.
- Maparea tool → UUID în Django: fie **Api Points** de tip IFLOW_MCP cu cheia logică egală cu cheia din JSON, fie câmpul `IFLOW_API_POINTS` (JSON) care mapează fiecare cheie la `path_uuid`-ul din Api Point. Șablon: `iflow-mcp/examples/iflow-api-points.sample.json`.

Moduri:
1) **Clasic api-external**: `IFLOW_API_BEARER` + `IFLOW_API_POINTS` cu UUID-uri `/api-external/v1/<uuid>/`.
2) **Broker Django** (pagina MCP din iFlow): setez `IFLOW_MCP_INTEGRATION_UUID` + Bearer-ul din „Generează token”; pot folosi `IFLOW_API_POINTS` gol `{}`. Vezi `examples/cursor.broker.mcp.json`.

Fișiere de referință în repo-ul iflow-mcp:
- `examples/cursor.mcp.json` — Cursor (`mcpServers`)
- `examples/cursor.local-http.mcp.json` — Cursor + Django local HTTP
- `examples/claude-desktop-config.json` — Claude Desktop
- `examples/claude-code.mcp.json` — Claude Code (`.mcp.json` proiect)
- `examples/chatgpt-desktop-config.json` — ChatGPT Desktop
- `examples/gemini-cursor-config.json` — Gemini (același tip `mcpServers`)
- `examples/openai-codex-config.toml` — Codex CLI

Cerințe (configurare):
1. Întreabă-mă: calea absolută către `iflow-mcp/dist/index.js`, `IFLOW_BASE_URL` (opțional: `IFLOW_ALLOWED_HOSTS` doar dacă ai mai multe hosturi; altfel se derivă hostname-ul din URL), dacă folosesc mod broker sau api-external, și dacă vreau `IFLOW_READ_ONLY=1` (implicit `0`).
2. Generează **un singur** snippet JSON valid pentru clientul pe care îl aleg eu (Cursor sau Claude Desktop), cu `"command": "node"`, `"args": ["/cale/absolută/dist/index.js"]`, și `"env": { ... }`. Nu pune secrete în clar dacă pot folosi `${env:NUME_VAR}` (Cursor).
3. Reamintește: după modificarea Api Points în Django, actualizez `IFLOW_API_POINTS` și rulez `npm run build` în iflow-mcp dacă am schimbat codul serverului.

După ce MCP este conectat — **comportament obligatoriu** (aplică și în Cursor, Claude Desktop, ChatGPT, Claude Code, oriunde ai MCP iflow activ):

4. **Sursa de adevăr = tool-urile MCP**: la orice întrebare despre date iFlow / PromoArt (comenzi, oferte, clienți, furnizori, produse, stoc, facturi, TVA, cashflow, rapoarte, KPI, activitate, „câte / cine / ce / ultimele / arată-mi / de ce / compară / trend”), **nu inventa cifre, liste sau stări**. Apelează MCP până obții JSON real sau explici clar că apelul a eșuat.

5. **Flux virtual assistant (ordine recomandată)**:
   - Început de conversație sau „ce poți face / cum mă ajuți”: **`mcp_assistant_intro`** (opțional `topic`, `language`).
   - Obiectiv vag sau lipsesc filtre: **`mcp_clarify`** cu `objective` = textul utilizatorului; afișează în chat **întrebările structurate** returnate (id, prompt, opțiuni); apoi **`mcp_plan`** cu același `objective` + `answers` (dict JSON cu răspunsurile); execută **în ordine** pașii din `steps` (`tool`, `args`, `why`).
   - Nu știi ce câmpuri / filtre există: **`mcp_data_dictionary`** (`entity`: orders, offers, clients, products, invoices, purchases, activity).
   - Nu știi ce tool: **`mcp_query_assist`** sau **`mcp_tool_catalog`**.

6. **Cursor — regulă de proiect**: dacă workspace-ul are fișierul **`.cursor/rules/iflow-mcp-aggressive-priority.mdc`** cu `alwaysApply: true`, tratează-l ca **obligatoriu** împreună cu punctele 4–5. Dacă lipsește, spune utilizatorului să copieze **`iflow-mcp/examples/cursor-rules/iflow-mcp-aggressive-priority.mdc`** în `.cursor/rules/` la rădăcina folderului deschis în Cursor.

7. **Scrieri în baza de date** (`update_order_status`, `mark_order_*`, `add_client_note`, `add_offer_comment`): doar dacă utilizatorul cere explicit; respectă `IFLOW_READ_ONLY` și confirmările din broker.

EN (same rules for English sessions): Once MCP is connected, never fabricate iFlow business numbers—always call MCP first. Use `mcp_assistant_intro` → `mcp_clarify` → `mcp_plan` → execute `steps`; use `mcp_data_dictionary` for schema help; `mcp_query_assist` / `mcp_tool_catalog` for routing. Honor `.cursor/rules/iflow-mcp-aggressive-priority.mdc` when present.

Răspunde concis, în română sau engleză după preferința mea.
```

#### Claude Desktop
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "iflow": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "IFLOW_BASE_URL": "...",
        "IFLOW_API_BEARER": "...",
        ...
      }
    }
  }
}
```

#### Cursor / Gemini / ChatGPT
Use the provided examples in the `examples/` directory for your specific client (including [`examples/chatgpt-desktop-config.json`](examples/chatgpt-desktop-config.json) for ChatGPT Desktop).

## Tools

The MCP server exposes its tool registry over the standard `tools/list` MCP method — each tool advertises its JSON Schema, description, and required scopes there. Inspect the live list with the MCP Inspector (`npm run dev:inspect`) or any connected client.

### Local HTTP (dev only)

`IFLOW_BASE_URL` must normally use **`https://`**. For a trusted local server (e.g. `http://127.0.0.1:8000`), set **`IFLOW_ALLOW_INSECURE_HTTP=1`**. Do not use this in production.

## Security

- **HTTP transport** binds to loopback by default; terminate TLS at your reverse proxy. Prefer **IP allowlists / rate limits** at the proxy ([`ops/nginx.conf.sample`](ops/nginx.conf.sample)).
- **OAuth scopes (remote HTTP)** — when JWT verification is enabled, each tool requires scopes (e.g. `tools:erp:read` for most lookups, `tools:orders:write` for `create_order`, `tools:analytics:read` for analyst tools); `health` only needs a valid token. **`create_order`** also accepts **single-use** `tools:orders:write:elevated` together with a JWT **`jti`** (consumed once in-process; use Redis in production per Phase C). Scopes are read from the `scope` or `scp` claim (space-separated or array). **stdio** sessions do not set this context and are not scope-gated (process trust).
- **Analyst narrative language** — `analyze_*`, `diff_diagnose`, and `where_are_we_losing_money` accept optional tool input `language`: `ro` (default) or `en`.
- **Request correlation (HTTP)** — tool completion logs include `requestId` when running inside the remote transport (matches response `X-Request-Id`).
- **HTTPS** for `IFLOW_BASE_URL` by default; **`IFLOW_ALLOW_INSECURE_HTTP=1`** opts into `http://` for local dev only
- **PromoArt two-phase confirmation** — if api-external returns **`403`** with **`code: confirmation_required`**, complete the same logical Api Point with **`iflows-mcp confirm --key <IFLOW_API_POINTS key> [--token <confirm_token>]`** (sends `X-MCP-Confirm-Token`). Token也可 provided via **`IFLOW_CONFIRM_TOKEN`** environment variable to avoid CLI argument exposure. MCP tools map that error to a short user message (no token echoed). Error logs redact `details.confirm_token` / `pending_id`.
- **Host allowlist** (`IFLOW_ALLOWED_HOSTS`, optional — defaults to `IFLOW_BASE_URL` hostname) and `redirect: manual` on the HTTP client
- **Log redaction** for `Authorization` headers (pino)
- **Read-only mode** via `IFLOW_READ_ONLY=1` (disables `create_order`)
- **Idempotency-Key** header on `create_order`
- **API errors**: non-2xx responses become `IFlowHttpError` with status + body; when the backend sends K1.3-style `{ code, message }`, MCP error codes map accordingly (`NOT_FOUND` → invalid request, etc.)

## Docs

- [Cowork notes](docs/COWORK.md)
- [Examples](examples/README.md)

## License

MIT — see [LICENSE](LICENSE).
