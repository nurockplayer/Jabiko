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
  it("uses spawnSync with shell disabled and the fixed invocation", () => {
    const spawnSyncFn = vi.fn().mockReturnValue({
      status: 1,
      signal: null,
      stdout: "",
      stderr: "",
      error: undefined
    });

    const result = runTargetedVitest({
      repoRoot,
      testFile,
      testName,
      reportPath: "/tmp/missing-report.json",
      spawnSyncFn
    });

    expect(result.valid).toBe(false);
    expect(spawnSyncFn).toHaveBeenCalledTimes(1);
    const [command, args, options] = spawnSyncFn.mock.calls[0];
    expect(command).toBe("pnpm");
    expect(args.slice(0, 4)).toEqual(["exec", "vitest", "run", testFile]);
    expect(options.shell).toBe(false);
    expect(options.cwd).toBe(repoRoot);
    expect(options.timeout).toBeGreaterThan(0);
  });

  it("rejects a stale JSON report before spawning Vitest", () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jabiko-red-report-"));
    const reportPath = path.join(fixtureRoot, "stale.json");
    fs.writeFileSync(reportPath, JSON.stringify(assertionReport()));
    const spawnSyncFn = vi.fn().mockReturnValue({
      status: 1,
      signal: null,
      stdout: "",
      stderr: "",
      error: undefined
    });

    try {
      const result = runTargetedVitest({
        repoRoot,
        testFile,
        testName,
        reportPath,
        spawnSyncFn
      });

      expect(result.valid).toBe(false);
      expect(spawnSyncFn).not.toHaveBeenCalled();
    } finally {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});
