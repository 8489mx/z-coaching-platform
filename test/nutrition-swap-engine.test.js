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
        maximum_g: 200,
        step_g: 100,
        default_g: 100,
      },
    }),
  ];
  const target = {
    planned_calories: 150,
    protein_g: 15,
    fat_g: 3,
    carbohydrate_g: 15,
    fiber_g: 1.5,
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
      nutrition: {
        calories_kcal: 150,
        protein_g: 15,
        fat_g: 7,
        carbohydrate_g: 20,
        fiber_g: 4,
      },
    }),
  ];
  const alternative = findItem(buildFrom({ items }), "A_FOOD")
    .alternatives[0];
  assert.deepEqual(alternative.projected_meal_residual, {
    calories_kcal: 50,
    protein_g: 5,
    fat_g: 5,
    carbohydrate_g: 10,
    fiber_g: 3,
  });
  assert.equal(alternative.objective_score, 12);
});

test("acceptance uses the Portion Solver tolerance object without rebuilding it", () => {
  const items = [
    makeItem(),
    makeItem({
      foodCode: "B_FOOD",
      nutrition: { calories_kcal: 120 },
    }),
  ];
  assert.equal(findItem(buildFrom({ items }), "A_FOOD")
    .alternatives.length, 1);
  const inputs = makeMutableInputs({ items });
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
      nutrition: { calories_kcal: 80 },
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
  assert.equal(
    result.status,
    NutritionSwapEngineStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.equal(result.meal_count, 3);
  assert.deepEqual(result.meals.map((meal) => meal.selected_pattern_code), [
    "BREAKFAST_SAVORY",
    "MAIN_CLASSIC",
    "EVENING_CLASSIC",
  ]);
  assert.deepEqual(reasonCodes(result).slice(-2), [
    "SWAP_ENGINE_POLICY_APPLIED",
    "SWAP_ENGINE_UPSTREAM_REVIEW_RETAINED",
  ]);
});

test("real closed meals expose only the approved safe Core swaps", () => {
  const result = buildNutritionSwapEngine(buildRealPipelineInputs());
  const riceAlternative = findItem(result,
    "RICE_WHITE_LONG_GRAIN_COOKED").alternatives[0];
  assert.deepEqual(findItem(result,
    "RICE_WHITE_LONG_GRAIN_COOKED").alternatives.map((alternative) => [
      alternative.food_code,
      alternative.grams,
      alternative.objective_score,
    ]), [["PASTA_SPAGHETTI_COOKED", 200, 4.46]]);
  assert.deepEqual(riceAlternative.projected_meal_totals, {
    calories_kcal: 698.77,
    protein_g: 43.79,
    fat_g: 19.59,
    carbohydrate_g: 85.57,
    fiber_g: 9.74,
  });
  assert.deepEqual(riceAlternative.projected_meal_residual, {
    calories_kcal: -8.23,
    protein_g: 4.79,
    fat_g: 0.59,
    carbohydrate_g: -9.43,
    fiber_g: 2.74,
  });
  assert.deepEqual(findItem(result, "CARROT_RAW").alternatives.map(
    (alternative) => [alternative.food_code, alternative.grams]), [
    ["CUCUMBER_WITH_PEEL_RAW", 400],
  ]);
  assert.deepEqual(findItem(result, "TOMATO_RED_RAW").alternatives.map(
    (alternative) => [alternative.food_code, alternative.grams]), [
    ["CUCUMBER_WITH_PEEL_RAW", 150],
  ]);

  assert.deepEqual(findItem(result,
    "CHICKEN_BREAST_ROASTED_SKINLESS", 1).alternatives, []);
  assert.deepEqual(findItem(result,
    "POTATO_BOILED_WITHOUT_SKIN", 1).alternatives, []);
  assert.deepEqual(findItem(result,
    "CUCUMBER_WITH_PEEL_RAW", 1).alternatives.map((alternative) => [
      alternative.food_code,
      alternative.grams,
    ]), [
    ["TOMATO_RED_RAW", 175],
    ["CARROT_RAW", 75],
  ]);
  assert.deepEqual(findItem(result, "OLIVE_OIL", 1).alternatives.map(
    (alternative) => [alternative.food_code, alternative.grams]), [
    ["SUNFLOWER_OIL", 20],
  ]);
});

test("real unclosed evening meal retains its Portion issue and has no swaps", () => {
  const result = buildNutritionSwapEngine(buildRealPipelineInputs());
  assert.deepEqual(issueCodes(result.meals[2]), [
    "PORTION_TARGET_OUTSIDE_TOLERANCE",
    "SWAPS_WITHHELD_FOR_UNCLOSED_MEAL",
  ]);
  assert.equal(result.meals[2].items.every((item) =>
    item.alternatives.length === 0), true);
  assert.equal(result.meals[2].items.every((item) =>
    item.issues.length === 0), true);
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
