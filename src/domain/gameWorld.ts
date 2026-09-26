import { evaluateCuratedConversationResponse, type ConversationContinuationQuality } from "./conversationFeedback";
import { localizeConversationLearnerText, type ConversationLearnerText, type ConversationScenario } from "./conversationScenario";
import type { LocaleCode } from "./types";
import { validateConversationSessionDefinitions, type ConversationSessionDefinition, type ConversationSessionState } from "./conversationSession";

export type GameLocationCategory = "home" | "school" | "transit" | "food" | "community" | "other";

export interface GameLocation {
  id: string;
  name: ConversationLearnerText;
  description: ConversationLearnerText;
  category: GameLocationCategory;
}

export interface NpcProfile {
  id: string;
  displayName: ConversationLearnerText;
  presentation: ConversationLearnerText;
  role: string;
  defaultRelationshipContext: ConversationLearnerText;
  relationshipStageIds: readonly string[];
}

export interface RelationshipStage {
  id: string;
  npcId: string;
  order: number;
  context: ConversationLearnerText;
}

export interface WorldMomentAvailability {
  requiredCompletedMomentIds: readonly string[];
  requiredRelationshipStageIds: readonly string[];
}

export interface GameWorldRelationshipUpdate {
  npcId: string;
  relationshipStageId: string;
}

export interface GameWorldResponseRequirement {
  /** Must identify a reachable learner-response step in the bound scenario. */
  stepId: string;
  minimumContinuationQuality: Exclude<ConversationContinuationQuality, "dead_end">;
}

export interface GameWorldConditionalOutcome {
  id: string;
  responseRequirement: GameWorldResponseRequirement;
  unlockMomentIds: readonly string[];
}

export interface WorldMoment {
  id: string;
  locationId: string;
  npcId: string;
  relationshipStageId: string;
  scenarioId: string;
  objective: ConversationLearnerText;
  availability: WorldMomentAvailability;
  onCompletion: {
    unlockLocationIds: readonly string[];
    unlockMomentIds: readonly string[];
    relationshipStageUpdates: readonly GameWorldRelationshipUpdate[];
  };
  conditionalOutcomes: readonly GameWorldConditionalOutcome[];
  completesArc?: boolean;
}

export interface GameWorldState {
  completedMomentIds: readonly string[];
  relationshipStages: Readonly<Record<string, string>>;
  unlockedLocationIds: readonly string[];
  unlockedMomentIds: readonly string[];
  outcomeReferences: readonly { momentId: string; outcomeId: string }[];
}

export interface GameWorldDefinition {
  id: string;
  locations: readonly GameLocation[];
  npcs: readonly NpcProfile[];
  relationshipStages: readonly RelationshipStage[];
  sessionDefinitions: readonly ConversationSessionDefinition[];
  moments: readonly WorldMoment[];
  initialState: GameWorldState;
  entryMomentIds: readonly string[];
}

export type GameWorldValidationErrorCode =
  | "duplicate_location_id"
  | "duplicate_npc_id"
  | "duplicate_relationship_stage_id"
  | "duplicate_scenario_id"
  | "duplicate_moment_id"
  | "duplicate_outcome_id"
  | "incompatible_outcome_steps"
  | "invalid_relationship_stage"
  | "invalid_location_reference"
  | "invalid_npc_reference"
  | "invalid_scenario_reference"
  | "invalid_bound_scenario_graph"
  | "invalid_moment_reference"
  | "invalid_outcome_reference"
  | "invalid_response_step_reference"
  | "invalid_relationship_transition"
  | "contradictory_initial_state"
  | "unsatisfiable_moment_precondition"
  | "unreachable_arc_completion"
  | "stranded_arc_state"
  | "state_budget_exceeded";

export interface GameWorldValidationError {
  code: GameWorldValidationErrorCode;
  entityId?: string;
  referenceId?: string;
}

export interface GameWorldValidationResult {
  valid: boolean;
  errors: GameWorldValidationError[];
}

const CONTINUATION_RANK: Readonly<Record<ConversationContinuationQuality, number>> = {
  dead_end: 0,
  opens_thread: 1,
  enriches_thread: 2
};

function hasDuplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}

