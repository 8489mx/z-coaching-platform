import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateInsulinSafety, evaluatePharmacologicalFirewall } from '../src/execution-engines/drug-interaction-firewall.js';
import { generateInitialPlan } from '../src/execution-engines/onboarding-plan-generator-engine.js';

test('Clinical Safety Firewalls - Exogenous Insulin Protocol Suite', async (t) => {

  await t.test('1. Detects insulin therapy and enforces carb floor & safety cues', () => {
    const result = evaluateInsulinSafety(['Lantus', 'Novorapid']);
    assert.equal(result.requires_insulin_protocol, true);
    assert.equal(result.carb_floor_grams, 130);
    assert.equal(result.lock_keto, true);
    assert.equal(result.safety_cues_ar.length, 3);
    assert.ok(result.safety_cues_ar[0].includes('قاعدة 15-15'));
  });

  await t.test('2. Detects Arabic insulin keyword', () => {
    const result = evaluateInsulinSafety(['حقن انسولين ميكستارد']);
    assert.equal(result.requires_insulin_protocol, true);
    assert.equal(result.carb_floor_grams, 130);
  });

  await t.test('3. Returns false for non-insulin medications', () => {
    const result = evaluateInsulinSafety(['Omega 3', 'Creatine']);
    assert.equal(result.requires_insulin_protocol, false);
  });

  await t.test('4. generateInitialPlan clamps carb floor to >= 130g and adds clinical notes', () => {
    const plan = generateInitialPlan({
      name: 'طارق عبد الله',
      gender: 'MALE',
      age: 35,
      weightKg: 85,
      heightCm: 175,
      goal: 'AGGRESSIVE_CUT',
      medicalFlags: ['INSULIN_DEPENDENT']
    });

    assert.ok(plan.daily_targets.carbs_grams >= 130);
    assert.ok(plan.clinical_notes.length > 0);
    assert.ok(plan.clinical_notes.some(n => n.includes('بروتوكول الأنسولين الإكلينيكي')));
  });

});
