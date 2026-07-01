#!/usr/bin/env node
// =============================================================================
// ai-translate-content.mjs -- Gemini-assisted exam-content translation (#378/#400)
// =============================================================================
//
// Reads exam items and, for the target locale, finds the Chinese content fields
// that are still missing a per-locale overlay, asks Gemini for STRICT JSON
// translations (using the question's Japanese prompt / answer / options as
// context so the result reads NATURALLY, not word-for-word), validates them
// hard, and writes ONLY the `<field>I18n` overlays back into the item file.
//
// Translatable fields (source -> overlay):
//   meaningZh       -> meaningI18n
//   instructionZh   -> instructionI18n
//   promptContextZh -> promptContextI18n
//   hintZh          -> hintI18n
//   explanation     -> explanationI18n
//
// It NEVER touches protected fields (id / expectedAnswer / options / surface /
// reading / level / the Chinese source) -- the write transform only adds or
// merges the `<field>I18n` overlays.
//
// The actual Gemini call runs in CI (GitHub Actions) with the GEMINI_API_KEY
// repository secret. There is no API key in the repo or the frontend.
//
// Usage
//   node scripts/ai-translate-content.mjs --locale en --level N5 --limit 10
//   node scripts/ai-translate-content.mjs --locale ja --limit 10 --dry-run
//   (env GEMINI_API_KEY required for the live call; --dry-run skips the call)
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ITEMS_DIR = path.join(REPO_ROOT, "src", "domain", "exam", "items");
const LOCALES = new Set(["ja", "en", "th", "id", "ko", "vi", "my"]); // zh-Hant is the source

// Every translatable Chinese content field and its per-locale overlay sibling.
// exampleMeaningZh only exists on items with a CUSTOM example sentence; items
// without it reuse promptContextZh (whose overlay the factory threads onto the
// example line), so no per-item gap arises from its absence.
export const FIELDS = [
  { source: "meaningZh", overlay: "meaningI18n" },
  { source: "instructionZh", overlay: "instructionI18n" },
  { source: "promptContextZh", overlay: "promptContextI18n" },
  { source: "hintZh", overlay: "hintI18n" },
  { source: "exampleMeaningZh", overlay: "exampleMeaningI18n" },
  { source: "explanation", overlay: "explanationI18n" }
];

// ---------------------------------------------------------------------------
// string escaping / unescaping for TS string literals
// ---------------------------------------------------------------------------
export const esc = (s) =>
  String(s)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");

const unescapeTs = (s) =>
  s.replace(/\\([\\"ntr])/g, (_, c) => ({ "\\": "\\", '"': '"', n: "\n", t: "\t", r: "\r" })[c]);

// ---------------------------------------------------------------------------
// parse item file into blocks (one examQuestion({...}) each)
// ---------------------------------------------------------------------------
export function splitItemBlocks(text) {
  const lines = text.split("\n");
  const blocks = [];
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === "  examQuestion({") {
      cur = { start: i, lines: [line] };
    } else if (cur) {
      cur.lines.push(line);
      if (/^ {2}\}\),?$/.test(line)) {
        cur.end = i;
        blocks.push(cur);
        cur = null;
      }
    }
  }
  return blocks;
}

const idOf = (blockLines) => {
  for (const l of blockLines) {
    const m = l.match(/^ {4}id:\s*"((?:[^"\\]|\\.)*)"/);
    if (m) return m[1];
  }
  return null;
};

