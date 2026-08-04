import { describe, expect, it, vi } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import { runWorkflowOrchestration } from "./workflow-orchestrator.mjs";

const SECRET = "fixture-orchestrator-secret-98765";
const ENV_DUMP = "PATH=/usr/local/bin:/usr/bin";
const ABSOLUTE_PATH = "/tmp/some/absolute/path";
const MODEL_COMMAND = "pnpm exec gemini-correctness --repair";
const FAKE_TOKEN = "ghp_abcdefghijklmnopqrstuvwxyz1234567890";

function finding() {
  return {
    schemaVersion: 1,
    status: "finding",
    title: "empty queue fallback",
    confidence: 0.95,
    category: "boundary-condition",
    evidence: [
      {
        file: "src/domain/example.ts",
        startLine: 1,
        endLine: 3,
        reason: "the empty branch returns a stale value"
      }
    ],
    expectedBehavior: "an empty queue returns the safe fallback",
    actualBehavior: "an empty queue returns the stale value",
    reproduction: { testFile: "src/domain/example.regression.test.ts", testName: "returns the safe fallback for an empty queue" },
    productionFiles: ["src/domain/example.ts"],
    risk: "low"
  };
}

function validatedFinding() {
  return { valid: true, result: finding() };
}

function redResult() {
  return {
    schemaVersion: 1,
    status: "red-confirmed",
    baselineSha: "a".repeat(40),
    testFile: "src/domain/example.regression.test.ts",
    testName: "returns the safe fallback for an empty queue",
    failureKind: "assertion",
    sanitizedSummary: "returns the safe fallback for an empty queue: Expected behavior: an empty queue returns the safe fallback | Actual behavior: an empty queue returns the stale value",
    patchSha256: "b".repeat(64),
    replayConfirmed: true
  };
}

function greenResult() {
  return {
    schemaVersion: 1,
    status: "repair-verified",
    baselineSha: "a".repeat(40),
    findingTitle: "empty queue fallback",
    testFile: "src/domain/example.regression.test.ts",
    testName: "returns the safe fallback for an empty queue",
    productionFiles: ["src/domain/example.ts"],
    rootCause: "the empty branch returns a stale value instead of the fallback",
    fixSummary: "return the safe fallback when the queue is empty",
    checks: [
      { name: "targeted-test", status: "passed" },
      { name: "lint", status: "passed" },
      { name: "typecheck", status: "passed" },
      { name: "test", status: "passed" },
      { name: "build", status: "passed" }
    ],
    changedFiles: 1,
    changedLines: 2,
    testPatchSha256: "b".repeat(64),
    finalDiffSha256: "c".repeat(64)
  };
}

function allFns() {
  const base = {
    openAiPrGate: vi.fn().mockResolvedValue({ valid: true, openPrs: [] }),
    baseline: vi.fn().mockResolvedValue({
      valid: true,
      checks: [
        { name: "lint", status: "passed" },
        { name: "typecheck", status: "passed" },
        { name: "test", status: "passed" },
        { name: "build", status: "passed" },
        { name: "diff-check", status: "passed" }
      ]
    }),
    discovery: vi.fn().mockResolvedValue(validatedFinding()),
    red: vi.fn().mockResolvedValue({ valid: true, result: redResult() }),
    green: vi.fn().mockResolvedValue({ valid: true, result: greenResult() }),
    cleanup: vi.fn().mockResolvedValue({ valid: true }),
    clock: vi.fn().mockReturnValue(1_700_000_000_000)
  };
  return base;
}

function opts(adapterSet: ReturnType<typeof allFns>, extra = {}) {
  return {
    mode: "off",
    baselineSha: "a".repeat(40),
    adapters: adapterSet,
    limits: { baselineTimeoutMs: 1000, findingBytes: 4096 },
    ...extra
  };
}

