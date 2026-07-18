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
import * as foodSelectionApi from
  "z-coaching-intake-decision-engine/nutrition-food-selection";
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

const {
  NUTRITION_FOOD_SELECTION_VERSION,
  NutritionFoodCandidateRejectionCode,
  NutritionFoodSelectionPolicy,
  NutritionFoodSelectionStatus,
  buildNutritionFoodSelection,
} = foodSelectionApi;

const ALL_MARKETS = Object.freeze(["EG", "SA", "KW", "BH", "QA", "AE"]);

function readJson(url) {
  return JSON.parse(readFileSync(url, "utf8"));
}

function makeRestrictions(overrides = {}) {
  return {
    allergies: [],
    medical_exclusions: [],
    intolerances: [],
    digestive_issues: [],
    disliked_foods: [],
    ...structuredClone(overrides),
  };
}

function makeSnapshot({
  market = "EG",
  budget = "MEDIUM",
  storageAvailable = true,
  reheatingAvailable = true,
  restrictions = {},
  overrides = {},
} = {}) {
  return {
    snapshot_version: "nutrition-planning-snapshot-v1",
    client: { residence_country: market },
    meal_preferences: {
      budget,
      food_storage_available: storageAvailable,
      food_reheating_available: reheatingAvailable,
    },
    food_restrictions: makeRestrictions(restrictions),
    ...structuredClone(overrides),
  };
}

function makeSlot({
  sequence = 1,
  slot = "PROTEIN_ANCHOR",
  requirement = "REQUIRED",
  minItems = requirement === "REQUIRED" ? 1 : 0,
  maxItems = 1,
  foodClasses = ["ANIMAL_PROTEIN"],
  overrides = {},
} = {}) {
  return {
    sequence,
    slot,
    requirement,
    min_items: minItems,
    max_items: maxItems,
    allowed_food_classes: [...foodClasses],
    ...structuredClone(overrides),
  };
}

function makePattern({
  code = "MAIN_CLASSIC",
  slots = [makeSlot()],
  overrides = {},
} = {}) {
  return {
    code,
    meal_role: "MAIN_MEAL",
    added_fat_policy: "OPTIONAL_ONLY_IF_NEEDED_AFTER_BASE_COMPONENTS",
    slots: structuredClone(slots),
    ...structuredClone(overrides),
  };
}

function makeMeal({
  sequence = 1,
  role = "MAIN_MEAL",
  patterns = [makePattern()],
  target = {},
  overrides = {},
} = {}) {
  return {
    sequence,
    role,
    target: {
      planned_calories: 500,
      protein_g: 30,
      fat_g: 15,
      carbohydrate_g: 60,
      fiber_g: 8,
      ...structuredClone(target),
    },
    allowed_patterns: structuredClone(patterns),
    ...structuredClone(overrides),
  };
}

function makeBlueprint(snapshot, {
  status = "READY",
  meals = [makeMeal()],
  mealCount = meals.length,
  constraints = [],
  reasons = [],
  overrides = {},
} = {}) {
  return {
    assembly_blueprint_version: "nutrition-meal-assembly-blueprint-v1",
    source_snapshot_version: snapshot.snapshot_version,
    source_meal_distribution_version: "nutrition-meal-distribution-v1",
    source_distribution_status: status,
    status,
    assembly_policy: "Z_COACHING_MEAL_ASSEMBLY_V1",
    meal_count: mealCount,
    logistics: {
      budget: snapshot.meal_preferences.budget,
      food_storage_available:
        snapshot.meal_preferences.food_storage_available,
      food_reheating_available:
        snapshot.meal_preferences.food_reheating_available,
    },
    food_restrictions: structuredClone(snapshot.food_restrictions),
    meals: structuredClone(meals),
    constraints: structuredClone(constraints),
    reasons: structuredClone(reasons),
    ...structuredClone(overrides),
  };
}

