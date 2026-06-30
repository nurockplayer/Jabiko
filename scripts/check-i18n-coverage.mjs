#!/usr/bin/env node
// =============================================================================
// check-i18n-coverage.mjs -- scan Chinese-only translatable content in exam
// items and grammar notes, then output a machine-readable coverage report.
//
// Usage:
//   node scripts/check-i18n-coverage.mjs
//   node scripts/check-i18n-coverage.mjs --output .tmp/i18n-coverage.json
//   node scripts/check-i18n-coverage.mjs --locale en --output report.json
//
// When --locale is given, the report also flags which items are missing
// translations for that locale (based on src/content-translations/<locale>.json).
// =============================================================================

import { createServer } from "vite";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ---- CLI args ---------------------------------------------------------------

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith("--")) {
    const key = a.replace(/^--/, "");
    const val = process.argv[i + 1];
    if (val !== undefined && !val.startsWith("--")) {
      args[key] = val;
      i++;
    } else {
      args[key] = true;
    }
  }
}

const OUTPUT = args.output || ".tmp/i18n-coverage.json";
const LOCALE = args.locale || null;

// ---- Helpers ----------------------------------------------------------------

/** Non-Japanese, non-JLPT Chinese text patterns used in the project. */
const CHINESE_PATTERN = /[一-鿿㐀-䶿]+/;

/**
 * Check whether a string is likely Chinese content (not Japanese kanji
 * in a Japanese sentence). We use a simple heuristic: the string contains
 * at least one CJK character AND fewer than 30% hiragana/katakana.
 * Japanese-heavy text (sentences, readings) will fail this and be excluded.
 */
function isLikelyChinese(text) {
  if (!text || typeof text !== "string") return false;
  if (!CHINESE_PATTERN.test(text)) return false;

  const total = text.length;
  const kanaCount = (text.match(/[぀-ゟ゠-ヿ]/g) || []).length;
  return kanaCount / total < 0.3;
}

/** Human-readable category for exam promptLabel values. */
const PROMPT_LABEL_MAP = {
  "文法形式選擇": "grammar-form",
  "詞彙填空": "vocabulary-blank",
  "漢字読み": "kanji-reading",
  "文章脈絡": "context-cloze",
  "類義替換": "synonym-replace",
  "詞彙用法": "vocabulary-usage",
  "語順組合": "word-order",
};

// ---- Scan logic -------------------------------------------------------------

/**
 * Scan exam items for Chinese translatable fields.
 * Returns an array of items with their Chinese text fields.
 */
function scanExamItem(item) {
  const fields = {};

  if (item.vocabulary?.meaningZh && isLikelyChinese(item.vocabulary.meaningZh)) {
    fields.meaning = { text: item.vocabulary.meaningZh };
  }
  if (item.instructionZh && isLikelyChinese(item.instructionZh)) {
    fields.instruction = { text: item.instructionZh };
  }
  if (item.promptContextZh && isLikelyChinese(item.promptContextZh)) {
    fields.promptContext = { text: item.promptContextZh };
  }
  // hintZh is optional — record it even if null so the translate script
  // knows the hint key exists; a "hint": null means nothing to translate.
  fields.hint = item.hintZh && isLikelyChinese(item.hintZh)
    ? { text: item.hintZh }
    : null;

  if (item.explanation && isLikelyChinese(item.explanation)) {
    fields.explanation = { text: item.explanation };
  }

  const exMeaning = item.vocabulary?.examples?.[0]?.meaningZh;
  if (exMeaning && isLikelyChinese(exMeaning)) {
    fields.exampleMeaning = { text: exMeaning };
  }

  // Only include if at least one field was found
  if (Object.keys(fields).length === 0) return null;

  const category = item.promptLabel
    ? (PROMPT_LABEL_MAP[item.promptLabel] || item.promptLabel)
    : "unknown";

  return {
    type: "examItem",
    id: item.id,
    level: item.vocabulary?.level || null,
    category,
    fields,
  };
}

/**
 * Scan grammar notes for Chinese translatable fields.
 */
