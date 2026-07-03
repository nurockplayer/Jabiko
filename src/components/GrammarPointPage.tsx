import { ArrowLeft, GraduationCap, Clapperboard, BookOpen, AlertTriangle } from "lucide-react";
import { copy, type Language } from "../i18n";
import { buildGrammarPoint } from "../domain/grammarPoints";
import { pickLocalized } from "../domain/localizedContent";
import { GrammarNoteCard } from "./GrammarNoteCard";
import { grammarPatterns } from "../domain/grammarDatabase";
import { findPatternBySurface } from "../domain/grammarIndex";
import type { GrammarPattern, MediaLineExample } from "../domain/grammarDatabase";
import type { JlptLevel } from "../domain/types";

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
//
// Issue #437 extends the page with the grammar database: media examples (日劇／
// 動漫台詞), related-pattern comparisons, and common-mistakes notes — all from
// the curated grammarDatabase.ts.
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

  // Database enrichment: match the surface via domain helper to find
  // media examples, related patterns, and common mistakes.
  const dbPattern = findPatternBySurface(surface);
  const dbRelated = dbPattern
    ? grammarPatterns.filter((p) => dbPattern.relatedPatternIds.includes(p.id))
    : [];

  const backButton = (
    <button type="button" className="ghost-button gp-back" onClick={onBack}>
      <ArrowLeft aria-hidden="true" />
      {t.reviewDoneExit}
    </button>
  );

  // Unknown surface (stale/typo link): neither exam data nor database entry exists.
  if (!point) {
    if (!dbPattern) {
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

    // Database-only surface: exists in grammarDatabase but has no exam-bank point.
    // Show the database content (formation, examples, media, related patterns)
    // without exam-sourced usage notes or practice exercises.
    return (
      <section className="grammar-point" aria-label={surface}>
        {backButton}
        <header className="gp-hero">
          <div className="gp-hero-row">
            <h1 className="gp-surface" lang="ja">
              {surface}
            </h1>
            <span className="gp-level" aria-label={`JLPT ${dbPattern.level}`}>
              {dbPattern.level}
            </span>
          </div>
          <p className="gp-meaning">{dbPattern.meaningZh}</p>
          <p className="gp-formation">{dbPattern.formation}</p>
        </header>

        {dbPattern.examples.length > 0 ? (
          <section className="gp-card">
            <h2 className="gp-card-title">{t.grammarDatabaseExamples}</h2>
            <ul className="gp-examples">
              {dbPattern.examples.map((ex) => (
                <li key={ex.japanese}>
                  <span className="gp-ex-ja" lang="ja">{ex.japanese}</span>
                  {ex.meaningZh ? <span className="gp-ex-zh">{ex.meaningZh}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {dbPattern.mediaExamples.length > 0 ? (
          <section className="gp-card gp-media">
            <h2 className="gp-card-title">
              <Clapperboard aria-hidden="true" className="gp-card-title-icon" />
              {t.grammarMediaExamples}
            </h2>
            <MediaExamples mediaExamples={dbPattern.mediaExamples} language={language} />
          </section>
        ) : null}

        {dbRelated.length > 0 ? (
          <section className="gp-card">
            <h2 className="gp-card-title">
              <BookOpen aria-hidden="true" className="gp-card-title-icon" />
              {t.grammarRelatedPatterns}
            </h2>
            <ul className="gp-related-list">
              {dbRelated.map((related) => (
                <li key={related.id} className="gp-related-item">
                  <span className="gp-related-pattern" lang="ja">{related.pattern}</span>
                  <p className="gp-related-meaning">{related.meaningZh}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {dbPattern.commonMistakes && dbPattern.commonMistakes.length > 0 ? (
          <section className="gp-card">
            <h2 className="gp-card-title">
              <AlertTriangle aria-hidden="true" className="gp-card-title-icon" />
              {t.grammarCommonMistakes}
            </h2>
            <ul className="gp-mistakes-list">
              {dbPattern.commonMistakes.map((mistake, i) => (
                <li key={i}>{mistake}</li>
              ))}
            </ul>
          </section>
        ) : null}
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

      {/* `#437`: Database examples — only when curated note is absent (it already
          shows curated examples through GrammarNoteCard) */}
      {!point.note && dbPattern && dbPattern.examples.length > 0 ? (
        <section className="gp-card">
          <h2 className="gp-card-title">{t.grammarDatabaseExamples}</h2>
          <ul className="gp-examples">
            {dbPattern.examples.map((ex) => (
              <li key={ex.japanese}>
                <span className="gp-ex-ja" lang="ja">
                  {ex.japanese}
                </span>
                {ex.meaningZh ? (
                  <span className="gp-ex-zh">{ex.meaningZh}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* #437: 日劇／動漫台詞例句 */}
      {dbPattern && dbPattern.mediaExamples.length > 0 ? (
        <section className="gp-card gp-media">
          <h2 className="gp-card-title">
            <Clapperboard aria-hidden="true" className="gp-card-title-icon" />
            {t.grammarMediaExamples}
          </h2>
          <MediaExamples mediaExamples={dbPattern.mediaExamples} language={language} />
        </section>
      ) : null}

      {/* #437: 相近文型比較 */}
      {dbRelated.length > 0 ? (
        <section className="gp-card">
          <h2 className="gp-card-title">
            <BookOpen aria-hidden="true" className="gp-card-title-icon" />
            {t.grammarRelatedPatterns}
          </h2>
          <ul className="gp-related-list">
            {dbRelated.map((related) => (
              <li key={related.id} className="gp-related-item">
                <span className="gp-related-pattern" lang="ja">
                  {related.pattern}
                </span>
                <p className="gp-related-meaning">{related.meaningZh}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* #437: 常見錯誤 */}
      {dbPattern && dbPattern.commonMistakes && dbPattern.commonMistakes.length > 0 ? (
        <section className="gp-card">
          <h2 className="gp-card-title">
            <AlertTriangle aria-hidden="true" className="gp-card-title-icon" />
            {t.grammarCommonMistakes}
          </h2>
          <ul className="gp-mistakes-list">
            {dbPattern.commonMistakes.map((mistake, i) => (
              <li key={i}>{mistake}</li>
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

/** 日劇／動漫台詞例句塊 */
function MediaExamples({ mediaExamples, language }: { mediaExamples: MediaLineExample[]; language: Language }) {
  const t = copy[language];
  const confidenceLabels: Record<MediaLineExample["confidence"], string> = {
    verified: t.grammarConfidenceVerified,
    subtitle_verified: t.grammarConfidenceSubtitleVerified,
    approximate: t.grammarConfidenceApproximate,
    inspired_by: t.grammarConfidenceInspiredBy,
  };

  const sourceLabels: Record<MediaLineExample["sourceType"], string> = {
    anime: t.grammarSourceAnime,
    drama: t.grammarSourceDrama,
    movie: t.grammarSourceMovie,
    other: t.grammarSourceOther,
  };

  return (
    <ul className="gp-media-list">
      {mediaExamples.map((m, i) => (
        <li key={i} className="gp-media-item">
          <blockquote className="gp-media-line" lang="ja">
            {m.lineJa}
          </blockquote>
          {m.lineZh ? <p className="gp-media-line-zh">{m.lineZh}</p> : null}
          <div className="gp-media-meta">
            <span className="gp-media-source">
              [{sourceLabels[m.sourceType]}]
              {m.titleJa}{m.titleZh ? `（${m.titleZh}）` : ""}
              {m.episode ? ` ${m.episode}` : ""}
              {m.character ? `・${m.character}` : ""}
            </span>
            <span className={`gp-media-confidence gp-confidence-${m.confidence}`}>
              {confidenceLabels[m.confidence]}
            </span>
          </div>
          {m.contextZh ? <p className="gp-media-context">{m.contextZh}</p> : null}
        </li>
      ))}
    </ul>
  );
}
