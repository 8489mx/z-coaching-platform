import { EquipmentCode } from "../intake-decision-engine/domain/enums.js";
import { MobilityFormalSessionState, MobilityPlanStatus } from "../mobility-plan-specification/domain/enums.js";
import {
  MOBILITY_MODALITY_REQUIREMENTS_VERSION,
  MobilityModalityRequirementsStatus,
  MobilityModalityType,
  MobilityModalityReasonCode,
} from "./domain/enums.js";

/**
 * Transforms a Mobility Plan Specification into precise modality requirements.
 *
 * @param {import("../mobility-plan-specification/domain/contracts.js").MobilityPlanSpecification} mobilityPlanSpec
 * @param {Array<{equipmentCode: string}>} clientEquipment
 * @returns {import("./domain/contracts.js").MobilityModalityRequirements}
 */
export function buildMobilityModalityRequirements(mobilityPlanSpec, clientEquipment = []) {
  const requirements = [];
  const reasons = [...(mobilityPlanSpec.reasons || [])];

  if (mobilityPlanSpec.plan_status === MobilityPlanStatus.WITHHELD || mobilityPlanSpec.formal_session_state === MobilityFormalSessionState.WITHHELD) {
    reasons.push({
      code: MobilityModalityReasonCode.MODALITIES_WITHHELD_DUE_TO_UPSTREAM_STATUS,
      scope: "MOBILITY",
      message: "Modality requirements cannot be built because the mobility plan is withheld.",
    });

    return {
      mobility_modality_requirements_version: MOBILITY_MODALITY_REQUIREMENTS_VERSION,
      status: MobilityModalityRequirementsStatus.WITHHELD,
      requirements: [],
      constraints: mobilityPlanSpec.constraints,
      reasons,
    };
  }

  if (mobilityPlanSpec.formal_session_state === MobilityFormalSessionState.NOT_INDICATED) {
    reasons.push({
      code: MobilityModalityReasonCode.MODALITIES_CLEARED_BY_NO_MOBILITY_STRATEGY,
      scope: "MOBILITY",
      message: "No specific modalities are required when the strategy dictates no mobility.",
    });

    return {
      mobility_modality_requirements_version: MOBILITY_MODALITY_REQUIREMENTS_VERSION,
      status: mobilityPlanSpec.plan_status,
      requirements: [],
      constraints: mobilityPlanSpec.constraints,
      reasons,
    };
  }

  // If strategy is PRESCRIPTION_REQUIRED or PROVISIONAL_REVIEW_REQUIRED, we provide the available modalities.
  
  // 1. Static Stretching is always available
  requirements.push({ modality_type: MobilityModalityType.STATIC_STRETCHING });
  reasons.push({
    code: MobilityModalityReasonCode.MODALITY_STATIC_STRETCHING_INCLUDED,
    scope: "MOBILITY",
    message: "Static stretching is included as a default bodyweight modality.",
  });

  // 2. Dynamic Stretching is always available
  requirements.push({ modality_type: MobilityModalityType.DYNAMIC_STRETCHING });
  reasons.push({
    code: MobilityModalityReasonCode.MODALITY_DYNAMIC_STRETCHING_INCLUDED,
    scope: "MOBILITY",
    message: "Dynamic stretching is included as a default bodyweight modality.",
  });

  // Check Equipment for optional modalities
  const equipmentSet = new Set(clientEquipment.map((eq) => eq.equipmentCode));

  if (equipmentSet.has(EquipmentCode.FOAM_ROLLER)) {
    requirements.push({ modality_type: MobilityModalityType.FOAM_ROLLING });
    reasons.push({
      code: MobilityModalityReasonCode.MODALITY_FOAM_ROLLING_INCLUDED,
      scope: "MOBILITY",
      message: "Foam rolling is included because the client has a foam roller.",
    });
  }

  if (equipmentSet.has(EquipmentCode.RESISTANCE_BANDS)) {
    requirements.push({ modality_type: MobilityModalityType.RESISTANCE_BAND_MOBILITY });
    reasons.push({
      code: MobilityModalityReasonCode.MODALITY_RESISTANCE_BAND_INCLUDED,
      scope: "MOBILITY",
      message: "Resistance band mobility is included because the client has resistance bands.",
    });
  }

  return {
    mobility_modality_requirements_version: MOBILITY_MODALITY_REQUIREMENTS_VERSION,
    status: mobilityPlanSpec.plan_status,
    requirements,
    constraints: mobilityPlanSpec.constraints,
    reasons,
  };
}
