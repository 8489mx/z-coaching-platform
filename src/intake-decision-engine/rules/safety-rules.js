import {
  PlanStatus,
  MovementImpact,
  PregnancyStatus,
  ReviewLevel,
  Scope,
  ScreeningAnswer,
  Stability,
} from "../domain/enums.js";
import {
  constraint,
  emptyRuleResult,
  mergeRuleResults,
  reason,
  reviewFlag,
  statusCandidate,
} from "../domain/rule-result.js";
import { calculateAgeYears } from "../validation/validate-intake.js";

export const HIGH_PAIN_MEDICAL_REVIEW_THRESHOLD = 7;

export function evaluateAgeSafety(input, context) {
  const result = emptyRuleResult();
  const ageYears = calculateAgeYears(input.personal.dateOfBirth, context.assessmentDate);
  if (ageYears >= 18) return result;

  if (input.personal.guardianConsent !== true) {
    result.statusCandidates.push(statusCandidate(PlanStatus.BLOCKED, "MINOR_WITHOUT_GUARDIAN_CONSENT"));
    result.reviewFlags.push(
      reviewFlag(
        "MINOR_WITHOUT_GUARDIAN_CONSENT",
        Scope.GLOBAL,
        ReviewLevel.BLOCKING,
        "The adult planning path is blocked until guardian consent and coach review are recorded.",
        "personal.guardianConsent",
      ),
    );
    result.reasons.push(
      reason(
        "ADULT_PATH_BLOCKED_FOR_MINOR",
        Scope.GLOBAL,
        "A client under 18 cannot enter the normal adult path without guardian consent.",
      ),
    );
    if (input.personal.guardianConsent === null || input.personal.guardianConsent === undefined) {
      result.missingOrUncertainData.push({
        code: "GUARDIAN_CONSENT_NOT_RECORDED",
        path: "personal.guardianConsent",
        message: "Guardian consent must be explicitly recorded for a minor.",
      });
    }
    return result;
  }

  result.statusCandidates.push(statusCandidate(PlanStatus.COACH_REVIEW_REQUIRED, "MINOR_REQUIRES_COACH_REVIEW"));
  result.reviewFlags.push(
    reviewFlag(
      "MINOR_REQUIRES_SEPARATE_PATH",
      Scope.GLOBAL,
      ReviewLevel.COACH,
      "Guardian consent is present, but a coach must use the separate minor pathway.",
      "personal.dateOfBirth",
    ),
  );
  result.reasons.push(
    reason(
      "MINOR_GUARDIAN_CONSENT_PRESENT",
      Scope.GLOBAL,
      "The intake has consent but is not eligible for the adult decision path.",
    ),
  );
  return result;
}

const DANGEROUS_SYMPTOMS = Object.freeze([
  ["chestPainOrPressure", "CHEST_PAIN_OR_PRESSURE"],
  ["fainting", "FAINTING"],
  ["unusualShortnessOfBreath", "UNUSUAL_SHORTNESS_OF_BREATH"],
  ["abnormalPalpitations", "ABNORMAL_PALPITATIONS"],
  ["otherDangerousSymptomsPresent", "OTHER_DANGEROUS_SYMPTOM"],
]);

export function evaluateDangerousSymptoms(input) {
  const result = emptyRuleResult();
  for (const [field, code] of DANGEROUS_SYMPTOMS) {
    const answer = input.medical.dangerousSymptoms[field];
    const sourcePath = `medical.dangerousSymptoms.${field}`;
    if (answer === ScreeningAnswer.YES) {
      result.statusCandidates.push(statusCandidate(PlanStatus.MEDICAL_REVIEW_REQUIRED, code));
      result.reviewFlags.push(
        reviewFlag(
          code,
          Scope.GLOBAL,
          ReviewLevel.MEDICAL,
          "A structured dangerous symptom was reported; no normal plan may be approved before medical review.",
          sourcePath,
        ),
      );
      result.reasons.push(
        reason(
          "DANGEROUS_SYMPTOM_REQUIRES_MEDICAL_REVIEW",
          Scope.GLOBAL,
          `Medical safety screening reported ${code}.`,
        ),
      );
      if (
        field === "otherDangerousSymptomsPresent" &&
        input.medical.dangerousSymptoms.otherDangerousSymptoms.length === 0
      ) {
        result.missingOrUncertainData.push({
          code: "OTHER_DANGEROUS_SYMPTOM_DETAIL_MISSING",
          path: "medical.dangerousSymptoms.otherDangerousSymptoms",
          message: "Medical review is already required; the unclassified symptom detail is still missing.",
        });
      }
    } else if (answer === ScreeningAnswer.UNKNOWN) {
      result.statusCandidates.push(statusCandidate(PlanStatus.BLOCKED, "DANGEROUS_SYMPTOM_SCREENING_UNKNOWN"));
      result.missingOrUncertainData.push({
        code: "SAFETY_SCREENING_ANSWER_UNKNOWN",
        path: sourcePath,
        message: "This safety-screening answer must be confirmed before the normal path can proceed.",
      });
    }
  }
  return result;
}

