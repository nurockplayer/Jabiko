import type { PracticeQuestion, VocabularyItem } from "./types";
import { patternInstructionI18n, sentencePatternI18n } from "./sentencePatterns.i18n";

export type SentencePatternId =
  | "starter-desu"
  | "starter-particles"
  | "n5-sonzai"
  | "n5-ichi"
  | "n5-joshi2"
  | "n5-joshi3"
  | "n5-hikaku"
  | "n5-suki-dekiru"
  | "n5-sasoi"
  | "n5-onegai"
  | "n5-riyuu"
  | "n5-toki"
  | "n5-keiyoushi"
  | "n5-josuushi"
  | "n5-teido"
  | "n4-ndesu"
  | "n4-suiryou"
  | "n4-ishi"
  | "n4-meirei"
  | "n4-shushoku"
  | "n4-kansetsu"
  | "n4-fukugou"
  | "n4-henka"
  | "n4-jikan"
  | "n4-juju"
  | "n4-chikaku"
  | "te-kudasai"
  | "nakute-mo-ii"
  | "te-morau"
  | "to-omou"
  | "mae-ato"
  | "nagara-tari"
  | "te-aux";

export type SentencePatternItem = {
  id: string;
  patternId: SentencePatternId;
  promptText: string;
  /**
   * Pre-answer hint: a neutral situation description shown above the
   * prompt. Must NOT name the answer's grammatical role or use the
   * Chinese gloss of any candidate pattern (no 「請」「禁止」「不必」
   * 「必須」「可以」「以為」「說」 etc.); a guard script enforces this.
   */
  hintZh: string;
  /** Full Chinese translation, shown POST-answer in the feedback panel. */
  promptContextZh: string;
  expectedAnswer: string;
  options: string[];
  explanation: string;
};

const PATTERN_LABEL_ZH: Record<SentencePatternId, string> = {
  "starter-desu": "基本句 〜です",
  "starter-particles": "助詞入門",
  "n5-sonzai": "存在 あります・います",
  "n5-ichi": "位置與指示",
  "n5-joshi2": "助詞II へ・で・と・や",
  "n5-joshi3": "助詞III の・も・か・から",
  "n5-hikaku": "比較 より・ほうが・いちばん",
  "n5-suki-dekiru": "好惡與能力",
  "n5-sasoi": "邀約與提議 ませんか・ましょう",
  "n5-onegai": "請求與建議 ください・ほうがいい",
  "n5-riyuu": "理由與逆接 から・ので・が",
  "n5-toki": "時間與經驗 とき・もう・でしょう",
  "n5-keiyoushi": "形容詞的連接與變化",
  "n5-josuushi": "助数詞 數量的說法",
  "n5-teido": "程度與頻度 あまり・よく",
  "n4-ndesu": "說明語氣 〜んです",
  "n4-suiryou": "推量與原因 かもしれない・て",
  "n4-ishi": "打算與決定 つもり・ことにする",
  "n4-meirei": "命令與禁止 しろ・するな",
  "n4-shushoku": "名詞修飾節 〜した＋名詞",
  "n4-kansetsu": "間接疑問 かどうか・〜か",
  "n4-fukugou": "複合動詞 〜はじめる・〜方",
  "n4-henka": "變化 ようになる・くする・まま",
  "n4-jikan": "時間 間・までに・おきに",
  "n4-juju": "授受與請託 くれる・いただく",
  "n4-chikaku": "知覺與限定 見える・しか",
  "te-kudasai": "請求 / 許可 / 禁止",
  "nakute-mo-ii": "不必 / 必須",
  "te-morau": "授受視角",
  "to-omou": "引用 / 意見",
  "mae-ato": "前後關係",
  "nagara-tari": "並列・同時",
  "te-aux": "補助動詞"
};

// ===========================================================================
// N5 pattern: n5-sonzai -- あります/います existence sentences (#543).
//   The biggest single N5 gap from the coverage audit. Kana-first with
//   starter-deck words; new words get a ※gloss in the explanation.
//   Unique-solution levers: alive/inanimate subject picks あります vs
//   います; で (action location) vs に (existence location) is the classic
//   trap and appears only where the verb makes it dead.
// ===========================================================================
const N5_SONZAI_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n5-sonzai-001",
    patternId: "n5-sonzai",
    promptText: "へやに ねこ___ います。",
    hintZh: "告訴對方房間裡有什麼。",
    promptContextZh: "「房間裡有一隻貓。」",
    expectedAnswer: "が",
    options: ["が", "を", "へ", "で"],
    explanation:
      "「〜に 〜が います」是存在句的固定形：第一次提到「有什麼」時，那個東西用「が」。「を」接動作對象，但います不是動作；「へ」表方向；「で」是動作發生的場所，跟います（存在）接不上。※へや＝房間。"
  },
  {
    id: "pattern-n5-sonzai-002",
    patternId: "n5-sonzai",
    promptText: "つくえの うえに ほん___ あります。",
    hintZh: "說桌上有什麼東西。",
    promptContextZh: "「桌上有書。」",
    expectedAnswer: "が",
    options: ["が", "を", "で", "へ"],
    explanation:
      "存在句「〜に 〜が あります」：書是第一次登場的東西，用「が」。「で」是動作發生的場所，跟「あります（存在）」接不上。※つくえ＝桌子、うえ＝上面。"
  },
  {
    id: "pattern-n5-sonzai-003",
    patternId: "n5-sonzai",
    promptText: "いぬは にわ___ います。",
    hintZh: "回答狗在哪裡。",
    promptContextZh: "「狗在院子裡。」",
    expectedAnswer: "に",
    options: ["に", "で", "を", "へ"],
    explanation:
      "「存在的場所」用「に」——狗「在」院子，不是在院子「做」什麼。「で」配動作動詞（にわで あそびます）；這是 に／で 最重要的分工。※にわ＝院子。"
  },
  {
    id: "pattern-n5-sonzai-004",
    patternId: "n5-sonzai",
    promptText: "きょうしつに がくせいが ___。",
    hintZh: "說教室裡有誰。",
    promptContextZh: "「教室裡有學生。」",
    expectedAnswer: "います",
    options: ["います", "あります", "です", "でした"],
    explanation:
      "人和動物這些「有生命、會動的」用「います」；東西和植物用「あります」。學生是人 →「います」。※きょうしつ＝教室、がくせい＝學生。"
  },
  {
    id: "pattern-n5-sonzai-005",
    patternId: "n5-sonzai",
    promptText: "かばんの なかに けいたいが ___。",
    hintZh: "說包包裡有什麼東西。",
    promptContextZh: "「包包裡有手機。」",
    expectedAnswer: "あります",
    options: ["あります", "います", "ですか", "じゃありません"],
    explanation:
      "手機是東西（沒有生命），存在用「あります」。「います」留給人和動物。※なか＝裡面。"
  },
  {
    id: "pattern-n5-sonzai-006",
    patternId: "n5-sonzai",
    promptText: "すみません、トイレは どこ___ ありますか。",
    hintZh: "問廁所的位置。",
    promptContextZh: "「不好意思，廁所在哪裡？」",
    expectedAnswer: "に",
    options: ["に", "へ", "を", "が"],
    explanation:
      "問「在哪裡」＝問存在的場所，場所用「に」。「トイレは どこに ありますか」是問路的固定句。「へ」表方向，不表靜態存在的位置；「を」接動作對象；「が」的位置已被主題「は」佔走。※トイレ＝廁所。"
  },
  {
    id: "pattern-n5-sonzai-007",
    patternId: "n5-sonzai",
    promptText: "いま、いえに ねこは ___。",
    hintZh: "說現在家裡沒有貓（貓出門了）。",
    promptContextZh: "「現在貓不在家。」",
    expectedAnswer: "いません",
    options: ["いません", "ありません", "います", "いました"],
    explanation:
      "貓是動物 → 用います的否定「いません」。「ありません」是東西的否定；「いました」是過去，跟「いま（現在）」矛盾。提示說了貓不在，所以肯定的「います」也不對。"
  },
  {
    id: "pattern-n5-sonzai-008",
    patternId: "n5-sonzai",
    promptText: "ほんは つくえの うえに ___。",
    hintZh: "回答「書在哪裡」。",
    promptContextZh: "「書在桌子上。」",
    expectedAnswer: "あります",
    options: ["あります", "います", "です", "でしたか"],
    explanation:
      "這是「所在句」：已知的東西（ほんは）＋場所に＋あります。書是東西 →「あります」。「〜は 〜に あります」回答位置、「〜に 〜が あります」介紹存在，兩個句型是一對。※つくえ＝桌子、うえ＝上面。"
  }
];

// ===========================================================================
// N5 pattern: n5-ichi -- position words + この/その demonstratives (#543).
//   Position-word cloze items are locked by the hint's Chinese description
//   of the spatial relation (the established pattern-item lever) plus
//   option control; この/その items anchor on who is holding the object.
// ===========================================================================
const N5_ICHI_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n5-ichi-001",
    patternId: "n5-ichi",
    promptText: "けいたいは かばんの ___に あります。",
    hintZh: "說手機的位置：在包包「裡面」。",
    promptContextZh: "「手機在包包裡面。」",
    expectedAnswer: "なか",
    options: ["なか", "うえ", "した", "まえ"],
    explanation:
      "位置的說法是「名詞＋の＋位置詞＋に」：かばんの なかに＝在包包裡面。なか＝裡面、うえ＝上面、した＝下面、まえ＝前面。"
  },
  {
    id: "pattern-n5-ichi-002",
    patternId: "n5-ichi",
    promptText: "ねこは つくえの ___に います。",
    hintZh: "說貓的位置：在桌子「下面」。",
    promptContextZh: "「貓在桌子下面。」",
    expectedAnswer: "した",
    options: ["した", "うえ", "なか", "うしろ"],
    explanation:
      "した＝下面。「つくえの したに」＝在桌子下面。「つくえの なか」指的是抽屜等收納空間的內部（放課本的地方），不是桌子底下；うしろ＝後面。※つくえ＝桌子。"
  },
  {
    id: "pattern-n5-ichi-003",
    patternId: "n5-ichi",
    promptText: "ほんは つくえの ___に あります。",
    hintZh: "說書的位置：在桌子「上面」。",
    promptContextZh: "「書在桌子上面。」",
    expectedAnswer: "うえ",
    options: ["うえ", "した", "まえ", "となり"],
    explanation:
      "うえ＝上面。中文說「桌上」，日文要用「名詞＋の＋位置詞」的結構：「つくえの うえに」。東西放在桌面上都用 うえ。"
  },
  {
    id: "pattern-n5-ichi-004",
    patternId: "n5-ichi",
    promptText: "がっこうは えきの ___に あります。",
    hintZh: "說學校的位置：在車站「前面」。",
    promptContextZh: "「學校在車站前面。」",
    expectedAnswer: "まえ",
    options: ["まえ", "うしろ", "なか", "うえ"],
    explanation:
      "まえ＝前面、うしろ＝後面。「えきの まえ」（車站前）是描述地點最常用的說法之一。※えき＝車站。"
  },
  {
    id: "pattern-n5-ichi-005",
    patternId: "n5-ichi",
    promptText: "トイレは へやの ___に あります。",
    hintZh: "說廁所的位置：在房間「旁邊」（緊鄰的隔壁）。",
    promptContextZh: "「廁所在房間旁邊。」",
    expectedAnswer: "となり",
    options: ["となり", "うえ", "なか", "まえ"],
    explanation:
      "となり＝旁邊（緊鄰、同類並排）。日文還有「よこ」也是旁邊，差別：となり 強調並排相鄰（隔壁），よこ 只說在側面方向。※トイレ＝廁所、へや＝房間。"
  },
  {
    id: "pattern-n5-ichi-006",
    patternId: "n5-ichi",
    promptText: "ぎんこうは スーパーの ___に あります。",
    hintZh: "說銀行的位置：在超市「後面」。",
    promptContextZh: "「銀行在超市後面。」",
    expectedAnswer: "うしろ",
    options: ["うしろ", "まえ", "した", "となり"],
    explanation:
      "うしろ＝後面。まえ／うしろ 是一對，配路標描述最常用。※ぎんこう＝銀行、スーパー＝超市。"
  },
  {
    id: "pattern-n5-ichi-007",
    patternId: "n5-ichi",
    promptText: "（じぶんの てに ある ほんを みて）___ ほんは わたしのです。",
    hintZh: "說自己手上拿著的這本書是自己的。",
    promptContextZh: "「（看著自己手上的書）這本書是我的。」",
    expectedAnswer: "この",
    options: ["この", "その", "あの", "どの"],
    explanation:
      "「この＋名詞」＝靠近自己的。これ 單獨用（これは ほんです）、この 後面一定接名詞（この ほん）。在自己手上 → この。※て＝手。"
  },
  {
    id: "pattern-n5-ichi-008",
    patternId: "n5-ichi",
    promptText: "（あいての てに ある かさを みて）___ かさは あなたのですか。",
    hintZh: "問對方手上拿著的那把傘是不是對方的。",
    promptContextZh: "「（看著對方手上的傘）那把傘是你的嗎？」",
    expectedAnswer: "その",
    options: ["その", "この", "あの", "どの"],
    explanation:
      "「その＋名詞」＝靠近對方的。傘在對方手上 → その。あの＝離雙方都遠；どの＝哪一個（疑問）。※かさ＝傘、あいて＝對方。"
  }
];

// ===========================================================================
// N5 pattern: n5-joshi2 -- へ・で(手段/場所)・と(並列)・や (#544).
//   Known near-synonym traps are kept OUT of the option sets by design:
//   に never appears where へ is the answer (direction overlap), enumerative
//   に (パンに たまご) never competes where と(並列) is the answer, と never
//   appears where や+など is the answer, と(with) never competes with で.
// ===========================================================================
const N5_JOSHI2_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n5-joshi2-001",
    patternId: "n5-joshi2",
    promptText: "あした、とうきょう___ いきます。",
    hintZh: "說明天要去哪個城市。",
    promptContextZh: "「明天去東京。」",
    expectedAnswer: "へ",
    options: ["へ", "を", "が", "と"],
    explanation:
      "移動的方向用「へ」（讀作 e）。方向也可以用「に」，語感差異：へ 強調「朝那個方向」、に 強調「到達點」——這題選項中用「へ」。「を」接動作對象；「と」是「和某人」。※とうきょう＝東京。"
  },
  {
    id: "pattern-n5-joshi2-002",
    patternId: "n5-joshi2",
    promptText: "バス___ がっこうへ いきます。",
    hintZh: "說怎麼去上學。",
    promptContextZh: "「搭公車去學校。」",
    expectedAnswer: "で",
    options: ["で", "に", "を", "へ"],
    explanation:
      "交通工具、手段用「で」：バスで＝搭公車。「に」在這裡接不上（バスに のります〈上車〉才用に）；方向已經有「がっこうへ」了。※バス＝公車。"
  },
  {
    id: "pattern-n5-joshi2-003",
    patternId: "n5-joshi2",
    promptText: "はし___ ごはんを たべます。",
    hintZh: "說用什麼吃飯。",
    promptContextZh: "「用筷子吃飯。」",
    expectedAnswer: "で",
    options: ["で", "を", "に", "へ"],
    explanation:
      "工具用「で」：はしで＝用筷子。動作對象「ごはんを」已經在句子裡；「に」表時間點或到達點、「へ」只表方向，都接不上工具。※はし＝筷子。"
  },
  {
    id: "pattern-n5-joshi2-004",
    patternId: "n5-joshi2",
    promptText: "きのう、パン___ たまごを かいました。",
    hintZh: "說昨天買的兩樣東西（全部列出）。",
    promptContextZh: "「昨天買了麵包和蛋。」",
    expectedAnswer: "と",
    options: ["と", "を", "へ", "で"],
    explanation:
      "把名詞「全部列出來」的「和」用「と」：パンと たまご＝麵包和蛋（就這兩樣）。若只是舉例（還有別的）用「や」。「を」已經接在たまご後面了。※パン＝麵包、たまご＝蛋。"
  },
  {
    id: "pattern-n5-joshi2-005",
    patternId: "n5-joshi2",
    promptText: "かばんの なかに ほん___ ペンなどが あります。",
    hintZh: "說包包裡放著哪些東西（沒有一一說完）。",
    promptContextZh: "「包包裡有書、筆等等。」",
    expectedAnswer: "や",
    options: ["や", "も", "を", "へ"],
    explanation:
      "「舉幾個例子、暗示還有別的」用「や」，常和句尾的「など（等等）」搭配：ほんや ペンなど。全部列完用「と」（不和など搭配）。※ペン＝筆。"
  },
  {
    id: "pattern-n5-joshi2-006",
    patternId: "n5-joshi2",
    promptText: "りんごは ぜんぶ___ いくらですか。",
    hintZh: "問全部加起來的價錢。",
    promptContextZh: "「蘋果全部多少錢？」",
    expectedAnswer: "で",
    options: ["で", "を", "に", "も"],
    explanation:
      "「合計、總共」用「で」：ぜんぶで いくら＝全部加起來多少錢。「を」「に」「も」都無法把「ぜんぶ」變成合計的單位。※りんご＝蘋果、ぜんぶ＝全部。"
  },
  {
    id: "pattern-n5-joshi2-007",
    patternId: "n5-joshi2",
    promptText: "としょかん___ べんきょうします。",
    hintZh: "說在哪裡讀書。",
    promptContextZh: "「在圖書館讀書。」",
    expectedAnswer: "で",
    options: ["で", "へ", "が", "と"],
    explanation:
      "「在某處做動作」用「で」——讀書是動作。「へ」是朝某方向移動（としょかんへ いきます 才用へ）；「が」會把圖書館變成讀書的主語，不通。※としょかん＝圖書館、べんきょうします＝讀書/學習。"
  },
  {
    id: "pattern-n5-joshi2-008",
    patternId: "n5-joshi2",
    promptText: "にちようび、ともだちと こうえん___ いきます。",
    hintZh: "說星期天和朋友要去的地方。",
    promptContextZh: "「星期天和朋友去公園。」",
    expectedAnswer: "へ",
    options: ["へ", "を", "が", "で"],
    explanation:
      "移動的方向用「へ」。「で」是動作發生的場所——こうえんで あそびます（在公園玩）才用で，「去」公園是移動。※にちようび＝星期天、こうえん＝公園。"
  }
];

// ===========================================================================
// N5 pattern: n5-joshi3 -- の・も・か(選擇)・から〜まで・だけ (#544).
//   は never competes where も/だけ is the answer (topicalized readings are
//   grammatical); と never competes with selectional か.
// ===========================================================================
const N5_JOSHI3_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n5-joshi3-001",
    patternId: "n5-joshi3",
    promptText: "これは わたし___ かばんです。",
    hintZh: "說這個包包是誰的。",
    promptContextZh: "「這是我的包包。」",
    expectedAnswer: "の",
    options: ["の", "は", "が", "を"],
    explanation:
      "「誰的東西」用「の」連接：わたしの かばん＝我的包包。「は」「が」標主題/主語，放進去句子就斷掉了；「を」接動作對象。"
  },
  {
    id: "pattern-n5-joshi3-002",
    patternId: "n5-joshi3",
    promptText: "「これは だれの ペンですか。」「たなかさん___ です。」",
    hintZh: "回答筆的主人是誰（不重複說「筆」）。",
    promptContextZh: "「這是誰的筆？」「是田中的。」",
    expectedAnswer: "の",
    options: ["の", "は", "が", "へ"],
    explanation:
      "「の」可以代替前面說過的名詞：たなかさんの（です）＝田中的（筆）——不用把「ペン」再說一次。這是の的「代替」用法。※ペン＝筆。"
  },
  {
    id: "pattern-n5-joshi3-003",
    patternId: "n5-joshi3",
    promptText: "わたしは がくせいです。おとうと___ がくせいです。",
    hintZh: "接著介紹弟弟的身分。",
    promptContextZh: "「我是學生。弟弟也是學生。」",
    expectedAnswer: "も",
    options: ["も", "に", "を", "へ"],
    explanation:
      "「也」用「も」：前一句說了我是學生，弟弟「也」是 → おとうとも。「も」直接取代は/が 的位置；「に」「を」「へ」都放不進主語的位置。※おとうと＝弟弟。"
  },
  {
    id: "pattern-n5-joshi3-004",
    patternId: "n5-joshi3",
    promptText: "きょうしつに だれ___ いません。",
    hintZh: "說教室裡一個人都沒有。",
    promptContextZh: "「教室裡誰都不在。」",
    expectedAnswer: "も",
    options: ["も", "か", "を", "の"],
    explanation:
      "「疑問詞＋も＋否定」＝全面否定：だれも いません（誰都不在）、なにも ありません（什麼都沒有）。這句是在「陳述」教室裡誰都不在，所以用 だれも＋否定；「だれか」是「某人」，用在別的句型（如 だれか いませんか？）。"
  },
  {
    id: "pattern-n5-joshi3-005",
    patternId: "n5-joshi3",
    promptText: "コーヒー___ おちゃ、どちらが いいですか。",
    hintZh: "請對方二選一。",
    promptContextZh: "「咖啡或茶，哪個好？」",
    expectedAnswer: "か",
    options: ["か", "や", "も", "を"],
    explanation:
      "「A或B（二選一）」用「か」：コーヒーか おちゃ。「や」是舉例（還有別的），跟「どちら（兩個之中哪個）」矛盾。※コーヒー＝咖啡、おちゃ＝茶。"
  },
  {
    id: "pattern-n5-joshi3-006",
    patternId: "n5-joshi3",
    promptText: "がっこうは ９じ___ ３じまでです。",
    hintZh: "說學校的起訖時間。",
    promptContextZh: "「學校從九點到三點。」",
    expectedAnswer: "から",
    options: ["から", "まで", "に", "へ"],
    explanation:
      "「從～到～」＝「〜から〜まで」：９じから ３じまで。起點用から、終點用まで——句尾已有まで，空格是起點。※〜じ＝〜點鐘。"
  },
  {
    id: "pattern-n5-joshi3-007",
    patternId: "n5-joshi3",
    promptText: "いえ___ えきまで あるきます。",
    hintZh: "說走路的起點和終點。",
    promptContextZh: "「從家走到車站。」",
    expectedAnswer: "から",
    options: ["から", "まで", "を", "で"],
    explanation:
      "「〜から〜まで」也用在場所：いえから えきまで＝從家到車站。「で」是動作場所（不是起點）；「を」的通過用法（みちを あるきます）接的是走過的路，不是起點。※あるきます＝走路。"
  },
  {
    id: "pattern-n5-joshi3-008",
    patternId: "n5-joshi3",
    promptText: "きょうしつに がくせいが ひとり___ います。",
    hintZh: "說教室裡除了一個學生，沒有別人。",
    promptContextZh: "「教室裡只有一個學生。」",
    expectedAnswer: "だけ",
    options: ["だけ", "も", "を", "へ"],
    explanation:
      "「只、只有」用「だけ」：ひとりだけ＝只有一個人。「ひとりも」要接否定（ひとりも いません＝一個人都沒有），跟句尾肯定的「います」矛盾。※ひとり＝一個人。"
  }
];

