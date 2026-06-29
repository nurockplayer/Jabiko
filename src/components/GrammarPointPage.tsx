import { ArrowLeft, GraduationCap } from "lucide-react";
import { copy, type Language } from "../i18n";
import { buildGrammarPoint } from "../domain/grammarPoints";
import { GrammarNoteCard } from "./GrammarNoteCard";

// Standalone study page for a single 文法点 (issue #281). Deep-linkable at
// /grammar/<surface>; content is aggregated from the exam bank and enriched
// with the curated grammarNotes entry when one exists. Reaches the lazy
// exam/notes data through buildGrammarPoint, so it is itself lazily loaded
// (see App's React.lazy import) and never enters the initial bundle.
export function GrammarPointPage({
  surface,
  language,
  onPractice,
  onBack
}: {
  surface: string;
  language: Language;
  onPractice: () => void;
  onBack: () => void;
}) {
  const t = copy[language];
  const point = buildGrammarPoint(surface);

  const backButton = (
    <button type="button" className="ghost-button grammar-point-back" onClick={onBack}>
      <ArrowLeft aria-hidden="true" />
      {t.reviewDoneExit}
    </button>
  );

  // Unknown surface (e.g. a stale/typo link): show a minimal, non-crashing
  // shell so the route still resolves and the user can step back.
  if (!point) {
    return (
      <section className="grammar-point grammar-point-missing">
        {backButton}
        <h1 lang="ja">{surface}</h1>
      </section>
    );
  }

  // Curated examples are shown inside GrammarNoteCard; list only the additional
  // exam-derived sentences here so nothing repeats.
  const curatedJa = new Set((point.note?.examples ?? []).map((example) => example.ja));
  const extraExamples = point.examples.filter((example) => !curatedJa.has(example.ja));

  return (
    <section className="grammar-point" aria-label={surface}>
      {backButton}

      <header className="grammar-point-head">
        <h1 lang="ja">{surface}</h1>
        {point.level ? (
          <span className="grammar-point-level" aria-label={`JLPT ${point.level}`}>
            {point.level}
          </span>
        ) : null}
      </header>

      {point.note ? (
        <GrammarNoteCard note={point.note} language={language} />
      ) : (
        <div className="grammar-point-summary">
          <p className="grammar-point-meaning">{point.meaningZh}</p>
          {point.explanations.length > 0 ? (
            <div className="grammar-point-rule">
              {point.explanations.map((explanation) => (
                <p key={explanation}>{explanation}</p>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {extraExamples.length > 0 ? (
        <div className="grammar-point-examples">
          <p className="grammar-point-label">{t.grammarNoteExamples}</p>
          <ul>
            {extraExamples.map((example) => (
              <li key={example.ja}>
                <span className="grammar-point-ex-ja" lang="ja">
                  {example.ja}
                </span>
                {example.zh ? <span className="grammar-point-ex-zh">{example.zh}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <button type="button" className="next-button grammar-point-practice" onClick={onPractice}>
        <GraduationCap aria-hidden="true" />
        {t.startChallenge}
      </button>
    </section>
  );
}
