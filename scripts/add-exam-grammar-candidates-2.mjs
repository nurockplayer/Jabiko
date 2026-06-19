// Second-pass import from docs/exam-grammar-original-question-list.md.
//
// The first pass (add-exam-grammar-candidates.mjs) imported only the 7
// brand-new patterns and skipped all 17 "surface already in bank" ones.
// That filter was too strict: for N1/N2, multiple questions on the same
// grammar point ARE valuable when the SCENARIO + distractor family +
// test angle differ (not just a noun swap of the same cue).
//
// Re-reviewed the 17 against their existing same-surface item. Kept 12
// that bring a different context and/or a stronger distractor set; still
// skipped 5 that are near-clones of an existing item:
//   - 末に: existing item is N1; candidate is N2 -> would double-list the
//     pattern across levels.
//   - かねない: same "情報を怠れば -> 負面かねない" template.
//   - べくして: same canonical "事故が起こるべくして起こった + 安全怠る".
//   - ものを: same "早めに相談してくれれば〜できたものを" counterfactual.
//   - いかんによっては: same "検査結果…可能性" cue noun.
//
// These 12 use the candidates' scenario-suffixed ids so they coexist
// with the existing un-suffixed items.
//
// Run: node scripts/add-exam-grammar-candidates-2.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "..", "src", "domain", "examBlocks.ts");

