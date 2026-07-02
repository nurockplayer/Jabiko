import { ArrowLeft, GraduationCap } from "lucide-react";
import { copy, type Language } from "../i18n";
import { buildGrammarPoint } from "../domain/grammarPoints";
import { pickLocalized } from "../domain/localizedContent";
import { GrammarNoteCard } from "./GrammarNoteCard";

// Strip a leading "正解是「…」，" answer-explanation lead-in (#339): the exam
// bank's explanations are written for a quiz ("the correct answer is X,
// because…"), which reads wrong on a study page. Drop that prefix so what's
// left reads as a usage note; non-matching strings pass through untouched.
// The en/ja overlays carry their own translated lead-ins (#427), so each
// launched content locale gets its own pattern. Exported for tests.
export function cleanExplanation(text: string): string {
  return text
    .replace(/^正解是「[^」]*」[，、。]?\s*/, "")
    .replace(/^正解は「[^」]*」(?:です)?[。、，]?\s*/, "")
    .replace(/^The correct answer is\s*["「][^"」]*["」]\s*[,.:;]?\s*/i, "");
}

// Standalone study page for a single 文法点 (issue #281, redesigned in #339).
// Card-based layout: a hero with the point + meaning, a reference card (curated
// GrammarNoteCard when available, otherwise meaning + usage notes from the exam
// bank), worked examples, and a practice CTA. Deep-linkable at /grammar/<surface>;
// reaches the lazy exam/notes data so it is itself lazily loaded.
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
    <button type="button" className="ghost-button gp-back" onClick={onBack}>
      <ArrowLeft aria-hidden="true" />
      {t.reviewDoneExit}
    </button>
  );

  // Unknown surface (stale/typo link): minimal, non-crashing shell.
  if (!point) {
    return (
      <section className="grammar-point grammar-point-missing">
        {backButton}
        <header className="gp-hero">
          <h1 className="gp-surface" lang="ja">
            {surface}
          </h1>
        </header>
      </section>
    );
  }

  // A curated point shows everything (meaning / rule / examples / confusions)
  // inside GrammarNoteCard, so the page adds nothing more. An un-noted point
  // gets a usage card + an examples card built from the exam bank.
  const usageNotes = point.explanations
    .map((entry) => cleanExplanation(pickLocalized(entry.zh, entry.i18n, language)))
    .filter(Boolean)
    .slice(0, 2);
  const showExamples = !point.note && point.examples.length > 0;

  return (
    <section className="grammar-point" aria-label={surface}>
      {backButton}

      <header className="gp-hero">
        <div className="gp-hero-row">
          <h1 className="gp-surface" lang="ja">
            {surface}
          </h1>
          {point.level ? (
            <span className="gp-level" aria-label={`JLPT ${point.level}`}>
              {point.level}
            </span>
          ) : null}
        </div>
        {/* The curated card carries its own meaning; only lead with it here when
            there's no note, to avoid showing the same line twice. */}
        {point.note ? null : (
          <p className="gp-meaning">{pickLocalized(point.meaningZh, point.meaningI18n, language)}</p>
        )}
      </header>

      {point.note ? (
        <GrammarNoteCard note={point.note} language={language} />
      ) : usageNotes.length > 0 ? (
        <section className="gp-card">
          <h2 className="gp-card-title">{t.grammarNoteUsage}</h2>
          {usageNotes.map((note) => (
            <p key={note} className="gp-usage">
              {note}
            </p>
          ))}
        </section>
      ) : null}

      {showExamples ? (
        <section className="gp-card">
          <h2 className="gp-card-title">{t.grammarNoteExamples}</h2>
          <ul className="gp-examples">
            {point.examples.map((example) => (
              <li key={example.ja}>
                <span className="gp-ex-ja" lang="ja">
                  {example.ja}
                </span>
                {example.zh ? (
                  <span className="gp-ex-zh">{pickLocalized(example.zh, example.zhI18n, language)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <button type="button" className="next-button gp-practice" onClick={onPractice}>
        <GraduationCap aria-hidden="true" />
        {t.startChallenge}
      </button>
    </section>
  );
}
