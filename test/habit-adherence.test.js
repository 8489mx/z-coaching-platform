import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateDailyHabits,
  calculateStreakStatus,
  correlateHabitsWithWeightChange
} from '../src/execution-engines/habit-adherence-engine.js';

test('Daily Habit, Sleep Quality, NEAT & Behavioral Adherence Engine Suite', async (t) => {

  await t.test('1. evaluateDailyHabits: Accurately calculates 100% adherence score when all habits are completed', () => {
    const result = evaluateDailyHabits({
      stepCount: 10000,
      targetSteps: 10000,
      sleepHours: 8,
      sleepQualityScore: 8,
      waterLiters: 3.5,
      targetWaterLiters: 3.5,
      workoutCompleted: true,
      mealsLoggedCount: 4,
      targetMealsCount: 4
    });

    assert.equal(result.daily_score, 100);
    assert.equal(result.performance_tier, 'EXCELLENT');
    assert.equal(result.meets_daily_standard, true);
    assert.equal(result.breakdown.nutrition.points, 35);
    assert.equal(result.breakdown.neat_steps.points, 25);
    assert.equal(result.breakdown.workout.points, 20);
    assert.equal(result.breakdown.sleep.points, 10);
    assert.equal(result.breakdown.hydration.points, 10);
  });

  await t.test('2. evaluateDailyHabits: Triggers sleep deprivation alert and reduces score when sleep < 6 hours', () => {
    const result = evaluateDailyHabits({
      stepCount: 8000,
      targetSteps: 8000,
      sleepHours: 5,
      sleepQualityScore: 4,
      waterLiters: 3.0,
      targetWaterLiters: 3.0,
      workoutCompleted: true,
      mealsLoggedCount: 4,
      targetMealsCount: 4
    });

    assert.equal(result.breakdown.sleep.points, 3);
    assert.ok(result.daily_score < 100);
    assert.equal(result.physiological_flags.length, 1);
    assert.equal(result.physiological_flags[0].type, 'SLEEP_DEPRIVATION_ALERT');
    assert.ok(result.physiological_flags[0].message_ar.includes('احتباس سوائل'));
  });

  await t.test('3. calculateStreakStatus: Tracks active streaks and rewards consistency badges', () => {
    const logs = [
      { daily_score: 90 },
      { daily_score: 85 },
      { daily_score: 75 },
      { daily_score: 95 },
      { daily_score: 80 },
      { daily_score: 88 },
      { daily_score: 92 }
    ];

    const streak = calculateStreakStatus(logs, 70);
    assert.equal(streak.current_streak_days, 7);
    assert.equal(streak.longest_streak_days, 7);
    assert.equal(streak.consistency_rate_pct, 100);
    assert.ok(streak.rank_title_ar.includes('المتدرب المنضبط'));
  });

  await t.test('4. correlateHabitsWithWeightChange: Detects sleep water retention and dropped steps', () => {
    const insight = correlateHabitsWithWeightChange({
      weeklyAverageSteps: 5000,
      targetSteps: 8000,
      weeklyAverageSleep: 5.5,
      weightDeltaKg: 0.4
    });

    assert.equal(insight.has_correlation_insights, true);
    assert.equal(insight.insights_ar.length, 2);
    assert.ok(insight.insights_ar[0].includes('احتباس سوائل هرموني'));
    assert.ok(insight.insights_ar[1].includes('هبوط الخطوات'));
  });

});
