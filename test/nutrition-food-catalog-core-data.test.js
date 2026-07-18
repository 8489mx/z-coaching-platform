import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import ExcelJS from "exceljs";

import {
  importNutritionFoodCatalogWorkbook,
} from "../tools/nutrition-food-catalog-excel/index.js";

const TEST_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(TEST_DIRECTORY, "..");
const CATALOG_DIRECTORY = path.join(PROJECT_ROOT, "data", "catalogs");
const PRODUCTION_WORKBOOK_PATH = path.join(
  CATALOG_DIRECTORY,
  "core-global-food-batch-v1.xlsx",
);
const PRODUCTION_JSON_PATH = path.join(
  CATALOG_DIRECTORY,
  "core-global-food-batch-v1.json",
);
const OFFICIAL_TEMPLATE_PATH = path.join(
  PROJECT_ROOT,
  "data-templates",
  "nutrition-food-catalog-v1.xlsx",
);

const EXPECTED_FOOD_CODES = Object.freeze([
  "CHICKEN_BREAST_ROASTED_SKINLESS",
  "TUNA_LIGHT_CANNED_WATER_DRAINED",
  "BEEF_GROUND_90_LEAN_COOKED",
  "EGG_WHOLE_HARD_BOILED",
  "EGG_WHITE_COOKED",
  "YOGURT_PLAIN_LOW_FAT",
  "GREEK_YOGURT_PLAIN_NONFAT",
  "COTTAGE_CHEESE_LOW_FAT_2_PERCENT",
  "LENTILS_MATURE_COOKED",
  "CHICKPEAS_MATURE_COOKED",
  "FAVA_BEANS_MATURE_COOKED",
  "RICE_WHITE_LONG_GRAIN_COOKED",
  "POTATO_BOILED_WITHOUT_SKIN",
  "OATS_ROLLED_DRY",
  "BREAD_WHOLE_WHEAT",
  "PASTA_SPAGHETTI_COOKED",
  "BANANA_RAW",
  "APPLE_RAW_WITH_SKIN",
  "ORANGE_RAW",
  "TOMATO_RED_RAW",
  "CUCUMBER_WITH_PEEL_RAW",
  "CARROT_RAW",
  "OLIVE_OIL",
  "SUNFLOWER_OIL",
]);

const EXPECTED_CLASS_COUNTS = Object.freeze({
  ANIMAL_PROTEIN: 3,
  EGG: 2,
  DAIRY_PROTEIN: 3,
  LEGUME: 3,
  STARCH: 5,
  FRUIT: 3,
  NON_STARCH_VEGETABLE: 3,
  ADDED_FAT: 2,
});

const EXPECTED_MARKETS = Object.freeze(["EG", "SA", "KW", "BH", "QA", "AE"]);

const EXPECTED_PATTERNS_BY_CLASS = Object.freeze({
  ANIMAL_PROTEIN: Object.freeze([
    "MAIN_CLASSIC",
    "EVENING_CLASSIC",
    "EVENING_LIGHT_SAVORY",
    "SNACK_PROTEIN_CARB",
  ]),
  EGG: Object.freeze([
    "BREAKFAST_SAVORY",
    "MAIN_CLASSIC",
    "EVENING_CLASSIC",
    "EVENING_LIGHT_SAVORY",
    "SNACK_PROTEIN_CARB",
  ]),
  DAIRY_PROTEIN: Object.freeze([
    "BREAKFAST_SAVORY",
    "BREAKFAST_DAIRY_FRUIT",
    "BREAKFAST_LEGUME",
    "MAIN_LEGUME",
    "EVENING_LIGHT_SAVORY",
    "SNACK_DAIRY_FRUIT",
    "SNACK_PROTEIN_CARB",
  ]),
  LEGUME: Object.freeze(["BREAKFAST_LEGUME", "MAIN_LEGUME"]),
  STARCH: Object.freeze([
    "BREAKFAST_SAVORY",
    "BREAKFAST_DAIRY_FRUIT",
    "BREAKFAST_LEGUME",
    "MAIN_CLASSIC",
    "MAIN_LEGUME",
    "EVENING_CLASSIC",
    "EVENING_LIGHT_SAVORY",
    "SNACK_DAIRY_FRUIT",
    "SNACK_PROTEIN_CARB",
  ]),
  FRUIT: Object.freeze([
    "BREAKFAST_DAIRY_FRUIT",
    "SNACK_DAIRY_FRUIT",
    "SNACK_PROTEIN_CARB",
  ]),
  NON_STARCH_VEGETABLE: Object.freeze([
    "BREAKFAST_SAVORY",
    "BREAKFAST_LEGUME",
    "MAIN_CLASSIC",
    "MAIN_LEGUME",
    "EVENING_CLASSIC",
    "EVENING_LIGHT_SAVORY",
  ]),
  ADDED_FAT: Object.freeze([
    "BREAKFAST_SAVORY",
    "BREAKFAST_DAIRY_FRUIT",
    "BREAKFAST_LEGUME",
    "MAIN_CLASSIC",
    "MAIN_LEGUME",
    "EVENING_CLASSIC",
    "EVENING_LIGHT_SAVORY",
    "SNACK_DAIRY_FRUIT",
    "SNACK_PROTEIN_CARB",
  ]),
});