const ITEMS = [
  {
    id: "n2-grammar-nitomonatte-denshi", level: "N2", surface: "に伴って", reading: "にともなって",
    meaningZh: "伴隨、隨著",
    promptText: "電子契約の普及 ___、社内の承認手続きも見直された。",
    promptContextZh: "隨著電子契約普及，公司內部的核准流程也被重新檢討。",
    hintZh: "電子契約普及後，公司內部流程的調整。",
    expectedAnswer: "に伴って",
    options: ["に伴って", "にしたがって", "に沿って", "に応じて"],
    explanation: "「Nに伴って」表示某變化連帶帶來另一變化。「にしたがって」偏依照規則或漸進變化；「に沿って」是依照方針；「に応じて」是依條件調整。本句是普及造成流程跟著變動，最自然是「に伴って」。"
  },
  {
    id: "n2-grammar-nioujite-kenshu", level: "N2", surface: "に応じて", reading: "におうじて",
    meaningZh: "依照、根據不同情況",
    promptText: "申込者の経験年数 ___、研修内容を三段階に分けている。",
    promptContextZh: "依申請者的經驗年數，將研修內容分成三個階段。",
    hintZh: "研修內容依參加者條件而調整。",
    expectedAnswer: "に応じて",
    options: ["に応じて", "に沿って", "に基づいて", "に伴って"],
    explanation: "「Nに応じて」表示內容會配合 N 的差異而變化。「に沿って」是依方針；「に基づいて」是以資料或規則為根據；「に伴って」是伴隨變化。本句重點是按經驗年數分級，選「に応じて」。"
  },
  {
    id: "n2-grammar-womegutte-shineki", level: "N2", surface: "をめぐって", reading: "をめぐって",
    meaningZh: "圍繞、針對",
    promptText: "新駅の建設計画 ___、住民の間で賛否が分かれている。",
    promptContextZh: "居民之間圍繞新車站建設計畫意見分歧。",
    hintZh: "居民對新車站建設計畫有不同看法。",
    expectedAnswer: "をめぐって",
    options: ["をめぐって", "について", "に関して", "を通じて"],
    explanation: "「Nをめぐって」常用於議論、対立、問題が起こる場合。「について」「に関して」只是一般「關於」，少了對立語感；「を通じて」是透過媒介或期間。本句有「賛否が分かれている」，最自然是「をめぐって」。"
  },
  {
    id: "n2-grammar-monono-seido", level: "N2", surface: "ものの", reading: "ものの",
    meaningZh: "雖然、但是",
    promptText: "新しい勤怠システムは導入された ___、現場ではまだ操作ミスが多い。",
    promptContextZh: "新的出勤系統雖然已導入，但現場仍有很多操作錯誤。",
    hintZh: "制度導入後，現場仍有實際運用問題。",
    expectedAnswer: "ものの",
    options: ["ものの", "一方で", "反面", "に対して"],
    explanation: "「Vたものの」表示前項成立，但結果沒有如預期順利。「一方で」「反面」偏兩面並列；「に対して」是對比不同對象。本句是導入後仍未順利，選「ものの」。"
  },
  {
    id: "n2-grammar-nishitewa-kikakusho", level: "N2", surface: "にしては", reading: "にしては",
    meaningZh: "以...來說",
    promptText: "入社一年目 ___、彼の企画書はかなり完成度が高い。",
    promptContextZh: "以入社第一年來說，他的企劃書完成度相當高。",
    hintZh: "評價一份企劃書時，把入社年資納入判斷。",
    expectedAnswer: "にしては",
    options: ["にしては", "わりに", "くせに", "ものの"],
    explanation: "「Nにしては」表示以某身分、條件或標準來看，結果超出預期。「わりに」也可表示相對評價，但較口語且不如本句的基準明確；「くせに」帶責備；「ものの」是讓步。本句以「入社一年目」為基準評價，選「にしては」。"
  },
  {
    id: "n2-grammar-bakarini-kakunin", level: "N2", surface: "ばかりに", reading: "ばかりに",
    meaningZh: "只因為...就造成壞結果",
    promptText: "確認を一度怠った ___、納品全体が遅れることになった。",
    promptContextZh: "只因一次疏忽確認，就導致整個交貨延誤。",
    hintZh: "一次確認疏忽造成後續交期問題。",
    expectedAnswer: "ばかりに",
    options: ["ばかりに", "せいで", "ことから", "おかげで"],
    explanation: "「Vたばかりに」強調因為一個看似小的原因造成遺憾結果。「せいで」只是一般負面原因，沒有「小因大果」的惋惜語感；「ことから」是判斷依據或原因；「おかげで」通常是正面原因。本句有「一度」與大範圍延誤，選「ばかりに」。"
  },
  {
    id: "n2-grammar-tokoroni-shusei", level: "N2", surface: "ところに", reading: "ところに",
    meaningZh: "正當...時",
    promptText: "ちょうど報告書を印刷しようとしていた ___、部長から修正の指示が入った。",
    promptContextZh: "正要印報告書時，部長提出了修改指示。",
    hintZh: "報告書印刷前，主管提出新的指示。",
    expectedAnswer: "ところに",
    options: ["ところに", "最中に", "折に", "次第"],
    explanation: "「Vようとしていたところに」表示正要做某事時，另一事插進來。「最中に」偏「正在進行中」；「折に」是「時機、機會」較鄭重；「次第」是「一…就…」。本句是正要印刷時被打斷，選「ところに」。"
  },
  {
    id: "n2-grammar-wakeniha-yakusoku", level: "N2", surface: "わけにはいかない", reading: "わけにはいかない",
    meaningZh: "不能那樣做",
    promptText: "取引先との約束がある以上、こちらの都合だけで日程を変える ___。",
    promptContextZh: "既然已經和客戶約好，就不能只因我方方便而更改日程。",
    hintZh: "已和外部對象約定後，日程調整受到限制。",
    expectedAnswer: "わけにはいかない",
    options: ["わけにはいかない", "わけがない", "ことはない", "はずがない"],
    explanation: "「Vるわけにはいかない」表示因社會、道義或責任上的理由不能做。「わけがない」「はずがない」是否定可能性；「ことはない」是不必做。本句是約定造成不能任意改期，選「わけにはいかない」。"
  },
  {
    id: "n2-grammar-tsutsuaru-shinsei", level: "N2", surface: "つつある", reading: "つつある",
    meaningZh: "正在逐漸...",
    promptText: "紙の申請書は、オンライン手続きへと徐々に置き換えられ ___。",
    promptContextZh: "紙本申請書正逐漸被線上手續取代。",
    hintZh: "紙本與線上申請方式的轉換。",
    expectedAnswer: "つつある",
    options: ["つつある", "ているところだ", "一方だ", "ばかりだ"],
    explanation: "「Vます形 + つつある」表示變化正在逐步進行。「ているところだ」偏「正在做某動作」；「一方だ」多表示單方向加劇；「ばかりだ」多接惡化。本句有「徐々に」的漸進變化，選「つつある」。"
  },
  {
    id: "n1-grammar-atteno-riyosya", level: "N1", surface: "あっての", reading: "あっての",
    meaningZh: "有...才有...",
    promptText: "このサービスは日々の利用者 ___ ものだという意識を忘れてはならない。",
    promptContextZh: "不能忘記這項服務是有每天的使用者才得以成立。",
    hintZh: "服務成立與使用者支持之間的關係。",
    expectedAnswer: "あっての",
    options: ["あっての", "なくしては", "ならでは", "をおいて"],
    explanation: "「AあってのB」表示 B 是因 A 的存在才成立。「なくしては」後面多接否定；「ならでは」是只有某對象才有的特色；「をおいて」是除了某人事物沒有其他。本句是服務依靠使用者而存在，且後接「ものだ」，選「あっての」。"
  },
  {
    id: "n1-grammar-nikatakunai-genba", level: "N1", surface: "にかたくない", reading: "にかたくない",
    meaningZh: "不難...",
    promptText: "突然の発表に、現場がどれほど混乱したかは想像 ___。",
    promptContextZh: "突然發表後，現場有多混亂不難想像。",
    hintZh: "突如其來的發表對現場造成的影響。",
    expectedAnswer: "にかたくない",
    options: ["にかたくない", "にたえない", "に忍びない", "に足る"],
    explanation: "「想像にかたくない」是固定搭配，表示不難想像。「にたえない」是「強烈到受不了」或「不值得看／聽」；「に忍びない」是「於心不忍」；「に足る」是「值得」。四個都是「に＋動詞ます形」評價句型，但只有「にかたくない」與「想像」相搭。"
  },
  {
    id: "n1-grammar-toareba-anzen", level: "N1", surface: "とあれば", reading: "とあれば",
    meaningZh: "如果是...的話",
    promptText: "地域の安全に関わる問題 ___、多少時間がかかっても調査を続けるべきだ。",
    promptContextZh: "如果是關係到地區安全的問題，即使花時間也應繼續調查。",
    hintZh: "地區安全問題對調查必要性的影響。",
    expectedAnswer: "とあれば",
    options: ["とあれば", "とあって", "となれば", "とはいえ"],
    explanation: "「Nとあれば」表示若是 N 這種情況，就應採取相應行動，後句常帶「即使…也…」。「とあって」是因特殊情況自然發生結果（多用於既成事實）；「となれば」是「一旦變成那樣」；「とはいえ」是讓步。本句是條件判斷，選「とあれば」。"
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
console.log(`Imported ${ITEMS.length} second-pass grammar candidates.`);
