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
import {
  buildNutritionPlanningSnapshot,
} from "z-coaching-intake-decision-engine/nutrition-planning-snapshot";
import {
  buildNutritionPortionSolver,
} from "z-coaching-intake-decision-engine/nutrition-portion-solver";
import * as swapEngineApi from
  "z-coaching-intake-decision-engine/nutrition-swap-engine";

const {
  NUTRITION_SWAP_ENGINE_VERSION,
  NutritionSwapEnginePolicy,
  NutritionSwapEngineStatus,
  buildNutritionSwapEngine,
} = swapEngineApi;

const ALL_MARKETS = Object.freeze(["EG", "SA", "KW", "BH", "QA", "AE"]);
const NUTRIENT_FIELDS = Object.freeze([
  "calories_kcal",
  "protein_g",
  "fat_g",
  "carbohydrate_g",
  "fiber_g",
]);
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
  groupCode = "GROUP_ONE",
  foodClass = "ANIMAL_PROTEIN",
  nutrition = {},
  portion = {},
  patterns = ["MAIN_CLASSIC"],
  active = true,
} = {}) {
  return {
    food_code: foodCode,
    name_ar: `Synthetic AR ${foodCode}`,
    name_en: `Synthetic EN ${foodCode}`,
    food_class: foodClass,
    food_state: "READY_TO_EAT",
    is_active: active,
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
    swap: {
      is_swappable: groupCode !== null,
      group_code: groupCode,
    },
    source: {
      type: "COACH_VERIFIED",
      name: "Synthetic test source",
      reference: `SYNTHETIC-${foodCode}`,
      checked_date: "2026-07-18",
    },
  };
}

function defaultItems() {
  return [
    makeItem(),
    makeItem({
      foodCode: "B_FOOD",
      nutrition: {
        calories_kcal: 50,
        protein_g: 5,
        fat_g: 1,
        carbohydrate_g: 5,
        fiber_g: 0.5,
      },
      portion: {
        minimum_g: 100,
        maximum_g: 300,
        step_g: 100,
        default_g: 200,
      },
    }),
  ];
}

function makeCatalog(items = defaultItems()) {
  return buildNutritionFoodCatalog(items);
}

