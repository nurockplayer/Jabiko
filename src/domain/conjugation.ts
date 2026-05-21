import type { ConjugationResult, TargetForm, VocabularyItem } from "./types";

// Keys are ordered so る comes first. When rule candidates are generated for an
// ichidan verb (all of which end in る) the godan-style "wrong rule" attempt --
// the classic ら抜き / godan-as-ichidan mistake -- lands in the first distractor
// slot.
const GODAN_MASU_ENDINGS: Record<string, string> = {
  る: "ります",
  う: "います",
  く: "きます",
  ぐ: "ぎます",
  す: "します",
  つ: "ちます",
  ぬ: "にます",
  ぶ: "びます",
  む: "みます"
};

const GODAN_NAI_ENDINGS: Record<string, string> = {
  る: "らない",
  う: "わない",
  く: "かない",
  ぐ: "がない",
  す: "さない",
  つ: "たない",
  ぬ: "なない",
  ぶ: "ばない",
  む: "まない"
};

const GODAN_TE_ENDINGS: Record<string, string> = {
  る: "って",
  う: "って",
  く: "いて",
  ぐ: "いで",
  す: "して",
  つ: "って",
  ぬ: "んで",
  ぶ: "んで",
  む: "んで"
};

const GODAN_TA_ENDINGS: Record<string, string> = {
  る: "った",
  う: "った",
  く: "いた",
  ぐ: "いだ",
  す: "した",
  つ: "った",
  ぬ: "んだ",
  ぶ: "んだ",
  む: "んだ"
};

const GODAN_POTENTIAL_ENDINGS: Record<string, string> = {
  る: "れる",
  う: "える",
  く: "ける",
  ぐ: "げる",
  す: "せる",
  つ: "てる",
  ぬ: "ねる",
  ぶ: "べる",
  む: "める"
};

const GODAN_VOLITIONAL_ENDINGS: Record<string, string> = {
  る: "ろう",
  う: "おう",
  く: "こう",
  ぐ: "ごう",
  す: "そう",
  つ: "とう",
  ぬ: "のう",
  ぶ: "ぼう",
  む: "もう"
};

const GODAN_CAUSATIVE_ENDINGS: Record<string, string> = {
  る: "らせる",
  う: "わせる",
  く: "かせる",
  ぐ: "がせる",
  す: "させる",
  つ: "たせる",
  ぬ: "なせる",
  ぶ: "ばせる",
  む: "ませる"
};

const GODAN_PASSIVE_ENDINGS: Record<string, string> = {
  る: "られる",
  う: "われる",
  く: "かれる",
  ぐ: "がれる",
  す: "される",
  つ: "たれる",
  ぬ: "なれる",
  ぶ: "ばれる",
  む: "まれる"
};

export const TARGET_FORM_LABELS: Record<TargetForm, string> = {
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
  reading: "念法",
  plainPresentAffirmative: "普通形・非過去肯定",
  plainPresentNegative: "普通形・非過去否定",
  plainPastAffirmative: "普通形・過去肯定",
  plainPastNegative: "普通形・過去否定"
};

export const VERB_FORMS: TargetForm[] = [
  "dictionary",
  "masu",
  "nai",
  "negativeTe",
  "negativeContinuative",
  "te",
  "ta",
  "potential",
  "volitional",
  "causative",
  "passive",
  "plainPresentAffirmative",
  "plainPresentNegative",
  "plainPastAffirmative",
  "plainPastNegative",
  "obligationPast"
];

export const ADJECTIVE_FORMS: TargetForm[] = [
  "plainPresentAffirmative",
  "plainPresentNegative",
  "negativeContinuative",
  "plainPastAffirmative",
  "plainPastNegative",
  "adverbial",
  "obligationPast"
];

const NAI_DERIVED_SUFFIX: Partial<Record<TargetForm, string>> = {
  negativeTe: "ないで",
  negativeContinuative: "なくて",
  plainPastNegative: "なかった",
  obligationPast: "なければならなかった"
};

