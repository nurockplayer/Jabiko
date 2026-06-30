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