function scanGrammarNote(surface, note) {
  const fields = {};

  if (note.meaningZh && isLikelyChinese(note.meaningZh)) {
    fields.meaning = { text: note.meaningZh };
  }
  if (note.usageZh && isLikelyChinese(note.usageZh)) {
    fields.usage = { text: note.usageZh };
  }

  // Example translations (examples[].zh)
  const exampleMeanings = note.examples
    .map((ex) => (ex.zh && isLikelyChinese(ex.zh) ? ex.zh : null));
  if (exampleMeanings.some((m) => m !== null)) {
    fields.exampleMeanings = exampleMeanings.map((m) => (m ? { text: m } : null));
  }

  // Confusion strings (Chinese text about how this point differs)
  if (note.confusions?.length) {
    const chineseConfusions = note.confusions.filter((c) => isLikelyChinese(c));
    if (chineseConfusions.length > 0) {
      fields.confusions = chineseConfusions.map((c) => ({ text: c }));
    }
  }

  if (Object.keys(fields).length === 0) return null;

  return {
    type: "grammarNote",
    id: surface,
    level: note.jlptLevel || null,
    category: "grammar-note",
    fields,
  };
}

// ---- Main -------------------------------------------------------------------

const server = await createServer({
  configFile: false,
  logLevel: "warn",
  server: { middlewareMode: true },
  appType: "custom",
  optimizeDeps: { noDiscovery: true },
});

try {
  const { examStyleQuestions } =
    await server.ssrLoadModule("/src/domain/examBlocks.ts");
  const { grammarNotes: rawGrammarNotes } =
    await server.ssrLoadModule("/src/domain/grammarNotes.ts");

  // ----- Exam items ----------------------------------------------------------
  const examItems = examStyleQuestions
    .map(scanExamItem)
    .filter(Boolean);

  console.log(`exam items scanned: ${examStyleQuestions.length} · with Chinese text: ${examItems.length}`);

  // ----- Grammar notes -------------------------------------------------------
  const grammarNotes = Object.entries(rawGrammarNotes)
    .map(([surface, note]) => scanGrammarNote(surface, note))
    .filter(Boolean);

  console.log(`grammar notes scanned: ${Object.keys(rawGrammarNotes).length} · with Chinese text: ${grammarNotes.length}`);

  // ----- Existing translations (when --locale is given) ----------------------
  let existingIds = new Set();
  if (LOCALE) {
    const translationPath = path.join(ROOT, "src", "content-translations", `${LOCALE}.json`);
    if (existsSync(translationPath)) {
      const existing = JSON.parse(readFileSync(translationPath, "utf8"));
      for (const item of (existing.examItems || [])) existingIds.add(item.id);
      for (const note of (existing.grammarNotes || [])) existingIds.add(note.surface);
      console.log(`existing ${LOCALE} translations: ${existingIds.size} items`);
    } else {
      console.log(`no existing ${LOCALE} translations found`);
    }
  }

  // ----- Build report --------------------------------------------------------
  const allItems = [...examItems, ...grammarNotes];

  // Deduplicate by id (unlikely but defensive)
  const seen = new Set();
  const uniqueItems = allItems.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  const report = {
    scannedAt: new Date().toISOString(),
    sourceLocale: "zh-Hant",
    locale: LOCALE,
    summary: {
      totalItems: uniqueItems.length,
      examItems: examItems.length,
      grammarNotes: grammarNotes.length,
    },
    items: uniqueItems,
  };

  // ----- Output --------------------------------------------------------------
  const outputPath = path.resolve(ROOT, OUTPUT);
  const outputDir = path.dirname(outputPath);
  if (!existsSync(outputDir)) {
    await import("node:fs").then((fs) => fs.mkdirSync(outputDir, { recursive: true }));
  }
  writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`wrote ${path.relative(ROOT, outputPath)} · ${uniqueItems.length} items`);

  if (LOCALE) {
    const missing = uniqueItems.filter((item) => !existingIds.has(item.id));
    console.log(`missing for ${LOCALE}: ${missing.length} items`);
    // Print first 5 as sample
    for (const m of missing.slice(0, 5)) {
      const fieldKeys = Object.keys(m.fields).join(", ");
      console.log(`  ${m.type}:${m.id} [${fieldKeys}]`);
    }
  }
} finally {
  await server.close();
}