export function generateVerbRuleCandidates(surface: string, targetForm: TargetForm): string[] {
  if (targetForm === "plainPresentNegative") {
    return generateVerbRuleCandidates(surface, "nai");
  }

  if (targetForm === "plainPastAffirmative") {
    return generateVerbRuleCandidates(surface, "ta");
  }

  if (targetForm === "dictionary" || targetForm === "plainPresentAffirmative") {
    return [surface];
  }

  const stem = surface.slice(0, -1);
  const candidates: string[] = [];

  if (targetForm === "te") {
    pushRuleCandidates(candidates, stem, GODAN_TE_ENDINGS, "て");
  } else if (targetForm === "ta") {
    pushRuleCandidates(candidates, stem, GODAN_TA_ENDINGS, "た");
  } else if (targetForm === "masu") {
    pushRuleCandidates(candidates, stem, GODAN_MASU_ENDINGS, "ます");
  } else if (targetForm === "nai") {
    pushRuleCandidates(candidates, stem, GODAN_NAI_ENDINGS, "ない");
  } else if (targetForm === "potential") {
    pushRuleCandidates(candidates, stem, GODAN_POTENTIAL_ENDINGS, "られる");
  } else if (targetForm === "volitional") {
    pushRuleCandidates(candidates, stem, GODAN_VOLITIONAL_ENDINGS, "よう");
  } else if (targetForm === "causative") {
    pushRuleCandidates(candidates, stem, GODAN_CAUSATIVE_ENDINGS, "させる");
  } else if (targetForm === "passive") {
    pushRuleCandidates(candidates, stem, GODAN_PASSIVE_ENDINGS, "られる");
  } else {
    const suffix = NAI_DERIVED_SUFFIX[targetForm];
    if (!suffix) {
      return [];
    }

    candidates.push(stem + suffix);
    for (const transform of Object.values(GODAN_NAI_ENDINGS)) {
      candidates.push(stem + transform.replace(/ない$/, suffix));
    }
  }

  return Array.from(new Set(candidates));
}

function pushRuleCandidates(
  out: string[],
  stem: string,
  endings: Record<string, string>,
  ichidanSuffix: string
): void {
  out.push(stem + ichidanSuffix);
  for (const transform of Object.values(endings)) {
    out.push(stem + transform);
  }
}

export function generateAdjectiveRuleCandidates(item: VocabularyItem, targetForm: TargetForm): string[] {
  if (item.partOfSpeech === "verb") {
    return [];
  }

  const candidates: string[] = [];

  if (item.partOfSpeech === "i_adjective") {
    const stem = item.surface.replace(/い$/, "");
    pushNominalLikeCandidates(candidates, stem, targetForm);
  } else {
    pushIAdjectiveLikeCandidates(candidates, item.surface, targetForm);
  }

  return Array.from(new Set(candidates));
}

function pushIAdjectiveLikeCandidates(out: string[], base: string, targetForm: TargetForm): void {
  switch (targetForm) {
    case "plainPresentNegative":
      out.push(`${base}くない`);
      break;
    case "plainPastAffirmative":
      out.push(`${base}かった`);
      break;
    case "plainPastNegative":
      out.push(`${base}くなかった`);
      break;
    case "negativeContinuative":
      out.push(`${base}くなくて`);
      break;
    case "adverbial":
      out.push(`${base}く`);
      break;
    case "obligationPast":
      out.push(`${base}くならなければならなかった`);
      break;
  }
}

function pushNominalLikeCandidates(out: string[], base: string, targetForm: TargetForm): void {
  switch (targetForm) {
    case "plainPresentAffirmative":
      out.push(`${base}だ`);
      break;
    case "plainPresentNegative":
      out.push(`${base}ではない`, `${base}じゃない`);
      break;
    case "plainPastAffirmative":
      out.push(`${base}だった`);
      break;
    case "plainPastNegative":
      out.push(`${base}ではなかった`, `${base}じゃなかった`);
      break;
    case "negativeContinuative":
      out.push(`${base}ではなくて`, `${base}じゃなくて`);
      break;
    case "adverbial":
      out.push(`${base}に`);
      break;
    case "obligationPast":
      out.push(`${base}にならなければならなかった`);
      break;
  }
}

