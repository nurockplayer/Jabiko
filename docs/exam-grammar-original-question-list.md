# Original Exam Grammar Question List

Created: 2026-06-19

Purpose: ready-to-port original JLPT-style grammar questions for Jabiko.

These items were written after reviewing public JLPT item-type sources and
public grammar/practice sites for structure and coverage only. They do not
copy stems, options, or explanations from those sources.

Reference sources used for style/coverage:

- JLPT official sample questions: https://www.jlpt.jp/e/samples/forlearners.html
- JLPT official workbook index: https://www.jlpt.jp/e/samples/sampleindex.html
- JLPT official 2009 sample index: https://www.jlpt.jp/e/samples/sample09.html
- JLPT item composition: https://www.jlpt.jp/e/guideline/testsections.html
- N1 purposes: https://www.jlpt.jp/e/guideline/pdf/n1_e_revised.pdf
- N2 purposes: https://www.jlpt.jp/e/guideline/pdf/n2_e.pdf
- JLPT Sensei N1 grammar list: https://jlptsensei.com/jlpt-n1-grammar-list/
- JLPT Sensei N2 grammar list: https://jlptsensei.com/jlpt-n2-grammar-list/
- 日本語NET grammar summary: https://nihongokyoshi-net.com/jlpt-grammars/
- Japanesetest4you N1 grammar list/tests:
  https://japanesetest4you.com/jlpt-n1-grammar-list/
  https://japanesetest4you.com/category/jlpt-n1/jlpt-n1-grammar-test/
- Japanesetest4you N2 grammar list/tests:
  https://japanesetest4you.com/jlpt-n2-grammar-list/
  https://japanesetest4you.com/category/jlpt-n2/jlpt-n2-grammar-test/

Implementation notes:

- IDs use `candidate-...` to make it clear these are staging items.
  Rename before committing to `examBlocks.ts` if needed.
- Keep `promptLabel` visible-level-free.
- Run `node scripts/check-exam-options.mjs`, tests, and build after porting.

## N2 Candidates

