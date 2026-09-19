import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { RECIPES, RECIPE_INGREDIENTS, RECIPE_REFERENCE, computeRecipePer100g } from '../frontend/src/data/recipeReference.js';
import { FOOD_REFERENCE } from '../frontend/src/data/foodReference.js';
import { FOOD_DATABASE, calculateDynamicFoodSwap, getCompatibleSwaps, isFoodClinicallySafe } from '../src/execution-engines/food-swap-engine.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const DISHES = Object.keys(RECIPES);

test('every recipe ingredient is a USDA record and every dish is energy-consistent (Atwater within 15%)', () => {
  for (const [code, ing] of Object.entries(RECIPE_INGREDIENTS)) {
    assert.ok(Number.isInteger(ing.fdc_id) && ing.fdc_id > 0, `${code} fdc_id`);
  }
  for (const [code, v] of Object.entries(RECIPE_REFERENCE)) {
    const atwater = 4 * v.protein + 4 * v.carbs + 9 * v.fat;
    assert.ok(Math.abs(atwater - v.kcal) / v.kcal <= 0.15, `${code}: ${v.kcal} kcal vs Atwater ${atwater.toFixed(0)}`);
    assert.deepEqual(v, computeRecipePer100g(RECIPES[code]));
  }
});

test('the Gulf and Egyptian dishes required by the plan exist', () => {
  for (const code of ['KABSA_CHICKEN', 'KABSA_LAMB', 'MACHBOOS_CHICKEN', 'MACHBOOS_KINGFISH', 'HAREES_CHICKEN', 'MADROOBA_CHICKEN', 'KOSHARI', 'MAHSHI_WARAQ_ENAB', 'MAHSHI_KROMB', 'MOLOKHIA_TAQLIYA', 'MESAKAA']) {
    assert.ok(RECIPE_REFERENCE[code], code);
  }
  assert.equal(FOOD_REFERENCE.DATES_MEDJOOL.fdc_id, 168191);
});

test('swap engine and both JSON catalogs carry exactly the recipe values', () => {
  const tables = {
    FOOD_DATABASE: (code) => FOOD_DATABASE[code],
    'src/data/food-catalog.json': (code) => readJson('src/data/food-catalog.json').find((x) => x.id === code),
    'data/settings/foods_catalog.json': (code) => readJson('data/settings/foods_catalog.json').find((x) => x.id === code),
  };
  for (const [name, get] of Object.entries(tables)) {
    for (const code of DISHES) {
      const row = get(code);
      const ref = RECIPE_REFERENCE[code];
      assert.ok(row, `${name} missing ${code}`);
      assert.equal(row.macro_type, 'MIXED', `${name} ${code}`);
      assert.deepEqual(
        [row.calories_per_100g, row.protein_per_100g, row.carbs_per_100g, row.fat_per_100g],
        [ref.kcal, ref.protein, ref.carbs, ref.fat],
        `${name} ${code}`,
      );
    }
  }
});

test('composite dishes swap calorie for calorie, only with other composite dishes', () => {
  const r = calculateDynamicFoodSwap({ current_food_code: 'KABSA_CHICKEN', current_portion_g: 300, target_food_code: 'KOSHARI', clinical_profile: {}, enforce_taste_profile: true });
  const kcalBefore = (300 * FOOD_DATABASE.KABSA_CHICKEN.calories_per_100g) / 100;
  assert.ok(Math.abs(r.replacement_food.macros.calories_kcal - kcalBefore) <= 5, `${r.replacement_food.macros.calories_kcal} vs ${kcalBefore}`);
  assert.equal(r.replacement_food.portion_g, 359);
  assert.throws(() => calculateDynamicFoodSwap({ current_food_code: 'KABSA_CHICKEN', current_portion_g: 300, target_food_code: 'BASMATI_RICE_COOKED', clinical_profile: {} }), /Invalid Swap/);
  const options = getCompatibleSwaps('MACHBOOS_CHICKEN', {}).map((f) => f.code);
  assert.ok(options.includes('KABSA_LAMB') && options.includes('MAHSHI_WARAQ_ENAB'));
  assert.ok(options.every((c) => FOOD_DATABASE[c].macro_type === 'MIXED'));
});

test('clinical guards apply to the new dishes', () => {
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.KOSHARI, { is_g6pd: true }), false, 'koshari has lentils and chickpeas');
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.KOSHARI, { is_celiac: true }), false, 'koshari has pasta');
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.HAREES_CHICKEN, { is_celiac: true }), false, 'harees is wheat');
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.MACHBOOS_KINGFISH, { allergies: ['fish_shellfish'] }), false);
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.MACHBOOS_KINGFISH, { is_gout: true }), false, 'oily fish is high purine');
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.KABSA_CHICKEN, { is_g6pd: true, is_celiac: true }), true);
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.KABSA_CHICKEN, { is_diabetic: true }), false, 'white-rice dish is high GI');
});

test('plant protein powder is its own dairy-free food, not an alias of whey', () => {
  const pea = FOOD_DATABASE.PEA_RICE_PROTEIN_POWDER;
  assert.equal(pea.alias_of, undefined);
  assert.equal(pea.is_dairy, false);
  assert.deepEqual(pea.allergens, []);
  assert.equal(isFoodClinicallySafe(pea, { is_lactose_intolerant: true, allergies: ['dairy_lactose'] }), true);
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.WHEY_PROTEIN_ISOLATE, { is_lactose_intolerant: true, allergies: ['dairy_lactose'] }), false);
});
