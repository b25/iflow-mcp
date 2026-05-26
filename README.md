# iflow-mcp

Model Context Protocol (MCP) server for iFlow ERP.

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
# MCP "command" can be: iflow-mcp (stdio; same as node dist/index.js)
```

CLI flags (no `IFLOW_*` env required):

- `iflow-mcp --version` / `-v` — print package version
- `iflow-mcp --help` / `-h` — short usage

### Remote HTTP transport (optional)

Set **`IFLOW_MCP_TRANSPORT=http`** to serve MCP over SSE instead of **stdio** (the default). The HTTP server listens when `IFLOW_MCP_TRANSPORT=http` (default port from `PORT` or `3000`). **Remote mode defaults to `IFLOW_READ_ONLY=1`** until you set `IFLOW_READ_ONLY=0` explicitly. The process listens on **`IFLOW_HTTP_BIND_HOST`** (default **`127.0.0.1`**; use **`0.0.0.0`** in Docker). Responses include **`X-Request-Id`** (echoed from the incoming header or generated). **`GET /healthz`** (liveness) is unauthenticated. **`GET /readyz`** is unauthenticated but returns **503** when `IFLOW_MCP_TRANSPORT=http` and the full OAuth trio (`IFLOW_OAUTH_ISSUER`, `IFLOW_OAUTH_JWKS_URL`, `IFLOW_MCP_AUDIENCE`) is missing, when OAuth is only partly set, or when all three are set but the JWKS URL is unreachable or not a valid JWKS document. Use **`/healthz`** for minimal container probes if you have not configured OAuth yet.

**SSE sessions:** each **`GET /sse`** connection creates an isolated MCP server instance. The SSE endpoint returns a URL for **`POST /messages`** that includes a **`sessionId`** query parameter; clients must post JSON-RPC to that URL (same Bearer token) so messages reach the correct session.

**`GET /sse`** and **`POST /messages`** require a Bearer token and JWT verification (desktop-style MCP over SSE). **`POST /`** accepts the same auth and serves **stateless JSON-RPC** `tools/list` and `tools/call` for the Django BFF (`iflow01` `mcp_broker.py` posting to `IFLOW_MCP_BASE_URL` without opening an SSE session). Sample proxy and Compose files: [`ops/nginx.conf.sample`](ops/nginx.conf.sample), [`ops/compose.sample.yml`](ops/compose.sample.yml). See [`.plans/phase-b-remote-mcp.md`](.plans/phase-b-remote-mcp.md).

**Optional tool-name contract check** (after `npm run build`): `IFLOW01_ROOT=/path/to/iflow01 npm run check:mcp-contract` ensures every Django MCP registry key is implemented in TS (extra TS-only tools such as `health` are allowed). Keys are read from `myintranet/scripts/dump_mcp_builtin_registry_keys.py` in the Django tree when present (no Django install); otherwise the script falls back to `get_merged_registry()`. Django logical endpoints `diff_diagnose_metric` / `diff_diagnose_events` are accepted when the composite TS tool `diff_diagnose` is registered. GitHub Actions on the Django repo runs this against `b25/iflow-mcp` (override with repository variable `IFLOW_MCP_CONTRACT_REPO`).

### 3. Configuration
Copy `.env.example` to `.env` and fill in your credentials.
The server uses environment variables for configuration.

**Django MCP broker (token from `/integrations/mcp/settings/`):** set `IFLOW_MCP_INTEGRATION_UUID` to the CompanyIntegrations `integration_uuid` (shown on that page). Use the opaque Bearer from **Generează token** as `IFLOW_API_BEARER`. HTTP calls then go to `GET|POST {IFLOW_BASE_URL}/v1/<uuid>/<logical_endpoint>/` instead of `/api-external/v1/<uuid>/`. You can set `IFLOW_API_POINTS` to `{}` in broker mode. Cursor sample: [`examples/cursor.broker.mcp.json`](examples/cursor.broker.mcp.json).

### 4. Tool schemas

`tools/list` exposes **JSON Schema** for each tool’s inputs (from Zod via `zod-to-json-schema`), so clients can validate arguments before calling iflow.

### 5. Client integration

**Where to configure:** secrets and URLs go in **`.env`** (see [`.env.example`](.env.example)). Each MCP client uses a **`mcpServers`** block: `command` + `args` pointing at `dist/index.js`, plus the same variables under `env`. Tool → UUID mapping is **`IFLOW_API_POINTS`** JSON aligned with Django **Api Points** — template [`examples/iflow-api-points.sample.json`](examples/iflow-api-points.sample.json). Snippet index: [`examples/README.md`](examples/README.md).

**Prompt for Cursor / Claude / ChatGPT:** copy the block below (same idea as the JSON snippets — one fenced block to grab). Extended notes and the *where to save* table: **[`examples/configure-iflow-mcp-prompt.md`](examples/configure-iflow-mcp-prompt.md)**.

#### Assistant prompt (copy-paste)

```text
Ești un asistent care mă ajută să conectez serverul MCP **iflow-mcp** (iFlow ERP) la editorul meu sau la Claude Desktop.

