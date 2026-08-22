import { buildMobilityPlanSpecification } from "../mobility-plan-specification/index.js";
import { buildMobilityModalityRequirements } from "../mobility-modality-requirements/index.js";
import { buildMobilityPrescription } from "../mobility-prescription/index.js";
import { buildWeeklyMobilitySchedule } from "../weekly-mobility-schedule/index.js";
import { evaluateMobilityPlanPreflight } from "../mobility-plan-preflight/index.js";
import { MOBILITY_ENGINE_VERSION } from "./domain/enums.js";

/**
 * Builds the complete Mobility Engine pipeline from intake to preflight.
 *
 * @param {Object} intakeDecision
 * @param {Object} [weeklyTrainingSchedule=null]
 * @returns {import("./domain/contracts.js").MobilityEngineResult}
 */
export function buildMobilityEngine(intakeDecision, weeklyTrainingSchedule = null) {
  // 1. Convert intake rules to plan specification
  const plan_specification = buildMobilityPlanSpecification(intakeDecision);

  // 2. Select modalities based on specification
  const modality_requirements = buildMobilityModalityRequirements(plan_specification);

  // 3. Generate concrete dose prescriptions
  const prescription = buildMobilityPrescription(plan_specification, modality_requirements);

  // 4. Schedule sessions into the week
  let weekly_schedule = null;
  let preflight_report = null;

  if (weeklyTrainingSchedule) {
    weekly_schedule = buildWeeklyMobilitySchedule(
      prescription,
      plan_specification,
      weeklyTrainingSchedule
    );

    // 5. Run preflight checks for approval readiness
    preflight_report = evaluateMobilityPlanPreflight(weekly_schedule);
  }

  return {
    engine_version: MOBILITY_ENGINE_VERSION,
    plan_specification,
    modality_requirements,
    prescription,
    weekly_schedule,
    preflight_report,
  };
}
