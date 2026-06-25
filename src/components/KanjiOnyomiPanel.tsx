import { useMemo, useState } from "react";
import { copy, type Language } from "../i18n";
import type { JlptLevel } from "../domain/types";
import { kanjiOnyomi, kanjiExamples, type KanjiOnyomiEntry } from "../domain/kanjiOnyomi";
import { SpeakButton } from "./SpeakButton";
import { InkstoneSpot, MagnifierKanjiSpot } from "../illustrations";

const LEVELS: Array<JlptLevel | "all"> = ["all", "N5", "N4", "N3", "N2", "N1"];
type ReadingType = "on" | "kun";

// 漢字讀音 速查表 (#195): browse kanji grouped by their primary reading
// (homophone families -- the こう / しょう / せい ... that learners mix up),
// toggle between 音読み and 訓読み, filter by level (N5–N1), search, and open a
// card showing both readings + real example words (pulled from the vocab bank)
// with TTS. The point is to confirm readings without getting fooled by voicing;
// the example words keep it anchored to how the kanji reads inside compounds.
export function KanjiOnyomiPanel({ language }: { language: Language }) {
  const t = copy[language];
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<JlptLevel | "all">("all");
  const [readingType, setReadingType] = useState<ReadingType>("on");
  const [selected, setSelected] = useState<string | null>(null);

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
        entry.meaningZh.includes(q)
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
  }, [query, level, readingType]);

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
        <div className="segmented" role="group" aria-label={t.kanjiLevelFilter}>
          {LEVELS.map((option) => (
            <button
              key={option}
              type="button"
              className={level === option ? "selected" : ""}
              aria-pressed={level === option}
              onClick={() => setLevel(option)}
            >
              {option === "all" ? t.kanjiLevelAll : option}
            </button>
          ))}
        </div>
      </div>

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
                {detail.meaningZh}
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
                  <span className="kanji-example-mean">{example.meaningZh}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="kanji-no-examples">{t.kanjiNoExamples}</p>
          )}
        </div>
      ) : null}

      {families.length > 0 ? (
        families.map(([reading, entries]) => (
          <div className="kanji-family" key={reading}>
            <h3 className="kanji-family-head">
              {reading}
              <small>{activeLabel}</small>
              <span className="kanji-family-count">{entries.length}</span>
            </h3>
            <div className="kanji-grid">
              {entries.map((entry) => (
                <button
                  key={entry.kanji}
                  type="button"
                  className={`kanji-cell${selected === entry.kanji ? " selected" : ""}`}
                  aria-pressed={selected === entry.kanji}
                  onClick={() => setSelected(entry.kanji)}
                >
                  <span className="kanji-cell-char">{entry.kanji}</span>
                  <span className="kanji-cell-read">
                    {entry.onyomi.length > 0 ? (
                      <span className="kanji-cell-on">音 {entry.onyomi.join("・")}</span>
                    ) : null}
                    {entry.kunyomi.length > 0 ? (
                      <span className="kanji-cell-kun">訓 {entry.kunyomi.join("・")}</span>
                    ) : null}
                  </span>
                  <span className="kanji-cell-mean">{entry.meaningZh}</span>
                </button>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="empty-state empty-state-illustrated kanji-empty">
          <MagnifierKanjiSpot />
          <p>{t.kanjiSearchEmpty}</p>
        </div>
      )}
    </section>
  );
}