```ts
examQuestion({
  id: "candidate-n2-grammar-nitomonatte-denshi",
  level: "N2",
  surface: "に伴って",
  reading: "にともなって",
  meaningZh: "伴隨、隨著",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "電子契約の普及 ___、社内の承認手続きも見直された。",
  promptContextZh: "隨著電子契約普及，公司內部的核准流程也被重新檢討。",
  hintZh: "電子契約普及後，公司內部流程的調整。",
  expectedAnswer: "に伴って",
  options: ["に伴って", "にしたがって", "に沿って", "に応じて"],
  explanation: "「Nに伴って」表示某變化連帶帶來另一變化。「にしたがって」偏依照規則或漸進變化；「に沿って」是依照方針；「に応じて」是依條件調整。本句是普及造成流程跟著變動，最自然是「に伴って」。"
})

examQuestion({
  id: "candidate-n2-grammar-nioujite-kenshu",
  level: "N2",
  surface: "に応じて",
  reading: "におうじて",
  meaningZh: "依照、根據不同情況",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "申込者の経験年数 ___、研修内容を三段階に分けている。",
  promptContextZh: "依申請者的經驗年數，將研修內容分成三個階段。",
  hintZh: "研修內容依參加者條件而調整。",
  expectedAnswer: "に応じて",
  options: ["に応じて", "に沿って", "に基づいて", "に伴って"],
  explanation: "「Nに応じて」表示內容會配合 N 的差異而變化。「に沿って」是依方針；「に基づいて」是以資料或規則為根據；「に伴って」是伴隨變化。本句重點是按經驗年數分級，選「に応じて」。"
})

examQuestion({
  id: "candidate-n2-grammar-womegutte-shineki",
  level: "N2",
  surface: "をめぐって",
  reading: "をめぐって",
  meaningZh: "圍繞、針對",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "新駅の建設計画 ___、住民の間で賛否が分かれている。",
  promptContextZh: "居民之間圍繞新車站建設計畫意見分歧。",
  hintZh: "居民對新車站建設計畫有不同看法。",
  expectedAnswer: "をめぐって",
  options: ["をめぐって", "について", "に関して", "を通じて"],
  explanation: "「Nをめぐって」常用於議論、対立、問題が起こる場合。「について」「に関して」只是一般關於；「を通じて」是透過媒介或期間。本句有賛否が分かれている，最自然是「をめぐって」。"
})

examQuestion({
  id: "candidate-n2-grammar-monono-seido",
  level: "N2",
  surface: "ものの",
  reading: "ものの",
  meaningZh: "雖然、但是",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "新しい勤怠システムは導入された ___、現場ではまだ操作ミスが多い。",
  promptContextZh: "新的出勤系統雖然已導入，但現場仍有很多操作錯誤。",
  hintZh: "制度導入後，現場仍有實際運用問題。",
  expectedAnswer: "ものの",
  options: ["ものの", "一方で", "反面", "に対して"],
  explanation: "「Vたものの」表示前項成立，但結果沒有如預期順利。「一方で」「反面」偏兩面並列；「に対して」是對比不同對象。本句是導入後仍未順利，選「ものの」。"
})

examQuestion({
  id: "candidate-n2-grammar-nishitewa-kikakusho",
  level: "N2",
  surface: "にしては",
  reading: "にしては",
  meaningZh: "以...來說",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "入社一年目 ___、彼の企画書はかなり完成度が高い。",
  promptContextZh: "以入社第一年來說，他的企劃書完成度相當高。",
  hintZh: "評價一份企劃書時，把入社年資納入判斷。",
  expectedAnswer: "にしては",
  options: ["にしては", "わりに", "くせに", "ものの"],
  explanation: "「Nにしては」表示以某身分、條件或標準來看，結果超出預期。「わりに」也可表示相對評價，但較口語且不如本句的基準明確；「くせに」帶責備；「ものの」是讓步。"
})

examQuestion({
  id: "candidate-n2-grammar-bakarini-kakunin",
  level: "N2",
  surface: "ばかりに",
  reading: "ばかりに",
  meaningZh: "只因為...就造成壞結果",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "確認を一度怠った ___、納品全体が遅れることになった。",
  promptContextZh: "只因一次疏忽確認，就導致整個交貨延誤。",
  hintZh: "一次確認疏忽造成後續交期問題。",
  expectedAnswer: "ばかりに",
  options: ["ばかりに", "せいで", "ことから", "おかげで"],
  explanation: "「Vたばかりに」強調因為一個看似小的原因造成遺憾結果。「せいで」只是負面原因；「ことから」是判斷依據或原因；「おかげで」通常是正面原因。本句有「一度」與大範圍延誤，選「ばかりに」。"
})

examQuestion({
  id: "candidate-n2-grammar-sueni-kyogi",
  level: "N2",
  surface: "末に",
  reading: "すえに",
  meaningZh: "經過...之後",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "何度も協議を重ねた ___、ようやく新しい規定がまとまった。",
  promptContextZh: "經過多次協議後，新規定終於定案。",
  hintZh: "多次協議後得到結果。",
  expectedAnswer: "末に",
  options: ["末に", "あげく", "結果", "ところ"],
  explanation: "「Vた末に」表示經過長時間思考、努力或討論後得到結果。「あげく」多接負面結果；「結果」是一般結果表現；「ところ」表示做某事後發現或狀況。本句結果是規定まとまった，最自然是「末に」。"
})

examQuestion({
  id: "candidate-n2-grammar-tokoroni-shusei",
  level: "N2",
  surface: "ところに",
  reading: "ところに",
  meaningZh: "正當...時",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "ちょうど報告書を印刷しようとしていた ___、部長から修正の指示が入った。",
  promptContextZh: "正要印報告書時，部長提出了修改指示。",
  hintZh: "報告書印刷前，主管提出新的指示。",
  expectedAnswer: "ところに",
  options: ["ところに", "最中に", "折に", "次第"],
  explanation: "「Vようとしていたところに」表示正要做某事時，另一事發生。「最中に」偏正在進行中；「折に」是時機、機會；「次第」表示一...就...。本句是正要印刷時被打斷，選「ところに」。"
})

examQuestion({
  id: "candidate-n2-grammar-wakeniha-yakusoku",
  level: "N2",
  surface: "わけにはいかない",
  reading: "わけにはいかない",
  meaningZh: "不能那樣做",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "取引先との約束がある以上、こちらの都合だけで日程を変える ___。",
  promptContextZh: "既然已經和客戶約好，就不能只因我方方便而更改日程。",
  hintZh: "已和外部對象約定後，日程調整受到限制。",
  expectedAnswer: "わけにはいかない",
  options: ["わけにはいかない", "わけがない", "ことはない", "はずがない"],
  explanation: "「Vるわけにはいかない」表示因社會、道義或責任上的理由不能做。「わけがない」「はずがない」是否定可能性；「ことはない」是不必做。本句是約定造成不能任意改期，選「わけにはいかない」。"
})

examQuestion({
  id: "candidate-n2-grammar-kanenai-kyoyu",
  level: "N2",
  surface: "かねない",
  reading: "かねない",
  meaningZh: "可能造成壞結果",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "このまま情報共有を怠れば、同じミスを繰り返し ___。",
  promptContextZh: "如果繼續怠於共享資訊，可能會重複同樣錯誤。",
  hintZh: "資訊共享不足對後續失誤的影響。",
  expectedAnswer: "かねない",
  options: ["かねない", "うる", "かねる", "がたい"],
  explanation: "「Vます形 + かねない」表示可能發生不好的結果。「うる」是中性可能性；「かねる」是不方便或難以做；「がたい」是主觀上難以做。本句是警告負面後果，選「かねない」。"
})

examQuestion({
  id: "candidate-n2-grammar-tsutsuaru-shinsei",
  level: "N2",
  surface: "つつある",
  reading: "つつある",
  meaningZh: "正在逐漸...",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "紙の申請書は、オンライン手続きへと徐々に置き換えられ ___。",
  promptContextZh: "紙本申請書正逐漸被線上手續取代。",
  hintZh: "申請方式正在慢慢改變。",
  expectedAnswer: "つつある",
  options: ["つつある", "ているところだ", "一方だ", "ばかりだ"],
  explanation: "「Vます形 + つつある」表示變化正在逐步進行。「ているところだ」偏正在做某動作；「一方だ」多表示單方向加劇；「ばかりだ」多接惡化。本句有徐々に，選「つつある」。"
})

examQuestion({
  id: "candidate-n2-grammar-nihokanaranai-genin",
  level: "N2",
  surface: "にほかならない",
  reading: "にほかならない",
  meaningZh: "正是、無非是",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "今回の混乱の原因は、事前の確認不足 ___。",
  promptContextZh: "這次混亂的原因正是事前確認不足。",
  hintZh: "說明造成混亂的核心原因。",
  expectedAnswer: "にほかならない",
  options: ["にほかならない", "にすぎない", "に相違ない", "とは限らない"],
  explanation: "「Nにほかならない」表示正是 N、無非是 N。「にすぎない」是只不過；「に相違ない」是確信推測；「とは限らない」是否定必然。本句要斷定原因，選「にほかならない」。"
})
```

