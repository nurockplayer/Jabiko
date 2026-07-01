#!/usr/bin/env node
// =============================================================================
// ai-translate-content.mjs -- Gemini-assisted exam-content translation (#378)
// =============================================================================
//
// Reads exam items, finds ones missing a per-locale `explanationI18n` overlay
// for the target locale, asks Gemini for STRICT JSON translations, validates
// them hard, and writes ONLY the `explanationI18n` overlay back into the item
// file. It never touches protected fields (id / expectedAnswer / options /
// reading / level / the Chinese source) -- the write transform only adds or
// merges the `explanationI18n` field.
//
// The actual Gemini call runs in CI (GitHub Actions) with the GEMINI_API_KEY
// repository secret. There is no API key in the repo or the frontend.
//
// Usage
//   node scripts/ai-translate-content.mjs --locale en --level N5 --limit 10
//   node scripts/ai-translate-content.mjs --locale ko --limit 10 --source-report .tmp/i18n-coverage.json
//   (env GEMINI_API_KEY required for the live call; --dry-run skips the call)
//
// Args
//   --locale <code>       target locale (ja|en|th|id|ko|vi|my). required.
//   --level <N1..N5>      JLPT level file to translate. default N5.
//   --limit <n>           max items this run. default 10.
//   --source-report <p>   optional coverage report (accepted for workflow
//                         compatibility; the script also detects gaps itself).
//   --model <name>        Gemini model. default gemini-2.0-flash.
//   --dry-run             find + print targets, skip the Gemini call + write.
//   --summary <path>      write a short markdown run summary (for the PR body).
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ITEMS_DIR = path.join(REPO_ROOT, "src", "domain", "exam", "items");
const LOCALES = new Set(["ja", "en", "th", "id", "ko", "vi", "my"]); // zh-Hant is the source
const SOURCE_FIELD = "explanation";
const OVERLAY_FIELD = "explanationI18n";

// ---------------------------------------------------------------------------
// string escaping for TS string literals (mirrors import-exam-items.mjs)
// ---------------------------------------------------------------------------
export const esc = (s) =>
  String(s)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");

// ---------------------------------------------------------------------------
// parse item file into blocks (one examQuestion({...}) each)
// Format is the importer's: a line `  examQuestion({`, 4-space fields, then a
// closing line `  })` / `  }),`.
// ---------------------------------------------------------------------------
export function splitItemBlocks(text) {
  const lines = text.split("\n");
  const blocks = []; // { startLine, endLine, lines: [...] }
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

const sourceTextOf = (blockLines) => {
  for (const l of blockLines) {
    const m = l.match(/^ {4}explanation:\s*"((?:[^"\\]|\\.)*)"/);
    if (m) {
      return m[1]
        .replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }
  }
  return null;
};

const hasOverlayLocale = (blockLines, locale) =>
  blockLines.some((l) => l.includes(`${OVERLAY_FIELD}:`) && l.includes(`"${locale}"`));

// ---------------------------------------------------------------------------
// find items missing the overlay for `locale`
// ---------------------------------------------------------------------------
export function findTargets(text, locale, limit) {
  const out = [];
  for (const b of splitItemBlocks(text)) {
    const id = idOf(b.lines);
    const source = sourceTextOf(b.lines);
    if (!id || !source) continue;
    if (hasOverlayLocale(b.lines, locale)) continue;
    out.push({ id, source });
    if (out.length >= limit) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// validate Gemini's response against the request (HARD fail on any mismatch)
// ---------------------------------------------------------------------------
export function validateTranslations(parsed, requestedIds) {
  const want = new Set(requestedIds);
  if (!Array.isArray(parsed)) return { ok: false, error: "response is not a JSON array" };
  if (parsed.length !== requestedIds.length) {
    return { ok: false, error: `count mismatch: got ${parsed.length}, requested ${requestedIds.length}` };
  }
  const seen = new Set();
  for (const entry of parsed) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      return { ok: false, error: "entry is not an object" };
    }
    const keys = Object.keys(entry);
    if (keys.length !== 2 || !keys.includes("id") || !keys.includes("translation")) {
      return { ok: false, error: `entry must have exactly {id, translation}; got keys [${keys.join(", ")}]` };
    }
    if (typeof entry.id !== "string" || !want.has(entry.id)) {
      return { ok: false, error: `unexpected or non-string id: ${JSON.stringify(entry.id)}` };
    }
    if (seen.has(entry.id)) return { ok: false, error: `duplicate id: ${entry.id}` };
    seen.add(entry.id);
    if (typeof entry.translation !== "string" || entry.translation.trim() === "") {
      return { ok: false, error: `empty/non-string translation for ${entry.id}` };
    }
  }
  if (seen.size !== want.size) {
    const missing = [...want].filter((id) => !seen.has(id));
    return { ok: false, error: `missing translations for: ${missing.join(", ")}` };
  }
  return { ok: true, items: parsed.map((e) => ({ id: e.id, translation: e.translation })) };
}

