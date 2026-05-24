// Sanity check across the bank:
//   1. Every exam question's expectedAnswer must appear in its own options.
//   2. No exam promptLabel may carry an "N1 / N2 / N3 " prefix (UI hides level).
//   3. Sentence-pattern hintZh values must not contain Chinese phrases that
//      would tip off the answer (e.g. 「請」「禁止」「不必」「必須」 etc.).
// Run with `node scripts/check-exam-options.mjs`.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const examTarget = resolve(here, "..", "src", "domain", "examBlocks.ts");
const patternTarget = resolve(here, "..", "src", "domain", "sentencePatterns.ts");
const text = readFileSync(examTarget, "utf8");
const blocks = text.split("examQuestion({").slice(1);

let bad = 0;
let seenIds = new Set();
for (let i = 0; i < blocks.length; i++) {
  const blk = blocks[i];
  const end = blk.indexOf("})");
  const body = blk.slice(0, end);
  const idMatch = body.match(/id:\s*"([^"]+)"/);
  const expMatch = body.match(/expectedAnswer:\s*"((?:[^"\\]|\\.)*)"/);
  const optsMatch = body.match(/options:\s*\[([\s\S]*?)\]/);
  // Fail loudly on unparseable blocks so a malformed entry can't slip
  // past the guard silently. Report which fields were missing and the
  // id if we managed to extract it.
  if (!idMatch || !expMatch || !optsMatch) {
    const missing = [
      !idMatch && "id",
      !expMatch && "expectedAnswer",
      !optsMatch && "options"
    ]
      .filter(Boolean)
      .join(", ");
    const idHint = idMatch ? idMatch[1] : `block #${i + 1}`;
    console.log(`UNPARSEABLE ${idHint}: missing field(s) -> ${missing}`);
    bad++;
    continue;
  }
  const id = idMatch[1];
  const expected = expMatch[1];
  const opts = optsMatch[1];
  if (seenIds.has(id)) {
    console.log("DUPLICATE id:", id);
    bad++;
  }
  seenIds.add(id);
  if (!opts.includes('"' + expected + '"')) {
    console.log("MISSING expected in options:", id, "->", JSON.stringify(expected));
    bad++;
  }
  // promptLabel should not surface the JLPT level (N1/N2/N3 prefix). The
  // internal `level` field still drives filtering; only the user-visible
  // label is the concern. This lint catches regressions if a new item
  // adds an "N1 ..." style label by reflex.
  const labelMatch = body.match(/promptLabel:\s*"([^"]+)"/);
  if (labelMatch && /^N[1-3]\s/.test(labelMatch[1])) {
    console.log(`LEVEL LEAK in promptLabel: ${id} -> ${JSON.stringify(labelMatch[1])}`);
    bad++;
  }
}
console.log(`checked ${blocks.length} exam entries; ${bad} problem(s)`);

// -- Sentence-pattern hintZh leak guard ---------------------------------
// The hintZh is shown BEFORE the learner answers; it must not parrot the
// Chinese gloss of any candidate pattern, or the question becomes a
// 1-of-1 "match the Chinese label". Per-pattern banlists below come from
// the Codex review of PR #31.
const PATTERN_HINT_BANLIST = {
  "te-kudasai": ["請", "請求", "禁止", "可以", "准許", "允許", "不准", "不要"],
  "nakute-mo-ii": ["不必", "不用", "可不必", "必須", "一定要", "不可", "不該"],
  "te-morau": ["給予", "替我", "為我", "為他", "幫我", "幫他"],
  "to-omou": ["以為", "覺得", "認為", "說"]
};

const patternText = readFileSync(patternTarget, "utf8");
// Each item literal starts at the opening `{` after `SentencePatternItem[]
// = [` or after a comma. Splitting on `id: "pattern-` is a robust enough
// proxy because every item starts with that key.
const patternBlocks = patternText.split('id: "pattern-').slice(1);
let patternBad = 0;
for (const blk of patternBlocks) {
  const idMatch = blk.match(/^([\w-]+)"/);
  const patternIdMatch = blk.match(/patternId:\s*"([^"]+)"/);
  const hintMatch = blk.match(/hintZh:\s*"((?:[^"\\]|\\.)*)"/);
  if (!idMatch || !patternIdMatch || !hintMatch) {
    console.log(`UNPARSEABLE sentence-pattern block near: ${blk.slice(0, 60)}`);
    patternBad++;
    continue;
  }
  const id = `pattern-${idMatch[1]}`;
  const banlist = PATTERN_HINT_BANLIST[patternIdMatch[1]] ?? [];
  const hint = hintMatch[1];
  for (const phrase of banlist) {
    if (hint.includes(phrase)) {
      console.log(`HINT LEAK in ${id}: hintZh contains "${phrase}" -> ${JSON.stringify(hint)}`);
      patternBad++;
    }
  }
}
console.log(`checked ${patternBlocks.length} sentence-pattern entries; ${patternBad} problem(s)`);

process.exit(bad + patternBad ? 1 : 0);
