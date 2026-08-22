import { BudgetLevel } from "../intake-decision-engine/index.js";
import {
  NutritionFoodClass,
  NutritionMealPatternCode,
} from "../nutrition-meal-assembly-blueprint/index.js";
import {
  NutritionFoodSourceType,
  NutritionFoodState,
  NutritionMarketCode,
} from "./domain/enums.js";

const CANONICAL_ID_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const CHECKED_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const knownFoodClasses = new Set(Object.values(NutritionFoodClass));
const knownFoodStates = new Set(Object.values(NutritionFoodState));
const knownPatternCodes = new Set(Object.values(NutritionMealPatternCode));
const knownMarkets = new Set(Object.values(NutritionMarketCode));
const knownBudgetLevels = new Set(Object.values(BudgetLevel));
const knownSourceTypes = new Set(Object.values(NutritionFoodSourceType));

const FOOD_ITEM_FIELDS = Object.freeze([
  "food_code",
  "name_ar",
  "name_en",
  "food_class",
  "food_state",
  "is_active",
  "selection_priority",
  "compatible_pattern_codes",
  "available_markets",
  "budget_level",
  "logistics",
  "nutrition_per_100g",
  "portion_rule_g",
  "tags",
  "swap",
  "source",
]);

const LOGISTICS_FIELDS = Object.freeze([
  "requires_storage",
  "requires_reheating",
]);

const NUTRIENT_FIELDS = Object.freeze([
  Object.freeze({ key: "calories_kcal", maximum: 1000 }),
  Object.freeze({ key: "protein_g", maximum: 100 }),
  Object.freeze({ key: "fat_g", maximum: 100 }),
  Object.freeze({ key: "carbohydrate_g", maximum: 100 }),
  Object.freeze({ key: "fiber_g", maximum: 100 }),
]);

const PORTION_RULE_FIELDS = Object.freeze([
  "minimum_g",
  "maximum_g",
  "step_g",
  "default_g",
]);

const TAG_FIELDS = Object.freeze([
  "identity_tags",
  "allergen_tags",
  "intolerance_tags",
]);

const SWAP_FIELDS = Object.freeze(["is_swappable", "group_code"]);
const SOURCE_FIELDS = Object.freeze([
  "type",
  "name",
  "reference",
  "checked_date",
]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isCanonicalId(value) {
  return typeof value === "string" && CANONICAL_ID_PATTERN.test(value);
}

function isTrimmedNonEmptyString(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value === value.trim()
  );
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function addIssue(issues, path, code, message) {
  issues.push({ path, code, message });
}

function validateUnknownFields(record, path, allowedFields, issues) {
  const allowed = new Set(allowedFields);
  const unknownFields = Object.keys(record)
    .filter((field) => !allowed.has(field))
    .sort();

  for (const field of unknownFields) {
    addIssue(
      issues,
      `${path}.${field}`,
      "UNKNOWN_FOOD_ITEM_FIELD",
      `Unknown field "${field}" is not allowed by the food catalog contract.`,
    );
  }
}

function validateCanonicalFoodCode(value, path, issues) {
  if (isCanonicalId(value)) {
    return;
  }
  addIssue(
    issues,
    path,
    "INVALID_CANONICAL_ID",
    "food_code must be a non-empty canonical ID matching ^[A-Z][A-Z0-9_]*$.",
  );
}

function validateName(value, path, issues) {
  if (isTrimmedNonEmptyString(value)) {
    return;
  }
  addIssue(
    issues,
    path,
    "INVALID_NAME",
    `${path.split(".").at(-1)} must be a non-empty, trimmed string.`,
  );
}

function validateEnumValue(value, knownValues, path, code, label, issues) {
  if (knownValues.has(value)) {
    return;
  }
  addIssue(issues, path, code, `${label} must be a known catalog value.`);
}

function validateKnownUniqueArray({
  value,
  path,
  knownValues,
  code,
  label,
  issues,
}) {
  if (!Array.isArray(value) || value.length === 0) {
    addIssue(issues, path, code, `${label} must be a non-empty array.`);
    return;
  }

  const seen = new Set();
  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    const entryPath = `${path}[${index}]`;
    if (!knownValues.has(entry)) {
      addIssue(
        issues,
        entryPath,
        code,
        `${label} entries must be known catalog values.`,
      );
    }
    if (seen.has(entry)) {
      addIssue(
        issues,
        entryPath,
        code,
        `${label} must not contain duplicate values.`,
      );
    }
    seen.add(entry);
  }
}

