import { describe, it, expect } from "vitest";
import {
  applyAnalystHygiene,
  normalizeAnalystResult,
  isSmallSampleFinding,
} from "../src/tools/analyst/hygiene.js";
import type { AnalystFinding, AnalystResult } from "../src/tools/shapes.js";

function finding(
  headline: string,
  severity: AnalystFinding["severity"],
  n: number
): AnalystFinding {
  return {
    headline,
    severity,
    evidence: {
      metric: "m",
      current: 1,
      baseline: 2,
      delta_pct: 10,
      n_observations: n,
      period_label: "p1",
      comparison_period_label: "p0",
    },
  };
}

describe("analyst hygiene", () => {
  it("marks n<10 as low severity and increments suppressed_count", () => {
    const input: AnalystResult = {
      perspective: "test",
      findings: [finding("A", "high", 3), finding("B", "medium", 20)],
      suppressed_count: 1,
      baseline_method: "yoy",
      methodology_notes: ["note"],
    };
    const out = applyAnalystHygiene(input);
    expect(out.structuredContent?.suppressed_count).toBe(2);
    expect(out.structuredContent?.findings[0].severity).toBe("low");
    expect(out.structuredContent?.methodology_notes.some((n) => n.includes("n<10"))).toBe(
      true
    );
  });

  it("excludes small-sample findings from top narrative pool", () => {
    const input: AnalystResult = {
      perspective: "x",
      findings: [finding("Small", "high", 2), finding("Big", "medium", 50)],
      suppressed_count: 0,
      baseline_method: "median",
      methodology_notes: [],
    };
    const out = applyAnalystHygiene(input);
    expect(out.content[0].text).toContain("Big");
    expect(out.content[0].text).not.toContain("Small");
  });

  it("normalizeAnalystResult fills defaults", () => {
    const n = normalizeAnalystResult({}, "fallback");
    expect(n.perspective).toBe("fallback");
    expect(n.findings).toEqual([]);
    expect(n.suppressed_count).toBe(0);
    expect(n.baseline_method).toBe("unknown");
    expect(n.methodology_notes).toEqual([]);
    expect(n.report).toBeUndefined();
  });

  it("normalizeAnalystResult preserves optional report", () => {
    const n = normalizeAnalystResult(
      {
        findings: [],
        report: { title: "Raport", sections: {} },
      } as Partial<AnalystResult>,
      "correction_costs"
    );
    expect(n.report).toEqual({ title: "Raport", sections: {} });
  });

  it("isSmallSampleFinding respects threshold", () => {
    expect(isSmallSampleFinding(finding("a", "high", 9))).toBe(true);
    expect(isSmallSampleFinding(finding("b", "high", 10))).toBe(false);
  });

  it("supports English narrative when language is en", () => {
    const input: AnalystResult = {
      perspective: "demo",
      findings: [finding("Big", "high", 20)],
      suppressed_count: 0,
      baseline_method: "yoy",
      methodology_notes: [],
    };
    const out = applyAnalystHygiene(input, { language: "en" });
    expect(out.content[0].text).toContain("Perspective");
    expect(out.content[0].text).toContain("Big");
  });
});