function makeSlot({
  sequence = 1,
  slot = "PROTEIN_ANCHOR",
  requirement = "REQUIRED",
  minItems = requirement === "REQUIRED" ? 1 : 0,
  maxItems = 1,
  selected = requirement === "REQUIRED" ? ["A_FOOD"] : [],
  candidates = ["A_FOOD", "B_FOOD"],
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
  return {
    nutritionFoodSelection,
    nutritionPortionSolver,
    nutritionFoodCatalog,
  };
}

function makeMutableInputs(options) {
  return structuredClone(makeInputs(options));
}

function buildFrom(options) {
  return buildNutritionSwapEngine(makeInputs(options));
}

function findItem(result, foodCode, mealIndex = 0) {
  return result.meals[mealIndex].items.find(
    (item) => item.food_code === foodCode,
  );
}

function reasonCodes(result) {
  return result.reasons.map((reason) => reason.code);
}

function issueCodes(value) {
  return value.issues.map((issue) => issue.code);
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

function assertInvalidMutation(mutate) {
  const inputs = makeMutableInputs();
  mutate(inputs);
  assert.throws(() => buildNutritionSwapEngine(inputs), TypeError);
}

let realPipelineInputsCache;

function buildRealPipelineInputs() {
  if (realPipelineInputsCache !== undefined) {
    return realPipelineInputsCache;
  }
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
  const nutritionPortionSolver = buildNutritionPortionSolver({
    nutritionFoodSelection,
    nutritionFoodCatalog,
  });
  realPipelineInputsCache = {
    nutritionFoodSelection,
    nutritionPortionSolver,
    nutritionFoodCatalog,
  };
  return realPipelineInputsCache;
}

test("public API exposes only the four approved Swap Engine entries", () => {
  assert.deepEqual(Object.keys(swapEngineApi).sort(), [
    "NUTRITION_SWAP_ENGINE_VERSION",
    "NutritionSwapEnginePolicy",
    "NutritionSwapEngineStatus",
    "buildNutritionSwapEngine",
  ]);
});

test("version, policy, and statuses are exact and frozen", () => {
  assert.equal(NUTRITION_SWAP_ENGINE_VERSION, "nutrition-swap-engine-v1");
  assert.deepEqual(Object.values(NutritionSwapEnginePolicy), [
    "Z_COACHING_SWAP_ENGINE_V1",
  ]);
  assert.deepEqual(Object.values(NutritionSwapEngineStatus), [
    "READY",
    "PROVISIONAL_REVIEW_REQUIRED",
    "WITHHELD",
  ]);
  assert.equal(Object.isFrozen(NutritionSwapEnginePolicy), true);
  assert.equal(Object.isFrozen(NutritionSwapEngineStatus), true);
});

test("package self-reference exposes nutrition-swap-engine", async () => {
  const api = await import(
    "z-coaching-intake-decision-engine/nutrition-swap-engine"
  );
  assert.equal(api.buildNutritionSwapEngine, buildNutritionSwapEngine);
});

test("a closed READY meal produces READY swaps", () => {
  const result = buildFrom();
  assert.equal(result.status, NutritionSwapEngineStatus.READY);
  assert.equal(result.meal_count, 1);
  assert.deepEqual(reasonCodes(result).slice(-1), [
    "SWAP_ENGINE_POLICY_APPLIED",
  ]);
});

test("output follows the approved top-level, meal, item, and alternative shape", () => {
  const result = buildFrom();
  assert.deepEqual(Object.keys(result), [
    "swap_engine_version",
    "source_food_selection_version",
    "source_portion_solver_version",
    "source_food_catalog_version",
    "status",
    "swap_policy",
    "meal_count",
    "meals",
    "constraints",
    "reasons",
  ]);
  assert.deepEqual(Object.keys(result.meals[0]), [
    "sequence",
    "role",
    "selected_pattern_code",
    "items",
    "issues",
  ]);
  const item = result.meals[0].items[0];
  assert.deepEqual(Object.keys(item), [
    "food_code",
    "grams",
    "is_swappable",
    "group_code",
    "alternatives",
    "issues",
  ]);
  assert.deepEqual(Object.keys(item.alternatives[0]), [
    "food_code",
    "grams",
    "nutrition",
    "projected_meal_totals",
    "projected_meal_residual",
    "projected_within_tolerance",
    "objective_score",
  ]);
});

test("the default alternative chooses the exact 200 gram replacement", () => {
  const alternative = findItem(buildFrom(), "A_FOOD").alternatives[0];
  assert.equal(alternative.food_code, "B_FOOD");
  assert.equal(alternative.grams, 200);
  assert.deepEqual(alternative.nutrition, {
    calories_kcal: 100,
    protein_g: 10,
    fat_g: 2,
    carbohydrate_g: 10,
    fiber_g: 1,
  });
  assert.deepEqual(alternative.projected_meal_totals,
    alternative.nutrition);
  assert.deepEqual(alternative.projected_meal_residual, ZERO_NUTRITION);
  assert.equal(alternative.objective_score, 0);
});

test("WITHHELD Portion Solver propagates WITHHELD without meals", () => {
  const selection = makeSelection({
    status: "WITHHELD",
    meals: [],
    mealCount: null,
  });
  const result = buildFrom({ selection });
  assert.equal(result.status, NutritionSwapEngineStatus.WITHHELD);
  assert.equal(result.meal_count, null);
  assert.deepEqual(result.meals, []);
  assert.equal(reasonCodes(result).at(-1),
    "SWAP_ENGINE_WITHHELD_BY_PORTION_SOLVER_STATUS");
  assert.equal(reasonCodes(result).includes("SWAP_ENGINE_POLICY_APPLIED"), false);
});

test("provisional Portion Solver is never promoted and closed meals are solved", () => {
  const selection = makeSelection({ status: "PROVISIONAL_REVIEW_REQUIRED" });
  const result = buildFrom({ selection });
  assert.equal(
    result.status,
    NutritionSwapEngineStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.equal(findItem(result, "A_FOOD").alternatives.length, 1);
  assert.deepEqual(reasonCodes(result).slice(-2), [
    "SWAP_ENGINE_POLICY_APPLIED",
    "SWAP_ENGINE_UPSTREAM_REVIEW_RETAINED",
  ]);
});

test("empty provisional input remains empty and provisional", () => {
  const selection = makeSelection({
    status: "PROVISIONAL_REVIEW_REQUIRED",
    meals: [],
    mealCount: null,
  });
  const result = buildFrom({ selection });
  assert.equal(
    result.status,
    NutritionSwapEngineStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.equal(result.meal_count, null);
  assert.deepEqual(result.meals, []);
  assert.equal(reasonCodes(result).at(-1),
    "SWAP_ENGINE_UPSTREAM_REVIEW_RETAINED");
  assert.equal(reasonCodes(result).includes("SWAP_ENGINE_POLICY_APPLIED"), false);
});

test("a non-swappable food is reported without group, alternatives, or issue", () => {
  const item = makeItem({ groupCode: null });
  const selection = makeSelection({
    meals: [makeMeal({ slots: [makeSlot({ candidates: ["A_FOOD"] })] })],
  });
  const output = findItem(buildFrom({ items: [item], selection }), "A_FOOD");
  assert.equal(output.is_swappable, false);
  assert.equal(output.group_code, null);
  assert.deepEqual(output.alternatives, []);
  assert.deepEqual(output.issues, []);
});

test("alternatives are restricted to the original food swap group", () => {
  const items = [
    ...defaultItems(),
    makeItem({ foodCode: "C_FOOD", groupCode: "GROUP_TWO" }),
    makeItem({ foodCode: "D_FOOD", groupCode: "GROUP_TWO" }),
  ];
  const selection = makeSelection({ meals: [makeMeal({ slots: [makeSlot({
    candidates: ["A_FOOD", "C_FOOD", "B_FOOD"],
  })] })] });
  const output = findItem(buildFrom({ items, selection }), "A_FOOD");
  assert.deepEqual(output.alternatives.map((item) => item.food_code), [
    "B_FOOD",
  ]);
});

test("a same-group food outside the approved slot candidates is not used", () => {
  const selection = makeSelection({ meals: [makeMeal({ slots: [makeSlot({
    candidates: ["A_FOOD"],
  })] })] });
  const output = findItem(buildFrom({ selection }), "A_FOOD");
  assert.deepEqual(output.alternatives, []);
  assert.deepEqual(issueCodes(output), ["NO_SAFE_SWAP_AVAILABLE"]);
});

test("approved candidates are not re-filtered by market, budget, or tags", () => {
  const items = defaultItems();
  items[1].available_markets = ["SA"];
  items[1].budget_level = "HIGH";
  items[1].tags.allergen_tags = ["SYNTHETIC_ALLERGEN"];
  const output = findItem(buildFrom({ items }), "A_FOOD");
  assert.deepEqual(output.alternatives.map((item) => item.food_code), [
    "B_FOOD",
  ]);
});

test("an unrelated inactive swappable catalog item needs no active group", () => {
  const items = [
    ...defaultItems(),
    makeItem({
      foodCode: "INACTIVE_UNREFERENCED",
      groupCode: "INACTIVE_ONLY_GROUP",
      active: false,
    }),
  ];
  assert.doesNotThrow(() => buildFrom({ items }));
});

test("a food already used in the meal cannot be offered as an alternative", () => {
  const slot = makeSlot({
    maxItems: 2,
    minItems: 2,
    selected: ["A_FOOD", "B_FOOD"],
    candidates: ["A_FOOD", "B_FOOD"],
  });
  const meal = makeMeal({
    target: {
      planned_calories: 150,
      protein_g: 15,
      fat_g: 3,
      carbohydrate_g: 15,
      fiber_g: 1.5,
    },
    slots: [slot],
  });
  const result = buildFrom({ selection: makeSelection({ meals: [meal] }) });
  assert.deepEqual(findItem(result, "A_FOOD").alternatives, []);
  assert.deepEqual(findItem(result, "B_FOOD").alternatives, []);
});

test("every legal gram value is considered and the best value is selected", () => {
  const items = [
    makeItem(),
    makeItem({
      foodCode: "B_FOOD",
      nutrition: {
        calories_kcal: 40,
        protein_g: 4,
        fat_g: 0.8,
        carbohydrate_g: 4,
        fiber_g: 0.4,
      },
      portion: {
        minimum_g: 100,
        maximum_g: 300,
        step_g: 50,
        default_g: 150,
      },
    }),
  ];
  const alternative = findItem(buildFrom({ items }), "A_FOOD").alternatives[0];
  assert.equal(alternative.grams, 250);
  assert.equal(alternative.objective_score, 0);
});

test("a non-aligned maximum stops at the last legal gram value below it", () => {
  const items = [
    makeItem(),
    makeItem({
      foodCode: "B_FOOD",
      nutrition: {
        calories_kcal: 40,
        protein_g: 4,
        fat_g: 0.8,
        carbohydrate_g: 4,
        fiber_g: 0.4,
      },
      portion: {
        minimum_g: 100,
        maximum_g: 300,
        step_g: 50,
        default_g: 150,
      },
    }),
  ];
  const inputs = makeMutableInputs({ items });
  inputs.nutritionFoodCatalog.items.find((item) =>
    item.food_code === "B_FOOD").portion_rule_g.maximum_g = 275;
  assert.equal(findItem(buildNutritionSwapEngine(inputs), "A_FOOD")
    .alternatives[0].grams, 250);
});

test("equal gram objectives use the smaller legal grams", () => {
  const items = [
    makeItem(),
    makeItem({
      foodCode: "B_FOOD",
      portion: {
        minimum_g: 100,
        maximum_g: 120,
        step_g: 20,
        default_g: 100,
      },
    }),
  ];
  // P1-B6: 100 g and 120 g sit symmetrically around this target (10% off
  // on every nutrient), both inside the relative tolerances, with equal
  // objectives — so the smaller legal grams win. The old 100 g / 200 g
  // pair around 150 is 33% off and now correctly rejected outright.
  const target = {
    planned_calories: 110,
    protein_g: 11,
    fat_g: 2.2,
    carbohydrate_g: 11,
    fiber_g: 1.1,
  };
  const inputs = makeInputs({
    items,
    selection: makeSelection({ meals: [makeMeal({ target })] }),
  });
  const alternative = findItem(
    buildNutritionSwapEngine(inputs),
    "A_FOOD",
  ).alternatives[0];
  assert.equal(alternative.grams, 100);
});

test("an objectively best replacement outside tolerance is rejected", () => {
  const items = [
    makeItem(),
    makeItem({
      foodCode: "B_FOOD",
      nutrition: {
        calories_kcal: 10,
        protein_g: 1,
        fat_g: 0.2,
        carbohydrate_g: 1,
        fiber_g: 0.1,
      },
    }),
  ];
  const output = findItem(buildFrom({ items }), "A_FOOD");
  assert.deepEqual(output.alternatives, []);
  assert.deepEqual(issueCodes(output), ["NO_SAFE_SWAP_AVAILABLE"]);
});

test("projected totals and residual replace only the original item", () => {
  const items = [
    makeItem(),
    defaultItems()[1],
    makeItem({
      foodCode: "BASE_FOOD",
      groupCode: null,
      nutrition: {
        calories_kcal: 50,
        protein_g: 5,
        fat_g: 1,
        carbohydrate_g: 5,
        fiber_g: 0.5,
      },
    }),
  ];
  const slots = [
    makeSlot(),
    makeSlot({
      sequence: 2,
      slot: "SIDE",
      selected: ["BASE_FOOD"],
      candidates: ["BASE_FOOD"],
    }),
  ];
  const target = {
    planned_calories: 150,
    protein_g: 15,
    fat_g: 3,
    carbohydrate_g: 15,
    fiber_g: 1.5,
  };
  const selection = makeSelection({
    meals: [makeMeal({ target, slots })],
  });
  const alternative = findItem(
    buildFrom({ items, selection }),
    "A_FOOD",
  ).alternatives[0];
  assert.deepEqual(alternative.projected_meal_totals, {
    calories_kcal: 150,
    protein_g: 15,
    fat_g: 3,
    carbohydrate_g: 15,
    fiber_g: 1.5,
  });
  assert.deepEqual(alternative.projected_meal_residual, ZERO_NUTRITION);
  assert.deepEqual(alternative.projected_within_tolerance, {
    calories_kcal: true,
    protein_g: true,
    fat_g: true,
    carbohydrate_g: true,
    fiber_g: true,
  });
});

test("objective score uses all five approved nutrient weights", () => {
  const items = [
    makeItem(),
    makeItem({
      foodCode: "B_FOOD",
      // P1-B6: residuals sit inside the relative tolerances for the 100 kcal
      // target (10 / 1.5 / 1 / 1.5 / 1) with all five nutrients nonzero, so
      // all five weights still contribute to the score.
      nutrition: {
        calories_kcal: 105,
        protein_g: 11,
        fat_g: 2.5,
        carbohydrate_g: 11,
        fiber_g: 1.5,
      },
    }),
  ];
  const alternative = findItem(buildFrom({ items }), "A_FOOD")
    .alternatives[0];
  assert.deepEqual(alternative.projected_meal_residual, {
    calories_kcal: 5,
    protein_g: 1,
    fat_g: 0.5,
    carbohydrate_g: 1,
    fiber_g: 0.5,
  });
  assert.equal(alternative.objective_score, 4.17);
});

test("acceptance uses the Portion Solver tolerance object without rebuilding it", () => {
  const items = [
    makeItem(),
    makeItem({
      foodCode: "B_FOOD",
      nutrition: { calories_kcal: 121 },
    }),
  ];
  // P1-B6: the swap is 11 kcal off a 110 kcal target, exactly at the 10%
  // relative tolerance boundary (11) but outside the mutated 10 kcal
  // tolerance. The original meal itself (100 kcal) is also inside the
  // boundary, which the engine requires before offering any alternative.
  const selection = makeSelection({
    meals: [makeMeal({ target: { planned_calories: 110 } })],
  });
  assert.equal(findItem(buildFrom({ items, selection }), "A_FOOD")
    .alternatives.length, 1);
  const inputs = makeMutableInputs({ items, selection });
  inputs.nutritionPortionSolver.meals[0].tolerance.calories_kcal = 10;
  assert.deepEqual(findItem(
    buildNutritionSwapEngine(inputs),
    "A_FOOD",
  ).alternatives, []);
});

test("raw catalog nutrition, not rounded Portion output, controls ordering", () => {
  const commonMacros = {
    protein_g: 5,
    fat_g: 1,
    carbohydrate_g: 5,
    fiber_g: 0.5,
  };
  const items = [
    makeItem({
      nutrition: { calories_kcal: 50.004, ...commonMacros },
    }),
    makeItem({
      foodCode: "B_FOOD",
      nutrition: { calories_kcal: 49.999, ...commonMacros },
    }),
    makeItem({
      foodCode: "D_FOOD",
      nutrition: { calories_kcal: 50.005, ...commonMacros },
    }),
    makeItem({
      foodCode: "BASE_FOOD",
      groupCode: null,
      nutrition: { calories_kcal: 49.996, ...commonMacros },
    }),
  ];
  const slots = [
    makeSlot({ candidates: ["A_FOOD", "B_FOOD", "D_FOOD"] }),
    makeSlot({
      sequence: 2,
      slot: "SIDE",
      selected: ["BASE_FOOD"],
      candidates: ["BASE_FOOD"],
    }),
  ];
  const target = {
    planned_calories: 100,
    protein_g: 10,
    fat_g: 2,
    carbohydrate_g: 10,
    fiber_g: 1,
  };
  const result = buildFrom({
    items,
    selection: makeSelection({ meals: [makeMeal({ target, slots })] }),
  });
  assert.deepEqual(findItem(result, "A_FOOD").alternatives.map(
    (alternative) => alternative.food_code), ["D_FOOD", "B_FOOD"]);
});

test("alternative ordering uses objective before candidate order", () => {
  const items = [
    makeItem(),
    makeItem({
      foodCode: "B_FOOD",
      // P1-B6: 5 kcal off the 100 kcal target, inside the 10% tolerance
      // (the old 80 kcal value is 20 off and now correctly rejected).
      nutrition: { calories_kcal: 95 },
    }),
    makeItem({ foodCode: "C_FOOD" }),
  ];
  const selection = makeSelection({ meals: [makeMeal({ slots: [makeSlot({
    candidates: ["A_FOOD", "B_FOOD", "C_FOOD"],
  })] })] });
  assert.deepEqual(findItem(buildFrom({ items, selection }), "A_FOOD")
    .alternatives.map((item) => item.food_code), ["C_FOOD", "B_FOOD"]);
});

test("equal objectives use approved candidate order before food code", () => {
  const items = [
    makeItem(),
    makeItem({ foodCode: "B_FOOD" }),
    makeItem({ foodCode: "C_FOOD" }),
  ];
  const selection = makeSelection({ meals: [makeMeal({ slots: [makeSlot({
    candidates: ["A_FOOD", "C_FOOD", "B_FOOD"],
  })] })] });
  assert.deepEqual(findItem(buildFrom({ items, selection }), "A_FOOD")
    .alternatives.map((item) => item.food_code), ["C_FOOD", "B_FOOD"]);
});

test("no safe swap is an item issue and does not downgrade READY", () => {
  const selection = makeSelection({ meals: [makeMeal({ slots: [makeSlot({
    candidates: ["A_FOOD"],
  })] })] });
  const result = buildFrom({ selection });
  assert.equal(result.status, NutritionSwapEngineStatus.READY);
  assert.deepEqual(issueCodes(findItem(result, "A_FOOD")), [
    "NO_SAFE_SWAP_AVAILABLE",
  ]);
});

test("an unclosed meal preserves upstream issues and withholds all swaps", () => {
  const inputs = makeMutableInputs();
  inputs.nutritionPortionSolver.status = "PROVISIONAL_REVIEW_REQUIRED";
  inputs.nutritionPortionSolver.meals[0].all_targets_within_tolerance = false;
  inputs.nutritionPortionSolver.meals[0].issues = [{
    code: "PORTION_TARGET_OUTSIDE_TOLERANCE",
    fields: ["protein_g"],
    message: "One or more meal nutrition targets remain outside tolerance.",
  }];
  const result = buildNutritionSwapEngine(inputs);
  assert.equal(
    result.status,
    NutritionSwapEngineStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.deepEqual(issueCodes(result.meals[0]), [
    "PORTION_TARGET_OUTSIDE_TOLERANCE",
    "SWAPS_WITHHELD_FOR_UNCLOSED_MEAL",
  ]);
  assert.deepEqual(findItem(result, "A_FOOD").alternatives, []);
  assert.deepEqual(findItem(result, "A_FOOD").issues, []);
});

test("upstream meal issues are copied without deduplication", () => {
  const inputs = makeMutableInputs();
  inputs.nutritionPortionSolver.status = "PROVISIONAL_REVIEW_REQUIRED";
  inputs.nutritionPortionSolver.meals[0].all_targets_within_tolerance = false;
  inputs.nutritionPortionSolver.meals[0].issues = [
    { code: "UPSTREAM", message: "First." },
    { code: "UPSTREAM", message: "Second." },
  ];
  const result = buildNutritionSwapEngine(inputs);
  assert.deepEqual(result.meals[0].issues.map((entry) => entry.message), [
    "First.",
    "Second.",
    "Swaps are withheld because this meal is not closed within all nutrition tolerances.",
  ]);
});

test("catalog item order does not affect swap output", () => {
  const inputs = makeMutableInputs();
  const first = buildNutritionSwapEngine(inputs);
  inputs.nutritionFoodCatalog.items.reverse();
  const second = buildNutritionSwapEngine(inputs);
  assert.deepEqual(second, first);
});

test("repeat calls are deterministic", () => {
  const inputs = makeInputs();
  assert.deepEqual(
    buildNutritionSwapEngine(inputs),
    buildNutritionSwapEngine(inputs),
  );
});

test("constraints and deduplicated reasons pass by independent value", () => {
  const inputs = makeMutableInputs();
  inputs.nutritionPortionSolver.constraints = [{
    code: "UPSTREAM_CONSTRAINT",
    value: { count: 1 },
  }];
  inputs.nutritionPortionSolver.reasons = [
    { code: "UPSTREAM", message: "First." },
    { code: "UPSTREAM", message: "Second." },
  ];
  const result = buildNutritionSwapEngine(inputs);
  assert.deepEqual(result.constraints,
    inputs.nutritionPortionSolver.constraints);
  assert.deepEqual(reasonCodes(result), [
    "UPSTREAM",
    "SWAP_ENGINE_POLICY_APPLIED",
  ]);
  assert.equal(result.reasons[0].message, "First.");
  assert.notEqual(result.constraints, inputs.nutritionPortionSolver.constraints);
});

test("building neither changes nor freezes caller-owned inputs", () => {
  const inputs = makeMutableInputs();
  const before = structuredClone(inputs);
  buildNutritionSwapEngine(inputs);
  assert.deepEqual(inputs, before);
  assert.equal(Object.isFrozen(inputs.nutritionFoodSelection), false);
  assert.equal(Object.isFrozen(inputs.nutritionPortionSolver), false);
  assert.equal(Object.isFrozen(inputs.nutritionFoodCatalog), false);
});

test("output is independent from later input mutation", () => {
  const inputs = makeMutableInputs();
  const result = buildNutritionSwapEngine(inputs);
  inputs.nutritionPortionSolver.meals[0].items[0].grams = 999;
  inputs.nutritionFoodCatalog.items[1].nutrition_per_100g.protein_g = 999;
  assert.equal(result.meals[0].items[0].grams, 100);
  assert.equal(result.meals[0].items[0].alternatives[0].nutrition.protein_g, 10);
});

test("the complete Swap Engine output is deeply frozen", () => {
  assertDeepFrozen(buildFrom());
});

// Critical contract validation
test("input objects, versions, statuses, and source links are validated", () => {
  assert.throws(() => buildNutritionSwapEngine(null), TypeError);
  const mutations = [
    (inputs) => {
      inputs.nutritionFoodSelection.food_selection_version = "wrong-version";
    },
    (inputs) => { inputs.nutritionFoodSelection.status = "UNKNOWN"; },
    (inputs) => {
      inputs.nutritionPortionSolver.portion_solver_version = "wrong-version";
    },
    (inputs) => { inputs.nutritionPortionSolver.status = "UNKNOWN"; },
    (inputs) => {
      inputs.nutritionFoodCatalog.food_catalog_version = "wrong-version";
    },
    (inputs) => {
      inputs.nutritionFoodCatalog.catalog_policy = "WRONG_POLICY";
    },
    (inputs) => {
      inputs.nutritionFoodSelection.source_food_catalog_version =
        "wrong-version";
    },
    (inputs) => {
      inputs.nutritionPortionSolver.source_food_selection_version =
        "wrong-version";
    },
    (inputs) => {
      inputs.nutritionPortionSolver.source_food_catalog_version =
        "wrong-version";
    },
  ];
  for (const mutate of mutations) {
    assertInvalidMutation(mutate);
  }
});

test("meal counts and withheld status compatibility are validated", () => {
  assertInvalidMutation((inputs) => {
    inputs.nutritionPortionSolver.meal_count = 2;
  });
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodSelection.meal_count = 2;
  });
  assertInvalidMutation((inputs) => {
    inputs.nutritionPortionSolver.status = "WITHHELD";
  });
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodSelection.status = "PROVISIONAL_REVIEW_REQUIRED";
    inputs.nutritionPortionSolver.status = "READY";
  });
});

test("meal sequence, role, pattern, and target must match Food Selection", () => {
  const mutations = [
    (inputs) => { inputs.nutritionPortionSolver.meals[0].sequence = 2; },
    (inputs) => { inputs.nutritionPortionSolver.meals[0].role = "SNACK"; },
    (inputs) => {
      inputs.nutritionPortionSolver.meals[0].selected_pattern_code =
        "OTHER_PATTERN";
    },
    (inputs) => {
      inputs.nutritionPortionSolver.meals[0].target.protein_g += 1;
    },
  ];
  for (const mutate of mutations) {
    assertInvalidMutation(mutate);
  }
});

test("portion items must map to an approved Food Selection slot", () => {
  assertInvalidMutation((inputs) => {
    inputs.nutritionPortionSolver.meals[0].items[0].slot_sequence = 2;
  });
  assertInvalidMutation((inputs) => {
    inputs.nutritionPortionSolver.meals[0].items[0].slot = "WRONG_SLOT";
  });
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodSelection.meals[0].slots[0].candidate_food_codes = [
      "B_FOOD",
    ];
  });
});

