export const NUTRITION_ENGINE_VERSION = "nutrition-engine-v1";

/** @typedef {"Z_COACHING_NUTRITION_ENGINE_V1"} NutritionEnginePolicyValue */
/** @typedef {"READY"|"REVIEW_REQUIRED"|"WITHHELD"} NutritionEngineStatusValue */

/**
 * @typedef {Object} NutritionEngineInput
 * @property {import("../../intake-decision-engine/domain/contracts.js").ClientIntake} intake
 * @property {import("../../intake-decision-engine/domain/contracts.js").EvaluationContext} evaluationContext
 * @property {import("../../nutrition-food-catalog/domain/contracts.js").NutritionFoodCatalog} nutritionFoodCatalog
 */

/**
 * @typedef {Object} NutritionEngineStages
 * @property {import("../../intake-decision-engine/domain/contracts.js").IntakeDecision} intake_decision
 * @property {import("../../nutrition-planning-snapshot/domain/contracts.js").NutritionPlanningSnapshot} planning_snapshot
 * @property {import("../../nutrition-energy-target/domain/contracts.js").NutritionEnergyTarget} energy_target
 * @property {import("../../nutrition-macro-targets/domain/contracts.js").NutritionMacroTargets} macro_targets
 * @property {import("../../nutrition-meal-distribution/domain/contracts.js").NutritionMealDistribution} meal_distribution
 * @property {import("../../nutrition-meal-assembly-blueprint/domain/contracts.js").NutritionMealAssemblyBlueprint} meal_assembly_blueprint
 * @property {import("../../nutrition-food-selection/domain/contracts.js").NutritionFoodSelection} food_selection
 * @property {import("../../nutrition-portion-solver/domain/contracts.js").NutritionPortionSolver} portion_solver
 * @property {import("../../nutrition-swap-engine/domain/contracts.js").NutritionSwapEngine} swap_engine
 * @property {import("../../nutrition-plan-preflight/domain/contracts.js").NutritionPlanPreflight} plan_preflight
 */

/**
 * @typedef {Object} NutritionEngineOutput
 * @property {"nutrition-engine-v1"} nutrition_engine_version
 * @property {string} source_food_catalog_version
 * @property {NutritionEngineStatusValue} status
 * @property {NutritionEnginePolicyValue} engine_policy
 * @property {boolean} ready_for_coach_review
 * @property {NutritionEngineStages} stages
 */

export {};
