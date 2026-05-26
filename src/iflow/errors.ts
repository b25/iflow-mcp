import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { IFlowHttpError } from "./client.js";

export interface IFlowError {
  code: string;
  message: string;
  details?: unknown;
}

function bodyHasCodeMessage(
  body: unknown
): body is { code: string; message: string; details?: unknown } {
  return (
    !!body &&
    typeof body === "object" &&
    "code" in body &&
    "message" in body &&
    typeof (body as { code: unknown }).code === "string" &&
    typeof (body as { message: unknown }).message === "string"
  );
}

export function mapIFlowError(error: unknown): McpError {
  if (error instanceof Error && error.name === "AbortError") {
    return new McpError(ErrorCode.InternalError, "Request timeout");
  }

  if (error instanceof IFlowHttpError) {
    if (bodyHasCodeMessage(error.body)) {
      switch (error.body.code) {
        case "confirmation_required":
          return new McpError(
            ErrorCode.InvalidRequest,
            `${error.body.message} Two-phase confirmation: run \`iflow-mcp confirm --key <IFLOW_API_POINTS key> [--token <confirm_token>] or set IFLOW_CONFIRM_TOKEN\` (same key as the tool call).`
          );
        case "invalid_mcp_confirm_token":
        case "mcp_endpoint_disabled":
          return new McpError(ErrorCode.InvalidRequest, error.body.message);
        case "NOT_FOUND":
          return new McpError(ErrorCode.InvalidRequest, error.body.message);
        case "PERMISSION_DENIED":
          return new McpError(ErrorCode.InvalidRequest, "Permission denied");
        default:
          return new McpError(ErrorCode.InternalError, error.body.message);
      }
    }
    if (error.status === 404) {
      return new McpError(ErrorCode.InvalidRequest, error.message);
    }
    if (error.status >= 400 && error.status < 500) {
      return new McpError(ErrorCode.InvalidRequest, error.message);
    }
    return new McpError(ErrorCode.InternalError, error.message);
  }

  const iflowError = error as IFlowError;
  if (iflowError?.code && iflowError?.message) {
    switch (iflowError.code) {
      case "NOT_FOUND":
        return new McpError(ErrorCode.InvalidRequest, iflowError.message);
      case "PERMISSION_DENIED":
        return new McpError(ErrorCode.InvalidRequest, "Permission denied");
      default:
        return new McpError(ErrorCode.InternalError, iflowError.message);
    }
  }

  const msg = error instanceof Error ? error.message : "Unknown error";
  return new McpError(ErrorCode.InternalError, msg);
}
