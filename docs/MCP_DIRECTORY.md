# MCP Directory submission (checklist)

When ready for public listing (per Phase A plan):

1. Confirm **MIT license** and repo visibility match your org policy.
2. Gather **server metadata**: name `iflows-mcp`, one-line description, link to this repo, support contact.
3. Complete the **Anthropic MCP Directory** (or successor) submission form with:
   - Transport: **stdio**
   - Install: `npm install && npm run build`, then `node dist/index.js` with documented `IFLOW_*` env vars
   - Security notes: HTTPS + allowlist + no AI keys on our side (BYOK for end users)
4. Attach or link **README** quick start and `examples/` configs.

Re-check the live directory requirements before submitting; forms change over time.
