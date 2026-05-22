// One-off normalization: replace every leaky instructionZh in
// examBlocks.ts with a generic instruction matching its question type.
//
// The previous instructions ("辯解語氣的原因", "強調唯一的理由", etc.)
// gave away the answer's category, turning 4-choice grammar items into
// 1-choice "match the Chinese definition" tasks. After this pass, the
// student must read the sentence and the four options themselves.
//
// Allowed instructionZh strings (whitelisted, kept as-is):
//   "選與「」中詞語意思最接近的選項。"          — 言い換え類義
//   "選出該詞語使用最自然的句子。"               — 用法
//   "句中填空：選最自然的詞語。"                 — 文脈規定
//   "選出底線詞語的正確讀音。"                   — 漢字読み
//
// Anything else under a 文法形式選擇 / 語順組合 / 文章脈絡 promptLabel
// is rewritten to the generic for that promptLabel.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "..", "src", "domain", "examBlocks.ts");
const src = readFileSync(target, "utf8");

const GENERIC = {
  "文法形式選擇": "句中填空：依文脈選最自然的文法。",
  "語順組合": "語順組合：選語法正確且語意自然的句子。",
  "文章脈絡": "短文脈絡：選能讓文章流向自然的接續表現。"
};

const KEEP = new Set([
  '選與「」中詞語意思最接近的選項。',
  "選出該詞語使用最自然的句子。",
  "句中填空：選最自然的詞語。",
  "選出底線詞語的正確讀音。",
  // Already-generic versions (no rewrite needed)
  GENERIC["文法形式選擇"],
  GENERIC["語順組合"],
  GENERIC["文章脈絡"]
]);

// Walk through each examQuestion({...}) block. For each, grab promptLabel
// + instructionZh; if instructionZh isn't whitelisted and the promptLabel
// has a generic mapping, rewrite the instructionZh to the generic.
const blocks = src.split("examQuestion({");
let totalChanged = 0;
const rewritten = blocks.map((blk, i) => {
  if (i === 0) return blk; // text before first examQuestion call
  const end = blk.indexOf("})");
  if (end < 0) return blk;
  const body = blk.slice(0, end);
  const tail = blk.slice(end);

  const labelMatch = body.match(/promptLabel:\s*"[^"]*?(文法形式選擇|語順組合|文章脈絡)[^"]*"/);
  if (!labelMatch) return blk; // not one of the targeted types

  const type = labelMatch[1];
  const generic = GENERIC[type];

  // Replace instructionZh value if it's not whitelisted.
  const newBody = body.replace(
    /(instructionZh:\s*")([^"]*)(")/,
    (_, pre, content, post) => {
      if (KEEP.has(content)) return _;
      totalChanged += 1;
      return `${pre}${generic}${post}`;
    }
  );

  return newBody + tail;
});

const out = rewritten.join("examQuestion({");
writeFileSync(target, out, "utf8");
console.log(`Normalized ${totalChanged} instructionZh entries.`);
