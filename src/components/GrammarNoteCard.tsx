import { copy, type Language } from "../i18n";
import type { GrammarNote } from "../domain/grammarNotes";
import { localizeGrammarNote } from "../domain/grammarNoteText";
import { grammarNoteI18n } from "../domain/grammarNotes.i18n";

// Reusable presentation for one grammar-point reference note (issue #137):
// meaning / formation / usage / examples / easily-confused points. Pure
// presentation over a GrammarNote -- used inside the post-answer feedback
// (the wrong -> learn loop) and reusable by the #97 exam-prep learning
// tier. Carries no data lookup of its own.
export function GrammarNoteCard({ note, language }: { note: GrammarNote; language: Language }) {
  const t = copy[language];
  // Localize the Chinese prose to the current language (falls back to zh);
  // the Japanese examples / surface / level are preserved.
  const n = localizeGrammarNote(note, language, grammarNoteI18n);
  return (
    <div className="grammar-note">
      <div className="grammar-note-head">
        <strong>{n.surface}</strong>
        {n.jlptLevel ? (
          <span className="grammar-note-level" aria-label={`JLPT ${n.jlptLevel}`}>
            {n.jlptLevel}
          </span>
        ) : null}
      </div>
      <p className="grammar-note-meaning">{n.meaningZh}</p>
      <dl className="grammar-note-fields">
        <dt>{t.grammarNoteFormation}</dt>
        <dd>{n.formation}</dd>
        <dt>{t.grammarNoteUsage}</dt>
        <dd>{n.usageZh}</dd>
      </dl>
      {n.examples.length > 0 ? (
        <div className="grammar-note-examples">
          <p className="grammar-note-label">{t.grammarNoteExamples}</p>
          <ul>
            {n.examples.map((example) => (
              <li key={example.ja}>
                {example.ja}
                <span>{example.zh}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {n.confusions.length > 0 ? (
        <div className="grammar-note-confusions">
          <p className="grammar-note-label">{t.grammarNoteConfusions}</p>
          <ul>
            {n.confusions.map((confusion) => (
              <li key={confusion}>{confusion}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
