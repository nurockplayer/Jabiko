import {
  LOCALE_CODES,
  SOURCE_LOCALE,
  type ConjugationResult,
  type ContentLocale,
  type LocaleCode,
  type LocalizedText,
  type TargetForm,
  type VocabularyItem
} from "./types";

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

const GODAN_CONDITIONAL_ENDINGS: Record<string, string> = {
  る: "れば",
  う: "えば",
  く: "けば",
  ぐ: "げば",
  す: "せば",
  つ: "てば",
  ぬ: "ねば",
  ぶ: "べば",
  む: "めば"
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

const GODAN_DESIDERATIVE_ENDINGS: Record<string, string> = {
  る: "りたい",
  う: "いたい",
  く: "きたい",
  ぐ: "ぎたい",
  す: "したい",
  つ: "ちたい",
  ぬ: "にたい",
  ぶ: "びたい",
  む: "みたい"
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
  conditional: "假定形・ば",
  causative: "使役形",
  passive: "受身形",
  desiderative: "願望・たい形",
  reading: "念法",
  meaning: "意思",
  plainPresentAffirmative: "普通形・非過去肯定",
  plainPresentNegative: "普通形・非過去否定",
  plainPastAffirmative: "普通形・過去肯定",
  plainPastNegative: "普通形・過去否定"
};

// Per-CONTENT_LOCALE counterparts of TARGET_FORM_LABELS for localized
// explanations (#427). zh stays in TARGET_FORM_LABELS as the canonical source.
// Typed against the locale registry (#434): adding a code to CONTENT_LOCALES
// compile-forces a label for it in every entry here.
export const TARGET_FORM_LABELS_I18N: Record<TargetForm, Record<ContentLocale, string>> = {
  dictionary: { en: "dictionary form", ja: "辞書形" },
  masu: { en: "ます form", ja: "ます形" },
  nai: { en: "ない form", ja: "ない形" },
  negativeTe: { en: "negative て form (ないで)", ja: "否定て形・ないで" },
  negativeContinuative: { en: "negative connective (なくて)", ja: "否定接続・なくて" },
  adverbial: { en: "adverbial form (く/に)", ja: "連用修飾・く/に" },
  obligationPast: { en: "past obligation (なければならなかった)", ja: "必要過去・なければならなかった" },
  te: { en: "て form", ja: "て形" },
  ta: { en: "た form", ja: "た形" },
  potential: { en: "potential form", ja: "可能形" },
  volitional: { en: "volitional form", ja: "意向形" },
  conditional: { en: "conditional (ば form)", ja: "仮定形・ば形" },
  causative: { en: "causative form", ja: "使役形" },
  passive: { en: "passive form", ja: "受身形" },
  desiderative: { en: "desiderative (たい form)", ja: "願望・たい形" },
  reading: { en: "reading", ja: "読み方" },
  meaning: { en: "meaning", ja: "意味" },
  plainPresentAffirmative: { en: "plain non-past affirmative", ja: "普通形・非過去肯定" },
  plainPresentNegative: { en: "plain non-past negative", ja: "普通形・非過去否定" },
  plainPastAffirmative: { en: "plain past affirmative", ja: "普通形・過去肯定" },
  plainPastNegative: { en: "plain past negative", ja: "普通形・過去否定" }
};

/**
 * Explanation text for one drill. `zh` is the canonical source stored on
 * `explanation`; the locale keys feed `explanationI18n` (#427). Every
 * CONTENT_LOCALE is REQUIRED (so adding one to the registry compile-forces a
 * string in every template, #434); any other locale is optional, letting a
 * pilot language (#435) add strings without joining CONTENT_LOCALES. Absent
 * locales in the UI fall back via `pickLocalized`.
 */
type LocalizedExplanation = { zh: string } & Record<ContentLocale, string> &
  Partial<Record<LocaleCode, string>>;

function explained(targetForm: TargetForm, answers: string[], text: LocalizedExplanation): ConjugationResult {
  const explanationI18n: LocalizedText = {};
  for (const code of LOCALE_CODES) {
    if (code === SOURCE_LOCALE) continue; // zh-Hant is the source, not an overlay
    const value = text[code];
    if (typeof value === "string") explanationI18n[code] = value;
  }
  return { targetForm, answers, explanation: text.zh, explanationI18n };
}

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
  "conditional",
  "causative",
  "passive",
  "desiderative",
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
  "conditional",
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
  } else if (targetForm === "conditional") {
    pushRuleCandidates(candidates, stem, GODAN_CONDITIONAL_ENDINGS, "れば");
  } else if (targetForm === "causative") {
    pushRuleCandidates(candidates, stem, GODAN_CAUSATIVE_ENDINGS, "させる");
  } else if (targetForm === "passive") {
    pushRuleCandidates(candidates, stem, GODAN_PASSIVE_ENDINGS, "られる");
  } else if (targetForm === "desiderative") {
    pushRuleCandidates(candidates, stem, GODAN_DESIDERATIVE_ENDINGS, "たい");
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
    case "conditional":
      // The viral mis-teaching this drill inoculates against: applying the
      // i-adjective ければ (or the ない-form なければ) to a nominal, when
      // な形容詞/名詞 conditionals are simply 〜なら.
      out.push(`${base}ければ`, `${base}なければ`);
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
    case "conditional":
      // Nominal-rule-on-an-adjective mistake: 高なら instead of 高ければ.
      out.push(`${base}なら`, `${base}だなら`);
      break;
  }
}