function makeItem({
  foodCode = "A_FOOD",
  foodClass = "ANIMAL_PROTEIN",
  isActive = true,
  priority = 10,
  patterns = ["MAIN_CLASSIC"],
  markets = ALL_MARKETS,
  budget = "LOW",
  requiresStorage = false,
  requiresReheating = false,
  identityTags = [foodCode],
  allergenTags = [],
  intoleranceTags = [],
} = {}) {
  return {
    food_code: foodCode,
    name_ar: `Synthetic AR ${foodCode}`,
    name_en: `Synthetic EN ${foodCode}`,
    food_class: foodClass,
    food_state: "READY_TO_EAT",
    is_active: isActive,
    selection_priority: priority,
    compatible_pattern_codes: [...patterns],
    available_markets: [...markets],
    budget_level: budget,
    logistics: {
      requires_storage: requiresStorage,
      requires_reheating: requiresReheating,
    },
    nutrition_per_100g: {
      calories_kcal: 100,
      protein_g: 10,
      fat_g: 2,
      carbohydrate_g: 10,
      fiber_g: 1,
    },
    portion_rule_g: {
      minimum_g: 50,
      maximum_g: 250,
      step_g: 10,
      default_g: 150,
    },
    tags: {
      identity_tags: [...identityTags],
      allergen_tags: [...allergenTags],
      intolerance_tags: [...intoleranceTags],
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

function buildFrom({
  snapshot = makeSnapshot(),
  blueprint,
  items = [makeItem()],
  catalog,
} = {}) {
  return buildNutritionFoodSelection({
    nutritionPlanningSnapshot: snapshot,
    nutritionMealAssemblyBlueprint:
      blueprint ?? makeBlueprint(snapshot),
    nutritionFoodCatalog: catalog ?? makeCatalog(items),
  });
}

function firstSlot(result, mealIndex = 0, slotIndex = 0) {
  return result.meals[mealIndex].slots[slotIndex];
}

function rejectedFood(result, foodCode, mealIndex = 0, slotIndex = 0) {
  return firstSlot(result, mealIndex, slotIndex).rejected_foods.find(
    (food) => food.food_code === foodCode,
  );
}

function allSelectedCodes(result) {
  return result.meals.flatMap((meal) =>
    meal.slots.flatMap((slot) => slot.selected_food_codes));
}

function allRejectedFoods(result) {
  return result.meals.flatMap((meal) =>
    meal.slots.flatMap((slot) => slot.rejected_foods));
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

function makeFilterResult({ snapshotOptions = {}, targetOptions = {} } = {}) {
  const snapshot = makeSnapshot(snapshotOptions);
  return buildFrom({
    snapshot,
    blueprint: makeBlueprint(snapshot),
    items: [
      makeItem({ foodCode: "A_SAFE", priority: 1 }),
      makeItem({ foodCode: "Z_TARGET", priority: 2, ...targetOptions }),
    ],
  });
}

// Public contract (1-4)
test("public API exposes only the five Nutrition Food Selection V1 entries", () => {
  assert.deepEqual(Object.keys(foodSelectionApi).sort(), [
    "NUTRITION_FOOD_SELECTION_VERSION",
    "NutritionFoodCandidateRejectionCode",
    "NutritionFoodSelectionPolicy",
    "NutritionFoodSelectionStatus",
    "buildNutritionFoodSelection",
  ]);
});

test("food selection version is nutrition-food-selection-v1", () => {
  assert.equal(
    NUTRITION_FOOD_SELECTION_VERSION,
    "nutrition-food-selection-v1",
  );
});

test("food selection enums are frozen and contain only the specified values", () => {
  assert.equal(Object.isFrozen(NutritionFoodSelectionPolicy), true);
  assert.equal(Object.isFrozen(NutritionFoodSelectionStatus), true);
  assert.equal(Object.isFrozen(NutritionFoodCandidateRejectionCode), true);
  assert.deepEqual(Object.values(NutritionFoodSelectionPolicy), [
    "Z_COACHING_FOOD_SELECTION_V1",
  ]);
  assert.deepEqual(Object.values(NutritionFoodSelectionStatus), [
    "READY",
    "PROVISIONAL_REVIEW_REQUIRED",
    "WITHHELD",
  ]);
  assert.deepEqual(Object.values(NutritionFoodCandidateRejectionCode), [
    "INACTIVE_FOOD",
    "MARKET_UNAVAILABLE",
    "BUDGET_LEVEL_EXCEEDED",
    "STORAGE_UNAVAILABLE",
    "REHEATING_UNAVAILABLE",
    "ALLERGY_EXCLUDED",
    "MEDICAL_EXCLUDED",
    "INTOLERANCE_EXCLUDED",
    "DISLIKED_FOOD",
  ]);
});

test("package self-reference exposes the nutrition-food-selection subpath", async () => {
  const imported = await import(
    "z-coaching-intake-decision-engine/nutrition-food-selection"
  );
  assert.equal(imported.buildNutritionFoodSelection, buildNutritionFoodSelection);
});

// Valid selection (5-11)
test("a valid completed selection is READY", () => {
  const result = buildFrom();
  assert.equal(result.status, NutritionFoodSelectionStatus.READY);
  assert.equal(
    result.selection_policy,
    NutritionFoodSelectionPolicy.Z_COACHING_FOOD_SELECTION_V1,
  );
});

test("output preserves the three upstream source versions", () => {
  const result = buildFrom();
  assert.equal(result.source_snapshot_version, "nutrition-planning-snapshot-v1");
  assert.equal(
    result.source_assembly_blueprint_version,
    "nutrition-meal-assembly-blueprint-v1",
  );
  assert.equal(result.source_food_catalog_version, "nutrition-food-catalog-v1");
});

test("market_code comes from the planning snapshot", () => {
  const snapshot = makeSnapshot({ market: "QA" });
  assert.equal(buildFrom({ snapshot }).market_code, "QA");
});

test("meal order and contiguous sequences are preserved", () => {
  const snapshot = makeSnapshot();
  const meals = [
    makeMeal({ sequence: 1, role: "BREAKFAST" }),
    makeMeal({ sequence: 2, role: "EVENING_MEAL" }),
  ];
  const result = buildFrom({
    snapshot,
    blueprint: makeBlueprint(snapshot, { meals }),
  });
  assert.deepEqual(result.meals.map(({ sequence, role }) => ({ sequence, role })), [
    { sequence: 1, role: "BREAKFAST" },
    { sequence: 2, role: "EVENING_MEAL" },
  ]);
});

test("meal target is copied exactly without recalculation", () => {
  const snapshot = makeSnapshot();
  const meal = makeMeal({ target: { planned_calories: 777, protein_g: 41 } });
  const blueprint = makeBlueprint(snapshot, { meals: [meal] });
  const result = buildFrom({ snapshot, blueprint });
  assert.deepEqual(result.meals[0].target, meal.target);
  assert.notEqual(result.meals[0].target, blueprint.meals[0].target);
});

test("the first feasible allowed pattern is selected", () => {
  const snapshot = makeSnapshot();
  const patterns = [
    makePattern({ code: "MAIN_CLASSIC" }),
    makePattern({ code: "MAIN_LEGUME" }),
  ];
  const items = [makeItem({ patterns: ["MAIN_CLASSIC", "MAIN_LEGUME"] })];
  const result = buildFrom({
    snapshot,
    blueprint: makeBlueprint(snapshot, { meals: [makeMeal({ patterns })] }),
    items,
  });
  assert.equal(result.meals[0].selected_pattern_code, "MAIN_CLASSIC");
});

test("patterns after the first feasible pattern are not evaluated", () => {
  const snapshot = makeSnapshot();
  const patterns = [
    makePattern({ code: "MAIN_CLASSIC" }),
    makePattern({ code: "MAIN_LEGUME" }),
  ];
  const result = buildFrom({
    snapshot,
    blueprint: makeBlueprint(snapshot, { meals: [makeMeal({ patterns })] }),
    items: [makeItem({ patterns: ["MAIN_CLASSIC", "MAIN_LEGUME"] })],
  });
  assert.deepEqual(
    result.meals[0].pattern_attempts.map((attempt) => attempt.pattern_code),
    ["MAIN_CLASSIC"],
  );
});

// Pattern diagnostics (12-16)
test("an infeasible pattern records each blocking required slot", () => {
  const result = buildFrom({ items: [] });
  assert.deepEqual(result.meals[0].pattern_attempts, [{
    pattern_code: "MAIN_CLASSIC",
    feasible: false,
    blocking_slots: [{
      slot_sequence: 1,
      slot: "PROTEIN_ANCHOR",
      required_items: 1,
      eligible_items: 0,
    }],
  }]);
});

test("a second feasible pattern is selected after the first pattern fails", () => {
  const snapshot = makeSnapshot();
  const patterns = [
    makePattern({ code: "MAIN_CLASSIC" }),
    makePattern({ code: "MAIN_LEGUME" }),
  ];
  const result = buildFrom({
    snapshot,
    blueprint: makeBlueprint(snapshot, { meals: [makeMeal({ patterns })] }),
    items: [makeItem({ patterns: ["MAIN_LEGUME"] })],
  });
  assert.equal(result.meals[0].selected_pattern_code, "MAIN_LEGUME");
  assert.deepEqual(result.meals[0].pattern_attempts.map((attempt) =>
    attempt.feasible), [false, true]);
});

test("a meal with no feasible pattern receives the fixed meal issue", () => {
  const result = buildFrom({ items: [] });
  assert.deepEqual(result.meals[0].issues, [{
    code: "NO_FEASIBLE_PATTERN",
    message: "No feasible food pattern was available for this meal.",
  }]);
  assert.equal(result.meals[0].selected_pattern_code, null);
  assert.deepEqual(result.meals[0].slots, []);
});

test("a meal with no feasible pattern makes the selection provisional", () => {
  const result = buildFrom({ items: [] });
  assert.equal(
    result.status,
    NutritionFoodSelectionStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.equal(
    result.reasons.some((reason) =>
      reason.code === "FOOD_SELECTION_MEAL_HAS_NO_FEASIBLE_PATTERN"),
    true,
  );
});

test("other meals remain available for diagnosis when one meal fails", () => {
  const snapshot = makeSnapshot();
  const meals = [
    makeMeal({ sequence: 1, patterns: [makePattern({ code: "MAIN_CLASSIC" })] }),
    makeMeal({ sequence: 2, patterns: [makePattern({ code: "MAIN_LEGUME" })] }),
  ];
  const result = buildFrom({
    snapshot,
    blueprint: makeBlueprint(snapshot, { meals }),
    items: [makeItem({ patterns: ["MAIN_LEGUME"] })],
  });
  assert.equal(result.meals.length, 2);
  assert.equal(result.meals[0].selected_pattern_code, null);
  assert.equal(result.meals[1].selected_pattern_code, "MAIN_LEGUME");
});

// Filters (17-34)
test("inactive food is rejected", () => {
  const result = makeFilterResult({ targetOptions: { isActive: false } });
  assert.deepEqual(rejectedFood(result, "Z_TARGET").reason_codes, [
    "INACTIVE_FOOD",
  ]);
});

test("food unavailable in the exact client market is rejected", () => {
  const result = makeFilterResult({ targetOptions: { markets: ["SA"] } });
  assert.deepEqual(rejectedFood(result, "Z_TARGET").reason_codes, [
    "MARKET_UNAVAILABLE",
  ]);
});

test("LOW client budget rejects MEDIUM and HIGH foods", () => {
  const snapshot = makeSnapshot({ budget: "LOW" });
  const result = buildFrom({
    snapshot,
    blueprint: makeBlueprint(snapshot),
    items: [
      makeItem({ foodCode: "LOW_FOOD", budget: "LOW", priority: 1 }),
      makeItem({ foodCode: "MEDIUM_FOOD", budget: "MEDIUM", priority: 2 }),
      makeItem({ foodCode: "HIGH_FOOD", budget: "HIGH", priority: 3 }),
    ],
  });
  assert.deepEqual(firstSlot(result).candidate_food_codes, ["LOW_FOOD"]);
  assert.deepEqual(firstSlot(result).rejected_foods.map((food) => food.food_code), [
    "MEDIUM_FOOD",
    "HIGH_FOOD",
  ]);
});

test("MEDIUM client budget allows LOW and MEDIUM but rejects HIGH", () => {
  const result = buildFrom({
    items: [
      makeItem({ foodCode: "LOW_FOOD", budget: "LOW", priority: 1 }),
      makeItem({ foodCode: "MEDIUM_FOOD", budget: "MEDIUM", priority: 2 }),
      makeItem({ foodCode: "HIGH_FOOD", budget: "HIGH", priority: 3 }),
    ],
  });
  assert.deepEqual(firstSlot(result).candidate_food_codes, [
    "LOW_FOOD",
    "MEDIUM_FOOD",
  ]);
  assert.deepEqual(rejectedFood(result, "HIGH_FOOD").reason_codes, [
    "BUDGET_LEVEL_EXCEEDED",
  ]);
});

test("HIGH client budget allows LOW, MEDIUM, and HIGH foods", () => {
  const snapshot = makeSnapshot({ budget: "HIGH" });
  const result = buildFrom({
    snapshot,
    blueprint: makeBlueprint(snapshot),
    items: [
      makeItem({ foodCode: "LOW_FOOD", budget: "LOW", priority: 1 }),
      makeItem({ foodCode: "MEDIUM_FOOD", budget: "MEDIUM", priority: 2 }),
      makeItem({ foodCode: "HIGH_FOOD", budget: "HIGH", priority: 3 }),
    ],
  });
  assert.deepEqual(firstSlot(result).candidate_food_codes, [
    "LOW_FOOD",
    "MEDIUM_FOOD",
    "HIGH_FOOD",
  ]);
  assert.deepEqual(firstSlot(result).rejected_foods, []);
});

test("lack of storage rejects foods that require storage", () => {
  const result = makeFilterResult({
    snapshotOptions: { storageAvailable: false },
    targetOptions: { requiresStorage: true },
  });
  assert.deepEqual(rejectedFood(result, "Z_TARGET").reason_codes, [
    "STORAGE_UNAVAILABLE",
  ]);
});

test("lack of reheating rejects foods that require reheating", () => {
  const result = makeFilterResult({
    snapshotOptions: { reheatingAvailable: false },
    targetOptions: { requiresReheating: true },
  });
  assert.deepEqual(rejectedFood(result, "Z_TARGET").reason_codes, [
    "REHEATING_UNAVAILABLE",
  ]);
});

test("an exact allergen tag match rejects the food", () => {
  const result = makeFilterResult({
    snapshotOptions: {
      restrictions: {
        allergies: [{ substance: "SESAME", medicallyConfirmed: true }],
      },
    },
    targetOptions: { allergenTags: ["SESAME"] },
  });
  assert.deepEqual(rejectedFood(result, "Z_TARGET").reason_codes, [
    "ALLERGY_EXCLUDED",
  ]);
});

test("allergy matching does not use identity tags", () => {
  const result = makeFilterResult({
    snapshotOptions: {
      restrictions: {
        allergies: [{ substance: "SESAME", medicallyConfirmed: true }],
      },
    },
    targetOptions: { identityTags: ["SESAME"], allergenTags: [] },
  });
  assert.equal(rejectedFood(result, "Z_TARGET"), undefined);
  assert.equal(firstSlot(result).candidate_food_codes.includes("Z_TARGET"), true);
});

test("medical exclusion matches an exact food_code", () => {
  const result = makeFilterResult({
    snapshotOptions: {
      restrictions: {
        medical_exclusions: [{
          food: "Z_TARGET",
          instruction: "EXCLUDE",
          source: "PHYSICIAN",
        }],
      },
    },
  });
  assert.deepEqual(rejectedFood(result, "Z_TARGET").reason_codes, [
    "MEDICAL_EXCLUDED",
  ]);
});

test("medical exclusion matches an exact identity tag", () => {
  const result = makeFilterResult({
    snapshotOptions: {
      restrictions: {
        medical_exclusions: [{
          food: "GRAPEFRUIT",
          instruction: "EXCLUDE",
          source: "PHYSICIAN",
        }],
      },
    },
    targetOptions: { identityTags: ["GRAPEFRUIT"] },
  });
  assert.deepEqual(rejectedFood(result, "Z_TARGET").reason_codes, [
    "MEDICAL_EXCLUDED",
  ]);
});

test("an exact intolerance tag match rejects the food", () => {
  const result = makeFilterResult({
    snapshotOptions: {
      restrictions: {
        intolerances: [{
          substance: "LACTOSE",
          severity: "MILD",
          medicallyDiagnosed: false,
          notes: null,
        }],
      },
    },
    targetOptions: { intoleranceTags: ["LACTOSE"] },
  });
  assert.deepEqual(rejectedFood(result, "Z_TARGET").reason_codes, [
    "INTOLERANCE_EXCLUDED",
  ]);
});

test("intolerance severity does not change deterministic exclusion", () => {
  for (const severity of ["MILD", "MODERATE", "SEVERE", "UNKNOWN"]) {
    const result = makeFilterResult({
      snapshotOptions: {
        restrictions: {
          intolerances: [{
            substance: "LACTOSE",
            severity,
            medicallyDiagnosed: false,
            notes: null,
          }],
        },
      },
      targetOptions: { intoleranceTags: ["LACTOSE"] },
    });
    assert.deepEqual(rejectedFood(result, "Z_TARGET").reason_codes, [
      "INTOLERANCE_EXCLUDED",
    ]);
  }
});

test("disliked food matches an exact food_code", () => {
  const result = makeFilterResult({
    snapshotOptions: { restrictions: { disliked_foods: ["Z_TARGET"] } },
  });
  assert.deepEqual(rejectedFood(result, "Z_TARGET").reason_codes, [
    "DISLIKED_FOOD",
  ]);
});

test("disliked food matches an exact identity tag", () => {
  const result = makeFilterResult({
    snapshotOptions: { restrictions: { disliked_foods: ["TUNA"] } },
    targetOptions: { identityTags: ["TUNA"] },
  });
  assert.deepEqual(rejectedFood(result, "Z_TARGET").reason_codes, [
    "DISLIKED_FOOD",
  ]);
});

test("restriction matching is exact and never fuzzy", () => {
  const result = makeFilterResult({
    snapshotOptions: { restrictions: { disliked_foods: ["TUNA"] } },
    targetOptions: { identityTags: ["TUNA_LIGHT"] },
  });
  assert.equal(rejectedFood(result, "Z_TARGET"), undefined);
});

test("one food can retain every applicable rejection reason", () => {
  const snapshotOptions = {
    budget: "LOW",
    storageAvailable: false,
    reheatingAvailable: false,
    restrictions: {
      allergies: [{ substance: "ALLERGEN", medicallyConfirmed: true }],
      medical_exclusions: [{
        food: "MEDICAL",
        instruction: "EXCLUDE",
        source: "PHYSICIAN",
      }],
      intolerances: [{
        substance: "INTOLERANCE",
        severity: "MILD",
        medicallyDiagnosed: false,
        notes: null,
      }],
      disliked_foods: ["DISLIKED"],
    },
  };
  const targetOptions = {
    isActive: false,
    markets: ["SA"],
    budget: "HIGH",
    requiresStorage: true,
    requiresReheating: true,
    identityTags: ["MEDICAL", "DISLIKED"],
    allergenTags: ["ALLERGEN"],
    intoleranceTags: ["INTOLERANCE"],
  };
  const result = makeFilterResult({ snapshotOptions, targetOptions });
  assert.equal(rejectedFood(result, "Z_TARGET").reason_codes.length, 9);
});

test("rejection reasons retain the fixed filter order", () => {
  const result = makeFilterResult({
    snapshotOptions: {
      budget: "LOW",
      storageAvailable: false,
      reheatingAvailable: false,
      restrictions: {
        allergies: [{ substance: "ALLERGEN", medicallyConfirmed: true }],
        medical_exclusions: [{
          food: "MEDICAL",
          instruction: "EXCLUDE",
          source: "PHYSICIAN",
        }],
        intolerances: [{
          substance: "INTOLERANCE",
          severity: "SEVERE",
          medicallyDiagnosed: true,
          notes: null,
        }],
        disliked_foods: ["DISLIKED"],
      },
    },
    targetOptions: {
      isActive: false,
      markets: ["SA"],
      budget: "HIGH",
      requiresStorage: true,
      requiresReheating: true,
      identityTags: ["MEDICAL", "DISLIKED"],
      allergenTags: ["ALLERGEN"],
      intoleranceTags: ["INTOLERANCE"],
    },
  });
  assert.deepEqual(rejectedFood(result, "Z_TARGET").reason_codes,
    Object.values(NutritionFoodCandidateRejectionCode));
});

// Digestive review (35-37)
test("digestive issues do not exclude food candidates", () => {
  const snapshot = makeSnapshot({
    restrictions: {
      digestive_issues: [{ name: "BLOATING", severity: "MODERATE" }],
    },
  });
  const result = buildFrom({ snapshot });
  assert.deepEqual(firstSlot(result).candidate_food_codes, ["A_FOOD"]);
  assert.deepEqual(firstSlot(result).rejected_foods, []);
});

test("digestive issues make a completed selection provisional", () => {
  const snapshot = makeSnapshot({
    restrictions: {
      digestive_issues: [{ name: "BLOATING", severity: "MILD" }],
    },
  });
  assert.equal(
    buildFrom({ snapshot }).status,
    NutritionFoodSelectionStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
});

test("digestive review reason appears exactly once", () => {
  const snapshot = makeSnapshot({
    restrictions: {
      digestive_issues: [
        { name: "BLOATING", severity: "MILD" },
        { name: "REFLUX", severity: "MODERATE" },
      ],
    },
  });
  const result = buildFrom({ snapshot });
  assert.equal(result.reasons.filter((reason) =>
    reason.code === "FOOD_SELECTION_DIGESTIVE_ISSUES_REQUIRE_REVIEW").length, 1);
});

// Deterministic ranking (38-43)
test("a less-used food ranks before a previously selected food", () => {
  const snapshot = makeSnapshot();
  const meals = [makeMeal({ sequence: 1 }), makeMeal({ sequence: 2 })];
  const result = buildFrom({
    snapshot,
    blueprint: makeBlueprint(snapshot, { meals }),
    items: [
      makeItem({ foodCode: "A_FIRST", priority: 1 }),
      makeItem({ foodCode: "B_SECOND", priority: 2 }),
    ],
  });
  assert.deepEqual(result.meals.map((meal) =>
    meal.slots[0].selected_food_codes[0]), ["A_FIRST", "B_SECOND"]);
});

test("lower selection_priority wins when usage counts are equal", () => {
  const result = buildFrom({
    items: [
      makeItem({ foodCode: "Z_LATER", priority: 20 }),
      makeItem({ foodCode: "A_EARLIER", priority: 10 }),
    ],
  });
  assert.equal(firstSlot(result).selected_food_codes[0], "A_EARLIER");
});

test("food_code alphabetically breaks equal usage and priority", () => {
  const result = buildFrom({
    items: [
      makeItem({ foodCode: "Z_FOOD", priority: 10 }),
      makeItem({ foodCode: "A_FOOD", priority: 10 }),
    ],
  });
  assert.deepEqual(firstSlot(result).candidate_food_codes, ["A_FOOD", "Z_FOOD"]);
});

test("usage counts reduce repetition across the full meal sequence", () => {
  const snapshot = makeSnapshot();
  const meals = [1, 2, 3].map((sequence) => makeMeal({ sequence }));
  const result = buildFrom({
    snapshot,
    blueprint: makeBlueprint(snapshot, { meals }),
    items: [
      makeItem({ foodCode: "A_FOOD", priority: 1 }),
      makeItem({ foodCode: "B_FOOD", priority: 2 }),
    ],
  });
  assert.deepEqual(result.meals.map((meal) =>
    meal.slots[0].selected_food_codes[0]), ["A_FOOD", "B_FOOD", "A_FOOD"]);
});

test("repeated builds are deterministic and use no randomness", () => {
  const snapshot = makeSnapshot();
  const blueprint = makeBlueprint(snapshot);
  const catalog = makeCatalog([
    makeItem({ foodCode: "B_FOOD" }),
    makeItem({ foodCode: "A_FOOD" }),
  ]);
  const inputs = {
    nutritionPlanningSnapshot: snapshot,
    nutritionMealAssemblyBlueprint: blueprint,
    nutritionFoodCatalog: catalog,
  };
  assert.deepEqual(
    buildNutritionFoodSelection(inputs),
    buildNutritionFoodSelection(inputs),
  );
});

test("catalog input order does not change candidate or selected ordering", () => {
  const items = [
    makeItem({ foodCode: "A_FOOD", priority: 10 }),
    makeItem({ foodCode: "B_FOOD", priority: 10 }),
  ];
  const forward = buildFrom({ items });
  const reversed = buildFrom({ items: [...items].reverse() });
  assert.deepEqual(firstSlot(forward), firstSlot(reversed));
});

// Required and optional slots (44-50)
test("a required slot selects exactly min_items", () => {
  const snapshot = makeSnapshot();
  const slot = makeSlot({ minItems: 2, maxItems: 3 });
  const blueprint = makeBlueprint(snapshot, {
    meals: [makeMeal({ patterns: [makePattern({ slots: [slot] })] })],
  });
  const result = buildFrom({
    snapshot,
    blueprint,
    items: [
      makeItem({ foodCode: "A_FOOD", priority: 1 }),
      makeItem({ foodCode: "B_FOOD", priority: 2 }),
      makeItem({ foodCode: "C_FOOD", priority: 3 }),
    ],
  });
  assert.deepEqual(firstSlot(result).selected_food_codes, ["A_FOOD", "B_FOOD"]);
});

test("required selected_food_codes are a prefix of candidate_food_codes", () => {
  const snapshot = makeSnapshot();
  const slot = makeSlot({ minItems: 2, maxItems: 3 });
  const result = buildFrom({
    snapshot,
    blueprint: makeBlueprint(snapshot, {
      meals: [makeMeal({ patterns: [makePattern({ slots: [slot] })] })],
    }),
    items: [
      makeItem({ foodCode: "C_FOOD", priority: 3 }),
      makeItem({ foodCode: "A_FOOD", priority: 1 }),
      makeItem({ foodCode: "B_FOOD", priority: 2 }),
    ],
  });
  assert.deepEqual(
    firstSlot(result).selected_food_codes,
    firstSlot(result).candidate_food_codes.slice(0, 2),
  );
});

test("a food code is never selected twice in the same meal", () => {
  const snapshot = makeSnapshot();
  const slots = [
    makeSlot({ sequence: 1, slot: "PROTEIN_ANCHOR" }),
    makeSlot({ sequence: 2, slot: "DAIRY_SUPPORT" }),
  ];
  const result = buildFrom({
    snapshot,
    blueprint: makeBlueprint(snapshot, {
      meals: [makeMeal({ patterns: [makePattern({ slots })] })],
    }),
    items: [
      makeItem({ foodCode: "A_FOOD", priority: 1 }),
      makeItem({ foodCode: "B_FOOD", priority: 2 }),
    ],
  });
  assert.deepEqual(result.meals[0].slots.map((slot) =>
    slot.selected_food_codes[0]), ["A_FOOD", "B_FOOD"]);
  assert.equal(new Set(allSelectedCodes(result)).size, 2);
});

test("an optional slot selects no items", () => {
  const snapshot = makeSnapshot();
  const slot = makeSlot({ requirement: "OPTIONAL" });
  const result = buildFrom({
    snapshot,
    blueprint: makeBlueprint(snapshot, {
      meals: [makeMeal({ patterns: [makePattern({ slots: [slot] })] })],
    }),
  });
  assert.deepEqual(firstSlot(result).selected_food_codes, []);
});

test("an optional slot is deferred to the Portion Solver", () => {
  const snapshot = makeSnapshot();
  const slot = makeSlot({ requirement: "OPTIONAL" });
  const result = buildFrom({
    snapshot,
    blueprint: makeBlueprint(snapshot, {
      meals: [makeMeal({ patterns: [makePattern({ slots: [slot] })] })],
    }),
  });
  assert.equal(firstSlot(result).deferred_to_portion_solver, true);
});

test("an optional ADDED_FAT slot never selects food during V1 selection", () => {
  const snapshot = makeSnapshot();
  const slot = makeSlot({
    slot: "ADDED_FAT",
    requirement: "OPTIONAL",
    foodClasses: ["ADDED_FAT"],
  });
  const result = buildFrom({
    snapshot,
    blueprint: makeBlueprint(snapshot, {
      meals: [makeMeal({ patterns: [makePattern({ slots: [slot] })] })],
    }),
    items: [makeItem({
      foodCode: "OLIVE_OIL",
      foodClass: "ADDED_FAT",
    })],
  });
  assert.deepEqual(firstSlot(result).selected_food_codes, []);
});

test("eligible optional candidates remain available for the Portion Solver", () => {
  const snapshot = makeSnapshot();
  const slot = makeSlot({ requirement: "OPTIONAL" });
  const result = buildFrom({
    snapshot,
    blueprint: makeBlueprint(snapshot, {
      meals: [makeMeal({ patterns: [makePattern({ slots: [slot] })] })],
    }),
    items: [
      makeItem({ foodCode: "B_FOOD", priority: 2 }),
      makeItem({ foodCode: "A_FOOD", priority: 1 }),
    ],
  });
  assert.deepEqual(firstSlot(result).candidate_food_codes, ["A_FOOD", "B_FOOD"]);
});

// Status propagation (51-54)
test("WITHHELD assembly propagates WITHHELD with no meals", () => {
  const snapshot = makeSnapshot();
  const blueprint = makeBlueprint(snapshot, {
    status: "WITHHELD",
    meals: [],
    mealCount: null,
  });
  const result = buildFrom({ snapshot, blueprint });
  assert.equal(result.status, NutritionFoodSelectionStatus.WITHHELD);
  assert.equal(result.meal_count, null);
  assert.deepEqual(result.meals, []);
  assert.equal(result.reasons.at(-1).code,
    "FOOD_SELECTION_WITHHELD_BY_ASSEMBLY_STATUS");
});

test("provisional assembly with meals is never promoted to READY", () => {
  const snapshot = makeSnapshot();
  const blueprint = makeBlueprint(snapshot, {
    status: "PROVISIONAL_REVIEW_REQUIRED",
  });
  const result = buildFrom({ snapshot, blueprint });
  assert.equal(
    result.status,
    NutritionFoodSelectionStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.equal(result.meals.length, 1);
  assert.equal(result.reasons.some((reason) =>
    reason.code === "FOOD_SELECTION_UPSTREAM_REVIEW_RETAINED"), true);
});

test("empty provisional assembly stays empty and provisional", () => {
  const snapshot = makeSnapshot();
  const blueprint = makeBlueprint(snapshot, {
    status: "PROVISIONAL_REVIEW_REQUIRED",
    meals: [],
    mealCount: null,
  });
  const result = buildFrom({ snapshot, blueprint });
  assert.equal(
    result.status,
    NutritionFoodSelectionStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.equal(result.meal_count, null);
  assert.deepEqual(result.meals, []);
  assert.deepEqual(result.reasons.slice(-2).map((reason) => reason.code), [
    "FOOD_SELECTION_UPSTREAM_REVIEW_RETAINED",
    "FOOD_SELECTION_UNAVAILABLE_WITHOUT_ASSEMBLY_MEALS",
  ]);
});

test("READY appears only with ready assembly, meals, feasibility, and no review", () => {
  const result = buildFrom();
  assert.equal(result.status, NutritionFoodSelectionStatus.READY);
  assert.equal(result.meals.every((meal) =>
    meal.selected_pattern_code !== null), true);
  assert.equal(result.reasons.at(-1).code, "FOOD_SELECTION_POLICY_APPLIED");
});

function makeMutableValidInputs() {
  const nutritionPlanningSnapshot = makeSnapshot();
  return {
    nutritionPlanningSnapshot,
    nutritionMealAssemblyBlueprint: structuredClone(
      makeBlueprint(nutritionPlanningSnapshot),
    ),
    nutritionFoodCatalog: structuredClone(makeCatalog()),
  };
}

// Input validation (55-66)
test("incorrect snapshot version throws TypeError", () => {
  const inputs = makeMutableValidInputs();
  inputs.nutritionPlanningSnapshot.snapshot_version = "wrong-version";
  assert.throws(() => buildNutritionFoodSelection(inputs), TypeError);
});

test("incorrect assembly blueprint version throws TypeError", () => {
  const inputs = makeMutableValidInputs();
  inputs.nutritionMealAssemblyBlueprint.assembly_blueprint_version =
    "wrong-version";
  assert.throws(() => buildNutritionFoodSelection(inputs), TypeError);
});

test("mismatched source snapshot version throws TypeError", () => {
  const inputs = makeMutableValidInputs();
  inputs.nutritionMealAssemblyBlueprint.source_snapshot_version =
    "wrong-version";
  assert.throws(() => buildNutritionFoodSelection(inputs), TypeError);
});

test("blueprint logistics mismatch throws TypeError", () => {
  const inputs = makeMutableValidInputs();
  inputs.nutritionMealAssemblyBlueprint.logistics.food_storage_available = false;
  assert.throws(() => buildNutritionFoodSelection(inputs), TypeError);
});

test("blueprint food restrictions mismatch throws TypeError", () => {
  const inputs = makeMutableValidInputs();
  inputs.nutritionMealAssemblyBlueprint.food_restrictions.disliked_foods.push(
    "TUNA",
  );
  assert.throws(() => buildNutritionFoodSelection(inputs), TypeError);
});

test("incorrect food catalog version throws TypeError", () => {
  const inputs = makeMutableValidInputs();
  inputs.nutritionFoodCatalog.food_catalog_version = "wrong-version";
  assert.throws(() => buildNutritionFoodSelection(inputs), TypeError);
});

test("incorrect food catalog policy throws TypeError", () => {
  const inputs = makeMutableValidInputs();
  inputs.nutritionFoodCatalog.catalog_policy = "WRONG_POLICY";
  assert.throws(() => buildNutritionFoodSelection(inputs), TypeError);
});

test("inconsistent food catalog counts throw TypeError", () => {
  const first = makeMutableValidInputs();
  first.nutritionFoodCatalog.items_count += 1;
  assert.throws(() => buildNutritionFoodSelection(first), TypeError);

  const second = makeMutableValidInputs();
  second.nutritionFoodCatalog.active_items_count = 0;
  assert.throws(() => buildNutritionFoodSelection(second), TypeError);
});

test("unknown snapshot residence market throws TypeError", () => {
  const inputs = makeMutableValidInputs();
  inputs.nutritionPlanningSnapshot.client.residence_country = "US";
  assert.throws(() => buildNutritionFoodSelection(inputs), TypeError);
});

test("unknown snapshot budget throws TypeError", () => {
  const inputs = makeMutableValidInputs();
  inputs.nutritionPlanningSnapshot.meal_preferences.budget = "UNLIMITED";
  assert.throws(() => buildNutritionFoodSelection(inputs), TypeError);
});

test("malformed restriction entries throw TypeError", () => {
  const mutations = [
    (restrictions) => restrictions.allergies.push({}),
    (restrictions) => restrictions.intolerances.push({ substance: 12 }),
    (restrictions) => restrictions.digestive_issues.push("BLOATING"),
    (restrictions) => restrictions.disliked_foods.push(" "),
  ];
  for (const mutate of mutations) {
    const inputs = makeMutableValidInputs();
    mutate(inputs.nutritionPlanningSnapshot.food_restrictions);
    assert.throws(() => buildNutritionFoodSelection(inputs), TypeError);
  }
});

test("medical instruction other than EXCLUDE throws TypeError", () => {
  const inputs = makeMutableValidInputs();
  inputs.nutritionPlanningSnapshot.food_restrictions.medical_exclusions.push({
    food: "GRAPEFRUIT",
    instruction: "LIMIT",
    source: "PHYSICIAN",
  });
  inputs.nutritionMealAssemblyBlueprint.food_restrictions = structuredClone(
    inputs.nutritionPlanningSnapshot.food_restrictions,
  );
  assert.throws(() => buildNutritionFoodSelection(inputs), TypeError);
});

test("malformed patterns and slots throw TypeError", () => {
  const mutations = [
    (pattern) => { pattern.code = "UNKNOWN_PATTERN"; },
    (pattern) => { pattern.slots = []; },
    (pattern) => { pattern.slots[0].sequence = 2; },
    (pattern) => { pattern.slots[0].requirement = "MAYBE"; },
    (pattern) => { pattern.slots[0].min_items = 2; },
    (pattern) => { pattern.slots[0].allowed_food_classes = []; },
  ];
  for (const mutate of mutations) {
    const inputs = makeMutableValidInputs();
    mutate(
      inputs.nutritionMealAssemblyBlueprint.meals[0].allowed_patterns[0],
    );
    assert.throws(() => buildNutritionFoodSelection(inputs), TypeError);
  }
});

// Immutability (67-71)
test("building neither mutates nor freezes any caller-owned input", () => {
  const inputs = makeMutableValidInputs();
  const before = structuredClone(inputs);
  buildNutritionFoodSelection(inputs);
  assert.deepEqual(inputs, before);
  assert.equal(Object.isFrozen(inputs.nutritionPlanningSnapshot), false);
  assert.equal(Object.isFrozen(inputs.nutritionMealAssemblyBlueprint), false);
  assert.equal(Object.isFrozen(inputs.nutritionFoodCatalog), false);
});

test("output remains independent when inputs are mutated after building", () => {
  const inputs = makeMutableValidInputs();
  inputs.nutritionMealAssemblyBlueprint.constraints.push({ code: "KEEP_ME" });
  const result = buildNutritionFoodSelection(inputs);
  inputs.nutritionMealAssemblyBlueprint.meals[0].target.protein_g = 999;
  inputs.nutritionMealAssemblyBlueprint.constraints[0].code = "CHANGED";
  inputs.nutritionFoodCatalog.items[0].tags.identity_tags[0] = "CHANGED";
  assert.equal(result.meals[0].target.protein_g, 30);
  assert.equal(result.constraints[0].code, "KEEP_ME");
});

test("the full output graph is deeply frozen", () => {
  assertDeepFrozen(buildFrom());
});

test("constraints and reasons pass by independent value", () => {
  const snapshot = makeSnapshot();
  const constraints = [{ code: "UPSTREAM_CONSTRAINT", value: { level: 1 } }];
  const reasons = [{ code: "UPSTREAM_REASON", message: "Upstream message." }];
  const blueprint = makeBlueprint(snapshot, { constraints, reasons });
  const result = buildFrom({ snapshot, blueprint });
  assert.deepEqual(result.constraints, constraints);
  assert.deepEqual(result.reasons[0], reasons[0]);
  assert.notEqual(result.constraints, blueprint.constraints);
  assert.notEqual(result.reasons[0], blueprint.reasons[0]);
});

test("duplicate upstream reason codes are removed with first occurrence retained", () => {
  const snapshot = makeSnapshot();
  const reasons = [
    { code: "DUPLICATE", message: "First." },
    { code: "KEEP", message: "Keep." },
    { code: "DUPLICATE", message: "Second." },
  ];
  const result = buildFrom({
    snapshot,
    blueprint: makeBlueprint(snapshot, { reasons }),
  });
  assert.deepEqual(result.reasons.map((reason) => reason.code), [
    "DUPLICATE",
    "KEEP",
    "FOOD_SELECTION_POLICY_APPLIED",
  ]);
  assert.equal(result.reasons[0].message, "First.");
});

function buildRealPipelineSelection() {
  const intake = readJson(new URL("../examples/full-intake.json", import.meta.url));
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
  return buildNutritionFoodSelection({
    nutritionPlanningSnapshot,
    nutritionMealAssemblyBlueprint,
    nutritionFoodCatalog,
  });
}

// Real integration (72-75)
test("integration consumes the production Core Global Food Catalog JSON", () => {
  const result = buildRealPipelineSelection();
  assert.equal(result.source_food_catalog_version, "nutrition-food-catalog-v1");
  assert.equal(result.market_code, "EG");
});

test("real Intake through Blueprint pipeline completes Food Selection", () => {
  const result = buildRealPipelineSelection();
  assert.equal(result.status, NutritionFoodSelectionStatus.READY);
  assert.deepEqual(result.meals.map((meal) => meal.selected_pattern_code), [
    "BREAKFAST_SAVORY",
    "MAIN_CLASSIC",
    "EVENING_CLASSIC",
  ]);
});

test("real client exclusions reject TUNA dislike and LACTOSE dairy", () => {
  const rejected = allRejectedFoods(buildRealPipelineSelection());
  const reasonsByCode = new Map(rejected.map((food) => [
    food.food_code,
    food.reason_codes,
  ]));
  assert.deepEqual(
    reasonsByCode.get("TUNA_LIGHT_CANNED_WATER_DRAINED"),
    ["DISLIKED_FOOD"],
  );
  for (const dairyCode of [
    "YOGURT_PLAIN_LOW_FAT",
    "GREEK_YOGURT_PLAIN_NONFAT",
    "COTTAGE_CHEESE_LOW_FAT_2_PERCENT",
  ]) {
    assert.deepEqual(reasonsByCode.get(dairyCode), ["INTOLERANCE_EXCLUDED"]);
  }
});

test("real integration never places a rejected food in selected_food_codes", () => {
  const result = buildRealPipelineSelection();
  const selectedCodes = new Set(allSelectedCodes(result));
  for (const rejected of allRejectedFoods(result)) {
    assert.equal(selectedCodes.has(rejected.food_code), false);
  }
});

// Additional contract and algorithm guards
test("foods outside a slot class are absent from candidates and rejections", () => {
  const result = buildFrom({
    items: [
      makeItem({ foodCode: "A_ANIMAL" }),
      makeItem({ foodCode: "Z_STARCH", foodClass: "STARCH" }),
    ],
  });
  assert.equal(firstSlot(result).candidate_food_codes.includes("Z_STARCH"), false);
  assert.equal(rejectedFood(result, "Z_STARCH"), undefined);
});

test("foods outside the current pattern are absent from candidates and rejections", () => {
  const result = buildFrom({
    items: [
      makeItem({ foodCode: "A_MATCH" }),
      makeItem({ foodCode: "Z_OTHER", patterns: ["MAIN_LEGUME"] }),
    ],
  });
  assert.equal(firstSlot(result).candidate_food_codes.includes("Z_OTHER"), false);
  assert.equal(rejectedFood(result, "Z_OTHER"), undefined);
});

test("rejected foods sort by selection_priority then food_code", () => {
  const snapshot = makeSnapshot({
    restrictions: {
      disliked_foods: ["A_REJECT", "B_REJECT", "Z_REJECT"],
    },
  });
  const result = buildFrom({
    snapshot,
    blueprint: makeBlueprint(snapshot),
    items: [
      makeItem({ foodCode: "SAFE", priority: 1 }),
      makeItem({ foodCode: "Z_REJECT", priority: 20 }),
      makeItem({ foodCode: "B_REJECT", priority: 10 }),
      makeItem({ foodCode: "A_REJECT", priority: 10 }),
    ],
  });
  assert.deepEqual(firstSlot(result).rejected_foods.map((food) => food.food_code), [
    "A_REJECT",
    "B_REJECT",
    "Z_REJECT",
  ]);
});

test("a failed pattern attempt does not update global usage counts", () => {
  const snapshot = makeSnapshot();
  const failedPattern = makePattern({
    code: "MAIN_CLASSIC",
    slots: [
      makeSlot({ sequence: 1 }),
      makeSlot({
        sequence: 2,
        slot: "CARBOHYDRATE_BASE",
        foodClasses: ["STARCH"],
      }),
    ],
  });
  const feasiblePattern = makePattern({ code: "MAIN_LEGUME" });
  const result = buildFrom({
    snapshot,
    blueprint: makeBlueprint(snapshot, {
      meals: [makeMeal({ patterns: [failedPattern, feasiblePattern] })],
    }),
    items: [
      makeItem({
        foodCode: "A_FOOD",
        priority: 1,
        patterns: ["MAIN_CLASSIC", "MAIN_LEGUME"],
      }),
      makeItem({
        foodCode: "B_FOOD",
        priority: 2,
        patterns: ["MAIN_CLASSIC", "MAIN_LEGUME"],
      }),
    ],
  });
  assert.equal(result.meals[0].selected_pattern_code, "MAIN_LEGUME");
  assert.deepEqual(firstSlot(result).selected_food_codes, ["A_FOOD"]);
});

test("optional candidates do not update usage counts", () => {
  const snapshot = makeSnapshot();
  const meals = [
    makeMeal({
      sequence: 1,
      patterns: [makePattern({
        slots: [makeSlot({ requirement: "OPTIONAL" })],
      })],
    }),
    makeMeal({ sequence: 2 }),
  ];
  const result = buildFrom({
    snapshot,
    blueprint: makeBlueprint(snapshot, { meals }),
    items: [
      makeItem({ foodCode: "A_FOOD", priority: 1 }),
      makeItem({ foodCode: "B_FOOD", priority: 2 }),
    ],
  });
  assert.deepEqual(result.meals[0].slots[0].selected_food_codes, []);
  assert.deepEqual(result.meals[1].slots[0].selected_food_codes, ["A_FOOD"]);
});

test("output uses the exact V1 top-level contract and contains no portion math", () => {
  const result = buildFrom();
  assert.deepEqual(Object.keys(result), [
    "food_selection_version",
    "source_snapshot_version",
    "source_assembly_blueprint_version",
    "source_food_catalog_version",
    "status",
    "selection_policy",
    "market_code",
    "meal_count",
    "meals",
    "constraints",
    "reasons",
  ]);
  assert.equal(JSON.stringify(result).includes("portion_g"), false);
  assert.equal(JSON.stringify(result).includes("selected_calories"), false);
});

test("catalog selection fields must retain their required runtime types", () => {
  const mutations = [
    (item) => { item.is_active = "true"; },
    (item) => { item.selection_priority = 1.5; },
    (item) => { item.compatible_pattern_codes = "MAIN_CLASSIC"; },
    (item) => { item.available_markets = ["US"]; },
    (item) => { item.budget_level = "UNLIMITED"; },
    (item) => { item.logistics.requires_storage = "false"; },
    (item) => { item.tags.identity_tags = null; },
  ];
  for (const mutate of mutations) {
    const inputs = makeMutableValidInputs();
    mutate(inputs.nutritionFoodCatalog.items[0]);
    assert.throws(() => buildNutritionFoodSelection(inputs), TypeError);
  }
});

test("duplicate food_code values in the catalog throw TypeError", () => {
  const inputs = makeMutableValidInputs();
  inputs.nutritionFoodCatalog.items.push(
    structuredClone(inputs.nutritionFoodCatalog.items[0]),
  );
  inputs.nutritionFoodCatalog.items_count += 1;
  inputs.nutritionFoodCatalog.active_items_count += 1;
  assert.throws(() => buildNutritionFoodSelection(inputs), TypeError);
});
