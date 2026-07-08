import { Volume2 } from "lucide-react";
import { copy, type Language } from "../i18n";
import { getJapaneseVoice } from "../lib/speech";
import { readTtsRate } from "../lib/ttsRate";

// Chrome silently stops synthesis after ~15s (long example sentences cut off
// = the reported 卡頓). A pause()/resume() heartbeat keeps it going; it only
// fires once a sentence is still playing past the interval, so short reads
// (which finish first) are never touched. One shared timer -- there is a
// single global speechSynthesis engine.
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
function stopKeepAlive() {
  if (keepAliveTimer !== null) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}
function startKeepAlive(synth: SpeechSynthesis) {
  stopKeepAlive();
  keepAliveTimer = setInterval(() => {
    if (synth.speaking) {
      synth.pause();
      synth.resume();
    } else {
      stopKeepAlive();
    }
  }, 12000);
}

// Small inline button that reads its `text` aloud via the browser's
// built-in SpeechSynthesis API. No external TTS service or audio asset
// involved -- the voice quality depends on what the user's OS/browser
// ships, but for "hear the kanji" / "hear the example sentence" the
// built-in JA voices are good enough for a first cut. If the API or a
// JA voice isn't available, the component renders nothing rather than a
// broken-feeling button.
export function SpeakButton({ text, language }: { text: string; language: Language }) {
  const supported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance === "function";

  if (!supported) return null;
  if (!text) return null;

  const handleClick = () => {
    try {
      const synth = window.speechSynthesis;
      const utterance = new window.SpeechSynthesisUtterance(text);
      // iOS/iPadOS ignores `lang` alone and may read kanji with a Chinese
      // voice -- pin an explicit ja-* voice when one is available.
      const jaVoice = getJapaneseVoice();
      if (jaVoice) utterance.voice = jaVoice;
      utterance.lang = "ja-JP";
      // Read the rate fresh each click so a change in the 語速 control (#527)
      // applies immediately; defaults to the long-standing 0.95 when unset.
      utterance.rate = readTtsRate();
      utterance.addEventListener("end", stopKeepAlive);
      utterance.addEventListener("error", stopKeepAlive);

      const speak = () => {
        startKeepAlive(synth);
        synth.speak(utterance);
      };

      // The reported "缺失一小段" (clipped start) / 爆音: Chrome drops the
      // beginning of an utterance when speak() is called in the same tick as
      // cancel(). So only cancel when something is actually playing, and give
      // the engine a beat before the new utterance; when idle, speak now --
      // no clip, no needless latency.
      if (synth.speaking || synth.pending) {
        synth.cancel();
        setTimeout(speak, 130);
      } else {
        speak();
      }
    } catch {
      // Voice synthesis can throw if the engine is in a bad state; the
      // worst case here is "no sound played", which is better than
      // crashing the practice flow.
      stopKeepAlive();
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
