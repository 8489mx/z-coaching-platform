import {
  NUTRITION_FOOD_SELECTION_VERSION,
  NutritionFoodSelectionStatus,
} from "../nutrition-food-selection/index.js";
import {
  NUTRITION_FOOD_CATALOG_VERSION,
  NutritionFoodCatalogPolicy,
} from "../nutrition-food-catalog/index.js";
import { NUTRITION_PORTION_SOLVER_VERSION } from "./domain/contracts.js";
import {
  NutritionPortionSolverPolicy,
  NutritionPortionSolverStatus,
} from "./domain/enums.js";

const NUTRIENTS = Object.freeze([
  Object.freeze({
    key: "calories_kcal",
    targetKey: "planned_calories",
    // P1-B6: tolerance is relative to meal size. The old absolute floors
    // (50 kcal / 5 g protein / 5 g fat / 10 g carbs / 3 g fiber) blessed a
    // small meal 25% under on protein and 60% under on fiber. The only floor
    // left is 1 unit of display rounding, so a small meal is judged by the
    // same percentages as a large one.
    minimumTolerance: 1,
    toleranceRate: 0.1,
    weight: 3,
  }),
  Object.freeze({
    key: "protein_g",
    targetKey: "protein_g",
    minimumTolerance: 1,
    toleranceRate: 0.15,
    weight: 4,
  }),
  Object.freeze({
    key: "fat_g",
    targetKey: "fat_g",
    minimumTolerance: 1,
    toleranceRate: 0.2,
    weight: 2,
  }),
  Object.freeze({
    key: "carbohydrate_g",
    targetKey: "carbohydrate_g",
    minimumTolerance: 1,
    toleranceRate: 0.15,
    weight: 2,
  }),
  Object.freeze({
    key: "fiber_g",
    targetKey: "fiber_g",
    minimumTolerance: 1,
    toleranceRate: 0.25,
    weight: 1,
  }),
]);

const PORTION_RULE_FIELDS = Object.freeze([
  "minimum_g",
  "maximum_g",
  "step_g",
  "default_g",
]);

const REQUIREMENT = Object.freeze({
  REQUIRED: "REQUIRED",
  OPTIONAL: "OPTIONAL",
});

const SELECTION_SOURCE = Object.freeze({
  FOOD_SELECTION: "FOOD_SELECTION",
  PORTION_SOLVER_ADDITION: "PORTION_SOLVER_ADDITION",
});

const MAX_COORDINATE_DESCENT_PASSES = 20;
const SCORE_EPSILON = 1e-12;

const REASON_MESSAGES = Object.freeze({
  PORTION_SOLVER_WITHHELD_BY_FOOD_SELECTION_STATUS:
    "Portion solving was withheld because food selection is withheld.",
  PORTION_SOLVER_POLICY_APPLIED:
    "Legal food portions were optimized deterministically using Z Coaching Portion Solver V1.",
  PORTION_SOLVER_UPSTREAM_REVIEW_RETAINED:
    "The upstream food-selection review requirement was retained.",
  PORTION_SOLVER_MEAL_TARGET_OUTSIDE_TOLERANCE:
    "At least one solved meal remains outside one or more nutrition tolerances.",
});

const NO_PATTERN_ISSUE = Object.freeze({
  code: "PORTION_SOLVER_UNAVAILABLE_WITHOUT_SELECTED_PATTERN",
  message: "Portion solving is unavailable without a selected food pattern.",
});

const OUTSIDE_TOLERANCE_MESSAGE =
  "One or more meal nutrition targets remain outside tolerance.";

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

function requireUniqueStringArray(value, path) {
  requireArray(value, path);
  value.forEach((entry, index) =>
    requireNonEmptyString(entry, `${path}[${index}]`));
  if (new Set(value).size !== value.length) {
    throw new TypeError(`${path} must contain unique food codes.`);
  }
}

function validateReasonArray(reasons, path) {
  requireArray(reasons, path);
  reasons.forEach((reason, index) => {
    const reasonPath = `${path}[${index}]`;
    requireObject(reason, reasonPath);
    requireNonEmptyString(reason.code, `${reasonPath}.code`);
    requireNonEmptyString(reason.message, `${reasonPath}.message`);
  });
}

