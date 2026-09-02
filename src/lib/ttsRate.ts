// Global speech-rate preference for the "讀出來" (TTS) buttons (#527).
//
// A learner asked to be able to slow the Japanese audio down. The rate is a
// single global preference stored locally (like the furigana toggle), read
// fresh by SpeakButton on each click so a change in the settings sidebar takes
// effect immediately everywhere audio plays (drill / exam / kanji panels).
//
// Crash-safe like safeStorage: a blocked / garbage store reads back as the
// default, so persistence can fail without breaking playback.
import { readStored, writeStored } from "../domain/safeStorage";

const TTS_RATE_KEY = "jabiko.ttsRate";

// SpeechSynthesisUtterance.rate: 1.0 is the engine default. The app has always
// spoken at 0.95 (a touch under default), so that stays the "標準" preset and
// the no-preference default -- existing users hear no change.
export const TTS_RATE_DEFAULT = 0.95;
// Practical bounds: below ~0.5 the built-in voices slur; above ~1.5 it races.
export const TTS_RATE_MIN = 0.5;
export const TTS_RATE_MAX = 1.5;

// Slow-leaning presets (the request was specifically "let me slow it down"),
// ordered default-first so 標準 reads as the baseline and the rest step down.
// `rate` is used verbatim as utterance.rate; labels are i18n'd by the picker.
export const TTS_RATE_PRESETS = [
  { id: "normal", rate: TTS_RATE_DEFAULT },
  { id: "slow", rate: 0.7 },
  { id: "slower", rate: 0.5 }
] as const;

// Coerce any number into the safe range; non-finite input falls back to the
// default rather than clamping (NaN/Infinity aren't a meaningful speed).
export function clampTtsRate(rate: number): number {
  if (!Number.isFinite(rate)) return TTS_RATE_DEFAULT;
  return Math.min(TTS_RATE_MAX, Math.max(TTS_RATE_MIN, rate));
}

// The stored rate, or the default when unset / unreadable / non-numeric.
export function readTtsRate(): number {
  const raw = readStored(TTS_RATE_KEY);
  // Treat missing AND empty/whitespace as unset: Number("") is 0, which would
  // otherwise clamp up to the minimum instead of falling back to the default.
  if (raw === null || raw.trim() === "") return TTS_RATE_DEFAULT;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? clampTtsRate(parsed) : TTS_RATE_DEFAULT;
}

// Persist a rate, clamped to the safe range so a bad custom value can't stick.
export function writeTtsRate(rate: number): void {
  writeStored(TTS_RATE_KEY, String(clampTtsRate(rate)));
}
