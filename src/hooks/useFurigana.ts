import { useState } from "react";
import { readStored, writeStored } from "../domain/safeStorage";

const FURIGANA_STORAGE_KEY = "jabiko.furigana";

function getInitialEnabled(): boolean {
  // Default OFF: a furigana-free surface is the realistic JLPT-exam
  // condition (#134), so only an explicit stored "on" turns it on.
  return readStored(FURIGANA_STORAGE_KEY) === "on";
}

// Owns the global furigana (ruby) preference: the initial read from storage
// and the persisted toggle. Mirrors useTheme. The consumer renders the
// button; FuriganaContext broadcasts `enabled` down to every <Ruby>.
export function useFurigana() {
  const [enabled, setEnabled] = useState<boolean>(() => getInitialEnabled());

  const toggle = () => {
    setEnabled((previous) => {
      const next = !previous;
      writeStored(FURIGANA_STORAGE_KEY, next ? "on" : "off");
      return next;
    });
  };

  return { enabled, toggle };
}
