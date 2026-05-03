import { Tool } from "./shapes.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { mapIFlowError } from "../iflow/errors.js";

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

  async executeTool(name: string, args: any) {
    const tool = this.getTool(name);
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${name}`);
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
      throw mapIFlowError(error);
    }
  }
}

export const registry = new ToolRegistry();
