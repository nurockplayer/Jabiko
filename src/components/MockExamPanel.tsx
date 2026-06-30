import { useState } from "react";
import { AlertTriangle, ArrowRight, ClipboardList } from "lucide-react";
import { copy, type Language } from "../i18n";
import { getMockExamBlueprint, type MockExamLevel } from "../domain/mockExam";
import { buildExamQuestionPool } from "../domain/examBlocks";
import { BooksSpot } from "../illustrations";

// 模擬考 mode: a section picker. The learner taps a JLPT section and
// drills just that section in the normal challenge view (the parent
// wires onStartSection -> exam mode filtered by promptLabel). Sections
// with no authored items yet render as a plain "準備中" info row, not a
// disabled button.
export function MockExamPanel({
  language,
  onStartSection
}: {
  language: Language;
  onStartSection: (level: MockExamLevel, promptLabel: string) => void;
}) {
  const t = copy[language];
  const [level, setLevel] = useState<MockExamLevel>("N2");

  const blueprint = getMockExamBlueprint(level);
  const pool = buildExamQuestionPool(level);
  // Live count of available questions per section (keyed by promptLabel).
  const counts = new Map<string, number>();
  for (const question of pool) {
    const key = question.promptLabel ?? "";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return (
    <section className="mock-panel" aria-label={t.mockExam}>
      <header className="mock-section-head">
        <BooksSpot className="panel-header-spot" />
        <p className="eyebrow">
          <ClipboardList aria-hidden="true" />
          {t.mockSectionTitle}
        </p>
        <p className="mock-section-intro">{t.mockSectionIntro}</p>
      </header>

      <fieldset className="mock-level-picker">
        <legend>{t.mockExamLevelLabel}</legend>
        <div className="segmented level-segmented">
          {(["N3", "N2", "N1"] as MockExamLevel[]).map((option) => (
            <button
              key={option}
              type="button"
              className={level === option ? "selected" : ""}
              onClick={() => setLevel(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <ol className="mock-section-rows">
        {blueprint.sections.map((section) => {
          const count = counts.get(section.promptLabel) ?? 0;
          // Sections with no authored questions yet render as a plain
          // info row ("準備中"), NOT a disabled button -- you can't drill
          // an empty pool, so it shouldn't look like a dead action.
          // Sections with questions are clickable cards.
          if (count === 0) {
            return (
              <li key={section.id}>
                <div className="mock-section-card empty">
                  <div className="mock-section-meta">
                    <strong>{section.labelJa}</strong>
                    <small>{section.labelZh}</small>
                  </div>
                  <span className="mock-section-warn">
                    <AlertTriangle aria-hidden="true" />
                    {t.mockSectionEmpty}
                  </span>
                </div>
              </li>
            );
          }
          return (
            <li key={section.id}>
              <button
                type="button"
                className="mock-section-card"
                onClick={() => onStartSection(level, section.promptLabel)}
              >
                <div className="mock-section-meta">
                  <strong>{section.labelJa}</strong>
                  <small>{section.labelZh}</small>
                </div>
                <span className="mock-section-count">{t.mockSectionCount(count)}</span>
                <ArrowRight className="mock-section-arrow" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