// ---------------------------------------------------------------------------
// apply overlay -- the ONLY write. Adds/merges `explanationI18n[locale]` into
// each target item block; never alters any other field.
// ---------------------------------------------------------------------------
export function applyExplanationOverlay(text, translations, locale) {
  const byId = new Map(translations.map((t) => [t.id, t.translation]));
  // Pre-scan: which TARGET items already carry an explanationI18n field, so we
  // merge into that line instead of inserting a duplicate after `explanation`.
  const overlayRe = new RegExp(`^ {4}${OVERLAY_FIELD}:`);
  const hasOverlayField = new Set();
  for (const b of splitItemBlocks(text)) {
    const id = idOf(b.lines);
    if (id && byId.has(id) && b.lines.some((l) => overlayRe.test(l))) hasOverlayField.add(id);
  }

  const lines = text.split("\n");
  const out = [];
  let curId = null;
  let pending = null; // translation to apply for the current target block

  for (const line of lines) {
    if (line === "  examQuestion({")  { curId = null; pending = null; }
    const idM = line.match(/^ {4}id:\s*"((?:[^"\\]|\\.)*)"/);
    if (idM) {
      curId = idM[1];
      pending = byId.has(curId) ? byId.get(curId) : null;
    }

    // Merge path: existing explanationI18n line (single-line object).
    if (pending !== null && curId && hasOverlayField.has(curId) && new RegExp(`^ {4}${OVERLAY_FIELD}:\\s*\\{`).test(line)) {
      const merged = line.includes(`"${locale}"`)
        ? line
        : line.replace(/\{\s*/, `{ "${locale}": "${esc(pending)}", `);
      out.push(merged);
      pending = null;
      continue;
    }

    out.push(line);

    // Insert path: only for target items WITHOUT an existing overlay field.
    if (pending !== null && curId && !hasOverlayField.has(curId)) {
      const expM = line.match(/^( {4}explanation:\s*"(?:[^"\\]|\\.)*")(,?)\s*$/);
      if (expM) {
        // ensure the explanation line ends with a comma, then add the overlay
        // (a trailing comma on the overlay is valid TS even if it ends up last).
        if (expM[2] !== ",") out[out.length - 1] = expM[1] + ",";
        out.push(`    ${OVERLAY_FIELD}: { "${locale}": "${esc(pending)}" },`);
        pending = null;
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

export function buildPrompt(items, locale) {
  const name = LOCALE_NAME[locale] ?? locale;
  return [
    `You translate JLPT study explanations from Traditional Chinese into ${name}.`,
    `These explain why a Japanese grammar/vocab answer is correct and why the distractors are wrong.`,
    `Rules:`,
    `- Keep all Japanese terms, kana, kanji and example fragments EXACTLY as written (do not translate the Japanese itself).`,
    `- Translate only the Chinese explanatory prose into natural ${name}.`,
    `- Keep each translation faithful and concise; do not add or drop information.`,
    `- Return STRICT JSON only: an array of objects {"id": string, "translation": string}.`,
    `- One object per input id, same ids, no extra keys, no markdown, no commentary.`,
    ``,
    `Input (${items.length} items):`,
    JSON.stringify(items.map((it) => ({ id: it.id, zh: it.source })), null, 2)
  ].join("\n");
}

export function parseGeminiJson(raw) {
  let s = String(raw).trim();
  // defensive: strip ```json ... ``` fences if a model adds them
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  return JSON.parse(s);
}

async function callGemini({ apiKey, model, prompt }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
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

  console.log(`[ai-translate] level=${o.level} locale=${o.locale} limit=${o.limit} -> ${targets.length} target(s)`);
  if (o.sourceReport) console.log(`[ai-translate] (source-report ${o.sourceReport} noted; gaps detected directly)`);
  if (targets.length === 0) {
    console.log("[ai-translate] nothing to translate; exiting 0");
    if (o.summary) fs.writeFileSync(o.summary, `No untranslated ${o.level} \`explanation\` items for \`${o.locale}\`.\n`);
    return;
  }

  if (o.dryRun) {
    for (const t of targets) console.log(`  - ${t.id}`);
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
  const v = validateTranslations(parsed, targets.map((t) => t.id));
  if (!v.ok) {
    console.error(`translation validation failed: ${v.error}`);
    process.exit(1);
  }

  const before = splitItemBlocks(text).length;
  const next = applyExplanationOverlay(text, v.items, o.locale);
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
  console.log(`[ai-translate] wrote ${v.items.length} ${o.locale} overlay(s) -> ${path.relative(REPO_ROOT, file)}`);

  if (o.summary) {
    const lines = [
      `AI-assisted i18n translation (Gemini ${o.model})`,
      ``,
      `- locale: \`${o.locale}\` · level: \`${o.level}\` · items: ${v.items.length}`,
      `- field: \`explanation\` -> \`explanationI18n.${o.locale}\` (overlay only; source untouched)`,
      ``,
      `Please review translation quality before merge.`,
      ``,
      ...v.items.map((t) => `- \`${t.id}\``)
    ];
    fs.writeFileSync(o.summary, lines.join("\n") + "\n");
  }
}

// run only when invoked directly (so tests can import the pure helpers)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e?.stack || String(e));
    process.exit(1);
  });
}
