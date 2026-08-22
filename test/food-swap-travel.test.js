import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FOOD_DATABASE,
  TASTE_PROFILES,
  isFoodClinicallySafe,
  getCompatibleSwaps,
  calculateDynamicFoodSwap,
  convertGramsToHandPortions,
  getTravelDiningBlueprints,
  formatItemPortionDisplay,
  PORTION_DISPLAY_MODES
} from '../src/execution-engines/food-swap-engine.js';

test('Contextual Food Swap Engine & Taste Profile Partitioning Tests', async (t) => {

  await t.test('1. Validates macro density and equivalent swap calculation within MAIN_MEAL_PROTEIN', () => {
    // 150g Chicken Breast (31% protein = 46.5g protein) -> Beef 95/5 (26% protein)
    const result = calculateDynamicFoodSwap({
      current_food_code: 'CHICKEN_BREAST',
      current_portion_g: 150,
      target_food_code: 'LEAN_GROUND_BEEF_95_5'
    });

    assert.equal(result.success, true);
    assert.equal(result.current_food.taste_profile, TASTE_PROFILES.MAIN_MEAL_PROTEIN);
    assert.equal(result.replacement_food.taste_profile, TASTE_PROFILES.MAIN_MEAL_PROTEIN);
    // 46.5g / 0.26 = 178.8 -> 179g
    assert.equal(result.replacement_food.portion_g, 179);
    assert.equal(result.replacement_food.macros.protein_g, 46.5);
  });

  await t.test('2. Enforces Culinary Pairing Guard: Throws error when swapping across incompatible taste profiles', () => {
    // Swapping Lunch Chicken into Breakfast Egg should fail when enforce_taste_profile is true
    assert.throws(() => {
      calculateDynamicFoodSwap({
        current_food_code: 'CHICKEN_BREAST',
        current_portion_g: 150,
        target_food_code: 'WHOLE_EGG',
        enforce_taste_profile: true
      });
    }, /Culinary Pairing Incompatibility/);
  });

  await t.test('3. Regional Foods: Baladi Bread, Rice Cakes, and Molokhia calculate accurately', () => {
    // 100g Baladi Bread (50g Carbs) -> Rice Cakes (82g Carbs)
    const carbSwap = calculateDynamicFoodSwap({
      current_food_code: 'EGYPTIAN_BALADI_BREAD',
      current_portion_g: 100,
      target_food_code: 'RICE_CAKES'
    });

    assert.equal(carbSwap.success, true);
    // 50g carbs / 0.82 = 60.97 -> 61g
    assert.equal(carbSwap.replacement_food.portion_g, 61);
    assert.equal(carbSwap.replacement_food.macros.carbs_g, 50);
  });

  await t.test('4. Clinical Guardrails: G6PD strictly bans fava beans and Celiac bans wheat bread', () => {
    assert.equal(isFoodClinicallySafe(FOOD_DATABASE.FAVA_BEANS, { is_g6pd: true }), false);
    assert.equal(isFoodClinicallySafe(FOOD_DATABASE.EGYPTIAN_BALADI_BREAD, { is_celiac: true }), false);
    assert.equal(isFoodClinicallySafe(FOOD_DATABASE.BASMATI_RICE_COOKED, { is_celiac: true }), true);
    assert.equal(isFoodClinicallySafe(FOOD_DATABASE.SHRIMP_GRILLED, { is_gout: true }), false);
    assert.equal(isFoodClinicallySafe(FOOD_DATABASE.WHITE_FISH_FILLET, { is_gout: true }), true);
  });

  await t.test('5. getCompatibleSwaps filters by same taste profile and clinical safety', () => {
    const safeBreakfastSwaps = getCompatibleSwaps('WHOLE_EGG', { is_lactose_intolerant: true });
    
    // Should include Egg Whites, Turkey, and Fava Beans (if not G6PD)
    const codes = safeBreakfastSwaps.map(s => s.code);
    assert.ok(codes.includes('EGG_WHITE'));
    assert.ok(codes.includes('SMOKED_TURKEY_SLICES'));
    assert.ok(!codes.includes('CHICKEN_BREAST')); // Excluded by taste profile
  });

  await t.test('6. Hand-Portion Converter translates grams into palms, fists, and thumbs', () => {
    const proteinPortion = convertGramsToHandPortions(150, 'PROTEIN');
    assert.equal(proteinPortion.hand_unit, 'PALM');
    assert.equal(proteinPortion.portions_count, 1.4);
    assert.ok(proteinPortion.label_ar.includes('كف اليد'));

    const carbPortion = convertGramsToHandPortions(200, 'CARBS');
    assert.equal(carbPortion.hand_unit, 'FIST');
    assert.equal(carbPortion.portions_count, 1.4);
    assert.ok(carbPortion.label_ar.includes('قبضة اليد'));

    const fatPortion = convertGramsToHandPortions(15, 'FATS');
    assert.equal(fatPortion.hand_unit, 'THUMB');
    assert.equal(fatPortion.portions_count, 1.3);
    assert.ok(fatPortion.label_ar.includes('عقلة الإبهام'));
  });

  await t.test('7. getTravelDiningBlueprints provides pre-engineered restaurant and travel plans', () => {
    const blueprints = getTravelDiningBlueprints();
    assert.equal(blueprints.length, 3);

    const ids = blueprints.map(b => b.id);
    assert.ok(ids.includes('GRILLED_SKEWERS_BLUEPRINT'));
    assert.ok(ids.includes('DIET_SHAWARMA_BLUEPRINT'));
    assert.ok(ids.includes('EMERGENCY_SUPERMARKET_BLUEPRINT'));

    blueprints.forEach(b => {
      assert.ok(b.title_ar.length > 5);
      assert.ok(b.ordered_items_ar.length > 0);
      assert.ok(b.estimated_macros.calories_kcal > 0);
      assert.ok(b.estimated_macros.protein_g > 0);
    });
  });

  await t.test('8. Dual Mode Portion Visualizer: Displays Raw/Cooked grams and Hand Metrics', () => {
    // 1. Dual Mode for Chicken Breast
    const chickenDual = formatItemPortionDisplay({
      food_code: 'CHICKEN_BREAST',
      amount_g: 150
    }, PORTION_DISPLAY_MODES.DUAL);

    assert.equal(chickenDual.mode, PORTION_DISPLAY_MODES.DUAL);
    assert.ok(chickenDual.raw_cooked_text.includes('150 جم مطبوخ'));
    assert.ok(chickenDual.raw_cooked_text.includes('200 جم نيئ'));
    assert.ok(chickenDual.hand_text.includes('كف اليد'));

    // 2. Grams Mode
    const riceGrams = formatItemPortionDisplay({
      food_code: 'BASMATI_RICE_COOKED',
      amount_g: 180
    }, PORTION_DISPLAY_MODES.GRAMS);

    assert.equal(riceGrams.mode, PORTION_DISPLAY_MODES.GRAMS);
    assert.ok(riceGrams.primary_text.includes('180 جم مطبوخ'));
    assert.ok(riceGrams.primary_text.includes('72 جم نيئ'));

    // 3. Hand Portions Mode
    const oilHand = formatItemPortionDisplay({
      food_code: 'EXTRA_VIRGIN_OLIVE_OIL',
      amount_g: 10
    }, PORTION_DISPLAY_MODES.HAND_PORTIONS);

    assert.equal(oilHand.mode, PORTION_DISPLAY_MODES.HAND_PORTIONS);
    assert.ok(oilHand.hand_text.includes('عقلة الإبهام'));
  });
});

