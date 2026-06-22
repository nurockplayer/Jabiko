#!/usr/bin/env node
// =============================================================================
// check-readings.mjs -- objective reading validation for 漢字読み items (#141)
// =============================================================================
//
// Gate F of the question-quality chain (A=contentGuard lints #139, B=LLM-judge
// #140, F=this). A confirms format, B catches semantic double-answers; F adds an
// OBJECTIVE cross-check that a 漢字読み item's expectedAnswer really is a reading
// of the tested word, using kuromoji.js morphological analysis (IPADIC).
//
// Dev-only: kuromoji is a devDependency, NOT in the app bundle. This is a human
// reference report -- it ALWAYS exits 0 and never gates CI (a mismatch usually
// means "a human should look", not "broken": kuromoji returns the single most
// likely reading, so a legitimate alternate reading shows up as a mismatch too).
//
//   node scripts/check-readings.mjs        (or: corepack pnpm check:readings)
//
// Source of items: the per-level src/domain/exam/items/n{1..5}.ts files are
// parsed as text (same pure-Node, no-transpile approach as import-exam-items
// .mjs). We validate the 「」-underlined word IN promptText (the actually
// tested form), NOT the `surface` headword -- those differ when the question
// tests a conjugated form (surface 滞る, tested 「滞って」, answer とどこおって).
//
// NOT validated here (kuromoji tokenises WORDS, not isolated-kanji on'yomi):
//   * the kanjiOnyomi.ts study table -- needs a kanji->readings dict (KANJIDIC
//     class), a possible future extension.
//   * whether a DISTRACTOR is also a legitimate reading (needs all readings of a
//     word; kuromoji gives only the top one). Left for a JMdict-backed follow-up.
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import kuromoji from "kuromoji";

const require = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ITEMS_DIR = path.join(REPO_ROOT, "src", "domain", "exam", "items");
const KANJI_READING_LABEL = "漢字読み";

// kuromoji ships its IPADIC dictionary inside the package; point the builder at
// that dir (resolved from the installed package, so it works on any checkout).
const DIC_PATH = path.join(path.dirname(require.resolve("kuromoji/package.json")), "dict");

// Katakana (U+30A1..U+30F6) -> hiragana, so kuromoji readings (katakana) can be
// compared against the hiragana expectedAnswer. The long-vowel ー is left as-is.
const kataToHira = (value) =>
  value.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));

// --- extract 漢字読み items (surface + expectedAnswer) from the .ts sources ---
function collectKanjiReadingItems() {
  const items = [];
  for (const name of fs.readdirSync(ITEMS_DIR)) {
    if (!name.endsWith(".ts")) continue;
    const text = fs.readFileSync(path.join(ITEMS_DIR, name), "utf8");
    // Each entry is examQuestion({ ... }); split on the opener and inspect each
    // body up to the next opener. Field values are simple quoted strings.
    const chunks = text.split("examQuestion({").slice(1);
    for (const chunk of chunks) {
      const body = chunk.split("examQuestion({")[0];
      if (!new RegExp(`promptLabel:\\s*"${KANJI_READING_LABEL}"`).test(body)) continue;
      const id = body.match(/id:\s*"((?:[^"\\]|\\.)*)"/)?.[1];
      const surface = body.match(/surface:\s*"((?:[^"\\]|\\.)*)"/)?.[1];
      const expectedAnswer = body.match(/expectedAnswer:\s*"((?:[^"\\]|\\.)*)"/)?.[1];
      const promptText = body.match(/promptText:\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? "";
      // The tested word is what's between 「」 in the prompt (the conjugated
      // form when applicable); fall back to surface if somehow unmarked.
      const word = promptText.match(/「([^」]+)」/)?.[1] ?? surface;
      if (id && surface && expectedAnswer) {
        items.push({ id, surface, word, expectedAnswer, file: name });
      }
    }
  }
  return items;
}

function buildTokenizer() {
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: DIC_PATH }).build((err, tokenizer) => {
      if (err) reject(err);
      else resolve(tokenizer);
    });
  });
}

// kuromoji reading of a whole surface (concatenate token readings, katakana).
// Returns null when any token has no dictionary reading (unknown word) -- we
// can't objectively validate those, so they're reported separately.
function readingOf(tokenizer, surface) {
  const tokens = tokenizer.tokenize(surface);
  let reading = "";
  for (const token of tokens) {
    const r = token.reading;
    if (!r || r === "*") return null;
    reading += r;
  }
  return kataToHira(reading);
}

async function main() {
  const items = collectKanjiReadingItems();
  console.log(`Validating ${items.length} 漢字読み item(s) against kuromoji (IPADIC)...\n`);

  const tokenizer = await buildTokenizer();
  const mismatches = [];
  const unknown = [];
  let matched = 0;

  for (const item of items) {
    const got = readingOf(tokenizer, item.word);
    if (got === null) {
      unknown.push(item);
    } else if (got === item.expectedAnswer) {
      matched += 1;
    } else {
      mismatches.push({ ...item, got });
    }
  }

  if (mismatches.length > 0) {
    console.log(`⚠ ${mismatches.length} reading mismatch(es) -- review by hand`);
    console.log(`  (kuromoji gives the single most-likely reading; an alternate`);
    console.log(`   legitimate reading also lands here, so verify before changing)\n`);
    for (const m of mismatches) {
      console.log(`  ${m.id} (${m.file})  ${m.word}: item="${m.expectedAnswer}" vs kuromoji="${m.got}"`);
    }
    console.log("");
  }

  if (unknown.length > 0) {
    console.log(`? ${unknown.length} word(s) kuromoji could not read (unknown to IPADIC) -- check manually`);
    for (const u of unknown) {
      console.log(`  ${u.id} (${u.file})  ${u.word}: item="${u.expectedAnswer}"`);
    }
    console.log("");
  }

  console.log(`Summary: ✓ ${matched} matched · ⚠ ${mismatches.length} to review · ? ${unknown.length} unknown · ${items.length} total`);
  // Human-reference tool: never fail. Mismatches are flags for review, not errors.
}

main().catch((err) => {
  console.error("check-readings failed:", err);
  process.exit(1);
});
