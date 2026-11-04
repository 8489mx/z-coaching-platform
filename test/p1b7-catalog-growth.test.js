import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

// P1-B7 growth tranche (Q26, proteins first): 5 verified USDA SR Legacy
// records appended to the catalog. Runs under plain node: reads only the
// committed JSON (the ExcelJS catalog test covers workbook parity separately).
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG_PATH = path.join(PROJECT_ROOT, "data", "catalogs", "core-global-food-batch-v1.json");

const EXPECTED_NEW = {
  SALMON_ATLANTIC_COOKED: {
    fdc: 175168, nutrition: [206, 22.1, 12.35, 0, 0], priority: 40, budget: "HIGH",
    group: "LEAN_ANIMAL_PROTEIN",
  },
  TILAPIA_COOKED: {
    fdc: 175177, nutrition: [128, 26.15, 2.65, 0, 0], priority: 50, budget: "LOW",
    group: "LEAN_ANIMAL_PROTEIN",
  },
  KING_MACKEREL_COOKED: {
    fdc: 174236, nutrition: [134, 26.0, 2.56, 0, 0], priority: 60, budget: "MEDIUM",
    group: "LEAN_ANIMAL_PROTEIN",
  },
  CHICKEN_THIGH_COOKED: {
    fdc: 172388, nutrition: [179, 24.84, 8.24, 0, 0], priority: 70, budget: "LOW",
    group: "LEAN_ANIMAL_PROTEIN",
  },
  SKIM_MILK: {
    fdc: 171269, nutrition: [34, 3.37, 0.08, 4.96, 0], priority: 40, budget: "LOW",
    group: "PLAIN_DAIRY_PROTEIN",
  },
};

const NUTRITION_KEYS = ["calories_kcal", "protein_g", "fat_g", "carbohydrate_g", "fiber_g"];
const FDC_PATTERN = /^FDC:(\d+) \| DATA_TYPE:(SR_LEGACY) \| DESCRIPTION:(.+) \| ENERGY_NUTRIENT_ID:1008 \| FIBER_NUTRIENT_ID:1079$/u;

let catalogPromise;
function catalog() {
  catalogPromise ??= readFile(CATALOG_PATH, "utf8").then((value) => JSON.parse(value));
  return catalogPromise;
}

function itemByCode(catalogData, code) {
  const item = catalogData.items.find((entry) => entry.food_code === code);
  assert.ok(item, code);
  return item;
}

test("P1-B7 growth: catalog holds 29 active items", async () => {
  const catalogData = await catalog();
  assert.equal(catalogData.items_count, 29);
  assert.equal(catalogData.active_items_count, 29);
  assert.equal(catalogData.items.length, 29);
  assert.ok(catalogData.items.every((item) => item.is_active));
});

test("P1-B7 growth: each new item carries its verified source and nutrition", async () => {
  const catalogData = await catalog();
  for (const [code, expected] of Object.entries(EXPECTED_NEW)) {
    const item = itemByCode(catalogData, code);
    const match = FDC_PATTERN.exec(item.source.reference);
    assert.ok(match, code);
    assert.equal(Number(match[1]), expected.fdc, code);
    assert.equal(item.source.type, "FOOD_COMPOSITION_DATABASE", code);
    assert.equal(item.source.name, "USDA FoodData Central", code);
    assert.equal(item.source.checked_date, "2026-11-04", code);
    assert.deepEqual(
      NUTRITION_KEYS.map((key) => item.nutrition_per_100g[key]),
      expected.nutrition,
      code,
    );
    assert.equal(item.selection_priority, expected.priority, code);
    assert.equal(item.budget_level, expected.budget, code);
    assert.deepEqual(item.swap, { is_swappable: true, group_code: expected.group }, code);
    assert.deepEqual(item.available_markets, ["EG", "SA", "KW", "BH", "QA", "AE"], code);
  }
});

test("P1-B7 growth: all 29 FDC IDs are unique", async () => {
  const catalogData = await catalog();
  // All three data types occur in the catalog (SR Legacy, Foundation, FNDDS);
  // the per-item test above pins SR Legacy for the five new records.
  const anyPattern = /^FDC:(\d+) \| DATA_TYPE:(?:FOUNDATION_FOOD|SR_LEGACY|FNDDS) \| DESCRIPTION:.+ \| ENERGY_NUTRIENT_ID:\d+ \| FIBER_NUTRIENT_ID:\d+$/u;
  const ids = catalogData.items.map((item) => {
    const match = anyPattern.exec(item.source.reference);
    assert.ok(match, item.food_code);
    return Number(match[1]);
  });
  assert.equal(new Set(ids).size, 29);
});

test("P1-B7 growth: every nutrition value in the catalog is rounded to <= 2 decimals", async () => {
  const catalogData = await catalog();
  for (const item of catalogData.items) {
    for (const key of NUTRITION_KEYS) {
      const value = item.nutrition_per_100g[key];
      assert.equal(Number(value.toFixed(2)), value, `${item.food_code}.${key}`);
    }
  }
});

test("P1-B7 growth: swap groups gained exactly the new members", async () => {
  const catalogData = await catalog();
  const lean = catalogData.swap_groups.find((group) => group.group_code === "LEAN_ANIMAL_PROTEIN");
  const dairy = catalogData.swap_groups.find((group) => group.group_code === "PLAIN_DAIRY_PROTEIN");
  assert.deepEqual(lean.active_item_codes, [
    "CHICKEN_BREAST_ROASTED_SKINLESS",
    "CHICKEN_THIGH_COOKED",
    "KING_MACKEREL_COOKED",
    "SALMON_ATLANTIC_COOKED",
    "TILAPIA_COOKED",
    "TUNA_LIGHT_CANNED_WATER_DRAINED",
  ]);
  assert.deepEqual(dairy.active_item_codes, [
    "COTTAGE_CHEESE_LOW_FAT_2_PERCENT",
    "GREEK_YOGURT_PLAIN_NONFAT",
    "SKIM_MILK",
    "YOGURT_PLAIN_LOW_FAT",
  ]);
});