// Adjectives whose surface ends in kana いい/よい from 良い and therefore
// conjugate on the よ stem (いい -> よければ). Deliberately a closed list: an
// ending match would wrongly catch かわいい-type words that merely end in
// いい. Kanji 良い is NOT here on purpose — its regular stem 良 already
// yields the correct 良ければ.
const YOI_DERIVED_ADJECTIVES = new Set([
  "いい",
  "よい",
  "かっこいい",
  "格好いい",
  "気持ちいい",
  "心地いい",
  "仲がいい",
  "頭がいい"
]);

export const VOCAB_FORMS: TargetForm[] = ["reading", "meaning"];

export function conjugate(item: VocabularyItem, targetForm: TargetForm): ConjugationResult {
  // Displayed glosses prefer the per-locale translation; the zh source is the
  // graceful fallback until vocab meaningI18n data lands. Answer logic never
  // localizes: the meaning drill's accepted answer stays meaningZh verbatim.
  const meaningEn = item.meaningI18n?.en ?? item.meaningZh;
  const meaningJa = item.meaningI18n?.ja ?? item.meaningZh;

  if (targetForm === "reading") {
    return explained(targetForm, [item.reading], {
      zh: `「${item.surface}」的念法是「${item.reading}」。意思：${item.meaningZh}。`,
      en: `「${item.surface}」 is read 「${item.reading}」. Meaning: ${meaningEn}.`,
      ja: `「${item.surface}」の読み方は「${item.reading}」です。意味：${meaningJa}。`
    });
  }

  if (targetForm === "meaning") {
    return explained(targetForm, [item.meaningZh], {
      zh: `「${item.surface}」（${item.reading}）的意思是「${item.meaningZh}」。`,
      en: `「${item.surface}」 (${item.reading}) means "${meaningEn}".`,
      ja: `「${item.surface}」（${item.reading}）の意味は「${meaningJa}」です。`
    });
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
  return explained(targetForm, verbAnswers(item, targetForm), explainVerb(item, targetForm));
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
    case "conditional":
      return "れば";
    case "causative":
      return "させる";
    case "passive":
      return "られる";
    case "desiderative":
      return "たい";
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
      conditional: "来れば",
      causative: "来させる",
      passive: "来られる",
      desiderative: "来たい"
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
      conditional: `${stem}すれば`,
      causative: `${stem}させる`,
      passive: `${stem}される`,
      desiderative: `${stem}したい`
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
    conditional: GODAN_CONDITIONAL_ENDINGS,
    causative: GODAN_CAUSATIVE_ENDINGS,
    passive: GODAN_PASSIVE_ENDINGS,
    desiderative: GODAN_DESIDERATIVE_ENDINGS
  };

  const replacement = maps[targetForm]?.[ending];

  if (!replacement) {
    return surface;
  }

  return stem + replacement;
}