test("portion foods cannot repeat within one meal", () => {
  assertInvalidMutation((inputs) => {
    inputs.nutritionPortionSolver.meals[0].items.push(
      structuredClone(inputs.nutritionPortionSolver.meals[0].items[0]),
    );
  });
});

test("portion grams must be inside the legal portion lattice", () => {
  for (const grams of [99, 105, 301, 1.5]) {
    assertInvalidMutation((inputs) => {
      const item = inputs.nutritionPortionSolver.meals[0].items[0];
      const catalogItem = inputs.nutritionFoodCatalog.items.find(
        ({ food_code: foodCode }) => foodCode === item.food_code,
      );
      catalogItem.portion_rule_g.maximum_g = 300;
      item.grams = grams;
    });
  }
});

test("catalog food codes must be globally unique", () => {
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodCatalog.items.push(
      structuredClone(inputs.nutritionFoodCatalog.items[0]),
    );
  });
});

test("all catalog nutrition values must be finite and non-negative", () => {
  const invalidValues = [-1, "1", Number.NaN, Number.POSITIVE_INFINITY];
  for (const field of NUTRIENT_FIELDS) {
    for (const invalidValue of invalidValues) {
      assertInvalidMutation((inputs) => {
        inputs.nutritionFoodCatalog.items[0].nutrition_per_100g[field] =
          invalidValue;
      });
    }
  }
});

