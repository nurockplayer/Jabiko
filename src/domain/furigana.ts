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
export type InlineRubySegment = { text: string; ruby: boolean };

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

const KANA_ONLY_RE = /[ぁ-ゖ゙-゜ァ-ヺー]/;
function hasKana(value: string): boolean {
  return KANA_ONLY_RE.test(value);
}

// True when the text carries any Japanese script (kana or kanji). Used to
// gate the TTS button: a JA voice mangles ASCII, so a romaji prompt (the kana
// "pick" question's promptText IS Hepburn romaji, e.g. "ne") must not be sent
// to speech synthesis (#653).
export function hasJapanese(value: string): boolean {
  return hasKanji(value) || hasKana(value);
}

// Hiragana / katakana / long-vowel mark / combining marks count as "kana"
// for run-splitting. 々 is deliberately excluded (it repeats the preceding
// kanji, so it groups WITH the kanji run).
const KANA_RE = /[ぁ-ゖ゙-゜ァ-ヺー]/;
function isKana(ch: string): boolean {
  return KANA_RE.test(ch);
}

const INLINE_JAPANESE_TOKEN_RE = /[A-Za-zＡ-Ｚａ-ｚ0-9０-９ぁ-ゖ゙-゜ァ-ヺー一-鿿々・＋-]+/g;

function mergePlainSegments(segments: InlineRubySegment[]): InlineRubySegment[] {
  const out: InlineRubySegment[] = [];
  for (const segment of segments) {
    const last = out[out.length - 1];
    if (last && !last.ruby && !segment.ruby) last.text += segment.text;
    else out.push(segment);
  }
  return out;
}

function splitTokenCandidates(text: string, quoted: boolean): InlineRubySegment[] {
  const segments: InlineRubySegment[] = [];
  let lastIndex = 0;
  let allowQuotedKanji = quoted;
  for (const match of text.matchAll(INLINE_JAPANESE_TOKEN_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      const plainText = text.slice(lastIndex, index);
      segments.push({ text: plainText, ruby: false });
      if (quoted && plainText.includes("／")) allowQuotedKanji = false;
    }
    const token = match[0];
    const ruby = hasKana(token) || (allowQuotedKanji && hasKanji(token));
    segments.push({ text: token, ruby });
    lastIndex = index + token.length;
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), ruby: false });
  }
  return mergePlainSegments(segments);
}

/**
 * Split mixed explanation text into plain spans and ruby-eligible Japanese
 * spans. Outside quotes we only mark kana-containing runs, which keeps the
 * Chinese source prose plain; inside Japanese quotes we also allow kanji-only
 * tokens like 「学校」.
 */
export function splitTextForRuby(text: string): InlineRubySegment[] {
  const segments: InlineRubySegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const open = text.indexOf("「", cursor);
    if (open === -1) {
      segments.push(...splitTokenCandidates(text.slice(cursor), false));
      break;
    }

    if (open > cursor) {
      segments.push(...splitTokenCandidates(text.slice(cursor, open), false));
    }

    const close = text.indexOf("」", open + 1);
    if (close === -1) {
      segments.push(...splitTokenCandidates(text.slice(open), false));
      break;
    }

    segments.push({ text: "「", ruby: false });
    segments.push(...splitTokenCandidates(text.slice(open + 1, close), true));
    segments.push({ text: "」", ruby: false });
    cursor = close + 1;
  }

  return mergePlainSegments(segments);
}

/**
 * Split mixed Traditional Chinese teaching prose conservatively: only text
 * inside matched Japanese corner quotes is ruby-eligible. Learning pitfalls
 * often place unquoted Japanese after Chinese characters (for example
 * `過去要放在最後的ならなかった`), which is readable as-is but unsafe to send
 * through a Japanese tokenizer as one run because the Chinese prose may gain
 * bogus readings.
 */
