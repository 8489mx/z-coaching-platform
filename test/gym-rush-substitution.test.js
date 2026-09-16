import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  GYM_RUSH_EQUIVALENCE_CATALOG,
  getGymRushEquivalentSwap,
  applyGymRushSwapToProgram,
} from '../src/execution-engines/biomechanics-firewall-engine.js';
import { buildMasterEngineV2 } from '../src/master-engine-v2/index.js';
import { completeIntake, ASSESSMENT_CONTEXT } from './fixtures/complete-intake.js';

const evaluationContext = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
});

const nutritionFoodCatalog = JSON.parse(
  fs.readFileSync(new URL('../data/catalogs/core-global-food-batch-v1.json', import.meta.url), 'utf8')
);

function buildTestProgram() {
  return buildMasterEngineV2({
    intake: completeIntake(),
    evaluationContext,
    nutritionFoodCatalog,
  });
}

test('Milestone 3: Gym Rush & Equipment Auto-Substitution Engine Suite', async (suite) => {

  await suite.test('1. Equivalence Catalog: Resolves all registered gym rush equipment correctly', () => {
    const latSwap = getGymRushEquivalentSwap('LAT_PULLDOWN');
    assert.equal(latSwap.found, true);
    assert.equal(latSwap.swap_id, 'single_arm_cable_pulldown');
    assert.ok(latSwap.biomechanical_swap_ar.includes('الكابل'));

    const legPressSwap = getGymRushEquivalentSwap('LEG_PRESS');
    assert.equal(legPressSwap.found, true);
    assert.equal(legPressSwap.swap_id, 'db_walking_lunges');

    const legExtSwap = getGymRushEquivalentSwap('LEG_EXTENSION');
    assert.equal(legExtSwap.found, true);
    assert.equal(legExtSwap.swap_id, 'spanish_squat_banded');

    const hackSquatSwap = getGymRushEquivalentSwap('HACK_SQUAT');
    assert.equal(hackSquatSwap.found, true);
    assert.equal(hackSquatSwap.swap_id, 'bulgarian_split_squat');
  });

  await suite.test('2. Partial Key Matching: Resolves composite or compound equipment keys', () => {
    const compositeLeg = getGymRushEquivalentSwap('SEATED_LEG_CURL');
    assert.equal(compositeLeg.found, true);
    assert.equal(compositeLeg.swap_id, 'db_romanian_deadlift');

    const cableCross = getGymRushEquivalentSwap('CABLE_CROSSOVER');
    assert.equal(cableCross.found, true);
    assert.equal(cableCross.swap_id, 'incline_db_fly');
  });

  await suite.test('3. Unregistered Equipment Fallback: Returns graceful recommendation without throwing', () => {
    const unknown = getGymRushEquivalentSwap('RANDOM_UNKNOWN_MACHINE_XYZ');
    assert.equal(unknown.found, false);
    assert.ok(unknown.message_ar.includes('غير مسجل'));
  });

  await suite.test('4. Program Auto-Substitution: Swaps busy gym exercise seamlessly preserving program integrity', () => {
    const baseProgram = JSON.parse(JSON.stringify(buildTestProgram()));
    
    // Inject a LEG_PRESS exercise in week 1 session 0
    baseProgram.training_program.weeks[0].sessions[0].exercises[0] = {
      id: 'test_leg_press',
      code: 'LEG_PRESS',
      name_ar: 'جهاز ضغط الأرجل',
      name_en: 'Leg Press',
      sets: 4,
      reps: '10-12',
      rir: 2,
    };

    const swapResult = applyGymRushSwapToProgram(baseProgram, {
      weekNumber: 1,
      sessionIndex: 0,
      exerciseIndex: 0,
      equipmentKey: 'LEG_PRESS'
    });

    assert.equal(swapResult.success, true);
    assert.ok(swapResult.swapped_exercise);
    assert.equal(swapResult.swapped_exercise.is_gym_rush_swap, true);
    assert.equal(swapResult.swapped_exercise.code, 'DB_WALKING_LUNGES');
    assert.ok(swapResult.swapped_exercise.name_ar.includes('طعنات'));
    assert.equal(swapResult.swapped_exercise.original_exercise_code, 'LEG_PRESS');
    assert.ok(swapResult.swapped_exercise.coaching_cue_ar.length > 0);

    // Verify cloned program updated
    const updatedEx = swapResult.program.training_program.weeks[0].sessions[0].exercises[0];
    assert.equal(updatedEx.is_gym_rush_swap, true);
    assert.equal(updatedEx.code, 'DB_WALKING_LUNGES');
  });

  await suite.test('5. Error Handling: Handles invalid program data or missing week/session gracefully', () => {
    assert.throws(() => {
      applyGymRushSwapToProgram(null);
    }, TypeError);

    const emptyProgram = { training_program: { weeks: [] } };
    assert.throws(() => {
      applyGymRushSwapToProgram(emptyProgram, { weekNumber: 99 });
    }, RangeError);
  });
});
