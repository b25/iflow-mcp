import { Tool } from "./shapes.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { mapIFlowError } from "../iflow/errors.js";
import { getMcpAuth } from "../context/mcp-auth-context.js";
import { tokenAllowsTool } from "../auth/scopes.js";
import { requiredScopesForTool } from "./tool-scopes.js";

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /** Test / dev: reset registered tools. */
  clear(): void {
    this.tools.clear();
  }

  async executeTool(name: string, args: any) {
    const tool = this.getTool(name);
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${name}`);
    }

    const auth = getMcpAuth();
    if (auth && !tokenAllowsTool(auth.scope, name, auth.jti)) {
      const needed = requiredScopesForTool(name);
      const detail =
        name === "create_order"
          ? "tools:orders:write, or single-use tools:orders:write:elevated with a JWT jti"
          : (needed?.join(" ") ?? "(see documentation)");
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Insufficient scope for tool ${name}; required: ${detail}`
      );
    }

    try {
      const parsedArgs = tool.inputSchema.safeParse(args);
      if (!parsedArgs.success) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid arguments for tool ${name}: ${parsedArgs.error.message}`
        );
      }

      return await tool.execute(parsedArgs.data);
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw mapIFlowError(error);
    }
  }
}

export const registry = new ToolRegistry();