const EXPECTED_NUTRITION = Object.freeze({
  CHICKEN_BREAST_ROASTED_SKINLESS: [165, 31.02, 3.57, 0, 0],
  TUNA_LIGHT_CANNED_WATER_DRAINED: [86, 19.44, 0.96, 0, 0],
  BEEF_GROUND_90_LEAN_COOKED: [230, 28.45, 12.04, 0, 0],
  EGG_WHOLE_HARD_BOILED: [155, 12.58, 10.61, 1.12, 0],
  EGG_WHITE_COOKED: [52, 10.7, 0, 2.35, 0],
  YOGURT_PLAIN_LOW_FAT: [63, 5.25, 1.55, 7.04, 0],
  GREEK_YOGURT_PLAIN_NONFAT: [59, 10.19, 0.39, 3.6, 0],
  COTTAGE_CHEESE_LOW_FAT_2_PERCENT: [81, 10.45, 2.27, 4.76, 0],
  LENTILS_MATURE_COOKED: [116, 9.02, 0.38, 20.13, 7.9],
  CHICKPEAS_MATURE_COOKED: [164, 8.86, 2.59, 27.42, 7.6],
  FAVA_BEANS_MATURE_COOKED: [110, 7.6, 0.4, 19.65, 5.4],
  RICE_WHITE_LONG_GRAIN_COOKED: [130, 2.69, 0.28, 28.17, 0.4],
  POTATO_BOILED_WITHOUT_SKIN: [86, 1.71, 0.1, 20.01, 1.8],
  OATS_ROLLED_DRY: [378.866123, 13.49645, 5.89, 68.65755, 10.42],
  BREAD_WHOLE_WHEAT: [252, 12.45, 3.5, 42.71, 6],
  PASTA_SPAGHETTI_COOKED: [157, 5.76, 0.92, 30.7, 1.8],
  BANANA_RAW: [88, 0.74, 0.29, 23, 1.7],
  APPLE_RAW_WITH_SKIN: [52, 0.26, 0.17, 13.81, 2.4],
  ORANGE_RAW: [47, 0.94, 0.12, 11.75, 2.4],
  TOMATO_RED_RAW: [18, 0.88, 0.2, 3.89, 1.2],
  CUCUMBER_WITH_PEEL_RAW: [15, 0.65, 0.11, 3.63, 0.5],
  CARROT_RAW: [44.978589, 0.94125, 0.3506, 10.26755, 3.095],
  OLIVE_OIL: [884, 0, 100, 0, 0],
  SUNFLOWER_OIL: [884, 0, 100, 0, 0],
});

