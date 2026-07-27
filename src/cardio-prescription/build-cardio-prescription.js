import {
  CARDIO_PRESCRIPTION_VERSION,
  CardioPrescriptionStatus,
  CardioPrescriptionPolicy,
  PrescriptionReasonCode,
} from "./domain/enums.js";

/**
 * Builds concrete cardio prescriptions from the modality requirements and upstream limits.
 *
 * @param {import("../cardio-plan-specification/domain/contracts.js").CardioPlanSpecification} cardioPlanSpec
 * @param {import("../cardio-modality-requirements/domain/contracts.js").CardioModalityRequirements} modalityRequirements
 * @returns {import("./domain/contracts.js").CardioPrescription}
 */
export function buildCardioPrescription(cardioPlanSpec, modalityRequirements) {
  const sessions = [];
  const reasons = [...modalityRequirements.reasons];
  let status = modalityRequirements.status;
  let steps_prescription = null;
  let recommended_sessions = 0;

  if (status === CardioPrescriptionStatus.WITHHELD) {
    reasons.push({
      code: PrescriptionReasonCode.PRESCRIPTION_WITHHELD_DUE_TO_UPSTREAM_STATUS,
      scope: "CARDIO",
      message: "Prescription cannot be built because the upstream requirements are withheld.",
    });

    return {
      cardio_prescription_version: CARDIO_PRESCRIPTION_VERSION,
      status,
      recommended_sessions: 0,
      sessions: [],
      steps_prescription: null,
      constraints: modalityRequirements.constraints,
      reasons,
    };
  }

  if (cardioPlanSpec.strategy === "NO_ADDITIONAL_CARDIO") {
    reasons.push({
      code: PrescriptionReasonCode.PRESCRIPTION_CLEARED_BY_NO_CARDIO_STRATEGY,
      scope: "CARDIO",
      message: "No prescription is built because no additional cardio is required.",
    });
  } else if (cardioPlanSpec.strategy === "STEPS_ONLY") {
    reasons.push({
      code: PrescriptionReasonCode.PRESCRIPTION_STEPS_ONLY,
      scope: "CARDIO",
      message: "Steps prescription is active without formal session scheduling.",
    });
    steps_prescription = {
      active: true,
      intensity: "LOW",
    };
  } else if (cardioPlanSpec.strategy === "CARDIO_SESSIONS") {
    // Determine the primary modality limit
    const lissRequirement = modalityRequirements.requirements.find(
      (r) => r.modality_type === "LISS",
    );

    if (lissRequirement) {
      if (
        lissRequirement.max_duration_minutes <
        CardioPrescriptionPolicy.MIN_LISS_DURATION_MINUTES
      ) {
        status = CardioPrescriptionStatus.PROVISIONAL_REVIEW_REQUIRED;
        reasons.push({
          code: PrescriptionReasonCode.PRESCRIPTION_INSUFFICIENT_DURATION_FOR_LISS,
          scope: "CARDIO",
          message: `The allowed session duration (${lissRequirement.max_duration_minutes}m) is less than the minimum effective LISS dose (${CardioPrescriptionPolicy.MIN_LISS_DURATION_MINUTES}m). Coach review is required.`,
        });
      } else {
        recommended_sessions = cardioPlanSpec.limits.max_sessions_per_week;
        for (let i = 1; i <= recommended_sessions; i++) {
          sessions.push({
            sequence: i,
            modality_type: lissRequirement.modality_type,
            duration_minutes: lissRequirement.max_duration_minutes,
            intensity: lissRequirement.allowed_intensity,
          });
        }
        reasons.push({
          code: PrescriptionReasonCode.PRESCRIPTION_LISS_SESSIONS_BUILT,
          scope: "CARDIO",
          message: `Successfully built ${recommended_sessions} LISS sessions at ${lissRequirement.max_duration_minutes} minutes each.`,
        });
      }
    }
  }

  return {
    cardio_prescription_version: CARDIO_PRESCRIPTION_VERSION,
    status,
    recommended_sessions,
    sessions,
    steps_prescription,
    constraints: modalityRequirements.constraints,
    reasons,
  };
}
