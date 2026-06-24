// Furigana segmentation (issue #134). The whole feature is build-time
// pre-baked: kuromoji segments each sentence OFFLINE, this module turns a
// word's surface + reading into ruby segments, and the result is stored so
// the frontend renders <ruby> with ZERO runtime tokenisation. Kept in the
// domain layer (pure, no DOM) so it can be unit-tested and reused by both
// the pre-bake script and any future runtime caller.

/**
 * A pre-baked furigana segment. `t` is a run of the original text; `r` is
 * the reading rendered as <rt> above it, present ONLY for kanji runs that
 * aligned to a reading. Plain runs (kana, punctuation, unreadable tokens)
 * carry no `r` and render as bare text.
 */
export type FuriganaSegment = { t: string; r?: string };

// kuromoji's token shape, narrowed to the two fields we consume. Loose so
// callers can pass real kuromoji tokens or plain fixtures.
export type FuriganaToken = { surface_form: string; reading?: string | null };

// Katakana (U+30A1..U+30FA) -> hiragana, so kuromoji readings (katakana)
// line up with the hiragana okurigana in a surface. The long-vowel mark ー
// and everything else are left as-is.
export function kataToHira(value: string): string {
  return value.replace(/[ァ-ヺ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

// CJK unified ideographs + the 々 iteration mark. Enough to decide whether a
// run needs furigana; kana, punctuation and latin are excluded.
const KANJI_RE = /[一-鿿々]/;
export function hasKanji(value: string): boolean {
  return KANJI_RE.test(value);
}

// Hiragana / katakana / long-vowel mark / combining marks count as "kana"
// for run-splitting. 々 is deliberately excluded (it repeats the preceding
// kanji, so it groups WITH the kanji run).
const KANA_RE = /[ぁ-ゖ゙-゜ァ-ヺー]/;
function isKana(ch: string): boolean {
  return KANA_RE.test(ch);
}

type Run = { kanji: boolean; text: string };

// Split a surface into maximal alternating kanji / kana runs.
function splitRuns(surface: string): Run[] {
  const runs: Run[] = [];
  for (const ch of surface) {
    const kanji = !isKana(ch);
    const last = runs[runs.length - 1];
    if (last && last.kanji === kanji) last.text += ch;
    else runs.push({ kanji, text: ch });
  }
  return runs;
}

function wholeRuby(surface: string, reading: string): FuriganaSegment[] {
  return [{ t: surface, r: reading }];
}

/**
 * Align one word's `surface` to its hiragana `reading`, splitting kanji
 * runs (which get a reading) from kana runs (plain). `reading` must already
 * be hiragana (see {@link kataToHira}).
 *
 * Walk the surface's runs: a kana run must appear verbatim in the reading at
 * the cursor (advancing it); a kanji run claims the reading up to the start
 * of the FOLLOWING kana run (or to the end). If anything fails to line up,
 * fall back to one ruby span over the whole surface — still correct to read,
 * just not split per-kanji.
 */
export function alignToken(surface: string, reading: string): FuriganaSegment[] {
  if (!hasKanji(surface)) return [{ t: surface }];

  const runs = splitRuns(surface);
  const segments: FuriganaSegment[] = [];
  let j = 0; // cursor into `reading`

  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    if (!run.kanji) {
      const h = kataToHira(run.text);
      if (reading.slice(j, j + h.length) !== h) return wholeRuby(surface, reading);
      j += h.length;
      segments.push({ t: run.text });
      continue;
    }
    const next = runs[i + 1];
    if (next) {
      const anchor = kataToHira(next.text);
      const at = reading.indexOf(anchor, j);
      if (at === -1 || at === j) return wholeRuby(surface, reading);
      segments.push({ t: run.text, r: reading.slice(j, at) });
      j = at;
    } else {
      if (j >= reading.length) return wholeRuby(surface, reading);
      segments.push({ t: run.text, r: reading.slice(j) });
      j = reading.length;
    }
  }

  if (j !== reading.length) return wholeRuby(surface, reading);
  return segments;
}

/**
 * Patch known kuromoji misreadings before segmentation. kuromoji (IPADIC)
 * splits some special compound readings wrong — e.g. 一人 tokenises as 一
 * (イチ) ＋ 人 (ニン) instead of the jukujikun ひとり. `overrides` maps such a
 * word's surface to its correct hiragana reading; consecutive tokens whose
 * surfaces concatenate to that word are merged into one corrected token.
 * Only add UNAMBIGUOUS fixes here (一人→ひとり is safe; 一日 is not — ついたち
 * vs いちにち depends on context).
 */
export function applyReadingOverrides(
  tokens: FuriganaToken[],
  overrides: Record<string, string>
): FuriganaToken[] {
  const words = Object.keys(overrides);
  const out: FuriganaToken[] = [];
  for (let i = 0; i < tokens.length; ) {
    let matched = false;
    for (const word of words) {
      let acc = "";
      let k = i;
      while (k < tokens.length && acc.length < word.length) acc += tokens[k++].surface_form;
      if (acc === word) {
        out.push({ surface_form: word, reading: overrides[word] });
        i = k;
        matched = true;
        break;
      }
    }
    if (!matched) out.push(tokens[i++]);
  }
  return out;
}

/**
 * Turn kuromoji tokens into a sentence's furigana segments. Tokens with no
 * reading (unknown words / symbols) or no kanji become plain text; the rest
 * are aligned via {@link alignToken}. Adjacent plain runs are merged so the
 * stored data stays compact.
 */
export function tokensToSegments(tokens: FuriganaToken[]): FuriganaSegment[] {
  const out: FuriganaSegment[] = [];
  const pushPlain = (text: string) => {
    const last = out[out.length - 1];
    if (last && last.r === undefined) last.t += text;
    else out.push({ t: text });
  };

  for (const token of tokens) {
    const surface = token.surface_form;
    const reading = token.reading;
    if (!reading || reading === "*" || !hasKanji(surface)) {
      pushPlain(surface);
      continue;
    }
    for (const seg of alignToken(surface, kataToHira(reading))) {
      if (seg.r === undefined) pushPlain(seg.t);
      else out.push(seg);
    }
  }
  return out;
}
