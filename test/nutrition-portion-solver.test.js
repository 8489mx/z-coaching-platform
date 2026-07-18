import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  evaluateIntake,
} from "z-coaching-intake-decision-engine";
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
import * as portionSolverApi from
  "z-coaching-intake-decision-engine/nutrition-portion-solver";
import {
  buildNutritionPlanningSnapshot,
} from "z-coaching-intake-decision-engine/nutrition-planning-snapshot";

const {
  NUTRITION_PORTION_SOLVER_VERSION,
  NutritionPortionSolverPolicy,
  NutritionPortionSolverStatus,
  buildNutritionPortionSolver,
} = portionSolverApi;

const ALL_MARKETS = Object.freeze(["EG", "SA", "KW", "BH", "QA", "AE"]);
const ZERO_NUTRITION = Object.freeze({
  calories_kcal: 0,
  protein_g: 0,
  fat_g: 0,
  carbohydrate_g: 0,
  fiber_g: 0,
});

function readJson(url) {
  return JSON.parse(readFileSync(url, "utf8"));
}

function makeItem({
  foodCode = "A_FOOD",
  foodClass = "ANIMAL_PROTEIN",
  patterns = ["MAIN_CLASSIC"],
  nutrition = {},
  portion = {},
} = {}) {
  return {
    food_code: foodCode,
    name_ar: `Synthetic AR ${foodCode}`,
    name_en: `Synthetic EN ${foodCode}`,
    food_class: foodClass,
    food_state: "READY_TO_EAT",
    is_active: true,
    selection_priority: 10,
    compatible_pattern_codes: [...patterns],
    available_markets: [...ALL_MARKETS],
    budget_level: "LOW",
    logistics: {
      requires_storage: false,
      requires_reheating: false,
    },
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
    swap: { is_swappable: false, group_code: null },
    source: {
      type: "COACH_VERIFIED",
      name: "Synthetic test source",
      reference: `SYNTHETIC-${foodCode}`,
      checked_date: "2026-07-17",
    },
  };
}

function makeCatalog(items = [makeItem()]) {
  return buildNutritionFoodCatalog(items);
}

function makeSlot({
  sequence = 1,
  slot = "PROTEIN_ANCHOR",
  requirement = "REQUIRED",
  minItems = requirement === "REQUIRED" ? 1 : 0,
  maxItems = 1,
  selected = requirement === "REQUIRED" ? ["A_FOOD"] : [],
  candidates = selected.length > 0 ? [...selected] : [],
  overrides = {},
} = {}) {
  return {
    sequence,
    slot,
    requirement,
    min_items: minItems,
    max_items: maxItems,
    allowed_food_classes: ["ANIMAL_PROTEIN"],
    selected_food_codes: [...selected],
    candidate_food_codes: [...candidates],
    rejected_foods: [],
    deferred_to_portion_solver: requirement === "OPTIONAL",
    ...structuredClone(overrides),
  };
}

function makeMeal({
  sequence = 1,
  role = "MAIN_MEAL",
  selectedPatternCode = "MAIN_CLASSIC",
  target = {},
  slots = [makeSlot()],
  overrides = {},
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
    ...structuredClone(overrides),
  };
}

function makeFoodSelection({
  status = "READY",
  meals = [makeMeal()],
  mealCount = meals.length,
  constraints = [],
  reasons = [],
  overrides = {},
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
    ...structuredClone(overrides),
  };
}

function buildFrom({
  selection = makeFoodSelection(),
  items = [makeItem()],
  catalog,
} = {}) {
  return buildNutritionPortionSolver({
    nutritionFoodSelection: selection,
    nutritionFoodCatalog: catalog ?? makeCatalog(items),
  });
}

function itemByCode(result, foodCode, mealIndex = 0) {
  return result.meals[mealIndex].items.find(
    (item) => item.food_code === foodCode,
  );
}

