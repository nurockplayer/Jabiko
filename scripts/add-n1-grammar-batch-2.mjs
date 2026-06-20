// One-off migration: append 30 ORIGINAL N1 文法形式選擇 items to
// examBlocks.ts. Each item targets a JLPT N1 grammar pattern not yet
// present in the bank. Authored from scratch -- this script does NOT
// copy or paraphrase questions from any third-party site or workbook.
//
// Coverage rule for this batch (so it composes with prior batches):
//   - id must start with "n1-grammar-" and be unique
//   - surface must NOT match any existing surface in examBlocks.ts
//   - each item carries 4 options (1 correct + 3 distractors that are
//     also real N1 patterns)
//   - hintZh must pass the content guard (corepack pnpm check:exam): no
//     token of length >= 2 from meaningZh appearing in hintZh
//   - explanation must say WHY each distractor is wrong (matches the
//     PR #31 review bar Codex set on distractor quality)
//
// Run once with `node scripts/add-n1-grammar-batch-2.mjs`. The anchor
// pattern is the very last item's explanation string (n1-read-tsuchikau)
// followed by the closing `})\n];` of the examStyleQuestions array.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "..", "src", "domain", "examBlocks.ts");

const ITEMS = [
  {
    id: "n1-grammar-yainaya",
    surface: "や否や",
    reading: "やいなや",
    meaningZh: "一...馬上就...",
    promptText: "終業のベルが鳴る ___、生徒たちは一斉に教室を飛び出した。",
    promptContextZh: "下課鈴一響，學生們便一齊衝出了教室。",
    hintZh: "下課鈴聲與學生離開教室之間幾乎沒有時間差。",
    expectedAnswer: "や否や",
    options: ["や否や", "とはいえ", "かと思いきや", "ばかりに"],
    explanation: "「Vる + や否や」表示「一發生 V，緊接著就...」，描寫前後事件幾乎同時、後句常為驚人或迅速的反應。「とはいえ」是「雖然...但是」（轉折）；「かと思いきや」是「以為...結果卻...」（與預期相反）；「ばかりに」是「就因為...（造成不希望的結果）」（負面因果）。本句鈴聲響起＝學生衝出幾乎同時，唯有「や否や」吻合。"
  },
  {
    id: "n1-grammar-nari-soon",
    surface: "なり",
    reading: "なり",
    meaningZh: "一...就立刻...同主語連續動作",
    promptText: "彼は部屋に入る ___、ソファに倒れ込んで眠ってしまった。",
    promptContextZh: "他一進房間，就倒在沙發上睡著了。",
    hintZh: "他進入房間後做的第一個動作。",
    expectedAnswer: "なり",
    options: ["なり", "ものを", "そばから", "や否や"],
    explanation: "「Vる + なり」表示「同一個人 V 之後立刻採取下一個動作」，前後句同主語、單次事件。「ものを」是「明明...卻（遺憾、不滿）」（轉折，非 as soon as）；「そばから」是「才剛...馬上又...（反覆抵消）」（需重複事件，本句單次）；「や否や」也是「一...就立刻...」但常用於旁觀者敘述驚奇事件、前後可不同主語。本句是「他自己進房 → 自己倒沙發 → 自己睡著」的連續動作，最自然是「なり」。"
  },
  {
    id: "n1-grammar-sobakara",
    surface: "そばから",
    reading: "そばから",
    meaningZh: "才剛...就又...反覆抵消",
    promptText: "新しい単語を覚える ___、すぐ忘れてしまうので困っている。",
    promptContextZh: "才剛背好新單字，馬上又忘掉，這讓我很困擾。",
    hintZh: "背單字與遺忘之間反覆出現的循環。",
    expectedAnswer: "そばから",
    options: ["そばから", "や否や", "が早いか", "あげく"],
    explanation: "「Vる + そばから」描寫「A 才剛做、B 馬上把 A 的效果抵消，且這種情況反覆發生」，常帶困擾語感。「や否や」「が早いか」是單一事件的「一...就...」，沒有反覆性。「あげく」是「在多次嘗試／經歷後最終...（通常負面）」（結果性，不是反覆抵消）。本句的「背→忘→再背→再忘」是典型「そばから」場景。"
  },
  {
    id: "n1-grammar-sueni",
    surface: "末に",
    reading: "すえに",
    meaningZh: "經過長時間或多次嘗試後終於...",
    promptText: "三年に及ぶ研究の ___、ようやく新薬の開発に成功した。",
    promptContextZh: "歷經長達三年的研究，終於成功研發出新藥。",
    hintZh: "歷經長期研究與新藥成果之間的過程關係。",
    expectedAnswer: "末に",
    options: ["末に", "あげく", "上で", "次第で"],
    explanation: "「Nの末に / Vた末に」表示「經過長期／反覆的過程後，得到某種結論（中性或正面）」。「あげく（に）」結構接近但結果偏負面或失望（本句是「成功」屬正面，不適合）。「上で」是「在做完 V 之後，於此基礎上...」（強調順序，無「長期」義）。「次第で」是「視...而定」（條件依存，不是時間累積）。本句強調「三年研究 → 終於成功」的長期過程，故「末に」最貼切。"
  },
  {
    id: "n1-grammar-ageku",
    surface: "あげく",
    reading: "あげく",
    meaningZh: "...結果通常為不理想結局",
    promptText: "彼は何時間も悩んだ ___、結局その仕事を辞めることにした。",
    promptContextZh: "他煩惱了好幾個小時，最後還是決定辭掉那份工作。",
    hintZh: "長時間煩惱之後做出的決定。",
    expectedAnswer: "あげく",
    options: ["あげく", "末に", "うえに", "ところに"],
    explanation: "「Vた／Nの + あげく」是「在長時間糾結／多次嘗試後，最終陷入（通常不希望）的結局」。與「末に」相比，「あげく」結果常帶負面色彩（如辭職、放棄、失敗）；「末に」相對中性／可正面。本句「煩惱很久 → 辭職」帶有遺憾感，故「あげく」更自然。「うえに」是「不僅...而且...（追加）」；「ところに」是「正在...的時候，剛好...」（時點），都不合本句。"
  },
  {
    id: "n1-grammar-toomoikiya",
    surface: "と思いきや",
    reading: "とおもいきや",
    meaningZh: "原以為...結果卻...",
    promptText: "簡単な問題だ ___、解いてみたら意外と時間がかかった。",
    promptContextZh: "本來以為是簡單的題目，實際解了卻意外花了很多時間。",
    hintZh: "對題目難度的事前判斷與實際體感的對比。",
    expectedAnswer: "と思いきや",
    options: ["と思いきや", "とはいえ", "とあって", "ともなしに"],
    explanation: "「普通形 + と思いきや」表示「原本以為 X，結果與預期相反」，常帶意外感。「とはいえ」是「雖然...但是...」（承認前句屬實）。「とあって」是「正因為...所以...」（事件因果，常用於新聞報導）。「ともなしに」是「沒特別意識地...」（無意動作）。本句明顯是「預期 vs 實際」的反差，故「と思いきや」唯一吻合。"
  },
  {
    id: "n1-grammar-temae",
    surface: "手前",
    reading: "てまえ",
    meaningZh: "因為當著對方面已經...所以不得不...",
    promptText: "そう言ってしまった ___、今さら撤回するわけにもいかない。",
    promptContextZh: "因為已經那樣說出口了，事到如今也不能反悔。",
    hintZh: "說出口的話與後續態度之間的綁定。",
    expectedAnswer: "手前",
    options: ["手前", "あげく", "うえで", "ばかりに"],
    explanation: "「Vた + 手前」表示「因為已經當著某人的面做了 V，為了顏面／立場上不得不...」。「あげく」是「在多次嘗試後最終...」（結果性，缺「為了立場」這層）；「うえで」是「在做完 V 之後再...」（順序）；「ばかりに」是「就因為...（造成不希望結果）」（負面因果）。本句的「說出口 → 為了面子不能收回」是「手前」典型用法。"
  },
  {
    id: "n1-grammar-tomonashini",
    surface: "ともなしに",
    reading: "ともなしに",
    meaningZh: "沒特別打算就...",
    promptText: "テレビを見る ___ 見ていたら、昔の同級生がニュースに出ていて驚いた。",
    promptContextZh: "沒特別專心地看著電視，突然發現以前的同學上了新聞，嚇了一跳。",
    hintZh: "看電視時的注意力狀態與意外發現之間的對比。",
    expectedAnswer: "ともなしに",
    options: ["ともなしに", "が早いか", "ともすれば", "や否や"],
    explanation: "「Vる + ともなしに + 同じ V」結構是「沒有特別意識地做 V／無意之中 V」，常與「卻意外發現」相搭配。「が早いか」是「一...就立刻...」（單次迅速）；「ともすれば」是「動不動就...（傾向）」；「や否や」是「一...馬上就...」。三個都與「無意識」無關。本句的「テレビを見るともなしに見ていたら」是典型用法，無意中看到 → 意外發現。"
  },
  {
    id: "n1-grammar-dani",
    surface: "だに",
    reading: "だに",
    meaningZh: "光是...也／連...都文語強調",
    promptText: "あの恐ろしい光景は、今思い出す ___ 身震いがする。",
    promptContextZh: "光是現在想起那可怕的光景，都會讓人發抖。",
    hintZh: "回想當時景象的反應強度。",
    expectedAnswer: "だに",
    options: ["だに", "さえ", "すら", "こそ"],
    explanation: "「Vる + だに」是文語強調，「光是 V，就已經...」，常配「思う／聞く／見る」+「強烈反應」。「さえ」「すら」也是「連...都」，但接續上要 N + さえ / N + すら（接動詞需用「Vて + さえ」「Vて + すら」），不能直接接 Vる。本句是「Vる + ___」結構，故只能用「だに」。「こそ」是「正是...」（強調，無「連...都」義）。"
  },
  {
    id: "n1-grammar-sura",
    surface: "すら",
    reading: "すら",
    meaningZh: "連...都...",
    promptText: "高熱で、水を飲むこと ___ できなかった。",
    promptContextZh: "因為高燒，連喝水都做不到。",
    hintZh: "身體狀況極差時對最基本動作的影響。",
    expectedAnswer: "すら",
    options: ["すら", "だに", "ばかり", "のみ"],
    explanation: "「N（こと）+ すら + 否定」是「連最基本的 N 都辦不到」，強調極端程度。「だに」雖然也是「連...都」，但通常接 Vる + だに（如「思うだに」），不接「こと」名詞化。「ばかり」是「只／僅」（限定，非極端）。「のみ」是「只」（書面限定）。本句要強調「連喝水這個最基本的動作都做不到」的極端情況，「すら」最自然。"
  },
  {
    id: "n1-grammar-nishitatokorode",
    surface: "にしたところで",
    reading: "にしたところで",
    meaningZh: "即使從...立場來看也...",
    promptText: "ベテランの彼 ___、この問題を一人で解決するのは難しいだろう。",
    promptContextZh: "即使是經驗豐富的他，要一個人解決這個問題也很困難。",
    hintZh: "經驗豐富者面對該問題時的處境。",
    expectedAnswer: "にしたところで",
    options: ["にしたところで", "とあって", "にあって", "ともなれば"],
    explanation: "「N + にしたところで」表示「即使是 N（這樣的人／立場），也...」，常配「會有困難／不容易」這種讓步結論。「とあって」是「正因為發生 N 這件事所以...」（事件因果）；「にあって」是「在 N 的情況／時代下」（場景，非讓步）；「ともなれば」是「一旦到了 N 的話就...」（條件，非讓步）。本句要表達「就算是這位老手也很難」的讓步義，唯一吻合的是「にしたところで」。"
  },
  {
    id: "n1-grammar-kiraigaaru",
    surface: "きらいがある",
    reading: "きらいがある",
    meaningZh: "有某種不好的傾向",
    promptText: "彼は何でも一人で抱え込む ___ から、もっとチームに頼ってほしい。",
    promptContextZh: "他有什麼事都一個人扛起來的毛病，希望他能多依靠團隊一點。",
    hintZh: "對他做事方式上的習慣性問題的觀察。",
    expectedAnswer: "きらいがある",
    options: ["きらいがある", "おそれがある", "わけがある", "しまつだ"],
    explanation: "「Vる／Nの + きらいがある」是「在性格上有某種（不好的）傾向」，常用於評語、批評。「おそれがある」是「有...的可能性（多為災害／意外）」（不講性格傾向）。「わけがある」是「有原因／理由」（指有所以然）。「しまつだ」是「結果竟然...（責備）」（單次結果，不指傾向）。本句針對「他習慣性把事情往自己身上攬」這個性格毛病，故「きらいがある」最合適。"
  },
  {
    id: "n1-grammar-tomosureba",
    surface: "ともすれば",
    reading: "ともすれば",
    meaningZh: "動不動就...容易往不好方向倒",
    promptText: "リモートワークでは、___ 運動不足になりがちなので、意識して体を動かすことが大切だ。",
    promptContextZh: "遠端工作時，動不動就容易缺乏運動，所以有意識地活動身體很重要。",
    hintZh: "遠端工作模式對身體狀況的影響方向。",
    expectedAnswer: "ともすれば",
    options: ["ともすれば", "ともなしに", "ともあろう", "ともなれば"],
    explanation: "「ともすれば + Vがち／Vやすい」是「動不動就會 V（負面傾向）」，後句常配「がち」「やすい」。「ともなしに」是「沒特別意識地」（無意動作，非傾向）；「ともあろう」是「身為 N 這樣的身分竟然...（責備）」；「ともなれば」是「一旦變成...的話就...」（條件）。本句後句有「なりがちな」，配「ともすれば」是固定搭配。"
  },
  {
    id: "n1-grammar-zukume",
    surface: "ずくめ",
    reading: "ずくめ",
    meaningZh: "盡是...清一色全為 N 的狀態",
    promptText: "結婚、昇進、家の購入と、彼にとって今年はいいこと ___ の一年だった。",
    promptContextZh: "結婚、升職、買房，對他來說今年是好事連連的一年。",
    hintZh: "他今年發生的事件性質的整體傾向。",
    expectedAnswer: "ずくめ",
    options: ["ずくめ", "だらけ", "まみれ", "がてら"],
    explanation: "「N + ずくめ」是「整體都是 N 的狀態」，常與抽象名詞搭配（如「いいこと」「黒」「ご馳走」），多為正面或中性。「だらけ」是「滿是 N（多為負面，如「間違いだらけ」「泥だらけ」）」。「まみれ」是「沾滿 N（具體污物，如「汗まみれ」「血まみれ」）」。「がてら」是「順便」。「いいことずくめ」是固定常用搭配，故本句唯一吻合「ずくめ」。"
  },
  {
    id: "n1-grammar-mamire",
    surface: "まみれ",
    reading: "まみれ",
    meaningZh: "渾身沾滿具體污物",
    promptText: "工事現場で一日働いた彼は、汗と泥 ___ の姿で帰宅した。",
    promptContextZh: "他在工地工作了一整天，渾身是汗和泥地回到了家。",
    hintZh: "他從工地回家時的外觀狀態。",
    expectedAnswer: "まみれ",
    options: ["まみれ", "ずくめ", "だらけ", "ぐるみ"],
    explanation: "「N + まみれ」是「（液體／粉狀的東西）沾滿全身」，常見搭配「汗・泥・血・油・ほこり」。「ずくめ」是「整體都是 N」但偏抽象（黒ずくめ・規則ずくめ・いいことずくめ）。「だらけ」是「散布很多 N」（間違いだらけ・傷だらけ），語感上是「到處都是」而非「黏附在身上」。「ぐるみ」是「整個 N（家族・町・地域）」，與污染無關。汗和泥黏在身上的具體圖像是「まみれ」的典型用法。"
  },
  {
    id: "n1-grammar-gurumi",
    surface: "ぐるみ",
    reading: "ぐるみ",
    meaningZh: "整個 N 都包含在內",
    promptText: "このイベントは、子供から大人まで、家族 ___ で楽しめるように企画されている。",
    promptContextZh: "這個活動的設計，是讓從小孩到大人都能全家一起同樂。",
    hintZh: "活動的設計把家中所有成員一起納入。",
    expectedAnswer: "ぐるみ",
    options: ["ぐるみ", "ずくめ", "まみれ", "ながら"],
    explanation: "「N + ぐるみ」是「整個 N（社群／組織）都涉入／參與」，常見搭配「家族・町・地域・会社」。「ずくめ」「まみれ」前面已述，與「整體成員」無關。「ながら」是「邊...邊...」或「儘管」（與此處不通）。本句「家族ぐるみで楽しめる」＝「全家一起玩」是典型用法。"
  },
  {
    id: "n1-grammar-yueni",
    surface: "ゆえに",
    reading: "ゆえに",
    meaningZh: "因為...文語書面",
    promptText: "若さ ___、判断を誤ることもあるが、それを糧に成長していくものだ。",
    promptContextZh: "正因為年輕，有時會做出錯誤的判斷，但也是從這些經驗中成長的。",
    hintZh: "年輕這個特質對判斷品質的影響。",
    expectedAnswer: "ゆえに",
    options: ["ゆえに", "おかげで", "せいで", "とあって"],
    explanation: "「N / 普通形 + ゆえに」是文語、書面的「因為」，語氣較重，常用於論述。「おかげで」是「多虧...（正面結果）」，但本句結果偏負面（判斷錯誤），不自然。「せいで」是「都怪...（負面結果，口語）」，但與「年輕」這種特質搭配時，語氣偏怪罪，且本句後句「但也藉此成長」並非單純怪罪。「とあって」是「正因為發生 X 這件事...（事件因果，常用於新聞報導）」，不接抽象特質。文章式論述「若さゆえに」是固定書面表達。"
  },
  {
    id: "n1-grammar-nikakotsukete",
    surface: "にかこつけて",
    reading: "にかこつけて",
    meaningZh: "以...為藉口去做別的事",
    promptText: "彼は出張 ___、観光地巡りまで楽しんでいるらしい。",
    promptContextZh: "聽說他藉著出差的名義，連觀光景點都順便玩了個遍。",
    hintZh: "他在出差期間實際進行的活動範圍。",
    expectedAnswer: "にかこつけて",
    options: ["にかこつけて", "にあたって", "に先立って", "に応じて"],
    explanation: "「N + にかこつけて」是「以 N 當藉口（去做別的事）」，含暗示「真正目的不是 N」的負面語氣。「にあたって」是「在 N 之際／著手 N 時」（中性，正式場合）；「に先立って」是「在 N 之前」（時間先後，正式）；「に応じて」是「根據 N 而...」（相對應）。本句的「藉出差名義去玩」是典型「にかこつけて」用法，其他三者都沒有「藉口」這層意思。"
  },
  {
    id: "n1-grammar-basoremadeda",
    surface: "ばそれまでだ",
    reading: "ばそれまでだ",
    meaningZh: "一旦...就完了到此為止",
    promptText: "どんなに優秀な作品でも、人の目に触れなけれ ___ 価値を発揮できない。",
    promptContextZh: "再怎麼優秀的作品，如果沒有被人看見，就沒辦法發揮它的價值。",
    hintZh: "優秀作品的價值與被看見之間的關係。",
    expectedAnswer: "ばそれまでだ",
    options: ["ばそれまでだ", "ばかりだ", "までもない", "に限る"],
    explanation: "「Vば + それまでだ」是「一旦 V 成立，事情就到此結束／前面的努力全白費」，常配「再怎麼...也」這種前提。「ばかりだ」是「只剩下...／越來越...」（單向變化）。「までもない」是「沒必要做到...」（不必要）。「に限る」是「最好...」（推薦）。本句的「再優秀，如果不被看見就完了」是「ばそれまでだ」的標準用法。注意題目要填的位置是「触れなけれ ___」＝「Vば形 + ___」，故只有「ばそれまでだ」能接續成形。"
  },
  {
    id: "n1-grammar-naimonodemonai",
    surface: "ないものでもない",
    reading: "ないものでもない",
    meaningZh: "也並非不...消極肯定",
    promptText: "条件さえ合えば、その提案を受け入れ ___ が、まだ慎重に検討したい。",
    promptContextZh: "只要條件合適，要接受那個提案也並非不可能，但還想再慎重評估一下。",
    hintZh: "對提案的接受度與條件之間的彈性空間。",
    expectedAnswer: "ないものでもない",
    options: ["ないものでもない", "ようがない", "までもない", "わけがない"],
    explanation: "「Vない + ものでもない」是「並非完全不可能 V，視情況也許會 V」的消極肯定，語感含「保留但有可能性」。「ようがない」是「沒辦法 V」（完全做不到）。「までもない」是「沒必要 V」（不需要）。「わけがない」是「不可能 V」（完全否定可能性）。本句要表達「條件合適就有可能接受，但保留」，唯有「ないものでもない」吻合。"
  },
  {
    id: "n1-grammar-nitaenai",
    surface: "にたえない",
    reading: "にたえない",
    meaningZh: "不堪不忍",
    promptText: "事故現場の悲惨な光景は、見る ___ ものだった。",
    promptContextZh: "事故現場那悲慘的景象，實在讓人不忍直視。",
    hintZh: "目擊事故現場時的心理承受程度。",
    expectedAnswer: "にたえない",
    options: ["にたえない", "にたりない", "にこたえない", "にちがいない"],
    explanation: "「Vる + にたえない」是「（情感上、品味上）受不了 V，無法承受」，常與「見る／聞く／読む」搭配，描寫令人難過、低俗、慘不忍睹之事。「にたりない」是「不夠／不足以」（價值不及，如「議論にたりない」），語感不同。「にこたえない」不是固定句型（純語感造詞，是 distractor）。「にちがいない」是「一定是...」（推測肯定）。本句「不忍看悲慘場景」唯有「にたえない」自然。"
  },
  {
    id: "n1-grammar-nimohodogaaru",
    surface: "にもほどがある",
    reading: "にもほどがある",
    meaningZh: "...也要有個限度",
    promptText: "冗談 ___。あんな話を本人の前でするなんて、信じられない。",
    promptContextZh: "開玩笑也要有個限度。在當事人面前說那種話，真是無法置信。",
    hintZh: "對在當事人面前說那種話的舉動的判斷。",
    expectedAnswer: "にもほどがある",
    options: ["にもほどがある", "に限る", "とは限らない", "ではすまない"],
    explanation: "「N + にもほどがある」是「N 也要有個限度」的譴責用法，常單獨成句後再說明何處過分。「に限る」是「最好...（推薦）」。「とは限らない」是「不一定...（局部否定）」。「ではすまない」是「光是...是不能了事的（會有更嚴重後果）」，雖然語氣接近但結構不對（「冗談ではすまない」＝「不只是玩笑這麼簡單」，意思變了）。本句要表達「玩笑要有個分寸」的責備，故「にもほどがある」最合。"
  },
  {
    id: "n1-grammar-ikan-niyotteha",
    surface: "いかんによっては",
    reading: "いかんによっては",
    meaningZh: "依...的情況而定",
    promptText: "今後の検査結果 ___、手術が必要になる可能性もある。",
    promptContextZh: "依未來的檢查結果，可能會需要動手術。",
    hintZh: "未來檢查結果與是否需要手術之間的關係。",
    expectedAnswer: "いかんによっては",
    options: ["いかんによっては", "いかんを問わず", "ともなしに", "ところで"],
    explanation: "「Nのいかん + によっては」是「視 N 的狀況而定，有可能...」（書面、正式）。「いかんを問わず」是「不管 N 如何，都...」（不依條件，本句明顯有條件性，故不合）。「ともなしに」是「沒特別意識地」（無意動作，與條件無關）。「ところで」是「即使...也...」（讓步，無條件依存）。本句「視檢查結果決定要不要動手術」是典型條件依存，故「いかんによっては」吻合。"
  },
  {
    id: "n1-grammar-noikanwotowazu",
    surface: "のいかんを問わず",
    reading: "のいかんをとわず",
    meaningZh: "不論...如何",
    promptText: "ご購入後の理由 ___、いったんお納めいただいた商品の返品はお受けできかねます。",
    promptContextZh: "不論購買後是什麼理由，已售出的商品恕無法接受退貨。",
    hintZh: "商品售出後對退貨請求的處理方針。",
    expectedAnswer: "のいかんを問わず",
    options: ["のいかんを問わず", "に応じて", "を皮切りに", "に先立って"],
    explanation: "「N + のいかんを問わず」是公告／規約常用的「不論 N 的內容是什麼一律...」（最正式的「不論」）。「に応じて」是「視 N 而定」（與不論相反）。「を皮切りに」是「以 N 為開端」。「に先立って」是「在 N 之前」。本句是商品退貨告示，要表達「不論理由一律不退」，唯有「のいかんを問わず」吻合。"
  },
  {
    id: "n1-grammar-niarumajiki",
    surface: "にあるまじき",
    reading: "にあるまじき",
    meaningZh: "身為...不應有的",
    promptText: "公的な立場 ___ 発言だとして、彼は厳しく批判された。",
    promptContextZh: "因為被認為是身為公眾立場不該有的發言，他遭到了嚴厲的批評。",
    hintZh: "他的發言與其公眾身分之間的衝突。",
    expectedAnswer: "にあるまじき",
    options: ["にあるまじき", "にすぎない", "に堪える", "にかたくない"],
    explanation: "「N + にあるまじき + N」是「身為 N 不該有的...（嚴厲譴責）」，常配「公人・教師・医師」這類身分。「にすぎない」是「不過是...（縮小）」。「に堪える」是「禁得起...（值得）」。「にかたくない」是「不難...（推測）」。本句是「身為公眾人物不該說的發言」這種譴責語境，故「にあるまじき」最合。"
  },
  {
    id: "n1-grammar-atteno",
    surface: "あっての",
    reading: "あっての",
    meaningZh: "正因為有 N 才有...",
    promptText: "私たちが今こうして活動できているのは、ファンの皆さん ___ ことだ。",
    promptContextZh: "我們現在能像這樣繼續活動，全是因為有粉絲大家的支持。",
    hintZh: "他們現在能繼續活動的根本來源。",
    expectedAnswer: "あっての",
    options: ["あっての", "ならではの", "ばかりの", "ゆえの"],
    explanation: "「N + あっての + N」是「正因為有 A，B 才能存在；沒有 A 就沒有 B」的強烈依存關係，常用於感謝。「ならではの」是「只有 N 才有的（特色）」（強調獨特性）。「ばかりの」是「剛剛...的」或「光是...」（時間／程度）。「ゆえの」是「因為 N 而生的（原因）」（書面、單純因果，不強調 A 不可缺）。本句「沒有粉絲就沒有現在」的依存感謝，唯一吻合「あっての」。"
  },
  {
    id: "n1-grammar-toareba",
    surface: "とあれば",
    reading: "とあれば",
    meaningZh: "如果是...的話為此不惜...",
    promptText: "あなたの頼み ___、どんなに忙しくても引き受けないわけにはいかない。",
    promptContextZh: "如果是你拜託的，再怎麼忙我也不能不接下來。",
    hintZh: "答應對方請託與忙碌程度之間的取捨。",
    expectedAnswer: "とあれば",
    options: ["とあれば", "とあって", "とすれば", "とはいえ"],
    explanation: "「N / 普通形 + とあれば」是「如果情況是 N／如果是為了 N，那就...（無條件投入）」，常配「也願意接下／也得做」這類句子。「とあって」是「正因為發生 X（已成立事實），所以...」（事件報導因果，本句是假設不是既成事實，故不合）。「とすれば」是「假設...的話」（中性假設，無「不惜」語感）。「とはいえ」是「雖然如此」（讓步轉折）。本句的「如果是你拜託的，我再忙也接」是「とあれば」典型用法。"
  },
  {
    id: "n1-grammar-naimademo",
    surface: "ないまでも",
    reading: "ないまでも",
    meaningZh: "雖然不至於但至少...",
    promptText: "毎日とは言わ ___、せめて週に一度は運動するように心がけている。",
    promptContextZh: "雖然不是每天，但至少努力做到一週運動一次。",
    hintZh: "對運動頻率所做的妥協標準。",
    expectedAnswer: "ないまでも",
    options: ["ないまでも", "ないものの", "ないことには", "ないかぎり"],
    explanation: "「Vない + までも」是「雖然做不到頂端的 V，但至少做到 N 這個次一級」，後句常配「せめて／少なくとも」。「ないものの」是「雖然不...（轉折）」（無「次一級」義）。「ないことには」是「若不 V，就無法...」（必要條件）。「ないかぎり」是「只要不 V 就...」（持續否定條件）。本句的「不到每天，至少一週一次」是典型的退而求其次語感，唯有「ないまでも」吻合。"
  },
  {
    id: "n1-grammar-nitodomarazu",
    surface: "にとどまらず",
    reading: "にとどまらず",
    meaningZh: "不僅限於還擴及...",
    promptText: "この問題は一企業 ___、業界全体に影響を及ぼす可能性がある。",
    promptContextZh: "這個問題不只限於一家企業，還有可能波及到整個業界。",
    hintZh: "問題影響可能擴散的範圍。",
    expectedAnswer: "にとどまらず",
    options: ["にとどまらず", "にかかわらず", "に限らず", "を問わず"],
    explanation: "「N + にとどまらず」是「不只停在 N 的範圍，還擴及 B（更大範圍）」，常用於議論文。「にかかわらず」是「不論...」（無關條件）。「に限らず」也是「不只限於 N」，意思相近但語感較弱，後句通常接「他のも」這種並列舉例；本句強調「擴大波及」的縱深語感「にとどまらず」更貼。「を問わず」是「不論 N 如何（規約口吻）」。本句要表達「不只一家、會擴到全業界」的擴散感，最自然是「にとどまらず」。"
  },
  {
    id: "n1-grammar-teyamanai",
    surface: "てやまない",
    reading: "てやまない",
    meaningZh: "從心底持續不斷地...",
    promptText: "皆様のますますのご活躍を願っ ___ おります。",
    promptContextZh: "我從心底持續祝願各位的活躍。",
    hintZh: "說話者對對方未來表現所抱持的心情。",
    expectedAnswer: "てやまない",
    options: ["てやまない", "てたまらない", "てかなわない", "ずにはいられない"],
    explanation: "「Vて + やまない」是「（情感類動詞）從內心持續不斷地 V」，常配「願う・祈る・愛する・期待する」這類心理動詞，多用於致詞、書面。「てたまらない」是「...得受不了（生理／心理感受強烈，如「眠くてたまらない」）」，前面接形容詞或感受形動詞，不接「願う」。「てかなわない」是「...受不了（負面）」（如「暑くてかなわない」）。「ずにはいられない」是「忍不住要 V」（不由自主動作）。本句是書面致詞「願っております」的延伸——「願ってやみません／願ってやまない」是常見搭配。"
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

// Anchor: the file ends with the n1-read-tsuchikau item's closing `})`
// followed by `];`. We splice 30 new items between them.
//
// Use a regex so the script is line-ending-agnostic. The repo uses CRLF
// on Windows; \r\n? matches either form so re-running the script on a
// repo cloned with LF still works.
let text = readFileSync(target, "utf8");
const eol = text.includes("\r\n") ? "\r\n" : "\n";
const newBlocks = ITEMS.map(block).join("," + eol);
const ANCHOR_REGEX =
  /「培」訓讀「つちか-う」→ つちかう。「ばいかう」是把訓讀換成音讀「ばい」的陷阱；「つちこう」是次音節母音錯誤；「つくろう」是「繕う」（修補，不同字）。"\r?\n  \}\)\r?\n\];/;

if (!ANCHOR_REGEX.test(text)) {
  console.error(
    "Anchor not found in examBlocks.ts. The file may have been modified " +
      "since this script was authored; update the ANCHOR_REGEX or insert manually."
  );
  process.exit(1);
}

// Rebuild the new block tail using the same eol so we don't mix LF/CRLF
// inside the file.
const newTail =
  `「培」訓讀「つちか-う」→ つちかう。「ばいかう」是把訓讀換成音讀「ばい」的陷阱；「つちこう」是次音節母音錯誤；「つくろう」是「繕う」（修補，不同字）。"${eol}` +
  `  }),${eol}` +
  `${newBlocks.replace(/\n/g, eol)}${eol}` +
  `];`;

text = text.replace(ANCHOR_REGEX, newTail);
writeFileSync(target, text, "utf8");
console.log(`Inserted ${ITEMS.length} new N1 文法形式選擇 items into examBlocks.ts.`);
