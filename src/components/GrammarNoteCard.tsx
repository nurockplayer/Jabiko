import { copy, type Language } from "../i18n";
import type { GrammarNote } from "../domain/grammarNotes";

// Reusable presentation for one grammar-point reference note (issue #137):
// meaning / formation / usage / examples / easily-confused points. Pure
// presentation over a GrammarNote -- used inside the post-answer feedback
// (the wrong -> learn loop) and reusable by the #97 exam-prep learning
// tier. Carries no data lookup of its own.
export function GrammarNoteCard({ note, language }: { note: GrammarNote; language: Language }) {
  const t = copy[language];
  return (
    <div className="grammar-note">
      <div className="grammar-note-head">
        <strong>{note.surface}</strong>
        {note.jlptLevel ? (
          <span className="grammar-note-level" aria-label={`JLPT ${note.jlptLevel}`}>
            {note.jlptLevel}
          </span>
        ) : null}
      </div>
      <p className="grammar-note-meaning">{note.meaningZh}</p>
      <dl className="grammar-note-fields">
        <dt>{t.grammarNoteFormation}</dt>
        <dd>{note.formation}</dd>
        <dt>{t.grammarNoteUsage}</dt>
        <dd>{note.usageZh}</dd>
      </dl>
      {note.examples.length > 0 ? (
        <div className="grammar-note-examples">
          <p className="grammar-note-label">{t.grammarNoteExamples}</p>
          <ul>
            {note.examples.map((example) => (
              <li key={example.ja}>
                {example.ja}
                <span>{example.zh}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {note.confusions.length > 0 ? (
        <div className="grammar-note-confusions">
          <p className="grammar-note-label">{t.grammarNoteConfusions}</p>
          <ul>
            {note.confusions.map((confusion) => (
              <li key={confusion}>{confusion}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