// Extract a 4-space-indented `name: "..."` string field, unescaped. The exact
// `name:` anchor means `meaningZh` never matches `exampleMeaningZh`, etc.
const stringFieldOf = (blockLines, name) => {
  const re = new RegExp(`^ {4}${name}:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
  for (const l of blockLines) {
    const m = l.match(re);
    if (m) return unescapeTs(m[1]);
  }
  return null;
};

// Raw single-line value (e.g. the options array literal) for prompt context.
const rawFieldOf = (blockLines, name) => {
  const re = new RegExp(`^ {4}${name}:\\s*(.+?),?\\s*$`);
  for (const l of blockLines) {
    const m = l.match(re);
    if (m) return m[1];
  }
  return null;
};

// Whether an item's `<overlayField>` object already has a value for `locale`.
// Multi-line-aware (a hand-reflowed overlay may span several lines) and matches
// the locale as an object KEY (`"en":`) so a value that merely CONTAINS the
// text "en" never false-skips a real gap -- and, critically, a multi-line
// overlay never fools the gap check into re-translating an existing locale
// (which would write a duplicate object key and break the build).
const overlayHasLocale = (blockLines, overlayField, locale) => {
  const startRe = new RegExp(`^ {4}${overlayField}:`);
  const keyRe = new RegExp(`"${locale}"\\s*:`);
  const start = blockLines.findIndex((l) => startRe.test(l));
  if (start < 0) return false;
  if (keyRe.test(blockLines[start])) return true; // single-line object
  for (let i = start + 1; i < blockLines.length; i++) {
    if (keyRe.test(blockLines[i])) return true;
    if (/^ {4}\S/.test(blockLines[i])) break; // back to field indent -> object closed
  }
  return false;
};

const hasOverlayField = (blockLines, overlayField) =>
  blockLines.some((l) => new RegExp(`^ {4}${overlayField}:`).test(l));

// ---------------------------------------------------------------------------
// find items with >=1 field missing the overlay for `locale`
// returns [{ id, context: {promptText, expectedAnswer, options}, fields: {source: zh} }]
// ---------------------------------------------------------------------------
export function findTargets(text, locale, limit) {
  const out = [];
  for (const b of splitItemBlocks(text)) {
    const id = idOf(b.lines);
    if (!id) continue;
    const fields = {};
    for (const { source, overlay } of FIELDS) {
      const val = stringFieldOf(b.lines, source);
      if (val == null || val.trim() === "") continue; // nothing to translate
      if (overlayHasLocale(b.lines, overlay, locale)) continue; // already done
      fields[source] = val;
    }
    if (Object.keys(fields).length === 0) continue;
    out.push({
      id,
      context: {
        promptText: stringFieldOf(b.lines, "promptText"),
        expectedAnswer: stringFieldOf(b.lines, "expectedAnswer"),
        options: rawFieldOf(b.lines, "options")
      },
      fields
    });
    if (out.length >= limit) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// validate Gemini's response against the request (HARD fail on any mismatch)
// requested = [{ id, fieldKeys: [...] }]
// ---------------------------------------------------------------------------
export function validateTranslations(parsed, requested) {
  const wantById = new Map(requested.map((r) => [r.id, new Set(r.fieldKeys)]));
  if (!Array.isArray(parsed)) return { ok: false, error: "response is not a JSON array" };
  if (parsed.length !== requested.length) {
    return { ok: false, error: `count mismatch: got ${parsed.length}, requested ${requested.length}` };
  }
  const seen = new Set();
  const items = [];
  for (const entry of parsed) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      return { ok: false, error: "entry is not an object" };
    }
    const keys = Object.keys(entry);
    if (keys.length !== 2 || !keys.includes("id") || !keys.includes("fields")) {
      return { ok: false, error: `entry must have exactly {id, fields}; got [${keys.join(", ")}]` };
    }
    if (typeof entry.id !== "string" || !wantById.has(entry.id)) {
      return { ok: false, error: `unexpected or non-string id: ${JSON.stringify(entry.id)}` };
    }
    if (seen.has(entry.id)) return { ok: false, error: `duplicate id: ${entry.id}` };
    seen.add(entry.id);
    const want = wantById.get(entry.id);
    const f = entry.fields;
    if (f === null || typeof f !== "object" || Array.isArray(f)) {
      return { ok: false, error: `fields must be an object for ${entry.id}` };
    }
    const fkeys = Object.keys(f);
    if (fkeys.length !== want.size || !fkeys.every((k) => want.has(k))) {
      return { ok: false, error: `field mismatch for ${entry.id}: got [${fkeys.join(", ")}], want [${[...want].join(", ")}]` };
    }
    for (const k of fkeys) {
      if (typeof f[k] !== "string" || f[k].trim() === "") {
        return { ok: false, error: `empty/non-string ${k} for ${entry.id}` };
      }
    }
    items.push({ id: entry.id, fields: { ...f } });
  }
  if (seen.size !== wantById.size) {
    const missing = [...wantById.keys()].filter((id) => !seen.has(id));
    return { ok: false, error: `missing translations for: ${missing.join(", ")}` };
  }
  return { ok: true, items };
}

// ---------------------------------------------------------------------------
// apply overlays -- the ONLY write. For each target item, insert or merge each
// translated field's `<overlay>[locale]` sibling. Never alters other fields.
// items = [{ id, fields: {source: translation} }]
// ---------------------------------------------------------------------------
export function applyOverlays(text, items, locale) {
  const transById = new Map(items.map((it) => [it.id, it.fields]));

  // Pre-scan per (id, overlayField): does the field exist (merge vs insert),
  // and does it already have this locale (never re-add -> guards against a
  // duplicate object key when an overlay was hand-reflowed onto several lines).
  const existing = new Set();
  const alreadyLocale = new Set();
  for (const b of splitItemBlocks(text)) {
    const id = idOf(b.lines);
    if (!id || !transById.has(id)) continue;
    for (const { overlay } of FIELDS) {
      const key = `${id} ${overlay}`;
      if (hasOverlayField(b.lines, overlay)) existing.add(key);
      if (overlayHasLocale(b.lines, overlay, locale)) alreadyLocale.add(key);
    }
  }

  const lines = text.split("\n");
  const out = [];
  let curId = null;

  for (const line of lines) {
    if (line === "  examQuestion({") curId = null;
    const idM = line.match(/^ {4}id:\s*"((?:[^"\\]|\\.)*)"/);
    if (idM) curId = idM[1];
    const trans = curId ? transById.get(curId) : null;

    // Merge path: an existing overlay line for a field we translated.
    if (trans) {
      let merged = null;
      for (const { source, overlay } of FIELDS) {
        if (!(source in trans)) continue;
        const key = `${curId} ${overlay}`;
        if (!existing.has(key) || alreadyLocale.has(key)) continue;
        if (new RegExp(`^ {4}${overlay}:\\s*\\{`).test(line)) {
          merged = line.includes(`"${locale}"`)
            ? line
            : line.replace(/\{\s*/, `{ "${locale}": "${esc(trans[source])}", `);
          break;
        }
      }
      if (merged !== null) {
        out.push(merged);
        continue;
      }
    }

    out.push(line);

    // Insert path: after a source-field line whose overlay does not yet exist.
    if (trans) {
      for (const { source, overlay } of FIELDS) {
        if (!(source in trans)) continue;
        const key = `${curId} ${overlay}`;
        if (existing.has(key) || alreadyLocale.has(key)) continue;
        const m = line.match(new RegExp(`^( {4}${source}:\\s*"(?:[^"\\\\]|\\\\.)*")(,?)\\s*$`));
        if (m) {
          if (m[2] !== ",") out[out.length - 1] = m[1] + ",";
          out.push(`    ${overlay}: { "${locale}": "${esc(trans[source])}" },`);
          break; // one source field per line
        }
      }
    }
  }
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// prompt + Gemini call
// ---------------------------------------------------------------------------
const LOCALE_NAME = {
  ja: "Japanese", en: "English", th: "Thai", id: "Indonesian",
  ko: "Korean", vi: "Vietnamese", my: "Burmese"
};

