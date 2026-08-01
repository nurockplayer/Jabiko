import { describe, expect, it, vi } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import {
  buildTargetedVitestInvocation,
  classifyVitestRed,
  runTargetedVitest
} from "./red-runner.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const repoRoot = "/fixture/repo";
const testFile = "src/domain/example.regression.test.ts";
const testName = "returns the safe fallback for an empty queue";
const finding = {
  expectedBehavior: "an empty queue returns the safe fallback",
  actualBehavior: "an empty queue returns the stale value"
};

function assertionReport(overrides = {}) {
  return {
    numTotalTestSuites: 1,
    numPassedTestSuites: 0,
    numFailedTestSuites: 1,
    numPendingTestSuites: 0,
    numTotalTests: 1,
    numPassedTests: 0,
    numFailedTests: 1,
    numPendingTests: 0,
    numTodoTests: 0,
    success: false,
    testResults: [
      {
        name: `${repoRoot}/${testFile}`,
        status: "failed",
        message: "",
        assertionResults: [
          {
            title: testName,
            fullName: `queue behavior ${testName}`,
            status: "failed",
            failureMessages: [
              `AssertionError: Expected behavior: ${finding.expectedBehavior} | ` +
                `Actual behavior: ${finding.actualBehavior}\n` +
                "expected 'actual' to be 'expected'"
            ]
          }
        ]
      }
    ],
    ...overrides
  };
}

describe("buildTargetedVitestInvocation", () => {
  it("builds trusted pnpm/Vitest argv without a shell or model command", () => {
    const invocation = buildTargetedVitestInvocation({
      testFile,
      testName,
      reportPath: "/private/tmp/vitest-report.json"
    });

    expect(invocation).toEqual({
      command: "pnpm",
      args: [
        "exec",
        "vitest",
        "run",
        testFile,
        "--testNamePattern",
        `(?:^|\\s)returns the safe fallback for an empty queue$`,
        "--reporter=json",
        "--outputFile",
        "/private/tmp/vitest-report.json",
        "--no-color",
        "--passWithNoTests=false",
        "--bail=1"
      ]
    });
    expect(invocation.args).not.toContain("--");
    expect(invocation).not.toHaveProperty("shell");
  });

  it("escapes regex syntax in a finding-provided test name", () => {
    const invocation = buildTargetedVitestInvocation({
      testFile,
      testName: "handles [empty] (queue)?",
      reportPath: "/tmp/report.json"
    });

    expect(invocation.args[5]).toBe("(?:^|\\s)handles \\[empty\\] \\(queue\\)\\?$");
  });
});

describe("classifyVitestRed", () => {
  it("accepts only the specified assertion failure tied to finding behavior", () => {
    const result = classifyVitestRed({
      exitCode: 1,
      report: assertionReport(),
      stdout: "",
      stderr: "",
      repoRoot,
      testFile,
      testName,
      finding
    });

    expect(result).toEqual({
      valid: true,
      failureKind: "assertion",
      sanitizedSummary:
        `${testName}: Expected behavior: ${finding.expectedBehavior} | ` +
        `Actual behavior: ${finding.actualBehavior}`
    });
  });

  it.each([
    ["a zero exit code", { exitCode: 0 }],
    ["no collected tests", { report: assertionReport({
      numTotalTests: 0,
      numFailedTests: 0,
      testResults: []
    }) }],
    ["mixed failed and pending suites", { report: assertionReport({
      numFailedTestSuites: 0,
      numPendingTestSuites: 1
    }) }],
    ["the wrong test file", {
      report: assertionReport({
        testResults: [{
          ...assertionReport().testResults[0],
          name: `${repoRoot}/src/domain/other.regression.test.ts`
        }]
      })
    }],
    ["the wrong test name", {
      report: assertionReport({
        testResults: [{
          ...assertionReport().testResults[0],
          assertionResults: [{
            ...assertionReport().testResults[0].assertionResults[0],
            title: "some other test"
          }]
        }]
      })
    }],
    ["a skipped test", {
      report: assertionReport({
        numFailedTests: 0,
        numPendingTests: 1,
        testResults: [{
          ...assertionReport().testResults[0],
          assertionResults: [{
            ...assertionReport().testResults[0].assertionResults[0],
            status: "skipped"
          }]
        }]
      })
    }],
    ["a non-assertion error", {
      report: assertionReport({
        testResults: [{
          ...assertionReport().testResults[0],
          assertionResults: [{
            ...assertionReport().testResults[0].assertionResults[0],
            failureMessages: ["TypeError: cannot read properties of undefined"]
          }]
        }]
      })
    }],
    ["an assertion missing expected behavior", {
      report: assertionReport({
        testResults: [{
          ...assertionReport().testResults[0],
          assertionResults: [{
            ...assertionReport().testResults[0].assertionResults[0],
            failureMessages: [
              `AssertionError: Actual behavior: ${finding.actualBehavior}\n` +
                "expected actual to be expected"
            ]
          }]
        }]
      })
    }],
    ["an assertion missing actual behavior", {
      report: assertionReport({
        testResults: [{
          ...assertionReport().testResults[0],
          assertionResults: [{
            ...assertionReport().testResults[0].assertionResults[0],
            failureMessages: [
              `AssertionError: Expected behavior: ${finding.expectedBehavior}\n` +
                "expected actual to be expected"
            ]
          }]
        }]
      })
    }],
    ["unlabeled behavior prose", {
      report: assertionReport({
        testResults: [{
          ...assertionReport().testResults[0],
          assertionResults: [{
            ...assertionReport().testResults[0].assertionResults[0],
            failureMessages: [
              `AssertionError: ${finding.expectedBehavior} | ${finding.actualBehavior}\n` +
                "expected actual to be expected"
            ]
          }]
        }]
      })
    }]
  ])("rejects %s", (_label, overrides) => {
    const result = classifyVitestRed({
      exitCode: 1,
      report: assertionReport(),
      stdout: "",
      stderr: "",
      repoRoot,
      testFile,
      testName,
      finding,
      ...overrides
    });

    expect(result.valid).toBe(false);
  });

  it.each([
    "SyntaxError: Unexpected token",
    "Failed to load url ./missing",
    "Cannot find module './missing'",
    "Error: Test timed out in 5000ms",
    "Unhandled Rejection",
    "Unhandled Error",
    "Worker exited unexpectedly",
    "Worker crashed",
    "No test files found",
    "Failed Suites 1",
    "setup file failed"
  ])("rejects infrastructure output even beside an apparent assertion: %s", diagnostic => {
    const result = classifyVitestRed({
      exitCode: 1,
      report: assertionReport(),
      stdout: "",
      stderr: diagnostic,
      repoRoot,
      testFile,
      testName,
      finding
    });

    expect(result.valid).toBe(false);
  });
});