const EXPECTED_PORTIONS = Object.freeze({
  CHICKEN_BREAST_ROASTED_SKINLESS: [50, 250, 10, 150],
  TUNA_LIGHT_CANNED_WATER_DRAINED: [50, 200, 10, 100],
  BEEF_GROUND_90_LEAN_COOKED: [50, 250, 10, 150],
  EGG_WHOLE_HARD_BOILED: [50, 250, 10, 100],
  EGG_WHITE_COOKED: [50, 250, 10, 100],
  YOGURT_PLAIN_LOW_FAT: [100, 400, 25, 200],
  GREEK_YOGURT_PLAIN_NONFAT: [100, 400, 25, 200],
  COTTAGE_CHEESE_LOW_FAT_2_PERCENT: [50, 300, 25, 150],
  LENTILS_MATURE_COOKED: [50, 350, 25, 150],
  CHICKPEAS_MATURE_COOKED: [50, 350, 25, 150],
  FAVA_BEANS_MATURE_COOKED: [50, 350, 25, 150],
  RICE_WHITE_LONG_GRAIN_COOKED: [50, 400, 25, 200],
  POTATO_BOILED_WITHOUT_SKIN: [100, 500, 25, 250],
  OATS_ROLLED_DRY: [20, 150, 10, 50],
  BREAD_WHOLE_WHEAT: [25, 200, 25, 50],
  PASTA_SPAGHETTI_COOKED: [50, 400, 25, 200],
  BANANA_RAW: [50, 300, 10, 150],
  APPLE_RAW_WITH_SKIN: [50, 300, 10, 150],
  ORANGE_RAW: [50, 300, 10, 150],
  TOMATO_RED_RAW: [50, 400, 25, 150],
  CUCUMBER_WITH_PEEL_RAW: [50, 400, 25, 150],
  CARROT_RAW: [50, 400, 25, 150],
  OLIVE_OIL: [5, 40, 5, 10],
  SUNFLOWER_OIL: [5, 40, 5, 10],
});

const EXPECTED_SOURCES = Object.freeze({
  CHICKEN_BREAST_ROASTED_SKINLESS: [171477, "SR_LEGACY", "Chicken, broilers or fryers, breast, meat only, cooked, roasted", 1008, 1079],
  TUNA_LIGHT_CANNED_WATER_DRAINED: [173709, "SR_LEGACY", "Fish, tuna, light, canned in water, drained solids (Includes foods for USDA's Food Distribution Program)", 1008, 1079],
  BEEF_GROUND_90_LEAN_COOKED: [171794, "SR_LEGACY", "Beef, ground, 90% lean meat / 10% fat, crumbles, cooked, pan-browned", 1008, 1079],
  EGG_WHOLE_HARD_BOILED: [173424, "SR_LEGACY", "Egg, whole, cooked, hard-boiled", 1008, 1079],
  EGG_WHITE_COOKED: [2707170, "FNDDS", "Egg, white, cooked, no added fat", 1008, 1079],
  YOGURT_PLAIN_LOW_FAT: [170886, "SR_LEGACY", "Yogurt, plain, low fat", 1008, 1079],
  GREEK_YOGURT_PLAIN_NONFAT: [170894, "SR_LEGACY", "Yogurt, Greek, plain, nonfat (Includes foods for USDA's Food Distribution Program)", 1008, 1079],
  COTTAGE_CHEESE_LOW_FAT_2_PERCENT: [172182, "SR_LEGACY", "Cheese, cottage, lowfat, 2% milkfat", 1008, 1079],
  LENTILS_MATURE_COOKED: [172421, "SR_LEGACY", "Lentils, mature seeds, cooked, boiled, without salt", 1008, 1079],
  CHICKPEAS_MATURE_COOKED: [173757, "SR_LEGACY", "Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt", 1008, 1079],
  FAVA_BEANS_MATURE_COOKED: [173753, "SR_LEGACY", "Broadbeans (fava beans), mature seeds, cooked, boiled, without salt", 1008, 1079],
  RICE_WHITE_LONG_GRAIN_COOKED: [169757, "SR_LEGACY", "Rice, white, long-grain, regular, unenriched, cooked without salt", 1008, 1079],
  POTATO_BOILED_WITHOUT_SKIN: [170440, "SR_LEGACY", "Potatoes, boiled, cooked without skin, flesh, without salt", 1008, 1079],
  OATS_ROLLED_DRY: [2346396, "FOUNDATION_FOOD", "Oats, whole grain, rolled, old fashioned", 2048, 2033],
  BREAD_WHOLE_WHEAT: [172688, "SR_LEGACY", "Bread, whole-wheat, commercially prepared", 1008, 1079],
  PASTA_SPAGHETTI_COOKED: [2708357, "FNDDS", "Pasta, cooked", 1008, 1079],
  BANANA_RAW: [1105314, "FOUNDATION_FOOD", "Bananas, ripe and slightly ripe, raw", 2048, 1079],
  APPLE_RAW_WITH_SKIN: [171688, "SR_LEGACY", "Apples, raw, with skin (Includes foods for USDA's Food Distribution Program)", 1008, 1079],
  ORANGE_RAW: [169097, "SR_LEGACY", "Oranges, raw, all commercial varieties", 1008, 1079],
  TOMATO_RED_RAW: [170457, "SR_LEGACY", "Tomatoes, red, ripe, raw, year round average", 1008, 1079],
  CUCUMBER_WITH_PEEL_RAW: [168409, "SR_LEGACY", "Cucumber, with peel, raw", 1008, 1079],
  CARROT_RAW: [2258586, "FOUNDATION_FOOD", "Carrots, mature, raw", 2048, 1079],
  OLIVE_OIL: [171413, "SR_LEGACY", "Oil, olive, salad or cooking", 1008, 1079],
  SUNFLOWER_OIL: [171025, "SR_LEGACY", "Oil, sunflower, linoleic, (approx. 65%)", 1008, 1079],
});

