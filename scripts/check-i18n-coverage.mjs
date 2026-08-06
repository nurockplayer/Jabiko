#!/usr/bin/env node
// =============================================================================
// check-i18n-coverage.mjs -- i18n translation coverage scanner (issue #378)
// =============================================================================
//
// Step 1 of the AI-assisted i18n pipeline: scan the repo for translation gaps
// and emit a machine-readable report. PURE READ-ONLY -- never writes content,
// only an optional report file. No API key, no network.
//
// What it checks
// --------------
//   A. UI copy coverage (src/locales/*.ts)
//      Every locale must structurally satisfy the `Copy` type (tsc enforces
//      this), so there are no MISSING keys. The real gap is *untranslated*
//      values: a non-zh-Hant locale whose string value is byte-identical to
//      the zh-Hant source AND the source contains Han ideographs -> the
//      Chinese text leaked through untranslated.
//        - Exact-equality-to-source is the primary signal: it has ZERO false
//          positives on legitimate Japanese (ja values contain kana, so they
//          differ from the zh-Hant Han-only string) and on shared proper nouns
//          (those are non-Han, e.g. "Jabiko"/"JLPT", so the Han gate skips them).
//      Secondary (warn) signal: a Latin/Thai-script locale (en/th/id/vi) whose
//      value contains Han ideographs -> suspected residual CJK.
//
//   B. Content localisation gap (question bank / learning content)
//      Fields like meaningZh / hintZh / explanation / promptContextZh /
//      exampleMeaningZh are Chinese-only with NO per-locale variant. We report
//      the VOLUME of this gap (informational) -- localising it needs a
//      dedicated translation schema (issue #378 section 6), which is a separate
//      design decision, so we do not explode it into per-field entries.
//
// Japanese vs Chinese
// -------------------
//   Jabiko is a Japanese-learning site, so values legitimately contain kanji,
//   kana and Japanese example sentences. We never flag a value just for
//   containing Han. The UI signal is *equality to the Chinese source*; the
//   content gap is identified by *field name* (…Zh), not by sniffing scripts.
//
// Usage
//   node scripts/check-i18n-coverage.mjs [--output <path>] [--json]
//     --output <path>  also write the full report as JSON to <path>
//     --json           print the JSON report to stdout (instead of summary)
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
// Reusable TypeScript-AST overlay audit core (#422/#695). The CLI only consumes
// the adapters' records / counts / diagnostics -- it never re-parses AST or maps
// content-system keys itself.
import {
  auditExamOverlays,
  auditGrammarNoteOverlays,
  auditKanjiOnyomiOverlays,
  auditLearningBlockOverlays,
  auditSentencePatternOverlays,
  parseLaunchedLocales,
  parseTypeScriptFile,
  runOverlayAdapters
} from "./i18n-overlay-audit.mjs";

// Inlined locale constants (formerly from ./_locales.mjs)
const SOURCE_LOCALE = "zh-Hant";
const LOCALE_CODES = ["zh-Hant", "ja", "en", "th", "id", "ko", "vi", "my"];
const HAN_LOCALES = new Set([SOURCE_LOCALE, "ja"]);
const NON_HAN_LOCALES = new Set(LOCALE_CODES.filter((code) => !HAN_LOCALES.has(code)));

// Repo root. JABIKO_I18N_REPO_ROOT lets a spawned CLI audit a temporary fixture
// repository (tests); production always derives from this file's location so
// cwd never matters.
const REPO_ROOT = process.env.JABIKO_I18N_REPO_ROOT
  ? path.resolve(process.env.JABIKO_I18N_REPO_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES_DIR = path.join(REPO_ROOT, "src", "locales");
const EXAM_ITEMS_DIR = path.join(REPO_ROOT, "src", "domain", "exam", "items");
// SOURCE_LOCALE + NON_HAN_LOCALES come from the single locale registry (#434):
// non-Han = every locale except zh-Hant (source) and ja, so ko/my are covered
// (the old hardcoded set omitted them). Han ideographs in a non-Han locale are
// suspected untranslated residue.

const HAN_RE = /[一-鿿㐀-䶿]/;

function parseArgs(argv) {
  const opts = { output: null, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--output") opts.output = argv[++i];
    else if (a === "--json") opts.json = true;
    else if (a === "--help" || a === "-h") opts.help = true;
    else throw new Error(`unknown arg: ${a}`);
  }
  return opts;
}

// Extract every `key: "string"` / 'string' / `template` pair from a locale .ts
// file into a Map(key -> value). Flattens nesting by key name (good enough to
// compare the same key across locales). Function- and array-valued keys never
// match (no quote follows the colon) and are skipped by design.
function extractStrings(text) {
  const map = new Map();
  // key: then optional whitespace/newline, then a quoted literal.
  const re = /([A-Za-z_$][\w$]*)\s*:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const key = m[1];
    const raw = m[2];
    // unquote + unescape the common escapes
    const value = raw
      .slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\`/g, "`")
      .replace(/\\\\/g, "\\");
    // keep first occurrence (top-level wins over deeper same-named keys)
    if (!map.has(key)) map.set(key, value);
  }
  return map;
}

