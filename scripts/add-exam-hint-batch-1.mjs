// One-off migration: insert `hintZh` (neutral pre-answer situation)
// onto the first 30 文法形式選擇 items in examBlocks.ts. The existing
// `promptContextZh` (full translation) stays for the feedback panel.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "..", "src", "domain", "examBlocks.ts");

// id → hintZh. Each hint avoids the Chinese gloss of the item's answer
// (隨著 / 不得不 / 為了 / 之前 / 之際 / 之類的標記詞).
const HINTS = {
  "n2-grammar-nitomonatte": "產業發展與地方就業環境的關聯。",
  "n2-grammar-naikotoniwa": "判斷原因時對現場觀察的必要性。",
  "n2-grammar-womegutte": "公司導入新評價制度後出現的議論。",
  "n2-grammar-kanenai": "資訊管理疏忽對公司信用的影響。",
  "n2-grammar-zaruwoenai": "資料不足時對結論的處理。",
  "n2-grammar-nisakidatte": "記者會與資料發放的時間關係。",
  "n2-grammar-nimokakawarazu": "大雨天氣與說明會出席狀況。",
  "n1-grammar-toaimatte": "店家的技術與服務對評價的作用。",
  "n1-grammar-yoginaku": "颱風與活動安排之間的關係。",
  "n1-grammar-nakushitewa": "居民理解與計畫推進的關係。",
  "n1-grammar-nisokushite": "現場狀況與規則調整的關係。",
  "n1-grammar-mademonai": "對於這個結果的後續說明判斷。",
  "n1-grammar-beku": "專案成功與加班努力的關係。",
  "n1-grammar-wokikkirini": "東京發表會與全國說明會的關係。",
  "n1-grammar-toatte": "連假第一天車站的狀況。",
  "n3-grammar-yoninaru": "每天練習自行車的結果。",
  "n3-grammar-kotonisuru": "因身體考量對抽菸的處理。",
  "n3-grammar-tsumori": "暑假的安排。",
  "n3-grammar-bayokatta": "被雨淋濕後對帶傘的反思。",
  "n3-grammar-tahougaii": "對發燒的人關於就醫的建議。",
  "n3-grammar-nakutehaikenai": "明天前報告交件的安排。",
  "n3-grammar-teshimau": "對忘記重要約定的回應。",
  "n3-grammar-teoku": "會議前對資料的安排。",
  "n3-grammar-nagara": "聽音樂與讀書的習慣。",
  "n3-grammar-teirutokoro": "用餐時間中對於來電的回應。",
  "n2-grammar-monono": "開始減肥後體重的變化。",
  "n2-grammar-karakoso": "對對方的關心與嚴厲態度的關係。",
  "n2-grammar-niatatte": "啟動新項目時的準備工作。",
  "n2-grammar-nikanshite": "就某問題向大家徵詢意見。",
  "n2-grammar-nishitewa": "他來日本的時間與日語能力的關係。"
};

let text = readFileSync(target, "utf8");
let added = 0;
for (const [id, hint] of Object.entries(HINTS)) {
  // Match the block from `id: "<id>"` up to the next `promptContextZh:`
  // line, then insert hintZh after it (so the pre-answer hint sits
  // visually next to the full translation in source order).
  const re = new RegExp(
    `(id: "${id}",[\\s\\S]*?promptContextZh: "[^"]*",)\\r?\\n(\\s*)(expectedAnswer:)`
  );
  const before = text;
  text = text.replace(re, (_, head, indent, expKey) => {
    return `${head}\n${indent}hintZh: ${JSON.stringify(hint)},\n${indent}${expKey}`;
  });
  if (text === before) {
    console.log(`MISS: ${id} not patched (regex didn't match)`);
  } else {
    added++;
  }
}

writeFileSync(target, text, "utf8");
console.log(`Inserted hintZh on ${added}/${Object.keys(HINTS).length} items.`);
process.exit(added === Object.keys(HINTS).length ? 0 : 1);
