#!/usr/bin/env node
import { handleCliArgs } from "./meta.js";

if (handleCliArgs()) {
  process.exit(0);
}

await import("./start.js");