export const VOCAB_FORMS: TargetForm[] = ["reading"];

export function conjugate(item: VocabularyItem, targetForm: TargetForm): ConjugationResult {
  if (targetForm === "reading") {
    return {
      targetForm,
      answers: [item.reading],
      explanation: `「${item.surface}」的念法是「${item.reading}」。意思：${item.meaningZh}。`
    };
  }

  if (item.partOfSpeech === "verb") {
    return conjugateVerb(item, targetForm);
  }

  if (item.partOfSpeech === "i_adjective") {
    return conjugateIAdjective(item, targetForm);
  }

  return conjugateNominal(item, targetForm);
}

export function getRuleExplanation(item: VocabularyItem, targetForm: TargetForm): string {
  return conjugate(item, targetForm).explanation;
}

export function normalizeAnswer(answer: string): string {
  return answer.replace(/\u3000/g, " ").trim().replace(/[。.]$/, "");
}

export function validateAnswer(submittedAnswer: string, expectedAnswers: string[]): boolean {
  const normalized = normalizeAnswer(submittedAnswer);
  return expectedAnswers.some((answer) => normalizeAnswer(answer) === normalized);
}

function conjugateVerb(item: VocabularyItem, targetForm: TargetForm): ConjugationResult {
  const answers = verbAnswers(item, targetForm);
  return {
    targetForm,
    answers,
    explanation: explainVerb(item, targetForm)
  };
}

function verbAnswers(item: VocabularyItem, targetForm: TargetForm): string[] {
  if (targetForm === "dictionary" || targetForm === "plainPresentAffirmative") {
    return [item.surface];
  }

  if (targetForm === "plainPresentNegative") {
    return verbAnswers(item, "nai");
  }

  if (targetForm === "plainPastAffirmative") {
    return verbAnswers(item, "ta");
  }

  if (targetForm === "plainPastNegative") {
    return [verbAnswers(item, "nai")[0].replace(/ない$/, "なかった")];
  }

  if (targetForm === "obligationPast") {
    return [verbAnswers(item, "nai")[0].replace(/ない$/, "なければならなかった")];
  }

  if (targetForm === "negativeTe") {
    return [verbAnswers(item, "nai")[0].replace(/ない$/, "ないで")];
  }

  if (targetForm === "negativeContinuative") {
    return [verbAnswers(item, "nai")[0].replace(/ない$/, "なくて")];
  }

  if (item.group === "ichidan") {
    return [ichidanStem(item.surface) + ichidanEnding(targetForm)];
  }

  if (item.group === "irregular") {
    return [irregularAnswer(item.surface, targetForm)];
  }

  return [godanAnswer(item.surface, targetForm)];
}

function ichidanStem(surface: string): string {
  return surface.replace(/る$/, "");
}

function ichidanEnding(targetForm: TargetForm): string {
  switch (targetForm) {
    case "masu":
      return "ます";
    case "nai":
      return "ない";
    case "te":
      return "て";
    case "ta":
      return "た";
    case "potential":
      return "られる";
    case "volitional":
      return "よう";
    case "causative":
      return "させる";
    case "passive":
      return "られる";
    default:
      return "";
  }
}

function irregularAnswer(surface: string, targetForm: TargetForm): string {
  if (surface === "来る") {
    const forms: Partial<Record<TargetForm, string>> = {
      masu: "来ます",
      nai: "来ない",
      te: "来て",
      ta: "来た",
      potential: "来られる",
      volitional: "来よう",
      causative: "来させる",
      passive: "来られる"
    };
    return forms[targetForm] ?? surface;
  }

  if (surface.endsWith("する")) {
    const stem = surface.slice(0, -2);
    const forms: Partial<Record<TargetForm, string>> = {
      masu: `${stem}します`,
      nai: `${stem}しない`,
      te: `${stem}して`,
      ta: `${stem}した`,
      potential: `${stem}できる`,
      volitional: `${stem}しよう`,
      causative: `${stem}させる`,
      passive: `${stem}される`
    };
    return forms[targetForm] ?? surface;
  }

  return surface;
}

