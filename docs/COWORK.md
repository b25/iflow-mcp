# Claude Cowork + iflows-mcp

Use the **same** stdio MCP server as Claude Desktop / Claude Code:

1. Build: `npm run build`
2. Register the server in your Cowork / Claude project MCP settings with `node /absolute/path/to/iflows-mcp/dist/index.js` and the same `IFLOW_*` env vars as in [`.env.example`](../.env.example).
3. Prefer **read-only** exploration first (`IFLOW_READ_ONLY=1`) until flows are trusted.

## Multi-step automation tips

- Name tools explicitly in the task (“call `list_clients` then …”) so the planner reaches the right Api Points.
- Large lists: avoid `all_pages: true` unless needed; defaults respect `IFLOW_MAX_PAGES_PER_CALL`.
- After **bearer rotation**, restart the MCP process.

## Local files + ERP

Cowork can read local PDFs/spreadsheets while tools pull live ERP data via MCP. Keep **PII** out of prompts when possible; structured tool output may contain customer data governed by your retention policy.
