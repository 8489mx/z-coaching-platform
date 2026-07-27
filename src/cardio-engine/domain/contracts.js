/**
 * @typedef {import("../../cardio-plan-specification/index.js").CardioPlanSpecification} CardioPlanSpecification
 * @typedef {import("../../cardio-modality-requirements/index.js").CardioModalityRequirements} CardioModalityRequirements
 * @typedef {import("../../cardio-prescription/index.js").CardioPrescription} CardioPrescription
 * @typedef {import("../../weekly-cardio-schedule/index.js").WeeklyCardioSchedule} WeeklyCardioSchedule
 * @typedef {import("../../cardio-plan-preflight/index.js").CardioPlanPreflightReport} CardioPlanPreflightReport
 */

/**
 * @typedef {Object} CardioEngineResult
 * @property {"cardio-engine-v1"} engine_version
 * @property {CardioPlanSpecification} plan_specification
 * @property {CardioModalityRequirements} modality_requirements
 * @property {CardioPrescription} prescription
 * @property {WeeklyCardioSchedule} weekly_schedule
 * @property {CardioPlanPreflightReport} preflight_report
 */

export {};
