// =============================================================================
// red-stage.mjs — orchestrates one fail-closed, replayable RED test stage
// =============================================================================

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createGeminiClient } from "./gemini-client.mjs";
import { redactForOutput } from "./discover.mjs";
import { validateFinding } from "./finding-schema.mjs";
import {
  getDefaultAllowlist,
  getDefaultProtectedPaths,
  safeWritePath
} from "./policy.mjs";
import { buildRedPrompt } from "./red-prompt-builder.mjs";
import { DEFAULT_MODEL } from "./prompt-builder.mjs";
import {
  captureCleanBaseline,
  createTestOnlyPatch,
  validateRegressionCandidate,
  validateTestOnlyWorktree
} from "./red-validator.mjs";
import {
  classifyVitestRed,
  runTargetedVitest
} from "./red-runner.mjs";
import { validateFindingWithRepo } from "./repo-validator.mjs";
import { scanRepository } from "./scanner.mjs";

const MODULE_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(MODULE_PATH), "..", "..");
const ARTIFACT_RELATIVE_DIR = "gemini-correctness";
const FINDING_RELATIVE_PATH = `${ARTIFACT_RELATIVE_DIR}/finding.json`;
const RESULT_KEYS = new Set([
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

export function parseRedStageArgs(argv) {
  const parsed = { model: DEFAULT_MODEL };
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument !== "--model") {
      throw new Error(`unsupported RED stage argument: ${argument}`);
    }
    const model = argv[++index];
    if (
      typeof model !== "string" ||
      !/^gemini-[A-Za-z0-9._-]{1,100}$/.test(model)
    ) {
      throw new Error("model must be a bounded Gemini model identifier");
    }
    parsed.model = model;
  }
  return parsed;
}

export function resolveFindingInputPath(repoRoot) {
  try {
    const allowedDir = path.join(repoRoot, ".tmp");
    const allowedStat = fs.lstatSync(allowedDir);
    if (allowedStat.isSymbolicLink() || !allowedStat.isDirectory()) return null;
    const candidate = safeWritePath(
      FINDING_RELATIVE_PATH,
      allowedDir,
      repoRoot
    );
    if (!candidate) return null;
    const stat = fs.lstatSync(candidate);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 64 * 1024) {
      return null;
    }
    return candidate;
  } catch {
    return null;
  }
}

export function extractValidatedFinding(input) {
  if (
    input &&
    typeof input === "object" &&
    !Array.isArray(input) &&
    input.status === "finding"
  ) {
    return input;
  }
  if (
    input &&
    typeof input === "object" &&
    !Array.isArray(input) &&
    Object.keys(input).length === 2 &&
    input.valid === true &&
    input.result &&
    typeof input.result === "object" &&
    !Array.isArray(input.result) &&
    input.result.status === "finding"
  ) {
    return input.result;
  }
  return null;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function runGit(repoRoot, args, { input } = {}) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    input,
    maxBuffer: 2 * 1024 * 1024,
    shell: false,
    stdio: ["pipe", "pipe", "pipe"]
  });
  if (result.error || result.status !== 0) {
    throw new Error(`git ${args[0]} failed`);
  }
  return result.stdout;
}

