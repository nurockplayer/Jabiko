// =============================================================================
// red-runner.mjs — fixed Vitest invocation and fail-closed RED classification
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import { spawnSync as nodeSpawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

export const TARGETED_TEST_TIMEOUT_MS = 60_000;
const MAX_REPORT_BYTES = 2 * 1024 * 1024;
const PROCESS_GUARD_PATH = fileURLToPath(
  new URL("./red-process-guard.mjs", import.meta.url)
);
const INFRASTRUCTURE_FAILURE_RE =
  /(?:SyntaxError:|Failed to load url|Cannot find module|module not found|Test timed out|timed out in \d+ms|Unhandled Rejection|Unhandled Error|JABIKO_RED_UNHANDLED_REJECTION|JABIKO_RED_UNCAUGHT_EXCEPTION|Worker (?:exited|crashed)|No test files found|Failed Suites|setup (?:file )?failed)/i;

function invalid(error) {
  return { valid: false, error };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const ANSI_ESCAPE_RE = new RegExp(
  `${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`,
  "g"
);

function normalizeEvidence(value) {
  return String(value)
    .replace(ANSI_ESCAPE_RE, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sameFilePath(reportedName, repoRoot, testFile) {
  const reported = String(reportedName ?? "");
  const reportedAbsolute = path.isAbsolute(reported)
    ? path.resolve(reported)
    : path.resolve(repoRoot, reported);
  const expectedAbsolute = path.resolve(repoRoot, testFile);
  try {
    return fs.realpathSync(reportedAbsolute) === fs.realpathSync(expectedAbsolute);
  } catch {
    return reportedAbsolute === expectedAbsolute;
  }
}

export function buildTargetedVitestInvocation({
  testFile,
  testName,
  reportPath
} = {}) {
  const exactLeafPattern = `(?:^|\\s)${escapeRegExp(testName)}$`;
  return {
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      testFile,
      "--testNamePattern",
      exactLeafPattern,
      "--reporter=json",
      "--outputFile",
      reportPath,
      "--no-color",
      "--passWithNoTests=false",
      "--bail=1"
    ]
  };
}

function buildChildEnvironment(environment) {
  const safe = {
    CI: "1",
    FORCE_COLOR: "0",
    NO_COLOR: "1",
    NODE_OPTIONS: `--import=${pathToFileURL(PROCESS_GUARD_PATH).href}`
  };
  for (const key of ["HOME", "PATH", "TMPDIR"]) {
    if (typeof environment?.[key] === "string") {
      safe[key] = environment[key];
    }
  }
  return safe;
}

export function runTargetedVitest({
  repoRoot,
  testFile,
  testName,
  reportPath,
  spawnSyncFn = nodeSpawnSync,
  environment = process.env,
  timeoutMs = TARGETED_TEST_TIMEOUT_MS
} = {}) {
  if (
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > TARGETED_TEST_TIMEOUT_MS
  ) {
    return {
      valid: false,
      error: `targeted Vitest timeout must be between 1 and ${TARGETED_TEST_TIMEOUT_MS}ms`
    };
  }
  try {
    fs.lstatSync(reportPath);
    return invalid("Vitest JSON report path must not exist before execution");
  } catch (error) {
    if (error?.code !== "ENOENT") {
      return invalid("Vitest JSON report path is unsafe before execution");
    }
  }
  const invocation = buildTargetedVitestInvocation({
    testFile,
    testName,
    reportPath
  });
  const execution = spawnSyncFn(invocation.command, invocation.args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: buildChildEnvironment(environment),
    killSignal: "SIGKILL",
    maxBuffer: 2 * 1024 * 1024,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: timeoutMs
  });

  const stdout = typeof execution.stdout === "string" ? execution.stdout : "";
  const stderr = typeof execution.stderr === "string" ? execution.stderr : "";
  if (execution.error) {
    return {
      valid: false,
      error: execution.error.code === "ETIMEDOUT"
        ? "targeted Vitest process timed out"
        : "targeted Vitest process failed to start",
      exitCode: execution.status,
      signal: execution.signal,
      stdout,
      stderr
    };
  }

  try {
    const stat = fs.lstatSync(reportPath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_REPORT_BYTES) {
      return {
        valid: false,
        error: "Vitest JSON report is missing, unsafe, or too large",
        exitCode: execution.status,
        signal: execution.signal,
        stdout,
        stderr
      };
    }
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    return {
      valid: true,
      exitCode: execution.status,
      signal: execution.signal,
      stdout,
      stderr,
      report
    };
  } catch {
    return {
      valid: false,
      error: "Vitest JSON report was not produced or was invalid",
      exitCode: execution.status,
      signal: execution.signal,
      stdout,
      stderr
    };
  }
}

export function classifyVitestRed({
  exitCode,
  signal,
  report,
  stdout,
  stderr,
  repoRoot,
  testFile,
  testName,
  finding
} = {}) {
  if (!Number.isInteger(exitCode) || exitCode === 0 || signal) {
    return invalid("targeted Vitest must exit non-zero without a signal");
  }

  const processOutput = `${stdout ?? ""}\n${stderr ?? ""}`;
  if (INFRASTRUCTURE_FAILURE_RE.test(processOutput)) {
    return invalid("Vitest output contains an infrastructure failure");
  }
  if (!report || typeof report !== "object" || Array.isArray(report)) {
    return invalid("Vitest JSON report is required");
  }
  if (
    report.success !== false ||
    report.numTotalTests !== 1 ||
    report.numFailedTests !== 1 ||
    report.numPassedTests !== 0 ||
    report.numPendingTests !== 0 ||
    report.numTodoTests !== 0 ||
    report.numTotalTestSuites !== 1 ||
    report.numFailedTestSuites !== 1 ||
    report.numPassedTestSuites !== 0 ||
    report.numPendingTestSuites !== 0 ||
    !Array.isArray(report.testResults) ||
    report.testResults.length !== 1
  ) {
    return invalid("Vitest did not collect exactly one failing test");
  }

  const fileResult = report.testResults[0];
  if (
    !fileResult ||
    !sameFilePath(fileResult.name, repoRoot, testFile) ||
    fileResult.status !== "failed" ||
    !Array.isArray(fileResult.assertionResults) ||
    fileResult.assertionResults.length !== 1
  ) {
    const pathMatches = sameFilePath(fileResult?.name, repoRoot, testFile);
    const assertionCount = Array.isArray(fileResult?.assertionResults)
      ? fileResult.assertionResults.length
      : -1;
    return invalid(
      "Vitest report does not identify only the designated test file " +
      `(pathMatches=${pathMatches}, status=${String(fileResult?.status)}, ` +
      `assertions=${assertionCount})`
    );
  }

  const assertion = fileResult.assertionResults[0];
  if (
    assertion?.title !== testName ||
    assertion?.status !== "failed" ||
    !Array.isArray(assertion.failureMessages) ||
    assertion.failureMessages.length < 1
  ) {
    return invalid("the designated test name did not execute as one failed assertion");
  }

  const failureEvidence = normalizeEvidence(
    `${assertion.failureMessages.join("\n")}\n${String(fileResult.message ?? "")}`
  );
  if (
    !/\bAssertionError\b/.test(failureEvidence) ||
    INFRASTRUCTURE_FAILURE_RE.test(failureEvidence)
  ) {
    return invalid("the designated test failed for a non-assertion reason");
  }

  const expectedBehavior = normalizeEvidence(finding?.expectedBehavior);
  const actualBehavior = normalizeEvidence(finding?.actualBehavior);
  const expectedMarker = `Expected behavior: ${expectedBehavior}`;
  const actualMarker = `Actual behavior: ${actualBehavior}`;
  if (
    !expectedBehavior ||
    !actualBehavior ||
    !failureEvidence.includes(expectedMarker) ||
    !failureEvidence.includes(actualMarker)
  ) {
    return invalid("assertion evidence does not match finding expected/actual behavior");
  }

  return {
    valid: true,
    failureKind: "assertion",
    sanitizedSummary: `${testName}: ${expectedMarker} | ${actualMarker}`
  };
}
