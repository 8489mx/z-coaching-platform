import { MobilityStrategy, Scope } from "../domain/enums.js";
import { constraint, emptyRuleResult, reason } from "../domain/rule-result.js";

export function evaluateMobilityConstraints(input) {
  const result = emptyRuleResult();
  const constraints = [];

  // Pass all medical movement restrictions as mobility constraints
  input.training.medicalMovementRestrictions.forEach((restriction) => {
    constraints.push(
      constraint(
        "MOBILITY_MEDICAL_RESTRICTION",
        Scope.MOBILITY,
        restriction,
        "Medical movement restrictions must be strictly observed during mobility routines."
      )
    );
  });

  // Pass all injuries as mobility constraints
  input.training.injuries.forEach((injury) => {
    constraints.push(
      constraint(
        "MOBILITY_INJURY_RESTRICTION",
        Scope.MOBILITY,
        injury,
        "Injured areas must be treated with caution or avoided based on pain and movement impact."
      )
    );
  });

  result.hardConstraints.push(...constraints);
  return { ...result, decisionConstraints: constraints };
}

export function decideMobilityStrategy(input, safetyContext) {
  const result = evaluateMobilityConstraints(input);
  
  const safetyGate =
    safetyContext.medicalGate ||
    safetyContext.blockingGate ||
    safetyContext.adultPathBlocked ||
    safetyContext.pregnancyGate;

  let strategy;
  let maxDurationMinutes = 0;
  const decisionReasons = [];

  if (safetyGate) {
    strategy = MobilityStrategy.REVIEW_REQUIRED;
    decisionReasons.push(
      reason(
        "MOBILITY_WITHHELD_PENDING_SAFETY_REVIEW",
        Scope.MOBILITY,
        "No mobility prescription is generated until the higher-priority safety gate is cleared."
      )
    );
  } else {
    strategy = MobilityStrategy.INTEGRATED_AND_SEPARATE;
    maxDurationMinutes = 5;
    decisionReasons.push(
      reason(
        "MOBILITY_INTEGRATED_AND_SEPARATE",
        Scope.MOBILITY,
        "Mobility is applied before/after training and on separate days to provide flexibility."
      )
    );
  }

  result.reasons.push(...decisionReasons);

  return {
    result,
    decision: {
      strategy,
      max_duration_minutes: maxDurationMinutes,
      constraints: result.decisionConstraints,
      reasons: decisionReasons,
    },
  };
}
