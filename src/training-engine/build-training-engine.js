import { buildTrainingDraft } from "../training-draft/index.js";
import { buildWeeklyTrainingSchedule } from "../weekly-training-schedule/index.js";
import { evaluateTrainingPlanPreflight } from "../training-plan-preflight/index.js";
import { TRAINING_ENGINE_VERSION } from "./domain/contracts.js";

/**
 * Executes the full training engine pipeline.
 *
 * @param {import("./domain/contracts.js").TrainingEngineInput} intakeDecision
 * @returns {import("./domain/contracts.js").TrainingEngineOutput}
 */
export function buildTrainingEngine(intakeDecision) {
  const trainingDraft = buildTrainingDraft(intakeDecision);
  const weeklyTrainingPlan = buildWeeklyTrainingSchedule(trainingDraft);
  const preflightReport = evaluateTrainingPlanPreflight(weeklyTrainingPlan);

  if (preflightReport.schedule_version !== weeklyTrainingPlan.schedule_version) {
    throw new TypeError(
      "Pipeline constraint failure: schedule_version mismatch between preflight report and weekly training plan.",
    );
  }

  if (preflightReport.plan_status !== weeklyTrainingPlan.status) {
    throw new TypeError(
      "Pipeline constraint failure: plan_status mismatch between preflight report and weekly training plan.",
    );
  }

  return {
    engine_version: TRAINING_ENGINE_VERSION,
    weekly_training_plan: weeklyTrainingPlan,
    preflight_report: preflightReport,
  };
}
