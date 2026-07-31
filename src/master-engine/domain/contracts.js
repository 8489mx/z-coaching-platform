/**
 * @typedef {import("../../intake-decision-engine/domain/contracts.js").ClientIntake} ClientIntake
 * @typedef {import("../../intake-decision-engine/domain/contracts.js").EvaluationContext} EvaluationContext
 * @typedef {import("../../nutrition-food-catalog/domain/contracts.js").NutritionFoodCatalog} NutritionFoodCatalog
 * 
 * @typedef {import("../../intake-decision-engine/domain/contracts.js").IntakeDecision} IntakeDecision
 * @typedef {import("../../training-engine/domain/contracts.js").TrainingEngineOutput} TrainingEngineOutput
 * @typedef {import("../../cardio-engine/domain/contracts.js").CardioEngineResult} CardioEngineResult
 * @typedef {import("../../mobility-engine/domain/contracts.js").MobilityEngineResult} MobilityEngineResult
 * @typedef {import("../../nutrition-engine/domain/contracts.js").NutritionEngineOutput} NutritionEngineOutput
 */

/**
 * @typedef {Object} MasterEngineInput
 * @property {ClientIntake} intake
 * @property {EvaluationContext} evaluationContext
 * @property {NutritionFoodCatalog} nutritionFoodCatalog
 */

/**
 * @typedef {Object} MasterProgramResult
 * @property {string} engine_version
 * @property {IntakeDecision} intake_decision
 * @property {TrainingEngineOutput} training_program
 * @property {CardioEngineResult} cardio_program
 * @property {MobilityEngineResult} mobility_program
 * @property {NutritionEngineOutput} nutrition_program
 */

export {};
