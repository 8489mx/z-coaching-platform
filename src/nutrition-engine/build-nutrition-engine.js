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
/**
 * Reconciles a canonical macro split to its calorie target so the pipeline's
 * strict distribution validator (calorie_difference must be null or an
 * integer in -2..2) never sees rounding drift from the canonical calculator.
 *
 * Why the drift exists: the canonical calculator rounds each macro
 * independently (protein per kg, fat share, carb remainder) and then
 * rebalances clinically (diabetic carb ceiling, PCOS lower-carb, fat-share
 * ceiling) with lossy 4/9 conversions, without reconciling the final gram
 * sum to target_calories. The drift is rounding-scale (e.g. +6 kcal) but
 * the validator rejects anything outside -2..2, which crashed diabetic,
 * PCOS, and rounding-edge clients.
 *
 * Priority rule (this is the whole safety contract of the rebalance):
 *   1. Protein never changes (the muscle-sparing target is sacred).
 *   2. Carbohydrates never increase: this funnel cannot see a clinical
 *      carb ceiling in grams, so raising carbs could breach a diabetic cap.
 *   3. The calorie target never changes: the difference is fixed in the
 *      gram split, never hidden by moving the target.
 *   4. Prefer the smallest total gram movement (fat moves at most 4 g,
 *      carbs down at most 8 g in the balanced search).
 *   5. Fallback is carbs-only downward (the nearest multiple of 4 is
 *      always within 2), which is safe for carb ceilings at any magnitude.
 */
function rebalanceMacrosToTarget(calories, protein, carbs, fat) {
  const difference = protein * 4 + carbs * 4 + fat * 9 - calories;
  if (difference >= -2 && difference <= 2) {
    return { carbs, fat, difference };
  }
  let best = null;
  for (let fatDelta = -4; fatDelta <= 4; fatDelta += 1) {
    for (let carbDelta = -8; carbDelta <= 0; carbDelta += 1) {
      const nextFat = fat + fatDelta;
      if (nextFat < 0) continue;
      const nextDifference = difference + carbDelta * 4 + fatDelta * 9;
      if (nextDifference < -2 || nextDifference > 2) continue;
      // Any difference inside -2..2 is equally valid, so movement wins over
      // closeness to zero: a 1 g fix must beat an 8 g fix that lands on 0.
      const score = (Math.abs(carbDelta) + Math.abs(fatDelta)) * 100 + Math.abs(nextDifference);
      if (!best || score < best.score) {
        best = { carbs: carbs + carbDelta, fat: nextFat, difference: nextDifference, score };
      }
    }
  }
  if (best) return best;
  const carbDelta = -Math.round(difference / 4);
  return {
    carbs: carbs + carbDelta,
    fat,
    difference: difference + carbDelta * 4,
  };
}

function unifyStageTargets(energyTarget, macroTargets, universalTargets) {
  const rawCalories = Number(
    universalTargets?.target_calories ?? universalTargets?.target_calories_kcal ?? 0,
  );
  const rawProtein = Number(
    universalTargets?.protein_g ?? universalTargets?.total_protein_g ?? 0,
  );
  const rawCarbs = Number(
    universalTargets?.carb_g ??
      universalTargets?.carbohydrate_g ??
      universalTargets?.total_carbs_g ??
      0,
  );
  const rawFat = Number(
    universalTargets?.fat_g ?? universalTargets?.total_fat_g ?? 0,
  );
  if (!(rawCalories > 0)) {
    return { energyTarget, macroTargets };
  }
  // Integer normalization: the distribution validator requires an integer
  // calorie_difference. Canonical targets are already integers, so this is
  // a no-op for them; it only guards against fractional grams from other
  // producers. Protein rounds UP, never down: normalization never lowers
  // the protein target.
  const calories = Number.isInteger(rawCalories) ? rawCalories : Math.round(rawCalories);
  const protein = Number.isInteger(rawProtein) ? rawProtein : Math.ceil(rawProtein);
  const carbsIn = Number.isInteger(rawCarbs) ? rawCarbs : Math.round(rawCarbs);
  const fatIn = Number.isInteger(rawFat) ? rawFat : Math.round(rawFat);
  const { carbs, fat } = rebalanceMacrosToTarget(calories, protein, carbsIn, fatIn);
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