function godanAnswer(surface: string, targetForm: TargetForm): string {
  const stem = surface.slice(0, -1);
  const ending = surface.slice(-1);

  if (surface === "行く" && targetForm === "te") {
    return "行って";
  }

  if (surface === "行く" && targetForm === "ta") {
    return "行った";
  }

  const maps: Partial<Record<TargetForm, Record<string, string>>> = {
    masu: GODAN_MASU_ENDINGS,
    nai: GODAN_NAI_ENDINGS,
    te: GODAN_TE_ENDINGS,
    ta: GODAN_TA_ENDINGS,
    potential: GODAN_POTENTIAL_ENDINGS,
    volitional: GODAN_VOLITIONAL_ENDINGS,
    causative: GODAN_CAUSATIVE_ENDINGS,
    passive: GODAN_PASSIVE_ENDINGS
  };

  const replacement = maps[targetForm]?.[ending];

  if (!replacement) {
    return surface;
  }

  return stem + replacement;
}

function conjugateIAdjective(item: VocabularyItem, targetForm: TargetForm): ConjugationResult {
  const stem = item.surface.replace(/い$/, "");
  const answersByForm: Partial<Record<TargetForm, string[]>> = {
    dictionary: [item.surface],
    plainPresentAffirmative: [item.surface],
    plainPresentNegative: [`${stem}くない`],
    negativeContinuative: [`${stem}くなくて`],
    adverbial: [`${stem}く`],
    obligationPast: [`${stem}くならなければならなかった`],
    plainPastAffirmative: [`${stem}かった`],
    plainPastNegative: [`${stem}くなかった`]
  };

  return {
    targetForm,
    answers: answersByForm[targetForm] ?? [item.surface],
    explanation: explainIAdjective(targetForm)
  };
}

function conjugateNominal(item: VocabularyItem, targetForm: TargetForm): ConjugationResult {
  const answersByForm: Partial<Record<TargetForm, string[]>> = {
    dictionary: [item.surface],
    plainPresentAffirmative: [`${item.surface}だ`],
    plainPresentNegative: [`${item.surface}ではない`, `${item.surface}じゃない`],
    negativeContinuative: [`${item.surface}ではなくて`, `${item.surface}じゃなくて`],
    adverbial: [`${item.surface}に`],
    obligationPast: [`${item.surface}にならなければならなかった`],
    plainPastAffirmative: [`${item.surface}だった`],
    plainPastNegative: [`${item.surface}ではなかった`, `${item.surface}じゃなかった`]
  };

  return {
    targetForm,
    answers: answersByForm[targetForm] ?? [item.surface],
    explanation: explainNominal(item, targetForm)
  };
}