test("catalog portion rules require positive integers, bounds, and alignment", () => {
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

test("swap metadata and group existence are validated", () => {
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodCatalog.items[0].swap.is_swappable = false;
  });
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodCatalog.items[0].swap.group_code = "invalid-group";
  });
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodCatalog.swap_groups = [];
  });
});

test("swap group codes and active memberships must be exact", () => {
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodCatalog.swap_groups.push(
      structuredClone(inputs.nutritionFoodCatalog.swap_groups[0]),
    );
  });
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodCatalog.swap_groups[0].active_item_codes.pop();
  });
  assertInvalidMutation((inputs) => {
    inputs.nutritionFoodCatalog.swap_groups[0].food_class = "STARCH";
  });
});

test("targets, tolerances, closure flag, constraints, and reasons are validated", () => {
  assertInvalidMutation((inputs) => {
    inputs.nutritionPortionSolver.meals[0].target.protein_g = -1;
  });
  assertInvalidMutation((inputs) => {
    inputs.nutritionPortionSolver.meals[0].tolerance.protein_g = 0;
  });
  assertInvalidMutation((inputs) => {
    inputs.nutritionPortionSolver.meals[0]
      .all_targets_within_tolerance = "yes";
  });
  assertInvalidMutation((inputs) => {
    inputs.nutritionPortionSolver.constraints = null;
  });
  assertInvalidMutation((inputs) => {
    inputs.nutritionPortionSolver.reasons = [{ code: "BROKEN" }];
  });
});

