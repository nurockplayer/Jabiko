#!/usr/bin/env node
// =============================================================================
// check-i18n-coverage.mjs -- i18n translation coverage scanner (issue #378)
// =============================================================================
//
// Two modes:
//   A. UI copy coverage (src/locales/*.ts) — regex-based, no Vite needed.
//      Every locale must structurally satisfy the Copy type (tsc enforces
//      this), so there are no MISSING keys. The real gap is *untranslated*
//      values: a non-zh-Hant locale whose string value is byte-identical to
//      the zh-Hant source AND the source contains Han ideographs.
//      Also flags Han-in-Latin/Thai locales as review candidates.
//
//   B. Content localisation gap (exam items + grammar notes) — uses Vite SSR
//      to load the real objects for detailed field-level analysis.
//      Outputs a machine-readable report listing every translatable Chinese
//      field per item, consumed by scripts/ai-translate-content.mjs.
//
// Japanese vs Chinese
// -------------------
//   Jabiko is a Japanese-learning site, so values legitimately contain kanji,
//   kana and Japanese example sentences. The UI signal is *equality to the
//   Chinese source*; the content gap uses a kana-ratio heuristic to distinguish
//   Japanese sentences from Chinese explanatory text.
//
// Usage
//   node scripts/check-i18n-coverage.mjs [--output <path>] [--json] [--locale <code>]
//     --output <path>  write the full report as JSON to <path>
//     --json           print the JSON report to stdout (instead of summary)
//     --locale <code>  when given, also check existing translations for that locale
// =============================================================================

import { createServer } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES_DIR = path.join(REPO_ROOT, "src", "locales");
const EXAM_ITEMS_DIR = path.join(REPO_ROOT, "src", "domain", "exam", "items");
const SOURCE_LOCALE = "zh-Hant";
const NON_HAN_LOCALES = new Set(["en", "th", "id", "vi"]);

const HAN_RE = /[一-鿿㐀-䶿]/;

// ---- CLI --------------------------------------------------------------------

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === "--output") args.output = process.argv[++i];
  else if (a === "--json") args.json = true;
  else if (a === "--locale") args.locale = process.argv[++i];
  else if (a === "--help" || a === "-h") { args.help = true; break; }
}

if (args.help) {
  console.log("Usage: node scripts/check-i18n-coverage.mjs [--output <path>] [--json] [--locale <code>]");
  process.exit(0);
}

// =============================================================================
// Part A — UI copy scan (regex-based, no Vite)
// =============================================================================

function extractStrings(text) {
  const map = new Map();
  const re = /([A-Za-z_$][\w$]*)\s*:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const key = m[1];
    const raw = m[2];
    const value = raw.slice(1, -1)
      .replace(/\\n/g, "\n").replace(/\\t/g, "\t")
      .replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\`/g, "`")
      .replace(/\\\\/g, "\\");
    if (!map.has(key)) map.set(key, value);
  }
  return map;
}

function scanUiCopy() {
  const localeFiles = fs.readdirSync(LOCALES_DIR)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => f.replace(/\.ts$/, ""));

  const source = extractStrings(fs.readFileSync(path.join(LOCALES_DIR, `${SOURCE_LOCALE}.ts`), "utf8"));
  const untranslated = [];
  const jaReview = [];
  const residualReview = [];
  const perLocale = {};

  for (const locale of localeFiles) {
    if (locale === SOURCE_LOCALE) continue;
    const target = extractStrings(fs.readFileSync(path.join(LOCALES_DIR, `${locale}.ts`), "utf8"));
    let untransN = 0, jaN = 0, residualN = 0;
    for (const [key, srcVal] of source) {
      if (!HAN_RE.test(srcVal)) continue;
      const tgtVal = target.get(key);
      if (typeof tgtVal !== "string") continue;
      if (tgtVal === srcVal) {
        if (locale === "ja") {
          jaReview.push({ locale, key, text: srcVal });
          jaN++;
        } else {
          untranslated.push({ locale, key, sourceLocale: SOURCE_LOCALE, text: srcVal });
          untransN++;
        }
      } else if (NON_HAN_LOCALES.has(locale) && HAN_RE.test(tgtVal)) {
        residualReview.push({ locale, key, text: tgtVal });
        residualN++;
      }
    }
    perLocale[locale] = { untranslated: locale === "ja" ? 0 : untransN, jaReview: jaN, residualReview: residualN };
  }
  return { untranslated, jaReview, residualReview, perLocale, sourceKeyCount: source.size };
}

// =============================================================================
// Part B — Content scan (Vite SSR)
// =============================================================================

function isLikelyChinese(text) {
  if (!text || typeof text !== "string") return false;
  if (!HAN_RE.test(text)) return false;
  const kanaCount = (text.match(/[぀-ゟ゠-ヿ]/g) || []).length;
  return kanaCount / text.length < 0.3;
}

const PROMPT_LABEL_MAP = {
  "文法形式選擇": "grammar-form", "詞彙填空": "vocabulary-blank",
  "漢字読み": "kanji-reading", "文章脈絡": "context-cloze",
  "類義替換": "synonym-replace", "詞彙用法": "vocabulary-usage",
  "語順組合": "word-order",
};