function outcomeReferenceKey(momentId: string, outcomeId: string): string {
  return JSON.stringify([momentId, outcomeId]);
}

function compareExactStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function collectReachableScenarioStepIds(scenario: ConversationScenario): Set<string> {
  const stepsById = new Map(scenario.steps.map((step) => [step.id, step]));
  const reachable = new Set<string>();
  const pending = [scenario.startStepId];
  while (pending.length > 0) {
    const id = pending.pop();
    if (id == null || reachable.has(id)) continue;
    const step = stepsById.get(id);
    if (step == null) continue;
    reachable.add(id);
    if (step.kind === "partner_line") pending.push(step.nextStepId);
    else if (step.kind === "learner_response") pending.push(...step.branches.map(({ nextStepId }) => nextStepId));
  }
  return reachable;
}

function uniqueIds<T extends { id: string }>(
  values: readonly T[],
  code: GameWorldValidationErrorCode,
  errors: GameWorldValidationError[]
): Set<string> {
  const ids = new Set<string>();
  for (const value of values) {
    if (ids.has(value.id)) errors.push({ code, entityId: value.id });
    ids.add(value.id);
  }
  return ids;
}

function isMomentAvailable(world: GameWorldDefinition, moment: WorldMoment, state: GameWorldState): boolean {
  const stagesById = new Map(world.relationshipStages.map((stage) => [stage.id, stage]));
  return (
    state.unlockedMomentIds.includes(moment.id) &&
    state.unlockedLocationIds.includes(moment.locationId) &&
    !state.completedMomentIds.includes(moment.id) &&
    moment.availability.requiredCompletedMomentIds.every((id) => state.completedMomentIds.includes(id)) &&
    moment.availability.requiredRelationshipStageIds.every((id) => {
      const stage = stagesById.get(id);
      return stage != null && state.relationshipStages[stage.npcId] === id;
    }) &&
    state.relationshipStages[moment.npcId] === moment.relationshipStageId
  );
}

function hasContradictoryRelationshipPreconditions(
  moment: WorldMoment,
  stagesById: ReadonlyMap<string, RelationshipStage>
): boolean {
  const requiredStageByNpc = new Map<string, string>([[moment.npcId, moment.relationshipStageId]]);
  for (const stageId of moment.availability.requiredRelationshipStageIds) {
    const stage = stagesById.get(stageId);
    if (stage == null) continue;
    const existingStageId = requiredStageByNpc.get(stage.npcId);
    if (existingStageId != null && existingStageId !== stageId) return true;
    requiredStageByNpc.set(stage.npcId, stageId);
  }
  return false;
}

function isValidWorldState(world: GameWorldDefinition, state: GameWorldState): boolean {
  const locationIds = new Set(world.locations.map(({ id }) => id));
  const npcIds = new Set(world.npcs.map(({ id }) => id));
  const momentsById = new Map(world.moments.map((moment) => [moment.id, moment]));
  const stagesById = new Map(world.relationshipStages.map((stage) => [stage.id, stage]));
  if (
    hasDuplicates(state.completedMomentIds) ||
    hasDuplicates(state.unlockedMomentIds) ||
    hasDuplicates(state.unlockedLocationIds) ||
    hasDuplicates(state.outcomeReferences.map(({ momentId, outcomeId }) => outcomeReferenceKey(momentId, outcomeId))) ||
    Object.keys(state.relationshipStages).length !== npcIds.size ||
    Object.keys(state.relationshipStages).some((id) => !npcIds.has(id)) ||
    state.completedMomentIds.some((id) => !momentsById.has(id)) ||
    state.completedMomentIds.some((id) => !state.unlockedMomentIds.includes(id)) ||
    state.unlockedMomentIds.some((id) => !momentsById.has(id)) ||
    state.unlockedLocationIds.some((id) => !locationIds.has(id))
  ) return false;

  for (const npcId of npcIds) {
    const stage = stagesById.get(state.relationshipStages[npcId]);
    if (stage?.npcId !== npcId) return false;
  }
  return state.outcomeReferences.every(({ momentId, outcomeId }) =>
    state.completedMomentIds.includes(momentId) &&
    momentsById.get(momentId)?.conditionalOutcomes.some((outcome) => outcome.id === outcomeId) === true
  );
}

