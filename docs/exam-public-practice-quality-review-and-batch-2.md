# Exam Public Practice Quality Review And Batch 2

Created: 2026-06-19

Purpose: prepare Jabiko's exam-style question bank for frequent personal
practice and possible public sharing. This file is docs-only: review, source
policy, import criteria, and a second batch of original candidate questions.

## Current State

- Guard result at import time: `303 exam entries; 0 problem(s)` (was 271 before this batch).
- Current focus is correctly centered on N1/N2, with only a small N3 warm-up
  presence.
- Visible `promptLabel` values no longer expose N1/N2/N3.
- Existing coverage is now broad enough that new work should prefer:
  - variant questions for high-value grammar points,
  - stronger distractor families,
  - more text-grammar paragraphs,
  - sentence-composition items that test phrase order, not only obvious word
    order.

## Public-Sharing Quality Bar

Before a question is imported into `src/domain/examBlocks.ts`, it should pass
all of these:

- The Japanese stem is original and not a translated or lightly modified public
  question.
- `promptLabel` contains only the item type, never a visible level.
- `hintZh` describes the situation without naming the target relation such as
  purpose, concession, obligation, negative possibility, contrast, or cause.
- The correct answer is the only best answer in context.
- All four options are real grammar expressions or real discourse markers.
- At least two distractors are close enough in grammar family, register, or
  semantic neighborhood to tempt an N1/N2 learner.
- The item is not solved only by connection shape unless connection itself is
  the intended skill.
- Explanation contrasts the correct answer with each wrong option.
- Repeated grammar points are allowed when they test a different cue,
  different domain, or different distractor family.

## Duplicate Policy

Do not reject a candidate only because the same `surface` already exists.

Accept a repeated `surface` when it is one of these:

- a different real-world domain, e.g. company policy vs. research report;
- a different semantic cue, e.g. external compulsion vs. personal duty;
- a different distractor family, e.g. causality family vs. concession family;
- a different item type, e.g. form selection vs. text grammar vs. sentence
  composition.

Reject or rewrite a repeated `surface` when it has the same test line:

- same scenario;
- same blank position;
- same correct-answer cue;
- same distractor logic;
- same explanation with minor noun swaps.

## Sources Used For Coverage Only

These sources were used to confirm item types, coverage areas, and common
grammar families. Do not copy stems, examples, options, or explanations from
them.

- JLPT item composition:
  https://www.jlpt.jp/e/guideline/testsections.html
- JLPT official practice workbook index and copyright note:
  https://www.jlpt.jp/e/samples/sampleindex.html
- JLPT N1 item purposes:
  https://www.jlpt.jp/e/guideline/pdf/n1_e_revised.pdf
- JLPT N2 item purposes:
  https://www.jlpt.jp/e/guideline/pdf/n2_e.pdf
- JLPT Sensei N1 grammar coverage:
  https://jlptsensei.com/jlpt-n1-grammar-list/
- JLPT Sensei N2 grammar coverage:
  https://jlptsensei.com/jlpt-n2-grammar-list/
- 日本語NET grammar coverage:
  https://nihongokyoshi-net.com/jlpt-grammars/

## Import Guidance For Claude

Review these candidates before importing. The goal is not to add all 24
blindly. Import only the items that remain unambiguous after review.

When importing:

- Rename `candidate-...` IDs to formal IDs.
- Keep internal `level`, but do not expose it in `promptLabel`.
- Keep `promptContextZh` as translation/explanation after answering.
- Keep `hintZh` neutral before answering.
- Run:

```bash
node scripts/check-exam-options.mjs
corepack pnpm test
corepack pnpm build
```

## Candidate Batch 2

### 文法形式選擇

