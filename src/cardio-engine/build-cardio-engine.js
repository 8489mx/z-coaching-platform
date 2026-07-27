import { buildCardioPlanSpec } from "../cardio-plan-specification/index.js";
import { buildCardioModalityRequirements } from "../cardio-modality-requirements/index.js";
import { buildCardioPrescription } from "../cardio-prescription/index.js";
import { buildWeeklyCardioSchedule } from "../weekly-cardio-schedule/index.js";
import { evaluateCardioPlanPreflight } from "../cardio-plan-preflight/index.js";
import { CARDIO_ENGINE_VERSION } from "./domain/enums.js";

/**
 * Builds the complete Cardio Engine pipeline from intake to preflight.
 *
 * @param {Object} intakeDecision
 * @param {Object} clientIntakeProfile
 * @param {Object} [weeklyTrainingSchedule=null]
 * @returns {import("./domain/contracts.js").CardioEngineResult}
 */
export function buildCardioEngine(
  intakeDecision,
  clientIntakeProfile,
  weeklyTrainingSchedule = null
) {
  // 1. Convert intake rules to plan specification
  const plan_specification = buildCardioPlanSpec(intakeDecision);

  // 2. Select modalities based on specification
  const modality_requirements = buildCardioModalityRequirements(plan_specification);

  // 3. Generate concrete dose prescriptions
  const prescription = buildCardioPrescription(plan_specification, modality_requirements);

  // 4. Schedule sessions into the week
  const weekly_schedule = buildWeeklyCardioSchedule(
    prescription,
    clientIntakeProfile,
    weeklyTrainingSchedule
  );

  // 5. Run preflight checks for approval readiness
  const preflight_report = evaluateCardioPlanPreflight(weekly_schedule);

  return {
    engine_version: CARDIO_ENGINE_VERSION,
    plan_specification,
    modality_requirements,
    prescription,
    weekly_schedule,
    preflight_report,
  };
}
