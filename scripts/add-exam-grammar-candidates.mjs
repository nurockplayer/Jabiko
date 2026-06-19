// One-off migration: port the REVIEWED-and-APPROVED original grammar
// candidates from docs/exam-grammar-original-question-list.md into
// examBlocks.ts.
//
// Review outcome (24 candidates -> 7 imported):
//   - 17 candidates duplicated patterns already in the bank (に伴って /
//     に応じて / をめぐって / ものの / にしては / ばかりに / 末に /
//     ところに / わけにはいかない / かねない / つつある / あっての /
//     べくして / にかたくない / とあれば / ものを / いかんによっては).
//     Skipped to avoid redundant coverage (the bank already has authored
//     items for each from earlier batches).
//   - 7 candidates were genuinely NEW patterns and passed the quality
//     checklist (4 real options, >=2 same-family distractors, clean
//     hintZh). Imported here.
//   - もさることながら's hintZh was rewritten: the original
//     "後者更值得注意" leaked the answer's "B more so" nuance.
//
// ids: candidate- prefix stripped; scenario suffix kept so they read
// distinctly.
//
// Run: node scripts/add-exam-grammar-candidates.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "..", "src", "domain", "examBlocks.ts");

const ITEMS = [
  {
    id: "n2-grammar-nihokanaranai-genin",
    level: "N2",
    surface: "にほかならない",
    reading: "にほかならない",
    meaningZh: "正是、無非是",
    promptText: "今回の混乱の原因は、事前の確認不足 ___。",
    promptContextZh: "這次混亂的原因正是事前確認不足。",
    hintZh: "說明造成混亂的核心原因。",
    expectedAnswer: "にほかならない",
    options: ["にほかならない", "にすぎない", "に相違ない", "とは限らない"],
    explanation: "「Nにほかならない」表示正是 N、無非是 N。「にすぎない」是只不過；「に相違ない」是確信推測；「とは限らない」是否定必然。本句要斷定原因，選「にほかならない」。"
  },
  {
    id: "n1-grammar-wooite-kosho",
    level: "N1",
    surface: "をおいて",
    reading: "をおいて",
    meaningZh: "除了...之外沒有...",
    promptText: "この難しい交渉を任せられる人は、経験豊富な田中さん ___ いない。",
    promptContextZh: "能被託付這場困難談判的人，除了經驗豐富的田中以外沒有別人。",
    hintZh: "困難談判的人選判斷。",
    expectedAnswer: "をおいて",
    options: ["をおいて", "ならでは", "あっての", "なくしては"],
    explanation: "「Nをおいて...ない」表示除了 N 沒有其他適合對象。「ならでは」是獨特性；「あっての」是存在依存；「なくしては」是沒有就不成立。本句搭配「いない」，選「をおいて」。"
  },
  {
    id: "n1-grammar-bekumonai-yosoku",
    level: "N1",
    surface: "べくもない",
    reading: "べくもない",
    meaningZh: "不可能...",
    promptText: "当時の資料だけでは、現在の市場変化を ___。",
    promptContextZh: "僅憑當時的資料，不可能預測現在的市場變化。",
    hintZh: "以過去資料判斷現在市場變化的限度。",
    expectedAnswer: "予測すべくもない",
    options: ["予測すべくもない", "予測しようがない", "予測しかねない", "予測しがたい"],
    explanation: "「Vるべくもない」是書面語，表示完全不可能。「予測しようがない」意思近但較口語；「予測しかねない」是可能預測而產生壞結果，語意不合；「予測しがたい」是難以預測，語氣較弱。"
  },
  {
    id: "n1-grammar-zunihasumanai-kojinjoho",
    level: "N1",
    surface: "ずにはすまない",
    reading: "ずにはすまない",
    meaningZh: "不能不...、非...不可",
    promptText: "個人情報を外部に送ってしまった以上、担当者だけでなく会社としても説明せ ___。",
    promptContextZh: "既然已將個人資料送到外部，不只負責人，公司也不能不說明。",
    hintZh: "個資外流後，公司對外說明的責任。",
    expectedAnswer: "ずにはすまない",
    options: ["ずにはすまない", "ずにはおかない", "ずにはいられない", "ないではおかない"],
    explanation: "「Vずにはすまない」表示責任或情況上不能不做。「ずにはおかない」是必然造成；「ずにはいられない」是情感上忍不住；「ないではおかない」也偏造成結果。本句是責任上的説明義務，選「ずにはすまない」。"
  },
  {
    id: "n1-grammar-toii-happyo",
    level: "N1",
    surface: "といい",
    reading: "といい",
    meaningZh: "無論...還是...",
    promptText: "資料の構成 ___、説明の順序といい、今回の発表は非常に分かりやすかった。",
    promptContextZh: "無論資料結構還是說明順序，這次發表都非常容易理解。",
    hintZh: "從多個面向評價一場發表。",
    expectedAnswer: "といい",
    options: ["といい", "であれ", "だの", "やら"],
    explanation: "「AといいBといい」列舉兩個方面並給出整體評價。「であれ」是不論；「だの」「やら」列舉時常帶雜亂或批評語感。本句是正面評價兩個方面，選「といい」。"
  },
  {
    id: "n1-grammar-mosarukotonagara-sakka",
    level: "N1",
    surface: "もさることながら",
    reading: "もさることながら",
    meaningZh: "...自不必說，...更是",
    promptText: "この作家は物語の展開 ___、登場人物の心理描写が見事だ。",
    promptContextZh: "這位作家的故事發展固然出色，人物心理描寫更精彩。",
    hintZh: "從兩個角度評價這位作家的作品。",
    expectedAnswer: "もさることながら",
    options: ["もさることながら", "のみならず", "にとどまらず", "ばかりか"],
    explanation: "「AもさることながらB」表示 A 當然重要，但 B 更值得強調。「のみならず」「ばかりか」是不只；「にとどまらず」是不限於範圍。本句是後項心理描写更突出，選「もさることながら」。"
  },
  {
    id: "n1-grammar-niitattewa-sekininsha",
    level: "N1",
    surface: "に至っては",
    reading: "にいたっては",
    meaningZh: "至於...更是",
    promptText: "新人はまだしも、責任者 ___ 報告書の内容を把握していなかった。",
    promptContextZh: "新人也就算了，至於負責人更是連報告內容都沒掌握。",
    hintZh: "比較新人與責任者對報告內容的掌握情況。",
    expectedAnswer: "に至っては",
    options: ["に至っては", "に至って", "に至るまで", "にあって"],
    explanation: "「Nに至っては」提出極端例子，常帶批判或驚訝。「に至って」是到了某階段；「に至るまで」是範圍連到；「にあって」是在某狀況下。本句責任者是更嚴重例，選「に至っては」。"
  }
];

