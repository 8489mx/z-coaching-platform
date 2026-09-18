import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateEquivalentSwap,
  getEligibleSwaps,
  GOLD_FOOD_CATALOG
} from '../src/execution-engines/food-swap-engine.js';

test('Context-Aware Food Swap & Portion Converter Engine Suite', async (t) => {

  await t.test('1. Accurately calculates equivalent swap between grilled chicken breast and lean ground beef', () => {
    // 150g Chicken (31g P/100g) -> Lean Ground Beef 95/5 (26.3g P/100g, USDA FDC 171791)
    // Target = 150 * (31 / 26.3) = 176.8g -> rounded to 175g
    const result = calculateEquivalentSwap({
      sourceFoodId: 'grilled_chicken_breast',
      sourceGrams: 150,
      targetFoodId: 'lean_ground_beef_95',
      foodCatalog: GOLD_FOOD_CATALOG
    });

    assert.equal(result.success, true);
    assert.equal(result.source_food.id, 'grilled_chicken_breast');
    assert.equal(result.source_food.grams, 150);
    assert.equal(result.target_food.id, 'lean_ground_beef_95');
    assert.equal(result.target_food.calculated_grams, 175);
    assert.ok(result.target_food.hand_portion.includes('كف يد'));
    assert.ok(result.target_food.culinary_hacks.length > 0);
    assert.ok(result.macros.protein > 40);
  });

  await t.test('2. Prevents incompatible taste profile swap (e.g. Chicken Breast to Greek Yogurt)', () => {
    const result = calculateEquivalentSwap({
      sourceFoodId: 'grilled_chicken_breast',
      sourceGrams: 150,
      targetFoodId: 'greek_yogurt_0pct',
      foodCatalog: GOLD_FOOD_CATALOG,
      enforceTasteProfile: true
    });

    assert.equal(result.success, false);
    assert.equal(result.error_code, 'INCOMPATIBLE_TASTE_PROFILE');
    assert.ok(result.message.includes('لا يمكن استبدال'));
  });

  await t.test('3. Allows cross-profile swap when enforceTasteProfile is explicitly false', () => {
    const result = calculateEquivalentSwap({
      sourceFoodId: 'grilled_chicken_breast',
      sourceGrams: 100,
      targetFoodId: 'greek_yogurt_0pct',
      foodCatalog: GOLD_FOOD_CATALOG,
      enforceTasteProfile: false
    });

    assert.equal(result.success, true);
    // 100g chicken (31g P) -> Greek yogurt 0% (10.2g P/100g, USDA FDC 170894) = 303.9g -> 305g
    assert.equal(result.target_food.calculated_grams, 305);
  });

  await t.test('4. Correctly swaps carbs within same profile (Cooked Basmati Rice to Cooked Potatoes)', () => {
    // 150g Basmati (28g C/100g) -> Potatoes (20g C/100g)
    // Target = 150 * (28 / 20) = 210g
    const result = calculateEquivalentSwap({
      sourceFoodId: 'cooked_basmati_rice',
      sourceGrams: 150,
      targetFoodId: 'cooked_potatoes',
      foodCatalog: GOLD_FOOD_CATALOG
    });

    assert.equal(result.success, true);
    assert.equal(result.target_food.calculated_grams, 210);
    assert.ok(result.target_food.culinary_hacks.length > 0);
  });

  await t.test('5. getEligibleSwaps returns only compatible taste and macro foods', () => {
    const chickenSwaps = getEligibleSwaps('grilled_chicken_breast', GOLD_FOOD_CATALOG);
    const swapIds = chickenSwaps.map(s => s.id);

    assert.ok(swapIds.includes('lean_ground_beef_95'));
    assert.ok(swapIds.includes('tilapia_fillet_grilled'));
    assert.ok(!swapIds.includes('greek_yogurt_0pct'));
    assert.ok(!swapIds.includes('cooked_basmati_rice'));
  });
});