// Real production integration
test("real pipeline reaches Swap Engine with the Core Global catalog", () => {
  const inputs = buildRealPipelineInputs();
  const result = buildNutritionSwapEngine(inputs);
  // Meal variety (Package 5): the portion solver now rebalances the
  // fixture's capped main meal with a second starch, so its fiber lands
  // inside tolerance and the solver is READY — the swap engine inherits
  // READY with no upstream review retained.
  assert.equal(
    result.status,
    NutritionSwapEngineStatus.READY,
  );
  assert.equal(result.meal_count, 3);
  assert.deepEqual(result.meals.map((meal) => meal.selected_pattern_code), [
    "BREAKFAST_SAVORY",
    "MAIN_CLASSIC",
    "EVENING_CLASSIC",
  ]);
  assert.deepEqual(reasonCodes(result).slice(-2), [
    "PORTION_SOLVER_POLICY_APPLIED",
    "SWAP_ENGINE_POLICY_APPLIED",
  ]);
});

test("real closed meals expose only the approved safe Core swaps", () => {
  const result = buildNutritionSwapEngine(buildRealPipelineInputs());
  // Meal variety (Package 5): the main meal's rice is now 50 g, not 200 g —
  // the solver rebalances the capped meal with potato 250 g as a second
  // starch, so the rice carries only 14 g of its carbs and its pasta swap
  // shrinks with it (50 g, not 150 g). The swap itself — pasta, and only
  // pasta — is unchanged, as are the no-swap assertions below.
  const riceAlternative = findItem(result,
    "RICE_WHITE_LONG_GRAIN_COOKED", 1).alternatives[0];
  assert.deepEqual(findItem(result,
    "RICE_WHITE_LONG_GRAIN_COOKED", 1).alternatives.map((alternative) => [
      alternative.food_code,
      alternative.grams,
      alternative.objective_score,
    ]), [["PASTA_SPAGHETTI_COOKED", 50, 0.76]]);
  // P1-B6: totals and residuals recalibrated for the relative-tolerance
  // objective (the swap itself — pasta at 150 g, and only pasta — is
  // unchanged, as are the no-swap assertions below). The 175 g -> 150 g
  // shift is the protein reconciliation: the main meal now carries 53 g
  // protein / 79 g carbs instead of 43 g / 89 g, so the same pasta swap
  // lands on a smaller portion.
  // P1-B7: totals shifted by 0.01-0.02 from the 2-decimal rounding fix
  // (oats/carrot base values rounded; the swap itself is unchanged).
  // Protein reconciliation: the main-meal target is now 53 g protein /
  // 79 g carbs, so the pasta-swapped meal totals move with it.
  // Q28: the main-meal protein target is now 56 g (its calorie share),
  // so the totals and residuals move again by the same 3 g.
  // Meal variety (Package 5): the totals move again because the meal the
  // swap is projected onto changed — rice 50 g + potato 250 g instead of
  // rice 200 g — so the pasta-swapped meal carries more potato fiber and
  // less rice carbohydrate than before.
  assert.deepEqual(riceAlternative.projected_meal_totals, {
    calories_kcal: 751.58,
    protein_g: 58.49,
    fat_g: 21.93,
    carbohydrate_g: 79.41,
    fiber_g: 9.35,
  });
  // P1-B7: residuals shifted with the totals (same 2-decimal rounding
  // fix; targets unchanged, so each residual moves by its total's delta).
  // Protein reconciliation: residuals are now measured against the
  // 53 g protein / 79 g carbs main-meal target (56 g under Q28).
  assert.deepEqual(riceAlternative.projected_meal_residual, {
    calories_kcal: 22.58,
    protein_g: 2.49,
    fat_g: 0.93,
    carbohydrate_g: 0.41,
    fiber_g: 0.35,
  });
  // The fixed breakfast (egg, oats, salad) exposes no swaps.
  assert.deepEqual(findItem(result, "TOMATO_RED_RAW").alternatives, []);
  assert.deepEqual(findItem(result, "CUCUMBER_WITH_PEEL_RAW").alternatives, []);

  // P1-B7 growth (Q26, proteins first): the main-meal chicken now gains
  // exactly the two new LEAN fish alternatives. Both stay within every
  // relative tolerance (all five nutrients true, residuals under ~11 kcal),
  // so this is the intended variety effect, not a regression: tuna is
  // still refused (239 g would exceed its 200 g portion cap) and salmon
  // and chicken thighs are still refused (their fat would breach the
  // meal's energy/fat tolerance) — the engine's own gating, working.
  // Protein reconciliation: the fish portions grow 130 g -> 170 g because
  // the main-meal protein target grew 43 g -> 53 g. Q28: they grow again
  // 170 g -> 180 g because the target is now 56 g (its calorie share).
  // Meal variety (Package 5): they grow again 180 g -> 190 g because the
  // main meal's chicken is now 160 g (the rebalanced meal carries more
  // protein from the potato-rice split), so the fish that replaces it
  // grows with it.
  assert.deepEqual(findItem(result,
    "CHICKEN_BREAST_ROASTED_SKINLESS", 1).alternatives, [
    {
      food_code: "KING_MACKEREL_COOKED",
      grams: 190,
      nutrition: {
        calories_kcal: 254.6,
        protein_g: 49.4,
        fat_g: 4.86,
        carbohydrate_g: 0,
        fiber_g: 0,
      },
      projected_meal_totals: {
        calories_kcal: 728.68,
        protein_g: 56.73,
        fat_g: 20.76,
        carbohydrate_g: 78.14,
        fiber_g: 8.65,
      },
      projected_meal_residual: {
        calories_kcal: -0.32,
        protein_g: 0.72,
        fat_g: -0.24,
        carbohydrate_g: -0.86,
        fiber_g: -0.35,
      },
      projected_within_tolerance: {
        calories_kcal: true,
        protein_g: true,
        fat_g: true,
        carbohydrate_g: true,
        fiber_g: true,
      },
      objective_score: 0.07,
    },
    {
      food_code: "TILAPIA_COOKED",
      grams: 190,
      nutrition: {
        calories_kcal: 243.2,
        protein_g: 49.69,
        fat_g: 5.04,
        carbohydrate_g: 0,
        fiber_g: 0,
      },
      projected_meal_totals: {
        calories_kcal: 717.28,
        protein_g: 57.01,
        fat_g: 20.93,
        carbohydrate_g: 78.14,
        fiber_g: 8.65,
      },
      projected_meal_residual: {
        calories_kcal: -11.72,
        protein_g: 1.01,
        fat_g: -0.07,
        carbohydrate_g: -0.86,
        fiber_g: -0.35,
      },
      projected_within_tolerance: {
        calories_kcal: true,
        protein_g: true,
        fat_g: true,
        carbohydrate_g: true,
        fiber_g: true,
      },
      objective_score: 0.17,
    },
  ]);
  // P1-B6: the main meal no longer carried cucumber — under the relative-
  // tolerance objective the optimizer fit the old target with carrot and
  // tomato alone. Protein reconciliation changed the main-meal target
  // (53 g protein / 79 g carbs, now 56 g under Q28), so the optimizer fits
  // cucumber back in (125 g) — it offers no safe swap (NO_SAFE_SWAP_AVAILABLE).
  // Meal variety (Package 5): the rebalanced main meal carries cucumber
  // at 50 g (the potato-rice split takes the plate), still with no safe swap.
  assert.equal(findItem(result, "CUCUMBER_WITH_PEEL_RAW", 1).grams, 50);
  assert.deepEqual(
    findItem(result, "CUCUMBER_WITH_PEEL_RAW", 1).alternatives,
    [],
  );
  assert.deepEqual(findItem(result, "OLIVE_OIL", 1).alternatives.map(
    (alternative) => [alternative.food_code, alternative.grams]), [
    ["SUNFLOWER_OIL", 15],
  ]);
  // P1-B6: the evening potato NO LONGER offers its pasta swap. The swap
  // itself is unchanged, but under relative tolerances its projected fiber
  // (6.7 g vs the 9 g target, a 2.30 g shortfall) now sits just outside the
  // 25% fiber tolerance (2.25 g) — a 0.05 g miss — so acceptance correctly
  // refuses it. This is a visible Q25 consequence, flagged to the owner:
  // if the swap should survive, that is a follow-up decision about swap
  // acceptance, not a reason to reintroduce absolute floors here.
  // Meal variety (Package 5): the evening potato offers its pasta swap
  // AGAIN. The supplement closed the evening meal's fiber gap (10.15 g
  // against the 9 g target), so the pasta-swapped projection now carries
  // 8.8 g of fiber — a 0.2 g shortfall, inside the 25% tolerance — and
  // acceptance correctly takes it. The swap is pasta, and only pasta.
  assert.deepEqual(findItem(result,
    "POTATO_BOILED_WITHOUT_SKIN", 2).alternatives.map((alternative) => [
      alternative.food_code,
      alternative.grams,
      alternative.objective_score,
    ]), [["PASTA_SPAGHETTI_COOKED", 175, 3.37]]);
});