describe("off mode", () => {
  it("returns a safe skip with zero adapter calls", async () => {
    const a = allFns();
    const result = await runWorkflowOrchestration(opts(a, { mode: "off" }));

    expect(result.status).toBe("off-skip");
    expect(result.publicationAllowed).toBe(false);
    expect(result.reason).toBe("safe skip");
    for (const fn of Object.values(a)) {
      expect(fn).not.toHaveBeenCalled();
    }
    expect(JSON.stringify(result)).not.toContain(SECRET);
    expect(JSON.stringify(result)).not.toContain(ABSOLUTE_PATH);
  });
});

describe("observe mode", () => {
  it("runs open-PR gate, baseline, discovery; never RED/GREEN/cleanup", async () => {
    const a = allFns();
    const result = await runWorkflowOrchestration(opts(a, { mode: "observe" }));

    expect(result.status).toBe("observed");
    expect(result.publicationAllowed).toBe(false);
    expect(a.openAiPrGate).toHaveBeenCalledTimes(1);
    expect(a.baseline).toHaveBeenCalledTimes(1);
    expect(a.discovery).toHaveBeenCalledTimes(1);
    expect(a.red).not.toHaveBeenCalled();
    expect(a.green).not.toHaveBeenCalled();
    expect(a.cleanup).not.toHaveBeenCalled();
    expect(result.findingTitle).toBe("empty queue fallback");
    expect(result.checks).toHaveLength(5);
  });

  it("maps a rejected finding to finding-rejected", async () => {
    const a = allFns();
    a.discovery.mockResolvedValueOnce({ valid: false, error: "low confidence" });
    const result = await runWorkflowOrchestration(opts(a, { mode: "observe" }));

    expect(result.status).toBe("finding-rejected");
    expect(result.publicationAllowed).toBe(false);
  });

  it("maps quota/API errors to quota-api-error", async () => {
    const a = allFns();
    a.discovery.mockRejectedValueOnce(new Error("quota exhausted"));
    const result = await runWorkflowOrchestration(opts(a, { mode: "observe" }));

    expect(result.status).toBe("quota-api-error");
    expect(result.publicationAllowed).toBe(false);
  });

  it("redacts secrets, env values, and absolute paths from the result", async () => {
    const a = allFns();
    a.discovery.mockResolvedValueOnce({
      valid: false,
      error: `Gemini failed with ${SECRET} at ${ABSOLUTE_PATH}; ${ENV_DUMP}`
    });
    const result = await runWorkflowOrchestration({
      ...opts(a, { mode: "observe" }),
      limits: {
        baselineTimeoutMs: 1000,
        findingBytes: 4096,
        environment: {
          FIXTURE_SECRET: SECRET,
          PATH: "/usr/local/bin:/usr/bin",
          HOME: ABSOLUTE_PATH
        }
      }
    });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(SECRET);
    expect(serialized).not.toContain(ABSOLUTE_PATH);
    expect(serialized).toContain("REDACTED_KEY");
    expect(result.findingTitle).toBeUndefined();
  });
});

describe("open-PR gate", () => {
  it("skips before baseline and Gemini when an open gemini/auto-fix- PR exists", async () => {
    const a = allFns();
    a.openAiPrGate.mockResolvedValueOnce({
      valid: true,
      openPrs: [{ ref: "gemini/auto-fix-empty-queue", title: "fix empty queue", url: "https://example.invalid/pr/1" }]
    });
    const result = await runWorkflowOrchestration(opts(a, { mode: "observe" }));

    expect(result.status).toBe("open-pr-blocked");
    expect(result.publicationAllowed).toBe(false);
    expect(a.baseline).not.toHaveBeenCalled();
    expect(a.discovery).not.toHaveBeenCalled();
    expect(a.red).not.toHaveBeenCalled();
    expect(a.green).not.toHaveBeenCalled();
    expect(a.cleanup).not.toHaveBeenCalled();
  });

  it("fails closed when the open-PR gate itself throws", async () => {
    const a = allFns();
    a.openAiPrGate.mockRejectedValueOnce(new Error("gh rate limited"));
    const result = await runWorkflowOrchestration(opts(a, { mode: "observe" }));

    expect(result.status).toBe("open-pr-blocked");
    expect(result.publicationAllowed).toBe(false);
    expect(a.baseline).not.toHaveBeenCalled();
    expect(a.discovery).not.toHaveBeenCalled();
  });
});