function conjugateIAdjective(item: VocabularyItem, targetForm: TargetForm): ConjugationResult {
  const stem = item.surface.replace(/い$/, "");
  // 良い-derived adjectives conjugate on the よ stem: よければ, never いければ.
  // A controlled whitelist, NOT an ending match — かわいい ends in いい but is
  // its own word (かわいければ). The bank has no 良い word today; this guards
  // the rule for when one lands.
  const conditionalStem = YOI_DERIVED_ADJECTIVES.has(item.surface)
    ? item.surface.replace(/(いい|よい)$/, "よ")
    : stem;
  const answersByForm: Partial<Record<TargetForm, string[]>> = {
    dictionary: [item.surface],
    plainPresentAffirmative: [item.surface],
    plainPresentNegative: [`${stem}くない`],
    negativeContinuative: [`${stem}くなくて`],
    adverbial: [`${stem}く`],
    obligationPast: [`${stem}くならなければならなかった`],
    plainPastAffirmative: [`${stem}かった`],
    plainPastNegative: [`${stem}くなかった`],
    conditional: [`${conditionalStem}ければ`]
  };

  return explained(targetForm, answersByForm[targetForm] ?? [item.surface], explainIAdjective(targetForm));
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
    plainPastNegative: [`${item.surface}ではなかった`, `${item.surface}じゃなかった`],
    conditional: [`${item.surface}なら`]
  };

  return explained(targetForm, answersByForm[targetForm] ?? [item.surface], explainNominal(item, targetForm));
}

