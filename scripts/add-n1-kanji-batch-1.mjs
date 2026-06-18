// One-off migration: append 20 ORIGINAL N1 漢字読み items to
// examBlocks.ts. Focus on common reading traps:
//   - 訓読み with non-obvious 送り仮名 (促す, 拒む, 阻む, 募る, 操る, ...)
//   - 同字多音 (滞 in 滞納 たいのう vs the existing 滞る とどこおる)
//   - 音読み 熟語 with promotional / sokuon traps (撤回 てっかい, 巧妙 こうみょう)
//
// Distractors for each item are pedagogical: each one represents a
// real-world misreading pattern (wrong 音読み substitution, similar-
// kanji confusion, training-tail mistake), not a random hiragana.
// The explanation calls out WHICH trap each distractor represents.
//
// Run with `pnpm node scripts/add-n1-kanji-batch-1.mjs`.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "..", "src", "domain", "examBlocks.ts");

const ITEMS = [
  {
    id: "n1-read-unagasu",
    surface: "促す",
    reading: "うながす",
    meaningZh: "催促、促使",
    promptText: "改善を「促す」声が市民の間で高まっている。",
    promptContextZh: "市民之間要求改善的呼聲越來越高。",
    expectedAnswer: "うながす",
    options: ["うながす", "そくす", "もよおす", "せかす"],
    explanation: "「促」訓讀「うなが-す」→ うながす。「そくす」是直接套音讀「そく」（如「促進」）的錯讀；「もよおす」是「催す」（不同字，意思接近）；「せかす」是「急かす」（口語近義詞，不同字）。"
  },
  {
    id: "n1-read-kobamu",
    surface: "拒む",
    reading: "こばんだ",
    meaningZh: "拒絕",
    promptText: "彼は最後まで提案を「拒んだ」。",
    promptContextZh: "他直到最後都拒絕了那個提案。",
    expectedAnswer: "こばんだ",
    options: ["こばんだ", "ふせいだ", "はばんだ", "ことわった"],
    explanation: "「拒」訓讀「こば-む」→ こばんだ（た形）。「ふせいだ」是「防いだ」（防止，不同字）；「はばんだ」是「阻んだ」（阻擋，字形相近但訓讀不同）；「ことわった」是「断った」（拒絕，同義字但漢字不同）。"
  },
  {
    id: "n1-read-habamu",
    surface: "阻む",
    reading: "はばむ",
    meaningZh: "阻擋、妨礙",
    promptText: "高い壁が彼の野心を「阻む」。",
    promptContextZh: "一道高牆阻擋著他的野心。",
    expectedAnswer: "はばむ",
    options: ["はばむ", "こばむ", "ふせぐ", "そむ"],
    explanation: "「阻」訓讀「はば-む」→ はばむ。「こばむ」是「拒む」（字形相近，但拒む是「拒絕」，阻む是「阻擋」）；「ふせぐ」是「防ぐ」（不同字）；「そむ」是把音讀「そ」（如「阻止」）+ 訓尾的錯讀。"
  },
  {
    id: "n1-read-tsunoru",
    surface: "募る",
    reading: "つのって",
    meaningZh: "（情緒）增強；徵集",
    promptText: "不安が日に日に「募って」きた。",
    promptContextZh: "不安一天比一天強烈。",
    expectedAnswer: "つのって",
    options: ["つのって", "ぼって", "ぼしゅうって", "あつまって"],
    explanation: "「募」訓讀「つの-る」→ つのって（て形）。「ぼって」是直接套音讀「ぼ」的錯讀；「ぼしゅうって」是把熟語「募集」拆出讀法的陷阱；「あつまって」是「集まって」（聚集，意義接近但不同字）。注意「募る」是自他兩用：自動詞義「（情感）增強」、他動詞義「徵集」。"
  },
  {
    id: "n1-read-ayatsuru",
    surface: "操る",
    reading: "あやつる",
    meaningZh: "操縱、運用自如",
    promptText: "彼は四つの言語を自在に「操る」。",
    promptContextZh: "他能自如地運用四種語言。",
    expectedAnswer: "あやつる",
    options: ["あやつる", "そうる", "あつる", "みさおる"],
    explanation: "「操」訓讀「あやつ-る」→ あやつる。「そうる」是直接套音讀「そう」（如「操作」）的錯讀；「あつる」是縮短訓讀的造詞陷阱；「みさおる」是把名詞「操」（みさお＝節操）誤當動詞訓讀。"
  },
  {
    id: "n1-read-tainou",
    surface: "滞納",
    reading: "たいのう",
    meaningZh: "拖欠（費用）",
    promptText: "家賃の「滞納」が三ヶ月続いている。",
    promptContextZh: "房租已經拖欠了三個月。",
    expectedAnswer: "たいのう",
    options: ["たいのう", "とどこおりおさめ", "たいなん", "ちのう"],
    explanation: "「滞」音讀「たい」、「納」音讀「のう」→ たいのう。「とどこおりおさめ」是把兩字訓讀拼起來的陷阱；「たいなん」是「納」誤讀為「なん」；「ちのう」是「滞」誤讀為「ち」。注意 N1 也常考「滞る」的訓讀「とどこお-る」，是同字多音的典型。"
  },
  {
    id: "n1-read-tekkai",
    surface: "撤回",
    reading: "てっかい",
    meaningZh: "撤回、收回",
    promptText: "彼は前言を「撤回」した。",
    promptContextZh: "他撤回了之前說過的話。",
    expectedAnswer: "てっかい",
    options: ["てっかい", "てつかい", "ちょっかい", "てっき"],
    explanation: "「撤」音讀「てつ」＋ 「回」音讀「かい」，連音促音化後 → てっかい。「てつかい」是漏掉促音的錯讀；「ちょっかい」是不相關的常見詞（騷擾義）陷阱；「てっき」是「回」誤為「き」。"
  },
  {
    id: "n1-read-koumyou",
    surface: "巧妙",
    reading: "こうみょう",
    meaningZh: "巧妙、精巧",
    promptText: "犯人の「巧妙」な手口に警察は手を焼いている。",
    promptContextZh: "罪犯巧妙的手法讓警方很頭疼。",
    expectedAnswer: "こうみょう",
    options: ["こうみょう", "ぎょうみょう", "こうべん", "たくみょう"],
    explanation: "「巧」音讀「こう」＋ 「妙」音讀「みょう」→ こうみょう。「ぎょうみょう」是「巧」誤讀為「ぎょう」（字形相似的混淆）；「こうべん」是「妙」誤讀；「たくみょう」是「巧」混入訓讀「たくみ」（巧み）的錯讀。"
  },
  {
    id: "n1-read-katayoru",
    surface: "偏る",
    reading: "かたよらない",
    meaningZh: "偏向、不公平",
    promptText: "意見が一方に「偏らない」よう、複数の専門家に意見を聞いた。",
    promptContextZh: "為了不讓意見偏向一方，徵詢了多位專家的意見。",
    expectedAnswer: "かたよらない",
    options: ["かたよらない", "へんよらない", "かたまらない", "へんらない"],
    explanation: "「偏」訓讀「かたよ-る」→ かたよらない（ない形）。「へんよらない」是直接套音讀「へん」（如「偏見」）的錯讀；「かたまらない」是「固まらない」（凝固，訓讀接近但不同字）；「へんらない」是音讀＋無訓尾的陷阱。"
  },
  {
    id: "n1-read-sokonau",
    surface: "損なう",
    reading: "そこなう",
    meaningZh: "損害、未能...",
    promptText: "信頼を「損なう」ような行動は慎むべきだ。",
    promptContextZh: "應該避免做出損害信任的行為。",
    expectedAnswer: "そこなう",
    options: ["そこなう", "そんなう", "そこわす", "うしなう"],
    explanation: "「損」訓讀「そこ-なう」→ そこなう。「そんなう」是直接套音讀「そん」（如「損失」）的錯讀；「そこわす」是訓尾「なう」誤為「わす」；「うしなう」是「失う」（失去，同義字但不同字）。"
  },
  {
    id: "n1-read-shitau",
    surface: "慕う",
    reading: "したって",
    meaningZh: "敬慕、思慕",
    promptText: "彼は今でも亡き恩師を心から「慕って」いる。",
    promptContextZh: "他至今仍打從心底懷念已故的恩師。",
    expectedAnswer: "したって",
    options: ["したって", "ぼって", "おもって", "あがめって"],
    explanation: "「慕」訓讀「した-う」→ したって（て形）。「ぼって」是直接套音讀「ぼ」（如「思慕」）的錯讀；「おもって」是「思って」（不同字）；「あがめって」是把「崇める（あがめる）」混入的造詞陷阱。"
  },
  {
    id: "n1-read-ninau",
    surface: "担う",
    reading: "になう",
    meaningZh: "承擔（責任）",
    promptText: "若い世代が次の時代を「担う」のだ。",
    promptContextZh: "由年輕世代來承擔下一個時代。",
    expectedAnswer: "になう",
    options: ["になう", "かたぐう", "たんがう", "せおう"],
    explanation: "「担」訓讀「にな-う」→ になう。「かたぐう」是把「肩（かた）」混入的造詞陷阱；「たんがう」是直接套音讀「たん」（如「担当」）的錯讀；「せおう」是「背負う」（同義字但不同字）。"
  },
  {
    id: "n1-read-moukeru",
    surface: "設ける",
    reading: "もうける",
    meaningZh: "設立、設置",
    promptText: "新しい部署を社内に「設ける」予定だ。",
    promptContextZh: "預計在公司內部設立新部門。",
    expectedAnswer: "もうける",
    options: ["もうける", "せつける", "もとめる", "そなえる"],
    explanation: "「設」訓讀「もう-ける」→ もうける。「せつける」是直接套音讀「せつ」（如「設置」）的錯讀；「もとめる」是「求める」（不同字）；「そなえる」是「備える」（同義字但不同字）。注意同音字「儲ける」（賺錢）讀法相同但漢字不同。"
  },
  {
    id: "n1-read-hedataru",
    surface: "隔たる",
    reading: "へだたった",
    meaningZh: "相距、有差距",
    promptText: "故郷から遠く「隔たった」場所で暮らしている。",
    promptContextZh: "住在離故鄉很遠的地方。",
    expectedAnswer: "へだたった",
    options: ["へだたった", "へだてた", "へだまった", "かくたった"],
    explanation: "「隔」訓讀「へだ-たる」（自動詞）→ へだたった（た形）。「へだてた」是「隔てた」（他動詞「隔開」，訓讀對但語幹不同）；「へだまった」是訓尾誤；「かくたった」是直接套音讀「かく」（如「隔離」）的錯讀。「隔たる／隔てる」是自他成對動詞。"
  },
  {
    id: "n1-read-makanau",
    surface: "賄う",
    reading: "まかなって",
    meaningZh: "支付、籌措",
    promptText: "彼は奨学金で生活費を「賄って」いる。",
    promptContextZh: "他用獎學金來支付生活費。",
    expectedAnswer: "まかなって",
    options: ["まかなって", "わいろって", "おぎなって", "やしなって"],
    explanation: "「賄」訓讀「まかな-う」→ まかなって（て形）。「わいろって」是把「賄賂（わいろ）」當動詞訓讀的陷阱（賄賂是名詞）；「おぎなって」是「補って」（補足，同義字但不同字）；「やしなって」是「養って」（撫養，相關但不同字）。"
  },
  {
    id: "n1-read-ichijirushii",
    surface: "著しい",
    reading: "いちじるしい",
    meaningZh: "顯著的",
    promptText: "技術の進歩が「著しい」業界では、常に学び続ける必要がある。",
    promptContextZh: "在技術進步顯著的業界，必須持續學習。",
    expectedAnswer: "いちじるしい",
    options: ["いちじるしい", "ちょしい", "あらわしい", "めずらしい"],
    explanation: "「著」訓讀「いちじる-しい」→ いちじるしい。「ちょしい」是直接套音讀「ちょ」（如「著名」）的錯讀；「あらわしい」是把「著す（あらわす）」的訓讀套形容詞語尾的造詞錯誤；「めずらしい」是「珍しい」（不同字）。"
  },
  {
    id: "n1-read-sukoyaka",
    surface: "健やか",
    reading: "すこやか",
    meaningZh: "健康（地）",
    promptText: "子供たちは「健やか」に育っている。",
    promptContextZh: "孩子們健康地成長著。",
    expectedAnswer: "すこやか",
    options: ["すこやか", "けんやか", "けんこうやか", "おだやか"],
    explanation: "「健」訓讀「すこ-やか」→ すこやか。「けんやか」是直接套音讀「けん」（如「健康」）的錯讀；「けんこうやか」是把熟語「健康」拆出來再加訓尾的陷阱；「おだやか」是「穏やか」（不同字，平穩）。"
  },
  {
    id: "n1-read-azayaka",
    surface: "鮮やか",
    reading: "あざやか",
    meaningZh: "鮮豔的、鮮明的",
    promptText: "夕日が空を「鮮やか」に染めていた。",
    promptContextZh: "夕陽將天空染上了鮮豔的色彩。",
    expectedAnswer: "あざやか",
    options: ["あざやか", "せんやか", "あらやか", "つややか"],
    explanation: "「鮮」訓讀「あざ-やか」→ あざやか。「せんやか」是直接套音讀「せん」（如「新鮮」）的錯讀；「あらやか」是「新やか」式的造詞陷阱；「つややか」是「艶やか」（光澤，不同字）。"
  },
  {
    id: "n1-read-itsuwaru",
    surface: "偽る",
    reading: "いつわって",
    meaningZh: "偽造、欺騙",
    promptText: "経歴を「偽って」就職するのは犯罪だ。",
    promptContextZh: "偽造履歷去就職是犯罪行為。",
    expectedAnswer: "いつわって",
    options: ["いつわって", "ぎって", "うそって", "ぎぞうって"],
    explanation: "「偽」訓讀「いつわ-る」→ いつわって（て形）。「ぎって」是直接套音讀「ぎ」（如「偽物」）的錯讀；「うそって」是把名詞「嘘（うそ）」當動詞訓讀的陷阱；「ぎぞうって」是把熟語「偽造」拆出來的錯讀。"
  },
  {
    id: "n1-read-hazumu",
    surface: "弾む",
    reading: "はずんで",
    meaningZh: "彈起、（話題、心情）熱烈起來",
    promptText: "話が「弾んで」、つい時間を忘れてしまった。",
    promptContextZh: "聊得很起勁，不知不覺忘了時間。",
    expectedAnswer: "はずんで",
    options: ["はずんで", "だんで", "たまんで", "とんで"],
    explanation: "「弾」訓讀「はず-む」→ はずんで（て形）。「だんで」是直接套音讀「だん」（如「爆弾」）的錯讀；「たまんで」是把名詞「弾（たま＝彈丸）」當動詞訓讀的陷阱；「とんで」是「飛んで」（不同字）。注意「弾む」可接「話／ボール／体／心」等廣泛主語。"
  }
];

