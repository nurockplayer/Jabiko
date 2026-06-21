#!/usr/bin/env node
// =============================================================================
// import-exam-items.mjs -- formal exam-bank import pipeline (issue #100)
// =============================================================================
//
// Reads one or more batch JSON files of exam questions and appends each one,
// rendered as an `examQuestion({...})` entry, to the matching per-level item
// array in src/domain/exam/items/<level>.ts (n1..n5). The split item files,
// the ExamQuestionInput shape and the examQuestion() factory were introduced
// in issue #99:
//   - type:    src/domain/exam/types.ts        (ExamQuestionInput)
//   - factory: src/domain/exam/helpers.ts      (examQuestion)
//   - data:    src/domain/exam/items/n{1..5}.ts (export const n{n}Items = [...])
//
// Pure Node built-ins only -- no npm dependency, no npx / pnpm dlx.
//
// -----------------------------------------------------------------------------
// USAGE
// -----------------------------------------------------------------------------
//   node scripts/import-exam-items.mjs [files...] [--dry-run]
//   node scripts/import-exam-items.mjs --help
//
//   files...     One or more batch JSON paths. A path may be a literal file or
//                a simple `*` glob inside scripts/exam-batches (e.g.
//                "scripts/exam-batches/batch-1.json"). Defaults to
//                scripts/exam-batches/*.json when omitted. Globs skip
//                `_`-prefixed fixtures (e.g. _example.json); pass an explicit
//                path to import one.
//   --dry-run    Validate everything and print what WOULD be appended, but do
//                not write any file. All validations still run and any
//                violation still fails the run (non-zero exit).
//   --help, -h   Print this usage and exit.
//
// Each batch file is a JSON array of ExamQuestionInput objects:
//   id, level, surface, reading, meaningZh, promptLabel, instructionZh,
//   promptText, promptContextZh, hintZh?, expectedAnswer, options[4],
//   explanation, exampleJapanese?, exampleMeaningZh?
//
// -----------------------------------------------------------------------------
// VALIDATION (every violation is reported; --dry-run reports too; any failure
// aborts the whole run BEFORE writing -- writes are all-or-nothing)
// -----------------------------------------------------------------------------
//   * JSON parses and is a non-empty array of objects
//   * required string fields present and non-empty
//   * level is one of N1 / N2 / N3 / N4 / N5
//   * id is unique inside the batch AND not already used anywhere in
//     src/domain/exam/items/*.ts
//   * expectedAnswer is one of options
//   * options has exactly 4 entries and stays 4 after de-duplication
//   * promptLabel does not start with an N1..N5 level token (level must not leak)
//   * 漢字読み items: promptText contains the 「」 underline markers
//   * non-漢字読み items: hintZh is present
//   * after appending, the rewritten item file contains no CRLF (stays LF-only)
//
// -----------------------------------------------------------------------------
// NOTES
// -----------------------------------------------------------------------------
//   * Output is always LF. The item files are LF in git; on a Windows checkout
//     core.autocrlf may materialise them as CRLF on disk. This script reads the
//     file, strips any CR, appends LF-joined entries and writes LF bytes, so the
//     post-write CRLF guard holds regardless of the on-disk checkout EOL.
//   * Entries are inserted just before the closing `];`, preserving the existing
//     2-space indentation and field order so the diff is purely additive.
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ITEMS_DIR = path.join(REPO_ROOT, "src", "domain", "exam", "items");
const DEFAULT_GLOB = path.join("scripts", "exam-batches", "*.json");
const LEVELS = ["N1", "N2", "N3", "N4", "N5"];
const KANJI_READING_LABEL = "漢字読み";

const HELP = `import-exam-items.mjs -- formal exam-bank import pipeline (issue #100)

Usage:
  node scripts/import-exam-items.mjs [files...] [--dry-run]
  node scripts/import-exam-items.mjs --help

Arguments:
  files...     One or more batch JSON files (or a simple *.json glob inside
               scripts/exam-batches). Default: ${DEFAULT_GLOB}
  --dry-run    Validate and preview only; never writes. Validation still fails
               the run on any violation.
  --help, -h   Show this help.

Each batch file is a JSON array of ExamQuestionInput objects (see
src/domain/exam/types.ts). Items are appended to src/domain/exam/items/<level>.ts.`;

