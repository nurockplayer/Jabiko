import type { MouseEvent, ReactNode } from "react";
import type { Language } from "../i18n";
import { gamePreviewCopyFor } from "../domain/gamePreviewCopy";
import "./GamePreviewPanel.css";

export function GamePreviewPanel({
  language,
  headerMenu,
  furiganaLabel,
  furiganaEnabled,
  onToggleFurigana,
  onNavigate
}: {
  language: Language;
  headerMenu: ReactNode;
  furiganaLabel: string;
  furiganaEnabled: boolean;
  onToggleFurigana: () => void;
  onNavigate: (view: "home" | "conversation") => void;
}) {
  const copy = gamePreviewCopyFor(language);

  const handleNavigation = (
    event: MouseEvent<HTMLAnchorElement>,
    view: "home" | "conversation"
  ) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(view);
  };

  return (
    <div className="game-preview-shell">
      <a className="jt1-skip-link" href="#main-content">{copy.skip}</a>
      <header className="game-preview-header">
        <span className="game-preview-identity" aria-current="page">
          {copy.identity}
        </span>
        <span className="game-preview-status">{copy.preview}</span>
        <a className="game-preview-header-return" href="/" onClick={(event) => handleNavigation(event, "home")}>
          {copy.returnTraining}
        </a>
        <button
          className="game-preview-furigana"
          type="button"
          aria-pressed={furiganaEnabled}
          aria-label={furiganaLabel}
          onClick={onToggleFurigana}
        >
          {furiganaLabel}
        </button>
        {headerMenu}
      </header>
      <main id="main-content" className="game-preview-main" tabIndex={-1}>
        <section className="game-preview-content" aria-labelledby="game-preview-title">
          <p className="game-preview-eyebrow">{copy.preview}</p>
          <h1 id="game-preview-title">{copy.heading}</h1>
          <p>{copy.unavailable}</p>
          <a href="/conversation" onClick={(event) => handleNavigation(event, "conversation")}>
            {copy.smallTalk}
          </a>
        </section>
      </main>
    </div>
  );
}
