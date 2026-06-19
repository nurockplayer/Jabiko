// Import reviewed candidates from
// docs/exam-public-practice-quality-review-and-batch-2.md.
//
// Review outcome (24 candidates -> 20 imported, 4 skipped):
//   文章脈絡: all 6 (もっとも/一方で/かえって repeat an existing connector
//     but in a different paragraph -> allowed per the duplicate policy;
//     とはいえ/したがって/なお are new). とはいえ's fake distractor
//     「一方なら」 was replaced with the real connector 「それどころか」.
//   文法形式選擇: 8 of 12. Skipped: そばから (dup of existing N1 item,
//     same 教/学->忘 test line) and -- to stay within the 6-8 cap and
//     keep the strongest -- を抜きにしては / に忍びない / ならでは.
//   語順組合: all 6. Existing bank already ships 14 same-shape items of
//     comparable option length, so the mobile-UI concern is satisfied.
//
// hintZh fixes (were leaking the answer's meaning pre-answer):
//   order ものを        遺憾 -> neutral
//   order ずにはすまない 必須 -> 該
//   order もさることながら「後者更…」-> neutral
//   grammar がてら       順帶 -> 一併
//
// ids: candidate- prefix dropped; order items renamed to n{1,2}-order-*
// to match the existing convention.
//
// Run: node scripts/add-exam-batch2-candidates.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "..", "src", "domain", "examBlocks.ts");

const TEXT = "短文脈絡：選能讓文章流向自然的接續表現。";
const GRAM = "句中填空：依文脈選最自然的文法。";
const ORDER = "語順組合：選語法正確且語意自然的句子。";