export function splitQuotedTextForRuby(text: string): InlineRubySegment[] {
  const segments: InlineRubySegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const open = text.indexOf("「", cursor);
    if (open === -1) {
      segments.push({ text: text.slice(cursor), ruby: false });
      break;
    }

    const close = text.indexOf("」", open + 1);
    if (close === -1) {
      segments.push({ text: text.slice(cursor), ruby: false });
      break;
    }

    segments.push({ text: text.slice(cursor, open + 1), ruby: false });
    const quotedText = text.slice(open + 1, close);
    if (quotedText) segments.push({ text: quotedText, ruby: true });
    segments.push({ text: "」", ruby: false });
    cursor = close + 1;
  }

  return mergePlainSegments(segments);
}

/**
 * Collect safe build-time furigana sources from a mixed-language explanation.
 * Only kana-containing runs are baked from free text so Chinese prose like
 * 「有生命」 never picks up a bogus Japanese reading.
 */
export function collectJapaneseRubySources(text: string | null | undefined): string[] {
  if (typeof text !== "string") return [];

  const isBakeable = (value: string): boolean => {
    if (!hasKana(value)) return false;
    if (value.length === 1 && !hasKanji(value)) return false;
    if (hasKanji(value)) return /[ぁ-ゖ゙-゜ァ-ヺー]$/.test(value);
    return true;
  };

  return Array.from(
    new Set(
      splitTextForRuby(text)
        .filter((segment) => segment.ruby && isBakeable(segment.text))
        .map((segment) => segment.text)
    )
  );
}

/**
 * Collect matched, kana-bearing 「Japanese」 spans from Traditional Chinese
 * prose. Kana is the conservative language signal: quoted Chinese such as
 * 「每份」 must not be sent through the Japanese tokenizer.
 */
export function collectQuotedRubySources(text: string | null | undefined): string[] {
  if (typeof text !== "string") return [];
  return Array.from(
    new Set(
      splitQuotedTextForRuby(text)
        .filter((segment) => segment.ruby && hasKana(segment.text) && hasKanji(segment.text))
        .map((segment) => segment.text)
    )
  );
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

/**
 * Whether a question is a reading drill, for which furigana must be
 * suppressed even when the global toggle is ON -- showing the kanji's
 * reading there would hand over the answer (#134).
 *
 * `漢字読み` (read-the-kanji) always suppresses: the reading IS the answer.
 * For any OTHER labelled (exam) item, targetForm is NOT a reliable signal --
 * every exam item defaults targetForm to "reading" (see exam/helpers.ts), so
 * gating on it would wrongly hide furigana from grammar / vocab stems, where
 * we WANT it so the learner can read a hard question (#134 P4). So exam items
 * are gated on promptLabel alone; only UNLABELLED basic drills use targetForm
 * as the reading signal. Kept here (pure, no DOM) so the render layer just
 * asks this predicate.
 */
export function isReadingPrompt(
  promptLabel: string | null | undefined,
  targetForm: string | null | undefined
): boolean {
  if (promptLabel === "漢字読み") return true;
  if (promptLabel) return false;
  return targetForm === "reading";
}

/**
 * Whether a question's ANSWER OPTIONS may carry furigana when the global
 * toggle is on (#589). Options leak differently from stems: on 表記
 * (orthography) items the distractors are often real words with DIFFERENT
 * readings, so ruby would expose the odd ones out; on 語形成 items a natural
 * reading over an affix candidate hints which combination is a real word.
 * Everything else is safe -- those answers are never about how an option
 * reads. Reading drills need no entry here: their options are kana strings,
 * which the bake step never stores (and <Ruby> falls back to plain text).
 */
const OPTION_FURIGANA_BLOCKED = new Set(["表記", "語形成"]);

export function allowsOptionFurigana(promptLabel: string | null | undefined): boolean {
  return !OPTION_FURIGANA_BLOCKED.has(promptLabel ?? "");
}
