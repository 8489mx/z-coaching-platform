import test from 'node:test';
import assert from 'node:assert/strict';

import { simulateCoachScenario } from '../src/execution-engines/coach-scenario-simulator.js';

test('Coach Scenario Sandbox / What-If Simulator Suite', async (t) => {

  await t.test('1. Simulates moderate caloric deficit with -300 kcal delta', () => {
    const res = simulateCoachScenario({
      baseTargets: { calories: 2200, protein: 160, carbs: 220, fats: 70 },
      clientBiometrics: { weightKg: 80, tdee: 2500 },
      deltaCalories: -300
    });

    assert.strictEqual(res.scenario_inputs.projected_calories, 1900);
    // Deficit is 2500 - 1900 = 600 kcal. 600 * 7 / 7700 = 0.55 kg/week
    assert.strictEqual(res.weight_velocity.weekly_direction, 'LOSS');
    assert.strictEqual(res.weight_velocity.projected_weekly_loss_kg, 0.55);
    // 600 / 2500 = 24% deficit -> SHRUNK_SEVERE
    assert.strictEqual(res.deficit_volume_shield.status, 'SHRUNK_SEVERE');
    assert.strictEqual(res.deficit_volume_shield.mrv_multiplier, 0.80);
    assert.ok(res.suggested_macro_targets.protein >= 180); // 80 * 2.3 = 184g
  });

  await t.test('2. Simulates bulking caloric surplus with +350 kcal delta', () => {
    const res = simulateCoachScenario({
      baseTargets: { calories: 2500, protein: 150, carbs: 300, fats: 75 },
      clientBiometrics: { weightKg: 75, tdee: 2400 },
      deltaCalories: +350
    });

    assert.strictEqual(res.scenario_inputs.projected_calories, 2850);
    assert.strictEqual(res.weight_velocity.weekly_direction, 'GAIN');
    assert.strictEqual(res.deficit_volume_shield.status, 'EXPANDED_SURPLUS');
    assert.strictEqual(res.deficit_volume_shield.mrv_multiplier, 1.15);
    assert.ok(res.deficit_volume_shield.title_ar.includes('توسيع سقف الاستشفاء'));
  });

  await t.test('3. Simulates merging two workout sessions and checks glycogen demand', () => {
    const s1 = {
      session_name: 'صدر وتراي',
      exercises: [
        { exercise_name: 'Barbell Bench Press', sets: 4 },
        { exercise_name: 'Incline Dumbbell Press', sets: 4 },
        { exercise_name: 'Cable Flyes', sets: 3 }
      ]
    };
    const s2 = {
      session_name: 'أرجل وبطن',
      exercises: [
        { exercise_name: 'Barbell Back Squat', sets: 4 },
        { exercise_name: 'Romanian Deadlift', sets: 4 },
        { exercise_name: 'Leg Extension', sets: 3 }
      ]
    };

    const res = simulateCoachScenario({
      baseTargets: { calories: 2000, protein: 150, carbs: 220, fats: 55 },
      clientBiometrics: { weightKg: 75, tdee: 2300 },
      deltaCalories: 0,
      sessionMerge: { sessionIndices: [0, 1] },
      currentSessions: [s1, s2]
    });

    assert.ok(res.session_merger_simulation);
    assert.strictEqual(res.session_merger_simulation.is_merged, true);
    assert.strictEqual(res.session_merger_simulation.total_exercises, 6);
    assert.strictEqual(res.session_merger_simulation.total_working_sets, 22);
    assert.strictEqual(res.session_merger_simulation.projected_glycogen_demand, 'VERY_HIGH');
    assert.strictEqual(res.session_merger_simulation.peri_workout_carb_ratio_target, '65%');
  });
});