// ===========================================================================
// N5 pattern: n5-hikaku -- comparison より/ほうが/いちばん (#545).
//   Topicalized は readings are grammatical almost everywhere, so は never
//   competes with が/で answers (except the interrogative-subject item where
//   は is a DEAD foil by rule); ほど appears only as a dead foil with an
//   affirmative predicate (ほど demands a negative -- itself a lesson).
// ===========================================================================
const N5_HIKAKU_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n5-hikaku-001",
    patternId: "n5-hikaku",
    promptText: "バスは でんしゃ___ やすいです。",
    hintZh: "聊公車跟電車的票價差別。",
    promptContextZh: "「公車比電車便宜。」",
    expectedAnswer: "より",
    options: ["より", "が", "を", "の"],
    explanation:
      "「AはBより〜」＝A比B更〜：比較的基準（電車）後面接「より」。「が」「を」是主語/對象標記；「の」是「的」，都搭不出比較句。※バス＝公車。"
  },
  {
    id: "pattern-n5-hikaku-002",
    patternId: "n5-hikaku",
    promptText: "でんしゃの ほう___ はやいです。",
    hintZh: "說兩個交通工具裡電車快。",
    promptContextZh: "「電車（那邊）比較快。」",
    expectedAnswer: "が",
    options: ["が", "を", "に", "で"],
    explanation:
      "「〜のほうが〜」＝〜比較〜：「ほう（一方）」後面固定接「が」。「を」「に」「で」都接不上這個句型。※はやい＝快。"
  },
  {
    id: "pattern-n5-hikaku-003",
    patternId: "n5-hikaku",
    promptText: "コーヒーと おちゃと、どちら___ すきですか。",
    hintZh: "問對方兩種飲料的偏好。",
    promptContextZh: "「咖啡和茶，你比較喜歡哪個？」",
    expectedAnswer: "が",
    options: ["が", "は", "で", "の"],
    explanation:
      "疑問詞（どちら、だれ、なに）當主語時用「が」——「は」前面要放已知的話題，而「哪個」正是要問的未知，所以這種中立的提問不用「は」。すき 的對象也固定用が；「で」「の」放這裡都不成句。"
  },
  {
    id: "pattern-n5-hikaku-004",
    patternId: "n5-hikaku",
    promptText: "「どちらが すきですか。」「おちゃ___ ほうが すきです。」",
    hintZh: "從兩個選項裡回答自己的偏好。",
    promptContextZh: "「你比較喜歡哪個？」「我比較喜歡茶。」",
    expectedAnswer: "の",
    options: ["の", "が", "を", "と"],
    explanation:
      "回答「〜のほうが」：名詞和「ほう」之間用「の」連接——おちゃの ほうが。「が」在ほう後面才出現；「を」「と」放這裡句子就斷了。"
  },
  {
    id: "pattern-n5-hikaku-005",
    patternId: "n5-hikaku",
    promptText: "スポーツの なか___ サッカーが いちばん すきです。",
    hintZh: "說所有運動裡最喜歡的一種。",
    promptContextZh: "「運動之中我最喜歡足球。」",
    expectedAnswer: "で",
    options: ["で", "に", "を", "が"],
    explanation:
      "最高級的範圍用「で」：「〜のなかで 〜が いちばん〜」＝在～之中最～。「に」表時間或地點、「を」接對象；「が」已經在サッカー後面了。※スポーツ＝運動、サッカー＝足球。"
  },
  {
    id: "pattern-n5-hikaku-006",
    patternId: "n5-hikaku",
    promptText: "クラス___ たなかさんが いちばん せが たかいです。",
    hintZh: "說班上個子最高的人。",
    promptContextZh: "「班上田中個子最高。」",
    expectedAnswer: "で",
    options: ["で", "に", "を", "へ"],
    explanation:
      "「（範圍）で いちばん〜」：クラスで＝在班上（這個範圍裡）。「に」「へ」表地點方向、「を」接對象，都不是「範圍內比較」的用法。※クラス＝班級、せ＝身高。"
  },
  {
    id: "pattern-n5-hikaku-007",
    patternId: "n5-hikaku",
    promptText: "きょうは きのう___ さむいです。",
    hintZh: "聊今天跟昨天的氣溫差別。",
    promptContextZh: "「今天比昨天冷。」",
    expectedAnswer: "より",
    options: ["より", "ほど", "から", "まで"],
    explanation:
      "比較的基準用「より」：きのうより＝比昨天。「ほど」也接比較基準，但後面必須是否定（きのうほど さむくない＝沒昨天那麼冷），跟句尾肯定的「さむいです」矛盾。"
  },
  {
    id: "pattern-n5-hikaku-008",
    patternId: "n5-hikaku",
    promptText: "りんごと みかんと、___が すきですか。",
    hintZh: "兩種水果請對方挑一種。",
    promptContextZh: "「蘋果和橘子，你喜歡哪個？」",
    expectedAnswer: "どちら",
    options: ["どちら", "なに", "だれ", "どこ"],
    explanation:
      "「AとBと」擺明只有兩個選項，二選一的疑問詞用「どちら」。「なに（什麼）」是開放式問法，跟已列出的兩選項矛盾；だれ 問人、どこ 問地方。※みかん＝橘子。"
  }
];

// ===========================================================================
// N5 pattern: n5-suki-dekiru -- likes/dislikes + ability, all with が (#545).
//   Colloquial を-marking of すき (ねこを すき) is real modern usage, so
//   を never competes where すき's が is the answer; topicalized は/も
//   readings keep は out of subject-slot items.
// ===========================================================================
const N5_SUKI_DEKIRU_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n5-suki-dekiru-001",
    patternId: "n5-suki-dekiru",
    promptText: "わたしは ねこ___ すきです。",
    hintZh: "說自己對貓的感覺。",
    promptContextZh: "「我喜歡貓。」",
    expectedAnswer: "が",
    options: ["が", "に", "へ", "と"],
    explanation:
      "「すき／きらい」的對象用「が」：ねこが すきです。中文語感會想用「を」（喜歡『貓』），但日文把喜歡的對象當「が」標記——這是 N5 最重要的轉換之一。「に」「へ」「と」都接不上。"
  },
  {
    id: "pattern-n5-suki-dekiru-002",
    patternId: "n5-suki-dekiru",
    promptText: "おとうとは サッカーが ___です。",
    hintZh: "說弟弟足球踢得很好。",
    promptContextZh: "「弟弟足球踢得很好（擅長足球）。」",
    expectedAnswer: "じょうず",
    options: ["じょうず", "へた", "きらい", "たかい"],
    explanation:
      "「擅長」用「じょうず」：サッカーが じょうずです。「へた」是不擅長、「きらい」是討厭——提示說踢得好，方向相反；「たかい」是高/貴，接不上。※じょうず＝擅長、へた＝不擅長。"
  },
  {
    id: "pattern-n5-suki-dekiru-003",
    patternId: "n5-suki-dekiru",
    promptText: "にほんご___ わかりますか。",
    hintZh: "問對方懂不懂日語。",
    promptContextZh: "「你懂日語嗎？」",
    expectedAnswer: "が",
    options: ["が", "を", "に", "へ"],
    explanation:
      "「わかる（懂）」的對象用「が」：にほんごが わかります。中文的「懂『日語』」讓人想選「を」，但わかる 固定搭配「が」——跟すき、できる 同一家族。※にほんご＝日語。"
  },
  {
    id: "pattern-n5-suki-dekiru-004",
    patternId: "n5-suki-dekiru",
    promptText: "たなかさんは りょうり___ できます。",
    hintZh: "說田中會做菜。",
    promptContextZh: "「田中會做菜。」",
    expectedAnswer: "が",
    options: ["が", "を", "に", "で"],
    explanation:
      "「できる（會、能）」的對象也用「が」：りょうりが できます。「を」是動作動詞的對象標記，但できる 是能力敘述，家族規則＝用が。※りょうり＝料理、做菜。"
  },
  {
    id: "pattern-n5-suki-dekiru-005",
    patternId: "n5-suki-dekiru",
    promptText: "わたしは およぐ こと___ できます。",
    hintZh: "說自己會游泳。",
    promptContextZh: "「我會游泳。」",
    expectedAnswer: "が",
    options: ["が", "を", "に", "で"],
    explanation:
      "「動詞辞書形＋ことが できる」＝會做～：およぐ ことが できます。動詞先用「こと」變成名詞，再接「が できる」。※およぐ＝游泳。"
  },
  {
    id: "pattern-n5-suki-dekiru-006",
    patternId: "n5-suki-dekiru",
    promptText: "あには うた___ へたです。",
    hintZh: "說哥哥唱歌不太行。",
    promptContextZh: "「哥哥不擅長唱歌。」",
    expectedAnswer: "が",
    options: ["が", "の", "へ", "と"],
    explanation:
      "「へた（不擅長）」跟じょうず 一樣，對象用「が」：うたが へたです。「の」是「的」；「へ」「と」表方向、一起，都接不上。※あに＝哥哥、うた＝歌。"
  },
  {
    id: "pattern-n5-suki-dekiru-007",
    patternId: "n5-suki-dekiru",
    promptText: "けんじさんは かんじを よむ こと___ できますか。",
    hintZh: "問健二會不會唸漢字。",
    promptContextZh: "「健二會唸漢字嗎？」",
    expectedAnswer: "が",
    options: ["が", "を", "に", "で"],
    explanation:
      "整個動作「かんじを よむ こと（唸漢字這件事）」是できる 的對象 → 接「が」。句子裡的「かんじを」是よむ 的對象，位置不同、各管各的。※かんじ＝漢字。"
  },
  {
    id: "pattern-n5-suki-dekiru-008",
    patternId: "n5-suki-dekiru",
    promptText: "わたしは いぬが すきです。ねこ___ すきです。",
    hintZh: "接著說對貓的感覺跟狗一樣。",
    promptContextZh: "「我喜歡狗。也喜歡貓。」",
    expectedAnswer: "も",
    options: ["も", "と", "に", "へ"],
    explanation:
      "前一句已說喜歡狗，貓「也」喜歡 → 「も」直接取代「が」的位置：ねこも すきです。這是助詞III學過的も，配上好惡句複習。"
  }
];

// ===========================================================================
// N5 pattern: n5-sasoi -- invitations and proposals (#546).
//   ませんか/ましょう are pragmatically adjacent: every item locks the role
//   with a dialogue anchor (the reply reveals which side speaks) plus a
//   question-vs-statement hint. たいです and plain ます never appear as
//   foils in offer items (both have real volunteering readings); ました is
//   excluded wherever a past-report reading would survive the context.
// ===========================================================================
const N5_SASOI_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n5-sasoi-001",
    patternId: "n5-sasoi",
    promptText: "「いっしょに ひるごはんを たべ___。」「いいですね。たべましょう。」",
    hintZh: "開口約對方一起吃午餐。",
    promptContextZh: "「要不要一起吃午餐？」「好啊，一起吃吧。」",
    expectedAnswer: "ませんか",
    options: ["ませんか", "ました", "ません", "ませんでした"],
    explanation:
      "邀人用問句「ませんか」＝要不要〜？——把決定權交給對方，對方接受時用「ましょう」回答（後句的「いいですね。たべましょう」就是）。「ました」「ません」「ませんでした」是過去/否定的直述，都接不上邀約的對話。※いっしょに＝一起、ひるごはん＝午餐。"
  },
  {
    id: "pattern-n5-sasoi-002",
    patternId: "n5-sasoi",
    promptText: "「あした えいがを みませんか。」「いいですね。み___。」",
    hintZh: "對方開口約了，你這邊要答應。",
    promptContextZh: "「明天要不要看電影？」「好啊，一起看吧。」",
    expectedAnswer: "ましょう",
    options: ["ましょう", "ませんか", "ません", "ました"],
    explanation:
      "接受邀約用「ましょう」＝（我們）〜吧：いいですね、みましょう。「ませんか」是發出邀約的問法，接受方不再回問；「みません」是拒絕，跟「いいですね」矛盾；「みました」是過去式。※えいが＝電影。",
  },
  {
    id: "pattern-n5-sasoi-003",
    patternId: "n5-sasoi",
    promptText: "にもつが おもいですね。わたしが はんぶん もち___。",
    hintZh: "看對方東西重，主動開口幫忙。",
    promptContextZh: "「行李很重吧，我來幫你拿一半吧？」",
    expectedAnswer: "ましょうか",
    options: ["ましょうか", "ませんか", "ました", "ません"],
    explanation:
      "主動提出幫忙用「ましょうか」＝我來〜吧？：わたしが はんぶん もちましょうか。「ませんか」是約「對方」做，跟句中的わたしが（我來）衝突；「ました」「ません」是過去/否定，都不是開口幫忙的說法。※にもつ＝行李、おもい＝重、はんぶん＝一半、もちます＝拿。"
  },
  {
    id: "pattern-n5-sasoi-004",
    patternId: "n5-sasoi",
    promptText: "デパートへ かばんを かい___ いきます。",
    hintZh: "說要去百貨公司做什麼。",
    promptContextZh: "「我要去百貨公司買包包。」",
    expectedAnswer: "に",
    options: ["に", "を", "で", "へ"],
    explanation:
      "ます形語幹＋「に いきます」＝去做某事：かいます→かい＋に いきます＝去買。「を」已經用在かばんを；「で」「へ」不能接在動詞語幹後面。※デパート＝百貨公司。"
  },
  {
    id: "pattern-n5-sasoi-005",
    patternId: "n5-sasoi",
    promptText: "レストランへ ばんごはんを ___ いきます。",
    hintZh: "說晚上要去餐廳做什麼。",
    promptContextZh: "「我要去餐廳吃晚餐。」",
    expectedAnswer: "たべに",
    options: ["たべに", "たべてに", "たべるに", "たべたに"],
    explanation:
      "接「に いきます」的是ます形語幹：たべます→たべ＋に。「たべるに」「たべたに」「たべてに」都不是正確接法——辭書形、た形、て形都不能直接接目的的に。※レストラン＝餐廳、ばんごはん＝晚餐。"
  },
  {
    id: "pattern-n5-sasoi-006",
    patternId: "n5-sasoi",
    promptText: "「あしたは ちょっと……。」「じゃあ、どようび___ どうですか。」",
    hintZh: "對方明天不行，改提別的日子。",
    promptContextZh: "「明天有點……。」「那，星期六怎麼樣？」",
    expectedAnswer: "は",
    options: ["は", "を", "へ", "の"],
    explanation:
      "提案、問對方意見用「〜は どうですか」＝〜怎麼樣？：じゃあ、どようびは どうですか。「を」「へ」「の」都接不上どうですか。※どようび＝星期六、「〜は ちょっと……」＝委婉拒絕的固定說法。"
  },
  {
    id: "pattern-n5-sasoi-007",
    patternId: "n5-sasoi",
    promptText: "きのう、ともだちが うちへ あそび___ きました。",
    hintZh: "說朋友昨天來家裡做什麼。",
    promptContextZh: "「昨天朋友來家裡玩。」",
    expectedAnswer: "に",
    options: ["に", "を", "と", "へ"],
    explanation:
      "「Vに きます」＝來做某事：あそびに きました＝來玩。跟「かいに いきます」同一個句型——來/去都是ます形語幹＋に。「を」「と」「へ」都接不上語幹。※あそびます＝玩、うち＝家（口語說法）。"
  },
  {
    id: "pattern-n5-sasoi-008",
    patternId: "n5-sasoi",
    promptText: "へやの くうきが わるいですね。まどを ___。",
    hintZh: "房間空氣悶，主動說要讓空氣流通。",
    promptContextZh: "「房間空氣好悶喔。我來開窗吧？」",
    expectedAnswer: "あけましょうか",
    options: ["あけましょうか", "しめましょうか", "あけません", "しめました"],
    explanation:
      "主動提議動手用「ましょうか」：空氣悶就要「開」窗通風→あけましょうか。「しめましょうか（我來關吧？）」只會更悶、方向相反；「あけません」是「不開」；「しめました」是過去式又方向相反。※へや＝房間、くうき＝空氣、まど＝窗戶、あけます＝打開、しめます＝關上。"
  }
];

// ===========================================================================
// N5 pattern: n5-onegai -- requests and advice (#546).
//   を never competes where ほしい's が is the answer (colloquial をほしい,
//   same family as をすき); topicalized は is kept out of shop-request
//   particle blanks; advice items use full predicates so attachment alone
//   can never kill a foil -- the context has to do it.
// ===========================================================================
const N5_ONEGAI_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n5-onegai-001",
    patternId: "n5-onegai",
    promptText: "すみません、この りんごを みっつ ___。",
    hintZh: "在水果店開口買三顆蘋果。",
    promptContextZh: "「不好意思，請給我三顆這種蘋果。」",
    expectedAnswer: "ください",
    options: ["ください", "あります", "います", "でした"],
    explanation:
      "購物點餐用「Nを（數量）ください」＝請給我〜：りんごを みっつ ください。數量詞（みっつ）直接放ください前面、不加助詞。「あります」「います」跟「を」不相容（要說 りんごが あります）；「でした」是過去的斷定，接不上開口買東西的場面。※みっつ＝三個。"
  },
  {
    id: "pattern-n5-onegai-002",
    patternId: "n5-onegai",
    promptText: "あたらしい くつ___ ほしいです。",
    hintZh: "說自己想要新鞋。",
    promptContextZh: "「我想要新鞋子。」",
    expectedAnswer: "が",
    options: ["が", "の", "に", "へ"],
    explanation:
      "「〜が ほしい」＝想要〜：對象用「が」——くつが ほしいです。跟すき、じょうず、できる 同一個が家族。「の」「に」「へ」都接不上。※くつ＝鞋子。"
  },
  {
    id: "pattern-n5-onegai-003",
    patternId: "n5-onegai",
    promptText: "ねつが ありますから、きょうは はやく ___。",
    hintZh: "叮囑發燒的人早點休息。",
    promptContextZh: "「你發燒了，今天最好早點睡。」",
    expectedAnswer: "ねたほうがいいです",
    options: ["ねたほうがいいです", "ねないほうがいいです", "ねてはいけません", "ねなくてもいいです"],
    explanation:
      "給建議用「た形＋ほうがいいです」＝最好〜：ねた ほうがいいです。「ないほうがいい」是勸別做、「てはいけません」是禁止——發燒了還不讓睡，方向全反；「なくてもいい」是不必，也跟勸人休息的情境矛盾。※ねつ＝發燒。"
  },
  {
    id: "pattern-n5-onegai-004",
    patternId: "n5-onegai",
    promptText: "かぜですから、きょうは おふろに ___。",
    hintZh: "感冒的人想去泡澡，被家人攔了下來。",
    promptContextZh: "「你感冒了，今天最好別泡澡。」",
    expectedAnswer: "はいらないほうがいいです",
    options: ["はいらないほうがいいです", "はいったほうがいいです", "はいってもいいです", "はいりましょうか"],
    explanation:
      "勸別做某事用「ない形＋ほうがいいです」＝最好別〜：はいらない ほうがいいです。「はいったほうがいい」方向相反；「てもいい」是允許；「ましょうか」是提議一起/幫忙，跟叮囑的情境不合。※かぜ＝感冒、おふろに はいります＝泡澡。"
  },
  {
    id: "pattern-n5-onegai-005",
    patternId: "n5-onegai",
    promptText: "としょかんですから、おおきい こえで ___。",
    hintZh: "圖書館員要大家安靜。",
    promptContextZh: "「這裡是圖書館，請不要大聲說話。」",
    expectedAnswer: "はなさないでください",
    options: ["はなさないでください", "はなしてください", "はなしてもいいです", "はなしましょう"],
    explanation:
      "「ない形＋でください」＝請別〜：はなさないで ください。圖書館要安靜，「はなしてください（請說）」方向相反；「てもいい」「ましょう」都跟安靜的要求矛盾。※こえ＝聲音、はなします＝說話。"
  },
  {
    id: "pattern-n5-onegai-006",
    patternId: "n5-onegai",
    promptText: "すみません、この きって___ ごまい ください。",
    hintZh: "買郵票時指定張數。",
    promptContextZh: "「不好意思，這種郵票請給我五張。」",
    expectedAnswer: "を",
    options: ["を", "が", "へ", "の"],
    explanation:
      "「Nを（數量）ください」的對象用「を」：きってを ごまい ください。數量（ごまい）放を後面、ください前面。「が ください」不成句；「へ」「の」也接不上。※きって＝郵票、〜まい＝〜張（扁平物）。"
  },
  {
    id: "pattern-n5-onegai-007",
    patternId: "n5-onegai",
    promptText: "たんじょうびに なに___ ほしいですか。",
    hintZh: "問對方生日禮物的願望。",
    promptContextZh: "「生日想要什麼？」",
    expectedAnswer: "が",
    options: ["が", "は", "も", "の"],
    explanation:
      "「ほしい」的對象用「が」，疑問詞當對象也一樣：なにが ほしいですか。「は」前面要放已知的話題，而「什麼」正是要問的未知，這種中立提問不用「は」；「も」變成「なにも」就要配否定；「の」接不上。※たんじょうび＝生日。"
  },
  {
    id: "pattern-n5-onegai-008",
    patternId: "n5-onegai",
    promptText: "ここは あぶないですから、___。",
    hintZh: "告示牌警告這片水域。",
    promptContextZh: "「這裡很危險，請勿游泳。」",
    expectedAnswer: "およがないでください",
    options: ["およがないでください", "およいでください", "およぎましょう", "およぎませんか"],
    explanation:
      "危險警告用「ないでください」＝請勿〜：およがないで ください。主題已點明「這裡危險」，「およいでください」「ましょう」「ませんか」都是要人下水，全跟「あぶない」矛盾。※あぶない＝危險、およぎます＝游泳。"
  }
];

