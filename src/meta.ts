import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function readPackageJson(): {
  name: string;
  version: string;
  description?: string;
} {
  const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "..", "package.json");
  return JSON.parse(readFileSync(pkgPath, "utf8")) as {
    name: string;
    version: string;
    description?: string;
  };
}

/** @returns true if process should exit (printed help/version). */
export function handleCliArgs(argv: string[] = process.argv): boolean {
  const args = argv.slice(2);
  if (args.includes("--version") || args.includes("-v")) {
    console.log(readPackageJson().version);
    return true;
  }
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`iflows-mcp — MCP server for iflow ERP

Usage:
  iflows-mcp                    Start server (stdio unless IFLOW_MCP_TRANSPORT=http)
  iflows-mcp confirm --key K [--token T]   Repeat GET for Api Point key K with X-MCP-Confirm-Token (two-phase / PromoArt)
  iflows-mcp confirm --key K               Token也可 from IFLOW_CONFIRM_TOKEN env var
  iflows-mcp --version, -v      Print version
  iflows-mcp --help, -h       Show this help

Environment variables: see README.md and .env.example (IFLOW_BASE_URL, IFLOW_ALLOW_INSECURE_HTTP for local http, IFLOW_API_BEARER, IFLOW_API_POINTS, …).

Scenario / planning tools (tools/list): iflow_playbook_index, product_scenarios_phase0, scenariul_1, scenariul_2.`);
    return true;
  }
  return false;
}