export function localizeGameWorldText(text: ConversationLearnerText, locale: LocaleCode): string {
  return localizeConversationLearnerText(text, locale);
}

function selectAvailableWorldMoments(
  world: GameWorldDefinition,
  state: GameWorldState
): readonly WorldMoment[] {
  if (!isValidWorldState(world, state)) return [];
  return world.moments.filter((moment) => isMomentAvailable(world, moment, state));
}

function canonicalStateKey(state: GameWorldState): string {
  return JSON.stringify({
    completed: [...state.completedMomentIds].sort(),
    relationships: Object.entries(state.relationshipStages).sort(([left], [right]) => compareExactStrings(left, right)),
    locations: [...state.unlockedLocationIds].sort(),
    moments: [...state.unlockedMomentIds].sort(),
    outcomes: state.outcomeReferences
      .map(({ momentId, outcomeId }) => [momentId, outcomeId] as const)
      .sort(([leftMoment, leftOutcome], [rightMoment, rightOutcome]) =>
        compareExactStrings(leftMoment, rightMoment) || compareExactStrings(leftOutcome, rightOutcome))
  });
}

export function getAvailableWorldMoments(
  world: GameWorldDefinition,
  state: GameWorldState
): readonly WorldMoment[] {
  const analysis = analyzeGameWorld(world);
  if (!analysis.valid || !isValidWorldState(world, state) || !analysis.reachableStateKeys.has(canonicalStateKey(state))) return [];
  return selectAvailableWorldMoments(world, state);
}

function validateInitialState(world: GameWorldDefinition, errors: GameWorldValidationError[]): void {
  const locations = new Set(world.locations.map(({ id }) => id));
  const npcs = new Map(world.npcs.map((npc) => [npc.id, npc]));
  const stages = new Map(world.relationshipStages.map((stage) => [stage.id, stage]));
  const moments = new Set(world.moments.map(({ id }) => id));
  const state = world.initialState;
  const momentsById = new Map(world.moments.map((moment) => [moment.id, moment]));
  const bad = (referenceId: string): void => {
    errors.push({ code: "contradictory_initial_state", referenceId });
  };

  if (
    hasDuplicates(state.completedMomentIds) ||
    hasDuplicates(state.unlockedLocationIds) ||
    hasDuplicates(state.unlockedMomentIds) ||
    hasDuplicates(state.outcomeReferences.map(({ momentId, outcomeId }) => outcomeReferenceKey(momentId, outcomeId))) ||
    hasDuplicates(world.entryMomentIds)
  ) bad("duplicate-initial-fact");

  for (const id of state.completedMomentIds) {
    if (!moments.has(id) || !state.unlockedMomentIds.includes(id)) bad(id);
  }
  for (const id of state.unlockedMomentIds) if (!moments.has(id)) bad(id);
  for (const id of state.unlockedLocationIds) if (!locations.has(id)) bad(id);
  for (const id of world.entryMomentIds) {
    if (!moments.has(id) || !state.unlockedMomentIds.includes(id) || state.completedMomentIds.includes(id)) bad(id);
  }
  for (const reference of state.outcomeReferences) {
    if (
      !state.completedMomentIds.includes(reference.momentId) ||
      !momentsById.get(reference.momentId)?.conditionalOutcomes.some(({ id }) => id === reference.outcomeId)
    ) {
      bad(`${reference.momentId}:${reference.outcomeId}`);
    }
  }

  for (const npc of world.npcs) {
    const stageId = state.relationshipStages[npc.id];
    const stage = stages.get(stageId);
    if (stage == null || stage.npcId !== npc.id || !npc.relationshipStageIds.includes(stageId)) bad(`${npc.id}:${stageId ?? "missing"}`);
  }
  for (const npcId of Object.keys(state.relationshipStages)) if (!npcs.has(npcId)) bad(npcId);

  if (isValidWorldState(world, state)) {
    for (const id of world.entryMomentIds) {
      const moment = momentsById.get(id);
      if (moment != null && !isMomentAvailable(world, moment, state)) bad(id);
    }
  }
}

