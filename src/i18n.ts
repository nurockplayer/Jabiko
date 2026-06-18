import type { PartOfSpeech, TargetForm, VerbGroup } from "./domain/types";

export type Language = "zh-Hant" | "en" | "ko";

export type Copy = {
  languageName: string;
  appIntroLabel: string;
  appTitle: string;
  appTagline: string;
  themeLight: string;
  themeDark: string;
  flowLabel: string;
  home: string;
  learn: string;
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
  mockExamSetupTitle: string;
  mockExamSetupIntro: string;
  mockExamLevelLabel: string;
  mockExamSectionsHeading: string;
  mockExamSectionPoolLabel: string;
  mockExamSectionGap: string;
  mockExamPoolEmpty: string;
  mockExamStart: string;
  mockExamStartDisabled: string;
  mockExamSuggestedMinutes: (value: number) => string;
  mockExamSectionBadge: (index: number) => string;
  mockExamRunningTitle: (level: string) => string;
  mockExamProgress: (current: number, total: number) => string;
  mockExamElapsed: string;
  mockExamSubmit: string;
  mockExamSubmitConfirm: string;
  mockExamSkip: string;
  mockExamNext: string;
  mockExamPrev: string;
  mockExamResultsTitle: (level: string) => string;
  mockExamTotalScore: (correct: number, total: number, percent: number) => string;
  mockExamAnsweredOf: (answered: number, total: number) => string;
  mockExamGapNote: (gap: number) => string;
  mockExamRetake: string;
  mockExamExit: string;
  mockExamReviewWrong: string;
  mockExamReviewSection: string;
  mockExamUnansweredBadge: string;
  mockExamSkippedShort: string;
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
  modeOptions: Record<"basic" | "cloze" | "exam" | "pattern" | "review" | "vocab", { title: string; subtitle: string }>;
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
  speakAriaLabel: string;
  partOfSpeech: Record<PartOfSpeech | "mixed", string>;
  verbGroups: Record<VerbGroup | "all", string>;
  focusOptions: Record<"single" | "teTa" | "negative" | "plain" | "adverbial" | "obligationPast", string>;
  targetForms: Record<TargetForm, string>;
  lessonCardFocus: string[];
};

export const LANGUAGE_STORAGE_KEY = "jabiko.language";

export const languageOptions: Array<{ value: Language; label: string }> = [
  { value: "zh-Hant", label: "繁中" },
  { value: "en", label: "English" },
  { value: "ko", label: "한국어" }
];