## N1 Candidates

```ts
examQuestion({
  id: "candidate-n1-grammar-atteno-riyosya",
  level: "N1",
  surface: "あっての",
  reading: "あっての",
  meaningZh: "有...才有...",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "このサービスは日々の利用者 ___ ものだという意識を忘れてはならない。",
  promptContextZh: "不能忘記這項服務是有每天的使用者才得以成立。",
  hintZh: "服務成立與使用者支持之間的關係。",
  expectedAnswer: "あっての",
  options: ["あっての", "なくしては", "ならでは", "をおいて"],
  explanation: "「AあってのB」表示 B 是因 A 的存在才成立。「なくしては」後面多接否定；「ならでは」是只有某對象才有的特色；「をおいて」是除了某人事物沒有其他。本句是服務依靠使用者而存在，選「あっての」。"
})

examQuestion({
  id: "candidate-n1-grammar-wooite-kosho",
  level: "N1",
  surface: "をおいて",
  reading: "をおいて",
  meaningZh: "除了...之外沒有...",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "この難しい交渉を任せられる人は、経験豊富な田中さん ___ いない。",
  promptContextZh: "能被託付這場困難談判的人，除了經驗豐富的田中以外沒有別人。",
  hintZh: "困難談判的人選判斷。",
  expectedAnswer: "をおいて",
  options: ["をおいて", "ならでは", "あっての", "なくしては"],
  explanation: "「Nをおいて...ない」表示除了 N 沒有其他適合對象。「ならでは」是獨特性；「あっての」是存在依存；「なくしては」是沒有就不成立。本句搭配「いない」，選「をおいて」。"
})

examQuestion({
  id: "candidate-n1-grammar-bekushite-jiko",
  level: "N1",
  surface: "べくして",
  reading: "べくして",
  meaningZh: "該發生的自然發生",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "長年安全点検を怠っていたのだから、今回の事故は起こる ___ 起こったと言える。",
  promptContextZh: "多年怠於安全檢查，這次事故可說是該發生的自然發生了。",
  hintZh: "安全檢查長期不足與事故發生的關係。",
  expectedAnswer: "べくして",
  options: ["べくして", "べく", "べからず", "べくもなく"],
  explanation: "「VるべくしてVた」表示事情按必然結果發生。「べく」是目的；「べからず」是禁止；「べくもなく」是否定可能。本句說事故並非偶然，選「べくして」。"
})

examQuestion({
  id: "candidate-n1-grammar-bekumonai-yosoku",
  level: "N1",
  surface: "べくもない",
  reading: "べくもない",
  meaningZh: "不可能...",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "当時の資料だけでは、現在の市場変化を ___。",
  promptContextZh: "僅憑當時的資料，不可能預測現在的市場變化。",
  hintZh: "以過去資料判斷現在市場變化的限度。",
  expectedAnswer: "予測すべくもない",
  options: ["予測すべくもない", "予測しようがない", "予測しかねない", "予測しがたい"],
  explanation: "「Vるべくもない」是書面語，表示完全不可能。「予測しようがない」意思近但較口語；「予測しかねない」是可能預測而產生壞結果，語意不合；「予測しがたい」是難以預測，語氣較弱。"
})

examQuestion({
  id: "candidate-n1-grammar-zunihasumanai-kojinjoho",
  level: "N1",
  surface: "ずにはすまない",
  reading: "ずにはすまない",
  meaningZh: "不能不...、非...不可",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "個人情報を外部に送ってしまった以上、担当者だけでなく会社としても説明せ ___。",
  promptContextZh: "既然已將個人資料送到外部，不只負責人，公司也不能不說明。",
  hintZh: "個資外流後，公司對外說明的責任。",
  expectedAnswer: "ずにはすまない",
  options: ["ずにはすまない", "ずにはおかない", "ずにはいられない", "ないではおかない"],
  explanation: "「Vずにはすまない」表示責任或情況上不能不做。「ずにはおかない」是必然造成；「ずにはいられない」是情感上忍不住；「ないではおかない」也偏造成結果。本句是責任上的説明義務，選「ずにはすまない」。"
})

examQuestion({
  id: "candidate-n1-grammar-nikatakunai-genba",
  level: "N1",
  surface: "にかたくない",
  reading: "にかたくない",
  meaningZh: "不難...",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "突然の発表に、現場がどれほど混乱したかは想像 ___。",
  promptContextZh: "突然發表後，現場有多混亂不難想像。",
  hintZh: "突如其來的發表對現場造成的影響。",
  expectedAnswer: "にかたくない",
  options: ["にかたくない", "にたえない", "に忍びない", "に足る"],
  explanation: "「想像にかたくない」是固定搭配，表示不難想像。「にたえない」是強烈感情或不值得看聽；「に忍びない」是於心不忍；「に足る」是值得。本句選「にかたくない」。"
})

examQuestion({
  id: "candidate-n1-grammar-toareba-anzen",
  level: "N1",
  surface: "とあれば",
  reading: "とあれば",
  meaningZh: "如果是...的話",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "地域の安全に関わる問題 ___、多少時間がかかっても調査を続けるべきだ。",
  promptContextZh: "如果是關係到地區安全的問題，即使花時間也應繼續調查。",
  hintZh: "地區安全問題對調查必要性的影響。",
  expectedAnswer: "とあれば",
  options: ["とあれば", "とあって", "となれば", "とはいえ"],
  explanation: "「Nとあれば」表示若是 N 這種情況，就應採取相應行動。「とあって」是因特殊情況自然發生結果；「となれば」是如果變成那樣；「とはいえ」是讓步。本句是條件判斷，選「とあれば」。"
})

examQuestion({
  id: "candidate-n1-grammar-monowo-sodan",
  level: "N1",
  surface: "ものを",
  reading: "ものを",
  meaningZh: "明明可以...卻...",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "早めに相談してくれれば対応できた ___、彼は一人で抱え込んでしまった。",
  promptContextZh: "明明早點找人商量就能處理，他卻一個人扛了下來。",
  hintZh: "未及早相談而導致問題被獨自承擔。",
  expectedAnswer: "ものを",
  options: ["ものを", "ところを", "ようものなら", "とはいえ"],
  explanation: "「...ものを」表示本來可以那樣卻沒有，帶遺憾或責備。「ところを」多表示在某情況下承蒙或被打斷；「ようものなら」是假設壞結果；「とはいえ」是讓步。"
})

examQuestion({
  id: "candidate-n1-grammar-toii-happyo",
  level: "N1",
  surface: "といい",
  reading: "といい",
  meaningZh: "無論...還是...",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "資料の構成 ___、説明の順序といい、今回の発表は非常に分かりやすかった。",
  promptContextZh: "無論資料結構還是說明順序，這次發表都非常容易理解。",
  hintZh: "從多個面向評價一場發表。",
  expectedAnswer: "といい",
  options: ["といい", "であれ", "だの", "やら"],
  explanation: "「AといいBといい」列舉兩個方面並給出整體評價。「であれ」是不論；「だの」「やら」列舉時常帶雜亂或批評語感。本句是正面評價兩個方面，選「といい」。"
})

examQuestion({
  id: "candidate-n1-grammar-mosarukotonagara-sakka",
  level: "N1",
  surface: "もさることながら",
  reading: "もさることながら",
  meaningZh: "...自不必說，...更是",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "この作家は物語の展開 ___、登場人物の心理描写が見事だ。",
  promptContextZh: "這位作家的故事發展固然出色，人物心理描寫更精彩。",
  hintZh: "評價作家的兩個長處，後者更值得注意。",
  expectedAnswer: "もさることながら",
  options: ["もさることながら", "のみならず", "にとどまらず", "ばかりか"],
  explanation: "「AもさることながらB」表示 A 當然重要，但 B 更值得強調。「のみならず」「ばかりか」是不只；「にとどまらず」是不限於範圍。本句是後項心理描写更突出，選「もさることながら」。"
})

examQuestion({
  id: "candidate-n1-grammar-ikan-niyotte-kensa",
  level: "N1",
  surface: "いかんによっては",
  reading: "いかんによっては",
  meaningZh: "視...而定，有可能...",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "検査結果 ___、出荷を一時停止する可能性がある。",
  promptContextZh: "視檢查結果而定，有可能暫停出貨。",
  hintZh: "檢查結果會影響是否出貨。",
  expectedAnswer: "いかんによっては",
  options: ["いかんによっては", "のいかんを問わず", "にかかわらず", "を問わず"],
  explanation: "「Nのいかんによっては」表示根據 N 的內容或結果，可能採取不同措施。「のいかんを問わず」「にかかわらず」「を問わず」都是不論結果如何，與本句可能停止出貨不合。"
})

examQuestion({
  id: "candidate-n1-grammar-niitattewa-sekininsha",
  level: "N1",
  surface: "に至っては",
  reading: "にいたっては",
  meaningZh: "至於...更是",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "新人はまだしも、責任者 ___ 報告書の内容を把握していなかった。",
  promptContextZh: "新人也就算了，至於負責人更是連報告內容都沒掌握。",
  hintZh: "比較新人與責任者對報告內容的掌握情況。",
  expectedAnswer: "に至っては",
  options: ["に至っては", "に至って", "に至るまで", "にあって"],
  explanation: "「Nに至っては」提出極端例子，常帶批判或驚訝。「に至って」是到了某階段；「に至るまで」是範圍連到；「にあって」是在某狀況下。本句責任者是更嚴重例，選「に至っては」。"
})
```

