import { useState } from "react";
import { clampTtsRate, readTtsRate, writeTtsRate } from "../lib/ttsRate";

// Owns the global speech-rate preference (#527): the initial read from storage
// and the persisted setter. Mirrors useFurigana / useTheme. The consumer (the
// challenge settings sidebar) renders TtsRatePicker from this state; SpeakButton
// does NOT subscribe -- it reads the stored rate fresh on each click, so a
// change here is picked up everywhere audio plays without any context wiring.
export function useTtsRate() {
  const [rate, setRateState] = useState<number>(() => readTtsRate());

  const setRate = (next: number) => {
    writeTtsRate(next);
    setRateState(clampTtsRate(next));
  };

  return { rate, setRate };
}
