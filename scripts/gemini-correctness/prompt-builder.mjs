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
export const MAX_PROJECT_RULES_CHARS = 100_000;
export const DEFAULT_MODEL = "gemini-2.5-flash";
export const PROJECT_RULES_TRUNCATION_MARKER =
  "[Project rules omitted because they exceed the 100000-character limit]";

const MAX_COMMIT_SHA_CHARS = 128;
const COMMIT_SHA_TRUNCATION_MARKER = "[truncated]";

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

const TEMPLATE_VALUES_RE =
  /\{\{(commitSha|rulesSection|fileCount|totalBytes|protectedExcluded|manifestSection|fileContentsSection)\}\}/g;

function truncateUtf16Safely(value, maxChars, marker) {
  const text = String(value);
  if (text.length <= maxChars) {
    return { value: text, truncated: false };
  }

  const prefixBudget = Math.max(0, maxChars - marker.length);
  let end = prefixBudget;
  if (end > 0) {
    const finalCodeUnit = text.charCodeAt(end - 1);
    if (finalCodeUnit >= 0xD800 && finalCodeUnit <= 0xDBFF) {
      end -= 1;
    }
  }

  return {
    value: text.slice(0, end) + marker,
    truncated: true
  };
}

function renderPrompt(values) {
  return PROMPT_TEMPLATE.replace(
    TEMPLATE_VALUES_RE,
    (_placeholder, key) => String(values[key] ?? "")
  );
}

export function buildDiscoveryPrompt({
  commitSha,
  rules,
  scannedFiles,
  stats
} = {}) {
  const rawCommitSha = commitSha ? String(commitSha).replace(/[\r\n]+/g, " ") : "unknown";
  const boundedCommitSha = truncateUtf16Safely(
    rawCommitSha,
    MAX_COMMIT_SHA_CHARS,
    COMMIT_SHA_TRUNCATION_MARKER
  );

  const rawRules = rules ? String(rules) : "";
  // Project rules are Markdown and may contain fenced code blocks. If an
  // oversized rules document were prefix-truncated, an open fence could absorb
  // the manifest and file sections that follow. Omit the whole document instead
  // and insert one complete marker so the prompt structure remains intact.
  const rulesTruncated = rawRules.length > MAX_PROJECT_RULES_CHARS;
  const rulesValue = rulesTruncated
    ? PROJECT_RULES_TRUNCATION_MARKER
    : rawRules;
  const rulesSection = rawRules
    ? `\n## Project rules\n\n${rulesValue}\n\n## End project rules`
    : "";

  const protectedExcluded =
    Number.isSafeInteger(stats?.protectedExcluded) && stats.protectedExcluded >= 0
      ? stats.protectedExcluded
      : 0;
  const files = Array.isArray(scannedFiles) ? scannedFiles : [];

  const fileContents = [];
  const filePaths = [];
  let filesTruncated = false;

  for (const f of files) {
    const filePath = String(f.path ?? "");
    const content = String(f.content ?? "");
    const header = `### ${filePath} (${String(f.lineCount ?? 0)} lines${f.truncated ? ", TRUNCATED" : ""})`;
    const lines = content.split("\n");
    const numbered = lines.map((line, idx) => `${idx + 1}|${line}`).join("\n");
    const block = `${header}\n\`\`\`\n${numbered}\n\`\`\``;

    // Compute what the FULL prompt would look like if we add this file
    const newPaths = [...filePaths, filePath];
    const newContents = [...fileContents, block];
    const manifestStr = newPaths.join("\n");
    const contentsStr = newContents.join("\n\n");
    const totalBytes = newContents.reduce((s, b) => s + Buffer.byteLength(b, "utf8"), 0);

    const fullCandidate = renderPrompt({
      commitSha: boundedCommitSha.value,
      rulesSection,
      fileCount: newPaths.length,
      totalBytes,
      protectedExcluded,
      manifestSection: manifestStr,
      fileContentsSection: contentsStr
    });

    if (fullCandidate.length > MAX_TOTAL_CHARS) {
      filesTruncated = true;
      break;
    }

    fileContents.push(block);
    filePaths.push(filePath);
  }

  const manifestSection = filePaths.join("\n");
  const fileContentsSection = fileContents.join("\n\n");

  const prompt = renderPrompt({
    commitSha: boundedCommitSha.value,
    rulesSection,
    fileCount: filePaths.length,
    totalBytes: fileContents.reduce((s, f) => s + Buffer.byteLength(f, "utf8"), 0),
    protectedExcluded,
    manifestSection,
    fileContentsSection
  });

  // Post-condition assertion — ensures prompt never exceeds the cap even if
  // template replacements produce a slightly larger length than estimated.
  if (prompt.length > MAX_TOTAL_CHARS) {
    throw new Error(
      `Internal error: final prompt (${prompt.length} chars) exceeds MAX_TOTAL_CHARS (${MAX_TOTAL_CHARS}). ` +
      `This is a bug in the truncation logic.`
    );
  }

  return {
    prompt,
    manifest: filePaths,
    truncated: rulesTruncated || boundedCommitSha.truncated || filesTruncated,
    rulesTruncated,
    commitShaTruncated: boundedCommitSha.truncated,
    filesTruncated,
    length: prompt.length
  };
}
