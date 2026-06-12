# Prompt: configurează Cursor / Claude / ChatGPT să folosească iflows-mcp

Textul de mai jos este **în sync** cu [README principal](../README.md), secțiunea **Client integration** → **Assistant prompt (copy-paste)**. Include atât configurarea MCP, cât și **comportamentul după conectare** (MCP prioritar, flux assistant, Cursor Rules). Poți copia de aici sau din README.

Copiază blocul într-un chat **Cursor**, **Claude**, **ChatGPT** (sau alt asistent) ca să genereze configurația corectă pentru mediul tău.

---

## Prompt (copy-paste)

```text
Ești un asistent care mă ajută să conectez serverul MCP **iflows-mcp** (iFlow ERP) la editorul meu sau la Claude Desktop.

Context tehnic:
- iflows-mcp este un server Node (>=20); binarul rulează cu `node <cale>/dist/index.js` sau comanda `iflows-mcp` după `npm run build`.
- Variabilele obligatorii sunt documentate în `iflows-mcp/.env.example`.
- Maparea tool → UUID în Django: fie **Api Points** de tip IFLOW_MCP cu cheia logică egală cu cheia din JSON, fie câmpul `IFLOW_API_POINTS` (JSON) care mapează fiecare cheie la `path_uuid`-ul din Api Point. Șablon: `iflows-mcp/examples/iflow-api-points.sample.json`.

Moduri:
1) **Clasic api-external**: `IFLOW_API_BEARER` + `IFLOW_API_POINTS` cu UUID-uri `/api-external/v1/<uuid>/`.
2) **Broker Django** (pagina MCP din iFlow): setez `IFLOW_MCP_INTEGRATION_UUID` + Bearer-ul din „Generează token”; pot folosi `IFLOW_API_POINTS` gol `{}`. Vezi `examples/cursor.broker.mcp.json`.

Fișiere de referință în repo-ul iflows-mcp:
- `examples/cursor.mcp.json` — Cursor (`mcpServers`)
- `examples/cursor.local-http.mcp.json` — Cursor + Django local HTTP
- `examples/claude-desktop-config.json` — Claude Desktop
- `examples/claude-code.mcp.json` — Claude Code (`.mcp.json` proiect)
- `examples/chatgpt-desktop-config.json` — ChatGPT Desktop
- `examples/gemini-cursor-config.json` — Gemini (același tip `mcpServers`)
- `examples/openai-codex-config.toml` — Codex CLI

Cerințe (configurare):
1. Întreabă-mă: calea absolută către `iflows-mcp/dist/index.js`, `IFLOW_BASE_URL` (opțional `IFLOW_ALLOWED_HOSTS` dacă ai mai multe hosturi; altfel se derivă hostname-ul din URL), dacă folosesc mod broker sau api-external, și dacă vreau `IFLOW_READ_ONLY=1` (implicit `0`).
2. Generează **un singur** snippet JSON valid pentru clientul pe care îl aleg eu (Cursor sau Claude Desktop), cu `"command": "node"`, `"args": ["/cale/absolută/dist/index.js"]`, și `"env": { ... }`. Nu pune secrete în clar dacă pot folosi `${env:NUME_VAR}` (Cursor).
3. Reamintește: după modificarea Api Points în Django, actualizez `IFLOW_API_POINTS` și rulez `npm run build` în iflows-mcp dacă am schimbat codul serverului.

După ce MCP este conectat — **comportament obligatoriu** (aplică și în Cursor, Claude Desktop, ChatGPT, Claude Code, oriunde ai MCP iflow activ):

4. **Sursa de adevăr = tool-urile MCP**: la orice întrebare despre date iFlow / PromoArt (comenzi, oferte, clienți, furnizori, produse, stoc, facturi, TVA, cashflow, rapoarte, KPI, activitate, „câte / cine / ce / ultimele / arată-mi / de ce / compară / trend”), **nu inventa cifre, liste sau stări**. Apelează MCP până obții JSON real sau explici clar că apelul a eșuat.

5. **Flux virtual assistant (ordine recomandată)**:
   - Început de conversație sau „ce poți face / cum mă ajuți”: **`mcp_assistant_intro`** (opțional `topic`, `language`).
   - Obiectiv vag sau lipsesc filtre: **`mcp_clarify`** cu `objective` = textul utilizatorului; afișează în chat **întrebările structurate** returnate (id, prompt, opțiuni); apoi **`mcp_plan`** cu același `objective` + `answers` (dict JSON cu răspunsurile); execută **în ordine** pașii din `steps` (`tool`, `args`, `why`).
   - Nu știi ce câmpuri / filtre există: **`mcp_data_dictionary`** (`entity`: orders, offers, clients, products, invoices, purchases, activity).
   - Nu știi ce tool: **`mcp_query_assist`** sau **`mcp_tool_catalog`**.

6. **Cursor — regulă de proiect**: dacă workspace-ul are fișierul **`.cursor/rules/iflows-mcp-aggressive-priority.mdc`** cu `alwaysApply: true`, tratează-l ca **obligatoriu** împreună cu punctele 4–5. Dacă lipsește, spune utilizatorului să copieze **`iflows-mcp/examples/cursor-rules/iflows-mcp-aggressive-priority.mdc`** în `.cursor/rules/` la rădăcina folderului deschis în Cursor.

7. **Scrieri în baza de date** (`update_order_status`, `mark_order_*`, `add_client_note`, `add_offer_comment`): doar dacă utilizatorul cere explicit; respectă `IFLOW_READ_ONLY` și confirmările din broker.

EN (same rules for English sessions): Once MCP is connected, never fabricate iFlow business numbers—always call MCP first. Use `mcp_assistant_intro` → `mcp_clarify` → `mcp_plan` → execute `steps`; use `mcp_data_dictionary` for schema help; `mcp_query_assist` / `mcp_tool_catalog` for routing. Honor `.cursor/rules/iflows-mcp-aggressive-priority.mdc` when present.

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
| **Secrets / env** | Preferă variabile de mediu în loc să comiți token-uri; aliniază cu `iflows-mcp/.env.example`. |

Detalii suplimentare: [README principal](../README.md) secțiunea *Client integration* și [README examples](./README.md).