const EXPECTED_TAGS = Object.freeze({
  CHICKEN_BREAST_ROASTED_SKINLESS: [["CHICKEN", "POULTRY"], [], []],
  TUNA_LIGHT_CANNED_WATER_DRAINED: [["TUNA", "FISH"], ["FISH"], []],
  BEEF_GROUND_90_LEAN_COOKED: [["BEEF", "RED_MEAT"], [], []],
  EGG_WHOLE_HARD_BOILED: [["EGG", "WHOLE_EGG"], ["EGG"], []],
  EGG_WHITE_COOKED: [["EGG", "EGG_WHITE"], ["EGG"], []],
  YOGURT_PLAIN_LOW_FAT: [["YOGURT", "DAIRY"], ["MILK"], ["LACTOSE"]],
  GREEK_YOGURT_PLAIN_NONFAT: [["GREEK_YOGURT", "DAIRY"], ["MILK"], ["LACTOSE"]],
  COTTAGE_CHEESE_LOW_FAT_2_PERCENT: [["COTTAGE_CHEESE", "DAIRY"], ["MILK"], ["LACTOSE"]],
  LENTILS_MATURE_COOKED: [["LENTILS", "LEGUME"], [], []],
  CHICKPEAS_MATURE_COOKED: [["CHICKPEAS", "LEGUME"], [], []],
  FAVA_BEANS_MATURE_COOKED: [["FAVA_BEANS", "LEGUME"], [], []],
  RICE_WHITE_LONG_GRAIN_COOKED: [["RICE", "GRAIN"], [], []],
  POTATO_BOILED_WITHOUT_SKIN: [["POTATO", "TUBER"], [], []],
  OATS_ROLLED_DRY: [["OATS", "GRAIN"], [], []],
  BREAD_WHOLE_WHEAT: [["WHOLE_WHEAT_BREAD", "BREAD", "WHEAT"], ["WHEAT"], ["GLUTEN"]],
  PASTA_SPAGHETTI_COOKED: [["PASTA", "WHEAT"], ["WHEAT"], ["GLUTEN"]],
  BANANA_RAW: [["BANANA"], [], []],
  APPLE_RAW_WITH_SKIN: [["APPLE"], [], []],
  ORANGE_RAW: [["ORANGE"], [], []],
  TOMATO_RED_RAW: [["TOMATO"], [], []],
  CUCUMBER_WITH_PEEL_RAW: [["CUCUMBER"], [], []],
  CARROT_RAW: [["CARROT"], [], []],
  OLIVE_OIL: [["OLIVE_OIL", "OIL"], [], []],
  SUNFLOWER_OIL: [["SUNFLOWER_OIL", "OIL"], [], []],
});

