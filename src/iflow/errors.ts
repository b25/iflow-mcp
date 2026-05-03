import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

export interface IFlowError {
  code: string;
  message: string;
  details?: any;
}

export function mapIFlowError(error: any): McpError {
  if (error instanceof Error && error.name === "AbortError") {
    return new McpError(ErrorCode.InternalError, "Request timeout");
  }

  // Handle mapped error from K1.3
  const iflowError = error as IFlowError;
  if (iflowError.code && iflowError.message) {
    switch (iflowError.code) {
      case "NOT_FOUND":
        return new McpError(ErrorCode.InvalidRequest, iflowError.message);
      case "PERMISSION_DENIED":
        return new McpError(ErrorCode.InvalidRequest, "Permission denied");
      default:
        return new McpError(ErrorCode.InternalError, iflowError.message);
    }
  }

  return new McpError(ErrorCode.InternalError, error.message || "Unknown error");
}
