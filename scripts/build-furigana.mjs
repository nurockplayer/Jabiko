#!/usr/bin/env node
// =============================================================================
// build-furigana.mjs -- pre-bake furigana for sentences (#134, P1 → #599)
// =============================================================================
//
// Offline pass: kuromoji (IPADIC, a devDependency — NOT in the app bundle)
// segments each Japanese sentence, src/domain/furigana.ts turns the tokens
// into <ruby> segments, and we write them to three generated tables:
//
//   src/domain/furiganaData.ts             base map (stems, options, examples)
//   src/domain/furiganaExplanationData.ts  explanation map (feedback only)
//   src/domain/furiganaLearningData.ts     learning-view map (lazy)
//
// so the base map stays lean and both view-specific maps load on demand.
//
//   pnpm build:furigana
//
// Data is loaded through a throw-away Vite SSR server (ssrLoadModule) rather
// than parsed as text: the source uses extensionless TS imports that plain
// Node can't resolve, and this gives us the real objects + the SAME aligner
// the app's unit tests cover.
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
const OUT_BASE = path.join(ROOT, "src", "domain", "furiganaData.ts");
const OUT_EXPLANATION = path.join(ROOT, "src", "domain", "furiganaExplanationData.ts");
const OUT_LEARNING = path.join(ROOT, "src", "domain", "furiganaLearningData.ts");

const server = await createServer({
  configFile: false,
  logLevel: "warn",
  server: { middlewareMode: true },
  appType: "custom",
  optimizeDeps: { noDiscovery: true }
});