interface PossibleMomentOutcomeSets {
  outcomes: readonly (readonly GameWorldConditionalOutcome[])[];
  stateBudgetExceeded: boolean;
}

function getPossibleMomentOutcomeSets(
  world: GameWorldDefinition,
  moment: WorldMoment
): PossibleMomentOutcomeSets {
  if (moment.conditionalOutcomes.length === 0) return { outcomes: [[]], stateBudgetExceeded: false };
  const requirementStepId = moment.conditionalOutcomes[0].responseRequirement.stepId;
  const definition = world.sessionDefinitions.find(({ scenario }) => scenario.id === moment.scenarioId);
  const scenario = definition?.scenario;
  if (definition == null || scenario == null) {
    return { outcomes: [], stateBudgetExceeded: false };
  }

  const stepsById = new Map(scenario.steps.map((step) => [step.id, step]));
  const bindingsByStepId = new Map<string, ConversationSessionDefinition["responses"][number][]>();
  for (const binding of definition.responses) {
    const bindings = bindingsByStepId.get(binding.stepId) ?? [];
    bindings.push(binding);
    bindingsByStepId.set(binding.stepId, bindings);
  }

  const pending: { stepId: string; requirementQuality?: ConversationContinuationQuality }[] = [
    { stepId: scenario.startStepId }
  ];
  const scenarioStateBudget = scenario.steps.length * (1 + Object.keys(CONTINUATION_RANK).length);
  const visited = new Set<string>();
  const outcomeSets = new Map<string, readonly GameWorldConditionalOutcome[]>();
  while (pending.length > 0) {
    const current = pending.pop();
    if (current == null) continue;
    const pathKey = JSON.stringify([current.stepId, current.requirementQuality ?? null]);
    if (visited.has(pathKey)) continue;
    if (visited.size >= scenarioStateBudget) return { outcomes: [...outcomeSets.values()], stateBudgetExceeded: true };
    visited.add(pathKey);

    const step = stepsById.get(current.stepId);
    if (step == null) continue;
    if (step.kind === "completion") {
      const quality = current.requirementQuality;
      const outcomes = quality == null ? [] : moment.conditionalOutcomes.filter(({ responseRequirement }) =>
        CONTINUATION_RANK[quality] >= CONTINUATION_RANK[responseRequirement.minimumContinuationQuality]
      );
      outcomeSets.set(JSON.stringify(outcomes.map(({ id }) => id).sort()), outcomes);
      continue;
    }
    if (step.kind === "partner_line") {
      pending.push({ stepId: step.nextStepId, requirementQuality: current.requirementQuality });
      continue;
    }

    for (const binding of bindingsByStepId.get(step.id) ?? []) {
      const branch = step.branches.find(({ id }) => id === binding.branchId);
      if (branch == null) continue;
      try {
        const quality = evaluateCuratedConversationResponse(binding.feedback).continuationQuality;
        pending.push({
          stepId: branch.nextStepId,
          requirementQuality: step.id === requirementStepId ? quality : current.requirementQuality
        });
      } catch {
        // Invalid feedback is rejected by session-definition validation; exclude it from feasible traces.
      }
    }
  }

  return { outcomes: [...outcomeSets.values()], stateBudgetExceeded: false };
}