const ITEMS = [
  // ---- 文章脈絡 ----
  {
    id: "text-mottomo-shinseido", level: "N1", surface: "もっとも", reading: "もっとも",
    meaningZh: "話雖如此、不過", promptLabel: "文章脈絡", instructionZh: TEXT,
    promptText: "新制度により、申請手続きは大幅に簡略化された。利用者からも、以前より分かりやすいという声が多い。___、初回登録には本人確認が必要で、完全に時間がかからないわけではない。",
    promptContextZh: "先肯定新制度讓手續變簡單，再補充初次登錄仍需本人確認的限制。",
    hintZh: "制度改善後仍保留的一項補充條件。",
    expectedAnswer: "もっとも",
    options: ["もっとも", "したがって", "それどころか", "そのうえ"],
    explanation: "「もっとも」用來承認前文後補上限制或例外。「したがって」是結論；「それどころか」是強烈反轉；「そのうえ」是追加同方向資訊。"
  },
  {
    id: "text-towaie-chosa", level: "N1", surface: "とはいえ", reading: "とはいえ",
    meaningZh: "雖說如此", promptLabel: "文章脈絡", instructionZh: TEXT,
    promptText: "今回の調査では、回答率が前年より八ポイント上昇した。担当部署は改善の効果が出始めたと見ている。___、対象者全体の半数には届いておらず、結果の解釈には注意が必要だ。",
    promptContextZh: "回答率上升，但仍未達全體半數，因此解讀結果要小心。",
    hintZh: "正面數據後接一個仍需保留的判斷。",
    expectedAnswer: "とはいえ",
    options: ["とはいえ", "その結果", "まして", "それどころか"],
    explanation: "「とはいえ」承接前文正面內容，再提出保留或限制。「その結果」是因果結果；「まして」是遞進比較；「それどころか」是強烈反轉，與本句僅作保留的語氣不符。"
  },
  {
    id: "text-ippoude-online", level: "N2", surface: "一方で", reading: "いっぽうで",
    meaningZh: "另一方面", promptLabel: "文章脈絡", instructionZh: TEXT,
    promptText: "オンライン授業は、通学時間を減らせる点で学生の負担を軽くする。録画を見直せるため、復習もしやすい。___、学生同士が偶然に話す機会は生まれにくい。",
    promptContextZh: "線上課有便利的一面，但學生之間偶然交流的機會較少。",
    hintZh: "便利性後接另一面向的問題。",
    expectedAnswer: "一方で",
    options: ["一方で", "したがって", "それにしても", "なお"],
    explanation: "「一方で」對照同一主題的另一面。「したがって」是順接結論；「それにしても」是承認後的評價語氣；「なお」是補充，不形成明確對照。"
  },
  {
    id: "text-shitagatte-yosan", level: "N2", surface: "したがって", reading: "したがって",
    meaningZh: "因此", promptLabel: "文章脈絡", instructionZh: TEXT,
    promptText: "今年度の予算は、当初の見込みを下回ることが確実となった。新規事業に充てられる資金も限られている。___、各部署には計画の優先順位を見直してもらう必要がある。",
    promptContextZh: "因預算低於預期且新事業資金有限，因此需要各部門重新檢討計畫優先順序。",
    hintZh: "前面的條件導向後面的管理判斷。",
    expectedAnswer: "したがって",
    options: ["したがって", "ところが", "もっとも", "その一方で"],
    explanation: "「したがって」表示由前文條件自然導出的結論。「ところが」是反轉；「もっとも」是補充限制；「その一方で」是對照另一面。"
  },
  {
    id: "text-nao-password", level: "N2", surface: "なお", reading: "なお",
    meaningZh: "此外、另外", promptLabel: "文章脈絡", instructionZh: TEXT,
    promptText: "会場では無料のWi-Fiをご利用いただけます。接続が不安定な場合は、近くのスタッフまでお声がけください。___、パスワードは当日受付でお渡しする資料に記載されています。",
    promptContextZh: "說明會場 Wi-Fi 與協助方式後，補充密碼位置。",
    hintZh: "服務說明後補充另一個實務資訊。",
    expectedAnswer: "なお",
    options: ["なお", "ところが", "それにもかかわらず", "そのため"],
    explanation: "「なお」用於公告或說明中的補充資訊。「ところが」是轉折；「それにもかかわらず」是逆接；「そのため」是原因結果。"
  },
  {
    id: "text-kaette-shiryo", level: "N1", surface: "かえって", reading: "かえって",
    meaningZh: "反而", promptLabel: "文章脈絡", instructionZh: TEXT,
    promptText: "説明を丁寧にしようとして、担当者は資料に多くの補足を加えた。情報量は増えたものの、中心となる論点が見えにくくなった。___、参加者からは「前より分かりにくい」との声も出た。",
    promptContextZh: "原本想讓說明更丁寧，結果反而讓重點更不清楚。",
    hintZh: "改善意圖與實際效果之間出現落差。",
    expectedAnswer: "かえって",
    options: ["かえって", "したがって", "加えて", "同時に"],
    explanation: "「かえって」表示結果與原本意圖或預期相反。「したがって」是順向結論；「加えて」是追加同方向資訊；「同時に」表示並行。"
  },

  // ---- 文法形式選擇 ----
  {
    id: "n2-grammar-wotoiwazu-boshu", level: "N2", surface: "を問わず", reading: "をとわず",
    meaningZh: "不論、不問", promptLabel: "文法形式選擇", instructionZh: GRAM,
    promptText: "経験の有無 ___、この研修にはどなたでも申し込めます。",
    promptContextZh: "不論是否有經驗，任何人都可以報名這項研修。",
    hintZh: "研修報名條件與經驗有無的關係。",
    expectedAnswer: "を問わず",
    options: ["を問わず", "をはじめ", "を通じて", "をもとに"],
    explanation: "「Nを問わず」表示不以 N 的差異作為限制。「をはじめ」是列舉起點；「を通じて」是透過或整段期間；「をもとに」是以資料或事實為基礎。"
  },
  {
    id: "n2-grammar-nikagirazu-shimin", level: "N2", surface: "に限らず", reading: "にかぎらず",
    meaningZh: "不限於...", promptLabel: "文法形式選擇", instructionZh: GRAM,
    promptText: "学生 ___、社会人にもこの図書館の利用を広げる方針だ。",
    promptContextZh: "方針是不只學生，也把圖書館使用對象擴大到社會人士。",
    hintZh: "圖書館使用對象的擴大。",
    expectedAnswer: "に限らず",
    options: ["に限らず", "に限って", "に限り", "に応じて"],
    explanation: "「Aに限らずBも」表示不限於 A，B 也包含在內。「に限って」是偏偏／唯有；「に限り」是限定條件；「に応じて」是依照差異調整。"
  },
  {
    id: "n2-grammar-kaneru-kojinjoho", level: "N2", surface: "かねる", reading: "かねる",
    meaningZh: "難以、無法", promptLabel: "文法形式選擇", instructionZh: GRAM,
    promptText: "個人情報に関わるため、その件についてはお答え ___。",
    promptContextZh: "因為涉及個人資料，關於那件事無法回答。",
    hintZh: "客服或窗口對敏感資訊的回覆方式。",
    expectedAnswer: "しかねます",
    options: ["しかねます", "しかねません", "しきれます", "しがたいです"],
    explanation: "「Vます形 + かねる」是正式語氣的「難以／無法」，常用於婉拒。「しかねません」是「可能會做出不利行為」的危險可能；「しきれる」是做完；「しがたい」可表示難以，但本句固定客服語氣是「お答えしかねます」。"
  },
  {
    id: "n2-grammar-wokeikini-ryugaku", level: "N2", surface: "を契機に", reading: "をけいきに",
    meaningZh: "以...為契機", promptLabel: "文法形式選擇", instructionZh: GRAM,
    promptText: "短期留学 ___、彼は日本語教育に強い関心を持つようになった。",
    promptContextZh: "以短期留學為契機，他開始對日語教育產生強烈興趣。",
    hintZh: "某次經驗成為後續興趣形成的轉折點。",
    expectedAnswer: "を契機に",
    options: ["を契機に", "をめぐって", "を問わず", "を通じて"],
    explanation: "「Nを契機に」表示 N 成為後續變化的觸發點。「をめぐって」是圍繞爭議或議題；「を問わず」是不論；「を通じて」是透過手段或期間。"
  },
  {
    id: "n1-grammar-womonotomosezu-kenshu", level: "N1", surface: "をものともせず", reading: "をものともせず",
    meaningZh: "不把...當回事、不畏...", promptLabel: "文法形式選擇", instructionZh: GRAM,
    promptText: "彼女は周囲の反対 ___、新しい研修制度の導入を進めた。",
    promptContextZh: "她不畏周遭反對，推動導入新的研修制度。",
    hintZh: "面對阻力仍持續推動制度。",
    expectedAnswer: "をものともせず",
    options: ["をものともせず", "を余儀なくされ", "を抜きにして", "をめぐって"],
    explanation: "「Nをものともせず」表示不把困難或反對當阻礙。「を余儀なくされ」是被迫；「を抜きにして」是不考慮；「をめぐって」是圍繞議題產生爭論。"
  },
  {
    id: "n1-grammar-wokinjienai-hodo", level: "N1", surface: "を禁じ得ない", reading: "をきんじえない",
    meaningZh: "不禁...", promptLabel: "文法形式選擇", instructionZh: GRAM,
    promptText: "資料の改ざんが明らかになり、関係者への不信感 ___。",
    promptContextZh: "資料竄改被揭露後，不禁對相關人士產生不信任。",
    hintZh: "事件曝光後自然浮現的強烈感受。",
    expectedAnswer: "を禁じ得ない",
    options: ["を禁じ得ない", "を余儀なくされる", "にたえない", "にかたくない"],
    explanation: "「感情名詞 + を禁じ得ない」表示無法抑制某種感情。「を余儀なくされる」是被迫做某事；「にたえない」多接評價或情感如感謝／遺憾；「にかたくない」表示不難想像。"
  },
  {
    id: "n1-grammar-gatera-shisatsu", level: "N1", surface: "がてら", reading: "がてら",
    meaningZh: "順便、兼做...", promptLabel: "文法形式選擇", instructionZh: GRAM,
    promptText: "市場調査 ___、競合店の接客方法も見て回ることにした。",
    promptContextZh: "做市場調查的同時，也順便去觀察競爭店家的接客服務。",
    hintZh: "做主要工作時一併進行的另一件事。",
    expectedAnswer: "がてら",
    options: ["がてら", "かたがた", "かたわら", "ついでに"],
    explanation: "「N/Vます形 + がてら」表示做主要動作時順便做另一件事。「かたがた」較正式，多用於拜訪、寒暄、致謝等；「かたわら」表示一邊從事長期活動一邊做另一件長期活動；「ついでに」語氣較口語，不接在名詞後形成此句。"
  },
  {
    id: "n1-grammar-towa-happyo", level: "N1", surface: "とは", reading: "とは",
    meaningZh: "竟然、居然", promptLabel: "文法形式選擇", instructionZh: GRAM,
    promptText: "長年の研究成果を、発表直前に撤回する ___、誰も予想していなかった。",
    promptContextZh: "居然在發表前夕撤回長年研究成果，誰也沒想到。",
    hintZh: "出乎眾人預料的決定。",
    expectedAnswer: "とは",
    options: ["とは", "なら", "とあって", "からには"],
    explanation: "句末前的「とは」表示驚訝或意外。「なら」是假設或承接話題；「とあって」表示因特殊情況而自然導致結果；「からには」表示既然如此就應該。"
  },

  // ---- 語順組合 ----
  {
    id: "n1-order-monowo-sodan", level: "N1", surface: "ものを", reading: "ものを",
    meaningZh: "明明...卻...（遺憾）", promptLabel: "語順組合", instructionZh: ORDER,
    promptText: "［一言 / 相談してくれれば / 手伝えた / ものを］",
    promptContextZh: "明明只要先說一聲就能幫忙，卻沒有這麼做，帶有遺憾。",
    hintZh: "對方沒有事先商量這件事。",
    expectedAnswer: "一言相談してくれれば手伝えたものを",
    options: [
      "一言相談してくれれば手伝えたものを",
      "手伝えた一言相談してくれればものを",
      "ものを一言相談してくれれば手伝えた",
      "一言ものを相談してくれれば手伝えた"
    ],
    explanation: "「〜ば〜たものを」表示如果當時那樣做就好了的遺憾。「相談してくれれば」形成條件，「手伝えた」是反事實結果，「ものを」放在句末。"
  },
  {
    id: "n2-order-naikotoniwa-genba", level: "N2", surface: "ないことには", reading: "ないことには",
    meaningZh: "若不...就無法...", promptLabel: "語順組合", instructionZh: ORDER,
    promptText: "［現場の状況を / 確認しないことには / 原因を / 判断できない］",
    promptContextZh: "若不確認現場狀況，就無法判斷原因。",
    hintZh: "判斷前需要完成的確認動作。",
    expectedAnswer: "現場の状況を確認しないことには原因を判断できない",
    options: [
      "現場の状況を確認しないことには原因を判断できない",
      "原因を確認しないことには現場の状況を判断できない",
      "確認しないことには現場の状況を原因を判断できない",
      "現場の状況を判断できない原因を確認しないことには"
    ],
    explanation: "「Vないことには〜できない」是必要條件。先形成「現場の状況を確認しないことには」，再接無法做的判斷「原因を判断できない」。"
  },
  {
    id: "n1-order-mosarukotonagara-eiga", level: "N1", surface: "もさることながら", reading: "もさることながら",
    meaningZh: "...固然如此，...更是", promptLabel: "語順組合", instructionZh: ORDER,
    promptText: "［この映画は / 映像美もさることながら / 音楽の使い方が / すばらしい］",
    promptContextZh: "這部電影的影像美固然出色，音樂運用更值得稱讚。",
    hintZh: "從兩個面向評價這部電影。",
    expectedAnswer: "この映画は映像美もさることながら音楽の使い方がすばらしい",
    options: [
      "この映画は映像美もさることながら音楽の使い方がすばらしい",
      "映像美もさることながらこの映画はすばらしい音楽の使い方が",
      "この映画は音楽の使い方が映像美もさることながらすばらしい",
      "すばらしいこの映画は映像美もさることながら音楽の使い方が"
    ],
    explanation: "「AもさることながらB」表示 A 固然如此，但 B 更值得注意。主語後接 A，再接 B 的評價句。"
  },
  {
    id: "n1-order-niitattewa-bucho", level: "N1", surface: "に至っては", reading: "にいたっては",
    meaningZh: "至於...更是...", promptLabel: "語順組合", instructionZh: ORDER,
    promptText: "［部長に至っては / 会議の存在すら / 知らなかった / という］",
    promptContextZh: "至於部長，甚至連會議的存在都不知道。",
    hintZh: "舉出最極端的一方來凸顯狀況。",
    expectedAnswer: "部長に至っては会議の存在すら知らなかったという",
    options: [
      "部長に至っては会議の存在すら知らなかったという",
      "会議の存在すら部長に至ってはという知らなかった",
      "知らなかったという部長に至っては会議の存在すら",
      "部長に至っては知らなかった会議の存在すらという"
    ],
    explanation: "「Nに至っては」舉出極端例子，後面常接「すら／まで」。本句先提出「部長」，再說「会議の存在すら知らなかった」。"
  },
  {
    id: "n1-order-zunihasumanai-shazai", level: "N1", surface: "ずにはすまない", reading: "ずにはすまない",
    meaningZh: "不...不行、必須...", promptLabel: "語順組合", instructionZh: ORDER,
    promptText: "［不手際が / あった以上 / 謝罪せずには / すまない］",
    promptContextZh: "既然有疏失，就不能不道歉。",
    hintZh: "發生疏失後該採取的回應。",
    expectedAnswer: "不手際があった以上謝罪せずにはすまない",
    options: [
      "不手際があった以上謝罪せずにはすまない",
      "謝罪せずには不手際があった以上すまない",
      "不手際がすまないあった以上謝罪せずには",
      "あった以上謝罪せずには不手際がすまない"
    ],
    explanation: "「Vずにはすまない」表示因責任或情理上不得不做。「不手際があった以上」先提出理由，再接「謝罪せずにはすまない」。"
  },
  {
    id: "n1-order-wooite-haiyaku", level: "N1", surface: "をおいて", reading: "をおいて",
    meaningZh: "除了...之外沒有...", promptLabel: "語順組合", instructionZh: ORDER,
    promptText: "［この役を / 任せられる人は / 彼をおいて / ほかにいない］",
    promptContextZh: "能託付這個角色的人，除了他以外沒有別人。",
    hintZh: "強調最適合的人選。",
    expectedAnswer: "この役を任せられる人は彼をおいてほかにいない",
    options: [
      "この役を任せられる人は彼をおいてほかにいない",
      "彼をおいてこの役をほかにいない任せられる人は",
      "ほかにいないこの役を任せられる人は彼をおいて",
      "この役を彼をおいて任せられる人はほかにいない"
    ],
    explanation: "「Nをおいてほかにない／いない」是固定型，表示除了 N 之外沒有合適對象。先說條件「この役を任せられる人は」，再接「彼をおいてほかにいない」。"
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
    `    promptLabel: ${fmt(item.promptLabel)},`,
    `    instructionZh: ${fmt(item.instructionZh)},`,
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
console.log(`Imported ${ITEMS.length} batch-2 candidates (6 text / 8 grammar / 6 order).`);
