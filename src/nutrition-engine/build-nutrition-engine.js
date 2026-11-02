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
 * Unifies the pipeline's own energy and macro stages onto one canonical
 * calorie prescription (the universal targets) BEFORE meal distribution, so
 * every downstream stage — distribution, assembly, portions, preflight —
 * runs on the same number the coach sees, instead of the pipeline's own
 * maintenance estimate. Mirrors the headline unification that program
 * generation already applies afterwards; applying it here makes the
 * pipeline itself consistent. WITHHELD stages are never overwritten, and
 * missing or non-positive canonical calories leave the stages untouched.
 *
 * @param {Object} energyTarget
 * @param {Object} macroTargets
 * @param {Object} universalTargets
 * @returns {{ energyTarget: Object, macroTargets: Object }}
 */
function unifyStageTargets(energyTarget, macroTargets, universalTargets) {
  const calories = Number(
    universalTargets?.target_calories ?? universalTargets?.target_calories_kcal ?? 0,
  );
  const protein = Number(
    universalTargets?.protein_g ?? universalTargets?.total_protein_g ?? 0,
  );
  const carbs = Number(
    universalTargets?.carb_g ??
      universalTargets?.carbohydrate_g ??
      universalTargets?.total_carbs_g ??
      0,
  );
  const fat = Number(
    universalTargets?.fat_g ?? universalTargets?.total_fat_g ?? 0,
  );
  if (!(calories > 0)) {
    return { energyTarget, macroTargets };
  }
  const fiber = Number(universalTargets?.fiber_g);
  const macroCaloriesTotal = protein * 4 + carbs * 4 + fat * 9;
  const round1 = (value) => Math.round(value * 10) / 10;

  const unifiedEnergy =
    !energyTarget || energyTarget.status === "WITHHELD"
      ? energyTarget
      : {
          ...energyTarget,
          target_calories: calories,
          target_calories_kcal: calories,
          calories_kcal: calories,
          target_source: "UNIVERSAL_TARGETS",
        };
  const unifiedMacros =
    !macroTargets || macroTargets.status === "WITHHELD"
      ? macroTargets
      : {
          ...macroTargets,
          target_calories: calories,
          protein: {
            ...(macroTargets.protein || {}),
            target_g: protein,
            calories: protein * 4,
            percent_of_calories: round1((protein * 4 / calories) * 100),
          },
          fat: {
            ...(macroTargets.fat || {}),
            target_g: fat,
            calories: fat * 9,
            percent_of_calories: round1((fat * 9 / calories) * 100),
          },
          carbohydrate: {
            ...(macroTargets.carbohydrate || {}),
            target_g: carbs,
            calories: carbs * 4,
            percent_of_calories: round1((carbs * 4 / calories) * 100),
          },
          protein_g: protein,
          carbohydrate_g: carbs,
          carb_g: carbs,
          carbs_g: carbs,
          fat_g: fat,
          fats_g: fat,
          ...(Number.isFinite(fiber) && fiber > 0
            ? { fiber_target_g: fiber }
            : {}),
          macro_calories_total: macroCaloriesTotal,
          calorie_difference: macroCaloriesTotal - calories,
          target_source: "UNIVERSAL_TARGETS",
        };
  return { energyTarget: unifiedEnergy, macroTargets: unifiedMacros };
}

/**
 * Runs the complete nutrition planning pipeline through its public APIs.
 *
 * @param {import("./domain/contracts.js").NutritionEngineInput} inputs
 * @returns {import("./domain/contracts.js").NutritionEngineOutput}
 */
export function buildNutritionEngine(inputs) {
  requireObject(inputs, "inputs");
  const {
    intake,
    evaluationContext,
    nutritionFoodCatalog,
    universalTargets = null,
  } = inputs;
  requireObject(intake, "intake");
  requireObject(evaluationContext, "evaluationContext");
  requireObject(nutritionFoodCatalog, "nutritionFoodCatalog");

  const intakeDecision = evaluateIntake(intake, evaluationContext);
  const planningSnapshot = buildNutritionPlanningSnapshot({
    intake,
    evaluationContext,
    intakeDecision,
  });
  const rawEnergyTarget = buildNutritionEnergyTarget(planningSnapshot);
  const rawMacroTargets = buildNutritionMacroTargets({
    nutritionPlanningSnapshot: planningSnapshot,
    nutritionEnergyTarget: rawEnergyTarget,
  });
  // One number from here on: when the caller supplies the canonical
  // universal targets (program generation does), the pipeline's own stages
  // are unified onto them before distribution, so meals follow the headline.
  // Without canonical targets the pipeline keeps its own goal-based stages.
  const { energyTarget, macroTargets } =
    universalTargets === null || universalTargets === undefined
      ? { energyTarget: rawEnergyTarget, macroTargets: rawMacroTargets }
      : unifyStageTargets(rawEnergyTarget, rawMacroTargets, universalTargets);
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