function loadLocale(locale) {
  const file = path.join(LOCALES_DIR, `${locale}.ts`);
  const text = fs.readFileSync(file, "utf8");
  return extractStrings(text);
}

function scanUiCopy() {
  const localeFiles = fs
    .readdirSync(LOCALES_DIR)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => f.replace(/\.ts$/, ""));
  const source = loadLocale(SOURCE_LOCALE);
  const untranslated = []; // RELIABLE: non-ja locale value byte-equal to the Chinese source
  const jaReview = []; // ja value equals source -- usually a legit shared-kanji term, NOT a gap; manual review only
  const residualReview = []; // Han in a Latin/Thai-script locale -- usually an intentional Japanese term; manual review only
  const perLocale = {};

  for (const locale of localeFiles) {
    if (locale === SOURCE_LOCALE) continue;
    const target = loadLocale(locale);
    let untransN = 0;
    let jaN = 0;
    let residualN = 0;
    for (const [key, srcVal] of source) {
      if (!HAN_RE.test(srcVal)) continue; // source token has no Chinese -> nothing to translate (proper noun/symbol)
      const tgtVal = target.get(key);
      if (typeof tgtVal !== "string") continue;
      if (tgtVal === srcVal) {
        if (locale === "ja") {
          // Japanese shares kanji with Chinese; equality is NOT a reliable
          // "untranslated" signal (作者/文法/漢字讀み/準備中 are valid Japanese).
          jaReview.push({ locale, key, text: srcVal });
          jaN++;
        } else {
          untranslated.push({ locale, key, sourceLocale: SOURCE_LOCALE, text: srcVal });
          untransN++;
        }
      } else if (NON_HAN_LOCALES.has(locale) && HAN_RE.test(tgtVal)) {
        // Han in en/th/id/vi: almost always an intentional embedded Japanese
        // term (ます/て/た, idol names, JLPT examples). Surface for review only;
        // do NOT count as a translation gap (issue #378: don't flag Japanese).
        residualReview.push({ locale, key, text: tgtVal });
        residualN++;
      }
    }
    perLocale[locale] = { untranslated: locale === "ja" ? 0 : untransN, jaReview: jaN, residualReview: residualN };
  }
  return { untranslated, jaReview, residualReview, perLocale, sourceKeyCount: source.size };
}

