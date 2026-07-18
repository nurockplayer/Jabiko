// =============================================================================
// discover.mjs — Gemini correctness discovery orchestrator
// =============================================================================
//
// Orchestrates the full discovery pipeline:
//   1. Parse CLI args
//   2. Scan repository allowlisted files with content, line numbers, limits
//   3. Read project rules (CLAUDE.md)
//   4. Build prompt with actual source code and line numbers
//   5. Call Gemini via adapter
//   6. Validate result through JSON schema + repo-aware validation
//   7. Write machine-readable report
//
// This script is READ-ONLY — it never modifies any repository file.
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createGeminiClient } from "./gemini-client.mjs";
import { scanRepository } from "./scanner.mjs";
import { buildDiscoveryPrompt, DEFAULT_MODEL } from "./prompt-builder.mjs";
import { validateFindingWithRepo } from "./repo-validator.mjs";
import { getDefaultAllowlist, getDefaultProtectedPaths, isPathWithinRepo, isPathSafe, safeWritePath } from "./policy.mjs";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  ".."
);

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const o = {
    commitSha: "",
    output: "",
    model: "",
    dryRun: false,
    summary: ""
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--commit-sha":
        o.commitSha = argv[++i];
        break;
      case "--output":
        o.output = argv[++i];
        break;
      case "--summary":
        o.summary = argv[++i];
        break;
      case "--model":
        o.model = argv[++i];
        break;
      case "--dry-run":
        o.dryRun = true;
        break;
      default:
        throw new Error(`unknown arg: ${a}`);
    }
  }
  return o;
}

// ---------------------------------------------------------------------------
// Constrain output path to a tmp dir under REPO_ROOT/.tmp/
// ---------------------------------------------------------------------------
function resolveOutputPath(cliPath) {
  if (!cliPath) return null;
  const allowedDir = path.join(REPO_ROOT, ".tmp");
  const safe = safeWritePath(cliPath, allowedDir, REPO_ROOT);
  if (!safe) {
    console.error("--output path must be under .tmp/ (rejecting symlink escape)");
    process.exit(2);
  }
  return safe;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const o = parseArgs(process.argv.slice(2));

  if (!o.commitSha) {
    console.error("--commit-sha is required");
    process.exit(2);
  }

  const model = o.model || DEFAULT_MODEL;
  const allowlist = getDefaultAllowlist();
  const protectedPaths = getDefaultProtectedPaths();

  // ---- 1. Scan the repository ----
  let scanResult;
  try {
    scanResult = scanRepository({
      repoRoot: REPO_ROOT,
      allowlist,
      protectedPaths,
      maxFiles: 200,
      maxBytesPerFile: 128 * 1024,
      maxTotalBytes: 2 * 1024 * 1024
    });
  } catch (e) {
    console.error(`Repository scan failed: ${e.message}`);
    process.exit(2);
  }

  // ---- 2. Read project rules from canonical CLAUDE.md ----
  let claudeMdRules = "";
  const claudeMdPath = path.join(REPO_ROOT, "CLAUDE.md");
  try {
    const stat = fs.statSync(claudeMdPath);
    if (stat.isFile()) {
      // Verify the CLAUDE.md is not a symlink escaping the repo
      const real = fs.realpathSync(claudeMdPath);
      const repoReal = fs.realpathSync(REPO_ROOT);
      if (real.startsWith(repoReal + path.sep) || real === repoReal) {
        claudeMdRules = fs.readFileSync(claudeMdPath, "utf8");
      }
    }
  } catch {
    // CLAUDE.md optional — silently continue without rules
  }

  // ---- 3. Build prompt ----
  const promptResult = buildDiscoveryPrompt({
    commitSha: o.commitSha,
    rules: claudeMdRules,
    scannedFiles: scanResult.scannedFiles,
    stats: scanResult.stats
  });

  // ---- 4. Dry-run output ----
  if (o.dryRun) {
    console.log(JSON.stringify({
      dryRun: true,
      commitSha: o.commitSha,
      model,
      scannedFiles: scanResult.stats.totalFiles,
      totalBytes: scanResult.stats.totalBytes,
      protectedExcluded: scanResult.stats.protectedExcluded,
      promptLength: promptResult.length,
      truncated: promptResult.truncated,
      manifest: promptResult.manifest
    }, null, 2));
    return;
  }

  // ---- 5. Call Gemini ----
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY env is required (pass as GitHub Actions secret)");
    process.exit(2);
  }

  const client = createGeminiClient({ apiKey, model });
  const result = await client.discover({
    prompt: promptResult.prompt,
    validationOptions: { allowlist, protectedPaths }
  });

  // ---- 6. Repository-aware validation ----
  // Use the prompt's manifest (which only includes files Gemini actually saw)
  if (result.valid && result.result) {
    const repoCheck = validateFindingWithRepo(result.result, {
      repoRoot: REPO_ROOT,
      manifest: promptResult.manifest,
      allowlist,
      protectedPaths,
      scannedFiles: scanResult.scannedFiles
    });

    if (!repoCheck.valid) {
      // Override the result: schema passed but repo validation failed
      result.valid = false;
      result.error = `Repo validation failed: ${repoCheck.error}`;
      result.repoError = repoCheck.error;
    }
  }

  // ---- 8. Redact any residual API key before writing output ----
  const resultForOutput = JSON.parse(JSON.stringify(result));
  // Recursively redact any string containing the API key pattern
  function deepRedact(obj) {
    if (typeof obj === "string") {
      // Redact anything that looks like an API key in values
      return obj.replace(/AIza[0-9A-Za-z_-]{35}/g, "REDACTED_KEY");
    }
    if (obj && typeof obj === "object") {
      for (const key of Object.keys(obj)) {
        obj[key] = deepRedact(obj[key]);
      }
    }
    return obj;
  }
  const safeResult = deepRedact(resultForOutput);

  const report = JSON.stringify(safeResult, null, 2);

  if (o.output) {
    const safeOut = resolveOutputPath(o.output);
    const dir = path.dirname(safeOut);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(safeOut, report);
  }

  console.log(report);

  if (o.summary) {
    const safeSummary = resolveOutputPath(o.summary);
    const summaryLines = [
      `## Gemini Correctness Discovery`,
      ``,
      `- commit: \`${o.commitSha}\``,
      `- model: \`${model}\``,
      `- scanned files: ${scanResult.stats.totalFiles} (${scanResult.stats.totalBytes} bytes)`,
      `- protected excluded: ${scanResult.stats.protectedExcluded}`,
      `- prompt length: ${promptResult.length} chars`,
      `- truncated: ${JSON.stringify(promptResult.truncated)}`,
      `- status: ${result.valid ? "valid" : "invalid"}`,
      result.result?.status === "finding"
        ? `- finding: ${result.result.title}`
        : "",
      result.error ? `- error: ${result.error}` : "",
      ``
    ];
    const dir = path.dirname(safeSummary);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(safeSummary, summaryLines.filter(Boolean).join("\n") + "\n");
  }

  process.exit(result.valid ? 0 : 1);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((e) => {
    console.error(`[discover] failed: ${e?.message || "unknown error"}`);
    process.exit(1);
  });
}