const EXPECTED_SWAP_GROUPS = Object.freeze([
  ["BREAKFAST_STARCHES", "STARCH", ["BREAD_WHOLE_WHEAT", "OATS_ROLLED_DRY"]],
  ["COOKED_LEGUMES", "LEGUME", ["CHICKPEAS_MATURE_COOKED", "FAVA_BEANS_MATURE_COOKED", "LENTILS_MATURE_COOKED"]],
  ["COOKED_STARCHES", "STARCH", ["PASTA_SPAGHETTI_COOKED", "POTATO_BOILED_WITHOUT_SKIN", "RICE_WHITE_LONG_GRAIN_COOKED"]],
  ["COOKING_OILS", "ADDED_FAT", ["OLIVE_OIL", "SUNFLOWER_OIL"]],
  ["LEAN_ANIMAL_PROTEIN", "ANIMAL_PROTEIN", ["CHICKEN_BREAST_ROASTED_SKINLESS", "TUNA_LIGHT_CANNED_WATER_DRAINED"]],
  ["PLAIN_DAIRY_PROTEIN", "DAIRY_PROTEIN", ["COTTAGE_CHEESE_LOW_FAT_2_PERCENT", "GREEK_YOGURT_PLAIN_NONFAT", "YOGURT_PLAIN_LOW_FAT"]],
  ["RAW_VEGETABLES", "NON_STARCH_VEGETABLE", ["CARROT_RAW", "CUCUMBER_WITH_PEEL_RAW", "TOMATO_RED_RAW"]],
  ["WHOLE_FRUITS", "FRUIT", ["APPLE_RAW_WITH_SKIN", "BANANA_RAW", "ORANGE_RAW"]],
]);

const STORAGE_REQUIRED = new Set([
  "CHICKEN_BREAST_ROASTED_SKINLESS",
  "BEEF_GROUND_90_LEAN_COOKED",
  "EGG_WHOLE_HARD_BOILED",
  "EGG_WHITE_COOKED",
  "YOGURT_PLAIN_LOW_FAT",
  "GREEK_YOGURT_PLAIN_NONFAT",
  "COTTAGE_CHEESE_LOW_FAT_2_PERCENT",
  "LENTILS_MATURE_COOKED",
  "CHICKPEAS_MATURE_COOKED",
  "FAVA_BEANS_MATURE_COOKED",
  "RICE_WHITE_LONG_GRAIN_COOKED",
  "POTATO_BOILED_WITHOUT_SKIN",
  "PASTA_SPAGHETTI_COOKED",
]);

const REHEATING_REQUIRED = new Set([
  "CHICKEN_BREAST_ROASTED_SKINLESS",
  "BEEF_GROUND_90_LEAN_COOKED",
  "LENTILS_MATURE_COOKED",
  "CHICKPEAS_MATURE_COOKED",
  "FAVA_BEANS_MATURE_COOKED",
  "RICE_WHITE_LONG_GRAIN_COOKED",
  "POTATO_BOILED_WITHOUT_SKIN",
  "PASTA_SPAGHETTI_COOKED",
]);

const SOURCE_REFERENCE_PATTERN = /^FDC:(\d+) \| DATA_TYPE:(FOUNDATION_FOOD|SR_LEGACY|FNDDS) \| DESCRIPTION:(.+) \| ENERGY_NUTRIENT_ID:(\d+) \| FIBER_NUTRIENT_ID:(\d+)$/u;
const NUTRITION_KEYS = Object.freeze([
  "calories_kcal",
  "protein_g",
  "fat_g",
  "carbohydrate_g",
  "fiber_g",
]);
const PORTION_KEYS = Object.freeze([
  "minimum_g",
  "maximum_g",
  "step_g",
  "default_g",
]);
const SHEET_NAMES = Object.freeze([
  "Instructions",
  "Foods",
  "Nutrition",
  "Portions",
  "Patterns",
  "Markets",
  "Tags",
  "Swap_Groups",
  "_Lists",
]);
const DATA_SHEET_WIDTHS = Object.freeze({
  Foods: 14,
  Nutrition: 6,
  Portions: 5,
  Patterns: 3,
  Markets: 3,
  Tags: 4,
  Swap_Groups: 3,
});

let committedCatalogPromise;
let importedCatalogPromise;

function committedCatalog() {
  committedCatalogPromise ??= readFile(PRODUCTION_JSON_PATH, "utf8")
    .then((value) => JSON.parse(value));
  return committedCatalogPromise;
}