function validateLogistics(value, path, issues) {
  if (!isObject(value)) {
    addIssue(
      issues,
      path,
      "INVALID_LOGISTICS",
      "logistics must be an object with two required boolean fields.",
    );
    return;
  }

  for (const field of LOGISTICS_FIELDS) {
    if (typeof value[field] !== "boolean") {
      addIssue(
        issues,
        `${path}.${field}`,
        "INVALID_LOGISTICS",
        `${field} must be a boolean.`,
      );
    }
  }
  validateUnknownFields(value, path, LOGISTICS_FIELDS, issues);
}

function validateNutritionPer100g(value, path, issues) {
  if (!isObject(value)) {
    addIssue(
      issues,
      path,
      "INVALID_NUTRIENT_VALUE",
      "nutrition_per_100g must be an object using the required per-100-gram fields.",
    );
    return;
  }

  let allNutrientsValid = true;
  for (const { key, maximum } of NUTRIENT_FIELDS) {
    const nutrientValue = value[key];
    if (
      typeof nutrientValue !== "number" ||
      !Number.isFinite(nutrientValue) ||
      nutrientValue < 0 ||
      nutrientValue > maximum
    ) {
      allNutrientsValid = false;
      addIssue(
        issues,
        `${path}.${key}`,
        "INVALID_NUTRIENT_VALUE",
        `${key} must be a finite number from 0 to ${maximum}.`,
      );
    }
  }

  if (
    allNutrientsValid &&
    NUTRIENT_FIELDS.every(({ key }) => value[key] === 0)
  ) {
    addIssue(
      issues,
      path,
      "EMPTY_NUTRITION_RECORD",
      "At least one nutrition_per_100g value must be greater than zero.",
    );
  }
  validateUnknownFields(
    value,
    path,
    NUTRIENT_FIELDS.map(({ key }) => key),
    issues,
  );
}

function validatePortionRule(value, path, issues) {
  if (!isObject(value)) {
    addIssue(
      issues,
      path,
      "INVALID_PORTION_RULE",
      "portion_rule_g must be an object containing positive integer gram limits.",
    );
    return;
  }

  const fieldIsValid = Object.create(null);
  for (const field of PORTION_RULE_FIELDS) {
    fieldIsValid[field] = isPositiveInteger(value[field]);
    if (!fieldIsValid[field]) {
      addIssue(
        issues,
        `${path}.${field}`,
        "INVALID_PORTION_RULE",
        `${field} must be a positive integer number of grams.`,
      );
    }
  }

  const minimumAndMaximumValid =
    fieldIsValid.minimum_g && fieldIsValid.maximum_g;
  const rangeIsOrdered =
    minimumAndMaximumValid && value.minimum_g <= value.maximum_g;

  if (minimumAndMaximumValid && !rangeIsOrdered) {
    addIssue(
      issues,
      path,
      "INVALID_PORTION_RULE",
      "minimum_g must be less than or equal to maximum_g.",
    );
  }

  const defaultRangeValuesValid =
    rangeIsOrdered && fieldIsValid.default_g;
  const defaultIsInRange =
    defaultRangeValuesValid &&
    value.default_g >= value.minimum_g &&
    value.default_g <= value.maximum_g;

  if (defaultRangeValuesValid && !defaultIsInRange) {
    addIssue(
      issues,
      `${path}.default_g`,
      "INVALID_PORTION_RULE",
      "default_g must be between minimum_g and maximum_g inclusive.",
    );
  }

  if (
    rangeIsOrdered &&
    fieldIsValid.step_g &&
    (value.maximum_g - value.minimum_g) % value.step_g !== 0
  ) {
    addIssue(
      issues,
      `${path}.maximum_g`,
      "INVALID_PORTION_RULE",
      "maximum_g must be aligned to step_g from minimum_g.",
    );
  }

  if (
    defaultIsInRange &&
    fieldIsValid.step_g &&
    (value.default_g - value.minimum_g) % value.step_g !== 0
  ) {
    addIssue(
      issues,
      `${path}.default_g`,
      "INVALID_PORTION_RULE",
      "default_g must be aligned to step_g from minimum_g.",
    );
  }

  validateUnknownFields(value, path, PORTION_RULE_FIELDS, issues);
}