```ts
examQuestion({
  id: "candidate-n2-grammar-nukinishitewa-hiyou",
  level: "N2",
  surface: "を抜きにしては",
  reading: "をぬきにしては",
  meaningZh: "若不考慮...就無法...",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "費用の問題 ___、この計画を現実的に進めることはできない。",
  promptContextZh: "若不考慮費用問題，就無法務實推進這項計畫。",
  hintZh: "計畫推進時不能忽略的前提條件。",
  expectedAnswer: "を抜きにしては",
  options: ["を抜きにしては", "をもとにしては", "をめぐっては", "をこめては"],
  explanation: "「Nを抜きにしては〜できない」表示「不把 N 納入考量就無法...」。「をもとにしては」表示以 N 為基礎；「をめぐっては」表示圍繞議題；「をこめては」表示注入情感或心意，都不符合本句的必要前提。"
})

examQuestion({
  id: "candidate-n2-grammar-wotoiwazu-boshu",
  level: "N2",
  surface: "を問わず",
  reading: "をとわず",
  meaningZh: "不論、不問",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "経験の有無 ___、この研修にはどなたでも申し込めます。",
  promptContextZh: "不論是否有經驗，任何人都可以報名這項研修。",
  hintZh: "研修報名條件與經驗有無的關係。",
  expectedAnswer: "を問わず",
  options: ["を問わず", "をはじめ", "を通じて", "をもとに"],
  explanation: "「Nを問わず」表示不以 N 的差異作為限制。「をはじめ」是列舉起點；「を通じて」是透過或整段期間；「をもとに」是以資料或事實為基礎。"
})

examQuestion({
  id: "candidate-n2-grammar-nikagirazu-shimin",
  level: "N2",
  surface: "に限らず",
  reading: "にかぎらず",
  meaningZh: "不限於...",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "学生 ___、社会人にもこの図書館の利用を広げる方針だ。",
  promptContextZh: "方針是不只學生，也把圖書館使用對象擴大到社會人士。",
  hintZh: "圖書館使用對象的擴大。",
  expectedAnswer: "に限らず",
  options: ["に限らず", "に限って", "に限り", "に応じて"],
  explanation: "「Aに限らずBも」表示不限於 A，B 也包含在內。「に限って」是偏偏／唯有；「に限り」是限定條件；「に応じて」是依照差異調整。"
})

examQuestion({
  id: "candidate-n2-grammar-kaneru-kojinjoho",
  level: "N2",
  surface: "かねる",
  reading: "かねる",
  meaningZh: "難以、無法",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "個人情報に関わるため、その件についてはお答え ___。",
  promptContextZh: "因為涉及個人資料，關於那件事無法回答。",
  hintZh: "客服或窗口對敏感資訊的回覆方式。",
  expectedAnswer: "しかねます",
  options: ["しかねます", "しかねません", "しきれます", "しがたいです"],
  explanation: "「Vます形 + かねる」是正式語氣的「難以／無法」，常用於婉拒。「しかねません」是「可能會做出不利行為」的危險可能；「しきれる」是做完；「しがたい」可表示難以，但本句固定客服語氣是「お答えしかねます」。"
})

examQuestion({
  id: "candidate-n2-grammar-wokeikini-ryugaku",
  level: "N2",
  surface: "を契機に",
  reading: "をけいきに",
  meaningZh: "以...為契機",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "短期留学 ___、彼は日本語教育に強い関心を持つようになった。",
  promptContextZh: "以短期留學為契機，他開始對日語教育產生強烈興趣。",
  hintZh: "某次經驗成為後續興趣形成的轉折點。",
  expectedAnswer: "を契機に",
  options: ["を契機に", "をめぐって", "を問わず", "を通じて"],
  explanation: "「Nを契機に」表示 N 成為後續變化的觸發點。「をめぐって」是圍繞爭議或議題；「を問わず」是不論；「を通じて」是透過手段或期間。"
})

examQuestion({
  id: "candidate-n2-grammar-sobakara-memo",
  level: "N2",
  surface: "そばから",
  reading: "そばから",
  meaningZh: "剛...就...",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "新人は、手順を教える ___ メモを取る前に忘れてしまうので、何度も確認が必要だ。",
  promptContextZh: "那位新人常常剛教完步驟，還沒記下來就忘了，所以需要反覆確認。",
  hintZh: "教學後立刻又回到原點的反覆情況。",
  expectedAnswer: "そばから",
  options: ["そばから", "たびに", "次第", "末に"],
  explanation: "「Vる／Vたそばから」表示剛做完就又發生某事，常帶反覆或徒勞感。「たびに」只是每次，不必然有剛做完就被抵消的語感；「次第」要接 Vます形，表示一完成就做下一步；「末に」是經過長時間後。"
})

examQuestion({
  id: "candidate-n1-grammar-womonotomosezu-kenshu",
  level: "N1",
  surface: "をものともせず",
  reading: "をものともせず",
  meaningZh: "不把...當回事、不畏...",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "彼女は周囲の反対 ___、新しい研修制度の導入を進めた。",
  promptContextZh: "她不畏周遭反對，推動導入新的研修制度。",
  hintZh: "面對阻力仍持續推動制度。",
  expectedAnswer: "をものともせず",
  options: ["をものともせず", "を余儀なくされ", "を抜きにして", "をめぐって"],
  explanation: "「Nをものともせず」表示不把困難或反對當阻礙。「を余儀なくされ」是被迫；「を抜きにして」是不考慮；「をめぐって」是圍繞議題產生爭論。"
})

examQuestion({
  id: "candidate-n1-grammar-wo-kinjienai-hodo",
  level: "N1",
  surface: "を禁じ得ない",
  reading: "をきんじえない",
  meaningZh: "不禁...",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "資料の改ざんが明らかになり、関係者への不信感 ___。",
  promptContextZh: "資料竄改被揭露後，不禁對相關人士產生不信任。",
  hintZh: "事件曝光後自然浮現的強烈感受。",
  expectedAnswer: "を禁じ得ない",
  options: ["を禁じ得ない", "を余儀なくされる", "にたえない", "にかたくない"],
  explanation: "「感情名詞 + を禁じ得ない」表示無法抑制某種感情。「を余儀なくされる」是被迫做某事；「にたえない」多接評價或情感如感謝／遺憾；「にかたくない」表示不難想像。"
})

examQuestion({
  id: "candidate-n1-grammar-nishinobinai-kokuchi",
  level: "N1",
  surface: "に忍びない",
  reading: "にしのびない",
  meaningZh: "不忍心...",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "彼の努力を思うと、この結果をそのまま本人に伝える ___。",
  promptContextZh: "想到他的努力，就不忍心把這個結果原封不動地告訴本人。",
  hintZh: "顧及對方努力後，對告知方式產生猶豫。",
  expectedAnswer: "に忍びない",
  options: ["に忍びない", "には及ばない", "にほかならない", "に越したことはない"],
  explanation: "「Vるに忍びない」表示心理上不忍做某事。「には及ばない」是不必；「にほかならない」是正是；「に越したことはない」是最好不過。"
})

examQuestion({
  id: "candidate-n1-grammar-naradewano-shinise",
  level: "N1",
  surface: "ならでは",
  reading: "ならでは",
  meaningZh: "唯有...才有的",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "老舗旅館 ___、細部まで行き届いたもてなしが高く評価されている。",
  promptContextZh: "老字號旅館特有的細緻款待受到高度評價。",
  hintZh: "某類店家獨有的服務特色。",
  expectedAnswer: "ならではの",
  options: ["ならではの", "にしては", "をおいての", "だけに"],
  explanation: "「Nならではの」表示只有 N 才具備的特色。「にしては」是以某標準來說；「をおいて」是除了某人事物之外沒有別的，通常接否定或「ほかにない」；「だけに」是正因為。"
})

examQuestion({
  id: "candidate-n1-grammar-gatera-shisatsu",
  level: "N1",
  surface: "がてら",
  reading: "がてら",
  meaningZh: "順便、兼做...",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "市場調査 ___、競合店の接客方法も見て回ることにした。",
  promptContextZh: "做市場調查的同時，也順便去觀察競爭店家的接客服務。",
  hintZh: "主要目的之外，順帶完成另一項觀察。",
  expectedAnswer: "がてら",
  options: ["がてら", "かたがた", "かたわら", "ついでに"],
  explanation: "「N/Vます形 + がてら」表示做主要動作時順便做另一件事。「かたがた」較正式，多用於拜訪、寒暄、致謝等；「かたわら」表示一邊從事長期活動一邊做另一件長期活動；「ついでに」語氣較口語，不接在名詞後形成此句。"
})

examQuestion({
  id: "candidate-n1-grammar-towa-happyo",
  level: "N1",
  surface: "とは",
  reading: "とは",
  meaningZh: "竟然、居然",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "長年の研究成果を、発表直前に撤回する ___、誰も予想していなかった。",
  promptContextZh: "居然在發表前夕撤回長年研究成果，誰也沒想到。",
  hintZh: "出乎眾人預料的決定。",
  expectedAnswer: "とは",
  options: ["とは", "なら", "とあって", "からには"],
  explanation: "句末前的「とは」表示驚訝或意外。「なら」是假設或承接話題；「とあって」表示因特殊情況而自然導致結果；「からには」表示既然如此就應該。"
})
```

