import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { readPackageJson, handleCliArgs } from "../src/meta.js";

describe("meta / CLI", () => {
  it("readPackageJson matches disk package.json", () => {
    const fromDisk = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8")
    ) as { name: string; version: string };
    const pkg = readPackageJson();
    expect(pkg.name).toBe(fromDisk.name);
    expect(pkg.version).toBe(fromDisk.version);
  });

  it("handleCliArgs returns true for --version", () => {
    expect(handleCliArgs(["node", "iflow-mcp", "--version"])).toBe(true);
  });

  it("dist entry --version matches package.json (requires npm run build)", () => {
    const entry = resolve(process.cwd(), "dist/index.js");
    try {
      readFileSync(entry);
    } catch {
      return;
    }
    const expected = readPackageJson().version;
    const out = execFileSync(process.execPath, [entry, "--version"], {
      encoding: "utf8",
    }).trim();
    expect(out).toBe(expected);
  });
});
