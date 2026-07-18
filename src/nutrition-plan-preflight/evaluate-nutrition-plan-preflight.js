import {
  NUTRITION_FOOD_CATALOG_VERSION,
  NutritionFoodCatalogPolicy,
} from "../nutrition-food-catalog/index.js";
import {
  NUTRITION_FOOD_SELECTION_VERSION,
  NutritionFoodSelectionPolicy,
  NutritionFoodSelectionStatus,
} from "../nutrition-food-selection/index.js";
import {
  NUTRITION_PORTION_SOLVER_VERSION,
  NutritionPortionSolverPolicy,
  NutritionPortionSolverStatus,
} from "../nutrition-portion-solver/index.js";
import {
  NUTRITION_SWAP_ENGINE_VERSION,
  NutritionSwapEnginePolicy,
  NutritionSwapEngineStatus,
} from "../nutrition-swap-engine/index.js";
import {
  NUTRITION_MEAL_ASSEMBLY_BLUEPRINT_VERSION,
} from "../nutrition-meal-assembly-blueprint/index.js";
import {
  NUTRITION_PLANNING_SNAPSHOT_VERSION,
} from "../nutrition-planning-snapshot/index.js";
import { NUTRITION_PLAN_PREFLIGHT_VERSION } from "./domain/contracts.js";
import {
  NutritionPlanPreflightPolicy,
  NutritionPlanPreflightStatus,
} from "./domain/enums.js";

