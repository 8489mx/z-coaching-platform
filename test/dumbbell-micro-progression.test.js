import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  calculateMicroProgressionBridge,
  MICRO_PROGRESSION_STRATEGIES,
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

test('Milestone 2: Micro-Progression Bridge & Dumbbell Paradox Engine Suite', async (suite) => {

  await suite.test('1. Rep Extension Strategy: Blocks premature 17.5kg jump until 15 reps achieved', () => {
    const bridge = calculateMicroProgressionBridge({
      currentWeightKg: 15,
      targetRepRange: [8, 12],
      currentReps: 12,
      currentRir: 2,
      bridgeStrategy: MICRO_PROGRESSION_STRATEGIES.REP_EXTENSION,
    });

    assert.equal(bridge.is_ready_for_next_weight, false);
    assert.equal(bridge.next_recommended_weight_kg, 15);
    assert.equal(bridge.extended_target_reps, 15);
    assert.equal(bridge.percentage_jump_to_next, 16.7);
    assert.ok(bridge.coaching_instruction_ar.includes('16.7%'));
    assert.ok(bridge.coaching_instruction_ar.includes('15 تكراراً'));
  });

  await suite.test('2. Rep Extension Strategy: Unlocks next dumbbell when 15 reps hit with RIR >= 2', () => {
    const bridge = calculateMicroProgressionBridge({
      currentWeightKg: 15,
      targetRepRange: [8, 12],
      currentReps: 15,
      currentRir: 2,
      bridgeStrategy: MICRO_PROGRESSION_STRATEGIES.REP_EXTENSION,
    });

    assert.equal(bridge.is_ready_for_next_weight, true);
    assert.equal(bridge.next_recommended_weight_kg, 17.5);
    assert.equal(bridge.next_target_reps, 8);
    assert.ok(bridge.coaching_instruction_ar.includes('17.5 كجم'));
  });

  await suite.test('3. Tempo Overload Strategy: Enforces 4-1-1-0 tempo to increase mechanical tension', () => {
    const bridge = calculateMicroProgressionBridge({
      currentWeightKg: 20,
      targetRepRange: [8, 10],
      currentReps: 10,
      currentRir: 2,
      bridgeStrategy: MICRO_PROGRESSION_STRATEGIES.TEMPO_OVERLOAD,
    });

    assert.equal(bridge.strategy, 'TEMPO_OVERLOAD');
    assert.equal(bridge.target_tempo, '4-1-1-0');
    assert.equal(bridge.current_weight_kg, 20);
    assert.ok(bridge.coaching_instruction_ar.includes('4 ثوانٍ'));
  });

  await suite.test('4. Master Engine Integration: Dumbbell exercises in mesocycle automatically receive micro-progression bridge', () => {
    const program = buildTestProgram();
    const weeks = program.training_program.weeks;
    assert.ok(weeks.length >= 3, 'Must have at least 3 weeks in mesocycle');

    let dumbbellCount = 0;
    let barbellCount = 0;

    for (const week of weeks) {
      for (const session of week.sessions) {
        for (const ex of session.exercises) {
          const isDb = String(ex.code).includes('DUMBBELL') || String(ex.code).includes('DB_');
          const isBb = String(ex.code).includes('BARBELL');

          if (isDb) {
            dumbbellCount++;
            assert.ok(ex.micro_progression_bridge, `Dumbbell exercise ${ex.code} must have micro_progression_bridge`);
            assert.ok(ex.prescription.dumbbell_progression_cue_ar, `Dumbbell exercise ${ex.code} must have progression cue`);
            assert.equal(ex.micro_progression_bridge.strategy, 'REP_EXTENSION');
          } else if (isBb) {
            barbellCount++;
            assert.equal(ex.micro_progression_bridge, null, `Barbell exercise ${ex.code} should not have dumbbell bridge`);
            assert.equal(ex.prescription.dumbbell_progression_cue_ar, null);
          }
        }
      }
    }

    assert.ok(dumbbellCount > 0, 'Program must contain dumbbell exercises to verify');
    assert.ok(barbellCount > 0, 'Program must contain barbell exercises to verify');
  });

});
