import type { AnalystFinding, AnalystResult, MCPToolResult } from "../shapes.js";

export type HygieneLanguage = "ro" | "en";

const SEVERITY_RANK: Record<AnalystFinding["severity"], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function severityRank(s: AnalystFinding["severity"]): number {
  return SEVERITY_RANK[s] ?? 0;
}

/** Findings with known n_observations &lt; 10 are down-ranked (Phase D statistical hygiene). */
export function isSmallSampleFinding(f: AnalystFinding): boolean {
  const n = f.evidence?.n_observations;
  return typeof n === "number" && n < 10;
}

/**
 * Enforces n&lt;10 handling, caps narrative to 5 high-signal findings.
 * Default language Romanian; use `language: "en"` per product preference.
 */
export function applyAnalystHygiene(
  input: AnalystResult,
  options?: { language?: HygieneLanguage }
): MCPToolResult<AnalystResult> {
  const language = options?.language ?? "ro";
  let smallSampleCount = 0;
  const findings = input.findings.map((f) => {
    if (!isSmallSampleFinding(f)) {
      return f;
    }
    smallSampleCount += 1;
    return { ...f, severity: "low" as const };
  });

  const methodology_notes = [...input.methodology_notes];
  if (smallSampleCount > 0) {
    methodology_notes.push(
      language === "en"
        ? `${smallSampleCount} finding(s) have insufficient sample size (n<10); severity downgraded per statistical hygiene policy.`
        : `${smallSampleCount} observație(ii) au volum insuficient de date (n<10); severitate redusă conform politicii de igienă statistică.`
    );
  }

  const result: AnalystResult = {
    ...input,
    findings,
    suppressed_count: input.suppressed_count + smallSampleCount,
    methodology_notes,
  };

  const narrativePool = findings.filter((f) => !isSmallSampleFinding(f));
  const sorted = [...narrativePool].sort(
    (a, b) => severityRank(b.severity) - severityRank(a.severity)
  );
  const top = sorted.slice(0, 5);

  const narrative =
    top.length === 0
      ? language === "en"
        ? `Perspective "${result.perspective}": no observations with sufficient volume (n≥10) for a priority summary. See structuredContent for details.`
        : `Perspectivă „${result.perspective}”: nu există observații cu volum suficient (n≥10) pentru un rezumat prioritar. Consultă structuredContent pentru detalii.`
      : language === "en"
        ? `Perspective "${result.perspective}" — ${top.length} prioritized findings (max. 5): ` +
          top.map((f) => f.headline).join(" · ")
        : `Perspectivă „${result.perspective}” — ${top.length} observații prioritare (max. 5): ` +
          top.map((f) => f.headline).join(" · ");

  const reportHint =
    result.report && typeof (result.report as { title?: string }).title === "string"
      ? language === "en"
        ? " Tabular report: see structuredContent.report (sections + rows)."
        : " Raport tabelar: vezi structuredContent.report (sectiuni + randuri)."
      : "";

  return {
    content: [{ type: "text", text: narrative + reportHint }],
    structuredContent: result,
  };
}

export function normalizeAnalystResult(
  partial: Partial<AnalystResult>,
  perspectiveFallback: string
): AnalystResult {
  const base: AnalystResult = {
    perspective: partial.perspective ?? perspectiveFallback,
    findings: Array.isArray(partial.findings) ? partial.findings : [],
    suppressed_count: partial.suppressed_count ?? 0,
    baseline_method: partial.baseline_method ?? "unknown",
    methodology_notes: Array.isArray(partial.methodology_notes)
      ? [...partial.methodology_notes]
      : [],
  };
  if (partial.report != null && typeof partial.report === "object") {
    return { ...base, report: partial.report as Record<string, unknown> };
  }
  return base;
}