describe("runTargetedVitest", () => {
  function spawnStub() {
    const listeners = {};
    const stdout = { on: vi.fn((event, cb) => { listeners.stdout = cb; }) };
    const stderr = { on: vi.fn((event, cb) => { listeners.stderr = cb; }) };
    const child = {
      pid: 4242,
      stdout,
      stderr,
      on: vi.fn((event, cb) => { listeners[event] = cb; })
    };
    const emit = (event, ...args) => {
      if (listeners[event]) listeners[event](...args);
    };
    return { child, emit, listeners };
  }

  it("uses spawn with shell disabled, a detached process group, and the fixed invocation", async () => {
    const stub = spawnStub();
    const spawnFn = vi.fn(() => stub.child);
    const resultPromise = runTargetedVitest({
      repoRoot,
      testFile,
      testName,
      reportPath: "/tmp/missing-report.json",
      spawnFn
    });
    const [, , options] = spawnFn.mock.calls[0];
    expect(spawnFn.mock.calls[0][0]).toBe("pnpm");
    expect(spawnFn.mock.calls[0][1].slice(0, 4)).toEqual(["exec", "vitest", "run", testFile]);
    expect(options.shell).toBe(false);
    expect(options.cwd).toBe(repoRoot);
    expect(options.detached).toBe(true);
    stub.emit("close", 1, null);
    const result = await resultPromise;

    expect(result.valid).toBe(false);
  });

  it("kills the whole process group and fails closed when the run times out", async () => {
    const stub = spawnStub();
    const spawnFn = vi.fn(() => stub.child);
    const killSpy = vi.spyOn(process, "kill").mockImplementation(() => true);

    try {
      const resultPromise = runTargetedVitest({
        repoRoot,
        testFile,
        testName,
        reportPath: "/tmp/missing-report.json",
        spawnFn,
        timeoutMs: 50
      });
      // Let the internal timeout timer fire (killing the group), then simulate
      // the group's exit so the run resolves as a timed-out failure.
      setTimeout(() => stub.emit("close", null, "SIGKILL"), 100);
      const result = await resultPromise;

      expect(result.valid).toBe(false);
      expect(result.error).toBe("targeted Vitest process timed out");
      expect(killSpy).toHaveBeenCalledWith(-4242, "SIGKILL");
    } finally {
      killSpy.mockRestore();
    }
  });

  it("fails closed when the spawned process cannot start", async () => {
    const stub = spawnStub();
    const spawnFn = vi.fn(() => stub.child);
    const resultPromise = runTargetedVitest({
      repoRoot,
      testFile,
      testName,
      reportPath: "/tmp/missing-report.json",
      spawnFn
    });
    stub.emit("error", new Error("ENOENT"));
    const result = await resultPromise;

    expect(result.valid).toBe(false);
    expect(result.error).toBe("targeted Vitest process failed to start");
  });

  it("rejects a stale JSON report before spawning Vitest", async () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jabiko-red-report-"));
    const reportPath = path.join(fixtureRoot, "stale.json");
    fs.writeFileSync(reportPath, JSON.stringify(assertionReport()));
    const spawnFn = vi.fn();

    try {
      const result = await runTargetedVitest({
        repoRoot,
        testFile,
        testName,
        reportPath,
        spawnFn
      });

      expect(result.valid).toBe(false);
      expect(spawnFn).not.toHaveBeenCalled();
    } finally {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});