// ===========================================================================
// N5 pattern: n5-riyuu -- reasons and contrast: から・ので・が (#547).
//   から and ので are near-interchangeable as reason markers, so they NEVER
//   compete on meaning: the どうして item kills ので by form (〜のでです is
//   not a sentence), the ので item tests noun attachment (なので vs だので
//   vs なから -- pure form), and every other から/ので appearance is a dead
//   foil by attachment or by contradiction, never a live semantic rival.
// ===========================================================================
const N5_RIYUU_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n5-riyuu-001",
    patternId: "n5-riyuu",
    promptText: "「どうして がっこうを やすみましたか。」「ねつが あった___です。」",
    hintZh: "解釋沒去學校的原因。",
    promptContextZh: "「為什麼沒來學校？」「因為發燒了。」",
    expectedAnswer: "から",
    options: ["から", "ので", "が", "まで"],
    explanation:
      "回答「どうして（為什麼）」用固定句式「〜からです」：ねつが あったからです。「ので」不能直接接です（×のでです）；「が」「まで」也接不上。※やすみます＝請假・休息。"
  },
  {
    id: "pattern-n5-riyuu-002",
    patternId: "n5-riyuu",
    promptText: "あしたは やすみ___、どこかへ いきませんか。",
    hintZh: "說明天放假，順便約出門。",
    promptContextZh: "「明天放假，要不要去哪走走？」",
    expectedAnswer: "なので",
    options: ["なので", "だので", "ので", "なから"],
    explanation:
      "名詞接「ので」要先加な：やすみ＋な＋ので＝やすみなので。「だので」是錯接（だ和ので不能連用）；名詞直接接ので（×やすみので）也不行；「から」接名詞用だ（やすみだから），沒有「なから」這種形。※どこか＝某個地方。"
  },
  {
    id: "pattern-n5-riyuu-003",
    patternId: "n5-riyuu",
    promptText: "にほんごは むずかしいです___、おもしろいです。",
    hintZh: "說日語難歸難、學起來有樂趣。",
    promptContextZh: "「日語雖然難，但是很有趣。」",
    expectedAnswer: "が",
    options: ["が", "を", "の", "に"],
    explanation:
      "句中的「が」表示轉折＝雖然〜但是〜：むずかしいですが、おもしろいです——前後兩件事方向相反時用它連接。「を」「の」「に」都不能接在です後面。※むずかしい＝難、おもしろい＝有趣。"
  },
  {
    id: "pattern-n5-riyuu-004",
    patternId: "n5-riyuu",
    promptText: "すみません___、えきは どこですか。",
    hintZh: "向路人開口問路。",
    promptContextZh: "「不好意思，請問車站在哪裡？」",
    expectedAnswer: "が",
    options: ["が", "から", "ので", "でも"],
    explanation:
      "開口前的緩衝用「が」：すみませんが、〜＝不好意思，（請問）〜。這個が不是轉折，只是把話題輕輕帶入。「から」「ので」是理由——「すみません」不是理由；「でも」接在句頭當「可是」，不能接在ません後面。"
  },
  {
    id: "pattern-n5-riyuu-005",
    patternId: "n5-riyuu",
    promptText: "あめが ふって います。___、でかけます。",
    hintZh: "雨照下，人照出門。",
    promptContextZh: "「正在下雨。可是，還是要出門。」",
    expectedAnswer: "でも",
    options: ["でも", "だから", "そして", "それから"],
    explanation:
      "前後方向相反（下雨→照樣出門）用「でも」＝可是。「だから（所以）」是順著因果，方向不對；「そして（而且）」「それから（然後）」是並列/接續，都表達不出「照樣」的轉折。※あめ＝雨、ふります＝（雨雪）下、でかけます＝出門。"
  },
  {
    id: "pattern-n5-riyuu-006",
    patternId: "n5-riyuu",
    promptText: "あした テストが あります。___、こんばん べんきょうします。",
    hintZh: "明天要考試，今晚不唸不行。",
    promptContextZh: "「明天有考試。所以，今晚要唸書。」",
    expectedAnswer: "だから",
    options: ["だから", "でも", "しかし", "まだ"],
    explanation:
      "前句是原因、後句是順理成章的結果，用「だから」＝所以。「でも」「しかし」是轉折（有考試「可是」唸書？方向不對）；「まだ（還）」是副詞，不能放在句頭當連接詞。※テスト＝考試、こんばん＝今晚。"
  },
  {
    id: "pattern-n5-riyuu-007",
    patternId: "n5-riyuu",
    promptText: "じかんが ありません___、タクシーで いきましょう。",
    hintZh: "趕時間，決定搭車方式。",
    promptContextZh: "「沒時間了，搭計程車去吧。」",
    expectedAnswer: "から",
    options: ["から", "まで", "を", "へ"],
    explanation:
      "句中的理由用「から」：じかんが ありませんから＝因為沒時間，（所以）搭計程車吧。「まで」「を」「へ」都接不到ません後面，句子直接斷掉。※タクシー＝計程車。"
  },
  {
    id: "pattern-n5-riyuu-008",
    patternId: "n5-riyuu",
    promptText: "「___ にほんごを べんきょうして いますか。」「にほんへ いきたいですから。」",
    hintZh: "想知道對方學日語的動機。",
    promptContextZh: "「你為什麼在學日語？」「因為想去日本。」",
    expectedAnswer: "どうして",
    options: ["どうして", "なに", "どこ", "いつ"],
    explanation:
      "回答是「〜ですから（因為〜）」，所以問句一定是問理由的「どうして」＝為什麼。「いつ（什麼時候）」「どこ（哪裡）」問時間地點，跟「因為想去日本」的回答對不上；「なに」問東西——句子已經有受詞にほんごを了。※べんきょうします＝學習、〜たいです＝想〜。"
  }
];

// ===========================================================================
// N5 pattern: n5-toki -- time and experience: とき・もう/まだ・でしょう・
//   たことがある (#547). でしょう vs ですか is the known double-solution
//   trap: the forecast item kills ですか by form (dictionary form + ですか
//   is ungrammatical), and the agreement item kills all question foils
//   with a leading ええ. The とき tense item uses a culture-locked anchor
//   (いただきます is said BEFORE eating). は stays out of the ことがある
//   particle blank (topicalized 〜ことはあります is real).
// ===========================================================================
const N5_TOKI_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n5-toki-001",
    patternId: "n5-toki",
    promptText: "ひまな ___、おんがくを ききます。",
    hintZh: "說自己閒下來會做的事。",
    promptContextZh: "「有空的時候，我會聽音樂。」",
    expectedAnswer: "とき",
    options: ["とき", "ところ", "こと", "もの"],
    explanation:
      "「〜とき」＝〜的時候：ひまな とき＝有空的時候。「ところ」多指地方（「ひまなところ」在這裡不自然）；「こと」是事情、「もの」是東西——放進去孤懸在句首，跟後句「聽音樂」接不起來。※ひま（な）＝空閒、おんがく＝音樂。"
  },
  {
    id: "pattern-n5-toki-002",
    patternId: "n5-toki",
    promptText: "ごはんを ___ とき、「いただきます」と いいます。",
    hintZh: "說吃飯前的那句話。",
    promptContextZh: "「吃飯（前）的時候，要說『いただきます（開動）』。」",
    expectedAnswer: "たべる",
    options: ["たべる", "たべた", "たべて", "たべます"],
    explanation:
      "とき前面的時態看動作完成了沒：說「いただきます」是在吃「之前」，動作還沒完成→辭書形たべる とき。「たべた とき」是吃完的時候——吃完說的是「ごちそうさま」；「て形」「ます形」不能直接接とき。"
  },
  {
    id: "pattern-n5-toki-003",
    patternId: "n5-toki",
    promptText: "「ひるごはんを たべましたか。」「はい、___ たべました。」",
    hintZh: "答說午餐解決了。",
    promptContextZh: "「午餐吃了嗎？」「嗯，已經吃了。」",
    expectedAnswer: "もう",
    options: ["もう", "まだ", "いつ", "とても"],
    explanation:
      "完成用「もう〜ました」＝已經〜了：もう たべました。「まだ」配未完成（まだ たべていません），跟ました矛盾；「いつ（什麼時候）」是疑問詞；「とても（非常）」修飾程度，不搭完成。"
  },
  {
    id: "pattern-n5-toki-004",
    patternId: "n5-toki",
    promptText: "「レポートは できましたか。」「いいえ、まだ ___。」",
    hintZh: "報告進度的回答。",
    promptContextZh: "「報告寫好了嗎？」「還沒，還沒寫好。」",
    expectedAnswer: "できていません",
    options: ["できていません", "できました", "できます", "できましたか"],
    explanation:
      "未完成用「まだ〜ていません」＝還沒〜：まだ できていません。「まだ できました」自相矛盾；「できます」是能力或未來；答句裡再放問句「できましたか」也不通。※レポート＝報告。"
  },
  {
    id: "pattern-n5-toki-005",
    patternId: "n5-toki",
    promptText: "てんきよほうに よると、あしたは あめが ふる___。",
    hintZh: "氣象預報說明天的天氣。",
    promptContextZh: "「根據氣象預報，明天大概會下雨。」",
    expectedAnswer: "でしょう",
    options: ["でしょう", "ですか", "ましょう", "でした"],
    explanation:
      "推測用「でしょう」＝大概〜吧：あめが ふるでしょう。辭書形ふる後面不能直接接「ですか」（要說ふりますか）；「ましょう」是提議、「でした」是過去，都接不上。※てんきよほう＝氣象預報、〜によると＝根據〜、ふります＝（雨雪）下。"
  },
  {
    id: "pattern-n5-toki-006",
    patternId: "n5-toki",
    promptText: "「あしたも さむいでしょうか。」「ええ、さむい___。」",
    hintZh: "順著對方的話也覺得明天冷。",
    promptContextZh: "「明天也會冷吧？」「嗯，大概會冷吧。」",
    expectedAnswer: "でしょう",
    options: ["でしょう", "ですか", "ましたか", "ませんか"],
    explanation:
      "回答別人的推測、自己也用推測：ええ、さむいでしょう＝嗯，大概會冷吧。「ですか」被開頭的「ええ（嗯）」駁倒——表態之後不會再反問；「ましたか」「ませんか」則連形都接不上——い形容詞的過去是「さむかったです」、否定問句是「さむくありませんか」。※さむい＝冷。"
  },
  {
    id: "pattern-n5-toki-007",
    patternId: "n5-toki",
    promptText: "わたしは ふじさんに のぼった こと___ あります。",
    hintZh: "說爬過富士山。",
    promptContextZh: "「我爬過富士山。」",
    expectedAnswer: "が",
    options: ["が", "を", "に", "で"],
    explanation:
      "經驗用「た形＋ことが あります」＝〜過：のぼった ことが あります。這個句型用「が」——「を」「に」「で」放這裡都不成句。※ふじさん＝富士山、のぼります＝爬・登。"
  },
  {
    id: "pattern-n5-toki-008",
    patternId: "n5-toki",
    promptText: "「すしを たべた ことが ありますか。」「いいえ、いちども ___。」",
    hintZh: "被問吃壽司的經驗，搖搖頭。",
    promptContextZh: "「你吃過壽司嗎？」「沒有，一次也沒有。」",
    expectedAnswer: "ありません",
    options: ["ありません", "あります", "ありました", "たべました"],
    explanation:
      "「いちども（一次也）」後面必須接否定：いちども ありません＝一次也沒有。「あります」「ありました」「たべました」都是肯定，跟いちども矛盾——這跟だれも/なにも＋否定是同一條規則。※すし＝壽司、いちども＝一次也（沒）。"
  }
];

// ===========================================================================
// N5 pattern: n5-keiyoushi -- adjective linking and change (#548).
//   Pure-form decks: every distractor is a wrong inflection of the SAME
//   adjective (おおきいな, しずかい, きれいく...), so the classic い/な
//   confusions ARE the foils and no semantic double reading can exist.
//   きれい and いい get dedicated items (the two most-fumbled adjectives).
// ===========================================================================
const N5_KEIYOUSHI_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n5-keiyoushi-001",
    patternId: "n5-keiyoushi",
    promptText: "これは とても ___ かばんです。",
    hintZh: "稱讚這個包包很大。",
    promptContextZh: "「這是一個很大的包包。」",
    expectedAnswer: "おおきい",
    options: ["おおきい", "おおきいな", "おおきく", "おおきいの"],
    explanation:
      "い形容詞修飾名詞直接接：おおきい かばん。「おおきいな」是把な形的規則錯搬過來（い形不加な）；「おおきく」是接動詞用的連用形；「おおきいの」的の多餘。"
  },
  {
    id: "pattern-n5-keiyoushi-002",
    patternId: "n5-keiyoushi",
    promptText: "ここは ___ まちです。",
    hintZh: "介紹自己住的城市很安靜。",
    promptContextZh: "「這裡是個安靜的城市。」",
    expectedAnswer: "しずかな",
    options: ["しずかな", "しずかい", "しずか", "しずかの"],
    explanation:
      "な形容詞修飾名詞要加な：しずかな まち。「しずかい」是把它誤當成い形容詞；「しずか」直接接名詞少了な；「しずかの」的の是名詞用的接法——只有把しずか當名詞（例如人名「靜香」）時才成立，形容詞沒有這種接法。※まち＝城市・城鎮。"
  },
  {
    id: "pattern-n5-keiyoushi-003",
    patternId: "n5-keiyoushi",
    promptText: "この みせの りょうりは ___、おいしいです。",
    hintZh: "推薦這家店，便宜又好吃。",
    promptContextZh: "「這家店的菜便宜又好吃。」",
    expectedAnswer: "やすくて",
    options: ["やすくて", "やすいに", "やすいくて", "やすくで"],
    explanation:
      "い形容詞的並列：去い＋くて——やすい→やすくて。「やすいに」是不存在的形；「やすいくて」沒去い；「やすくで」把くて拼錯了。※みせ＝店。"
  },
  {
    id: "pattern-n5-keiyoushi-004",
    patternId: "n5-keiyoushi",
    promptText: "たなかさんは ___、しんせつです。",
    hintZh: "說田中有活力又親切。",
    promptContextZh: "「田中有活力又親切。」",
    expectedAnswer: "げんきで",
    options: ["げんきで", "げんきくて", "げんきいで", "げんきなで"],
    explanation:
      "な形容詞的並列用で：げんきで、しんせつです。「げんきくて」是い形的くて錯搬；「げんきいで」「げんきなで」都不是存在的形——連接名詞才用な，並列直接＋で。※げんき（な）＝有精神、しんせつ（な）＝親切。"
  },
  {
    id: "pattern-n5-keiyoushi-005",
    patternId: "n5-keiyoushi",
    promptText: "まいにち れんしゅうしたので、じが ___ なりました。",
    hintZh: "說每天練字的成果。",
    promptContextZh: "「因為每天練習，字變漂亮了。」",
    expectedAnswer: "きれいに",
    options: ["きれいに", "きれいく", "きれいで", "きれいの"],
    explanation:
      "「變得〜」：な形容詞＋に なります——きれいに なりました。きれい結尾是い但其實是な形容詞，「きれいく」正是最常見的錯（跟い形的くなります搞混）；「で」「の」接不上なります。※じ＝字、れんしゅうします＝練習。"
  },
  {
    id: "pattern-n5-keiyoushi-006",
    patternId: "n5-keiyoushi",
    promptText: "よるに なって、そとが さむ___ なりました。",
    hintZh: "說入夜後外面的溫度。",
    promptContextZh: "「入夜之後，外面變冷了。」",
    expectedAnswer: "く",
    options: ["く", "に", "で", "い"],
    explanation:
      "い形容詞＋「變得〜」：去い＋く なります——さむい→さむく なりました。「に」是な形容詞用的（しずかに なります）；「で」「い」接不上なります。※そと＝外面。"
  },
  {
    id: "pattern-n5-keiyoushi-007",
    patternId: "n5-keiyoushi",
    promptText: "この へやは ひろ___、あかるいです。",
    hintZh: "說這個房間又寬敞又亮。",
    promptContextZh: "「這個房間又寬敞又明亮。」",
    expectedAnswer: "くて",
    options: ["くて", "いて", "くで", "いくて"],
    explanation:
      "い形容詞並列再練一次：ひろい→ひろくて、あかるいです。「いて」「くで」「いくて」都不是存在的接法——記住公式：去い＋くて。※ひろい＝寬敞、あかるい＝明亮。"
  },
  {
    id: "pattern-n5-keiyoushi-008",
    patternId: "n5-keiyoushi",
    promptText: "きのうは てんきが ___ なりました。",
    hintZh: "說天氣轉好了。",
    promptContextZh: "「昨天天氣變好了。」",
    expectedAnswer: "よく",
    options: ["よく", "いく", "いいく", "よい"],
    explanation:
      "「いい（好）」的否定、過去、變化都走「よ」系：よく なります、よくない、よかった（基本形仍是いい／よい）。「いく」「いいく」把いい直接變形，都是不存在的形；「よい なりました」少了く接不上。※てんき＝天氣。"
  }
];

// ===========================================================================
// N5 pattern: n5-josuushi -- counters and quantity word order (#548).
//   Distractors are either wrong sound-change forms (さんほん, いちひき --
//   the sound changes ARE the lesson) or category-mismatched counters the
//   sentence's noun kills outright. にど never appears where にかい is the
//   answer (both are real); やっつ never competes with はっさい for ages
//   (colloquial age-いくつ answers are real).
// ===========================================================================
const N5_JOSUUSHI_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n5-josuushi-001",
    patternId: "n5-josuushi",
    promptText: "きょうしつに がくせいが ___ います。",
    hintZh: "說教室裡有兩個學生。",
    promptContextZh: "「教室裡有兩個學生。」",
    expectedAnswer: "ふたり",
    options: ["ふたり", "ににん", "ふたつ", "にまい"],
    explanation:
      "數人用「〜人（にん）」，但一人、二人是特殊讀法：ひとり、ふたり。「ににん」是把規則硬套的錯讀；「ふたつ」數東西不數人；「にまい」數薄平的東西。"
  },
  {
    id: "pattern-n5-josuushi-002",
    patternId: "n5-josuushi",
    promptText: "えんぴつを ___ かいました。",
    hintZh: "說買了三枝鉛筆。",
    promptContextZh: "「買了三枝鉛筆。」",
    expectedAnswer: "さんぼん",
    options: ["さんぼん", "さんほん", "さんぽん", "みっぽん"],
    explanation:
      "細長的東西用「〜本」，三本要濁音化：さんぼん。「さんほん」沒變音；「さんぽん」是半濁音（那是一本いっぽん、六本ろっぽん用的）；「みっぽん」不存在。※えんぴつ＝鉛筆。"
  },
  {
    id: "pattern-n5-josuushi-003",
    patternId: "n5-josuushi",
    promptText: "シャツを ___ かいました。",
    hintZh: "說買了兩件襯衫。",
    promptContextZh: "「買了兩件襯衫。」",
    expectedAnswer: "にまい",
    options: ["にまい", "にほん", "にだい", "にひき"],
    explanation:
      "薄的、平的東西（襯衫、紙、盤子）用「〜枚（まい）」：にまい。「〜本」數細長物、「〜台」數機器車輛、「〜匹」數小動物——類別全對不上。※シャツ＝襯衫。"
  },
  {
    id: "pattern-n5-josuushi-004",
    patternId: "n5-josuushi",
    promptText: "うちに ねこが ___ います。",
    hintZh: "說家裡養了一隻貓。",
    promptContextZh: "「家裡有一隻貓。」",
    expectedAnswer: "いっぴき",
    options: ["いっぴき", "いちひき", "いっぽん", "ひとまい"],
    explanation:
      "小動物用「〜匹（ひき）」，一匹要促音＋半濁音：いっぴき。「いちひき」沒變音；「いっぽん」數細長物；「ひとまい」數薄平物、讀法也不對（正確是いちまい）。"
  },
  {
    id: "pattern-n5-josuushi-005",
    patternId: "n5-josuushi",
    promptText: "１しゅうかんに ___ にほんごを べんきょうします。",
    hintZh: "說自己每週學日語的規律。",
    promptContextZh: "「一週學兩次日語。」",
    expectedAnswer: "にかい",
    options: ["にかい", "にまい", "にだい", "にさつ"],
    explanation:
      "數動作的次數用「〜回（かい）」：１しゅうかんに にかい＝一週兩次。「〜枚」「〜台」「〜冊」都是數東西的——學日語不是可以拿在手上的物品。※〜かい＝〜次。"
  },
  {
    id: "pattern-n5-josuushi-006",
    patternId: "n5-josuushi",
    promptText: "おとうとは ___ です。",
    hintZh: "說弟弟的年紀。",
    promptContextZh: "「弟弟八歲。」",
    expectedAnswer: "はっさい",
    options: ["はっさい", "はちさい", "はっさつ", "はちまい"],
    explanation:
      "年齡用「〜歳（さい）」，八歳要促音化：はっさい。「はちさい」沒變音；「〜冊」數書、「〜枚」數薄平物，跟年齡無關。順帶記：一歳いっさい、十歳じゅっさい也都促音化。"
  },
  {
    id: "pattern-n5-josuushi-007",
    patternId: "n5-josuushi",
    promptText: "みかんを ___ ください。",
    hintZh: "在水果攤挑五顆橘子。",
    promptContextZh: "「請給我五顆橘子。」",
    expectedAnswer: "いつつ",
    options: ["いつつ", "いつつを", "いつつの", "いつつに"],
    explanation:
      "數量詞直接放動詞前面：みかんを いつつ ください——「を」已經接在みかん後面了。「いつつを」「いつつの」「いつつに」都畫蛇添足——在「名詞を＋數量詞＋動詞」這個語順裡，數量詞後面不再加を・の・に。"
  },
  {
    id: "pattern-n5-josuushi-008",
    patternId: "n5-josuushi",
    promptText: "としょかんで ほんを ___ かりました。",
    hintZh: "說從圖書館抱回的書量。",
    promptContextZh: "「在圖書館借了兩本書。」",
    expectedAnswer: "にさつ",
    options: ["にさつ", "にほん", "にまい", "ふたさつ"],
    explanation:
      "書用「〜冊（さつ）」：にさつ。「〜本」雖然中文寫「本」，在日語裡是數細長物的（傘、瓶子、鉛筆）；「〜枚」數薄平物；「ふたさつ」讀法不存在——二冊只讀にさつ，ふた系是〜つ／ふたり用的。※かります＝借（入）。"
  }
];