function validateTagArray(value, path, requireEntry, issues) {
  if (!Array.isArray(value) || (requireEntry && value.length === 0)) {
    addIssue(
      issues,
      path,
      "INVALID_TAGS",
      `${path.split(".").at(-1)} must be ${
        requireEntry ? "a non-empty" : "an"
      } array of canonical IDs.`,
    );
    return;
  }

  const seen = new Set();
  for (let index = 0; index < value.length; index += 1) {
    const tag = value[index];
    const entryPath = `${path}[${index}]`;
    if (!isCanonicalId(tag)) {
      addIssue(
        issues,
        entryPath,
        "INVALID_TAGS",
        "Tags must be canonical IDs matching ^[A-Z][A-Z0-9_]*$.",
      );
    }
    if (seen.has(tag)) {
      addIssue(
        issues,
        entryPath,
        "INVALID_TAGS",
        "A tag array must not contain duplicate values.",
      );
    }
    seen.add(tag);
  }
}

function validateTags(value, path, issues) {
  if (!isObject(value)) {
    addIssue(
      issues,
      path,
      "INVALID_TAGS",
      "tags must be an object containing identity, allergen, and intolerance arrays.",
    );
    return;
  }

  validateTagArray(value.identity_tags, `${path}.identity_tags`, true, issues);
  validateTagArray(value.allergen_tags, `${path}.allergen_tags`, false, issues);
  validateTagArray(
    value.intolerance_tags,
    `${path}.intolerance_tags`,
    false,
    issues,
  );
  validateUnknownFields(value, path, TAG_FIELDS, issues);
}

function validateSwap(value, path, issues) {
  if (!isObject(value)) {
    addIssue(
      issues,
      path,
      "INVALID_SWAP_CONFIGURATION",
      "swap must be an object with is_swappable and group_code fields.",
    );
    return;
  }

  const hasValidFlag = typeof value.is_swappable === "boolean";
  if (!hasValidFlag) {
    addIssue(
      issues,
      `${path}.is_swappable`,
      "INVALID_SWAP_CONFIGURATION",
      "is_swappable must be a boolean.",
    );
  }

  if (value.is_swappable === true && value.group_code === null) {
    addIssue(
      issues,
      `${path}.group_code`,
      "INVALID_SWAP_CONFIGURATION",
      "A swappable food requires a non-null canonical swap group code.",
    );
  } else if (value.is_swappable === true && !isCanonicalId(value.group_code)) {
    addIssue(
      issues,
      `${path}.group_code`,
      "INVALID_SWAP_GROUP_CODE",
      "A swappable food requires a canonical swap group code.",
    );
  } else if (value.is_swappable === false && value.group_code !== null) {
    addIssue(
      issues,
      `${path}.group_code`,
      "INVALID_SWAP_CONFIGURATION",
      "A non-swappable food requires group_code to be null.",
    );
  } else if (!hasValidFlag && value.group_code === undefined) {
    addIssue(
      issues,
      `${path}.group_code`,
      "INVALID_SWAP_CONFIGURATION",
      "group_code must be null or a canonical ID according to is_swappable.",
    );
  } else if (
    !hasValidFlag &&
    value.group_code !== null &&
    !isCanonicalId(value.group_code)
  ) {
    addIssue(
      issues,
      `${path}.group_code`,
      "INVALID_SWAP_GROUP_CODE",
      "A non-null swap group code must be a canonical ID.",
    );
  }

  validateUnknownFields(value, path, SWAP_FIELDS, issues);
}

