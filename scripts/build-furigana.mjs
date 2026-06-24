#!/usr/bin/env node
// =============================================================================
// build-furigana.mjs -- pre-bake furigana for sentences (#134, P1)
// =============================================================================
//
// Offline pass: kuromoji (IPADIC, a devDependency — NOT in the app bundle)
// segments each Japanese sentence, src/domain/furigana.ts turns the tokens
// into <ruby> segments, and we write them to src/domain/furiganaData.ts so
// the frontend renders furigana with ZERO runtime tokenisation.
//
//   pnpm build:furigana
//
// Data is loaded through a throw-away Vite SSR server (ssrLoadModule) rather
// than parsed as text: the source uses extensionless TS imports that plain
// Node can't resolve, and this gives us the real objects + the SAME aligner
// the app's unit tests cover.
//
// P1 scope: the basic foundation deck (N5/N4 — vocabulary items with no
// explicit JLPT level). Reading-test items (漢字読み) never reach here — these
// are vocabulary EXAMPLE sentences, not exam reading prompts. Higher levels
// and exam prompt stems are later phases (P3/P4).
// =============================================================================

import { createServer } from "vite";
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import kuromoji from "kuromoji";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIC = path.join(path.dirname(require.resolve("kuromoji/package.json")), "dict");
const OUT = path.join(ROOT, "src", "domain", "furiganaData.ts");

const server = await createServer({
  configFile: false,
  logLevel: "warn",
  server: { middlewareMode: true },
  appType: "custom",
  optimizeDeps: { noDiscovery: true }
});

try {
  const { vocabulary } = await server.ssrLoadModule("/src/domain/vocabulary.ts");
  const { jlptVocabulary } = await server.ssrLoadModule("/src/domain/vocabulary-jlpt.ts");
  const { examStyleQuestions } = await server.ssrLoadModule("/src/domain/examBlocks.ts");
  const { tokensToSegments, applyReadingOverrides } =
    await server.ssrLoadModule("/src/domain/furigana.ts");

  // Manual fixes for words IPADIC misreads. ONLY unambiguous ones (see
  // applyReadingOverrides) -- ambiguous on'yomi/kun'yomi splits are left to
  // kuromoji and corrected by spot-check additions here over time. Keyed by
  // surface -> correct hiragana.
  const READING_OVERRIDES = {
    一人: "ひとり",
    二人: "ふたり",
    日本人: "にほんじん",
    // Spot-check fixes (#134 P4): kuromoji/IPADIC misreads found by the
    // parallel furigana audit. Compound/word keys only (context-stable in
    // this content) -- never single ambiguous kanji like 後 (ご/あと/のち).
    一言: "ひとこと", // was いちげん
    九時: "くじ", // 九 was きゅう (clock counter)
    七時: "しちじ", // 七 was なな (clock counter)
    数日: "すうじつ", // 日 was にち
    夜中: "よなか", // was やちゅう
    港町: "みなとまち", // was みなとちょう
    大勢: "おおぜい", // was たいせい (crowd, not "general trend")
    堪え: "たえ", // was こた (堪える = endure)
    堪える: "たえる",
    預け: "あずけ", // was あづ (modern kana ず)
    預ける: "あずける"
  };

  // Sources (#134 P4): the basic deck (all levels) + the JLPT vocab deck +
  // exam items. For exam items we bake the POST-answer example sentence
  // (shown in FeedbackPanel after answering -- always safe) and the prompt
  // stem (shown pre-answer in ExamPrompt), EXCEPT 漢字読み stems: their answer
  // IS a reading, so we never bake the reading the question tests (defence in
  // depth on top of the render-time isReadingPrompt guard). 語順組合 stems are
  // shuffled at render so the stored string wouldn't match -- harmless, they
  // just fall back to plain.
  const sentences = new Set();
  for (const v of vocabulary) for (const ex of v.examples ?? []) sentences.add(ex.japanese);
  for (const v of jlptVocabulary) for (const ex of v.examples ?? []) sentences.add(ex.japanese);
  let examStems = 0;
  for (const q of examStyleQuestions) {
    for (const ex of q.vocabulary.examples ?? []) sentences.add(ex.japanese);
    if (q.promptText && q.promptLabel !== "漢字読み") {
      sentences.add(q.promptText);
      examStems += 1;
    }
  }
  console.log(
    `sources -> basic:${vocabulary.length} jlpt:${jlptVocabulary.length} exam:${examStyleQuestions.length} (stems:${examStems}) · unique sentences:${sentences.size}`
  );

  const tokenizer = await new Promise((resolve, reject) =>
    kuromoji.builder({ dicPath: DIC }).build((err, t) => (err ? reject(err) : resolve(t)))
  );

  const data = {};
  for (const sentence of sentences) {
    const tokens = applyReadingOverrides(tokenizer.tokenize(sentence), READING_OVERRIDES);
    const segments = tokensToSegments(tokens);
    // Only store sentences that actually carry furigana; kana-only sentences
    // render fine as plain text and would just bloat the table.
    if (segments.some((seg) => seg.r !== undefined)) data[sentence] = segments;
  }

  const entries = Object.keys(data)
    .sort()
    .map((key) => `  ${JSON.stringify(key)}: ${JSON.stringify(data[key])}`)
    .join(",\n");

  const banner =
    "// AUTO-GENERATED by scripts/build-furigana.mjs — do not edit by hand.\n" +
    "// Source: basic + JLPT vocab example sentences and exam items (#134 P4).\n" +
    "// Regenerate: pnpm build:furigana\n";
  const file =
    `${banner}import type { FuriganaSegment } from "./furigana";\n\n` +
    `export const furiganaData: Record<string, FuriganaSegment[]> = {\n${entries}\n};\n`;

  writeFileSync(OUT, file, "utf8");
  console.log(`sentences: ${sentences.size} · with furigana: ${Object.keys(data).length}`);
  console.log(`wrote ${path.relative(ROOT, OUT)}`);
} finally {
  await server.close();
}