Context tehnic:
- iflow-mcp este un server Node (>=20); binarul rulează cu `node <cale>/dist/index.js` sau comanda `iflow-mcp` după `npm run build`.
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

Cerințe:
1. Întreabă-mă: calea absolută către `iflow-mcp/dist/index.js`, `IFLOW_BASE_URL` (doar hostul pentru `IFLOW_ALLOWED_HOSTS`), dacă folosesc mod broker sau api-external, și dacă vreau `IFLOW_READ_ONLY=1`.
2. Generează **un singur** snippet JSON valid pentru clientul pe care îl aleg eu (Cursor sau Claude Desktop), cu `"command": "node"`, `"args": ["/cale/absolută/dist/index.js"]`, și `"env": { ... }`. Nu pune secrete în clar dacă pot folosi `${env:NUME_VAR}` (Cursor).
3. Reamintește: după modificarea Api Points în Django, actualizez `IFLOW_API_POINTS` și rulez `npm run build` în iflow-mcp dacă am schimbat codul serverului.

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

## Tools (Phase A registry)

Lookup / operations (each needs a matching UUID in `IFLOW_API_POINTS` — see `examples/iflow-api-points.sample.json`):

- Clients: `list_clients`, `get_client`
- Products: `list_products`, `get_product`, `get_stock`
- Orders: `count_orders_in_progress`, `list_orders_to_invoice`, `oldest_unfinished_order`, `create_order` (POST; needs `IFLOW_READ_ONLY=0`)
- Finance: `vat_estimate`, `supplier_payments_due`, `top_products_by_margin`
- Partners / AR: `list_partners`, `list_overdue_customers`
- Offers: `latest_offer_for_client`
- Ops: `lost_offers_breakdown`, `top_agents`, `procurement_today`, `orders_by_stage`, `order_delay_diagnosis`, `list_work_flows`, `list_flow_stages`, `list_user_departments`, `orders_flow_stage_report`, `order_processing_history`, `hours_worked_per_employee`, `daily_activity_summary`, `cashflow_summary`
- Analyst (requires backend endpoints): `analyze_*`, `where_are_we_losing_money`, `diff_diagnose` — **statistical hygiene** (samples with n under 10 down-ranked, narrative max 5 findings; default Romanian text, optional input `language: en`); see [`.plans/product-scenarios.md`](.plans/product-scenarios.md) section D5.
- `health` — configured keys + read-only flag (no secrets)
- `iflow_playbook_index` — lists scenario tools (`product_scenarios_phase0`, `scenariul_1`, `scenariul_2`, `health`) and `.plans/` doc paths (no network)
- `product_scenarios_phase0` — maps the [35 Phase 0 questions](.plans/product-scenarios.md) (section B1) to registered MCP tools (no network; for coverage tracking)
- `scenariul_1` — [Scenario 1](.plans/Scenariul_1.txt) „Unde pierdem bani?”: `action=playbook` returns the 8 perspectives + endpoint design notes; `analyze_all` runs `where_are_we_losing_money`; `analyze_perspective=1..8` runs the matching `analyze_*` tool (needs Api Points + scopes)
- `scenariul_2` — [Scenario 2](.plans/Scenariul_2.txt) „De ce nu mai merge ca înainte?”: `action=playbook` returns baseline methods, monitoring dimensions, causal categories (A–F), narrative rules, K4 endpoint notes; `action=diagnose` forwards to `diff_diagnose` (`metric`, optional `entity_id`, `interval`, `baseline`)

