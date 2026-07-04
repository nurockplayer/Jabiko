#!/usr/bin/env node
// check-content-gates.mjs — scan .tsx for zh-only content rendered without
// an isZhHant language gate or pickLocalized wrapper.
//
// Conservative heuristic: flag suspicious lines; CI compares against a
// stored baseline. New violations → exit 1; known baseline → exit 0 with
// informational output.
//
// This is defense-in-depth. The primary enforcement is in the test suite
// (GrammarPointPage.test.tsx content language gates).

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const SCRIPT_DIR = new URL(".", import.meta.url).pathname;
const BASELINE_PATH = join(SCRIPT_DIR, "content-gate-baseline.json");

// Field name patterns that carry untranslated Chinese prose.
const ZH_PATTERN = /\b(meaningZh|hintZh|instructionZh|lineZh|contextZh|promptContextZh|explanation)\b/;
const FORMATION_PATTERN = /\bformation\b/;
const MISTAKES_PATTERN = /\bcommonMistakes\b/;

function matchField(trimmed) {
  const zh = trimmed.match(ZH_PATTERN);
  if (zh) return zh[1];
  const fm = trimmed.match(FORMATION_PATTERN);
  if (fm && !/\bgrammarFilterFormation\b/.test(trimmed)) return fm[1];
  const cm = trimmed.match(MISTAKES_PATTERN);
  if (cm) return cm[1];
  return null;
}

function collectTsxFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    if (entry.isDirectory()) {
      results.push(...collectTsxFiles(join(dir, entry.name)));
    } else if (entry.name.endsWith(".tsx") && !entry.name.includes(".test.")) {
      results.push(join(dir, entry.name));
    }
  }
  return results;
}

/**
 * Is this line protected by one of the recognized safe patterns?
 *
 * Safe patterns:
 *  1. pickLocalized(field, ...)  — data-layer language routing
 *  2. pickLocalizedOptional(...)
 *  3. localize*(...)
 *  4. Inside an isZhHant-guarded block (checked via look-back window)
 *  5. Type annotations / destructuring (no actual rendering)
 *  6. File has an early-return `if (!isZhHant)` wrapper protecting the line
 */
function isProtected(line, contextLines, hasEarlyReturnNonZh, hasLocalizeNote) {
  const trimmed = line.trim();

  if (trimmed.startsWith("//")) return true;
  if (trimmed.includes("pickLocalized(") || trimmed.includes("pickLocalizedOptional(")) return true;
  if (trimmed.includes("localize") && trimmed.includes("(")) return true;
  if (trimmed.includes("isZhHant")) return true;
  if (/^(const|let|var)\s*\{/.test(trimmed)) return true; // destructuring
  if (/^\s*\*\s/.test(trimmed)) return true; // JSDoc
  if (/^import\b/.test(trimmed)) return true; // import
  if (trimmed.startsWith("//") || trimmed.startsWith(" *")) return true;
  if (!trimmed.includes("{") && !trimmed.includes("<")) return true; // no JSX

  // Validated by the early-return pattern (database-only branch in GrammarPointPage)
  if (hasEarlyReturnNonZh) return true;

  // data-layer localized (GrammarNoteCard etc.)
  if (hasLocalizeNote) return true;

  return false;
}

function scanFile(filePath) {
  const src = readFileSync(filePath, "utf-8");
  const lines = src.split("\n");
  const violations = [];

  // Files that use data-layer localization — their *Zh fields are safe
  const hasLocalizeNote = src.includes("localizeGrammarNote(");

  // Detect the "early-return non-zh-Hant" pattern:
  //   if (!isZhHant) { return <minimal> }
  // Everything after this block (until the next major return) that renders
  // *Zh fields is protected because non-zh-Hant users never reach it.
  const hasEarlyReturnNonZh = /if\s*\(\s*!\s*isZhHant\s*\)/.test(src);

  // Build a set of lines that are inside `{isZhHant && ...}` JSX blocks.
  // Approximate: when we see `isZhHant &&`, mark the next N lines as gated
  // until we see the matching closing `}` of the JSX expression.
  const gatedLines = new Set();
  for (let i = 0; i < lines.length; i++) {
    if (/\{isZhHant\s*&&/.test(lines[i])) {
      // Mark this line and scan forward until balanced braces
      let depth = 0;
      for (let j = i; j < Math.min(i + 30, lines.length); j++) {
        gatedLines.add(j);
        const opens = (lines[j].match(/\{/g) || []).length;
        const closes = (lines[j].match(/\}/g) || []).length;
        depth += opens - closes;
        if (depth <= 0) break;
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const field = matchField(lines[i].trim());
    if (!field) continue;
    if (gatedLines.has(i)) continue;

    // Look-back context: 5 lines before
    const contextStart = Math.max(0, i - 5);
    const contextLines = lines.slice(contextStart, i + 1);

    if (isProtected(lines[i], contextLines, hasEarlyReturnNonZh, hasLocalizeNote)) continue;

    violations.push({
      line: i + 1,
      field,
      text: lines[i].trim().substring(0, 150),
    });
  }

  return violations;
}

// ---- main ---------------------------------------------------------------

const args = process.argv.slice(2);
const mode = args.includes("--baseline") ? "baseline"
  : args.includes("--json") ? "json"
  : "check";

const srcDir = new URL("../src", import.meta.url).pathname;
const files = collectTsxFiles(srcDir);

const all = [];
for (const file of files) {
  const violations = scanFile(file);
  if (violations.length > 0) all.push({ file, violations });
}

if (mode === "json") {
  console.log(JSON.stringify(all, null, 2));
  process.exit(all.length > 0 ? 1 : 0);
}

if (mode === "baseline") {
  const baseline = {};
  for (const { file, violations } of all) {
    baseline[file] = violations.map((v) => ({ line: v.line, field: v.field }));
  }
  writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + "\n");
  const nFiles = Object.keys(baseline).length;
  const nItems = Object.values(baseline).reduce((s, a) => s + a.length, 0);
  console.log(`Baseline saved: ${nFiles} files, ${nItems} violations accepted.`);
  process.exit(0);
}

// mode === "check"
let baseline = {};
if (existsSync(BASELINE_PATH)) {
  baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf-8"));
}

let exitCode = 0;
for (const { file, violations } of all) {
  const baselined = new Set((baseline[file] || []).map((b) => `${b.line}:${b.field}`));
  const fresh = violations.filter((v) => !baselined.has(`${v.line}:${v.field}`));
  const known = violations.filter((v) => baselined.has(`${v.line}:${v.field}`));

  if (known.length > 0) {
    console.log(`${file} (${known.length} in baseline):`);
    for (const v of known) console.log(`  L${v.line} [${v.field}] ${v.text}`);
  }
  if (fresh.length > 0) {
    exitCode = 1;
    console.log(`${file} (${fresh.length} NEW):`);
    for (const v of fresh) console.log(`  L${v.line} [${v.field}] ${v.text}`);
  }
}

if (exitCode === 0 && all.length === 0) {
  console.log("OK: no content gate violations detected.");
} else if (exitCode === 0) {
  console.log("OK: no NEW content gate violations.");
}

process.exit(exitCode);
