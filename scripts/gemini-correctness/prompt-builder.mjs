// =============================================================================
// prompt-builder.mjs — Builds the Gemini discovery prompt from scanned files
// =============================================================================
//
// IMPORTANT: Never uses prompt.slice().  Only complete file blocks are added.
// Manifest always matches the blocks actually placed in the prompt.
// MAX_TOTAL_CHARS is a TRUE hard cap: the final prompt after ALL replacements
// must never exceed it.
// =============================================================================

export const MAX_TOTAL_CHARS = 500_000;
export const DEFAULT_MODEL = "gemini-2.0-flash";

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

{{fileContentsSection}}`;

export function buildDiscoveryPrompt({
  commitSha,
  rules,
  scannedFiles,
  stats
} = {}) {
  const rulesSection = rules ? `\n## Project rules\n\n${rules}` : "";

  // Build a "partial prompt" with placeholders for the dynamic sections
  const beforeBlocks = PROMPT_TEMPLATE
    .replace("{{commitSha}}", commitSha || "unknown")
    .replace("{{rulesSection}}", rulesSection)
    .replace("{{fileCount}}", "{{_COUNT}}")
    .replace("{{totalBytes}}", "{{_BYTES}}")
    .replace("{{protectedExcluded}}", String(stats?.protectedExcluded ?? 0))
    .replace("{{manifestSection}}", "{{_MANIFEST}}")
    .replace("{{fileContentsSection}}", "{{_CONTENTS}}");

  const fileContents = [];
  const filePaths = [];
  let truncated = false;

  for (const f of scannedFiles) {
    const header = `### ${f.path} (${f.lineCount} lines${f.truncated ? ", TRUNCATED" : ""})`;
    const lines = f.content.split("\n");
    const numbered = lines.map((line, idx) => `${idx + 1}|${line}`).join("\n");
    const block = `${header}\n\`\`\`\n${numbered}\n\`\`\``;

    // Compute what the FULL prompt would look like if we add this file
    const newPaths = [...filePaths, f.path];
    const newContents = [...fileContents, block];
    const manifestStr = newPaths.join("\n");
    const contentsStr = newContents.join("\n\n");
    const totalBytes = newContents.reduce((s, b) => s + Buffer.byteLength(b, "utf8"), 0);

    const fullCandidate = beforeBlocks
      .replace("{{_COUNT}}", String(newPaths.length))
      .replace("{{_BYTES}}", String(totalBytes))
      .replace("{{_MANIFEST}}", manifestStr)
      .replace("{{_CONTENTS}}", contentsStr);

    if (fullCandidate.length > MAX_TOTAL_CHARS) {
      truncated = true;
      break;
    }

    fileContents.push(block);
    filePaths.push(f.path);
  }

  const manifestSection = filePaths.join("\n");
  const fileContentsSection = fileContents.join("\n\n");

  const prompt = PROMPT_TEMPLATE
    .replace("{{commitSha}}", commitSha || "unknown")
    .replace("{{rulesSection}}", rulesSection)
    .replace("{{fileCount}}", String(filePaths.length))
    .replace("{{totalBytes}}", String(fileContents.reduce((s, f) => s + Buffer.byteLength(f, "utf8"), 0)))
    .replace("{{protectedExcluded}}", String(stats?.protectedExcluded ?? 0))
    .replace("{{manifestSection}}", manifestSection)
    .replace("{{fileContentsSection}}", fileContentsSection);

  return {
    prompt,
    manifest: filePaths,
    truncated,
    length: prompt.length
  };
}
