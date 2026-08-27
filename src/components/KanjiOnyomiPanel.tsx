import { Fragment, createRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const KANJI_BANK = new Set(kanjiOnyomi.map((entry) => entry.kanji));
type ReadingType = "on" | "kun";

// #683: budget state is keyed by the active filter (query + level + readingType)
// so a filter change needs no effect to reset it -- see usage below.
type EntryBudgetState = {
  filterKey: string;
  value: number;
};

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
  const [queryFilter, setQueryFilter] = useState({ value: "", revision: 0 });
  const query = queryFilter.value;
  const storedLevel = useMemo(() => readKanjiLevel(defaultLevel), [defaultLevel]);
  const [sessionLevel, setSessionLevel] = useState<{
    defaultLevel: JlptLevel | "all";
    level: JlptLevel | "all";
    revision: number;
  } | null>(null);
  const level =
    sessionLevel?.defaultLevel === defaultLevel
      ? sessionLevel.level
      : storedLevel ?? defaultLevel;
  const [readingFilter, setReadingFilter] = useState<{
    value: ReadingType;
    revision: number;
  }>({ value: "on", revision: 0 });
  const readingType = readingFilter.value;
  const [selected, setSelected] = useState<string | null>(null);
  const [lastRead] = useState<string | null>(() => readLastReadKanji(KANJI_BANK));
  const selectKanji = useCallback((kanji: string) => {
    setSelected(kanji);
    writeLastReadKanji(kanji);
  }, []);
  const activeLabel = readingType === "on" ? t.kanjiOnyomiLabel : t.kanjiKunyomiLabel;

  // Pure, stable filter key: query + level + readingType. `language` is left
  // out on purpose (language switches must not reset the loaded count).
  // The :: separator can never collide with the search box or the level /
  // reading-type labels, so distinct filters always map to distinct keys.
  const levelRevision =
    sessionLevel?.defaultLevel === defaultLevel ? sessionLevel.revision : 0;
  const filterKey = `${query}::${level}::${readingType}::${queryFilter.revision}:${levelRevision}:${readingFilter.revision}`;

  // #683: the load-more budget is keyed by the active filter instead of being a
  // plain number reset by a query/level/readingType effect (React hooks v7
  // flags `set-state-in-effect`). Each filter's existing event state carries a
  // revision, so returning to a previous value produces a new key without any
  // budget-state write during the filter transition.
  // language is deliberately NOT part of the key, so switching UI language
  // never resets the already-loaded batch.
  const [entryBudgetState, setEntryBudgetState] = useState<EntryBudgetState>(() => ({
    filterKey: "",
    value: FAMILY_ENTRY_BUDGET
  }));
  const entryBudget =
    entryBudgetState.filterKey === filterKey ? entryBudgetState.value : FAMILY_ENTRY_BUDGET;
  const increaseEntryBudget = useCallback((minimumValue = 0) => {
    setEntryBudgetState((prev) => {
      // The stored key may be stale (a filter changed in between). Always bump
      // on top of the CURRENT filter's effective budget so the batch keeps
      // growing from the initial value, never from a previous filter's count.
      const base = prev.filterKey === filterKey ? prev.value : FAMILY_ENTRY_BUDGET;
      return { filterKey, value: Math.max(base + FAMILY_ENTRY_BUDGET, minimumValue) };
    });
  }, [filterKey]);

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
  const [cellRefs] = useState(
    () =>
      new Map(
        kanjiOnyomi.map((entry) => [entry.kanji, createRef<HTMLButtonElement>()])
      )
  );
  const pendingFocus = useRef<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

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
      const currentPosition = selected ?? lastRead;
      const currentIndex = currentPosition
        ? orderedEntries.findIndex((entry) => entry.kanji === currentPosition)
        : -1;
      // Nothing picked yet: the first press opens the first card.
      const nextIndex = currentIndex < 0 ? 0 : currentIndex + (event.key === "ArrowRight" ? 1 : -1);
      // Stop at both ends rather than wrapping -- silently jumping from the
      // last of 671 back to the first would lose the learner's place.
      if (nextIndex < 0 || nextIndex >= orderedEntries.length) {
        return;
      }
      event.preventDefault();
      // Stepping past the load-more boundary pulls the next batch in instead
      // of dead-ending. A deep remembered position requests enough of the
      // CURRENT filter-keyed budget to reveal its next card in one update.
      if (nextIndex >= shownEntries) {
        increaseEntryBudget(nextIndex + 1);
      }
      pendingFocus.current = orderedEntries[nextIndex].kanji;
      selectKanji(orderedEntries[nextIndex].kanji);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [orderedEntries, selected, lastRead, shownEntries, increaseEntryBudget, selectKanji]);

  // Keyboard-driven selection follows the card: focus keeps the grid coherent
  // for keyboard and screen-reader users, and `block: "nearest"` only scrolls
  // when the card actually sits outside the viewport (so clicking never jumps).
  useEffect(() => {
    const kanji = pendingFocus.current;
    if (!kanji) return;
    const node = cellRefs.get(kanji)?.current;
    if (!node) return; // just revealed; the next pass catches it
    pendingFocus.current = null;
    node.focus({ preventScroll: true });
    node.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
    detailRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [selected, entryBudget, cellRefs]);

  const detail = selected ? kanjiOnyomi.find((entry) => entry.kanji === selected) ?? null : null;
  const examples = detail ? kanjiExamples(detail.kanji) : [];
  const detailSpeak = detail ? detail.onyomi[0] ?? detail.kunyomi[0] : "";
  const detailCard = detail ? (
    <div className="kanji-card" ref={detailRef} aria-live="polite">
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
                <SpeakButton text={example.reading} language={language} />
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
  ) : null;

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
          onChange={(event) =>
            setQueryFilter((current) => ({
              value: event.target.value,
              revision:
                current.value === event.target.value
                  ? current.revision
                  : current.revision + 1
            }))
          }
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
              onClick={() =>
                setReadingFilter((current) =>
                  current.value === type
                    ? current
                    : { value: type, revision: current.revision + 1 }
                )
              }
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
                if (level === option) return;
                setSessionLevel((current) => ({
                  defaultLevel,
                  level: option,
                  revision:
                    current?.defaultLevel === defaultLevel ? current.revision + 1 : 1
                }));
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
                  <Fragment key={entry.kanji}>
                    <div className="kanji-cell-wrap">
                      <button
                        type="button"
                        ref={cellRefs.get(entry.kanji)}
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
                    {isSelected ? detailCard : null}
                  </Fragment>
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
          onClick={() => increaseEntryBudget()}
        >
          {t.kanjiLoadMore(remainingEntries)}
        </button>
      ) : null}
    </section>
  );
}