function importedCatalog() {
  importedCatalogPromise ??= importNutritionFoodCatalogWorkbook(
    PRODUCTION_WORKBOOK_PATH,
  );
  return importedCatalogPromise;
}

function sourceParts(item) {
  const match = SOURCE_REFERENCE_PATTERN.exec(item.source.reference);
  assert.ok(match, item.food_code);
  return {
    fdcId: Number(match[1]),
    dataType: match[2],
    description: match[3],
    energyNutrientId: Number(match[4]),
    fiberNutrientId: Number(match[5]),
  };
}

function itemByCode(catalog, foodCode) {
  const item = catalog.items.find(({ food_code }) => food_code === foodCode);
  assert.ok(item, foodCode);
  return item;
}

function hasData(row, columnCount) {
  for (let column = 1; column <= columnCount; column += 1) {
    const value = row.getCell(column).value;
    if (value !== null && value !== undefined && value !== "") {
      return true;
    }
  }
  return false;
}

test("production workbook exists and ExcelJS can open it", async () => {
  await access(PRODUCTION_WORKBOOK_PATH);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(PRODUCTION_WORKBOOK_PATH);
  assert.equal(workbook.worksheets.length, 9);
});

test("production JSON exists and parses as JSON", async () => {
  await access(PRODUCTION_JSON_PATH);
  assert.equal(typeof await committedCatalog(), "object");
});

test("the current workbook importer accepts the production workbook", async () => {
  const catalog = await importedCatalog();
  assert.equal(catalog.food_catalog_version, "nutrition-food-catalog-v1");
});

test("the imported workbook catalog deep-equals the committed JSON", async () => {
  assert.deepEqual(await importedCatalog(), await committedCatalog());
});

test("the production catalog contains exactly 24 items", async () => {
  assert.equal((await committedCatalog()).items_count, 24);
});

test("the production catalog contains exactly 24 active items", async () => {
  assert.equal((await committedCatalog()).active_items_count, 24);
});

test("food class counts match the required eight-class distribution", async () => {
  const catalog = await committedCatalog();
  const counts = Object.fromEntries(Object.keys(EXPECTED_CLASS_COUNTS).map(
    (foodClass) => [
      foodClass,
      catalog.items.filter((item) => item.food_class === foodClass).length,
    ],
  ));
  assert.deepEqual(counts, EXPECTED_CLASS_COUNTS);
});

test("the 24 food codes retain the required exact order", async () => {
  assert.deepEqual(
    (await committedCatalog()).items.map(({ food_code }) => food_code),
    EXPECTED_FOOD_CODES,
  );
});

test("every production item is active", async () => {
  assert.ok((await committedCatalog()).items.every(({ is_active }) => is_active));
});

test("every production item has the six markets in exact policy order", async () => {
  for (const item of (await committedCatalog()).items) {
    assert.deepEqual(item.available_markets, EXPECTED_MARKETS, item.food_code);
  }
});

test("every production source uses FOOD_COMPOSITION_DATABASE", async () => {
  for (const item of (await committedCatalog()).items) {
    assert.equal(item.source.type, "FOOD_COMPOSITION_DATABASE", item.food_code);
  }
});

test("every production source names USDA FoodData Central", async () => {
  for (const item of (await committedCatalog()).items) {
    assert.equal(item.source.name, "USDA FoodData Central", item.food_code);
  }
});

test("every production source uses the required checked date", async () => {
  for (const item of (await committedCatalog()).items) {
    assert.equal(item.source.checked_date, "2026-07-17", item.food_code);
  }
});

test("every source reference includes exact FDC, type, description, energy, and fiber metadata", async () => {
  for (const item of (await committedCatalog()).items) {
    const expected = EXPECTED_SOURCES[item.food_code];
    const actual = sourceParts(item);
    assert.deepEqual(
      [actual.fdcId, actual.dataType, actual.description, actual.energyNutrientId, actual.fiberNutrientId],
      expected,
      item.food_code,
    );
  }
});

test("all 24 FDC IDs are unique", async () => {
  const ids = (await committedCatalog()).items.map((item) => sourceParts(item).fdcId);
  assert.equal(new Set(ids).size, 24);
});