function explainVerb(item: VocabularyItem, targetForm: TargetForm): LocalizedExplanation {
  if (targetForm === "dictionary" || targetForm === "plainPresentAffirmative") {
    return {
      zh: "辭書形本身就是普通形的非過去肯定。",
      en: "The dictionary form is itself the plain non-past affirmative.",
      ja: "辞書形はそのまま普通形の非過去肯定として使えます。"
    };
  }

  if (targetForm === "plainPastNegative") {
    return {
      zh: "否定過去不是從た形變來，而是先做ない形，再把最後的「ない」換成「なかった」。",
      en: "The negative past is not built from the た form: make the ない form first, then replace the final 「ない」 with 「なかった」.",
      ja: "否定過去はた形からではなく、まずない形を作り、最後の「ない」を「なかった」に変えます。"
    };
  }

  if (targetForm === "obligationPast") {
    return {
      zh: "必要過去「なければならなかった」先做ない形，再把最後的「ない」換成「なければならなかった」。過去放在最後的「ならない -> ならなかった」。",
      en: "For 「なければならなかった」, make the ない form first, then replace the final 「ない」 with 「なければならなかった」. The past tense goes on the very end: 「ならない -> ならなかった」.",
      ja: "必要過去「なければならなかった」は、まずない形を作り、最後の「ない」を「なければならなかった」に変えます。過去は最後の「ならない → ならなかった」に付けます。"
    };
  }

  if (targetForm === "negativeTe") {
    return {
      zh: "否定て形「ないで」不是從て形變否定，而是先做ない形，再接成「ないで」。常用在「不要做...」或「不做...而...」。",
      en: "The negative て form 「ないで」 is not the て form made negative: make the ない form first, then attach 「で」. Common in \"please don't ...\" and \"do ... without doing ...\".",
      ja: "否定て形「ないで」はて形を否定にしたものではなく、まずない形を作ってから「ないで」の形にします。「〜しないでください」や「〜しないで…する」でよく使います。"
    };
  }

  if (targetForm === "negativeContinuative") {
    return {
      zh: "否定接續「なくて」也是先做ない形，再把最後的「ない」換成「なくて」。常用在說明理由或把否定狀態接到後句。",
      en: "The negative connective 「なくて」 also starts from the ない form: replace the final 「ない」 with 「なくて」. Often used to give a reason or link a negative state to the next clause.",
      ja: "否定接続「なくて」もまずない形を作り、最後の「ない」を「なくて」に変えます。理由を述べたり、否定の内容を後ろの文につなげたりするときに使います。"
    };
  }

  if (targetForm === "plainPastAffirmative") {
    if (item.group === "godan") {
      return {
        zh: "普通形過去肯定就是た形。一類動詞的た形會依最後一個假名產生音便，例如「く -> いた」、「む -> んだ」、「す -> した」。",
        en: "The plain past affirmative is the た form. Group I (godan) verbs take a sound change based on the final kana, e.g. 「く -> いた」, 「む -> んだ」, 「す -> した」.",
        ja: "普通形・過去肯定はた形です。五段動詞のた形は最後の仮名によって音便が起こります。例：「く → いた」「む → んだ」「す → した」。"
      };
    }

    if (item.group === "ichidan") {
      return {
        zh: "普通形過去肯定就是た形。二類動詞先去掉最後的「る」，再接「た」。",
        en: "The plain past affirmative is the た form. Group II (ichidan) verbs drop the final 「る」 and attach 「た」.",
        ja: "普通形・過去肯定はた形です。一段動詞は最後の「る」を取って「た」を付けます。"
      };
    }

    return {
      zh: "普通形過去肯定就是た形。三類動詞是不規則變化，要直接記住「する -> した」、「来る -> 来た」以及「名詞 + する -> 名詞 + した」。",
      en: "The plain past affirmative is the た form. Group III verbs are irregular — memorize 「する -> した」, 「来る -> 来た」, and noun + する -> noun + した.",
      ja: "普通形・過去肯定はた形です。不規則動詞はそのまま覚えましょう：「する → した」「来る → 来た」「名詞＋する → 名詞＋した」。"
    };
  }

  if (item.group === "ichidan") {
    const label = TARGET_FORM_LABELS_I18N[targetForm];
    return {
      zh: `二類動詞先去掉最後的「る」，再接上${TARGET_FORM_LABELS[targetForm]}需要的語尾。`,
      en: `Group II (ichidan) verbs drop the final 「る」 and attach the ending for the ${label.en}.`,
      ja: `一段動詞は最後の「る」を取って、${label.ja}の語尾を付けます。`
    };
  }

  if (item.group === "irregular") {
    if (targetForm === "potential") {
      return {
        zh: "「する」的可能形是不規則的「できる」；「来る」變成「来られる」（と同形於受身）。",
        en: "The potential of 「する」 is the irregular 「できる」; 「来る」 becomes 「来られる」 (same form as the passive).",
        ja: "「する」の可能形は不規則な「できる」です。「来る」は「来られる」になります（受身と同じ形）。"
      };
    }
    if (targetForm === "volitional") {
      return {
        zh: "「する」的意向形是「しよう」；「来る」變成「来よう」。",
        en: "The volitional of 「する」 is 「しよう」; 「来る」 becomes 「来よう」.",
        ja: "「する」の意向形は「しよう」、「来る」は「来よう」になります。"
      };
    }
    if (targetForm === "conditional") {
      return {
        zh: "「する」的假定形是「すれば」；「来る」變成「来れば」（讀作くれば）。",
        en: "The conditional of 「する」 is 「すれば」; 「来る」 becomes 「来れば」 (read くれば).",
        ja: "「する」の仮定形は「すれば」、「来る」は「来れば」（くれば）になります。"
      };
    }
    if (targetForm === "causative") {
      return {
        zh: "「する」的使役形是「させる」；「来る」變成「来させる」。注意「させる」與受身的「される」不同。",
        en: "The causative of 「する」 is 「させる」; 「来る」 becomes 「来させる」. Note that causative 「させる」 differs from passive 「される」.",
        ja: "「する」の使役形は「させる」、「来る」は「来させる」になります。使役の「させる」と受身の「される」を混同しないように注意しましょう。"
      };
    }
    if (targetForm === "passive") {
      return {
        zh: "「する」的受身形是「される」（與使役「させる」差一個假名）；「来る」變成「来られる」（與可能同形）。",
        en: "The passive of 「する」 is 「される」 (one kana away from causative 「させる」); 「来る」 becomes 「来られる」 (same form as the potential).",
        ja: "「する」の受身形は「される」です（使役の「させる」と一字違い）。「来る」は「来られる」になります（可能形と同じ形）。"
      };
    }
    return {
      zh: "三類動詞是不規則變化，要直接記住「する / 来る」以及「名詞 + する」的形式。",
      en: "Group III verbs are irregular — memorize the forms of 「する」, 「来る」, and noun + する directly.",
      ja: "不規則動詞は「する」「来る」「名詞＋する」の形をそのまま覚えましょう。"
    };
  }

  if (targetForm === "te" || targetForm === "ta") {
    return {
      zh: "一類動詞的て形 / た形會依最後一個假名產生音便，例如「く -> いて」、「む -> んで」、「す -> して」。",
      en: "The て / た forms of group I (godan) verbs take a sound change based on the final kana, e.g. 「く -> いて」, 「む -> んで」, 「す -> して」.",
      ja: "五段動詞のて形・た形は最後の仮名によって音便が起こります。例：「く → いて」「む → んで」「す → して」。"
    };
  }

  if (targetForm === "nai" || targetForm === "plainPresentNegative") {
    return {
      zh: "一類動詞ない形把最後一個假名換成あ段後接「ない」，但「う」要變成「わない」。",
      en: "For the ない form of group I (godan) verbs, change the final kana to its あ row and attach 「ない」; 「う」 becomes 「わない」.",
      ja: "五段動詞のない形は最後の仮名をあ段に変えて「ない」を付けます。ただし「う」は「わない」になります。"
    };
  }

  if (targetForm === "potential") {
    return {
      zh: "一類動詞可能形把最後一個假名換成え段後接「る」，例如「書く -> 書ける」、「読む -> 読める」。",
      en: "For the potential form of group I (godan) verbs, change the final kana to its え row and attach 「る」, e.g. 「書く -> 書ける」, 「読む -> 読める」.",
      ja: "五段動詞の可能形は最後の仮名をえ段に変えて「る」を付けます。例：「書く → 書ける」「読む → 読める」。"
    };
  }

  if (targetForm === "volitional") {
    return {
      zh: "一類動詞意向形把最後一個假名換成お段後接「う」，例如「書く -> 書こう」、「読む -> 読もう」。",
      en: "For the volitional form of group I (godan) verbs, change the final kana to its お row and attach 「う」, e.g. 「書く -> 書こう」, 「読む -> 読もう」.",
      ja: "五段動詞の意向形は最後の仮名をお段に変えて「う」を付けます。例：「書く → 書こう」「読む → 読もう」。"
    };
  }

  if (targetForm === "conditional") {
    return {
      zh: "一類動詞假定形（ば形）把最後一個假名換成え段後接「ば」，例如「書く -> 書けば」、「読む -> 読めば」。",
      en: "For the conditional (ば form) of group I (godan) verbs, change the final kana to its え row and attach 「ば」, e.g. 「書く -> 書けば」, 「読む -> 読めば」.",
      ja: "五段動詞の仮定形（ば形）は最後の仮名をえ段に変えて「ば」を付けます。例：「書く → 書けば」「読む → 読めば」。"
    };
  }

  if (targetForm === "causative") {
    return {
      zh: "一類動詞使役形把最後一個假名換成あ段後接「せる」，例如「書く -> 書かせる」、「読む -> 読ませる」。う結尾要變「わせる」。",
      en: "For the causative form of group I (godan) verbs, change the final kana to its あ row and attach 「せる」, e.g. 「書く -> 書かせる」, 「読む -> 読ませる」; 「う」 becomes 「わせる」.",
      ja: "五段動詞の使役形は最後の仮名をあ段に変えて「せる」を付けます。例：「書く → 書かせる」「読む → 読ませる」。「う」で終わる動詞は「わせる」になります。"
    };
  }

  if (targetForm === "passive") {
    return {
      zh: "一類動詞受身形把最後一個假名換成あ段後接「れる」，例如「書く -> 書かれる」、「読む -> 読まれる」。う結尾要變「われる」。注意二類動詞的受身與可能同形。",
      en: "For the passive form of group I (godan) verbs, change the final kana to its あ row and attach 「れる」, e.g. 「書く -> 書かれる」, 「読む -> 読まれる」; 「う」 becomes 「われる」. Note that for group II verbs the passive and potential share the same form.",
      ja: "五段動詞の受身形は最後の仮名をあ段に変えて「れる」を付けます。例：「書く → 書かれる」「読む → 読まれる」。「う」で終わる動詞は「われる」になります。一段動詞では受身と可能が同じ形になる点に注意しましょう。"
    };
  }

  if (targetForm === "desiderative") {
    return {
      zh: "願望形（〜たい）等於ます形把「ます」換成「たい」：書く -> 書きたい、食べる -> 食べたい、する -> したい。",
      en: "The desiderative 「〜たい」 is the ます form with 「ます」 replaced by 「たい」: 書く -> 書きたい, 食べる -> 食べたい, する -> したい.",
      ja: "願望の「〜たい」はます形の「ます」を「たい」に変えた形です：書く → 書きたい、食べる → 食べたい、する → したい。"
    };
  }

  return {
    zh: "一類動詞ます形把最後一個假名換成い段後接「ます」。",
    en: "For the ます form of group I (godan) verbs, change the final kana to its い row and attach 「ます」.",
    ja: "五段動詞のます形は最後の仮名をい段に変えて「ます」を付けます。"
  };
}

