#!/usr/bin/env node
// Build the lazy, bounded ruby map for the Rainy Monday world only.
// Run with: corepack pnpm exec node scripts/build-rainy-monday-furigana.mjs
import { createServer } from "vite";
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import kuromoji from "kuromoji";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DICTIONARY = path.join(path.dirname(require.resolve("kuromoji/package.json")), "dict");
const OUTPUT = path.join(ROOT, "src/domain/gameWorldContent/rainyMondayFurigana.ts");
const FICTIONAL_NAME_READINGS = { 青葉: "あおば", 青葉駅: "あおばえき", 佐藤: "さとう" };
const WORLD_READING_OVERRIDES = [
  ["一駅分", "ひとえきぶん"],
  ["一人", "ひとり"],
  ["一本", "いっぽん"]
];

function applyWorldReadingOverrides(source, inputTokens) {
  const tokens = inputTokens.map((token) => ({ ...token }));
  for (let index = 0; index < tokens.length; index += 1) {
    const contextualSingle = source.includes("乗っている間に") && tokens[index].surface_form === "間";
    if (contextualSingle) {
      tokens[index].reading = "あいだ";
      continue;
    }
    const match = WORLD_READING_OVERRIDES.find(([surface]) => {
      let joined = "";
      for (let end = index; end < tokens.length && end < index + 4; end += 1) {
        joined += tokens[end].surface_form;
        if (joined === surface) return true;
        if (!surface.startsWith(joined)) break;
      }
      return false;
    });
    if (!match) continue;
    let end = index;
    let joined = "";
    while (end < tokens.length && joined.length < match[0].length) {
      joined += tokens[end].surface_form;
      end += 1;
    }
    if (joined === match[0]) {
      tokens.splice(index, end - index, { surface_form: match[0], reading: match[1] });
    }
  }
  return tokens;
}

function collectLearnerText(value, locale, sources, furigana) {
  if (value == null || typeof value !== "object") return;
  if (typeof value.textZh === "string" && value.textI18n) {
    if (locale === "ja") {
      const japanese = value.textI18n.ja;
      if (typeof japanese === "string" && furigana.hasKanji(japanese)) sources.add(japanese);
    } else {
      const localized = locale === "zh-Hant" ? value.textZh : value.textI18n.en;
      const collectRuns = locale === "zh-Hant" ? furigana.collectQuotedRubySources : furigana.collectJapaneseRubySources;
      collectRuns(localized).forEach((source) => sources.add(source));
    }
    return;
  }
  if (Array.isArray(value)) value.forEach((item) => collectLearnerText(item, locale, sources, furigana));
  else Object.values(value).forEach((item) => collectLearnerText(item, locale, sources, furigana));
}

function collectScenarioSources(scenario, locale, sources, furigana) {
  for (const text of [scenario.situation, scenario.relationship?.context, scenario.objective, scenario.instruction]) {
    collectLearnerText(text, locale, sources, furigana);
  }
  for (const step of scenario.steps) {
    if (step.kind === "partner_line") {
      if (furigana.hasKanji(step.japanese)) sources.add(step.japanese);
    } else if (step.kind === "learner_response") {
      collectLearnerText(step.prompt, locale, sources, furigana);
      for (const response of step.responseExamples) {
        if (furigana.hasKanji(response.japanese)) sources.add(response.japanese);
        collectLearnerText(response.explanation, locale, sources, furigana);
      }
    } else if (step.kind === "completion") {
      collectLearnerText(step.summary, locale, sources, furigana);
    }
  }
}

async function main() {
  const server = await createServer({
    configFile: false,
    logLevel: "warn",
    server: { middlewareMode: true },
    appType: "custom",
    optimizeDeps: { noDiscovery: true }
  });
  try {
    const [{ rainyMondayContent }, furigana] = await Promise.all([
      server.ssrLoadModule("/src/domain/gameWorldContent/rainyMonday.ts"),
      server.ssrLoadModule("/src/domain/furigana.ts")
    ]);
    const { tokensToSegments } = furigana;
    const sources = new Set();
    for (const locale of ["zh-Hant", "ja", "en"]) {
      for (const location of rainyMondayContent.world.locations) {
        collectLearnerText(location.name, locale, sources, furigana);
        collectLearnerText(location.description, locale, sources, furigana);
      }
      for (const npc of rainyMondayContent.world.npcs) {
        collectLearnerText(npc.displayName, locale, sources, furigana);
        collectLearnerText(npc.presentation, locale, sources, furigana);
        collectLearnerText(npc.defaultRelationshipContext, locale, sources, furigana);
      }
      for (const stage of rainyMondayContent.world.relationshipStages) collectLearnerText(stage.context, locale, sources, furigana);
      for (const moment of rainyMondayContent.world.moments) collectLearnerText(moment.objective, locale, sources, furigana);
      for (const definition of rainyMondayContent.world.sessionDefinitions) {
        collectScenarioSources(definition.scenario, locale, sources, furigana);
      }
    }
    const tokenizer = await new Promise((resolve, reject) =>
      kuromoji.builder({ dicPath: DICTIONARY }).build((error, instance) => error ? reject(error) : resolve(instance))
    );
    const entries = {};
    for (const source of [...sources].sort()) {
      const tokens = applyWorldReadingOverrides(source, tokenizer.tokenize(source).map(({ surface_form, reading }) => ({
        surface_form,
        reading: FICTIONAL_NAME_READINGS[surface_form] ?? reading
      })));
      const segments = tokensToSegments(tokens);
      if (segments.some(({ r }) => r !== undefined)) entries[source] = segments;
    }
    const body = Object.keys(entries).sort().map((key) => `  ${JSON.stringify(key)}: ${JSON.stringify(entries[key])}`).join(",\n");
    const output = [
      "// AUTO-GENERATED by scripts/build-rainy-monday-furigana.mjs — do not edit by hand.",
      "// Exact Japanese world strings, Japanese runs in mixed copy, and reviewed fictional-name readings.",
      "// Regenerate: corepack pnpm exec node scripts/build-rainy-monday-furigana.mjs",
      "import type { FuriganaSegment } from \"../furigana\";",
      "",
      `export const rainyMondayFurigana: Record<string, FuriganaSegment[]> = {\n${body}\n};`,
      ""
    ].join("\n");
    writeFileSync(OUTPUT, output, "utf8");
    console.log(`Wrote ${Object.keys(entries).length} Rainy Monday ruby entries to ${path.relative(ROOT, OUTPUT)}`);
  } finally {
    await server.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error?.stack || String(error));
    process.exit(1);
  });
}