function isValidGregorianDate(value) {
  if (typeof value !== "string") {
    return false;
  }
  const match = CHECKED_DATE_PATTERN.exec(value);
  if (match === null) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) {
    return false;
  }

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return day <= daysInMonth[month - 1];
}

function validateSource(value, path, issues) {
  if (!isObject(value)) {
    addIssue(
      issues,
      path,
      "INVALID_SOURCE",
      "source must be an object containing type, name, reference, and checked_date.",
    );
    return;
  }

  if (!knownSourceTypes.has(value.type)) {
    addIssue(
      issues,
      `${path}.type`,
      "INVALID_SOURCE",
      "source.type must be a known NutritionFoodSourceType.",
    );
  }
  if (!isTrimmedNonEmptyString(value.name)) {
    addIssue(
      issues,
      `${path}.name`,
      "INVALID_SOURCE",
      "source.name must be a non-empty, trimmed string.",
    );
  }
  if (!isTrimmedNonEmptyString(value.reference)) {
    addIssue(
      issues,
      `${path}.reference`,
      "INVALID_SOURCE",
      "source.reference must be a non-empty, trimmed string.",
    );
  }
  if (!isValidGregorianDate(value.checked_date)) {
    addIssue(
      issues,
      `${path}.checked_date`,
      "INVALID_SOURCE",
      "source.checked_date must be a valid Gregorian date in YYYY-MM-DD format.",
    );
  }
  validateUnknownFields(value, path, SOURCE_FIELDS, issues);
}

function validateFoodItem(item, itemIndex, issues) {
  const path = `items[${itemIndex}]`;
  if (!isObject(item)) {
    addIssue(
      issues,
      path,
      "FOOD_ITEM_MUST_BE_OBJECT",
      "Each food catalog item must be an object.",
    );
    return;
  }

  validateCanonicalFoodCode(item.food_code, `${path}.food_code`, issues);
  validateName(item.name_ar, `${path}.name_ar`, issues);
  validateName(item.name_en, `${path}.name_en`, issues);
  validateEnumValue(
    item.food_class,
    knownFoodClasses,
    `${path}.food_class`,
    "INVALID_FOOD_CLASS",
    "food_class",
    issues,
  );
  validateEnumValue(
    item.food_state,
    knownFoodStates,
    `${path}.food_state`,
    "INVALID_FOOD_STATE",
    "food_state",
    issues,
  );

  if (typeof item.is_active !== "boolean") {
    addIssue(
      issues,
      `${path}.is_active`,
      "INVALID_ACTIVE_FLAG",
      "is_active must be a boolean.",
    );
  }
  if (!isPositiveInteger(item.selection_priority)) {
    addIssue(
      issues,
      `${path}.selection_priority`,
      "INVALID_SELECTION_PRIORITY",
      "selection_priority must be a positive integer.",
    );
  }

  validateKnownUniqueArray({
    value: item.compatible_pattern_codes,
    path: `${path}.compatible_pattern_codes`,
    knownValues: knownPatternCodes,
    code: "INVALID_PATTERN_CODES",
    label: "compatible_pattern_codes",
    issues,
  });
  validateKnownUniqueArray({
    value: item.available_markets,
    path: `${path}.available_markets`,
    knownValues: knownMarkets,
    code: "INVALID_MARKETS",
    label: "available_markets",
    issues,
  });
  validateEnumValue(
    item.budget_level,
    knownBudgetLevels,
    `${path}.budget_level`,
    "INVALID_BUDGET_LEVEL",
    "budget_level",
    issues,
  );

  validateLogistics(item.logistics, `${path}.logistics`, issues);
  validateNutritionPer100g(
    item.nutrition_per_100g,
    `${path}.nutrition_per_100g`,
    issues,
  );
  validatePortionRule(item.portion_rule_g, `${path}.portion_rule_g`, issues);
  validateTags(item.tags, `${path}.tags`, issues);
  validateSwap(item.swap, `${path}.swap`, issues);
  validateSource(item.source, `${path}.source`, issues);
  validateUnknownFields(item, path, FOOD_ITEM_FIELDS, issues);
}

