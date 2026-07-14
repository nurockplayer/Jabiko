import { ArrowRight } from "lucide-react";
import { copy, type Language } from "../i18n";
import { KANA_TABLE, type KanaEntry, type KanaGroup, type KanaScript } from "../domain/kana";
import { SpeakButton } from "./SpeakButton";

// Standalone /kana reference page (#619): the full hiragana + katakana charts
// with per-cell TTS and romaji, grouped 清音 / 濁音・半濁音 / 拗音. This is a
// route, NOT a nav tab -- entry points are the kana study chapters, the
// beginner flow, and (mainly) search engines via the prerendered HTML.
const GROUP_ORDER: Array<{ groups: KanaGroup[]; labelKey: "kanaGroupSeion" | "kanaGroupDakuon" | "kanaGroupYouon" }> = [
  { groups: ["seion"], labelKey: "kanaGroupSeion" },
  { groups: ["dakuon", "handakuon"], labelKey: "kanaGroupDakuon" },
  { groups: ["youon"], labelKey: "kanaGroupYouon" }
];

// Bucket one script's entries into gojuon rows, preserving table order.
function rowsFor(script: KanaScript, groups: KanaGroup[]): Array<[string, KanaEntry[]]> {
  const rows = new Map<string, KanaEntry[]>();
  for (const entry of KANA_TABLE) {
    if (entry.script !== script || !groups.includes(entry.group)) continue;
    const bucket = rows.get(entry.row);
    if (bucket) bucket.push(entry);
    else rows.set(entry.row, [entry]);
  }
  return [...rows.entries()];
}

export function KanaTablePage({
  language,
  onStartKanaDrill
}: {
  language: Language;
  onStartKanaDrill: (script: KanaScript) => void;
}) {
  const t = copy[language];
  const scripts: Array<{ script: KanaScript; label: string }> = [
    { script: "hiragana", label: t.kanaHiragana },
    { script: "katakana", label: t.kanaKatakana }
  ];

  return (
    <section className="kana-page" aria-label={t.kanaPageTitle}>
      <header className="kana-head">
        <h2 className="kana-page-title">{t.kanaPageTitle}</h2>
        <p>{t.kanaPageIntro}</p>
      </header>

      {scripts.map(({ script, label }) => (
        <section className="kana-page-script" key={script} aria-label={label}>
          <h2>{label}</h2>
          {GROUP_ORDER.map(({ groups, labelKey }) => (
            <div className="kana-page-group" key={labelKey}>
              <h3>{t[labelKey]}</h3>
              {rowsFor(script, groups).map(([row, entries]) => (
                <div className="kana-page-row" key={row} aria-label={row}>
                  {entries.map((entry) => (
                    <span className="kana-page-cell" key={entry.kana}>
                      <span className="kana-page-glyph" lang="ja">
                        {entry.kana}
                      </span>
                      <span className="kana-page-romaji">{entry.romaji}</span>
                      <SpeakButton text={entry.kana} language={language} />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          ))}
          <div className="inline-action-row">
            <button
              type="button"
              className="inline-drill-button"
              onClick={() => onStartKanaDrill(script)}
            >
              <ArrowRight aria-hidden="true" />
              {label}・{t.drillKana}
            </button>
          </div>
        </section>
      ))}
    </section>
  );
}
