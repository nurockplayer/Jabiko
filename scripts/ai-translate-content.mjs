#!/usr/bin/env node
// =============================================================================
// ai-translate-content.mjs -- translate Chinese-only exam/grammar content to a
// target locale using Gemini, then write the result to
// src/content-translations/<locale>.json.
//
// Usage:
//   node scripts/ai-translate-content.mjs \
//     --locale en \
//     --source-report .tmp/i18n-coverage.json \
//     --level N5 \
//     --limit 10
//
//   GEMINI_API_KEY=... node scripts/ai-translate-content.mjs \
//     --locale ja --limit 5
//
// Environment:
//   GEMINI_API_KEY (required) — Gemini API key
// =============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
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

const LOCALE = args.locale;
if (!LOCALE) {
  console.error("--locale is required");
  process.exit(1);
}
if (!/^(ja|en|th|id|ko|vi|my)$/.test(LOCALE)) {
  console.error(`invalid locale: ${LOCALE} (must be one of: ja, en, th, id, ko, vi, my)`);
  process.exit(1);
}

const SOURCE_REPORT = args["source-report"] || ".tmp/i18n-coverage.json";
const LEVEL_FILTER = args.level || null;
const LIMIT = parseInt(args.limit || "10", 10);
const DRY_RUN = args["dry-run"] === true;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY environment variable is required");
  process.exit(1);
}

// ---- Gemini client ----------------------------------------------------------

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function translateBatch(items, locale) {
  // Build a mapping: locale code -> human language name
  const LOCALE_NAMES = {
    ja: "Japanese (日本語)",
    en: "English",
    th: "Thai (ไทย)",
    id: "Indonesian (Bahasa Indonesia)",
    ko: "Korean (한국어)",
    vi: "Vietnamese (Tiếng Việt)",
    my: "Burmese (မြန်မာဘာသာ)",
  };

  const localeName = LOCALE_NAMES[locale] || locale;

  const itemDescriptions = items.map((item) => {
    const fields = [];
    for (const [key, val] of Object.entries(item.fields)) {
      if (val && val.text !== undefined) {
        fields.push(`  "${key}": ${JSON.stringify(val.text)}`);
      } else if (key === "hint") {
        fields.push(`  "hint": null  (no hint for this item)`);
      } else if (key === "exampleMeanings") {
        // Grammar note exampleMeanings is an array
        const texts = val ? val.map((v) => (v ? v.text : null)) : [];
        fields.push(`  "exampleMeanings": ${JSON.stringify(texts)}`);
      } else if (key === "confusions") {
        const texts = val ? val.map((v) => v.text) : [];
        fields.push(`  "confusions": ${JSON.stringify(texts)}`);
      }
    }
    return `ITEM ID: ${item.id}  (${item.category}, level: ${item.level || "N/A"})\n` +
      fields.join("\n");
  }).join("\n\n");

  const prompt = [
    `You are translating Chinese (zh-Hant) UI/content text to ${localeName} for a Japanese-language learning app (JLPT N5-N1).`,
    "",
    `Translate each field from Chinese (zh-Hant) to ${localeName}.`,
    "Rules:",
    "1. Translate naturally — the target should read as native-quality, not literal word-for-word.",
    "2. Preserve any Japanese vocabulary, example sentences, readings, or JLPT level references exactly as-is — only translate the Chinese explanatory text.",
    "3. Do NOT add, remove, or rename any field keys.",
    "4. Output ONLY valid JSON. No markdown, no code fences, no extra commentary.",
    "5. Every field in the output must retain the same schema shape as the input.",
    "",
    "Source items:",
    itemDescriptions,
  ].join("\n");

  const systemInstruction = [
    `You are a multilingual translation assistant specialized in Japanese-language education content.`,
    `Translate Chinese (zh-Hant) text to ${localeName}.`,
    `Output ONLY valid JSON matching the input structure. Never add or remove fields.`,
    `Never modify Japanese words, readings, or JLPT level references.`,
  ].join("\n");

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(`Gemini API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Gemini returned empty response: ${JSON.stringify(data)}`);
  }

  return JSON.parse(text);
}

// ---- Schema validation ------------------------------------------------------

