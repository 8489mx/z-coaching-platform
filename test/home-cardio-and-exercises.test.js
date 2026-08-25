import test from 'node:test';
import assert from 'node:assert/strict';

import { generateInitialPlan } from '../src/execution-engines/onboarding-plan-generator-engine.js';

test('Home Exercise Library & Home Cardio Integration Suite', async (t) => {

  await t.test('1. Generates home treadmill incline protocol for healthy client with treadmill at home', () => {
    const plan = generateInitialPlan({
      name: 'علي المنزلي',
      environment: 'HOME',
      homeEquipment: ['DUMBBELLS', 'TREADMILL'],
      trainingDaysPerWeek: 3
    });

    assert.equal(plan.cardio_protocol.equipment, 'HOME_TREADMILL');
    assert.equal(plan.cardio_protocol.incline_percent, '4-6% (مشي مائل)');
    assert.ok(plan.training_split.recommended_exercises.length > 0);
  });

  await t.test('2. Adjusts treadmill to flat walk when client has patellar tendinitis', () => {
    const plan = generateInitialPlan({
      name: 'سامي المصاب',
      environment: 'HOME',
      homeEquipment: ['TREADMILL'],
      medicalConditions: ['PATELLAR_TENDINITIS'],
      trainingDaysPerWeek: 3
    });

    assert.equal(plan.cardio_protocol.equipment, 'HOME_TREADMILL');
    assert.equal(plan.cardio_protocol.incline_percent, '0-1% (مشي مستوٍ خفيف)');
  });

  await t.test('3. Switches to stationary bike when knee patient has both treadmill and bike at home', () => {
    const plan = generateInitialPlan({
      name: 'هاني',
      environment: 'HOME',
      homeEquipment: ['TREADMILL', 'STATIONARY_BIKE'],
      medicalConditions: ['PATELLAR_TENDINITIS'],
      trainingDaysPerWeek: 3
    });

    assert.equal(plan.cardio_protocol.equipment, 'HOME_STATIONARY_BIKE');
  });

  await t.test('4. Generates bodyweight exercise variations when bodyweight only is selected', () => {
    const plan = generateInitialPlan({
      name: 'عمر وزن جسم',
      environment: 'HOME',
      homeEquipment: ['BODYWEIGHT_ONLY'],
      trainingDaysPerWeek: 3
    });

    const exNames = plan.training_split.recommended_exercises.map(e => e.name_ar);
    assert.ok(exNames.some(n => n.includes('ضغط برجلين') || n.includes('ضغط أرضي')));
  });

});