function explainVerb(item: VocabularyItem, targetForm: TargetForm): string {
  if (targetForm === "dictionary" || targetForm === "plainPresentAffirmative") {
    return "辭書形本身就是普通形的非過去肯定。";
  }

  if (targetForm === "plainPastNegative") {
    return "否定過去不是從た形變來，而是先做ない形，再把最後的「ない」換成「なかった」。";
  }

  if (targetForm === "obligationPast") {
    return "必要過去「なければならなかった」先做ない形，再把最後的「ない」換成「なければならなかった」。過去放在最後的「ならない -> ならなかった」。";
  }

  if (targetForm === "negativeTe") {
    return "否定て形「ないで」不是從て形變否定，而是先做ない形，再接成「ないで」。常用在「不要做...」或「不做...而...」。";
  }

  if (targetForm === "negativeContinuative") {
    return "否定接續「なくて」也是先做ない形，再把最後的「ない」換成「なくて」。常用在說明理由或把否定狀態接到後句。";
  }

  if (item.group === "ichidan") {
    return `二類動詞先去掉最後的「る」，再接上${TARGET_FORM_LABELS[targetForm]}需要的語尾。`;
  }

  if (item.group === "irregular") {
    if (targetForm === "potential") {
      return "「する」的可能形是不規則的「できる」；「来る」變成「来られる」（と同形於受身）。";
    }
    if (targetForm === "volitional") {
      return "「する」的意向形是「しよう」；「来る」變成「来よう」。";
    }
    if (targetForm === "causative") {
      return "「する」的使役形是「させる」；「来る」變成「来させる」。注意「させる」與受身的「される」不同。";
    }
    if (targetForm === "passive") {
      return "「する」的受身形是「される」（與使役「させる」差一個假名）；「来る」變成「来られる」（與可能同形）。";
    }
    return "三類動詞是不規則變化，要直接記住「する / 来る」以及「名詞 + する」的形式。";
  }

  if (targetForm === "te" || targetForm === "ta") {
    return "一類動詞的て形 / た形會依最後一個假名產生音便，例如「く -> いて」、「む -> んで」、「す -> して」。";
  }

  if (targetForm === "nai" || targetForm === "plainPresentNegative") {
    return "一類動詞ない形把最後一個假名換成あ段後接「ない」，但「う」要變成「わない」。";
  }

  if (targetForm === "potential") {
    return "一類動詞可能形把最後一個假名換成え段後接「る」，例如「書く -> 書ける」、「読む -> 読める」。";
  }

  if (targetForm === "volitional") {
    return "一類動詞意向形把最後一個假名換成お段後接「う」，例如「書く -> 書こう」、「読む -> 読もう」。";
  }

  if (targetForm === "causative") {
    return "一類動詞使役形把最後一個假名換成あ段後接「せる」，例如「書く -> 書かせる」、「読む -> 読ませる」。う結尾要變「わせる」。";
  }

  if (targetForm === "passive") {
    return "一類動詞受身形把最後一個假名換成あ段後接「れる」，例如「書く -> 書かれる」、「読む -> 読まれる」。う結尾要變「われる」。注意二類動詞的受身與可能同形。";
  }

  return "一類動詞ます形把最後一個假名換成い段後接「ます」。";
}

function explainIAdjective(targetForm: TargetForm): string {
  if (targetForm === "adverbial") {
    return "い形容詞修飾動詞時，去掉最後的「い」，接「く」。";
  }

  if (targetForm === "obligationPast") {
    return "い形容詞要先變成「くなる」的否定必要形：去い加く，再接「ならなければならなかった」。";
  }

  if (targetForm === "plainPresentNegative") {
    return "い形容詞否定：去掉最後的「い」，接「くない」。";
  }

  if (targetForm === "negativeContinuative") {
    return "い形容詞否定接續：先變「くない」，再把「ない」換成「なくて」。";
  }

  if (targetForm === "plainPastAffirmative") {
    return "い形容詞過去：去掉最後的「い」，接「かった」。";
  }

  if (targetForm === "plainPastNegative") {
    return "い形容詞否定過去：去掉最後的「い」，接「くなかった」。";
  }

  return "い形容詞現在肯定直接使用原形。";
}

function explainNominal(item: VocabularyItem, targetForm: TargetForm): string {
  const label = item.partOfSpeech === "noun" ? "名詞" : "な形容詞";

  if (targetForm === "plainPresentNegative") {
    return `${label}否定像名詞句一樣接「ではない」，口語也常用「じゃない」。`;
  }

  if (targetForm === "adverbial") {
    return `${label}修飾動詞時接「に」，例如「静かに話す」「学生になる」。`;
  }

  if (targetForm === "obligationPast") {
    return `${label}要先接「に」進入「なる」：${label} + に + ならなければならなかった。過去只放在最後的「ならなかった」。`;
  }

  if (targetForm === "negativeContinuative") {
    return `${label}否定接續像名詞句一樣接「ではなくて」，口語也常用「じゃなくて」。`;
  }

  if (targetForm === "plainPastAffirmative") {
    return `${label}過去肯定要接「だった」，不是接い形容詞的「かった」。`;
  }

  if (targetForm === "plainPastNegative") {
    return `${label}否定過去接「ではなかった」，口語也常用「じゃなかった」。`;
  }

  return `${label}普通形現在肯定要接「だ」。`;
}