function explainIAdjective(targetForm: TargetForm): LocalizedExplanation {
  if (targetForm === "adverbial") {
    return {
      zh: "い形容詞修飾動詞時，去掉最後的「い」，接「く」。",
      en: "When an い adjective modifies a verb, drop the final 「い」 and attach 「く」.",
      ja: "い形容詞が動詞を修飾するときは、最後の「い」を取って「く」を付けます。"
    };
  }

  if (targetForm === "obligationPast") {
    return {
      zh: "い形容詞要先變成「くなる」的否定必要形：去い加く，再接「ならなければならなかった」。",
      en: "An い adjective first becomes 「くなる」: drop 「い」, add 「く」, then attach 「ならなければならなかった」.",
      ja: "い形容詞はまず「くなる」の形にします：「い」を取って「く」を付け、「ならなければならなかった」を続けます。"
    };
  }

  if (targetForm === "plainPresentNegative") {
    return {
      zh: "い形容詞否定：去掉最後的「い」，接「くない」。",
      en: "い adjective negative: drop the final 「い」 and attach 「くない」.",
      ja: "い形容詞の否定は最後の「い」を取って「くない」を付けます。"
    };
  }

  if (targetForm === "negativeContinuative") {
    return {
      zh: "い形容詞否定接續：先變「くない」，再把「ない」換成「なくて」。",
      en: "い adjective negative connective: make 「くない」 first, then replace 「ない」 with 「なくて」.",
      ja: "い形容詞の否定接続は、まず「くない」にしてから「ない」を「なくて」に変えます。"
    };
  }

  if (targetForm === "plainPastAffirmative") {
    return {
      zh: "い形容詞過去：去掉最後的「い」，接「かった」。",
      en: "い adjective past: drop the final 「い」 and attach 「かった」.",
      ja: "い形容詞の過去は最後の「い」を取って「かった」を付けます。"
    };
  }

  if (targetForm === "plainPastNegative") {
    return {
      zh: "い形容詞否定過去：去掉最後的「い」，接「くなかった」。",
      en: "い adjective negative past: drop the final 「い」 and attach 「くなかった」.",
      ja: "い形容詞の否定過去は最後の「い」を取って「くなかった」を付けます。"
    };
  }

  if (targetForm === "conditional") {
    return {
      zh: "い形容詞假定形：去掉最後的「い」，接「ければ」（高い -> 高ければ）。「いい」要走「よ」：よければ。",
      en: "い adjective conditional: drop the final 「い」 and attach 「ければ」 (高い -> 高ければ). 「いい」 uses the よ stem: よければ.",
      ja: "い形容詞の仮定形は最後の「い」を取って「ければ」を付けます（高い → 高ければ）。「いい」は「よ」で活用します：よければ。"
    };
  }

  return {
    zh: "い形容詞現在肯定直接使用原形。",
    en: "The plain present affirmative of an い adjective is just its dictionary form.",
    ja: "い形容詞の現在肯定はそのままの形を使います。"
  };
}

