import {
  evaluateCuratedConversationResponse,
  type ConversationFeedbackResult,
  type CuratedConversationResponse
} from "./conversationFeedback";
import {
  resolveConversationNextStep,
  validateConversationScenarios,
  type ConversationLength,
  type ConversationScenario,
  type ConversationSkillId,
  type ConversationStep
} from "./conversationScenario";

export interface ConversationSessionResponseBinding {
  stepId: string;
  responseExampleId: string;
  branchId: string;
  feedback: CuratedConversationResponse<ConversationSkillId>;
}

export interface ConversationSessionDefinition {
  scenario: ConversationScenario;
  responses: readonly ConversationSessionResponseBinding[];
}

export type ConversationSessionDefinitionErrorCode =
  | "invalid_scenario"
  | "unknown_step"
  | "step_not_learner_response"
  | "unknown_response_example"
  | "unknown_branch"
  | "response_text_mismatch"
  | "invalid_feedback_id"
  | "invalid_feedback_context"
  | "duplicate_binding"
  | "duplicate_feedback_id"
  | "unbound_learner_step";

export interface ConversationSessionDefinitionError {
  code: ConversationSessionDefinitionErrorCode;
  scenarioId?: string;
  stepId?: string;
  referenceId?: string;
}

export interface ConversationSessionDefinitionValidation {
  valid: boolean;
  errors: ConversationSessionDefinitionError[];
}

function collectReachableStepIds(scenario: ConversationScenario): Set<string> {
  const stepsById = new Map(scenario.steps.map((step) => [step.id, step]));
  const reachableStepIds = new Set<string>();
  const pendingStepIds = [scenario.startStepId];

  while (pendingStepIds.length > 0) {
    const stepId = pendingStepIds.pop() as string;
    if (reachableStepIds.has(stepId)) continue;
    const step = stepsById.get(stepId);
    if (step == null) continue;
    reachableStepIds.add(stepId);

    if (step.kind === "partner_line") {
      pendingStepIds.push(step.nextStepId);
    } else if (step.kind === "learner_response") {
      pendingStepIds.push(...step.branches.map((branch) => branch.nextStepId));
    }
  }

  return reachableStepIds;
}