### 文章脈絡

```ts
examQuestion({
  id: "candidate-text-mottomo-shinseido",
  level: "N1",
  surface: "もっとも",
  reading: "もっとも",
  meaningZh: "話雖如此、不過",
  promptLabel: "文章脈絡",
  instructionZh: "短文脈絡：選能讓文章流向自然的接續表現。",
  promptText: "新制度により、申請手続きは大幅に簡略化された。利用者からも、以前より分かりやすいという声が多い。___、初回登録には本人確認が必要で、完全に時間がかからないわけではない。",
  promptContextZh: "先肯定新制度讓手續變簡單，再補充初次登錄仍需本人確認的限制。",
  hintZh: "制度改善後仍保留的一項補充條件。",
  expectedAnswer: "もっとも",
  options: ["もっとも", "したがって", "それどころか", "そのうえ"],
  explanation: "「もっとも」用來承認前文後補上限制或例外。「したがって」是結論；「それどころか」是強烈反轉；「そのうえ」是追加同方向資訊。"
})

examQuestion({
  id: "candidate-text-towaie-chosa",
  level: "N1",
  surface: "とはいえ",
  reading: "とはいえ",
  meaningZh: "雖說如此",
  promptLabel: "文章脈絡",
  instructionZh: "短文脈絡：選能讓文章流向自然的接續表現。",
  promptText: "今回の調査では、回答率が前年より八ポイント上昇した。担当部署は改善の効果が出始めたと見ている。___、対象者全体の半数には届いておらず、結果の解釈には注意が必要だ。",
  promptContextZh: "回答率上升，但仍未達全體半數，因此解讀結果要小心。",
  hintZh: "正面數據後接一個仍需保留的判斷。",
  expectedAnswer: "とはいえ",
  options: ["とはいえ", "その結果", "まして", "一方なら"],
  explanation: "「とはいえ」承接前文正面內容，再提出保留或限制。「その結果」是因果結果；「まして」是遞進比較；「一方なら」不是自然的接續表現。"
})

examQuestion({
  id: "candidate-text-ippoude-online",
  level: "N2",
  surface: "一方で",
  reading: "いっぽうで",
  meaningZh: "另一方面",
  promptLabel: "文章脈絡",
  instructionZh: "短文脈絡：選能讓文章流向自然的接續表現。",
  promptText: "オンライン授業は、通学時間を減らせる点で学生の負担を軽くする。録画を見直せるため、復習もしやすい。___、学生同士が偶然に話す機会は生まれにくい。",
  promptContextZh: "線上課有便利的一面，但學生之間偶然交流的機會較少。",
  hintZh: "便利性後接另一面向的問題。",
  expectedAnswer: "一方で",
  options: ["一方で", "したがって", "それにしても", "なお"],
  explanation: "「一方で」對照同一主題的另一面。「したがって」是順接結論；「それにしても」是承認後的評價語氣；「なお」是補充，不形成明確對照。"
})

examQuestion({
  id: "candidate-text-shitagatte-yosan",
  level: "N2",
  surface: "したがって",
  reading: "したがって",
  meaningZh: "因此",
  promptLabel: "文章脈絡",
  instructionZh: "短文脈絡：選能讓文章流向自然的接續表現。",
  promptText: "今年度の予算は、当初の見込みを下回ることが確実となった。新規事業に充てられる資金も限られている。___、各部署には計画の優先順位を見直してもらう必要がある。",
  promptContextZh: "因預算低於預期且新事業資金有限，因此需要各部門重新檢討計畫優先順序。",
  hintZh: "前面的條件導向後面的管理判斷。",
  expectedAnswer: "したがって",
  options: ["したがって", "ところが", "もっとも", "その一方で"],
  explanation: "「したがって」表示由前文條件自然導出的結論。「ところが」是反轉；「もっとも」是補充限制；「その一方で」是對照另一面。"
})

examQuestion({
  id: "candidate-text-nao-password",
  level: "N2",
  surface: "なお",
  reading: "なお",
  meaningZh: "此外、另外",
  promptLabel: "文章脈絡",
  instructionZh: "短文脈絡：選能讓文章流向自然的接續表現。",
  promptText: "会場では無料のWi-Fiをご利用いただけます。接続が不安定な場合は、近くのスタッフまでお声がけください。___、パスワードは当日受付でお渡しする資料に記載されています。",
  promptContextZh: "說明會場 Wi-Fi 與協助方式後，補充密碼位置。",
  hintZh: "服務說明後補充另一個實務資訊。",
  expectedAnswer: "なお",
  options: ["なお", "ところが", "それにもかかわらず", "そのため"],
  explanation: "「なお」用於公告或說明中的補充資訊。「ところが」是轉折；「それにもかかわらず」是逆接；「そのため」是原因結果。"
})

examQuestion({
  id: "candidate-text-kaette-shiryo",
  level: "N1",
  surface: "かえって",
  reading: "かえって",
  meaningZh: "反而",
  promptLabel: "文章脈絡",
  instructionZh: "短文脈絡：選能讓文章流向自然的接續表現。",
  promptText: "説明を丁寧にしようとして、担当者は資料に多くの補足を加えた。情報量は増えたものの、中心となる論点が見えにくくなった。___、参加者からは「前より分かりにくい」との声も出た。",
  promptContextZh: "原本想讓說明更丁寧，結果反而讓重點更不清楚。",
  hintZh: "改善意圖與實際效果之間出現落差。",
  expectedAnswer: "かえって",
  options: ["かえって", "したがって", "加えて", "同時に"],
  explanation: "「かえって」表示結果與原本意圖或預期相反。「したがって」是順向結論；「加えて」是追加同方向資訊；「同時に」表示並行。"
})
```

