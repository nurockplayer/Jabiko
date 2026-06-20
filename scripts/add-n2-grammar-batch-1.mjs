// One-off migration: append 30 ORIGINAL N2 文法形式選擇 items to
// examBlocks.ts. The bank was N1-heavy (95 patterns) vs N2 (~35); this
// batch fills common N2 patterns that weren't present yet.
//
// Same rules as the N1 batches:
//   - 100% original. Pattern NAMES are facts (not copyrightable); every
//     example sentence / distractor / explanation is written from
//     scratch. No third-party question bank is copied or paraphrased.
//   - 4 options each (1 correct + 3 real patterns chosen so only one
//     actually fits -- avoids the "two valid answers" trap), with the
//     explanation saying why each distractor is wrong.
//   - hintZh must pass the content guard (corepack pnpm check:exam): no
//     >=2-char token from meaningZh may appear in hintZh.
//   - id unique, surface not already in the bank.
//
// Run: node scripts/add-n2-grammar-batch-1.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "..", "src", "domain", "examBlocks.ts");

const ITEMS = [
  {
    id: "n2-grammar-seide",
    surface: "せいで",
    reading: "せいで",
    meaningZh: "都怪（負面原因）",
    promptText: "朝寝坊した ___、大事な会議に遅刻してしまった。",
    promptContextZh: "都怪睡過頭，重要的會議遲到了。",
    hintZh: "睡過頭和開會遲到的前後關連。",
    expectedAnswer: "せいで",
    options: ["せいで", "おかげで", "かわりに", "からには"],
    explanation: "「〜せいで」把不好的結果歸咎於前項原因。「おかげで」是正面的「多虧」（本句是壞結果，不合）；「かわりに」是「代替／相對地」；「からには」是「既然…就」。本句要怪睡過頭導致遲到，唯有「せいで」。"
  },
  {
    id: "n2-grammar-kuseni",
    surface: "くせに",
    reading: "くせに",
    meaningZh: "明明卻（帶責備）",
    promptText: "彼は本当は知っている ___、何も知らないふりをしている。",
    promptContextZh: "他明明知道，卻裝作什麼都不知道。",
    hintZh: "他其實知情，表面上的反應。",
    expectedAnswer: "くせに",
    options: ["くせに", "おかげで", "とおりに", "かぎり"],
    explanation: "「〜くせに」是帶責備、不滿的「明明…卻」，前後同一主語。「おかげで」正面；「とおりに」是「按照」；「かぎり」是「只要／限度」。本句責備他裝傻，故「くせに」最合。與中性的「のに」相比，「くせに」語氣更帶輕蔑。"
  },
  {
    id: "n2-grammar-warini",
    surface: "わりに",
    reading: "わりに",
    meaningZh: "相對於意外地",
    promptText: "この店は値段が高い ___、味はそれほどでもない。",
    promptContextZh: "這家店價格雖高，味道卻沒那麼好（不成比例）。",
    hintZh: "價格與實際味道之間的落差。",
    expectedAnswer: "わりに",
    options: ["わりに", "とおりに", "うえに", "ばかりに"],
    explanation: "「〜わりに」表示「就…的程度而言，結果與預期不成比例」。「とおりに」是「正如」；「うえに」是「不僅…而且…（追加同向）」（本句是反差，不合）；「ばかりに」是「就因為…造成壞結果」。本句價格高但味道不相稱，唯有「わりに」。"
  },
  {
    id: "n2-grammar-nitaishite",
    surface: "に対して",
    reading: "にたいして",
    meaningZh: "對於／相對比",
    promptText: "兄が社交的なの ___、弟は内向的だ。",
    promptContextZh: "相對於哥哥很善於社交，弟弟則很內向。",
    hintZh: "兄弟兩人個性的並列比較。",
    expectedAnswer: "に対して",
    options: ["に対して", "について", "にとって", "において"],
    explanation: "「〜に対して」在此表「對比」（A 相對於 B）。「について」是「關於（主題）」；「にとって」是「對…來說（立場）」；「において」是「在…場合/方面」。本句是哥哥 vs 弟弟的對比，故「に対して」。注意「に対して」另有「對某對象做動作」之意，靠語境分辨。"
  },
  {
    id: "n2-grammar-niyotte",
    surface: "によって",
    reading: "によって",
    meaningZh: "依而不同／透過",
    promptText: "考え方は人 ___ さまざまだ。",
    promptContextZh: "想法因人而異，各有不同。",
    hintZh: "不同的人在想法上的差異。",
    expectedAnswer: "によって",
    options: ["によって", "について", "にかけて", "にわたって"],
    explanation: "「〜によって」在此表「依…而各有不同」，常配「さまざま／違う／異なる」。「について」是「關於」；「にかけて」是「從…到…（範圍/時間）」；「にわたって」是「歷經…整個範圍」。本句「因人而異」是「によって」典型用法。"
  },
  {
    id: "n2-grammar-nichigainai",
    surface: "に違いない",
    reading: "にちがいない",
    meaningZh: "一定是（推測）",
    promptText: "電気が消えているから、彼はもう寝た ___。",
    promptContextZh: "燈關著，他一定已經睡了。",
    hintZh: "從關燈這個線索做出的判斷。",
    expectedAnswer: "に違いない",
    options: ["に違いない", "わけがない", "おそれがある", "とは限らない"],
    explanation: "「〜に違いない」是「(根據根據)一定是…」的強推測。「わけがない」是「不可能」（相反）；「おそれがある」是「有…的危險」；「とは限らない」是「未必」。本句由關燈推斷「一定睡了」，唯有「に違いない」。"
  },
  {
    id: "n2-grammar-nioujite",
    surface: "に応じて",
    reading: "におうじて",
    meaningZh: "依而相應調整",
    promptText: "収入 ___、税金の額も変わる。",
    promptContextZh: "稅金的金額會隨著收入而相應改變。",
    hintZh: "收入高低與要繳稅金之間的連動。",
    expectedAnswer: "に応じて",
    options: ["に応じて", "において", "に際して", "をめぐって"],
    explanation: "「〜に応じて」是「配合…的變化而相應地（調整）」，前項常為可變的量（收入、能力、狀況）。「において」是「在…場合」；「に際して」是「在…之際」；「をめぐって」是「圍繞…（議論）」。本句稅額隨收入連動，故「に応じて」。"
  },
  {
    id: "n2-grammar-nisotte",
    surface: "に沿って",
    reading: "にそって",
    meaningZh: "沿著／按照方針",
    promptText: "会社の方針 ___、計画を立て直した。",
    promptContextZh: "按照公司的方針，重新擬定了計畫。",
    hintZh: "公司既定方針與計畫之間的依循關係。",
    expectedAnswer: "に沿って",
    options: ["に沿って", "に反して", "をこめて", "にかけて"],
    explanation: "「〜に沿って」是「順著（方針/期待/河川）」不偏離。「に反して」是「與…相反」（正相反）；「をこめて」是「滿懷（心意）」；「にかけて」是「從…到…」。本句依循公司方針，故「に沿って」。"
  },
  {
    id: "n2-grammar-nioite",
    surface: "において",
    reading: "において",
    meaningZh: "在場合／在方面",
    promptText: "今日の会議は第一会議室 ___ 行われます。",
    promptContextZh: "今天的會議將在第一會議室舉行。",
    hintZh: "會議進行的場所說明。",
    expectedAnswer: "において",
    options: ["において", "にとって", "によって", "に対して"],
    explanation: "「〜において」是書面的「在（某場所／時代／領域）」。「にとって」是「對…來說」；「によって」是「依／透過」；「に対して」是「對於／對比」。本句指出會議場所，故「において」。口語可用「で」，書面正式用「において」。"
  },
  {
    id: "n2-grammar-wohajime",
    surface: "をはじめ",
    reading: "をはじめ",
    meaningZh: "以為首及其他",
    promptText: "この動物園にはパンダ ___、さまざまな動物がいる。",
    promptContextZh: "這座動物園以熊貓為首，還有各式各樣的動物。",
    hintZh: "熊貓與園內其他動物的舉例關係。",
    expectedAnswer: "をはじめ",
    options: ["をはじめ", "をこめて", "を中心に", "はもちろん"],
    explanation: "「N をはじめ(として)」是「以最具代表性的 N 為首，還有其他同類」。「をこめて」是「滿懷」；「を中心に」是「以…為中心」（強調核心而非舉例代表）；「はもちろん」是「…自不待言」需接「も」呼應。本句舉熊貓為代表再帶出其他，故「をはじめ」。"
  },
  {
    id: "n2-grammar-wotsuujite",
    surface: "を通じて",
    reading: "をつうじて",
    meaningZh: "透過／在整個期間",
    promptText: "インターネット ___、世界中の人と交流できる。",
    promptContextZh: "透過網路，可以和世界各地的人交流。",
    hintZh: "網路作為與各地交流的手段。",
    expectedAnswer: "を通じて",
    options: ["を通じて", "に応じて", "をめぐって", "にわたって"],
    explanation: "「〜を通じて」表「以…為媒介/手段」或「在整個期間一直」。「に応じて」是「依…相應」；「をめぐって」是「圍繞…議論」；「にわたって」是「歷經整個範圍」。本句網路是交流的手段，故「を通じて」。"
  },
  {
    id: "n2-grammar-womotoni",
    surface: "をもとに",
    reading: "をもとに",
    meaningZh: "以為依據",
    promptText: "アンケートの結果 ___、新商品を開発した。",
    promptContextZh: "以問卷的結果為依據，開發了新商品。",
    hintZh: "問卷結果與新商品開發之間的根據關係。",
    expectedAnswer: "をもとに",
    options: ["をもとに", "をめぐって", "に応じて", "に沿って"],
    explanation: "「〜をもとに(して)」是「以…為素材/根據」。「をめぐって」是「圍繞…」；「に応じて」是「依…相應調整」；「に沿って」是「順著方針」（沿著既定方向，非「以…為素材」）。本句以問卷為素材開發商品，故「をもとに」。"
  },
  {
    id: "n2-grammar-tototan",
    surface: "たとたん",
    reading: "たとたん",
    meaningZh: "一就在那瞬間",
    promptText: "立ち上がっ ___、めまいがした。",
    promptContextZh: "一站起來，那一瞬間就頭暈了。",
    hintZh: "站起身那一刻身體出現的反應。",
    expectedAnswer: "たとたん",
    options: ["たとたん", "たうえで", "たところで", "たばかり"],
    explanation: "「Vた + とたん(に)」是「就在 V 的那一瞬間，意外地發生後項」，後項多為說話者未預期、不可控的事。「たうえで」是「在做完…之後再…」（有計畫的順序）；「たところで」是「即使…也…」（讓步）；「たばかり」是「才剛…」（時間近）。本句站起瞬間突然暈眩，故「たとたん」。"
  },
  {
    id: "n2-grammar-tatokoro",
    surface: "たところ",
    reading: "たところ",
    meaningZh: "一結果發現",
    promptText: "店に問い合わせ ___、すでに売り切れだった。",
    promptContextZh: "向店家詢問之後，結果發現已經賣完了。",
    hintZh: "向店家詢問後得到的回覆狀況。",
    expectedAnswer: "たところ",
    options: ["たところ", "たとたん", "たすえに", "たかぎり"],
    explanation: "「Vた + ところ」是「做了 V 之後，(契機性地)發現/得到某結果」，偏書面、中性。「たとたん」強調「同一瞬間」且後項意外；「たすえに」是「歷經…最終」；「たかぎり」非固定句型。本句詢問後得知售罄，是「契機→發現」，故「たところ」。"
  },
  {
    id: "n2-grammar-ippouda",
    surface: "一方だ",
    reading: "いっぽうだ",
    meaningZh: "不斷單向發展",
    promptText: "物価は上がる ___ で、生活が苦しくなる一方だ。",
    promptContextZh: "物價不斷往上漲，生活越來越辛苦。",
    hintZh: "物價持續往同一個方向變動。",
    expectedAnswer: "一方だ",
    options: ["一方だ", "ところだ", "ばかりだ", "次第だ"],
    explanation: "「Vる + 一方だ」是「持續朝單一方向(多為惡化)發展」。「ばかりだ」也有「越來越…」之意、語感接近，但本句句尾已用「一方だ」呼應、且空格在「上がる ___ で」需接名詞化的「一方」構成「上がる一方で」。「ところだ」是「正要/剛…」；「次第だ」是「取決於/原委」。故「一方」最合。"
  },
  {
    id: "n2-grammar-hanmen",
    surface: "反面",
    reading: "はんめん",
    meaningZh: "另一面相反",
    promptText: "この仕事は給料がいい ___、責任も重い。",
    promptContextZh: "這份工作薪水好，但另一方面責任也很重。",
    hintZh: "同一份工作的好處與代價並陳。",
    expectedAnswer: "反面",
    options: ["反面", "うえに", "あまり", "ばかりに"],
    explanation: "「〜反面」是「同一事物有正反兩面」，前後對比。「うえに」是「不僅…而且…（同向追加）」（本句是正反對比，不合）；「あまり」是「由於太…（程度因果）」；「ばかりに」是「就因為…(壞結果)」。本句薪水好但責任重，是一體兩面，故「反面」。"
  },
  {
    id: "n2-grammar-ueha",
    surface: "上は",
    reading: "うえは",
    meaningZh: "既然就應當",
    promptText: "引き受けた ___、最後まで責任を持ってやり遂げる。",
    promptContextZh: "既然接下了，就要負責到底完成它。",
    hintZh: "接下任務之後該有的覺悟。",
    expectedAnswer: "上は",
    options: ["上は", "うちに", "あげく", "ところ"],
    explanation: "「Vた + 上は」是「既然已經…，理所當然就要/必須…」，後句常配決心或義務。「うちに」是「趁…的時候」；「あげく」是「…的結果(負面)」；「ところ」是「正在/契機」。本句既然接了就負責到底，故「上は」。與「以上(は)」近義，可互換。"
  },
  {
    id: "n2-grammar-shidai",
    surface: "次第",
    reading: "しだい",
    meaningZh: "一就立刻（書面）",
    promptText: "詳細が決まり ___、改めてご連絡いたします。",
    promptContextZh: "細節一確定，會再另行與您聯繫。",
    hintZh: "細節確定後接下來的聯繫安排。",
    expectedAnswer: "次第",
    options: ["次第", "とたん", "うちに", "まま"],
    explanation: "「Vます stem + 次第」是「一…就立刻…」的書面、商務用法，後項是說話者意志（連絡する／お知らせする 等）。「とたん」也是「一…就…」但後項多為意外、不可控的事，且接 Vた；本句空格前是「決まり」(ます stem) 且後項是禮貌的意志行為，故「次第」。「うちに」是「趁…」；「まま」是「保持…狀態」。"
  },
  {
    id: "n2-grammar-nikaketewa",
    surface: "にかけては",
    reading: "にかけては",
    meaningZh: "在方面最拿手",
    promptText: "料理の腕 ___、彼の右に出る者はいない。",
    promptContextZh: "在廚藝這方面，沒有人比得上他。",
    hintZh: "他在做菜這項能力上的地位。",
    expectedAnswer: "にかけては",
    options: ["にかけては", "において", "にとって", "に関して"],
    explanation: "「N にかけては」是「論…(某能力/領域)的話，(某人)最厲害」，後句必為正面、稱讚。「において」是中性的「在…方面」(無稱讚義)；「にとって」是「對…來說」；「に関して」是「關於」。本句後句是「無人能及」的稱讚，故「にかけては」。"
  },
  {
    id: "n2-grammar-kake",
    surface: "かけ",
    reading: "かけ",
    meaningZh: "做到一半",
    promptText: "読み ___ の本が机の上に置いてある。",
    promptContextZh: "讀到一半的書放在桌上。",
    hintZh: "桌上那本書目前的閱讀狀態。",
    expectedAnswer: "かけ",
    options: ["かけ", "きり", "がち", "ぎみ"],
    explanation: "「Vます stem + かけ(の)」是「做到一半、還沒做完」。「きり」是「就…再也(沒)…」；「がち」是「容易/常常…(傾向)」；「ぎみ」是「略有…的感覺」。本句書讀到一半，故「かけ」。注意「かける」也可當動詞「開始做」，這裡是名詞化的中途狀態。"
  },
  {
    id: "n2-grammar-kirenai",
    surface: "きれない",
    reading: "きれない",
    meaningZh: "做不完／無法完全",
    promptText: "料理が多すぎて、とても食べ ___。",
    promptContextZh: "菜太多了，實在吃不完。",
    hintZh: "菜量太多時對於吃光的可能性。",
    expectedAnswer: "きれない",
    options: ["きれない", "がたい", "かねない", "ようがない"],
    explanation: "「Vます stem + きれない」是「(數量/程度太大)無法做完、做盡」。「がたい」是「(心理上)難以…」(如「信じがたい」)；「かねない」是「有可能(發生壞事)」；「ようがない」是「想做也沒方法」(本句是量太多吃不完，不是沒方法)。本句菜多到吃不完(數量)，故「きれない」。反義「きる」=徹底做完。"
  },
  {
    id: "n2-grammar-nuku",
    surface: "ぬく",
    reading: "ぬく",
    meaningZh: "堅持到底做完",
    promptText: "苦しかったが、最後まで走り ___。",
    promptContextZh: "雖然很痛苦，但堅持跑到了最後。",
    hintZh: "在痛苦中對於這場跑步的完成方式。",
    expectedAnswer: "ぬく",
    options: ["ぬく", "きる", "かける", "だす"],
    explanation: "「Vます stem + ぬく」是「克服困難、堅持到最後做完」，強調過程的艱辛與毅力。「きる」也是「完全做完」但偏「分量上做盡」、不強調克服困難；本句有「苦しかったが(雖然痛苦)」的奮鬥語感，故「ぬく」更貼。「かける」是「做到一半」；「だす」是「開始…起來」。"
  },
  {
    id: "n2-grammar-gachi",
    surface: "がち",
    reading: "がち",
    meaningZh: "容易往往（傾向）",
    promptText: "冬は寒くて、家にこもり ___ になる。",
    promptContextZh: "冬天很冷，往往容易窩在家裡。",
    hintZh: "天冷時對於外出意願的變化。",
    expectedAnswer: "がち",
    options: ["がち", "ぎみ", "っぽい", "かけ"],
    explanation: "「Vます stem / N + がち」是「容易、往往(發生不太好的傾向)」。「ぎみ」是「略微帶有…的感覺」(程度輕)；「っぽい」是「帶有…性質/像…」；「かけ」是「做到一半」。本句天冷常窩家裡是傾向，故「がち」。「病気がち」「遅れがち」等為常見搭配。"
  },
  {
    id: "n2-grammar-gimi",
    surface: "気味",
    reading: "ぎみ",
    meaningZh: "略有的感覺",
    promptText: "少し風邪 ___ なので、今日は早く帰ります。",
    promptContextZh: "有點感冒的感覺，所以今天早點回去。",
    hintZh: "身體目前不太舒服的輕微狀態。",
    expectedAnswer: "気味",
    options: ["気味", "がち", "だらけ", "向き"],
    explanation: "「N / Vます stem + 気味」是「略微有…的傾向/感覺」(程度輕微)。「がち」是「常常、容易(發生)」(頻率傾向)；「だらけ」是「滿是…」；「向き」是「適合…」。本句「有點感冒」是輕微狀態，故「気味」。「太り気味」「疲れ気味」常見。"
  },
  {
    id: "n2-grammar-darake",
    surface: "だらけ",
    reading: "だらけ",
    meaningZh: "滿是（負面）",
    promptText: "子供は泥 ___ になって、元気に遊んでいる。",
    promptContextZh: "小孩弄得滿身是泥，精神十足地玩著。",
    hintZh: "小孩玩耍後全身的狀態。",
    expectedAnswer: "だらけ",
    options: ["だらけ", "気味", "がち", "ばかり"],
    explanation: "「N + だらけ」是「(到處)滿是…」，多為負面、髒亂或數量多到困擾(泥・傷・間違い・借金)。「気味」是「略有…感覺」；「がち」是「常常…」；「ばかり」是「淨是、只有」(語感較中性，且常指單一事物反覆)。本句滿身是泥，故「だらけ」。"
  },
  {
    id: "n2-grammar-ppoi",
    surface: "っぽい",
    reading: "っぽい",
    meaningZh: "帶有像（性質）",
    promptText: "彼は最近、怒り ___ 性格になった気がする。",
    promptContextZh: "感覺他最近變得有點易怒的性格。",
    hintZh: "對他近來性格變化的觀察。",
    expectedAnswer: "っぽい",
    options: ["っぽい", "気味", "がち", "らしい"],
    explanation: "「N / Vます stem + っぽい」是「帶有…的性質、容易…、像…」(口語，常帶評價)。「気味」是「略有…感覺」；「がち」是「容易/常常(某行為)」；「らしい」是「像…該有的樣子」或「聽說」。本句指性格特質「易怒」，故「っぽい」。「怒りっぽい」「子供っぽい」「忘れっぽい」常見。"
  },
  {
    id: "n2-grammar-wakenihaikanai",
    surface: "わけにはいかない",
    reading: "わけにはいかない",
    meaningZh: "(情理上)不能",
    promptText: "明日は大事な試験だから、休む ___。",
    promptContextZh: "明天有重要的考試，所以不能請假。",
    hintZh: "明天有考試時對於請假的考量。",
    expectedAnswer: "わけにはいかない",
    options: ["わけにはいかない", "わけがない", "ものではない", "ことはない"],
    explanation: "「Vる + わけにはいかない」是「(基於情理、義務、心理)不能那樣做」。「わけがない」是「不可能(會)」(否定可能性)；「ものではない」是「不應該(道德常理)」；「ことはない」是「不必」。本句因考試而「不能請假」(情理上)，故「わけにはいかない」。"
  },
  {
    id: "n2-grammar-wakeganai",
    surface: "わけがない",
    reading: "わけがない",
    meaningZh: "不可能會",
    promptText: "あんなに練習したのだから、失敗する ___。",
    promptContextZh: "都練習得那麼勤了，不可能會失敗。",
    hintZh: "大量練習之後對失敗可能性的判斷。",
    expectedAnswer: "わけがない",
    options: ["わけがない", "わけにはいかない", "ほかない", "までもない"],
    explanation: "「Vる + わけがない」是「(從道理推斷)絕不可能…」。「わけにはいかない」是「(情理上)不能…」；「ほかない」是「只能…」；「までもない」是「沒必要…」。本句由「練得那麼勤」推斷「不可能失敗」，故「わけがない」。"
  },
  {
    id: "n2-grammar-kotohanai",
    surface: "ことはない",
    reading: "ことはない",
    meaningZh: "沒必要用不著",
    promptText: "まだ時間があるから、そんなに急ぐ ___。",
    promptContextZh: "還有時間，用不著那麼著急。",
    hintZh: "時間還夠時對於趕時間的看法。",
    expectedAnswer: "ことはない",
    options: ["ことはない", "ものではない", "わけがない", "どころではない"],
    explanation: "「Vる + ことはない」是「沒必要…、用不著…」，常用於安慰或勸告。「ものではない」是「不應該(道德)」；「わけがない」是「不可能」；「どころではない」是「哪有心思…(根本不是…的時候)」。本句時間還夠、勸對方不必急，故「ことはない」。"
  }
];