// ===========================================================================
// N5 pattern: n5-teido -- degree and frequency (#548).
//   Adverb+negative is a swamp (いつも/もう/ときどき+ません all have real
//   readings), so あまり/ぜんぜん items are INVERTED: the adverb sits in the
//   prompt and the options are full predicates -- affirmative foils die on
//   the NPI, deterministically. ぐらい never competes where ごろ is the
//   answer (clock time + ぐらい is real colloquial usage); ごろ IS a dead
//   foil for durations (じゅっぷんごろ has no reading). Frequency-adverb
//   items carry an explicit in-prompt rate anchor (まいしゅう３かいも, １ねん
//   に３かい) so the pick is arithmetic, not vibes.
// ===========================================================================
const N5_TEIDO_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n5-teido-001",
    patternId: "n5-teido",
    promptText: "この えいがは あまり ___。",
    hintZh: "說出對這部電影的評價。",
    promptContextZh: "「這部電影不太有趣。」",
    expectedAnswer: "おもしろくないです",
    options: ["おもしろくないです", "おもしろいです", "おもしろかったです", "とても おもしろいです"],
    explanation:
      "這種直述句裡的「あまり」要跟否定呼應＝不太〜：あまり おもしろくないです。另外三個都是肯定，跟あまり搭不起來——看到あまり就要找ない。"
  },
  {
    id: "pattern-n5-teido-002",
    patternId: "n5-teido",
    promptText: "「おさけを のみますか。」「いいえ、ぜんぜん ___。」",
    hintZh: "回答自己喝不喝酒的問題。",
    promptContextZh: "「你喝酒嗎？」「不，完全不喝。」",
    expectedAnswer: "のみません",
    options: ["のみません", "のみます", "のみました", "のみたいです"],
    explanation:
      "「ぜんぜん」配否定＝完全不〜：ぜんぜん のみません。開頭的「いいえ」已經否定了，「のみます」「のみました」「のみたいです」都是肯定，直接矛盾。程度比較：あまり＝不太、ぜんぜん＝完全不。※おさけ＝酒。"
  },
  {
    id: "pattern-n5-teido-003",
    patternId: "n5-teido",
    promptText: "まいあさ ７じ___ おきます。",
    hintZh: "說自己每天早上幾點起床。",
    promptContextZh: "「每天早上七點左右起床。」",
    expectedAnswer: "ごろ",
    options: ["ごろ", "が", "を", "へ"],
    explanation:
      "時刻的概數用「ごろ」＝〜點左右：７じごろ おきます。「が」「を」「へ」都接不上時刻詞。順帶記：數量的概數用「ぐらい」（じゅっぷんぐらい）。※まいあさ＝每天早上、おきます＝起床。"
  },
  {
    id: "pattern-n5-teido-004",
    patternId: "n5-teido",
    promptText: "えきまで あるいて じゅっぷん___ かかります。",
    hintZh: "說走到車站要花的時間。",
    promptContextZh: "「走到車站大約要十分鐘。」",
    expectedAnswer: "ぐらい",
    options: ["ぐらい", "ごろ", "まで", "から"],
    explanation:
      "數量、時間長度的概數用「ぐらい」＝大約〜：じゅっぷんぐらい かかります。「ごろ」只接時刻點（７じごろ），不能接「十分鐘」這種長度；「まで」「から」是起訖點。※かかります＝花費（時間）。"
  },
  {
    id: "pattern-n5-teido-005",
    patternId: "n5-teido",
    promptText: "たなかさんは ___ としょかんへ いきます。まいしゅう ３かいも いきます。",
    hintZh: "說田中上圖書館的頻率。",
    promptContextZh: "「田中常常去圖書館，每週去多達三次。」",
    expectedAnswer: "よく",
    options: ["よく", "ときどき", "あまり", "まいにち"],
    explanation:
      "每週三次（還帶個「も」＝多達）是高頻率→「よく」＝常常。「まいにち（每天）」跟「每週三次」直接矛盾；「ときどき（有時）」對這個頻率也對不上；「あまり」在這種直述頻度句要配否定，後句卻是肯定的いきます。"
  },
  {
    id: "pattern-n5-teido-006",
    patternId: "n5-teido",
    promptText: "わたしは ___ えいがを みます。１ねんに ３かいぐらいです。",
    hintZh: "說自己看電影的頻率。",
    promptContextZh: "「我偶爾看電影，一年大概三次。」",
    expectedAnswer: "ときどき",
    options: ["ときどき", "いつも", "よく", "まいにち"],
    explanation:
      "一年只有三次是低頻率→「ときどき」＝有時、偶爾。「いつも（總是）」「まいにち（每天）」「よく（常常）」都跟一年三次的次數矛盾——頻度副詞要跟實際次數對得上。"
  },
  {
    id: "pattern-n5-teido-007",
    patternId: "n5-teido",
    promptText: "あには りょうりを あまり ___。",
    hintZh: "說哥哥做菜的習慣。",
    promptContextZh: "「哥哥不太做菜。」",
    expectedAnswer: "しません",
    options: ["しません", "します", "しました", "したいです"],
    explanation:
      "直述句的「あまり」配否定，動詞句也一樣：あまり しません＝不太做。「します」「しました」「したいです」都是肯定，跟あまり搭不起來——跟形容詞句（あまり おもしろくない）同一條規則。"
  },
  {
    id: "pattern-n5-teido-008",
    patternId: "n5-teido",
    promptText: "１しゅうかん___ ２かい、プールで およぎます。",
    hintZh: "說固定去游泳的安排。",
    promptContextZh: "「一週游兩次泳。」",
    expectedAnswer: "に",
    options: ["に", "を", "へ", "と"],
    explanation:
      "頻率的說法「期間＋に＋次數」：１しゅうかんに ２かい＝一週兩次。這個に表示「在這段期間內」的分配。「を」「へ」「と」都接不上期間詞。※プール＝游泳池。"
  }
];

// ===========================================================================
// N4 pattern: n4-ndesu -- the explanatory んです system (#549).
//   んです vs です is interchangeable almost everywhere on the surface, so
//   です NEVER competes semantically: every item is built so the blank
//   follows a PLAIN form (した/行く/ある/だった/な), where です・ます・
//   でした are attachment-dead and only んです(か/が) parses. The four
//   attachment shapes (verb plain, noun+な, noun+だった, い-adj) each get
//   dedicated items.
// ===========================================================================
const N4_NDESU_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n4-ndesu-001",
    patternId: "n4-ndesu",
    promptText: "顔色が悪いですね。どうした___。",
    hintZh: "看對方臉色不對，開口關心。",
    promptContextZh: "「你臉色不太好耶，怎麼了嗎？」",
    expectedAnswer: "んですか",
    options: ["んですか", "ですか", "ますか", "でしたか"],
    explanation:
      "看到不尋常的狀況、想「求說明」時用「〜んですか」：どうしたんですか＝怎麼了嗎？前面的「した」是普通形，後面直接接「ですか」「ますか」「でしたか」都不成句——這四個選項裡只有んですか接得上。※顔色＝臉色、氣色。"
  },
  {
    id: "pattern-n4-ndesu-002",
    patternId: "n4-ndesu",
    promptText: "「どうして遅れたんですか。」「電車が止まった___。」",
    hintZh: "說出遲到的緣由。",
    promptContextZh: "「為什麼遲到了？」「因為電車停駛了。」",
    expectedAnswer: "んです",
    options: ["んです", "です", "ます", "ましょう"],
    explanation:
      "回答「どうして〜んですか」的追問，用「〜んです」說明緣由：電車が止まったんです。「止まった」是普通形，後面直接接「です」「ます」「ましょう」都不成句。問答一組：んですか⇄んです。※遅れる＝遲到。"
  },
  {
    id: "pattern-n4-ndesu-003",
    patternId: "n4-ndesu",
    promptText: "明日引っ越し___、手伝ってくれませんか。",
    hintZh: "開口請人幫忙搬家前先交代狀況。",
    promptContextZh: "「明天我要搬家，能幫我個忙嗎？」",
    expectedAnswer: "なんですが",
    options: ["なんですが", "んですが", "だんですが", "のんですが"],
    explanation:
      "拜託人之前先鋪墊狀況用「〜んですが」；名詞接んです要加な：引っ越し＋な＋んですが。「引っ越しんですが」少了な；「だんですが」「のんですが」都不是存在的接法——跟「なので」同一個な。※引っ越し＝搬家、手伝う＝幫忙。"
  },
  {
    id: "pattern-n4-ndesu-004",
    patternId: "n4-ndesu",
    promptText: "今日は誕生日な___。だからケーキを買いました。",
    hintZh: "解釋自己為什麼買蛋糕。",
    promptContextZh: "「今天是我生日，所以買了蛋糕。」",
    expectedAnswer: "んです",
    options: ["んです", "です", "でした", "だんです"],
    explanation:
      "說明自己行為的背景用「〜んです」：誕生日なんです＝（其實）今天是我生日。空格前已經有な，其餘三個選項接在な後面都不成句——這個な跟なので、なのに 是同一家。"
  },
  {
    id: "pattern-n4-ndesu-005",
    patternId: "n4-ndesu",
    promptText: "（友だちが大きいかばんを持っている）どこへ行く___。",
    hintZh: "看到朋友拿著大包包，好奇追問。",
    promptContextZh: "「（看到朋友拿著大包包）你要去哪裡呀？」",
    expectedAnswer: "んですか",
    options: ["んですか", "ですか", "ましたか", "でしたか"],
    explanation:
      "看到眼前的情況、帶著關心追問用「〜んですか」：どこへ行くんですか。「行く」是辭書形，直接接「ですか」「ましたか」「でしたか」都不成句——要單純地問就得說「行きますか」。"
  },
  {
    id: "pattern-n4-ndesu-006",
    patternId: "n4-ndesu",
    promptText: "「どうして休んだんですか。」「病気だった___。」",
    hintZh: "說出請假的緣由。",
    promptContextZh: "「為什麼請假了？」「因為（那時）生病了。」",
    expectedAnswer: "んです",
    options: ["んです", "なんです", "です", "でした"],
    explanation:
      "名詞的過去形接んです不再加な：病気だった＋んです。「病気だったなんです」多了な；「だったです」「だったでした」都不成句。整理：現在＝病気なんです、過去＝病気だったんです。"
  },
  {
    id: "pattern-n4-ndesu-007",
    patternId: "n4-ndesu",
    promptText: "先生、質問がある___、今いいですか。",
    hintZh: "找老師發問前先開個頭。",
    promptContextZh: "「老師，我有個問題想請教，現在方便嗎？」",
    expectedAnswer: "んですが",
    options: ["んですが", "ですが", "なんですが", "ました"],
    explanation:
      "開口前的鋪墊：動詞普通形直接接「んですが」——質問があるんですが。「あるですが」不成句（要說ありますが）；「あるなんですが」多了な（な只給名詞和な形容詞用）；「あるました」不成句。"
  },
  {
    id: "pattern-n4-ndesu-008",
    patternId: "n4-ndesu",
    promptText: "「日本へ留学するんですか。」「はい、来年行く___。」",
    hintZh: "確認對方留學的計畫。",
    promptContextZh: "「你要去日本留學嗎？」「對，明年要去。」",
    expectedAnswer: "んです",
    options: ["んです", "です", "ます", "でした"],
    explanation:
      "被「〜んですか」問到，回答也用「〜んです」呼應：来年行くんです。「行くです」「行くます」「行くでした」都不成句——辭書形後面這四個選項只有んです接得上。※留学＝留學。"
  }
];

// ===========================================================================
// N4 pattern: n4-suiryou -- conjecture + causal て (#549).
//   かもしれない and でしょう/だろう are certainty-adjacent, so they never
//   compete in one item. The chapter's spine is attachment: かも/だろう/
//   でしょう all take nouns and な-adjectives BARE (だ drops) -- contrast
//   with んです's な. て-cause items are pure form kills; ないで never
//   appears as a foil where なくて is the answer (colloquial ないで+state
//   readings survive).
// ===========================================================================
const N4_SUIRYOU_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n4-suiryou-001",
    patternId: "n4-suiryou",
    promptText: "空が暗いですね。雨が降る___。",
    hintZh: "看天色說話。",
    promptContextZh: "「天色好暗，說不定會下雨。」",
    expectedAnswer: "かもしれません",
    options: ["かもしれません", "かしれません", "かもしりません", "かもしれました"],
    explanation:
      "可能性用「〜かもしれません」＝說不定〜：雨が降るかもしれません。「かしれません」少了も；「かもしりません」把しれ誤作しり；「かもしれました」沒有這種過去形——整組當固定形背下來。※暗い＝暗。"
  },
  {
    id: "pattern-n4-suiryou-002",
    patternId: "n4-suiryou",
    promptText: "明日はたぶん晴れる___。",
    hintZh: "用普通體聊明天的天氣。",
    promptContextZh: "「明天大概會放晴吧。」",
    expectedAnswer: "だろう",
    options: ["だろう", "だ", "だった", "ではない"],
    explanation:
      "「だろう」是「でしょう」的普通體＝大概〜吧：晴れるだろう。辭書形後面直接接「だ」「だった」「ではない」都不成句——動詞普通形之後だ系只有だろう接得上。※晴れる＝放晴。"
  },
  {
    id: "pattern-n4-suiryou-003",
    patternId: "n4-suiryou",
    promptText: "宿題が___、困っています。",
    hintZh: "說功課卡住的煩惱。",
    promptContextZh: "「功課寫不完，正傷腦筋。」",
    expectedAnswer: "終わらなくて",
    options: ["終わらなくて", "終わるなくて", "終わらなくで", "終わないで"],
    explanation:
      "原因的否定用「〜なくて」：終わらない→終わらなくて＝因為寫不完（所以困擾）。「終わるなくて」把辭書形硬接ない系；「終わらなくで」拼錯；「終わないで」少了ら。後件是感情、狀態（困る）時，原因用なくて。※宿題＝功課。"
  },
  {
    id: "pattern-n4-suiryou-004",
    patternId: "n4-suiryou",
    promptText: "合格の知らせを___、安心しました。",
    hintZh: "說明安心的原因。",
    promptContextZh: "「聽到合格的通知，放心了。」",
    expectedAnswer: "聞いて",
    options: ["聞いて", "聞くて", "聞きて", "聞いで"],
    explanation:
      "感情（安心、びっくり、うれしい…）的原因用て形：知らせを聞いて、安心しました＝聽到通知而放心。「聞くて」「聞きて」都是錯誤音便；「聞いで」的いで是ぐ結尾動詞用的（泳ぐ→泳いで）——く結尾是いて（聞く→聞いて）。※合格＝合格、知らせ＝通知、安心する＝放心。"
  },
  {
    id: "pattern-n4-suiryou-005",
    patternId: "n4-suiryou",
    promptText: "あの人は学生___。",
    hintZh: "猜測那個人的身分。",
    promptContextZh: "「那個人說不定是學生。」",
    expectedAnswer: "かもしれません",
    options: ["かもしれません", "だかもしれません", "なかもしれません", "のかもしれません"],
    explanation:
      "名詞接「かもしれない」直接接、だ要去掉：学生かもしれません。「学生だかもしれません」留著だ是錯的；「なかもしれません」把んです的な錯搬過來；「のかもしれません」直接接名詞多了の（要說「学生なのかもしれません」另當別論）。對照：んです要な（学生なんです）、かも直接接。"
  },
  {
    id: "pattern-n4-suiryou-006",
    patternId: "n4-suiryou",
    promptText: "たぶんあの店は休み___。",
    hintZh: "用普通體猜店家今天的狀態。",
    promptContextZh: "「那家店今天大概沒開吧。」",
    expectedAnswer: "だろう",
    options: ["だろう", "なだろう", "のだろう", "いだろう"],
    explanation:
      "名詞接「だろう」也是直接接：休みだろう。「なだろう」把んです的な錯搬；「休みのだろう」多了の（要說「休みなのだろう」另當別論）；「いだろう」不成形。かも、だろう、でしょう前面：現在形的だ全部去掉（過去的だった要保留：休みだっただろう）。"
  },
  {
    id: "pattern-n4-suiryou-007",
    patternId: "n4-suiryou",
    promptText: "彼女はたぶん元気___。",
    hintZh: "猜久沒聯絡的朋友的近況。",
    promptContextZh: "「她大概過得很好吧。」",
    expectedAnswer: "でしょう",
    options: ["でしょう", "なでしょう", "だでしょう", "のでしょう"],
    explanation:
      "な形容詞接「でしょう」直接接、だ・な都不要：元気でしょう。「なでしょう」「だでしょう」都畫蛇添足；「元気のでしょう」多了の。整理這一家：〜かもしれない、〜だろう、〜でしょう——名詞/な形容詞的現在形一律裸接（過去的だった保留：元気だったでしょう）。"
  },
  {
    id: "pattern-n4-suiryou-008",
    patternId: "n4-suiryou",
    promptText: "朝ごはんを___、おなかがすきました。",
    hintZh: "說肚子餓的來由。",
    promptContextZh: "「沒吃早餐，肚子餓了。」",
    expectedAnswer: "食べなくて",
    options: ["食べなくて", "食べなくで", "食べずて", "食べないくて"],
    explanation:
      "原因的否定再練一次：食べない→食べなくて＝因為沒吃（所以餓了）。「食べなくで」「食べずて」「食べないくて」都不是存在的形——公式：ない形去い＋くて。"
  }
];

// ===========================================================================
// N4 pattern: n4-ishi -- intention and decision (#550).
//   つもり / 予定 / （よ）うと思う are meaning-adjacent, so they never
//   compete: the 予定 item uses an inanimate subject (planes have schedules,
//   not intentions), the third-person item locks via らしい attachment
//   (volitional+らしい is dead), and the volitional item uses junk
//   conjugations only. ようにする/ようになる never appear as foils where
//   ことにする/ことになる is the answer (both are real patterns); plain
//   行く/たい never compete with 行こう before と思う (both parse).
// ===========================================================================
const N4_ISHI_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n4-ishi-001",
    patternId: "n4-ishi",
    promptText: "今年こそ、たばこを___と思っています。",
    hintZh: "下定決心戒菸。",
    promptContextZh: "「今年一定要戒菸（我是這麼打算的）。」",
    expectedAnswer: "やめよう",
    options: ["やめよう", "やめろう", "やめしょう", "やめるう"],
    explanation:
      "意志的表明用「意向形＋と思っています」：やめようと思っています＝打算戒。やめる是二類動詞，意向形＝語幹＋よう（やめよう）；「やめろう」是把一類る動詞的變法（帰る→帰ろう）錯搬到二類——一類的意向形是語尾變お段＋う；「やめしょう」「やめるう」都不存在。※たばこをやめる＝戒菸。"
  },
  {
    id: "pattern-n4-ishi-002",
    patternId: "n4-ishi",
    promptText: "来年、日本で働く___です。",
    hintZh: "說明年的工作打算。",
    promptContextZh: "「我打算明年在日本工作。」",
    expectedAnswer: "つもり",
    options: ["つもり", "つもる", "つもれ", "つもら"],
    explanation:
      "打算用「辭書形＋つもりだ」：働くつもりです。つもり是名詞、不會活用——「つもる（積もる）」是另一個動詞（雪が積もる），「つもれ」「つもら」是把它當動詞硬變出來的形，放這裡都不成句。※働く＝工作。"
  },
  {
    id: "pattern-n4-ishi-003",
    patternId: "n4-ishi",
    promptText: "今年は車を買わない___です。",
    hintZh: "說自己今年不買車的打算。",
    promptContextZh: "「今年我打算不買車。」",
    expectedAnswer: "つもり",
    options: ["つもり", "もり", "ため", "ほう"],
    explanation:
      "「不做〜的打算」＝ない形＋つもり：買わないつもりです——打算的否定放在前面的動詞上。「もり」不成詞；「ためです」是說目的、「ほうです」是說平常的傾向，都跟「陳述自己今年的打算」對不上——這裡只有つもり成立。"
  },
  {
    id: "pattern-n4-ishi-004",
    patternId: "n4-ishi",
    promptText: "健康のために、毎朝走る___しました。",
    hintZh: "自己拍板的新習慣。",
    promptContextZh: "「為了健康，我決定每天早上跑步。」",
    expectedAnswer: "ことに",
    options: ["ことに", "ものに", "ところに", "ぶりに"],
    explanation:
      "自己決定用「〜ことにする」：走ることにしました＝我決定要跑。「ものに」「ところに」「ぶりに」都接不出決定的意思。順帶一提：「ようにする」是「努力做到」，是另一個句型。※健康＝健康。"
  },
  {
    id: "pattern-n4-ishi-005",
    patternId: "n4-ishi",
    promptText: "来月から、大阪に転勤する___なりました。",
    hintZh: "公司宣布的人事安排。",
    promptContextZh: "「（公司決定）下個月起我調職到大阪。」",
    expectedAnswer: "ことに",
    options: ["ことに", "ものに", "ままに", "とおりに"],
    explanation:
      "外部決定（公司、規定、別人）用「〜ことになる」：転勤することになりました——不是我要調，是被安排調。跟004對照：自己拍板＝ことにする、別人拍板＝ことになる。「ものに」「ままに」「とおりに」都接不上。※転勤＝調職。"
  },
  {
    id: "pattern-n4-ishi-006",
    patternId: "n4-ishi",
    promptText: "飛行機は午後3時に出発する___です。",
    hintZh: "唸出航班資訊。",
    promptContextZh: "「飛機預定下午三點起飛。」",
    expectedAnswer: "予定",
    options: ["予定", "つもり", "気持ち", "考え"],
    explanation:
      "排程用「〜予定だ」：出発する予定です。「つもり」需要有意志的主體——飛機自己不會「打算」起飛；「気持ち」「考え」同樣是人才有的，都跟航班播報的語境對不上。※飛行機＝飛機、予定＝預定、出発＝出發。"
  },
  {
    id: "pattern-n4-ishi-007",
    patternId: "n4-ishi",
    promptText: "田中さんは会社をやめる___らしいです。",
    hintZh: "轉述聽來的人事消息。",
    promptContextZh: "「聽說田中打算辭職。」",
    expectedAnswer: "つもり",
    options: ["つもり", "よう", "ましょう", "なさい"],
    explanation:
      "轉述「別人的打算」用「つもりらしい」：やめるつもりらしいです。「よう」「ましょう」是意向形/敬體勸誘、「なさい」是命令——三者都不能直接接らしい；要轉述別人的打算，得先名詞化成つもり。※会社をやめる＝辭職。"
  },
  {
    id: "pattern-n4-ishi-008",
    patternId: "n4-ishi",
    promptText: "甘いものは食べない___しています。",
    hintZh: "說一條持續遵守的自我規定。",
    promptContextZh: "「我（決定並持續）不吃甜食。」",
    expectedAnswer: "ことに",
    options: ["ことに", "ことへ", "ことか", "ことの"],
    explanation:
      "「〜ことにしている」＝決定之後一直維持著：食べないことにしています——自我規定的慣用說法。「ことへ」「ことか」「ことの」都接不上している。※甘いもの＝甜食。"
  }
];