test("the batch contains no branded or manufacturer-label record", async () => {
  for (const item of (await committedCatalog()).items) {
    assert.doesNotMatch(item.source.reference, /BRANDED|MANUFACTURER/u, item.food_code);
    assert.notEqual(item.source.type, "MANUFACTURER_LABEL", item.food_code);
  }
});

test("all five nutrition fields are finite numbers for every item", async () => {
  for (const item of (await committedCatalog()).items) {
    for (const key of NUTRITION_KEYS) {
      assert.equal(Number.isFinite(item.nutrition_per_100g[key]), true, `${item.food_code}.${key}`);
    }
  }
});

test("all nutrition values exactly match the verified per-100g source values", async () => {
  for (const item of (await committedCatalog()).items) {
    assert.deepEqual(
      NUTRITION_KEYS.map((key) => item.nutrition_per_100g[key]),
      EXPECTED_NUTRITION[item.food_code],
      item.food_code,
    );
  }
});

test("all portion rules exactly match the approved solver bounds", async () => {
  for (const item of (await committedCatalog()).items) {
    assert.deepEqual(
      PORTION_KEYS.map((key) => item.portion_rule_g[key]),
      EXPECTED_PORTIONS[item.food_code],
      item.food_code,
    );
  }
});

test("pattern mappings exactly match the required order for each food class", async () => {
  for (const item of (await committedCatalog()).items) {
    assert.deepEqual(
      item.compatible_pattern_codes,
      EXPECTED_PATTERNS_BY_CLASS[item.food_class],
      item.food_code,
    );
  }
});

test("identity, allergen, and intolerance tags do not exceed the approved list", async () => {
  for (const item of (await committedCatalog()).items) {
    const [identity, allergens, intolerances] = EXPECTED_TAGS[item.food_code];
    assert.deepEqual(item.tags, {
      identity_tags: identity,
      allergen_tags: allergens,
      intolerance_tags: intolerances,
    }, item.food_code);
  }
});

test("rolled oats do not claim WHEAT or GLUTEN", async () => {
  const oats = itemByCode(await committedCatalog(), "OATS_ROLLED_DRY");
  const tags = Object.values(oats.tags).flat();
  assert.equal(tags.includes("WHEAT"), false);
  assert.equal(tags.includes("GLUTEN"), false);
});

test("every derived swap group has at least two active items", async () => {
  for (const group of (await committedCatalog()).swap_groups) {
    assert.ok(group.active_item_codes.length >= 2, group.group_code);
  }
});

test("the eight required swap groups and memberships are exact", async () => {
  assert.deepEqual(
    (await committedCatalog()).swap_groups.map((group) => [
      group.group_code,
      group.food_class,
      group.active_item_codes,
    ]),
    EXPECTED_SWAP_GROUPS,
  );
});

test("beef, whole egg, and egg white remain non-swappable", async () => {
  const catalog = await committedCatalog();
  for (const foodCode of [
    "BEEF_GROUND_90_LEAN_COOKED",
    "EGG_WHOLE_HARD_BOILED",
    "EGG_WHITE_COOKED",
  ]) {
    assert.deepEqual(itemByCode(catalog, foodCode).swap, {
      is_swappable: false,
      group_code: null,
    });
  }
});

test("storage and reheating logistics exactly match the approved policy", async () => {
  for (const item of (await committedCatalog()).items) {
    assert.deepEqual(item.logistics, {
      requires_storage: STORAGE_REQUIRED.has(item.food_code),
      requires_reheating: REHEATING_REQUIRED.has(item.food_code),
    }, item.food_code);
  }
});

test("the official template remains empty", async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(OFFICIAL_TEMPLATE_PATH);
  for (const [sheetName, columnCount] of Object.entries(DATA_SHEET_WIDTHS)) {
    const worksheet = workbook.getWorksheet(sheetName);
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      assert.equal(hasData(worksheet.getRow(rowNumber), columnCount), false, `${sheetName}!${rowNumber}`);
    }
  }
});

test("the production catalog directory contains the required batch without temporary build artifacts", async () => {
  const fileNames = await readdir(CATALOG_DIRECTORY);

  assert.ok(fileNames.includes("core-global-food-batch-v1.xlsx"));
  assert.ok(fileNames.includes("core-global-food-batch-v1.json"));

  const temporaryArtifacts = fileNames.filter((fileName) => {
    const normalizedName = fileName.toLowerCase();
    return /\.(?:tmp|temp|mjs|js|csv)$/u.test(normalizedName)
      || normalizedName.includes("draft")
      || normalizedName.includes("final-final")
      || fileName.startsWith("~");
  });

  assert.deepEqual(temporaryArtifacts, []);
});

