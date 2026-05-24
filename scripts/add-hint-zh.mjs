// One-off migration: insert `hintZh` field into each sentencePatterns
// item. The hint is a neutral situation description shown pre-answer;
// the existing `promptContextZh` (full translation) stays for the
// feedback panel.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "..", "src", "domain", "sentencePatterns.ts");

// id → hintZh. Each hint avoids the Chinese gloss of the chapter's
// answer family (請 / 禁止 / 可以 / 不必 / 必須 / 給予 / 以為 / 說 / 等),
// while still giving learners enough context to orient.
const HINTS = {
  // te-kudasai (請求 / 許可 / 禁止)
  "pattern-te-kudasai-001": "上司對下屬指示工作期限。",
  "pattern-te-kudasai-002": "學生向老師詢問可否動用某物。",
  "pattern-te-kudasai-003": "圖書館關於館內飲食的告示。",
  "pattern-te-kudasai-004": "電車內就音量大小對朋友說話。",
  "pattern-te-kudasai-005": "病人就飲酒一事詢問醫生。",
  "pattern-te-kudasai-006": "停車場的告示牌內容。",
  "pattern-te-kudasai-007": "店員引導顧客在表單上填寫姓名。",
  "pattern-te-kudasai-008": "母親對小孩關於火的安全話。",
  // nakute-mo-ii (不必 vs 必須)
  "pattern-nakute-mo-ii-001": "退燒後的服藥判斷。",
  "pattern-nakute-mo-ii-002": "考試前夜的就寢安排。",
  "pattern-nakute-mo-ii-003": "週末是否進公司。",
  "pattern-nakute-mo-ii-004": "駕照與開車的關係。",
  "pattern-nakute-mo-ii-005": "生病時對上班的建議。",
  "pattern-nakute-mo-ii-006": "圖書館借書的費用。",
  "pattern-nakute-mo-ii-007": "上課前的書本準備。",
  "pattern-nakute-mo-ii-008": "輕鬆派對的服裝判斷。",
  // te-morau (授受視角)
  "pattern-te-morau-001": "妹妹有學業困難時與我之間的互動。",
  "pattern-te-morau-002": "重行李與機場接送時和朋友的互動。",
  "pattern-te-morau-003": "老師處理我作文的方式。",
  "pattern-te-morau-004": "我與兄長之間關於送站的安排。",
  "pattern-te-morau-005": "為迷路的長者帶路到車站。",
  "pattern-te-morau-006": "母親每天為家人準備便當。",
  "pattern-te-morau-007": "下週會議資料與課長的安排。",
  "pattern-te-morau-008": "每晚與孩子們的閱讀時光。",
  // to-omou (引用 / 意見)
  "pattern-to-omou-001": "他關於明天考試的話。",
  "pattern-to-omou-002": "對明天天氣的猜測。",
  "pattern-to-omou-003": "他對於去北海道一事的打算。",
  "pattern-to-omou-004": "對這個問題難度的判斷。",
  "pattern-to-omou-005": "妹妹關於新衣服的話。",
  "pattern-to-omou-006": "哥哥剛才提到的所在位置。",
  "pattern-to-omou-007": "對那家店氛圍的看法。",
  "pattern-to-omou-008": "關於那個人身分的推測。"
};

let text = readFileSync(target, "utf8");
let added = 0;
for (const [id, hint] of Object.entries(HINTS)) {
  // Match the block from `id: "<id>"` up to the next `promptContextZh:`
  // line, capturing the indentation before promptContextZh.
  const re = new RegExp(
    `(id: "${id}",[\\s\\S]*?promptText: "[^"]*",)\\r?\\n(\\s*)(promptContextZh:)`
  );
  const before = text;
  text = text.replace(re, (_, head, indent, ctxKey) => {
    return `${head}\n${indent}hintZh: ${JSON.stringify(hint)},\n${indent}${ctxKey}`;
  });
  if (text !== before) added++;
}

writeFileSync(target, text, "utf8");
console.log(`Inserted hintZh on ${added}/${Object.keys(HINTS).length} items.`);
process.exit(added === Object.keys(HINTS).length ? 0 : 1);
