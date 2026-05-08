# Rotating the iflow integration bearer (Phase A)

The desktop MCP uses **`IFLOW_API_BEARER`**, which must match **`ApiPointSettings.api_key`** in Django (see `api_external`).

1. In iflow admin, open **API Point settings** and regenerate the API key / bearer.
2. Update your local secret store (shell env, 1Password field, or MCP client env block) with the new token.
3. Restart the MCP server process (or reconnect the MCP client).

**Note:** `ApiPointAccessV1View.check_auth` compares the raw Bearer string to the stored key. Until the server and MCP env both use the same new value, calls return **403**.

## Claude / Cursor

Re-run `claude mcp add` with updated `--env IFLOW_API_BEARER=...`, or edit the JSON/TOML config your client reads, then restart the IDE or reload MCP servers.

## Cowork / multi-step flows

Long-running sessions may cache tool results; after rotation, start a new session if you see persistent auth errors.
