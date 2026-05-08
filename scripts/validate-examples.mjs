#!/usr/bin/env node
/**
 * Ensures every *.json under examples/ is valid JSON (CI + local).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const examplesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "examples");
let failed = false;

for (const name of fs.readdirSync(examplesDir)) {
  if (!name.endsWith(".json")) continue;
  const full = path.join(examplesDir, name);
  try {
    JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (err) {
    console.error(`Invalid JSON: ${full}`, err);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
console.log("examples: all JSON files parse OK");
