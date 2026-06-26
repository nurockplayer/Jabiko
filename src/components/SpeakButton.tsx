import { Volume2 } from "lucide-react";
import { copy, type Language } from "../i18n";
import { getJapaneseVoice } from "../lib/speech";

// Small inline button that reads its `text` aloud via the browser's
// built-in SpeechSynthesis API. No external TTS service or audio asset
// involved -- the voice quality depends on what the user's OS/browser
// ships, but for "hear the kanji" / "hear the example sentence" the
// built-in JA voices are good enough for a first cut. If the API or a
// JA voice isn't available, the component renders nothing rather than a
// broken-feeling button. Single-flight: if you click it again while
// it's still speaking, the current utterance is cancelled first so the
// new one starts cleanly.
export function SpeakButton({ text, language }: { text: string; language: Language }) {
  const supported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance === "function";

  if (!supported) return null;
  if (!text) return null;

  const handleClick = () => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new window.SpeechSynthesisUtterance(text);
      // iOS/iPadOS ignores `lang` alone and may read kanji with a Chinese
      // voice -- pin an explicit ja-* voice when one is available.
      const jaVoice = getJapaneseVoice();
      if (jaVoice) utterance.voice = jaVoice;
      utterance.lang = "ja-JP";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Voice synthesis can throw if the engine is in a bad state; the
      // worst case here is "no sound played", which is better than
      // crashing the practice flow.
    }
  };

  return (
    <button
      type="button"
      className="speak-button"
      aria-label={copy[language].speakAriaLabel}
      onClick={handleClick}
    >
      <Volume2 aria-hidden="true" />
    </button>
  );
}
