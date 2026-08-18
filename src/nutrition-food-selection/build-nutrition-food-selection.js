import { isDeepStrictEqual } from "node:util";

import {
  BudgetLevel,
  MedicalFoodInstruction,
} from "../intake-decision-engine/index.js";
import {
  NUTRITION_PLANNING_SNAPSHOT_VERSION,
} from "../nutrition-planning-snapshot/index.js";
import {
  NUTRITION_MEAL_ASSEMBLY_BLUEPRINT_VERSION,
  NutritionComponentRequirement,
  NutritionFoodClass,
  NutritionMealAssemblyStatus,
  NutritionMealComponentSlot,
  NutritionMealPatternCode,
} from "../nutrition-meal-assembly-blueprint/index.js";
import {
  NUTRITION_FOOD_CATALOG_VERSION,
  NutritionFoodCatalogPolicy,
  NutritionMarketCode,
} from "../nutrition-food-catalog/index.js";
import { NUTRITION_FOOD_SELECTION_VERSION } from "./domain/contracts.js";
import {
  NutritionFoodCandidateRejectionCode,
  NutritionFoodSelectionPolicy,
  NutritionFoodSelectionStatus,
} from "./domain/enums.js";

const FOOD_RESTRICTION_FIELDS = Object.freeze([
  "allergies",
  "medical_exclusions",
  "intolerances",
  "digestive_issues",
  "disliked_foods",
]);

const TARGET_FIELDS = Object.freeze([
  "planned_calories",
  "protein_g",
  "fat_g",
  "carbohydrate_g",
  "fiber_g",
]);

const BUDGET_RANK = Object.freeze({
  [BudgetLevel.LOW]: 1,
  [BudgetLevel.MEDIUM]: 2,
  [BudgetLevel.HIGH]: 3,
});

const REASON_MESSAGES = Object.freeze({
  FOOD_SELECTION_POLICY_APPLIED:
    "Food codes were selected deterministically using Z Coaching Food Selection V1.",
  FOOD_SELECTION_WITHHELD_BY_ASSEMBLY_STATUS:
    "Food selection was withheld because meal assembly is withheld.",
  FOOD_SELECTION_UPSTREAM_REVIEW_RETAINED:
    "The upstream meal-assembly review requirement was retained.",
  FOOD_SELECTION_UNAVAILABLE_WITHOUT_ASSEMBLY_MEALS:
    "Food selection is unavailable until meal-assembly meals exist.",
  FOOD_SELECTION_DIGESTIVE_ISSUES_REQUIRE_REVIEW:
    "Reported digestive issues require review and were not interpreted as food exclusions.",
  FOOD_SELECTION_MEAL_HAS_NO_FEASIBLE_PATTERN:
    "At least one meal has no feasible food pattern under the retained constraints.",
});