export const copy: Record<Language, Copy> = {
  "zh-Hant": {
    languageName: "繁中",
    appIntroLabel: "Jabiko 介紹",
    appTitle: "Jabiko · JLPT 自習室",
    appTagline: "JLPT N1・N2 文法、漢字、單字、模擬考，一個桌上練到熟。",
    themeLight: "淺色模式",
    themeDark: "深色模式",
    flowLabel: "學習流程",
    home: "首頁",
    learn: "學習",
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
    mockExamSetupTitle: "JLPT 模擬考",
    mockExamSetupIntro:
      "依官方題型結構抽題。作答中不顯示對錯，整份交卷後才看分數與詳解。題庫不足的小題會明確標出。",
    mockExamLevelLabel: "等級",
    mockExamSectionsHeading: "本回題型結構",
    mockExamSectionPoolLabel: "目前題庫",
    mockExamSectionGap: "缺 {gap} 題",
    mockExamPoolEmpty: "題庫尚未建置",
    mockExamStart: "開始模擬考",
    mockExamStartDisabled: "題庫為空，暫無可考題",
    mockExamSuggestedMinutes: (value) => `建議時長 ${value} 分（官方）`,
    mockExamSectionBadge: (index) => `問題 ${index}`,
    mockExamRunningTitle: (level) => `模擬考 ${level} · 進行中`,
    mockExamProgress: (current, total) => `第 ${current} / ${total} 題`,
    mockExamElapsed: "經過時間",
    mockExamSubmit: "結束作答",
    mockExamSubmitConfirm: "確定交卷？尚未作答的題目會以未作答計算。",
    mockExamSkip: "跳過",
    mockExamNext: "下一題 →",
    mockExamPrev: "← 上一題",
    mockExamResultsTitle: (level) => `模擬考 ${level} · 結果`,
    mockExamTotalScore: (correct, total, percent) => `總分 ${correct} / ${total}（${percent}%）`,
    mockExamAnsweredOf: (answered, total) => `已作答 ${answered} / ${total} 題`,
    mockExamGapNote: (gap) => `本回比官方少 ${gap} 題（缺漏的題型已標示）`,
    mockExamRetake: "再考一次",
    mockExamExit: "離開模擬考",
    mockExamReviewWrong: "看錯題詳解",
    mockExamReviewSection: "題型分析",
    mockExamUnansweredBadge: "未作答",
    mockExamSkippedShort: "跳過",
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
      basic: { title: "基礎變化", subtitle: "詞類變化練習 · 課本詞彙" },
      cloze: { title: "句中填空", subtitle: "N5 文型 · 〜てください / 〜たいです" },
      pattern: { title: "句型練習", subtitle: "N5/N4 句型判斷 · 視角 / 許可 / 引用 / 不必" },
      exam: { title: "綜合考題庫", subtitle: "N1/N2 為主 · 文法 / 語順 / 短文 / 詞彙 / 漢字読み" },
      vocab: { title: "単字快測", subtitle: "N1/N2 單字 · 讀音 + 意思 隨機抽" },
      review: { title: "弱點複習", subtitle: "把上次答錯的題目重練到對為止" }
    },
    homeCardVocabTitle: "単字快測",
    homeCardVocabSub: "N1 / N2 單字快速複習，讀音與中文意思隨機抽。",
    homeCardVocabMeta: "適合通勤碎片時間",
    dashboardEyebrow: "繼續學習",
    dashboardReviewPending: (count) => `你還有 ${count} 題等待複習`,
    dashboardReviewEmpty: "沒有待複習錯題了 🎉",
    dashboardReviewCta: "立刻複習",
    dashboardNextChapterLabel: "下一章建議",
    dashboardStatsAttempts: (count) => `已練 ${count} 題`,
    dashboardStatsAccuracy: (percent) => `總正答率 ${percent}%`,
    reviewEmptyState: "沒有錯題可以複習。回到綜合題庫或基礎變化練幾題吧。",
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
  },
  en: {
    languageName: "English",
    appIntroLabel: "About Jabiko",
    appTitle: "Jabiko · JLPT study room",
    appTagline: "JLPT N1 / N2 grammar, kanji, vocab, mock exams — all from one desk.",
    themeLight: "Light mode",
    themeDark: "Dark mode",
    flowLabel: "Learning flow",
    home: "Home",
    learn: "Learn",
    challenge: "Challenge",
    mockExam: "Mock exam",
    homeHeroTitle: "What do you want to practice today?",
    homeHeroIntro:
      "From base conjugation to JLPT N1 / N2 question sense. Grammar, kanji, vocab, full mock exams — one quiet desk.",
    homeContentStats: (chapters, examItems, n1Grammar, patternChecks, vocab) =>
      `${chapters} chapters · ${examItems} exam items · ${n1Grammar} N1 patterns · ${patternChecks} pattern checks · ${vocab} N1/N2 words`,
    homeCardStageLearn: "Learn",
    homeCardStageChallenge: "Drill",
    homeCardStageVocab: "Vocab",
    homeCardStageMock: "Test",
    homeCardStageReview: "Catch up",
    homeBannerReviewMain: (count) => `${count} item${count === 1 ? "" : "s"} waiting for review`,
    homeBannerReviewSub: "Mistakes accumulate across sessions until you answer them correctly.",
    homeBannerContinueMain: (chapter) => `Continue: ${chapter}`,
    homeBannerContinueSub: "The next chapter you haven't finished.",
    homeStatsLabel: "Overall progress",
    homeStatsAttempts: "Answered",
    homeStatsAccuracy: "Accuracy",
    homeStatsChapters: "Chapters",
    homeCardLearnTitle: "Learn",
    homeCardLearnSub: "Chapter-by-chapter form rules and patterns; read first, then drill.",
    homeCardLearnMeta: (completed, total) => `${completed} / ${total} chapters done`,
    homeCardChallengeTitle: "Challenge",
    homeCardChallengeSub: "Four modes: conjugation · cloze · pattern judging · JLPT mock pool.",
    homeCardChallengeMeta: "Word type, target form, JLPT level — your call",
    homeCardMockTitle: "Mock exam",
    homeCardMockSub: "Full JLPT N1 / N2 paper, timed, with section-level breakdown.",
    homeCardMockMeta: "Real exam structure",
    homeCardReviewTitle: "Weak-spot review",
    homeCardReviewSubActive: (count) => `${count} item${count === 1 ? "" : "s"} to re-drill until they stick.`,
    homeCardReviewSubEmpty: "Nothing to review right now.",
    homeCardReviewMeta: "Spaced repetition · auto-defers on correct answers",
    mockExamSetupTitle: "JLPT mock exam",
    mockExamSetupIntro:
      "Pulls questions section-by-section to match the official JLPT paper. No per-question feedback during the run -- you'll see the score and full explanations only after you submit. Sections with too few questions are flagged explicitly.",
    mockExamLevelLabel: "Level",
    mockExamSectionsHeading: "Paper structure",
    mockExamSectionPoolLabel: "Pool",
    mockExamSectionGap: "missing {gap}",
    mockExamPoolEmpty: "no items yet",
    mockExamStart: "Start mock exam",
    mockExamStartDisabled: "Pool is empty",
    mockExamSuggestedMinutes: (value) => `Official time: ${value} min`,
    mockExamSectionBadge: (index) => `Section ${index}`,
    mockExamRunningTitle: (level) => `Mock exam ${level} · in progress`,
    mockExamProgress: (current, total) => `${current} / ${total}`,
    mockExamElapsed: "Elapsed",
    mockExamSubmit: "Submit exam",
    mockExamSubmitConfirm: "Submit now? Unanswered questions will count as wrong.",
    mockExamSkip: "Skip",
    mockExamNext: "Next →",
    mockExamPrev: "← Previous",
    mockExamResultsTitle: (level) => `Mock exam ${level} · results`,
    mockExamTotalScore: (correct, total, percent) => `${correct} / ${total} (${percent}%)`,
    mockExamAnsweredOf: (answered, total) => `Answered ${answered} of ${total}`,
    mockExamGapNote: (gap) => `${gap} questions short of the official paper (gap sections flagged below)`,
    mockExamRetake: "Retake",
    mockExamExit: "Exit",
    mockExamReviewWrong: "Review wrong answers",
    mockExamReviewSection: "Section breakdown",
    mockExamUnansweredBadge: "Unanswered",
    mockExamSkippedShort: "Skipped",
    learningRegion: "Learning",
    studyBeforeRecall: "Study before recall",
    learnTitle: "Learn first, then challenge yourself",
    learnIntro: "Start with word classes, group related forms together, then check your recall with choices before typing.",
    roadmapLabel: "Suggested learning order",
    learningSteps: [
      {
        label: "Classify",
        title: "Do not start by memorizing tables",
        body: "Ask whether the word is a verb, i-adjective, na-adjective, or noun. For verbs, identify group 1, 2, or 3 first."
      },
      {
        label: "Group forms",
        title: "Practice related forms together",
        body: "Te-form and ta-form share one family. Nai, naide, nakute, and nakatta share another."
      },
      {
        label: "Review misses",
        title: "Read the rule when you miss",
        body: "Wrong answers show the accepted form and rule. Check why it changes before moving on."
      }
    ],
    step: "Step",
    verbGroupTitle: "Start by sorting verbs into three groups",
    verbGroupIntro: "Before te-form or ta-form, classify the verb. The group tells you whether to change the final kana or remove ru.",
    teTaTitle: "Te-form and ta-form use the same map",
    teTaIntro: "For group 1 verbs, learn te and ta endings as pairs. 行く is the exception: 行って / 行った.",
    negativeTitle: "Negative forms start from nai-form",
    negativeIntro: "Naide, nakute, and nakatta are not made from te-form or ta-form. Build nai-form first, then continue.",
    adjectiveTitle: "Keep adjectives and noun-like forms separate",
    adjectiveIntro: "I-adjectives drop い. Na-adjectives and nouns behave like nominal sentences with だ, ではない, and だった.",
    obligationPastTitle: "Past obligation changes at the final phrase",
    obligationPastIntro: "ならなければ is not past by itself. Keep the condition in front, then change only the final ならない to ならなかった.",
    tableEnding: "Ending",
    tableTe: "Te",
    tableTa: "Ta",
    tableExample: "Example",
    teTaTableLabel: "Group 1 te-form and ta-form sound changes",
    drillGodanTeTa: "Drill group 1 te/ta",
    drillNegative: "Drill negatives",
    drillIAdjective: "Drill i-adjectives",
    drillNaAdjective: "Drill na-adjectives",
    drillAdverbial: "Drill ku/ni modifiers",
    drillObligationPast: "Drill past obligation",
    drillMasu: "Drill masu form",
    drillPlain: "Drill plain forms",
    drillPotential: "Drill potential form",
    drillVolitional: "Drill volitional form",
    drillPassive: "Drill passive form",
    drillCausative: "Drill causative form",
    drillDesiderative: "Drill tai / tagaru",
    drillPatternTeKudasai: "Drill pattern: request / permission / prohibition",
    drillPatternNakuteMoII: "Drill pattern: no-need vs must",
    drillPatternTeMorau: "Drill pattern: giving/receiving perspective",
    drillPatternToOmou: "Drill pattern: quote / opinion",
    startChallenge: "Start challenge",
    settingsLabel: "Practice settings",
    todayPractice: "Today's practice",
    practiceType: "Word type",
    practiceMode: "Practice mode",
    practiceFocus: "Practice focus",
    verbGroup: "Verb group",
    targetForm: "Target form",
    answered: "Answered",
    correctShort: "Correct",
    reviewShort: "Review",
    resetSession: "Reset session",
    currentQuestion: "Current question",
    questionNumber: (value) => `Question ${value}`,
    answerOptions: "Answer options",
    revealAnswer: "Reveal answer",
    nextQuestion: "Next",
    emptyState: "No questions match the current settings.",
    mistakesLabel: "Mistakes",
    mistakeReview: "Mistake review",
    noMistakes: "No mistakes in this session yet.",
    correct: "Correct",
    incorrect: "Try again",
    revealed: "Remember this one",
    answerKey: "Answer",
    focusSummaryEmpty: "No compatible forms for this focus",
    modeOptions: {
      basic: { title: "Conjugation", subtitle: "Form drills · textbook vocabulary" },
      cloze: { title: "Sentence cloze", subtitle: "N5 grammar · ~te kudasai / ~tai desu" },
      pattern: { title: "Pattern judging", subtitle: "N5/N4 · perspective / permission / quotation / negation" },
      exam: { title: "JLPT mock pool", subtitle: "N1/N2 focus · grammar / sentence order / context / vocab / reading" },
      vocab: { title: "Vocab drill", subtitle: "N1/N2 words · reading + meaning, randomised" },
      review: { title: "Weak-spot review", subtitle: "Re-drill questions you got wrong until they stick" }
    },
    homeCardVocabTitle: "Vocab drill",
    homeCardVocabSub: "Fast N1 / N2 word drill: reading and Chinese meaning, randomised.",
    homeCardVocabMeta: "Built for commute-sized sessions",
    dashboardEyebrow: "Pick up where you left off",
    dashboardReviewPending: (count) => `${count} item${count === 1 ? "" : "s"} waiting for review`,
    dashboardReviewEmpty: "Nothing to review right now 🎉",
    dashboardReviewCta: "Review now",
    dashboardNextChapterLabel: "Suggested next chapter",
    dashboardStatsAttempts: (count) => `${count} answered`,
    dashboardStatsAccuracy: (percent) => `${percent}% overall`,
    reviewEmptyState: "No wrong answers to review. Head back to JLPT mock pool or basic drills.",
    speakAriaLabel: "Read aloud",
    partOfSpeech: {
      verb: "Verbs",
      i_adjective: "i-adj",
      na_adjective: "na-adj",
      noun: "Nouns",
      mixed: "Mixed"
    },
    verbGroups: {
      godan: "Group 1",
      ichidan: "Group 2",
      irregular: "Group 3",
      all: "All"
    },
    focusOptions: {
      single: "Single form",
      teTa: "Te/Ta pair",
      negative: "Negatives",
      plain: "Plain forms",
      adverbial: "ku/ni modifiers",
      obligationPast: "Past obligation"
    },
    targetForms: {
      dictionary: "Dictionary form",
      masu: "Masu-form",
      nai: "Nai-form",
      negativeTe: "Negative te-form: naide",
      negativeContinuative: "Negative connector: nakute",
      adverbial: "Modifier form: ku/ni",
      obligationPast: "Past obligation: nakereba naranakatta",
      te: "Te-form",
      ta: "Ta-form",
      potential: "Potential form",
      volitional: "Volitional form",
      causative: "Causative form",
      passive: "Passive form",
      desiderative: "Desiderative (tai)",
      reading: "Reading",
      meaning: "Meaning",
      plainPresentAffirmative: "Plain non-past affirmative",
      plainPresentNegative: "Plain non-past negative",
      plainPastAffirmative: "Plain past affirmative",
      plainPastNegative: "Plain past negative"
    },
    lessonCardFocus: ["Te/Ta sound changes", "naide / nakute / nakatta", "Adjectives and noun-like forms"]
  },
  ko: {
    languageName: "한국어",
    appIntroLabel: "Jabiko 소개",
    appTitle: "Jabiko · JLPT 자습실",
    appTagline: "JLPT N1 · N2 문법, 한자, 단어, 모의시험을 한 책상에서.",
    themeLight: "라이트 모드",
    themeDark: "다크 모드",
    flowLabel: "학습 흐름",
    home: "홈",
    learn: "학습",
    challenge: "도전",
    mockExam: "모의시험",
    homeHeroTitle: "오늘은 무엇을 연습할까요?",
    homeHeroIntro:
      "기본 활용에서 N1 / N2 시험 감각까지. 문법, 한자, 단어, 모의시험을 한 책상에서.",
    homeContentStats: (chapters, examItems, n1Grammar, patternChecks, vocab) =>
      `${chapters} 챕터 · ${examItems} 종합 문제 · ${n1Grammar} N1 문형 · ${patternChecks} 문형 판단 · ${vocab} N1/N2 단어`,
    homeCardStageLearn: "학",
    homeCardStageChallenge: "연",
    homeCardStageVocab: "암",
    homeCardStageMock: "시",
    homeCardStageReview: "보",
    homeBannerReviewMain: (count) => `복습 대기 ${count}문제`,
    homeBannerReviewSub: "정답을 맞힐 때까지 세션을 넘어 누적된 오답입니다.",
    homeBannerContinueMain: (chapter) => `이어서 학습: ${chapter}`,
    homeBannerContinueSub: "아직 끝내지 않은 챕터입니다.",
    homeStatsLabel: "전체 진도",
    homeStatsAttempts: "누적 풀이",
    homeStatsAccuracy: "정답률",
    homeStatsChapters: "완료 챕터",
    homeCardLearnTitle: "학습",
    homeCardLearnSub: "챕터별 활용 규칙과 문형 설명을 보고 연습합니다.",
    homeCardLearnMeta: (completed, total) => `${completed} / ${total} 챕터 완료`,
    homeCardChallengeTitle: "도전",
    homeCardChallengeSub: "네 가지 모드: 활용 · 빈칸 · 문형 판단 · 종합 문제.",
    homeCardChallengeMeta: "품사 · 목표형 · JLPT 레벨 선택 가능",
    homeCardMockTitle: "모의시험",
    homeCardMockSub: "JLPT N1 / N2 한 회분, 시간 측정 + 섹션별 분석.",
    homeCardMockMeta: "공식 시험 구조",
    homeCardReviewTitle: "약점 복습",
    homeCardReviewSubActive: (count) => `다시 풀어야 할 문제 ${count}개.`,
    homeCardReviewSubEmpty: "지금 복습할 오답이 없습니다.",
    homeCardReviewMeta: "간격 반복 · 정답을 맞히면 다음 일정으로 미뤄집니다",
    mockExamSetupTitle: "JLPT 모의시험",
    mockExamSetupIntro:
      "공식 시험 구조에 맞춰 섹션별로 문제를 뽑습니다. 풀이 중에는 정답을 보여 주지 않고, 제출 후 점수와 해설을 한꺼번에 확인합니다. 문제 풀이가 부족한 섹션은 명확히 표시됩니다.",
    mockExamLevelLabel: "레벨",
    mockExamSectionsHeading: "이번 회차 구조",
    mockExamSectionPoolLabel: "현재 문제 수",
    mockExamSectionGap: "{gap}문제 부족",
    mockExamPoolEmpty: "문제 준비 중",
    mockExamStart: "모의시험 시작",
    mockExamStartDisabled: "문제가 없습니다",
    mockExamSuggestedMinutes: (value) => `권장 시간 ${value}분（공식 기준）`,
    mockExamSectionBadge: (index) => `문제 ${index}`,
    mockExamRunningTitle: (level) => `모의시험 ${level} · 진행 중`,
    mockExamProgress: (current, total) => `${current} / ${total}`,
    mockExamElapsed: "경과 시간",
    mockExamSubmit: "제출하기",
    mockExamSubmitConfirm: "지금 제출하시겠어요? 미응답 문제는 오답 처리됩니다.",
    mockExamSkip: "건너뛰기",
    mockExamNext: "다음 문제 →",
    mockExamPrev: "← 이전 문제",
    mockExamResultsTitle: (level) => `모의시험 ${level} · 결과`,
    mockExamTotalScore: (correct, total, percent) => `${correct} / ${total} (${percent}%)`,
    mockExamAnsweredOf: (answered, total) => `${total}문제 중 ${answered}문제 응답`,
    mockExamGapNote: (gap) => `공식 시험 대비 ${gap}문제 부족 (부족한 섹션은 아래에 표시)`,
    mockExamRetake: "다시 보기",
    mockExamExit: "나가기",
    mockExamReviewWrong: "오답 해설 보기",
    mockExamReviewSection: "섹션별 결과",
    mockExamUnansweredBadge: "미응답",
    mockExamSkippedShort: "건너뜀",
    learningRegion: "학습",
    studyBeforeRecall: "회상하기 전에 학습하기",
    learnTitle: "먼저 배우고, 그다음 도전하세요",
    learnIntro: "먼저 품사를 구분하고, 관련 활용을 묶어서 본 뒤 선택형으로 확인하고 입력 연습으로 넘어갑니다.",
    roadmapLabel: "추천 학습 순서",
    learningSteps: [
      {
        label: "분류",
        title: "처음부터 표만 외우지 않기",
        body: "동사, い형용사, な형용사, 명사인지 먼저 봅니다. 동사라면 1그룹, 2그룹, 3그룹부터 구분합니다."
      },
      {
        label: "묶기",
        title: "같은 가족끼리 연습하기",
        body: "て형과 た형은 한 묶음입니다. ない, ないで, なくて, なかった도 같은 흐름으로 봅니다."
      },
      {
        label: "오답",
        title: "틀리면 규칙부터 읽기",
        body: "오답은 정답과 규칙을 함께 보여 줍니다. 왜 그렇게 바뀌는지 확인한 뒤 다음 문제로 갑니다."
      }
    ],
    step: "Step",
    verbGroupTitle: "동사는 먼저 세 그룹으로 나누기",
    verbGroupIntro: "て형이나 た형보다 먼저 동사 그룹을 봅니다. 그룹을 알아야 마지막 가나를 바꿀지, る를 뺄지 알 수 있습니다.",
    teTaTitle: "て형과 た형은 같은 표로 보기",
    teTaIntro: "1그룹 동사는 て / た를 짝으로 외우면 쉽습니다. 行く는 예외로 行って / 行った입니다.",
    negativeTitle: "부정 활용은 ない형에서 시작",
    negativeIntro: "ないで, なくて, なかった는 て형이나 た형에서 만드는 것이 아닙니다. 먼저 ない형을 만듭니다.",
    adjectiveTitle: "형용사와 명사형은 나눠서 보기",
    adjectiveIntro: "い형용사는 い를 빼고, な형용사와 명사는 だ, ではない, だった 흐름으로 봅니다.",
    obligationPastTitle: "필요 표현의 과거는 마지막에서 바꾸기",
    obligationPastIntro: "ならなければ 자체는 과거가 아닙니다. 앞의 조건형은 그대로 두고 마지막 ならない만 ならなかった로 바꿉니다.",
    tableEnding: "끝",
    tableTe: "て형",
    tableTa: "た형",
    tableExample: "예",
    teTaTableLabel: "1그룹 동사의 て형과 た형 음편",
    drillGodanTeTa: "1그룹 て/た 연습",
    drillNegative: "부정 정리 연습",
    drillIAdjective: "い형용사 연습",
    drillNaAdjective: "な형용사 연습",
    drillAdverbial: "く/に 수식 연습",
    drillObligationPast: "필요 과거 연습",
    drillMasu: "ます형 연습",
    drillPlain: "보통형 연습",
    drillPotential: "가능형 연습",
    drillVolitional: "의향형 연습",
    drillPassive: "수동형 연습",
    drillCausative: "사역형 연습",
    drillDesiderative: "たい・たがる 연습",
    drillPatternTeKudasai: "문형 연습: 요청 / 허가 / 금지",
    drillPatternNakuteMoII: "문형 연습: 불필요 vs 필수",
    drillPatternTeMorau: "문형 연습: 수수 시점",
    drillPatternToOmou: "문형 연습: 인용 / 의견",
    startChallenge: "도전 시작",
    settingsLabel: "연습 설정",
    todayPractice: "오늘의 연습",
    practiceType: "연습 유형",
    practiceMode: "연습 모드",
    practiceFocus: "연습 포인트",
    verbGroup: "동사 그룹",
    targetForm: "목표형",
    answered: "풀이",
    correctShort: "정답",
    reviewShort: "복습",
    resetSession: "이번 회차 초기화",
    currentQuestion: "현재 문제",
    questionNumber: (value) => `${value}번 문제`,
    answerOptions: "답안 선택지",
    revealAnswer: "정답 보기",
    nextQuestion: "다음 문제",
    emptyState: "현재 설정에 맞는 문제가 없습니다.",
    mistakesLabel: "오답",
    mistakeReview: "오답 복습",
    noMistakes: "이번 회차에는 아직 오답이 없습니다.",
    correct: "정답",
    incorrect: "다시 생각해 보기",
    revealed: "이 문제를 기억하기",
    answerKey: "정답",
    focusSummaryEmpty: "이 포인트에 맞는 활용이 없습니다",
    modeOptions: {
      basic: { title: "기본 활용", subtitle: "품사별 활용 연습 · 교재 어휘" },
      cloze: { title: "문장 빈칸", subtitle: "N5 문형 · 〜てください / 〜たいです" },
      pattern: { title: "문형 판단", subtitle: "N5/N4 · 시점 / 허가 / 인용 / 불필요" },
      exam: { title: "종합 시험 문제", subtitle: "N1/N2 중심 · 문법 / 어순 / 단문 / 어휘 / 한자 읽기" },
      vocab: { title: "단어 드릴", subtitle: "N1/N2 단어 · 읽기 + 뜻 무작위 출제" },
      review: { title: "약점 복습", subtitle: "틀린 문제만 모아서 다시 풀기" }
    },
    homeCardVocabTitle: "단어 드릴",
    homeCardVocabSub: "N1 / N2 단어 빠른 복습 · 읽는 법과 중국어 뜻을 랜덤 출제.",
    homeCardVocabMeta: "출퇴근 자투리 시간용",
    dashboardEyebrow: "이어서 학습하기",
    dashboardReviewPending: (count) => `복습 대기 ${count}문제`,
    dashboardReviewEmpty: "지금 복습할 오답이 없습니다 🎉",
    dashboardReviewCta: "지금 복습",
    dashboardNextChapterLabel: "다음 추천 챕터",
    dashboardStatsAttempts: (count) => `${count}문제 풀이`,
    dashboardStatsAccuracy: (percent) => `누적 정답률 ${percent}%`,
    reviewEmptyState: "복습할 오답이 없습니다. 종합 시험 문제나 기본 활용으로 돌아가 보세요.",
    speakAriaLabel: "일본어 읽어주기",
    partOfSpeech: {
      verb: "동사",
      i_adjective: "い형용사",
      na_adjective: "な형용사",
      noun: "명사",
      mixed: "혼합"
    },
    verbGroups: {
      godan: "1그룹",
      ichidan: "2그룹",
      irregular: "3그룹",
      all: "전체"
    },
    focusOptions: {
      single: "단일형",
      teTa: "て/た 비교",
      negative: "부정 정리",
      plain: "보통형 정리",
      adverbial: "く/に 수식",
      obligationPast: "필요 과거"
    },
    targetForms: {
      dictionary: "사전형",
      masu: "ます형",
      nai: "ない형",
      negativeTe: "부정 て형・ないで",
      negativeContinuative: "부정 연결・なくて",
      adverbial: "수식형・く/に",
      obligationPast: "필요 과거・なければならなかった",
      te: "て형",
      ta: "た형",
      potential: "가능형",
      volitional: "의향형",
      causative: "사역형",
      passive: "수동형",
      desiderative: "희망형 (たい)",
      reading: "읽는 법",
      meaning: "뜻",
      plainPresentAffirmative: "보통형・현재 긍정",
      plainPresentNegative: "보통형・현재 부정",
      plainPastAffirmative: "보통형・과거 긍정",
      plainPastNegative: "보통형・과거 부정"
    },
    lessonCardFocus: ["て/た 음편", "ないで / なくて / なかった", "형용사와 명사형"]
  }
};