### 語順組合

```ts
examQuestion({
  id: "candidate-order-monowo-sodan",
  level: "N1",
  surface: "ものを",
  reading: "ものを",
  meaningZh: "明明...卻...（遺憾）",
  promptLabel: "語順組合",
  instructionZh: "語順組合：選語法正確且語意自然的句子。",
  promptText: "［一言 / 相談してくれれば / 手伝えた / ものを］",
  promptContextZh: "明明只要先說一聲就能幫忙，卻沒有這麼做，帶有遺憾。",
  hintZh: "對方沒有事先商量而產生的遺憾。",
  expectedAnswer: "一言相談してくれれば手伝えたものを",
  options: [
    "一言相談してくれれば手伝えたものを",
    "手伝えた一言相談してくれればものを",
    "ものを一言相談してくれれば手伝えた",
    "一言ものを相談してくれれば手伝えた"
  ],
  explanation: "「〜ば〜たものを」表示如果當時那樣做就好了的遺憾。「相談してくれれば」形成條件，「手伝えた」是反事實結果，「ものを」放在句末。"
})

examQuestion({
  id: "candidate-order-naikotoniwa-genba",
  level: "N2",
  surface: "ないことには",
  reading: "ないことには",
  meaningZh: "若不...就無法...",
  promptLabel: "語順組合",
  instructionZh: "語順組合：選語法正確且語意自然的句子。",
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
})

examQuestion({
  id: "candidate-order-mosarukotonagara-eiga",
  level: "N1",
  surface: "もさることながら",
  reading: "もさることながら",
  meaningZh: "...固然如此，...更是",
  promptLabel: "語順組合",
  instructionZh: "語順組合：選語法正確且語意自然的句子。",
  promptText: "［この映画は / 映像美もさることながら / 音楽の使い方が / すばらしい］",
  promptContextZh: "這部電影的影像美固然出色，音樂運用更值得稱讚。",
  hintZh: "兩個優點中，後者更被凸顯。",
  expectedAnswer: "この映画は映像美もさることながら音楽の使い方がすばらしい",
  options: [
    "この映画は映像美もさることながら音楽の使い方がすばらしい",
    "映像美もさることながらこの映画はすばらしい音楽の使い方が",
    "この映画は音楽の使い方が映像美もさることながらすばらしい",
    "すばらしいこの映画は映像美もさることながら音楽の使い方が"
  ],
  explanation: "「AもさることながらB」表示 A 固然如此，但 B 更值得注意。主語後接 A，再接 B 的評價句。"
})

examQuestion({
  id: "candidate-order-niitattewa-bucho",
  level: "N1",
  surface: "に至っては",
  reading: "にいたっては",
  meaningZh: "至於...更是...",
  promptLabel: "語順組合",
  instructionZh: "語順組合：選語法正確且語意自然的句子。",
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
})

examQuestion({
  id: "candidate-order-zunihasumanai-shazai",
  level: "N1",
  surface: "ずにはすまない",
  reading: "ずにはすまない",
  meaningZh: "不...不行、必須...",
  promptLabel: "語順組合",
  instructionZh: "語順組合：選語法正確且語意自然的句子。",
  promptText: "［不手際が / あった以上 / 謝罪せずには / すまない］",
  promptContextZh: "既然有疏失，就不能不道歉。",
  hintZh: "發生疏失後必須採取的回應。",
  expectedAnswer: "不手際があった以上謝罪せずにはすまない",
  options: [
    "不手際があった以上謝罪せずにはすまない",
    "謝罪せずには不手際があった以上すまない",
    "不手際がすまないあった以上謝罪せずには",
    "あった以上謝罪せずには不手際がすまない"
  ],
  explanation: "「Vずにはすまない」表示因責任或情理上不得不做。「不手際があった以上」先提出理由，再接「謝罪せずにはすまない」。"
})

examQuestion({
  id: "candidate-order-wooite-haiyaku",
  level: "N1",
  surface: "をおいて",
  reading: "をおいて",
  meaningZh: "除了...之外沒有...",
  promptLabel: "語順組合",
  instructionZh: "語順組合：選語法正確且語意自然的句子。",
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
})
```

## Suggested Next Import Order

1. Import the 6 text-grammar items first. Current bank still benefits most from
   longer paragraph flow.
2. Import 6 to 8 grammar-form items after ambiguity review.
3. Import sentence-composition items only if the UI still presents them clearly
   on mobile; these options are longer and need visual QA.
4. After import, run the guard, tests, and build, then do one manual practice
   pass to catch unnatural Japanese that static checks cannot see.
