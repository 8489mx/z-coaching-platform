// B4-2 (batch 4): a gluten-allergic client must still get a pipeline
// breakfast. Root cause: no gluten-free food lives in the BREAKFAST_STARCHES
// swap group, and the breakfast suitability rule admits only that group into
// a breakfast CARBOHYDRATE_BASE slot — so once both breakfast starches are
// correctly gluten-tagged (P4), the slot is unfillable and the whole
// BREAKFAST pattern is unselected. The fix relaxes suitability ONLY inside
// the existing last-resort breakfast fallback: a COOKED_STARCHES starch may
// fill a REQUIRED breakfast carbohydrate slot when the primary pass found too
// few eligible foods. The same rejection filters still run, so gluten-tagged
// pasta stays rejected. Ordinary breakfasts never reach the fallback.
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildNutritionFoodCatalog,
} from "z-coaching-intake-decision-engine/nutrition-food-catalog";
import * as foodSelectionApi from
  "z-coaching-intake-decision-engine/nutrition-food-selection";

const { buildNutritionFoodSelection } = foodSelectionApi;

const ALL_MARKETS = Object.freeze(["EG", "SA", "KW", "BH", "QA", "AE"]);

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

function makeSnapshot({ restrictions = {} } = {}) {
  return {
    snapshot_version: "nutrition-planning-snapshot-v1",
    client: { residence_country: "EG" },
    meal_preferences: {
      budget: "MEDIUM",
      food_storage_available: true,
      food_reheating_available: true,
    },
    food_restrictions: makeRestrictions(restrictions),
  };
}

function makeSlot(overrides = {}) {
  return {
    sequence: 1,
    slot: "CARBOHYDRATE_BASE",
    requirement: "REQUIRED",
    min_items: 1,
    max_items: 1,
    allowed_food_classes: ["STARCH"],
    ...structuredClone(overrides),
  };
}

function makePattern(overrides = {}) {
  return {
    code: "BREAKFAST_SAVORY",
    meal_role: "BREAKFAST",
    added_fat_policy: "OPTIONAL_ONLY_IF_NEEDED_AFTER_BASE_COMPONENTS",
    slots: [makeSlot()],
    ...structuredClone(overrides),
  };
}

function makeMeal(overrides = {}) {
  return {
    sequence: 1,
    role: "BREAKFAST",
    target: {
      planned_calories: 400,
      protein_g: 40,
      fat_g: 13,
      carbohydrate_g: 30,
      fiber_g: 8,
    },
    allowed_patterns: [makePattern()],
    ...structuredClone(overrides),
  };
}

function makeBlueprint(snapshot) {
  return {
    assembly_blueprint_version: "nutrition-meal-assembly-blueprint-v1",
    source_snapshot_version: snapshot.snapshot_version,
    source_meal_distribution_version: "nutrition-meal-distribution-v1",
    source_distribution_status: "READY",
    status: "READY",
    assembly_policy: "Z_COACHING_MEAL_ASSEMBLY_V1",
    meal_count: 1,
    logistics: {
      budget: snapshot.meal_preferences.budget,
      food_storage_available:
        snapshot.meal_preferences.food_storage_available,
      food_reheating_available:
        snapshot.meal_preferences.food_reheating_available,
    },
    food_restrictions: structuredClone(snapshot.food_restrictions),
    meals: [makeMeal()],
    constraints: [],
    reasons: [],
  };
}

function makeItem({
  foodCode = "A_FOOD",
  priority = 10,
  allergenTags = [],
  intoleranceTags = [],
  swapGroup = null,
} = {}) {
  return {
    food_code: foodCode,
    name_ar: `Synthetic AR ${foodCode}`,
    name_en: `Synthetic EN ${foodCode}`,
    food_class: "STARCH",
    food_state: "READY_TO_EAT",
    is_active: true,
    selection_priority: priority,
    compatible_pattern_codes: ["BREAKFAST_SAVORY"],
    available_markets: [...ALL_MARKETS],
    budget_level: "LOW",
    logistics: { requires_storage: false, requires_reheating: false },
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
      identity_tags: [foodCode],
      allergen_tags: [...allergenTags],
      intolerance_tags: [...intoleranceTags],
    },
    swap: { is_swappable: swapGroup !== null, group_code: swapGroup },
    source: {
      type: "COACH_VERIFIED",
      name: "Synthetic test source",
      reference: `SYNTHETIC-${foodCode}`,
      checked_date: "2026-07-17",
    },
  };
}