function reasonCodes(result) {
  return result.reasons.map((reason) => reason.code);
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

function makeMutableInputs() {
  return {
    nutritionFoodSelection: structuredClone(makeFoodSelection()),
    nutritionFoodCatalog: structuredClone(makeCatalog()),
  };
}

function buildRealPipelineInputs() {
  const intake = readJson(
    new URL("../examples/full-intake.json", import.meta.url),
  );
  const evaluationContext = readJson(
    new URL("../examples/evaluation-context.json", import.meta.url),
  );
  const nutritionFoodCatalog = readJson(
    new URL(
      "../data/catalogs/core-global-food-batch-v1.json",
      import.meta.url,
    ),
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

  return { nutritionFoodSelection, nutritionFoodCatalog };
}

function assertInvalidMutation(mutate) {
  const inputs = makeMutableInputs();
  mutate(inputs);
  assert.throws(() => buildNutritionPortionSolver(inputs), TypeError);
}

test("public API exposes only the four approved Portion Solver entries", () => {
  assert.deepEqual(Object.keys(portionSolverApi).sort(), [
    "NUTRITION_PORTION_SOLVER_VERSION",
    "NutritionPortionSolverPolicy",
    "NutritionPortionSolverStatus",
    "buildNutritionPortionSolver",
  ]);
});

test("version, policy, and statuses are exact and frozen", () => {
  assert.equal(
    NUTRITION_PORTION_SOLVER_VERSION,
    "nutrition-portion-solver-v1",
  );
  assert.equal(Object.isFrozen(NutritionPortionSolverPolicy), true);
  assert.equal(Object.isFrozen(NutritionPortionSolverStatus), true);
  assert.deepEqual(Object.values(NutritionPortionSolverPolicy), [
    "Z_COACHING_PORTION_SOLVER_V1",
  ]);
  assert.deepEqual(Object.values(NutritionPortionSolverStatus), [
    "READY",
    "PROVISIONAL_REVIEW_REQUIRED",
    "WITHHELD",
  ]);
});

test("package self-reference exposes nutrition-portion-solver", async () => {
  const imported = await import(
    "z-coaching-intake-decision-engine/nutrition-portion-solver"
  );
  assert.equal(imported.buildNutritionPortionSolver, buildNutritionPortionSolver);
});

test("a simple exactly closed meal produces READY", () => {
  const result = buildFrom();
  assert.equal(result.status, NutritionPortionSolverStatus.READY);
  assert.equal(
    result.solver_policy,
    NutritionPortionSolverPolicy.Z_COACHING_PORTION_SOLVER_V1,
  );
  assert.equal(result.meals[0].all_targets_within_tolerance, true);
});

test("output uses the exact top-level Portion Solver contract", () => {
  assert.deepEqual(Object.keys(buildFrom()), [
    "portion_solver_version",
    "source_food_selection_version",
    "source_food_catalog_version",
    "status",
    "solver_policy",
    "meal_count",
    "meals",
    "daily_target",
    "daily_totals",
    "daily_residual",
    "constraints",
    "reasons",
  ]);
});

test("solved item records preserve slot ownership and selection source", () => {
  const item = buildFrom().meals[0].items[0];
  assert.deepEqual(Object.keys(item), [
    "food_code",
    "slot_sequence",
    "slot",
    "selection_source",
    "grams",
    "nutrition",
  ]);
  assert.equal(item.food_code, "A_FOOD");
  assert.equal(item.slot_sequence, 1);
  assert.equal(item.slot, "PROTEIN_ANCHOR");
  assert.equal(item.selection_source, "FOOD_SELECTION");
  assert.equal(item.grams, 100);
});

test("nutrition, totals, residual, and daily vectors are calculated", () => {
  const result = buildFrom();
  assert.deepEqual(result.meals[0].items[0].nutrition, {
    calories_kcal: 100,
    protein_g: 10,
    fat_g: 2,
    carbohydrate_g: 10,
    fiber_g: 1,
  });
  assert.deepEqual(result.meals[0].totals, result.meals[0].items[0].nutrition);
  assert.deepEqual(result.meals[0].residual, ZERO_NUTRITION);
  assert.deepEqual(result.daily_target, result.daily_totals);
  assert.deepEqual(result.daily_residual, ZERO_NUTRITION);
});

test("tolerance floors are applied to smaller meal targets", () => {
  assert.deepEqual(buildFrom().meals[0].tolerance, {
    calories_kcal: 50,
    protein_g: 5,
    fat_g: 5,
    carbohydrate_g: 10,
    fiber_g: 3,
  });
});

test("percentage tolerances apply when they exceed their floors", () => {
  const meal = makeMeal({
    target: {
      planned_calories: 1000,
      protein_g: 100,
      fat_g: 50,
      carbohydrate_g: 200,
      fiber_g: 40,
    },
  });
  const result = buildFrom({ selection: makeFoodSelection({ meals: [meal] }) });
  assert.deepEqual(result.meals[0].tolerance, {
    calories_kcal: 100,
    protein_g: 15,
    fat_g: 10,
    carbohydrate_g: 30,
    fiber_g: 10,
  });
});

test("objective score uses the weighted squared normalized errors", () => {
  const meal = makeMeal({
    target: {
      planned_calories: 200,
      protein_g: 20,
      fat_g: 10,
      carbohydrate_g: 30,
      fiber_g: 5,
    },
  });
  const result = buildFrom({ selection: makeFoodSelection({ meals: [meal] }) });
  const expected =
    3 * (100 / 50) ** 2 +
    4 * (10 / 5) ** 2 +
    2 * (8 / 5) ** 2 +
    2 * (20 / 10) ** 2 +
    (4 / 3) ** 2;
  assert.equal(result.meals[0].objective_score, Math.round(expected * 100) / 100);
});

test("display nutrition values are rounded to two decimal places", () => {
  const result = buildFrom({
    items: [makeItem({
      nutrition: {
        calories_kcal: 100.005,
        protein_g: 10.005,
        fat_g: 2.005,
        carbohydrate_g: 10.005,
        fiber_g: 1.005,
      },
    })],
  });
  assert.deepEqual(result.meals[0].items[0].nutrition, {
    calories_kcal: 100.01,
    protein_g: 10.01,
    fat_g: 2.01,
    carbohydrate_g: 10.01,
    fiber_g: 1.01,
  });
});

test("display rounding is stable at positive and negative half hundredths", () => {
  const meal = makeMeal({
    target: { planned_calories: 11.08 },
  });
  const result = buildFrom({
    selection: makeFoodSelection({ meals: [meal] }),
    items: [makeItem({ nutrition: { calories_kcal: 10.075 } })],
  });
  assert.equal(result.meals[0].items[0].nutrition.calories_kcal, 10.08);
  assert.equal(result.meals[0].residual.calories_kcal, -1.01);
});

test("mandatory Food Selection items are never removed", () => {
  const meal = makeMeal({
    target: {
      planned_calories: 0,
      protein_g: 0,
      fat_g: 0,
      carbohydrate_g: 0,
      fiber_g: 0,
    },
  });
  const result = buildFrom({ selection: makeFoodSelection({ meals: [meal] }) });
  assert.deepEqual(result.meals[0].items.map((item) => item.food_code), [
    "A_FOOD",
  ]);
  assert.equal(result.meals[0].items[0].selection_source, "FOOD_SELECTION");
});

test("legal grams follow minimum plus integer step increments", () => {
  const item = makeItem({
    nutrition: {
      calories_kcal: 100,
      protein_g: 0,
      fat_g: 0,
      carbohydrate_g: 0,
      fiber_g: 0,
    },
    portion: {
      minimum_g: 50,
      maximum_g: 150,
      step_g: 50,
      default_g: 100,
    },
  });
  const meal = makeMeal({
    target: {
      planned_calories: 150,
      protein_g: 0,
      fat_g: 0,
      carbohydrate_g: 0,
      fiber_g: 0,
    },
  });
  assert.equal(buildFrom({
    selection: makeFoodSelection({ meals: [meal] }),
    items: [item],
  }).meals[0].items[0].grams, 150);
});

test("a non-aligned maximum uses the largest legal grams below it", () => {
  const catalog = structuredClone(makeCatalog([makeItem({
    nutrition: {
      calories_kcal: 100,
      protein_g: 0,
      fat_g: 0,
      carbohydrate_g: 0,
      fiber_g: 0,
    },
    portion: {
      minimum_g: 50,
      maximum_g: 150,
      step_g: 50,
      default_g: 100,
    },
  })]));
  catalog.items[0].portion_rule_g.maximum_g = 145;
  const meal = makeMeal({
    target: {
      planned_calories: 145,
      protein_g: 0,
      fat_g: 0,
      carbohydrate_g: 0,
      fiber_g: 0,
    },
  });
  const grams = buildFrom({
    selection: makeFoodSelection({ meals: [meal] }),
    catalog,
  }).meals[0].items[0].grams;
  assert.equal(grams, 100);
  assert.equal((grams - 50) % 50, 0);
  assert.equal(grams <= 145, true);
});

test("equal objective values prefer less deviation from default portions", () => {
  const item = makeItem({
    nutrition: {
      calories_kcal: 100,
      protein_g: 0,
      fat_g: 0,
      carbohydrate_g: 0,
      fiber_g: 0,
    },
    portion: {
      minimum_g: 50,
      maximum_g: 150,
      step_g: 50,
      default_g: 150,
    },
  });
  const meal = makeMeal({
    target: {
      planned_calories: 75,
      protein_g: 0,
      fat_g: 0,
      carbohydrate_g: 0,
      fiber_g: 0,
    },
  });
  assert.equal(buildFrom({
    selection: makeFoodSelection({ meals: [meal] }),
    items: [item],
  }).meals[0].items[0].grams, 100);
});

test("three starts and grams tie-break select the canonical gram vector", () => {
  const portion = {
    minimum_g: 50,
    maximum_g: 150,
    step_g: 50,
    default_g: 100,
  };
  const nutrition = {
    calories_kcal: 100,
    protein_g: 0,
    fat_g: 0,
    carbohydrate_g: 0,
    fiber_g: 0,
  };
  const items = [
    makeItem({ foodCode: "A_FOOD", nutrition, portion }),
    makeItem({ foodCode: "B_FOOD", nutrition, portion }),
  ];
  const slot = makeSlot({
    minItems: 2,
    maxItems: 2,
    selected: ["A_FOOD", "B_FOOD"],
    candidates: ["A_FOOD", "B_FOOD"],
  });
  const meal = makeMeal({
    slots: [slot],
    target: {
      planned_calories: 250,
      protein_g: 0,
      fat_g: 0,
      carbohydrate_g: 0,
      fiber_g: 0,
    },
  });
  const result = buildFrom({
    selection: makeFoodSelection({ meals: [meal] }),
    items,
  });
  assert.deepEqual(result.meals[0].items.map(({ food_code, grams }) =>
    [food_code, grams]), [["A_FOOD", 100], ["B_FOOD", 150]]);
});

test("an optional candidate is added only when it improves objective", () => {
  const base = makeItem({
    foodCode: "BASE",
    nutrition: {
      calories_kcal: 100,
      protein_g: 10,
      fat_g: 0,
      carbohydrate_g: 0,
      fiber_g: 0,
    },
  });
  const carb = makeItem({
    foodCode: "CARB",
    foodClass: "STARCH",
    nutrition: {
      calories_kcal: 40,
      protein_g: 0,
      fat_g: 0,
      carbohydrate_g: 10,
      fiber_g: 0,
    },
  });
  const slots = [
    makeSlot({ selected: ["BASE"], candidates: ["BASE"] }),
    makeSlot({
      sequence: 2,
      slot: "CARBOHYDRATE_BASE",
      requirement: "OPTIONAL",
      maxItems: 1,
      selected: [],
      candidates: ["CARB"],
    }),
  ];
  const meal = makeMeal({
    slots,
    target: {
      planned_calories: 140,
      protein_g: 10,
      fat_g: 0,
      carbohydrate_g: 10,
      fiber_g: 0,
    },
  });
  const result = buildFrom({
    selection: makeFoodSelection({ meals: [meal] }),
    items: [base, carb],
  });
  assert.equal(itemByCode(result, "CARB").selection_source,
    "PORTION_SOLVER_ADDITION");
});

test("an optional candidate that does not improve objective is not added", () => {
  const slots = [
    makeSlot({ selected: ["A_FOOD"], candidates: ["A_FOOD"] }),
    makeSlot({
      sequence: 2,
      requirement: "OPTIONAL",
      selected: [],
      candidates: ["B_FOOD"],
    }),
  ];
  const result = buildFrom({
    selection: makeFoodSelection({ meals: [makeMeal({ slots })] }),
    items: [makeItem(), makeItem({ foodCode: "B_FOOD" })],
  });
  assert.deepEqual(result.meals[0].items.map((item) => item.food_code), [
    "A_FOOD",
  ]);
});

test("added fat is added when it improves the meal objective", () => {
  const base = makeItem({
    foodCode: "BASE",
    nutrition: {
      calories_kcal: 100,
      protein_g: 10,
      fat_g: 0,
      carbohydrate_g: 0,
      fiber_g: 0,
    },
  });
  const oil = makeItem({
    foodCode: "OIL",
    foodClass: "ADDED_FAT",
    nutrition: {
      calories_kcal: 884,
      protein_g: 0,
      fat_g: 100,
      carbohydrate_g: 0,
      fiber_g: 0,
    },
    portion: {
      minimum_g: 10,
      maximum_g: 10,
      step_g: 1,
      default_g: 10,
    },
  });
  const slots = [
    makeSlot({ selected: ["BASE"], candidates: ["BASE"] }),
    makeSlot({
      sequence: 2,
      slot: "ADDED_FAT",
      requirement: "OPTIONAL",
      selected: [],
      candidates: ["OIL"],
    }),
  ];
  const meal = makeMeal({
    slots,
    target: {
      planned_calories: 188.4,
      protein_g: 10,
      fat_g: 10,
      carbohydrate_g: 0,
      fiber_g: 0,
    },
  });
  const result = buildFrom({
    selection: makeFoodSelection({ meals: [meal] }),
    items: [base, oil],
  });
  assert.equal(itemByCode(result, "OIL").selection_source,
    "PORTION_SOLVER_ADDITION");
});

test("added fat is not added without objective improvement", () => {
  const slots = [
    makeSlot({ selected: ["A_FOOD"], candidates: ["A_FOOD"] }),
    makeSlot({
      sequence: 2,
      slot: "ADDED_FAT",
      requirement: "OPTIONAL",
      selected: [],
      candidates: ["OIL"],
    }),
  ];
  const oil = makeItem({
    foodCode: "OIL",
    foodClass: "ADDED_FAT",
    nutrition: {
      calories_kcal: 884,
      protein_g: 0,
      fat_g: 100,
      carbohydrate_g: 0,
      fiber_g: 0,
    },
    portion: {
      minimum_g: 10,
      maximum_g: 10,
      step_g: 1,
      default_g: 10,
    },
  });
  const result = buildFrom({
    selection: makeFoodSelection({ meals: [makeMeal({ slots })] }),
    items: [makeItem(), oil],
  });
  assert.equal(itemByCode(result, "OIL"), undefined);
});

test("candidate additions never exceed slot max_items", () => {
  const items = ["A_FOOD", "B_FOOD", "C_FOOD"].map((foodCode) =>
    makeItem({ foodCode, nutrition: {
      calories_kcal: 100,
      protein_g: 0,
      fat_g: 0,
      carbohydrate_g: 0,
      fiber_g: 0,
    } }));
  const slot = makeSlot({
    maxItems: 2,
    selected: ["A_FOOD"],
    candidates: ["A_FOOD", "B_FOOD", "C_FOOD"],
  });
  const meal = makeMeal({
    slots: [slot],
    target: {
      planned_calories: 300,
      protein_g: 0,
      fat_g: 0,
      carbohydrate_g: 0,
      fiber_g: 0,
    },
  });
  const result = buildFrom({
    selection: makeFoodSelection({ meals: [meal] }),
    items,
  });
  assert.equal(result.meals[0].items.length, 2);
  assert.equal(itemByCode(result, "C_FOOD"), undefined);
});

test("foods outside approved candidate_food_codes are never used", () => {
  const meal = makeMeal({
    target: {
      planned_calories: 200,
      protein_g: 20,
      fat_g: 4,
      carbohydrate_g: 20,
      fiber_g: 2,
    },
  });
  const result = buildFrom({
    selection: makeFoodSelection({ meals: [meal] }),
    items: [makeItem(), makeItem({ foodCode: "OUTSIDE" })],
  });
  assert.deepEqual(result.meals[0].items.map((item) => item.food_code), [
    "A_FOOD",
  ]);
});

test("one food code cannot be added twice across meal slots", () => {
  const base = makeItem({
    nutrition: {
      calories_kcal: 100,
      protein_g: 0,
      fat_g: 0,
      carbohydrate_g: 0,
      fiber_g: 0,
    },
  });
  const shared = makeItem({
    foodCode: "SHARED",
    nutrition: {
      calories_kcal: 100,
      protein_g: 0,
      fat_g: 0,
      carbohydrate_g: 0,
      fiber_g: 0,
    },
  });
  const slots = [
    makeSlot(),
    makeSlot({
      sequence: 2,
      requirement: "OPTIONAL",
      selected: [],
      candidates: ["SHARED"],
    }),
    makeSlot({
      sequence: 3,
      requirement: "OPTIONAL",
      selected: [],
      candidates: ["SHARED"],
    }),
  ];
  const meal = makeMeal({
    slots,
    target: {
      planned_calories: 200,
      protein_g: 0,
      fat_g: 0,
      carbohydrate_g: 0,
      fiber_g: 0,
    },
  });
  const result = buildFrom({
    selection: makeFoodSelection({ meals: [meal] }),
    items: [base, shared],
  });
  assert.equal(result.meals[0].items.filter((item) =>
    item.food_code === "SHARED").length, 1);
  assert.equal(itemByCode(result, "SHARED").slot_sequence, 2);
});

test("equal candidate improvements prefer lower slot_sequence", () => {
  const base = makeItem({
    nutrition: { ...ZERO_NUTRITION, calories_kcal: 100 },
  });
  const second = makeItem({
    foodCode: "SECOND_SLOT",
    nutrition: { ...ZERO_NUTRITION, calories_kcal: 100 },
  });
  const third = makeItem({
    foodCode: "THIRD_SLOT",
    nutrition: { ...ZERO_NUTRITION, calories_kcal: 100 },
  });
  const slots = [
    makeSlot(),
    makeSlot({
      sequence: 2,
      requirement: "OPTIONAL",
      selected: [],
      candidates: ["SECOND_SLOT"],
    }),
    makeSlot({
      sequence: 3,
      requirement: "OPTIONAL",
      selected: [],
      candidates: ["THIRD_SLOT"],
    }),
  ];
  const meal = makeMeal({
    slots,
    target: {
      planned_calories: 200,
      protein_g: 0,
      fat_g: 0,
      carbohydrate_g: 0,
      fiber_g: 0,
    },
  });
  const result = buildFrom({
    selection: makeFoodSelection({ meals: [meal] }),
    items: [base, second, third],
  });
  assert.notEqual(itemByCode(result, "SECOND_SLOT"), undefined);
  assert.equal(itemByCode(result, "THIRD_SLOT"), undefined);
});

test("equal additions in one slot prefer candidate_food_codes order", () => {
  const base = makeItem({
    nutrition: { ...ZERO_NUTRITION, calories_kcal: 100 },
  });
  const zFirst = makeItem({
    foodCode: "Z_FIRST",
    nutrition: { ...ZERO_NUTRITION, calories_kcal: 100 },
  });
  const aSecond = makeItem({
    foodCode: "A_SECOND",
    nutrition: { ...ZERO_NUTRITION, calories_kcal: 100 },
  });
  const slots = [
    makeSlot(),
    makeSlot({
      sequence: 2,
      requirement: "OPTIONAL",
      selected: [],
      candidates: ["Z_FIRST", "A_SECOND"],
    }),
  ];
  const meal = makeMeal({
    slots,
    target: {
      planned_calories: 200,
      protein_g: 0,
      fat_g: 0,
      carbohydrate_g: 0,
      fiber_g: 0,
    },
  });
  const result = buildFrom({
    selection: makeFoodSelection({ meals: [meal] }),
    items: [base, zFirst, aSecond],
  });
  assert.notEqual(itemByCode(result, "Z_FIRST"), undefined);
  assert.equal(itemByCode(result, "A_SECOND"), undefined);
});

test("optimization decisions use unrounded nutrient values", () => {
  const base = makeItem({
    nutrition: { ...ZERO_NUTRITION, calories_kcal: 1 },
  });
  const bFirst = makeItem({
    foodCode: "B_FIRST",
    nutrition: { ...ZERO_NUTRITION, calories_kcal: 100.003 },
  });
  const aExact = makeItem({
    foodCode: "A_EXACT",
    nutrition: { ...ZERO_NUTRITION, calories_kcal: 100.004 },
  });
  const slots = [
    makeSlot(),
    makeSlot({
      sequence: 2,
      requirement: "OPTIONAL",
      selected: [],
      candidates: ["B_FIRST", "A_EXACT"],
    }),
  ];
  const meal = makeMeal({
    slots,
    target: {
      planned_calories: 101.004,
      protein_g: 0,
      fat_g: 0,
      carbohydrate_g: 0,
      fiber_g: 0,
    },
  });
  const result = buildFrom({
    selection: makeFoodSelection({ meals: [meal] }),
    items: [base, bFirst, aExact],
  });
  assert.notEqual(itemByCode(result, "A_EXACT"), undefined);
  assert.equal(itemByCode(result, "B_FIRST"), undefined);
});

test("repeated solver calls are deterministic", () => {
  const selection = makeFoodSelection();
  const catalog = makeCatalog();
  const inputs = {
    nutritionFoodSelection: selection,
    nutritionFoodCatalog: catalog,
  };
  assert.deepEqual(
    buildNutritionPortionSolver(inputs),
    buildNutritionPortionSolver(inputs),
  );
});

test("catalog item order does not change solver output", () => {
  const items = [makeItem(), makeItem({ foodCode: "B_FOOD" })];
  const slot = makeSlot({
    maxItems: 2,
    selected: ["A_FOOD"],
    candidates: ["A_FOOD", "B_FOOD"],
  });
  const selection = makeFoodSelection({ meals: [makeMeal({ slots: [slot] })] });
  const forward = structuredClone(makeCatalog(items));
  const reverse = structuredClone(forward);
  reverse.items.reverse();
  assert.deepEqual(
    buildFrom({ selection, catalog: forward }),
    buildFrom({ selection, catalog: reverse }),
  );
});

test("WITHHELD Food Selection propagates WITHHELD and empty outputs", () => {
  const selection = makeFoodSelection({
    status: "WITHHELD",
    meals: [],
    mealCount: null,
  });
  const result = buildFrom({ selection });
  assert.equal(result.status, NutritionPortionSolverStatus.WITHHELD);
  assert.equal(result.meal_count, null);
  assert.deepEqual(result.meals, []);
  assert.equal(result.daily_target, null);
  assert.equal(result.daily_totals, null);
  assert.equal(result.daily_residual, null);
  assert.equal(reasonCodes(result).at(-1),
    "PORTION_SOLVER_WITHHELD_BY_FOOD_SELECTION_STATUS");
});

test("provisional Food Selection with meals is solved but never promoted", () => {
  const selection = makeFoodSelection({ status: "PROVISIONAL_REVIEW_REQUIRED" });
  const result = buildFrom({ selection });
  assert.equal(
    result.status,
    NutritionPortionSolverStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.equal(result.meals[0].items.length, 1);
  assert.deepEqual(reasonCodes(result).slice(-2), [
    "PORTION_SOLVER_POLICY_APPLIED",
    "PORTION_SOLVER_UPSTREAM_REVIEW_RETAINED",
  ]);
});

test("empty provisional Food Selection remains empty and is not solved", () => {
  const selection = makeFoodSelection({
    status: "PROVISIONAL_REVIEW_REQUIRED",
    meals: [],
    mealCount: null,
  });
  const result = buildFrom({ selection });
  assert.equal(
    result.status,
    NutritionPortionSolverStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.deepEqual(result.meals, []);
  assert.deepEqual(reasonCodes(result), [
    "PORTION_SOLVER_UPSTREAM_REVIEW_RETAINED",
  ]);
});

test("a meal without selected_pattern_code is retained but not solved", () => {
  const meal = makeMeal({ selectedPatternCode: null, slots: [] });
  const selection = makeFoodSelection({
    status: "PROVISIONAL_REVIEW_REQUIRED",
    meals: [meal],
  });
  const solvedMeal = buildFrom({ selection }).meals[0];
  assert.deepEqual(solvedMeal.items, []);
  assert.equal(solvedMeal.objective_score, null);
  assert.equal(solvedMeal.all_targets_within_tolerance, false);
  assert.deepEqual(solvedMeal.issues, [{
    code: "PORTION_SOLVER_UNAVAILABLE_WITHOUT_SELECTED_PATTERN",
    message: "Portion solving is unavailable without a selected food pattern.",
  }]);
});

test("an unavailable meal reports zero totals and residual against its target", () => {
  const meal = makeMeal({ selectedPatternCode: null, slots: [] });
  const selection = makeFoodSelection({
    status: "PROVISIONAL_REVIEW_REQUIRED",
    meals: [meal],
  });
  const solvedMeal = buildFrom({ selection }).meals[0];
  assert.deepEqual(solvedMeal.totals, ZERO_NUTRITION);
  assert.deepEqual(solvedMeal.residual, {
    calories_kcal: -100,
    protein_g: -10,
    fat_g: -2,
    carbohydrate_g: -10,
    fiber_g: -1,
  });
});

test("outside-tolerance fields produce the structured meal issue", () => {
  const meal = makeMeal({
    target: {
      planned_calories: 1000,
      protein_g: 100,
      fat_g: 100,
      carbohydrate_g: 200,
      fiber_g: 50,
    },
  });
  const result = buildFrom({ selection: makeFoodSelection({ meals: [meal] }) });
  assert.deepEqual(result.meals[0].issues, [{
    code: "PORTION_TARGET_OUTSIDE_TOLERANCE",
    fields: [
      "calories_kcal",
      "protein_g",
      "fat_g",
      "carbohydrate_g",
      "fiber_g",
    ],
    message: "One or more meal nutrition targets remain outside tolerance.",
  }]);
  assert.equal(
    result.status,
    NutritionPortionSolverStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
});

test("outside-tolerance general reason appears only once across meals", () => {
  const meals = [1, 2].map((sequence) => makeMeal({
    sequence,
    target: { planned_calories: 1000 },
  }));
  const result = buildFrom({
    selection: makeFoodSelection({ meals }),
  });
  assert.equal(reasonCodes(result).filter((code) =>
    code === "PORTION_SOLVER_MEAL_TARGET_OUTSIDE_TOLERANCE").length, 1);
});

test("tolerance boundaries are inclusive", () => {
  const meal = makeMeal({
    target: {
      planned_calories: 150,
      protein_g: 15,
      fat_g: 7,
      carbohydrate_g: 20,
      fiber_g: 4,
    },
  });
  const within = buildFrom({
    selection: makeFoodSelection({ meals: [meal] }),
  }).meals[0].within_tolerance;
  assert.deepEqual(within, {
    calories_kcal: true,
    protein_g: true,
    fat_g: true,
    carbohydrate_g: true,
    fiber_g: true,
  });
});

test("daily totals equal the displayed sum of solved meals", () => {
  const meals = [makeMeal({ sequence: 1 }), makeMeal({ sequence: 2 })];
  const result = buildFrom({ selection: makeFoodSelection({ meals }) });
  assert.deepEqual(result.daily_totals, {
    calories_kcal: 200,
    protein_g: 20,
    fat_g: 4,
    carbohydrate_g: 20,
    fiber_g: 2,
  });
  assert.deepEqual(result.daily_target, result.daily_totals);
  assert.deepEqual(result.daily_residual, ZERO_NUTRITION);
});

test("constraints and deduplicated reasons pass by independent value", () => {
  const constraints = [{ code: "UPSTREAM_CONSTRAINT", value: { count: 1 } }];
  const reasons = [
    { code: "UPSTREAM", message: "First." },
    { code: "UPSTREAM", message: "Second." },
  ];
  const selection = makeFoodSelection({ constraints, reasons });
  const result = buildFrom({ selection });
  assert.deepEqual(result.constraints, constraints);
  assert.deepEqual(result.reasons.map((reason) => reason.code), [
    "UPSTREAM",
    "PORTION_SOLVER_POLICY_APPLIED",
  ]);
  assert.equal(result.reasons[0].message, "First.");
  assert.notEqual(result.constraints, selection.constraints);
});

test("building does not mutate or freeze either input", () => {
  const inputs = makeMutableInputs();
  const before = structuredClone(inputs);
  buildNutritionPortionSolver(inputs);
  assert.deepEqual(inputs, before);
  assert.equal(Object.isFrozen(inputs.nutritionFoodSelection), false);
  assert.equal(Object.isFrozen(inputs.nutritionFoodCatalog), false);
});

test("output is independent from later input mutation", () => {
  const inputs = makeMutableInputs();
  const result = buildNutritionPortionSolver(inputs);
  inputs.nutritionFoodSelection.meals[0].target.protein_g = 999;
  inputs.nutritionFoodCatalog.items[0].nutrition_per_100g.protein_g = 999;
  assert.equal(result.meals[0].target.protein_g, 10);
  assert.equal(result.meals[0].items[0].nutrition.protein_g, 10);
});

test("the complete Portion Solver output is deeply frozen", () => {
  assertDeepFrozen(buildFrom());
});

// Critical boundary validation
test("selection version, status, and catalog source version are validated", () => {
  const mutations = [
    (inputs) => {
      inputs.nutritionFoodSelection.food_selection_version = "wrong-version";
    },
    (inputs) => {
      inputs.nutritionFoodSelection.status = "UNKNOWN";
    },
    (inputs) => {
      inputs.nutritionFoodSelection.source_food_catalog_version =
        "wrong-version";
    },
  ];
  for (const mutate of mutations) {
    assertInvalidMutation(mutate);
  }
});

test("catalog version and policy are validated", () => {
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodCatalog.food_catalog_version = "wrong-version";
  });
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodCatalog.catalog_policy = "WRONG_POLICY";
  });
});

test("referenced food codes must exist exactly once in the catalog", () => {
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodCatalog.items = [];
  });
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodSelection.meals[0].slots[0]
      .candidate_food_codes.push("MISSING_CANDIDATE");
  });
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodCatalog.items.push(
      structuredClone(inputs.nutritionFoodCatalog.items[0]),
    );
  });
});