describe("baseline checks fail closed", () => {
  it.each(["lint", "typecheck", "test", "build", "diff-check"])(
    "returns baseline-blocked when %s fails",
    async (failedCheck) => {
      const a = allFns();
      const baseline = {
        valid: true,
        checks: [
          { name: "lint", status: "passed" },
          { name: "typecheck", status: "passed" },
          { name: "test", status: "passed" },
          { name: "build", status: "passed" },
          { name: "diff-check", status: "passed" }
        ]
      };
      baseline.checks = baseline.checks.map(c =>
        c.name === failedCheck ? { ...c, status: "failed" } : c
      );
      a.baseline.mockResolvedValueOnce(baseline);

      const result = await runWorkflowOrchestration(opts(a, { mode: "observe" }));

      expect(result.status).toBe("baseline-blocked");
      expect(result.publicationAllowed).toBe(false);
      expect(a.discovery).not.toHaveBeenCalled();
    }
  );

  it("fails closed when baseline throws", async () => {
    const a = allFns();
    a.baseline.mockRejectedValueOnce(new Error("lint crashed"));
    const result = await runWorkflowOrchestration(opts(a, { mode: "observe" }));

    expect(result.status).toBe("baseline-blocked");
    expect(result.publicationAllowed).toBe(false);
    expect(a.discovery).not.toHaveBeenCalled();
  });
});

describe("no-finding", () => {
  it("maps a valid no-finding to no-finding", async () => {
    const a = allFns();
    a.discovery.mockResolvedValueOnce({
      valid: true,
      result: { schemaVersion: 1, status: "no-finding", reason: "no issues found" }
    });
    const result = await runWorkflowOrchestration(opts(a, { mode: "observe" }));

    expect(result.status).toBe("no-finding");
    expect(result.publicationAllowed).toBe(false);
    expect(a.red).not.toHaveBeenCalled();
  });
});