// uniqueness + basic sanity
{
  const ids = new Set();
  const surfaces = new Set();
  for (const it of ITEMS) {
    if (ids.has(it.id)) { console.error(`dup id ${it.id}`); process.exit(1); }
    if (surfaces.has(it.surface)) { console.error(`dup surface ${it.surface}`); process.exit(1); }
    if (!it.options.includes(it.expectedAnswer)) { console.error(`answer not in options ${it.id}`); process.exit(1); }
    if (it.options.length !== 4) { console.error(`need 4 options ${it.id}`); process.exit(1); }
    ids.add(it.id); surfaces.add(it.surface);
  }
}

const fmt = (s) => JSON.stringify(s);
function block(item) {
  return [
    "  examQuestion({",
    `    id: ${fmt(item.id)},`,
    `    level: "N2",`,
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
if (!ANCHOR_REGEX.test(text)) {
  console.error("Array-end anchor not found in examBlocks.ts.");
  process.exit(1);
}
const eol = text.includes("\r\n") ? "\r\n" : "\n";
const newBlocks = ITEMS.map(block).join("," + eol).replace(/\n/g, eol);
const replacement = `})${eol},${eol}${newBlocks}${eol}];${eol}${eol}export function buildExamQuestionPool`;
text = text.replace(ANCHOR_REGEX, replacement);
writeFileSync(target, text, "utf8");
console.log(`Inserted ${ITEMS.length} new N2 文法形式選擇 items.`);