const ALLOWED_SOURCE_KEYS = [
  "meaning",
  "instruction",
  "promptContext",
  "hint",
  "explanation",
  "exampleMeaning",
  "usage",
  "exampleMeanings",
  "confusions",
];

/**
 * Validate that the Gemini response is structurally valid:
 * - Must be an array of translated items
 * - Each item must have an "id" field matching a source item
 * - Each field must be one of the ALLOWED_SOURCE_KEYS
 * - No extra fields beyond those in the source item
 * - Translated text must be non-empty (where source text was non-empty)
 * - null fields must correspond to null source fields
 */
function validateTranslations(translations, sourceItems) {
  if (!Array.isArray(translations)) {
    throw new Error("Gemini response must be an array");
  }

  const sourceMap = new Map(sourceItems.map((s) => [s.id, s]));

  for (const t of translations) {
    if (!t.id || typeof t.id !== "string") {
      throw new Error(`Translation item missing or invalid "id"`);
    }

    const source = sourceMap.get(t.id);
    if (!source) {
      throw new Error(`Translation item "${t.id}" has no matching source item`);
    }

    // Check allowed keys
    for (const key of Object.keys(t)) {
      if (key === "id") continue;
      if (!ALLOWED_SOURCE_KEYS.includes(key)) {
        throw new Error(`Translation item "${t.id}" has disallowed key "${key}"`);
      }
    }

    // Check no extra keys beyond source
    for (const key of Object.keys(t)) {
      if (key === "id") continue;
      if (!(key in source.fields)) {
        throw new Error(`Translation item "${t.id}" has unexpected key "${key}" not in source`);
      }
    }

    // Validate array fields (exampleMeanings, confusions) vs scalar
    const sourceField = source.fields;
    for (const key of Object.keys(t)) {
      if (key === "id") continue;
      const val = t[key];
      const srcVal = sourceField[key];

      if (srcVal === null) {
        if (val !== null) {
          throw new Error(`Translation item "${t.id}" field "${key}" should be null (source is null)`);
        }
        continue;
      }

      if (val === null || val === undefined || val === "") {
        throw new Error(`Translation item "${t.id}" field "${key}" is empty/null but source has text`);
      }

      if (Array.isArray(srcVal) && !Array.isArray(val)) {
        throw new Error(`Translation item "${t.id}" field "${key}" should be an array`);
      }

      if (Array.isArray(srcVal) && Array.isArray(val) && srcVal.length !== val.length) {
        throw new Error(`Translation item "${t.id}" field "${key}" array length mismatch`);
      }
    }
  }

  return true;
}

// ---- Main -------------------------------------------------------------------

const reportPath = path.resolve(ROOT, SOURCE_REPORT);
if (!existsSync(reportPath)) {
  console.error(`source report not found: ${reportPath}`);
  console.error("run scripts/check-i18n-coverage.mjs first");
  process.exit(1);
}

const report = JSON.parse(readFileSync(reportPath, "utf8"));
console.log(`loaded ${report.items.length} items from ${SOURCE_REPORT}`);

// ----- Filter items ----------------------------------------------------------
let candidates = report.items;

if (LEVEL_FILTER) {
  candidates = candidates.filter((item) => {
    if (item.level && item.level.toUpperCase() === LEVEL_FILTER.toUpperCase()) return true;
    if (item.fields.meaning || item.fields.explanation) return true;
    return false;
  });
  // Re-check level specifically — grammar notes also carry level
  candidates = report.items.filter(
    (item) => item.level && item.level.toUpperCase() === LEVEL_FILTER.toUpperCase()
  );
  console.log(`filtered to ${candidates.length} items for level ${LEVEL_FILTER}`);
}

// Check existing translations
const translationDir = path.join(ROOT, "src", "content-translations");
const translationPath = path.join(translationDir, `${LOCALE}.json`);
let existingIds = new Set();
let existingTranslations = { examItems: [], grammarNotes: [] };

if (existsSync(translationPath)) {
  existingTranslations = JSON.parse(readFileSync(translationPath, "utf8"));
  for (const item of (existingTranslations.examItems || [])) existingIds.add(item.id);
  for (const note of (existingTranslations.grammarNotes || [])) existingIds.add(note.surface);
  console.log(`existing ${LOCALE} translations: ${existingIds.size} items`);
}

