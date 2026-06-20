// Generates "looks right but wrong" reading distractors by perturbing the
// correct reading along the axes JLPT learners actually confuse:
//   - voicing: 清 vs 濁 vs 半濁  (か/が, さ/ざ, は/ば/ぱ ...)
//   - long vowel: こう vs こ, せい vs せ
//   - gemination: がっこう vs がこう
//
// These are far more confusing than "some other word's reading" because
// they differ from the answer by exactly the feature being tested. Used
// as the primary distractor source for reading drills (the pool is only a
// top-up when a short reading yields too few perturbations).

// Single-mora voicing swaps, in BOTH directions (清→濁/半濁 and back), so
// a correct reading that is already voiced (がっこう) still yields a
// de-voiced confuser (かっこう).
const VOICE_VARIANTS: Record<string, string[]> = {
  か: ["が"], き: ["ぎ"], く: ["ぐ"], け: ["げ"], こ: ["ご"],
  さ: ["ざ"], し: ["じ"], す: ["ず"], せ: ["ぜ"], そ: ["ぞ"],
  た: ["だ"], ち: ["ぢ"], つ: ["づ"], て: ["で"], と: ["ど"],
  は: ["ば", "ぱ"], ひ: ["び", "ぴ"], ふ: ["ぶ", "ぷ"], へ: ["べ", "ぺ"], ほ: ["ぼ", "ぽ"],
  が: ["か"], ぎ: ["き"], ぐ: ["く"], げ: ["け"], ご: ["こ"],
  ざ: ["さ"], じ: ["し"], ず: ["す"], ぜ: ["せ"], ぞ: ["そ"],
  だ: ["た"], ぢ: ["ち"], づ: ["つ"], で: ["て"], ど: ["と"],
  ば: ["は", "ぱ"], び: ["ひ", "ぴ"], ぶ: ["ふ", "ぷ"], べ: ["へ", "ぺ"], ぼ: ["ほ", "ぽ"],
  ぱ: ["は", "ば"], ぴ: ["ひ", "び"], ぷ: ["ふ", "ぶ"], ぺ: ["へ", "べ"], ぽ: ["ほ", "ぼ"]
};

/**
 * Confusable variants of `reading`, excluding the reading itself and any
 * member of `exclude` (pass the question's accepted answers so a variant
 * can never coincide with the correct reading). Order is deterministic;
 * the caller samples from it with a stable seed.
 */
export function generateReadingConfusers(reading: string, exclude: Set<string> = new Set()): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (variant: string) => {
    if (!variant || variant === reading || exclude.has(variant) || seen.has(variant)) return;
    seen.add(variant);
    out.push(variant);
  };

  const chars = [...reading];

  // Voicing toggles: one mora changed at a time (the most tempting kind of
  // near-miss). しょう -> じょう comes for free since the swap hits し.
  for (let i = 0; i < chars.length; i++) {
    const variants = VOICE_VARIANTS[chars[i]];
    if (!variants) continue;
    for (const alt of variants) {
      add(chars.slice(0, i).join("") + alt + chars.slice(i + 1).join(""));
    }
  }

  // Drop a trailing long vowel (こう -> こ, せい -> せ). Adding one is
  // skipped: it tends to produce unnatural kana, and dropping already
  // covers the こう/こ confusion symmetrically across the item set.
  const last = chars[chars.length - 1];
  if (chars.length > 1 && (last === "う" || last === "い")) {
    add(chars.slice(0, -1).join(""));
  }

  // Drop gemination (がっこう -> がこう).
  if (reading.includes("っ")) {
    add(reading.replace(/っ/g, ""));
  }

  return out;
}