export function validateConversationSessionDefinitions(
  definitions: readonly ConversationSessionDefinition[]
): ConversationSessionDefinitionValidation {
  const errors: ConversationSessionDefinitionError[] = [];

  const scenarioValidation = validateConversationScenarios(
    definitions.map((definition) => definition.scenario)
  );
  for (const error of scenarioValidation.errors) {
    errors.push({
      code: "invalid_scenario",
      scenarioId: error.scenarioId,
      stepId: error.stepId,
      referenceId: error.referenceId
    });
  }

  const seenFeedbackIds = new Set<string>();
  const seenBindings = new Set<string>();

  for (const definition of definitions) {
    const { scenario } = definition;
    const stepsById = new Map(scenario.steps.map((step) => [step.id, step]));
    const reachableStepIds = collectReachableStepIds(scenario);
    const boundStepIds = new Set<string>();

    for (const binding of definition.responses) {
      const step = stepsById.get(binding.stepId);
      if (step == null) {
        errors.push({
          code: "unknown_step",
          scenarioId: scenario.id,
          stepId: binding.stepId,
          referenceId: binding.responseExampleId
        });
        continue;
      }
      if (step.kind !== "learner_response") {
        errors.push({
          code: "step_not_learner_response",
          scenarioId: scenario.id,
          stepId: step.id,
          referenceId: binding.responseExampleId
        });
        continue;
      }

      const example = step.responseExamples.find(
        (candidate) => candidate.id === binding.responseExampleId
      );
      if (example == null) {
        errors.push({
          code: "unknown_response_example",
          scenarioId: scenario.id,
          stepId: step.id,
          referenceId: binding.responseExampleId
        });
        continue;
      }
      if (!step.branches.some((branch) => branch.id === binding.branchId)) {
        errors.push({
          code: "unknown_branch",
          scenarioId: scenario.id,
          stepId: step.id,
          referenceId: binding.branchId
        });
        continue;
      }
      boundStepIds.add(step.id);

      if (example.japanese !== binding.feedback.responseJapanese) {
        errors.push({
          code: "response_text_mismatch",
          scenarioId: scenario.id,
          stepId: step.id,
          referenceId: binding.feedback.id
        });
      }

      const bindingKey = `${scenario.id}::${step.id}::${example.id}`;
      if (seenBindings.has(bindingKey)) {
        errors.push({
          code: "duplicate_binding",
          scenarioId: scenario.id,
          stepId: step.id,
          referenceId: example.id
        });
      } else {
        seenBindings.add(bindingKey);
      }

      const feedbackId = binding.feedback.id.trim();
      if (feedbackId.length === 0) {
        errors.push({
          code: "invalid_feedback_id",
          scenarioId: scenario.id,
          stepId: step.id
        });
      } else if (seenFeedbackIds.has(feedbackId)) {
        errors.push({
          code: "duplicate_feedback_id",
          scenarioId: scenario.id,
          stepId: step.id,
          referenceId: feedbackId
        });
      } else {
        seenFeedbackIds.add(feedbackId);
      }

      try {
        evaluateCuratedConversationResponse(binding.feedback);
      } catch {
        errors.push({
          code: "invalid_feedback_context",
          scenarioId: scenario.id,
          stepId: step.id,
          referenceId: binding.feedback.id
        });
      }
    }

    for (const stepId of reachableStepIds) {
      if (stepsById.get(stepId)?.kind !== "learner_response") continue;
      if (!boundStepIds.has(stepId)) {
        errors.push({
          code: "unbound_learner_step",
          scenarioId: scenario.id,
          stepId
        });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export type ConversationSessionPhase = "intro" | "interaction" | "feedback" | "complete";

export interface ConversationSessionResponseRecord {
  stepId: string;
  responseExampleId: string;
  feedback: ConversationFeedbackResult<ConversationSkillId, "curated">;
}

export interface ConversationSessionSummary {
  scenarioId: string;
  length: ConversationLength;
  skillsPracticed: readonly ConversationSkillId[];
  responses: readonly ConversationSessionResponseRecord[];
}

export interface ConversationSessionState {
  phase: ConversationSessionPhase;
  scenario: ConversationScenario | null;
  step: ConversationStep | null;
  feedback: ConversationFeedbackResult<ConversationSkillId, "curated"> | null;
  summary: ConversationSessionSummary | null;
}

export interface ConversationSession {
  getState(): ConversationSessionState;
  select(scenarioId: string): boolean;
  start(): boolean;
  advance(): boolean;
  submitResponse(
    responseExampleId: string
  ): ConversationFeedbackResult<ConversationSkillId, "curated"> | null;
  retry(): boolean;
  continue(): boolean;
  reset(): boolean;
}

interface PendingFeedback {
  stepId: string;
  responseExampleId: string;
  branchId: string;
  result: ConversationFeedbackResult<ConversationSkillId, "curated">;
}

export function createConversationSession(
  definitions: readonly ConversationSessionDefinition[]
): ConversationSession {
  const validation = validateConversationSessionDefinitions(definitions);
  if (!validation.valid) {
    const codes = [...new Set(validation.errors.map((error) => error.code))].join(", ");
    throw new Error(`Invalid conversation session definitions: ${codes}`);
  }

  const definitionsByScenarioId = new Map(
    definitions.map((definition) => [definition.scenario.id, definition])
  );

  let phase: ConversationSessionPhase = "intro";
  let scenario: ConversationScenario | null = null;
  let step: ConversationStep | null = null;
  let feedback: ConversationFeedbackResult<ConversationSkillId, "curated"> | null = null;
  let summary: ConversationSessionSummary | null = null;
  let pending: PendingFeedback | null = null;
  let completedResponses: ConversationSessionResponseRecord[] = [];

  const buildSummary = (activeScenario: ConversationScenario): ConversationSessionSummary => {
    const skillsPracticed: ConversationSkillId[] = [];
    for (const record of completedResponses) {
      for (const signal of record.feedback.composition) {
        if (!skillsPracticed.includes(signal.canonicalSkillId)) {
          skillsPracticed.push(signal.canonicalSkillId);
        }
      }
    }

    return {
      scenarioId: activeScenario.id,
      length: activeScenario.length,
      skillsPracticed,
      responses: completedResponses
    };
  };

  const enterStep = (
    nextStep: ConversationStep,
    activeScenario: ConversationScenario
  ): void => {
    step = nextStep;
    if (nextStep.kind === "completion") {
      phase = "complete";
      summary = buildSummary(activeScenario);
    } else {
      phase = "interaction";
    }
  };

  const clearProgress = (): void => {
    step = null;
    feedback = null;
    summary = null;
    pending = null;
    completedResponses = [];
  };

  const select = (scenarioId: string): boolean => {
    const definition = definitionsByScenarioId.get(scenarioId);
    if (definition == null) return false;

    scenario = definition.scenario;
    clearProgress();
    phase = "intro";
    return true;
  };

  const reset = (): boolean => {
    scenario = null;
    clearProgress();
    phase = "intro";
    return true;
  };

  const start = (): boolean => {
    if (phase !== "intro" || scenario == null) return false;
    const activeScenario = scenario;
    const startStep = activeScenario.steps.find(
      (candidate) => candidate.id === activeScenario.startStepId
    );
    if (startStep == null) return false;

    clearProgress();
    enterStep(startStep, activeScenario);
    return true;
  };

  const advance = (): boolean => {
    if (
      phase !== "interaction" ||
      scenario == null ||
      step == null ||
      step.kind !== "partner_line"
    ) {
      return false;
    }
    const activeScenario = scenario;
    const nextStep = resolveConversationNextStep(activeScenario, step.id);
    if (nextStep == null) return false;

    enterStep(nextStep, activeScenario);
    return true;
  };

  const submitResponse = (
    responseExampleId: string
  ): ConversationFeedbackResult<ConversationSkillId, "curated"> | null => {
    if (
      phase !== "interaction" ||
      scenario == null ||
      step == null ||
      step.kind !== "learner_response"
    ) {
      return null;
    }

    const definition = definitionsByScenarioId.get(scenario.id);
    if (definition == null) return null;

    const learnerStepId = step.id;
    const binding = definition.responses.find(
      (candidate) =>
        candidate.stepId === learnerStepId && candidate.responseExampleId === responseExampleId
    );
    if (binding == null) return null;

    const result = evaluateCuratedConversationResponse(binding.feedback);
    pending = {
      stepId: learnerStepId,
      responseExampleId: binding.responseExampleId,
      branchId: binding.branchId,
      result
    };
    feedback = result;
    phase = "feedback";
    return result;
  };

  const retry = (): boolean => {
    if (phase !== "feedback") return false;

    pending = null;
    feedback = null;
    phase = "interaction";
    return true;
  };

  const continueSession = (): boolean => {
    if (phase !== "feedback" || scenario == null || pending == null) return false;

    const activeScenario = scenario;
    const completed = pending;
    const nextStep = resolveConversationNextStep(
      activeScenario,
      completed.stepId,
      completed.branchId
    );
    if (nextStep == null) return false;

    completedResponses = [
      ...completedResponses,
      {
        stepId: completed.stepId,
        responseExampleId: completed.responseExampleId,
        feedback: completed.result
      }
    ];
    pending = null;
    feedback = null;
    enterStep(nextStep, activeScenario);
    return true;
  };

  const getState = (): ConversationSessionState => ({
    phase,
    scenario,
    step,
    feedback,
    summary
  });

  return {
    getState,
    select,
    start,
    advance,
    submitResponse,
    retry,
    continue: continueSession,
    reset
  };
}