function artifactPaths(repoRoot) {
  const allowedDir = path.join(repoRoot, ".tmp");
  const relativePaths = {
    patch: `${ARTIFACT_RELATIVE_DIR}/red-test.patch`,
    result: `${ARTIFACT_RELATIVE_DIR}/red-result.json`,
    log: `${ARTIFACT_RELATIVE_DIR}/red-test.log`,
    initialReport: `${ARTIFACT_RELATIVE_DIR}/.vitest-initial.json`,
    replayReport: `${ARTIFACT_RELATIVE_DIR}/.vitest-replay.json`
  };

  const initialCandidate = safeWritePath(relativePaths.patch, allowedDir, repoRoot);
  if (!initialCandidate) throw new Error("artifact directory is unsafe");
  fs.mkdirSync(path.dirname(initialCandidate), { recursive: true });

  const resolved = {};
  for (const [key, relativePath] of Object.entries(relativePaths)) {
    const safe = safeWritePath(relativePath, allowedDir, repoRoot);
    if (!safe) throw new Error(`artifact path is unsafe: ${key}`);
    resolved[key] = safe;
  }
  return resolved;
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

const RED_RESULT_CONTRACT_KEYS = new Set([
  "schemaVersion",
  "status",
  "baselineSha",
  "testFile",
  "testName",
  "failureKind",
  "patchSha256",
  "replayConfirmed"
]);

function sanitizeRedResult(result, sensitiveValues) {
  const preserved = {};
  for (const key of RED_RESULT_CONTRACT_KEYS) {
    preserved[key] = result[key];
  }
  const safe = sanitize(result, sensitiveValues);
  for (const key of RED_RESULT_CONTRACT_KEYS) {
    safe[key] = preserved[key];
  }
  return safe;
}

function reportFailureMessages(report) {
  if (!Array.isArray(report?.testResults)) return "";
  return report.testResults
    .flatMap(file => Array.isArray(file.assertionResults) ? file.assertionResults : [])
    .flatMap(assertion =>
      Array.isArray(assertion.failureMessages) ? assertion.failureMessages : []
    )
    .join("\n");
}

function executionLog(label, execution) {
  return [
    `[${label}]`,
    `exitCode=${String(execution.exitCode)}`,
    `signal=${String(execution.signal ?? "")}`,
    execution.stdout ?? "",
    execution.stderr ?? "",
    reportFailureMessages(execution.report)
  ].filter(Boolean).join("\n");
}

function boundedLog(value) {
  const maxChars = 128 * 1024;
  if (value.length <= maxChars) return value.endsWith("\n") ? value : `${value}\n`;
  return `${value.slice(0, maxChars)}\n[log truncated]\n`;
}

const MAX_EXECUTION_SNAPSHOT_BYTES = 512 * 1024 * 1024;

function executionSnapshot({
  repoRoot,
  testFile,
  reportPath
}) {
  const repoReal = fs.realpathSync(repoRoot);
  const excluded = new Set([testFile]);
  const reportRelative = path.relative(repoReal, reportPath).replace(/\\/g, "/");
  if (
    !reportRelative ||
    reportRelative.startsWith("../") ||
    path.isAbsolute(reportRelative)
  ) {
    throw new Error("Vitest report path escaped repository");
  }
  excluded.add(reportRelative);

  const entries = new Map();
  let totalBytes = 0;
  let restorable = true;

  function walk(relativeDirectory) {
    const absoluteDirectory = relativeDirectory
      ? path.join(repoReal, relativeDirectory)
      : repoReal;
    let children;
    try {
      children = fs.readdirSync(absoluteDirectory, { withFileTypes: true })
        .sort((left, right) => left.name.localeCompare(right.name));
    } catch (error) {
      if (!relativeDirectory) throw error;
      const previous = entries.get(relativeDirectory) ?? { mode: -1 };
      entries.set(relativeDirectory, { ...previous, kind: "unreadable" });
      restorable = false;
      return;
    }
    for (const child of children) {
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${child.name}`
        : child.name;
      if (
        relativePath === ".git/objects" ||
        relativePath.startsWith(".git/objects/") ||
        relativePath.split("/").includes("node_modules") ||
        excluded.has(relativePath)
      ) {
        continue;
      }

      const absolutePath = path.join(repoReal, relativePath);
      let stat;
      try {
        stat = fs.lstatSync(absolutePath);
      } catch {
        entries.set(relativePath, { kind: "unreadable", mode: -1 });
        restorable = false;
        continue;
      }
      const metadata = {
        mode: stat.mode & 0o777,
        atimeMs: stat.atimeMs,
        mtimeMs: stat.mtimeMs
      };
      if (stat.isSymbolicLink()) {
        try {
          entries.set(relativePath, {
            ...metadata,
            kind: "symlink",
            target: fs.readlinkSync(absolutePath)
          });
        } catch {
          entries.set(relativePath, { ...metadata, kind: "unreadable" });
          restorable = false;
        }
      } else if (stat.isDirectory()) {
        entries.set(relativePath, { ...metadata, kind: "directory" });
        walk(relativePath);
      } else if (stat.isFile()) {
        if (totalBytes + stat.size > MAX_EXECUTION_SNAPSHOT_BYTES) {
          entries.set(relativePath, {
            ...metadata,
            kind: "oversized",
            size: stat.size
          });
          restorable = false;
          continue;
        }
        try {
          const content = fs.readFileSync(absolutePath);
          totalBytes += content.byteLength;
          entries.set(relativePath, {
            ...metadata,
            kind: "file",
            content
          });
        } catch {
          entries.set(relativePath, { ...metadata, kind: "unreadable" });
          restorable = false;
        }
      } else {
        entries.set(relativePath, { ...metadata, kind: "special" });
        restorable = false;
      }
    }
  }

  walk("");
  return { entries, repoRoot: repoReal, testFile, reportPath, restorable };
}

function sameSnapshotEntry(left, right) {
  if (!left || !right || left.kind !== right.kind || left.mode !== right.mode) {
    return false;
  }
  if (left.kind === "file") return left.content.equals(right.content);
  if (left.kind === "symlink") return left.target === right.target;
  if (left.kind === "oversized") return left.size === right.size;
  return true;
}

function changedSnapshotRoots(before, after) {
  const changed = [...new Set([
    ...before.entries.keys(),
    ...after.entries.keys()
  ])]
    .filter(relativePath =>
      !sameSnapshotEntry(
        before.entries.get(relativePath),
        after.entries.get(relativePath)
      )
    )
    .sort((left, right) => {
      const depth = left.split("/").length - right.split("/").length;
      return depth || left.localeCompare(right);
    });

  const roots = [];
  for (const relativePath of changed) {
    if (!roots.some(root => relativePath.startsWith(`${root}/`))) {
      roots.push(relativePath);
    }
  }
  return roots;
}

function restoreExecutionSnapshot(before, after) {
  const roots = changedSnapshotRoots(before, after);
  if (roots.length === 0) return { valid: true, mutated: false };

  try {
    for (const relativePath of roots) {
      const absolutePath = path.resolve(before.repoRoot, relativePath);
      const containment = path.relative(before.repoRoot, absolutePath);
      if (
        !containment ||
        containment.startsWith("..") ||
        path.isAbsolute(containment)
      ) {
        throw new Error("execution mutation escaped repository");
      }
      fs.rmSync(absolutePath, { recursive: true, force: true });
    }

    for (const root of roots) {
      const restoreEntries = [...before.entries.entries()]
        .filter(([relativePath]) =>
          relativePath === root || relativePath.startsWith(`${root}/`)
        )
        .sort(([left], [right]) => {
          const depth = left.split("/").length - right.split("/").length;
          return depth || left.localeCompare(right);
        });
      for (const [relativePath, entry] of restoreEntries) {
        const absolutePath = path.join(before.repoRoot, relativePath);
        if (entry.kind === "directory") {
          fs.mkdirSync(absolutePath, { recursive: true, mode: 0o700 });
        } else if (entry.kind === "file") {
          fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
          fs.writeFileSync(absolutePath, entry.content, { mode: entry.mode });
          fs.chmodSync(absolutePath, entry.mode);
          fs.utimesSync(absolutePath, entry.atimeMs / 1000, entry.mtimeMs / 1000);
        } else if (entry.kind === "symlink") {
          fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
          fs.symlinkSync(entry.target, absolutePath);
        } else {
          throw new Error("cannot restore a changed special repository entry");
        }
      }
      for (const [relativePath, entry] of restoreEntries.reverse()) {
        if (entry.kind !== "directory") continue;
        const absolutePath = path.join(before.repoRoot, relativePath);
        fs.chmodSync(absolutePath, entry.mode);
        fs.utimesSync(absolutePath, entry.atimeMs / 1000, entry.mtimeMs / 1000);
      }
    }

    const restored = executionSnapshot(before);
    if (changedSnapshotRoots(before, restored).length !== 0) {
      return invalid("test execution mutation cleanup could not be verified");
    }
    return { valid: true, mutated: true };
  } catch {
    return invalid("test execution mutation cleanup could not be verified");
  }
}

export async function runGuardedTargetedVitest(options, {
  snapshot = executionSnapshot,
  targetedRunner = runTargetedVitest,
  restoreSnapshot = restoreExecutionSnapshot
} = {}) {
  let before;
  try {
    before = snapshot(options);
  } catch {
    return invalid("failed to capture repository state before targeted Vitest");
  }
  if (!before.restorable) {
    return invalid("repository state is not safely snapshot-restorable");
  }

  const execution = await targetedRunner(options);
  let after;
  try {
    after = snapshot(options);
  } catch {
    return invalid("failed to capture repository state after targeted Vitest");
  }
  const restoration = restoreSnapshot(before, after);
  if (!restoration.valid) return restoration;
  if (restoration.mutated) {
    return invalid("targeted Vitest modified repository paths outside its test/report");
  }
  return execution;
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600
  });
}

function removeReporterFiles(paths) {
  for (const filePath of [paths?.initialReport, paths?.replayReport]) {
    if (!filePath) continue;
    try {
      fs.rmSync(filePath, { force: true });
    } catch {
      // A stale report makes the next reporter write fail closed.
    }
  }
}

export function resetRedWorktree({ repoRoot, baselineSha } = {}) {
  try {
    if (!/^[0-9a-f]{40,64}$/i.test(String(baselineSha ?? ""))) {
      return invalid("baseline SHA is invalid");
    }
    runGit(repoRoot, ["cat-file", "-e", `${baselineSha}^{commit}`]);
    runGit(repoRoot, ["reset", "--hard", baselineSha]);
    const untrackedStatus = runGit(repoRoot, [
      "status",
      "--porcelain=v1",
      "--untracked-files=all",
      "-z"
    ]);
    const untrackedEntries = untrackedStatus.split("\0").filter(Boolean);
    for (const entry of untrackedEntries) {
      if (!entry.startsWith("?? ")) {
        return invalid("tracked changes remain after baseline reset");
      }
      const relativePath = entry.slice(3);
      const absolutePath = path.resolve(repoRoot, relativePath);
      const relativeCheck = path.relative(repoRoot, absolutePath);
      if (!relativeCheck || relativeCheck.startsWith("..") || path.isAbsolute(relativeCheck)) {
        return invalid("untracked cleanup path escaped repository");
      }
      fs.rmSync(absolutePath, { recursive: true, force: true });
    }
    if (runGit(repoRoot, ["rev-parse", "HEAD"]).trim() !== baselineSha) {
      return invalid("failed to restore baseline HEAD");
    }
    const status = runGit(repoRoot, [
      "status",
      "--porcelain=v1",
      "--untracked-files=all",
      "-z"
    ]);
    if (status !== "") return invalid("worktree is not clean after reset");
    return { valid: true };
  } catch {
    return invalid("failed to reset worktree to baseline");
  }
}

function verifyCandidateIntegrity({
  repoRoot,
  baselineSha,
  testFile,
  expectedPatchSha256
}) {
  const worktree = validateTestOnlyWorktree({
    repoRoot,
    baselineSha,
    testFile
  });
  if (!worktree.valid) return worktree;
  const currentPatch = createTestOnlyPatch({
    repoRoot,
    baselineSha,
    testFile
  });
  if (!currentPatch.valid) return currentPatch;
  if (sha256(currentPatch.patch) !== expectedPatchSha256) {
    return invalid("candidate test patch changed during RED execution");
  }
  return { valid: true };
}

function validateStoredResult(result, finding) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return invalid("stored RED result must be an object");
  }
  const keys = Object.keys(result);
  if (
    keys.some(key => !RESULT_KEYS.has(key)) ||
    [...RESULT_KEYS].some(key => !(key in result))
  ) {
    return invalid("stored RED result fields are invalid");
  }
  if (
    result.schemaVersion !== 1 ||
    result.status !== "red-confirmed" ||
    result.failureKind !== "assertion" ||
    typeof result.replayConfirmed !== "boolean" ||
    !/^[0-9a-f]{40,64}$/i.test(result.baselineSha) ||
    !/^[0-9a-f]{64}$/i.test(result.patchSha256) ||
    result.testFile !== finding.reproduction.testFile ||
    result.testName !== finding.reproduction.testName
  ) {
    return invalid("stored RED result contract is invalid");
  }
  return { valid: true };
}

function validatePatchShape(repoRoot, patch, testFile) {
  try {
    const numstat = runGit(
      repoRoot,
      ["apply", "--numstat", "--binary", "-"],
      { input: patch }
    ).trim();
    const [added, removed, changedPath] = numstat.split("\t");
    if (
      !/^\d+$/.test(added) ||
      removed !== "0" ||
      changedPath !== testFile
    ) {
      return invalid("stored patch is not one text-only added test");
    }
    runGit(
      repoRoot,
      ["apply", "--check", "--binary", "--whitespace=nowarn", "-"],
      { input: patch }
    );
    return { valid: true };
  } catch {
    return invalid("stored patch cannot be safely applied");
  }
}

export async function replayRedArtifacts({
  repoRoot,
  finding,
  environment = process.env,
  spawnFn,
  timeoutMs,
  expectedBaselineSha,
  expectedPatchSha256,
  expectedSummary
} = {}) {
  let paths;
  let trustedBaseline = "";
  try {
    paths = artifactPaths(repoRoot);
    const resultStat = fs.lstatSync(paths.result);
    const patchStat = fs.lstatSync(paths.patch);
    if (
      !resultStat.isFile() ||
      resultStat.isSymbolicLink() ||
      resultStat.size > 64 * 1024 ||
      !patchStat.isFile() ||
      patchStat.isSymbolicLink() ||
      patchStat.size > 128 * 1024
    ) {
      return invalid("RED artifacts are missing, unsafe, or too large");
    }

    const storedResult = JSON.parse(fs.readFileSync(paths.result, "utf8"));
    const storedValidation = validateStoredResult(storedResult, finding);
    if (!storedValidation.valid) return storedValidation;
    // The provisional artifact's summary is written through
    // sanitizeRedResult(..., outputSecrets) with output: true, which also
    // treats any env value of length >= 8 as sensitive. Sanitize the trusted
    // in-memory expectation with the same output: true set so both sides use
    // identical normalization before comparing.
    const expectedOutputSecrets = collectSensitiveValues(
      environment,
      repoRoot,
      { output: true }
    );
    const expectedSanitizedSummary = sanitize(expectedSummary, expectedOutputSecrets);
    if (
      storedResult.baselineSha !== expectedBaselineSha ||
      storedResult.patchSha256 !== expectedPatchSha256 ||
      storedResult.sanitizedSummary !== expectedSanitizedSummary
    ) {
      return invalid("stored RED result does not match trusted replay expectations");
    }
    trustedBaseline = storedResult.baselineSha;

    const baseline = captureCleanBaseline({
      repoRoot,
      testFile: storedResult.testFile
    });
    if (!baseline.valid || baseline.baselineSha !== trustedBaseline) {
      return invalid("stored baseline SHA does not match the clean worktree");
    }
    const replayScan = scanRepository({
      repoRoot,
      allowlist: getDefaultAllowlist(),
      protectedPaths: getDefaultProtectedPaths()
    });
    const replayPrompt = buildRedPrompt({
      baselineSha: trustedBaseline,
      finding,
      scannedFiles: replayScan.scannedFiles
    });

    const patch = fs.readFileSync(paths.patch, "utf8");
    if (sha256(patch) !== storedResult.patchSha256) {
      return invalid("stored patch SHA-256 does not match patch content");
    }
    const shape = validatePatchShape(repoRoot, patch, storedResult.testFile);
    if (!shape.valid) return shape;

    runGit(
      repoRoot,
      ["apply", "--binary", "--whitespace=nowarn", "-"],
      { input: patch }
    );

    const worktree = validateTestOnlyWorktree({
      repoRoot,
      baselineSha: trustedBaseline,
      testFile: storedResult.testFile
    });
    if (!worktree.valid) throw new Error(worktree.error);

    const source = fs.readFileSync(path.join(repoRoot, storedResult.testFile), "utf8");
    const candidate = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: storedResult.testFile,
        testName: storedResult.testName,
        source
      },
      {
        finding,
        sensitiveValues: collectSensitiveValues(environment, repoRoot, { output: false }),
        allowedRepositoryFiles: replayPrompt.manifest
      }
    );
    if (!candidate.valid) throw new Error(candidate.error);

    fs.rmSync(paths.replayReport, { force: true });
    const execution = await runGuardedTargetedVitest({
      repoRoot,
      testFile: storedResult.testFile,
      testName: storedResult.testName,
      reportPath: paths.replayReport,
      spawnFn,
      environment,
      timeoutMs
    });
    if (!execution.valid) throw new Error(execution.error);
    const classification = classifyVitestRed({
      ...execution,
      repoRoot,
      testFile: storedResult.testFile,
      testName: storedResult.testName,
      finding
    });
    if (
      !classification.valid ||
      classification.failureKind !== storedResult.failureKind ||
      sanitize(classification.sanitizedSummary, expectedOutputSecrets) !==
        storedResult.sanitizedSummary
    ) {
      throw new Error(classification.error || "replay RED classification changed");
    }
    const postExecution = verifyCandidateIntegrity({
      repoRoot,
      baselineSha: trustedBaseline,
      testFile: storedResult.testFile,
      expectedPatchSha256: storedResult.patchSha256
    });
    if (!postExecution.valid) throw new Error(postExecution.error);

    const postPatchStat = fs.lstatSync(paths.patch);
    const postResultStat = fs.lstatSync(paths.result);
    if (
      !postPatchStat.isFile() ||
      postPatchStat.isSymbolicLink() ||
      postPatchStat.size > 128 * 1024 ||
      !postResultStat.isFile() ||
      postResultStat.isSymbolicLink() ||
      postResultStat.size > 64 * 1024
    ) {
      throw new Error("RED artifacts became unsafe during replay execution");
    }
    const postPatch = fs.readFileSync(paths.patch, "utf8");
    const postResult = JSON.parse(fs.readFileSync(paths.result, "utf8"));
    if (sha256(postPatch) !== expectedPatchSha256) {
      throw new Error("stored patch changed during replay execution");
    }
    if (JSON.stringify(postResult) !== JSON.stringify(storedResult)) {
      throw new Error("stored RED result changed during replay execution");
    }
    return { valid: true, classification, execution };
  } catch (error) {
    let cleanupError = "";
    if (trustedBaseline) {
      const cleanup = resetRedWorktree({
        repoRoot,
        baselineSha: trustedBaseline,
        testFile: finding?.reproduction?.testFile
      });
      if (!cleanup.valid) cleanupError = "; worktree cleanup could not be verified";
    }
    return invalid(
      `${error?.message || "RED artifact replay failed"}${cleanupError}`
    );
  } finally {
    if (paths?.replayReport) {
      try {
        fs.rmSync(paths.replayReport, { force: true });
      } catch {
        // Ignored: the report path is never a published artifact.
      }
    }
  }
}

export async function runRedStage({
  repoRoot,
  finding,
  client,
  allowlist = getDefaultAllowlist(),
  protectedPaths = getDefaultProtectedPaths(),
  environment = process.env,
  spawnFn,
  testTimeoutMs
} = {}) {
  let baselineSha = "";
  let paths;
  const outputSecrets = collectSensitiveValues(environment, repoRoot, { output: true });

  try {
    const baseline = captureCleanBaseline({
      repoRoot,
      testFile: finding?.reproduction?.testFile
    });
    if (!baseline.valid) throw new Error(baseline.error);
    baselineSha = baseline.baselineSha;

    const schema = validateFinding(finding, { allowlist, protectedPaths });
    if (!schema.valid || schema.result?.status !== "finding") {
      throw new Error(schema.error || "input must be one validated finding");
    }

    const scan = scanRepository({
      repoRoot,
      allowlist,
      protectedPaths
    });
    const repoValidation = validateFindingWithRepo(schema.result, {
      repoRoot,
      manifest: scan.manifest,
      allowlist,
      protectedPaths,
      scannedFiles: scan.scannedFiles
    });
    if (!repoValidation.valid) throw new Error(repoValidation.error);

    const prompt = buildRedPrompt({
      baselineSha,
      finding: schema.result,
      scannedFiles: scan.scannedFiles
    });
    if (!client || typeof client.generateJson !== "function") {
      throw new Error("Gemini client with generateJson is required");
    }
    const generated = await client.generateJson({ prompt: prompt.prompt });
    if (!generated?.valid) {
      throw new Error(generated?.error || "Gemini RED response was invalid");
    }

    const candidate = validateRegressionCandidate(generated.result, {
      finding: schema.result,
      sensitiveValues: collectSensitiveValues(environment, repoRoot, { output: false }),
      allowedRepositoryFiles: prompt.manifest
    });
    if (!candidate.valid) throw new Error(candidate.error);

    const testAbsolute = path.join(repoRoot, candidate.result.testFile);
    fs.writeFileSync(testAbsolute, candidate.result.source, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600
    });

    const worktree = validateTestOnlyWorktree({
      repoRoot,
      baselineSha,
      testFile: candidate.result.testFile
    });
    if (!worktree.valid) throw new Error(worktree.error);

    const patchResult = createTestOnlyPatch({
      repoRoot,
      baselineSha,
      testFile: candidate.result.testFile
    });
    if (!patchResult.valid) throw new Error(patchResult.error);
    const patchHash = sha256(patchResult.patch);

    paths = artifactPaths(repoRoot);
    removeReporterFiles(paths);
    const initialExecution = await runGuardedTargetedVitest({
      repoRoot,
      testFile: candidate.result.testFile,
      testName: candidate.result.testName,
      reportPath: paths.initialReport,
      spawnFn,
      environment,
      timeoutMs: testTimeoutMs
    });
    if (!initialExecution.valid) throw new Error(initialExecution.error);
    const initialClassification = classifyVitestRed({
      ...initialExecution,
      repoRoot,
      testFile: candidate.result.testFile,
      testName: candidate.result.testName,
      finding: schema.result
    });
    if (!initialClassification.valid) throw new Error(initialClassification.error);
    const postInitial = verifyCandidateIntegrity({
      repoRoot,
      baselineSha,
      testFile: candidate.result.testFile,
      expectedPatchSha256: patchHash
    });
    if (!postInitial.valid) throw new Error(postInitial.error);

    fs.writeFileSync(paths.patch, patchResult.patch, {
      encoding: "utf8",
      mode: 0o600
    });
    const provisionalResult = {
      schemaVersion: 1,
      status: "red-confirmed",
      baselineSha,
      testFile: candidate.result.testFile,
      testName: candidate.result.testName,
      failureKind: "assertion",
      sanitizedSummary: initialClassification.sanitizedSummary,
      patchSha256: patchHash,
      replayConfirmed: false
    };
    const safeProvisional = sanitizeRedResult(provisionalResult, outputSecrets);
    writeJson(paths.result, safeProvisional);

    const reset = resetRedWorktree({
      repoRoot,
      baselineSha,
      testFile: candidate.result.testFile
    });
    if (!reset.valid) throw new Error(reset.error);

    const replay = await replayRedArtifacts({
      repoRoot,
      finding: schema.result,
      environment,
      spawnFn,
      timeoutMs: testTimeoutMs,
      expectedBaselineSha: baselineSha,
      expectedPatchSha256: patchHash,
      expectedSummary: initialClassification.sanitizedSummary
    });
    if (!replay.valid) throw new Error(replay.error);

    const finalResult = {
      ...provisionalResult,
      replayConfirmed: true
    };
    const safeResult = sanitizeRedResult(finalResult, outputSecrets);
    const safeLog = boundedLog(sanitize(
      `${executionLog("initial", initialExecution)}\n\n` +
      executionLog("replay", replay.execution),
      outputSecrets
    ));
    writeJson(paths.result, safeResult);
    fs.writeFileSync(paths.log, safeLog, {
      encoding: "utf8",
      mode: 0o600
    });
    return { valid: true, result: safeResult };
  } catch (error) {
    let cleanupError = "";
    if (baselineSha) {
      const cleanup = resetRedWorktree({
        repoRoot,
        baselineSha,
        testFile: finding?.reproduction?.testFile
      });
      if (!cleanup.valid) cleanupError = "; worktree cleanup could not be verified";
    }
    const safeError = sanitize(
      `${error?.message || "RED stage failed closed"}${cleanupError}`,
      outputSecrets
    );
    try {
      paths = paths ?? artifactPaths(repoRoot);
      const rejected = {
        schemaVersion: 1,
        status: "rejected",
        sanitizedSummary: safeError
      };
      writeJson(paths.result, rejected);
      fs.writeFileSync(paths.log, boundedLog(`[rejected]\n${safeError}`), {
        encoding: "utf8",
        mode: 0o600
      });
    } catch {
      // Unsafe output paths are themselves a fail-closed rejection.
    }
    return invalid(safeError);
  } finally {
    removeReporterFiles(paths);
  }
}

async function main() {
  const { model } = parseRedStageArgs(process.argv.slice(2));
  const findingPath = resolveFindingInputPath(REPO_ROOT);
  if (!findingPath) {
    console.error("[red-stage] fixed finding artifact is missing or unsafe");
    process.exitCode = 2;
    return;
  }

  let finding;
  try {
    finding = extractValidatedFinding(
      JSON.parse(fs.readFileSync(findingPath, "utf8"))
    );
    if (!finding) throw new Error("not a validated finding");
  } catch {
    console.error("[red-stage] finding artifact is not strict JSON");
    process.exitCode = 2;
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[red-stage] GEMINI_API_KEY is required");
    process.exitCode = 2;
    return;
  }
  const client = createGeminiClient({ apiKey, model });
  const result = await runRedStage({
    repoRoot: REPO_ROOT,
    finding,
    client,
    environment: process.env
  });
  console.log(JSON.stringify(result.result ?? result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === MODULE_PATH
) {
  main().catch(() => {
    console.error("[red-stage] failed closed");
    process.exitCode = 1;
  });
}
