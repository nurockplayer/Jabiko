// =============================================================================
// red-runner.mjs — fixed Vitest invocation and fail-closed RED classification
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import { spawn as nodeSpawn } from "node:child_process";
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

function runProcessGroup({
  spawnFn,
  command,
  args,
  options
}) {
  const child = spawnFn(command, args, options);
  const result = {
    pid: child.pid,
    exited: new Promise(resolve => {
      child.on("close", (code, signal) => resolve({ code, signal }));
      child.on("error", error => resolve({ code: null, signal: null, error }));
    }),
    stdout: "",
    stderr: "",
    error: undefined
  };
  child.stdout?.on("data", chunk => {
    result.stdout += String(chunk);
    if (result.stdout.length > MAX_REPORT_BYTES) {
      result.stdout = result.stdout.slice(0, MAX_REPORT_BYTES);
    }
  });
  child.stderr?.on("data", chunk => {
    result.stderr += String(chunk);
    if (result.stderr.length > MAX_REPORT_BYTES) {
      result.stderr = result.stderr.slice(0, MAX_REPORT_BYTES);
    }
  });
  return result;
}

function terminateProcessGroup(childPid) {
  if (!Number.isInteger(childPid) || childPid <= 0) return;
  try {
    process.kill(-childPid, "SIGKILL");
  } catch {
    // The group may already be gone.
  }
}

export async function runTargetedVitest({
  repoRoot,
  testFile,
  testName,
  reportPath,
  spawnFn = nodeSpawn,
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
  const child = runProcessGroup({
    spawnFn,
    command: invocation.command,
    args: invocation.args,
    options: {
      cwd: repoRoot,
      env: buildChildEnvironment(environment),
      detached: true,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"]
    }
  });

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    terminateProcessGroup(child.pid);
  }, timeoutMs);

  const { code, signal, error } = await child.exited;
  clearTimeout(timer);

  if (timedOut) {
    // The group was SIGKILLed; `child.exited` only settles once the process
    // and its descendants have closed their stdio, so no survivor can keep
    // writing after snapshot/reset begins.
    return {
      valid: false,
      error: "targeted Vitest process timed out",
      exitCode: code,
      signal: signal ?? "SIGKILL",
      stdout: child.stdout,
      stderr: child.stderr
    };
  }
  if (error) {
    return {
      valid: false,
      error: "targeted Vitest process failed to start",
      exitCode: code,
      signal,
      stdout: child.stdout,
      stderr: child.stderr
    };
  }

  try {
    const stat = fs.lstatSync(reportPath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_REPORT_BYTES) {
      return {
        valid: false,
        error: "Vitest JSON report is missing, unsafe, or too large",
        exitCode: code,
        signal,
        stdout: child.stdout,
        stderr: child.stderr
      };
    }
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    return {
      valid: true,
      exitCode: code,
      signal,
      stdout: child.stdout,
      stderr: child.stderr,
      report
    };
  } catch {
    return {
      valid: false,
      error: "Vitest JSON report was not produced or was invalid",
      exitCode: code,
      signal,
      stdout: child.stdout,
      stderr: child.stderr
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
