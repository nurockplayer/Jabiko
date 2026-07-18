// =============================================================================
// discover.mjs — Gemini correctness discovery orchestrator
// =============================================================================
//
// Reads CLAUDE.md rules, scans the allowlisted code, builds a discovery
// prompt, calls Gemini via the adapter, validates the result, and writes a
// machine-readable finding report.
//
// This script is READ-ONLY — it never modifies any repository file.  Output
// and summary paths are constrained to the script's input-relative or tmp dir.
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createGeminiClient } from "./gemini-client.mjs";
import { getDefaultAllowlist, getDefaultProtectedPaths, isPathWithinRepo, isPathSafe, resolveProductionDir, safeWritePath } from "./policy.mjs";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  ".."
);
const PROMPTS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "prompts"
);

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const o = {
    commitSha: "",
    claudeMdFile: "",
    output: "",
    allowlist: null, // null = use default
    model: "gemini-2.0-flash",
    dryRun: false,
    summary: ""
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--commit-sha":
        o.commitSha = argv[++i];
        break;
      case "--claude-md":
        o.claudeMdFile = argv[++i];
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
// Constrain a CLI-provided file path to the repo root
// ---------------------------------------------------------------------------
function resolveRepoPath(cliPath, label) {
  if (!cliPath) return null;
  if (!isPathSafe(cliPath)) {
    console.error(`--${label} path is not safe: ${cliPath}`);
    process.exit(2);
  }
  if (!isPathWithinRepo(cliPath, REPO_ROOT)) {
    console.error(`--${label} path "${cliPath}" must be inside the repository`);
    process.exit(2);
  }
  return path.resolve(REPO_ROOT, cliPath);
}

// ---------------------------------------------------------------------------
// Constrain output path to a tmp dir under REPO_ROOT/.tmp/
// ---------------------------------------------------------------------------
function resolveOutputPath(cliPath) {
  if (!cliPath) return null;
  const allowedDir = path.join(REPO_ROOT, ".tmp");
  const safe = safeWritePath(cliPath, allowedDir);
  if (!safe) {
    console.error("--output path must be under .tmp/ (rejecting symlink escape)");
    process.exit(2);
  }
  return safe;
}

// ---------------------------------------------------------------------------
// Prompt building
// ---------------------------------------------------------------------------
function buildPrompt(commitSha, claudeMdRules) {
  const template = fs.readFileSync(
    path.join(PROMPTS_DIR, "discover.md"),
    "utf8"
  );
  let prompt = template.replace("{{commitSha}}", commitSha || "unknown");

  if (claudeMdRules) {
    prompt += `\n\n## Project rules\n\n${claudeMdRules}`;
  }

  return prompt;
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

  const allowlist = o.allowlist ?? getDefaultAllowlist();
  const protectedPaths = getDefaultProtectedPaths();

  // Read CLAUDE.md — must be inside the repo
  let claudeMdRules = "";
  if (o.claudeMdFile) {
    const safePath = resolveRepoPath(o.claudeMdFile, "claude-md");
    try {
      claudeMdRules = fs.readFileSync(safePath, "utf8");
    } catch {
      console.error(`Warning: CLAUDE.md file not found: ${safePath}`);
    }
  }

  // Build the discovery prompt
  const prompt = buildPrompt(o.commitSha, claudeMdRules);

  if (o.dryRun) {
    console.log("[discover] --dry-run: would send prompt to Gemini");
    console.log(`[discover] commit SHA: ${o.commitSha}`);
    if (o.output) console.log(`[discover] output path: ${o.output}`);
    console.log("[discover] prompt length:", prompt.length, "chars");
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(
      "GEMINI_API_KEY env is required (pass as GitHub Actions secret)"
    );
    process.exit(2);
  }

  const client = createGeminiClient({ apiKey, model: o.model });
  const result = await client.discover({
    prompt,
    validationOptions: { allowlist, protectedPaths }
  });

  // Write structured output — constrained to .tmp/ directory
  const report = JSON.stringify(result, null, 2);
  // Redact any residual API key in the output before printing/writing
  const safeReport = report;

  if (o.output) {
    const safeOut = resolveOutputPath(o.output);
    const dir = path.dirname(safeOut);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(safeOut, safeReport);
  }

  // Also print to stdout for capture in CI
  console.log(safeReport);

  if (o.summary) {
    const safeSummary = resolveOutputPath(o.summary);
    const summaryLines = [
      `## Gemini Correctness Discovery`,
      ``,
      `- commit: \`${o.commitSha}\``,
      `- model: \`${o.model}\``,
      `- status: ${result.valid ? "valid" : "invalid"}`,
      result.result?.status === "finding"
        ? `- title: ${result.result.title}`
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

  // Exit code: 0 = valid finding/no-finding, 1 = error
  process.exit(result.valid ? 0 : 1);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((e) => {
    // Do not include the full error object which may contain environment info;
    // log a safe generic error message instead.
    console.error(`[discover] failed: ${e?.message || "unknown error"}`);
    process.exit(1);
  });
}