const NUTRIENTS = Object.freeze([
  Object.freeze({ key: "calories_kcal", targetKey: "planned_calories" }),
  Object.freeze({ key: "protein_g", targetKey: "protein_g" }),
  Object.freeze({ key: "fat_g", targetKey: "fat_g" }),
  Object.freeze({ key: "carbohydrate_g", targetKey: "carbohydrate_g" }),
  Object.freeze({ key: "fiber_g", targetKey: "fiber_g" }),
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

const CHECK_INDEX = new Map(
  CHECK_CODES.map((code, index) => [code, index]),
);

const CHECK_STATUS = Object.freeze({
  PASSED: "PASSED",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  WITHHELD: "WITHHELD",
});

const SOURCE_STAGE = Object.freeze({
  FOOD_SELECTION: "FOOD_SELECTION",
  PORTION_SOLVER: "PORTION_SOLVER",
  SWAP_ENGINE: "SWAP_ENGINE",
  PLAN_PREFLIGHT: "PLAN_PREFLIGHT",
});

const ISSUE_DEFINITIONS = Object.freeze({
  PREFLIGHT_MEAL_WITHOUT_SELECTED_PATTERN: Object.freeze({
    checkCode: "MEAL_PATTERN_COMPLETENESS",
    sourceStage: SOURCE_STAGE.FOOD_SELECTION,
    message: "The meal has no selected food pattern and cannot be fully preflighted.",
  }),
  PREFLIGHT_REJECTED_FOOD_SELECTED: Object.freeze({
    checkCode: "SELECTED_FOOD_INTEGRITY",
    sourceStage: SOURCE_STAGE.FOOD_SELECTION,
    message: "A food rejected by Food Selection appears in the solved meal.",
  }),
  PREFLIGHT_ILLEGAL_PORTION: Object.freeze({
    checkCode: "PORTION_LEGALITY",
    sourceStage: SOURCE_STAGE.PORTION_SOLVER,
    message: "A solved food amount does not satisfy its approved portion rule.",
  }),
  PREFLIGHT_PORTION_CALCULATION_MISMATCH: Object.freeze({
    checkCode: "PORTION_CALCULATION_INTEGRITY",
    sourceStage: SOURCE_STAGE.PORTION_SOLVER,
    message: "Reported Portion Solver nutrition differs from the catalog-based calculation.",
  }),
  PREFLIGHT_MEAL_TARGET_OUTSIDE_TOLERANCE: Object.freeze({
    checkCode: "MEAL_TARGET_CLOSURE",
    sourceStage: SOURCE_STAGE.PORTION_SOLVER,
    message: "One or more raw meal nutrition totals are outside the Portion Solver tolerance.",
  }),
  PREFLIGHT_DAILY_TARGET_OUTSIDE_TOLERANCE: Object.freeze({
    checkCode: "DAILY_TARGET_CLOSURE",
    sourceStage: SOURCE_STAGE.PLAN_PREFLIGHT,
    message: "One or more raw daily nutrition totals are outside the daily tolerance.",
  }),
  PREFLIGHT_UNSAFE_SWAP: Object.freeze({
    checkCode: "SWAP_SAFETY",
    sourceStage: SOURCE_STAGE.SWAP_ENGINE,
    message: "A proposed food swap does not satisfy the approved safety contract.",
  }),
});

const REASON_MESSAGES = Object.freeze({
  PREFLIGHT_POLICY_APPLIED:
    "The final nutrition plan was checked using Z Coaching Nutrition Preflight V1.",
  PREFLIGHT_WITHHELD_BY_UPSTREAM_STATUS:
    "Nutrition preflight was withheld because all upstream nutrition stages are withheld.",
  PREFLIGHT_UPSTREAM_REVIEW_RETAINED:
    "An upstream nutrition review requirement was retained by preflight.",
  PREFLIGHT_REVIEW_REQUIRED:
    "One or more nutrition preflight checks require review by the responsible stage.",
});

const PORTION_RULE_FIELDS = Object.freeze([
  "minimum_g",
  "maximum_g",
  "step_g",
  "default_g",
]);

const DISPLAY_TOLERANCE = 0.01;
const FLOAT_EPSILON = 1e-12;
const CANONICAL_ID = /^[A-Z][A-Z0-9_]*$/;

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

function requireKnownValue(value, values, path) {
  if (!values.includes(value)) {
    throw new TypeError(`${path} has an unknown value.`);
  }
}

function requireFinite(value, path) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${path} must be a finite number.`);
  }
}

function requireFiniteNonNegative(value, path) {
  requireFinite(value, path);
  if (value < 0) {
    throw new TypeError(`${path} must be non-negative.`);
  }
}

function requireFinitePositive(value, path) {
  requireFinite(value, path);
  if (value <= 0) {
    throw new TypeError(`${path} must be positive.`);
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

function validateReasonLikeArray(value, path) {
  requireArray(value, path);
  value.forEach((entry, index) => {
    const entryPath = `${path}[${index}]`;
    requireObject(entry, entryPath);
    requireNonEmptyString(entry.code, `${entryPath}.code`);
    requireNonEmptyString(entry.message, `${entryPath}.message`);
  });
}

function validateNutrients(value, path, { nonNegative = false } = {}) {
  requireObject(value, path);
  for (const { key } of NUTRIENTS) {
    if (nonNegative) {
      requireFiniteNonNegative(value[key], `${path}.${key}`);
    } else {
      requireFinite(value[key], `${path}.${key}`);
    }
  }
}

function validateTarget(value, path) {
  requireObject(value, path);
  for (const { targetKey } of NUTRIENTS) {
    requireFiniteNonNegative(value[targetKey], `${path}.${targetKey}`);
  }
}

function validateTolerance(value, path) {
  requireObject(value, path);
  for (const { key } of NUTRIENTS) {
    requireFinitePositive(value[key], `${path}.${key}`);
  }
}

function validateWithinTolerance(value, path) {
  requireObject(value, path);
  for (const { key } of NUTRIENTS) {
    if (typeof value[key] !== "boolean") {
      throw new TypeError(`${path}.${key} must be a boolean.`);
    }
  }
}

function validatePortionRule(value, path) {
  requireObject(value, path);
  for (const field of PORTION_RULE_FIELDS) {
    if (!Number.isSafeInteger(value[field]) || value[field] <= 0) {
      throw new TypeError(`${path}.${field} must be a positive safe integer.`);
    }
  }
  if (
    value.minimum_g > value.default_g ||
    value.default_g > value.maximum_g
  ) {
    throw new TypeError(
      `${path} must satisfy minimum_g <= default_g <= maximum_g.`,
    );
  }
  if ((value.default_g - value.minimum_g) % value.step_g !== 0) {
    throw new TypeError(
      `${path}.default_g must align to step_g from minimum_g.`,
    );
  }
  if ((value.maximum_g - value.minimum_g) % value.step_g !== 0) {
    throw new TypeError(
      `${path}.maximum_g must align to step_g from minimum_g.`,
    );
  }
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

function sameSet(left, right) {
  return left.size === right.size && [...left].every((entry) => right.has(entry));
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
  if (
    !Number.isInteger(catalog.items_count) ||
    catalog.items_count !== catalog.items.length
  ) {
    throw new TypeError("nutritionFoodCatalog.items_count must match items.");
  }

  const itemsByCode = new Map();
  const expectedGroups = new Map();
  let activeCount = 0;
  catalog.items.forEach((item, index) => {
    const path = `nutritionFoodCatalog.items[${index}]`;
    requireObject(item, path);
    requireCanonicalId(item.food_code, `${path}.food_code`);
    if (itemsByCode.has(item.food_code)) {
      throw new TypeError(
        `nutritionFoodCatalog contains duplicate food_code ${item.food_code}.`,
      );
    }
    requireNonEmptyString(item.food_class, `${path}.food_class`);
    if (typeof item.is_active !== "boolean") {
      throw new TypeError(`${path}.is_active must be a boolean.`);
    }
    if (item.is_active) {
      activeCount += 1;
    }
    validateNutrients(item.nutrition_per_100g,
      `${path}.nutrition_per_100g`, { nonNegative: true });
    const nutritionMaximums = {
      calories_kcal: 1000,
      protein_g: 100,
      fat_g: 100,
      carbohydrate_g: 100,
      fiber_g: 100,
    };
    for (const { key } of NUTRIENTS) {
      if (item.nutrition_per_100g[key] > nutritionMaximums[key]) {
        throw new TypeError(
          `${path}.nutrition_per_100g.${key} exceeds the catalog maximum.`,
        );
      }
    }
    if (NUTRIENTS.every(({ key }) => item.nutrition_per_100g[key] === 0)) {
      throw new TypeError(
        `${path}.nutrition_per_100g must contain at least one positive value.`,
      );
    }
    validatePortionRule(item.portion_rule_g, `${path}.portion_rule_g`);
    requireObject(item.swap, `${path}.swap`);
    if (typeof item.swap.is_swappable !== "boolean") {
      throw new TypeError(`${path}.swap.is_swappable must be a boolean.`);
    }
    if (item.swap.is_swappable) {
      requireCanonicalId(item.swap.group_code, `${path}.swap.group_code`);
    } else if (item.swap.group_code !== null) {
      throw new TypeError(
        `${path}.swap.group_code must be null when is_swappable is false.`,
      );
    }
    itemsByCode.set(item.food_code, item);

    if (item.is_active && item.swap.is_swappable) {
      const expected = expectedGroups.get(item.swap.group_code) ?? {
        foodClass: item.food_class,
        activeCodes: new Set(),
      };
      if (expected.foodClass !== item.food_class) {
        throw new TypeError(
          `Swap group ${item.swap.group_code} must contain one food_class.`,
        );
      }
      expected.activeCodes.add(item.food_code);
      expectedGroups.set(item.swap.group_code, expected);
    }
  });

  if (
    !Number.isInteger(catalog.active_items_count) ||
    catalog.active_items_count !== activeCount
  ) {
    throw new TypeError(
      "nutritionFoodCatalog.active_items_count must match active items.",
    );
  }

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
    requireUniqueStringArray(group.active_item_codes,
      `${path}.active_item_codes`);
    if (group.active_item_codes.length < 2) {
      throw new TypeError(
        `${path}.active_item_codes must contain at least two foods.`,
      );
    }
    const expected = expectedGroups.get(group.group_code);
    if (
      !expected ||
      expected.foodClass !== group.food_class ||
      !sameSet(new Set(group.active_item_codes), expected.activeCodes)
    ) {
      throw new TypeError(`${path} does not match active catalog items.`);
    }
    groupsByCode.set(group.group_code, group);
  });
  if (groupsByCode.size !== expectedGroups.size) {
    throw new TypeError(
      "nutritionFoodCatalog.swap_groups must match active swappable foods.",
    );
  }

  return { itemsByCode, groupsByCode };
}

function targetsEqual(left, right) {
  return NUTRIENTS.every(({ targetKey }) =>
    left[targetKey] === right[targetKey]);
}

function validateSelection(selection, catalog, itemsByCode) {
  requireObject(selection, "nutritionFoodSelection");
  if (selection.food_selection_version !== NUTRITION_FOOD_SELECTION_VERSION) {
    throw new TypeError(
      `nutritionFoodSelection.food_selection_version must equal ${NUTRITION_FOOD_SELECTION_VERSION}.`,
    );
  }
  if (
    selection.selection_policy !==
    NutritionFoodSelectionPolicy.Z_COACHING_FOOD_SELECTION_V1
  ) {
    throw new TypeError(
      "nutritionFoodSelection.selection_policy must equal Z_COACHING_FOOD_SELECTION_V1.",
    );
  }
  if (
    selection.source_snapshot_version !==
    NUTRITION_PLANNING_SNAPSHOT_VERSION
  ) {
    throw new TypeError(
      `nutritionFoodSelection.source_snapshot_version must equal ${NUTRITION_PLANNING_SNAPSHOT_VERSION}.`,
    );
  }
  if (
    selection.source_assembly_blueprint_version !==
    NUTRITION_MEAL_ASSEMBLY_BLUEPRINT_VERSION
  ) {
    throw new TypeError(
      `nutritionFoodSelection.source_assembly_blueprint_version must equal ${NUTRITION_MEAL_ASSEMBLY_BLUEPRINT_VERSION}.`,
    );
  }
  requireKnownValue(
    selection.status,
    Object.values(NutritionFoodSelectionStatus),
    "nutritionFoodSelection.status",
  );
  if (selection.source_food_catalog_version !== catalog.food_catalog_version) {
    throw new TypeError(
      "nutritionFoodSelection.source_food_catalog_version must match the catalog.",
    );
  }
  validateMealCountContainer(selection, "nutritionFoodSelection");
  requireArray(selection.constraints, "nutritionFoodSelection.constraints");
  validateReasonLikeArray(selection.reasons, "nutritionFoodSelection.reasons");
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
    validateReasonLikeArray(meal.issues, `${path}.issues`);

    const slotsBySequence = new Map();
    meal.slots.forEach((slot, slotIndex) => {
      const slotPath = `${path}.slots[${slotIndex}]`;
      requireObject(slot, slotPath);
      if (!Number.isInteger(slot.sequence) || slot.sequence !== slotIndex + 1) {
        throw new TypeError(
          `${path} slot sequence must start at 1 and be contiguous.`,
        );
      }
      requireNonEmptyString(slot.slot, `${slotPath}.slot`);
      requireUniqueStringArray(slot.selected_food_codes,
        `${slotPath}.selected_food_codes`);
      requireUniqueStringArray(slot.candidate_food_codes,
        `${slotPath}.candidate_food_codes`);
      for (const foodCode of slot.candidate_food_codes) {
        if (!itemsByCode.has(foodCode)) {
          throw new TypeError(
            `${slotPath}.candidate_food_codes contains missing food ${foodCode}.`,
          );
        }
      }
      requireArray(slot.rejected_foods, `${slotPath}.rejected_foods`);
      const rejectedCodes = new Set();
      slot.rejected_foods.forEach((rejected, rejectedIndex) => {
        const rejectedPath = `${slotPath}.rejected_foods[${rejectedIndex}]`;
        requireObject(rejected, rejectedPath);
        requireCanonicalId(rejected.food_code, `${rejectedPath}.food_code`);
        if (rejectedCodes.has(rejected.food_code)) {
          throw new TypeError(
            `${slotPath}.rejected_foods cannot repeat food_code.`,
          );
        }
        rejectedCodes.add(rejected.food_code);
        requireUniqueStringArray(rejected.reason_codes,
          `${rejectedPath}.reason_codes`);
      });
      slotsBySequence.set(slot.sequence, { slot, rejectedCodes });
    });

    return { meal, slotsBySequence };
  });
}

function validateDailyObjects(portionSolver) {
  const fields = ["daily_target", "daily_totals", "daily_residual"];
  if (portionSolver.meal_count === null) {
    if (fields.some((field) => portionSolver[field] !== null)) {
      throw new TypeError(
        "A Portion Solver without meals must keep daily values null.",
      );
    }
    return;
  }
  validateNutrients(portionSolver.daily_target,
    "nutritionPortionSolver.daily_target", { nonNegative: true });
  validateNutrients(portionSolver.daily_totals,
    "nutritionPortionSolver.daily_totals", { nonNegative: true });
  validateNutrients(portionSolver.daily_residual,
    "nutritionPortionSolver.daily_residual");
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
  if (
    portionSolver.solver_policy !==
    NutritionPortionSolverPolicy.Z_COACHING_PORTION_SOLVER_V1
  ) {
    throw new TypeError(
      "nutritionPortionSolver.solver_policy must equal Z_COACHING_PORTION_SOLVER_V1.",
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
      "nutritionPortionSolver.source_food_selection_version must match Food Selection.",
    );
  }
  if (portionSolver.source_food_catalog_version !== catalog.food_catalog_version) {
    throw new TypeError(
      "nutritionPortionSolver.source_food_catalog_version must match the catalog.",
    );
  }
  validateMealCountContainer(portionSolver, "nutritionPortionSolver");
  if (portionSolver.meal_count !== selection.meal_count) {
    throw new TypeError(
      "Food Selection and Portion Solver meal_count values must match.",
    );
  }
  requireArray(portionSolver.constraints, "nutritionPortionSolver.constraints");
  validateReasonLikeArray(portionSolver.reasons,
    "nutritionPortionSolver.reasons");
  validateDailyObjects(portionSolver);

  const withheldSelection =
    selection.status === NutritionFoodSelectionStatus.WITHHELD;
  const withheldPortion =
    portionSolver.status === NutritionPortionSolverStatus.WITHHELD;
  if (withheldSelection !== withheldPortion) {
    throw new TypeError(
      "Food Selection and Portion Solver withheld statuses must agree.",
    );
  }
  if (
    selection.status ===
      NutritionFoodSelectionStatus.PROVISIONAL_REVIEW_REQUIRED &&
    portionSolver.status !==
      NutritionPortionSolverStatus.PROVISIONAL_REVIEW_REQUIRED
  ) {
    throw new TypeError(
      "A provisional Food Selection requires a provisional Portion Solver.",
    );
  }
  if (
    selection.status === NutritionFoodSelectionStatus.READY &&
    ![
      NutritionPortionSolverStatus.READY,
      NutritionPortionSolverStatus.PROVISIONAL_REVIEW_REQUIRED,
    ].includes(portionSolver.status)
  ) {
    throw new TypeError(
      "A READY Food Selection must produce READY or provisional portions.",
    );
  }

  return portionSolver.meals.map((meal, mealIndex) => {
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
      meal.role !== selectionMeal.meal.role ||
      meal.selected_pattern_code !== selectionMeal.meal.selected_pattern_code
    ) {
      throw new TypeError(
        `${path} must match Food Selection sequence, role, and selected_pattern_code.`,
      );
    }
    requireNonEmptyString(meal.role, `${path}.role`);
    validateTarget(meal.target, `${path}.target`);
    if (!targetsEqual(meal.target, selectionMeal.meal.target)) {
      throw new TypeError(`${path}.target must match Food Selection target.`);
    }
    requireArray(meal.items, `${path}.items`);
    validateNutrients(meal.totals, `${path}.totals`, { nonNegative: true });
    validateNutrients(meal.residual, `${path}.residual`);
    validateTolerance(meal.tolerance, `${path}.tolerance`);
    validateWithinTolerance(meal.within_tolerance,
      `${path}.within_tolerance`);
    if (typeof meal.all_targets_within_tolerance !== "boolean") {
      throw new TypeError(
        `${path}.all_targets_within_tolerance must be a boolean.`,
      );
    }
    if (
      meal.objective_score !== null &&
      (typeof meal.objective_score !== "number" ||
        !Number.isFinite(meal.objective_score) ||
        meal.objective_score < 0)
    ) {
      throw new TypeError(
        `${path}.objective_score must be null or a finite non-negative number.`,
      );
    }
    validateReasonLikeArray(meal.issues, `${path}.issues`);

    const usedFoodCodes = new Set();
    const itemMetadata = meal.items.map((item, itemIndex) => {
      const itemPath = `${path}.items[${itemIndex}]`;
      requireObject(item, itemPath);
      requireCanonicalId(item.food_code, `${itemPath}.food_code`);
      if (usedFoodCodes.has(item.food_code)) {
        throw new TypeError(`${path} cannot contain duplicate food_code.`);
      }
      usedFoodCodes.add(item.food_code);
      const food = itemsByCode.get(item.food_code);
      if (!food) {
        throw new TypeError(
          `${itemPath}.food_code must exist exactly once in the catalog.`,
        );
      }
      if (!Number.isInteger(item.slot_sequence)) {
        throw new TypeError(`${itemPath}.slot_sequence must be an integer.`);
      }
      const slotMetadata = selectionMeal.slotsBySequence.get(
        item.slot_sequence,
      );
      if (!slotMetadata || item.slot !== slotMetadata.slot.slot) {
        throw new TypeError(
          `${itemPath} must match an existing Food Selection slot.`,
        );
      }
      if (
        !slotMetadata.slot.candidate_food_codes.includes(item.food_code) &&
        !slotMetadata.rejectedCodes.has(item.food_code)
      ) {
        throw new TypeError(
          `${itemPath}.food_code must be an approved candidate for its slot.`,
        );
      }
      requireKnownValue(
        item.selection_source,
        ["FOOD_SELECTION", "PORTION_SOLVER_ADDITION"],
        `${itemPath}.selection_source`,
      );
      validateNutrients(item.nutrition, `${itemPath}.nutrition`);
      return { item, food, slotMetadata, itemPath };
    });

    return { meal, selectionMeal, itemMetadata, usedFoodCodes };
  });
}

function validateSwapAlternative(alternative, path) {
  requireObject(alternative, path);
  requireCanonicalId(alternative.food_code, `${path}.food_code`);
  validateNutrients(alternative.nutrition, `${path}.nutrition`);
  validateNutrients(alternative.projected_meal_totals,
    `${path}.projected_meal_totals`);
  validateNutrients(alternative.projected_meal_residual,
    `${path}.projected_meal_residual`);
  validateWithinTolerance(alternative.projected_within_tolerance,
    `${path}.projected_within_tolerance`);
  if (
    typeof alternative.objective_score !== "number" ||
    !Number.isFinite(alternative.objective_score) ||
    alternative.objective_score < 0
  ) {
    throw new TypeError(
      `${path}.objective_score must be a finite non-negative number.`,
    );
  }
}

function validateSwapEngine({
  swapEngine,
  selection,
  portionSolver,
  catalog,
  portionMeals,
  itemsByCode,
}) {
  requireObject(swapEngine, "nutritionSwapEngine");
  if (swapEngine.swap_engine_version !== NUTRITION_SWAP_ENGINE_VERSION) {
    throw new TypeError(
      `nutritionSwapEngine.swap_engine_version must equal ${NUTRITION_SWAP_ENGINE_VERSION}.`,
    );
  }
  if (
    swapEngine.swap_policy !==
    NutritionSwapEnginePolicy.Z_COACHING_SWAP_ENGINE_V1
  ) {
    throw new TypeError(
      "nutritionSwapEngine.swap_policy must equal Z_COACHING_SWAP_ENGINE_V1.",
    );
  }
  requireKnownValue(
    swapEngine.status,
    Object.values(NutritionSwapEngineStatus),
    "nutritionSwapEngine.status",
  );
  if (
    swapEngine.source_food_selection_version !==
      selection.food_selection_version ||
    swapEngine.source_portion_solver_version !==
      portionSolver.portion_solver_version ||
    swapEngine.source_food_catalog_version !== catalog.food_catalog_version
  ) {
    throw new TypeError(
      "nutritionSwapEngine source versions must match the supplied stages.",
    );
  }
  validateMealCountContainer(swapEngine, "nutritionSwapEngine");
  if (swapEngine.meal_count !== portionSolver.meal_count) {
    throw new TypeError(
      "Portion Solver and Swap Engine meal_count values must match.",
    );
  }
  if (swapEngine.status !== portionSolver.status) {
    throw new TypeError(
      "Swap Engine status must match Portion Solver status.",
    );
  }
  requireArray(swapEngine.constraints, "nutritionSwapEngine.constraints");
  validateReasonLikeArray(swapEngine.reasons, "nutritionSwapEngine.reasons");

  return swapEngine.meals.map((meal, mealIndex) => {
    const path = `nutritionSwapEngine.meals[${mealIndex}]`;
    const portionMetadata = portionMeals[mealIndex];
    requireObject(meal, path);
    if (
      meal.sequence !== portionMetadata.meal.sequence ||
      meal.role !== portionMetadata.meal.role ||
      meal.selected_pattern_code !==
        portionMetadata.meal.selected_pattern_code
    ) {
      throw new TypeError(
        `${path} must match Portion Solver sequence, role, and selected_pattern_code.`,
      );
    }
    requireArray(meal.items, `${path}.items`);
    validateReasonLikeArray(meal.issues, `${path}.issues`);
    if (meal.items.length !== portionMetadata.itemMetadata.length) {
      throw new TypeError(`${path}.items must match Portion Solver items.`);
    }

    const itemMetadata = meal.items.map((item, itemIndex) => {
      const itemPath = `${path}.items[${itemIndex}]`;
      const portionItemMetadata = portionMetadata.itemMetadata[itemIndex];
      requireObject(item, itemPath);
      if (
        item.food_code !== portionItemMetadata.item.food_code ||
        item.grams !== portionItemMetadata.item.grams
      ) {
        throw new TypeError(
          `${itemPath} must preserve Portion Solver food_code and grams.`,
        );
      }
      if (typeof item.is_swappable !== "boolean") {
        throw new TypeError(`${itemPath}.is_swappable must be a boolean.`);
      }
      const food = itemsByCode.get(item.food_code);
      const expectedGroup = food.swap.is_swappable
        ? food.swap.group_code
        : null;
      if (
        item.is_swappable !== food.swap.is_swappable ||
        item.group_code !== expectedGroup
      ) {
        throw new TypeError(
          `${itemPath} swap metadata must match the catalog food.`,
        );
      }
      requireArray(item.alternatives, `${itemPath}.alternatives`);
      validateReasonLikeArray(item.issues, `${itemPath}.issues`);
      item.alternatives.forEach((alternative, alternativeIndex) =>
        validateSwapAlternative(
          alternative,
          `${itemPath}.alternatives[${alternativeIndex}]`,
        ));
      return { item, portionItemMetadata };
    });
    return { meal, portionMetadata, itemMetadata };
  });
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
  if (typeof grams !== "number" || !Number.isFinite(grams)) {
    return null;
  }
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

function subtractNutrients(actual, target) {
  return Object.fromEntries(NUTRIENTS.map(({ key }) => [
    key,
    actual[key] - target[key],
  ]));
}

function projectedTotals({
  mealTotals,
  originalNutrition,
  alternativeNutrition,
}) {
  return Object.fromEntries(NUTRIENTS.map(({ key }) => [
    key,
    mealTotals[key] - originalNutrition[key] + alternativeNutrition[key],
  ]));
}

function isLegalGrams(grams, portionRule) {
  return Number.isSafeInteger(grams) &&
    grams >= portionRule.minimum_g &&
    grams <= portionRule.maximum_g &&
    (grams - portionRule.minimum_g) % portionRule.step_g === 0;
}

function displayMismatchFields(reported, expected) {
  return NUTRIENTS
    .map(({ key }) => key)
    .filter((key) =>
      Math.abs(reported[key] - expected[key]) >
      DISPLAY_TOLERANCE + FLOAT_EPSILON);
}

function toleranceResult(actual, target, tolerance) {
  return Object.fromEntries(NUTRIENTS.map(({ key }) => [
    key,
    Math.abs(actual[key] - target[key]) <=
      tolerance[key] + FLOAT_EPSILON,
  ]));
}

function failedToleranceFields(result) {
  return NUTRIENTS
    .map(({ key }) => key)
    .filter((key) => !result[key]);
}

function objectiveScore(actual, target, tolerance) {
  const weights = {
    calories_kcal: 3,
    protein_g: 4,
    fat_g: 2,
    carbohydrate_g: 2,
    fiber_g: 1,
  };
  return NUTRIENTS.reduce((score, { key }) => {
    const normalized = Math.abs(actual[key] - target[key]) / tolerance[key];
    return score + weights[key] * normalized ** 2;
  }, 0);
}

function dailyTolerance(target) {
  return {
    calories_kcal: Math.max(50, target.calories_kcal * 0.1),
    protein_g: Math.max(5, target.protein_g * 0.15),
    fat_g: Math.max(5, target.fat_g * 0.2),
    carbohydrate_g: Math.max(10, target.carbohydrate_g * 0.15),
    fiber_g: Math.max(3, target.fiber_g * 0.25),
  };
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function fieldRank(field) {
  const nutrientIndex = NUTRIENTS.findIndex(({ key }) => key === field);
  return nutrientIndex === -1 ? NUTRIENTS.length : nutrientIndex;
}

function sortFields(fields) {
  return [...new Set(fields)].sort((left, right) =>
    fieldRank(left) - fieldRank(right) || compareText(left, right));
}

function createIssueState() {
  return { entries: new Map(), forcedReviewChecks: new Set() };
}

function addIssue(
  issueState,
  code,
  { mealSequence = null, foodCode = null, fields = [] } = {},
) {
  const definition = ISSUE_DEFINITIONS[code];
  const key = [
    definition.checkCode,
    mealSequence ?? "NULL",
    foodCode ?? "NULL",
    code,
  ].join("|");
  const existing = issueState.entries.get(key);
  if (existing) {
    existing.issue.fields = sortFields([
      ...existing.issue.fields,
      ...fields,
    ]);
    return;
  }
  issueState.entries.set(key, {
    checkCode: definition.checkCode,
    issue: {
      code,
      source_stage: definition.sourceStage,
      meal_sequence: mealSequence,
      food_code: foodCode,
      fields: sortFields(fields),
      message: definition.message,
    },
  });
}

function compareNullableNumber(left, right) {
  const leftValue = left === null ? Number.POSITIVE_INFINITY : left;
  const rightValue = right === null ? Number.POSITIVE_INFINITY : right;
  return leftValue - rightValue;
}

function compareNullableText(left, right) {
  if (left === null && right === null) {
    return 0;
  }
  if (left === null) {
    return 1;
  }
  if (right === null) {
    return -1;
  }
  return compareText(left, right);
}

function sortedIssueEntries(issueState) {
  return [...issueState.entries.values()].sort((left, right) =>
    CHECK_INDEX.get(left.checkCode) - CHECK_INDEX.get(right.checkCode) ||
    compareNullableNumber(
      left.issue.meal_sequence,
      right.issue.meal_sequence,
    ) ||
    compareNullableText(left.issue.food_code, right.issue.food_code) ||
    compareText(left.issue.code, right.issue.code));
}

function auditMealPatterns(selectionMeals, issueState) {
  for (const { meal } of selectionMeals) {
    if (meal.selected_pattern_code === null) {
      addIssue(issueState, "PREFLIGHT_MEAL_WITHOUT_SELECTED_PATTERN", {
        mealSequence: meal.sequence,
        fields: ["selected_pattern_code"],
      });
      issueState.forcedReviewChecks.add("MEAL_TARGET_CLOSURE");
      issueState.forcedReviewChecks.add("DAILY_TARGET_CLOSURE");
    }
  }
}

function auditSelectedFoodIntegrity(portionMeals, issueState) {
  for (const { meal, itemMetadata } of portionMeals) {
    for (const { item, slotMetadata } of itemMetadata) {
      if (slotMetadata.rejectedCodes.has(item.food_code)) {
        addIssue(issueState, "PREFLIGHT_REJECTED_FOOD_SELECTED", {
          mealSequence: meal.sequence,
          foodCode: item.food_code,
          fields: ["food_code"],
        });
      }
    }
  }
}

function auditPortionLegality(portionMeals, issueState) {
  for (const { meal, itemMetadata } of portionMeals) {
    for (const { item, food } of itemMetadata) {
      if (!isLegalGrams(item.grams, food.portion_rule_g)) {
        addIssue(issueState, "PREFLIGHT_ILLEGAL_PORTION", {
          mealSequence: meal.sequence,
          foodCode: item.food_code,
          fields: ["grams"],
        });
        if (typeof item.grams !== "number" || !Number.isFinite(item.grams)) {
          issueState.forcedReviewChecks.add(
            "PORTION_CALCULATION_INTEGRITY",
          );
          issueState.forcedReviewChecks.add("MEAL_TARGET_CLOSURE");
          issueState.forcedReviewChecks.add("DAILY_TARGET_CLOSURE");
        }
      }
    }
  }
}

function mealAnalysis(portionMealMetadata) {
  const rawTotals = zeroNutrients();
  const rawItems = new Map();
  for (const { item, food } of portionMealMetadata.itemMetadata) {
    const rawNutrition = nutritionAtGrams(food, item.grams);
    if (rawNutrition === null) {
      return {
        calculable: false,
        rawTotals: null,
        rawItems,
        target: targetNutrients(portionMealMetadata.meal.target),
        expectedWithin: null,
        rawClosed: false,
      };
    }
    rawItems.set(item.food_code, rawNutrition);
    addNutrients(rawTotals, rawNutrition);
  }
  const target = targetNutrients(portionMealMetadata.meal.target);
  const expectedWithin = toleranceResult(
    rawTotals,
    target,
    portionMealMetadata.meal.tolerance,
  );
  return {
    calculable: true,
    rawTotals,
    rawItems,
    target,
    expectedWithin,
    rawClosed: Object.values(expectedWithin).every(Boolean),
  };
}

function auditPortionCalculations({
  portionSolver,
  portionMeals,
  issueState,
}) {
  const analyses = portionMeals.map(mealAnalysis);
  portionMeals.forEach((metadata, mealIndex) => {
    const { meal, itemMetadata } = metadata;
    const analysis = analyses[mealIndex];
    if (!analysis.calculable) {
      return;
    }

    for (const { item } of itemMetadata) {
      const mismatchFields = displayMismatchFields(
        item.nutrition,
        analysis.rawItems.get(item.food_code),
      );
      if (mismatchFields.length > 0) {
        addIssue(
          issueState,
          "PREFLIGHT_PORTION_CALCULATION_MISMATCH",
          {
            mealSequence: meal.sequence,
            foodCode: item.food_code,
            fields: mismatchFields,
          },
        );
      }
    }

    const mealMismatchFields = [
      ...displayMismatchFields(meal.totals, analysis.rawTotals),
      ...displayMismatchFields(
        meal.residual,
        subtractNutrients(analysis.rawTotals, analysis.target),
      ),
      ...NUTRIENTS
        .map(({ key }) => key)
        .filter((key) =>
          meal.within_tolerance[key] !== analysis.expectedWithin[key]),
    ];
    const expectedAllWithin = Object.values(analysis.expectedWithin)
      .every(Boolean);
    if (meal.all_targets_within_tolerance !== expectedAllWithin) {
      mealMismatchFields.push(
        ...NUTRIENTS
          .map(({ key }) => key)
          .filter((key) => !analysis.expectedWithin[key]),
      );
      if (mealMismatchFields.length === 0) {
        mealMismatchFields.push("all_targets_within_tolerance");
      }
    }
    if (mealMismatchFields.length > 0) {
      addIssue(
        issueState,
        "PREFLIGHT_PORTION_CALCULATION_MISMATCH",
        { mealSequence: meal.sequence, fields: mealMismatchFields },
      );
    }
  });

  if (
    portionSolver.meal_count !== null &&
    analyses.every((analysis) => analysis.calculable)
  ) {
    const rawDaily = analyses.reduce(
      (total, analysis) => addNutrients(total, analysis.rawTotals),
      zeroNutrients(),
    );
    const expectedDailyResidual = subtractNutrients(
      rawDaily,
      portionSolver.daily_target,
    );
    const dailyMismatchFields = [
      ...displayMismatchFields(portionSolver.daily_totals, rawDaily),
      ...displayMismatchFields(
        portionSolver.daily_residual,
        expectedDailyResidual,
      ),
    ];
    if (dailyMismatchFields.length > 0) {
      addIssue(
        issueState,
        "PREFLIGHT_PORTION_CALCULATION_MISMATCH",
        { fields: dailyMismatchFields },
      );
    }
    return { analyses, rawDaily };
  }
  return { analyses, rawDaily: null };
}

function auditTargetClosure({
  selectionMeals,
  portionSolver,
  portionMeals,
  analyses,
  rawDaily,
  issueState,
}) {
  portionMeals.forEach(({ meal }, mealIndex) => {
    const analysis = analyses[mealIndex];
    if (
      !analysis.calculable ||
      selectionMeals[mealIndex].meal.selected_pattern_code === null
    ) {
      return;
    }
    const failedFields = failedToleranceFields(analysis.expectedWithin);
    if (failedFields.length > 0) {
      addIssue(
        issueState,
        "PREFLIGHT_MEAL_TARGET_OUTSIDE_TOLERANCE",
        { mealSequence: meal.sequence, fields: failedFields },
      );
    }
  });

  if (
    portionSolver.meal_count === null ||
    rawDaily === null ||
    selectionMeals.some(({ meal }) => meal.selected_pattern_code === null)
  ) {
    return;
  }
  const dailyWithin = toleranceResult(
    rawDaily,
    portionSolver.daily_target,
    dailyTolerance(portionSolver.daily_target),
  );
  const failedFields = failedToleranceFields(dailyWithin);
  if (failedFields.length > 0) {
    addIssue(
      issueState,
      "PREFLIGHT_DAILY_TARGET_OUTSIDE_TOLERANCE",
      { fields: failedFields },
    );
  }
}

function auditSwapSafety({
  swapMeals,
  analyses,
  itemsByCode,
  groupsByCode,
  issueState,
}) {
  swapMeals.forEach((swapMetadata, mealIndex) => {
    const { meal, portionMetadata, itemMetadata } = swapMetadata;
    const analysis = analyses[mealIndex];
    const upstreamUnclosed =
      !portionMetadata.meal.all_targets_within_tolerance;

    itemMetadata.forEach(({ item, portionItemMetadata }) => {
      const originalFood = portionItemMetadata.food;
      const originalItem = portionItemMetadata.item;
      const slot = portionItemMetadata.slotMetadata.slot;

      for (const alternative of item.alternatives) {
        const fields = [];
        if (upstreamUnclosed || !analysis.calculable || !analysis.rawClosed) {
          fields.push("alternatives");
        }
        if (!slot.candidate_food_codes.includes(alternative.food_code)) {
          fields.push("food_code");
        }
        if (
          alternative.food_code === originalItem.food_code ||
          portionMetadata.usedFoodCodes.has(alternative.food_code)
        ) {
          fields.push("food_code");
        }

        const alternativeFood = itemsByCode.get(alternative.food_code);
        if (!alternativeFood) {
          fields.push("food_code");
        } else {
          const group = originalFood.swap.is_swappable
            ? groupsByCode.get(originalFood.swap.group_code)
            : null;
          if (
            !originalFood.swap.is_swappable ||
            !alternativeFood.swap.is_swappable ||
            alternativeFood.swap.group_code !== originalFood.swap.group_code ||
            !group ||
            !group.active_item_codes.includes(alternative.food_code)
          ) {
            fields.push("group_code");
          }
          if (!isLegalGrams(
            alternative.grams,
            alternativeFood.portion_rule_g,
          )) {
            fields.push("grams");
          }

          const alternativeNutrition = nutritionAtGrams(
            alternativeFood,
            alternative.grams,
          );
          const originalNutrition = analysis.rawItems.get(
            originalItem.food_code,
          );
          if (
            alternativeNutrition !== null &&
            originalNutrition !== undefined &&
            analysis.calculable
          ) {
            fields.push(...displayMismatchFields(
              alternative.nutrition,
              alternativeNutrition,
            ));
            const projected = projectedTotals({
              mealTotals: analysis.rawTotals,
              originalNutrition,
              alternativeNutrition,
            });
            fields.push(...displayMismatchFields(
              alternative.projected_meal_totals,
              projected,
            ));
            fields.push(...displayMismatchFields(
              alternative.projected_meal_residual,
              subtractNutrients(projected, analysis.target),
            ));
            const expectedWithin = toleranceResult(
              projected,
              analysis.target,
              portionMetadata.meal.tolerance,
            );
            for (const { key } of NUTRIENTS) {
              if (
                !expectedWithin[key] ||
                alternative.projected_within_tolerance[key] !==
                  expectedWithin[key] ||
                alternative.projected_within_tolerance[key] !== true
              ) {
                fields.push(key);
              }
            }
            const expectedObjective = objectiveScore(
              projected,
              analysis.target,
              portionMetadata.meal.tolerance,
            );
            if (
              Math.abs(
                alternative.objective_score - expectedObjective,
              ) > DISPLAY_TOLERANCE + FLOAT_EPSILON
            ) {
              fields.push("objective_score");
            }
          } else {
            fields.push("grams");
          }
        }

        if (fields.length > 0) {
          addIssue(issueState, "PREFLIGHT_UNSAFE_SWAP", {
            mealSequence: meal.sequence,
            foodCode: alternative.food_code,
            fields,
          });
        }
      }
    });
  });
}

function cloneReasonsWithoutDuplicateCodes(reasons) {
  const output = [];
  const seenCodes = new Set();
  for (const reason of reasons) {
    if (!seenCodes.has(reason.code)) {
      seenCodes.add(reason.code);
      output.push(structuredClone(reason));
    }
  }
  return { output, seenCodes };
}

function addReason(reasonState, code) {
  if (reasonState.seenCodes.has(code)) {
    return;
  }
  reasonState.seenCodes.add(code);
  reasonState.output.push({ code, message: REASON_MESSAGES[code] });
}

function buildChecks({
  withheld,
  upstreamReview,
  sortedEntries,
  forcedReviewChecks,
}) {
  return CHECK_CODES.map((code) => {
    if (withheld) {
      return { code, status: CHECK_STATUS.WITHHELD, issue_codes: [] };
    }
    const issueCodes = [...new Set(
      sortedEntries
        .filter((entry) => entry.checkCode === code)
        .map((entry) => entry.issue.code),
    )];
    const requiresReview =
      issueCodes.length > 0 ||
      forcedReviewChecks.has(code) ||
      (code === "UPSTREAM_STATUS" && upstreamReview);
    return {
      code,
      status: requiresReview
        ? CHECK_STATUS.REVIEW_REQUIRED
        : CHECK_STATUS.PASSED,
      issue_codes: issueCodes,
    };
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

function output({
  selection,
  portionSolver,
  swapEngine,
  catalog,
  status,
  readyForCoachReview,
  checks,
  issues,
  reasons,
}) {
  return {
    nutrition_plan_preflight_version: NUTRITION_PLAN_PREFLIGHT_VERSION,
    source_food_selection_version: selection.food_selection_version,
    source_portion_solver_version: portionSolver.portion_solver_version,
    source_swap_engine_version: swapEngine.swap_engine_version,
    source_food_catalog_version: catalog.food_catalog_version,
    status,
    preflight_policy:
      NutritionPlanPreflightPolicy.Z_COACHING_NUTRITION_PREFLIGHT_V1,
    ready_for_coach_review: readyForCoachReview,
    meal_count: swapEngine.meal_count,
    checks,
    issues,
    constraints: structuredClone(swapEngine.constraints),
    reasons,
  };
}

/**
 * Audits the final nutrition planning stages without modifying or rerunning
 * any upstream stage.
 *
 * @param {Object} inputs
 * @param {Object} inputs.nutritionFoodSelection
 * @param {Object} inputs.nutritionPortionSolver
 * @param {Object} inputs.nutritionSwapEngine
 * @param {Object} inputs.nutritionFoodCatalog
 * @returns {import("./domain/contracts.js").NutritionPlanPreflight}
 */
export function evaluateNutritionPlanPreflight(inputs) {
  requireObject(inputs, "inputs");
  const {
    nutritionFoodSelection: selection,
    nutritionPortionSolver: portionSolver,
    nutritionSwapEngine: swapEngine,
    nutritionFoodCatalog: catalog,
  } = inputs;

  const { itemsByCode, groupsByCode } = validateCatalog(catalog);
  const selectionMeals = validateSelection(selection, catalog, itemsByCode);
  const portionMeals = validatePortionSolver({
    portionSolver,
    selection,
    catalog,
    selectionMeals,
    itemsByCode,
  });
  const swapMeals = validateSwapEngine({
    swapEngine,
    selection,
    portionSolver,
    catalog,
    portionMeals,
    itemsByCode,
  });

  const reasonState = cloneReasonsWithoutDuplicateCodes(swapEngine.reasons);
  addReason(reasonState, "PREFLIGHT_POLICY_APPLIED");

  const withheld =
    selection.status === NutritionFoodSelectionStatus.WITHHELD;
  if (withheld) {
    addReason(reasonState, "PREFLIGHT_WITHHELD_BY_UPSTREAM_STATUS");
    return finalize(output({
      selection,
      portionSolver,
      swapEngine,
      catalog,
      status: NutritionPlanPreflightStatus.WITHHELD,
      readyForCoachReview: false,
      checks: buildChecks({
        withheld: true,
        upstreamReview: false,
        sortedEntries: [],
        forcedReviewChecks: new Set(),
      }),
      issues: [],
      reasons: reasonState.output,
    }));
  }

  const issueState = createIssueState();
  auditMealPatterns(selectionMeals, issueState);
  auditSelectedFoodIntegrity(portionMeals, issueState);
  auditPortionLegality(portionMeals, issueState);
  const { analyses, rawDaily } = auditPortionCalculations({
    portionSolver,
    portionMeals,
    issueState,
  });
  auditTargetClosure({
    selectionMeals,
    portionSolver,
    portionMeals,
    analyses,
    rawDaily,
    issueState,
  });
  auditSwapSafety({
    swapMeals,
    analyses,
    itemsByCode,
    groupsByCode,
    issueState,
  });

  const sortedEntries = sortedIssueEntries(issueState);
  const issues = sortedEntries.map((entry) => entry.issue);
  const upstreamReview = [
    selection.status,
    portionSolver.status,
    swapEngine.status,
  ].includes("PROVISIONAL_REVIEW_REQUIRED");
  if (upstreamReview) {
    addReason(reasonState, "PREFLIGHT_UPSTREAM_REVIEW_RETAINED");
  }
  if (issues.length > 0) {
    addReason(reasonState, "PREFLIGHT_REVIEW_REQUIRED");
  }
  const status = upstreamReview || issues.length > 0
    ? NutritionPlanPreflightStatus.REVIEW_REQUIRED
    : NutritionPlanPreflightStatus.READY;

  return finalize(output({
    selection,
    portionSolver,
    swapEngine,
    catalog,
    status,
    readyForCoachReview: true,
    checks: buildChecks({
      withheld: false,
      upstreamReview,
      sortedEntries,
      forcedReviewChecks: issueState.forcedReviewChecks,
    }),
    issues,
    reasons: reasonState.output,
  }));
}
