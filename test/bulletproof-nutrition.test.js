import test from 'node:test';
import assert from 'node:assert/strict';

import {
  convertRawToCooked,
  convertCookedToRaw,
  RAW_TO_COOKED_YIELD_FACTORS,
  GASTRONOMY_CATALOG,
  convertHandPortionsToGrams,
  getNightCravingEmergencyMenu,
  generateDiningOutStrategy,
  evaluateFreeMealVsRefeed,
  applyIBSFilterToNutritionPlan,
  IBS_HIGH_FODMAP_FORBIDDEN
} from '../src/execution-engines/bulletproof-nutrition-engine.js';

test('Bulletproof Clinical Nutrition Engine - Comprehensive Suite', async (t) => {

  await t.test('1. Raw vs. Cooked Matrix: Yield Multiplier Conversions', () => {
    // 100g raw chicken -> 75g cooked
    assert.equal(convertRawToCooked({ foodKey: 'CHICKEN_BREAST', rawGrams: 100 }), 75);
    // 75g cooked chicken -> 100g raw
    assert.equal(convertCookedToRaw({ foodKey: 'CHICKEN_BREAST', cookedGrams: 75 }), 100);

    // 100g raw white rice -> 250g cooked
    assert.equal(convertRawToCooked({ foodKey: 'WHITE_RICE', rawGrams: 100 }), 250);
    // 250g cooked white rice -> 100g raw
    assert.equal(convertCookedToRaw({ foodKey: 'WHITE_RICE', cookedGrams: 250 }), 100);

    // 100g raw pasta -> 220g cooked
    assert.equal(convertRawToCooked({ foodKey: 'PASTA', rawGrams: 100 }), 220);

    // 50g dry oats -> 150g cooked porridge
    assert.equal(convertRawToCooked({ foodKey: 'OATS_PORRIDGE', rawGrams: 50 }), 150);
  });

  await t.test('2. Gastronomy Catalog: Bread, Dairy, Eggs, and Foul', () => {
    const baladi = GASTRONOMY_CATALOG.BALADI_BREAD_WHOLE;
    assert.equal(baladi.calories, 240);
    assert.equal(baladi.carbs_g, 50);
    assert.equal(baladi.quarter_slice.calories, 60);

    const senn = GASTRONOMY_CATALOG.SENN_BREAD;
    assert.equal(senn.water_warning_liters, 0.5);

    const cottage = GASTRONOMY_CATALOG.COTTAGE_CHEESE_100G;
    assert.equal(cottage.protein_g, 18);
    assert.equal(cottage.fat_g, 1.5);

    const roumi = GASTRONOMY_CATALOG.ROUMI_CHEESE_SLICE;
    assert.equal(roumi.fat_trap, true);
    assert.equal(roumi.fat_g, 9);

    const airfryerFalafel = GASTRONOMY_CATALOG.FALAFEL_AIRFRYER_PIECE;
    const friedFalafel = GASTRONOMY_CATALOG.FALAFEL_FRIED_PIECE;
    assert.equal(airfryerFalafel.calories, 45);
    assert.equal(friedFalafel.calories, 85);
  });

  await t.test('3. Hand-Portion System: Precision Visual Estimation', () => {
    const res = convertHandPortionsToGrams({
      palmPortions: 2,   // 2 palms of protein
      fistPortions: 2,   // 2 fists of carbs
      thumbPortions: 2,  // 2 thumbs of fats
      twoHandsPortions: 1
    });

    assert.equal(res.estimated_cooked_grams.protein_portion_g, 260); // 2 * 130g
    assert.equal(res.estimated_macros.protein_g, 60);               // 2 * 30g
    assert.equal(res.estimated_cooked_grams.carb_portion_g, 300);    // 2 * 150g
    assert.equal(res.estimated_macros.carbs_g, 80);                 // 2 * 40g
    assert.equal(res.estimated_macros.fat_g, 20);                   // 2 * 10g
    assert.ok(res.estimated_macros.calories > 0);
  });

  await t.test('4. Night Craving Protocol: Zero-Guilt Volume Hacks', () => {
    const cravingMenu = getNightCravingEmergencyMenu({ hungerLevel: 'VERY_HIGH' });
    assert.equal(cravingMenu.strategy, 'ZERO_GUILT_VOLUME_HACKS');
    assert.ok(cravingMenu.recommended_options.length >= 4);

    const jelly = cravingMenu.recommended_options.find((o) => o.id === 'sugar_free_jelly');
    assert.equal(jelly.calories, 20);

    const popcorn = cravingMenu.recommended_options.find((o) => o.id === 'air_popped_popcorn');
    assert.equal(popcorn.calories, 90);
    assert.equal(popcorn.fiber_g, 4);
  });

  await t.test('5. Dining Out & Calorie Banking Protocol', () => {
    const dining = generateDiningOutStrategy({
      totalDailyCalories: 2200,
      targetDinnerBuffer: 1000
    });

    assert.equal(dining.banked_dinner_calories, 1000);
    assert.equal(dining.daytime_allocation.calories, 1200);
    assert.ok(dining.triple_plate_rule_ar.protein_50_pct.includes('50%'));
    assert.ok(dining.triple_plate_rule_ar.carbs_25_pct.includes('25%'));
  });

  await t.test('6. Controlled Free Meal vs. Clean Refeed Engine', () => {
    const freeMeal = evaluateFreeMealVsRefeed({ type: 'CONTROLLED_FREE_MEAL' });
    assert.equal(freeMeal.calorie_cap, 1000);
    assert.ok(freeMeal.uncontrolled_cheat_day_warning_ar.includes('4500'));

    const refeed = evaluateFreeMealVsRefeed({
      type: 'CLEAN_HIGH_CARB_REFEED',
      dailyCalories: 1800,
      weightKg: 80
    });
    assert.equal(refeed.type, 'CLEAN_HIGH_CARB_REFEED');
    assert.equal(refeed.macros.fat_g, 25);
    assert.ok(refeed.macros.carbs_g > 200);
  });

  await t.test('7. IBS & Bloating Shield Engine', () => {
    const ibsResult = applyIBSFilterToNutritionPlan({ isIBSSensitive: true });
    assert.equal(ibsResult.is_filtered, true);
    assert.equal(ibsResult.gut_friendly_protocol_active, true);
    assert.ok(ibsResult.forbidden_high_fodmap_tags.includes('RAW_BROCCOLI'));
    assert.ok(ibsResult.forbidden_high_fodmap_tags.includes('HIGH_LACTOSE_MILK'));
    assert.ok(ibsResult.safe_staples_recommendation.length >= 4);
  });

});
