import { NUTRITION_FOOD_CATALOG_VERSION } from "./domain/contracts.js";
import { NutritionFoodCatalogPolicy } from "./domain/enums.js";
import { NutritionFoodCatalogValidationError } from "./validation-error.js";
import {
  validateNutritionFoodCatalogItems,
} from "./validate-nutrition-food-catalog-items.js";

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

function buildSwapGroups(items) {
  const groups = new Map();
  for (const item of items) {
    if (!item.is_active || !item.swap.is_swappable) {
      continue;
    }

    const group = groups.get(item.swap.group_code) ?? {
      group_code: item.swap.group_code,
      food_class: item.food_class,
      active_item_codes: [],
    };
    group.active_item_codes.push(item.food_code);
    groups.set(item.swap.group_code, group);
  }

  return [...groups.values()]
    .sort((left, right) =>
      left.group_code < right.group_code
        ? -1
        : left.group_code > right.group_code
          ? 1
          : 0,
    )
    .map((group) => ({
      ...group,
      active_item_codes: [...group.active_item_codes].sort(),
    }));
}

/**
 * Builds an immutable catalog from already structured food item records.
 * Validation is performed before cloning, and neither the caller's array nor
 * any nested input record is changed or frozen.
 *
 * @param {unknown} items
 * @returns {import("./domain/contracts.js").NutritionFoodCatalog}
 * @throws {NutritionFoodCatalogValidationError}
 */
export function buildNutritionFoodCatalog(items) {
  const validation = validateNutritionFoodCatalogItems(items);
  if (!validation.valid) {
    throw new NutritionFoodCatalogValidationError(validation.issues);
  }

  const catalogItems = structuredClone(items);
  return deepFreeze({
    food_catalog_version: NUTRITION_FOOD_CATALOG_VERSION,
    catalog_policy:
      NutritionFoodCatalogPolicy.Z_COACHING_FOOD_CATALOG_V1,
    items_count: catalogItems.length,
    active_items_count: catalogItems.filter((item) => item.is_active).length,
    items: catalogItems,
    swap_groups: buildSwapGroups(catalogItems),
  });
}