// ===========================================================================
// N4 pattern: n4-meirei -- commands and prohibitions (#550).
//   Command items never offer て-form or the な-contraction (帰りな) as
//   foils -- both are real softened commands; ないと/なくちゃ never compete
//   with なきゃ (all real). Foils are junk conjugations (走りろ, しれ) or
//   direction-killed by an explicit scene (STOP sign, fire escape). せよ
//   (literary する command) stays out of options; explanations mention it.
// ===========================================================================
const N4_MEIREI_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n4-meirei-001",
    patternId: "n4-meirei",
    promptText: "火事だ！早く___！",
    hintZh: "火警現場的呼喊，要大家往外跑。",
    promptContextZh: "「失火了！快逃！」",
    expectedAnswer: "逃げろ",
    options: ["逃げろ", "逃げるな", "逃げず", "逃げまい"],
    explanation:
      "緊急時的命令形：二類動詞＝語幹＋ろ——逃げろ！「逃げるな」是禁止（別逃），火場裡方向完全相反；「逃げず」是書面的「不逃（而）」、「逃げまい」是「不打算逃/大概不會逃」——都不是命令。※火事＝火災、逃げる＝逃跑。"
  },
  {
    id: "pattern-n4-meirei-002",
    patternId: "n4-meirei",
    promptText: "コーチ：「もっと速く___！」",
    hintZh: "教練對隊員吼的一聲。",
    promptContextZh: "教練：「跑快一點！」",
    expectedAnswer: "走れ",
    options: ["走れ", "走りろ", "走るれ", "走りれ"],
    explanation:
      "一類（五段）動詞的命令形＝語尾變え段：走る→走れ。「走りろ」是把二類的ろ錯搬到一類；「走るれ」「走りれ」都不是存在的形。對照：二類才用ろ（逃げろ、食べろ）。※コーチ＝教練。"
  },
  {
    id: "pattern-n4-meirei-003",
    patternId: "n4-meirei",
    promptText: "（公園の看板）ここにごみを___。",
    hintZh: "公園告示牌上的規定。",
    promptContextZh: "（公園告示）「請勿在此丟垃圾。」",
    expectedAnswer: "捨てるな",
    options: ["捨てるな", "捨てるれ", "捨てりれ", "捨てるなさい"],
    explanation:
      "禁止形＝辭書形＋な：捨てるな＝不准丟。「捨てるれ」「捨てりれ」都不是存在的形；「なさい」要接ます形語幹（捨てなさい），接辭書形的「捨てるなさい」不成句。※看板＝告示牌、捨てる＝丟棄。"
  },
  {
    id: "pattern-n4-meirei-004",
    patternId: "n4-meirei",
    promptText: "お母さん：「早く宿題を___。」",
    hintZh: "媽媽催小孩做功課。",
    promptContextZh: "媽媽：「快去寫功課。」",
    expectedAnswer: "しなさい",
    options: ["しなさい", "するなさい", "しるなさい", "したなさい"],
    explanation:
      "溫和的命令用「ます形語幹＋なさい」：します→し＋なさい＝しなさい。「するなさい」「しるなさい」「したなさい」都接錯了——なさい前面只能放ます形語幹。家長對小孩、老師對學生的標準口吻。"
  },
  {
    id: "pattern-n4-meirei-005",
    patternId: "n4-meirei",
    promptText: "もう遅い。早く帰ら___。",
    hintZh: "深夜自言自語，該走了。",
    promptContextZh: "「好晚了，（我）得快點回家。」",
    expectedAnswer: "なきゃ",
    options: ["なきゃ", "ないきゃ", "なちゃ", "なけば"],
    explanation:
      "口語的義務縮約「〜なきゃ」＝なければ（ならない）：帰らなきゃ＝不回不行。「ないきゃ」「なちゃ」「なけば」都是拼壞的形。同義的還有「なくちゃ」（＝なくては）——兩個都常用，成對記。"
  },
  {
    id: "pattern-n4-meirei-006",
    patternId: "n4-meirei",
    promptText: "医者は父にお酒をやめる___言いました。",
    hintZh: "醫生交代父親的事。",
    promptContextZh: "「醫生要父親戒酒。」",
    expectedAnswer: "ように",
    options: ["ように", "ままに", "とおりに", "ばかりに"],
    explanation:
      "間接命令、轉述指示用「〜ように言う」：やめるように言いました＝（醫生）要（父親）戒。「ままに」「とおりに」「ばかりに」都接不出指示的意思。※医者＝醫生。"
  },
  {
    id: "pattern-n4-meirei-007",
    patternId: "n4-meirei",
    promptText: "先輩に「もっと練習___」と言われました。",
    hintZh: "被學長訓了一句。",
    promptContextZh: "「被學長說『多練習！』。」",
    expectedAnswer: "しろ",
    options: ["しろ", "しりろ", "すろ", "さろ"],
    explanation:
      "する的命令形＝しろ：練習しろ！「しりろ」「すろ」「さろ」都不是存在的形——する是不規則動詞，命令形只能背（口語しろ；書面測驗指示會看到文語的せよ；部分方言另有せえ）。※先輩＝學長姐。"
  },
  {
    id: "pattern-n4-meirei-008",
    patternId: "n4-meirei",
    promptText: "（道路標識）___。",
    hintZh: "路口要求一時停止的紅色倒三角形標誌上寫的字。",
    promptContextZh: "（道路標誌）「停。」",
    expectedAnswer: "止まれ",
    options: ["止まれ", "止まるな", "止まりろ", "止まるれ"],
    explanation:
      "道路標誌用命令形：止まれ＝停（一類動詞、語尾え段）。日本的一時停止標誌是紅色倒三角形、日文寫「止まれ」（新版會併記英文STOP）。「止まるな」是禁止——叫車不准停，路口標誌不會這樣寫；「止まりろ」「止まるれ」都不是存在的形。※道路標識＝道路標誌。"
  }
];

// ===========================================================================
// N4 pattern: n4-shushoku -- noun-modifying clauses + という (#551).
//   The tense inside a modifier clause is anchored by an explicit time
//   adverb (きのう / 来週) so plain-vs-past never double-reads; の never
//   appears where が is the answer (the が/の alternation is real);
//   habitual 住む never competes with 住んでいる (both modify) -- the
//   foil set there is polite/て/た forms killed by attachment or the
//   meet-the-friend-in-Osaka anchor. と言った never competes with
//   と言っていた (both report).
// ===========================================================================
const N4_SHUSHOKU_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n4-shushoku-001",
    patternId: "n4-shushoku",
    promptText: "これはきのう___本です。",
    hintZh: "說這本書昨天入手。",
    promptContextZh: "「這是我昨天買的書。」",
    expectedAnswer: "買った",
    options: ["買った", "買う", "買います", "買って"],
    explanation:
      "把句子塞進名詞前面＝名詞修飾節，動詞用普通形：きのう買った本＝昨天買的書。「買う本」是「要買的書」，跟きのう矛盾；「買います」是敬體——敬體一般不進修飾節（考試一律當錯）；「買って本」不成句。"
  },
  {
    id: "pattern-n4-shushoku-002",
    patternId: "n4-shushoku",
    promptText: "あそこで___人は田中さんです。",
    hintZh: "指出在那邊唱歌的人是誰。",
    promptContextZh: "「在那邊唱歌的人是田中。」",
    expectedAnswer: "歌っている",
    options: ["歌っている", "歌っています", "歌いますの", "歌ってる人の"],
    explanation:
      "修飾節裡用普通形：歌っている人＝正在唱歌的人。「歌っています人」把敬體塞進修飾節——一般不成句、考試一律當錯（超正式書信另當別論）；「歌いますの」「歌ってる人の」都是亂接。※歌う＝唱歌。"
  },
  {
    id: "pattern-n4-shushoku-003",
    patternId: "n4-shushoku",
    promptText: "これは母___作った料理です。",
    hintZh: "介紹桌上這道菜出自誰手。",
    promptContextZh: "「這是媽媽做的菜。」",
    expectedAnswer: "が",
    options: ["が", "から", "を", "で"],
    explanation:
      "修飾節裡的主語用「が」：母が作った料理。「から」變成「從媽媽做出的菜」、「で」變成「用媽媽做出的菜」，都不成話；「を」的位置已被料理佔了。順帶記兩件事：主題的は進不了修飾節（要用が）；而節裡的が可以換成の（母の作った料理），是同義的漂亮寫法。"
  },
  {
    id: "pattern-n4-shushoku-004",
    patternId: "n4-shushoku",
    promptText: "駅前に「さくら」___店ができました。",
    hintZh: "說站前新開了一家店，順帶報店名。",
    promptContextZh: "「站前開了一家叫『さくら』的店。」",
    expectedAnswer: "という",
    options: ["という", "にいう", "でいう", "がいう"],
    explanation:
      "報出名字、介紹新事物用「〜という＋名詞」：「さくら」という店＝叫さくら的店。「にいう」「でいう」「がいう」都不是這個句型——固定就是と＋いう。※駅前＝車站前。"
  },
  {
    id: "pattern-n4-shushoku-005",
    patternId: "n4-shushoku",
    promptText: "来週___ホテルは、もう予約しました。",
    hintZh: "說下週住宿的旅館已訂好。",
    promptContextZh: "「下週要住的旅館已經訂好了。」",
    expectedAnswer: "泊まる",
    options: ["泊まる", "泊まった", "泊まりますの", "泊まって"],
    explanation:
      "修飾節的時態看「事件本身」發生了沒，不看主句：住宿在下週、還沒發生→辭書形泊まるホテル（訂房這個動作才是完成的）。「泊まった」跟来週矛盾；「泊まりますの」是敬體＋の的亂接；「泊まって」不成句。※泊まる＝住宿、予約＝預約。"
  },
  {
    id: "pattern-n4-shushoku-006",
    patternId: "n4-shushoku",
    promptText: "大阪に今も___友だちに会いに行きます。",
    hintZh: "說要去見朋友。",
    promptContextZh: "「我要去見至今仍住在大阪的朋友。」",
    expectedAnswer: "住んでいる",
    options: ["住んでいる", "住んでいます", "住んでいるの", "住んでいた"],
    explanation:
      "「住在大阪的朋友」＝狀態的修飾節：住んでいる友だち。「住んでいます」是敬體，一般進不了修飾節（考試一律當錯）；「住んでいるの友だち」多了の、不成句；「住んでいた」是以前住，跟節內的「今も（至今仍）」直接矛盾。"
  },
  {
    id: "pattern-n4-shushoku-007",
    patternId: "n4-shushoku",
    promptText: "田中さんは来週休む___。",
    hintZh: "轉達田中請假的消息。",
    promptContextZh: "「田中（先前）說他下週要請假。」",
    expectedAnswer: "と言っていました",
    options: ["と言っていました", "を言っていました", "に言っていました", "が言っていました"],
    explanation:
      "轉述別人說過的話用「〜と言っていました」——標準的引用助詞是と（口語另有って）：休むと言っていました。「を」「に」「が」都不能標引用內容。「と言っていた」比「と言った」更有「傳話給你」的口吻。"
  },
  {
    id: "pattern-n4-shushoku-008",
    patternId: "n4-shushoku",
    promptText: "「さくら」___のは、この花の名前です。",
    hintZh: "解釋一個日文詞。",
    promptContextZh: "「所謂『さくら』，是這種花的名字。」",
    expectedAnswer: "という",
    options: ["という", "はいう", "でいう", "をいう"],
    explanation:
      "下定義用「〜というのは」＝所謂〜：「さくら」というのは＝所謂さくら。跟004是同一個という，後面接のは就變成定義句的開頭。「はいう」「でいう」「をいう」放進這個句型都不成立——固定就是と。"
  }
];

// ===========================================================================
// N4 pattern: n4-kansetsu -- indirect questions (#551).
//   The か vs かどうか division IS the lesson, and it's anchored in the
//   prompt: every 疑問詞 item carries its question word (いつ/どこ/どうして)
//   so かどうか dies by rule, and every かどうか item has none. か+case
//   particles (かは/かを/かが) are all REAL, so no option ever pairs か
//   with a particle; plain か never competes where かどうか is the answer
//   (行くか、決めていない is real) -- those items blank only part of the
//   fixed chunk or use junk distractors.
// ===========================================================================
const N4_KANSETSU_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n4-kansetsu-001",
    patternId: "n4-kansetsu",
    promptText: "パーティーに行く___どうか、まだ決めていません。",
    hintZh: "被問到派對的事，表示還沒拿定主意。",
    promptContextZh: "「還沒決定要不要去派對。」",
    expectedAnswer: "か",
    options: ["か", "を", "に", "で"],
    explanation:
      "「是否〜」＝「〜かどうか」：行くかどうか＝去或不去。整組固定是か＋どうか，「を」「に」「で」放進去都不成句。※パーティー＝派對、決める＝決定。"
  },
  {
    id: "pattern-n4-kansetsu-002",
    patternId: "n4-kansetsu",
    promptText: "会議がいつ始まる___、知っていますか。",
    hintZh: "打聽會議的開始時間。",
    promptContextZh: "「你知道會議幾點開始嗎？」",
    expectedAnswer: "か",
    options: ["か", "かどうか", "ので", "まで"],
    explanation:
      "句子裡已經有疑問詞（いつ），間接疑問就用「〜か」：いつ始まるか。「かどうか」只用在沒有疑問詞的「是否」句——「いつ始まるかどうか」是錯的；「ので」「まで」接不出間接疑問。※会議＝會議。"
  },
  {
    id: "pattern-n4-kansetsu-003",
    patternId: "n4-kansetsu",
    promptText: "かぎをどこに置いた___、忘れてしまいました。",
    hintZh: "想不起鑰匙放哪了。",
    promptContextZh: "「忘記鑰匙放在哪裡了。」",
    expectedAnswer: "か",
    options: ["か", "かどうか", "まで", "より"],
    explanation:
      "疑問詞（どこ）＋「〜か」＝間接疑問：どこに置いたか忘れました。「かどうか」跟疑問詞不能同用；「まで」「より」接不上。※かぎ＝鑰匙、置く＝放置。"
  },
  {
    id: "pattern-n4-kansetsu-004",
    patternId: "n4-kansetsu",
    promptText: "明日晴れる___、天気予報を見て確認します。",
    hintZh: "看預報確認明天的天氣。",
    promptContextZh: "「明天會不會放晴，看天氣預報確認。」",
    expectedAnswer: "かどうか",
    options: ["かどうか", "かどうして", "がどうか", "をどうか"],
    explanation:
      "沒有疑問詞的「是否」句用「〜かどうか」：晴れるかどうか＝會不會放晴。「かどうして」「がどうか」「をどうか」都不成句——固定的組合只有か＋どうか。※晴れる＝放晴、天気予報＝天氣預報、確認＝確認。"
  },
  {
    id: "pattern-n4-kansetsu-005",
    patternId: "n4-kansetsu",
    promptText: "田中さんがどうして怒っている___、だれか知りませんか。",
    hintZh: "想知道田中生氣的原因。",
    promptContextZh: "「有人知道田中為什麼在生氣嗎？」",
    expectedAnswer: "か",
    options: ["か", "かどうか", "ので", "のに"],
    explanation:
      "疑問詞（どうして）＋「〜か」：どうして怒っているか。再確認一次規則：有疑問詞→か、沒有→かどうか——「どうして〜かどうか」是錯的。「ので」「のに」是理由/逆接，接不出間接疑問。※怒る＝生氣。"
  },
  {
    id: "pattern-n4-kansetsu-006",
    patternId: "n4-kansetsu",
    promptText: "その話が本当___どうか、分かりません。",
    hintZh: "懷疑那個消息的真假。",
    promptContextZh: "「不知道那件事是真是假。」",
    expectedAnswer: "か",
    options: ["か", "な", "だ", "の"],
    explanation:
      "名詞、な形容詞接「かどうか」直接裸接、だ要去掉：本当かどうか。「な」「だ」「の」填進去是「本当などうか」「本当だどうか」「本当のどうか」——全都缺了か、不成句。標準形＝名詞直接＋かどうか（口語另有「〜だか」的說法，N4 先記裸接）。※本当＝真的。"
  },
  {
    id: "pattern-n4-kansetsu-007",
    patternId: "n4-kansetsu",
    promptText: "何時に来る___、教えてください。",
    hintZh: "請對方留下到達時間。",
    promptContextZh: "「請告訴我你幾點到。」",
    expectedAnswer: "か",
    options: ["か", "ますか", "より", "なか"],
    explanation:
      "間接疑問的內部用普通形＋か：何時に来るか教えてください。「来るますか」接續不成句——敬體一般不進間接疑問，禮貌放在句尾的教えてください就夠了；「より」「なか」都接不出間接疑問。※何時＝幾點。"
  },
  {
    id: "pattern-n4-kansetsu-008",
    patternId: "n4-kansetsu",
    promptText: "行くか行かない___、早く決めてください。",
    hintZh: "催人下決心。",
    promptContextZh: "「要去不去，快點決定。」",
    expectedAnswer: "か",
    options: ["か", "を", "で", "まで"],
    explanation:
      "「〜か〜ないか」是かどうか的展開形：行くか行かないか＝去或不去。第二個か一樣不能換成「を」「で」「まで」——兩邊都要か才成對。"
  }
];

// ===========================================================================
// N4 pattern: n4-fukugou -- compound verbs and stem-derivation (#552).
//   ていく/てくる appear ONLY in physical-direction items (departing
//   speaker → いく, returning speaker → くる, double-locked by scene +
//   attachment); the temporal-drift use is taught in the chapter text but
//   never tested -- future-tense drift readings make both live. だす never
//   competes where はじめる is the answer (both inchoatives are real);
//   transitivity mixups (はじまる/つづく) are the designed foils.
// ===========================================================================
const N4_FUKUGOU_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n4-fukugou-001",
    patternId: "n4-fukugou",
    promptText: "（出かける人に）寒いから、上着を持って___ほうがいいですよ。",
    hintZh: "叮嚀要出門的人多帶一件。",
    promptContextZh: "（對要出門的人）「很冷，帶件外套去比較好喔。」",
    expectedAnswer: "いった",
    options: ["いった", "きた", "いって", "きて"],
    explanation:
      "說話者在這裡、對方要離開→「持っていく」＝帶去：持っていったほうがいい。「持ってきた」方向相反（帶來這裡）；「いって」「きて」是て形，接不上ほうがいい（要用た形）。※上着＝外套。"
  },
  {
    id: "pattern-n4-fukugou-002",
    patternId: "n4-fukugou",
    promptText: "ここで待っていてください。パンを買って___よ。すぐ戻ります。",
    hintZh: "叫對方在原地等，自己去一下。",
    promptContextZh: "「你在這裡等一下。我去買個麵包（回來），馬上回來。」",
    expectedAnswer: "くる",
    options: ["くる", "いく", "きた", "いった"],
    explanation:
      "去了會回到說話的地方→「買ってくる」＝去買（回來）：叫對方「在這裡等」＋「すぐ戻ります」都鎖定說話者會回來。「買っていく」是買了帶去別處，跟回到原地矛盾；「きた」「いった」是過去式，跟還沒出門矛盾。※戻る＝返回。"
  },
  {
    id: "pattern-n4-fukugou-003",
    patternId: "n4-fukugou",
    promptText: "急に雨が降り___。",
    hintZh: "天氣毫無預警變了臉。",
    promptContextZh: "「突然下起雨來了。」",
    expectedAnswer: "だしました",
    options: ["だしました", "おわりました", "つづけました", "なおしました"],
    explanation:
      "突發、無預警的開始用「ます形語幹＋だす」：降りだしました＝下起來了——跟「急に」是黃金搭配。「おわりました」是結束、「つづけました」是繼續，都跟突然開始矛盾；「なおしました」是重做一次（書きなおす型），雨不會重下。"
  },
  {
    id: "pattern-n4-fukugou-004",
    patternId: "n4-fukugou",
    promptText: "去年から日本語を習い___。",
    hintZh: "說學日語的起點。",
    promptContextZh: "「從去年開始學日語。」",
    expectedAnswer: "はじめました",
    options: ["はじめました", "はじまりました", "おわりました", "つづきました"],
    explanation:
      "開始做某事用「ます形語幹＋はじめる」：習いはじめました。「はじまりました」是自動詞（会議がはじまる）——自己學日語要用他動詞はじめる；「つづきました」同樣是自動詞（つづける才是他動）；「おわりました」跟「從去年開始」矛盾。※習う＝學習。"
  },
  {
    id: "pattern-n4-fukugou-005",
    patternId: "n4-fukugou",
    promptText: "彼は3時間ずっと走り___います。",
    hintZh: "馬拉松途中，描述選手的狀態。",
    promptContextZh: "「他持續跑了三個小時。」",
    expectedAnswer: "つづけて",
    options: ["つづけて", "おわって", "はじめて", "だして"],
    explanation:
      "持續做用「ます形語幹＋つづける」：走りつづけています——「3時間ずっと」鎖定持續。「おわって」是跑完了、「はじめて」「だして」是才剛開始，都跟持續三小時矛盾。※走る＝跑。"
  },
  {
    id: "pattern-n4-fukugou-006",
    patternId: "n4-fukugou",
    promptText: "もう晩ご飯を食べ___か。",
    hintZh: "問對方吃飯的進度。",
    promptContextZh: "「晚餐吃完了嗎？」",
    expectedAnswer: "おわりました",
    options: ["おわりました", "はじまりました", "つづきました", "だされました"],
    explanation:
      "做完用「ます形語幹＋おわる」：食べおわりましたか＝吃完了嗎（配もう）。「はじまりました」「つづきました」是自動詞、接不上他動的食べ；「だされました」是被動、不成話。※晩ご飯＝晚餐。"
  },
  {
    id: "pattern-n4-fukugou-007",
    patternId: "n4-fukugou",
    promptText: "すみません、この漢字の読み___を教えてください。",
    hintZh: "拿著生字請教別人。",
    promptContextZh: "「不好意思，請教我這個漢字的唸法。」",
    expectedAnswer: "方",
    options: ["方", "側", "型", "者"],
    explanation:
      "「〜的方法」＝ます形語幹＋方（かた）：読み方＝唸法、使い方＝用法、作り方＝做法。「側（がわ）」是側邊、「型（かた）」是模型型號、「者（しゃ）」是人——同音異字全對不上。"
  },
  {
    id: "pattern-n4-fukugou-008",
    patternId: "n4-fukugou",
    promptText: "この山の高___は3776メートルです。",
    hintZh: "報出富士山的數據。",
    promptContextZh: "「這座山的高度是3776公尺。」",
    expectedAnswer: "さ",
    options: ["さ", "こと", "の", "もの"],
    explanation:
      "い形容詞去い＋さ＝名詞化：高い→高さ（高度）、長い→長さ、重い→重さ。「高こと」「高の」「高もの」都接不上——こと、の要接完整的形（高いこと）。※山＝山、メートル＝公尺。"
  }
];

