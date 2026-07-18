import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { evaluateIntake } from "z-coaching-intake-decision-engine";
import {
  buildNutritionEnergyTarget,
} from "z-coaching-intake-decision-engine/nutrition-energy-target";
import {
  buildNutritionFoodCatalog,
} from "z-coaching-intake-decision-engine/nutrition-food-catalog";
import {
  buildNutritionFoodSelection,
} from "z-coaching-intake-decision-engine/nutrition-food-selection";
import {
  buildNutritionMacroTargets,
} from "z-coaching-intake-decision-engine/nutrition-macro-targets";
import {
  buildNutritionMealAssemblyBlueprint,
} from "z-coaching-intake-decision-engine/nutrition-meal-assembly-blueprint";
import {
  buildNutritionMealDistribution,
} from "z-coaching-intake-decision-engine/nutrition-meal-distribution";
import * as preflightApi from
  "z-coaching-intake-decision-engine/nutrition-plan-preflight";
import {
  buildNutritionPlanningSnapshot,
} from "z-coaching-intake-decision-engine/nutrition-planning-snapshot";
import {
  buildNutritionPortionSolver,
} from "z-coaching-intake-decision-engine/nutrition-portion-solver";
import {
  buildNutritionSwapEngine,
} from "z-coaching-intake-decision-engine/nutrition-swap-engine";

const {
  NUTRITION_PLAN_PREFLIGHT_VERSION,
  NutritionPlanPreflightPolicy,
  NutritionPlanPreflightStatus,
  evaluateNutritionPlanPreflight,
} = preflightApi;

const ALL_MARKETS = Object.freeze(["EG", "SA", "KW", "BH", "QA", "AE"]);
const NUTRIENT_KEYS = Object.freeze([
  "calories_kcal",
  "protein_g",
  "fat_g",
  "carbohydrate_g",
  "fiber_g",
]);
const CHECK_CODES = Object.freeze([
  "UPSTREAM_STATUS",
  "MEAL_PATTERN_COMPLETENESS",
  "SELECTED_FOOD_INTEGRITY",
  "PORTION_LEGALITY",
  "PORTION_CALCULATION_INTEGRITY",
  "MEAL_TARGET_CLOSURE",
  "DAILY_TARGET_CLOSURE",
  "SWAP_SAFETY",
]);

function readJson(url) {
  return JSON.parse(readFileSync(url, "utf8"));
}

function makeItem({
  foodCode = "A_FOOD",
  groupCode = "GROUP_ONE",
  foodClass = "ANIMAL_PROTEIN",
  nutrition = {},
  portion = {},
  swappable = true,
} = {}) {
  return {
    food_code: foodCode,
    name_ar: `Synthetic AR ${foodCode}`,
    name_en: `Synthetic EN ${foodCode}`,
    food_class: foodClass,
    food_state: "READY_TO_EAT",
    is_active: true,
    selection_priority: 10,
    compatible_pattern_codes: ["MAIN_CLASSIC"],
    available_markets: [...ALL_MARKETS],
    budget_level: "LOW",
    logistics: { requires_storage: false, requires_reheating: false },
    nutrition_per_100g: {
      calories_kcal: 100,
      protein_g: 10,
      fat_g: 2,
      carbohydrate_g: 10,
      fiber_g: 1,
      ...structuredClone(nutrition),
    },
    portion_rule_g: {
      minimum_g: 100,
      maximum_g: 100,
      step_g: 10,
      default_g: 100,
      ...structuredClone(portion),
    },
    tags: {
      identity_tags: [foodCode],
      allergen_tags: [],
      intolerance_tags: [],
    },
    swap: {
      is_swappable: swappable,
      group_code: swappable ? groupCode : null,
    },
    source: {
      type: "COACH_VERIFIED",
      name: "Synthetic source",
      reference: `SYNTHETIC-${foodCode}`,
      checked_date: "2026-07-18",
    },
  };
}

function defaultItems() {
  return [makeItem(), makeItem({ foodCode: "B_FOOD" })];
}

function makeCatalog(items = defaultItems()) {
  return buildNutritionFoodCatalog(items);
}

function makeSlot({
  sequence = 1,
  slot = "PROTEIN_ANCHOR",
  selected = ["A_FOOD"],
  candidates = ["A_FOOD", "B_FOOD"],
  minItems = selected.length,
  maxItems = Math.max(1, selected.length),
} = {}) {
  return {
    sequence,
    slot,
    requirement: "REQUIRED",
    min_items: minItems,
    max_items: maxItems,
    allowed_food_classes: ["ANIMAL_PROTEIN"],
    selected_food_codes: [...selected],
    candidate_food_codes: [...candidates],
    rejected_foods: [],
    deferred_to_portion_solver: false,
  };
}

function makeMeal({
  sequence = 1,
  role = "MAIN_MEAL",
  selectedPatternCode = "MAIN_CLASSIC",
  target = {},
  slots = [makeSlot()],
} = {}) {
  return {
    sequence,
    role,
    target: {
      planned_calories: 100,
      protein_g: 10,
      fat_g: 2,
      carbohydrate_g: 10,
      fiber_g: 1,
      ...structuredClone(target),
    },
    selected_pattern_code: selectedPatternCode,
    pattern_attempts: [],
    slots: structuredClone(slots),
    issues: [],
  };
}

