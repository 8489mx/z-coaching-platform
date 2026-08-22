import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateWeeklyScaleAndWaistTruth } from '../src/execution-engines/scale-truth-clinical-engine.js';
import { evaluateDietBreakNeed } from '../src/execution-engines/calorie-cycling-diet-break-engine.js';
import { generateDailyCoachTriage } from '../src/execution-engines/coach-capacity-business-analytics-engine.js';
import { evaluateJointPainAndFirewall } from '../src/execution-engines/biomechanics-firewall-engine.js';
import { evaluateExerciseProgression } from '../src/execution-engines/progressive-overload-deload-engine.js';

test('5 Realistic Clinical Scenarios Stress-Test Suite', async (t) => {

  await t.test('Scenario 1: Sarah (PMS Week) -> Locks Calories, Adds Carb Buffer', () => {
    const res = evaluateWeeklyScaleAndWaistTruth({
      gender: 'FEMALE',
      isPMSWeek: true,
      weightDeltaKg: 1.2,
      waistDeltaCm: 0.2,
      currentCalories: 1500
    });
    assert.equal(res.decision, 'MENSTRUAL_PMS_HOLD');
    assert.equal(res.calorie_lock, true);
    assert.equal(res.carb_buffer_added_g, 25);
  });

  await t.test('Scenario 2: Mohamed (12 Weeks Deficit Plateau) -> Triggers Diet Break', () => {
    const res = evaluateDietBreakNeed({
      consecutiveDeficitWeeks: 12,
      bodyFatPercentage: 18,
      hungerFatigueScore: 8,
      currentDeficitCalories: 1800
    });
    assert.equal(res.should_take_diet_break, true);
    assert.equal(res.status, 'DIET_BREAK_RECOMMENDED');
  });

  await t.test('Scenario 3: Khaled (Expiring in 2 Days) -> Flagged as High Priority Renewal', () => {
    const clients = [
      { id: 'c3', name: 'خالد سعيد (Expiring)', days_remaining: 2, is_frozen: false }
    ];
    const triage = generateDailyCoachTriage(clients);
    assert.equal(triage.high_priority_queue.length, 1);
    assert.equal(triage.high_priority_queue[0].client_id, 'c3');
  });

  await t.test('Scenario 4: Youssef (Shoulder Impingement) -> Injects Scapular Plane DB Press', () => {
    const res = evaluateJointPainAndFirewall({
      jointLocation: 'SHOULDER',
      painScore: 5
    });
    assert.equal(res.firewall_active, true);
    const swap = res.immediate_swaps.find((s) => s.id === 'low_incline_neutral_db_press');
    assert.ok(swap);
  });

  await t.test('Scenario 5: Omar (3 Sets x 12 Reps @ 60kg) -> Unlocks 62.5kg Weight Progression', () => {
    const res = evaluateExerciseProgression({
      exerciseId: 'bench_press',
      exerciseType: 'COMPOUND_UPPER',
      targetRepRange: [8, 12],
      targetRIR: 2,
      loggedSets: [
        { set_number: 1, weight_kg: 60, reps: 12, rir: 2 },
        { set_number: 2, weight_kg: 60, reps: 12, rir: 2 },
        { set_number: 3, weight_kg: 60, reps: 12, rir: 2 }
      ]
    });
    assert.equal(res.status, 'PROGRESSION_UNLOCKED');
    assert.equal(res.decision, 'INCREASE_WEIGHT');
    assert.equal(res.next_weight_kg, 62.5);
  });

});
