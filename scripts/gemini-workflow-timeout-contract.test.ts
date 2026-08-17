import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Mechanical regression guard for the Gemini correctness workflow's per-stage
// timeouts. `runShell()` spreads its options straight into Node `spawnSync()`,
// which recognizes `timeout` (milliseconds) and silently ignores `timeoutMs`.
// If a future change reintroduces the dead `timeoutMs` option, or edits the
// documented 10-minute baseline / 8-minute discovery/RED/GREEN limits, this
// test fails.
const workflowPath = new URL("../.github/workflows/gemini-correctness-autofix.yml", import.meta.url);
const workflow = readFileSync(workflowPath, "utf8");

describe("gemini-correctness-autofix per-stage timeouts", () => {
  it("never passes the dead `timeoutMs` option to runShell", () => {
    expect(workflow).not.toContain("timeoutMs");
  });

  it("keeps the baseline command timeout at 10 minutes", () => {
    expect(workflow).toContain("timeout: 10 * 60 * 1000");
  });

  it("keeps discovery, RED, and GREEN stage timeouts at 8 minutes each", () => {
    const matches = workflow.match(/timeout: 8 \* 60 \* 1000/g) ?? [];
    expect(matches).toHaveLength(3);
  });
});
