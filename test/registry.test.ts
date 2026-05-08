import { describe, it, expect, beforeEach } from "vitest";
import { McpError } from "@modelcontextprotocol/sdk/types.js";
import { registerAllTools } from "../src/tools/index.js";
import { registry } from "../src/tools/registry.js";
import { REQUIRED_IFLOW_API_POINT_KEYS } from "../src/tools/required-keys-list.js";
import { mcpAuthContext } from "../src/context/mcp-auth-context.js";

describe("tool registry", () => {
  beforeEach(() => {
    registry.clear();
    registerAllTools();
  });

  it("registers all tools including health", () => {
    const tools = registry.getAllTools();
    expect(tools.length).toBeGreaterThanOrEqual(REQUIRED_IFLOW_API_POINT_KEYS.length);
    expect(registry.getTool("health")).toBeDefined();
    expect(registry.getTool("list_clients")).toBeDefined();
    expect(registry.getTool("create_order")).toBeDefined();
  });

  it("exposes JSON-serializable inputSchema for list_clients", () => {
    const tool = registry.getTool("list_clients");
    expect(tool).toBeDefined();
    const parsed = tool!.inputSchema.safeParse({ all_pages: true });
    expect(parsed.success).toBe(true);
  });

  it("does not enforce OAuth scopes outside HTTP auth context (stdio)", async () => {
    const out = await registry.executeTool("health", {});
    expect(out.isError).not.toBe(true);
  });

  it("allows health with empty scope when auth context is set", async () => {
    await mcpAuthContext.run({ scope: "" }, async () => {
      const out = await registry.executeTool("health", {});
      expect(out.isError).not.toBe(true);
    });
  });

  it("rejects list_clients when auth context lacks tools:erp:read", async () => {
    await expect(
      mcpAuthContext.run({ scope: "" }, () =>
        registry.executeTool("list_clients", { all_pages: false })
      )
    ).rejects.toThrow(McpError);
  });

  it("rejects create_order when auth context lacks tools:orders:write", async () => {
    await expect(
      mcpAuthContext.run({ scope: "tools:erp:read" }, () =>
        registry.executeTool("create_order", {
          client_uuid: "00000000-0000-4000-8000-000000000001",
          items: [
            {
              product_uuid: "00000000-0000-4000-8000-000000000002",
              quantity: 1,
            },
          ],
          idempotency_key: "test-key-12345678",
        })
      )
    ).rejects.toThrow(McpError);
  });
});
