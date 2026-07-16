/**
 * @typedef {import("../../intake-decision-engine/domain/contracts.js").IntakeDecision} TrainingEngineInput
 */

/**
 * @typedef {Object} TrainingEngineOutput
 * @property {string} engine_version - The version of the training engine.
 * @property {import("../../weekly-training-schedule/domain/contracts.js").WeeklyTrainingPlan} weekly_training_plan - The output from the Weekly Training Schedule.
 * @property {import("../../training-plan-preflight/domain/contracts.js").TrainingPlanPreflightReport} preflight_report - The output from the Training Plan Preflight.
 */
