import { MobilityModalityRequirementsStatus, MobilityModalityType } from "../mobility-modality-requirements/domain/enums.js";
import { MobilityFormalSessionState } from "../mobility-plan-specification/domain/enums.js";
import {
  MOBILITY_PRESCRIPTION_VERSION,
  MobilityPrescriptionStatus,
  MobilityPrescriptionReasonCode,
} from "./domain/enums.js";

/**
 * Builds concrete mobility prescriptions from the modality requirements and upstream limits.
 *
 * @param {import("../mobility-plan-specification/domain/contracts.js").MobilityPlanSpecification} mobilityPlanSpec
 * @param {import("../mobility-modality-requirements/domain/contracts.js").MobilityModalityRequirements} modalityRequirements
 * @returns {import("./domain/contracts.js").MobilityPrescription}
 */
export function buildMobilityPrescription(mobilityPlanSpec, modalityRequirements) {
  const prescribed_modalities = [];
  const reasons = [...modalityRequirements.reasons];
  let status = modalityRequirements.status; // defaults to READY or whatever came from requirements

  if (status === MobilityModalityRequirementsStatus.WITHHELD || mobilityPlanSpec.formal_session_state === MobilityFormalSessionState.WITHHELD) {
    reasons.push({
      code: MobilityPrescriptionReasonCode.PRESCRIPTION_WITHHELD_DUE_TO_UPSTREAM_STATUS,
      scope: "MOBILITY",
      message: "Prescription cannot be built because the upstream requirements are withheld.",
    });

    return {
      mobility_prescription_version: MOBILITY_PRESCRIPTION_VERSION,
      status: MobilityPrescriptionStatus.WITHHELD,
      prescribed_modalities: [],
      constraints: modalityRequirements.constraints,
      reasons,
    };
  }

  if (mobilityPlanSpec.formal_session_state === MobilityFormalSessionState.NOT_INDICATED) {
    reasons.push({
      code: MobilityPrescriptionReasonCode.PRESCRIPTION_CLEARED_BY_NO_MOBILITY_STRATEGY,
      scope: "MOBILITY",
      message: "No prescription is built because no mobility is required.",
    });

    return {
      mobility_prescription_version: MOBILITY_PRESCRIPTION_VERSION,
      status: mobilityPlanSpec.plan_status,
      prescribed_modalities: [],
      constraints: modalityRequirements.constraints,
      reasons,
    };
  }

  // Check for any injuries or medical restrictions
  const hasInjuriesOrMedicalRestrictions = (mobilityPlanSpec.limitations || []).length > 0;

  if (hasInjuriesOrMedicalRestrictions) {
    status = MobilityPrescriptionStatus.PROVISIONAL_REVIEW_REQUIRED;
    reasons.push({
      code: MobilityPrescriptionReasonCode.PRESCRIPTION_REVIEW_REQUIRED_DUE_TO_INJURY,
      scope: "MOBILITY",
      message: "Client has reported injuries or medical restrictions. Automatic prescription is suspended. Coach review is required to design a safe, custom mobility routine.",
    });

    return {
      mobility_prescription_version: MOBILITY_PRESCRIPTION_VERSION,
      status,
      prescribed_modalities: [],
      constraints: modalityRequirements.constraints,
      reasons,
    };
  }

  // If status was PROVISIONAL_REVIEW_REQUIRED from upstream, propagate it.
  if (status === MobilityModalityRequirementsStatus.PROVISIONAL_REVIEW_REQUIRED || mobilityPlanSpec.formal_session_state === MobilityFormalSessionState.REVIEW_REQUIRED) {
    status = MobilityPrescriptionStatus.PROVISIONAL_REVIEW_REQUIRED;
  }

  // At this point, the client is healthy and cleared for auto-prescription.
  // We allocate 3 minutes to Dynamic Stretching and 2 minutes to Static Stretching.
  const dynamicReq = modalityRequirements.requirements.find(r => r.modality_type === MobilityModalityType.DYNAMIC_STRETCHING);
  if (dynamicReq) {
    prescribed_modalities.push({
      modality_type: MobilityModalityType.DYNAMIC_STRETCHING,
      duration_minutes: 3,
      instructions: ["Perform dynamic stretches to warm up the joints and increase blood flow."]
    });
  }

  const staticReq = modalityRequirements.requirements.find(r => r.modality_type === MobilityModalityType.STATIC_STRETCHING);
  if (staticReq) {
    prescribed_modalities.push({
      modality_type: MobilityModalityType.STATIC_STRETCHING,
      duration_minutes: 2,
      instructions: ["Perform static stretches, holding each position to improve flexibility."]
    });
  }

  reasons.push({
    code: MobilityPrescriptionReasonCode.PRESCRIPTION_BUILT,
    scope: "MOBILITY",
    message: "Successfully built default 5-minute mobility prescription (3m Dynamic, 2m Static)."
  });

  return {
    mobility_prescription_version: MOBILITY_PRESCRIPTION_VERSION,
    status,
    prescribed_modalities,
    constraints: modalityRequirements.constraints,
    reasons,
  };
}
