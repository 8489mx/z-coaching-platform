import {
  NUTRITION_FOOD_CATALOG_VERSION,
  NutritionFoodCatalogPolicy,
} from "../nutrition-food-catalog/index.js";
import {
  NUTRITION_FOOD_SELECTION_VERSION,
  NutritionFoodSelectionStatus,
} from "../nutrition-food-selection/index.js";
import {
  NUTRITION_PORTION_SOLVER_VERSION,
  NutritionPortionSolverStatus,
} from "../nutrition-portion-solver/index.js";
import { NUTRITION_SWAP_ENGINE_VERSION } from "./domain/contracts.js";
import {
  NutritionSwapEnginePolicy,
  NutritionSwapEngineStatus,
} from "./domain/enums.js";

const NUTRIENTS = Object.freeze([
  Object.freeze({
    key: "calories_kcal",
    targetKey: "planned_calories",
    weight: 3,
  }),
  Object.freeze({ key: "protein_g", targetKey: "protein_g", weight: 4 }),
  Object.freeze({ key: "fat_g", targetKey: "fat_g", weight: 2 }),
  Object.freeze({
    key: "carbohydrate_g",
    targetKey: "carbohydrate_g",
    weight: 2,
  }),
  Object.freeze({ key: "fiber_g", targetKey: "fiber_g", weight: 1 }),
]);

const PORTION_RULE_FIELDS = Object.freeze([
  "minimum_g",
  "maximum_g",
  "step_g",
  "default_g",
]);

const SCORE_EPSILON = 1e-12;
const CANONICAL_ID = /^[A-Z][A-Z0-9_]*$/;

const REASON_MESSAGES = Object.freeze({
  SWAP_ENGINE_WITHHELD_BY_PORTION_SOLVER_STATUS:
    "Swap generation was withheld because the Portion Solver is withheld.",
  SWAP_ENGINE_POLICY_APPLIED:
    "Safe food swaps were evaluated deterministically using Z Coaching Swap Engine V1.",
  SWAP_ENGINE_UPSTREAM_REVIEW_RETAINED:
    "The upstream Portion Solver review requirement was retained.",
});

const ISSUE_MESSAGES = Object.freeze({
  SWAPS_WITHHELD_FOR_UNCLOSED_MEAL:
    "Swaps are withheld because this meal is not closed within all nutrition tolerances.",
  NO_SAFE_SWAP_AVAILABLE:
    "No approved candidate swap keeps all five meal targets within tolerance.",
});

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireObject(value, path) {
  if (!isObject(value)) {
    throw new TypeError(`${path} must be an object.`);
  }
}

function requireArray(value, path) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${path} must be an array.`);
  }
}

function requireNonEmptyString(value, path) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${path} must be a non-empty string.`);
  }
}

function requireCanonicalId(value, path) {
  if (typeof value !== "string" || !CANONICAL_ID.test(value)) {
    throw new TypeError(`${path} must be a canonical ID.`);
  }
}

function requireKnownValue(value, knownValues, path) {
  if (!knownValues.includes(value)) {
    throw new TypeError(`${path} has an unknown value.`);
  }
}

function requireFiniteNonNegative(value, path) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`${path} must be a finite non-negative number.`);
  }
}