test("DATA_TYPE allows only FOUNDATION_FOOD, SR_LEGACY, or FNDDS", async () => {
  const types = new Set((await committedCatalog()).items.map((item) => sourceParts(item).dataType));
  assert.deepEqual([...types].sort(), ["FNDDS", "FOUNDATION_FOOD", "SR_LEGACY"]);
});

test("Foundation records use only energy nutrient 2048 or 2047", async () => {
  for (const item of (await committedCatalog()).items) {
    const source = sourceParts(item);
    if (source.dataType === "FOUNDATION_FOOD") {
      assert.ok([2048, 2047].includes(source.energyNutrientId), item.food_code);
    }
  }
});

test("SR Legacy and FNDDS records use only energy nutrient 1008", async () => {
  for (const item of (await committedCatalog()).items) {
    const source = sourceParts(item);
    if (source.dataType !== "FOUNDATION_FOOD") {
      assert.equal(source.energyNutrientId, 1008, item.food_code);
    }
  }
});

test("all records use only fiber nutrient 1079 or 2033", async () => {
  for (const item of (await committedCatalog()).items) {
    assert.ok([1079, 2033].includes(sourceParts(item).fiberNutrientId), item.food_code);
  }
});

test("each item source reference names exactly one FDC record", async () => {
  for (const item of (await committedCatalog()).items) {
    assert.equal((item.source.reference.match(/FDC:/gu) ?? []).length, 1, item.food_code);
  }
});

test("rolled oats validly use fiber nutrient 2033", async () => {
  const oats = itemByCode(await committedCatalog(), "OATS_ROLLED_DRY");
  assert.equal(sourceParts(oats).fiberNutrientId, 2033);
});

test("cooked egg white uses the explicitly approved FNDDS 2707170 record", async () => {
  const eggWhite = itemByCode(await committedCatalog(), "EGG_WHITE_COOKED");
  assert.deepEqual(sourceParts(eggWhite), {
    fdcId: 2707170,
    dataType: "FNDDS",
    description: "Egg, white, cooked, no added fat",
    energyNutrientId: 1008,
    fiberNutrientId: 1079,
  });
  assert.deepEqual(eggWhite.nutrition_per_100g, {
    calories_kcal: 52,
    protein_g: 10.7,
    fat_g: 0,
    carbohydrate_g: 2.35,
    fiber_g: 0,
  });
});

test("the production workbook preserves sheet order and hides _Lists", async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(PRODUCTION_WORKBOOK_PATH);
  assert.deepEqual(workbook.worksheets.map(({ name }) => name), SHEET_NAMES);
  assert.equal(workbook.getWorksheet("_Lists").state, "hidden");
});

test("the production workbook preserves required data validations", async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(PRODUCTION_WORKBOOK_PATH);
  const cells = [
    ["Foods", "D2"], ["Foods", "E2"], ["Foods", "F2"],
    ["Foods", "H2"], ["Foods", "I2"], ["Foods", "J2"],
    ["Foods", "K2"], ["Patterns", "C2"], ["Markets", "C2"],
    ["Tags", "B2"], ["Swap_Groups", "B2"],
  ];
  for (const [sheetName, address] of cells) {
    const validation = workbook.getWorksheet(sheetName).getCell(address).dataValidation;
    assert.equal(validation.type, "list", `${sheetName}!${address}`);
    assert.ok(validation.formulae.length > 0, `${sheetName}!${address}`);
  }
});

test("the production workbook preserves required instructions", async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(PRODUCTION_WORKBOOK_PATH);
  const instructions = workbook.getWorksheet("Instructions");
  assert.deepEqual(["B2", "B3", "B4", "B5"].map(
    (address) => instructions.getCell(address).value,
  ), [
    "nutrition-food-catalog-workbook-v1",
    "nutrition-food-catalog-v1",
    "PER_100G",
    "EG,SA,KW,BH,QA,AE",
  ]);
});
