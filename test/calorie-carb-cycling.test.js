import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateCalorieCycling,
  evaluateDietBreakNeed,
  calculateRefeedDay,
  calculateDailyCarbCycling,
  DAY_TYPES
} from '../src/execution-engines/carb-cycling-engine.js';

test('Calorie Cycling, Refeed & Structured Diet Break Engine Suite', async (t) => {

  await t.test('1. calculateCalorieCycling: Accurately balances weekly calories between 4 training days and 3 rest days', () => {
    const result = calculateCalorieCycling({
      dailyAverageCalories: 1800,
      trainingDaysPerWeek: 4,
      weightKg: 80,
      proteinGrams: 160,
      fatGrams: 50,
      cyclingIntensity: 'MODERATE'
    });

    assert.equal(result.strategy, 'CALORIE_CARB_CYCLING');
    assert.equal(result.weekly_total_calories, 1800 * 7); // 12600
    assert.equal(result.training_days_count, 4);
    assert.equal(result.rest_days_count, 3);
    assert.ok(result.high_day.calories > 1800);
    assert.ok(result.low_day.calories < 1800);

    // Verify weekly total sum match
    const calculatedWeeklyTotal = (result.high_day.calories * 4) + (result.low_day.calories * 3);
    assert.ok(Math.abs(calculatedWeeklyTotal - (1800 * 7)) <= 5); // Within rounding tolerance
    assert.ok(result.high_day.macros.carbs_grams > result.low_day.macros.carbs_grams);
  });

  await t.test('2. evaluateDietBreakNeed: Recommends Diet Break for lean clients after 6-8 weeks of deficit', () => {
    const result = evaluateDietBreakNeed({
      consecutiveDeficitWeeks: 7,
      bodyFatPercentage: 11, // Lean client
      hungerFatigueScore: 7,
      currentDeficitCalories: 1800
    });

    assert.equal(result.should_take_diet_break, true);
    assert.equal(result.status, 'DIET_BREAK_RECOMMENDED');
    assert.ok(result.protocol);
    assert.equal(result.protocol.duration_days, 7);
    assert.ok(result.protocol.target_maintenance_calories > 1800);
  });

  await t.test('3. evaluateDietBreakNeed: Allows continuous deficit for higher body fat clients without premature break', () => {
    const result = evaluateDietBreakNeed({
      consecutiveDeficitWeeks: 6,
      bodyFatPercentage: 25, // Higher body fat
      hungerFatigueScore: 4,
      currentDeficitCalories: 1900
    });

    assert.equal(result.should_take_diet_break, false);
    assert.equal(result.status, 'CONTINUE_DEFICIT');
    assert.equal(result.protocol, null);
  });

  await t.test('4. calculateRefeedDay: Calculates high-carb refeed day and increases carbs by ~45%', () => {
    const refeed = calculateRefeedDay({
      currentCalories: 1800,
      proteinGrams: 160,
      currentCarbsGrams: 180,
      fatGrams: 50
    });

    assert.equal(refeed.type, 'CONTROLLED_REFEED_DAY');
    assert.equal(refeed.macros.protein_grams, 160);
    // 180 + round(180 * 0.45 = 81) = 261g
    assert.equal(refeed.macros.carbs_grams, 261);
    assert.ok(refeed.calories > 1800);
    assert.ok(refeed.carbs_added_grams === 81);
  });
});