// The real evening meal used to be unclosed (egg whites with dry oats,
// fiber outside tolerance) so swaps were withheld for it. The meal-quality
// fix now closes that meal (chicken with potato and salad, all targets
// within tolerance), so swaps are evaluated instead of withheld; the
// withheld-swaps logic itself is still covered synthetically by
// "an unclosed meal preserves upstream issues and withholds all swaps".
test("real evening meal now closes and evaluates swaps instead of withholding them", () => {
  const result = buildNutritionSwapEngine(buildRealPipelineInputs());
  assert.deepEqual(issueCodes(result.meals[2]), []);
  assert.equal(result.meals[2].items.some((item) =>
    item.alternatives.length > 0), true);
  assert.equal(result.meals[2].items.every((item) =>
    !issueCodes(item).includes("SWAPS_WITHHELD_FOR_UNCLOSED_MEAL")), true);
});

test("real alternatives stay in their slot candidates and swap group", () => {
  const inputs = buildRealPipelineInputs();
  const result = buildNutritionSwapEngine(inputs);
  const catalogByCode = new Map(inputs.nutritionFoodCatalog.items.map(
    (item) => [item.food_code, item],
  ));
  result.meals.forEach((meal, mealIndex) => {
    const sourceMeal = inputs.nutritionFoodSelection.meals[mealIndex];
    const usedCodes = new Set(meal.items.map((item) => item.food_code));
    meal.items.forEach((item) => {
      const portionItem = inputs.nutritionPortionSolver.meals[mealIndex]
        .items.find(({ food_code: foodCode }) => foodCode === item.food_code);
      const slot = sourceMeal.slots.find((candidateSlot) =>
        candidateSlot.sequence === portionItem.slot_sequence);
      item.alternatives.forEach((alternative) => {
        assert.ok(slot.candidate_food_codes.includes(alternative.food_code));
        assert.equal(usedCodes.has(alternative.food_code), false);
        assert.equal(
          catalogByCode.get(alternative.food_code).swap.group_code,
          item.group_code,
        );
        assert.equal(Object.values(
          alternative.projected_within_tolerance).every(Boolean), true);
      });
    });
  });
});

test("reversing the real Core catalog leaves Swap Engine output unchanged", () => {
  const inputs = buildRealPipelineInputs();
  const first = buildNutritionSwapEngine(inputs);
  const reversed = structuredClone(inputs);
  reversed.nutritionFoodCatalog.items.reverse();
  const second = buildNutritionSwapEngine(reversed);
  assert.deepEqual(second, first);
});


