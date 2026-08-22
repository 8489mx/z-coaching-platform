import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateDoubleProgression,
  evaluateExerciseProgression,
  evaluateDeloadNeed,
  compileDeloadSession,
  EXERCISE_CATEGORIES,
  evaluateAutoDeloadRequirement,
  calculateReverseDietingStep,
  REVERSE_DIET_STATUS,
  calculateNeatTitrationStep,
  NEAT_LEVELS
} from '../src/execution-engines/index.js';

test('1. Double Progression - Increments Weight on Hitting Top Reps and Resets to Floor', () => {
  // Barbell Compound: 3 x 12 reps -> +2.5kg, reset to 8 reps
  const compound = evaluateDoubleProgression({
    exercise_name: 'Barbell Squat',
    category: EXERCISE_CATEGORIES.COMPOUND_BARBELL,
    target_rep_range: [8, 12],
    current_weight_kg: 100,
    completed_sets: [
      { reps: 12, completed: true },
      { reps: 12, completed: true },
      { reps: 12, completed: true }
    ]
  });

  assert.equal(compound.progression_action, 'INCREASE_WEIGHT_RESET_REPS');
  assert.equal(compound.next_target_weight_kg, 102.5);
  assert.equal(compound.next_target_reps, 8);
  assert.equal(compound.increment_applied_kg, 2.5);

  // Dumbbell Isolation: 3 x 15 reps -> +1.0kg, reset to 10 reps
  const isolation = evaluateDoubleProgression({
    exercise_name: 'Lateral Raise',
    category: EXERCISE_CATEGORIES.ISOLATION_DUMBBELL,
    target_rep_range: [10, 15],
    current_weight_kg: 12,
    completed_sets: [
      { reps: 15, completed: true },
      { reps: 15, completed: true },
      { reps: 15, completed: true }
    ]
  });
  assert.equal(isolation.next_target_weight_kg, 13);
  assert.equal(isolation.next_target_reps, 10);
});

test('2. Double Progression - Holds Load When Top of Rep Range is Not Yet Reached', () => {
  const result = evaluateDoubleProgression({
    exercise_name: 'Bench Press',
    target_rep_range: [8, 12],
    current_weight_kg: 80,
    completed_sets: [
      { reps: 12, completed: true },
      { reps: 11, completed: true },
      { reps: 9, completed: true }
    ]
  });

  assert.equal(result.progression_action, 'MAINTAIN_WEIGHT_BUILD_REPS');
  assert.equal(result.next_target_weight_kg, 80);
  assert.equal(result.next_target_reps, 12);
});

test('3. Auto-Deload Protocol - Triggers 50% Volume Cut on Fatigue Accumulation or Performance Drop', () => {
  // Trigger on 6 weeks mesocycle
  const deload1 = evaluateAutoDeloadRequirement({ consecutive_training_weeks: 6 });
  assert.equal(deload1.is_deload_active, true);
  assert.equal(deload1.volume_reduction_percent, 50);

  // Trigger on 2 consecutive weeks performance drop
  const deload2 = evaluateAutoDeloadRequirement({ consecutive_training_weeks: 3, consecutive_performance_drop_weeks: 2 });
  assert.equal(deload2.is_deload_active, true);
});

test('4. Reverse Dieting - Stepwise Escalation and Maintenance Achievement', () => {
  // Stepwise escalation
  const step = calculateReverseDietingStep({
    current_deficit_calories: 1600,
    target_maintenance_calories: 2200,
    current_carbs_g: 150,
    current_protein_g: 150,
    current_fat_g: 45,
    waist_change_cm: 0.0
  });

  assert.equal(step.status, REVERSE_DIET_STATUS.ACTIVE_REVERSING);
  assert.equal(step.weekly_increment_kcal, 120);
  assert.equal(step.next_week_target.daily_calories, 1720);
  assert.ok(step.next_week_target.carbs_g > 150);

  // Maintenance achieved
  const maintenance = calculateReverseDietingStep({
    current_deficit_calories: 2180,
    target_maintenance_calories: 2200
  });
  assert.equal(maintenance.status, REVERSE_DIET_STATUS.MAINTENANCE_ACHIEVED);
});

