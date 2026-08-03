// =============================================================================
// green-runner.mjs — guarded GREEN repair stage runner
// =============================================================================
//
// Replays the stored RED artifacts at the recorded baseline, asks Gemini for a
// minimal production-only repair diff, applies it, and proves targeted test,
// lint, typecheck, full test, and build all pass before writing
// repair-result.json.  Every gate fails closed: no commit, push, or PR is ever
// created here.
//
// Data flow (Issue #637):
//   clean baseline at redResult.baselineSha
//     → verify finding + red-result schema/hash/status
//     → apply exact red-test.patch
//     → rerun exact test and reconfirm approved RED
//     → Gemini returns a unified production diff only
//     → validate + apply in the repo-contained worktree
//     → deterministic production diff guard
//     → exact targeted regression test passes
//     → pnpm lint / typecheck / test / build
//     → final diff/hash/stats/cleanup guard
//     → repair-result.json
// =============================================================================

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { redactForOutput } from "./discover.mjs";
import {
  MAX_GREEN_DIFF_LINES,
  MAX_GREEN_PRODUCTION_FILES,
  getDefaultAllowlist,
  getDefaultProtectedPaths,
  safeWritePath
} from "./policy.mjs";
import {
  captureCleanBaseline,
  validateTestOnlyWorktree
} from "./red-validator.mjs";
import {
  classifyVitestRed,
  runTargetedVitest
} from "./red-runner.mjs";
import { resetRedWorktree } from "./red-stage.mjs";
import { scanRepository } from "./scanner.mjs";
import { validateGreenRepairCandidate } from "./green-validator.mjs";
import { buildGreenPrompt } from "./green-prompt-builder.mjs";

const MODULE_PATH = fileURLToPath(import.meta.url);
const GREEN_CHECK_SCRIPTS = ["lint", "typecheck", "test", "build"];
const RED_RESULT_KEYS = new Set([
  "schemaVersion",
  "status",
  "baselineSha",
  "testFile",
  "testName",
  "failureKind",
  "sanitizedSummary",
  "patchSha256",
  "replayConfirmed"
]);

function invalid(error) {
  return { valid: false, error };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function runGit(repoRoot, args, { input } = {}) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    input,
    maxBuffer: 8 * 1024 * 1024,
    shell: false,
    stdio: ["pipe", "pipe", "pipe"]
  });
  if (result.error || result.status !== 0) {
    throw new Error(`git ${args[0]} failed`);
  }
  return result.stdout;
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

function collectSensitiveValues(environment, repoRoot, { output }) {
  const values = new Set([
    repoRoot,
    process.cwd(),
    process.execPath,
    MODULE_PATH
  ]);
  try {
    values.add(fs.realpathSync(repoRoot));
  } catch {
    // The caller will fail repository validation separately.
  }
  for (const [key, value] of Object.entries(environment ?? {})) {
    if (typeof value !== "string" || value.length === 0) continue;
    const sensitiveName =
      /(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH|COOKIE)/i.test(key);
    if (sensitiveName || (output && value.length >= 8)) {
      values.add(value);
    }
  }
  if (output && typeof environment?.PATH === "string") {
    for (const entry of environment.PATH.split(path.delimiter)) {
      if (entry.length >= 4) values.add(entry);
    }
  }
  return [...values].filter(value => typeof value === "string" && value.length > 0);
}

function sanitize(value, sensitiveValues) {
  return redactForOutput(value, sensitiveValues);
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600
  });
}

function validateRedResult(result, finding) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return invalid("stored RED result must be an object");
  }
  const keys = Object.keys(result);
  if (
    keys.some(key => !RED_RESULT_KEYS.has(key)) ||
    [...RED_RESULT_KEYS].some(key => !(key in result))
  ) {
    return invalid("stored RED result fields are invalid");
  }
  if (
    result.schemaVersion !== 1 ||
    result.status !== "red-confirmed" ||
    result.failureKind !== "assertion" ||
    result.replayConfirmed !== true ||
    !/^[0-9a-f]{40,64}$/i.test(result.baselineSha) ||
    !/^[0-9a-f]{64}$/i.test(result.patchSha256) ||
    typeof result.sanitizedSummary !== "string" ||
    result.sanitizedSummary.trim() === "" ||
    result.testFile !== finding.reproduction?.testFile ||
    result.testName !== finding.reproduction?.testName
  ) {
    return invalid("stored RED result contract is invalid");
  }
  return { valid: true };
}

