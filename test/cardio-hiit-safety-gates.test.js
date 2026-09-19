import test from 'node:test';
import assert from 'node:assert/strict';

import { getPracticalCardioPrescription, CARDIO_TYPES, CARDIO_EQUIPMENT } from '../src/execution-engines/cardio-zones-engine.js';

const hiit = (extra) => getPracticalCardioPrescription({ type: CARDIO_TYPES.HIIT_INTERVALS, ...extra });

test('HIIT becomes moderate steady-state cardio for cardiovascular disease, pregnancy and BMI >= 35', () => {
  const cases = [
    [{ medicalConditions: ['HYPERTENSION'] }, 'CARDIOVASCULAR'],
    [{ medicalConditions: [{ conditionCode: 'HEART_CONDITION' }] }, 'CARDIOVASCULAR'],
    [{ medicalConditions: ['ضغط الدم المرتفع'] }, 'CARDIOVASCULAR'],
    [{ medicalConditions: ['PREGNANT'] }, 'PREGNANCY'],
    [{ weight_kg: 117, height_cm: 175 }, 'SEVERE_OBESITY'],
  ];
  for (const [input, reason] of cases) {
    const rx = hiit(input);
    assert.equal(rx.type, CARDIO_TYPES.LISS_TALK_TEST, JSON.stringify(input));
    assert.equal(rx.clinical_guardrails.hiit_banned, true);
    assert.equal(rx.clinical_guardrails.hiit_ban_reason, reason);
    assert.ok(rx.clinical_guidance_ar, `guidance for ${reason}`);
  }
});

test('HIIT moves to a non-impact bike for BMI 30-35 and lower-limb or spine issues, with no sprint cue', () => {
  for (const input of [{ weight_kg: 98, height_cm: 175 }, { medicalConditions: ['KNEE_PAIN'] }, { medicalConditions: ['LOWER_BACK'] }, { medicalConditions: ['إصابة الكاحل'] }]) {
    const rx = hiit(input);
    assert.equal(rx.type, CARDIO_TYPES.HIIT_INTERVALS, JSON.stringify(input));
    assert.equal(rx.equipment_recommendation, CARDIO_EQUIPMENT.STATIONARY_BIKE);
    assert.equal(rx.clinical_guardrails.impact_restricted, true);
    assert.ok(!rx.execution_breakdown_ar.join(' ').includes('سبرنت'), JSON.stringify(input));
  }
});

test('a healthy client with normal BMI keeps the standard sprint interval protocol', () => {
  const rx = hiit({ weight_kg: 78, height_cm: 180, medicalConditions: [] });
  assert.equal(rx.type, CARDIO_TYPES.HIIT_INTERVALS);
  assert.equal(rx.clinical_guardrails.hiit_banned, false);
  assert.equal(rx.clinical_guardrails.impact_restricted, false);
  assert.equal(rx.equipment_recommendation, CARDIO_EQUIPMENT.INCLINE_TREADMILL);
});
