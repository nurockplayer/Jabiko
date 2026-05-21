import type { JlptLevel, PartOfSpeech, TargetForm, VerbGroup } from "./domain/types";

export type Language = "zh-Hant" | "en" | "ko";

type Copy = {
  languageName: string;
  appIntroLabel: string;
  appTitle: string;
  appTagline: string;
  themeLight: string;
  themeDark: string;
  flowLabel: string;
  learn: string;
  challenge: string;
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
  startChallenge: string;
  settingsLabel: string;
  todayPractice: string;
  practiceType: string;
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
  partOfSpeech: Record<PartOfSpeech | "mixed", string>;
  verbGroups: Record<VerbGroup | "all", string>;
  focusOptions: Record<"single" | "teTa" | "negative" | "plain" | "adverbial" | "obligationPast", string>;
  targetForms: Record<TargetForm, string>;
  jlptLevel: string;
  jlptLevels: Record<JlptLevel | "all", string>;
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
    appIntroLabel: "應用程式介紹",
    appTitle: "Jabiko 變化訓練場",
    appTagline: "短回合、立即訂正，把動詞與形容詞變化練到不用想太久。",
    themeLight: "淺色模式",
    themeDark: "深色模式",
    flowLabel: "學習流程",
    learn: "學習",
    challenge: "挑戰",
    learningRegion: "學習",
    studyBeforeRecall: "Study before recall",
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
    startChallenge: "開始挑戰",
    settingsLabel: "練習設定",
    todayPractice: "今日練習",
    practiceType: "練習類型",
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
      reading: "念法",
      plainPresentAffirmative: "普通形・非過去肯定",
      plainPresentNegative: "普通形・非過去否定",
      plainPastAffirmative: "普通形・過去肯定",
      plainPastNegative: "普通形・過去否定"
    },
    jlptLevel: "JLPT 級別",
    jlptLevels: {
      all: "全部",
      N5: "N5",
      N4: "N4",
      N3: "N3",
      N2: "N2",
      N1: "N1"
    },
    lessonCardFocus: ["て形 / た形音便", "ないで / なくて / なかった", "形容詞與名詞型"]
  },
  en: {
    languageName: "English",
    appIntroLabel: "App introduction",
    appTitle: "Jabiko Conjugation Trainer",
    appTagline: "Short drills, instant correction, and grammar feedback for Japanese conjugation.",
    themeLight: "Light mode",
    themeDark: "Dark mode",
    flowLabel: "Learning flow",
    learn: "Learn",
    challenge: "Challenge",
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
    startChallenge: "Start challenge",
    settingsLabel: "Practice settings",
    todayPractice: "Today's practice",
    practiceType: "Word type",
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
      reading: "Reading",
      plainPresentAffirmative: "Plain non-past affirmative",
      plainPresentNegative: "Plain non-past negative",
      plainPastAffirmative: "Plain past affirmative",
      plainPastNegative: "Plain past negative"
    },
    jlptLevel: "JLPT level",
    jlptLevels: {
      all: "All",
      N5: "N5",
      N4: "N4",
      N3: "N3",
      N2: "N2",
      N1: "N1"
    },
    lessonCardFocus: ["Te/Ta sound changes", "naide / nakute / nakatta", "Adjectives and noun-like forms"]
  },
  ko: {
    languageName: "한국어",
    appIntroLabel: "앱 소개",
    appTitle: "Jabiko 활용 연습장",
    appTagline: "짧은 연습, 즉시 채점, 규칙 피드백으로 일본어 활용을 익힙니다.",
    themeLight: "라이트 모드",
    themeDark: "다크 모드",
    flowLabel: "학습 흐름",
    learn: "학습",
    challenge: "도전",
    learningRegion: "학습",
    studyBeforeRecall: "Study before recall",
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
    startChallenge: "도전 시작",
    settingsLabel: "연습 설정",
    todayPractice: "오늘의 연습",
    practiceType: "연습 유형",
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
      reading: "읽는 법",
      plainPresentAffirmative: "보통형・현재 긍정",
      plainPresentNegative: "보통형・현재 부정",
      plainPastAffirmative: "보통형・과거 긍정",
      plainPastNegative: "보통형・과거 부정"
    },
    jlptLevel: "JLPT 등급",
    jlptLevels: {
      all: "전체",
      N5: "N5",
      N4: "N4",
      N3: "N3",
      N2: "N2",
      N1: "N1"
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
