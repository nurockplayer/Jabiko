import { Fragment, useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { LearningRuby } from "./LearningRuby";
import { LearningFuriganaContext } from "./learningFuriganaContext";
import { gamePreviewCopyFor } from "../domain/gamePreviewCopy";
import { gameWorldCopyFor } from "../domain/gameWorldCopy";
import {
  localizeGameWorldText,
} from "../domain/gameWorld";
import { rainyMondayContent, rainyMondayContentRevision } from "../domain/gameWorldContent/rainyMonday";
import type { Language } from "../i18n";
import { ConversationExperience } from "./ConversationExperience";
import { LearningRubyText } from "./LearningRubyText";
import { useLearningFuriganaMap } from "./useLearningFuriganaMap";
import { useGameWorldProgress } from "./useGameWorldProgress";
import type { NavigationId } from "../domain/navigation";
import "./GamePreviewPanel.css";
import "./GameWorldPanel.css";

export function GameWorldPanel({
  language,
  headerMenu,
  onHeaderNavigate,
  furiganaLabel,
  furiganaEnabled,
  onToggleFurigana,
  onNavigate
}: {
  language: Language;
  headerMenu: (onSelect: (id: NavigationId) => void) => ReactNode;
  onHeaderNavigate: (id: NavigationId) => void;
  furiganaLabel: string;
  furiganaEnabled: boolean;
  onToggleFurigana: () => void;
  onNavigate: (view: "home" | "conversation") => void;
}) {
  const copy = gamePreviewCopyFor(language);
  const worldCopy = gameWorldCopyFor(language);
  const { world, profile } = rainyMondayContent;
  const progress = useGameWorldProgress(world, rainyMondayContentRevision);
  const {
    availability, confirmedState, activeMoment, activeDefinition, activeDefinitions,
    availableMomentIds, completedRequiredCount, requiredMomentCount, arcComplete,
    lastCompletedMomentId, lastConsequence, pendingCandidate, saveError,
    startMoment, exitMoment, completeSession, retrySave
  } = progress;
  const learningMap = useLearningFuriganaMap(furiganaEnabled);

  const navigation = (view: "home" | "conversation", event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (pendingCandidate != null && !window.confirm(worldCopy.pendingLeaveConfirm)) return;
    onNavigate(view);
  };
  const text = (value: Parameters<typeof localizeGameWorldText>[0]) => localizeGameWorldText(value, language);
  const renderSupport = (value: string, locale: Language) => <LearningRubyText text={value} language={locale} />;
  const renderLocalized = (value: Parameters<typeof localizeGameWorldText>[0]) => renderSupport(text(value), language);
  const lastCompletedMoment = world.moments.find(({ id }) => id === lastCompletedMomentId);
  const lastCompletedNpc = world.npcs.find(({ id }) => id === lastCompletedMoment?.npcId);
  const currentRelationshipStageId = lastCompletedNpc && confirmedState
    ? confirmedState.relationshipStages[lastCompletedNpc.id]
    : null;
  const currentRelationshipStage = world.relationshipStages.find(({ id }) => id === currentRelationshipStageId);
  const mostRecentlyCompletedMoment = confirmedState == null
    ? null
    : [...world.moments].reverse().find(({ id }) => confirmedState.completedMomentIds.includes(id)) ?? null;
  const leadMoment = activeMoment
    ?? world.moments.find(({ id }) => availableMomentIds.includes(id))
    ?? mostRecentlyCompletedMoment
    ?? world.moments.find(({ id }) => world.entryMomentIds.includes(id))
    ?? null;
  const leadLocation = world.locations.find(({ id }) => id === leadMoment?.locationId);
  const leadNpc = world.npcs.find(({ id }) => id === leadMoment?.npcId);
  const leadStageId = leadNpc && confirmedState ? confirmedState.relationshipStages[leadNpc.id] : leadMoment?.relationshipStageId;
  const leadStage = world.relationshipStages.find(({ id }) => id === leadStageId);
  const currentPlaceHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const previousActiveMomentId = useRef<string | null>(null);
  useEffect(() => {
    const activeId = activeMoment?.id ?? null;
    if (previousActiveMomentId.current != null && activeId == null) currentPlaceHeadingRef.current?.focus();
    previousActiveMomentId.current = activeId;
  }, [activeMoment?.id]);

  return (
    <LearningFuriganaContext.Provider value={learningMap}>
      <div className="game-preview-shell game-world-shell" data-world-profile={profile}>
        <a className="jt1-skip-link" href="#main-content">{copy.skip}</a>
        <header className="game-preview-header">
          <span className="game-preview-identity" aria-current="page">{copy.identity}</span>
          <span className="game-preview-status">{worldCopy.title}</span>
          <a className="game-preview-header-return" href="/" onClick={(event) => navigation("home", event)}>
            {copy.returnTraining}
          </a>
          <button
            className="game-preview-furigana"
            type="button"
            aria-pressed={furiganaEnabled}
            aria-label={furiganaLabel}
            onClick={onToggleFurigana}
          >
            {furiganaLabel}
          </button>
          {headerMenu((id) => {
            if (pendingCandidate != null && !window.confirm(worldCopy.pendingLeaveConfirm)) return;
            onHeaderNavigate(id);
          })}
        </header>
        <main id="main-content" className="game-preview-main game-world-main" tabIndex={-1}>
          <section className="game-preview-content game-world-content" aria-labelledby="game-world-title">
            <p className="game-preview-eyebrow">{renderSupport(worldCopy.title, language)}</p>
            <h1 ref={currentPlaceHeadingRef} id="game-world-title" tabIndex={-1}>
              {leadLocation ? renderLocalized(leadLocation.name) : renderSupport(worldCopy.title, language)}
            </h1>
            <p>{worldCopy.intro}</p>

            {leadMoment && leadLocation && leadNpc && leadStage ? (
              <section className="game-world-current" aria-label={worldCopy.currentMoment}>
                <p className="game-world-current-person">{renderLocalized(leadNpc.displayName)} · {renderLocalized(leadNpc.presentation)}</p>
                <p>{renderLocalized(leadStage.context)}</p>
                <p>{renderLocalized(leadLocation.description)}</p>
                <p className="game-world-current-objective">{renderLocalized(leadMoment.objective)}</p>
                {activeMoment == null && availableMomentIds.includes(leadMoment.id) ? (
                  <button className="game-world-start" type="button" onClick={() => startMoment(leadMoment.id)}>
                    {worldCopy.startConversation}
                  </button>
                ) : null}
              </section>
            ) : null}

            {availability.status === "world_invalid" ? (
              <div className="game-world-state-message" role="alert">
                <h2>{worldCopy.worldUnavailableTitle}</h2><p>{worldCopy.worldUnavailableBody}</p>
              </div>
            ) : availability.status === "state_invalid" ? (
              <div className="game-world-state-message" role="alert">
                <h2>{worldCopy.stateUnavailableTitle}</h2><p>{worldCopy.stateUnavailableBody}</p>
              </div>
            ) : availability.status === "invalid" || availability.status === "incompatible" ? (
              <div className="game-world-state-message" role="alert">
                <h2>{worldCopy.invalidSaveTitle}</h2>
                <p>{worldCopy.invalidSaveBody}</p>
              </div>
            ) : availability.status === "storage_error" ? (
              <div className="game-world-state-message" role="alert"><p>{worldCopy.storageUnavailable}</p></div>
            ) : activeMoment != null && activeDefinition != null ? (
              <>
                <p className="game-world-unfinished-note">
                  {pendingCandidate ? worldCopy.pendingLossNote : worldCopy.unfinishedNote}
                </p>
                {saveError ? (
                  <div className="game-world-save-error" role="alert">
                  <p>{worldCopy.saveFailed}</p>
                    {pendingCandidate ? (
                      <button type="button" onClick={retrySave}>{worldCopy.retrySave}</button>
                    ) : null}
                  </div>
                ) : null}
                <ConversationExperience
                  key={activeMoment.id}
                  language={language}
                  definitions={activeDefinitions}
                  chooserDefinitions={[]}
                  controlledScenarioId={activeDefinition.scenario.id}
                  allowBrowse={false}
                  allowReplay={false}
                    onExit={pendingCandidate == null ? exitMoment : undefined}
                  exitLabel={worldCopy.returnToWorld}
                    onComplete={completeSession}
                  renderJapanese={(value) => <LearningRuby text={value} />}
                  renderSupport={renderSupport}
                    showAttemptComparison
                    attemptComparisonLabels={{
                      label: worldCopy.attemptComparisonLabel,
                      previous: worldCopy.previousChoice,
                      revised: worldCopy.revisedChoice
                    }}
                />
              </>
            ) : confirmedState != null ? (
              <>
                <p className="game-world-progress">{worldCopy.progress(completedRequiredCount, requiredMomentCount)}</p>
                {arcComplete ? <p className="game-world-arc-complete">{worldCopy.arcComplete}</p> : null}
                {lastCompletedMomentId ? (
                  <p className="game-world-checkpoint" role="status">
                    {worldCopy.confirmedCheckpoint}{" "}{lastCompletedMoment && renderLocalized(lastCompletedMoment.objective)}
                    {lastConsequence && lastConsequence.newlyUnlockedMomentIds.length > 0 ? (
                      <span className="game-world-consequence">
                        {" "}{worldCopy.unlockedMoments}{" "}
                        {lastConsequence.newlyUnlockedMomentIds.map((id, index) => {
                          const unlocked = world.moments.find((moment) => moment.id === id);
                          return unlocked ? <Fragment key={id}>{index > 0 ? "、" : null}{id === "covered-route-optional" ? `${worldCopy.optional}：` : null}{renderLocalized(unlocked.objective)}</Fragment> : null;
                        })}
                      </span>
                    ) : null}
                  </p>
                ) : null}
                {lastCompletedNpc && currentRelationshipStage ? (
                  <p className="game-world-relationship" role="status">
                    {worldCopy.relationshipContext}{" "}{renderLocalized(currentRelationshipStage.context)}
                  </p>
                ) : null}
                <h2>{worldCopy.available}</h2>
                <div className="game-world-locations">
                  {world.locations.filter(({ id }) => confirmedState.unlockedLocationIds.includes(id)).map((location) => {
                    const moments = world.moments.filter(({ id, locationId }) =>
                      locationId === location.id && id !== leadMoment?.id && availableMomentIds.includes(id)
                    );
                    if (moments.length === 0) return null;
                    return (
                      <section className="game-world-location" key={location.id} aria-labelledby={`location-${location.id}`}>
                        <h3 id={`location-${location.id}`}>{renderLocalized(location.name)}</h3>
                        <p>{renderLocalized(location.description)}</p>
                        {moments.map((moment) => (
                          <button
                            className="game-world-moment"
                            key={moment.id}
                            type="button"
                            onClick={() => {
                              startMoment(moment.id);
                            }}
                          >
                            {moment.id === "covered-route-optional" ? <small>{worldCopy.optional}</small> : null}
                            {renderLocalized(moment.objective)}
                            <span>{renderLocalized(world.npcs.find(({ id }) => id === moment.npcId)!.displayName)}</span>
                          </button>
                        ))}
                      </section>
                    );
                  })}
                </div>
                <ol className="game-world-trail" aria-label={worldCopy.progress(completedRequiredCount, requiredMomentCount)}>
                  {world.moments.filter(({ id }) => confirmedState.completedMomentIds.includes(id)).map((moment) => (
                    <li key={moment.id}>{renderLocalized(moment.objective)}</li>
                  ))}
                </ol>
                <details className="game-world-privacy">
                  <summary>{worldCopy.privacyLabel}</summary>
                  <p>{worldCopy.privacy}</p>
                </details>
              </>
            ) : null}

            <nav className="game-world-product-links" aria-label={worldCopy.title}>
              <a href="/conversation" onClick={(event) => navigation("conversation", event)}>{worldCopy.smallTalk}</a>
              <a href="/" onClick={(event) => navigation("home", event)}>{copy.returnTraining}</a>
            </nav>
          </section>
        </main>
      </div>
    </LearningFuriganaContext.Provider>
  );
}
