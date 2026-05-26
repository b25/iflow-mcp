# MCP client examples

CI runs `npm run validate:examples` to ensure every `*.json` file here parses.

**Prompt pentru configurare (Cursor, Claude, ChatGPT):** textul copy-paste este în [README](../README.md) la *Client integration* → *Assistant prompt (copy-paste)* (fenced ca la JSON, etichetă `text`). Pentru tabelul „unde salvez”: [`configure-iflow-mcp-prompt.md`](./configure-iflow-mcp-prompt.md).

- [`iflow-api-points.sample.json`](./iflow-api-points.sample.json) — template for **`IFLOW_API_POINTS`**: one UUID per registered tool key. Replace every value with the real `path_uuid` from iflow **Api Points** admin.
- [`claude-desktop-config.json`](./claude-desktop-config.json) — `mcpServers` snippet.
- [`chatgpt-desktop-config.json`](./chatgpt-desktop-config.json) — same `mcpServers` shape for ChatGPT Desktop (Developer Mode / connectors); confirm the live app expects this path — UI labels change, stdio + `env` is the same idea.
- [`claude-code.mcp.json`](./claude-code.mcp.json) — project `.mcp.json` shape (Claude Code CLI).
- [`cursor.local-http.mcp.json`](./cursor.local-http.mcp.json) — Cursor snippet for **local Django over HTTP** (`IFLOW_ALLOW_INSECURE_HTTP=1`, `localhost`).
- [`openai-codex-config.toml`](./openai-codex-config.toml) — Codex CLI TOML.
- [`gemini-cursor-config.json`](./gemini-cursor-config.json) — same top-level `mcpServers` shape as Cursor / Claude Desktop (Gemini CLI where supported).

Cowork and Claude Code use the same stdio + env pattern as Claude Desktop; point `command` at your built `dist/index.js`.
