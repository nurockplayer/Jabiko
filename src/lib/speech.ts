// Japanese TTS voice selection.
//
// Bug (iPhone / iPad): the speak button read Japanese with a CHINESE voice.
// iOS Safari ignores `utterance.lang = "ja-JP"` on its own and falls back to
// the default voice -- and a Chinese TTS voice will happily read kanji, so the
// listener hears Mandarin. The fix is to set `utterance.voice` to an explicit
// ja-* SpeechSynthesisVoice (Windows / Android honour `lang`, hence "正常").
//
// getVoices() can be empty until the async 'voiceschanged' event fires
// (notably on Safari), so we prime it once on load and re-query on each use.

function isJapanese(v: SpeechSynthesisVoice): boolean {
  const lang = (v.lang ?? "").toLowerCase();
  return lang === "ja" || lang.startsWith("ja-") || lang.startsWith("ja_");
}

// Pure picker (unit-tested): prefer a local ja-JP voice (e.g. Kyoko), then any
// ja-JP, then any local Japanese voice, then any Japanese voice. null if none.
export function pickJapaneseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const ja = voices.filter(isJapanese);
  if (ja.length === 0) return null;
  const isJaJp = (v: SpeechSynthesisVoice) => (v.lang ?? "").toLowerCase() === "ja-jp";
  return (
    ja.find((v) => isJaJp(v) && v.localService) ??
    ja.find(isJaJp) ??
    ja.find((v) => v.localService) ??
    ja[0]
  );
}

function speechSynth(): SpeechSynthesis | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  return window.speechSynthesis;
}

// Prime the voice list once: some browsers only populate getVoices() after the
// first call and/or the 'voiceschanged' event. Safe no-op when unsupported.
function primeVoices() {
  const synth = speechSynth();
  if (!synth) return;
  try {
    synth.getVoices();
    synth.addEventListener?.("voiceschanged", () => {
      synth.getVoices();
    });
  } catch {
    // ignore -- worst case the first click has no voice and falls back to lang
  }
}
primeVoices();

// Current best Japanese voice, or null. Re-queried each call so it reflects
// voices that loaded after the initial prime.
export function getJapaneseVoice(): SpeechSynthesisVoice | null {
  const synth = speechSynth();
  if (!synth) return null;
  try {
    return pickJapaneseVoice(synth.getVoices());
  } catch {
    return null;
  }
}