function verifyVitestGreen(execution, { repoRoot, testFile, testName }) {
  const report = execution?.report;
  if (execution?.exitCode !== 0 || !report || typeof report !== "object" || Array.isArray(report)) {
    return invalid("targeted test did not exit successfully");
  }
  if (
    report.success !== true ||
    report.numTotalTests !== 1 ||
    report.numPassedTests !== 1 ||
    report.numFailedTests !== 0 ||
    report.numPendingTests !== 0 ||
    report.numTodoTests !== 0 ||
    report.numTotalTestSuites !== 1 ||
    report.numFailedTestSuites !== 0 ||
    report.numPassedTestSuites !== 1 ||
    !Array.isArray(report.testResults) ||
    report.testResults.length !== 1
  ) {
    return invalid("targeted test did not collect exactly one passing test");
  }
  const fileResult = report.testResults[0];
  if (
    !fileResult ||
    !sameFilePath(fileResult.name, repoRoot, testFile) ||
    fileResult.status !== "passed" ||
    !Array.isArray(fileResult.assertionResults) ||
    fileResult.assertionResults.length !== 1
  ) {
    return invalid("targeted test report does not identify only the designated passing test");
  }
  const assertion = fileResult.assertionResults[0];
  if (
    assertion?.title !== testName ||
    assertion?.status !== "passed"
  ) {
    return invalid("the designated test did not pass as one assertion");
  }
  return { valid: true };
}

function verifyGreenWorktree({ repoRoot, testFile, expectedFiles }) {
  const status = runGit(repoRoot, [
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
    "-z"
  ]);
  const entries = status.split("\0").filter(Boolean);
  const expected = new Set([
    ...expectedFiles.map(filePath => ` M ${filePath}`),
    `?? ${testFile}`
  ]);
  if (entries.length !== expected.size) {
    return invalid(`worktree contains unexpected changes: ${entries.join(", ")}`);
  }
  for (const entry of entries) {
    if (!expected.has(entry)) {
      return invalid(`unexpected worktree change: ${entry}`);
    }
  }
  return { valid: true };
}

function defaultRunCommand(repoRoot) {
  return (script) => {
    const result = spawnSync("pnpm", [script], {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"]
    });
    return {
      exitCode: result.status,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? ""
    };
  };
}

function artifactPaths(repoRoot) {
  const allowedDir = path.join(repoRoot, ".tmp");
  const relativePaths = {
    replayReport: "gemini-correctness/.vitest-green-replay.json",
    finalReport: "gemini-correctness/.vitest-green-final.json",
    result: "gemini-correctness/repair-result.json"
  };
  const resolved = {};
  for (const [key, relativePath] of Object.entries(relativePaths)) {
    const safe = safeWritePath(relativePath, allowedDir, repoRoot);
    if (!safe) throw new Error(`artifact path is unsafe: ${key}`);
    resolved[key] = safe;
  }
  fs.mkdirSync(path.dirname(resolved.result), { recursive: true });
  return resolved;
}

function removeGreenReporterFiles(paths) {
  for (const filePath of [paths?.replayReport, paths?.finalReport]) {
    if (!filePath) continue;
    try {
      fs.rmSync(filePath, { force: true });
    } catch {
      // A stale report makes the next reporter write fail closed.
    }
  }
}

function removeGreenArtifacts(repoRoot) {
  for (const relativePath of [
    "gemini-correctness/.vitest-green-replay.json",
    "gemini-correctness/.vitest-green-final.json",
    "gemini-correctness/repair-result.json",
    "gemini-correctness/green-repair.patch"
  ]) {
    try {
      const candidate = safeWritePath(relativePath, path.join(repoRoot, ".tmp"), repoRoot);
      if (candidate) fs.rmSync(candidate, { force: true });
    } catch {
      // Cleanup is best-effort; a leftover artifact fails a later gate.
    }
  }
}