test("unreferenced catalog nutrition is not fully revalidated", () => {
  const inputs = makeMutableInputs();
  const unrelated = structuredClone(inputs.nutritionFoodCatalog.items[0]);
  unrelated.food_code = "UNREFERENCED_FOOD";
  unrelated.portion_rule_g = null;
  unrelated.nutrition_per_100g = null;
  inputs.nutritionFoodCatalog.items.push(unrelated);
  assert.doesNotThrow(() => buildNutritionPortionSolver(inputs));
});

test("selected foods must be a unique subset of slot candidates", () => {
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodSelection.meals[0].slots[0].selected_food_codes = [
      "B_FOOD",
    ];
  });
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodSelection.meals[0].slots[0].candidate_food_codes = [
      "A_FOOD",
      "A_FOOD",
    ];
  });
});

test("selected food counts must satisfy required slot bounds", () => {
  assertInvalidMutation((inputs) => {
    const slot = inputs.nutritionFoodSelection.meals[0].slots[0];
    slot.selected_food_codes = [];
  });
  assertInvalidMutation((inputs) => {
    const item = structuredClone(inputs.nutritionFoodCatalog.items[0]);
    item.food_code = "B_FOOD";
    inputs.nutritionFoodCatalog.items.push(item);
    const slot = inputs.nutritionFoodSelection.meals[0].slots[0];
    slot.candidate_food_codes = ["A_FOOD", "B_FOOD"];
    slot.selected_food_codes = ["A_FOOD", "B_FOOD"];
  });
});