function makeSelection({
  status = "READY",
  meals = [makeMeal()],
  mealCount = meals.length,
  constraints = [],
  reasons = [],
} = {}) {
  return {
    food_selection_version: "nutrition-food-selection-v1",
    source_snapshot_version: "nutrition-planning-snapshot-v1",
    source_assembly_blueprint_version:
      "nutrition-meal-assembly-blueprint-v1",
    source_food_catalog_version: "nutrition-food-catalog-v1",
    status,
    selection_policy: "Z_COACHING_FOOD_SELECTION_V1",
    market_code: "EG",
    meal_count: mealCount,
    meals: structuredClone(meals),
    constraints: structuredClone(constraints),
    reasons: structuredClone(reasons),
  };
}

function makeInputs({
  items = defaultItems(),
  selection = makeSelection(),
} = {}) {
  const nutritionFoodCatalog = makeCatalog(items);
  const nutritionFoodSelection = selection;
  const nutritionPortionSolver = buildNutritionPortionSolver({
    nutritionFoodSelection,
    nutritionFoodCatalog,
  });
  const nutritionSwapEngine = buildNutritionSwapEngine({
    nutritionFoodSelection,
    nutritionPortionSolver,
    nutritionFoodCatalog,
  });
  return {
    nutritionFoodSelection,
    nutritionPortionSolver,
    nutritionSwapEngine,
    nutritionFoodCatalog,
  };
}

function makeMutableInputs(options) {
  return structuredClone(makeInputs(options));
}

function buildFrom(options) {
  return evaluateNutritionPlanPreflight(makeInputs(options));
}

function checkByCode(result, code) {
  return result.checks.find((check) => check.code === code);
}

function issuesByCode(result, code) {
  return result.issues.filter((issue) => issue.code === code);
}

function reasonCodes(result) {
  return result.reasons.map((reason) => reason.code);
}

