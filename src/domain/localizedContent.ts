import type { LocaleCode, LocalizedText } from "./types";

/**
 * Pick the localized variant of a Chinese-source content field for `lang`,
 * falling back to the zh-Hant source when there is no (non-empty) overlay
 * entry. This is the single read path for #378 content overlays so missing
 * translations degrade to Chinese rather than silently rendering blank.
 */
export function pickLocalized(
  source: string,
  overlay: LocalizedText | undefined,
  lang: LocaleCode
): string {
  const value = overlay?.[lang];
  return typeof value === "string" && value.trim() !== "" ? value : source;
}

/**
 * Same as {@link pickLocalized} but for OPTIONAL source fields (e.g. hintZh,
 * instructionZh, promptContextZh). Returns `undefined` only when the source is
 * genuinely absent (null/undefined) -- an empty string is a real value and is
 * kept, so a nullish (not truthy) fallback chain like
 * `hint ?? context` preserves its original semantics: an authored empty hint
 * suppresses rather than falling through to the (answer-leaky) context.
 */
export function pickLocalizedOptional(
  source: string | undefined,
  overlay: LocalizedText | undefined,
  lang: LocaleCode
): string | undefined {
  return source == null ? undefined : pickLocalized(source, overlay, lang);
}
