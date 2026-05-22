import type { JlptLevel, PracticeQuestion, TargetForm, VocabularyItem } from "./types";

type ExamQuestionInput = {
  id: string;
  level: Extract<JlptLevel, "N1" | "N2">;
  surface: string;
  reading: string;
  meaningZh: string;
  targetForm?: TargetForm;
  promptLabel: string;
  instructionZh: string;
  promptText: string;
  promptContextZh: string;
  expectedAnswer: string;
  options: string[];
  explanation: string;
};

export const examStyleQuestions: PracticeQuestion[] = [
  examQuestion({
    id: "n2-grammar-nitomonatte",
    level: "N2",
    surface: "に伴って",
    reading: "にともなって",
    meaningZh: "隨著、伴隨",
    promptLabel: "N2 文法形式選擇",
    instructionZh: "句中填空：選最符合前後關係的文法。",
    promptText: "産業の発展 ___、地域の雇用環境も大きく変化した。",
    promptContextZh: "隨著產業發展，地方的就業環境也大幅改變。",
    expectedAnswer: "に伴って",
    options: ["に伴って", "によると", "に限って", "に対して"],
    explanation: "「Aに伴ってB」表示 B 隨著 A 的變化一起發生。這裡是產業發展帶動雇用環境變化。"
  }),
  examQuestion({
    id: "n2-grammar-naikotoniwa",
    level: "N2",
    surface: "ないことには",
    reading: "ないことには",
    meaningZh: "若不...就無法...",
    promptLabel: "N2 文法形式選擇",
    instructionZh: "句中填空：注意後句的「判斷できない」。",
    promptText: "実際に現場を見てみ ___、原因は判断できない。",
    promptContextZh: "沒有實際看現場，就無法判斷原因。",
    expectedAnswer: "ないことには",
    options: ["ないことには", "ないものなら", "ないどころか", "ない限りでは"],
    explanation: "「Vないことには、...ない」表示前項若不成立，後項就無法成立。後句的「できない」是線索。"
  }),
  examQuestion({
    id: "n2-grammar-womegutte",
    level: "N2",
    surface: "をめぐって",
    reading: "をめぐって",
    meaningZh: "圍繞、針對",
    promptLabel: "N2 文法形式選擇",
    instructionZh: "句中填空：判斷議論的主題。",
    promptText: "新しい評価制度の導入 ___、社内で意見が分かれている。",
    promptContextZh: "公司內部圍繞新評價制度的導入意見分歧。",
    expectedAnswer: "をめぐって",
    options: ["をめぐって", "をこめて", "を問わず", "をはじめ"],
    explanation: "「Aをめぐって」表示以 A 為中心產生議論、對立或問題。後面的「意見が分かれている」很典型。"
  }),
  examQuestion({
    id: "n2-grammar-kanenai",
    level: "N2",
    surface: "かねない",
    reading: "かねない",
    meaningZh: "有可能造成壞結果",
    promptLabel: "N2 文法形式選擇",
    instructionZh: "句中填空：注意負面結果的可能性。",
    promptText: "情報管理を怠れば、会社の信用を失い ___。",
    promptContextZh: "若疏忽資訊管理，可能失去公司信用。",
    expectedAnswer: "かねない",
    options: ["かねない", "きれない", "かけない", "がたい"],
    explanation: "「Vます形 + かねない」表示可能發生不好的結果。這裡的壞結果是「信用を失う」。"
  }),
  examQuestion({
    id: "n2-grammar-zaruwoenai",
    level: "N2",
    surface: "ざるを得ない",
    reading: "ざるをえない",
    meaningZh: "不得不",
    promptLabel: "N2 文法形式選擇",
    instructionZh: "句中填空：選被迫接受的表現。",
    promptText: "十分な資料がそろっていないため、結論を見送ら ___。",
    promptContextZh: "因為資料不足，不得不暫緩結論。",
    expectedAnswer: "ざるを得ない",
    options: ["ざるを得ない", "ないではいられない", "ずにはおかない", "かねない"],
    explanation: "「Vない形去ない + ざるを得ない」表示沒有其他選擇，只能那樣做。"
  }),
  examQuestion({
    id: "n2-grammar-nisakidatte",
    level: "N2",
    surface: "に先立って",
    reading: "にさきだって",
    meaningZh: "在...之前",
    promptLabel: "N2 文法形式選擇",
    instructionZh: "句中填空：判斷正式流程的前後順序。",
    promptText: "記者会見 ___、関係者に資料が配布された。",
    promptContextZh: "在記者會之前，資料已發給相關人士。",
    expectedAnswer: "に先立って",
    options: ["に先立って", "に応じて", "に反して", "に沿って"],
    explanation: "「Aに先立ってB」表示 B 在 A 之前先進行，常見於正式活動、發表、會議。"
  }),
  examQuestion({
    id: "n2-grammar-nimokakawarazu",
    level: "N2",
    surface: "にもかかわらず",
    reading: "にもかかわらず",
    meaningZh: "儘管、雖然",
    promptLabel: "N2 文法形式選擇",
    instructionZh: "句中填空：注意前後句的逆接。",
    promptText: "大雨 ___、説明会には多くの参加者が集まった。",
    promptContextZh: "儘管下大雨，說明會仍聚集了許多參加者。",
    expectedAnswer: "にもかかわらず",
    options: ["にもかかわらず", "にしたがって", "に限って", "にわたって"],
    explanation: "「AにもかかわらずB」表示 A 的情況下通常不會 B，但實際上卻 B。"
  }),
  examQuestion({
    id: "n2-text-ippoude",
    level: "N2",
    surface: "一方で",
    reading: "いっぽうで",
    meaningZh: "另一方面",
    promptLabel: "N2 文章脈絡",
    instructionZh: "短文脈絡：選能讓文章流向自然的接續表現。",
    promptText: "電子申請は手続きの時間を短縮できる。___、高齢者には操作が難しいという声もある。",
    promptContextZh: "前句說優點，後句提出另一面向的問題。",
    expectedAnswer: "一方で",
    options: ["一方で", "そのため", "たとえば", "つまり"],
    explanation: "前後不是因果或換言，而是優點與課題的對比，所以用「一方で」。"
  }),
  examQuestion({
    id: "n2-order-yosoku-shigatai",
    level: "N2",
    surface: "しがたい",
    reading: "しがたい",
    meaningZh: "難以...",
    targetForm: "desiderative",
    promptLabel: "N2 語順組合",
    instructionZh: "語順組合：選語法正確且語意自然的句子。",
    promptText: "［専門家でさえ / 予測しがたい / ほど / 市場の変化が / 速い］",
    promptContextZh: "市場變化快到連專家都難以預測。",
    expectedAnswer: "専門家でさえ予測しがたいほど市場の変化が速い",
    options: [
      "専門家でさえ予測しがたいほど市場の変化が速い",
      "市場の変化が専門家でさえほど予測しがたい速い",
      "専門家ほど市場の変化が速いでさえ予測しがたい",
      "予測しがたい市場でさえ専門家の変化がほど速い"
    ],
    explanation: "「AほどB」表示程度；「専門家でさえ」放在「予測しがたい」前，強調連專家也難以預測。"
  }),
  examQuestion({
    id: "n2-order-zaruwoenai",
    level: "N2",
    surface: "ざるを得ない",
    reading: "ざるをえない",
    meaningZh: "不得不",
    promptLabel: "N2 語順組合",
    instructionZh: "語順組合：注意「ため」造成的被迫選擇。",
    promptText: "［安全上の問題が / 見つかったため / 計画を / 変更せざるを得ない］",
    promptContextZh: "因為發現安全問題，不得不改變計畫。",
    expectedAnswer: "安全上の問題が見つかったため計画を変更せざるを得ない",
    options: [
      "安全上の問題が見つかったため計画を変更せざるを得ない",
      "計画を安全上の問題が変更せざるを得ない見つかったため",
      "見つかったため計画が安全上の問題を変更せざるを得ない",
      "安全上の問題を計画が見つかったため変更せざるを得ない"
    ],
    explanation: "原因句「安全上の問題が見つかったため」在前，後句接「計画を変更せざるを得ない」。"
  }),
  examQuestion({
    id: "n1-grammar-toaimatte",
    level: "N1",
    surface: "と相まって",
    reading: "とあいまって",
    meaningZh: "與...相互作用、加上...",
    promptLabel: "N1 文法形式選擇",
    instructionZh: "句中填空：選表示兩個因素相互作用的文法。",
    promptText: "独自の技術が丁寧な接客 ___、この店の評価を高めている。",
    promptContextZh: "獨家技術加上細緻接待，共同提高了店的評價。",
    expectedAnswer: "と相まって",
    options: ["と相まって", "に先立って", "を問わず", "に反して"],
    explanation: "「AがBと相まってC」表示 A 與 B 互相配合、共同造成 C。"
  }),
  examQuestion({
    id: "n1-grammar-yoginaku",
    level: "N1",
    surface: "を余儀なくされる",
    reading: "をよぎなくされる",
    meaningZh: "被迫...",
    promptLabel: "N1 文法形式選擇",
    instructionZh: "句中填空：選被外在因素迫使的表現。",
    promptText: "台風の影響で、主催者はイベントの中止 ___。",
    promptContextZh: "因颱風影響，主辦方被迫取消活動。",
    expectedAnswer: "を余儀なくされた",
    options: ["を余儀なくされた", "をものともせず", "にたえなかった", "に即していた"],
    explanation: "「Nを余儀なくされる」表示被外在情況逼得不得不做某事。這裡是被迫取消。"
  }),
  examQuestion({
    id: "n1-grammar-nakushitewa",
    level: "N1",
    surface: "なくしては",
    reading: "なくしては",
    meaningZh: "沒有...就不能...",
    promptLabel: "N1 文法形式選擇",
    instructionZh: "句中填空：注意後句的否定判斷。",
    promptText: "住民の理解 ___、この計画を進めることはできない。",
    promptContextZh: "沒有居民理解，就無法推進這項計畫。",
    expectedAnswer: "なくしては",
    options: ["なくしては", "にしては", "からして", "をもって"],
    explanation: "「Nなくしては...ない」表示沒有 N 就無法成立。後句「できない」是重要線索。"
  }),
  examQuestion({
    id: "n1-grammar-nisokushite",
    level: "N1",
    surface: "に即して",
    reading: "にそくして",
    meaningZh: "依據、符合",
    promptLabel: "N1 文法形式選擇",
    instructionZh: "句中填空：選符合實際情況的表現。",
    promptText: "現場の実情 ___、運用ルールを見直す必要がある。",
    promptContextZh: "需要依據現場實際情況重新檢討運用規則。",
    expectedAnswer: "に即して",
    options: ["に即して", "に至って", "にひきかえ", "を皮切りに"],
    explanation: "「Nに即して」表示依據 N、配合 N。這裡是依照現場實情調整規則。"
  }),
  examQuestion({
    id: "n1-grammar-mademonai",
    level: "N1",
    surface: "までもない",
    reading: "までもない",
    meaningZh: "沒必要到...程度",
    promptLabel: "N1 文法形式選擇",
    instructionZh: "句中填空：判斷「沒必要特地說明」。",
    promptText: "この結果が何を意味するかは、改めて説明する ___。",
    promptContextZh: "這個結果代表什麼，不用特別再說明。",
    expectedAnswer: "までもない",
    options: ["までもない", "にたえない", "にすぎない", "かいがない"],
    explanation: "「V辞書形 + までもない」表示沒有必要特地做某事。"
  }),
  examQuestion({
    id: "n1-grammar-beku",
    level: "N1",
    surface: "べく",
    reading: "べく",
    meaningZh: "為了...",
    promptLabel: "N1 文法形式選擇",
    instructionZh: "句中填空：選正式書面語的目的表現。",
    promptText: "原因を明らかにす ___、専門チームが設置された。",
    promptContextZh: "為了查明原因，成立了專門小組。",
    expectedAnswer: "べく",
    options: ["べく", "ものの", "ところを", "ばかりに"],
    explanation: "「V辞書形 + べく」是較正式的目的表現。注意「する」接「べく」常寫成「すべく」。"
  }),
  examQuestion({
    id: "n1-grammar-wokikkirini",
    level: "N1",
    surface: "を皮切りに",
    reading: "をかわきりに",
    meaningZh: "以...為開端",
    promptLabel: "N1 文法形式選擇",
    instructionZh: "句中填空：選表示一連串活動開端的文法。",
    promptText: "東京での発表会 ___、全国各地で説明会が開かれる予定だ。",
    promptContextZh: "以東京發表會為開端，預計在全國各地舉辦說明會。",
    expectedAnswer: "を皮切りに",
    options: ["を皮切りに", "を余儀なく", "に至って", "にたえず"],
    explanation: "「Aを皮切りにB」表示以 A 為開端，之後 B 陸續展開。"
  }),
  examQuestion({
    id: "n1-grammar-toatte",
    level: "N1",
    surface: "とあって",
    reading: "とあって",
    meaningZh: "因為是...所以",
    promptLabel: "N1 文法形式選擇",
    instructionZh: "句中填空：選說明特殊情況造成結果的文法。",
    promptText: "連休初日 ___、駅は朝から多くの旅行客で混雑していた。",
    promptContextZh: "因為是連假第一天，車站一早就擠滿旅客。",
    expectedAnswer: "とあって",
    options: ["とあって", "といえども", "ときたら", "とはいえ"],
    explanation: "「AとあってB」表示因為 A 這個特殊狀況，所以自然產生 B 的結果。"
  }),
  examQuestion({
    id: "n1-text-tadashi",
    level: "N1",
    surface: "ただし",
    reading: "ただし",
    meaningZh: "但是、但有條件",
    promptLabel: "N1 文章脈絡",
    instructionZh: "短文脈絡：選能補上限制條件的接續語。",
    promptText: "本制度は原則として全社員が利用できる。___、試用期間中の社員は対象外とする。",
    promptContextZh: "前句說原則，後句追加例外限制。",
    expectedAnswer: "ただし",
    options: ["ただし", "したがって", "それどころか", "ちなみに"],
    explanation: "後句不是結論、補充閒談或反駁，而是加上限制條件，所以用「ただし」。"
  }),
  examQuestion({
    id: "n1-order-nakushitewa",
    level: "N1",
    surface: "なくしては",
    reading: "なくしては",
    meaningZh: "沒有...就不能...",
    promptLabel: "N1 語順組合",
    instructionZh: "語順組合：注意否定條件與後句否定的呼應。",
    promptText: "［長期的な視点 / なくしては / 持続的な成長は / 望めない］",
    promptContextZh: "沒有長期觀點，就無法期待持續成長。",
    expectedAnswer: "長期的な視点なくしては持続的な成長は望めない",
    options: [
      "長期的な視点なくしては持続的な成長は望めない",
      "持続的な成長はなくしては長期的な視点望めない",
      "長期的な視点は持続的な成長なくしては望めない",
      "望めない長期的な視点なくしては持続的な成長は"
    ],
    explanation: "「Nなくしては...ない」是一組，名詞「長期的な視点」要直接接「なくしては」。"
  }),
  examQuestion({
    id: "n1-order-wokikkirini",
    level: "N1",
    surface: "を皮切りに",
    reading: "をかわきりに",
    meaningZh: "以...為開端",
    promptLabel: "N1 語順組合",
    instructionZh: "語順組合：注意開端與後續展開。",
    promptText: "［大阪での公演を / 皮切りに / 全国ツアーが / 始まった］",
    promptContextZh: "以大阪公演為開端，全國巡演開始。",
    expectedAnswer: "大阪での公演を皮切りに全国ツアーが始まった",
    options: [
      "大阪での公演を皮切りに全国ツアーが始まった",
      "全国ツアーを大阪での公演が皮切りに始まった",
      "大阪での公演が全国ツアーを始まった皮切りに",
      "皮切りに全国ツアーを大阪での公演が始まった"
    ],
    explanation: "「Aを皮切りにBが始まる」表示以 A 為第一步，B 接著展開。"
  })
];

export function buildExamQuestionPool(level: JlptLevel | "all" = "all"): PracticeQuestion[] {
  if (level === "N1" || level === "N2") {
    return examStyleQuestions.filter((question) => question.vocabulary.level === level);
  }

  return examStyleQuestions;
}

function examQuestion(input: ExamQuestionInput): PracticeQuestion {
  return {
    id: input.id,
    vocabulary: {
      id: input.id,
      surface: input.surface,
      reading: input.reading,
      meaningZh: input.meaningZh,
      partOfSpeech: "noun",
      group: null,
      lesson: null,
      tags: ["exam_style", input.level],
      examples: [{ japanese: input.promptText.replace("___", input.expectedAnswer), meaningZh: input.promptContextZh }],
      level: input.level
    },
    targetForm: input.targetForm ?? "reading",
    expectedAnswers: [input.expectedAnswer],
    explanation: input.explanation,
    promptLabel: input.promptLabel,
    promptText: input.promptText,
    promptContextZh: input.promptContextZh,
    instructionZh: input.instructionZh,
    options: input.options
  };
}
