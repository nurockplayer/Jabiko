import { useCallback, useMemo, useState } from "react";
import {
  applyCompletedConversationSession,
  getGameWorldAvailability,
  type GameWorldDefinition,
  type GameWorldState
} from "../domain/gameWorld";
import {
  readGameWorldProgress,
  writeConfirmedGameWorldProgress,
  type GameWorldProgressStorage
} from "../domain/gameWorldProgress";
import type { ConversationSessionState } from "../domain/conversationSession";

type Availability =
  | { status: "ready"; state: GameWorldState }
  | { status: "invalid" | "incompatible" | "storage_error" | "world_invalid" | "state_invalid" };

function getLocalStorage(): GameWorldProgressStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Owns the world session's candidate, storage confirmation, and progression state. */
export function useGameWorldProgress(world: GameWorldDefinition, contentRevision: number) {
  const [availability, setAvailability] = useState<Availability>(() => {
    const initialAvailability = getGameWorldAvailability(world, world.initialState);
    if (initialAvailability.status === "invalid_world") return { status: "world_invalid" };
    if (initialAvailability.status === "invalid_state") return { status: "state_invalid" };
    const storage = getLocalStorage();
    if (storage == null) return { status: "storage_error" };
    const saved = readGameWorldProgress(storage, world, contentRevision);
    if (saved.status === "missing") return { status: "ready", state: world.initialState };
    if (saved.status === "ready") return { status: "ready", state: saved.state };
    return { status: saved.status };
  });
  const [activeMomentId, setActiveMomentId] = useState<string | null>(null);
  const [lastCompletedMomentId, setLastCompletedMomentId] = useState<string | null>(null);
  const [pendingCandidate, setPendingCandidate] = useState<{
    momentId: string;
    state: GameWorldState;
    previousState: GameWorldState;
  } | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [lastConsequence, setLastConsequence] = useState<{
    momentId: string;
    newlyUnlockedMomentIds: readonly string[];
  } | null>(null);

  const confirmedState = availability.status === "ready" ? availability.state : null;
  const activeMoment = world.moments.find(({ id }) => id === activeMomentId) ?? null;
  const activeDefinition = activeMoment == null
    ? null
    : world.sessionDefinitions.find(({ scenario }) => scenario.id === activeMoment.scenarioId) ?? null;
  const activeDefinitions = useMemo(
    () => activeDefinition == null ? [] : [activeDefinition],
    [activeDefinition]
  );
  const availableMomentIds = useMemo(() => {
    if (confirmedState == null) return [];
    const result = getGameWorldAvailability(world, confirmedState);
    return result.status === "ready" ? result.availableMomentIds : [];
  }, [confirmedState, world]);
  const requiredMomentList = world.moments.filter(({ id }) => id !== "covered-route-optional");
  const completedRequiredCount = confirmedState == null
    ? 0
    : requiredMomentList.filter(({ id }) => confirmedState.completedMomentIds.includes(id)).length;
  const arcComplete = world.moments.some(({ id, completesArc }) =>
    completesArc && confirmedState?.completedMomentIds.includes(id)
  );

  const saveCandidate = useCallback((momentId: string, state: GameWorldState, previousState: GameWorldState) => {
    const storage = getLocalStorage();
    const result = storage == null
      ? { status: "storage_error" as const }
      : writeConfirmedGameWorldProgress(storage, world, contentRevision, state);
    if (result.status !== "confirmed") {
      setPendingCandidate({ momentId, state, previousState });
      setSaveError(true);
      return false;
    }
    setAvailability({ status: "ready", state });
    setPendingCandidate(null);
    setSaveError(false);
    setLastCompletedMomentId(momentId);
    setLastConsequence({
      momentId,
      newlyUnlockedMomentIds: state.unlockedMomentIds.filter((id) => !previousState.unlockedMomentIds.includes(id))
    });
    setActiveMomentId(null);
    return true;
  }, [contentRevision, world]);

  const completeSession = useCallback((session: ConversationSessionState) => {
    if (activeMomentId == null || confirmedState == null || pendingCandidate != null) return false;
    const result = applyCompletedConversationSession(world, confirmedState, activeMomentId, session);
    if (!result.applied) {
      setSaveError(true);
      return false;
    }
    return saveCandidate(activeMomentId, result.state, confirmedState);
  }, [activeMomentId, confirmedState, pendingCandidate, saveCandidate, world]);

  const retrySave = useCallback(() => {
    if (pendingCandidate != null) saveCandidate(pendingCandidate.momentId, pendingCandidate.state, pendingCandidate.previousState);
  }, [pendingCandidate, saveCandidate]);
  const exitMoment = useCallback(() => {
    if (pendingCandidate != null) return;
    setActiveMomentId(null);
    setSaveError(false);
  }, [pendingCandidate]);
  const startMoment = useCallback((momentId: string) => {
    if (availableMomentIds.includes(momentId) && pendingCandidate == null) setActiveMomentId(momentId);
  }, [availableMomentIds, pendingCandidate]);

  return {
    availability,
    confirmedState,
    activeMoment,
    activeDefinition,
    activeDefinitions,
    availableMomentIds,
    completedRequiredCount,
    requiredMomentCount: requiredMomentList.length,
    arcComplete,
    lastCompletedMomentId,
    lastConsequence,
    pendingCandidate,
    saveError,
    startMoment,
    exitMoment,
    completeSession,
    retrySave
  };
}
