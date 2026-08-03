// =============================================================================
// green-validator.mjs — deterministic validation of Gemini-authored repair diffs
// =============================================================================
//
// Validates the Gemini repair response against the finding allowlist, hard
// budgets, and escape-hatch rules.  This is the ONLY place that interprets a
// repair diff for the GREEN stage; neither the prompt nor Gemini's output
// should bypass it.
//
// A repair diff must:
//   - be a strict { schemaVersion, status, diff, rootCause, fixSummary } object
//   - reference only production files listed in finding.productionFiles
//   - still pass policy allowlist / protected-path checks
//   - touch at most MAX_GREEN_PRODUCTION_FILES files
//   - add/remove at most MAX_GREEN_DIFF_LINES lines in total
//   - never add .skip/.only/@ts-ignore/@ts-nocheck/@ts-expect-error, coverage or
//     lint disables, or an uncommented `any` annotation
//   - never contain whitespace-only churn, EOL churn, binary/rename/delete/
//     symlink/submodule markers, or sensitive content
// =============================================================================

import {
  MAX_GREEN_DIFF_LINES,
  MAX_GREEN_PRODUCTION_FILES,
  getDefaultAllowlist,
  getDefaultProtectedPaths,
  isAllowlisted,
  isPathSafe,
  isProductionFilePath,
  isProtected,
  parseUnifiedDiff
} from "./policy.mjs";
import { redactForOutput } from "./discover.mjs";

const CANDIDATE_KEYS = ["schemaVersion", "status", "diff", "rootCause", "fixSummary"];

const ESCAPE_HATCH_RE = /(?:\b\.skip\b|\b\.only\b|@ts-ignore|@ts-nocheck|@ts-expect-error|eslint-disable|eslint-disable-next-line|eslint-disable-line|istanbul\s+ignore|c8\s+ignore|coverage\s+ignore)/i;

const ANNOTATED_ANY_RE = /\bany\b(?![^*/]*\*\/)/;

function invalid(error) {
  return { valid: false, error };
}

function normalizePath(filePath) {
  return String(filePath).replace(/\\/g, "/");
}

function isWhitespaceChurn(addedLines, removedLines) {
  const normalized = lines => lines.map(line => line.replace(/\s/g, "")).filter(line => line !== "");
  return (
    addedLines.length === removedLines.length &&
    normalized(addedLines).join("\n") === normalized(removedLines).join("\n")
  );
}

export function validateGreenRepairCandidate(candidate, options = {}) {
  const finding = options.finding;
  if (!finding || finding.status !== "finding") {
    return invalid("a validated finding is required");
  }
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return invalid("candidate must be a plain object");
  }

  const keys = Object.keys(candidate);
  const unknown = keys.filter(key => !CANDIDATE_KEYS.includes(key));
  const missing = CANDIDATE_KEYS.filter(key => candidate[key] === undefined);
  if (unknown.length > 0) return invalid(`candidate has unknown fields: ${unknown.join(", ")}`);
  if (missing.length > 0) return invalid(`candidate is missing fields: ${missing.join(", ")}`);
  if (candidate.schemaVersion !== 1) return invalid("candidate schemaVersion must be 1");
  if (candidate.status !== "repair-diff") {
    return invalid('candidate status must be "repair-diff"');
  }
  if (typeof candidate.rootCause !== "string" || candidate.rootCause.trim() === "") {
    return invalid("rootCause must be a non-empty string");
  }
  if (typeof candidate.fixSummary !== "string" || candidate.fixSummary.trim() === "") {
    return invalid("fixSummary must be a non-empty string");
  }

  const allowlist = options.allowlist ?? getDefaultAllowlist();
  const protectedPaths = options.protectedPaths ?? getDefaultProtectedPaths();
  // Only length >= 4 values are treated as sensitive.  Very short env values
  // (e.g. a single character) would otherwise corrupt any diff hunk that
  // happens to contain that character, producing false "sensitive content"
  // rejections.  Real secrets (API keys, tokens) are far longer.
  const sensitiveValues = (options.sensitiveValues ?? []).filter(
    value => typeof value === "string" && value.length >= 4
  );
  const productionFileSet = new Set(
    (finding.productionFiles ?? []).map(normalizePath)
  );

  const parsed = parseUnifiedDiff(candidate.diff);
  if (!parsed.valid) return parsed;

  if (parsed.changedFiles > MAX_GREEN_PRODUCTION_FILES) {
    return invalid(`repair diff touches ${parsed.changedFiles} files; budget is ${MAX_GREEN_PRODUCTION_FILES}`);
  }
  const totalChanged = parsed.totalAdditions + parsed.totalDeletions;
  if (totalChanged > MAX_GREEN_DIFF_LINES) {
    return invalid(`repair diff changes ${totalChanged} lines; budget is ${MAX_GREEN_DIFF_LINES}`);
  }

  for (const file of parsed.files) {
    const normalized = normalizePath(file.path);
    if (!productionFileSet.has(normalized)) {
      return invalid(`diff file "${file.path}" is not in finding.productionFiles`);
    }
    if (!isPathSafe(file.path)) {
      return invalid(`diff file "${file.path}" is not a safe relative path`);
    }
    if (!isAllowlisted(normalized, allowlist)) {
      return invalid(`diff file "${file.path}" is outside the allowlist`);
    }
    if (isProtected(normalized, protectedPaths)) {
      return invalid(`diff file "${file.path}" is a protected path`);
    }
    if (!isProductionFilePath(file.path)) {
      return invalid(`diff file "${file.path}" is a test file, not a production repair target`);
    }
    if (isWhitespaceChurn(file.addedLines, file.removedLines)) {
      return invalid(`diff for "${file.path}" is whitespace-only churn`);
    }
    for (const line of [...file.addedLines, ...file.removedLines]) {
      if (line.includes("\r")) {
        return invalid(`diff for "${file.path}" contains EOL churn`);
      }
      if (ESCAPE_HATCH_RE.test(line)) {
        return invalid(`diff for "${file.path}" contains an escape-hatch marker`);
      }
      if (ANNOTATED_ANY_RE.test(line)) {
        return invalid(`diff for "${file.path}" introduces an uncommented any annotation`);
      }
    }
  }

  const redactedDiff = redactForOutput(candidate.diff, sensitiveValues);
  if (redactedDiff !== candidate.diff) {
    return invalid("repair diff contains sensitive content");
  }
  const redactedSummary = redactForOutput(
    `${candidate.rootCause}\n${candidate.fixSummary}`,
    sensitiveValues
  );
  if (redactedSummary !== `${candidate.rootCause}\n${candidate.fixSummary}`) {
    return invalid("repair summary contains sensitive content");
  }

  return {
    valid: true,
    result: {
      schemaVersion: 1,
      status: "repair-diff",
      diff: candidate.diff,
      rootCause: candidate.rootCause,
      fixSummary: candidate.fixSummary,
      changedFiles: parsed.changedFiles,
      totalAdditions: parsed.totalAdditions,
      totalDeletions: parsed.totalDeletions,
      files: parsed.files.map(file => file.path)
    }
  };
}
