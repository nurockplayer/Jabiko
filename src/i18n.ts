import type { PartOfSpeech, TargetForm, VerbGroup } from "./domain/types";

export type Language = "zh-Hant";

export type Copy = {
  languageName: string;
  appIntroLabel: string;
  appTitle: string;
  appTagline: string;
  themeLight: string;
  themeDark: string;
  flowLabel: string;
  loading: string;
  home: string;
  learn: string;
  rules: string;
  rulesEyebrow: string;
  rulesPanelTitle: string;
  rulesPanelIntro: string;
  challenge: string;
  homeHeroTitle: string;
  homeHeroIntro: string;
  homeContentStats: (chapters: number, examItems: number, n1Grammar: number, patternChecks: number, vocab: number) => string;
  homeCardStageLearn: string;
  homeCardStageChallenge: string;
  homeCardStageVocab: string;
  homeCardStageMock: string;
  homeCardStageReview: string;
  homeBannerReviewMain: (count: number) => string;
  homeBannerReviewSub: string;
  homeBannerContinueMain: (chapter: string) => string;
  homeBannerContinueSub: string;
  homeDailyMain: string;
  homeDailySub: string;
  homeStatsLabel: string;
  homeStatsAttempts: string;
  homeStatsAccuracy: string;
  homeStatsChapters: string;
  homeCardLearnTitle: string;
  homeCardLearnSub: string;
  homeCardLearnMeta: (completed: number, total: number) => string;
  homeCardChallengeTitle: string;
  homeCardChallengeSub: string;
  homeCardChallengeMeta: string;
  homeCardMockTitle: string;
  homeCardMockSub: string;
  homeCardMockMeta: string;
  homeCardReviewTitle: string;
  homeCardReviewSubActive: (count: number) => string;
  homeCardReviewSubEmpty: string;
  homeCardReviewMeta: string;
  mockExam: string;
  mockExamLevelLabel: string;
  mockSectionTitle: string;
  mockSectionIntro: string;
  mockSectionCount: (count: number) => string;
  mockSectionEmpty: string;
  learningRegion: string;
  studyBeforeRecall: string;
  learnTitle: string;
  learnIntro: string;
  roadmapLabel: string;
  learningSteps: Array<{ label: string; title: string; body: string }>;
  step: string;
  verbGroupTitle: string;
  verbGroupIntro: string;
  teTaTitle: string;
  teTaIntro: string;
  negativeTitle: string;
  negativeIntro: string;
  adjectiveTitle: string;
  adjectiveIntro: string;
  obligationPastTitle: string;
  obligationPastIntro: string;
  tableEnding: string;
  tableTe: string;
  tableTa: string;
  tableExample: string;
  teTaTableLabel: string;
  drillGodanTeTa: string;
  drillNegative: string;
  drillIAdjective: string;
  drillNaAdjective: string;
  drillAdverbial: string;
  drillObligationPast: string;
  drillMasu: string;
  drillPlain: string;
  drillPotential: string;
  drillVolitional: string;
  drillPassive: string;
  drillCausative: string;
  drillDesiderative: string;
  drillPatternTeKudasai: string;
  drillPatternNakuteMoII: string;
  drillPatternTeMorau: string;
  drillPatternToOmou: string;
  startChallenge: string;
  settingsLabel: string;
  todayPractice: string;
  practiceType: string;
  practiceMode: string;
  practiceFocus: string;
  verbGroup: string;
  targetForm: string;
  answered: string;
  correctShort: string;
  reviewShort: string;
  resetSession: string;
  currentQuestion: string;
  questionNumber: (value: number) => string;
  answerOptions: string;
  revealAnswer: string;
  nextQuestion: string;
  emptyState: string;
  mistakesLabel: string;
  mistakeReview: string;
  noMistakes: string;
  correct: string;
  incorrect: string;
  revealed: string;
  answerKey: string;
  focusSummaryEmpty: string;
  modeOptions: Record<"basic" | "cloze" | "daily" | "exam" | "pattern" | "review" | "vocab", { title: string; subtitle: string }>;
  modeQuestionCount: (count: number) => string;
  homeCardVocabTitle: string;
  homeCardVocabSub: string;
  homeCardVocabMeta: string;
  // ---- Dashboard / review ---------------------------------------------------
  dashboardEyebrow: string;
  dashboardReviewPending: (count: number) => string;
  dashboardReviewEmpty: string;
  dashboardReviewCta: string;
  dashboardNextChapterLabel: string;
  dashboardStatsAttempts: (count: number) => string;
  dashboardStatsAccuracy: (percent: number) => string;
  reviewEmptyState: string;
  reviewEmptyCta: string;
  reviewDoneTitle: string;
  reviewDoneBody: (cleared: number, remaining: number) => string;
  reviewDoneAgain: string;
  reviewDoneExit: string;
  dailyDoneTitle: string;
  dailyDoneBody: (cleared: number, remaining: number) => string;
  dailyDoneAgain: string;
  dailyDoneExit: string;
  speakAriaLabel: string;
  partOfSpeech: Record<PartOfSpeech | "mixed", string>;
  verbGroups: Record<VerbGroup | "all", string>;
  focusOptions: Record<"single" | "teTa" | "negative" | "plain" | "adverbial" | "obligationPast", string>;
  targetForms: Record<TargetForm, string>;
  lessonCardFocus: string[];
};

