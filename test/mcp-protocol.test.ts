import { describe, it, expect, vi, afterEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { createConfiguredMcpServer } from "../src/mcp-server-factory.js";
import { registerAllTools } from "../src/tools/index.js";

// Custom in-memory W3C WAI duplex transport pair to link client & server directly
function createMockTransportPair(): [Transport, Transport] {
  let clientOnMessage: ((message: JSONRPCMessage) => void) | undefined;
  let serverOnMessage: ((message: JSONRPCMessage) => void) | undefined;
  let clientOnClose: (() => void) | undefined;
  let serverOnClose: (() => void) | undefined;

  const clientTransport: Transport = {
    start: async () => {},
    send: async (message) => {
      if (serverOnMessage) {
        setTimeout(() => serverOnMessage?.(message), 0);
      }
    },
    close: async () => {
      if (clientOnClose) clientOnClose();
      if (serverOnClose) serverOnClose();
    },
    set onmessage(cb) {
      clientOnMessage = cb;
    },
    set onclose(cb) {
      clientOnClose = cb;
    },
  };

  const serverTransport: Transport = {
    start: async () => {},
    send: async (message) => {
      if (clientOnMessage) {
        setTimeout(() => clientOnMessage?.(message), 0);
      }
    },
    close: async () => {
      if (clientOnClose) clientOnClose();
      if (serverOnClose) serverOnClose();
    },
    set onmessage(cb) {
      serverOnMessage = cb;
    },
    set onclose(cb) {
      serverOnClose = cb;
    },
  };

  return [clientTransport, serverTransport];
}

describe("End-to-End MCP Protocol (M19)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("successfully connects standard Client to Server, lists tools, prompts, and resources", async () => {
    // 1. Initialize Server & Register Tools
    const server = createConfiguredMcpServer();
    registerAllTools();

    // 2. Initialize Client
    const client = new Client(
      {
        name: "test-mcp-client",
        version: "1.0.0",
      },
      {
        capabilities: {
          prompts: {},
          resources: {},
        },
      }
    );

    // 3. Create Transport Pair and Connect
    const [clientTransport, serverTransport] = createMockTransportPair();

    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);

    try {
      // 4. Test listTools capability
      const toolsResult = await client.listTools();
      expect(toolsResult.tools).toBeDefined();
      const toolNames = toolsResult.tools.map((t) => t.name);
      expect(toolNames).toContain("list_clients");
      expect(toolNames).toContain("list_orders");

      // 5. Test listPrompts capability
      const promptsResult = await client.listPrompts();
      expect(promptsResult.prompts).toBeDefined();
      const promptNames = promptsResult.prompts.map((p) => p.name);
      expect(promptNames).toContain("new-order");
      expect(promptNames).toContain("daily-report");

      // 6. Test listResources capability
      const resourcesResult = await client.listResources();
      expect(resourcesResult.resources).toBeDefined();

      // 7. Mock fetch responses for outbound ERP calls when calling a tool
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ results: [], count: 0 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      // 8. Test callTool execution
      const callResult = await client.callTool({
        name: "list_clients",
        arguments: { limit: 10 },
      });
      expect(callResult.content).toBeDefined();
      expect(callResult.content[0].type).toBe("text");
      expect(callResult.content[0].text).toContain("Found 0 client(s).");
    } finally {
      // 9. Teardown
      await Promise.all([client.close(), server.close()]);
    }
  });
});