const NO_FEASIBLE_PATTERN_ISSUE = Object.freeze({
  code: "NO_FEASIBLE_PATTERN",
  message: "No feasible food pattern was available for this meal.",
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

function requireBoolean(value, path) {
  if (typeof value !== "boolean") {
    throw new TypeError(`${path} must be a boolean.`);
  }
}

function requireEnum(value, runtimeEnum, enumName, path) {
  if (!Object.values(runtimeEnum).includes(value)) {
    throw new TypeError(`${path} must be a ${enumName}.`);
  }
}

function requireKnownStringArray(value, knownValues, path, allowEmpty = true) {
  requireArray(value, path);
  if (!allowEmpty && value.length === 0) {
    throw new TypeError(`${path} must not be empty.`);
  }
  if (
    value.some((entry) => !knownValues.includes(entry)) ||
    new Set(value).size !== value.length
  ) {
    throw new TypeError(`${path} must contain known, unique values.`);
  }
}

function requireStringArray(value, path) {
  requireArray(value, path);
  if (value.some((entry) => typeof entry !== "string")) {
    throw new TypeError(`${path} must contain only strings.`);
  }
}

function validateFoodRestrictions(restrictions, path) {
  requireObject(restrictions, path);
  for (const field of FOOD_RESTRICTION_FIELDS) {
    requireArray(restrictions[field], `${path}.${field}`);
  }

  restrictions.allergies.forEach((allergy, index) => {
    const itemPath = `${path}.allergies[${index}]`;
    requireObject(allergy, itemPath);
    requireNonEmptyString(allergy.substance, `${itemPath}.substance`);
    requireBoolean(allergy.medicallyConfirmed, `${itemPath}.medicallyConfirmed`);
  });

  restrictions.medical_exclusions.forEach((exclusion, index) => {
    const itemPath = `${path}.medical_exclusions[${index}]`;
    requireObject(exclusion, itemPath);
    requireNonEmptyString(exclusion.food, `${itemPath}.food`);
    if (exclusion.instruction !== MedicalFoodInstruction.EXCLUDE) {
      throw new TypeError(`${itemPath}.instruction must equal EXCLUDE.`);
    }
    requireNonEmptyString(exclusion.source, `${itemPath}.source`);
  });

  restrictions.intolerances.forEach((intolerance, index) => {
    const itemPath = `${path}.intolerances[${index}]`;
    requireObject(intolerance, itemPath);
    requireNonEmptyString(intolerance.substance, `${itemPath}.substance`);
    requireNonEmptyString(intolerance.severity, `${itemPath}.severity`);
    requireBoolean(
      intolerance.medicallyDiagnosed,
      `${itemPath}.medicallyDiagnosed`,
    );
    if (
      intolerance.notes !== undefined &&
      intolerance.notes !== null &&
      typeof intolerance.notes !== "string"
    ) {
      throw new TypeError(`${itemPath}.notes must be a string or null.`);
    }
  });

  restrictions.digestive_issues.forEach((issue, index) => {
    const itemPath = `${path}.digestive_issues[${index}]`;
    requireObject(issue, itemPath);
    requireNonEmptyString(issue.name, `${itemPath}.name`);
    requireNonEmptyString(issue.severity, `${itemPath}.severity`);
  });

  restrictions.disliked_foods.forEach((food, index) => {
    requireNonEmptyString(food, `${path}.disliked_foods[${index}]`);
  });
}

function validateSnapshot(snapshot) {
  requireObject(snapshot, "nutritionPlanningSnapshot");
  if (snapshot.snapshot_version !== NUTRITION_PLANNING_SNAPSHOT_VERSION) {
    throw new TypeError(
      `nutritionPlanningSnapshot.snapshot_version must equal ${NUTRITION_PLANNING_SNAPSHOT_VERSION}.`,
    );
  }

  requireObject(snapshot.client, "nutritionPlanningSnapshot.client");
  requireEnum(
    snapshot.client.residence_country,
    NutritionMarketCode,
    "NutritionMarketCode",
    "nutritionPlanningSnapshot.client.residence_country",
  );

  requireObject(
    snapshot.meal_preferences,
    "nutritionPlanningSnapshot.meal_preferences",
  );
  requireEnum(
    snapshot.meal_preferences.budget,
    BudgetLevel,
    "BudgetLevel",
    "nutritionPlanningSnapshot.meal_preferences.budget",
  );
  requireBoolean(
    snapshot.meal_preferences.food_storage_available,
    "nutritionPlanningSnapshot.meal_preferences.food_storage_available",
  );
  requireBoolean(
    snapshot.meal_preferences.food_reheating_available,
    "nutritionPlanningSnapshot.meal_preferences.food_reheating_available",
  );

  validateFoodRestrictions(
    snapshot.food_restrictions,
    "nutritionPlanningSnapshot.food_restrictions",
  );
}

function validateTarget(target, path) {
  requireObject(target, path);
  for (const field of TARGET_FIELDS) {
    if (!Number.isInteger(target[field]) || target[field] < 0) {
      throw new TypeError(`${path}.${field} must be a non-negative integer.`);
    }
  }
}

function validatePatternSlot(slot, index, path) {
  const slotPath = `${path}.slots[${index}]`;
  requireObject(slot, slotPath);
  if (!Number.isInteger(slot.sequence) || slot.sequence !== index + 1) {
    throw new TypeError(`${path} slot sequence must start at 1 and be contiguous.`);
  }
  requireEnum(
    slot.slot,
    NutritionMealComponentSlot,
    "NutritionMealComponentSlot",
    `${slotPath}.slot`,
  );
  requireEnum(
    slot.requirement,
    NutritionComponentRequirement,
    "NutritionComponentRequirement",
    `${slotPath}.requirement`,
  );
  if (
    !Number.isInteger(slot.min_items) ||
    slot.min_items < 0 ||
    !Number.isInteger(slot.max_items) ||
    slot.max_items < 1 ||
    slot.min_items > slot.max_items
  ) {
    throw new TypeError(`${slotPath} must have consistent integer item bounds.`);
  }
  if (
    slot.requirement === NutritionComponentRequirement.REQUIRED &&
    slot.min_items < 1
  ) {
    throw new TypeError(`${slotPath}.min_items must be positive when required.`);
  }
  if (
    slot.requirement === NutritionComponentRequirement.OPTIONAL &&
    slot.min_items !== 0
  ) {
    throw new TypeError(`${slotPath}.min_items must be zero when optional.`);
  }
  requireKnownStringArray(
    slot.allowed_food_classes,
    Object.values(NutritionFoodClass),
    `${slotPath}.allowed_food_classes`,
    false,
  );
}

function validateMeal(meal, index) {
  const mealPath = `nutritionMealAssemblyBlueprint.meals[${index}]`;
  requireObject(meal, mealPath);
  if (!Number.isInteger(meal.sequence) || meal.sequence !== index + 1) {
    throw new TypeError(
      "nutritionMealAssemblyBlueprint.meals sequence must start at 1 and be contiguous.",
    );
  }
  requireNonEmptyString(meal.role, `${mealPath}.role`);
  validateTarget(meal.target, `${mealPath}.target`);
  requireArray(meal.allowed_patterns, `${mealPath}.allowed_patterns`);

  const patternCodes = new Set();
  meal.allowed_patterns.forEach((pattern, patternIndex) => {
    const patternPath = `${mealPath}.allowed_patterns[${patternIndex}]`;
    requireObject(pattern, patternPath);
    requireEnum(
      pattern.code,
      NutritionMealPatternCode,
      "NutritionMealPatternCode",
      `${patternPath}.code`,
    );
    if (patternCodes.has(pattern.code)) {
      throw new TypeError(`${mealPath}.allowed_patterns codes must be unique.`);
    }
    patternCodes.add(pattern.code);
    requireArray(pattern.slots, `${patternPath}.slots`);
    if (pattern.slots.length === 0) {
      throw new TypeError(`${patternPath}.slots must not be empty.`);
    }
    pattern.slots.forEach((slot, slotIndex) =>
      validatePatternSlot(slot, slotIndex, patternPath));
  });
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

function validateBlueprint(snapshot, blueprint) {
  requireObject(blueprint, "nutritionMealAssemblyBlueprint");
  if (
    blueprint.assembly_blueprint_version !==
    NUTRITION_MEAL_ASSEMBLY_BLUEPRINT_VERSION
  ) {
    throw new TypeError(
      `nutritionMealAssemblyBlueprint.assembly_blueprint_version must equal ${NUTRITION_MEAL_ASSEMBLY_BLUEPRINT_VERSION}.`,
    );
  }
  if (blueprint.source_snapshot_version !== snapshot.snapshot_version) {
    throw new TypeError(
      "nutritionMealAssemblyBlueprint.source_snapshot_version must match nutritionPlanningSnapshot.snapshot_version.",
    );
  }
  requireEnum(
    blueprint.status,
    NutritionMealAssemblyStatus,
    "NutritionMealAssemblyStatus",
    "nutritionMealAssemblyBlueprint.status",
  );
  requireArray(blueprint.meals, "nutritionMealAssemblyBlueprint.meals");

  if (
    blueprint.meal_count !== null &&
    (!Number.isInteger(blueprint.meal_count) || blueprint.meal_count < 1)
  ) {
    throw new TypeError(
      "nutritionMealAssemblyBlueprint.meal_count must be null or a positive integer.",
    );
  }
  if (
    (blueprint.meal_count === null && blueprint.meals.length !== 0) ||
    (blueprint.meal_count !== null &&
      blueprint.meal_count !== blueprint.meals.length)
  ) {
    throw new TypeError(
      "nutritionMealAssemblyBlueprint.meal_count must match meals.",
    );
  }
  if (
    blueprint.status === NutritionMealAssemblyStatus.WITHHELD &&
    (blueprint.meal_count !== null || blueprint.meals.length !== 0)
  ) {
    throw new TypeError(
      "A WITHHELD nutritionMealAssemblyBlueprint must not contain meals.",
    );
  }
  if (
    blueprint.status === NutritionMealAssemblyStatus.READY &&
    blueprint.meal_count === null
  ) {
    throw new TypeError(
      "A READY nutritionMealAssemblyBlueprint must contain meals.",
    );
  }

  requireObject(blueprint.logistics, "nutritionMealAssemblyBlueprint.logistics");
  requireEnum(
    blueprint.logistics.budget,
    BudgetLevel,
    "BudgetLevel",
    "nutritionMealAssemblyBlueprint.logistics.budget",
  );
  requireBoolean(
    blueprint.logistics.food_storage_available,
    "nutritionMealAssemblyBlueprint.logistics.food_storage_available",
  );
  requireBoolean(
    blueprint.logistics.food_reheating_available,
    "nutritionMealAssemblyBlueprint.logistics.food_reheating_available",
  );
  validateFoodRestrictions(
    blueprint.food_restrictions,
    "nutritionMealAssemblyBlueprint.food_restrictions",
  );

  const expectedLogistics = {
    budget: snapshot.meal_preferences.budget,
    food_storage_available:
      snapshot.meal_preferences.food_storage_available,
    food_reheating_available:
      snapshot.meal_preferences.food_reheating_available,
  };
  if (!isDeepStrictEqual(blueprint.logistics, expectedLogistics)) {
    throw new TypeError(
      "nutritionMealAssemblyBlueprint.logistics must match nutritionPlanningSnapshot.meal_preferences.",
    );
  }
  if (
    !isDeepStrictEqual(
      blueprint.food_restrictions,
      snapshot.food_restrictions,
    )
  ) {
    throw new TypeError(
      "nutritionMealAssemblyBlueprint.food_restrictions must match nutritionPlanningSnapshot.food_restrictions.",
    );
  }

  blueprint.meals.forEach(validateMeal);
  requireArray(
    blueprint.constraints,
    "nutritionMealAssemblyBlueprint.constraints",
  );
  validateReasonArray(
    blueprint.reasons,
    "nutritionMealAssemblyBlueprint.reasons",
  );
}

function validateCatalogItem(item, index) {
  const path = `nutritionFoodCatalog.items[${index}]`;
  requireObject(item, path);
  requireNonEmptyString(item.food_code, `${path}.food_code`);
  requireEnum(
    item.food_class,
    NutritionFoodClass,
    "NutritionFoodClass",
    `${path}.food_class`,
  );
  requireBoolean(item.is_active, `${path}.is_active`);
  if (!Number.isInteger(item.selection_priority) || item.selection_priority < 1) {
    throw new TypeError(`${path}.selection_priority must be a positive integer.`);
  }
  requireKnownStringArray(
    item.compatible_pattern_codes,
    Object.values(NutritionMealPatternCode),
    `${path}.compatible_pattern_codes`,
    false,
  );
  requireKnownStringArray(
    item.available_markets,
    Object.values(NutritionMarketCode),
    `${path}.available_markets`,
    false,
  );
  requireEnum(
    item.budget_level,
    BudgetLevel,
    "BudgetLevel",
    `${path}.budget_level`,
  );
  requireObject(item.logistics, `${path}.logistics`);
  requireBoolean(
    item.logistics.requires_storage,
    `${path}.logistics.requires_storage`,
  );
  requireBoolean(
    item.logistics.requires_reheating,
    `${path}.logistics.requires_reheating`,
  );
  requireObject(item.tags, `${path}.tags`);
  requireStringArray(item.tags.identity_tags, `${path}.tags.identity_tags`);
  requireStringArray(item.tags.allergen_tags, `${path}.tags.allergen_tags`);
  requireStringArray(
    item.tags.intolerance_tags,
    `${path}.tags.intolerance_tags`,
  );
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
  if (catalog.items_count !== catalog.items.length) {
    throw new TypeError(
      "nutritionFoodCatalog.items_count must match items.length.",
    );
  }
  const activeItemsCount = catalog.items.filter(
    (item) => isObject(item) && item.is_active === true,
  ).length;
  if (catalog.active_items_count !== activeItemsCount) {
    throw new TypeError(
      "nutritionFoodCatalog.active_items_count must match active items.",
    );
  }

  const foodCodes = new Set();
  catalog.items.forEach((item, index) => {
    validateCatalogItem(item, index);
    if (foodCodes.has(item.food_code)) {
      throw new TypeError("nutritionFoodCatalog food_code values must be unique.");
    }
    foodCodes.add(item.food_code);
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

function compareCode(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareFoodsByPriority(left, right, patternCode) {
  if (patternCode && patternCode.startsWith('BREAKFAST')) {
    const leftIsBreakfastStaple = ['EGG', 'DAIRY_PROTEIN', 'LEGUME'].includes(left.food_class) ? 0 : 1;
    const rightIsBreakfastStaple = ['EGG', 'DAIRY_PROTEIN', 'LEGUME'].includes(right.food_class) ? 0 : 1;
    if (leftIsBreakfastStaple !== rightIsBreakfastStaple) {
      return leftIsBreakfastStaple - rightIsBreakfastStaple;
    }
  }
  return left.selection_priority - right.selection_priority ||
    compareCode(left.food_code, right.food_code);
}

function makeRestrictionSets(foodRestrictions) {
  return {
    allergies: new Set(
      foodRestrictions.allergies.map((allergy) => allergy.substance),
    ),
    medicalExclusions: new Set(
      foodRestrictions.medical_exclusions.map((exclusion) => exclusion.food),
    ),
    intolerances: new Set(
      foodRestrictions.intolerances.map(
        (intolerance) => intolerance.substance,
      ),
    ),
    dislikedFoods: new Set(foodRestrictions.disliked_foods),
  };
}

function hasMatchingTag(tags, excludedValues) {
  if (!Array.isArray(tags) || tags.length === 0 || !excludedValues || excludedValues.size === 0) {
    return false;
  }
  return tags.some((tag) => excludedValues.has(tag));
}

function rejectionCodesFor(food, context) {
  const codes = [];
  const rejectionCode = NutritionFoodCandidateRejectionCode;

  if (!food.is_active) {
    codes.push(rejectionCode.INACTIVE_FOOD);
  }
  if (!food.available_markets.includes(context.marketCode)) {
    codes.push(rejectionCode.MARKET_UNAVAILABLE);
  }
  if (BUDGET_RANK[food.budget_level] > BUDGET_RANK[context.budget]) {
    codes.push(rejectionCode.BUDGET_LEVEL_EXCEEDED);
  }
  if (!context.storageAvailable && food.logistics.requires_storage) {
    codes.push(rejectionCode.STORAGE_UNAVAILABLE);
  }
  if (!context.reheatingAvailable && food.logistics.requires_reheating) {
    codes.push(rejectionCode.REHEATING_UNAVAILABLE);
  }
  if (hasMatchingTag(food.tags.allergen_tags, context.allergies)) {
    codes.push(rejectionCode.ALLERGY_EXCLUDED);
  }
  if (
    context.medicalExclusions.has(food.food_code) ||
    hasMatchingTag(food.tags.identity_tags, context.medicalExclusions)
  ) {
    codes.push(rejectionCode.MEDICAL_EXCLUDED);
  }
  if (hasMatchingTag(food.tags.intolerance_tags, context.intolerances)) {
    codes.push(rejectionCode.INTOLERANCE_EXCLUDED);
  }
  if (
    context.dislikedFoods.has(food.food_code) ||
    hasMatchingTag(food.tags.identity_tags, context.dislikedFoods)
  ) {
    codes.push(rejectionCode.DISLIKED_FOOD);
  }
  return codes;
}

function buildSelectionContext(snapshot) {
  return {
    marketCode: snapshot.client.residence_country,
    budget: snapshot.meal_preferences.budget,
    storageAvailable: snapshot.meal_preferences.food_storage_available,
    reheatingAvailable: snapshot.meal_preferences.food_reheating_available,
    ...makeRestrictionSets(snapshot.food_restrictions),
  };
}

function evaluateSlot({
  slot,
  patternCode,
  catalogItems,
  localSelected,
  usageCounts,
  context,
}) {
  const candidateUniverse = catalogItems.filter(
    (food) =>
      slot.allowed_food_classes.includes(food.food_class) &&
      food.compatible_pattern_codes.includes(patternCode) &&
      !localSelected.has(food.food_code),
  );
  const eligibleFoods = [];
  const rejectedFoods = [];

  for (const food of candidateUniverse) {
    const reasonCodes = rejectionCodesFor(food, context);
    if (reasonCodes.length === 0) {
      eligibleFoods.push(food);
    } else {
      rejectedFoods.push({ food, reasonCodes });
    }
  }

  // Intelligent fallback for heavy exclusion cases (e.g. eggs+dairy+legumes excluded for breakfast)
  if (
    eligibleFoods.length < slot.min_items &&
    slot.requirement === NutritionComponentRequirement.REQUIRED &&
    patternCode.startsWith("BREAKFAST")
  ) {
    const candidateCodes = new Set(candidateUniverse.map((f) => f.food_code));
    const fallbackUniverse = catalogItems.filter(
      (food) =>
        slot.allowed_food_classes.includes(food.food_class) &&
        !localSelected.has(food.food_code) &&
        !candidateCodes.has(food.food_code),
    );
    for (const food of fallbackUniverse) {
      const reasonCodes = rejectionCodesFor(food, context);
      if (reasonCodes.length === 0) {
        eligibleFoods.push(food);
      }
    }
  }

  eligibleFoods.sort((left, right) =>
    (usageCounts.get(left.food_code) ?? 0) -
      (usageCounts.get(right.food_code) ?? 0) ||
    compareFoodsByPriority(left, right, patternCode));
  rejectedFoods.sort((left, right) =>
    compareFoodsByPriority(left.food, right.food, patternCode));

  const canMeetMinimum = eligibleFoods.length >= slot.min_items;
  const selectedFoodCodes =
    slot.requirement === NutritionComponentRequirement.REQUIRED &&
    canMeetMinimum
      ? eligibleFoods.slice(0, slot.min_items).map((food) => food.food_code)
      : [];

  for (const foodCode of selectedFoodCodes) {
    localSelected.add(foodCode);
  }

  return {
    canMeetMinimum,
    selectedFoodCodes,
    slotResult: {
      sequence: slot.sequence,
      slot: slot.slot,
      requirement: slot.requirement,
      min_items: slot.min_items,
      max_items: slot.max_items,
      allowed_food_classes: [...slot.allowed_food_classes],
      selected_food_codes: selectedFoodCodes,
      candidate_food_codes: eligibleFoods.map((food) => food.food_code),
      rejected_foods: rejectedFoods.map(({ food, reasonCodes }) => ({
        food_code: food.food_code,
        reason_codes: reasonCodes,
      })),
      deferred_to_portion_solver:
        slot.requirement === NutritionComponentRequirement.OPTIONAL,
    },
  };
}

function evaluatePattern(pattern, catalogItems, usageCounts, context) {
  const localSelected = new Set();
  const slots = [];
  const blockingSlots = [];

  for (const slot of pattern.slots) {
    const evaluation = evaluateSlot({
      slot,
      patternCode: pattern.code,
      catalogItems,
      localSelected,
      usageCounts,
      context,
    });
    slots.push(evaluation.slotResult);
    if (
      slot.requirement === NutritionComponentRequirement.REQUIRED &&
      !evaluation.canMeetMinimum
    ) {
      blockingSlots.push({
        slot_sequence: slot.sequence,
        slot: slot.slot,
        required_items: slot.min_items,
        eligible_items: evaluation.slotResult.candidate_food_codes.length,
      });
    }
  }

  return {
    attempt: {
      pattern_code: pattern.code,
      feasible: blockingSlots.length === 0,
      blocking_slots: blockingSlots,
    },
    slots,
    selectedFoodCodes: slots.flatMap((slot) => slot.selected_food_codes),
  };
}

function selectMeal(meal, catalogItems, usageCounts, context) {
  const patternAttempts = [];

  for (const pattern of meal.allowed_patterns) {
    const evaluation = evaluatePattern(
      pattern,
      catalogItems,
      usageCounts,
      context,
    );
    patternAttempts.push(evaluation.attempt);
    if (!evaluation.attempt.feasible) {
      continue;
    }

    for (const foodCode of evaluation.selectedFoodCodes) {
      usageCounts.set(foodCode, (usageCounts.get(foodCode) ?? 0) + 1);
    }
    return {
      sequence: meal.sequence,
      role: meal.role,
      target: structuredClone(meal.target),
      selected_pattern_code: pattern.code,
      pattern_attempts: patternAttempts,
      slots: evaluation.slots,
      issues: [],
    };
  }

  return {
    sequence: meal.sequence,
    role: meal.role,
    target: structuredClone(meal.target),
    selected_pattern_code: null,
    pattern_attempts: patternAttempts,
    slots: [],
    issues: [structuredClone(NO_FEASIBLE_PATTERN_ISSUE)],
  };
}

function cloneReasonsWithoutDuplicateCodes(reasons) {
  const seenCodes = new Set();
  const clonedReasons = [];
  for (const reason of reasons) {
    if (seenCodes.has(reason.code)) {
      continue;
    }
    seenCodes.add(reason.code);
    clonedReasons.push(structuredClone(reason));
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
  snapshot,
  blueprint,
  catalog,
  status,
  mealCount,
  meals,
  reasonState,
}) {
  return {
    food_selection_version: NUTRITION_FOOD_SELECTION_VERSION,
    source_snapshot_version: snapshot.snapshot_version,
    source_assembly_blueprint_version:
      blueprint.assembly_blueprint_version,
    source_food_catalog_version: catalog.food_catalog_version,
    status,
    selection_policy:
      NutritionFoodSelectionPolicy.Z_COACHING_FOOD_SELECTION_V1,
    market_code: snapshot.client.residence_country,
    meal_count: mealCount,
    meals,
    constraints: structuredClone(blueprint.constraints),
    reasons: reasonState.reasons,
  };
}

/**
 * Selects deterministic food-code candidates for already assembled meal slots.
 * It does not calculate portions, grams, calories, or macro closure.
 *
 * @param {Object} inputs
 * @param {Object} inputs.nutritionPlanningSnapshot
 * @param {Object} inputs.nutritionMealAssemblyBlueprint
 * @param {Object} inputs.nutritionFoodCatalog
 * @returns {import("./domain/contracts.js").NutritionFoodSelection}
 */
export function buildNutritionFoodSelection(inputs) {
  requireObject(inputs, "inputs");
  const {
    nutritionPlanningSnapshot: snapshot,
    nutritionMealAssemblyBlueprint: blueprint,
    nutritionFoodCatalog: catalog,
  } = inputs;

  validateSnapshot(snapshot);
  validateBlueprint(snapshot, blueprint);
  validateCatalog(catalog);

  const reasonState = cloneReasonsWithoutDuplicateCodes(blueprint.reasons);

  if (blueprint.status === NutritionMealAssemblyStatus.WITHHELD) {
    addReason(reasonState, "FOOD_SELECTION_WITHHELD_BY_ASSEMBLY_STATUS");
    return finalize(makeOutput({
      snapshot,
      blueprint,
      catalog,
      status: NutritionFoodSelectionStatus.WITHHELD,
      mealCount: null,
      meals: [],
      reasonState,
    }));
  }

  if (blueprint.meal_count === null) {
    addReason(reasonState, "FOOD_SELECTION_UPSTREAM_REVIEW_RETAINED");
    addReason(
      reasonState,
      "FOOD_SELECTION_UNAVAILABLE_WITHOUT_ASSEMBLY_MEALS",
    );
    if (snapshot.food_restrictions.digestive_issues.length > 0) {
      addReason(
        reasonState,
        "FOOD_SELECTION_DIGESTIVE_ISSUES_REQUIRE_REVIEW",
      );
    }
    return finalize(makeOutput({
      snapshot,
      blueprint,
      catalog,
      status: NutritionFoodSelectionStatus.PROVISIONAL_REVIEW_REQUIRED,
      mealCount: null,
      meals: [],
      reasonState,
    }));
  }

  addReason(reasonState, "FOOD_SELECTION_POLICY_APPLIED");
  if (
    blueprint.status ===
    NutritionMealAssemblyStatus.PROVISIONAL_REVIEW_REQUIRED
  ) {
    addReason(reasonState, "FOOD_SELECTION_UPSTREAM_REVIEW_RETAINED");
  }

  const usageCounts = new Map();
  const context = buildSelectionContext(snapshot);
  const meals = blueprint.meals.map((meal) =>
    selectMeal(meal, catalog.items, usageCounts, context));
  const hasNoFeasiblePattern = meals.some(
    (meal) => meal.selected_pattern_code === null,
  );
  const hasDigestiveIssues =
    snapshot.food_restrictions.digestive_issues.length > 0;

  if (hasDigestiveIssues) {
    addReason(
      reasonState,
      "FOOD_SELECTION_DIGESTIVE_ISSUES_REQUIRE_REVIEW",
    );
  }
  if (hasNoFeasiblePattern) {
    addReason(reasonState, "FOOD_SELECTION_MEAL_HAS_NO_FEASIBLE_PATTERN");
  }

  const requiresReview =
    blueprint.status ===
      NutritionMealAssemblyStatus.PROVISIONAL_REVIEW_REQUIRED ||
    hasDigestiveIssues ||
    hasNoFeasiblePattern;

  return finalize(makeOutput({
    snapshot,
    blueprint,
    catalog,
    status: requiresReview
      ? NutritionFoodSelectionStatus.PROVISIONAL_REVIEW_REQUIRED
      : NutritionFoodSelectionStatus.READY,
    mealCount: blueprint.meal_count,
    meals,
    reasonState,
  }));
}
