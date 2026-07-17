import assert from "node:assert/strict";
import test from "node:test";

import * as nutritionFoodCatalogApi from
  "z-coaching-intake-decision-engine/nutrition-food-catalog";

const {
  buildNutritionFoodCatalog,
  NUTRITION_FOOD_CATALOG_VERSION,
  NutritionFoodCatalogPolicy,
  NutritionFoodCatalogValidationError,
  NutritionFoodSourceType,
  NutritionFoodState,
  NutritionMarketCode,
  validateNutritionFoodCatalogItems,
} = nutritionFoodCatalogApi;

const FOOD_CLASSES = Object.freeze([
  "ANIMAL_PROTEIN",
  "EGG",
  "DAIRY_PROTEIN",
  "LEGUME",
  "STARCH",
  "FRUIT",
  "NON_STARCH_VEGETABLE",
  "ADDED_FAT",
]);

const ALL_MARKETS = Object.freeze(["EG", "SA", "KW", "BH", "QA", "AE"]);

const ITEM_KEYS = Object.freeze([
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

function makeItem({
  foodCode = "SYNTHETIC_ITEM",
  foodClass = "ANIMAL_PROTEIN",
  isActive = true,
  priority = 10,
  groupCode = null,
} = {}) {
  return {
    food_code: foodCode,
    name_ar: `Synthetic AR ${foodCode}`,
    name_en: `Synthetic EN ${foodCode}`,
    food_class: foodClass,
    food_state: "READY_TO_EAT",
    is_active: isActive,
    selection_priority: priority,
    compatible_pattern_codes: ["MAIN_CLASSIC"],
    available_markets: [...ALL_MARKETS],
    budget_level: "MEDIUM",
    logistics: {
      requires_storage: true,
      requires_reheating: false,
    },
    nutrition_per_100g: {
      calories_kcal: 123.45,
      protein_g: 10.25,
      fat_g: 3.75,
      carbohydrate_g: 12.5,
      fiber_g: 2.25,
    },
    portion_rule_g: {
      minimum_g: 50,
      maximum_g: 250,
      step_g: 10,
      default_g: 150,
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
      reference: `SYNTHETIC-REFERENCE-${foodCode}`,
      checked_date: "2026-07-17",
    },
  };
}

function makeValidItems() {
  return [
    makeItem({
      foodCode: "SYNTH_STARCH_BASE",
      foodClass: "STARCH",
      priority: 30,
    }),
    makeItem({
      foodCode: "SYNTH_ANIMAL_Z",
      foodClass: "ANIMAL_PROTEIN",
      priority: 20,
      groupCode: "Z_ANIMAL_GROUP",
    }),
    makeItem({ foodCode: "SYNTH_EGG", foodClass: "EGG" }),
    makeItem({
      foodCode: "SYNTH_DAIRY",
      foodClass: "DAIRY_PROTEIN",
    }),
    makeItem({ foodCode: "SYNTH_LEGUME", foodClass: "LEGUME" }),
    makeItem({ foodCode: "SYNTH_FRUIT", foodClass: "FRUIT" }),
    makeItem({
      foodCode: "SYNTH_VEGETABLE",
      foodClass: "NON_STARCH_VEGETABLE",
    }),
    makeItem({ foodCode: "SYNTH_FAT", foodClass: "ADDED_FAT" }),
    makeItem({
      foodCode: "SYNTH_ANIMAL_A",
      foodClass: "ANIMAL_PROTEIN",
      priority: 10,
      groupCode: "Z_ANIMAL_GROUP",
    }),
    makeItem({
      foodCode: "SYNTH_STARCH_Z",
      foodClass: "STARCH",
      priority: 20,
      groupCode: "A_STARCH_GROUP",
    }),
    makeItem({
      foodCode: "SYNTH_STARCH_A",
      foodClass: "STARCH",
      priority: 10,
      groupCode: "A_STARCH_GROUP",
    }),
  ];
}

function issueCodes(result) {
  return result.issues.map((issue) => issue.code);
}

function issuesWithCode(result, code) {
  return result.issues.filter((issue) => issue.code === code);
}

function assertInvalid(items, code) {
  const result = validateNutritionFoodCatalogItems(items);
  assert.equal(result.valid, false);
  assert.ok(issueCodes(result).includes(code), JSON.stringify(result.issues));
  return result;
}

function assertValid(items) {
  assert.deepEqual(validateNutritionFoodCatalogItems(items), {
    valid: true,
    issues: [],
  });
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

function collectKeys(value, keys = new Set(), seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) {
    return keys;
  }
  seen.add(value);
  for (const key of Object.keys(value)) {
    keys.add(key);
    collectKeys(value[key], keys, seen);
  }
  return keys;
}

test("Public API exposes only the approved version, enums, error, validator, and builder", () => {
  assert.equal(
    NUTRITION_FOOD_CATALOG_VERSION,
    "nutrition-food-catalog-v1",
  );
  assert.deepEqual(Object.keys(nutritionFoodCatalogApi).sort(), [
    "NUTRITION_FOOD_CATALOG_VERSION",
    "NutritionFoodCatalogPolicy",
    "NutritionFoodCatalogValidationError",
    "NutritionFoodSourceType",
    "NutritionFoodState",
    "NutritionMarketCode",
    "buildNutritionFoodCatalog",
    "validateNutritionFoodCatalogItems",
  ].sort());
  assert.equal(typeof NutritionFoodCatalogValidationError, "function");
  assert.equal(typeof validateNutritionFoodCatalogItems, "function");
  assert.equal(typeof buildNutritionFoodCatalog, "function");
  assert.deepEqual(NutritionFoodCatalogPolicy, {
    Z_COACHING_FOOD_CATALOG_V1: "Z_COACHING_FOOD_CATALOG_V1",
  });
  assert.deepEqual(NutritionFoodState, {
    RAW: "RAW",
    COOKED: "COOKED",
    READY_TO_EAT: "READY_TO_EAT",
  });
  assert.deepEqual(NutritionFoodSourceType, {
    FOOD_COMPOSITION_DATABASE: "FOOD_COMPOSITION_DATABASE",
    MANUFACTURER_LABEL: "MANUFACTURER_LABEL",
    COACH_VERIFIED: "COACH_VERIFIED",
  });
  assert.deepEqual(NutritionMarketCode, {
    EG: "EG",
    SA: "SA",
    KW: "KW",
    BH: "BH",
    QA: "QA",
    AE: "AE",
  });
});

test("all catalog enums are frozen", () => {
  for (const enumObject of [
    NutritionFoodCatalogPolicy,
    NutritionFoodState,
    NutritionFoodSourceType,
    NutritionMarketCode,
  ]) {
    assert.equal(Object.isFrozen(enumObject), true);
  }
});

test("a valid exact-contract catalog covers every NutritionFoodClass", () => {
  const catalog = buildNutritionFoodCatalog(makeValidItems());
  assert.equal(
    catalog.food_catalog_version,
    "nutrition-food-catalog-v1",
  );
  assert.equal(
    catalog.catalog_policy,
    "Z_COACHING_FOOD_CATALOG_V1",
  );
  assert.deepEqual(
    [...new Set(catalog.items.map((item) => item.food_class))].sort(),
    [...FOOD_CLASSES].sort(),
  );
  assert.deepEqual(Object.keys(catalog).sort(), [
    "food_catalog_version",
    "catalog_policy",
    "items_count",
    "active_items_count",
    "items",
    "swap_groups",
  ].sort());
  for (const item of catalog.items) {
    assert.deepEqual(Object.keys(item).sort(), [...ITEM_KEYS].sort());
    assert.deepEqual(Object.keys(item.logistics).sort(), [
      "requires_storage",
      "requires_reheating",
    ].sort());
    assert.deepEqual(Object.keys(item.nutrition_per_100g).sort(), [
      "calories_kcal",
      "protein_g",
      "fat_g",
      "carbohydrate_g",
      "fiber_g",
    ].sort());
    assert.deepEqual(Object.keys(item.portion_rule_g).sort(), [
      "minimum_g",
      "maximum_g",
      "step_g",
      "default_g",
    ].sort());
    assert.deepEqual(Object.keys(item.tags).sort(), [
      "identity_tags",
      "allergen_tags",
      "intolerance_tags",
    ].sort());
    assert.deepEqual(Object.keys(item.swap).sort(), [
      "is_swappable",
      "group_code",
    ].sort());
    assert.deepEqual(Object.keys(item.source).sort(), [
      "type",
      "name",
      "reference",
      "checked_date",
    ].sort());
  }
});

test("items_count and active_items_count reflect the supplied items", () => {
  const items = makeValidItems();
  items[0].is_active = false;
  const catalog = buildNutritionFoodCatalog(items);
  assert.equal(catalog.items_count, items.length);
  assert.equal(catalog.active_items_count, items.length - 1);
});

test("catalog item order remains identical to input order", () => {
  const items = makeValidItems();
  const catalog = buildNutritionFoodCatalog(items);
  assert.deepEqual(
    catalog.items.map((item) => item.food_code),
    items.map((item) => item.food_code),
  );
});

test("swap groups are derived and deterministically sorted", () => {
  const catalog = buildNutritionFoodCatalog(makeValidItems());
  assert.deepEqual(catalog.swap_groups, [
    {
      group_code: "A_STARCH_GROUP",
      food_class: "STARCH",
      active_item_codes: ["SYNTH_STARCH_A", "SYNTH_STARCH_Z"],
    },
    {
      group_code: "Z_ANIMAL_GROUP",
      food_class: "ANIMAL_PROTEIN",
      active_item_codes: ["SYNTH_ANIMAL_A", "SYNTH_ANIMAL_Z"],
    },
  ]);
  for (const group of catalog.swap_groups) {
    assert.deepEqual(Object.keys(group).sort(), [
      "group_code",
      "food_class",
      "active_item_codes",
    ].sort());
  }
});

test("a swappable group with two active items of one food class succeeds", () => {
  const items = [
    makeItem({ foodCode: "ACTIVE_B", groupCode: "VALID_GROUP" }),
    makeItem({ foodCode: "ACTIVE_A", groupCode: "VALID_GROUP" }),
  ];
  assertValid(items);
  assert.deepEqual(buildNutritionFoodCatalog(items).swap_groups, [{
    group_code: "VALID_GROUP",
    food_class: "ANIMAL_PROTEIN",
    active_item_codes: ["ACTIVE_A", "ACTIVE_B"],
  }]);
});

test("a swap group with only one active item fails", () => {
  const result = assertInvalid([
    makeItem({ foodCode: "ONLY_ACTIVE", groupCode: "LONELY_GROUP" }),
  ], "SWAP_GROUP_REQUIRES_TWO_ACTIVE_ITEMS");
  assert.equal(
    issuesWithCode(result, "SWAP_GROUP_REQUIRES_TWO_ACTIVE_ITEMS").length,
    1,
  );
});

test("a swap group containing active items from different food classes fails", () => {
  const result = assertInvalid([
    makeItem({
      foodCode: "ANIMAL_MEMBER",
      foodClass: "ANIMAL_PROTEIN",
      groupCode: "MIXED_GROUP",
    }),
    makeItem({
      foodCode: "STARCH_MEMBER",
      foodClass: "STARCH",
      groupCode: "MIXED_GROUP",
    }),
  ], "SWAP_GROUP_FOOD_CLASS_MISMATCH");
  assert.equal(
    issuesWithCode(result, "SWAP_GROUP_FOOD_CLASS_MISMATCH").length,
    1,
  );
});

test("an inactive item does not count as an active swap alternative", () => {
  assertInvalid([
    makeItem({ foodCode: "ACTIVE_MEMBER", groupCode: "ACTIVE_ONLY_GROUP" }),
    makeItem({
      foodCode: "INACTIVE_MEMBER",
      isActive: false,
      groupCode: "ACTIVE_ONLY_GROUP",
    }),
  ], "SWAP_GROUP_REQUIRES_TWO_ACTIVE_ITEMS");
});

test("a non-swappable item with a non-null group code fails", () => {
  const item = makeItem();
  item.swap = { is_swappable: false, group_code: "FORBIDDEN_GROUP" };
  assertInvalid([item], "INVALID_SWAP_CONFIGURATION");
});

test("a swappable item with a null group code fails", () => {
  const item = makeItem();
  item.swap = { is_swappable: true, group_code: null };
  assertInvalid([item], "INVALID_SWAP_CONFIGURATION");
});

test("duplicate food_code values fail even across active and inactive items", () => {
  const active = makeItem({ foodCode: "DUPLICATE_CODE" });
  const inactive = makeItem({
    foodCode: "DUPLICATE_CODE",
    isActive: false,
  });
  assertInvalid([active, inactive], "DUPLICATE_FOOD_CODE");
});

test("canonical IDs reject lowercase, spaces, and hyphens but allow underscores", () => {
  for (const invalidCode of ["lowercase", "HAS SPACE", "HAS-HYPHEN", ""] ) {
    const item = makeItem();
    item.food_code = invalidCode;
    assertInvalid([item], "INVALID_CANONICAL_ID");
  }
  assertValid([makeItem({ foodCode: "VALID_UNDERSCORE_2" })]);

  const invalidSwapGroup = makeItem();
  invalidSwapGroup.swap = {
    is_swappable: true,
    group_code: "invalid-group",
  };
  assertInvalid([invalidSwapGroup], "INVALID_SWAP_GROUP_CODE");
});

test("empty or untrimmed Arabic and English names fail", () => {
  const item = makeItem();
  item.name_ar = " ";
  item.name_en = " Untrimmed ";
  const result = assertInvalid([item], "INVALID_NAME");
  assert.deepEqual(
    issuesWithCode(result, "INVALID_NAME").map((issue) => issue.path),
    ["items[0].name_ar", "items[0].name_en"],
  );
});

test("an unknown food class fails", () => {
  const item = makeItem();
  item.food_class = "UNKNOWN_CLASS";
  assertInvalid([item], "INVALID_FOOD_CLASS");
});

test("an unknown food state fails", () => {
  const item = makeItem();
  item.food_state = "FROZEN";
  assertInvalid([item], "INVALID_FOOD_STATE");
});

test("pattern codes must be a non-empty unique array of known values", () => {
  for (const patternCodes of [
    [],
    ["MAIN_CLASSIC", "MAIN_CLASSIC"],
    ["UNKNOWN_PATTERN"],
    "MAIN_CLASSIC",
  ]) {
    const item = makeItem();
    item.compatible_pattern_codes = patternCodes;
    assertInvalid([item], "INVALID_PATTERN_CODES");
  }
  const orderedItem = makeItem();
  orderedItem.compatible_pattern_codes = [
    "SNACK_PROTEIN_CARB",
    "BREAKFAST_SAVORY",
    "MAIN_CLASSIC",
  ];
  assert.deepEqual(
    buildNutritionFoodCatalog([orderedItem]).items[0]
      .compatible_pattern_codes,
    orderedItem.compatible_pattern_codes,
  );
});

test("markets must be non-empty, unique, and known while all six V1 markets succeed", () => {
  for (const markets of [[], ["EG", "EG"], ["OM"], "EG"]) {
    const item = makeItem();
    item.available_markets = markets;
    assertInvalid([item], "INVALID_MARKETS");
  }
  const item = makeItem();
  item.available_markets = [...ALL_MARKETS];
  const catalog = buildNutritionFoodCatalog([item]);
  assert.deepEqual(catalog.items[0].available_markets, ALL_MARKETS);
});

test("an unknown budget level fails", () => {
  const item = makeItem();
  item.budget_level = "UNLIMITED";
  assertInvalid([item], "INVALID_BUDGET_LEVEL");
});

test("logistics requires exactly two Boolean values", () => {
  for (const logistics of [
    null,
    {},
    { requires_storage: "YES", requires_reheating: false },
    { requires_storage: true, requires_reheating: 0 },
  ]) {
    const item = makeItem();
    item.logistics = logistics;
    assertInvalid([item], "INVALID_LOGISTICS");
  }
});

test("all nutrition-per-100g fields enforce their inclusive finite bounds", () => {
  const fields = {
    calories_kcal: 1000,
    protein_g: 100,
    fat_g: 100,
    carbohydrate_g: 100,
    fiber_g: 100,
  };
  for (const [field, maximum] of Object.entries(fields)) {
    for (const validValue of [0, maximum]) {
      const item = makeItem();
      item.nutrition_per_100g[field] = validValue;
      assertValid([item]);
    }
    for (const invalidValue of [-0.01, maximum + 0.01, Infinity, NaN, "1"]) {
      const item = makeItem();
      item.nutrition_per_100g[field] = invalidValue;
      const result = assertInvalid([item], "INVALID_NUTRIENT_VALUE");
      assert.ok(issuesWithCode(result, "INVALID_NUTRIENT_VALUE").some(
        (issue) => issue.path === `items[0].nutrition_per_100g.${field}`,
      ));
    }
  }
  const item = makeItem();
  item.nutrition_per_100g.protein_g = 101;
  const issue = issuesWithCode(
    assertInvalid([item], "INVALID_NUTRIENT_VALUE"),
    "INVALID_NUTRIENT_VALUE",
  ).find(({ path }) => path.endsWith("protein_g"));
  assert.equal(
    issue.message,
    "protein_g must be a finite number from 0 to 100.",
  );
});

test("an all-zero nutrition record fails", () => {
  const item = makeItem();
  item.nutrition_per_100g = {
    calories_kcal: 0,
    protein_g: 0,
    fat_g: 0,
    carbohydrate_g: 0,
    fiber_g: 0,
  };
  assertInvalid([item], "EMPTY_NUTRITION_RECORD");
});

test("calories and decimal nutrition values are preserved without recalculation", () => {
  const item = makeItem();
  item.nutrition_per_100g = {
    calories_kcal: 199.99,
    protein_g: 1.11,
    fat_g: 2.22,
    carbohydrate_g: 3.33,
    fiber_g: 4.44,
  };
  const catalog = buildNutritionFoodCatalog([item]);
  assert.deepEqual(
    catalog.items[0].nutrition_per_100g,
    item.nutrition_per_100g,
  );
  assert.notEqual(catalog.items[0].nutrition_per_100g.calories_kcal, 38);
});

test("portion rules reject invalid ranges, non-positive steps, and misalignment", () => {
  const invalidRules = [
    { minimum_g: 250, maximum_g: 50, step_g: 10, default_g: 150 },
    { minimum_g: 50, maximum_g: 250, step_g: 10, default_g: 260 },
    { minimum_g: 50, maximum_g: 250, step_g: 0, default_g: 150 },
    { minimum_g: 50, maximum_g: 250, step_g: 10, default_g: 155 },
    { minimum_g: 50, maximum_g: 255, step_g: 10, default_g: 150 },
    { minimum_g: 50.5, maximum_g: 250, step_g: 10, default_g: 150 },
  ];
  for (const portionRule of invalidRules) {
    const item = makeItem();
    item.portion_rule_g = portionRule;
    assertInvalid([item], "INVALID_PORTION_RULE");
  }
});

test("identity_tags must contain at least one canonical ID", () => {
  const item = makeItem();
  item.tags.identity_tags = [];
  assertInvalid([item], "INVALID_TAGS");
});

test("duplicate or non-canonical tags fail without cross-tag interpretation", () => {
  const invalidTagSets = [
    {
      identity_tags: ["SYNTHETIC_ITEM", "SYNTHETIC_ITEM"],
      allergen_tags: [],
      intolerance_tags: [],
    },
    {
      identity_tags: ["SYNTHETIC_ITEM"],
      allergen_tags: ["milk"],
      intolerance_tags: [],
    },
    {
      identity_tags: ["SYNTHETIC_ITEM"],
      allergen_tags: [],
      intolerance_tags: ["HAS SPACE"],
    },
  ];
  for (const tags of invalidTagSets) {
    const item = makeItem();
    item.tags = tags;
    assertInvalid([item], "INVALID_TAGS");
  }
  const item = makeItem();
  item.tags = {
    identity_tags: ["MILK_IDENTITY"],
    allergen_tags: ["MILK_ALLERGEN"],
    intolerance_tags: ["LACTOSE_INTOLERANCE"],
  };
  assert.deepEqual(buildNutritionFoodCatalog([item]).items[0].tags, item.tags);
});

test("an unknown source type fails", () => {
  const item = makeItem();
  item.source.type = "WEB_SEARCH";
  assertInvalid([item], "INVALID_SOURCE");
});

test("empty or untrimmed source names and references fail", () => {
  const item = makeItem();
  item.source.name = " ";
  item.source.reference = " Untrimmed reference ";
  const result = assertInvalid([item], "INVALID_SOURCE");
  assert.ok(issuesWithCode(result, "INVALID_SOURCE").length >= 2);
});

test("checked_date must be a real Gregorian YYYY-MM-DD date", () => {
  for (const checkedDate of [
    "2026-02-29",
    "2026-13-01",
    "2026-04-31",
    "17-07-2026",
    "not-a-date",
  ]) {
    const item = makeItem();
    item.source.checked_date = checkedDate;
    assertInvalid([item], "INVALID_SOURCE");
  }
  const leapDay = makeItem();
  leapDay.source.checked_date = "2024-02-29";
  assertValid([leapDay]);
  const futureDate = makeItem();
  futureDate.source.checked_date = "2099-01-01";
  assertValid([futureDate]);
});

test("unknown fields fail at every exact-contract object level", () => {
  const placements = [
    (item) => { item.unknown_item_field = true; },
    (item) => { item.logistics.unknown_logistics_field = true; },
    (item) => { item.nutrition_per_100g.per_serving = 1; },
    (item) => { item.portion_rule_g.household_measure = "cup"; },
    (item) => { item.tags.medical_interpretation = "NONE"; },
    (item) => { item.swap.alternatives = []; },
    (item) => { item.source.downloaded_at = "2026-07-17"; },
  ];
  for (const addUnknownField of placements) {
    const item = makeItem();
    addUnknownField(item);
    assertInvalid([item], "UNKNOWN_FOOD_ITEM_FIELD");
  }
});

test("validator aggregates issues in deterministic item, field, and catalog order", () => {
  const invalidRoot = validateNutritionFoodCatalogItems(null);
  assert.equal(invalidRoot.valid, false);
  assert.equal(invalidRoot.issues.length, 1);
  assert.equal(invalidRoot.issues[0].path, "items");
  assert.equal(invalidRoot.issues[0].code, "ITEMS_MUST_BE_ARRAY");
  assert.equal(typeof invalidRoot.issues[0].message, "string");
  assert.ok(invalidRoot.issues[0].message.length > 0);
  assertInvalid([null], "FOOD_ITEM_MUST_BE_OBJECT");

  const first = makeItem({
    foodCode: "FIRST_MEMBER",
    groupCode: "Z_SINGLE_GROUP",
  });
  first.name_ar = "";
  first.name_en = " untrimmed ";
  first.food_state = "UNKNOWN_STATE";
  first.selection_priority = 0;
  first.compatible_pattern_codes = ["UNKNOWN_PATTERN"];
  first.nutrition_per_100g.protein_g = 101;
  const second = makeItem({
    foodCode: "SECOND_MEMBER",
    groupCode: "A_SINGLE_GROUP",
  });
  second.name_en = " untrimmed ";
  second.food_state = "UNKNOWN_STATE";
  const third = makeItem({ foodCode: "THIRD_ITEM" });
  third.is_active = "true";
  const items = [first, second, third];
  const one = validateNutritionFoodCatalogItems(items);
  const two = validateNutritionFoodCatalogItems(items);

  assert.deepEqual(one, two);
  assert.ok(one.issues.length >= 9);
  assert.ok(issueCodes(one).includes("INVALID_ACTIVE_FLAG"));
  assert.ok(issueCodes(one).includes("INVALID_SELECTION_PRIORITY"));
  const itemIndexes = one.issues
    .map((issue) => /^items\[(\d+)]/.exec(issue.path))
    .filter(Boolean)
    .map((match) => Number(match[1]));
  assert.deepEqual(itemIndexes, [...itemIndexes].sort((a, b) => a - b));

  const firstItemPaths = one.issues
    .filter((issue) => issue.path.startsWith("items[0]."))
    .map((issue) => issue.path);
  assert.deepEqual(firstItemPaths, [
    "items[0].name_ar",
    "items[0].name_en",
    "items[0].food_state",
    "items[0].selection_priority",
    "items[0].compatible_pattern_codes[0]",
    "items[0].nutrition_per_100g.protein_g",
  ]);

  const firstCatalogIssueIndex = one.issues.findIndex((issue) =>
    issue.code.startsWith("SWAP_GROUP_"));
  const lastItemIssueIndex = one.issues.reduce(
    (last, issue, index) => issue.path.startsWith("items[") ? index : last,
    -1,
  );
  assert.ok(firstCatalogIssueIndex > lastItemIssueIndex);
  assert.deepEqual(
    one.issues
      .filter((issue) => issue.code === "SWAP_GROUP_REQUIRES_TWO_ACTIVE_ITEMS")
      .map((issue) => issue.path),
    ["swap_groups.A_SINGLE_GROUP", "swap_groups.Z_SINGLE_GROUP"],
  );
});

test("builder throws NutritionFoodCatalogValidationError and preserves issues", () => {
  const item = makeItem();
  item.name_en = "";
  const validation = validateNutritionFoodCatalogItems([item]);
  assert.throws(
    () => buildNutritionFoodCatalog([item]),
    (error) => {
      assert.ok(error instanceof NutritionFoodCatalogValidationError);
      assert.equal(error.name, "NutritionFoodCatalogValidationError");
      assert.deepEqual(error.issues, validation.issues);
      return true;
    },
  );
});

test("building neither mutates nor freezes input items", () => {
  const items = makeValidItems();
  const before = structuredClone(items);
  buildNutritionFoodCatalog(items);
  assert.deepEqual(items, before);
  assert.equal(Object.isFrozen(items), false);
  assert.equal(Object.isFrozen(items[0]), false);
  assert.equal(Object.isFrozen(items[0].nutrition_per_100g), false);
  assert.equal(Object.isFrozen(items[0].tags.identity_tags), false);
});

test("catalog output is independent from inputs and deeply frozen", () => {
  const items = makeValidItems();
  const catalog = buildNutritionFoodCatalog(items);
  const before = structuredClone(catalog);
  assertDeepFrozen(catalog);
  assert.notStrictEqual(catalog.items, items);
  assert.notStrictEqual(catalog.items[0], items[0]);
  assert.notStrictEqual(
    catalog.items[0].nutrition_per_100g,
    items[0].nutrition_per_100g,
  );
  assert.notStrictEqual(catalog.items[0].tags, items[0].tags);
  items[0].nutrition_per_100g.calories_kcal = 999;
  items[0].tags.identity_tags.push("NEW_INPUT_TAG");
  assert.deepEqual(catalog, before);
});

test("mutating nested nutrition, tags, and derived swap groups throws", () => {
  const catalog = buildNutritionFoodCatalog(makeValidItems());
  assert.throws(() => {
    catalog.items[0].nutrition_per_100g.calories_kcal = 999;
  }, TypeError);
  assert.throws(() => {
    catalog.items[0].tags.identity_tags.push("NEW_TAG");
  }, TypeError);
  assert.throws(() => {
    catalog.swap_groups[0].active_item_codes.push("NEW_ITEM");
  }, TypeError);
});

test("catalog excludes selection, meals, quantities, serving units, and recommendations", () => {
  const keys = collectKeys(buildNutritionFoodCatalog(makeValidItems()));
  for (const forbiddenKey of [
    "selected_food",
    "selected_quantity",
    "meals",
    "recipes",
    "ingredients",
    "client",
    "calorie_target",
    "macro_target",
    "serving_unit",
    "household_measure",
    "alternatives",
    "recommendation",
  ]) {
    assert.equal(keys.has(forbiddenKey), false);
  }
});

test("validator returns the exact valid result for a valid synthetic catalog", () => {
  assert.deepEqual(validateNutritionFoodCatalogItems(makeValidItems()), {
    valid: true,
    issues: [],
  });
});