const FIELD_NOTE = {
  meaningZh: "the word/phrase meaning",
  instructionZh: "the task instruction (e.g. 'choose the most natural word')",
  promptContextZh: "situational context for the sentence",
  hintZh: "a neutral pre-answer hint",
  explanation: "why the correct answer is right and the distractors are wrong"
};

export function buildPrompt(items, locale) {
  const name = LOCALE_NAME[locale] ?? locale;
  return [
    `You are a professional JLPT-study localizer. Translate the given Traditional Chinese exam-content fields into natural, native ${name}.`,
    `Each item is a Japanese-language exam question. Use the provided CONTEXT (the Japanese prompt, the correct answer, and the options) so the translation is accurate and reads the way a ${name} teacher would write it -- NOT a word-for-word calque.`,
    `Field meanings: ${Object.entries(FIELD_NOTE).map(([k, v]) => `${k} = ${v}`).join("; ")}.`,
    `Rules:`,
    `- Keep ALL Japanese (kana, kanji, example fragments) and JLPT level tags EXACTLY as written; translate ONLY the Chinese prose.`,
    `- Natural, idiomatic, concise ${name}; faithful (never add or drop meaning).`,
    `- For each item, translate ONLY the fields under "translate" and return the SAME field keys.`,
    `- Return STRICT JSON only: an array of {"id": string, "fields": { <fieldKey>: <${name} translation>, ... }}.`,
    `- Same ids as the input, no extra keys, no markdown, no commentary.`,
    ``,
    `Input (${items.length} items):`,
    JSON.stringify(
      items.map((it) => ({ id: it.id, context: it.context, translate: it.fields })),
      null,
      2
    )
  ].join("\n");
}

export function parseGeminiJson(raw) {
  let s = String(raw).trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  return JSON.parse(s);
}