{
  const ids = new Set();
  for (const it of ITEMS) {
    if (ids.has(it.id)) { console.error(`dup id ${it.id}`); process.exit(1); }
    if (!it.options.includes(it.expectedAnswer)) { console.error(`answer not in options ${it.id}`); process.exit(1); }
    if (it.options.length !== 4) { console.error(`need 4 options ${it.id}`); process.exit(1); }
    ids.add(it.id);
  }
}

const fmt = (s) => JSON.stringify(s);
function block(item) {
  return [
    "  examQuestion({",
    `    id: ${fmt(item.id)},`,
    `    level: ${fmt(item.level)},`,
    `    surface: ${fmt(item.surface)},`,
    `    reading: ${fmt(item.reading)},`,
    `    meaningZh: ${fmt(item.meaningZh)},`,
    `    promptLabel: "文法形式選擇",`,
    `    instructionZh: "句中填空：依文脈選最自然的文法。",`,
    `    promptText: ${fmt(item.promptText)},`,
    `    promptContextZh: ${fmt(item.promptContextZh)},`,
    `    hintZh: ${fmt(item.hintZh)},`,
    `    expectedAnswer: ${fmt(item.expectedAnswer)},`,
    `    options: ${JSON.stringify(item.options)},`,
    `    explanation: ${fmt(item.explanation)}`,
    "  })"
  ].join("\n");
}

const ANCHOR_REGEX = /\}\)(\r?\n)\];(\r?\n)(\r?\n)export function buildExamQuestionPool/;
let text = readFileSync(target, "utf8");
if (!ANCHOR_REGEX.test(text)) { console.error("anchor not found"); process.exit(1); }
const eol = text.includes("\r\n") ? "\r\n" : "\n";
const newBlocks = ITEMS.map(block).join("," + eol).replace(/\n/g, eol);
text = text.replace(ANCHOR_REGEX, `})${eol},${eol}${newBlocks}${eol}];${eol}${eol}export function buildExamQuestionPool`);
writeFileSync(target, text, "utf8");
console.log(`Imported ${ITEMS.length} reviewed grammar candidates.`);
