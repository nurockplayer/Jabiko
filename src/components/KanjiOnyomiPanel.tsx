import { useMemo, useState } from "react";
import { copy, type Language } from "../i18n";
import type { JlptLevel } from "../domain/types";
import { kanjiOnyomi, kanjiExamples, type KanjiOnyomiEntry } from "../domain/kanjiOnyomi";
import { SpeakButton } from "./SpeakButton";

const LEVELS: Array<JlptLevel | "all"> = ["all", "N1", "N2"];

// 漢字音読み 速查表: browse kanji grouped by their primary 音読み
// (homophone families -- the こう / しょう / せい ... that learners mix up),
// filter by level, search, and open a card showing the reading + real
// example words (pulled from the vocab bank) with TTS. The point is to
// confirm readings without getting fooled by voicing; the example words
// keep it anchored to how the kanji actually reads inside compounds.
export function KanjiOnyomiPanel({ language }: { language: Language }) {
  const t = copy[language];
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<JlptLevel | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);

  const families = useMemo(() => {
    const q = query.trim();
    const matched = kanjiOnyomi.filter((entry) => {
      if (level !== "all" && entry.level !== level) return false;
      if (!q) return true;
      return (
        entry.kanji.includes(q) ||
        entry.onyomi.some((reading) => reading.includes(q)) ||
        entry.meaningZh.includes(q)
      );
    });
    const byReading = new Map<string, KanjiOnyomiEntry[]>();
    for (const entry of matched) {
      const key = entry.onyomi[0];
      const bucket = byReading.get(key);
      if (bucket) bucket.push(entry);
      else byReading.set(key, [entry]);
    }
    // Biggest families first -- they're the most useful "don't mix these up"
    // groups; ties broken by reading for stable order.
    return [...byReading.entries()].sort(
      (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])
    );
  }, [query, level]);

  const detail = selected ? kanjiOnyomi.find((entry) => entry.kanji === selected) ?? null : null;
  const examples = detail ? kanjiExamples(detail.kanji) : [];

  return (
    <section className="kanji-panel" aria-label={t.kanjiTitle}>
      <header className="kanji-head">
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
        <div className="segmented">
          {LEVELS.map((option) => (
            <button
              key={option}
              type="button"
              className={level === option ? "selected" : ""}
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
              <p className="kanji-card-onyomi">
                {detail.onyomi.join("・")}
                <small>{t.kanjiOnyomiLabel}</small>
                <SpeakButton text={detail.onyomi[0]} language={language} />
              </p>
              <p className="kanji-card-mean">{detail.meaningZh}</p>
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
              <small>{t.kanjiOnyomiLabel}</small>
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
                  <span className="kanji-cell-read">{entry.onyomi.join("・")}</span>
                  <span className="kanji-cell-mean">{entry.meaningZh}</span>
                </button>
              ))}
            </div>
          </div>
        ))
      ) : (
        <p className="kanji-empty">{t.kanjiSearchEmpty}</p>
      )}
    </section>
  );
}