function explainNominal(item: VocabularyItem, targetForm: TargetForm): LocalizedExplanation {
  const label = item.partOfSpeech === "noun" ? "名詞" : "な形容詞";
  // 名詞/な形容詞 read naturally in Japanese as-is; only English needs its own label.
  const labelEn = item.partOfSpeech === "noun" ? "nouns" : "な adjectives";

  if (targetForm === "plainPresentNegative") {
    return {
      zh: `${label}否定像名詞句一樣接「ではない」，口語也常用「じゃない」。`,
      en: `The negative of ${labelEn} attaches 「ではない」 like a noun sentence; 「じゃない」 is common in speech.`,
      ja: `${label}の否定は名詞文と同じように「ではない」を付けます。話し言葉では「じゃない」もよく使います。`
    };
  }

  if (targetForm === "adverbial") {
    return {
      zh: `${label}修飾動詞時接「に」，例如「静かに話す」「学生になる」。`,
      en: `When ${labelEn} modify a verb, attach 「に」, e.g. 「静かに話す」「学生になる」.`,
      ja: `${label}が動詞を修飾するときは「に」を付けます。例：「静かに話す」「学生になる」。`
    };
  }

  if (targetForm === "obligationPast") {
    return {
      zh: `${label}要先接「に」進入「なる」：${label} + に + ならなければならなかった。過去只放在最後的「ならなかった」。`,
      en: `${labelEn === "nouns" ? "Nouns" : "な adjectives"} first take 「に」 before 「なる」: ${labelEn} + に + ならなければならなかった. The past tense goes only on the final 「ならなかった」.`,
      ja: `${label}はまず「に」を付けて「なる」につなげます：${label}＋に＋ならなければならなかった。過去は最後の「ならなかった」だけに付けます。`
    };
  }

  if (targetForm === "negativeContinuative") {
    return {
      zh: `${label}否定接續像名詞句一樣接「ではなくて」，口語也常用「じゃなくて」。`,
      en: `The negative connective of ${labelEn} attaches 「ではなくて」 like a noun sentence; 「じゃなくて」 is common in speech.`,
      ja: `${label}の否定接続は名詞文と同じように「ではなくて」です。話し言葉では「じゃなくて」もよく使います。`
    };
  }

  if (targetForm === "plainPastAffirmative") {
    return {
      zh: `${label}過去肯定要接「だった」，不是接い形容詞的「かった」。`,
      en: `The past affirmative of ${labelEn} is 「だった」 — not the い-adjective ending 「かった」.`,
      ja: `${label}の過去肯定は「だった」を付けます。い形容詞の「かった」ではありません。`
    };
  }

  if (targetForm === "plainPastNegative") {
    return {
      zh: `${label}否定過去接「ではなかった」，口語也常用「じゃなかった」。`,
      en: `The negative past of ${labelEn} is 「ではなかった」; 「じゃなかった」 is common in speech.`,
      ja: `${label}の否定過去は「ではなかった」です。話し言葉では「じゃなかった」もよく使います。`
    };
  }

  if (targetForm === "conditional") {
    return {
      zh: `${label}的肯定條件直接接「なら」（静か -> 静かなら、学生 -> 学生なら），不能直接接「なければ」。要說否定條件時先變「ではない」再變「でなければ」（静かでなければ）。`,
      en: `The affirmative conditional of ${labelEn} simply attaches 「なら」 (静か -> 静かなら, 学生 -> 学生なら) — never 「なければ」 directly. For a negative condition, make 「ではない」 first, then 「でなければ」 (静かでなければ).`,
      ja: `${label}の肯定の条件はそのまま「なら」を付けます（静か → 静かなら、学生 → 学生なら）。直接「なければ」にはなりません。否定の条件はまず「ではない」にしてから「でなければ」（静かでなければ）にします。`
    };
  }

  return {
    zh: `${label}普通形現在肯定要接「だ」。`,
    en: `The plain present affirmative of ${labelEn} attaches 「だ」.`,
    ja: `${label}の普通形・現在肯定は「だ」を付けます。`
  };
}