function requireFinitePositive(value, path) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${path} must be a finite positive number.`);
  }
}

function requireUniqueStringArray(value, path) {
  requireArray(value, path);
  value.forEach((entry, index) =>
    requireNonEmptyString(entry, `${path}[${index}]`));
  if (new Set(value).size !== value.length) {
    throw new TypeError(`${path} must contain unique values.`);
  }
}

function validateIssues(issues, path) {
  requireArray(issues, path);
  issues.forEach((issue, index) => {
    const issuePath = `${path}[${index}]`;
    requireObject(issue, issuePath);
    requireNonEmptyString(issue.code, `${issuePath}.code`);
    requireNonEmptyString(issue.message, `${issuePath}.message`);
  });
}

function validateReasons(reasons, path) {
  validateIssues(reasons, path);
}

function validateNutrition(nutrition, path) {
  requireObject(nutrition, path);
  for (const nutrient of NUTRIENTS) {
    requireFiniteNonNegative(nutrition[nutrient.key],
      `${path}.${nutrient.key}`);
  }
}

function validateTarget(target, path) {
  requireObject(target, path);
  for (const nutrient of NUTRIENTS) {
    requireFiniteNonNegative(target[nutrient.targetKey],
      `${path}.${nutrient.targetKey}`);
  }
}

function validateTolerance(tolerance, path) {
  requireObject(tolerance, path);
  for (const nutrient of NUTRIENTS) {
    requireFinitePositive(tolerance[nutrient.key],
      `${path}.${nutrient.key}`);
  }
}

function validatePortionRule(portionRule, path) {
  requireObject(portionRule, path);
  for (const field of PORTION_RULE_FIELDS) {
    if (!Number.isSafeInteger(portionRule[field]) || portionRule[field] <= 0) {
      throw new TypeError(`${path}.${field} must be a positive safe integer.`);
    }
  }
  if (
    portionRule.minimum_g > portionRule.default_g ||
    portionRule.default_g > portionRule.maximum_g
  ) {
    throw new TypeError(
      `${path} must satisfy minimum_g <= default_g <= maximum_g.`,
    );
  }
  if (
    (portionRule.default_g - portionRule.minimum_g) %
      portionRule.step_g !== 0
  ) {
    throw new TypeError(
      `${path}.default_g must align to step_g from minimum_g.`,
    );
  }
}

function validateSwapMetadata(swap, path) {
  requireObject(swap, path);
  if (typeof swap.is_swappable !== "boolean") {
    throw new TypeError(`${path}.is_swappable must be a boolean.`);
  }
  if (swap.is_swappable) {
    requireCanonicalId(swap.group_code, `${path}.group_code`);
  } else if (swap.group_code !== null) {
    throw new TypeError(
      `${path}.group_code must be null for a non-swappable food.`,
    );
  }
}

function compareCode(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareSets(left, right) {
  if (left.size !== right.size) {
    return false;
  }
  return [...left].every((value) => right.has(value));
}

function validateCatalog(catalog) {
  requireObject(catalog, "nutritionFoodCatalog");
  if (catalog.food_catalog_version !== NUTRITION_FOOD_CATALOG_VERSION) {
    throw new TypeError(
      `nutritionFoodCatalog.food_catalog_version must equal ${NUTRITION_FOOD_CATALOG_VERSION}.`,
    );
  }
  if (
    catalog.catalog_policy !==
    NutritionFoodCatalogPolicy.Z_COACHING_FOOD_CATALOG_V1
  ) {
    throw new TypeError(
      "nutritionFoodCatalog.catalog_policy must equal Z_COACHING_FOOD_CATALOG_V1.",
    );
  }
  requireArray(catalog.items, "nutritionFoodCatalog.items");
  requireArray(catalog.swap_groups, "nutritionFoodCatalog.swap_groups");

  const itemsByCode = new Map();
  const expectedGroups = new Map();
  catalog.items.forEach((item, index) => {
    const path = `nutritionFoodCatalog.items[${index}]`;
    requireObject(item, path);
    requireNonEmptyString(item.food_code, `${path}.food_code`);
    if (itemsByCode.has(item.food_code)) {
      throw new TypeError(
        `nutritionFoodCatalog contains duplicate food_code ${item.food_code}.`,
      );
    }
    requireNonEmptyString(item.food_class, `${path}.food_class`);
    if (typeof item.is_active !== "boolean") {
      throw new TypeError(`${path}.is_active must be a boolean.`);
    }
    validateNutrition(item.nutrition_per_100g,
      `${path}.nutrition_per_100g`);
    validatePortionRule(item.portion_rule_g, `${path}.portion_rule_g`);
    validateSwapMetadata(item.swap, `${path}.swap`);
    itemsByCode.set(item.food_code, { item, path });

    if (item.is_active && item.swap.is_swappable) {
      const group = expectedGroups.get(item.swap.group_code) ?? {
        foodClass: item.food_class,
        activeCodes: new Set(),
      };
      if (group.foodClass !== item.food_class) {
        throw new TypeError(
          `Swap group ${item.swap.group_code} must contain one food_class.`,
        );
      }
      group.activeCodes.add(item.food_code);
      expectedGroups.set(item.swap.group_code, group);
    }
  });

  const groupsByCode = new Map();
  catalog.swap_groups.forEach((group, index) => {
    const path = `nutritionFoodCatalog.swap_groups[${index}]`;
    requireObject(group, path);
    requireCanonicalId(group.group_code, `${path}.group_code`);
    if (groupsByCode.has(group.group_code)) {
      throw new TypeError(
        `nutritionFoodCatalog contains duplicate swap group ${group.group_code}.`,
      );
    }
    requireNonEmptyString(group.food_class, `${path}.food_class`);
    requireUniqueStringArray(
      group.active_item_codes,
      `${path}.active_item_codes`,
    );
    if (group.active_item_codes.length < 2) {
      throw new TypeError(
        `${path}.active_item_codes must contain at least two active foods.`,
      );
    }

    const expected = expectedGroups.get(group.group_code);
    if (!expected || expected.foodClass !== group.food_class) {
      throw new TypeError(`${path} does not match active catalog items.`);
    }
    const actualCodes = new Set(group.active_item_codes);
    if (!compareSets(actualCodes, expected.activeCodes)) {
      throw new TypeError(`${path}.active_item_codes has invalid membership.`);
    }
    for (const foodCode of group.active_item_codes) {
      const entry = itemsByCode.get(foodCode);
      if (
        !entry ||
        !entry.item.is_active ||
        !entry.item.swap.is_swappable ||
        entry.item.swap.group_code !== group.group_code ||
        entry.item.food_class !== group.food_class
      ) {
        throw new TypeError(
          `${path}.active_item_codes contains an invalid group member.`,
        );
      }
    }
    groupsByCode.set(group.group_code, group);
  });

  if (groupsByCode.size !== expectedGroups.size) {
    throw new TypeError(
      "nutritionFoodCatalog.swap_groups must match active swappable items.",
    );
  }
  for (const [groupCode] of expectedGroups) {
    if (!groupsByCode.has(groupCode)) {
      throw new TypeError(`Swap group ${groupCode} is missing from the catalog.`);
    }
  }
  return { itemsByCode, groupsByCode };
}

function validateMealCountContainer(value, path) {
  requireArray(value.meals, `${path}.meals`);
  if (
    value.meal_count !== null &&
    (!Number.isInteger(value.meal_count) || value.meal_count < 1)
  ) {
    throw new TypeError(`${path}.meal_count must be null or a positive integer.`);
  }
  if (
    (value.meal_count === null && value.meals.length !== 0) ||
    (value.meal_count !== null && value.meal_count !== value.meals.length)
  ) {
    throw new TypeError(`${path}.meal_count must match meals.`);
  }
}

function validateSelection(selection, catalog, itemsByCode, groupsByCode) {
  requireObject(selection, "nutritionFoodSelection");
  if (
    selection.food_selection_version !==
    NUTRITION_FOOD_SELECTION_VERSION
  ) {
    throw new TypeError(
      `nutritionFoodSelection.food_selection_version must equal ${NUTRITION_FOOD_SELECTION_VERSION}.`,
    );
  }
  requireKnownValue(
    selection.status,
    Object.values(NutritionFoodSelectionStatus),
    "nutritionFoodSelection.status",
  );
  if (selection.source_food_catalog_version !== catalog.food_catalog_version) {
    throw new TypeError(
      "nutritionFoodSelection.source_food_catalog_version must match nutritionFoodCatalog.food_catalog_version.",
    );
  }
  validateMealCountContainer(selection, "nutritionFoodSelection");
  if (
    selection.status === NutritionFoodSelectionStatus.WITHHELD &&
    selection.meal_count !== null
  ) {
    throw new TypeError("A WITHHELD nutritionFoodSelection must have no meals.");
  }
  if (
    selection.status === NutritionFoodSelectionStatus.READY &&
    selection.meal_count === null
  ) {
    throw new TypeError("A READY nutritionFoodSelection must contain meals.");
  }

  return selection.meals.map((meal, mealIndex) => {
    const path = `nutritionFoodSelection.meals[${mealIndex}]`;
    requireObject(meal, path);
    if (!Number.isInteger(meal.sequence) || meal.sequence !== mealIndex + 1) {
      throw new TypeError(
        "nutritionFoodSelection meal sequence must start at 1 and be contiguous.",
      );
    }
    requireNonEmptyString(meal.role, `${path}.role`);
    validateTarget(meal.target, `${path}.target`);
    if (
      meal.selected_pattern_code !== null &&
      (typeof meal.selected_pattern_code !== "string" ||
        meal.selected_pattern_code.trim().length === 0)
    ) {
      throw new TypeError(
        `${path}.selected_pattern_code must be null or a non-empty string.`,
      );
    }
    requireArray(meal.slots, `${path}.slots`);

    const slotsBySequence = new Map();
    meal.slots.forEach((slot, slotIndex) => {
      const slotPath = `${path}.slots[${slotIndex}]`;
      requireObject(slot, slotPath);
      if (
        !Number.isInteger(slot.sequence) ||
        slot.sequence !== slotIndex + 1
      ) {
        throw new TypeError(
          `${path} slot sequence must start at 1 and be contiguous.`,
        );
      }
      requireNonEmptyString(slot.slot, `${slotPath}.slot`);
      requireUniqueStringArray(
        slot.candidate_food_codes,
        `${slotPath}.candidate_food_codes`,
      );
      for (const foodCode of slot.candidate_food_codes) {
        const catalogEntry = itemsByCode.get(foodCode);
        if (!catalogEntry) {
          throw new TypeError(
            `${slotPath}.candidate_food_codes contains missing food ${foodCode}.`,
          );
        }
        if (
          catalogEntry.item.swap.is_swappable &&
          !groupsByCode.has(catalogEntry.item.swap.group_code)
        ) {
          throw new TypeError(
            `${slotPath}.candidate_food_codes contains food ${foodCode} without a valid swap group.`,
          );
        }
      }
      slotsBySequence.set(slot.sequence, slot);
    });
    return { meal, slotsBySequence };
  });
}

function targetsMatch(left, right) {
  return NUTRIENTS.every(({ targetKey }) =>
    left[targetKey] === right[targetKey]);
}

function isLegalGrams(grams, portionRule) {
  return Number.isSafeInteger(grams) &&
    grams >= portionRule.minimum_g &&
    grams <= portionRule.maximum_g &&
    (grams - portionRule.minimum_g) % portionRule.step_g === 0;
}

function validatePortionSolver({
  portionSolver,
  selection,
  catalog,
  selectionMeals,
  itemsByCode,
}) {
  requireObject(portionSolver, "nutritionPortionSolver");
  if (
    portionSolver.portion_solver_version !==
    NUTRITION_PORTION_SOLVER_VERSION
  ) {
    throw new TypeError(
      `nutritionPortionSolver.portion_solver_version must equal ${NUTRITION_PORTION_SOLVER_VERSION}.`,
    );
  }
  requireKnownValue(
    portionSolver.status,
    Object.values(NutritionPortionSolverStatus),
    "nutritionPortionSolver.status",
  );
  if (
    portionSolver.source_food_selection_version !==
    selection.food_selection_version
  ) {
    throw new TypeError(
      "nutritionPortionSolver.source_food_selection_version must match nutritionFoodSelection.food_selection_version.",
    );
  }
  if (
    portionSolver.source_food_catalog_version !==
    catalog.food_catalog_version
  ) {
    throw new TypeError(
      "nutritionPortionSolver.source_food_catalog_version must match nutritionFoodCatalog.food_catalog_version.",
    );
  }
  validateMealCountContainer(portionSolver, "nutritionPortionSolver");
  if (portionSolver.meal_count !== selection.meal_count) {
    throw new TypeError(
      "Food Selection and Portion Solver meal_count values must match.",
    );
  }
  if (
    portionSolver.status === NutritionPortionSolverStatus.WITHHELD &&
    portionSolver.meal_count !== null
  ) {
    throw new TypeError("A WITHHELD nutritionPortionSolver must have no meals.");
  }
  if (
    portionSolver.status === NutritionPortionSolverStatus.READY &&
    portionSolver.meal_count === null
  ) {
    throw new TypeError("A READY nutritionPortionSolver must contain meals.");
  }
  if (
    (selection.status === NutritionFoodSelectionStatus.WITHHELD) !==
    (portionSolver.status === NutritionPortionSolverStatus.WITHHELD)
  ) {
    throw new TypeError(
      "Food Selection and Portion Solver withheld statuses must agree.",
    );
  }
  if (
    selection.status ===
      NutritionFoodSelectionStatus.PROVISIONAL_REVIEW_REQUIRED &&
    portionSolver.status === NutritionPortionSolverStatus.READY
  ) {
    throw new TypeError(
      "A provisional Food Selection cannot produce a READY Portion Solver.",
    );
  }
  requireArray(portionSolver.constraints, "nutritionPortionSolver.constraints");
  validateReasons(portionSolver.reasons, "nutritionPortionSolver.reasons");

  portionSolver.meals.forEach((meal, mealIndex) => {
    const path = `nutritionPortionSolver.meals[${mealIndex}]`;
    const selectionMeal = selectionMeals[mealIndex];
    requireObject(meal, path);
    if (!Number.isInteger(meal.sequence) || meal.sequence !== mealIndex + 1) {
      throw new TypeError(
        "nutritionPortionSolver meal sequence must start at 1 and be contiguous.",
      );
    }
    if (
      meal.sequence !== selectionMeal.meal.sequence ||
      meal.selected_pattern_code !==
        selectionMeal.meal.selected_pattern_code ||
      meal.role !== selectionMeal.meal.role
    ) {
      throw new TypeError(
        `${path} must match Food Selection sequence, role, and selected_pattern_code.`,
      );
    }
    requireNonEmptyString(meal.role, `${path}.role`);
    validateTarget(meal.target, `${path}.target`);
    if (!targetsMatch(meal.target, selectionMeal.meal.target)) {
      throw new TypeError(`${path}.target must match Food Selection target.`);
    }
    validateTolerance(meal.tolerance, `${path}.tolerance`);
    if (typeof meal.all_targets_within_tolerance !== "boolean") {
      throw new TypeError(
        `${path}.all_targets_within_tolerance must be a boolean.`,
      );
    }
    validateIssues(meal.issues, `${path}.issues`);
    requireArray(meal.items, `${path}.items`);

    const usedFoodCodes = new Set();
    meal.items.forEach((item, itemIndex) => {
      const itemPath = `${path}.items[${itemIndex}]`;
      requireObject(item, itemPath);
      requireNonEmptyString(item.food_code, `${itemPath}.food_code`);
      if (usedFoodCodes.has(item.food_code)) {
        throw new TypeError(
          `${path} cannot contain duplicate food ${item.food_code}.`,
        );
      }
      usedFoodCodes.add(item.food_code);
      const catalogEntry = itemsByCode.get(item.food_code);
      if (!catalogEntry) {
        throw new TypeError(
          `${itemPath}.food_code must exist exactly once in the catalog.`,
        );
      }
      if (!Number.isInteger(item.slot_sequence)) {
        throw new TypeError(`${itemPath}.slot_sequence must be an integer.`);
      }
      const slot = selectionMeal.slotsBySequence.get(item.slot_sequence);
      if (!slot || item.slot !== slot.slot) {
        throw new TypeError(`${itemPath} must match a Food Selection slot.`);
      }
      if (!slot.candidate_food_codes.includes(item.food_code)) {
        throw new TypeError(
          `${itemPath}.food_code must be an approved candidate for its slot.`,
        );
      }
      if (!isLegalGrams(item.grams, catalogEntry.item.portion_rule_g)) {
        throw new TypeError(`${itemPath}.grams must be a legal portion.`);
      }
    });
  });
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

function roundForDisplay(value) {
  const rounded = Math.round(
    (value + Number.EPSILON * value) * 100,
  ) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function zeroNutrients() {
  return Object.fromEntries(NUTRIENTS.map(({ key }) => [key, 0]));
}

function targetNutrients(target) {
  return Object.fromEntries(NUTRIENTS.map(({ key, targetKey }) => [
    key,
    target[targetKey],
  ]));
}

function nutritionAtGrams(food, grams) {
  const factor = grams / 100;
  return Object.fromEntries(NUTRIENTS.map(({ key }) => [
    key,
    food.nutrition_per_100g[key] * factor,
  ]));
}

function addNutrients(total, nutrition) {
  for (const { key } of NUTRIENTS) {
    total[key] += nutrition[key];
  }
  return total;
}

function rawMealTotals(meal, itemsByCode) {
  const totals = zeroNutrients();
  for (const item of meal.items) {
    addNutrients(
      totals,
      nutritionAtGrams(itemsByCode.get(item.food_code).item, item.grams),
    );
  }
  return totals;
}

function projectedTotals({
  mealTotals,
  originalFood,
  originalGrams,
  alternativeFood,
  alternativeGrams,
}) {
  const originalNutrition = nutritionAtGrams(originalFood, originalGrams);
  const alternativeNutrition = nutritionAtGrams(
    alternativeFood,
    alternativeGrams,
  );
  return Object.fromEntries(NUTRIENTS.map(({ key }) => [
    key,
    mealTotals[key] - originalNutrition[key] + alternativeNutrition[key],
  ]));
}

function residualNutrients(actual, target) {
  return Object.fromEntries(NUTRIENTS.map(({ key }) => [
    key,
    actual[key] - target[key],
  ]));
}

function withinTolerance(actual, target, tolerance) {
  return Object.fromEntries(NUTRIENTS.map(({ key }) => [
    key,
    Math.abs(actual[key] - target[key]) <=
      tolerance[key] + SCORE_EPSILON,
  ]));
}

function objectiveScore(actual, target, tolerance) {
  let score = 0;
  for (const nutrient of NUTRIENTS) {
    const normalizedError =
      Math.abs(actual[nutrient.key] - target[nutrient.key]) /
      tolerance[nutrient.key];
    score += nutrient.weight * normalizedError ** 2;
  }
  return score;
}

function displayNutrients(nutrients) {
  return Object.fromEntries(NUTRIENTS.map(({ key }) => [
    key,
    roundForDisplay(nutrients[key]),
  ]));
}

function legalGramValues(portionRule) {
  const values = [];
  for (
    let grams = portionRule.minimum_g;
    grams <= portionRule.maximum_g;
    grams += portionRule.step_g
  ) {
    values.push(grams);
  }
  return values;
}

function compareNumbers(left, right) {
  return Math.abs(left - right) <= SCORE_EPSILON
    ? 0
    : left < right
      ? -1
      : 1;
}

function bestAlternativeForCandidate({
  candidate,
  originalItem,
  originalFood,
  mealTotals,
  target,
  tolerance,
}) {
  let best = null;
  for (const grams of legalGramValues(candidate.food.portion_rule_g)) {
    const totals = projectedTotals({
      mealTotals,
      originalFood,
      originalGrams: originalItem.grams,
      alternativeFood: candidate.food,
      alternativeGrams: grams,
    });
    const score = objectiveScore(totals, target, tolerance);
    if (
      best === null ||
      compareNumbers(score, best.rawObjectiveScore) < 0 ||
      (compareNumbers(score, best.rawObjectiveScore) === 0 &&
        grams < best.grams)
    ) {
      best = { grams, totals, rawObjectiveScore: score };
    }
  }

  const projectedWithin = withinTolerance(
    best.totals,
    target,
    tolerance,
  );
  if (!Object.values(projectedWithin).every(Boolean)) {
    return null;
  }

  return {
    food_code: candidate.foodCode,
    grams: best.grams,
    nutrition: displayNutrients(
      nutritionAtGrams(candidate.food, best.grams),
    ),
    projected_meal_totals: displayNutrients(best.totals),
    projected_meal_residual: displayNutrients(
      residualNutrients(best.totals, target),
    ),
    projected_within_tolerance: projectedWithin,
    objective_score: roundForDisplay(best.rawObjectiveScore),
    rawObjectiveScore: best.rawObjectiveScore,
    candidateIndex: candidate.candidateIndex,
  };
}

function compareAlternatives(left, right) {
  return compareNumbers(left.rawObjectiveScore, right.rawObjectiveScore) ||
    left.candidateIndex - right.candidateIndex ||
    compareCode(left.food_code, right.food_code) ||
    left.grams - right.grams;
}

function stripAlternativeInternals(alternative) {
  const { rawObjectiveScore, candidateIndex, ...output } = alternative;
  void rawObjectiveScore;
  void candidateIndex;
  return output;
}

function issue(code) {
  return { code, message: ISSUE_MESSAGES[code] };
}

function cloneIssues(issues) {
  return structuredClone(issues);
}

function addIssueOnce(issues, code) {
  if (!issues.some((entry) => entry.code === code)) {
    issues.push(issue(code));
  }
}

function baseItemOutput(portionItem, food) {
  return {
    food_code: portionItem.food_code,
    grams: portionItem.grams,
    is_swappable: food.swap.is_swappable,
    group_code: food.swap.is_swappable ? food.swap.group_code : null,
    alternatives: [],
    issues: [],
  };
}

function candidatesForItem({
  portionItem,
  slot,
  originalFood,
  usedFoodCodes,
  itemsByCode,
  groupsByCode,
}) {
  const activeGroupCodes = new Set(
    groupsByCode.get(originalFood.swap.group_code).active_item_codes,
  );
  return slot.candidate_food_codes.flatMap((foodCode, candidateIndex) => {
    if (
      foodCode === portionItem.food_code ||
      usedFoodCodes.has(foodCode) ||
      !activeGroupCodes.has(foodCode)
    ) {
      return [];
    }
    const food = itemsByCode.get(foodCode).item;
    if (
      !food.swap.is_swappable ||
      food.swap.group_code !== originalFood.swap.group_code
    ) {
      return [];
    }
    return [{ foodCode, food, candidateIndex }];
  });
}

function buildClosedMeal({
  portionMeal,
  selectionMeal,
  itemsByCode,
  groupsByCode,
}) {
  const totals = rawMealTotals(portionMeal, itemsByCode);
  const target = targetNutrients(portionMeal.target);
  const usedFoodCodes = new Set(
    portionMeal.items.map(({ food_code: foodCode }) => foodCode),
  );

  const items = portionMeal.items.map((portionItem) => {
    const food = itemsByCode.get(portionItem.food_code).item;
    const output = baseItemOutput(portionItem, food);
    if (!food.swap.is_swappable) {
      return output;
    }

    const slot = selectionMeal.slotsBySequence.get(
      portionItem.slot_sequence,
    );
    output.alternatives = candidatesForItem({
      portionItem,
      slot,
      originalFood: food,
      usedFoodCodes,
      itemsByCode,
      groupsByCode,
    })
      .map((candidate) => bestAlternativeForCandidate({
        candidate,
        originalItem: portionItem,
        originalFood: food,
        mealTotals: totals,
        target,
        tolerance: portionMeal.tolerance,
      }))
      .filter((alternative) => alternative !== null)
      .sort(compareAlternatives)
      .map(stripAlternativeInternals);

    if (output.alternatives.length === 0) {
      output.issues.push(issue("NO_SAFE_SWAP_AVAILABLE"));
    }
    return output;
  });

  return {
    sequence: portionMeal.sequence,
    role: portionMeal.role,
    selected_pattern_code: portionMeal.selected_pattern_code,
    items,
    issues: cloneIssues(portionMeal.issues),
  };
}

function buildUnclosedMeal(portionMeal, itemsByCode) {
  const issues = cloneIssues(portionMeal.issues);
  addIssueOnce(issues, "SWAPS_WITHHELD_FOR_UNCLOSED_MEAL");
  return {
    sequence: portionMeal.sequence,
    role: portionMeal.role,
    selected_pattern_code: portionMeal.selected_pattern_code,
    items: portionMeal.items.map((portionItem) =>
      baseItemOutput(
        portionItem,
        itemsByCode.get(portionItem.food_code).item,
      )),
    issues,
  };
}

function cloneReasonsWithoutDuplicateCodes(reasons) {
  const clonedReasons = [];
  const seenCodes = new Set();
  for (const reason of reasons) {
    if (!seenCodes.has(reason.code)) {
      seenCodes.add(reason.code);
      clonedReasons.push(structuredClone(reason));
    }
  }
  return { reasons: clonedReasons, seenCodes };
}

function addReason(reasonState, code) {
  if (reasonState.seenCodes.has(code)) {
    return;
  }
  reasonState.seenCodes.add(code);
  reasonState.reasons.push({ code, message: REASON_MESSAGES[code] });
}

function makeOutput({
  selection,
  portionSolver,
  catalog,
  status,
  mealCount,
  meals,
  reasonState,
}) {
  return {
    swap_engine_version: NUTRITION_SWAP_ENGINE_VERSION,
    source_food_selection_version: selection.food_selection_version,
    source_portion_solver_version: portionSolver.portion_solver_version,
    source_food_catalog_version: catalog.food_catalog_version,
    status,
    swap_policy: NutritionSwapEnginePolicy.Z_COACHING_SWAP_ENGINE_V1,
    meal_count: mealCount,
    meals,
    constraints: structuredClone(portionSolver.constraints),
    reasons: reasonState.reasons,
  };
}

/**
 * Builds deterministic, tolerance-safe alternatives for solved food portions.
 * It does not change Food Selection or invoke the Portion Solver again.
 *
 * @param {Object} inputs
 * @param {Object} inputs.nutritionFoodSelection
 * @param {Object} inputs.nutritionPortionSolver
 * @param {Object} inputs.nutritionFoodCatalog
 * @returns {import("./domain/contracts.js").NutritionSwapEngine}
 */
export function buildNutritionSwapEngine(inputs) {
  requireObject(inputs, "inputs");
  const {
    nutritionFoodSelection: selection,
    nutritionPortionSolver: portionSolver,
    nutritionFoodCatalog: catalog,
  } = inputs;

  const { itemsByCode, groupsByCode } = validateCatalog(catalog);
  const selectionMeals = validateSelection(
    selection,
    catalog,
    itemsByCode,
    groupsByCode,
  );
  validatePortionSolver({
    portionSolver,
    selection,
    catalog,
    selectionMeals,
    itemsByCode,
  });
  const reasonState = cloneReasonsWithoutDuplicateCodes(
    portionSolver.reasons,
  );

  if (portionSolver.status === NutritionPortionSolverStatus.WITHHELD) {
    addReason(
      reasonState,
      "SWAP_ENGINE_WITHHELD_BY_PORTION_SOLVER_STATUS",
    );
    return finalize(makeOutput({
      selection,
      portionSolver,
      catalog,
      status: NutritionSwapEngineStatus.WITHHELD,
      mealCount: null,
      meals: [],
      reasonState,
    }));
  }

  const meals = portionSolver.meals.map((portionMeal, mealIndex) =>
    portionMeal.all_targets_within_tolerance
      ? buildClosedMeal({
          portionMeal,
          selectionMeal: selectionMeals[mealIndex],
          itemsByCode,
          groupsByCode,
        })
      : buildUnclosedMeal(portionMeal, itemsByCode));

  if (portionSolver.meals.some((meal) =>
    meal.all_targets_within_tolerance)) {
    addReason(reasonState, "SWAP_ENGINE_POLICY_APPLIED");
  }
  if (
    portionSolver.status ===
    NutritionPortionSolverStatus.PROVISIONAL_REVIEW_REQUIRED
  ) {
    addReason(reasonState, "SWAP_ENGINE_UPSTREAM_REVIEW_RETAINED");
  }

  return finalize(makeOutput({
    selection,
    portionSolver,
    catalog,
    status: portionSolver.status === NutritionPortionSolverStatus.READY
      ? NutritionSwapEngineStatus.READY
      : NutritionSwapEngineStatus.PROVISIONAL_REVIEW_REQUIRED,
    mealCount: portionSolver.meal_count,
    meals,
    reasonState,
  }));
}
