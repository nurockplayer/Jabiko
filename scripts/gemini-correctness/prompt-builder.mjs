// =============================================================================
// prompt-builder.mjs — Builds the Gemini discovery prompt from scanned files
// =============================================================================
//
// Separates prompt construction from scanning and Gemini invocation so each
// piece is independently testable.
//
// The prompt includes:
//   - Project rules (from CLAUDE.md)
//   - File manifest (list of paths)
//   - Scanned file contents with path headers and line numbers
//   - Strict JSON output schema instructions
//   - Hard MAX_TOTAL_CHARS cap to prevent oversized prompts
// =============================================================================

import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Hard limit
// ---------------------------------------------------------------------------
export const MAX_TOTAL_CHARS = 500_000; // hard cap for total prompt length

// ---------------------------------------------------------------------------
// Default model (single source of truth)
// ---------------------------------------------------------------------------
export const DEFAULT_MODEL = "gemini-2.0-flash";

// ---------------------------------------------------------------------------
// Prompt template parts
// ---------------------------------------------------------------------------
const PROMPT_TEMPLATE = `You are a correctness reviewer for a JLPT study application written in TypeScript.
Your task is to find ONE high-confidence correctness bug in the scanned code below.

## Instructions

- Review the actual source code with line numbers provided below.
- Look for: boundary conditions, state transition bugs, null/empty input handling,
  error fallback logic, logic errors, off-by-one, stale state.
- Do NOT report: formatting, naming, performance speculation, missing tests,
  dependency upgrades, architecture refactoring, exam content, translations,
  Japanese language correctness, or i18n content.
- Evidence must reference the exact file paths and line numbers shown below.
- Do NOT fabricate symbols or file contents.
- If no high-confidence correctness issue is found, output a "no-finding" result.
- You may NOT modify any file.

## Strict JSON Output Format

Respond with EXACTLY ONE of the following JSON objects (NO markdown fences, NO trailing prose):

### Finding (when you find a bug):
{
  "schemaVersion": 1,
  "status": "finding",
  "title": "concise description of the issue",
  "confidence": 0.95,
  "category": "boundary-condition",
  "evidence": [
    {
      "file": "src/domain/example.ts",
      "startLine": 42,
      "endLine": 57,
      "reason": "Why this is wrong"
    }
  ],
  "expectedBehavior": "What should happen",
  "actualBehavior": "What actually happens",
  "reproduction": {
    "testFile": "src/domain/example.regression.test.ts",
    "testName": "descriptive test name"
  },
  "productionFiles": ["src/domain/example.ts"],
  "risk": "low"
}

### No finding (when nothing found):
{
  "schemaVersion": 1,
  "status": "no-finding",
  "reason": "Why no finding was found"
}

Categories: boundary-condition, state-transition, null-empty-input, off-by-one,
stale-state, error-fallback, logic-error
Risk MUST be "low". Confidence MUST be >= 0.8.

## Input context

Commit SHA: {{commitSha}}
{{rulesSection}}

## Scanned files ({{fileCount}} files, {{totalBytes}} bytes, {{protectedExcluded}} protected files excluded)

{{manifestSection}}

## File contents

{{fileContentsSection}}
`;

// ---------------------------------------------------------------------------
// buildDiscoveryPrompt
// ---------------------------------------------------------------------------
export function buildDiscoveryPrompt({
  commitSha,
  rules,
  scannedFiles,
  manifest,
  stats
} = {}) {
  // Build rules section
  const rulesSection = rules
    ? `\n## Project rules\n\n${rules}`
    : "";

  // Build manifest section
  const manifestSection = manifest.join("\n");

  // Build file contents section
  const fileParts = [];
  let truncated = false;

  for (const f of scannedFiles) {
    const header = `### ${f.path} (${f.lineCount} lines${f.truncated ? ", TRUNCATED" : ""})`;
    const lines = f.content.split("\n");
    const numbered = lines
      .map((line, idx) => `${idx + 1}|${line}`)
      .join("\n");
    const block = `${header}\n\`\`\`\n${numbered}\n\`\`\``;

    // Check if adding this block would exceed MAX_TOTAL_CHARS
    // Estimate template overhead: ~2000 chars of framing text
    const estimatedTotal = PROMPT_TEMPLATE.length
      + rulesSection.length
      + manifestSection.length
      + fileParts.reduce((s, p) => s + p.length, 0)
      + block.length;

    if (estimatedTotal > MAX_TOTAL_CHARS) {
      truncated = true;
      break;
    }

    fileParts.push(block);
  }

  const fileContentsSection = fileParts.join("\n\n");

  // Build the prompt, staying under MAX_TOTAL_CHARS
  const templateReplaced = PROMPT_TEMPLATE
    .replace("{{commitSha}}", commitSha || "unknown")
    .replace("{{rulesSection}}", rulesSection)
    .replace("{{fileCount}}", String(scannedFiles.length))
    .replace("{{totalBytes}}", String(stats?.totalBytes ?? 0))
    .replace("{{protectedExcluded}}", String(stats?.protectedExcluded ?? 0))
    .replace("{{manifestSection}}", manifestSection)
    .replace("{{fileContentsSection}}", fileContentsSection);

  // Final length enforcement — trim if still over
  let prompt = templateReplaced;
  if (prompt.length > MAX_TOTAL_CHARS) {
    prompt = prompt.slice(0, MAX_TOTAL_CHARS);
    truncated = true;
  }

  return {
    prompt,
    manifest,
    truncated,
    length: prompt.length
  };
}
