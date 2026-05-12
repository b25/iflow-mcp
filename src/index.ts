#!/usr/bin/env node
import { handleCliArgs } from "./meta.js";

const argv = process.argv.slice(2);
if (argv[0] === "confirm") {
  try {
    const { runConfirmCli } = await import("./cli/confirm.js");
    const code = await runConfirmCli(argv.slice(1));
    process.exit(code);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

if (handleCliArgs()) {
  process.exit(0);
}

await import("./start.js");