export function evaluateMedicalConditions(input) {
  const result = emptyRuleResult();
  input.medical.conditions.forEach((condition, index) => {
    const sourcePath = `medical.conditions[${index}]`;
    if (condition.otherConditionText?.trim()) {
      result.statusCandidates.push(
        statusCandidate(PlanStatus.COACH_REVIEW_REQUIRED, "UNCLASSIFIED_MEDICAL_CONDITION"),
      );
      result.reviewFlags.push(
        reviewFlag(
          "UNCLASSIFIED_MEDICAL_CONDITION",
          Scope.GLOBAL,
          ReviewLevel.COACH,
          "The client's original condition text was preserved for review and was not interpreted or mapped to a medical condition.",
          `${sourcePath}.otherConditionText`,
        ),
      );
      result.reasons.push(
        reason(
          "UNCLASSIFIED_MEDICAL_CONDITION_REQUIRES_REVIEW",
          Scope.GLOBAL,
          "A condition outside the structured list prevents automatic approval until a coach reviews the original text.",
        ),
      );
    }

    if (condition.stability === Stability.UNSTABLE || condition.stability === Stability.UNKNOWN) {
      result.statusCandidates.push(statusCandidate(PlanStatus.MEDICAL_REVIEW_REQUIRED, "CONDITION_NOT_STABLE"));
      result.reviewFlags.push(
        reviewFlag(
          "CONDITION_NOT_STABLE",
          Scope.GLOBAL,
          ReviewLevel.MEDICAL,
          "A reported condition is unstable or its stability is unknown.",
          `${sourcePath}.stability`,
        ),
      );
      result.reasons.push(
        reason(
          "CONDITION_REQUIRES_MEDICAL_REVIEW",
          Scope.GLOBAL,
          "An unstable or uncertainty-classified condition prevents normal approval.",
        ),
      );
      if (condition.stability === Stability.UNKNOWN) {
        result.missingOrUncertainData.push({
          code: "CONDITION_STABILITY_UNKNOWN",
          path: `${sourcePath}.stability`,
          message: "Condition stability must be confirmed.",
        });
      }
    }

    const hasUnclassifiedInstructions =
      (condition.physicianInstructions?.length ?? 0) > 0 ||
      Boolean(condition.unclassifiedInstructionsText?.trim());
    if (hasUnclassifiedInstructions) {
      result.statusCandidates.push(
        statusCandidate(PlanStatus.MEDICAL_REVIEW_REQUIRED, "UNCLASSIFIED_PHYSICIAN_INSTRUCTIONS"),
      );
      result.reviewFlags.push(
        reviewFlag(
          "UNCLASSIFIED_PHYSICIAN_INSTRUCTIONS",
          Scope.GLOBAL,
          ReviewLevel.MEDICAL,
          "Physician instructions were preserved for manual classification and were not applied automatically.",
          sourcePath,
        ),
      );
      result.reasons.push(
        reason(
          "PHYSICIAN_INSTRUCTIONS_REQUIRE_CLASSIFICATION",
          Scope.GLOBAL,
          "Free-form physician instructions cannot be interpreted by the deterministic engine.",
        ),
      );
    }
  });
  return result;
}