// ===========================================================================
// N4 pattern: n4-henka -- change and transformation (#552).
//   ことにしている never appears where ようにしている is the answer (both
//   are real habits) -- the ようにする item uses junk foils; ないようになる
//   is real, so the negative-change item's foils are pure junk too; ままで
//   is real and stays out of the まま items.
// ===========================================================================
const N4_HENKA_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n4-henka-001",
    patternId: "n4-henka",
    promptText: "毎日練習して、泳げる___なりました。",
    hintZh: "苦練的成果。",
    promptContextZh: "「每天練習，（終於）變得會游泳了。」",
    expectedAnswer: "ように",
    options: ["ように", "ことに", "ようを", "ままに"],
    explanation:
      "能力的變化用「可能動詞＋ようになる」：泳げるようになりました＝變得會游了。填「ことに」會變成「ことになる」＝被安排/被決定——苦練學會是自然的能力變化、不是被安排，語意不合；「ようを」「ままに」接不上「なる」——只有「ように」能構成能力的變化。"
  },
  {
    id: "pattern-n4-henka-002",
    patternId: "n4-henka",
    promptText: "健康のために、毎日野菜を食べる___しています。",
    hintZh: "為健康維持的努力。",
    promptContextZh: "「為了健康，我盡量每天吃蔬菜。」",
    expectedAnswer: "ように",
    options: ["ように", "よう", "ようも", "ようが"],
    explanation:
      "「盡量做到〜」＝「〜ようにする」：食べるようにしています。「よう」「ようも」「ようが」都接不上している。順帶分工：ことにしている＝下定決心的自我規定、ようにしている＝朝目標努力（不保證每次做到）。※野菜＝蔬菜。"
  },
  {
    id: "pattern-n4-henka-003",
    patternId: "n4-henka",
    promptText: "最近、朝早く起きる___なりました。",
    hintZh: "生活節奏的轉變。",
    promptContextZh: "「最近變得會早起了。」",
    expectedAnswer: "ように",
    options: ["ように", "ままに", "そうに", "ものに"],
    explanation:
      "習慣的變化也用「〜ようになる」：起きるようになりました＝（以前不會）現在會早起了。「そうに」的『差點〜』（そうになる）要接ます形語幹（起きそうになる），辭書形 起きる 接不出這個意思；「ままに」「ものに」接不出變化。"
  },
  {
    id: "pattern-n4-henka-004",
    patternId: "n4-henka",
    promptText: "暗いですね。部屋を明る___しましょう。",
    hintZh: "動手改變房間的亮度。",
    promptContextZh: "「好暗喔，把房間弄亮一點吧。」",
    expectedAnswer: "く",
    options: ["く", "に", "いに", "さ"],
    explanation:
      "把東西「弄成〜」：い形容詞去い＋く＋する——明るくする。「に」是な形容詞用的（静かにする）；「いに」「さ」都接不上する。對照N5：自己變＝くなる、動手改＝くする。※部屋＝房間、明るい＝明亮。"
  },
  {
    id: "pattern-n4-henka-005",
    patternId: "n4-henka",
    promptText: "赤ちゃんが寝ていますから、静か___してください。",
    hintZh: "家有嬰兒的請求。",
    promptContextZh: "「嬰兒在睡覺，請安靜一點。」",
    expectedAnswer: "に",
    options: ["に", "く", "で", "へ"],
    explanation:
      "な形容詞的「弄成〜」＝＋に＋する：静かにする。「く」是い形容詞用的（明るくする）；「で」「へ」接不上する。跟004成對：明るく／静かに，各自的變化標記。※赤ちゃん＝嬰兒。"
  },
  {
    id: "pattern-n4-henka-006",
    patternId: "n4-henka",
    promptText: "エアコンをつけた___、寝てしまいました。",
    hintZh: "說自己不小心就睡著了。",
    promptContextZh: "「開著空調就睡著了。」",
    expectedAnswer: "まま",
    options: ["まま", "ふり", "つもり", "むき"],
    explanation:
      "「保持原樣〜」＝た形＋まま：つけたまま寝てしまった＝開著就睡了。「ふり」是假裝（つけたふりをして… 可以成句）、「つもり」是打算（〜つもりで…）——但都要再接をして/で，且語意不是「保持開著」，直接接逗號都不成句；「むき」是朝向，接不上。※エアコン＝空調。"
  },
  {
    id: "pattern-n4-henka-007",
    patternId: "n4-henka",
    promptText: "電気を消さない___、出かけてしまいました。",
    hintZh: "出門後才想起燈的事。",
    promptContextZh: "「沒關燈就出門了。」",
    expectedAnswer: "まま",
    options: ["まま", "なり", "きり", "ほど"],
    explanation:
      "否定形也能接まま：消さないまま＝沒關的狀態下。「なり」「きり」是更高級的接續（行ったきり型），接ない形在這裡不成句；「ほど」是程度，語意接不上。※電気＝電燈、消す＝關（燈）。"
  },
  {
    id: "pattern-n4-henka-008",
    patternId: "n4-henka",
    promptText: "最近、彼は学校に___なりました。",
    hintZh: "說他最近都沒出現在學校。",
    promptContextZh: "「最近他變得不來學校了。」",
    expectedAnswer: "来なく",
    options: ["来なく", "来ないく", "来なさく", "来ずく"],
    explanation:
      "否定的變化＝ない形去い＋く＋なる：来ない→来なくなりました＝變得不來了。「来ないく」沒去い；「来なさく」「来ずく」都不是存在的形——ない的變化跟い形容詞同一套（去い＋く）。"
  }
];

// ===========================================================================
// N4 pattern: n4-jikan -- time II: 間/間に・までに/まで・おきに・中 (#553).
//   間 vs 間に is locked by predicate continuity: 間 takes a durative
//   predicate (ずっと〜), 間に a punctual event -- so the two never share
//   an item's answerhood; the continuity is anchored in the prompt.
//   までに vs まで is locked the same way (deadline event vs durative
//   action). ごとに (a real near-synonym of おきに) never appears as a foil.
// ===========================================================================
const N4_JIKAN_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n4-jikan-001",
    patternId: "n4-jikan",
    promptText: "夏休みの___、ずっと家にいました。",
    hintZh: "說整個暑假的狀態。",
    promptContextZh: "「暑假期間，我一直待在家。」",
    expectedAnswer: "間",
    options: ["間", "間に", "までに", "ころに"],
    explanation:
      "整段期間、後面配持續動作（ずっといました）用「〜間（あいだ）」：夏休みの間。「間に」是「期間內的某一點」，要配一次性的事（間に電話が来た）、跟「ずっと」矛盾；「までに」是期限、「ころに」是大約某時，都接不上。※夏休み＝暑假。"
  },
  {
    id: "pattern-n4-jikan-002",
    patternId: "n4-jikan",
    promptText: "私が寝ている___、電話が来ました。",
    hintZh: "睡覺當中發生的事。",
    promptContextZh: "「我在睡覺的時候，來了電話。」",
    expectedAnswer: "間に",
    options: ["間に", "ながら", "までに", "おきに"],
    explanation:
      "在一整段時間「裡的某一點」發生一次性的事用「〜間に」：寝ている間に電話が来た。「ながら」要接ます形語幹（寝ながら）、接不上「寝ている」；「までに」是期限（配一次動作、如寝るまでに）、「おきに」是固定間隔，都接不出這個意思。"
  },
  {
    id: "pattern-n4-jikan-003",
    patternId: "n4-jikan",
    promptText: "レポートは金曜日___出してください。",
    hintZh: "說報告什麼時候要交。",
    promptContextZh: "「報告請在星期五之前交。」",
    expectedAnswer: "までに",
    options: ["までに", "まで", "間に", "から"],
    explanation:
      "「期限之前（完成一次性動作）」用「〜までに」：金曜日までに出す。「まで」是「持續到〜為止」，配的是持續動作（金曜日まで待つ）、跟一次性的「出す」不合；「間に」「から」接不上這個期限。※レポート＝報告。"
  },
  {
    id: "pattern-n4-jikan-004",
    patternId: "n4-jikan",
    promptText: "先生が来る___、ここで待ちましょう。",
    hintZh: "說在原地等到老師出現。",
    promptContextZh: "「等到老師來為止，我們在這裡等吧。」",
    expectedAnswer: "まで",
    options: ["まで", "までに", "間に", "ほど"],
    explanation:
      "「一直〜到某時為止」的持續動作（待つ）用「まで」：来るまで待つ。「までに」是期限、配一次性動作（来るまでに準備する）、跟持續的「待つ」不合；「間に」「ほど」接不上。"
  },
  {
    id: "pattern-n4-jikan-005",
    patternId: "n4-jikan",
    promptText: "この薬は6時間___飲んでください。",
    hintZh: "說這個藥多久吃一次。",
    promptContextZh: "「這個藥請每隔六小時吃一次。」",
    expectedAnswer: "おきに",
    options: ["おきに", "までに", "あいだに", "ずつ"],
    explanation:
      "固定的時間間隔用「〜おきに」：6時間おきに＝每隔六小時。「までに」是期限、「あいだに」是期間內某點、「ずつ」是「每份的量」（一つずつ），都不是「間隔」的意思。※薬＝藥。"
  },
  {
    id: "pattern-n4-jikan-006",
    patternId: "n4-jikan",
    promptText: "今、電話___ですから、あとでかけます。",
    hintZh: "現在正在講電話。",
    promptContextZh: "「現在正在通話中，稍後再打。」",
    expectedAnswer: "中",
    options: ["中", "間", "まで", "ごろ"],
    explanation:
      "「正在〜當中」用「名詞＋中（ちゅう）」：電話中＝通話中，工事中、使用中同理。「間」是期間、「まで」是到〜為止、「ごろ」是大約，都接不出「正在進行」的意思。"
  },
  {
    id: "pattern-n4-jikan-007",
    patternId: "n4-jikan",
    promptText: "暗くなる___、家に帰りましょう。",
    hintZh: "趁天黑前回家。",
    promptContextZh: "「趁天黑之前回家吧。」",
    expectedAnswer: "までに",
    options: ["までに", "まで", "間に", "ほど"],
    explanation:
      "「在〜之前（完成回家這個一次性動作）」用「までに」：暗くなるまでに帰る＝趁天黑前回到家。「まで」會變成「一直到天黑（都待在外面）」、方向相反；「間に」要接可持續的區間（寝ている間に…），但「暗くなる」是瞬間變化、接不上；「ほど」接不上。"
  },
  {
    id: "pattern-n4-jikan-008",
    patternId: "n4-jikan",
    promptText: "3年の___、大阪に住んでいました。",
    hintZh: "說住大阪的那三年。",
    promptContextZh: "「有三年的時間，我住在大阪。」",
    expectedAnswer: "間",
    options: ["間", "間に", "までに", "ずつ"],
    explanation:
      "整段期間、配持續狀態（住んでいた）用「〜間」：3年の間。「間に」要配一次性的事（3年の間に一度引っ越した）；「までに」是期限、「ずつ」是每份，都接不上。"
  }
];

// ===========================================================================
// N4 pattern: n4-juju -- giving/receiving nouns + keigo tiers + requests
//   (#553). Direction is locked by an explicit subject + recipient: くれる/
//   くださる need giver-as-subject toward the speaker's side, あげる/さし
//   あげる the speaker's side giving out, もらう/いただく the receiver as
//   subject. Plain もらう never competes where いただく is the answer (both
//   real -- the 先生に anchor forces the humble tier, and もらう stays out
//   of that item's options). The polite-request item locks by direction:
//   the three giving-forms all read as "shall I ~ for you", clashing with
//   the apologetic すみません request opener.
// ===========================================================================
const N4_JUJU_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n4-juju-001",
    patternId: "n4-juju",
    promptText: "友だちが私にプレゼントを___。",
    hintZh: "朋友送了我東西。",
    promptContextZh: "「朋友送了我一份禮物。」",
    expectedAnswer: "くれました",
    options: ["くれました", "あげました", "もらいました", "とどきました"],
    explanation:
      "「別人給『我』」用「くれる」：友だちが私にくれた。「あげる」是我給別人（給我方要用くれる）、方向相反；「もらう」的主語要是收禮的人（私は友だちにもらった）、但這句主語是友だちが；「とどく（送達）」是自動詞，「プレゼントを届く」不成句（要說プレゼントが届く）。"
  },
  {
    id: "pattern-n4-juju-002",
    patternId: "n4-juju",
    promptText: "私は友だちからペンを___。",
    hintZh: "從朋友那裡拿到筆。",
    promptContextZh: "「我從朋友那裡得到一支筆。」",
    expectedAnswer: "もらいました",
    options: ["もらいました", "くれました", "あげました", "なりました"],
    explanation:
      "「我從別人那裡得到」用「もらう」，來源可用に或から：友だちからもらった。「くれる」的主語要是給的人（友だちが私にくれた）、不能配「私は」；「あげる」是我給、而且「から」不能接あげる（給的對象要用に），方向與接續都不對；「なる」語意不對。"
  },
  {
    id: "pattern-n4-juju-003",
    patternId: "n4-juju",
    promptText: "父は山田さんに花を___。",
    hintZh: "說爸爸送花給外人。",
    promptContextZh: "「爸爸送花給山田先生。」",
    expectedAnswer: "あげました",
    options: ["あげました", "くれました", "もらいました", "なりました"],
    explanation:
      "自家人（父）給外人（山田さん）用「あげる」：父は山田さんにあげた。「くれる」要收方是我方、但山田さん是外人、我方（父）是給的一邊；「もらう」主語要是收方、這裡主語是給方的父；「なる」語意不對。"
  },
  {
    id: "pattern-n4-juju-004",
    patternId: "n4-juju",
    promptText: "私は先生にお土産を___。",
    hintZh: "說自己送伴手禮給老師。",
    promptContextZh: "「我送了伴手禮給老師。」",
    expectedAnswer: "さしあげました",
    options: ["さしあげました", "くださいました", "やりました", "いたしました"],
    explanation:
      "「我恭敬地給長輩」用「あげる」的自謙語「さしあげる」：先生にさしあげた。「くださる」是長輩給我、主語要是先生（先生が私に），方向相反；「やる」是給晚輩/動植物，對老師失禮；「いたす」是「する」的自謙語、接不上「お土産を」。※お土産＝伴手禮。"
  },
  {
    id: "pattern-n4-juju-005",
    patternId: "n4-juju",
    promptText: "先生が私に辞書を___。",
    hintZh: "說老師給了我一本字典。",
    promptContextZh: "「老師給了我一本字典。」",
    expectedAnswer: "くださいました",
    options: ["くださいました", "さしあげました", "いただきました", "やりました"],
    explanation:
      "「長輩給『我』」用「くれる」的尊敬語「くださる」：先生が私にくださった。「さしあげる」是我給長輩、方向相反；「いただく」是我收下（主語會是我）；「やる」對象是晚輩，用在老師身上失禮。※辞書＝字典。"
  },
  {
    id: "pattern-n4-juju-006",
    patternId: "n4-juju",
    promptText: "私は先生からプレゼントを___。",
    hintZh: "說自己從老師那裡收到禮物。",
    promptContextZh: "「我從老師那裡收到了禮物。」",
    expectedAnswer: "いただきました",
    options: ["いただきました", "くださいました", "さしあげました", "なさいました"],
    explanation:
      "「我恭敬地從長輩那裡收下」用「もらう」的自謙語「いただく」，來源用から/に：先生からいただいた。「くださる」的主語要是老師（先生が私に）、配「私は」不對；「さしあげる」是我給出去、而且「から」不能接さしあげる（給的對象用に），方向與接續都不對；「なさる」是「する」的尊敬語、語意不對。"
  },
  {
    id: "pattern-n4-juju-007",
    patternId: "n4-juju",
    promptText: "すみません、ちょっと手伝って___か。",
    hintZh: "客氣地拜託對方幫忙。",
    promptContextZh: "「不好意思，可以請你幫我一下嗎？」",
    expectedAnswer: "いただけません",
    options: ["いただけません", "さしあげません", "あげません", "やりません"],
    explanation:
      "鄭重地請對方為我做＝「〜ていただけませんか」＝能不能請您〜（用もらう的自謙可能形）：手伝っていただけませんか。本句是「すみません、（請你）幫我」的請託——「さしあげる」「あげる」「やる」是「（我）為對方做」的方向，跟拜託對方的語境不合。"
  },
  {
    id: "pattern-n4-juju-008",
    patternId: "n4-juju",
    promptText: "祖母は私にお金を___。",
    hintZh: "奶奶給了我錢。",
    promptContextZh: "「奶奶給了我錢。」",
    expectedAnswer: "くれました",
    options: ["くれました", "あげました", "もらいました", "いただきました"],
    explanation:
      "家人（祖母）給「我」，一般用「くれる」：祖母が私にくれた。「あげる」是我給、方向相反；「もらう」「いただく」的主語都要是收下的人（私は祖母に）、但這句主語是祖母が＝給的一邊，所以不能用。※祖母＝祖母、奶奶。"
  }
];

// ===========================================================================
// N4 pattern: n4-chikaku -- perception + limiting (#553).
//   見える/聞こえる (spontaneous) vs 見られる/聞ける (potential) is locked
//   by the frame: spontaneous items describe what reaches the senses
//   unbidden (窓から〜が), potential items carry an opportunity condition
//   (予約すれば〜). しか and ほど pair with an explicit negative predicate;
//   だけ (takes affirmatives) never shares answerhood with しか.
// ===========================================================================
const N4_CHIKAKU_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n4-chikaku-001",
    patternId: "n4-chikaku",
    promptText: "この部屋の窓から海が___。",
    hintZh: "說從這個房間的窗戶看得到什麼。",
    promptContextZh: "「從這個房間的窗戶看得到海。」",
    expectedAnswer: "見えます",
    options: ["見えます", "見ます", "見せます", "見つかります"],
    explanation:
      "風景自然映入眼簾（不靠意志）用「見える」：海が見えます。「見る」是主動看（要用を：海を見る）；「見せる」是給人看；「見つかる」是被找到，都不是自然映入的意思。（「見える」和表『有機會能看』的可能形「見られる」的分別，在下一個機會題會練到。）※海＝海。"
  },
  {
    id: "pattern-n4-chikaku-002",
    patternId: "n4-chikaku",
    promptText: "となりの部屋から変な音が___。",
    hintZh: "說隔壁房間傳來的聲響。",
    promptContextZh: "「從隔壁房間傳來奇怪的聲音。」",
    expectedAnswer: "聞こえます",
    options: ["聞こえます", "聞けます", "聞きます", "聞かせます"],
    explanation:
      "聲音自然傳入耳朵用「聞こえる」：変な音が聞こえます。「聞ける」是「能聽到（有機會、如コンサートが聞ける）」——但奇怪的雜音不是特地去聽的對象；「聞く」是主動聽；「聞かせる」是講給人聽，都不是自然入耳。※変な音＝奇怪的聲音。"
  },
  {
    id: "pattern-n4-chikaku-003",
    patternId: "n4-chikaku",
    promptText: "予約すれば、工場の中が___。",
    hintZh: "說預約之後可以做什麼。",
    promptContextZh: "「只要預約，就可以參觀工廠內部。」",
    expectedAnswer: "見られます",
    options: ["見られます", "見えます", "見ます", "見せます"],
    explanation:
      "「（有條件、有機會）能看到」用可能形「見られる」：予約すれば見られる＝預約就能參觀。本句「予約すれば」表示是「預約後取得的參觀機會」，強調機會，所以用可能形見られる（而不是自然映入眼簾的見える）。「見る」「見せる」接不上。※予約＝預約、工場＝工廠。"
  },
  {
    id: "pattern-n4-chikaku-004",
    patternId: "n4-chikaku",
    promptText: "台所からいい匂い___します。",
    hintZh: "說廚房飄來香味。",
    promptContextZh: "「廚房飄來很香的味道。」",
    expectedAnswer: "が",
    options: ["が", "を", "に", "で"],
    explanation:
      "感覺（味道、聲音、感覺）的知覺用「〜がする」：匂いがする＝聞到味道。這是固定搭配，「を」「に」「で」都不成句。同類：音がする、味がする、感じがする。※台所＝廚房、匂い＝味道・氣味。"
  },
  {
    id: "pattern-n4-chikaku-005",
    patternId: "n4-chikaku",
    promptText: "明日は雨が降る___がします。",
    hintZh: "說自己有種預感。",
    promptContextZh: "「我有種明天會下雨的感覺。」",
    expectedAnswer: "気",
    options: ["気", "の", "こと", "もの"],
    explanation:
      "「總覺得〜、有種〜的感覺」用「〜気がする」：降る気がする。「の」「こと」「もの」都接不出這個慣用的「預感、感覺」的意思——気がする 是固定說法。"
  },
  {
    id: "pattern-n4-chikaku-006",
    patternId: "n4-chikaku",
    promptText: "今日は昨日___寒くないです。",
    hintZh: "拿今天跟昨天比，今天沒那麼冷。",
    promptContextZh: "「今天沒有昨天那麼冷。」",
    expectedAnswer: "ほど",
    options: ["ほど", "まで", "と", "に"],
    explanation:
      "「沒有〜那麼〜」＝比較句型「Bほど〜ない」：昨日ほど寒くない＝沒有昨天那麼冷。這個比較句型後面固定接否定。「まで」「と」「に」都接不出這個『不及』的比較（と要配同じ/違う、昨日 也不接に）。"
  },
  {
    id: "pattern-n4-chikaku-007",
    patternId: "n4-chikaku",
    promptText: "財布に100円___ありません。",
    hintZh: "說錢包裡只剩一點點。",
    promptContextZh: "「錢包裡只有一百日圓。」",
    expectedAnswer: "しか",
    options: ["しか", "だけ", "ばかり", "まで"],
    explanation:
      "「只有〜」配否定用「〜しか〜ない」：100円しかありません＝只有一百日圓。「だけ」也是「只」，但配肯定表『只有』（100円だけあります）；「100円だけありません」文法雖成立、意思卻變成『只有一百日圓沒有（其他都有）』——要表達『只有一百日圓』得用しか。「ばかり」是淨是、「まで」是到〜為止，都接不上。※財布＝錢包。"
  },
  {
    id: "pattern-n4-chikaku-008",
    patternId: "n4-chikaku",
    promptText: "みんなに一つ___配ってください。",
    hintZh: "說每人分到的份量。",
    promptContextZh: "「請每人發一個。」",
    expectedAnswer: "ずつ",
    options: ["ずつ", "しか", "まで", "ごろ"],
    explanation:
      "「每（人/次）〜份」的平均分配用「〜ずつ」：一つずつ＝一人一個。「しか」要配否定（一つしか配らない）、放在肯定的請託句不成立；「まで」是到〜為止、「ごろ」是大約某時，都不是「平均分配」的意思。※配る＝分發。"
  }
];

