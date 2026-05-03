import express, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { logger } from "../observability/logger.js";
import { config } from "../iflow/config.js";
import { verifyAccessToken } from "../auth/jwt.js";
import { verifyDPoP } from "../auth/dpop.js";

export function startRemoteServer(server: Server) {
  const app = express();
  let transport: SSEServerTransport | null = null;

  // Middleware for auth (Phase C)
  app.use(async (req: Request, res: Response, next: express.NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Missing or invalid Authorization header");
      }
      const token = authHeader.split(" ")[1];

      // 1. Verify Access Token
      const claims = await verifyAccessToken(token);

      // 2. Verify DPoP if required (recommended)
      const dpopHeader = req.headers.dpop as string;
      if (dpopHeader) {
        const thumbprint = await verifyDPoP(dpopHeader, req.method, req.url, token);
        if (claims.cnf?.jkt !== thumbprint) {
          throw new Error("DPoP thumbprint mismatch");
        }
      }

      // 3. BFF-only check
      if (config.IFLOW_BFF_ONLY) {
        const bffSecret = req.headers["x-bff-secret"];
        if (bffSecret !== config.IFLOW_BFF_SHARED_SECRET) {
          throw new Error("BFF-only mode enabled; invalid BFF secret");
        }
      }

      // Store claims in request for tool execution
      (req as any).auth = claims;
      next();
    } catch (error: any) {
      logger.warn({ error: error.message }, "Authentication failed");
      res.status(401).json({ error: "Unauthorized", details: error.message });
    }
  });

  app.get("/sse", async (req: Request, res: Response) => {
    logger.info("New SSE connection for remote MCP");
    transport = new SSEServerTransport("/messages", res);
    await server.connect(transport);
  });

  app.post("/messages", async (req: Request, res: Response) => {
    if (!transport) {
      return res.status(400).json({ error: "No SSE connection established" });
    }
    await transport.handlePostMessage(req, res);
  });

  // Health checks
  app.get("/healthz", (req: Request, res: Response) => res.json({ status: "ok" }));
  app.get("/readyz", (req: Request, res: Response) => res.json({ status: "ready" }));

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    logger.info(`Remote MCP server listening on port ${port}`);
  });
}