test("optional slots must enter the solver empty", () => {
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodSelection.meals[0].slots[0] = makeSlot({
      requirement: "OPTIONAL",
      minItems: 0,
      selected: ["A_FOOD"],
      candidates: ["A_FOOD"],
    });
  });
});

test("a selected food code cannot occur in two slots of one meal", () => {
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodSelection.meals[0].slots.push(makeSlot({
      sequence: 2,
      slot: "SECOND_PROTEIN",
      selected: ["A_FOOD"],
      candidates: ["A_FOOD"],
    }));
  });
});

test("portion rules require positive integers, ordered bounds, and alignment", () => {
  const mutations = [
    (rule) => { rule.minimum_g = 1.5; },
    (rule) => { rule.minimum_g = 110; },
    (rule) => { rule.maximum_g = 90; },
    (rule) => { rule.step_g = 0; },
    (rule) => {
      rule.maximum_g = 200;
      rule.default_g = 105;
    },
  ];
  for (const mutateRule of mutations) {
    assertInvalidMutation((inputs) => {
      mutateRule(inputs.nutritionFoodCatalog.items[0].portion_rule_g);
    });
  }
});

test("all five nutrition values must be finite non-negative numbers", () => {
  const fields = [
    "calories_kcal",
    "protein_g",
    "fat_g",
    "carbohydrate_g",
    "fiber_g",
  ];
  const invalidValues = [-1, "10", Number.NaN, Number.POSITIVE_INFINITY];
  for (const field of fields) {
    for (const invalidValue of invalidValues) {
      assertInvalidMutation((inputs) => {
        inputs.nutritionFoodCatalog.items[0].nutrition_per_100g[field] =
          invalidValue;
      });
    }
  }
});