// ---------------------------------------------------------------------------
// arg parsing
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const opts = { dryRun: false, help: false, files: [] };
  for (const arg of argv) {
    if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg.startsWith("-")) {
      throw new Error(`unknown flag: ${arg} (try --help)`);
    } else opts.files.push(arg);
  }
  return opts;
}

// Resolve patterns to a sorted, de-duplicated list of files. Supports a single
// trailing `*` glob in the basename (e.g. scripts/exam-batches/*.json), which
// is all the prior batch workflow ever needed -- no extra dependency. Globs
// skip `_`-prefixed files (fixtures like _example.json); pass an explicit path
// to import one.
function resolveInputFiles(patterns) {
  const list = patterns.length > 0 ? patterns : [DEFAULT_GLOB];
  const out = new Set();
  for (const pattern of list) {
    const abs = path.resolve(REPO_ROOT, pattern);
    const base = path.basename(abs);
    if (base.includes("*")) {
      const dir = path.dirname(abs);
      if (!fs.existsSync(dir)) continue;
      const re = new RegExp("^" + base.split("*").map(escapeRegExp).join(".*") + "$");
      for (const name of fs.readdirSync(dir)) {
        // `_`-prefixed files are fixtures/examples (e.g. _example.json,
        // _example-bad.json); globs never pick them up. Pass an explicit path
        // to import one deliberately.
        if (name.startsWith("_")) continue;
        if (re.test(name)) out.add(path.join(dir, name));
      }
    } else {
      out.add(abs);
    }
  }
  return [...out].sort();
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------------------------------------------------------------------------
// existing-id index (whole repo item bank)
// ---------------------------------------------------------------------------
function collectExistingIds() {
  const ids = new Map(); // id -> file it lives in
  if (!fs.existsSync(ITEMS_DIR)) return ids;
  for (const name of fs.readdirSync(ITEMS_DIR)) {
    if (!name.endsWith(".ts")) continue;
    const file = path.join(ITEMS_DIR, name);
    const text = fs.readFileSync(file, "utf8");
    for (const m of text.matchAll(/\bid:\s*"((?:[^"\\]|\\.)*)"/g)) {
      if (!ids.has(m[1])) ids.set(m[1], name);
    }
  }
  return ids;
}

// ---------------------------------------------------------------------------
// rendering (mirrors the established items/*.ts entry format exactly)
// ---------------------------------------------------------------------------
const esc = (s) =>
  String(s)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");

function renderEntry(q) {
  const L = [];
  L.push("  examQuestion({");
  L.push(`    id: "${esc(q.id)}",`);
  L.push(`    level: "${q.level}",`);
  L.push(`    surface: "${esc(q.surface)}",`);
  L.push(`    reading: "${esc(q.reading)}",`);
  L.push(`    meaningZh: "${esc(q.meaningZh)}",`);
  L.push(`    promptLabel: "${esc(q.promptLabel)}",`);
  L.push(`    instructionZh: "${esc(q.instructionZh)}",`);
  L.push(`    promptText: "${esc(q.promptText)}",`);
  L.push(`    promptContextZh: "${esc(q.promptContextZh)}",`);
  if (q.hintZh) L.push(`    hintZh: "${esc(q.hintZh)}",`);
  L.push(`    expectedAnswer: "${esc(q.expectedAnswer)}",`);
  L.push(`    options: [${q.options.map((o) => `"${esc(o)}"`).join(", ")}],`);
  const hasExample = Boolean(q.exampleJapanese);
  L.push(`    explanation: "${esc(q.explanation)}"${hasExample ? "," : ""}`);
  if (hasExample) {
    // exampleMeaningZh is optional: when omitted, leave the field out entirely
    // so examQuestion()'s `?? promptContextZh` fallback applies. Emitting "" here
    // would defeat that fallback (?? only triggers on undefined/null, not "").
    const hasExampleMeaning =
      typeof q.exampleMeaningZh === "string" && q.exampleMeaningZh.trim() !== "";
    L.push(`    exampleJapanese: "${esc(q.exampleJapanese)}"${hasExampleMeaning ? "," : ""}`);
    if (hasExampleMeaning) {
      L.push(`    exampleMeaningZh: "${esc(q.exampleMeaningZh)}"`);
    }
  }
  L.push("  })");
  return L.join("\n");
}

