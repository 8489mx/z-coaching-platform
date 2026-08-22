import test from 'node:test';
import assert from 'node:assert/strict';

import { generateInitialPlan } from '../src/execution-engines/onboarding-plan-generator-engine.js';

test('Expanded Splits Generator Suite', async (t) => {

  await t.test('1. AUTO split selects Arnold Split for 6-day male with recommended exercises', () => {
    const plan = generateInitialPlan({
      name: 'كريم',
      gender: 'MALE',
      age: 25,
      weightKg: 80,
      heightCm: 180,
      trainingDaysPerWeek: 6
    });

    assert.equal(plan.training_split.id, 'arnold_split');
    assert.equal(plan.training_split.schedule_blueprint.length, 6);
    assert.ok(plan.training_split.name_ar.includes('Arnold'));
    assert.ok(Array.isArray(plan.training_split.recommended_exercises));
    assert.ok(plan.training_split.recommended_exercises.some((e) => e.id === 'arnold_pullover'));
  });

  await t.test('2. AUTO split selects UL+Arms Hybrid for 5-day male with arm exercises', () => {
    const plan = generateInitialPlan({
      name: 'محمود',
      gender: 'MALE',
      age: 27,
      weightKg: 85,
      heightCm: 182,
      trainingDaysPerWeek: 5
    });

    assert.equal(plan.training_split.id, 'ul_arms_hybrid');
    assert.equal(plan.training_split.schedule_blueprint.length, 5);
    assert.ok(plan.training_split.name_ar.includes('UL+A'));
    assert.ok(plan.training_split.recommended_exercises.some((e) => e.id === 'bayesian_cable_curl'));
  });

  await t.test('3. AUTO split selects Female Glute Specialized for 4 and 5-day females with glute exercises', () => {
    const plan4 = generateInitialPlan({
      name: 'مريم',
      gender: 'FEMALE',
      age: 26,
      weightKg: 60,
      heightCm: 165,
      trainingDaysPerWeek: 4
    });

    assert.equal(plan4.training_split.id, 'female_glute_specialized');
    assert.equal(plan4.training_split.schedule_blueprint.length, 4);
    assert.ok(plan4.training_split.recommended_exercises.some((e) => e.id === 'kas_glute_bridge'));

    const plan5 = generateInitialPlan({
      name: 'نور',
      gender: 'FEMALE',
      age: 28,
      weightKg: 62,
      heightCm: 168,
      trainingDaysPerWeek: 5
    });

    assert.equal(plan5.training_split.id, 'female_glute_specialized');
    assert.equal(plan5.training_split.schedule_blueprint.length, 6);
  });

  await t.test('4. Explicit splitPreference overrides default assignment', () => {
    const plan = generateInitialPlan({
      name: 'أحمد',
      gender: 'MALE',
      age: 30,
      weightKg: 90,
      heightCm: 185,
      trainingDaysPerWeek: 4,
      splitPreference: 'ARNOLD'
    });

    assert.equal(plan.training_split.id, 'arnold_split');
    assert.ok(plan.training_split.recommended_exercises.length > 0);
  });

  await t.test('5. Computes fiber target and water target accurately', () => {
    const plan = generateInitialPlan({
      name: 'زياد',
      gender: 'MALE',
      age: 24,
      weightKg: 75,
      heightCm: 175,
      trainingDaysPerWeek: 4
    });

    assert.ok(plan.daily_targets.fiber_grams > 0);
    assert.equal(plan.daily_targets.fiber_grams, plan.daily_targets.target_fiber_g);
    assert.equal(plan.daily_targets.water_liters, 3.5);
  });

});
