// 語順組合 (sentence-reordering) prompts list their word fragments in the
// CORRECT order -- ［a / b / c / d］ -- so a learner can just concatenate
// them as shown to get the answer without understanding the grammar. This
// shuffles the fragments at render time so the prompt no longer spells out
// the answer. Pure display: options / expectedAnswer are untouched.

const OPEN = "［";
const CLOSE = "］";
const JOIN = " / ";

/** Stable unsigned 32-bit string hash (mirrors practice.ts for seed parity). */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

/** mulberry32 seeded PRNG (same as practice.ts) -- deterministic per seed. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shuffle the fragments of a ［a / b / c / d］ prompt so they no longer
 * appear in answer order. Seeded by `seed` (the question id) so the order
 * is stable across re-renders and never reshuffles mid-question -- matching
 * rotateOptions / seededSample in practice.ts. Guarantees the result differs
 * from the original order (else it would leak the answer again).
 *
 * Returns the input unchanged when it isn't a parseable ［...］ list of two
 * or more fragments.
 */
export function shuffleOrderFragments(promptText: string, seed: string): string {
  const trimmed = promptText.trim();
  if (!trimmed.startsWith(OPEN) || !trimmed.endsWith(CLOSE)) return promptText;

  const inner = trimmed.slice(OPEN.length, trimmed.length - CLOSE.length);
  const fragments = inner
    .split("/")
    .map((fragment) => fragment.trim())
    .filter((fragment) => fragment.length > 0);
  if (fragments.length < 2) return promptText;

  const rand = mulberry32(hashString(seed));
  const shuffled = [...fragments];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // If the seeded shuffle happened to reproduce the original (answer) order,
  // rotate by one so the prompt never leaks the answer. With >=2 distinct
  // fragments a single rotation always differs from the original.
  if (shuffled.every((fragment, i) => fragment === fragments[i])) {
    shuffled.push(shuffled.shift()!);
  }

  return `${OPEN}${shuffled.join(JOIN)}${CLOSE}`;
}