// ---------------------------------------------------------------------------
// validation
// ---------------------------------------------------------------------------
const REQUIRED_STRING_FIELDS = [
  "id",
  "level",
  "surface",
  "reading",
  "meaningZh",
  "promptLabel",
  "instructionZh",
  "promptText",
  "promptContextZh",
  "expectedAnswer",
  "explanation"
];

// Validate one item. `where` is a human label (file + index). Pushes messages
// into `errors`. `seen` tracks ids within this run; `existingIds` is the repo
// bank. Returns true when the item is clean.
function validateItem(q, where, errors, seen, existingIds) {
  const before = errors.length;
  const fail = (msg) => errors.push(`${where}: ${msg}`);

  if (q === null || typeof q !== "object" || Array.isArray(q)) {
    fail("entry is not a JSON object");
    return false;
  }

  for (const field of REQUIRED_STRING_FIELDS) {
    if (typeof q[field] !== "string" || q[field].trim() === "") {
      fail(`missing/empty required string field "${field}"`);
    }
  }

  if (typeof q.level === "string" && !LEVELS.includes(q.level)) {
    fail(`level "${q.level}" not one of ${LEVELS.join(" / ")}`);
  }

  // id uniqueness: within this run and against the whole repo bank.
  if (typeof q.id === "string" && q.id.trim() !== "") {
    if (seen.has(q.id)) {
      fail(`duplicate id "${q.id}" (also at ${seen.get(q.id)})`);
    } else {
      seen.set(q.id, where);
    }
    if (existingIds.has(q.id)) {
      fail(`id "${q.id}" already exists in items/${existingIds.get(q.id)}`);
    }
  }

  // options: array of exactly 4, no dupes, containing the expected answer.
  if (!Array.isArray(q.options)) {
    fail(`options must be an array`);
  } else {
    if (q.options.some((o) => typeof o !== "string" || o.trim() === "")) {
      fail(`options must all be non-empty strings`);
    }
    if (q.options.length !== 4) {
      fail(`options must have exactly 4 entries (got ${q.options.length})`);
    }
    if (new Set(q.options).size !== q.options.length) {
      fail(`options contain duplicates: [${q.options.join(", ")}]`);
    }
    if (typeof q.expectedAnswer === "string" && !q.options.includes(q.expectedAnswer)) {
      fail(`expectedAnswer "${q.expectedAnswer}" is not among options [${q.options.join(", ")}]`);
    }
  }

  // promptLabel must not leak the JLPT level.
  if (typeof q.promptLabel === "string" && /^N[1-5]\b/.test(q.promptLabel)) {
    fail(`promptLabel "${q.promptLabel}" must not start with an N1..N5 level token`);
  }

  // Kanji-reading questions underline the target with 「」; other types need a
  // pre-answer hint.
  if (q.promptLabel === KANJI_READING_LABEL) {
    if (typeof q.promptText === "string" && !(q.promptText.includes("「") && q.promptText.includes("」"))) {
      fail(`漢字読み promptText must contain the 「」 underline markers`);
    }
  } else if (typeof q.hintZh !== "string" || q.hintZh.trim() === "") {
    fail(`non-漢字読み item requires a non-empty hintZh`);
  }

  return errors.length === before;
}