function scanExamItem(item) {
  const fields = {};

  if (item.vocabulary?.meaningZh && isLikelyChinese(item.vocabulary.meaningZh))
    fields.meaning = { text: item.vocabulary.meaningZh };
  if (item.instructionZh && isLikelyChinese(item.instructionZh))
    fields.instruction = { text: item.instructionZh };
  if (item.promptContextZh && isLikelyChinese(item.promptContextZh))
    fields.promptContext = { text: item.promptContextZh };
  fields.hint = item.hintZh && isLikelyChinese(item.hintZh)
    ? { text: item.hintZh } : null;
  if (item.explanation && isLikelyChinese(item.explanation))
    fields.explanation = { text: item.explanation };
  const exMeaning = item.vocabulary?.examples?.[0]?.meaningZh;
  if (exMeaning && isLikelyChinese(exMeaning))
    fields.exampleMeaning = { text: exMeaning };

  if (Object.keys(fields).length === 0) return null;
  const category = item.promptLabel
    ? (PROMPT_LABEL_MAP[item.promptLabel] || item.promptLabel) : "unknown";

  return {
    type: "examItem", id: item.id,
    level: item.vocabulary?.level || null, category, fields,
  };
}

function scanGrammarNote(surface, note) {
  const fields = {};
  if (note.meaningZh && isLikelyChinese(note.meaningZh))
    fields.meaning = { text: note.meaningZh };
  if (note.usageZh && isLikelyChinese(note.usageZh))
    fields.usage = { text: note.usageZh };
  const exampleMeanings = note.examples.map((ex) =>
    ex.zh && isLikelyChinese(ex.zh) ? { text: ex.zh } : null);
  if (exampleMeanings.some((m) => m !== null))
    fields.exampleMeanings = exampleMeanings;
  if (note.confusions?.length) {
    const cc = note.confusions.filter((c) => isLikelyChinese(c));
    if (cc.length > 0) fields.confusions = cc.map((c) => ({ text: c }));
  }
  if (Object.keys(fields).length === 0) return null;
  return { type: "grammarNote", id: surface, level: note.jlptLevel || null, category: "grammar-note", fields };
}

async function scanContentViaSsr(locale) {
  const server = await createServer({
    configFile: false, logLevel: "warn",
    server: { middlewareMode: true }, appType: "custom",
    optimizeDeps: { noDiscovery: true },
  });
  try {
    const { examStyleQuestions } = await server.ssrLoadModule("/src/domain/examBlocks.ts");
    const { grammarNotes: rawNotes } = await server.ssrLoadModule("/src/domain/grammarNotes.ts");

    const examItems = examStyleQuestions.map(scanExamItem).filter(Boolean);
    const grammarNotes = Object.entries(rawNotes)
      .map(([s, n]) => scanGrammarNote(s, n)).filter(Boolean);

    // Existing translations (--locale)
    let existingIds = new Set();
    if (locale) {
      const tp = path.join(REPO_ROOT, "src", "content-translations", `${locale}.json`);
      if (fs.existsSync(tp)) {
        for (const item of (JSON.parse(fs.readFileSync(tp, "utf8")).examItems || []))
          existingIds.add(item.id);
        for (const note of (JSON.parse(fs.readFileSync(tp, "utf8")).grammarNotes || []))
          existingIds.add(note.surface);
      }
    }

    const seen = new Set();
    const allItems = [...examItems, ...grammarNotes].filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    return {
      scannedAt: new Date().toISOString(),
      sourceLocale: SOURCE_LOCALE,
      locale,
      existingTranslated: existingIds.size,
      summary: { totalItems: allItems.length, examItems: examItems.length, grammarNotes: grammarNotes.length },
      items: allItems,
    };
  } finally {
    await server.close();
  }
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const ui = scanUiCopy();
  const content = await scanContentViaSsr(args.locale || null);

  const report = {
    generatedAt: new Date().toISOString(),
    source: SOURCE_LOCALE,
    ui: {
      sourceKeyCount: ui.sourceKeyCount,
      perLocale: ui.perLocale,
      untranslated: ui.untranslated,
      jaReview: ui.jaReview,
      residualReview: ui.residualReview,
    },
    content: {
      examItems: content.summary.examItems,
      grammarNotes: content.summary.grammarNotes,
      totalItems: content.summary.totalItems,
      existingTranslated: content.existingTranslated,
      items: content.items,
    },
  };

  if (args.output) {
    const outPath = path.resolve(REPO_ROOT, args.output);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
    console.log(`wrote ${path.relative(REPO_ROOT, outPath)}`);
  }

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  // -- human summary
  console.log(`i18n coverage report (source = ${SOURCE_LOCALE})\n`);
  console.log(`UI copy: ${ui.sourceKeyCount} translatable string keys per locale`);
  console.log(`  locale  untranslated  ja-review  residual-review`);
  for (const [loc, c] of Object.entries(ui.perLocale)) {
    console.log(`  ${loc.padEnd(7)} ${String(c.untranslated).padStart(11)} ${String(c.jaReview).padStart(10)} ${String(c.residualReview).padStart(15)}`);
  }
  console.log(`  -> ${ui.untranslated.length} reliable untranslated value(s) [non-ja, value == Chinese source]`);
  console.log(`     ${ui.jaReview.length} ja value(s) equal to source (mostly legit shared kanji -- review only)`);
  console.log(`     ${ui.residualReview.length} Han-in-Latin/Thai value(s) (mostly intentional Japanese terms -- review only)`);

  console.log(`\nContent items: ${content.summary.totalItems} (${content.summary.examItems} exam + ${content.summary.grammarNotes} grammar notes)`);
  if (args.locale) console.log(`  existing ${args.locale} translations: ${content.existingTranslated}`);
}

await main();
