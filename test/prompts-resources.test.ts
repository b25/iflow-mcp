import { describe, it, expect } from "vitest";
import { createConfiguredMcpServer } from "../src/mcp-server-factory.js";

describe("MCP Prompts & Resources", () => {
  it("Lists available prompts", async () => {
    const server = createConfiguredMcpServer();
    const handler = (server as any)._requestHandlers.get("prompts/list");
    expect(handler).toBeDefined();

    const response = await handler({
      method: "prompts/list",
    });
    expect(response.prompts).toHaveLength(3);
    expect(response.prompts[0]).toMatchObject({
      name: "new-order",
      description: "Guided order creation for a client",
    });
    expect(response.prompts[1].name).toBe("daily-report");
    expect(response.prompts[2].name).toBe("find-problems");
  });

  it("Fetches specific prompts with arguments", async () => {
    const server = createConfiguredMcpServer();
    const handler = (server as any)._requestHandlers.get("prompts/get");
    expect(handler).toBeDefined();

    const responseNewOrder = await handler({
      method: "prompts/get",
      params: { name: "new-order", arguments: { clientName: "Acme Corp" } },
    });
    expect(responseNewOrder.messages[0].content.text).toContain("Acme Corp");

    const responseDailyReport = await handler({
      method: "prompts/get",
      params: { name: "daily-report", arguments: { date: "2026-06-01" } },
    });
    expect(responseDailyReport.messages[0].content.text).toContain("2026-06-01");

    const responseFindProblems = await handler({
      method: "prompts/get",
      params: { name: "find-problems" },
    });
    expect(responseFindProblems.messages[0].content.text).toContain("losing money");
  });

  it("Lists available resources and templates", async () => {
    const server = createConfiguredMcpServer();

    const resourcesHandler = (server as any)._requestHandlers.get("resources/list");
    expect(resourcesHandler).toBeDefined();
    const resResponse = await resourcesHandler({
      method: "resources/list",
    });
    expect(resResponse.resources).toHaveLength(2);
    expect(resResponse.resources[0].uri).toBe("iflow://clients/info");

    const templatesHandler = (server as any)._requestHandlers.get(
      "resources/templates/list"
    );
    expect(templatesHandler).toBeDefined();
    const tempResponse = await templatesHandler({
      method: "resources/templates/list",
    });
    expect(tempResponse.resourceTemplates).toHaveLength(3);
    expect(tempResponse.resourceTemplates[0].uriTemplate).toBe("iflow://clients/{uuid}");
  });
});
