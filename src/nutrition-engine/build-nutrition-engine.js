import { evaluateIntake } from "../intake-decision-engine/index.js";
import {
  buildNutritionEnergyTarget,
} from "../nutrition-energy-target/index.js";
import {
  buildNutritionFoodSelection,
} from "../nutrition-food-selection/index.js";
import {
  buildNutritionMacroTargets,
} from "../nutrition-macro-targets/index.js";
import {
  buildNutritionMealAssemblyBlueprint,
} from "../nutrition-meal-assembly-blueprint/index.js";
import {
  buildNutritionMealDistribution,
} from "../nutrition-meal-distribution/index.js";
import {
  evaluateNutritionPlanPreflight,
} from "../nutrition-plan-preflight/index.js";
import {
  buildNutritionPlanningSnapshot,
} from "../nutrition-planning-snapshot/index.js";
import {
  buildNutritionPortionSolver,
} from "../nutrition-portion-solver/index.js";
import {
  buildNutritionSwapEngine,
} from "../nutrition-swap-engine/index.js";
import { NUTRITION_ENGINE_VERSION } from "./domain/contracts.js";
import { NutritionEnginePolicy } from "./domain/enums.js";

function requireObject(value, name) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object.`);
  }
}

function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze(value[key], seen);
  }
  return Object.freeze(value);
}

function finalize(value) {
  return deepFreeze(structuredClone(value));
}

/**
 * Runs the complete nutrition planning pipeline through its public APIs.
 *
 * @param {import("./domain/contracts.js").NutritionEngineInput} inputs
 * @returns {import("./domain/contracts.js").NutritionEngineOutput}
 */
export function buildNutritionEngine(inputs) {
  requireObject(inputs, "inputs");
  const { intake, evaluationContext, nutritionFoodCatalog } = inputs;
  requireObject(intake, "intake");
  requireObject(evaluationContext, "evaluationContext");
  requireObject(nutritionFoodCatalog, "nutritionFoodCatalog");

  const intakeDecision = evaluateIntake(intake, evaluationContext);
  const planningSnapshot = buildNutritionPlanningSnapshot({
    intake,
    evaluationContext,
    intakeDecision,
  });
  const energyTarget = buildNutritionEnergyTarget(planningSnapshot);
  const macroTargets = buildNutritionMacroTargets({
    nutritionPlanningSnapshot: planningSnapshot,
    nutritionEnergyTarget: energyTarget,
  });
  const mealDistribution = buildNutritionMealDistribution({
    nutritionPlanningSnapshot: planningSnapshot,
    nutritionMacroTargets: macroTargets,
  });
  const mealAssemblyBlueprint = buildNutritionMealAssemblyBlueprint({
    nutritionPlanningSnapshot: planningSnapshot,
    nutritionMealDistribution: mealDistribution,
  });
  const foodSelection = buildNutritionFoodSelection({
    nutritionPlanningSnapshot: planningSnapshot,
    nutritionMealAssemblyBlueprint: mealAssemblyBlueprint,
    nutritionFoodCatalog,
  });
  const portionSolver = buildNutritionPortionSolver({
    nutritionFoodSelection: foodSelection,
    nutritionFoodCatalog,
  });
  const swapEngine = buildNutritionSwapEngine({
    nutritionFoodSelection: foodSelection,
    nutritionPortionSolver: portionSolver,
    nutritionFoodCatalog,
  });
  const planPreflight = evaluateNutritionPlanPreflight({
    nutritionFoodSelection: foodSelection,
    nutritionPortionSolver: portionSolver,
    nutritionSwapEngine: swapEngine,
    nutritionFoodCatalog,
  });

  return finalize({
    nutrition_engine_version: NUTRITION_ENGINE_VERSION,
    source_food_catalog_version: nutritionFoodCatalog.food_catalog_version,
    status: planPreflight.status,
    engine_policy:
      NutritionEnginePolicy.Z_COACHING_NUTRITION_ENGINE_V1,
    ready_for_coach_review: planPreflight.ready_for_coach_review,
    stages: {
      intake_decision: intakeDecision,
      planning_snapshot: planningSnapshot,
      energy_target: energyTarget,
      macro_targets: macroTargets,
      meal_distribution: mealDistribution,
      meal_assembly_blueprint: mealAssemblyBlueprint,
      food_selection: foodSelection,
      portion_solver: portionSolver,
      swap_engine: swapEngine,
      plan_preflight: planPreflight,
    },
  });
}
