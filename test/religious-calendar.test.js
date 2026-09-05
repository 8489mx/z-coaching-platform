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

  await t.test('5. Tripartite Fasting: Correctly categorizes Coptic fasting (Pescatarian & Strict Vegan)', async () => {
    const { extractClientFastingProfile } = await import('../frontend/src/utils/seasonalFastingRadar.js');

    const copticPescatarian = extractClientFastingProfile({
      religion: 'CHRISTIAN',
      christianFastingStyle: 'PESCATARIAN_ALLOWED'
    });
    assert.equal(copticPescatarian.isCoptic, true);
    assert.equal(copticPescatarian.isRamadan, false);
    assert.equal(copticPescatarian.primaryFastingBadge.type, 'COPTIC');
    assert.ok(copticPescatarian.primaryFastingBadge.label.includes('سمك مسموح'));

    const copticVegan = extractClientFastingProfile({
      answers: {
        personal: { religion: 'CHRISTIAN' },
        diet: { christianFastingStyle: 'STRICT_VEGAN' }
      }
    });
    assert.equal(copticVegan.isCoptic, true);
    assert.equal(copticVegan.isRamadan, false);
    assert.ok(copticVegan.primaryFastingBadge.label.includes('نباتي صرف'));
  });

  await t.test('6. Tripartite Fasting: Correctly categorizes Ramadan fasting', async () => {
    const { extractClientFastingProfile } = await import('../frontend/src/utils/seasonalFastingRadar.js');

    const ramadanClient = extractClientFastingProfile({
      answers: {
        personal: { religion: 'MUSLIM' }
      }
    });
    assert.equal(ramadanClient.isRamadan, true);
    assert.equal(ramadanClient.isCoptic, false);
    assert.equal(ramadanClient.primaryFastingBadge.type, 'RAMADAN');
  });

  await t.test('7. Tripartite Fasting: Correctly categorizes Intermittent Fasting (16/8 & 14/10)', async () => {
    const { extractClientFastingProfile } = await import('../frontend/src/utils/seasonalFastingRadar.js');

    const intermittentClient = extractClientFastingProfile({
      answers: {
        personal: { religion: 'MUSLIM' },
        meal_structure: { intermittent_fasting: '16_8' }
      }
    });
    assert.equal(intermittentClient.isIntermittent, true);
    assert.equal(intermittentClient.intermittentBadge.type, 'INTERMITTENT');
    assert.ok(intermittentClient.intermittentBadge.label.includes('16/8'));

    const noFastingClient = extractClientFastingProfile({
      answers: {
        personal: { religion: 'MUSLIM' },
        meal_structure: { intermittent_fasting: 'none' }
      }
    });
    assert.equal(noFastingClient.isIntermittent, false);
    assert.equal(noFastingClient.intermittentBadge, null);
  });

  await t.test('8. Tripartite Fasting: Multi-mode synergy (Coptic + 16/8 Intermittent Fasting)', async () => {
    const { extractClientFastingProfile } = await import('../frontend/src/utils/seasonalFastingRadar.js');

    const multiFastingClient = extractClientFastingProfile({
      religion: 'CHRISTIAN',
      christianFastingStyle: 'PESCATARIAN_ALLOWED',
      intermittent_fasting: '16_8'
    });
    assert.equal(multiFastingClient.isCoptic, true);
    assert.equal(multiFastingClient.isIntermittent, true);
    assert.ok(multiFastingClient.primaryFastingBadge);
    assert.ok(multiFastingClient.intermittentBadge);
  });

});