try {
  const { buildAllKnownQuestions } = await server.ssrLoadModule("/src/domain/sessionPools.ts");
  const {
    tokensToSegments,
    applyReadingOverrides,
    allowsOptionFurigana,
    collectJapaneseRubySources,
    collectQuotedRubySources
  } = await server.ssrLoadModule("/src/domain/furigana.ts");
  const { learningBlocks } = await server.ssrLoadModule("/src/domain/learningBlocks.ts");
  const { learningBlockI18n } = await server.ssrLoadModule(
    "/src/domain/learningBlocks.i18n.ts"
  );
  const questions = buildAllKnownQuestions();

  // Manual fixes for words IPADIC misreads. ONLY unambiguous ones (see
  // applyReadingOverrides) -- ambiguous on'yomi/kun'yomi splits are left to
  // kuromoji and corrected by spot-check additions here over time. Keyed by
  // surface -> correct hiragana.
  const READING_OVERRIDES = {
    一人: "ひとり",
    二人: "ふたり",
    日本人: "にほんじん",
    一言: "ひとこと",
    九時: "くじ",
    七時: "しちじ",
    数日: "すうじつ",
    夜中: "よなか",
    港町: "みなとまち",
    大勢: "おおぜい",
    堪え: "たえ",
    堪える: "たえる",
    預け: "あずけ",
    預ける: "あずける",
    後にして: "あとにして",
    後にした: "あとにした",
    後にする: "あとにする",
    家に: "いえに",
    数の: "かずの",
    瞬く間に: "またたくまに",
    後には: "あとには",
    後の文: "あとのぶん",
    来させる: "こさせる",
    て形: "てけい",
    た形: "たけい",
    ない形: "ないけい",
    ます形: "ますけい",
    辞書形: "じしょけい",
    い形: "いけい",
    な形: "なけい",
    普通形: "ふつうけい",
    未来形: "みらいけい",
    条件形: "じょうけんけい",
    可能形: "かのうけい",
    意向形: "いこうけい",
    命令形: "めいれいけい",
    ばかり章: "ばかりしょう",
    宝物: "たからもの",
    正義: "せいぎ",
    微笑み: "ほほえみ",
    彷徨う: "さまよう",
    瞬く: "またたく",
    脂っこい: "あぶらっこい",
    お経: "おきょう",
    一歩一歩: "いっぽいっぽ",
    肉厚: "にくあつ",
    丼物: "どんぶりもの",
    普通盛り: "ふつうもり",
    小盛り: "こもり"
  };

  // Collect base (pre-answer / always visible) and explanation (post-answer
  // feedback) sentence sources separately. The pipeline must tag each source
  // at collection time — no post-hoc guessing by filename or string length.
  const baseSentences = new Set();
  const explanationSentences = new Set();
  const learningSentences = new Set();
  let promptStems = 0;
  let optionRuns = 0;
  let explanationRuns = 0;

  for (const q of questions) {
    // -- base sources --
    baseSentences.add(q.vocabulary.surface);
    for (const ex of q.vocabulary.examples ?? []) baseSentences.add(ex.japanese);
    if (q.promptText && q.promptLabel !== "漢字読み") {
      baseSentences.add(q.promptText);
      promptStems += 1;
    }
    if (q.targetForm !== "meaning") {
      for (const answer of q.expectedAnswers) baseSentences.add(answer);
    }
    if (allowsOptionFurigana(q.promptLabel)) {
      for (const opt of q.options ?? []) {
        baseSentences.add(opt);
        optionRuns += 1;
      }
    }

    // -- explanation sources (post-answer only) --
    for (const text of [q.explanation, ...Object.values(q.explanationI18n ?? {})]) {
      for (const run of collectJapaneseRubySources(text)) {
        explanationSentences.add(run);
        explanationRuns += 1;
      }
    }
  }

  // -- learning-view sources (#618) --
  // subtitle/formula fields are authored Japanese teaching material, so bake
  // each complete string. Source zh-Hant pitfalls only bake quoted Japanese
  // so adjacent Chinese prose cannot receive bogus readings; the ja overlay
  // is wholly Japanese, while other locales use the mixed-text collector.
  const addLearningPitfall = (text, locale) => {
    if (locale === "ja") {
      learningSentences.add(text);
      return;
    }
    const sources = locale === "zh-Hant"
      ? collectQuotedRubySources(text)
      : collectJapaneseRubySources(text);
    for (const run of sources) {
      learningSentences.add(run);
    }
  };
  for (const block of learningBlocks) {
    learningSentences.add(block.subtitle);
    for (const example of block.examples) learningSentences.add(example.formula);
    for (const pitfall of block.pitfalls ?? []) addLearningPitfall(pitfall, "zh-Hant");
  }
  for (const locales of Object.values(learningBlockI18n)) {
    for (const [locale, overlay] of Object.entries(locales)) {
      for (const pitfall of overlay?.pitfalls ?? []) addLearningPitfall(pitfall, locale);
    }
  }

  console.log(
    `sources -> questions:${questions.length} stems:${promptStems} options:${optionRuns} explanation-runs:${explanationRuns}` +
    ` · base unique:${baseSentences.size} explanation unique:${explanationSentences.size}` +
    ` learning unique:${learningSentences.size}`
  );

  // Tokenise the union once (kuromoji is the expensive part), then split by
  // source table. All tables stay deterministic, sorted, and globally
  // deduplicated.
  const allSentences = new Set([
    ...baseSentences,
    ...explanationSentences,
    ...learningSentences
  ]);

  const tokenizer = await new Promise((resolve, reject) =>
    kuromoji.builder({ dicPath: DIC }).build((err, t) => (err ? reject(err) : resolve(t)))
  );

  const data = {};
  for (const sentence of allSentences) {
    const tokens = applyReadingOverrides(tokenizer.tokenize(sentence), READING_OVERRIDES);
    const segments = tokensToSegments(tokens);
    // Only store sentences that actually carry furigana; kana-only sentences
    // render fine as plain text and would just bloat the table.
    if (segments.some((seg) => seg.r !== undefined)) data[sentence] = segments;
  }

  function writeTable(keys, outPath, bannerSuffix, exportName) {
    const filteredKeys = Object.keys(data)
      .filter((k) => keys.has(k))
      .sort();
    const entries = filteredKeys
      .map((key) => `  ${JSON.stringify(key)}: ${JSON.stringify(data[key])}`)
      .join(",\n");

    const banner =
      "// AUTO-GENERATED by scripts/build-furigana.mjs — do not edit by hand.\n" +
      `// ${bannerSuffix}\n` +
      "// Regenerate: pnpm build:furigana\n";

    const file =
      `${banner}import type { FuriganaSegment } from "./furigana";\n\n` +
      `export const ${exportName}: Record<string, FuriganaSegment[]> = {\n${entries}\n};\n`;

    writeFileSync(outPath, file, "utf8");
    return filteredKeys.length;
  }

  const baseEntries = writeTable(
    baseSentences, OUT_BASE,
    "Source: reachable question prompts / examples / answers (base map).",
    "furiganaData"
  );
  const explanationEntries = writeTable(
    explanationSentences, OUT_EXPLANATION,
    "Source: explanation / feedback Japanese runs only (lazy map).",
    "furiganaExplanationData"
  );
  const learningEntries = writeTable(
    learningSentences, OUT_LEARNING,
    "Source: learning chapter formulas / subtitles / Japanese pitfall runs (lazy map).",
    "furiganaLearningData"
  );

  console.log(`base map:  ${baseEntries} entries · wrote ${path.relative(ROOT, OUT_BASE)}`);
  console.log(`explanation map: ${explanationEntries} entries · wrote ${path.relative(ROOT, OUT_EXPLANATION)}`);
  console.log(`learning map: ${learningEntries} entries · wrote ${path.relative(ROOT, OUT_LEARNING)}`);
} finally {
  await server.close();
}