export function evaluatePregnancySafety(input) {
  const result = emptyRuleResult();
  const status = input.medical.pregnancyStatus;
  if (
    status === PregnancyStatus.PREGNANT ||
    status === PregnancyStatus.POSSIBLY_PREGNANT ||
    status === PregnancyStatus.BREASTFEEDING
  ) {
    result.statusCandidates.push(statusCandidate(PlanStatus.MEDICAL_REVIEW_REQUIRED, "PREGNANCY_OR_BREASTFEEDING"));
    result.reviewFlags.push(
      reviewFlag(
        "PREGNANCY_OR_BREASTFEEDING_REVIEW",
        Scope.GLOBAL,
        ReviewLevel.MEDICAL,
        "V1 requires medical review before approving nutrition, training, or cardio during pregnancy, possible pregnancy, or breastfeeding.",
        "medical.pregnancyStatus",
      ),
    );
    result.reasons.push(
      reason(
        "PREGNANCY_OR_BREASTFEEDING_SAFETY_GATE",
        Scope.GLOBAL,
        "The conservative V1 policy requires medical review for this state.",
      ),
    );
  } else if (status === PregnancyStatus.UNKNOWN) {
    result.statusCandidates.push(statusCandidate(PlanStatus.BLOCKED, "PREGNANCY_STATUS_UNKNOWN"));
    result.missingOrUncertainData.push({
      code: "PREGNANCY_STATUS_UNKNOWN",
      path: "medical.pregnancyStatus",
      message: "Pregnancy/breastfeeding status must be classified; it is never inferred from sex.",
    });
  }
  return result;
}

export function evaluateInjurySafety(input) {
  const result = emptyRuleResult();
  input.training.injuries.forEach((injury, index) => {
    const sourcePath = `training.injuries[${index}]`;
    const hasRedFlag =
      injury.movementImpact === MovementImpact.PREVENTS ||
      injury.worsening ||
      injury.numbnessOrWeakness;
    const hasHighPain = injury.painLevel >= HIGH_PAIN_MEDICAL_REVIEW_THRESHOLD;

    if (hasRedFlag) {
      result.statusCandidates.push(statusCandidate(PlanStatus.MEDICAL_REVIEW_REQUIRED, "INJURY_RED_FLAG"));
      result.reviewFlags.push(
        reviewFlag(
          "INJURY_RED_FLAG",
          Scope.GLOBAL,
          ReviewLevel.MEDICAL,
          "The injury prevents movement, is worsening, or includes numbness/weakness.",
          sourcePath,
        ),
      );
      result.reasons.push(
        reason(
          "INJURY_REQUIRES_MEDICAL_REVIEW",
          Scope.TRAINING,
          "A structured injury red flag takes priority over training preferences.",
        ),
      );
    }

    if (hasHighPain) {
      result.statusCandidates.push(
        statusCandidate(PlanStatus.MEDICAL_REVIEW_REQUIRED, "HIGH_PAIN_REQUIRES_MEDICAL_REVIEW"),
      );
      result.reviewFlags.push(
        reviewFlag(
          "HIGH_PAIN_REQUIRES_MEDICAL_REVIEW",
          Scope.GLOBAL,
          ReviewLevel.MEDICAL,
          `Pain level ${HIGH_PAIN_MEDICAL_REVIEW_THRESHOLD} or higher requires medical review without inferring its cause.`,
          `${sourcePath}.painLevel`,
        ),
      );
      result.reasons.push(
        reason(
          "HIGH_PAIN_PREVENTS_AUTOMATIC_APPROVAL",
          Scope.TRAINING,
          "A reported high pain level prevents automatic approval until medical review is completed.",
        ),
      );
    }

    if (!hasRedFlag && !hasHighPain) {
      result.statusCandidates.push(statusCandidate(PlanStatus.COACH_REVIEW_REQUIRED, "ACTIVE_INJURY"));
      result.reviewFlags.push(
        reviewFlag(
          "ACTIVE_INJURY_REQUIRES_COACH_REVIEW",
          Scope.TRAINING,
          ReviewLevel.COACH,
          "A non-red-flag injury must be reviewed while its classified movement constraints are retained.",
          sourcePath,
        ),
      );
    }

    injury.affectedMovements.forEach((movement) => {
      result.hardConstraints.push(
        constraint(
          "INJURY_AFFECTED_MOVEMENT",
          Scope.GLOBAL,
          { area: injury.area, movement },
          "Future exercise selection must respect the reported injury.",
        ),
      );
    });
    injury.medicalRestrictions.forEach((restriction) => {
      result.hardConstraints.push(
        constraint(
          "INJURY_MEDICAL_RESTRICTION",
          Scope.GLOBAL,
          { area: injury.area, ...restriction },
          "A reported medical restriction is mandatory.",
        ),
      );
    });
  });
  return result;
}