function validateTarget(target, path) {
  requireObject(target, path);
  for (const nutrient of NUTRIENTS) {
    requireFiniteNonNegative(target[nutrient.targetKey],
      `${path}.${nutrient.targetKey}`);
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

function validateNutrition(nutrition, path) {
  requireObject(nutrition, path);
  for (const nutrient of NUTRIENTS) {
    requireFiniteNonNegative(nutrition[nutrient.key],
      `${path}.${nutrient.key}`);
  }
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

  const itemsByCode = new Map();
  catalog.items.forEach((item, index) => {
    const path = `nutritionFoodCatalog.items[${index}]`;
    requireObject(item, path);
    requireNonEmptyString(item.food_code, `${path}.food_code`);
    if (itemsByCode.has(item.food_code)) {
      throw new TypeError(
        `nutritionFoodCatalog contains duplicate food_code ${item.food_code}.`,
      );
    }
    itemsByCode.set(item.food_code, { item, path });
  });
  return itemsByCode;
}

function validateReferencedFood(foodCode, itemsByCode, validatedCodes) {
  const catalogEntry = itemsByCode.get(foodCode);
  if (!catalogEntry) {
    throw new TypeError(
      `Food code ${foodCode} must exist exactly once in nutritionFoodCatalog.`,
    );
  }
  if (!validatedCodes.has(foodCode)) {
    validatePortionRule(
      catalogEntry.item.portion_rule_g,
      `${catalogEntry.path}.portion_rule_g`,
    );
    validateNutrition(
      catalogEntry.item.nutrition_per_100g,
      `${catalogEntry.path}.nutrition_per_100g`,
    );
    validatedCodes.add(foodCode);
  }
}

function validateSelectionSlot({
  slot,
  slotIndex,
  mealPath,
  hasSelectedPattern,
  mealSelectedCodes,
  itemsByCode,
  validatedCodes,
}) {
  const path = `${mealPath}.slots[${slotIndex}]`;
  requireObject(slot, path);
  if (!Number.isInteger(slot.sequence) || slot.sequence !== slotIndex + 1) {
    throw new TypeError(`${mealPath} slot sequence must start at 1 and be contiguous.`);
  }
  requireNonEmptyString(slot.slot, `${path}.slot`);
  requireKnownValue(
    slot.requirement,
    Object.values(REQUIREMENT),
    `${path}.requirement`,
  );
  if (
    !Number.isInteger(slot.min_items) ||
    slot.min_items < 0 ||
    !Number.isInteger(slot.max_items) ||
    slot.max_items < 1 ||
    slot.min_items > slot.max_items
  ) {
    throw new TypeError(`${path} must have consistent integer item bounds.`);
  }
  requireUniqueStringArray(
    slot.selected_food_codes,
    `${path}.selected_food_codes`,
  );
  requireUniqueStringArray(
    slot.candidate_food_codes,
    `${path}.candidate_food_codes`,
  );
  const candidateCodes = new Set(slot.candidate_food_codes);
  if (slot.selected_food_codes.some((code) => !candidateCodes.has(code))) {
    throw new TypeError(
      `${path}.selected_food_codes must be a subset of candidate_food_codes.`,
    );
  }
  if (slot.selected_food_codes.length > slot.max_items) {
    throw new TypeError(
      `${path}.selected_food_codes must not exceed max_items.`,
    );
  }
  if (
    hasSelectedPattern &&
    slot.requirement === REQUIREMENT.REQUIRED &&
    slot.selected_food_codes.length < slot.min_items
  ) {
    throw new TypeError(
      `${path}.selected_food_codes must satisfy min_items for a required slot.`,
    );
  }
  if (
    slot.requirement === REQUIREMENT.OPTIONAL &&
    slot.selected_food_codes.length !== 0
  ) {
    throw new TypeError(`${path} optional slots must start empty.`);
  }

  for (const foodCode of slot.candidate_food_codes) {
    validateReferencedFood(foodCode, itemsByCode, validatedCodes);
  }
  for (const foodCode of slot.selected_food_codes) {
    if (mealSelectedCodes.has(foodCode)) {
      throw new TypeError(
        `${mealPath} cannot select food code ${foodCode} more than once.`,
      );
    }
    mealSelectedCodes.add(foodCode);
  }
}

function validateSelectionMeal(
  meal,
  mealIndex,
  itemsByCode,
  validatedCodes,
) {
  const path = `nutritionFoodSelection.meals[${mealIndex}]`;
  requireObject(meal, path);
  if (!Number.isInteger(meal.sequence) || meal.sequence !== mealIndex + 1) {
    throw new TypeError(
      "nutritionFoodSelection.meals sequence must start at 1 and be contiguous.",
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
  if (meal.selected_pattern_code === null && meal.slots.length !== 0) {
    throw new TypeError(`${path} without a selected pattern must have no slots.`);
  }

  const mealSelectedCodes = new Set();
  meal.slots.forEach((slot, slotIndex) =>
    validateSelectionSlot({
      slot,
      slotIndex,
      mealPath: path,
      hasSelectedPattern: meal.selected_pattern_code !== null,
      mealSelectedCodes,
      itemsByCode,
      validatedCodes,
    }));
}

function validateFoodSelection(selection, catalog, itemsByCode) {
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
  requireArray(selection.meals, "nutritionFoodSelection.meals");
  if (
    selection.meal_count !== null &&
    (!Number.isInteger(selection.meal_count) || selection.meal_count < 1)
  ) {
    throw new TypeError(
      "nutritionFoodSelection.meal_count must be null or a positive integer.",
    );
  }
  if (
    (selection.meal_count === null && selection.meals.length !== 0) ||
    (selection.meal_count !== null &&
      selection.meal_count !== selection.meals.length)
  ) {
    throw new TypeError("nutritionFoodSelection.meal_count must match meals.");
  }
  if (
    selection.status === NutritionFoodSelectionStatus.WITHHELD &&
    (selection.meal_count !== null || selection.meals.length !== 0)
  ) {
    throw new TypeError("A WITHHELD nutritionFoodSelection must have no meals.");
  }
  if (
    selection.status === NutritionFoodSelectionStatus.READY &&
    selection.meal_count === null
  ) {
    throw new TypeError("A READY nutritionFoodSelection must contain meals.");
  }
  requireArray(selection.constraints, "nutritionFoodSelection.constraints");
  validateReasonArray(selection.reasons, "nutritionFoodSelection.reasons");

  const validatedCodes = new Set();
  selection.meals.forEach((meal, mealIndex) =>
    validateSelectionMeal(meal, mealIndex, itemsByCode, validatedCodes));
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
  return Object.fromEntries(
    NUTRIENTS.map(({ key, targetKey }) => [key, target[targetKey]]),
  );
}

function toleranceForTarget(target) {
  const normalizedTarget = targetNutrients(target);
  return Object.fromEntries(NUTRIENTS.map((nutrient) => [
    nutrient.key,
    Math.max(
      nutrient.minimumTolerance,
      normalizedTarget[nutrient.key] * nutrient.toleranceRate,
    ),
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

function compareCode(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareAssignments(left, right) {
  return left.slotSequence - right.slotSequence ||
    compareCode(left.foodCode, right.foodCode);
}

function solutionFromGrams(assignments, gramsByCode, target, tolerance) {
  const totals = zeroNutrients();
  let defaultDeviation = 0;
  for (const assignment of assignments) {
    const grams = gramsByCode.get(assignment.foodCode);
    addNutrients(totals, nutritionAtGrams(assignment.food, grams));
    defaultDeviation += Math.abs(
      grams - assignment.food.portion_rule_g.default_g,
    );
  }
  return {
    assignments,
    gramsByCode,
    totals,
    objectiveScore: objectiveScore(totals, target, tolerance),
    defaultDeviation,
  };
}

function compareNumberWithTolerance(left, right) {
  return Math.abs(left - right) <= SCORE_EPSILON
    ? 0
    : left < right
      ? -1
      : 1;
}

function compareLexicographically(left, right, comparator) {
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    const comparison = comparator(left[index], right[index]);
    if (comparison !== 0) {
      return comparison;
    }
  }
  return left.length - right.length;
}

function alphabeticAssignments(solution) {
  return [...solution.assignments].sort((left, right) =>
    compareCode(left.foodCode, right.foodCode));
}

function compareSolutions(left, right) {
  const scoreComparison = compareNumberWithTolerance(
    left.objectiveScore,
    right.objectiveScore,
  );
  if (scoreComparison !== 0) {
    return scoreComparison;
  }
  if (left.assignments.length !== right.assignments.length) {
    return left.assignments.length - right.assignments.length;
  }
  if (left.defaultDeviation !== right.defaultDeviation) {
    return left.defaultDeviation - right.defaultDeviation;
  }

  const leftAlphabetic = alphabeticAssignments(left);
  const rightAlphabetic = alphabeticAssignments(right);
  const codeComparison = compareLexicographically(
    leftAlphabetic.map(({ foodCode }) => foodCode),
    rightAlphabetic.map(({ foodCode }) => foodCode),
    compareCode,
  );
  if (codeComparison !== 0) {
    return codeComparison;
  }
  const gramsComparison = compareLexicographically(
    leftAlphabetic.map(({ foodCode }) => left.gramsByCode.get(foodCode)),
    rightAlphabetic.map(({ foodCode }) => right.gramsByCode.get(foodCode)),
    (leftGrams, rightGrams) => leftGrams - rightGrams,
  );
  if (gramsComparison !== 0) {
    return gramsComparison;
  }
  return compareLexicographically(
    [...left.assignments].sort(compareAssignments).map(
      ({ slotSequence }) => slotSequence,
    ),
    [...right.assignments].sort(compareAssignments).map(
      ({ slotSequence }) => slotSequence,
    ),
    (leftSequence, rightSequence) => leftSequence - rightSequence,
  );
}

function coordinateDescent(assignments, startGrams, target, tolerance) {
  let current = solutionFromGrams(
    assignments,
    new Map(startGrams),
    target,
    tolerance,
  );

  for (let pass = 0; pass < MAX_COORDINATE_DESCENT_PASSES; pass += 1) {
    let improved = false;
    for (const assignment of assignments) {
      let bestForCoordinate = current;
      for (const grams of assignment.legalGrams) {
        const trialGrams = new Map(current.gramsByCode);
        trialGrams.set(assignment.foodCode, grams);
        const trial = solutionFromGrams(
          assignments,
          trialGrams,
          target,
          tolerance,
        );
        if (compareSolutions(trial, bestForCoordinate) < 0) {
          bestForCoordinate = trial;
        }
      }
      if (compareSolutions(bestForCoordinate, current) < 0) {
        current = bestForCoordinate;
        improved = true;
      }
    }
    if (!improved) {
      break;
    }
  }
  return current;
}

function solveFoodSet(rawAssignments, target) {
  const assignments = [...rawAssignments]
    .sort(compareAssignments)
    .map((assignment) => ({
      ...assignment,
      legalGrams: legalGramValues(assignment.food.portion_rule_g),
    }));
  const tolerance = toleranceForTarget(target);
  const starts = [
    new Map(assignments.map((assignment) => [
      assignment.foodCode,
      assignment.legalGrams[0],
    ])),
    new Map(assignments.map((assignment) => [
      assignment.foodCode,
      assignment.food.portion_rule_g.default_g,
    ])),
    new Map(assignments.map((assignment) => [
      assignment.foodCode,
      assignment.legalGrams.at(-1),
    ])),
  ];

  let best = null;
  for (const start of starts) {
    const solution = coordinateDescent(assignments, start, targetNutrients(target), tolerance);
    if (best === null || compareSolutions(solution, best) < 0) {
      best = solution;
    }
  }
  return best;
}

function initialAssignments(meal, itemsByCode) {
  return meal.slots.flatMap((slot) =>
    slot.selected_food_codes.map((foodCode) => ({
      foodCode,
      food: itemsByCode.get(foodCode).item,
      slotSequence: slot.sequence,
      slot: slot.slot,
      selectionSource: SELECTION_SOURCE.FOOD_SELECTION,
    })));
}

function candidateAdditions(meal, assignments, itemsByCode) {
  const usedCodes = new Set(assignments.map(({ foodCode }) => foodCode));
  const countBySlot = new Map();
  for (const assignment of assignments) {
    countBySlot.set(
      assignment.slotSequence,
      (countBySlot.get(assignment.slotSequence) ?? 0) + 1,
    );
  }

  const additions = [];
  for (const slot of meal.slots) {
    if ((countBySlot.get(slot.sequence) ?? 0) >= slot.max_items) {
      continue;
    }
    slot.candidate_food_codes.forEach((foodCode, candidateIndex) => {
      if (!usedCodes.has(foodCode)) {
        additions.push({
          foodCode,
          food: itemsByCode.get(foodCode).item,
          slotSequence: slot.sequence,
          slot: slot.slot,
          selectionSource: SELECTION_SOURCE.PORTION_SOLVER_ADDITION,
          candidateIndex,
        });
      }
    });
  }
  return additions;
}

function compareAdditions(left, right) {
  return left.slotSequence - right.slotSequence ||
    left.candidateIndex - right.candidateIndex ||
    compareCode(left.foodCode, right.foodCode);
}

function solveWithCandidateAdditions(meal, itemsByCode) {
  let assignments = initialAssignments(meal, itemsByCode);
  let solution = solveFoodSet(assignments, meal.target);

  while (true) {
    let bestTrial = null;
    for (const addition of candidateAdditions(meal, assignments, itemsByCode)) {
      const trialAssignments = [...assignments, addition];
      const trialSolution = solveFoodSet(trialAssignments, meal.target);
      if (
        trialSolution.objectiveScore >=
        solution.objectiveScore - SCORE_EPSILON
      ) {
        continue;
      }
      if (
        bestTrial === null ||
        trialSolution.objectiveScore <
          bestTrial.solution.objectiveScore - SCORE_EPSILON ||
        (compareNumberWithTolerance(
          trialSolution.objectiveScore,
          bestTrial.solution.objectiveScore,
        ) === 0 && compareAdditions(addition, bestTrial.addition) < 0)
      ) {
        bestTrial = { addition, solution: trialSolution };
      }
    }
    if (bestTrial === null) {
      break;
    }
    assignments = bestTrial.solution.assignments.map((assignment) => ({
      foodCode: assignment.foodCode,
      food: assignment.food,
      slotSequence: assignment.slotSequence,
      slot: assignment.slot,
      selectionSource: assignment.selectionSource,
      ...(assignment.candidateIndex === undefined
        ? {}
        : { candidateIndex: assignment.candidateIndex }),
    }));
    solution = bestTrial.solution;
  }
  return solution;
}

function displayNutrients(nutrients) {
  return Object.fromEntries(NUTRIENTS.map(({ key }) => [
    key,
    roundForDisplay(nutrients[key]),
  ]));
}

function residualNutrients(actual, target) {
  return Object.fromEntries(NUTRIENTS.map(({ key }) => [
    key,
    actual[key] - target[key],
  ]));
}

// P1-B6: the relative residual is always shown next to the absolute one, so
// a meal 25% under on protein is never presented as "within tolerance"
// without qualification. Null when the target is zero or missing.
function relativeResidualNutrients(actual, target) {
  return Object.fromEntries(NUTRIENTS.map(({ key }) => [
    key,
    target[key] > 0
      ? Math.round(((actual[key] - target[key]) / target[key]) * 1000) / 1000
      : null,
  ]));
}

function withinTolerance(actual, target, tolerance) {
  return Object.fromEntries(NUTRIENTS.map(({ key }) => [
    key,
    Math.abs(actual[key] - target[key]) <= tolerance[key] + SCORE_EPSILON,
  ]));
}

function solvedItemOutput(assignment, grams) {
  return {
    food_code: assignment.foodCode,
    slot_sequence: assignment.slotSequence,
    slot: assignment.slot,
    selection_source: assignment.selectionSource,
    grams,
    nutrition: displayNutrients(nutritionAtGrams(assignment.food, grams)),
  };
}

function unavailableMealOutput(meal) {
  const target = targetNutrients(meal.target);
  const totals = zeroNutrients();
  const tolerance = toleranceForTarget(meal.target);
  const within = withinTolerance(totals, target, tolerance);
  return {
    output: {
      sequence: meal.sequence,
      role: meal.role,
      selected_pattern_code: null,
      target: structuredClone(meal.target),
      items: [],
      totals: displayNutrients(totals),
      residual: displayNutrients(residualNutrients(totals, target)),
      relative_residual: relativeResidualNutrients(totals, target),
      tolerance: displayNutrients(tolerance),
      within_tolerance: within,
      all_targets_within_tolerance: false,
      objective_score: null,
      issues: [structuredClone(NO_PATTERN_ISSUE)],
    },
    solved: false,
    outsideTolerance: false,
  };
}

// --- Single-food dominance split (Package 3, Stage D) ---
// A meal where one food carries the whole plate is not a meal a client will
// eat: 500 g of potato in one sitting, or 130 g of dry oats in one breakfast
// bowl. The optimizer cannot see this: it only minimizes nutrient error, and
// with a single-food slot (CARBOHYDRATE_BASE max_items = 1) the only way to
// reach a high carbohydrate target is one huge portion. This post-pass splits
// a dominant food with a second food from the SAME slot's own candidate list
// (foods already vetted for this client, meal, and pattern), and only when the
// split keeps every within-tolerance nutrient within tolerance — otherwise the
// original portion stands, because a large-but-whole meal is never traded for
// a broken one.
// Thresholds, and why they do not break the golden READY fixture:
// - Non-vegetable foods: over 400 g splits. Salads (NON_STARCH_VEGETABLE) are
//   exempt — a 400 g cucumber/tomato salad is normal. The fixture's largest
//   non-vegetable items are oats 150 g and rice 300 g, both under 400 g.
// - Dry grains: over 100 g dry splits ONLY when the grain also carries more
//   than 75% of the meal's carbohydrate target. The fixture's 150 g oats carry
//   ~103 g of a ~148 g carb target (~70%), so the genuine-need exception keeps
//   it whole; the problem breakfast's 130 g oats carry ~82% and split.
// - The partner search tries every same-slot candidate at every legal portion
//   and keeps the lowest objective score within tolerance (minus a 0.05 display
//   margin, so display rounding can never push a split meal outside tolerance).
// - A split adds a second item to a max_items = 1 slot. That is deliberate:
//   the slot shape is what forced the single huge portion. Nothing downstream
//   validates slot item counts (max_items is referenced only by the solver,
//   the pattern catalog, and food selection — never by preflight, the swap
//   engine, or any consumer of solver meals), so the split meal stays valid.
// - This is NOT a catalog cap: portion rules are untouched, so a genuinely
//   large meal (the fixture) still solves exactly as before.
const DOMINANCE_MAX_NON_VEGETABLE_G = 400;
const DOMINANCE_MAX_DRY_GRAIN_G = 100;
const DOMINANCE_MAX_CARB_SHARE = 0.75;
const DOMINANCE_TOLERANCE_MARGIN = 0.05;
// The only uncooked/dry starch in the catalog; cooked starches are wet weight,
// so a 100 g dry cap would be meaningless for them.
const DRY_GRAIN_CODES = new Set(["OATS_ROLLED_DRY"]);

// P1-B6: a dominant food that stands whole is never silent. The solver and
// the culinary splitter keep different shapes (computed portions vs template
// caps), so they are not forced into one function — but they share one rule:
// an oversized portion stands only with a warning. The solver side gains the
// culinary side's warning-on-unsplit, a DOMINANCE_UNSPLIT issue, and a
// user-facing split note on split items (culinary already has split_note_ar).
const DOMINANCE_SPLIT_NOTE_AR = "جزء من حصة الصنف في الوجبة، مقسومة على أكتر من صنف علشان الكمية تبقى معقولة في الطبق.";
const DOMINANCE_UNSPLIT_NOTE_AR = "حصة كبيرة في وجبة واحدة ولا يوجد بديل آمن لتقسيمها مع قيود العميل؛ راجع توزيع الوجبات أو زوّد عددها.";

function splitDominantSingleFoods(items, selectionMeal, itemsByCode, target, tolerance) {
  const inMeal = new Set(items.map((item) => item.food_code));
  const unsplit = [];
  let result = items;
  for (const original of items) {
    const food = itemsByCode.get(original.food_code)?.item;
    if (!food || food.food_class === "NON_STARCH_VEGETABLE") {
      continue;
    }
    const isDryGrain = DRY_GRAIN_CODES.has(original.food_code);
    const cap = isDryGrain
      ? DOMINANCE_MAX_DRY_GRAIN_G
      : DOMINANCE_MAX_NON_VEGETABLE_G;
    if (original.grams <= cap) {
      continue;
    }
    if (isDryGrain && target.carbohydrate_g > 0) {
      const carbShare = original.nutrition.carbohydrate_g / target.carbohydrate_g;
      if (carbShare <= DOMINANCE_MAX_CARB_SHARE) {
        continue;
      }
    }
    const slot = (selectionMeal.slots || [])
      .find((candidate) => candidate.sequence === original.slot_sequence);
    const partners = (slot?.candidate_food_codes || [])
      .filter((code) => code !== original.food_code && !inMeal.has(code))
      .map((code) => itemsByCode.get(code)?.item)
      .filter((candidate) =>
        candidate &&
        candidate.food_class === food.food_class &&
        candidate.is_active !== false);
    if (partners.length === 0) {
      unsplit.push({ food_code: original.food_code, grams: original.grams, cap, reason: "NO_PARTNER" });
      continue;
    }
    const current = result.find((item) => item.food_code === original.food_code);
    if (!current || current.grams <= cap) {
      continue;
    }
    // Gate: the split must never turn a within-tolerance nutrient into an
    // outside-tolerance one (minus a 0.05 display margin, so display rounding
    // can never push a split meal outside tolerance). Nutrients already
    // outside tolerance before the split (a meal already flagged for review,
    // e.g. a breakfast whose fiber target no breakfast starch can meet) are
    // not gated: the split does not change that meal's review status. Among
    // the splits that pass the gate, the lowest objective score wins.
    const beforeTotals = zeroNutrients();
    for (const item of result) {
      addNutrients(
        beforeTotals,
        nutritionAtGrams(itemsByCode.get(item.food_code)?.item, item.grams),
      );
    }
    const beforeWithin = withinTolerance(beforeTotals, target, tolerance);
    let best = null;
    for (const partner of partners) {
      for (const partnerGrams of legalGramValues(partner.portion_rule_g)) {
        const totals = zeroNutrients();
        for (const item of result) {
          if (item.food_code === original.food_code) {
            addNutrients(totals, nutritionAtGrams(food, cap));
          } else {
            addNutrients(
              totals,
              nutritionAtGrams(itemsByCode.get(item.food_code)?.item, item.grams),
            );
          }
        }
        addNutrients(totals, nutritionAtGrams(partner, partnerGrams));
        const preservesWithin = NUTRIENTS.every(({ key }) =>
          !beforeWithin[key] ||
          Math.abs(totals[key] - target[key]) <=
            tolerance[key] - DOMINANCE_TOLERANCE_MARGIN);
        if (!preservesWithin) {
          continue;
        }
        const score = objectiveScore(totals, target, tolerance);
        if (best === null || score < best.score - SCORE_EPSILON) {
          best = { partner, partnerGrams, score };
        }
      }
    }
    if (best === null) {
      unsplit.push({ food_code: original.food_code, grams: current.grams, cap, reason: "NO_PRESERVING_SPLIT" });
      continue;
    }
    const partnerItem = {
      ...solvedItemOutput(
        {
          food: best.partner,
          foodCode: best.partner.food_code,
          slotSequence: original.slot_sequence,
          slot: original.slot,
          selectionSource: SELECTION_SOURCE.PORTION_SOLVER_ADDITION,
        },
        best.partnerGrams,
      ),
      split_note_ar: DOMINANCE_SPLIT_NOTE_AR,
    };
    result = result.flatMap((item) =>
      item.food_code === original.food_code
        ? [{ ...item, grams: cap, nutrition: displayNutrients(nutritionAtGrams(food, cap)), split_note_ar: DOMINANCE_SPLIT_NOTE_AR }, partnerItem]
        : [item]);
    inMeal.add(best.partner.food_code);
  }
  if (unsplit.length > 0) {
    const unsplitByCode = new Map(unsplit.map((entry) => [entry.food_code, entry]));
    result = result.map((item) => {
      const entry = unsplitByCode.get(item.food_code);
      return entry && item.grams > entry.cap
        ? { ...item, dominance_warning_ar: DOMINANCE_UNSPLIT_NOTE_AR }
        : item;
    });
  }
  return { items: result, unsplit };
}

function solveMeal(meal, itemsByCode) {
  if (meal.selected_pattern_code === null) {
    return unavailableMealOutput(meal);
  }

  const solution = solveWithCandidateAdditions(meal, itemsByCode);
  const target = targetNutrients(meal.target);
  const tolerance = toleranceForTarget(meal.target);
  const split = splitDominantSingleFoods(
    solution.assignments.map((assignment) =>
      solvedItemOutput(
        assignment,
        solution.gramsByCode.get(assignment.foodCode),
      )),
    meal,
    itemsByCode,
    target,
    tolerance,
  );
  const items = split.items;
  const totals = zeroNutrients();
  for (const item of items) {
    addNutrients(
      totals,
      nutritionAtGrams(itemsByCode.get(item.food_code)?.item, item.grams),
    );
  }
  const within = withinTolerance(totals, target, tolerance);
  const outsideFields = NUTRIENTS
    .map(({ key }) => key)
    .filter((key) => !within[key]);
  const issues = [];
  if (outsideFields.length > 0) {
    issues.push({
      code: "PORTION_TARGET_OUTSIDE_TOLERANCE",
      fields: outsideFields,
      message: OUTSIDE_TOLERANCE_MESSAGE,
      relative_residual: relativeResidualNutrients(totals, target),
    });
  }
  if (split.unsplit.length > 0) {
    issues.push({
      code: "DOMINANCE_UNSPLIT",
      foods: split.unsplit.map(({ food_code, grams, cap, reason }) => ({ food_code, grams, cap, reason })),
      message: "A dominant portion stands whole because no safe split exists for it; review the meal distribution.",
    });
  }
  // P1-B6 (S3-29): a minimum portion that alone already breaks the meal's
  // tolerance is infeasible at this share — it must be flagged, never blessed.
  // A pattern change lives in food selection, not here; the flag is what stops
  // the silent pass.
  for (const item of items) {
    const rule = itemsByCode.get(item.food_code)?.item?.portion_rule_g;
    const minimumG = Number(rule?.minimum_g);
    if (!(minimumG > 0) || !(item.grams <= minimumG + 1e-6)) continue;
    const food = itemsByCode.get(item.food_code)?.item;
    if (!food) continue;
    const atMinimum = nutritionAtGrams(food, item.grams);
    const broken = NUTRIENTS
      .map(({ key }) => key)
      .filter((key) => atMinimum[key] > target[key] + tolerance[key] + SCORE_EPSILON);
    if (broken.length > 0) {
      issues.push({
        code: "MINIMUM_PORTION_INFEASIBLE",
        food_code: item.food_code,
        grams: item.grams,
        fields: broken,
        message: "This food at its minimum portion alone already breaks the meal's tolerance; the share needs a pattern change.",
      });
    }
  }

  return {
    output: {
      sequence: meal.sequence,
      role: meal.role,
      selected_pattern_code: meal.selected_pattern_code,
      target: structuredClone(meal.target),
      items,
      totals: displayNutrients(totals),
      residual: displayNutrients(
        residualNutrients(totals, target),
      ),
      relative_residual: relativeResidualNutrients(totals, target),
      tolerance: displayNutrients(tolerance),
      within_tolerance: within,
      all_targets_within_tolerance: outsideFields.length === 0,
      objective_score: roundForDisplay(
        objectiveScore(totals, target, tolerance),
      ),
      issues,
    },
    solved: true,
    outsideTolerance: outsideFields.length > 0,
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

function sumDisplayedMealField(meals, field) {
  return Object.fromEntries(NUTRIENTS.map(({ key }) => [
    key,
    roundForDisplay(meals.reduce(
      (total, meal) => total + meal[field][key],
      0,
    )),
  ]));
}

function dailyTarget(meals) {
  const totals = zeroNutrients();
  for (const meal of meals) {
    addNutrients(totals, targetNutrients(meal.target));
  }
  return displayNutrients(totals);
}

function makeOutput({
  selection,
  catalog,
  status,
  mealCount,
  meals,
  dailyTargetValue,
  dailyTotals,
  dailyResidual,
  reasonState,
}) {
  return {
    portion_solver_version: NUTRITION_PORTION_SOLVER_VERSION,
    source_food_selection_version: selection.food_selection_version,
    source_food_catalog_version: catalog.food_catalog_version,
    status,
    solver_policy:
      NutritionPortionSolverPolicy.Z_COACHING_PORTION_SOLVER_V1,
    meal_count: mealCount,
    meals,
    daily_target: dailyTargetValue,
    daily_totals: dailyTotals,
    daily_residual: dailyResidual,
    constraints: structuredClone(selection.constraints),
    reasons: reasonState.reasons,
  };
}

/**
 * Converts an approved food selection into deterministic legal gram portions.
 * It never reselects patterns or reapplies upstream food restrictions.
 *
 * @param {Object} inputs
 * @param {Object} inputs.nutritionFoodSelection
 * @param {Object} inputs.nutritionFoodCatalog
 * @returns {import("./domain/contracts.js").NutritionPortionSolver}
 */
export function buildNutritionPortionSolver(inputs) {
  requireObject(inputs, "inputs");
  const {
    nutritionFoodSelection: selection,
    nutritionFoodCatalog: catalog,
  } = inputs;

  const itemsByCode = validateCatalog(catalog);
  validateFoodSelection(selection, catalog, itemsByCode);
  const reasonState = cloneReasonsWithoutDuplicateCodes(selection.reasons);

  if (selection.status === NutritionFoodSelectionStatus.WITHHELD) {
    addReason(
      reasonState,
      "PORTION_SOLVER_WITHHELD_BY_FOOD_SELECTION_STATUS",
    );
    return finalize(makeOutput({
      selection,
      catalog,
      status: NutritionPortionSolverStatus.WITHHELD,
      mealCount: null,
      meals: [],
      dailyTargetValue: null,
      dailyTotals: null,
      dailyResidual: null,
      reasonState,
    }));
  }

  if (selection.meal_count === null) {
    addReason(reasonState, "PORTION_SOLVER_UPSTREAM_REVIEW_RETAINED");
    return finalize(makeOutput({
      selection,
      catalog,
      status: NutritionPortionSolverStatus.PROVISIONAL_REVIEW_REQUIRED,
      mealCount: null,
      meals: [],
      dailyTargetValue: null,
      dailyTotals: null,
      dailyResidual: null,
      reasonState,
    }));
  }

  const solvedMeals = selection.meals.map((meal) =>
    solveMeal(meal, itemsByCode));
  const meals = solvedMeals.map(({ output }) => output);
  const solverRan = solvedMeals.some(({ solved }) => solved);
  const hasUnavailableMeal = solvedMeals.some(({ solved }) => !solved);
  const hasOutsideTolerance = solvedMeals.some(
    ({ outsideTolerance }) => outsideTolerance,
  );

  if (solverRan) {
    addReason(reasonState, "PORTION_SOLVER_POLICY_APPLIED");
  }
  if (
    selection.status ===
    NutritionFoodSelectionStatus.PROVISIONAL_REVIEW_REQUIRED
  ) {
    addReason(reasonState, "PORTION_SOLVER_UPSTREAM_REVIEW_RETAINED");
  }
  if (hasOutsideTolerance) {
    addReason(
      reasonState,
      "PORTION_SOLVER_MEAL_TARGET_OUTSIDE_TOLERANCE",
    );
  }

  const dailyTargetValue = dailyTarget(meals);
  const dailyTotals = sumDisplayedMealField(meals, "totals");
  const dailyResidual = displayNutrients(
    residualNutrients(dailyTotals, dailyTargetValue),
  );
  const requiresReview =
    selection.status ===
      NutritionFoodSelectionStatus.PROVISIONAL_REVIEW_REQUIRED ||
    hasUnavailableMeal ||
    hasOutsideTolerance;

  return finalize(makeOutput({
    selection,
    catalog,
    status: requiresReview
      ? NutritionPortionSolverStatus.PROVISIONAL_REVIEW_REQUIRED
      : NutritionPortionSolverStatus.READY,
    mealCount: selection.meal_count,
    meals,
    dailyTargetValue,
    dailyTotals,
    dailyResidual,
    reasonState,
  }));
}
