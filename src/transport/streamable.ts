import { randomUUID } from "node:crypto";
import type { Server as HttpServer } from "node:http";
import type { Server as McpServer } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express, { type Express, Request, Response } from "express";
import { logger } from "../observability/logger.js";
import { runReadinessChecks } from "../observability/readiness.js";
import { config } from "../iflow/config.js";
import { verifyAccessToken, type MCPTokenClaims } from "../auth/jwt.js";
import { verifyDPoP } from "../auth/dpop.js";
import { mcpAuthContext } from "../context/mcp-auth-context.js";
import { handleDjangoBffJsonRpc } from "./django-bff-jsonrpc.js";
import { createConfiguredMcpServer } from "../mcp-server-factory.js";

type AuthedRequest = Request & { auth: MCPTokenClaims };

type SessionEntry = {
  transport: SSEServerTransport;
  server: McpServer;
};

const sseSessions = new Map<string, SessionEntry>();

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

function sessionIdFromQuery(req: Request): string {
  const raw = req.query.sessionId;
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0].trim();
  return "";
}

/** Express app for remote MCP (SSE + messages). Does not call `listen`. */
export function createRemoteMcpApp(): Express {
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
        const expected = (config.IFLOW_BFF_SHARED_SECRET ?? "").trim();
        if (!expected) {
          throw new Error("IFLOW_BFF_ONLY is enabled but IFLOW_BFF_SHARED_SECRET is not configured");
        }
        const raw = req.headers["x-bff-secret"];
        const bffSecret =
          typeof raw === "string"
            ? raw.trim()
            : Array.isArray(raw)
              ? (raw[0] ?? "").trim()
              : "";
        if (bffSecret !== expected) {
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

  /** Django BFF: JSON-RPC tools/list + tools/call on POST / (no SSE session). */
  app.post("/", requireAuth, async (req: Request, res: Response) => {
    const claims = (req as AuthedRequest).auth;
    await handleDjangoBffJsonRpc(req, res, claims);
  });

  app.get("/sse", requireAuth, async (req: Request, res: Response) => {
    const claims = (req as AuthedRequest).auth;
    await runWithMcpAuth(req, claims, async () => {
      const mcpServer = createConfiguredMcpServer();
      const transport = new SSEServerTransport("/messages", res);
      const sid = transport.sessionId;

      transport.onclose = () => {
        sseSessions.delete(sid);
        void mcpServer.close().catch((err: unknown) => {
          logger.warn({ err, sessionId: sid }, "MCP server close after SSE end");
        });
      };

      sseSessions.set(sid, { transport, server: mcpServer });
      try {
        logger.info({ sessionId: sid }, "New SSE connection for remote MCP");
        await mcpServer.connect(transport);
      } catch (err) {
        sseSessions.delete(sid);
        logger.error(err, "MCP SSE connect failed");
        if (!res.headersSent) {
          res.status(500).json({ error: "MCP connection failed" });
        }
      }
    });
  });

  app.post("/messages", requireAuth, async (req: Request, res: Response) => {
    const sid = sessionIdFromQuery(req);
    const entry = sid ? sseSessions.get(sid) : undefined;
    if (!entry) {
      res.status(400).json({ error: "Unknown or expired sessionId; open GET /sse first" });
      return;
    }
    const claims = (req as AuthedRequest).auth;
    await runWithMcpAuth(req, claims, async () => {
      await entry.transport.handlePostMessage(req, res);
    });
  });

  return app;
}

export function startRemoteServer(): HttpServer {
  const app = createRemoteMcpApp();
  const rawPort = parseInt(process.env.PORT ?? "3000", 10);
  const port = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 3000;
  const host = config.IFLOW_HTTP_BIND_HOST;
  const httpServer = app.listen(port, host, () => {
    logger.info({ port, host }, "Remote MCP server listening");
  });
  return httpServer;
}