function scanContentGap() {
  // Count Chinese-only content fields in the exam bank (no per-locale variant).
  const fields = ["meaningZh", "hintZh", "explanation", "promptContextZh", "exampleMeaningZh"];
  const byLevel = {};
  let items = 0;
  if (fs.existsSync(EXAM_ITEMS_DIR)) {
    for (const name of fs.readdirSync(EXAM_ITEMS_DIR)) {
      if (!/^n[1-5]\.ts$/.test(name)) continue;
      const level = name.replace(/\.ts$/, "").toUpperCase();
      const text = fs.readFileSync(path.join(EXAM_ITEMS_DIR, name), "utf8");
      const itemCount = (text.match(/examQuestion\(\{/g) || []).length;
      const fieldCounts = {};
      let total = 0;
      for (const f of fields) {
        const n = (text.match(new RegExp(`\\b${f}\\s*:`, "g")) || []).length;
        fieldCounts[f] = n;
        total += n;
      }
      byLevel[level] = { items: itemCount, chineseFields: total, byField: fieldCounts };
      items += itemCount;
    }
  }
  const totalChineseFields = Object.values(byLevel).reduce((s, l) => s + l.chineseFields, 0);
  return { examItems: items, examChineseFields: totalChineseFields, byLevel };
}

// ---------------------------------------------------------------------------
// Overlay audit (issue #422 / #699)
// ---------------------------------------------------------------------------
// Runs the five content-system overlay adapters from i18n-overlay-audit.mjs
// against the real repo and returns the merged, sorted records plus per-system
// and per-locale counts plus parse diagnostics. The CLI itself never touches
// ASTs or content key mappings: it only consumes the adapters' report.
//
// Record shape (documented in i18n-overlay-audit.mjs):
//   { system, locale, sourceKey, overlayKey, status: "missing" | "dangling" }
//   - missing:  a source key with no overlay entry for that locale
//   - dangling: an overlay key with no matching source key
//
// Overlay systems (fixed order, matches the core's OVERLAY_SYSTEMS). The CLI
// uses this only to render a stable per-system summary (including 0-record
// systems); the actual key sets come entirely from the adapters.
const OVERLAY_SYSTEMS = [
  "exam",
  "learningBlocks",
  "grammarNotes",
  "sentencePatterns",
  "kanjiOnyomi"
];

function runOverlayAudit() {
  const i18nSourceFile = parseTypeScriptFile(path.join(REPO_ROOT, "src", "i18n.ts"));
  const { sourceLocale, targetLocales } = parseLaunchedLocales(i18nSourceFile);

  const adapters = [
    ({ repoRoot, targetLocales: locales }) => auditExamOverlays({ repoRoot, targetLocales: locales }),
    ({ repoRoot, targetLocales: locales }) => auditLearningBlockOverlays({ repoRoot, targetLocales: locales }),
    ({ repoRoot, targetLocales: locales }) => auditGrammarNoteOverlays({ repoRoot, targetLocales: locales }),
    ({ repoRoot, targetLocales: locales }) => auditSentencePatternOverlays({ repoRoot, targetLocales: locales }),
    ({ repoRoot, targetLocales: locales }) => auditKanjiOnyomiOverlays({ repoRoot, targetLocales: locales })
  ];

  const report = runOverlayAdapters(adapters, {
    repoRoot: REPO_ROOT,
    targetLocales
  });

  const records = report.records; // already sorted by the core
  const counts = {
    total: records.length,
    missing: records.filter((r) => r.status === "missing").length,
    dangling: records.filter((r) => r.status === "dangling").length
  };

  // Fill every overlay system (including zero-record systems) so the summary
  // always shows all five counts in a stable order.
  const perSystem = {};
  for (const system of OVERLAY_SYSTEMS) {
    perSystem[system] = report.counts.bySystem[system] ?? { total: 0, missing: 0, dangling: 0 };
  }

  return {
    sourceLocale,
    targetLocales,
    records,
    counts,
    hasMissing: counts.missing > 0,
    hasDangling: counts.dangling > 0,
    diagnostics: report.diagnostics,
    perSystem,
    perLocale: report.counts.byLocale
  };
}

/** Render the human-facing overlay audit section. Never called for --json.
 *  Output order is fixed: systems + counts first, then every record in the
 *  canonical sort order (system -> locale -> sourceKey -> overlayKey -> status)
 *  with a WARNING (missing) / ERROR (dangling) tag. Diagnostics are rendered
 *  file-relative so a temp fixture repo never leaks absolute paths. */
function printOverlayAudit(overlay) {
  console.log(`\nOverlay audit (source = ${overlay.sourceLocale}):`);
  console.log(`  target locales: ${overlay.targetLocales.join(", ")}`);
  for (const system of OVERLAY_SYSTEMS) {
    const c = overlay.perSystem[system];
    console.log(
      `  ${system}: ${c.total} record(s) (${c.missing} missing, ${c.dangling} dangling)`
    );
  }

  // AST parse / unsafe-shape failures are audit FAILURES (exit 1), never
  // missing warnings. Paths are rendered relative to the repo root.
  if (overlay.diagnostics.length > 0) {
    console.log(`\n  overlay audit failure -- ${overlay.diagnostics.length} parse error(s):`);
    for (const d of overlay.diagnostics) {
      const file = d.file ? path.relative(REPO_ROOT, d.file) : "";
      const where = file ? ` at ${file}${d.line ? `:${d.line}` : ""}` : "";
      console.log(`    ERROR${where}: ${d.message}`);
      if (d.context) console.log(`      context: ${d.context}`);
    }
    return;
  }

  if (overlay.records.length === 0) {
    console.log("\n  overlay audit passed");
    return;
  }

  // Every record in canonical sort order; missing is a WARNING (exit 0 overall
  // when no dangling exists), dangling is an ERROR (exit 1 overall).
  console.log(`\n  ${overlay.counts.total} overlay audit record(s):`);
  for (const r of overlay.records) {
    if (r.status === "missing") {
      console.log(`    WARNING [${r.locale}] ${r.system}.${r.sourceKey}  (overlay key missing)`);
    } else {
      console.log(`    ERROR [${r.locale}] ${r.system}.${r.overlayKey}  (no matching source)`);
    }
  }
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
  if (opts.help) {
    console.log("Usage: node scripts/check-i18n-coverage.mjs [--output <path>] [--json]");
    return;
  }

  const ui = scanUiCopy();
  const content = scanContentGap();
  const overlay = runOverlayAudit();

  const report = {
    generatedAtNote: "stamp added by caller; Date.* avoided for determinism",
    source: SOURCE_LOCALE,
    ui: {
      sourceKeyCount: ui.sourceKeyCount,
      perLocale: ui.perLocale,
      untranslated: ui.untranslated, // RELIABLE gap: non-ja value equals the Chinese source
      jaReview: ui.jaReview, // ja==source: usually legit shared kanji, manual review only
      residualReview: ui.residualReview, // Han in Latin/Thai locale: usually intentional Japanese, review only
    },
    content,
    // Merged overlay audit (#422/#699): records + counts + flags. The CLI
    // consumes these from the adapters -- it never derives them itself.
    overlayAudit: {
      records: overlay.records,
      counts: overlay.counts,
      hasMissing: overlay.hasMissing,
      hasDangling: overlay.hasDangling
    },
  };

  if (opts.output) {
    fs.mkdirSync(path.dirname(path.resolve(REPO_ROOT, opts.output)), { recursive: true });
    fs.writeFileSync(path.resolve(REPO_ROOT, opts.output), JSON.stringify(report, null, 2) + "\n");
  }

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
    // exit code still follows dangling / parse-failure semantics
    if (overlay.counts.dangling > 0 || overlay.diagnostics.length > 0) process.exit(1);
    return;
  }

  // human summary
  console.log(`i18n coverage report (source = ${SOURCE_LOCALE})\n`);
  console.log(`UI copy: ${ui.sourceKeyCount} translatable string keys per locale`);
  console.log(`  locale  untranslated  ja-review  residual-review`);
  for (const [loc, c] of Object.entries(ui.perLocale)) {
    console.log(`  ${loc.padEnd(7)} ${String(c.untranslated).padStart(11)} ${String(c.jaReview).padStart(10)} ${String(c.residualReview).padStart(15)}`);
  }
  console.log(`  -> ${ui.untranslated.length} reliable untranslated value(s) [non-ja, value == Chinese source]`);
  console.log(`     ${ui.jaReview.length} ja value(s) equal to source (mostly legit shared kanji -- review only)`);
  console.log(`     ${ui.residualReview.length} Han-in-Latin/Thai value(s) (mostly intentional Japanese terms -- review only)`);
  if (ui.untranslated.length > 0) {
    console.log(`\n  reliable untranslated keys (should be fixed/translated):`);
    for (const e of ui.untranslated) {
      const t = e.text.replace(/\n/g, " ").slice(0, 50);
      console.log(`    [${e.locale}] ${e.key}: "${t}${e.text.length > 50 ? "…" : ""}"`);
    }
  }

  console.log(`\nContent localisation gap (Chinese-only, no per-locale variant):`);
  console.log(`  exam items: ${content.examItems}`);
  console.log(`  exam Chinese fields: ${content.examChineseFields} (meaningZh/hintZh/explanation/promptContextZh/exampleMeaningZh)`);
  for (const [lvl, c] of Object.entries(content.byLevel)) {
    console.log(`    ${lvl}: ${c.items} items, ${c.chineseFields} Chinese fields`);
  }
  console.log(`  NOTE: localising content needs a per-locale translation schema (issue #378 section 6) -- design decision, not auto-translatable yet.`);

  // overlay audit: systems/counts first, then records (fixed order)
  printOverlayAudit(overlay);

  // missing is a warning (exit 0 overall); dangling / parse failure is an
  // error (exit 1 overall)
  if (overlay.counts.dangling > 0 || overlay.diagnostics.length > 0) {
    process.exit(1);
  }
}

main();