export function evaluateMedicalMovementRestrictions(input) {
  const result = emptyRuleResult();
  input.training.medicalMovementRestrictions.forEach((restriction) => {
    result.hardConstraints.push(
      constraint(
        "MEDICAL_MOVEMENT_RESTRICTION",
        Scope.GLOBAL,
        {
          movement: restriction.movement,
          instruction: restriction.instruction,
          source: restriction.source,
        },
        "A classified medical movement restriction must be applied to all future activity selection.",
      ),
    );
  });
  return result;
}

export function evaluateUnclassifiedTextAndMedication(input) {
  const result = emptyRuleResult();
  const freeTextPaths = [];
  input.medical.unclassifiedText.forEach((text, index) => {
    if (text.trim()) freeTextPaths.push(`medical.unclassifiedText[${index}]`);
  });
  (input.unclassifiedNotes ?? []).forEach((text, index) => {
    if (text.trim()) freeTextPaths.push(`unclassifiedNotes[${index}]`);
  });
  input.medical.dangerousSymptoms.otherDangerousSymptoms.forEach((text, index) => {
    if (text.trim()) {
      freeTextPaths.push(`medical.dangerousSymptoms.otherDangerousSymptoms[${index}]`);
    }
  });

  for (const sourcePath of freeTextPaths) {
    result.statusCandidates.push(statusCandidate(PlanStatus.COACH_REVIEW_REQUIRED, "UNCLASSIFIED_FREE_TEXT"));
    result.reviewFlags.push(
      reviewFlag(
        "UNCLASSIFIED_FREE_TEXT",
        Scope.GLOBAL,
        ReviewLevel.COACH,
        "Free text was preserved for a human reviewer and was not interpreted or applied automatically.",
        sourcePath,
      ),
    );
  }

  if (input.medical.medications.length > 0) {
    result.statusCandidates.push(statusCandidate(PlanStatus.COACH_REVIEW_REQUIRED, "MEDICATION_REPORTED"));
    result.reviewFlags.push(
      reviewFlag(
        "MEDICATION_REPORTED_NO_AUTOMATIC_INTERPRETATION",
        Scope.GLOBAL,
        ReviewLevel.COACH,
        "Medication names are recorded but V1 never infers interactions or restrictions from them.",
        "medical.medications",
      ),
    );
  }
  return result;
}

export function evaluateSafetyRules(input, context) {
  const result = mergeRuleResults([
    evaluateAgeSafety(input, context),
    evaluateDangerousSymptoms(input),
    evaluateMedicalConditions(input),
    evaluatePregnancySafety(input),
    evaluateInjurySafety(input),
    evaluateMedicalMovementRestrictions(input),
    evaluateUnclassifiedTextAndMedication(input),
  ]);

  const medicalGate = result.statusCandidates.some(
    (candidate) => candidate.status === PlanStatus.MEDICAL_REVIEW_REQUIRED,
  );
  const adultPathBlocked = calculateAgeYears(input.personal.dateOfBirth, context.assessmentDate) < 18;
  const blockingGate = result.statusCandidates.some(
    (candidate) => candidate.status === PlanStatus.BLOCKED,
  );
  const pregnancyGate = [
    PregnancyStatus.PREGNANT,
    PregnancyStatus.POSSIBLY_PREGNANT,
    PregnancyStatus.BREASTFEEDING,
    PregnancyStatus.UNKNOWN,
  ].includes(input.medical.pregnancyStatus);

  return {
    ...result,
    context: {
      medicalGate,
      blockingGate,
      adultPathBlocked,
      pregnancyGate,
    },
  };
}