async function callGemini({ apiKey, model, prompt }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, responseMimeType: "application/json" }
    })
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
  if (!text) throw new Error("Gemini returned no text");
  return text;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const o = { level: "N5", limit: 10, model: "gemini-2.0-flash", dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--locale") o.locale = argv[++i];
    else if (a === "--level") o.level = argv[++i];
    else if (a === "--limit") o.limit = parseInt(argv[++i], 10);
    else if (a === "--model") o.model = argv[++i];
    else if (a === "--source-report") o.sourceReport = argv[++i];
    else if (a === "--summary") o.summary = argv[++i];
    else if (a === "--dry-run") o.dryRun = true;
    else throw new Error(`unknown arg: ${a}`);
  }
  return o;
}

function fieldCounts(targets) {
  const counts = {};
  for (const t of targets) for (const k of Object.keys(t.fields)) counts[k] = (counts[k] ?? 0) + 1;
  return counts;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (!o.locale || !LOCALES.has(o.locale)) {
    console.error(`--locale must be one of ${[...LOCALES].join(", ")}`);
    process.exit(2);
  }
  if (!Number.isFinite(o.limit) || o.limit < 1) {
    console.error("--limit must be a positive integer");
    process.exit(2);
  }
  const file = path.join(ITEMS_DIR, `${o.level.toLowerCase()}.ts`);
  if (!fs.existsSync(file)) {
    console.error(`level file not found: ${file}`);
    process.exit(2);
  }
  const text = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const targets = findTargets(text, o.locale, o.limit);

  const fc = fieldCounts(targets);
  console.log(`[ai-translate] level=${o.level} locale=${o.locale} limit=${o.limit} -> ${targets.length} item(s), fields ${JSON.stringify(fc)}`);
  if (o.sourceReport) console.log(`[ai-translate] (source-report ${o.sourceReport} noted; gaps detected directly)`);
  if (targets.length === 0) {
    console.log("[ai-translate] nothing to translate; exiting 0");
    if (o.summary) fs.writeFileSync(o.summary, `No untranslated ${o.level} content fields for \`${o.locale}\`.\n`);
    return;
  }

  if (o.dryRun) {
    for (const t of targets) console.log(`  - ${t.id} [${Object.keys(t.fields).join(", ")}]`);
    console.log("[ai-translate] --dry-run: skipped Gemini call + write");
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY env is required for the live call (set it as a GitHub Actions secret)");
    process.exit(2);
  }

  const prompt = buildPrompt(targets, o.locale);
  const raw = await callGemini({ apiKey, model: o.model, prompt });
  let parsed;
  try {
    parsed = parseGeminiJson(raw);
  } catch (e) {
    console.error(`Gemini did not return valid JSON: ${e.message}`);
    process.exit(1);
  }
  const requested = targets.map((t) => ({ id: t.id, fieldKeys: Object.keys(t.fields) }));
  const v = validateTranslations(parsed, requested);
  if (!v.ok) {
    console.error(`translation validation failed: ${v.error}`);
    process.exit(1);
  }

  const before = splitItemBlocks(text).length;
  const next = applyOverlays(text, v.items, o.locale);
  const after = splitItemBlocks(next).length;
  if (after !== before) {
    console.error(`internal error: item count changed ${before} -> ${after}; aborting write`);
    process.exit(1);
  }
  if (next.includes("\r")) {
    console.error("internal error: output would contain CRLF");
    process.exit(1);
  }
  fs.writeFileSync(file, next);
  const totalFields = v.items.reduce((n, it) => n + Object.keys(it.fields).length, 0);
  console.log(`[ai-translate] wrote ${totalFields} ${o.locale} overlay field(s) across ${v.items.length} item(s) -> ${path.relative(REPO_ROOT, file)}`);

  if (o.summary) {
    const lines = [
      `AI-assisted i18n translation (Gemini ${o.model})`,
      ``,
      `- locale: \`${o.locale}\` · level: \`${o.level}\` · items: ${v.items.length} · fields: ${totalFields}`,
      `- fields covered: ${Object.keys(fc).map((k) => `\`${k}\``).join(", ")} (overlay only; Chinese source untouched)`,
      ``,
      `Please review translation quality before merge.`,
      ``,
      ...v.items.map((t) => `- \`${t.id}\` [${Object.keys(t.fields).join(", ")}]`)
    ];
    fs.writeFileSync(o.summary, lines.join("\n") + "\n");
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e?.stack || String(e));
    process.exit(1);
  });
}
