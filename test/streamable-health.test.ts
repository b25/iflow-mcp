import { describe, it, expect } from "vitest";
import type { Server as HttpServer } from "node:http";
import { createRemoteMcpApp } from "../src/transport/streamable.js";

function listen(app: ReturnType<typeof createRemoteMcpApp>): Promise<HttpServer> {
  return new Promise((resolve, reject) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
    s.once("error", reject);
  });
}

async function closeServer(s: HttpServer): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    s.close((err) => (err ? reject(err) : resolve()));
  });
}

describe("createRemoteMcpApp", () => {
  it("GET /healthz and /readyz succeed without Authorization", async () => {
    const app = createRemoteMcpApp();
    const httpServer = await listen(app);
    try {
      const addr = httpServer.address();
      if (addr === null || typeof addr === "string") {
        throw new Error("expected TCP address");
      }
      const base = `http://127.0.0.1:${addr.port}`;

      const health = await fetch(`${base}/healthz`, {
        headers: { "X-Request-Id": "probe-req-1" },
      });
      expect(health.status).toBe(200);
      expect(health.headers.get("x-request-id")).toBe("probe-req-1");
      expect(await health.json()).toEqual({ status: "ok" });

      const healthNoId = await fetch(`${base}/healthz`);
      expect(healthNoId.headers.get("x-request-id")).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );

      const ready = await fetch(`${base}/readyz`);
      expect(ready.status).toBe(200);
      const readyBody = (await ready.json()) as { status: string; checks: Record<string, string> };
      expect(readyBody.status).toBe("ready");
      expect(readyBody.checks).toMatchObject({
        config: "ok",
        oauth: "not_configured",
        transport: "stdio",
      });
    } finally {
      await closeServer(httpServer);
    }
  });

  it("GET /sse without Authorization returns 401", async () => {
    const app = createRemoteMcpApp();
    const httpServer = await listen(app);
    try {
      const addr = httpServer.address();
      if (addr === null || typeof addr === "string") {
        throw new Error("expected TCP address");
      }
      const res = await fetch(`http://127.0.0.1:${addr.port}/sse`);
      expect(res.status).toBe(401);
    } finally {
      await closeServer(httpServer);
    }
  });

  it("POST / without Authorization returns 401", async () => {
    const app = createRemoteMcpApp();
    const httpServer = await listen(app);
    try {
      const addr = httpServer.address();
      if (addr === null || typeof addr === "string") {
        throw new Error("expected TCP address");
      }
      const res = await fetch(`http://127.0.0.1:${addr.port}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
      });
      expect(res.status).toBe(401);
    } finally {
      await closeServer(httpServer);
    }
  });
});