function finalProductionDiff({ repoRoot, testFile }) {
  const nameStatus = runGit(repoRoot, [
    "diff",
    "--name-status",
    "--no-ext-diff",
    "--no-renames"
  ]).trim();
  const changedFiles = nameStatus
    .split("\n")
    .filter(Boolean)
    .map(line => line.split("\t")[1] ?? "")
    .filter(filePath => filePath !== "" && filePath !== testFile);
  if (changedFiles.some(filePath => !/^[0-9A-Za-z/._-]+$/.test(filePath))) {
    return invalid("final production diff contains an unsafe path");
  }
  const numstat = runGit(repoRoot, [
    "diff",
    "--numstat",
    "--no-ext-diff",
    "--no-renames"
  ]).trim();
  let totalAdditions = 0;
  let totalDeletions = 0;
  for (const line of numstat.split("\n").filter(Boolean)) {
    const [added, removed, filePath] = line.split("\t");
    if (filePath === testFile) continue;
    if (!/^\d+$/.test(added) || !/^\d+$/.test(removed)) {
      return invalid("final production diff is binary or malformed");
    }
    totalAdditions += Number(added);
    totalDeletions += Number(removed);
  }
  const diff = runGit(repoRoot, [
    "diff",
    "--binary",
    "--no-ext-diff",
    "--no-renames"
  ]);
  if (!diff) {
    return invalid("final production diff is empty");
  }
  return {
    valid: true,
    changedFiles: changedFiles.length,
    changedLines: totalAdditions + totalDeletions,
    files: changedFiles,
    diffSha256: sha256(diff)
  };
}

