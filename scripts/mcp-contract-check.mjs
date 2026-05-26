#!/usr/bin/env node
/**
 * Cross-repo check: every Django MCP registry key must exist in iflow-mcp (TS may define extra tools).
 *
 * Usage (after `npm run build`):
 *   IFLOW01_ROOT=/path/to/iflow01 node scripts/mcp-contract-check.mjs
 *
 * Registry keys are read from `myintranet/scripts/dump_mcp_builtin_registry_keys.py` when present
 * (no Django install), otherwise from `get_merged_registry()` via `django.setup()`.
 *
 * Exits 0 if skipped or the Django side cannot be read.
 * Exits 1 if any Django key is missing from iflow-mcp.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

/** Django registry keys that are implemented by a single composite TS tool (not 1:1 names). */
const DJANGO_KEY_COVERED_BY_TS_TOOL = {
  diff_diagnose_metric: "diff_diagnose",
  diff_diagnose_events: "diff_diagnose",
};

function tsCoversDjangoKey(ts, djangoKey) {
  if (ts.includes(djangoKey)) {
    return true;
  }
  const proxy = DJANGO_KEY_COVERED_BY_TS_TOOL[djangoKey];
  return Boolean(proxy && ts.includes(proxy));
}

/** Placeholder env so `registerAllTools()` can load in CI or a clean shell. */
async function ensureEnvForToolRegistration() {
  if (process.env.IFLOW_BASE_URL && process.env.IFLOW_API_POINTS) {
    return;
  }
  const { REQUIRED_IFLOW_API_POINT_KEYS } = await import(path.join(root, "dist/tools/required-keys-list.js"));
  const uuid = "10000000-0000-4000-8000-000000000001";
  /** @type {Record<string, string>} */
  const pts = {};
  for (const k of REQUIRED_IFLOW_API_POINT_KEYS) {
    pts[k] = uuid;
  }
  process.env.IFLOW_BASE_URL ??= "https://contract-check.invalid";
  process.env.IFLOW_ALLOWED_HOSTS ??= "contract-check.invalid";
  process.env.IFLOW_API_BEARER ??= "contract-check-dummy-bearer";
  process.env.IFLOW_API_POINTS ??= JSON.stringify(pts);
  process.env.IFLOW_MCP_TRANSPORT ??= "stdio";
}

async function tsToolNames() {
  await ensureEnvForToolRegistration();
  const { registerAllTools } = await import(path.join(root, "dist/tools/index.js"));
  const { registry } = await import(path.join(root, "dist/tools/registry.js"));
  registerAllTools();
  return registry.getAllTools().map((t) => t.name).sort();
}

function sortedLines(stdout) {
  return stdout
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .sort();
}

function djangoKeysFromDump(iflow01Root) {
  const dump = path.join(iflow01Root, "myintranet", "scripts", "dump_mcp_builtin_registry_keys.py");
  if (!existsSync(dump)) {
    return null;
  }
  const r = spawnSync("python3", [dump], {
    encoding: "utf-8",
    cwd: iflow01Root,
    maxBuffer: 2 * 1024 * 1024,
  });
  if (r.status !== 0) {
    console.warn("mcp-contract-check: dump script failed:", r.stderr || r.stdout || r.error);
    return null;
  }
  return sortedLines(r.stdout);
}

function djangoKeysFromRuntime(iflow01Root) {
  const code = [
    "import os, sys",
    `sys.path.insert(0, ${JSON.stringify(iflow01Root)})`,
    'os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myintranet.settings")',
    "import django",
    "django.setup()",
    "from myintranet.api_external.services.mcp_registry import get_merged_registry",
    'print("\\n".join(sorted(get_merged_registry().keys())))',
  ].join("\n");

  const r = spawnSync("python3", ["-c", code], {
    encoding: "utf-8",
    cwd: iflow01Root,
    env: { ...process.env, PYTHONPATH: iflow01Root },
    maxBuffer: 2 * 1024 * 1024,
  });
  if (r.status !== 0) {
    console.warn("mcp-contract-check: Django registry not available:", r.stderr || r.stdout || r.error);
    return null;
  }
  return sortedLines(r.stdout);
}

function djangoKeys(iflow01Root) {
  return djangoKeysFromDump(iflow01Root) ?? djangoKeysFromRuntime(iflow01Root);
}

async function main() {
  const iflow01 = process.env.IFLOW01_ROOT?.trim();
  if (!iflow01) {
    console.log("mcp-contract-check: skip (set IFLOW01_ROOT to iflow01 repo for Django comparison)");
    process.exit(0);
  }

  const django = djangoKeys(iflow01);
  if (!django) {
    process.exit(0);
  }

  const ts = await tsToolNames();
  const onlyDjango = django.filter((k) => !tsCoversDjangoKey(ts, k));
  const onlyTs = ts.filter((k) => !django.includes(k));

  if (onlyDjango.length) {
    console.error("MCP tool name drift: Django registry keys missing from iflow-mcp:");
    console.error(" ", onlyDjango.join(", "));
    process.exit(1);
  }

  if (onlyTs.length) {
    console.log(
      "mcp-contract-check: OK (%d Django keys covered; %d extra TS-only tools)",
      django.length,
      onlyTs.length,
    );
  } else {
    console.log("mcp-contract-check: OK (%d tools)", django.length);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
