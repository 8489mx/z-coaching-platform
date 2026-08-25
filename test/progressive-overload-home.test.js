import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveExerciseProgressionModel } from '../src/execution-engines/progressive-overload-engine.js';

test('Non-Load Progressive Overload & Multi-Tool Home Engine Suite', async (t) => {

  await t.test('1. Applies load overload in GYM environment', () => {
    const model = resolveExerciseProgressionModel({
      environment: 'GYM',
      weekNumber: 2,
      currentWeightKg: 80,
      currentReps: 10
    });

    assert.equal(model.strategy, 'LOAD_OVERLOAD');
    assert.equal(model.suggestedWeightKg, 82.5);
  });

  await t.test('2. Applies accommodating resistance when both dumbbells and bands are available at home', () => {
    const model = resolveExerciseProgressionModel({
      environment: 'HOME',
      availableEquipment: ['DUMBBELLS', 'BANDS'],
      weekNumber: 2,
      currentWeightKg: 20,
      currentReps: 10
    });

    assert.equal(model.strategy, 'ACCOMMODATING_RESISTANCE');
    assert.equal(model.tempo, '3-1-1-0');
  });

  await t.test('3. Applies volume and tempo overload when only dumbbells are available at home', () => {
    const model = resolveExerciseProgressionModel({
      environment: 'HOME',
      availableEquipment: ['DUMBBELLS'],
      weekNumber: 2,
      currentWeightKg: 15,
      currentReps: 12
    });

    assert.equal(model.strategy, 'VOLUME_AND_TEMPO');
    assert.equal(model.tempo, '4-1-1-0');
  });

  await t.test('4. Applies biomechanical leverage overload for bodyweight only', () => {
    const model = resolveExerciseProgressionModel({
      environment: 'HOME',
      availableEquipment: ['BODYWEIGHT_ONLY'],
      weekNumber: 2,
      currentWeightKg: 0,
      currentReps: 15
    });

    assert.equal(model.strategy, 'BIOMECHANICAL_LEVERAGE');
    assert.equal(model.suggestedWeightKg, 0);
  });

});
