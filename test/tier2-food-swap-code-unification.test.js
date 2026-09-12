import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { 
  FOOD_DATABASE, 
  UNIFIED_FOOD_CODE_ALIASES, 
  getCompatibleSwaps, 
  calculateDynamicFoodSwap 
} from '../frontend/src/utils/foodSwapEngine.js';

test('Tier 2 Item 4: Food Swap Code Unification & 22-Code Full Compatibility Suite', async (t) => {
  // 1. Extract all food codes produced by culinary meal engine
  const mealEngineFile = 'src/nutrition-meal-context-v2/build-culinary-meals.js';
  const content = fs.readFileSync(mealEngineFile, 'utf8');
  const regex = /food_code:\s*["']([^"']+)["']/g;
  const mealCodes = new Set();
  let m;
  while ((m = regex.exec(content)) !== null) {
    mealCodes.add(m[1]);
  }

  await t.test('1. Every unique culinary meal code exists directly or via UNIFIED_FOOD_CODE_ALIASES in FOOD_DATABASE', () => {
    assert.equal(mealCodes.size, 22, 'Expected exactly 22 unique meal codes from culinary meal engine');

    for (const code of mealCodes) {
      const foodItem = FOOD_DATABASE[code];
      assert.ok(foodItem, `Food code "${code}" must resolve to a valid food item in FOOD_DATABASE`);
      assert.ok(foodItem.name_ar, `Food code "${code}" must have a valid Arabic display name`);
      assert.ok(foodItem.macro_type, `Food code "${code}" must have a valid macro_type`);
    }
  });

  await t.test('2. Every one of the 22 codes produces non-empty compatible swap candidates and computes dynamic swap', () => {
    for (const code of mealCodes) {
      const foodItem = FOOD_DATABASE[code];
      const swaps = getCompatibleSwaps(code, {}, { enforce_taste_profile: false });
      assert.ok(swaps.length > 0, `Food code "${code}" (${foodItem.name_ar}) must have at least one swap candidate`);

      // Pick the first candidate and execute a dynamic swap calculation
      const target = swaps[0];
      const result = calculateDynamicFoodSwap({
        current_food_code: code,
        current_portion_g: 100,
        target_food_code: target.code,
        enforce_taste_profile: false
      });

      assert.ok(result, `Swap calculation from "${code}" to "${target.code}" must succeed`);
      assert.ok(result.replacement_food, 'Replacement food must be returned');
      assert.ok(result.replacement_food.portion_g > 0, 'Replacement portion must be positive');
      assert.ok(result.replacement_food.macros.calories_kcal > 0, 'Replacement calories must be positive');
    }
  });

  await t.test('3. Key previously-mismatched codes (LEAN_BEEF, ROLLED_OATS, BALADI_BREAD) map to correct nutritional references', () => {
    const beef = FOOD_DATABASE['LEAN_BEEF'];
    assert.equal(beef.macro_type, 'PROTEIN');
    assert.equal(beef.alias_of, 'LEAN_GROUND_BEEF_95_5');

    const oats = FOOD_DATABASE['ROLLED_OATS'];
    assert.equal(oats.macro_type, 'CARBS');
    assert.equal(oats.alias_of, 'ROLLED_OATS_RAW');

    const bread = FOOD_DATABASE['BALADI_BREAD'];
    assert.equal(bread.macro_type, 'CARBS');
    assert.equal(bread.alias_of, 'EGYPTIAN_BALADI_BREAD');

    const tuna = FOOD_DATABASE['CANNED_TUNA'];
    assert.equal(tuna.macro_type, 'PROTEIN');
    assert.equal(tuna.alias_of, 'CANNED_TUNA_IN_WATER');
  });
});
