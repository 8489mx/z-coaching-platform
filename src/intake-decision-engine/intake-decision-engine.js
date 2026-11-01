import { PlanStatus, Scope, VolumeStart } from "./domain/enums.js";
import {
  deduplicateByStableKey,
  mergeRuleResults,
  selectPlanStatus,
} from "./domain/rule-result.js";
import { decideCardioStrategy } from "./rules/cardio-rules.js";
import { decideMobilityStrategy } from "./rules/mobility-rules.js";
import { decideNutrition } from "./rules/nutrition-rules.js";
import { evaluateSafetyRules } from "./rules/safety-rules.js";
import { decideTraining } from "./rules/training-rules.js";
import { IntakeValidationError } from "./validation/intake-validation-error.js";
import { validateIntake } from "./validation/validate-intake.js";

function stableJsonCompare(left, right) {
  const a = JSON.stringify(left);
  const b = JSON.stringify(right);
  return a < b ? -1 : a > b ? 1 : 0;
}

function normalizeList(items) {
  return deduplicateByStableKey(items).sort(stableJsonCompare);
}

function constraintsForScope(constraints, scope) {
  return normalizeList(
    constraints.filter((item) => item.scope === scope || item.scope === Scope.GLOBAL),
  );
}

/**
 * Pure, deterministic public API. Invalid DTO structure throws
 * IntakeValidationError; valid uncertainty is represented in the decision.
 *
 * @param {import('./domain/contracts.js').ClientIntake} input
 * @param {import('./domain/contracts.js').EvaluationContext} context Trusted server-side context.
 * @returns {import('./domain/contracts.js').IntakeDecision}
 */
export function evaluateIntake(input, context) {
  const validation = validateIntake(input, context);
  if (!validation.valid) throw new IntakeValidationError(validation.issues);

  const safety = evaluateSafetyRules(input, context);
  const nutrition = decideNutrition(input, safety.context);
  const training = decideTraining(input, safety.context);
  const cardio = decideCardioStrategy(
    input,
    safety.context,
    training.decision.volume_start === VolumeStart.CONSERVATIVE,
  );
  const mobility = decideMobilityStrategy(input, safety.context);

  const combined = mergeRuleResults([
    safety,
    nutrition.result,
    training.result,
    cardio.result,
    mobility.result,
  ]);
  const hardConstraints = normalizeList(combined.hardConstraints);
  const softPreferences = normalizeList(combined.softPreferences);
  const reasons = normalizeList(combined.reasons);

  nutrition.decision.constraints = constraintsForScope(
    [...nutrition.decision.constraints, ...hardConstraints],
    Scope.NUTRITION,
  );
  training.decision.constraints = constraintsForScope(
    [...training.decision.constraints, ...hardConstraints],
    Scope.TRAINING,
  );
  cardio.decision.constraints = constraintsForScope(
    [...cardio.decision.constraints, ...hardConstraints],
    Scope.CARDIO,
  );
  mobility.decision.constraints = constraintsForScope(
    [...mobility.decision.constraints, ...hardConstraints],
    Scope.MOBILITY,
  );
  nutrition.decision.reasons = normalizeList(nutrition.decision.reasons);
  training.decision.reasons = normalizeList(training.decision.reasons);
  cardio.decision.reasons = normalizeList(cardio.decision.reasons);
  mobility.decision.reasons = normalizeList(mobility.decision.reasons);

  const planStatus = selectPlanStatus(combined.statusCandidates);
  // A READY result has no hidden review flags. This invariant guards future rules.
  if (planStatus === PlanStatus.READY_FOR_DRAFT && combined.reviewFlags.length > 0) {
    throw new Error("Decision invariant violated: READY_FOR_DRAFT cannot contain review flags.");
  }

  const output = {
    plan_status: planStatus,
    hard_constraints: hardConstraints,
    soft_preferences: softPreferences,
    review_flags: normalizeList(combined.reviewFlags),
    nutrition_decision: nutrition.decision,
    training_decision: training.decision,
    cardio_decision: cardio.decision,
    mobility_decision: mobility.decision,
    decision_reasons: reasons,
    missing_or_uncertain_data: normalizeList(combined.missingOrUncertainData),
  };
  // JSON cloning intentionally breaks aliases both with the input and between
  // repeated top-level/nested findings. The public result is a JSON contract.
  return JSON.parse(JSON.stringify(output));
}

export class IntakeDecisionEngine {
  constructor(context) {
    this.context = context;
  }

  evaluate(input, context = this.context) {
    return evaluateIntake(input, context);
  }
}