// ===========================================================================
// Lesson-0 pattern A: starter-desu -- the AはBです sentence family (#534).
//   Absolute-beginner floor: kana-only sentences built from the starter
//   vocabulary deck. Unique solutions are locked by IN-SENTENCE anchors
//   (はい/いいえ for polarity, きのう/あした/いま for tense, はじめまして
//   for self-introduction) plus option control -- only ONE option ever
//   satisfies the anchors.
// ===========================================================================
const STARTER_DESU_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-starter-desu-001",
    patternId: "starter-desu",
    promptText: "「がくせいですか。」「はい、わたしは いま がくせい___。」",
    hintZh: "回答關於自己身分的問題。",
    promptContextZh: "「你是學生嗎？」「是的，我現在是學生。」",
    expectedAnswer: "です",
    options: ["です", "でした", "じゃありません", "ですか"],
    explanation:
      "對方用肯定形問「がくせいですか」，回答「はい」＝同意「是學生」，所以接現在肯定的「です」；「じゃありません」和「はい」矛盾。「いま」表示現在，排除過去的「でした」（像昨天那樣已經過去的事）。※がくせい＝學生。"
  },
  {
    id: "pattern-starter-desu-002",
    patternId: "starter-desu",
    promptText: "「せんせいですか。」「いいえ、わたしは せんせい___。」",
    hintZh: "更正對方對自己身分的誤會。",
    promptContextZh: "「你是老師嗎？」「不，我不是老師。」",
    expectedAnswer: "じゃありません",
    options: ["じゃありません", "です", "じゃありませんでした", "ですか"],
    explanation:
      "對方用肯定形問「せんせいですか」，回答「いいえ」＝否定「是老師」→ 現在否定「じゃありません」。「です」和「いいえ」矛盾；「じゃありませんでした」是過去否定，但問句問的是現在；「ですか」用來發問。"
  },
  {
    id: "pattern-starter-desu-003",
    patternId: "starter-desu",
    promptText: "きのうは あめ___。",
    hintZh: "說昨天的天氣。",
    promptContextZh: "「昨天下雨（昨天是雨天）。」",
    expectedAnswer: "でした",
    options: ["でした", "です", "ですか", "じゃありません"],
    explanation:
      "「きのう（昨天）」是過去的事，名詞句的過去肯定用「でした」。「です」是現在；「じゃありません」是現在否定；「ですか」是問句。※あめ＝雨。"
  },
  {
    id: "pattern-starter-desu-004",
    patternId: "starter-desu",
    promptText: "「きのうは あめでしたか。」「いいえ、あめ___。」",
    hintZh: "更正對方對昨天天氣的印象。",
    promptContextZh: "「昨天下雨了嗎？」「不，昨天沒有下雨。」",
    expectedAnswer: "じゃありませんでした",
    options: ["じゃありませんでした", "でした", "です", "じゃありません"],
    explanation:
      "對方用肯定形問「あめでしたか」，回答「いいえ」＝否定它＋「きのう」是過去 → 過去否定「じゃありませんでした」。「でした」跟「いいえ」矛盾；「じゃありません」是現在否定，跟過去的問句對不上。"
  },
  {
    id: "pattern-starter-desu-005",
    patternId: "starter-desu",
    promptText: "「あのう、あれは いぬ___。」「はい、そうです。」",
    hintZh: "指著遠處的動物，向對方確認。",
    promptContextZh: "「請問……那是狗嗎？」「對，是的。」",
    expectedAnswer: "ですか",
    options: ["ですか", "です", "でした", "じゃありません"],
    explanation:
      "對方回答了「はい、そうです」——會得到回答的，一定是問句，所以句尾用「ですか」。若用「です」就是告訴對方，後面不會接「はい」的回答。"
  },
  {
    id: "pattern-starter-desu-006",
    patternId: "starter-desu",
    promptText: "あしたは やすみ___。",
    hintZh: "說明天的安排。",
    promptContextZh: "「明天放假（明天是休息日）。」",
    expectedAnswer: "です",
    options: ["です", "でした", "じゃありませんでした", "でしたか"],
    explanation:
      "「あした（明天）」還沒發生，日文的名詞句用現在形「です」就能表達未來。「でした」「じゃありませんでした」「でしたか」都帶過去，跟「あした」矛盾。※やすみ＝休假。"
  },
  {
    id: "pattern-starter-desu-007",
    patternId: "starter-desu",
    promptText: "はじめまして。わたしの なまえは たなか___。",
    hintZh: "第一次見面的開場白。",
    promptContextZh: "「初次見面，我的名字是田中。」",
    expectedAnswer: "です",
    options: ["です", "ですか", "じゃありません", "じゃありませんでした"],
    explanation:
      "「はじめまして」是初次見面的招呼，接著介紹自己的名字＝現在肯定「です」。介紹自己不會用否定或問句結尾。"
  },
  {
    id: "pattern-starter-desu-008",
    patternId: "starter-desu",
    promptText: "これは わたしの かばん___。わたしのは あれです。",
    hintZh: "說明哪一個包包才是自己的。",
    promptContextZh: "「這不是我的包包，我的是那個。」",
    expectedAnswer: "じゃありません",
    options: ["じゃありません", "です", "でした", "ですか"],
    explanation:
      "第二句說「我的是那個（あれ）」，所以第一句一定在否定「這個是我的」→「じゃありません」。若第一句用「です」，兩句就互相矛盾了。"
  }
];

// ===========================================================================
// Lesson-0 pattern B: starter-particles -- は・を・に・が (+で/と) (#534).
//   Same floor as starter-desu. The double-solution traps here are the
//   particle system itself: へ/に for direction and は/が for subjects are
//   NEVER offered head-to-head unless the sentence makes one impossible
//   (e.g. an interrogative subject だれ can't take は).
// ===========================================================================
const STARTER_PARTICLES_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-starter-particles-001",
    patternId: "starter-particles",
    promptText: "わたし___ まいにち みずを のみます。",
    hintZh: "描述自己每天的習慣。",
    promptContextZh: "「我每天喝水。」",
    expectedAnswer: "は",
    options: ["は", "を", "に", "で"],
    explanation:
      "「わたし」是這句話的主題（談論的對象），用「は」標記。「を」接動作的對象（這句已經有みずを）；「に」表時間點或目的地；「で」表動作發生的場所。"
  },
  {
    id: "pattern-starter-particles-002",
    patternId: "starter-particles",
    promptText: "あさ、みず___ のみます。",
    hintZh: "說早上做的一件事。",
    promptContextZh: "「早上喝水。」",
    expectedAnswer: "を",
    options: ["を", "に", "へ", "が"],
    explanation:
      "「みず」是「のみます（喝）」的對象，動作的對象用「を」。「が」標記做動作的主語，水不是喝東西的一方；「に」表時間點或方向、「へ」只表方向——都接不上「喝」的對象。"
  },
  {
    id: "pattern-starter-particles-003",
    patternId: "starter-particles",
    promptText: "あした、がっこう___ いきます。",
    hintZh: "說明天要去的地方。",
    promptContextZh: "「明天去學校。」",
    expectedAnswer: "に",
    options: ["に", "を", "で", "と"],
    explanation:
      "「いきます（去）」的目的地用「に」。「を」是動作對象；「で」是動作發生的場所（在～做某事），不是要去的方向；「と」是「和某人一起」。※方向也可以用「へ」，這題選項中用「に」。"
  },
  {
    id: "pattern-starter-particles-004",
    patternId: "starter-particles",
    promptText: "だれ___ きますか。",
    hintZh: "問會來的人是哪一位。",
    promptContextZh: "「誰要來？」",
    expectedAnswer: "が",
    options: ["が", "を", "に", "で"],
    explanation:
      "疑問詞（だれ、なに）當主語時用「が」——順帶記住：這裡不能用「は」，因為「は」前面必須是雙方已知的話題，而「誰」正是未知才要問的。「を」接動作對象、「に」表時間或方向、「で」表動作場所，都放不進主語的位置。"
  },
  {
    id: "pattern-starter-particles-005",
    patternId: "starter-particles",
    promptText: "そこに いぬ___ います。",
    hintZh: "告訴對方你發現了什麼。",
    promptContextZh: "「那裡有一隻狗。」",
    expectedAnswer: "が",
    options: ["が", "を", "へ", "で"],
    explanation:
      "用「います／あります」說「有什麼東西存在」時，第一次提到的東西用「が」。「を」接動作對象，但「います」不是動作；「へ」表方向；「いぬで います」則不成句——「〜でいます」只接「元気でいます」這種狀態說法。"
  },
  {
    id: "pattern-starter-particles-006",
    patternId: "starter-particles",
    promptText: "よる、ほん___ よみます。",
    hintZh: "說晚上的活動。",
    promptContextZh: "「晚上讀書（看書）。」",
    expectedAnswer: "を",
    options: ["を", "が", "に", "へ"],
    explanation:
      "「ほん」是「よみます（閱讀）」的對象 →「を」。「が」標記主語（做動作的人），書不是做動作的一方；「に」表時間點或方向、「へ」只表方向，接不上「讀」的對象。"
  },
  {
    id: "pattern-starter-particles-007",
    patternId: "starter-particles",
    promptText: "あした、わたしは ともだち___ はなします。",
    hintZh: "說自己明天的計畫。",
    promptContextZh: "「明天我和朋友說話（聊天）。」",
    expectedAnswer: "と",
    options: ["と", "を", "が", "へ"],
    explanation:
      "「はなします」的交談對象用「と」——聊天是互相進行的。主語已經是「わたしは」，所以「が」放不進去；「を」不能標交談的對象，它標「說出的內容」（如：にほんごを はなします）；「へ」表方向。※「ともだちに はなします」也說得通，但語感是單方向「對朋友說」，這題選項中用「と」。"
  },
  {
    id: "pattern-starter-particles-008",
    patternId: "starter-particles",
    promptText: "いえ___ ごはんを たべます。",
    hintZh: "說吃飯的地點。",
    promptContextZh: "「在家吃飯。」",
    expectedAnswer: "で",
    options: ["で", "に", "を", "へ"],
    explanation:
      "「做動作的場所」用「で」——在家「吃」是一個動作。「に」表存在的場所或目的地（いえに います、いえに かえります），配動作動詞的場所要用「で」。這是に／で最重要的分工。"
  }
];

// ===========================================================================
// Pattern 1: te-kudasai -- request / permission / prohibition family
//   Correct answers cluster around てください / てもいい / てはいけない.
//   Items mix all three so the learner has to read context.
// ===========================================================================
const TE_KUDASAI_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-te-kudasai-001",
    patternId: "te-kudasai",
    promptText: "上司から：「来週までに資料を ___ 。」",
    hintZh: "上司對下屬指示工作期限。",
    promptContextZh: "上司對下屬：「下週前把資料交出來。」",
    expectedAnswer: "提出してください",
    options: [
      "提出してください",
      "提出してもいいです",
      "提出してはいけません",
      "提出しなくてもいいです"
    ],
    explanation:
      "上司給下屬的工作指示，是請求 → 「てください」。「てもいい」是徵求／給予許可；「てはいけない」是禁止；「なくてもいい」是不必。"
  },
  {
    id: "pattern-te-kudasai-002",
    patternId: "te-kudasai",
    promptText: "学生から先生に：「すみません、辞書を ___ か？」",
    hintZh: "學生向老師詢問可否動用某物。",
    promptContextZh: "學生問老師：「不好意思，可以用辭典嗎？」",
    expectedAnswer: "使ってもいいです",
    options: [
      "使ってもいいです",
      "使ってください",
      "使ってはいけません",
      "使わなくてもいいです"
    ],
    explanation:
      "尋求許可，配「か」變成疑問 → 「てもいい+か」。「てください」是請對方做、「てはいけません」是禁止、「なくてもいい」是不必。"
  },
  {
    id: "pattern-te-kudasai-003",
    patternId: "te-kudasai",
    promptText: "図書館の貼り紙：「館内で食べ物を ___ 。」",
    hintZh: "圖書館關於館內飲食的告示。",
    promptContextZh: "圖書館告示：「館內請勿飲食。」",
    expectedAnswer: "食べてはいけません",
    options: [
      "食べてはいけません",
      "食べてもいいです",
      "食べてください",
      "食べなくてもいいです"
    ],
    explanation:
      "公共場合的禁止規定 → 「てはいけません」。「てもいい」是允許；「てください」是請對方做；「なくてもいい」是不必。"
  },
  {
    id: "pattern-te-kudasai-004",
    patternId: "te-kudasai",
    promptText: "電車の中で友達に：「もう少し小さい声で ___ ね。」",
    hintZh: "電車內就音量大小對朋友說話。",
    promptContextZh: "電車內提醒朋友：「請小聲一點喔。」",
    expectedAnswer: "話してください",
    options: [
      "話してください",
      "話してもいいです",
      "話してはいけません",
      "話さなくてもいいです"
    ],
    explanation:
      "朋友間的禮貌請求 → 「てください」（配「ね」緩和語氣）。「てはいけません」對朋友太重；「てもいい」「なくてもいい」與請求語氣不符。"
  },
  {
    id: "pattern-te-kudasai-005",
    patternId: "te-kudasai",
    promptText: "病院で：「お酒は ___ か？」",
    hintZh: "病人就飲酒一事詢問醫生。",
    promptContextZh: "病人問醫生：「可以喝酒嗎？」",
    expectedAnswer: "飲んでもいいです",
    options: [
      "飲んでもいいです",
      "飲んでください",
      "飲んではいけません",
      "飲まなくてもいいです"
    ],
    explanation:
      "病人問醫生「可以」喝酒嗎，是徵求許可 → 「てもいいですか」。「てください」是醫生要病人喝；「てはいけません」是醫生禁止；「なくてもいい」是醫生說可不必喝。"
  },
  {
    id: "pattern-te-kudasai-006",
    patternId: "te-kudasai",
    promptText: "駐車場の看板：「ここに車を ___ 。」",
    hintZh: "停車場的告示牌內容。",
    promptContextZh: "停車場標誌：「禁止停車。」",
    expectedAnswer: "止めてはいけません",
    options: [
      "止めてはいけません",
      "止めてもいいです",
      "止めてください",
      "止めなくてもいいです"
    ],
    explanation:
      "明確的禁止標示 → 「てはいけません」。其他選項分別是允許停（てもいい）、請停（てください）、不必停（なくてもいい）。"
  },
  {
    id: "pattern-te-kudasai-007",
    patternId: "te-kudasai",
    promptText: "店員から客に：「お手数ですが、こちらに名前を ___ 。」",
    hintZh: "店員引導顧客在表單上填寫姓名。",
    promptContextZh: "店員對顧客：「麻煩您在這裡寫名字。」",
    expectedAnswer: "書いてください",
    options: [
      "書いてください",
      "書いてもいいです",
      "書いてはいけません",
      "書かなくてもいいです"
    ],
    explanation:
      "店員客氣請求顧客寫名字 → 「てください」（配「お手数ですが」更禮貌）。其他選項都不符合「請對方做」的語氣。"
  },
  {
    id: "pattern-te-kudasai-008",
    patternId: "te-kudasai",
    promptText: "母から子に：「危ないから、火に ___ 。」",
    hintZh: "母親對小孩關於火的安全話。",
    promptContextZh: "母親對小孩：「危險，不准碰火。」",
    expectedAnswer: "触ってはいけません",
    options: [
      "触ってはいけません",
      "触ってもいいです",
      "触ってください",
      "触らなくてもいいです"
    ],
    explanation:
      "保護孩子的安全警告 → 強烈禁止「てはいけません」。其他選項分別是允許、請求、不必。"
  }
];

// ===========================================================================
// Pattern 2: nakute-mo-ii -- "no need to" vs "must" vs "must not"
//   Tests when the situation calls for permission to skip an action,
//   versus an obligation that can't be skipped.
// ===========================================================================
const NAKUTE_MO_II_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-nakute-mo-ii-001",
    patternId: "nakute-mo-ii",
    promptText: "もう熱が下がったから、明日は薬を ___ 。",
    hintZh: "退燒後的服藥判斷。",
    promptContextZh: "燒已經退了，明天可以不必吃藥了。",
    expectedAnswer: "飲まなくてもいい",
    options: [
      "飲まなくてもいい",
      "飲まなければならない",
      "飲んではいけない",
      "飲んでもいい"
    ],
    explanation:
      "前因「熱が下がった」(已退燒)，後句表「不必再吃」→ 「なくてもいい」。「なければならない」是「必須」（情境相反）；「てはいけない」是「不可」（醫療上不對）；「てもいい」是「可以喝」（語意太弱）。"
  },
  {
    id: "pattern-nakute-mo-ii-002",
    patternId: "nakute-mo-ii",
    promptText: "明日は試験があるから、今日は早く ___ 。",
    hintZh: "考試前夜的就寢安排。",
    promptContextZh: "明天有考試，今天必須早睡。",
    expectedAnswer: "寝なければならない",
    options: [
      "寝なければならない",
      "寝なくてもいい",
      "寝てはいけない",
      "寝てもいい"
    ],
    explanation:
      "前句「試験がある」是強烈動機 → 「必須早睡」用「なければならない」。「なくてもいい」是不必；「てはいけない」是禁止；「てもいい」語感太弱。"
  },
  {
    id: "pattern-nakute-mo-ii-003",
    patternId: "nakute-mo-ii",
    promptText: "土日はオフィスに ___ 。",
    hintZh: "週末是否進公司。",
    promptContextZh: "週末不必到辦公室上班。",
    expectedAnswer: "来なくてもいいです",
    options: [
      "来なくてもいいです",
      "来なければなりません",
      "来てはいけません",
      "来てください"
    ],
    explanation:
      "「土日」表休假日，自然語意是「不必來」→ 「なくてもいい」。「なければならない」是必須；「てはいけない」是禁止來；「てください」是請求來。"
  },
  {
    id: "pattern-nakute-mo-ii-004",
    patternId: "nakute-mo-ii",
    promptText: "免許を持っていれば、車を ___ 。",
    hintZh: "駕照與開車的關係。",
    promptContextZh: "有駕照的話，就可以開車。",
    expectedAnswer: "運転してもいい",
    options: [
      "運転してもいい",
      "運転しなくてもいい",
      "運転しなければならない",
      "運転してはいけない"
    ],
    explanation:
      "「免許を持っていれば」是條件，後句表「在此條件下就獲得許可」→ 「てもいい」。「なくてもいい」是「不必開」；「なければならない」是「必須開」；「てはいけない」是「不可開」（與前句矛盾）。"
  },
  {
    id: "pattern-nakute-mo-ii-005",
    patternId: "nakute-mo-ii",
    promptText: "病気の時は、無理して仕事に ___ 。",
    hintZh: "生病時對上班的建議。",
    promptContextZh: "生病的時候不必勉強來上班。",
    expectedAnswer: "来なくてもいいです",
    options: [
      "来なくてもいいです",
      "来なければなりません",
      "来てはいけません",
      "来てもいいです"
    ],
    explanation:
      "「無理して」帶有負面色彩，後句語意是「不必勉強」→ 「なくてもいい」。「なければならない」是「必須來」（反向）；「てはいけない」是「不可來」；「てもいい」是「可以來」。"
  },
  {
    id: "pattern-nakute-mo-ii-006",
    patternId: "nakute-mo-ii",
    promptText: "図書館では本を借りる時、お金を ___ 。",
    hintZh: "圖書館借書的費用。",
    promptContextZh: "在圖書館借書時不必付錢。",
    expectedAnswer: "払わなくてもいい",
    options: [
      "払わなくてもいい",
      "払わなければならない",
      "払ってはいけない",
      "払ってもいい"
    ],
    explanation:
      "圖書館借書通常免費 → 「不必付」用「なくてもいい」。「なければならない」是「必須付」；「てはいけない」是「不可付」（沒道理）；「てもいい」是「可以付」（語意弱）。"
  },
  {
    id: "pattern-nakute-mo-ii-007",
    patternId: "nakute-mo-ii",
    promptText: "授業が始まる前に、必ず教科書を ___ 。",
    hintZh: "上課前的書本準備。",
    promptContextZh: "上課前一定要準備好教科書。",
    expectedAnswer: "準備しなければならない",
    options: [
      "準備しなければならない",
      "準備しなくてもいい",
      "準備してはいけない",
      "準備してもいい"
    ],
    explanation:
      "「必ず」(一定要) 直接指出強烈義務 → 「なければならない」。其他選項與「必ず」的強制感不合。"
  },
  {
    id: "pattern-nakute-mo-ii-008",
    patternId: "nakute-mo-ii",
    promptText: "このパーティーはカジュアルだから、ドレスコードは特になく、スーツを ___ 。",
    hintZh: "輕鬆派對的服裝判斷。",
    promptContextZh: "派對是輕鬆場合，沒有特別的服裝要求，不必穿西裝。",
    expectedAnswer: "着なくてもいい",
    options: [
      "着なくてもいい",
      "着なければならない",
      "着てはいけない",
      "着るしかない"
    ],
    explanation:
      "「ドレスコードは特になく」(沒有特別服裝要求) 是強烈的「不必」信號 → 「なくてもいい」。「なければならない」「着るしかない」是「必須／只能穿」（與前句衝突）；「てはいけない」是「不可穿」（過度禁止）。"
  }
];

