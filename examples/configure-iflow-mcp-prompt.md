# Prompt: configurează Cursor / Claude / ChatGPT să folosească iflow-mcp

Același text ca în [README principal](../README.md), secțiunea **Client integration** → **Assistant prompt (copy-paste)** (fenced block cu eticheta `text`, la fel ca `json` la exemplul Claude Desktop). Poți copia de acolo sau de mai jos.

Copiază blocul într-un chat **Cursor**, **Claude**, **ChatGPT** (sau alt asistent) ca să genereze configurația corectă pentru mediul tău.

---

## Prompt (copy-paste)

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

---

## Unde se salvează configurația (pe scurt)

| Client | Unde configurezi |
|--------|------------------|
| **Cursor** | `~/.cursor/mcp.json` (global) sau MCP Settings în UI; uneori `.cursor/mcp.json` în proiect — vezi documentația Cursor pentru MCP. |
| **Claude Desktop** | Fișierul `claude_desktop_config.json` (locație pe OS: documentația Anthropic). |
| **Claude Code** | `.mcp.json` în rădăcina proiectului (vezi `examples/claude-code.mcp.json`). |
| **ChatGPT Desktop** | Conectori / Developer mode — același model `mcpServers` (vezi `examples/chatgpt-desktop-config.json`). |
| **Secrets / env** | Preferă variabile de mediu în loc să comiți token-uri; aliniază cu `iflow-mcp/.env.example`. |

Detalii suplimentare: [README principal](../README.md) secțiunea *Client integration* și [README examples](./README.md).