function validateFiniteReachability(world: GameWorldDefinition, errors: GameWorldValidationError[]): ReadonlySet<string> {
  const reachableMomentIds = new Set(world.initialState.completedMomentIds);
  const pending: GameWorldState[] = [world.initialState];
  const visited = new Set<string>();
  const outgoing = new Map<string, Set<string>>();
  const terminal = new Set<string>();
  const completingMomentIds = new Set(world.moments.filter(({ completesArc }) => completesArc).map(({ id }) => id));
  const stagesById = new Map(world.relationshipStages.map((stage) => [stage.id, stage]));
  // Keep this proof bounded to the authored finite arc. If the state graph grows beyond this cap,
  // unvisited moments remain unproven and therefore fail validation conservatively.
  const stateBudget = Math.max(64, world.moments.length * world.moments.length * 4);
  const possibleOutcomesByMoment = new Map(world.moments.map((moment) => [
    moment.id,
    getPossibleMomentOutcomeSets(world, moment)
  ]));

  for (const momentId of world.initialState.completedMomentIds) {
    const possibleOutcomes = possibleOutcomesByMoment.get(momentId);
    if (possibleOutcomes == null || possibleOutcomes.stateBudgetExceeded) continue;
    const initialOutcomeIds = world.initialState.outcomeReferences
      .filter(({ momentId: referenceMomentId }) => referenceMomentId === momentId)
      .map(({ outcomeId }) => outcomeId)
      .sort();
    const hasFeasibleInitialOutcomeSet = possibleOutcomes.outcomes.some((outcomes) => {
      const possibleOutcomeIds = outcomes.map(({ id }) => id).sort();
      return initialOutcomeIds.length === possibleOutcomeIds.length &&
        initialOutcomeIds.every((outcomeId, index) => outcomeId === possibleOutcomeIds[index]);
    });
    if (!hasFeasibleInitialOutcomeSet) {
      errors.push({ code: "contradictory_initial_state", referenceId: momentId });
    }
  }

  const transition = (
    state: GameWorldState,
    moment: WorldMoment,
    outcomes: readonly GameWorldConditionalOutcome[] = []
  ): GameWorldState => ({
    completedMomentIds: addUnique(state.completedMomentIds, [moment.id]),
    relationshipStages: {
      ...state.relationshipStages,
      ...Object.fromEntries(moment.onCompletion.relationshipStageUpdates.map(({ npcId, relationshipStageId }) => [npcId, relationshipStageId]))
    },
    unlockedLocationIds: addUnique(state.unlockedLocationIds, moment.onCompletion.unlockLocationIds),
    unlockedMomentIds: addUnique(state.unlockedMomentIds, [
      ...moment.onCompletion.unlockMomentIds,
      ...outcomes.flatMap(({ unlockMomentIds }) => unlockMomentIds)
    ]),
    outcomeReferences: outcomes.reduce<GameWorldState["outcomeReferences"]>(
      (references, outcome) => addOutcomeReference(references, { momentId: moment.id, outcomeId: outcome.id }),
      state.outcomeReferences
    )
  });

  let stateBudgetExceeded = false;
  while (pending.length > 0) {
    const state = pending.pop();
    if (state == null) continue;
    const key = canonicalStateKey(state);
    if (visited.has(key)) continue;
    if (visited.size >= stateBudget) {
      stateBudgetExceeded = true;
      break;
    }
    visited.add(key);
    if (state.completedMomentIds.some((id) => completingMomentIds.has(id))) {
      terminal.add(key);
    }

    for (const moment of selectAvailableWorldMoments(world, state)) {
      if (hasContradictoryRelationshipPreconditions(moment, stagesById)) continue;
      reachableMomentIds.add(moment.id);
      const successors = outgoing.get(key) ?? new Set<string>();
      outgoing.set(key, successors);
      for (const outcomes of possibleOutcomesByMoment.get(moment.id)?.outcomes ?? [[]]) {
        const next = transition(state, moment, outcomes);
        successors.add(canonicalStateKey(next));
        pending.push(next);
      }
    }
  }

  if (
    stateBudgetExceeded ||
    [...possibleOutcomesByMoment.values()].some(({ stateBudgetExceeded }) => stateBudgetExceeded)
  ) errors.push({ code: "state_budget_exceeded" });

  const canReachTerminal = new Set(terminal);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [source, targets] of outgoing) {
      if (canReachTerminal.has(source) || ![...targets].some((target) => canReachTerminal.has(target))) continue;
      canReachTerminal.add(source);
      changed = true;
    }
  }

  for (const moment of world.moments) {
    if (!reachableMomentIds.has(moment.id)) {
      errors.push({ code: "unsatisfiable_moment_precondition", entityId: moment.id });
    }
  }
  if (terminal.size === 0) errors.push({ code: "unreachable_arc_completion" });
  if ([...visited].some((key) => !canReachTerminal.has(key))) errors.push({ code: "stranded_arc_state" });
  return visited;
}

interface GameWorldAnalysis extends GameWorldValidationResult {
  reachableStateKeys: ReadonlySet<string>;
}