// Sanity-check uniqueness within the batch BEFORE touching the file.
{
  const ids = new Set();
  const surfaces = new Set();
  for (const it of ITEMS) {
    if (ids.has(it.id)) {
      console.error(`Duplicate id in batch: ${it.id}`);
      process.exit(1);
    }
    if (surfaces.has(it.surface)) {
      console.error(`Duplicate surface in batch: ${it.surface}`);
      process.exit(1);
    }
    if (!it.options.includes(it.expectedAnswer)) {
      console.error(`expectedAnswer not in options for ${it.id}`);
      process.exit(1);
    }
    ids.add(it.id);
    surfaces.add(it.surface);
  }
}

function fmt(s) {
  return JSON.stringify(s);
}

function block(item) {
  return [
    "  examQuestion({",
    `    id: ${fmt(item.id)},`,
    `    level: "N1",`,
    `    surface: ${fmt(item.surface)},`,
    `    reading: ${fmt(item.reading)},`,
    `    meaningZh: ${fmt(item.meaningZh)},`,
    `    promptLabel: "漢字読み",`,
    `    instructionZh: "選出底線詞語的正確讀音。",`,
    `    promptText: ${fmt(item.promptText)},`,
    `    promptContextZh: ${fmt(item.promptContextZh)},`,
    `    expectedAnswer: ${fmt(item.expectedAnswer)},`,
    `    exampleJapanese: ${fmt(item.promptText.replace(/「|」/g, ""))},`,
    `    exampleMeaningZh: ${fmt(item.promptContextZh)},`,
    `    options: ${JSON.stringify(item.options)},`,
    `    explanation: ${fmt(item.explanation)}`,
    "  })"
  ].join("\n");
}

// Anchor on the array-closing `];` boundary, regardless of which item
// happens to be the last entry. Same pattern as grammar batch 3.
const ANCHOR_REGEX = /\}\)(\r?\n)\];(\r?\n)(\r?\n)export function buildExamQuestionPool/;

let text = readFileSync(target, "utf8");
const match = text.match(ANCHOR_REGEX);
if (!match) {
  console.error(
    "Array-end anchor not found in examBlocks.ts. Has the array structure been " +
      "refactored? Update ANCHOR_REGEX or insert manually."
  );
  process.exit(1);
}
const eol = text.includes("\r\n") ? "\r\n" : "\n";
const newBlocks = ITEMS.map(block).join("," + eol).replace(/\n/g, eol);
const replacement = `})${eol}` + `,${eol}${newBlocks}${eol}];${eol}${eol}export function buildExamQuestionPool`;
text = text.replace(ANCHOR_REGEX, replacement);

writeFileSync(target, text, "utf8");
console.log(`Inserted ${ITEMS.length} new N1 漢字読み items into examBlocks.ts.`);