// The with-P4 state: both breakfast starches carry the GLUTEN safety tag
// (P4: oats allergen+intolerance GLUTEN; bread allergen WHEAT, intolerance
// GLUTEN). Rice and potato are untagged cooked starches; pasta is tagged.
function glutenBreakfastCatalog() {
  return buildNutritionFoodCatalog([
    makeItem({
      foodCode: "OATS_ROLLED_DRY",
      priority: 30,
      allergenTags: ["GLUTEN"],
      intoleranceTags: ["GLUTEN"],
      swapGroup: "BREAKFAST_STARCHES",
    }),
    makeItem({
      foodCode: "BREAD_WHOLE_WHEAT",
      priority: 40,
      allergenTags: ["WHEAT"],
      intoleranceTags: ["GLUTEN"],
      swapGroup: "BREAKFAST_STARCHES",
    }),
    makeItem({
      foodCode: "RICE_WHITE_LONG_GRAIN_COOKED",
      priority: 10,
      swapGroup: "COOKED_STARCHES",
    }),
    makeItem({
      foodCode: "POTATO_BOILED_WITHOUT_SKIN",
      priority: 20,
      swapGroup: "COOKED_STARCHES",
    }),
    makeItem({
      foodCode: "PASTA_SPAGHETTI_COOKED",
      priority: 50,
      allergenTags: ["WHEAT"],
      intoleranceTags: ["GLUTEN"],
      swapGroup: "COOKED_STARCHES",
    }),
  ]);
}

function buildBreakfastSelection(snapshot, catalog) {
  return buildNutritionFoodSelection({
    nutritionPlanningSnapshot: snapshot,
    nutritionMealAssemblyBlueprint: makeBlueprint(snapshot),
    nutritionFoodCatalog: catalog,
  });
}

function rejectedFood(result, foodCode) {
  return result.meals[0].slots[0].rejected_foods.find(
    (food) => food.food_code === foodCode,
  );
}

test("gluten-allergic client gets a gluten-free cooked starch at breakfast when both breakfast starches are gluten-tagged", () => {
  // Exact C07 adapter encoding for strict_allergies ["GLUTEN"]
  // (intake-adapter.js): allergies WHEAT + GLUTEN. The adapter also emits
  // disliked BREAD/PASTA codes, which only add more rejection reasons, so
  // the test keeps the snapshot minimal for exact reason-code assertions.
  const snapshot = makeSnapshot({
    restrictions: {
      allergies: [
        { substance: "WHEAT", medicallyConfirmed: false },
        { substance: "GLUTEN", medicallyConfirmed: false },
      ],
    },
  });
  const result = buildBreakfastSelection(snapshot, glutenBreakfastCatalog());
  assert.equal(result.meals[0].selected_pattern_code, "BREAKFAST_SAVORY");
  assert.deepEqual(result.meals[0].slots[0].selected_food_codes, [
    "RICE_WHITE_LONG_GRAIN_COOKED",
  ]);
  // No gluten anywhere in the selected foods.
  const selected = new Set(
    result.meals.flatMap((meal) =>
      meal.slots.flatMap((slot) => slot.selected_food_codes)),
  );
  for (const code of [
    "OATS_ROLLED_DRY",
    "BREAD_WHOLE_WHEAT",
    "PASTA_SPAGHETTI_COOKED",
  ]) {
    assert.equal(selected.has(code), false, `${code} must not be selected`);
  }
  // The gluten-tagged breakfast starches were rejected by the allergy filter.
  assert.deepEqual(
    rejectedFood(result, "OATS_ROLLED_DRY").reason_codes,
    ["ALLERGY_EXCLUDED"],
  );
  assert.deepEqual(
    rejectedFood(result, "BREAD_WHOLE_WHEAT").reason_codes,
    ["ALLERGY_EXCLUDED"],
  );
});

test("gluten-intolerant client gets the same cooked-starch fallback", () => {
  const snapshot = makeSnapshot({
    restrictions: {
      intolerances: [
        {
          substance: "GLUTEN",
          severity: "MODERATE",
          medicallyDiagnosed: true,
        },
      ],
    },
  });
  const result = buildBreakfastSelection(snapshot, glutenBreakfastCatalog());
  assert.equal(result.meals[0].selected_pattern_code, "BREAKFAST_SAVORY");
  assert.deepEqual(result.meals[0].slots[0].selected_food_codes, [
    "RICE_WHITE_LONG_GRAIN_COOKED",
  ]);
  assert.deepEqual(
    rejectedFood(result, "OATS_ROLLED_DRY").reason_codes,
    ["INTOLERANCE_EXCLUDED"],
  );
});

test("ordinary client breakfast is unchanged: breakfast starches still win and cooked starches never enter the primary pass", () => {
  const snapshot = makeSnapshot();
  const result = buildBreakfastSelection(snapshot, glutenBreakfastCatalog());
  assert.equal(result.meals[0].selected_pattern_code, "BREAKFAST_SAVORY");
  assert.deepEqual(result.meals[0].slots[0].selected_food_codes, [
    "OATS_ROLLED_DRY",
  ]);
  assert.equal(
    result.meals[0].slots[0].candidate_food_codes.includes(
      "RICE_WHITE_LONG_GRAIN_COOKED",
    ),
    false,
  );
  assert.equal(
    result.meals[0].slots[0].candidate_food_codes.includes(
      "POTATO_BOILED_WITHOUT_SKIN",
    ),
    false,
  );
});
