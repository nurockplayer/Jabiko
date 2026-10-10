import { useEffect, useRef, useState } from "react";
import { copy, type Language } from "../i18n";
import type { Attempt } from "../domain/types";
import type { LevelRange } from "../domain/levelRange";
import { usePracticeSession, type SessionInit } from "../hooks/usePracticeSession";
import { useTtsRate } from "../hooks/useTtsRate";
import { ModePicker } from "./challenge/ModePicker";
import { DrillPanel } from "./challenge/DrillPanel";
import { ScoreReport } from "./challenge/ScoreReport";
import { ReviewList } from "./challenge/ReviewList";
import { SessionLengthPicker } from "./challenge/SessionLengthPicker";
import { TtsRatePicker } from "./challenge/TtsRatePicker";

const SWITCHER_ID = "practice-switcher";

// Cancels the click that completes the current press. A touch tap's click
// arrives in a later task than its pointerup, so the guard waits for it, but
// is dropped when the press ends without one (cancelled, a scroll, or the
// next press begins), so a later, deliberate click is never lost.
function swallowNextClick() {
  let timer = 0;
  let released = false;
  const swallow = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    release();
  };
  const releaseSoon = () => {
    timer = window.setTimeout(release, 500);
  };
  function release() {
    released = true;
    window.clearTimeout(timer);
    document.removeEventListener("click", swallow, true);
    document.removeEventListener("pointerup", releaseSoon, true);
    document.removeEventListener("pointercancel", release, true);
    document.removeEventListener("pointerdown", release, true);
  }
  document.addEventListener("click", swallow, true);
  document.addEventListener("pointerup", releaseSoon, true);
  document.addEventListener("pointercancel", release, true);
  // Registered after the current press has reached the document, so only
  // the next press releases the guard.
  window.setTimeout(() => {
    if (!released) document.addEventListener("pointerdown", release, true);
  }, 0);
}

