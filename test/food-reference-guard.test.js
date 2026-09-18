import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FOOD_REFERENCE } from '../frontend/src/data/foodReference.js';
import { FOOD_DATABASE, GOLD_FOOD_CATALOG } from '../frontend/src/utils/foodSwapEngine.js';
import { FOOD_SWAP_DATABASE } from '../src/nutrition-meal-context-v2/build-culinary-meals.js';
import { DEFAULT_FOOD_CATALOG } from '../frontend/src/data/defaultFoodsCatalog.js';

// Every live food table must carry exactly the USDA-referenced values for codes in FOOD_REFERENCE.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (rel) => {
  const j = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  return Array.isArray(j) ? j : (j.items || j.foods || Object.values(j));
};

const TABLES = [
  { name: 'swap engine FOOD_DATABASE', rows: Object.entries(FOOD_DATABASE).map(([code, v]) => ({ code, p: v.protein_per_100g, c: v.carbs_per_100g, f: v.fat_per_100g, k: v.calories_per_100g })) },
  { name: 'GOLD_FOOD_CATALOG', rows: GOLD_FOOD_CATALOG.map((v) => ({ code: v.id, p: v.protein_per_100g, c: v.carbs_per_100g, f: v.fats_per_100g ?? v.fat_per_100g, k: v.calories_per_100g })) },
  { name: 'culinary FOOD_SWAP_DATABASE', rows: Object.entries(FOOD_SWAP_DATABASE).map(([code, v]) => ({ code, p: v.protein_per_100g, c: v.carb_per_100g, f: v.fat_per_100g, k: v.kcal_per_100g })) },
  { name: 'frontend DEFAULT_FOOD_CATALOG (macro calculator)', rows: DEFAULT_FOOD_CATALOG.map((v) => ({ code: v.id, p: v.protein_per_100g, c: v.carbs_per_100g, f: v.fat_per_100g, k: v.calories_per_100g })) },
  { name: 'src/data/food-catalog.json', rows: readJson('src/data/food-catalog.json').map((v) => ({ code: v.id, p: v.protein_per_100g, c: v.carbs_per_100g, f: v.fat_per_100g, k: v.calories_per_100g })) },
  { name: 'data/settings/foods_catalog.json', rows: readJson('data/settings/foods_catalog.json').map((v) => ({ code: v.id, p: v.protein_per_100g, c: v.carbs_per_100g, f: v.fat_per_100g, k: v.calories_per_100g })) },
  { name: 'core-global-food-batch-v1.json', rows: readJson('data/catalogs/core-global-food-batch-v1.json').map((v) => ({ code: v.food_code, p: v.nutrition_per_100g?.protein_g, c: v.nutrition_per_100g?.carbohydrate_g, f: v.nutrition_per_100g?.fat_g, k: v.nutrition_per_100g?.calories_kcal })) },
];

test('FOOD_REFERENCE is internally consistent with Atwater energy (within 15%)', () => {
  for (const [code, r] of Object.entries(FOOD_REFERENCE)) {
    // Fiber yields ~2 kcal/g instead of 4, so count it separately from available carbohydrate.
    const fiber = Math.min(r.fiber ?? 0, r.carbs);
    const fiberAdjusted = 4 * r.protein + 4 * (r.carbs - fiber) + 2 * fiber + 9 * r.fat;
    const general = 4 * r.protein + 4 * r.carbs + 9 * r.fat;
    if (r.kcal < 20) continue; // near-zero foods: rounding dominates
    // USDA uses food-specific Atwater factors; accept agreement with either general convention.
    const deviation = Math.min(Math.abs(fiberAdjusted - r.kcal), Math.abs(general - r.kcal)) / r.kcal;
    assert.ok(deviation <= 0.15, `${code}: ${r.kcal} kcal vs Atwater ${fiberAdjusted.toFixed(0)}-${general.toFixed(0)}`);
  }
});

for (const table of TABLES) {
  test(`${table.name} matches FOOD_REFERENCE for every referenced code`, () => {
    const mismatches = [];
    for (const row of table.rows) {
      const ref = FOOD_REFERENCE[String(row.code || '').toUpperCase()];
      if (!ref) continue;
      const checks = [['protein', row.p, ref.protein, 0.051], ['carbs', row.c, ref.carbs, 0.051], ['fat', row.f, ref.fat, 0.051], ['kcal', row.k, ref.kcal, 0.51]];
      for (const [field, actual, expected, tol] of checks) {
        if (typeof actual !== 'number') continue;
        if (Math.abs(actual - expected) > tol) mismatches.push(`${row.code}.${field}: ${actual} != ${expected}`);
      }
    }
    assert.deepEqual(mismatches, []);
  });
}