function isSupportedLanguage(value: string | null | undefined): value is Language {
  return value === "zh-Hant" || value === "en" || value === "ko";
}

function languageFromLocale(locale: string): Language | null {
  const normalizedLocale = locale.toLowerCase();

  if (normalizedLocale === "ko" || normalizedLocale.startsWith("ko-")) {
    return "ko";
  }

  if (normalizedLocale === "en" || normalizedLocale.startsWith("en-")) {
    return "en";
  }

  if (
    normalizedLocale === "zh" ||
    normalizedLocale === "zh-hant" ||
    normalizedLocale.startsWith("zh-hant-") ||
    normalizedLocale.startsWith("zh-tw") ||
    normalizedLocale.startsWith("zh-hk") ||
    normalizedLocale.startsWith("zh-mo")
  ) {
    return "zh-Hant";
  }

  return null;
}

function languageFromBrowser(): Language | null {
  const browserLocales =
    navigator.languages.length > 0 ? navigator.languages : [navigator.language];

  for (const locale of browserLocales) {
    const language = languageFromLocale(locale);

    if (language) {
      return language;
    }
  }

  return null;
}

export function getInitialLanguage(): Language {
  const urlLanguage = new URLSearchParams(window.location.search).get("lang");

  if (isSupportedLanguage(urlLanguage)) {
    storeLanguage(urlLanguage);
    return urlLanguage;
  }

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (isSupportedLanguage(storedLanguage)) {
    return storedLanguage;
  }

  return languageFromBrowser() ?? "zh-Hant";
}

export function storeLanguage(language: Language) {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}
