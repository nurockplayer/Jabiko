import { useEffect, useMemo, useRef, useState } from "react";
import { copy, type Language } from "../i18n";
import type { JlptLevel } from "../domain/types";
import { kanjiOnyomi, kanjiExamples, type KanjiOnyomiEntry } from "../domain/kanjiOnyomi";
import {
  readKanjiLevel,
  readLastReadKanji,
  writeKanjiLevel,
  writeLastReadKanji
} from "../domain/kanjiPreferences";
import { kanjiMeaning } from "../domain/kanjiOnyomi.i18n";
import { pickLocalized } from "../domain/localizedContent";
import { SpeakButton } from "./SpeakButton";
import { InkstoneSpot, MagnifierKanjiSpot } from "../illustrations";

const LEVELS: Array<JlptLevel | "all"> = ["all", "N5", "N4", "N3", "N2", "N1"];
type ReadingType = "on" | "kun";

// #608 P1: whole reading-families render in batches of roughly this many
// entries (the family that crosses the budget is included whole, so a batch
// tops out around budget + biggest-family ≈ 40 + 23). Keeps the initial DOM
// at ~50 cells instead of all 671 (~54,000px pages on phones).
const FAMILY_ENTRY_BUDGET = 40;

// 漢字讀音 速查表 (#195): browse kanji grouped by their primary reading
// (homophone families -- the こう / しょう / せい ... that learners mix up),
// toggle between 音読み and 訓読み, filter by level (N5–N1), search, and open a
// card showing both readings + real example words (pulled from the vocab bank)
// with TTS. The point is to confirm readings without getting fooled by voicing;
// the example words keep it anchored to how the kanji reads inside compounds.
export function KanjiOnyomiPanel({
  language,
  // #608 P1: start on the learner's band (App maps the stored level
  // preference via kanjiDefaultLevel) instead of all 671 entries.
  defaultLevel = "all"
}: {
  language: Language;
  defaultLevel?: JlptLevel | "all";
}) {
  const t = copy[language];
  const [query, setQuery] = useState("");
  // A level picked ON THIS PAGE outlives the visit, but only within the band
  // the learner's target level puts them in (see kanjiPreferences) -- so
  // browsing sticks, while changing your target level still moves the page.
  const [level, setLevel] = useState<JlptLevel | "all">(
    () => readKanjiLevel(defaultLevel) ?? defaultLevel
  );
  const [readingType, setReadingType] = useState<ReadingType>("on");
  const [selected, setSelected] = useState<string | null>(null);
  // Where the learner stopped last time. Read once on mount: it marks that
  // card and gives the arrow keys a starting point, but nothing scrolls or
  // opens on load -- returning to the page should look exactly as before.
  const [lastRead] = useState<string | null>(() => readLastReadKanji());

  const selectKanji = (kanji: string) => {
    setSelected(kanji);
    writeLastReadKanji(kanji);
  };
  const [entryBudget, setEntryBudget] = useState(FAMILY_ENTRY_BUDGET);
  useEffect(() => {
    // Any filter change starts a fresh batched view.
    setEntryBudget(FAMILY_ENTRY_BUDGET);
  }, [query, level, readingType]);

  const activeLabel = readingType === "on" ? t.kanjiOnyomiLabel : t.kanjiKunyomiLabel;

  const families = useMemo(() => {
    const q = query.trim();
    const matched = kanjiOnyomi.filter((entry) => {
      if (level !== "all" && entry.level !== level) return false;
      // Only entries that HAVE a reading of the active type can be grouped by
      // it -- on-only kanji drop out of 訓読み view and vice versa.
      const active = readingType === "on" ? entry.onyomi : entry.kunyomi;
      if (active.length === 0) return false;
      if (!q) return true;
      return (
        entry.kanji.includes(q) ||
        entry.onyomi.some((reading) => reading.includes(q)) ||
        entry.kunyomi.some((reading) => reading.includes(q)) ||
        kanjiMeaning(entry, language).toLowerCase().includes(q.toLowerCase())
      );
    });
    const byReading = new Map<string, KanjiOnyomiEntry[]>();
    for (const entry of matched) {
      const key = (readingType === "on" ? entry.onyomi : entry.kunyomi)[0];
      const bucket = byReading.get(key);
      if (bucket) bucket.push(entry);
      else byReading.set(key, [entry]);
    }
    // Biggest families first -- the most useful "don't mix these up" groups;
    // ties broken by reading for stable order.
    return [...byReading.entries()].sort(
      (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "ja")
    );
  }, [query, level, readingType, language]);

  // Batched view (#608): show whole families until the entry budget is
  // crossed; the rest sits behind a load-more button.
  const visibleFamilies: typeof families = [];
  let shownEntries = 0;
  for (const family of families) {
    if (shownEntries >= entryBudget) break;
    visibleFamilies.push(family);
    shownEntries += family[1].length;
  }
  const totalEntries = families.reduce((sum, [, entries]) => sum + entries.length, 0);
  const remainingEntries = totalEntries - shownEntries;

  // Every matched entry in display order (families first, then within a
  // family) -- the sequence the arrow keys walk. Includes entries still behind
  // the load-more boundary so stepping past it can reveal them.
  const orderedEntries = useMemo(() => families.flatMap(([, entries]) => entries), [families]);
  const cellRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<string | null>(null);

  // Desktop shortcut (user request 2026-07): ← / → walk the grid so browsing a
  // level or a search result doesn't mean clicking every card. A GLOBAL
  // document listener, like the drill's 1-9 shortcut: cards are not focused
  // until one is picked, so a section-scoped handler would miss the first
  // press. Skipped while a text field is focused (never hijack search typing)
  // and whenever a modifier is held -- Alt+← is browser history.
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
        return;
      }
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) {
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      if (orderedEntries.length === 0) {
        return;
      }
      // Nothing picked yet: carry on from the card the learner last read (so a
      // return visit resumes rather than restarting), else from the top.
      const position = selected ?? lastRead;
      const currentIndex = position
        ? orderedEntries.findIndex((entry) => entry.kanji === position)
        : -1;
      const nextIndex = currentIndex < 0 ? 0 : currentIndex + (event.key === "ArrowRight" ? 1 : -1);
      // Stop at both ends rather than wrapping -- silently jumping from the
      // last of 671 back to the first would lose the learner's place.
      if (nextIndex < 0 || nextIndex >= orderedEntries.length) {
        return;
      }
      event.preventDefault();
      // Reveal the target when it sits behind the load-more boundary. Budget
      // is family-granular, so asking for index+1 entries always pulls in the
      // whole family holding it -- covers both a single step past the edge and
      // a resume that lands deep in the list.
      if (nextIndex >= shownEntries) {
        setEntryBudget((budget) => Math.max(budget, nextIndex + 1));
      }
      pendingFocus.current = orderedEntries[nextIndex].kanji;
      selectKanji(orderedEntries[nextIndex].kanji);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [orderedEntries, selected, lastRead, shownEntries]);

  // Keyboard-driven selection follows the card: focus keeps the grid coherent
  // for keyboard and screen-reader users, and `block: "nearest"` only scrolls
  // when the card actually sits outside the viewport (so clicking never jumps).
  useEffect(() => {
    const kanji = pendingFocus.current;
    if (!kanji) return;
    const node = cellRefs.current.get(kanji);
    if (!node) return; // just revealed; the next pass catches it
    pendingFocus.current = null;
    node.focus({ preventScroll: true });
    node.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [selected, entryBudget]);

  const detail = selected ? kanjiOnyomi.find((entry) => entry.kanji === selected) ?? null : null;
  const examples = detail ? kanjiExamples(detail.kanji) : [];
  const detailSpeak = detail ? detail.onyomi[0] ?? detail.kunyomi[0] : "";

  return (
    <section className="kanji-panel" aria-label={t.kanjiTitle}>
      <header className="kanji-head">
        <InkstoneSpot className="panel-header-spot" />
        <h2>{t.kanjiTitle}</h2>
        <p>{t.kanjiIntro}</p>
      </header>

      <div className="kanji-controls">
        <input
          type="search"
          className="kanji-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.kanjiSearchPlaceholder}
          aria-label={t.kanjiSearchPlaceholder}
        />
        <div className="segmented" role="group" aria-label={t.kanjiReadingType}>
          {(["on", "kun"] as ReadingType[]).map((type) => (
            <button
              key={type}
              type="button"
              className={readingType === type ? "selected" : ""}
              aria-pressed={readingType === type}
              onClick={() => setReadingType(type)}
            >
              {type === "on" ? t.kanjiReadingOn : t.kanjiReadingKun}
            </button>
          ))}
        </div>
        <div className="segmented level-segmented" role="group" aria-label={t.kanjiLevelFilter}>
          {LEVELS.map((option) => (
            <button
              key={option}
              type="button"
              className={level === option ? "selected" : ""}
              aria-pressed={level === option}
              onClick={() => {
                setLevel(option);
                writeKanjiLevel(defaultLevel, option);
              }}
            >
              {option === "all" ? t.kanjiLevelAll : option}
            </button>
          ))}
        </div>
      </div>

      {/* Hidden on touch devices (no keyboard to hint at) via CSS. */}
      <p className="kanji-key-hint">{t.kanjiArrowHint}</p>

      {detail ? (
        <div className="kanji-card" aria-live="polite">
          <div className="kanji-card-head">
            <span className="kanji-card-char">{detail.kanji}</span>
            <div>
              {detail.onyomi.length > 0 ? (
                <p className="kanji-card-onyomi">
                  {detail.onyomi.join("・")}
                  <small>{t.kanjiOnyomiLabel}</small>
                </p>
              ) : null}
              {detail.kunyomi.length > 0 ? (
                <p className="kanji-card-kunyomi">
                  {detail.kunyomi.join("・")}
                  <small>{t.kanjiKunyomiLabel}</small>
                </p>
              ) : null}
              <p className="kanji-card-mean">
                {kanjiMeaning(detail, language)}
                {detailSpeak ? <SpeakButton text={detailSpeak} language={language} /> : null}
              </p>
            </div>
          </div>
          <p className="kanji-examples-label">{t.kanjiExamplesLabel}</p>
          {examples.length > 0 ? (
            <ul className="kanji-examples">
              {examples.map((example) => (
                <li key={example.surface}>
                  <span className="kanji-example-surface">
                    {example.surface}
                    <SpeakButton text={example.surface} language={language} />
                  </span>
                  <span className="kanji-example-reading">{example.reading}</span>
                  <span className="kanji-example-mean">
                    {pickLocalized(example.meaningZh, example.meaningI18n, language)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="kanji-no-examples">{t.kanjiNoExamples}</p>
          )}
        </div>
      ) : null}

      {families.length > 0 ? (
        visibleFamilies.map(([reading, entries]) => (
          <div className="kanji-family" key={reading}>
            <h3 className="kanji-family-head">
              {reading}
              <small>{activeLabel}</small>
              <span className="kanji-family-count">{entries.length}</span>
            </h3>
            <div className="kanji-grid">
              {entries.map((entry) => {
                const isSelected = selected === entry.kanji;
                // Where the learner stopped last time, shown only until they
                // pick something this session -- after that the selection is
                // the position and a second marker would just be noise.
                const isLastRead = selected === null && lastRead === entry.kanji;
                // Feedback 2026-07: listening used to mean scrolling back up to
                // the detail card's TTS button after every selection. The
                // selected cell grows an in-place speak button instead; it reads
                // the ACTIVE type's reading (the family the learner is browsing),
                // unlike the card which always leads with 音読み.
                const cellSpeak =
                  readingType === "on"
                    ? entry.onyomi[0] ?? entry.kunyomi[0]
                    : entry.kunyomi[0] ?? entry.onyomi[0];
                return (
                  <div className="kanji-cell-wrap" key={entry.kanji}>
                    <button
                      type="button"
                      ref={(node) => {
                        if (node) cellRefs.current.set(entry.kanji, node);
                        else cellRefs.current.delete(entry.kanji);
                      }}
                      className={`kanji-cell${isSelected ? " selected" : ""}${isLastRead ? " last-read" : ""}`}
                      aria-pressed={isSelected}
                      onClick={() => selectKanji(entry.kanji)}
                    >
                      <span className="kanji-cell-char">{entry.kanji}</span>
                      <span className="kanji-cell-read">
                        {entry.onyomi.length > 0 ? (
                          <span className="kanji-cell-on">{t.kanjiCellOnPrefix} {entry.onyomi.join("・")}</span>
                        ) : null}
                        {entry.kunyomi.length > 0 ? (
                          <span className="kanji-cell-kun">{t.kanjiCellKunPrefix} {entry.kunyomi.join("・")}</span>
                        ) : null}
                      </span>
                      <span className="kanji-cell-mean">{kanjiMeaning(entry, language)}</span>
                    </button>
                    {isSelected && cellSpeak ? (
                      <span className="kanji-cell-speak">
                        <SpeakButton text={cellSpeak} language={language} />
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="empty-state empty-state-illustrated kanji-empty">
          <MagnifierKanjiSpot />
          <p>{t.kanjiSearchEmpty}</p>
        </div>
      )}

      {remainingEntries > 0 ? (
        <button
          type="button"
          className="kanji-load-more"
          onClick={() => setEntryBudget((budget) => budget + FAMILY_ENTRY_BUDGET)}
        >
          {t.kanjiLoadMore(remainingEntries)}
        </button>
      ) : null}
    </section>
  );
}
