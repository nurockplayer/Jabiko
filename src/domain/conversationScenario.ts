import { pickLocalized } from "./localizedContent";
import type { LocaleCode, LocalizedText } from "./types";

export const CONVERSATION_LENGTHS = ["short", "medium", "long"] as const;
export type ConversationLength = (typeof CONVERSATION_LENGTHS)[number];

export const CONVERSATION_SKILLS = [
  "open",
  "react",
  "expand",
  "share",
  "bounce",
  "transition",
  "repair",
  "join",
  "exit",
  "narrate",
  "opinion",
  "agree_disagree",
  "negotiate",
  "register_adapt",
] as const;
export type ConversationSkillId = (typeof CONVERSATION_SKILLS)[number];

export function isConversationSkillId(value: string): value is ConversationSkillId {
  return (CONVERSATION_SKILLS as readonly string[]).includes(value);
}

export interface ConversationLearnerText {
  textZh: string;
  textI18n?: LocalizedText;
}

export function localizeConversationLearnerText(
  text: ConversationLearnerText,
  locale: LocaleCode
): string {
  return pickLocalized(text.textZh, text.textI18n, locale);
}

export interface ConversationDifficulty {
  linguisticComplexity: "basic" | "intermediate" | "advanced";
  partnerSupport: "supportive" | "balanced" | "low_support";
  relationshipDistance: "familiar" | "neutral" | "formal";
  topicDepth: "concrete" | "personal" | "abstract";
  interactionPressure: "low" | "normal" | "high";
}

export interface ConversationRelationship {
  learnerRole: string;
  partnerRole: string;
  context: ConversationLearnerText;
}

export interface ConversationResponseExample {
  id: string;
  kind: "suggested" | "accepted";
  japanese: string;
  explanation?: ConversationLearnerText;
}

export interface ConversationBranch {
  id: string;
  nextStepId: string;
}

export interface ConversationPartnerLineStep {
  id: string;
  kind: "partner_line";
  japanese: string;
  nextStepId: string;
}

export interface ConversationLearnerResponseStep {
  id: string;
  kind: "learner_response";
  prompt: ConversationLearnerText;
  responseExamples: readonly ConversationResponseExample[];
  branches: readonly ConversationBranch[];
  defaultBranchId?: string;
}

export interface ConversationCompletionStep {
  id: string;
  kind: "completion";
  summary: ConversationLearnerText;
}

export type ConversationStep =
  | ConversationPartnerLineStep
  | ConversationLearnerResponseStep
  | ConversationCompletionStep;

export interface ConversationSeasonalAssociation {
  eventId: string;
}

export interface ConversationSource {
  title: string;
  url: string;
  accessedOn: string;
}

export interface ConversationScenario {
  id: string;
  topic: string;
  world: string;
  situation: ConversationLearnerText;
  relationship: ConversationRelationship;
  length: ConversationLength;
  primarySkills: readonly ConversationSkillId[];
  difficulty: ConversationDifficulty;
  objective: ConversationLearnerText;
  instruction: ConversationLearnerText;
  startStepId: string;
  steps: readonly ConversationStep[];
  seasonalAssociation?: ConversationSeasonalAssociation;
  sources?: readonly ConversationSource[];
}

export interface ConversationScenarioValidationError {
  code:
    | "duplicate_scenario_id"
    | "duplicate_step_id"
    | "duplicate_response_example_id"
    | "duplicate_branch_id"
    | "missing_primary_skill"
    | "invalid_skill_reference"
    | "broken_start_step_reference"
    | "broken_step_reference"
    | "broken_default_branch_reference";
  scenarioId?: string;
  stepId?: string;
  referenceId?: string;
}

export interface ConversationScenarioValidationResult {
  valid: boolean;
  errors: ConversationScenarioValidationError[];
}

export function resolveConversationNextStep(
  scenario: ConversationScenario,
  currentStepId: string,
  branchId?: string
): ConversationStep | null {
  const currentStep = scenario.steps.find((step) => step.id === currentStepId);
  if (currentStep == null || currentStep.kind === "completion") return null;

  if (currentStep.kind === "partner_line") {
    return scenario.steps.find((step) => step.id === currentStep.nextStepId) ?? null;
  }

  const selectedBranchId = branchId ?? currentStep.defaultBranchId;
  if (selectedBranchId == null) return null;
  const branch = currentStep.branches.find((candidate) => candidate.id === selectedBranchId);
  return scenario.steps.find((step) => step.id === branch?.nextStepId) ?? null;
}

export function validateConversationScenarios(
  scenarios: readonly ConversationScenario[]
): ConversationScenarioValidationResult {
  const errors: ConversationScenarioValidationError[] = [];
  const scenarioIds = new Set<string>();

  for (const scenario of scenarios) {
    if (scenarioIds.has(scenario.id)) {
      errors.push({ code: "duplicate_scenario_id", scenarioId: scenario.id });
    } else {
      scenarioIds.add(scenario.id);
    }

    if (scenario.primarySkills.length === 0) {
      errors.push({ code: "missing_primary_skill", scenarioId: scenario.id });
    }

    for (const skill of scenario.primarySkills as readonly string[]) {
      if (!isConversationSkillId(skill)) {
        errors.push({
          code: "invalid_skill_reference",
          scenarioId: scenario.id,
          referenceId: skill,
        });
      }
    }

    const stepIds = new Set<string>();
    for (const step of scenario.steps) {
      if (stepIds.has(step.id)) {
        errors.push({
          code: "duplicate_step_id",
          scenarioId: scenario.id,
          stepId: step.id,
        });
      } else {
        stepIds.add(step.id);
      }
    }

    if (!stepIds.has(scenario.startStepId)) {
      errors.push({
        code: "broken_start_step_reference",
        scenarioId: scenario.id,
        referenceId: scenario.startStepId,
      });
    }

    for (const step of scenario.steps) {
      if (step.kind === "partner_line" && !stepIds.has(step.nextStepId)) {
        errors.push({
          code: "broken_step_reference",
          scenarioId: scenario.id,
          stepId: step.id,
          referenceId: step.nextStepId,
        });
      }

      if (step.kind === "learner_response") {
        const responseExampleIds = new Set<string>();
        for (const example of step.responseExamples) {
          if (responseExampleIds.has(example.id)) {
            errors.push({
              code: "duplicate_response_example_id",
              scenarioId: scenario.id,
              stepId: step.id,
              referenceId: example.id,
            });
          } else {
            responseExampleIds.add(example.id);
          }
        }

        const branchIds = new Set<string>();
        for (const branch of step.branches) {
          if (branchIds.has(branch.id)) {
            errors.push({
              code: "duplicate_branch_id",
              scenarioId: scenario.id,
              stepId: step.id,
              referenceId: branch.id,
            });
          } else {
            branchIds.add(branch.id);
          }

          if (!stepIds.has(branch.nextStepId)) {
            errors.push({
              code: "broken_step_reference",
              scenarioId: scenario.id,
              stepId: step.id,
              referenceId: branch.nextStepId,
            });
          }
        }

        if (step.defaultBranchId != null && !branchIds.has(step.defaultBranchId)) {
          errors.push({
            code: "broken_default_branch_reference",
            scenarioId: scenario.id,
            stepId: step.id,
            referenceId: step.defaultBranchId,
          });
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
