import { randomUUID } from "node:crypto";
import type { Server as HttpServer } from "node:http";
import express, { type Express, Request, Response } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { logger } from "../observability/logger.js";
import { runReadinessChecks } from "../observability/readiness.js";
import { config } from "../iflow/config.js";
import { verifyAccessToken, type MCPTokenClaims } from "../auth/jwt.js";
import { verifyDPoP } from "../auth/dpop.js";
import { mcpAuthContext } from "../context/mcp-auth-context.js";

type AuthedRequest = Request & { auth: MCPTokenClaims };

function runWithMcpAuth(
  req: Request,
  claims: MCPTokenClaims,
  fn: () => Promise<void>
): Promise<void> {
  const requestId = (req as Request & { requestId?: string }).requestId;
  return mcpAuthContext.run(
    {
      scope: claims.scope,
      jti: typeof claims.jti === "string" ? claims.jti : undefined,
      requestId,
    },
    fn
  );
}

/** Express app for remote MCP (SSE + messages). Does not call `listen`. */
export function createRemoteMcpApp(server: Server): Express {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((req: Request, res: Response, next: express.NextFunction) => {
    const incoming = req.headers["x-request-id"];
    const id =
      typeof incoming === "string" && incoming.trim().length > 0
        ? incoming.trim()
        : randomUUID();
    res.setHeader("X-Request-Id", id);
    (req as Request & { requestId: string }).requestId = id;
    next();
  });
  app.use(express.json({ limit: "4mb" }));

  app.get("/healthz", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });
  app.get("/readyz", async (_req: Request, res: Response) => {
    const { ready, checks } = await runReadinessChecks();
    if (!ready) {
      res.status(503).json({ status: "not_ready", checks });
      return;
    }
    res.json({ status: "ready", checks });
  });

  let transport: SSEServerTransport | null = null;

  async function requireAuth(
    req: Request,
    res: Response,
    next: express.NextFunction
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Missing or invalid Authorization header");
      }
      const token = authHeader.split(" ")[1];

      const claims = await verifyAccessToken(token);

      const dpopHeader = req.headers.dpop as string | undefined;
      if (dpopHeader) {
        const thumbprint = await verifyDPoP(dpopHeader, req.method, req.url, token);
        if (claims.cnf?.jkt !== thumbprint) {
          throw new Error("DPoP thumbprint mismatch");
        }
      }

      if (config.IFLOW_BFF_ONLY) {
        const bffSecret = req.headers["x-bff-secret"];
        if (bffSecret !== config.IFLOW_BFF_SHARED_SECRET) {
          throw new Error("BFF-only mode enabled; invalid BFF secret");
        }
      }

      (req as express.Request & { auth?: unknown }).auth = claims;
      next();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn({ error: message }, "Authentication failed");
      res.status(401).json({ error: "Unauthorized", details: message });
    }
  }

  app.get("/sse", requireAuth, async (req: Request, res: Response) => {
    const claims = (req as AuthedRequest).auth;
    await runWithMcpAuth(req, claims, async () => {
      logger.info("New SSE connection for remote MCP");
      transport = new SSEServerTransport("/messages", res);
      await server.connect(transport);
    });
  });

  app.post("/messages", requireAuth, async (req: Request, res: Response) => {
    const activeTransport = transport;
    if (!activeTransport) {
      res.status(400).json({ error: "No SSE connection established" });
      return;
    }
    const claims = (req as AuthedRequest).auth;
    await runWithMcpAuth(req, claims, async () => {
      await activeTransport.handlePostMessage(req, res);
    });
  });

  return app;
}

export function startRemoteServer(server: Server): HttpServer {
  const app = createRemoteMcpApp(server);
  const rawPort = parseInt(process.env.PORT ?? "3000", 10);
  const port = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 3000;
  const host = config.IFLOW_HTTP_BIND_HOST;
  const httpServer = app.listen(port, host, () => {
    logger.info({ port, host }, "Remote MCP server listening");
  });
  return httpServer;
}
