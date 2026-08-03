// =============================================================================
// green-stage.mjs — fixed entry point for the guarded GREEN repair stage
// =============================================================================
//
// A fixed module (not a workflow) that loads the finding + red-result artifacts
// from the .tmp artifact directory and drives the guarded GREEN runner.
// Like the RED stage, this is fail-closed: it never commits, pushes, or opens
// a PR itself.
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createGeminiClient } from "./gemini-client.mjs";
import { safeWritePath } from "./policy.mjs";
import { DEFAULT_MODEL } from "./prompt-builder.mjs";
import { extractValidatedFinding } from "./red-stage.mjs";
import { runGreenStage } from "./green-runner.mjs";

const MODULE_PATH = fileURLToPath(import.meta.url);
const ARTIFACT_DIR = "gemini-correctness";
const FINDING_RELATIVE_PATH = `${ARTIFACT_DIR}/finding.json`;
const RED_RESULT_RELATIVE_PATH = `${ARTIFACT_DIR}/red-result.json`;

export function parseGreenStageArgs(argv) {
  const parsed = { model: DEFAULT_MODEL };
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument !== "--model") {
      throw new Error(`unsupported GREEN stage argument: ${argument}`);
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

function resolveArtifact(repoRoot, relativePath) {
  try {
    const allowedDir = path.join(repoRoot, ".tmp");
    const allowedStat = fs.lstatSync(allowedDir);
    if (allowedStat.isSymbolicLink() || !allowedStat.isDirectory()) return null;
    const candidate = safeWritePath(relativePath, allowedDir, repoRoot);
    if (!candidate) return null;
    const stat = fs.lstatSync(candidate);
    if (!stat.isFile() || stat.isSymbolicLink()) return null;
    return candidate;
  } catch {
    return null;
  }
}

export function resolveGreenInputs(repoRoot) {
  const findingPath = resolveArtifact(repoRoot, FINDING_RELATIVE_PATH);
  const redResultPath = resolveArtifact(repoRoot, RED_RESULT_RELATIVE_PATH);
  if (!findingPath) return { valid: false, error: "finding artifact is missing or unsafe" };
  if (!redResultPath) return { valid: false, error: "red-result artifact is missing or unsafe" };
  return { valid: true, findingPath, redResultPath };
}

export function parseRedResultArtifact(content) {
  try {
    const parsed = JSON.parse(content);
    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      parsed.status === "red-confirmed" &&
      typeof parsed.baselineSha === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

async function main() {
  const { model } = parseGreenStageArgs(process.argv.slice(2));
  const repoRoot = path.resolve(path.dirname(MODULE_PATH), "..", "..");
  const inputs = resolveGreenInputs(repoRoot);
  if (!inputs.valid) {
    console.error(`[green-stage] ${inputs.error}`);
    process.exitCode = 2;
    return;
  }

  let finding;
  try {
    finding = extractValidatedFinding(
      JSON.parse(fs.readFileSync(inputs.findingPath, "utf8"))
    );
    if (!finding) throw new Error("not a validated finding");
  } catch {
    console.error("[green-stage] finding artifact is not strict JSON");
    process.exitCode = 2;
    return;
  }

  let redResult;
  try {
    redResult = parseRedResultArtifact(
      fs.readFileSync(inputs.redResultPath, "utf8")
    );
    if (!redResult) throw new Error("not a red-confirmed result");
  } catch {
    console.error("[green-stage] red-result artifact is not strict JSON");
    process.exitCode = 2;
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[green-stage] GEMINI_API_KEY is required");
    process.exitCode = 2;
    return;
  }
  const client = createGeminiClient({ apiKey, model });
  const result = await runGreenStage({
    repoRoot,
    finding,
    redResult,
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
    console.error("[green-stage] failed closed");
    process.exitCode = 1;
  });
}