function appendDuplicateFoodCodeIssues(items, issues) {
  const firstIndexByCode = new Map();
  items.forEach((item, itemIndex) => {
    if (!isObject(item) || typeof item.food_code !== "string") {
      return;
    }
    if (firstIndexByCode.has(item.food_code)) {
      addIssue(
        issues,
        `items[${itemIndex}].food_code`,
        "DUPLICATE_FOOD_CODE",
        `food_code must be unique; it first appeared at items[${firstIndexByCode.get(
          item.food_code,
        )}].food_code.`,
      );
      return;
    }
    firstIndexByCode.set(item.food_code, itemIndex);
  });
}

function collectActiveSwapGroups(items) {
  const groups = new Map();
  for (const item of items) {
    if (
      !isObject(item) ||
      item.is_active !== true ||
      !isObject(item.swap) ||
      item.swap.is_swappable !== true ||
      !isCanonicalId(item.swap.group_code) ||
      !isCanonicalId(item.food_code) ||
      !knownFoodClasses.has(item.food_class)
    ) {
      continue;
    }

    const group = groups.get(item.swap.group_code) ?? {
      activeItems: [],
      foodClasses: new Set(),
    };
    group.activeItems.push(item);
    group.foodClasses.add(item.food_class);
    groups.set(item.swap.group_code, group);
  }
  return groups;
}

function appendSwapGroupIssues(items, issues) {
  const groups = collectActiveSwapGroups(items);
  const sortedGroupCodes = [...groups.keys()].sort();
  for (const groupCode of sortedGroupCodes) {
    const group = groups.get(groupCode);
    const path = `swap_groups.${groupCode}`;
    if (group.activeItems.length < 2) {
      addIssue(
        issues,
        path,
        "SWAP_GROUP_REQUIRES_TWO_ACTIVE_ITEMS",
        `Swap group ${groupCode} requires at least two active food items.`,
      );
    }
    if (group.foodClasses.size > 1) {
      addIssue(
        issues,
        path,
        "SWAP_GROUP_FOOD_CLASS_MISMATCH",
        `All active food items in swap group ${groupCode} must use the same food_class.`,
      );
    }
  }
}

/**
 * Validates food catalog item records without changing them. Item-level issues
 * follow input and contract field order. Catalog-level duplicate and swap-group
 * issues are appended afterwards in deterministic order.
 *
 * @param {unknown} items
 * @returns {{valid: boolean, issues: import("./domain/contracts.js").NutritionFoodCatalogValidationIssue[]}}
 */
export function validateNutritionFoodCatalogItems(items) {
  const issues = [];
  if (!Array.isArray(items)) {
    addIssue(
      issues,
      "items",
      "ITEMS_MUST_BE_ARRAY",
      "items must be an array.",
    );
    return { valid: false, issues };
  }

  items.forEach((item, itemIndex) => validateFoodItem(item, itemIndex, issues));
  appendDuplicateFoodCodeIssues(items, issues);
  appendSwapGroupIssues(items, issues);

  return { valid: issues.length === 0, issues };
}