function analyzeGameWorld(world: GameWorldDefinition): GameWorldAnalysis {
  const errors: GameWorldValidationError[] = [];
  const locationIds = uniqueIds(world.locations, "duplicate_location_id", errors);
  const npcIds = uniqueIds(world.npcs, "duplicate_npc_id", errors);
  const stageIds = uniqueIds(world.relationshipStages, "duplicate_relationship_stage_id", errors);
  const scenarioIds = uniqueIds(world.sessionDefinitions.map(({ scenario }) => scenario), "duplicate_scenario_id", errors);
  const momentIds = uniqueIds(world.moments, "duplicate_moment_id", errors);
  const npcsById = new Map(world.npcs.map((npc) => [npc.id, npc]));
  const stagesById = new Map(world.relationshipStages.map((stage) => [stage.id, stage]));
  const scenariosById = new Map(world.sessionDefinitions.map(({ scenario }) => [scenario.id, scenario]));
  const reachableStepsByScenarioId = new Map(
    world.sessionDefinitions.map(({ scenario }) => [scenario.id, collectReachableScenarioStepIds(scenario)])
  );
  const boundScenarioIds = new Set(world.moments.map(({ scenarioId }) => scenarioId));
  const invalidSessionDefinitions = validateConversationSessionDefinitions(
    world.sessionDefinitions.filter(({ scenario }) => boundScenarioIds.has(scenario.id))
  );
  const invalidBoundScenarioIds = new Set(invalidSessionDefinitions.errors.flatMap(({ scenarioId }) =>
    scenarioId != null && boundScenarioIds.has(scenarioId) ? [scenarioId] : []
  ));
  for (const id of invalidBoundScenarioIds) errors.push({ code: "invalid_bound_scenario_graph", entityId: id });

  for (const npc of world.npcs) {
    if (hasDuplicates(npc.relationshipStageIds)) errors.push({ code: "invalid_relationship_stage", entityId: npc.id });
    for (const id of npc.relationshipStageIds) {
      if (stagesById.get(id)?.npcId !== npc.id) errors.push({ code: "invalid_relationship_stage", entityId: npc.id, referenceId: id });
    }
  }
  for (const stage of world.relationshipStages) {
    const npc = npcsById.get(stage.npcId);
    if (npc == null || !npc.relationshipStageIds.includes(stage.id) || !Number.isInteger(stage.order) || stage.order < 0) {
      errors.push({ code: "invalid_relationship_stage", entityId: stage.id, referenceId: stage.npcId });
    }
  }

  for (const moment of world.moments) {
    if (!locationIds.has(moment.locationId)) errors.push({ code: "invalid_location_reference", entityId: moment.id, referenceId: moment.locationId });
    if (!npcIds.has(moment.npcId)) errors.push({ code: "invalid_npc_reference", entityId: moment.id, referenceId: moment.npcId });
    if (!scenarioIds.has(moment.scenarioId)) errors.push({ code: "invalid_scenario_reference", entityId: moment.id, referenceId: moment.scenarioId });
    if (stagesById.get(moment.relationshipStageId)?.npcId !== moment.npcId) {
      errors.push({ code: "invalid_relationship_stage", entityId: moment.id, referenceId: moment.relationshipStageId });
    }
    const outcomeIds = new Set<string>();
    const outcomeStepIds = new Set<string>();
    for (const outcome of moment.conditionalOutcomes) {
      if (outcomeIds.has(outcome.id)) errors.push({ code: "duplicate_outcome_id", entityId: moment.id, referenceId: outcome.id });
      outcomeIds.add(outcome.id);
      outcomeStepIds.add(outcome.responseRequirement.stepId);
    }
    if (outcomeStepIds.size > 1) errors.push({ code: "incompatible_outcome_steps", entityId: moment.id });
  }

  for (const moment of world.moments) {
    for (const id of [...moment.availability.requiredCompletedMomentIds, ...moment.onCompletion.unlockMomentIds, ...moment.conditionalOutcomes.flatMap(({ unlockMomentIds }) => unlockMomentIds)]) {
      if (!momentIds.has(id)) errors.push({ code: "invalid_moment_reference", entityId: moment.id, referenceId: id });
    }
    for (const id of moment.onCompletion.unlockLocationIds) {
      if (!locationIds.has(id)) errors.push({ code: "invalid_location_reference", entityId: moment.id, referenceId: id });
    }
    for (const id of moment.availability.requiredRelationshipStageIds) {
      if (!stageIds.has(id)) errors.push({ code: "invalid_relationship_stage", entityId: moment.id, referenceId: id });
    }
    const updatedNpcs = new Set<string>();
    for (const update of moment.onCompletion.relationshipStageUpdates) {
      const currentStage = stagesById.get(moment.relationshipStageId);
      const nextStage = stagesById.get(update.relationshipStageId);
      if (
        nextStage?.npcId !== update.npcId ||
        !npcIds.has(update.npcId) ||
        update.npcId !== moment.npcId ||
        currentStage == null ||
        nextStage.order <= currentStage.order
      ) {
        errors.push({ code: "invalid_relationship_transition", entityId: moment.id, referenceId: update.relationshipStageId });
      }
      if (updatedNpcs.has(update.npcId)) errors.push({ code: "invalid_relationship_stage", entityId: moment.id, referenceId: update.npcId });
      updatedNpcs.add(update.npcId);
    }
    const scenario = scenariosById.get(moment.scenarioId);
    for (const outcome of moment.conditionalOutcomes) {
      const step = scenario?.steps.find(({ id }) => id === outcome.responseRequirement.stepId);
      if (
        step?.kind !== "learner_response" ||
        !reachableStepsByScenarioId.get(moment.scenarioId)?.has(outcome.responseRequirement.stepId)
      ) {
        errors.push({ code: "invalid_response_step_reference", entityId: moment.id, referenceId: outcome.responseRequirement.stepId });
      }
    }
  }

  validateInitialState(world, errors);
  const reachableStateKeys = validateFiniteReachability(world, errors);
  return { valid: errors.length === 0, errors, reachableStateKeys };
}

