import { useEffect, useState } from "react";
import { readStored, writeStored } from "../domain/safeStorage";

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "jabiko.theme";

function getInitialTheme(): Theme {
  const storedTheme = readStored(THEME_STORAGE_KEY);

  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  // First-time default switched from dark to light: the new wafuu-paper
  // palette is designed light-first. Dark theme is still available via
  // the toggle and via stored preference.
  return "light";
}

function storeTheme(theme: Theme) {
  writeStored(THEME_STORAGE_KEY, theme);
}

// Owns the light/dark theme: the initial read from storage, the
// <html data-theme> side-effect, and the persisted toggle. Returns the
// current theme plus a toggle; the consumer renders the button + icon.
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    storeTheme(nextTheme);
  };

  return { theme, toggleTheme };
}
