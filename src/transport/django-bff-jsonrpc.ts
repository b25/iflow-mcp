/**
 * JSON-RPC 2.0 POST bridge for Django BFF (`mcp_broker.py`): POST to server root with
 * `tools/list` / `tools/call` without opening an SSE session (see `streamable.ts`).
 */
import type { Request, Response } from "express";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../observability/logger.js";
import { trackToolMetrics } from "../observability/metrics.js";
import { registry } from "../tools/registry.js";
import { toolInputToJsonSchema } from "../tools/tool-input-json-schema.js";
import type { MCPTokenClaims } from "../auth/jwt.js";
import { mcpAuthContext } from "../context/mcp-auth-context.js";

function structuredToRecord(data: unknown): Record<string, unknown> | undefined {
  if (data === undefined) return undefined;
  if (data !== null && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return { value: data as unknown };
}

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

function jsonRpcError(
  id: unknown,
  code: number,
  message: string,
  httpStatus: number
): { status: number; body: Record<string, unknown> } {
  return {
    status: httpStatus,
    body: { jsonrpc: "2.0", id: id ?? null, error: { code, message } },
  };
}

/**
 * Handle POST / with JSON-RPC body (Django `IFLOW_MCP_BASE_URL` + OAuth bearer).
 */
export async function handleDjangoBffJsonRpc(
  req: Request,
  res: Response,
  claims: MCPTokenClaims
): Promise<void> {
  const body = req.body as Record<string, unknown> | null | undefined;
  const id = body && "id" in body ? body.id : null;

  if (!body || typeof body !== "object") {
    const e = jsonRpcError(id, -32700, "Parse error: expected JSON object body", 400);
    res.status(e.status).json(e.body);
    return;
  }

  if (body.jsonrpc !== "2.0") {
    const e = jsonRpcError(id, -32600, "Invalid Request: jsonrpc must be 2.0", 400);
    res.status(e.status).json(e.body);
    return;
  }

  const method = typeof body.method === "string" ? body.method : "";
  const params =
    body.params !== undefined && body.params !== null && typeof body.params === "object"
      ? (body.params as Record<string, unknown>)
      : {};

  try {
    await runWithMcpAuth(req, claims, async () => {
      if (method === "tools/list") {
        const tools = registry.getAllTools().map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: toolInputToJsonSchema(tool.inputSchema),
        }));
        res.json({ jsonrpc: "2.0", id, result: { tools } });
        return;
      }

      if (method === "tools/call") {
        const name = typeof params.name === "string" ? params.name : "";
        const args =
          params.arguments !== undefined &&
          params.arguments !== null &&
          typeof params.arguments === "object"
            ? (params.arguments as Record<string, unknown>)
            : {};
        if (!name) {
          throw new McpError(ErrorCode.InvalidParams, "tools/call requires params.name");
        }
        const result = await trackToolMetrics(name, () =>
          registry.executeTool(name, args)
        );
        const structuredContent = structuredToRecord(result.structuredContent);
        res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: result.content,
            ...(structuredContent ? { structuredContent } : {}),
            isError: result.isError,
          },
        });
        return;
      }

      throw new McpError(ErrorCode.MethodNotFound, `Method not found: ${method}`);
    });
  } catch (error: unknown) {
    if (res.headersSent) {
      logger.error({ error }, "BFF JSON-RPC: response already sent");
      return;
    }
    if (error instanceof McpError) {
      res.status(200).json({
        jsonrpc: "2.0",
        id,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ error: message }, "BFF JSON-RPC handler failed");
    res.status(200).json({
      jsonrpc: "2.0",
      id,
      error: { code: ErrorCode.InternalError, message: message },
    });
  }
}
