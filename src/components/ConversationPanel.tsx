import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CONVERSATION_FEEDBACK_DIMENSIONS,
  type ConversationFeedbackResult
} from "../domain/conversationFeedback";
import { conversationCatalogDefinitions } from "../domain/conversationContent/catalog";
import {
  localizeConversationLearnerText,
  type ConversationSkillId
} from "../domain/conversationScenario";
import {
  createConversationSession,
  type ConversationSessionDefinition,
  type ConversationSessionState
} from "../domain/conversationSession";
import { copy, type Language } from "../i18n";

// Small Talk Lab runtime (#814): drives the finite conversation kernel
// (createConversationSession) over the explicit curated conversation catalog.
// The panel owns presentation only -- every transition, branch and feedback
// value comes from the engine; nothing here re-derives scenario flow or
// infers feedback from ids/text. The catalog is imported here (not in the eager
// barrel/App), and App React.lazy's this component, so conversation content
// stays out of the initial bundle.
export function ConversationPanel({
  language,
  definitions = conversationCatalogDefinitions
}: {
  language: Language;
  definitions?: readonly ConversationSessionDefinition[];
}) {
  const t = copy[language];
  const stageRef = useRef<HTMLElement | null>(null);
  const focusStage = useCallback((node: HTMLElement | null) => {
    stageRef.current = node;
  }, []);
  const roleLabel = (role: string) => Object.hasOwn(t.conversationRoles, role)
    ? t.conversationRoles[role]
    : role;
  // The session is a mutable engine instance; React state mirrors its
  // snapshot after every action so the panel re-renders deterministically.
  const session = useMemo(() => createConversationSession(definitions), [definitions]);
  const [state, setState] = useState<ConversationSessionState>(() => session.getState());
  // Focus the new stage's reading cue even when React reuses its DOM node.
  // Locale or other same-stage rerenders must not steal focus from its actions.
  useEffect(() => {
    stageRef.current?.focus();
  }, [state.phase, state.step?.id]);
  // Mirror the engine snapshot after each action. When the engine lands on a
  // partner line, remember it so the following learner_response step can show
  // the line it answers without re-walking the scenario graph.
  const [partnerLine, setPartnerLine] = useState<string | null>(null);
  const sync = () => {
    const next = session.getState();
    setState(next);
    if (next.phase === "interaction" && next.step?.kind === "partner_line") {
      setPartnerLine(next.step.japanese);
    }
  };

  // Which response example the learner picked for the pending feedback. The
  // engine's result identifies the curated feedback case (not the clicked
  // example), so the echo of the learner's own choice is tracked here; it is
  // cleared on retry / scenario change so no stale choice survives.
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);

  const handleSelect = (scenarioId: string) => {
    session.select(scenarioId);
    setPartnerLine(null);
    setSelectedResponseId(null);
    sync();
  };
  const handleStart = () => {
    session.start();
    sync();
  };
  const handleAdvance = () => {
    session.advance();
    sync();
  };
  const handleRespond = (responseExampleId: string) => {
    if (session.submitResponse(responseExampleId) != null) {
      setSelectedResponseId(responseExampleId);
    }
    sync();
  };
  const handleRetry = () => {
    session.retry();
    setSelectedResponseId(null);
    sync();
  };
  const handleContinue = () => {
    session.continue();
    setSelectedResponseId(null);
    sync();
  };
  const handleChangeScenario = () => {
    session.reset();
    setPartnerLine(null);
    setSelectedResponseId(null);
    sync();
  };
  const handleRunAgain = () => {
    const scenarioId = state.summary?.scenarioId;
    if (scenarioId == null) return;
    session.select(scenarioId);
    session.start();
    setPartnerLine(null);
    setSelectedResponseId(null);
    sync();
  };

  const renderPartnerLine = () => {
    if (state.step?.kind !== "partner_line") return null;
    return (
      <>
        <p className="conversation-partner-label">{t.conversationPartnerLabel}</p>
        <p ref={focusStage} tabIndex={-1} className="conversation-partner-line" lang="ja">
          {state.step.japanese}
        </p>
      </>
    );
  };

  const renderFeedback = (
    feedback: ConversationFeedbackResult<ConversationSkillId, "curated">
  ) => {
    const learnerStep = state.step?.kind === "learner_response" ? state.step : null;
    const selectedExample = learnerStep?.responseExamples.find(
      (example) => example.id === selectedResponseId
    );
    const deadEnd = feedback.continuationQuality === "dead_end";

    return (
      <div
        className={`conversation-turn conversation-feedback${deadEnd ? " is-dead-end" : ""}`}
      >
        <h3 ref={focusStage} tabIndex={-1} className="conversation-section-title">
          {t.conversationFeedbackTitle}
        </h3>
        {selectedExample ? (
          <p className="conversation-response-echo" lang="ja">
            {selectedExample.japanese}
          </p>
        ) : null}
        <dl className="conversation-dimensions">
          {CONVERSATION_FEEDBACK_DIMENSIONS.map((dimension) => (
            <div key={dimension} className="conversation-dimension">
              <dt>{t.conversationDimensions[dimension]}</dt>
              <dd data-status={feedback.dimensions[dimension]}>
                {t.conversationStatus[feedback.dimensions[dimension]]}
              </dd>
            </div>
          ))}
        </dl>
        {feedback.composition.length > 0 ? (
          <p className="conversation-composition">
            {feedback.composition
              .map((signal) => t.conversationComposition[signal.feature])
              .join("・")}
          </p>
        ) : null}
        <div className="conversation-actions">
          <button type="button" className="conversation-primary" onClick={handleRetry}>
            {t.conversationRetry}
          </button>
          <button type="button" className="conversation-secondary" onClick={handleContinue}>
            {t.conversationContinue}
          </button>
        </div>
        <p className="conversation-note">{t.conversationCuratedNote}</p>
      </div>
    );
  };

  const renderComplete = () => {
    const summary = state.summary;
    const completionStep = state.step?.kind === "completion" ? state.step : null;
    const moves = summary
      ? [
          ...new Set(
            summary.responses.flatMap((record) =>
              record.feedback.composition.map((signal) => signal.feature)
            )
          )
        ]
      : [];

    return (
      <div className="conversation-turn conversation-complete">
        <h3 ref={focusStage} tabIndex={-1} className="conversation-section-title">
          {t.conversationCompleteTitle}
        </h3>
        {completionStep ? (
          <p className="conversation-complete-summary">
            <span lang={language === "ja" ? "ja" : undefined}>
              {localizeConversationLearnerText(completionStep.summary, language)}
            </span>
          </p>
        ) : null}
        {summary ? (
          <div className="conversation-summary">
            <p className="conversation-summary-title">{t.conversationSummaryTitle}</p>
            <p className="conversation-summary-body">
              {t.conversationLengths[summary.length]}
              {moves.length > 0
                ? `・${t.conversationPracticedLabel}：${moves
                    .map((move) => t.conversationComposition[move])
                    .join("・")}`
                : ""}
            </p>
          </div>
        ) : null}
        <div className="conversation-actions">
          <button type="button" className="conversation-primary" onClick={handleRunAgain}>
            {t.conversationReset}
          </button>
          <button
            type="button"
            className="conversation-secondary"
            onClick={handleChangeScenario}
          >
            {t.conversationChangeScenario}
          </button>
        </div>
      </div>
    );
  };

  const renderTurn = () => {
    if (state.phase === "interaction" && state.step?.kind === "partner_line") {
      return (
        <div className="conversation-turn">
          {renderPartnerLine()}
          <button type="button" className="conversation-primary" onClick={handleAdvance}>
            {t.conversationContinue}
          </button>
        </div>
      );
    }

    if (state.phase === "interaction" && state.step?.kind === "learner_response") {
      return (
        <div className="conversation-turn">
          {partnerLine ? (
            <>
              <p className="conversation-partner-label">{t.conversationPartnerLabel}</p>
              <p className="conversation-partner-line" lang="ja">
                {partnerLine}
              </p>
            </>
          ) : null}
          <p className="conversation-prompt">
            <span lang={language === "ja" ? "ja" : undefined}>
              {localizeConversationLearnerText(state.step.prompt, language)}
            </span>
          </p>
          <p ref={focusStage} tabIndex={-1} className="conversation-choose-label">
            {t.conversationChooseResponse}
          </p>
          <div className="conversation-responses">
            {state.step.responseExamples.map((example) => (
              <button
                key={example.id}
                type="button"
                className="conversation-response"
                onClick={() => handleRespond(example.id)}
              >
                <span lang="ja">{example.japanese}</span>
                {example.explanation ? (
                  <small className="conversation-response-note">
                    {localizeConversationLearnerText(example.explanation, language)}
                  </small>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (state.phase === "feedback" && state.feedback) {
      return renderFeedback(state.feedback);
    }

    if (state.phase === "complete") {
      return renderComplete();
    }

    return null;
  };

  return (
    <section className="conversation-panel" aria-label={t.conversationTitle}>
      <header className="conversation-header">
        <h2
          ref={state.phase === "intro" ? focusStage : undefined}
          tabIndex={-1}
          className="conversation-title"
        >
          {t.conversationTitle}
        </h2>
        <p className="conversation-intro">{t.conversationIntro}</p>
      </header>

      {state.phase === "intro" ? (
        <div className="conversation-intro-body">
          <div className="conversation-scenes">
            {definitions.map(({ scenario }) => {
              const selected = state.scenario?.id === scenario.id;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  className="conversation-scene"
                  aria-pressed={selected}
                  onClick={() => handleSelect(scenario.id)}
                >
                  <strong className="conversation-scene-length">
                    {t.conversationLengths[scenario.length]}
                  </strong>
                  <span
                    className="conversation-scene-situation"
                    lang={language === "ja" ? "ja" : undefined}
                  >
                    {localizeConversationLearnerText(scenario.situation, language)}
                  </span>
                </button>
              );
            })}
          </div>

          {state.scenario ? (
            <article className="conversation-brief">
              <dl>
                <dt>{t.conversationLearnerRole}</dt>
                <dd>{roleLabel(state.scenario.relationship.learnerRole)}</dd>
                <dt>{t.conversationPartnerRole}</dt>
                <dd>{roleLabel(state.scenario.relationship.partnerRole)}</dd>
                <dt>{t.conversationRelationship}</dt>
                <dd lang={language === "ja" ? "ja" : undefined}>
                  {localizeConversationLearnerText(state.scenario.relationship.context, language)}
                </dd>
              </dl>
              <p lang={language === "ja" ? "ja" : undefined}>
                {localizeConversationLearnerText(state.scenario.objective, language)}
              </p>
              <p className="conversation-brief-instruction">
                <span lang={language === "ja" ? "ja" : undefined}>
                  {localizeConversationLearnerText(state.scenario.instruction, language)}
                </span>
              </p>
              <button
                type="button"
                className="conversation-primary"
                onClick={handleStart}
              >
                {t.conversationStart}
              </button>
            </article>
          ) : null}

          <p className="conversation-note">{t.conversationCuratedNote}</p>
        </div>
      ) : (
        <div className="conversation-run">
          {renderTurn()}
          {/* The complete view carries its own run-again / change-scene
              actions; every other live phase gets the single bail-out here. */}
          {state.phase !== "complete" ? (
            <div className="conversation-footer">
              <button
                type="button"
                className="conversation-secondary"
                onClick={handleChangeScenario}
              >
                {t.conversationChangeScenario}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
