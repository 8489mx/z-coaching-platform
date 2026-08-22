/**
 * @typedef {import("../../mobility-plan-specification/domain/contracts.js").MobilityPlanSpecification} MobilityPlanSpecification
 * @typedef {import("../../mobility-modality-requirements/domain/contracts.js").MobilityModalityRequirements} MobilityModalityRequirements
 * @typedef {import("../../mobility-prescription/domain/contracts.js").MobilityPrescription} MobilityPrescription
 * @typedef {import("../../weekly-mobility-schedule/domain/contracts.js").WeeklyMobilitySchedule} WeeklyMobilitySchedule
 * @typedef {import("../../mobility-plan-preflight/evaluate-mobility-plan-preflight.js").MobilityPreflightReport} MobilityPreflightReport
 */

/**
 * @typedef {Object} MobilityEngineResult
 * @property {string} engine_version
 * @property {MobilityPlanSpecification} plan_specification
 * @property {MobilityModalityRequirements} modality_requirements
 * @property {MobilityPrescription} prescription
 * @property {WeeklyMobilitySchedule} weekly_schedule
 * @property {MobilityPreflightReport} preflight_report
 */

export {};
