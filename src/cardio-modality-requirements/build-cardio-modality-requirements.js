import {
  CARDIO_MODALITY_REQUIREMENTS_VERSION,
  CardioModalityRequirementsStatus,
  ModalityType,
  ModalityReasonCode,
} from "./domain/enums.js";

/**
 * Transforms a Cardio Plan Specification into precise modality requirements.
 *
 * @param {import("./domain/contracts.js").CardioPlanSpecification} cardioPlanSpec
 * @returns {import("./domain/contracts.js").CardioModalityRequirements}
 */
export function buildCardioModalityRequirements(cardioPlanSpec) {
  const requirements = [];
  const reasons = [...cardioPlanSpec.reasons];

  if (cardioPlanSpec.status === CardioModalityRequirementsStatus.WITHHELD) {
    reasons.push({
      code: ModalityReasonCode.MODALITIES_WITHHELD_DUE_TO_UPSTREAM_STATUS,
      scope: "CARDIO",
      message: "Modality requirements cannot be built because the cardio plan is withheld.",
    });

    return {
      cardio_modality_requirements_version: CARDIO_MODALITY_REQUIREMENTS_VERSION,
      status: CardioModalityRequirementsStatus.WITHHELD,
      requirements: [],
      constraints: cardioPlanSpec.constraints,
      reasons,
    };
  }

  if (cardioPlanSpec.strategy === "NO_ADDITIONAL_CARDIO") {
    reasons.push({
      code: ModalityReasonCode.MODALITIES_CLEARED_BY_NO_CARDIO_STRATEGY,
      scope: "CARDIO",
      message: "No specific modalities are required when the strategy dictates no additional cardio.",
    });

    return {
      cardio_modality_requirements_version: CARDIO_MODALITY_REQUIREMENTS_VERSION,
      status: cardioPlanSpec.status,
      requirements: [],
      constraints: cardioPlanSpec.constraints,
      reasons,
    };
  }

  if (cardioPlanSpec.strategy === "STEPS_ONLY") {
    reasons.push({
      code: ModalityReasonCode.MODALITY_STEPS_ONLY,
      scope: "CARDIO",
      message: "Steps is the only required modality to fulfill the steps-only strategy.",
    });

    requirements.push({
      modality_type: ModalityType.STEPS,
      allowed_intensity: "LOW", // Steps are fundamentally low intensity
      max_duration_minutes: 0,  // Not tracked by session duration limits
    });
  } else if (cardioPlanSpec.strategy === "CARDIO_SESSIONS") {
    reasons.push({
      code: ModalityReasonCode.MODALITY_LISS_SELECTED,
      scope: "CARDIO",
      message: "LISS (Low Intensity Steady State) is selected as the default safe and effective modality for formal cardio sessions.",
    });

    requirements.push({
      modality_type: ModalityType.LISS,
      allowed_intensity: cardioPlanSpec.limits.intensity_start,
      max_duration_minutes: cardioPlanSpec.limits.max_duration_minutes_per_session,
    });
  } else if (cardioPlanSpec.strategy === "REVIEW_REQUIRED") {
      // If strategy is REVIEW_REQUIRED, we don't output modalities, we just propagate the status
      // Wait, if strategy is REVIEW_REQUIRED, status should be PROVISIONAL_REVIEW_REQUIRED.
  }

  return {
    cardio_modality_requirements_version: CARDIO_MODALITY_REQUIREMENTS_VERSION,
    status: cardioPlanSpec.status,
    requirements,
    constraints: cardioPlanSpec.constraints,
    reasons,
  };
}