// Pick items that don't have translations yet
let toTranslate = candidates.filter((item) => !existingIds.has(item.id));

// Sort by level for consistent ordering: N5 first, grammarNotes last
const LEVEL_ORDER = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 };
toTranslate.sort((a, b) => {
  const aOrder = LEVEL_ORDER[a.level] ?? 99;
  const bOrder = LEVEL_ORDER[b.level] ?? 99;
  return aOrder - bOrder;
});

const batch = toTranslate.slice(0, LIMIT);

if (batch.length === 0) {
  console.log(`no items to translate for ${LOCALE} (all ${candidates.length} candidates already translated)`);
  process.exit(0);
}

console.log(`translating ${batch.length} items (${toTranslate.length - batch.length} more remain after this batch)`);

if (DRY_RUN) {
  console.log("[dry-run] items that would be translated:");
  for (const item of batch) {
    const fieldKeys = Object.keys(item.fields).filter((k) => item.fields[k] !== null).join(", ");
    console.log(`  ${item.type}:${item.id} [${fieldKeys}]`);
  }
  process.exit(0);
}

// ----- Call Gemini -----------------------------------------------------------
// Batch size: Gemini 2.0 Flash has a large context window, so we send
// the whole batch in one request for efficiency.
console.log(`sending ${batch.length} items to Gemini...`);
const translations = await translateBatch(batch, LOCALE);
console.log(`received ${translations.length} translated items from Gemini`);

// ----- Validate response -----------------------------------------------------
const validationErrors = [];
try {
  validateTranslations(translations, batch);
  console.log("schema validation: PASSED");
} catch (err) {
  validationErrors.push(err.message);
  console.error(`schema validation: FAILED — ${err.message}`);
  console.log("writing partial output to .tmp/translate-error.json for debugging");
  writeFileSync(
    path.join(ROOT, ".tmp", "translate-error.json"),
    JSON.stringify({ error: err.message, batch, translations }, null, 2),
    "utf8"
  );
  process.exit(1);
}

// ----- Merge with existing translations --------------------------------------
const newExamItems = [];
const newGrammarNotes = [];

for (const t of translations) {
  const source = batch.find((s) => s.id === t.id);
  if (source.type === "grammarNote") {
    newGrammarNotes.push({ surface: t.id, ...stripUnusedFields(t, source) });
  } else {
    newExamItems.push({ id: t.id, ...stripUnusedFields(t, source) });
  }
}

// Merge: keep existing translations, append new ones (overwrite if same id appears)
function mergeById(existing, incoming) {
  const map = new Map();
  for (const item of existing) map.set(item.id || item.surface, item);
  for (const item of incoming) map.set(item.id || item.surface, item);
  return [...map.values()];
}

existingTranslations.examItems = mergeById(
  existingTranslations.examItems || [],
  newExamItems
);
existingTranslations.grammarNotes = mergeById(
  existingTranslations.grammarNotes || [],
  newGrammarNotes
);
existingTranslations.locale = LOCALE;
existingTranslations.generatedAt = new Date().toISOString();

// ----- Write output ----------------------------------------------------------
if (!existsSync(translationDir)) {
  mkdirSync(translationDir, { recursive: true });
}
writeFileSync(translationPath, JSON.stringify(existingTranslations, null, 2), "utf8");
console.log(`wrote ${translationPath} · ${existingTranslations.examItems.length} exam items + ${existingTranslations.grammarNotes.length} grammar notes`);

// ----- Summary ---------------------------------------------------------------
console.log("");
console.log("=== Translation Summary ===");
console.log(`locale: ${LOCALE}`);
console.log(`level: ${LEVEL_FILTER || "all"}`);
console.log(`batch: ${batch.length} items`);
console.log(`remaining: ${toTranslate.length - batch.length} items untranslated`);
console.log("===========================");

// ---- Helpers ----------------------------------------------------------------

/**
 * Strip fields that are null in the source or are not in the source schema.
 * This keeps the translation file clean — no null entries for missing hints.
 */
function stripUnusedFields(translation, source) {
  const result = {};
  for (const [key, val] of Object.entries(translation)) {
    if (key === "id") continue;
    if (source.fields[key] === null) continue; // skip null-source fields
    result[key] = val;
  }
  return result;
}
