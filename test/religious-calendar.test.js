import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateReligiousCalendarSchedule, FASTING_TYPES } from '../src/execution-engines/religious-calendar-engine.js';

test('Religious Calendar & Seasonal Fasting Engine Suite', async (t) => {

  await t.test('1. Generates Ramadan Dry Fasting schedule with Iftar, post-workout dinner, and Suhoor', () => {
    const schedule = evaluateReligiousCalendarSchedule({
      religion: 'MUSLIM',
      isFastingSeason: true,
      dailyCalories: 2200,
      dailyWaterLiters: 3.5,
      preferredWorkoutTime: 'AFTER_IFTAR'
    });

    assert.equal(schedule.mode, FASTING_TYPES.RAMADAN_DRY_FASTING);
    assert.equal(schedule.meals_distribution.length, 3);
    assert.equal(schedule.meals_distribution[0].meal_id, 'iftar');
    assert.equal(schedule.meals_distribution[2].meal_id, 'suhoor');
    assert.equal(schedule.hydration_protocol.total_target_liters, 3.5);
  });

  await t.test('2. Generates Christian Fasting schedule (Pescatarian)', () => {
    const schedule = evaluateReligiousCalendarSchedule({
      religion: 'CHRISTIAN',
      isFastingSeason: true,
      christianFastingStyle: 'PESCATARIAN_ALLOWED',
      dailyCalories: 2000
    });

    assert.equal(schedule.mode, FASTING_TYPES.CHRISTIAN_FASTING_PESCATARIAN);
    assert.equal(schedule.meals_distribution.length, 3);
    assert.ok(schedule.supplement_synergy_ar.length > 0);
  });

  await t.test('3. Generates Christian Fasting schedule (Strict Vegan)', () => {
    const schedule = evaluateReligiousCalendarSchedule({
      religion: 'CHRISTIAN',
      isFastingSeason: true,
      christianFastingStyle: 'STRICT_VEGAN',
      dailyCalories: 1800
    });

    assert.equal(schedule.mode, FASTING_TYPES.CHRISTIAN_FASTING_STRICT_VEGAN);
    assert.equal(schedule.meals_distribution.length, 3);
  });

  await t.test('4. Falls back to standard non-fasting baseline', () => {
    const schedule = evaluateReligiousCalendarSchedule({
      religion: 'MUSLIM',
      isFastingSeason: false,
      dailyCalories: 2000
    });

    assert.equal(schedule.mode, FASTING_TYPES.STANDARD_BASELINE);
    assert.equal(schedule.meals_distribution.length, 4);
  });

});