// The challenge workspace: the set list (mode/setup controls), the active
// drill, and the running tally + mistake list. This is the
// lazily-loaded view that owns the practice session -- usePracticeSession
// (and the heavy question-data it imports) only loads when the learner
// enters the challenge. This module is the assembly layer: it runs the
// session hook and wires its state/handlers into the column subcomponents
// (ModePicker / DrillPanel / ScoreReport + ReviewList), which live in
// ./challenge and are imported ONLY from here so the heavy challenge chunk
// (examBlocks etc.) stays out of the initial bundle.
// `init` is the launch request (which drill to start); `progressAttempts`
// / `recordAttempt` are the App-owned attempt history; `onExit` returns to
// the home dashboard from the review completion / empty screens.
//
// #866: on compact widths the set list is collapsed behind the session
// bar's title (a disclosure), so the question is the only thing on screen;
// on wide screens it stays as the left column.
export function ChallengePanel({
  init,
  progressAttempts,
  recordAttempt,
  language,
  targetLevel = null,
  onExit,
  onOpenFeedback
}: {
  init?: SessionInit;
  progressAttempts: Attempt[];
  recordAttempt: (attempt: Attempt) => void;
  language: Language;
  // The learner's global target-level preference (#199), forwarded to the
  // session hook to seed the daily / 綜合 / 単字 level range.
  targetLevel?: LevelRange | null;
  onExit: () => void;
  // Open the in-app feedback form from the completion card (#456).
  onOpenFeedback?: () => void;
}) {
  const t = copy[language];
  const [switcherOpen, setSwitcherOpen] = useState(false);
  // The 1–9 answer shortcuts pause while the set list is open, so a digit
  // never answers the question hidden behind it.
  const session = usePracticeSession({
    language,
    init,
    progressAttempts,
    recordAttempt,
    targetLevel,
    shortcutsPaused: switcherOpen
  });
  // Global 語速 preference for the 讀出來 buttons (#527); shown in the settings
  // sidebar. SpeakButton reads the stored value on click, so this applies to
  // every audio button, not just the ones in this panel.
  const { rate: ttsRate, setRate: setTtsRate } = useTtsRate();

  const layoutRef = useRef<HTMLElement>(null);
  const lastToggleRef = useRef<"open" | "close" | null>(null);

  // Opening moves focus into the list (to the current set); closing puts it
  // back on the session-bar title, so keyboard users never get lost.
  useEffect(() => {
    const layout = layoutRef.current;
    if (!layout || lastToggleRef.current === null) return;
    if (switcherOpen) {
      const current =
        layout.querySelector<HTMLElement>(`#${SWITCHER_ID} .mode-card.selected`) ??
        layout.querySelector<HTMLElement>(`#${SWITCHER_ID} button`);
      current?.focus({ preventScroll: true });
      // Bring the list, then the focused set inside the list's own scroller,
      // into view -- focus must never sit on something you cannot see.
      layout.querySelector(`#${SWITCHER_ID}`)?.scrollIntoView?.({ block: "nearest" });
      current?.scrollIntoView?.({ block: "nearest" });
    } else {
      layout.querySelector<HTMLElement>(".session-title")?.focus({ preventScroll: true });
    }
    lastToggleRef.current = null;
  }, [switcherOpen]);

  // A tap outside the open list (and outside its title button) dismisses it,
  // like any popover; focus stays where the learner put it.
  useEffect(() => {
    if (!switcherOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      const layout = layoutRef.current;
      if (!layout || !target) return;
      const list = layout.querySelector(`#${SWITCHER_ID}`);
      const title = layout.querySelector(".session-title");
      if (list?.contains(target) || title?.contains(target)) return;
      setSwitcherOpen(false);
      // A press on the question beside the list only dismisses it: its click
      // must not also answer (#872 review). The session bar (首頁), the aside
      // and the header keep their click.
      const pressed = target instanceof Element ? target : target.parentElement;
      const onQuestion = pressed?.closest(".drill-panel") && !pressed.closest(".session-bar");
      if (onQuestion && layout.contains(pressed)) swallowNextClick();
    };
    // Esc closes the open list from anywhere in the practice surface (or with
    // focus nowhere -- a setting change can drop it) and puts focus back on
    // the bar's title. A dialog or menu elsewhere owns its own Esc.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const target = event.target as Element | null;
      const layout = layoutRef.current;
      const inSurface = target === document.body || (layout != null && target != null && layout.contains(target));
      if (!inSurface || target?.closest("[role='dialog'], [role='menu']")) return;
      event.preventDefault();
      lastToggleRef.current = "close";
      setSwitcherOpen(false);
    };
    // A popover closes when keyboard focus moves outside it (other than to its
    // own 換練習 toggle): Tab can never reach -- or answer -- the question
    // hidden behind it, and a menu or dialog taking focus owns the next Esc.
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Node | null;
      const layout = layoutRef.current;
      if (!layout || !target || target === document.body) return;
      const list = layout.querySelector(`#${SWITCHER_ID}`);
      const title = layout.querySelector(".session-title");
      if (list?.contains(target) || title?.contains(target)) return;
      setSwitcherOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [switcherOpen]);

  const toggleSwitcher = () => {
    lastToggleRef.current = switcherOpen ? "close" : "open";
    setSwitcherOpen((open) => !open);
  };

  const closeSwitcher = () => {
    if (!switcherOpen) return;
    lastToggleRef.current = "close";
    setSwitcherOpen(false);
  };

  return (
    <section
      ref={layoutRef}
      className="practice-layout"
      aria-label="Jabiko practice"
      data-switcher={switcherOpen ? "open" : "closed"}
    >
      <div
        id={SWITCHER_ID}
        className="practice-switcher"
      >
        <ModePicker
          language={language}
          {...session}
          applyModePreset={(mode, levelRange) => {
            session.applyModePreset(mode, levelRange);
            closeSwitcher();
          }}
        />
      </div>

      <DrillPanel
        language={language}
        onExit={onExit}
        onOpenFeedback={onOpenFeedback}
        modeTitle={t.modeOptions[session.activeModeCopyKey].title}
        switcher={{ open: switcherOpen, onToggle: toggleSwitcher, controlsId: SWITCHER_ID }}
        {...session}
      />

      {/* #866: the learner's own tally first, then this pass's mistakes, then
          the quieter settings. */}
      <aside className="review-panel" aria-label={t.mistakesLabel}>
        <ScoreReport
          language={language}
          attempts={session.attempts}
          correctCount={session.correctCount}
          accuracy={session.accuracy}
          mistakeCount={session.mistakeQuestions.length}
        />
        <ReviewList language={language} mistakeQuestions={session.mistakeQuestions} />
        <div className="session-settings">
          {session.showSessionLength ? (
            <SessionLengthPicker
              language={language}
              sessionLength={session.sessionLength}
              onChange={session.handleSessionLengthChange}
            />
          ) : null}
          <TtsRatePicker language={language} rate={ttsRate} onChange={setTtsRate} />
        </div>
      </aside>
    </section>
  );
}