test('5. NEAT Titration - Step-First Hierarchy Escalation', () => {
  // Level 1: Steps under 12,000 -> +1,500 steps
  const lvl1 = calculateNeatTitrationStep({ current_daily_steps: 8000 });
  assert.equal(lvl1.hierarchy_level, NEAT_LEVELS.LEVEL_1_STEPS_TITRATION);
  assert.equal(lvl1.next_daily_steps_target, 9500);

  // Level 2: Steps at 12,000 -> +2 Zone 2 Cardio sessions
  const lvl2 = calculateNeatTitrationStep({ current_daily_steps: 12000, current_weekly_cardio_sessions: 0 });
  assert.equal(lvl2.hierarchy_level, NEAT_LEVELS.LEVEL_2_ZONE2_CARDIO);
  assert.equal(lvl2.weekly_cardio_sessions, 2);

  // Level 3: Steps at 12,000 and Cardio at 3 -> -150 Kcal Calorie Cut
  const lvl3 = calculateNeatTitrationStep({ current_daily_steps: 12000, current_weekly_cardio_sessions: 3, current_daily_calories: 1800 });
  assert.equal(lvl3.hierarchy_level, NEAT_LEVELS.LEVEL_3_CALORIE_DEFICIT_CUT);
  assert.equal(lvl3.daily_calories_target, 1650);
  assert.equal(lvl3.calories_cut_applied, 150);
});


test('6. evaluateExerciseProgression: Increases load and resets reps when all sets hit top range', () => {
  const result = evaluateExerciseProgression({
    exerciseId: 'squat_01',
    exerciseType: 'COMPOUND_LOWER',
    targetRepRange: [8, 12],
    targetRIR: 2,
    loggedSets: [
      { set_number: 1, weight_kg: 100, reps: 12, rir: 2 },
      { set_number: 2, weight_kg: 100, reps: 12, rir: 2 },
      { set_number: 3, weight_kg: 100, reps: 12, rir: 2 }
    ]
  });

  assert.equal(result.status, 'PROGRESSION_UNLOCKED');
  assert.equal(result.decision, 'INCREASE_WEIGHT');
  assert.equal(result.next_weight_kg, 105.0);
  assert.equal(result.next_target_reps, 8);
  assert.equal(result.action_type, 'INCREASE_LOAD');
});

test('7. evaluateExerciseProgression: Triggers MICRO_DELOAD on 2 consecutive stalls under min reps', () => {
  const result = evaluateExerciseProgression({
    exerciseId: 'bench_01',
    exerciseType: 'COMPOUND_UPPER',
    targetRepRange: [8, 12],
    loggedSets: [
      { set_number: 1, weight_kg: 80, reps: 6, rir: 0 },
      { set_number: 2, weight_kg: 80, reps: 5, rir: 0 }
    ],
    consecutiveStalls: 2
  });

  assert.equal(result.status, 'MICRO_DELOAD_REQUIRED');
  assert.equal(result.decision, 'REDUCE_WEIGHT');
  assert.equal(result.next_weight_kg, 72.0); // 80 * 0.9 = 72
  assert.equal(result.action_type, 'DELOAD_EXERCISE');
});

test('8. evaluateDeloadNeed & compileDeloadSession: Detects accumulated fatigue and reduces session volume by 40%', () => {
  const deloadDecision = evaluateDeloadNeed({
    weeksOfAccumulatedTraining: 8,
    averageFatigueScore: 8,
    consecutivePerformanceDrops: 2
  });

  assert.equal(deloadDecision.should_deload, true);
  assert.equal(deloadDecision.status, 'DELOAD_RECOMMENDED');
  assert.equal(deloadDecision.protocol.volume_reduction_pct, 40);

  const compiledSession = compileDeloadSession({
    title_ar: 'يوم الدفع العلوي',
    exercises: [
      { name_ar: 'ضغط بار مستوي', sets: 4, target_rir: 2 },
      { name_ar: 'رفرفة جانبي', sets: 3, target_rir: 2 }
    ]
  });

  assert.equal(compiledSession.is_deload, true);
  assert.ok(compiledSession.title_ar.includes('Deload'));
  assert.equal(compiledSession.exercises[0].sets, 2); // 4 * 0.6 = 2.4 -> 2
  assert.equal(compiledSession.exercises[0].target_rir, 4);
});