describe("repair mode", () => {
  it("executes the fixed stage order with exactly one clean reset", async () => {
    const a = allFns();
    const result = await runWorkflowOrchestration(opts(a, { mode: "repair" }));

    expect(result.status).toBe("repair-verified");
    expect(result.publicationAllowed).toBe(true);
    expect(a.openAiPrGate).toHaveBeenCalledTimes(1);
    expect(a.baseline).toHaveBeenCalledTimes(1);
    expect(a.discovery).toHaveBeenCalledTimes(1);
    expect(a.red).toHaveBeenCalledTimes(1);
    expect(a.green).toHaveBeenCalledTimes(1);
    expect(a.cleanup).toHaveBeenCalledTimes(1);

    // Red/green receive the validated finding, never the raw adapter envelope.
    const redArg = a.red.mock.calls[0][0];
    expect(redArg.finding).toEqual(finding());
    expect(redArg.finding.status).toBe("finding");
    expect(redArg.baselineSha).toBe("a".repeat(40));
    const greenArg = a.green.mock.calls[0][0];
    expect(greenArg.finding).toEqual(finding());
    expect(greenArg.redResult).toEqual(redResult());
    expect(greenArg.baselineSha).toBe("a".repeat(40));

    // Cleanup receives the trusted baseline.
    expect(a.cleanup.mock.calls[0][0]).toMatchObject({ baselineSha: "a".repeat(40) });

    // The orchestrator never spawns a model command or reads a secret.
    expect(JSON.stringify(a.red.mock.calls)).not.toContain(MODEL_COMMAND);
    expect(JSON.stringify(a.green.mock.calls)).not.toContain(SECRET);
    expect(JSON.stringify(a.green.mock.calls)).not.toContain(FAKE_TOKEN);
  });

  it("maps no-finding in repair to no-finding", async () => {
    const a = allFns();
    a.discovery.mockResolvedValueOnce({
      valid: true,
      result: { schemaVersion: 1, status: "no-finding", reason: "nothing to repair" }
    });
    const result = await runWorkflowOrchestration(opts(a, { mode: "repair" }));

    expect(result.status).toBe("no-finding");
    expect(result.publicationAllowed).toBe(false);
    expect(a.red).not.toHaveBeenCalled();
  });

  it("maps invalid finding to finding-rejected", async () => {
    const a = allFns();
    a.discovery.mockResolvedValueOnce({ valid: false, error: "schema failed" });
    const result = await runWorkflowOrchestration(opts(a, { mode: "repair" }));

    expect(result.status).toBe("finding-rejected");
    expect(result.publicationAllowed).toBe(false);
    expect(a.red).not.toHaveBeenCalled();
  });

  it("maps a red-stage failure to red-failed", async () => {
    const a = allFns();
    a.red.mockResolvedValueOnce({ valid: false, status: "red-confirmed-fail", error: "test did not reproduce" });
    const result = await runWorkflowOrchestration(opts(a, { mode: "repair" }));

    expect(result.status).toBe("red-failed");
    expect(result.publicationAllowed).toBe(false);
    expect(a.green).not.toHaveBeenCalled();
  });

  it("maps a green-stage failure to green-failed", async () => {
    const a = allFns();
    a.green.mockResolvedValueOnce({ valid: false, status: "targeted-test-failed", error: "test still red" });
    const result = await runWorkflowOrchestration(opts(a, { mode: "repair" }));

    expect(result.status).toBe("green-failed");
    expect(result.publicationAllowed).toBe(false);
  });

  it("fails closed when the clean reset (cleanup) fails", async () => {
    const a = allFns();
    a.cleanup.mockResolvedValueOnce({ valid: false, error: "reset could not be verified" });
    const result = await runWorkflowOrchestration(opts(a, { mode: "repair" }));

    expect(result.status).toBe("cleanup-failed");
    expect(result.publicationAllowed).toBe(false);
    expect(a.green).not.toHaveBeenCalled();
  });

  it("fails closed when cleanup throws", async () => {
    const a = allFns();
    a.cleanup.mockRejectedValueOnce(new Error("reset failed"));
    const result = await runWorkflowOrchestration(opts(a, { mode: "repair" }));

    expect(result.status).toBe("cleanup-failed");
    expect(result.publicationAllowed).toBe(false);
    expect(a.green).not.toHaveBeenCalled();
  });

  it("requires the green result to claim repair-verified; otherwise publicationAllowed=false", async () => {
    const a = allFns();
    a.green.mockResolvedValueOnce({
      valid: true,
      result: { schemaVersion: 1, status: "repair-pending", baselineSha: "a".repeat(40) }
    });
    const result = await runWorkflowOrchestration(opts(a, { mode: "repair" }));

    expect(result.status).toBe("green-failed");
    expect(result.publicationAllowed).toBe(false);
  });

  it("requires the green result baseline to match the trusted baseline", async () => {
    const a = allFns();
    a.green.mockResolvedValueOnce({ valid: true, result: { ...greenResult(), baselineSha: "d".repeat(40) } });
    const result = await runWorkflowOrchestration(opts(a, { mode: "repair" }));

    expect(result.status).toBe("baseline-blocked");
    expect(result.publicationAllowed).toBe(false);
  });

  it("rejects a tampered baseline from the discovery result", async () => {
    const a = allFns();
    a.discovery.mockResolvedValueOnce({
      valid: true,
      result: {
        ...finding(),
        baselineSha: "zzz-not-a-sha"
      }
    });
    const result = await runWorkflowOrchestration(opts(a, { mode: "repair" }));

    expect(result.status).toBe("finding-rejected");
    expect(result.publicationAllowed).toBe(false);
    expect(a.red).not.toHaveBeenCalled();
  });

  it("rejects a red result whose baselineSha does not match the trusted baseline", async () => {
    const a = allFns();
    a.red.mockResolvedValueOnce({ valid: true, result: { ...redResult(), baselineSha: "d".repeat(40) } });
    const result = await runWorkflowOrchestration(opts(a, { mode: "repair" }));

    expect(result.status).toBe("red-failed");
    expect(result.publicationAllowed).toBe(false);
    expect(a.green).not.toHaveBeenCalled();
  });

  it("rejects a red result with an invalid schema/hash", async () => {
    const a = allFns();
    a.red.mockResolvedValueOnce({ valid: true, result: { ...redResult(), patchSha256: "not-hex" } });
    const result = await runWorkflowOrchestration(opts(a, { mode: "repair" }));

    expect(result.status).toBe("red-failed");
    expect(result.publicationAllowed).toBe(false);
    expect(a.green).not.toHaveBeenCalled();
  });

  it("maps timeout/signal/throw to a bounded machine-readable status", async () => {
    const a = allFns();
    a.red.mockResolvedValueOnce({
      valid: false,
      error: "targeted Vitest process timed out",
      signal: "SIGKILL",
      exitCode: null
    });
    const result = await runWorkflowOrchestration(opts(a, { mode: "repair" }));

    expect(result.status).toBe("red-failed");
    expect(result.reason).toContain("SIGKILL");
  });

  it("sanitizes the final result so fake secrets and env dumps never appear", async () => {
    const a = allFns();
    a.green.mockResolvedValueOnce({
      valid: false,
      status: "full-check-failed",
      error: `build failed with ${SECRET} at ${ABSOLUTE_PATH}; ${ENV_DUMP}`
    });
    const result = await runWorkflowOrchestration({
      ...opts(a, { mode: "repair" }),
      limits: {
        baselineTimeoutMs: 1000,
        findingBytes: 4096,
        environment: {
          FIXTURE_SECRET: SECRET,
          PATH: "/usr/local/bin:/usr/bin",
          HOME: ABSOLUTE_PATH
        }
      }
    });

    const serialized = JSON.stringify(result);
    expect(result.status).toBe("green-failed");
    expect(result.publicationAllowed).toBe(false);
    expect(serialized).not.toContain(SECRET);
    expect(serialized).not.toContain(ABSOLUTE_PATH);
    expect(serialized).toContain("REDACTED_KEY");
  });

  it("returns a publication candidate with sanitized fields only", async () => {
    const a = allFns();
    const result = await runWorkflowOrchestration(opts(a, { mode: "repair" }));

    expect(result.publicationAllowed).toBe(true);
    expect(result.status).toBe("repair-verified");
    expect(result.baselineSha).toBe("a".repeat(40));
    expect(result.changedFiles).toBe(1);
    expect(result.changedLines).toBe(2);
    expect(result.finalDiffSha256).toBe("c".repeat(64));
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(SECRET);
    expect(serialized).not.toContain(ENV_DUMP);
    expect(serialized).not.toContain(ABSOLUTE_PATH);
    expect(serialized).not.toContain("ghp_");
  });
});

describe("strict repeat run", () => {
  it("does not carry mutable state between runs", async () => {
    const a1 = allFns();
    const r1 = await runWorkflowOrchestration(opts(a1, { mode: "repair" }));
    expect(r1.status).toBe("repair-verified");

    // A second invocation with fresh adapters must run the same stage sequence.
    const a2 = allFns();
    const r2 = await runWorkflowOrchestration(opts(a2, { mode: "observe" }));
    expect(r2.status).toBe("observed");
    expect(a2.red).not.toHaveBeenCalled();

    // A third run in repair mode again runs every stage exactly once.
    const a3 = allFns();
    const r3 = await runWorkflowOrchestration(opts(a3, { mode: "repair" }));
    expect(r3.status).toBe("repair-verified");
    expect(a3.red).toHaveBeenCalledTimes(1);
    expect(a3.green).toHaveBeenCalledTimes(1);
    expect(a3.cleanup).toHaveBeenCalledTimes(1);
  });
});