test("meal targets and meal_count must retain their critical shape", () => {
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodSelection.meal_count = 2;
  });
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodSelection.meals[0].target.protein_g = -1;
  });
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodSelection.meals[0].selected_pattern_code = null;
  });
});

// Real production integration
test("real Intake through Food Selection completes Portion Solver with Core data", () => {
  const inputs = buildRealPipelineInputs();
  const result = buildNutritionPortionSolver(inputs);

  assert.equal(
    result.source_food_selection_version,
    "nutrition-food-selection-v1",
  );
  assert.equal(
    result.source_food_catalog_version,
    "nutrition-food-catalog-v1",
  );
  assert.equal(
    result.status,
    NutritionPortionSolverStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.equal(result.meal_count, 3);
  assert.deepEqual(result.meals.map((meal) => meal.selected_pattern_code), [
    "BREAKFAST_SAVORY",
    "MAIN_CLASSIC",
    "EVENING_CLASSIC",
  ]);
  assert.deepEqual(result.meals[2].issues, [{
    code: "PORTION_TARGET_OUTSIDE_TOLERANCE",
    fields: ["fiber_g"],
    message: "One or more meal nutrition targets remain outside tolerance.",
  }]);
  assert.equal(reasonCodes(result).filter((code) =>
    code === "PORTION_SOLVER_MEAL_TARGET_OUTSIDE_TOLERANCE").length, 1);
});

test("real integration preserves mandatory foods and uses only legal candidates", () => {
  const inputs = buildRealPipelineInputs();
  const result = buildNutritionPortionSolver(inputs);
  const catalogByCode = new Map(inputs.nutritionFoodCatalog.items.map(
    (item) => [item.food_code, item],
  ));

  result.meals.forEach((meal, mealIndex) => {
    const sourceMeal = inputs.nutritionFoodSelection.meals[mealIndex];
    const outputCodes = meal.items.map((item) => item.food_code);
    assert.equal(new Set(outputCodes).size, outputCodes.length);

    for (const sourceSlot of sourceMeal.slots) {
      for (const mandatoryCode of sourceSlot.selected_food_codes) {
        const item = meal.items.find(({ food_code: code }) =>
          code === mandatoryCode);
        assert.ok(item);
        assert.equal(item.selection_source, "FOOD_SELECTION");
      }
    }

    for (const item of meal.items) {
      const sourceSlot = sourceMeal.slots.find((slot) =>
        slot.sequence === item.slot_sequence);
      assert.ok(sourceSlot.candidate_food_codes.includes(item.food_code));
      const food = catalogByCode.get(item.food_code);
      const rule = food.portion_rule_g;
      assert.ok(item.grams >= rule.minimum_g);
      assert.ok(item.grams <= rule.maximum_g);
      assert.equal((item.grams - rule.minimum_g) % rule.step_g, 0);
      for (const field of Object.keys(ZERO_NUTRITION)) {
        const expected = Math.round(
          food.nutrition_per_100g[field] * item.grams,
        ) / 100;
        assert.equal(item.nutrition[field], expected);
      }
    }
  });
  assert.deepEqual(result.constraints, inputs.nutritionFoodSelection.constraints);
});

test("real daily totals equal the sum of displayed meal totals", () => {
  const result = buildNutritionPortionSolver(buildRealPipelineInputs());
  for (const field of Object.keys(ZERO_NUTRITION)) {
    const expected = Math.round(result.meals.reduce(
      (total, meal) => total + meal.totals[field],
      0,
    ) * 100) / 100;
    assert.equal(result.daily_totals[field], expected);
  }
});

test("reversing the real Core catalog does not change Portion Solver output", () => {
  const inputs = buildRealPipelineInputs();
  const first = buildNutritionPortionSolver(inputs);
  const reversedCatalog = structuredClone(inputs.nutritionFoodCatalog);
  reversedCatalog.items.reverse();
  const second = buildNutritionPortionSolver({
    nutritionFoodSelection: inputs.nutritionFoodSelection,
    nutritionFoodCatalog: reversedCatalog,
  });
  assert.deepEqual(second, first);
});
