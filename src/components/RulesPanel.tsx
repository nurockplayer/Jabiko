import { copy, type Language } from "../i18n";
import { CONJUGATION_TABLES } from "../domain/conjugationTables";
import { BrushSpot } from "../illustrations";

// "規則表" view: a read-only reference page of conjugation tables.
// Pure presentational; all data lives in domain/conjugationTables.ts
// so future tables (formal forms / adjective variations / sentence
// patterns) just need a data-file edit and no component change.
export function RulesPanel({ language }: { language: Language }) {
  const t = copy[language];
  return (
    <section className="rules-panel" aria-label={t.rules}>
      <header className="rules-header">
        <BrushSpot className="panel-header-spot" />
        <p className="eyebrow">{t.rulesEyebrow}</p>
        <h2>{t.rulesPanelTitle}</h2>
        <p>{t.rulesPanelIntro}</p>
      </header>
      {CONJUGATION_TABLES.map((table) => (
        <article key={table.id} className="rules-table-card">
          <header className="rules-table-head">
            <h2>{table.title}</h2>
            <p>{table.caption}</p>
          </header>
          <div className="rules-table-wrap" role="region" aria-label={table.title}>
            <table>
              <thead>
                <tr>
                  {table.columns.map((col) => (
                    <th key={col} scope="col">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {table.pitfalls && table.pitfalls.length > 0 ? (
            <ul className="rules-pitfalls">
              {table.pitfalls.map((pitfall) => (
                <li key={pitfall}>{pitfall}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </section>
  );
}