// ===========================================================================
// Pattern 3: te-morau -- giving/receiving favours (授受表現)
//   The crux is "whose perspective": あげる (I → other), くれる (other → me),
//   もらう (I ask someone to do).
//   Distractors include いただく / くださる (humble / honorific) so register
//   discrimination is also exercised.
// ===========================================================================
const TE_MORAU_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-te-morau-001",
    patternId: "te-morau",
    promptText: "妹は宿題が分からなかったので、私は妹に教えて ___ 。",
    hintZh: "妹妹有學業困難時與我之間的互動。",
    promptContextZh: "妹妹不會作業，我教了她。",
    expectedAnswer: "あげた",
    options: ["あげた", "くれた", "もらった", "いただいた"],
    explanation:
      "「我」對下位的妹妹做 → 「てあげる」。「てくれる」是別人為我做；「てもらう」是我請別人做；「ていただく」是「てもらう」的謙讓。"
  },
  {
    id: "pattern-te-morau-002",
    patternId: "te-morau",
    promptText: "重い荷物だったから、友達が空港まで運んで ___ 。",
    hintZh: "重行李與機場接送時和朋友的互動。",
    promptContextZh: "因為行李太重，朋友幫我搬到機場。",
    expectedAnswer: "くれた",
    options: ["くれた", "あげた", "もらった", "差し上げた"],
    explanation:
      "別人（朋友）為我做 → 「てくれる」。「てあげる」是我為別人做；「てもらう」需要「に」標記做事者；「差し上げる」是「あげる」的謙讓語，用於我方對上位者做（朋友是平輩，不適用）。"
  },
  {
    id: "pattern-te-morau-003",
    patternId: "te-morau",
    promptText: "先生は私の作文を丁寧に直して ___ 。",
    hintZh: "老師處理我作文的方式。",
    promptContextZh: "老師仔細地幫我改了作文。",
    expectedAnswer: "くださった",
    options: ["くださった", "あげた", "もらった", "差し上げた"],
    explanation:
      "上位（老師）為「我」做 → 「てくださる」（「てくれる」的尊敬）。「てあげる」是我為別人做；「てもらう」需 我に老師 結構；「差し上げる」是我對上位做。"
  },
  {
    id: "pattern-te-morau-004",
    patternId: "te-morau",
    promptText: "兄に頼んで、東京駅まで送って ___ 。",
    hintZh: "我與兄長之間關於送站的安排。",
    promptContextZh: "我請哥哥送我到東京車站。",
    expectedAnswer: "もらった",
    options: ["もらった", "くれた", "あげた", "くださった"],
    explanation:
      "「兄に頼んで」表示「我主動請」→ 「てもらう」。「てくれる」是別人主動；「てあげる」是我對別人做；「てくださる」是上位主動。"
  },
  {
    id: "pattern-te-morau-005",
    patternId: "te-morau",
    promptText: "道に迷っている子供がいたので、駅まで案内して ___ 。",
    hintZh: "為迷路的小孩帶路到車站。",
    promptContextZh: "有個小孩在路上迷路了，我帶他到車站。",
    expectedAnswer: "あげた",
    options: ["あげた", "くれた", "もらった", "差し上げた"],
    explanation:
      "「我」對晚輩（小孩）做善行 → 「てあげる」。「てくれる」是別人為我（×方向相反）；「てもらう」是我請別人做（×）；「差し上げる」是「あげる」的謙讓語（我方對上位者做事時用），對一般小孩不自然（×）。唯「あげた」自然。"
  },
  {
    id: "pattern-te-morau-006",
    patternId: "te-morau",
    promptText: "母が毎朝、お弁当を作って ___ 。",
    hintZh: "母親每天為家人準備便當。",
    promptContextZh: "媽媽每天早上幫我做便當。",
    expectedAnswer: "くれる",
    options: ["くれる", "あげる", "もらう", "くださる"],
    explanation:
      "家人（母）為「我」做 → 「てくれる」（家人不用敬語）。「てあげる」是我為別人做；「てもらう」是主動請別人；「てくださる」對自家人過於敬重。"
  },
  {
    id: "pattern-te-morau-007",
    patternId: "te-morau",
    promptText: "課長に、来週の会議の資料を見て ___ つもりです。",
    hintZh: "下週會議資料與課長的安排。",
    promptContextZh: "我打算請課長看一下下週的會議資料。",
    expectedAnswer: "いただく",
    options: ["いただく", "もらう", "くださる", "くれる"],
    explanation:
      "上位（課長）為「我」做、且我主動請求 → 「ていただく」（「てもらう」的謙讓語）。「てもらう」對上位欠禮；「てくださる」是上位主動為我做、不配「に」；「てくれる」對上位太隨意。"
  },
  {
    id: "pattern-te-morau-008",
    patternId: "te-morau",
    promptText: "子供たちに本を読んで ___ のは、毎晩の楽しみだ。",
    hintZh: "每晚與孩子們的閱讀時光。",
    promptContextZh: "每晚為孩子們讀書是我的樂趣。",
    expectedAnswer: "あげる",
    options: ["あげる", "くれる", "もらう", "差し上げる"],
    explanation:
      "「我」對下位的孩子做 → 「てあげる」。「てくれる」是別人為我做；「てもらう」是請別人做；「差し上げる」對上位用，對孩子過度。"
  }
];

// ===========================================================================
// Pattern 4: to-omou -- indirect quote / opinion / direct quote
//   The hard distinctions: と vs って, plain vs polite form inside the
//   quote, presence/absence of だ after na-adj/noun.
// ===========================================================================
const TO_OMOU_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-to-omou-001",
    patternId: "to-omou",
    promptText: "彼は明日試験がある ___ 言った。",
    hintZh: "他關於明天考試的話。",
    promptContextZh: "他說明天有考試。",
    expectedAnswer: "と",
    options: ["と", "が", "に", "で"],
    explanation:
      "間接引用內容後接「と言う」的「と」是引用助詞。「が」標記主語；「に」標記方向或對象；「で」標記方法或場所。四個都是助詞，但只有「と」能標記引用內容（口語可改說「って」）。"
  },
  {
    id: "pattern-to-omou-002",
    patternId: "to-omou",
    promptText: "明日は雨が ___ と思います。",
    hintZh: "對明天天氣的猜測。",
    promptContextZh: "我覺得明天會下雨。",
    expectedAnswer: "降る",
    options: ["降る", "降ります", "降りだ", "降って"],
    explanation:
      "間接引用 / 意見前接「普通形」→ 「降る」。「降ります」是ます形（×和「と思う」混用）；「降りだ」不存在；「降って」是 て形（不能接「と思う」）。"
  },
  {
    id: "pattern-to-omou-003",
    patternId: "to-omou",
    promptText: "彼は明日北海道に ___ と思っているらしい。",
    hintZh: "他對於去北海道一事的打算。",
    promptContextZh: "聽說他打算明天去北海道。",
    expectedAnswer: "行く",
    options: ["行く", "行きます", "行った", "行って"],
    explanation:
      "「と思う」前接普通形 → 「行く」(普通形・非過去肯定)。「行きます」是ます形（×間接引用 / と思う）；「行った」是過去式（與「明日」未來感衝突）；「行って」是 て形（不能直接接と）。"
  },
  {
    id: "pattern-to-omou-004",
    patternId: "to-omou",
    promptText: "この問題はとても ___ と思う。",
    hintZh: "對這個問題難度的判斷。",
    promptContextZh: "我覺得這個問題很難。",
    expectedAnswer: "難しい",
    options: ["難しい", "難しいだ", "難しく", "難しくて"],
    explanation:
      "意見句中的「と思う」前接 い形容詞 → 直接接「難しい」（い形容詞本身就是普通形）。「難しいだ」是錯（い形不加だ）；「難しく」「難しくて」是其他變化形。"
  },
  {
    id: "pattern-to-omou-005",
    patternId: "to-omou",
    promptText: "妹は新しい服を ___ と言った。",
    hintZh: "妹妹關於新衣服的話。",
    promptContextZh: "妹妹說想要新衣服。",
    expectedAnswer: "買いたい",
    options: ["買いたい", "買いたいです", "買いたいだ", "買って"],
    explanation:
      "間接引用「妹妹的願望」→ 接普通形「買いたい」(たい 本身就是い形容詞)。「買いたいです」是 ですます體（與と言った 混用較少見）；「買いたいだ」不存在；「買って」是 て形。"
  },
  {
    id: "pattern-to-omou-006",
    patternId: "to-omou",
    promptText: "兄は今、駅前にいる ___ 言ってた。",
    hintZh: "哥哥剛才提到的所在位置。",
    promptContextZh: "哥哥剛才說他現在在車站前。",
    expectedAnswer: "って",
    options: ["って", "は", "が", "で"],
    explanation:
      "「って」是「と」的口語簡縮，與「言ってた」(言っていた 的口語) 搭配自然。「は」是話題助詞、「が」是主語助詞、「で」是方法／場所助詞，皆不能標記引用內容。"
  },
  {
    id: "pattern-to-omou-007",
    patternId: "to-omou",
    promptText: "あの店は ___ と思う。",
    hintZh: "對那家店氛圍的看法。",
    promptContextZh: "我覺得那家店很安靜。",
    expectedAnswer: "静かだ",
    options: ["静かだ", "静か", "静かで", "静かに"],
    explanation:
      "な形容詞做普通形句尾需加「だ」→ 「静かだ」。「静か」少了だ（×）；「静かで」是 て形（不能直接接と思う）；「静かに」是修飾形（要接動詞）。"
  },
  {
    id: "pattern-to-omou-008",
    patternId: "to-omou",
    promptText: "私はあの人がきっと ___ と思う。",
    hintZh: "關於那個人身分的推測。",
    promptContextZh: "我覺得那個人一定是學生。",
    expectedAnswer: "学生だ",
    options: ["学生だ", "学生な", "学生で", "学生の"],
    explanation:
      "名詞用普通形結尾接「と思う」需要加「だ」→ 「学生だ」。「学生な」是な形容詞的連體形（名詞沒有な-form，無效）；「学生で」是 て形（不能直接接と）；「学生の」是所有格（接名詞，不能直接接と思う）。"
  }
];

// ===========================================================================
// Pattern 5: mae-ato -- ordering of two actions (まえに / あとで / てから).
//   The scene fixes the time order; distractors are the same verb in the
//   other forms, which become temporally impossible (e.g. "after leaving"
//   can't lock the home door).
// ===========================================================================
const MAE_ATO_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-mae-ato-001",
    patternId: "mae-ato",
    promptText: "会社へ ___ 、家のかぎをかけました。",
    hintZh: "早上要出門上班，人還站在玄關，準備踏出家門。",
    promptContextZh: "去公司之前，鎖上了家裡的門。",
    expectedAnswer: "行くまえに",
    options: ["行くまえに", "行ってから", "行ったあとで", "行ったとき"],
    explanation:
      "鎖自家門一定發生在離開家以前，「Vるまえに」表示在某動作發生『以前』先做另一件事。「行ってから」「行ったあとで」「行ったとき」都表示人已離開或到了公司，無法再鎖自家門、時間矛盾。"
  },
  {
    id: "pattern-mae-ato-002",
    patternId: "mae-ato",
    promptText: "手を ___ 、ケーキを食べてください。",
    hintZh: "小朋友剛從外面玩回來，手有點髒，桌上放著要吃的蛋糕。",
    promptContextZh: "把手洗乾淨後再吃蛋糕。",
    expectedAnswer: "あらってから",
    options: ["あらってから", "あらうまえに", "あらうとき", "あらいながら"],
    explanation:
      "句意是把手洗好、緊接著去吃，「Vてから」表示前項做完『再』接著做後項。「あらうまえに」是手還沒洗就先吃、不衛生；「あらうとき」「あらいながら」變成一邊洗手一邊吃、不合理。"
  },
  {
    id: "pattern-mae-ato-003",
    patternId: "mae-ato",
    promptText: "電車に ___ 、ホームでパンを買いました。",
    hintZh: "在車站月台上，列車還沒進站，肚子有點餓所以走到小賣店。",
    promptContextZh: "上電車之前，在月台上買了麵包。",
    expectedAnswer: "乗るまえに",
    options: ["乗るまえに", "乗ってから", "乗ったあとで", "乗ったとき"],
    explanation:
      "在月台買麵包一定發生在上車以前，「Vるまえに」表示在動作發生前先做某事。「乗ってから」「乗ったあとで」「乗ったとき」都表示人已在車上，無法回月台買、時間矛盾。"
  },
  {
    id: "pattern-mae-ato-004",
    patternId: "mae-ato",
    promptText: "ごはんを ___ 、すぐ歯をみがきましょう。",
    hintZh: "一家人剛吃完晚餐，碗盤還在桌上，媽媽提醒孩子下一件該做的事。",
    promptContextZh: "吃完飯後，馬上去刷牙吧。",
    expectedAnswer: "食べたあとで",
    options: ["食べたあとで", "食べるまえに", "食べるとき", "食べながら"],
    explanation:
      "刷牙是用餐『完成後』做的事，「Vたあとで」表示某動作做完後再做別的，配合「すぐ（馬上）」。「食べるまえに」是用餐前刷牙、時間相反；「食べるとき」「食べながら」變成一邊吃一邊刷、不合理。"
  }
];

// ===========================================================================
// Pattern 6: nagara-tari -- linking actions (ながら同時 / たり列舉 / て順接 /
//   し加理由). The context decides which link fits; the distractors are the
//   other three links, which give a different (wrong) meaning here.
// ===========================================================================
const NAGARA_TARI_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-nagara-tari-001",
    patternId: "nagara-tari",
    promptText: "最近は天気が ___ 、寒かったりして、体によくない。",
    hintZh: "最近天氣很不穩定，一下子熱、一下子冷，身體有點吃不消。",
    promptContextZh: "最近天氣一下子熱、一下子冷，對身體不好。",
    expectedAnswer: "暑かったり",
    options: ["暑かったり", "暑くて", "暑いし", "暑いと"],
    explanation:
      "後句「寒かったりして」已用「たり」，前後成對舉出『忽冷忽熱』兩種交替狀態，用「Aたり、Bたり」。「暑くて」是接續、「暑いし」是加理由、「暑いと」是條件，都無法與後面的「たり」配對表交替。"
  },
  {
    id: "pattern-nagara-tari-002",
    patternId: "nagara-tari",
    promptText: "朝起きて、顔を ___ 、それから会社へ行きます。",
    hintZh: "敘述早上起床後到出門上班之間，依時間先後完成的固定流程。",
    promptContextZh: "早上起床，洗了臉，然後再去公司。",
    expectedAnswer: "洗って",
    options: ["洗って", "洗いながら", "洗ったり", "洗うし"],
    explanation:
      "句中「それから」標示『先洗臉、再出門』的時間順序，動作接續用「て」。「洗いながら」是同時做、「洗ったり」是舉例、「洗うし」是補理由，都不表先後。"
  },
  {
    id: "pattern-nagara-tari-003",
    patternId: "nagara-tari",
    promptText: "この店は安い ___ 、料理もおいしいから、よく来ます。",
    hintZh: "說明一家店令人常常光顧，背後不只一個原因的情況。",
    promptContextZh: "這家店又便宜，菜也好吃，所以我常來。",
    expectedAnswer: "し",
    options: ["し", "ながら", "たり", "て"],
    explanation:
      "句尾「〜から、よく来ます」在堆疊「便宜」「好吃」兩個原因，用「し」。「ながら」「たり」「て」都不是在加列原因；且「安い」是形容詞，後三者也接不上。"
  },
  {
    id: "pattern-nagara-tari-004",
    patternId: "nagara-tari",
    promptText: "弟は歩き ___ スマホを見るので、よく人にぶつかります。",
    hintZh: "描述弟弟走路時眼睛沒離開手機螢幕，因此常出狀況。",
    promptContextZh: "弟弟走著路就看手機，所以常常撞到人。",
    expectedAnswer: "ながら",
    options: ["ながら", "たり", "て", "し"],
    explanation:
      "「走路」與「看手機」由同一人同時並行進行，用「ながら」（接ます形語幹「歩き」）。「たり」是舉例、「て」會變成先走完再看、「し」是補理由，都不符。"
  },
  {
    id: "pattern-nagara-tari-005",
    patternId: "nagara-tari",
    promptText: "デパートでくつを買って、ごはんを ___ 帰りました。",
    hintZh: "敘述在百貨公司辦完幾件事後才返家的一連串行程。",
    promptContextZh: "在百貨公司買了鞋，吃了飯，然後就回家了。",
    expectedAnswer: "食べて",
    options: ["食べて", "食べたり", "食べながら", "食べるし"],
    explanation:
      "前面「買って」已用接續形，整句是「買鞋→吃飯→回家」的時間順序，用「て」。「食べたり」是舉例、「食べながら」是同時、「食べるし」是補理由，都接不上這條時間線。"
  },
  {
    id: "pattern-nagara-tari-006",
    patternId: "nagara-tari",
    promptText: "今日は天気もいい ___ 、宿題も終わったから、公園で遊びましょう。",
    hintZh: "提議去公園玩之前，先擺出好幾項對自己有利的條件。",
    promptContextZh: "今天天氣又好，作業也做完了，所以去公園玩吧。",
    expectedAnswer: "し",
    options: ["し", "ながら", "たり", "で"],
    explanation:
      "句中「〜から、遊びましょう」前接「天氣好」「作業做完」兩個有利原因，用「し」。「ながら」是同時、「たり」是舉例、「で」是中止接續，都不是在加列原因；且「いい」是形容詞，後三者也接不上。"
  }
];

// ===========================================================================
// Pattern 7: te-aux -- て + auxiliary verb (てみる試 / ている狀態 / てしまう
//   完了・遺憾). The scene's nuance picks the auxiliary; distractors are the
//   other auxiliaries on the same verb.
// ===========================================================================
const TE_AUX_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-te-aux-001",
    patternId: "te-aux",
    promptText: "この店、おいしそうだから、今度入っ___。",
    hintZh: "走在街上發現一家從沒去過的餐廳，外觀很不錯，於是對朋友提議下次來這裡。",
    promptContextZh: "這家店看起來很好吃，下次進去吃吃看吧。",
    expectedAnswer: "てみよう",
    options: ["てみよう", "ておこう", "てしまおう", "ている"],
    explanation:
      "對沒去過的店、配合「今度」提出『嘗試一下』的語氣，用表嘗試的「〜てみる」的意向形「てみよう」。「ておこう」是為將來預做準備、「てしまおう」是把某事做完或帶懊悔、「ている」是持續狀態，皆不合。"
  },
  {
    id: "pattern-te-aux-002",
    patternId: "te-aux",
    promptText: "兄は今、となりの部屋でテレビを見___。",
    hintZh: "家人問哥哥人在哪裡，回答的人指向隔壁房間，描述哥哥此刻的動作。",
    promptContextZh: "哥哥現在在隔壁房間看電視。",
    expectedAnswer: "ている",
    options: ["ている", "てみる", "ておく", "てしまう"],
    explanation:
      "「今」加上描述某人此刻持續進行的動作，用表進行的「〜ている」。「てみる」是嘗試、「ておく」是事先準備、「てしまう」是完成或懊悔，都不能表當下持續。"
  },
  {
    id: "pattern-te-aux-003",
    patternId: "te-aux",
    promptText: "あ、ケーキを全部一人で食べ___。ごめん。",
    hintZh: "原本說好要留給家人的蛋糕，自己一回神才發現整個都吃光了，趕緊向對方道歉。",
    promptContextZh: "啊，我一個人把蛋糕全部吃光了，對不起。",
    expectedAnswer: "てしまった",
    options: ["てしまった", "てみた", "ておいた", "ていた"],
    explanation:
      "把該留的蛋糕全吃光並道歉，是非本意、後悔的『完了』，用「〜てしまう」，與「ごめん」相呼應。「てみた」是嘗試、「ておいた」是事先準備、「ていた」是當時狀態，都無法傳達懊悔。"
  },
  {
    id: "pattern-te-aux-004",
    patternId: "te-aux",
    promptText: "この道は、駅までずっと続い___。",
    hintZh: "向問路的人說明眼前這條路的走向，這條路一路通到車站，沿途不會中斷。",
    promptContextZh: "這條路一直延伸到車站。",
    expectedAnswer: "ている",
    options: ["ている", "てみる", "ておく", "てしまう"],
    explanation:
      "配合「ずっと」描述道路目前一路延續到車站的『既成狀態』，用表狀態的「〜ている」。「てみる」是嘗試、「ておく」是事先準備、「てしまう」是完成或懊悔，都無法描述這種延伸狀態。"
  }
];

export const sentencePatternItems: SentencePatternItem[] = [
  ...STARTER_DESU_ITEMS,
  ...STARTER_PARTICLES_ITEMS,
  ...N5_SONZAI_ITEMS,
  ...N5_ICHI_ITEMS,
  ...N5_JOSHI2_ITEMS,
  ...N5_JOSHI3_ITEMS,
  ...N5_HIKAKU_ITEMS,
  ...N5_SUKI_DEKIRU_ITEMS,
  ...N5_SASOI_ITEMS,
  ...N5_ONEGAI_ITEMS,
  ...N5_RIYUU_ITEMS,
  ...N5_TOKI_ITEMS,
  ...N5_KEIYOUSHI_ITEMS,
  ...N5_JOSUUSHI_ITEMS,
  ...N5_TEIDO_ITEMS,
  ...N4_NDESU_ITEMS,
  ...N4_SUIRYOU_ITEMS,
  ...N4_ISHI_ITEMS,
  ...N4_MEIREI_ITEMS,
  ...N4_SHUSHOKU_ITEMS,
  ...N4_KANSETSU_ITEMS,
  ...N4_FUKUGOU_ITEMS,
  ...N4_HENKA_ITEMS,
  ...N4_JIKAN_ITEMS,
  ...N4_JUJU_ITEMS,
  ...N4_CHIKAKU_ITEMS,
  ...TE_KUDASAI_ITEMS,
  ...NAKUTE_MO_II_ITEMS,
  ...TE_MORAU_ITEMS,
  ...TO_OMOU_ITEMS,
  ...MAE_ATO_ITEMS,
  ...NAGARA_TARI_ITEMS,
  ...TE_AUX_ITEMS
];

export type SentencePatternPoolOptions = {
  /**
   * If set, only items with one of these patternIds are returned. If
   * unset, returns the full pool (all four patterns mixed). Designed
   * to share its shape with the upcoming exam-mode id-filter (PR C) so
   * the challenge-page filter state can be the same type.
   */
  patternIds?: SentencePatternId[];
};

export function buildSentencePatternPool(
  options: SentencePatternPoolOptions = {}
): PracticeQuestion[] {
  const { patternIds } = options;
  const filtered = patternIds && patternIds.length > 0
    ? sentencePatternItems.filter((item) => patternIds.includes(item.patternId))
    : sentencePatternItems;
  return filtered.map(toPracticeQuestion);
}

function toPracticeQuestion(item: SentencePatternItem): PracticeQuestion {
  const vocabulary: VocabularyItem = {
    id: item.id,
    surface: item.patternId,
    reading: item.patternId,
    meaningZh: PATTERN_LABEL_ZH[item.patternId],
    partOfSpeech: "noun",
    group: null,
    lesson: null,
    tags: ["sentence_pattern", item.patternId],
    examples: [
      {
        japanese: item.promptText.replace("___", item.expectedAnswer),
        meaningZh: item.promptContextZh,
        // Same source as promptContextZh, so it shares that overlay -- keeps
        // the post-answer example line in the UI language (#400).
        meaningI18n: sentencePatternI18n[item.id]?.promptContextI18n
      }
    ],
    level: "N5"
  };
  const overlay = sentencePatternI18n[item.id];
  return {
    id: item.id,
    vocabulary,
    targetForm: "reading",
    expectedAnswers: [item.expectedAnswer],
    explanation: item.explanation,
    explanationI18n: overlay?.explanationI18n,
    promptLabel: `句型練習：${PATTERN_LABEL_ZH[item.patternId]}`,
    promptText: item.promptText,
    promptContextZh: item.promptContextZh,
    promptContextI18n: overlay?.promptContextI18n,
    hintZh: item.hintZh,
    hintI18n: overlay?.hintI18n,
    instructionZh: "依語境選最自然的句型。",
    instructionI18n: patternInstructionI18n,
    options: item.options
  };
}
