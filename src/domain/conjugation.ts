import type { ConjugationResult, TargetForm, VocabularyItem } from "./types";

const GODAN_MASU_ENDINGS: Record<string, string> = {
  う: "います",
  く: "きます",
  ぐ: "ぎます",
  す: "します",
  つ: "ちます",
  ぬ: "にます",
  ぶ: "びます",
  む: "みます",
  る: "ります"
};

const GODAN_NAI_ENDINGS: Record<string, string> = {
  う: "わない",
  く: "かない",
  ぐ: "がない",
  す: "さない",
  つ: "たない",
  ぬ: "なない",
  ぶ: "ばない",
  む: "まない",
  る: "らない"
};

const GODAN_TE_ENDINGS: Record<string, string> = {
  う: "って",
  く: "いて",
  ぐ: "いで",
  す: "して",
  つ: "って",
  ぬ: "んで",
  ぶ: "んで",
  む: "んで",
  る: "って"
};

const GODAN_TA_ENDINGS: Record<string, string> = {
  う: "った",
  く: "いた",
  ぐ: "いだ",
  す: "した",
  つ: "った",
  ぬ: "んだ",
  ぶ: "んだ",
  む: "んだ",
  る: "った"
};

export const TARGET_FORM_LABELS: Record<TargetForm, string> = {
  dictionary: "辭書形",
  masu: "ます形",
  nai: "ない形",
  te: "て形",
  ta: "た形",
  plainPresentAffirmative: "普通形・非過去肯定",
  plainPresentNegative: "普通形・非過去否定",
  plainPastAffirmative: "普通形・過去肯定",
  plainPastNegative: "普通形・過去否定"
};

export const VERB_FORMS: TargetForm[] = [
  "dictionary",
  "masu",
  "nai",
  "te",
  "ta",
  "plainPresentAffirmative",
  "plainPresentNegative",
  "plainPastAffirmative",
  "plainPastNegative"
];

export const ADJECTIVE_FORMS: TargetForm[] = [
  "plainPresentAffirmative",
  "plainPresentNegative",
  "plainPastAffirmative",
  "plainPastNegative"
];

export function conjugate(item: VocabularyItem, targetForm: TargetForm): ConjugationResult {
  if (item.partOfSpeech === "verb") {
    return conjugateVerb(item, targetForm);
  }

  if (item.partOfSpeech === "i_adjective") {
    return conjugateIAdjective(item, targetForm);
  }

  return conjugateNaAdjective(item, targetForm);
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
      ta: "来た"
    };
    return forms[targetForm] ?? surface;
  }

  if (surface.endsWith("する")) {
    const stem = surface.slice(0, -2);
    const forms: Partial<Record<TargetForm, string>> = {
      masu: `${stem}します`,
      nai: `${stem}しない`,
      te: `${stem}して`,
      ta: `${stem}した`
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
    ta: GODAN_TA_ENDINGS
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
    plainPastAffirmative: [`${stem}かった`],
    plainPastNegative: [`${stem}くなかった`]
  };

  return {
    targetForm,
    answers: answersByForm[targetForm] ?? [item.surface],
    explanation: `い形容詞變化：去掉最後的「い」後，依目標形接「くない」「かった」或「くなかった」。`
  };
}

function conjugateNaAdjective(item: VocabularyItem, targetForm: TargetForm): ConjugationResult {
  const answersByForm: Partial<Record<TargetForm, string[]>> = {
    dictionary: [item.surface],
    plainPresentAffirmative: [`${item.surface}だ`],
    plainPresentNegative: [`${item.surface}ではない`, `${item.surface}じゃない`],
    plainPastAffirmative: [`${item.surface}だった`],
    plainPastNegative: [`${item.surface}ではなかった`, `${item.surface}じゃなかった`]
  };

  return {
    targetForm,
    answers: answersByForm[targetForm] ?? [item.surface],
    explanation: `な形容詞普通形要接「だ」「ではない」「だった」「ではなかった」。口語中也常用「じゃない」「じゃなかった」。`
  };
}

function explainVerb(item: VocabularyItem, targetForm: TargetForm): string {
  if (targetForm === "dictionary" || targetForm === "plainPresentAffirmative") {
    return "辭書形本身就是普通形的非過去肯定。";
  }

  if (item.group === "ichidan") {
    return `二類動詞先去掉最後的「る」，再接上${TARGET_FORM_LABELS[targetForm]}需要的語尾。`;
  }

  if (item.group === "irregular") {
    return "三類動詞是不規則變化，要直接記住「する / 来る」以及「名詞 + する」的形式。";
  }

  if (targetForm === "te" || targetForm === "ta") {
    return "一類動詞的て形 / た形會依最後一個假名產生音便，例如「く -> いて」、「む -> んで」、「す -> して」。";
  }

  if (targetForm === "nai" || targetForm === "plainPresentNegative" || targetForm === "plainPastNegative") {
    return "一類動詞ない形把最後一個假名換成あ段後接「ない」，但「う」要變成「わない」。";
  }

  return "一類動詞ます形把最後一個假名換成い段後接「ます」。";
}