export function validateGameWorld(world: GameWorldDefinition): GameWorldValidationResult {
  const { valid, errors } = analyzeGameWorld(world);
  return { valid, errors };
}

function replayCompletedSession(
  definition: ConversationSessionDefinition,
  session: ConversationSessionState
): ReadonlyMap<string, ConversationContinuationQuality> | null {
  const { scenario } = definition;
  const summary = session.summary;
  if (
    summary == null ||
    !Array.isArray(summary.responses) ||
    session.phase !== "complete" ||
    session.scenario?.id !== scenario.id ||
    summary.scenarioId !== scenario.id ||
    summary.length !== scenario.length ||
    session.step?.kind !== "completion"
  ) return null;

  const stepsById = new Map(scenario.steps.map((step) => [step.id, step]));
  const responsesByKey = new Map(definition.responses.map((binding) => [
    JSON.stringify([binding.stepId, binding.responseExampleId]),
    binding
  ]));
  const qualities = new Map<string, ConversationContinuationQuality>();
  let stepId: string | undefined = scenario.startStepId;
  let responseIndex = 0;
  const visited = new Set<string>();

  while (stepId != null && !visited.has(stepId)) {
    visited.add(stepId);
    const step = stepsById.get(stepId);
    if (step == null) return null;
    if (step.kind === "completion") {
      return responseIndex === summary.responses.length && session.step.id === step.id
        ? qualities
        : null;
    }
    if (step.kind === "partner_line") {
      stepId = step.nextStepId;
      continue;
    }

    const record = summary.responses[responseIndex];
    if (
      record == null ||
      typeof record.stepId !== "string" ||
      typeof record.responseExampleId !== "string" ||
      record.stepId !== step.id ||
      record.feedback == null ||
      typeof record.feedback !== "object"
    ) return null;
    responseIndex += 1;
    const binding = responsesByKey.get(JSON.stringify([record.stepId, record.responseExampleId]));
    if (
      binding == null ||
      binding.stepId !== record.stepId ||
      binding.responseExampleId !== record.responseExampleId ||
      record.feedback.source !== "curated"
    ) return null;
    const trustedFeedback = evaluateCuratedConversationResponse(binding.feedback);
    if (
      record.feedback.responseId !== trustedFeedback.responseId ||
      record.feedback.continuationQuality !== trustedFeedback.continuationQuality
    ) return null;
    qualities.set(step.id, trustedFeedback.continuationQuality);
    stepId = step.branches.find(({ id }) => id === binding.branchId)?.nextStepId;
    if (stepId == null) return null;
  }
  return null;
}