### Django api-external: `IFLOW_MCP` aggregate points (work03)

For tools that are not plain **Clients / Products / Orders** list endpoints, the iFlow backend can expose **`GET /api-external/v1/<uuid>/`** via Api Point type **iflow MCP** (`IFLOW_MCP`): set **Endpoint MCP iflow** to the same logical key as in `IFLOW_API_POINTS` (e.g. `vat_estimate`, `diff_diagnose_metric`). Plain CRUD-style points stay on types **Clienti**, **Produse**, **Comenzi** as before.

### Local HTTP (dev only)

`IFLOW_BASE_URL` must normally use **`https://`**. For a trusted local server (e.g. `http://127.0.0.1:8000`), set **`IFLOW_ALLOW_INSECURE_HTTP=1`**. Do not use this in production.

## Security

- **HTTP transport** binds to loopback by default; terminate TLS at your reverse proxy. Prefer **IP allowlists / rate limits** at the proxy ([`ops/nginx.conf.sample`](ops/nginx.conf.sample)).
- **OAuth scopes (remote HTTP)** — when JWT verification is enabled, each tool requires scopes per [`.plans/architecture.md`](.plans/architecture.md) section C2: e.g. `tools:erp:read` for most lookups, `tools:orders:write` for `create_order`, `tools:analytics:read` for analyst tools; `health` only needs a valid token. **`create_order`** also accepts **single-use** `tools:orders:write:elevated` together with a JWT **`jti`** (consumed once in-process; use Redis in production per Phase C). Scopes are read from the `scope` or `scp` claim (space-separated or array). **stdio** sessions do not set this context and are not scope-gated (process trust).
- **Analyst narrative language** — `analyze_*`, `diff_diagnose`, and `where_are_we_losing_money` accept optional tool input `language`: `ro` (default) or `en`.
- **Request correlation (HTTP)** — tool completion logs include `requestId` when running inside the remote transport (matches response `X-Request-Id`).
- **HTTPS** for `IFLOW_BASE_URL` by default; **`IFLOW_ALLOW_INSECURE_HTTP=1`** opts into `http://` for local dev only
- **PromoArt two-phase confirmation** — if api-external returns **`403`** with **`code: confirmation_required`**, complete the same logical Api Point with **`iflow-mcp confirm --key <IFLOW_API_POINTS key> [--token <confirm_token>]`** (sends `X-MCP-Confirm-Token`). Token也可 provided via **`IFLOW_CONFIRM_TOKEN`** environment variable to avoid CLI argument exposure. MCP tools map that error to a short user message (no token echoed). Error logs redact `details.confirm_token` / `pending_id`.
- **Host allowlist** (`IFLOW_ALLOWED_HOSTS`) and `redirect: manual` on the HTTP client
- **Log redaction** for `Authorization` headers (pino)
- **Read-only mode** via `IFLOW_READ_ONLY=1` (disables `create_order`)
- **Idempotency-Key** header on `create_order`
- **API errors**: non-2xx responses become `IFlowHttpError` with status + body; when the backend sends K1.3-style `{ code, message }`, MCP error codes map accordingly (`NOT_FOUND` → invalid request, etc.)

See [`.plans/phase-a-desktop-mcp.md`](.plans/phase-a-desktop-mcp.md) and [`ROTATION.md`](ROTATION.md).

## Docs

- [Cowork notes](docs/COWORK.md)
- [Examples](examples/README.md)

## License

MIT — see [LICENSE](LICENSE).
