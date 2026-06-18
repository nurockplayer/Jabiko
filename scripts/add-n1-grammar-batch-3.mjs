// One-off migration: append 30 ORIGINAL N1 文法形式選擇 items to
// examBlocks.ts. Same authoring rules as batches 1 + 2:
//   - 100% original, no third-party question bank used.
//   - Each item has 4 options (1 correct + 3 real N1 distractors with
//     explicit "why each is wrong" notes in the explanation).
//   - hintZh passes the leak guard in scripts/check-exam-options.mjs.
//   - id starts with "n1-grammar-" and is unique across the bank.
//   - surface does not duplicate any existing surface in examBlocks.
//
// Anchor uses the `];` + `export function buildExamQuestionPool`
// boundary so the script can run on top of earlier batches without
// hand-tuning the anchor string each time.
//
// Run with `pnpm node scripts/add-n1-grammar-batch-3.mjs`.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "..", "src", "domain", "examBlocks.ts");

const ITEMS = [
  {
    id: "n1-grammar-mononara",
    surface: "ものなら",
    reading: "ものなら",
    meaningZh: "如果做得到的話",
    promptText: "あの時にもう一度戻れる ___、彼にきちんと謝りたい。",
    promptContextZh: "如果可以再回到當時，我想好好向他道歉。",
    hintZh: "對於回到過去這個動作所抱持的願望。",
    expectedAnswer: "ものなら",
    options: ["ものなら", "ものを", "ものか", "ものの"],
    explanation: "「Vる + ものなら」是「如果做得到 V 的話（雖然實際很難）...」，常配後句願望（〜たい），表反現實假設。「ものを」是「明明...卻（遺憾）」（轉折）；「ものか」是「絕對不會」（強烈否定意志）；「ものの」是「雖然...但是」（讓步）。本句是反現實假設＋願望，唯一吻合「ものなら」。"
  },
  {
    id: "n1-grammar-naitomokagiranai",
    surface: "ないとも限らない",
    reading: "ないともかぎらない",
    meaningZh: "也未必不會",
    promptText: "万が一に備えて準備しておこう。雨が降ら ___ から。",
    promptContextZh: "為了以防萬一還是先準備好吧，誰知道會不會下雨。",
    hintZh: "對下雨可能性的保留判斷。",
    expectedAnswer: "ないとも限らない",
    options: ["ないとも限らない", "ないわけにはいかない", "ないものでもない", "ようがない"],
    explanation: "「Vない + とも限らない」是「也不能說一定不會 V，意即可能會 V」（保留可能性）。「ないわけにはいかない」是「不能不 V」（義務）；「ないものでもない」是「也並非不 V」（消極肯定）；「ようがない」是「無法 V」（完全否定可能）。本句要表達「不能排除下雨可能」的弱可能性，「ないとも限らない」最自然。"
  },
  {
    id: "n1-grammar-youdeha",
    surface: "ようでは",
    reading: "ようでは",
    meaningZh: "若是這樣的話",
    promptText: "そんなにすぐ諦める ___、何事も成功するはずがない。",
    promptContextZh: "如果那麼快就放棄，什麼事都不可能成功。",
    hintZh: "對某種行為模式做出的負面評價基準。",
    expectedAnswer: "ようでは",
    options: ["ようでは", "ようなら", "ことには", "ところで"],
    explanation: "「Vる/Vている + ようでは」表示「如果繼續這種狀態的話（會導致不好結果）」，後句常配「無法／不可能」這種負面判斷。「ようなら」也是「如果...的話」但中性、後句可正可負；「ことには」是「不...就無法...」（必要條件）；「ところで」是「即使...也...」（讓步）。本句是「這樣下去不會成功」的批評語感，唯有「ようでは」吻合。"
  },
  {
    id: "n1-grammar-tsutsumo",
    surface: "つつも",
    reading: "つつも",
    meaningZh: "雖然...卻...",
    promptText: "悪いとは知り ___、つい嘘をついてしまった。",
    promptContextZh: "雖然知道不好，但還是不小心說了謊。",
    hintZh: "對「不應該說謊」的認知與實際行為的落差。",
    expectedAnswer: "つつも",
    options: ["つつも", "ながらに", "ものの", "ばかりか"],
    explanation: "「Vます stem + つつも」是文語、書面的「雖然...卻...」，表現認知與行為的落差。「ながらに」是「~ながらに（涙ながらに 等）」表示「在某狀態下」（不是讓步）；「ものの」也是「雖然...但是」但偏口語；「ばかりか」是「不僅...連...也...」（追加）。本句「明知不好卻說謊」是典型「つつも」用法，且接 V ます stem「知り」剛好吻合。"
  },
  {
    id: "n1-grammar-katawara",
    surface: "かたわら",
    reading: "かたわら",
    meaningZh: "做主業的同時還...",
    promptText: "彼は会社員として働く ___、趣味で小説を書いている。",
    promptContextZh: "他一邊當上班族，一邊以興趣寫小說。",
    hintZh: "他正職以外進行的活動。",
    expectedAnswer: "かたわら",
    options: ["かたわら", "ながら", "うえに", "あいだに"],
    explanation: "「Vる + かたわら」是書面、長期並行的「主業 V 的同時，副業也持續 N」（兩件事都長期）。「ながら」是並行動作但時間尺度短（邊聽音樂邊讀書這種）；「うえに」是「不僅...而且...」（追加）；「あいだに」是「在...期間」（時間段）。本句「正職＋寫小說長期並行」是「かたわら」典型場景。"
  },
  {
    id: "n1-grammar-igainonanimonodemonai",
    surface: "以外の何ものでもない",
    reading: "いがいのなにものでもない",
    meaningZh: "正是...沒有其他可能",
    promptText: "彼の行動は、責任逃れ ___。",
    promptContextZh: "他的行為，正是在推卸責任，沒有別的解釋。",
    hintZh: "對某人行為性質的明確定論。",
    expectedAnswer: "以外の何ものでもない",
    options: ["以外の何ものでもない", "に他ならない", "に決まっている", "とは言えない"],
    explanation: "「N + 以外の何ものでもない」是「絕對是 N，沒有其他可能」的強烈定論（書面）。「に他ならない」也是「正是」但更平和；「に決まっている」是「一定是」（推測肯定）；「とは言えない」是「不能說是」（局部否定）。本句要強調「就是推卸責任、別無其他」的斷定，「以外の何ものでもない」語氣最重。"
  },
  {
    id: "n1-grammar-dakenokotohaaru",
    surface: "だけのことはある",
    reading: "だけのことはある",
    meaningZh: "不愧是...有其價值",
    promptText: "彼の発表は素晴らしかった。三ヶ月も準備した ___。",
    promptContextZh: "他的發表很精彩，畢竟準備了三個月。",
    hintZh: "三個月準備與發表表現的對應關係。",
    expectedAnswer: "だけのことはある",
    options: ["だけのことはある", "ばかりに", "つもりだった", "ことになる"],
    explanation: "「~ + だけのことはある」是「不愧是，有它的價值」的稱讚語感，前句通常是大量投入或特殊條件，後句說明對應的優秀結果。「ばかりに」是「就因為...（負面結果）」；「つもりだった」是「原本打算」（意圖）；「ことになる」是「就會變成」（結論性陳述）。本句「三月準備→出色發表」是經典「だけのことはある」場景。"
  },
  {
    id: "n1-grammar-nagaramo",
    surface: "ながらも",
    reading: "ながらも",
    meaningZh: "雖然...卻...",
    promptText: "貧しい ___、家族みんなで支え合って暮らしている。",
    promptContextZh: "雖然貧窮，但全家人都相互扶持地生活著。",
    hintZh: "對家庭經濟狀況與相處方式的對比。",
    expectedAnswer: "ながらも",
    options: ["ながらも", "つつ", "ばかりに", "ものを"],
    explanation: "「い形 / な形 / N + ながらも」是「雖然...卻...」的讓步轉折（書面）。「つつ」是「邊...邊...」（並行動作，無讓步義）；「ばかりに」是負面因果；「ものを」是「明明...卻（遺憾、抱怨）」。本句是中性讓步「窮但相互扶持」，「ながらも」最合。"
  },
  {
    id: "n1-grammar-tohaiumonono",
    surface: "とはいうものの",
    reading: "とはいうものの",
    meaningZh: "話雖如此...",
    promptText: "海外旅行に行きたい。___、長期休暇が取れる見込みがない。",
    promptContextZh: "想出國旅行。話雖如此，看來請不到長假。",
    hintZh: "旅行意願與請假可能性之間的矛盾。",
    expectedAnswer: "とはいうものの",
    options: ["とはいうものの", "そうなれば", "そういうわけで", "とすると"],
    explanation: "「（前句）。とはいうものの、（後句）」是「話是這麼說，但事實是...」（強烈轉折，書面）。「そうなれば」是「如果那樣的話」（假設後續）；「そういうわけで」是「就是因為這樣...」（結論性原因）；「とすると」是「假設這樣的話」（中性假設）。本句承認願望但隨即說現實限制，「とはいうものの」是標準對應。"
  },
  {
    id: "n1-grammar-naramadashimo",
    surface: "ならまだしも",
    reading: "ならまだしも",
    meaningZh: "...的話還好但...",
    promptText: "ミスを一度する ___、何度も繰り返すのは無責任だ。",
    promptContextZh: "犯錯一次的話還說得過去，但反覆犯錯就太不負責任了。",
    hintZh: "對犯錯次數所做的容忍程度比較。",
    expectedAnswer: "ならまだしも",
    options: ["ならまだしも", "ならいざしらず", "とすれば", "といえども"],
    explanation: "「N / 普通形 + ならまだしも」是「如果是 X，還勉強接受；但 Y 就過分了」（容忍／不容忍的對比，後句通常更嚴重）。「ならいざしらず」相似但更書面；「とすれば」是「假設...的話」（中性假設）；「といえども」是「即使是...」（讓步）。本句「一次還好，反覆就不行」是典型對比，「ならまだしも」最口語自然。"
  },
  {
    id: "n1-grammar-kototote",
    surface: "こととて",
    reading: "こととて",
    meaningZh: "因為是...（致歉理由）",
    promptText: "急な ___、十分なお返事ができず申し訳ありません。",
    promptContextZh: "由於是緊急情況，無法給予充分的回覆，深感抱歉。",
    hintZh: "事情突然發生時對回應不周的解釋。",
    expectedAnswer: "こととて",
    options: ["こととて", "ものを", "とあって", "せいで"],
    explanation: "「N / 普通形 + こととて」是書面、致歉場合的「因為是...所以...（請體諒）」。「ものを」是「明明...卻（遺憾）」；「とあって」是「正因為發生 X 這件事」（事件因果，新聞風）；「せいで」是「都怪...」（口語負面因果）。本句是禮節性致歉，「こととて」唯一吻合。"
  },
  {
    id: "n1-grammar-nonannotte",
    surface: "のなんのって",
    reading: "のなんのって",
    meaningZh: "...得不得了",
    promptText: "昨日のラーメンは美味しい ___、思わず替え玉まで頼んでしまった。",
    promptContextZh: "昨天的拉麵實在太好吃了，不自覺地連加麵都點了。",
    hintZh: "拉麵的美味程度與點餐行為之間的因果。",
    expectedAnswer: "のなんのって",
    options: ["のなんのって", "ものを", "ばかりに", "とあって"],
    explanation: "「い形 / な形 + のなんのって」是「（程度）非常...，多到無法形容」（口語強調）。「ものを」是「明明...卻」（遺憾轉折）；「ばかりに」是負面因果；「とあって」是事件因果（書面）。本句要表達「實在太好吃」的口語誇張，「のなんのって」最自然。"
  },
  {
    id: "n1-grammar-danodano",
    surface: "だの",
    reading: "だの",
    meaningZh: "...啦...啦（抱怨）",
    promptText: "彼はいつも、忙しいだの 疲れた ___ と文句ばかり言っている。",
    promptContextZh: "他總是「忙啦」「累啦」地抱怨個不停。",
    hintZh: "他習慣性唸個不停的口頭禪。",
    expectedAnswer: "だの",
    options: ["だの", "やら", "とか", "なり"],
    explanation: "「A だの B だの」是「A 啦 B 啦」的列舉，多帶抱怨、不滿語感。本句前句已有「忙しいだの」，後句需配對。「やら〜やら」也是列舉但語感較中性、表示「狀況混雜」；「とか〜とか」是最口語的列舉（中性）；「なり〜なり」是「擇一去做」的建議列舉。本句明顯是抱怨清單，且需與前面「だの」配對，故「だの」唯一。"
  },
  {
    id: "n1-grammar-yarayara",
    surface: "やら",
    reading: "やら",
    meaningZh: "...啦...啦（混雜）",
    promptText: "引っ越しの準備で、荷造りをするやら、役所に行く ___ で、目が回るほど忙しい。",
    promptContextZh: "搬家準備又是打包又是跑公家機關，忙得頭都暈了。",
    hintZh: "搬家準備時並行進行的多項雜事。",
    expectedAnswer: "やら",
    options: ["やら", "だの", "とか", "とも"],
    explanation: "「A やら B やら」是「A 啦 B 啦」的混雜列舉，表達「事情多到混亂」的語感（中性／略負面）。本句前句已有「荷造りをするやら」，後句需配對。「だの」帶較強的抱怨色彩（本句是中性的忙碌，不是抱怨）；「とか」最口語但少了「混亂」感；「とも」是「即使」（讓步，非列舉）。本句的「混亂感」用「やら」最自然。"
  },
  {
    id: "n1-grammar-dakeni",
    surface: "だけに",
    reading: "だけに",
    meaningZh: "正因為...所以更...",
    promptText: "期待していた ___、結果が出なかったときの落胆は大きかった。",
    promptContextZh: "正因為很期待，所以結果不如預期時的失望特別大。",
    hintZh: "期待程度與失望程度之間的關係。",
    expectedAnswer: "だけに",
    options: ["だけに", "だけあって", "ばかりに", "とあって"],
    explanation: "「~ + だけに」是「正因為 X（理所當然的特性），所以結果更明顯／更深刻」（強對比因果）。「だけあって」是「不愧是...」（結果為「優秀／預期」的正面結論）；「ばかりに」是「就因為...（造成不希望結果）」（特定負面因果）；「とあって」是事件因果（新聞風）。本句強對比因果用「だけに」。"
  },
  {
    id: "n1-grammar-nishitemireba",
    surface: "にしてみれば",
    reading: "にしてみれば",
    meaningZh: "從...的角度來看",
    promptText: "親 ___、子供の進路はやはり安定した道を選んでほしいと思うものだ。",
    promptContextZh: "從父母的角度來看，當然會希望孩子選擇穩定的路。",
    hintZh: "父母看待孩子未來時的視角立場。",
    expectedAnswer: "にしてみれば",
    options: ["にしてみれば", "にしたら", "に対して", "について"],
    explanation: "「N + にしてみれば」是「從 N 的立場去想的話，（會這樣覺得）」，常用於同情或解釋對方心情。「にしたら」是相同意思但更口語；「に対して」是「對於」（對象）；「について」是「關於」（主題）。本句要表達「站在父母心情想」這個視角，且後句是書面（「と思うものだ」），「にしてみれば」比「にしたら」更合語體。"
  },
  {
    id: "n1-grammar-nikakawarazu",
    surface: "にかかわらず",
    reading: "にかかわらず",
    meaningZh: "不論...",
    promptText: "結果 ___、最後まで挑戦した姿勢は評価されるべきだ。",
    promptContextZh: "不論結果如何，堅持到最後的態度都應該得到肯定。",
    hintZh: "對挑戰精神的評價是否受結果影響。",
    expectedAnswer: "にかかわらず",
    options: ["にかかわらず", "に応じて", "に基づいて", "に伴って"],
    explanation: "「N + にかかわらず」是「不論 N 如何，都...」（無條件）。「に応じて」是「視 N 而定」（與不論相反）；「に基づいて」是「以 N 為依據」；「に伴って」是「隨著 N」（連動關係）。本句要表達「結果好壞不影響評價」的無條件斷定，「にかかわらず」唯一。注意與「にもかかわらず」（雖然...但是）區別：本句是「無關 X」，不是「儘管 X」。"
  },
  {
    id: "n1-grammar-nominarazu",
    surface: "のみならず",
    reading: "のみならず",
    meaningZh: "不僅...而且...",
    promptText: "この問題は学校 ___、家庭でも真剣に話し合われるべきだ。",
    promptContextZh: "這個問題不僅在學校，在家裡也應該認真討論。",
    hintZh: "問題討論範圍應該涵蓋的場所。",
    expectedAnswer: "のみならず",
    options: ["のみならず", "ばかりか", "に限らず", "を問わず"],
    explanation: "「N + のみならず」是書面、論述的「不僅 N，連 B 也...」（範圍擴大）。「ばかりか」相似但偏口語、且帶意外感；「に限らず」也是「不只限於 N」但語感較弱、後句常為並列舉例；「を問わず」是「不論 N 如何（規約口吻）」。本句是書面論述「不只學校、家裡也要」，「のみならず」最合。"
  },
  {
    id: "n1-grammar-nihikaete",
    surface: "にひかえて",
    reading: "にひかえて",
    meaningZh: "面臨...在即",
    promptText: "試験を一週間後 ___、生徒たちはピリピリしている。",
    promptContextZh: "考試一週後就要到了，學生們神經緊繃。",
    hintZh: "距離考試的時間長短與學生心理狀態的關係。",
    expectedAnswer: "にひかえて",
    options: ["にひかえて", "に先立って", "を経て", "に応じて"],
    explanation: "「N を ___ にひかえて」是「正面臨／在 N 即將到來的情況下」，常配「重大事件即將發生」這類前置語境。「に先立って」是「在 N 之前」（純時間先後，無「緊張即將」感）；「を経て」是「經過 N」（過程完成）；「に応じて」是「根據 N」（相對應）。本句的「考試一週後＝即將到來」是經典「にひかえて」場景。"
  },
  {
    id: "n1-grammar-nikotaete",
    surface: "にこたえて",
    reading: "にこたえて",
    meaningZh: "回應...",
    promptText: "観客の声援 ___、選手は最後の力を振り絞った。",
    promptContextZh: "回應觀眾的加油聲，選手使出了最後的力量。",
    hintZh: "選手最後努力的觸發來源。",
    expectedAnswer: "にこたえて",
    options: ["にこたえて", "に応じて", "に伴って", "に向かって"],
    explanation: "「N + にこたえて」是「回應 N（期待 / 聲援 / 要求）」，含「不辜負」的語感。「に応じて」是「視 N 而定／配合」（中性配合，無情感）；「に伴って」是「隨著 N」（連動關係）；「に向かって」是「朝向 N」（方向）。本句「應觀眾的聲援拼最後一把」是「にこたえて」的典型用法。"
  },
  {
    id: "n1-grammar-niterashite",
    surface: "に照らして",
    reading: "にてらして",
    meaningZh: "對照...來判斷",
    promptText: "現行の法律 ___、彼の行為は明らかに違反だ。",
    promptContextZh: "對照現行法律，他的行為明顯違反規定。",
    hintZh: "判斷行為合法性時所依據的參照。",
    expectedAnswer: "に照らして",
    options: ["に照らして", "に基づいて", "にともなって", "について"],
    explanation: "「N + に照らして」是「對照 N（標準／前例／規定）來判斷」（正式、書面）。「に基づいて」是「以 N 為依據／基礎」（中性依據，不含對照動作）；「にともなって」是「隨著 N」（連動）；「について」是「關於」（主題）。本句要強調「拿法律當標尺判斷他的行為」的對照動作，「に照らして」最精準。"
  },
  {
    id: "n1-grammar-yorihokanai",
    surface: "よりほかない",
    reading: "よりほかない",
    meaningZh: "別無他法只能...",
    promptText: "電車が止まってしまった以上、歩いて帰る ___。",
    promptContextZh: "既然電車停了，就只能走路回家了。",
    hintZh: "電車停駛後對回家方式的判斷。",
    expectedAnswer: "よりほかない",
    options: ["よりほかない", "わけにはいかない", "ものではない", "までもない"],
    explanation: "「Vる + よりほかない」是「除了 V 之外沒有別的辦法」（被迫採取唯一手段）。「わけにはいかない」是「不能 V」（道德／實際限制）；「ものではない」是「不應該 V」（規範性）；「までもない」是「沒必要 V」（不必要）。本句「沒車只能走路」是典型「唯一手段」，「よりほかない」最合。"
  },
  {
    id: "n1-grammar-maitoshite",
    surface: "まいとして",
    reading: "まいとして",
    meaningZh: "為了不...而...",
    promptText: "二度と同じ過ちを犯し ___、彼は毎日反省日記をつけている。",
    promptContextZh: "為了不再犯同樣的錯，他每天寫反省日記。",
    hintZh: "他每天寫反省日記的動機。",
    expectedAnswer: "まいとして",
    options: ["まいとして", "ようとして", "ないでいて", "ようにして"],
    explanation: "「Vる + まいとして」是文語的「下定決心不 V，為此採取行動」（強烈意志否定）。「ようとして」是「想要 V」（正面意志，與本句相反）；「ないでいて」不是固定句型（陷阱）；「ようにして」是「為了 V 而...」（中性目的）。本句帶有「絕不再犯」的決心語感，N1 書面用「まいとして」最貼，且結構「Vる stem + まい」剛好接「犯し」。"
  },
  {
    id: "n1-grammar-bekarazu",
    surface: "べからず",
    reading: "べからず",
    meaningZh: "不得...（嚴格禁止）",
    promptText: "立ち入る ___。関係者以外、ここから先は入れません。",
    promptContextZh: "禁止進入。除相關人員外，此處以後不得進入。",
    hintZh: "對非相關人員進入的處理方式。",
    expectedAnswer: "べからず",
    options: ["べからず", "べきではない", "てはいけない", "ものではない"],
    explanation: "「Vる + べからず」是文語、告示牌的「不得 V」（最強烈禁止）。「べきではない」是「不應該 V」（道德建議，現代書面）；「てはいけない」是「不可以 V」（一般禁止，口語）；「ものではない」是「不應該 V」（規範性，口語）。本句是告示牌口吻（「立入禁止」「撮影するべからず」），「べからず」最精準。"
  },
  {
    id: "n1-grammar-bekushite",
    surface: "べくして",
    reading: "べくして",
    meaningZh: "理應...必然...",
    promptText: "あの事故は起こる ___ 起こった。安全管理を怠っていたのだから。",
    promptContextZh: "那場事故是必然會發生的，因為安全管理一直被忽視。",
    hintZh: "對事故發生的必然性與管理問題之間的關係。",
    expectedAnswer: "べくして",
    options: ["べくして", "べきだとして", "に至って", "ゆえに"],
    explanation: "「Vる + べくして + 同じ V」結構是「該發生的事終於發生（必然性）」，常配「事故・失敗・成功」這類已成立的結果回顧。「べきだとして」是「應該 V，所以...」（責任）；「に至って」是「終於到了 V 的地步」（時點）；「ゆえに」是「因為」（純因果）。本句「事故起こるべくして起こった」是經典定型句。"
  },
  {
    id: "n1-grammar-tonareba",
    surface: "となれば",
    reading: "となれば",
    meaningZh: "既然到了...的話",
    promptText: "海外赴任が決まった ___、引っ越しの準備を始めなければならない。",
    promptContextZh: "既然外派海外的事定了，就得開始準備搬家了。",
    hintZh: "外派確定後對接下來該做的事的判斷。",
    expectedAnswer: "となれば",
    options: ["となれば", "とすれば", "とあって", "とはいえ"],
    explanation: "「~ + となれば」是「既然到了...的階段／既然成了...的事實」，後句通常是「必須採取的後續行動」。「とすれば」是「假設...的話」（中性假設，本句不是假設而是已成立）；「とあって」是「正因為發生 X 這件事」（事件因果，新聞風）；「とはいえ」是「雖然如此」（讓步）。本句既定事實＋後續行動，「となれば」最合。"
  },
  {
    id: "n1-grammar-niitatte",
    surface: "にいたって",
    reading: "にいたって",
    meaningZh: "到了...的地步才...",
    promptText: "事故が起きる ___、ようやく対策の見直しが始まった。",
    promptContextZh: "直到事故發生了，才終於開始檢討對策。",
    hintZh: "事故發生與對策檢討啟動之間的先後關係。",
    expectedAnswer: "にいたって",
    options: ["にいたって", "にあたって", "に先立って", "に伴って"],
    explanation: "「Vる / N + にいたって」是「到了 V／N 這種地步才（為時已晚）」，後句常配「ようやく／はじめて」表示遲到的反應（書面）。「にあたって」是「在 N 之際／著手 N 時」（中性）；「に先立って」是「在 N 之前」（時間先後）；「に伴って」是「隨著 N」（連動）。本句「事故發生後才開始檢討」是典型遲到反應，「にいたって」最精準。"
  },
  {
    id: "n1-grammar-niitarumade",
    surface: "にいたるまで",
    reading: "にいたるまで",
    meaningZh: "從...到...所有都...",
    promptText: "彼の趣味は釣りから料理 ___ 多岐にわたる。",
    promptContextZh: "他的興趣從釣魚到烹飪，種類繁多。",
    hintZh: "他興趣涵蓋範圍的廣度。",
    expectedAnswer: "にいたるまで",
    options: ["にいたるまで", "を経て", "について", "に関して"],
    explanation: "「N から N + にいたるまで」是「從 X 到 Y 所有範圍都涵蓋」（極端強調範圍之廣）。「を経て」是「經過 N」（過程性，時間序）；「について」「に関して」都是「關於」（主題）。本句「釣魚→料理 涵蓋整個範圍」的廣度強調，「にいたるまで」最合。"
  },
  {
    id: "n1-grammar-monoka",
    surface: "ものか",
    reading: "ものか",
    meaningZh: "怎麼可能...！",
    promptText: "あんなひどいことを言われて、許せる ___。",
    promptContextZh: "被說了那麼過分的話，怎麼可能原諒得了！",
    hintZh: "對對方所說的話的反應態度。",
    expectedAnswer: "ものか",
    options: ["ものか", "ものを", "ものの", "ものとして"],
    explanation: "「Vる / い形 + ものか」是「絕對不會 V／絕對不是」的強烈否定意志（口語）。「ものを」是「明明...卻（遺憾）」（轉折）；「ものの」是「雖然...但是」（讓步）；「ものとして」是「當作 N」（假定）。本句「絕不原諒」的強烈否定，唯有「ものか」。"
  },
  {
    id: "n1-grammar-monodehanai",
    surface: "ものではない",
    reading: "ものではない",
    meaningZh: "不應該...",
    promptText: "人の悪口は安易に言う ___。本人の前ではもちろん、陰でも控えるべきだ。",
    promptContextZh: "不應該輕易說別人的壞話。當面就不用說了，背後也該避免。",
    hintZh: "說別人壞話這件事的道德判斷。",
    expectedAnswer: "ものではない",
    options: ["ものではない", "ものか", "ものを", "ことはない"],
    explanation: "「Vる + ものではない」是「不該 V」（道德規範，書面）。「ものか」是「絕對不會」（強烈否定意志，本句不是發誓而是訓誡）；「ものを」是「明明...卻」（遺憾）；「ことはない」是「不需要 V」（不必要）。本句是「不該說壞話」的道德訓示，「ものではない」是規範口吻最自然的選擇。"
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

// Anchor on the array-closing `};` boundary, regardless of which item
// happens to be the last entry. This lets batch 3 / 4 / N append on top
// of each other without each script needing to know the previous tail.
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
console.log(`Inserted ${ITEMS.length} new N1 文法形式選擇 items into examBlocks.ts.`);