function isResponseRequirementMet(
  requirement: GameWorldResponseRequirement,
  qualities: ReadonlyMap<string, ConversationContinuationQuality>
): boolean {
  const quality = qualities.get(requirement.stepId);
  return quality != null && CONTINUATION_RANK[quality] >= CONTINUATION_RANK[requirement.minimumContinuationQuality];
}

function addUnique(values: readonly string[], additions: readonly string[]): string[] {
  const result = [...values];
  for (const value of additions) if (!result.includes(value)) result.push(value);
  return result;
}

function addOutcomeReference(
  references: GameWorldState["outcomeReferences"],
  next: GameWorldState["outcomeReferences"][number]
): GameWorldState["outcomeReferences"] {
  return references.some(({ momentId, outcomeId }) => momentId === next.momentId && outcomeId === next.outcomeId)
    ? [...references]
    : [...references, next];
}

export interface GameWorldTransitionResult {
  applied: boolean;
  state: GameWorldState;
  reason?: "unknown_moment" | "unavailable_moment" | "incomplete_session" | "scenario_mismatch" | "rejected_session" | "invalid_world" | "invalid_state";
}

export function applyCompletedConversationSession(
  world: GameWorldDefinition,
  state: GameWorldState,
  momentId: string,
  session: ConversationSessionState
): GameWorldTransitionResult {
  const analysis = analyzeGameWorld(world);
  if (!analysis.valid) return { applied: false, state, reason: "invalid_world" };
  if (!isValidWorldState(world, state) || !analysis.reachableStateKeys.has(canonicalStateKey(state))) {
    return { applied: false, state, reason: "invalid_state" };
  }
  const moment = world.moments.find(({ id }) => id === momentId);
  if (moment == null) return { applied: false, state, reason: "unknown_moment" };
  if (state.completedMomentIds.includes(momentId)) return { applied: false, state, reason: "unavailable_moment" };
  if (!isMomentAvailable(world, moment, state)) return { applied: false, state, reason: "unavailable_moment" };
  if (session.phase !== "complete" || session.summary == null || session.scenario == null) {
    return { applied: false, state, reason: "incomplete_session" };
  }
  const definition = world.sessionDefinitions.find(({ scenario }) => scenario.id === moment.scenarioId);
  if (session.scenario.id !== moment.scenarioId || session.summary.scenarioId !== moment.scenarioId) {
    return { applied: false, state, reason: "scenario_mismatch" };
  }
  const trustedQualities = definition == null ? null : replayCompletedSession(definition, session);
  if (trustedQualities == null) return { applied: false, state, reason: "rejected_session" };

  const relationshipStages = { ...state.relationshipStages };
  for (const update of moment.onCompletion.relationshipStageUpdates) {
    relationshipStages[update.npcId] = update.relationshipStageId;
  }
  const matchedOutcomes = moment.conditionalOutcomes.filter(({ responseRequirement }) =>
    isResponseRequirementMet(responseRequirement, trustedQualities)
  );
  const newlyUnlockedMoments = [
    ...moment.onCompletion.unlockMomentIds,
    ...matchedOutcomes.flatMap(({ unlockMomentIds }) => unlockMomentIds)
  ];
  const outcomeReferences = matchedOutcomes.map(({ id }) => ({ momentId, outcomeId: id }));
  return {
    applied: true,
    state: {
      completedMomentIds: addUnique(state.completedMomentIds, [momentId]),
      relationshipStages,
      unlockedLocationIds: addUnique(state.unlockedLocationIds, moment.onCompletion.unlockLocationIds),
      unlockedMomentIds: addUnique(state.unlockedMomentIds, newlyUnlockedMoments),
      outcomeReferences: [
        ...state.outcomeReferences,
        ...outcomeReferences.filter((reference) => !state.outcomeReferences.some((existing) => existing.momentId === momentId && existing.outcomeId === reference.outcomeId))
      ]
    }
  };
}
