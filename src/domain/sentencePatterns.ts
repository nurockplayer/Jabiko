import type { PracticeQuestion, VocabularyItem } from "./types";

export type SentencePatternId =
  | "te-kudasai"
  | "nakute-mo-ii"
  | "te-morau"
  | "to-omou";

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
  "te-kudasai": "請求 / 許可 / 禁止",
  "nakute-mo-ii": "不必 / 必須",
  "te-morau": "授受視角",
  "to-omou": "引用 / 意見"
};

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
    promptText: "免許を持っている人だけが、車を ___ 。",
    hintZh: "駕照與開車的關係。",
    promptContextZh: "只有有駕照的人才可以開車。",
    expectedAnswer: "運転してもいい",
    options: [
      "運転してもいい",
      "運転しなくてもいい",
      "運転しなければならない",
      "運転してはいけない"
    ],
    explanation:
      "「免許を持っている人だけ」鎖定條件，後句表「才獲得許可」→ 「てもいい」。「なくてもいい」是「不必開」；「なければならない」是「必須開」；「てはいけない」是「不可開」（與前句矛盾）。"
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

export const sentencePatternItems: SentencePatternItem[] = [
  ...TE_KUDASAI_ITEMS,
  ...NAKUTE_MO_II_ITEMS,
  ...TE_MORAU_ITEMS,
  ...TO_OMOU_ITEMS
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
        meaningZh: item.promptContextZh
      }
    ],
    level: "N5"
  };
  return {
    id: item.id,
    vocabulary,
    targetForm: "reading",
    expectedAnswers: [item.expectedAnswer],
    explanation: item.explanation,
    promptLabel: `句型練習：${PATTERN_LABEL_ZH[item.patternId]}`,
    promptText: item.promptText,
    promptContextZh: item.promptContextZh,
    hintZh: item.hintZh,
    instructionZh: "依語境選最自然的句型。",
    options: item.options
  };
}