function roundDisplay(value) {
  const rounded = Math.round((value + Number.EPSILON * value) * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function rawNutrition(food, grams) {
  return Object.fromEntries(NUTRIENT_KEYS.map((key) => [
    key,
    food.nutrition_per_100g[key] * grams / 100,
  ]));
}

function targetNutrition(target) {
  return {
    calories_kcal: target.planned_calories,
    protein_g: target.protein_g,
    fat_g: target.fat_g,
    carbohydrate_g: target.carbohydrate_g,
    fiber_g: target.fiber_g,
  };
}

function syncSingleItemPortion(inputs, grams) {
  const food = inputs.nutritionFoodCatalog.items.find(
    (item) => item.food_code === "A_FOOD",
  );
  const meal = inputs.nutritionPortionSolver.meals[0];
  const item = meal.items[0];
  const raw = rawNutrition(food, grams);
  const target = targetNutrition(meal.target);
  item.grams = grams;
  item.nutrition = Object.fromEntries(NUTRIENT_KEYS.map((key) => [
    key,
    roundDisplay(raw[key]),
  ]));
  meal.totals = structuredClone(item.nutrition);
  meal.residual = Object.fromEntries(NUTRIENT_KEYS.map((key) => [
    key,
    roundDisplay(raw[key] - target[key]),
  ]));
  meal.within_tolerance = Object.fromEntries(NUTRIENT_KEYS.map((key) => [
    key,
    Math.abs(raw[key] - target[key]) <= meal.tolerance[key],
  ]));
  meal.all_targets_within_tolerance = Object.values(
    meal.within_tolerance,
  ).every(Boolean);
  inputs.nutritionPortionSolver.daily_totals = structuredClone(meal.totals);
  inputs.nutritionPortionSolver.daily_residual = Object.fromEntries(
    NUTRIENT_KEYS.map((key) => [
      key,
      roundDisplay(raw[key] - inputs.nutritionPortionSolver.daily_target[key]),
    ]),
  );
  inputs.nutritionSwapEngine.meals[0].items[0].grams = grams;
  inputs.nutritionSwapEngine.meals[0].items[0].alternatives = [];
}

function assertDeepFrozen(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) {
    return;
  }
  seen.add(value);
  assert.equal(Object.isFrozen(value), true);
  for (const key of Reflect.ownKeys(value)) {
    assertDeepFrozen(value[key], seen);
  }
}

let realInputsCache;

function buildRealInputs() {
  if (realInputsCache !== undefined) {
    return realInputsCache;
  }
  const intake = readJson(new URL("../examples/full-intake.json", import.meta.url));
  const evaluationContext = readJson(
    new URL("../examples/evaluation-context.json", import.meta.url),
  );
  const nutritionFoodCatalog = readJson(
    new URL("../data/catalogs/core-global-food-batch-v1.json", import.meta.url),
  );
  const intakeDecision = evaluateIntake(intake, evaluationContext);
  const nutritionPlanningSnapshot = buildNutritionPlanningSnapshot({
    intake,
    evaluationContext,
    intakeDecision,
  });
  const nutritionEnergyTarget = buildNutritionEnergyTarget(
    nutritionPlanningSnapshot,
  );
  const nutritionMacroTargets = buildNutritionMacroTargets({
    nutritionPlanningSnapshot,
    nutritionEnergyTarget,
  });
  const nutritionMealDistribution = buildNutritionMealDistribution({
    nutritionPlanningSnapshot,
    nutritionMacroTargets,
  });
  const nutritionMealAssemblyBlueprint =
    buildNutritionMealAssemblyBlueprint({
      nutritionPlanningSnapshot,
      nutritionMealDistribution,
    });
  const nutritionFoodSelection = buildNutritionFoodSelection({
    nutritionPlanningSnapshot,
    nutritionMealAssemblyBlueprint,
    nutritionFoodCatalog,
  });
  const nutritionPortionSolver = buildNutritionPortionSolver({
    nutritionFoodSelection,
    nutritionFoodCatalog,
  });
  const nutritionSwapEngine = buildNutritionSwapEngine({
    nutritionFoodSelection,
    nutritionPortionSolver,
    nutritionFoodCatalog,
  });
  realInputsCache = {
    nutritionFoodSelection,
    nutritionPortionSolver,
    nutritionSwapEngine,
    nutritionFoodCatalog,
  };
  return realInputsCache;
}

test("public API exposes only the approved Nutrition Preflight entries", async () => {
  assert.deepEqual(Object.keys(preflightApi).sort(), [
    "NUTRITION_PLAN_PREFLIGHT_VERSION",
    "NutritionPlanPreflightPolicy",
    "NutritionPlanPreflightStatus",
    "evaluateNutritionPlanPreflight",
  ]);
  assert.equal(
    NUTRITION_PLAN_PREFLIGHT_VERSION,
    "nutrition-plan-preflight-v1",
  );
  assert.deepEqual(Object.values(NutritionPlanPreflightPolicy), [
    "Z_COACHING_NUTRITION_PREFLIGHT_V1",
  ]);
  assert.deepEqual(Object.values(NutritionPlanPreflightStatus), [
    "READY",
    "REVIEW_REQUIRED",
    "WITHHELD",
  ]);
  assert.equal(Object.isFrozen(NutritionPlanPreflightPolicy), true);
  assert.equal(Object.isFrozen(NutritionPlanPreflightStatus), true);
  const packageApi = await import(
    "z-coaching-intake-decision-engine/nutrition-plan-preflight"
  );
  assert.equal(packageApi.evaluateNutritionPlanPreflight,
    evaluateNutritionPlanPreflight);
});

test("READY output follows the approved contract and check order", () => {
  const result = buildFrom();
  assert.equal(result.status, NutritionPlanPreflightStatus.READY);
  assert.equal(result.ready_for_coach_review, true);
  assert.deepEqual(Object.keys(result), [
    "nutrition_plan_preflight_version",
    "source_food_selection_version",
    "source_portion_solver_version",
    "source_swap_engine_version",
    "source_food_catalog_version",
    "status",
    "preflight_policy",
    "ready_for_coach_review",
    "meal_count",
    "checks",
    "issues",
    "constraints",
    "reasons",
  ]);
  assert.deepEqual(result.checks.map((check) => check.code), CHECK_CODES);
  assert.equal(result.checks.every((check) => check.status === "PASSED"), true);
  assert.deepEqual(result.issues, []);
  assert.equal(reasonCodes(result).at(-1), "PREFLIGHT_POLICY_APPLIED");
});

test("WITHHELD propagates with all checks withheld", () => {
  const selection = makeSelection({ status: "WITHHELD", meals: [], mealCount: null });
  const result = buildFrom({ selection });
  assert.equal(result.status, NutritionPlanPreflightStatus.WITHHELD);
  assert.equal(result.ready_for_coach_review, false);
  assert.equal(result.meal_count, null);
  assert.deepEqual(result.issues, []);
  assert.equal(result.checks.every((check) =>
    check.status === "WITHHELD" && check.issue_codes.length === 0), true);
  assert.deepEqual(reasonCodes(result).slice(-2), [
    "PREFLIGHT_POLICY_APPLIED",
    "PREFLIGHT_WITHHELD_BY_UPSTREAM_STATUS",
  ]);
});

test("a provisional upstream plan remains review-required without local issues", () => {
  const selection = makeSelection({ status: "PROVISIONAL_REVIEW_REQUIRED" });
  const result = buildFrom({ selection });
  assert.equal(result.status, NutritionPlanPreflightStatus.REVIEW_REQUIRED);
  assert.equal(result.ready_for_coach_review, true);
  assert.deepEqual(result.issues, []);
  assert.equal(checkByCode(result, "UPSTREAM_STATUS").status,
    "REVIEW_REQUIRED");
  assert.equal(reasonCodes(result).at(-1),
    "PREFLIGHT_UPSTREAM_REVIEW_RETAINED");
});

test("impossible upstream status combinations throw TypeError", () => {
  const invalidInputs = [];
  const readyWithProvisionalSwap = makeMutableInputs();
  readyWithProvisionalSwap.nutritionSwapEngine.status =
    "PROVISIONAL_REVIEW_REQUIRED";
  invalidInputs.push(readyWithProvisionalSwap);
  const provisionalWithReadyPortion = makeMutableInputs({
    selection: makeSelection({ status: "PROVISIONAL_REVIEW_REQUIRED" }),
  });
  provisionalWithReadyPortion.nutritionPortionSolver.status = "READY";
  provisionalWithReadyPortion.nutritionSwapEngine.status = "READY";
  invalidInputs.push(provisionalWithReadyPortion);
  const partialWithheld = makeMutableInputs();
  partialWithheld.nutritionPortionSolver.status = "WITHHELD";
  partialWithheld.nutritionSwapEngine.status = "WITHHELD";
  invalidInputs.push(partialWithheld);
  for (const inputs of invalidInputs) {
    assert.throws(() => evaluateNutritionPlanPreflight(inputs), TypeError);
  }
});

test("a meal without a selected pattern is attributed to Food Selection", () => {
  const selection = makeSelection({
    status: "PROVISIONAL_REVIEW_REQUIRED",
    meals: [makeMeal({ selectedPatternCode: null, slots: [] })],
  });
  const result = buildFrom({ selection });
  const issue = issuesByCode(
    result,
    "PREFLIGHT_MEAL_WITHOUT_SELECTED_PATTERN",
  )[0];
  assert.equal(issue.source_stage, "FOOD_SELECTION");
  assert.equal(issue.meal_sequence, 1);
  assert.deepEqual(issue.fields, ["selected_pattern_code"]);
  assert.equal(checkByCode(result, "MEAL_PATTERN_COMPLETENESS").status,
    "REVIEW_REQUIRED");
});

test("a selected food listed in rejected_foods produces a Food Selection issue", () => {
  const inputs = makeMutableInputs();
  inputs.nutritionFoodSelection.meals[0].slots[0].candidate_food_codes = [
    "B_FOOD",
  ];
  inputs.nutritionFoodSelection.meals[0].slots[0].rejected_foods.push({
    food_code: "A_FOOD",
    reason_codes: ["ALLERGY_EXCLUDED"],
  });
  const result = evaluateNutritionPlanPreflight(inputs);
  const issue = issuesByCode(result, "PREFLIGHT_REJECTED_FOOD_SELECTED")[0];
  assert.equal(issue.source_stage, "FOOD_SELECTION");
  assert.equal(issue.food_code, "A_FOOD");
  assert.deepEqual(issue.fields, ["food_code"]);
});

test("foods outside candidates, missing slots, and duplicate foods are structural errors", () => {
  const outsideCandidates = makeMutableInputs();
  outsideCandidates.nutritionFoodSelection.meals[0].slots[0]
    .candidate_food_codes = ["B_FOOD"];
  const missingSlot = makeMutableInputs();
  missingSlot.nutritionPortionSolver.meals[0].items[0].slot_sequence = 2;
  const duplicateFood = makeMutableInputs();
  duplicateFood.nutritionPortionSolver.meals[0].items.push(
    structuredClone(duplicateFood.nutritionPortionSolver.meals[0].items[0]),
  );
  for (const inputs of [outsideCandidates, missingSlot, duplicateFood]) {
    assert.throws(() => evaluateNutritionPlanPreflight(inputs), TypeError);
  }
});

test("illegal grams produce a Portion Solver issue without trusting rounded fields", () => {
  for (const grams of [105, 100.5]) {
    const inputs = makeMutableInputs();
    syncSingleItemPortion(inputs, grams);
    const result = evaluateNutritionPlanPreflight(inputs);
    const issue = issuesByCode(result, "PREFLIGHT_ILLEGAL_PORTION")[0];
    assert.equal(issue.source_stage, "PORTION_SOLVER");
    assert.equal(issue.food_code, "A_FOOD");
    assert.deepEqual(issue.fields, ["grams"]);
  }
});

test("item nutrition mismatches are located at the food", () => {
  const inputs = makeMutableInputs();
  inputs.nutritionPortionSolver.meals[0].items[0].nutrition.protein_g += 0.02;
  const result = evaluateNutritionPlanPreflight(inputs);
  const issue = issuesByCode(
    result,
    "PREFLIGHT_PORTION_CALCULATION_MISMATCH",
  ).find((entry) => entry.food_code === "A_FOOD");
  assert.deepEqual(issue.fields, ["protein_g"]);
  assert.equal(issue.source_stage, "PORTION_SOLVER");
});

test("meal totals and residual mismatches are aggregated per meal", () => {
  const inputs = makeMutableInputs();
  inputs.nutritionPortionSolver.meals[0].totals.fat_g += 0.02;
  inputs.nutritionPortionSolver.meals[0].residual.carbohydrate_g += 0.02;
  const result = evaluateNutritionPlanPreflight(inputs);
  const issue = issuesByCode(
    result,
    "PREFLIGHT_PORTION_CALCULATION_MISMATCH",
  ).find((entry) => entry.meal_sequence === 1 && entry.food_code === null);
  assert.deepEqual(issue.fields, ["fat_g", "carbohydrate_g"]);
});

test("daily totals and residual mismatches are attributed to Portion Solver", () => {
  const inputs = makeMutableInputs();
  inputs.nutritionPortionSolver.daily_totals.calories_kcal += 0.02;
  inputs.nutritionPortionSolver.daily_residual.fiber_g += 0.02;
  const result = evaluateNutritionPlanPreflight(inputs);
  const issue = issuesByCode(
    result,
    "PREFLIGHT_PORTION_CALCULATION_MISMATCH",
  ).find((entry) => entry.meal_sequence === null);
  assert.deepEqual(issue.fields, ["calories_kcal", "fiber_g"]);
});

test("the display allowance accepts 0.01 and rejects a larger mismatch", () => {
  const allowed = makeMutableInputs();
  allowed.nutritionPortionSolver.meals[0].items[0]
    .nutrition.calories_kcal += 0.01;
  assert.equal(issuesByCode(
    evaluateNutritionPlanPreflight(allowed),
    "PREFLIGHT_PORTION_CALCULATION_MISMATCH",
  ).length, 0);

  const rejected = makeMutableInputs();
  rejected.nutritionPortionSolver.meals[0].items[0]
    .nutrition.calories_kcal += 0.011;
  assert.equal(issuesByCode(
    evaluateNutritionPlanPreflight(rejected),
    "PREFLIGHT_PORTION_CALCULATION_MISMATCH",
  ).length, 1);
});

test("raw meal closure uses the supplied Portion Solver tolerance", () => {
  const inputs = makeMutableInputs();
  const selectionTarget = inputs.nutritionFoodSelection.meals[0].target;
  const portionMeal = inputs.nutritionPortionSolver.meals[0];
  selectionTarget.planned_calories = 160;
  portionMeal.target.planned_calories = 160;
  portionMeal.residual.calories_kcal = -60;
  portionMeal.within_tolerance.calories_kcal = false;
  portionMeal.all_targets_within_tolerance = false;
  inputs.nutritionSwapEngine.meals[0].items[0].alternatives = [];
  const result = evaluateNutritionPlanPreflight(inputs);
  const issue = issuesByCode(
    result,
    "PREFLIGHT_MEAL_TARGET_OUTSIDE_TOLERANCE",
  )[0];
  assert.deepEqual(issue.fields, ["calories_kcal"]);
  assert.equal(issue.source_stage, "PORTION_SOLVER");
});

test("daily closure applies the approved floor and percentage tolerance", () => {
  const inputs = makeMutableInputs();
  inputs.nutritionPortionSolver.daily_target.calories_kcal = 160;
  inputs.nutritionPortionSolver.daily_residual.calories_kcal = -60;
  const result = evaluateNutritionPlanPreflight(inputs);
  const issue = issuesByCode(
    result,
    "PREFLIGHT_DAILY_TARGET_OUTSIDE_TOLERANCE",
  )[0];
  assert.deepEqual(issue.fields, ["calories_kcal"]);
  assert.equal(issue.source_stage, "PLAN_PREFLIGHT");
});

test("a safe alternative from the same group passes Swap Safety", () => {
  const inputs = makeInputs();
  assert.deepEqual(
    inputs.nutritionSwapEngine.meals[0].items[0].alternatives.map(
      (alternative) => alternative.food_code,
    ),
    ["B_FOOD"],
  );
  const result = evaluateNutritionPlanPreflight(inputs);
  assert.equal(checkByCode(result, "SWAP_SAFETY").status, "PASSED");
  assert.equal(issuesByCode(result, "PREFLIGHT_UNSAFE_SWAP").length, 0);
});

test("a swap outside the original slot candidates is unsafe", () => {
  const inputs = makeMutableInputs();
  inputs.nutritionFoodSelection.meals[0].slots[0].candidate_food_codes = [
    "A_FOOD",
  ];
  const result = evaluateNutritionPlanPreflight(inputs);
  const issue = issuesByCode(result, "PREFLIGHT_UNSAFE_SWAP")[0];
  assert.equal(issue.food_code, "B_FOOD");
  assert.deepEqual(issue.fields, ["food_code"]);
  assert.equal(issue.source_stage, "SWAP_ENGINE");
});

test("a swap from a different catalog group is unsafe", () => {
  const items = [
    ...defaultItems(),
    makeItem({ foodCode: "C_FOOD", groupCode: "GROUP_TWO" }),
    makeItem({ foodCode: "D_FOOD", groupCode: "GROUP_TWO" }),
  ];
  const selection = makeSelection({
    meals: [makeMeal({
      slots: [makeSlot({
        candidates: ["A_FOOD", "B_FOOD", "C_FOOD", "D_FOOD"],
      })],
    })],
  });
  const inputs = makeMutableInputs({ items, selection });
  inputs.nutritionSwapEngine.meals[0].items[0]
    .alternatives[0].food_code = "C_FOOD";
  const issue = issuesByCode(
    evaluateNutritionPlanPreflight(inputs),
    "PREFLIGHT_UNSAFE_SWAP",
  )[0];
  assert.equal(issue.food_code, "C_FOOD");
  assert.ok(issue.fields.includes("group_code"));
});

test("an alternative already used by another item in the meal is unsafe", () => {
  const items = [
    ...defaultItems(),
    makeItem({ foodCode: "C_FOOD" }),
  ];
  const selection = makeSelection({
    meals: [makeMeal({
      target: {
        planned_calories: 200,
        protein_g: 20,
        fat_g: 4,
        carbohydrate_g: 20,
        fiber_g: 2,
      },
      slots: [makeSlot({
        selected: ["A_FOOD", "C_FOOD"],
        candidates: ["A_FOOD", "B_FOOD", "C_FOOD"],
        minItems: 2,
        maxItems: 2,
      })],
    })],
  });
  const inputs = makeMutableInputs({ items, selection });
  inputs.nutritionSwapEngine.meals[0].items[0]
    .alternatives[0].food_code = "C_FOOD";
  const issue = issuesByCode(
    evaluateNutritionPlanPreflight(inputs),
    "PREFLIGHT_UNSAFE_SWAP",
  )[0];
  assert.equal(issue.food_code, "C_FOOD");
  assert.ok(issue.fields.includes("food_code"));
  assert.equal(issue.fields.includes("group_code"), false);
});

test("the original food cannot appear as its own alternative", () => {
  const inputs = makeMutableInputs();
  inputs.nutritionSwapEngine.meals[0].items[0]
    .alternatives[0].food_code = "A_FOOD";
  const issue = issuesByCode(
    evaluateNutritionPlanPreflight(inputs),
    "PREFLIGHT_UNSAFE_SWAP",
  )[0];
  assert.equal(issue.food_code, "A_FOOD");
  assert.ok(issue.fields.includes("food_code"));
});

test("illegal alternative grams produce an unsafe swap issue", () => {
  const inputs = makeMutableInputs();
  inputs.nutritionSwapEngine.meals[0].items[0].alternatives[0].grams = 105;
  const issue = issuesByCode(
    evaluateNutritionPlanPreflight(inputs),
    "PREFLIGHT_UNSAFE_SWAP",
  )[0];
  assert.ok(issue.fields.includes("grams"));
});

test("incorrect projected swap calculations and flags are detected", () => {
  const mutations = [
    (alternative) => {
      alternative.nutrition.protein_g += 0.02;
    },
    (alternative) => {
      alternative.projected_meal_totals.fat_g += 0.02;
    },
    (alternative) => {
      alternative.projected_meal_residual.carbohydrate_g += 0.02;
    },
    (alternative) => {
      alternative.projected_within_tolerance.fiber_g = false;
    },
    (alternative) => {
      alternative.objective_score += 0.02;
    },
  ];
  for (const mutate of mutations) {
    const inputs = makeMutableInputs();
    mutate(inputs.nutritionSwapEngine.meals[0].items[0].alternatives[0]);
    const result = evaluateNutritionPlanPreflight(inputs);
    assert.equal(issuesByCode(result, "PREFLIGHT_UNSAFE_SWAP").length, 1);
  }
});

test("duplicate unsafe alternatives merge all fields deterministically", () => {
  const inputs = makeMutableInputs();
  const first = inputs.nutritionSwapEngine.meals[0].items[0].alternatives[0];
  const second = structuredClone(first);
  first.objective_score += 0.02;
  second.projected_within_tolerance.fiber_g = false;
  inputs.nutritionSwapEngine.meals[0].items[0].alternatives.push(second);
  const issues = issuesByCode(
    evaluateNutritionPlanPreflight(inputs),
    "PREFLIGHT_UNSAFE_SWAP",
  );
  assert.equal(issues.length, 1);
  assert.ok(issues[0].fields.includes("fiber_g"));
  assert.ok(issues[0].fields.includes("objective_score"));
});

test("NO_SAFE_SWAP_AVAILABLE does not prevent READY", () => {
  const selection = makeSelection({
    meals: [makeMeal({
      slots: [makeSlot({ candidates: ["A_FOOD"] })],
    })],
  });
  const inputs = makeInputs({ selection });
  assert.deepEqual(
    inputs.nutritionSwapEngine.meals[0].items[0].issues.map(
      (issue) => issue.code,
    ),
    ["NO_SAFE_SWAP_AVAILABLE"],
  );
  const result = evaluateNutritionPlanPreflight(inputs);
  assert.equal(result.status, NutritionPlanPreflightStatus.READY);
  assert.equal(checkByCode(result, "SWAP_SAFETY").status, "PASSED");
});

test("an unclosed meal without alternatives is valid for Swap Safety", () => {
  const selection = makeSelection({
    meals: [makeMeal({ target: { planned_calories: 1000 } })],
  });
  const inputs = makeInputs({ selection });
  assert.equal(
    inputs.nutritionPortionSolver.meals[0].all_targets_within_tolerance,
    false,
  );
  assert.equal(inputs.nutritionSwapEngine.meals[0].items[0]
    .alternatives.length, 0);
  const result = evaluateNutritionPlanPreflight(inputs);
  assert.equal(checkByCode(result, "SWAP_SAFETY").status, "PASSED");
  assert.equal(issuesByCode(result, "PREFLIGHT_UNSAFE_SWAP").length, 0);
});

test("an unclosed meal containing an alternative fails Swap Safety", () => {
  const safeAlternative = structuredClone(
    makeInputs().nutritionSwapEngine.meals[0].items[0].alternatives[0],
  );
  const selection = makeSelection({
    meals: [makeMeal({ target: { planned_calories: 1000 } })],
  });
  const inputs = makeMutableInputs({ selection });
  inputs.nutritionSwapEngine.meals[0].items[0].alternatives = [safeAlternative];
  const issue = issuesByCode(
    evaluateNutritionPlanPreflight(inputs),
    "PREFLIGHT_UNSAFE_SWAP",
  )[0];
  assert.ok(issue.fields.includes("alternatives"));
});

test("issues are sorted by check, meal, food, and code deterministically", () => {
  const inputs = makeMutableInputs();
  inputs.nutritionFoodSelection.meals[0].slots[0].rejected_foods.push({
    food_code: "A_FOOD",
    reason_codes: ["ALLERGY_EXCLUDED"],
  });
  syncSingleItemPortion(inputs, 105);
  inputs.nutritionPortionSolver.daily_target.calories_kcal = 160;
  inputs.nutritionPortionSolver.daily_residual.calories_kcal = -55;
  const result = evaluateNutritionPlanPreflight(inputs);
  assert.deepEqual(result.issues.map((issue) => issue.code), [
    "PREFLIGHT_REJECTED_FOOD_SELECTED",
    "PREFLIGHT_ILLEGAL_PORTION",
    "PREFLIGHT_DAILY_TARGET_OUTSIDE_TOLERANCE",
  ]);
});

test("catalog item order does not affect preflight output", () => {
  const inputs = makeMutableInputs();
  const first = evaluateNutritionPlanPreflight(inputs);
  inputs.nutritionFoodCatalog.items.reverse();
  const second = evaluateNutritionPlanPreflight(inputs);
  assert.deepEqual(second, first);
});

test("constraints and first unique reasons are copied by value", () => {
  const inputs = makeMutableInputs();
  inputs.nutritionSwapEngine.constraints = [{ code: "KEEP", value: { x: 1 } }];
  inputs.nutritionSwapEngine.reasons = [
    { code: "DUPLICATE", message: "first" },
    { code: "DUPLICATE", message: "second" },
  ];
  const result = evaluateNutritionPlanPreflight(inputs);
  assert.deepEqual(result.constraints, [{ code: "KEEP", value: { x: 1 } }]);
  assert.deepEqual(result.reasons[0], {
    code: "DUPLICATE",
    message: "first",
  });
  assert.equal(reasonCodes(result).filter((code) =>
    code === "DUPLICATE").length, 1);
  inputs.nutritionSwapEngine.constraints[0].value.x = 2;
  assert.equal(result.constraints[0].value.x, 1);
});

test("a local issue adds PREFLIGHT_REVIEW_REQUIRED exactly once", () => {
  const inputs = makeMutableInputs();
  inputs.nutritionFoodSelection.meals[0].slots[0].candidate_food_codes = [
    "B_FOOD",
  ];
  inputs.nutritionFoodSelection.meals[0].slots[0].rejected_foods.push({
    food_code: "A_FOOD",
    reason_codes: ["ALLERGY_EXCLUDED"],
  });
  const result = evaluateNutritionPlanPreflight(inputs);
  assert.equal(reasonCodes(result).filter((code) =>
    code === "PREFLIGHT_REVIEW_REQUIRED").length, 1);
});

test("top-level versions, policies, statuses, and source links are validated", () => {
  const mutations = [
    (inputs) => {
      inputs.nutritionFoodCatalog.food_catalog_version = "catalog-v0";
    },
    (inputs) => {
      inputs.nutritionFoodCatalog.catalog_policy = "UNKNOWN";
    },
    (inputs) => {
      inputs.nutritionFoodSelection.food_selection_version = "selection-v0";
    },
    (inputs) => {
      inputs.nutritionFoodSelection.selection_policy = "UNKNOWN";
    },
    (inputs) => {
      inputs.nutritionFoodSelection.source_snapshot_version = "snapshot-v0";
    },
    (inputs) => {
      inputs.nutritionFoodSelection.source_assembly_blueprint_version =
        "assembly-v0";
    },
    (inputs) => {
      inputs.nutritionPortionSolver.portion_solver_version = "portion-v0";
    },
    (inputs) => {
      inputs.nutritionPortionSolver.solver_policy = "UNKNOWN";
    },
    (inputs) => {
      inputs.nutritionSwapEngine.swap_engine_version = "swap-v0";
    },
    (inputs) => {
      inputs.nutritionSwapEngine.swap_policy = "UNKNOWN";
    },
    (inputs) => {
      inputs.nutritionFoodSelection.status = "UNKNOWN";
    },
    (inputs) => {
      inputs.nutritionSwapEngine.source_portion_solver_version = "wrong";
    },
  ];
  for (const mutate of mutations) {
    const inputs = makeMutableInputs();
    mutate(inputs);
    assert.throws(() => evaluateNutritionPlanPreflight(inputs), TypeError);
  }
  for (const invalid of [null, undefined, [], "input", 1]) {
    assert.throws(() => evaluateNutritionPlanPreflight(invalid), TypeError);
  }
});

test("meal counts and cross-stage meal and item identity must agree", () => {
  const mutations = [
    (inputs) => {
      inputs.nutritionSwapEngine.meal_count = 2;
    },
    (inputs) => {
      inputs.nutritionPortionSolver.meals[0].role = "OTHER";
    },
    (inputs) => {
      inputs.nutritionSwapEngine.meals[0].selected_pattern_code = "OTHER";
    },
    (inputs) => {
      inputs.nutritionSwapEngine.meals[0].items[0].grams += 10;
    },
    (inputs) => {
      inputs.nutritionPortionSolver.meals[0].target.protein_g += 1;
    },
  ];
  for (const mutate of mutations) {
    const inputs = makeMutableInputs();
    mutate(inputs);
    assert.throws(() => evaluateNutritionPlanPreflight(inputs), TypeError);
  }
});

test("catalog uniqueness, nutrition, portions, and swap membership are validated", () => {
  const duplicate = makeMutableInputs();
  duplicate.nutritionFoodCatalog.items.push(
    structuredClone(duplicate.nutritionFoodCatalog.items[0]),
  );
  duplicate.nutritionFoodCatalog.items_count += 1;
  const negativeNutrition = makeMutableInputs();
  negativeNutrition.nutritionFoodCatalog.items[0]
    .nutrition_per_100g.protein_g = -1;
  const invalidPortion = makeMutableInputs();
  invalidPortion.nutritionFoodCatalog.items[0].portion_rule_g.default_g = 95;
  const invalidMaximumAlignment = makeMutableInputs();
  invalidMaximumAlignment.nutritionFoodCatalog.items[0]
    .portion_rule_g.maximum_g = 105;
  const allZeroNutrition = makeMutableInputs();
  for (const key of NUTRIENT_KEYS) {
    allZeroNutrition.nutritionFoodCatalog.items[0]
      .nutrition_per_100g[key] = 0;
  }
  const excessiveNutrition = makeMutableInputs();
  excessiveNutrition.nutritionFoodCatalog.items[0]
    .nutrition_per_100g.calories_kcal = 1001;
  const invalidGroup = makeMutableInputs();
  invalidGroup.nutritionFoodCatalog.swap_groups[0].active_item_codes.pop();
  for (const inputs of [
    duplicate,
    negativeNutrition,
    invalidPortion,
    invalidMaximumAlignment,
    allZeroNutrition,
    excessiveNutrition,
    invalidGroup,
  ]) {
    assert.throws(() => evaluateNutritionPlanPreflight(inputs), TypeError);
  }
});

test("constraints, reasons, and nutrient containers are structurally validated", () => {
  const mutations = [
    (inputs) => {
      inputs.nutritionFoodSelection.constraints = null;
    },
    (inputs) => {
      inputs.nutritionPortionSolver.reasons = null;
    },
    (inputs) => {
      inputs.nutritionSwapEngine.constraints = null;
    },
    (inputs) => {
      inputs.nutritionSwapEngine.reasons = [{ code: "ONLY_CODE" }];
    },
    (inputs) => {
      inputs.nutritionPortionSolver.daily_totals.protein_g = "10";
    },
    (inputs) => {
      inputs.nutritionPortionSolver.meals[0].tolerance.fiber_g = 0;
    },
  ];
  for (const mutate of mutations) {
    const inputs = makeMutableInputs();
    mutate(inputs);
    assert.throws(() => evaluateNutritionPlanPreflight(inputs), TypeError);
  }
});

test("inputs remain mutable and unchanged while output is independent and deep frozen", () => {
  const inputs = makeMutableInputs();
  const snapshot = structuredClone(inputs);
  const result = evaluateNutritionPlanPreflight(inputs);
  assert.deepEqual(inputs, snapshot);
  assert.equal(Object.isFrozen(inputs), false);
  assert.equal(Object.isFrozen(inputs.nutritionSwapEngine), false);
  assertDeepFrozen(result);
  assert.throws(() => {
    result.checks[0].status = "CHANGED";
  }, TypeError);
});

test("Core Global integration identifies evening and daily fiber review", () => {
  const result = evaluateNutritionPlanPreflight(buildRealInputs());
  assert.equal(result.status, NutritionPlanPreflightStatus.REVIEW_REQUIRED);
  assert.equal(result.ready_for_coach_review, true);
  assert.deepEqual(result.checks.map(({ code, status }) => [code, status]), [
    ["UPSTREAM_STATUS", "REVIEW_REQUIRED"],
    ["MEAL_PATTERN_COMPLETENESS", "PASSED"],
    ["SELECTED_FOOD_INTEGRITY", "PASSED"],
    ["PORTION_LEGALITY", "PASSED"],
    ["PORTION_CALCULATION_INTEGRITY", "PASSED"],
    ["MEAL_TARGET_CLOSURE", "REVIEW_REQUIRED"],
    ["DAILY_TARGET_CLOSURE", "REVIEW_REQUIRED"],
    ["SWAP_SAFETY", "PASSED"],
  ]);
  assert.deepEqual(result.issues.map((issue) => ({
    code: issue.code,
    source_stage: issue.source_stage,
    meal_sequence: issue.meal_sequence,
    fields: issue.fields,
  })), [
    {
      code: "PREFLIGHT_MEAL_TARGET_OUTSIDE_TOLERANCE",
      source_stage: "PORTION_SOLVER",
      meal_sequence: 3,
      fields: ["fiber_g"],
    },
    {
      code: "PREFLIGHT_DAILY_TARGET_OUTSIDE_TOLERANCE",
      source_stage: "PLAN_PREFLIGHT",
      meal_sequence: null,
      fields: ["fiber_g"],
    },
  ]);
});