export async function runGreenStage({
  repoRoot,
  finding,
  redResult,
  client,
  allowlist = getDefaultAllowlist(),
  protectedPaths = getDefaultProtectedPaths(),
  environment = process.env,
  spawnFn,
  testTimeoutMs,
  guardedRunner = runTargetedVitest,
  runCommand = defaultRunCommand(repoRoot)
} = {}) {
  const outputSecrets = collectSensitiveValues(environment, repoRoot, { output: true });
  let paths;
  let trustedBaseline = "";
  let appliedProductionFiles = [];

  function safeError(message, cleanupError) {
    return sanitize(
      `${message ?? "GREEN stage failed closed"}${cleanupError}`,
      outputSecrets
    );
  }

  async function failClosed(status, message, cleanupError = "") {
    try {
      if (trustedBaseline) {
        const reset = resetRedWorktree({
          repoRoot,
          baselineSha: trustedBaseline,
          testFile: finding?.reproduction?.testFile
        });
        if (!reset.valid) cleanupError = `${cleanupError || ""}; worktree cleanup could not be verified`;
      }
    } catch {
      cleanupError = `${cleanupError || ""}; worktree cleanup could not be verified`;
    }
    removeGreenArtifacts(repoRoot);
    removeGreenReporterFiles(paths);
    return { valid: false, status, error: safeError(message, cleanupError) };
  }

  try {
    const baseline = captureCleanBaseline({
      repoRoot,
      testFile: finding?.reproduction?.testFile
    });
    if (!baseline.valid) throw new Error(baseline.error);
    if (baseline.baselineSha !== redResult?.baselineSha) {
      throw new Error("worktree HEAD does not match the recorded RED baseline SHA");
    }
    trustedBaseline = baseline.baselineSha;

    const redValidation = validateRedResult(redResult, finding);
    if (!redValidation.valid) throw new Error(redValidation.error);

    const safePatch = safeWritePath(
      "gemini-correctness/red-test.patch",
      path.join(repoRoot, ".tmp"),
      repoRoot
    );
    if (!safePatch) throw new Error("RED patch artifact is unsafe");
    const patchStat = fs.lstatSync(safePatch);
    if (!patchStat.isFile() || patchStat.isSymbolicLink() || patchStat.size > 128 * 1024) {
      throw new Error("RED patch artifact is missing, unsafe, or too large");
    }
    const patch = fs.readFileSync(safePatch, "utf8");
    if (sha256(patch) !== redResult.patchSha256) {
      throw new Error("stored RED patch SHA-256 does not match redResult.patchSha256");
    }

    runGit(repoRoot, ["apply", "--binary", "--whitespace=nowarn", "-"], { input: patch });

    const testWorktree = validateTestOnlyWorktree({
      repoRoot,
      baselineSha: trustedBaseline,
      testFile: redResult.testFile
    });
    if (!testWorktree.valid) throw new Error(testWorktree.error);

    const testSource = fs.readFileSync(path.join(repoRoot, redResult.testFile), "utf8");
    const testSourceBefore = sha256(testSource);

    paths = artifactPaths(repoRoot);
    removeGreenReporterFiles(paths);
    const replay = await guardedRunner({
      repoRoot,
      testFile: redResult.testFile,
      testName: redResult.testName,
      reportPath: paths.replayReport,
      spawnFn,
      environment,
      timeoutMs: testTimeoutMs
    });
    if (!replay.valid) throw new Error(replay.error);
    const replayClassification = classifyVitestRed({
      ...replay,
      repoRoot,
      testFile: redResult.testFile,
      testName: redResult.testName,
      finding
    });
    if (
      !replayClassification.valid ||
      replayClassification.failureKind !== redResult.failureKind ||
      sanitize(replayClassification.sanitizedSummary, outputSecrets) !== redResult.sanitizedSummary
    ) {
      throw new Error(replayClassification.error || "RED replay classification changed");
    }
    fs.rmSync(paths.replayReport, { force: true });

    if (!client || typeof client.generateJson !== "function") {
      throw new Error("Gemini client with generateJson is required");
    }

    const greenScan = scanRepository({
      repoRoot,
      allowlist,
      protectedPaths
    });
    const greenPrompt = buildGreenPrompt({
      finding,
      redResult,
      regressionTestSource: testSource,
      scannedFiles: greenScan.scannedFiles,
      redTestFailure: {
        stdout: replay.stdout ?? "",
        stderr: replay.stderr ?? ""
      }
    });

    const generated = await client.generateJson({
      prompt: greenPrompt.prompt
    });
    if (!generated?.valid || !generated.result) {
      return failClosed(
        "repair-not-found",
        generated?.error || "Gemini GREEN response was invalid"
      );
    }
    const modelResult = generated.result;
    if (
      modelResult &&
      typeof modelResult === "object" &&
      !Array.isArray(modelResult) &&
      modelResult.status === "needs-human-scope-expansion"
    ) {
      const reason = typeof modelResult.reason === "string" ? modelResult.reason : "";
      return failClosed(
        "needs-human-scope-expansion",
        `Gemini requested scope expansion: ${reason}`
      );
    }

    const repairValidation = validateGreenRepairCandidate(modelResult, {
      finding,
      sensitiveValues: collectSensitiveValues(environment, repoRoot, { output: false }),
      allowlist,
      protectedPaths
    });
    if (!repairValidation.valid) {
      return failClosed("diff-policy-rejected", repairValidation.error);
    }
    appliedProductionFiles = repairValidation.result.files;

    // Repo-contained application: prove the diff applies cleanly before
    // touching the worktree, then apply it in place.
    try {
      runGit(
        repoRoot,
        ["apply", "--check", "--binary", "--whitespace=nowarn", "-"],
        { input: repairValidation.result.diff }
      );
    } catch {
      return failClosed("diff-policy-rejected", "Gemini repair diff cannot be applied cleanly");
    }
    runGit(
      repoRoot,
      ["apply", "--binary", "--whitespace=nowarn", "-"],
      { input: repairValidation.result.diff }
    );

    const greenWorktree = verifyGreenWorktree({
      repoRoot,
      testFile: redResult.testFile,
      expectedFiles: appliedProductionFiles
    });
    if (!greenWorktree.valid) {
      return failClosed("diff-policy-rejected", greenWorktree.error);
    }
    const testSourceAfterPatch = sha256(
      fs.readFileSync(path.join(repoRoot, redResult.testFile), "utf8")
    );
    if (testSourceAfterPatch !== testSourceBefore) {
      return failClosed("diff-policy-rejected", "regression test content changed after applying the repair diff");
    }

    removeGreenReporterFiles(paths);
    const finalExecution = await guardedRunner({
      repoRoot,
      testFile: redResult.testFile,
      testName: redResult.testName,
      reportPath: paths.finalReport,
      spawnFn,
      environment,
      timeoutMs: testTimeoutMs
    });
    if (!finalExecution.valid) {
      return failClosed("targeted-test-failed", finalExecution.error);
    }
    const greenPassed = verifyVitestGreen(finalExecution, {
      repoRoot,
      testFile: redResult.testFile,
      testName: redResult.testName
    });
    if (!greenPassed.valid) {
      return failClosed("targeted-test-failed", greenPassed.error);
    }
    fs.rmSync(paths.finalReport, { force: true });

    const checks = [{ name: "targeted-test", status: "passed" }];
    for (const script of GREEN_CHECK_SCRIPTS) {
      let execution;
      try {
        execution = await runCommand(script);
      } catch {
        return failClosed("full-check-failed", `${script} invocation failed`);
      }
      if (execution?.exitCode !== 0) {
        return failClosed(
          "full-check-failed",
          `${script} failed:\n${sanitize(`${execution?.stdout ?? ""}\n${execution?.stderr ?? ""}`, outputSecrets)}`
        );
      }
      checks.push({ name: script, status: "passed" });
    }

    try {
      runGit(repoRoot, ["diff", "--check"]);
    } catch {
      return failClosed("full-check-failed", "git diff --check failed (whitespace errors)");
    }

    const finalGuard = verifyGreenWorktree({
      repoRoot,
      testFile: redResult.testFile,
      expectedFiles: appliedProductionFiles
    });
    if (!finalGuard.valid) {
      return failClosed("full-check-failed", `build produced extra changes: ${finalGuard.error}`);
    }

    const finalDiff = finalProductionDiff({ repoRoot, testFile: redResult.testFile });
    if (!finalDiff.valid) return failClosed("full-check-failed", finalDiff.error);
    if (finalDiff.changedFiles > MAX_GREEN_PRODUCTION_FILES) {
      return failClosed(
        "diff-policy-rejected",
        `final production diff touches ${finalDiff.changedFiles} files; budget is ${MAX_GREEN_PRODUCTION_FILES}`
      );
    }
    if (finalDiff.changedLines > MAX_GREEN_DIFF_LINES) {
      return failClosed(
        "diff-policy-rejected",
        `final production diff changes ${finalDiff.changedLines} lines; budget is ${MAX_GREEN_DIFF_LINES}`
      );
    }

    const repairResult = {
      schemaVersion: 1,
      status: "repair-verified",
      baselineSha: trustedBaseline,
      findingTitle: finding.title,
      testFile: redResult.testFile,
      testName: redResult.testName,
      productionFiles: appliedProductionFiles,
      rootCause: repairValidation.result.rootCause,
      fixSummary: repairValidation.result.fixSummary,
      checks,
      changedFiles: finalDiff.changedFiles,
      changedLines: finalDiff.changedLines,
      testPatchSha256: redResult.patchSha256,
      finalDiffSha256: finalDiff.diffSha256
    };

    paths = artifactPaths(repoRoot);
    writeJson(paths.result, repairResult);
    return { valid: true, result: repairResult };
  } catch (error) {
    let cleanupError = "";
    try {
      if (trustedBaseline) {
        const reset = resetRedWorktree({
          repoRoot,
          baselineSha: trustedBaseline,
          testFile: finding?.reproduction?.testFile
        });
        if (!reset.valid) cleanupError = "; worktree cleanup could not be verified";
      }
    } catch {
      cleanupError = "; worktree cleanup could not be verified";
    }
    removeGreenArtifacts(repoRoot);
    removeGreenReporterFiles(paths);
    const message = error?.message || "GREEN stage failed closed";
    return {
      valid: false,
      status: /baseline|clean/i.test(message) ? "baseline-mismatch" : "red-replay-failed",
      error: safeError(message, cleanupError)
    };
  } finally {
    removeGreenReporterFiles(paths);
  }
}