export const copy: Record<Language, Copy> = {
  "zh-Hant": {
    languageName: "繁中",
    appIntroLabel: "Jabiko 介紹",
    appTitle: "Jabiko · JLPT 自習室",
    appTagline: "JLPT N1・N2 文法、漢字、單字、模擬考，一個桌上練到熟。",
    themeLight: "淺色模式",
    themeDark: "深色模式",
    flowLabel: "學習流程",
    loading: "載入中…",
    home: "首頁",
    learn: "學習",
    rules: "規則表",
    rulesEyebrow: "桌上的參考書",
    rulesPanelTitle: "動詞變化 速查",
    rulesPanelIntro: "考試 / 練習中忘了形變化，直接翻這頁。涵蓋動詞三類分類、ます／て・た、可能・意向・受身・使役、形容詞與名詞變化、必要過去 step-by-step，以及 N5-N4 基礎句型 cheat sheet。",
    challenge: "挑戰",
    mockExam: "模擬考",
    homeHeroTitle: "今天想練什麼？",
    homeHeroIntro: "從基礎變化到 N1 / N2 題感。文法、漢字、單字、整卷模擬，一處解決。",
    homeContentStats: (chapters, examItems, n1Grammar, patternChecks, vocab) =>
      `${chapters} 章節 · ${examItems} 綜合題 · ${n1Grammar} N1 句型 · ${patternChecks} 句型判斷 · ${vocab} N1/N2 單字`,
    homeCardStageLearn: "學",
    homeCardStageChallenge: "練",
    homeCardStageVocab: "背",
    homeCardStageMock: "考",
    homeCardStageReview: "補",
    homeBannerReviewMain: (count) => `你有 ${count} 題等待複習`,
    homeBannerReviewSub: "跨 session 累積的錯題，答對才會移出。",
    homeBannerContinueMain: (chapter) => `繼續學：${chapter}`,
    homeBannerContinueSub: "上次還沒完成的章節。",
    homeDailyMain: "開始今日練習",
    homeDailySub: "先清到期複習，再混合文法・語順・漢字読み練一輪。",
    homeStatsLabel: "整體進度",
    homeStatsAttempts: "累積已答",
    homeStatsAccuracy: "總正答率",
    homeStatsChapters: "完成章節",
    homeCardLearnTitle: "學習",
    homeCardLearnSub: "章節式變化與句型解說，先看規則再練。",
    homeCardLearnMeta: (completed, total) => `已完成 ${completed} / ${total} 章`,
    homeCardChallengeTitle: "挑戰",
    homeCardChallengeSub: "四種模式：基礎變化 · 句中填空 · 句型判斷 · 綜合考題庫。",
    homeCardChallengeMeta: "自由選詞類、目標形、JLPT 等級",
    homeCardMockTitle: "模擬考",
    homeCardMockSub: "JLPT N1 / N2 整卷抽題，計時 + 結果分析。",
    homeCardMockMeta: "依官方題型結構",
    homeCardReviewTitle: "弱點複習",
    homeCardReviewSubActive: (count) => `${count} 題等你重練到對。`,
    homeCardReviewSubEmpty: "目前沒有錯題可複習。",
    homeCardReviewMeta: "間隔重複 · 答對自動延到下次到期",
    mockExamLevelLabel: "等級",
    mockSectionTitle: "題型分區練習",
    mockSectionIntro: "選一個 JLPT 題型，直接練那一區。每題作答後即時看解析；錯題會自動進弱點複習。",
    mockSectionCount: (count) => `${count} 題`,
    mockSectionEmpty: "準備中",
    learningRegion: "學習",
    studyBeforeRecall: "先學習，再回想",
    learnTitle: "先學會，再挑戰",
    learnIntro: "第一次使用先照順序看：分辨詞類、抓同一組變化、再用選擇題確認。看懂規則後才進入輸入練習。",
    roadmapLabel: "建議學習順序",
    learningSteps: [
      {
        label: "先分類",
        title: "不要一開始就背表",
        body: "先問：這是動詞、い形容詞、な形容詞，還是名詞？如果是動詞，再判斷一類、二類、三類。"
      },
      {
        label: "選家族",
        title: "同一組變化放一起",
        body: "て形 / た形是一組；ない、ないで、なくて、なかった是一組。先把家族關係看懂，比硬背單字快。"
      },
      {
        label: "看錯題",
        title: "錯了就讀規則",
        body: "挑戰時答錯會顯示正解與規則。先確認「為什麼這樣變」，再進下一題。"
      }
    ],
    step: "Step",
    verbGroupTitle: "動詞先分三類",
    verbGroupIntro: "先不要管て形或た形。動詞題第一步只做分類，分類對了，後面才知道要「換最後假名」還是「去る」。",
    teTaTitle: "て形和た形是同一張表",
    teTaIntro: "一類動詞最難的是音便。先背「て / た 成對」，不要分開背兩份規則。行く是例外：行って、行った。",
    negativeTitle: "否定變化都先回到ない形",
    negativeIntro: "你卡住的「て形た形的否定」其實不是從て形或た形變來。先做ない形，再往下接。",
    adjectiveTitle: "形容詞和名詞不要混在一起背",
    adjectiveIntro: "い形容詞會去い；な形容詞和名詞比較像「名詞句」，用だ、ではない、だった這一套。",
    obligationPastTitle: "必須的過去看最後一段",
    obligationPastIntro: "「ならなければ」不是過去。要表過去時，前面維持條件形，最後的「ならない」變成「ならなかった」。",
    tableEnding: "結尾",
    tableTe: "て形",
    tableTa: "た形",
    tableExample: "例子",
    teTaTableLabel: "一類動詞て形與た形音便",
    drillGodanTeTa: "練一類て/た",
    drillNegative: "練否定整理",
    drillIAdjective: "練い形容詞",
    drillNaAdjective: "練な形容詞",
    drillAdverbial: "練く/に修飾",
    drillObligationPast: "練必要過去",
    drillMasu: "練ます形",
    drillPlain: "練普通形",
    drillPotential: "練可能形",
    drillVolitional: "練意向形",
    drillPassive: "練受身形",
    drillCausative: "練使役形",
    drillDesiderative: "練たい・たがる",
    drillPatternTeKudasai: "練句型：請求 / 許可 / 禁止",
    drillPatternNakuteMoII: "練句型：不必 vs 必須",
    drillPatternTeMorau: "練句型：授受視角",
    drillPatternToOmou: "練句型：引用 / 意見",
    startChallenge: "開始挑戰",
    settingsLabel: "練習設定",
    todayPractice: "今日練習",
    practiceType: "練習類型",
    practiceMode: "練習模式",
    practiceFocus: "練習重點",
    verbGroup: "動詞類別",
    targetForm: "目標形",
    answered: "已答",
    correctShort: "正解",
    reviewShort: "複習",
    resetSession: "重設本次",
    currentQuestion: "目前題目",
    questionNumber: (value) => `第 ${value} 題`,
    answerOptions: "答案選項",
    revealAnswer: "看答案",
    nextQuestion: "下一題",
    emptyState: "目前設定沒有可練習的題目。",
    mistakesLabel: "錯題",
    mistakeReview: "錯題複習",
    noMistakes: "本次還沒有錯題。",
    correct: "正解",
    incorrect: "再想一下",
    revealed: "先記這題",
    answerKey: "正解",
    focusSummaryEmpty: "目前重點沒有可用形",
    modeOptions: {
      daily: { title: "今日練習", subtitle: "複習優先 · 文法 / 語順 / 漢字読み混合一輪" },
      basic: { title: "基礎變化", subtitle: "詞類變化練習 · 課本詞彙" },
      cloze: { title: "句中填空", subtitle: "N5 文型 · 〜てください / 〜たいです" },
      pattern: { title: "句型練習", subtitle: "N5/N4 句型判斷 · 視角 / 許可 / 引用 / 不必" },
      exam: { title: "綜合考題庫", subtitle: "N1/N2 為主 · 文法 / 語順 / 短文 / 詞彙 / 漢字読み" },
      vocab: { title: "単字讀音", subtitle: "N1/N2 漢字詞 · 選正確讀音（よみ）" },
      review: { title: "弱點複習", subtitle: "把上次答錯的題目重練到對為止" }
    },
    modeQuestionCount: (count) => `題庫 ${count} 題`,
    homeCardVocabTitle: "単字讀音",
    homeCardVocabSub: "N1 / N2 漢字詞讀音快測。意思在綜合題庫用句子來考，這裡專練よみ。",
    homeCardVocabMeta: "適合通勤碎片時間",
    dashboardEyebrow: "繼續學習",
    dashboardReviewPending: (count) => `你還有 ${count} 題等待複習`,
    dashboardReviewEmpty: "沒有待複習錯題了 🎉",
    dashboardReviewCta: "立刻複習",
    dashboardNextChapterLabel: "下一章建議",
    dashboardStatsAttempts: (count) => `已練 ${count} 題`,
    dashboardStatsAccuracy: (percent) => `總正答率 ${percent}%`,
    reviewEmptyState: "目前沒有到期的錯題。去綜合題庫練幾題、累積一些再回來複習吧。",
    reviewEmptyCta: "去綜合題庫",
    reviewDoneTitle: "複習完成！",
    reviewDoneBody: (cleared, remaining) =>
      `這一輪複習了 ${cleared + remaining} 題，答對 ${cleared}、還要再練 ${remaining}。答對的會排到之後，答錯的下次複習會再出現。`,
    reviewDoneAgain: "再複習一輪",
    reviewDoneExit: "回首頁",
    dailyDoneTitle: "今日練習完成！",
    dailyDoneBody: (cleared, remaining) =>
      `今天練了 ${cleared + remaining} 題，答對 ${cleared}、答錯 ${remaining}。答錯的會進入弱點複習，下次複習時會再出現。`,
    dailyDoneAgain: "再練一組",
    dailyDoneExit: "回首頁",
    speakAriaLabel: "朗讀日文",
    partOfSpeech: {
      verb: "動詞",
      i_adjective: "い形容詞",
      na_adjective: "な形容詞",
      noun: "名詞",
      mixed: "混合"
    },
    verbGroups: {
      godan: "一類",
      ichidan: "二類",
      irregular: "三類",
      all: "全部"
    },
    focusOptions: {
      single: "單一形",
      teTa: "て/た比較",
      negative: "否定整理",
      plain: "普通形整理",
      adverbial: "く/に修飾",
      obligationPast: "必要過去"
    },
    targetForms: {
      dictionary: "辭書形",
      masu: "ます形",
      nai: "ない形",
      negativeTe: "否定て形・ないで",
      negativeContinuative: "否定接續・なくて",
      adverbial: "修飾形・く/に",
      obligationPast: "必要過去・なければならなかった",
      te: "て形",
      ta: "た形",
      potential: "可能形",
      volitional: "意向形",
      causative: "使役形",
      passive: "受身形",
      desiderative: "願望・たい形",
      reading: "念法",
      meaning: "意思",
      plainPresentAffirmative: "普通形・非過去肯定",
      plainPresentNegative: "普通形・非過去否定",
      plainPastAffirmative: "普通形・過去肯定",
      plainPastNegative: "普通形・過去否定"
    },
    lessonCardFocus: ["て形 / た形音便", "ないで / なくて / なかった", "形容詞與名詞型"]
  }
};

