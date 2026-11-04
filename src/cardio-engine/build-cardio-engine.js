import { buildCardioPlanSpec } from "../cardio-plan-specification/index.js";
import { buildCardioModalityRequirements } from "../cardio-modality-requirements/index.js";
import { buildCardioPrescription } from "../cardio-prescription/index.js";
import { buildWeeklyCardioSchedule } from "../weekly-cardio-schedule/index.js";
import { evaluateCardioPlanPreflight } from "../cardio-plan-preflight/index.js";
import { CARDIO_ENGINE_VERSION } from "./domain/enums.js";
import { CardioPrescriptionStatus } from "../cardio-prescription/domain/enums.js";
import { CardioStrategy, PrimaryGoal } from "../intake-decision-engine/domain/enums.js";
import { resolveDailySteps, resolveStepTarget } from "../steps-source/resolve-daily-steps.js";

/**
 * Builds the complete Cardio Engine pipeline from intake to preflight.
 *
 * @param {Object} intakeDecision
 * @param {Object} clientIntakeProfile
 * @param {Object} [weeklyTrainingSchedule=null]
 * @returns {import("./domain/contracts.js").CardioEngineResult}
 */
// P1-B8 (Q49): cardio machines follow the training location. The canonical
// equipment model holds resistance gear only, so a HOME client has no cardio
// machines by the system's own data; a GYM client does. Unknown locations keep
// the old machines behavior (only an explicit HOME switches to outdoor).
function resolveMachinesAvailable(clientIntakeProfile) {
  const raw =
    clientIntakeProfile?.training?.location ??
    clientIntakeProfile?.training_location ??
    clientIntakeProfile?.training_environment ??
    null;
  if (typeof raw !== "string") return true;
  const loc = raw.toLowerCase();
  if (loc.includes("home")) return false;
  if (loc.includes("gym")) return true;
  return true;
}

export function buildCardioEngine(
  intakeDecision,
  clientIntakeProfile,
  weeklyTrainingSchedule = null,
  options = {}
) {
  // 1. Convert intake rules to plan specification
  const plan_specification = buildCardioPlanSpec(intakeDecision);

  // 2. Select modalities based on specification
  const modality_requirements = buildCardioModalityRequirements(plan_specification);

  // 3. Generate concrete dose prescriptions
  const prescription = buildCardioPrescription(plan_specification, modality_requirements);

  // P1-B1: one step number. STEPS_ONLY always carries a number, and every
  // fat-loss client carries a minimum movement target even with sessions.
  // The number comes from the same single source as the decision and TDEE;
  // a withheld prescription carries no target at all.
  if (
    prescription.status !== CardioPrescriptionStatus.WITHHELD &&
    (plan_specification.strategy === CardioStrategy.STEPS_ONLY ||
      (clientIntakeProfile?.goals?.primary === PrimaryGoal.FAT_LOSS &&
        plan_specification.strategy === CardioStrategy.CARDIO_SESSIONS))
  ) {
    const stepBaseline = resolveDailySteps({
      averageDailySteps: clientIntakeProfile?.cardio?.averageDailySteps,
    }).value;
    prescription.daily_step_target = resolveStepTarget(stepBaseline);
  }

  // 4. Schedule sessions into the week
  const weekly_schedule = buildWeeklyCardioSchedule(
    prescription,
    weeklyTrainingSchedule,
    {
      machinesAvailable: resolveMachinesAvailable(clientIntakeProfile),
      totalWeeks: options.totalWeeks,
    }
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
