import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

export const createStdioTransport = () => {
  return new StdioServerTransport();
};
