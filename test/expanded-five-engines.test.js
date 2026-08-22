import test from 'node:test';
import assert from 'node:assert/strict';

import { generateInitialPlan } from '../src/execution-engines/onboarding-plan-generator-engine.js';
import { evaluateExerciseProgression, evaluateDeloadNeed, compileDeloadSession } from '../src/execution-engines/progressive-overload-deload-engine.js';
import { calculateCalorieCycling, evaluateDietBreakNeed } from '../src/execution-engines/calorie-cycling-diet-break-engine.js';
import { evaluateDailyHabits, calculateStreakStatus } from '../src/execution-engines/habit-neat-tracker-engine.js';
import { evaluateCoachCapacity, generateDailyCoachTriage } from '../src/execution-engines/coach-capacity-business-analytics-engine.js';

test('Z Coaching Platform - Expanded 5-Engines Battery', async (t) => {

  await t.test('1. Onboarding: Calculates accurate BMR, TDEE, macros and split', () => {
    const plan = generateInitialPlan({
      name: 'أحمد محمود',
      gender: 'MALE',
      age: 28,
      weightKg: 80,
      heightCm: 180,
      activityLevel: 'SEDENTARY',
      goal: 'FAT_LOSS',
      trainingDaysPerWeek: 4
    });
    assert.equal(plan.bmr, 1790);
    assert.equal(plan.tdee, 2148);
    assert.equal(plan.daily_targets.calories, 1675);
    assert.equal(plan.daily_targets.protein_grams, 176);
  });

  await t.test('2. Overload: Triggers weight increase on max reps completion', () => {
    const result = evaluateExerciseProgression({
      exerciseId: 'squat_barbell',
      exerciseType: 'COMPOUND_LOWER',
      targetRepRange: [6, 8],
      targetRIR: 2,
      loggedSets: [{ set_number: 1, weight_kg: 100, reps: 8, rir: 2 }, { set_number: 2, weight_kg: 100, reps: 8, rir: 2 }]
    });
    assert.equal(result.decision, 'INCREASE_WEIGHT');
    assert.equal(result.next_weight_kg, 105);
  });

  await t.test('3. Calorie Cycling: Balances weekly calories perfectly', () => {
    const cycling = calculateCalorieCycling({
      dailyAverageCalories: 2000,
      trainingDaysPerWeek: 4,
      weightKg: 80,
      proteinGrams: 160,
      fatGrams: 60
    });
    const totalWeekly = (cycling.high_day.calories * 4) + (cycling.low_day.calories * 3);
    assert.ok(Math.abs(totalWeekly - 14000) <= 10);
  });

  await t.test('4. Habits: Scores daily habits accurately', () => {
    const evaluation = evaluateDailyHabits({
      stepCount: 10000,
      targetSteps: 10000,
      sleepHours: 8,
      sleepQualityScore: 8,
      waterLiters: 3.0,
      targetWaterLiters: 3.0,
      workoutCompleted: true,
      mealsLoggedCount: 4,
      targetMealsCount: 4
    });
    assert.equal(evaluation.daily_score, 100);
    assert.equal(evaluation.performance_tier, 'EXCELLENT');
  });

  await t.test('5. Triage: Triages clients into high priority queues', () => {
    const mockClients = [
      { id: 1, name: 'محمد', has_pending_checkin: true, days_remaining: 10 },
      { id: 2, name: 'سارة', has_pending_checkin: false, days_remaining: 2, is_frozen: false }
    ];
    const triage = generateDailyCoachTriage(mockClients);
    assert.equal(triage.high_priority_queue.length, 2);
  });

});