// ---------------------------------------------------------------------------
// file append (LF-normalised, additive before the closing `];`)
// ---------------------------------------------------------------------------
const CLOSING_RE = / {2}\}\)\r?\n\];\r?\n?$/;

function appendToLevelFile(levelFile, entries, errors) {
  if (!fs.existsSync(levelFile)) {
    errors.push(`target item file not found: ${levelFile}`);
    return null;
  }
  // Read and normalise to LF so the whole written file is LF, even when the
  // on-disk checkout was CRLF (Windows + core.autocrlf).
  const original = fs.readFileSync(levelFile, "utf8").replace(/\r\n/g, "\n");
  if (!CLOSING_RE.test(original)) {
    errors.push(`could not locate the closing "  })\\n];" pattern in ${path.basename(levelFile)}`);
    return null;
  }
  const block = entries.join(",\n");
  const next = original.replace(CLOSING_RE, "  }),\n" + block + "\n];\n");

  if (next.includes("\r")) {
    errors.push(`internal error: appended ${path.basename(levelFile)} would contain CRLF`);
    return null;
  }
  return next;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exit(2);
  }

  if (opts.help) {
    console.log(HELP);
    return;
  }

  const files = resolveInputFiles(opts.files);
  if (files.length === 0) {
    console.error(`no batch files matched (looked for: ${(opts.files.length ? opts.files : [DEFAULT_GLOB]).join(", ")})`);
    process.exit(2);
  }

  console.log(`${opts.dryRun ? "[dry-run] " : ""}reading ${files.length} batch file(s):`);
  for (const f of files) console.log(`  - ${path.relative(REPO_ROOT, f)}`);

  const existingIds = collectExistingIds();
  const errors = [];
  const seen = new Map();
  const byLevel = new Map(); // level -> rendered entries[]
  let total = 0;

  for (const file of files) {
    const rel = path.relative(REPO_ROOT, file);
    let raw;
    try {
      raw = fs.readFileSync(file, "utf8");
    } catch {
      errors.push(`${rel}: cannot read file`);
      continue;
    }
    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      errors.push(`${rel}: invalid JSON -- ${err.message}`);
      continue;
    }
    if (!Array.isArray(data)) {
      errors.push(`${rel}: top-level JSON must be an array`);
      continue;
    }
    if (data.length === 0) {
      errors.push(`${rel}: batch is empty`);
      continue;
    }

    data.forEach((q, i) => {
      total += 1;
      const where = `${rel}[${i}]`;
      const ok = validateItem(q, where, errors, seen, existingIds);
      if (ok) {
        if (!byLevel.has(q.level)) byLevel.set(q.level, []);
        byLevel.get(q.level).push(renderEntry(q));
      }
    });
  }

  // Build the would-be file contents (also runs the post-append CRLF guard,
  // even in dry-run, so the check is exercised before any write).
  const writes = []; // { file, content, level, count }
  for (const level of LEVELS) {
    const entries = byLevel.get(level);
    if (!entries || entries.length === 0) continue;
    const levelFile = path.join(ITEMS_DIR, `${level.toLowerCase()}.ts`);
    const content = appendToLevelFile(levelFile, entries, errors);
    if (content !== null) {
      writes.push({ file: levelFile, content, level, count: entries.length });
    }
  }

  if (errors.length > 0) {
    console.error(`\nFAIL: ${errors.length} validation error(s) across ${total} item(s):`);
    for (const e of errors) console.error(`  x ${e}`);
    console.error(`\nNo files were written.`);
    process.exit(1);
  }

  console.log(`\nValidated ${total} item(s). Appends by level:`);
  for (const w of writes) {
    console.log(`  ${w.level}: +${w.count} -> ${path.relative(REPO_ROOT, w.file)}`);
  }

  if (opts.dryRun) {
    console.log(`\n[dry-run] all checks passed; no files written.`);
    return;
  }

  for (const w of writes) {
    fs.writeFileSync(w.file, w.content);
  }
  console.log(`\nWrote ${writes.length} file(s); appended ${total} item(s).`);
}

main();
