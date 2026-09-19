import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateCheckin } from '../src/checkin-engine/index.js';
import { CheckinAnalysisStatus } from '../src/checkin-engine/domain/enums.js';
import { buildAdaptedPlan } from '../src/adaptation-engine/index.js';
import { AdaptationAction } from '../src/adaptation-engine/domain/enums.js';

// Stable weight and waist under full adherence, normal sleep and bowel pattern, non-desk job.
const stableWeek = (extra = {}) => ({
  weight_kg: 80.1,
  previous_weight_kg: 80.0,
  waist_circumference_cm: 85,
  previous_waist_circumference_cm: 85,
  nutrition_adherence_percent: 95,
  biofeedback: { hunger_level: 2, energy_level: 4, sleep_quality: 4, sleep_hours: 7.5, stress_level: 2 },
  sleep_stress_composite: 4,
  occupation_type: 'ACTIVE_JOB',
  ...extra,
});

test('fat-loss (or unknown goal) plateau still cuts calories', () => {
  for (const primary_goal of ['FAT_LOSS', null]) {
    const a = evaluateCheckin(stableWeek({ primary_goal }));
    assert.equal(a.analysis_status, CheckinAnalysisStatus.PLATEAU_DETECTED);
    assert.ok(a.suggested_calorie_delta < 0);
  }
});

test('muscle-gain stall raises calories instead of cutting them, including for desk workers', () => {
  for (const occupation_type of ['ACTIVE_JOB', 'DESK_OFFICE']) {
    const a = evaluateCheckin(stableWeek({ primary_goal: 'MUSCLE_GAIN', occupation_type }));
    assert.equal(a.analysis_status, CheckinAnalysisStatus.GAIN_STALL, occupation_type);
    assert.equal(a.suggested_calorie_delta, 125);
    assert.ok(a.suggested_carb_delta_g > 0);
  }
});

test('maintenance goal: stable weight is on track, not a plateau', () => {
  const a = evaluateCheckin(stableWeek({ primary_goal: 'WEIGHT_MAINTENANCE' }));
  assert.equal(a.analysis_status, CheckinAnalysisStatus.ON_TRACK);
  assert.equal(a.suggested_calorie_delta, 0);
});

test('adaptation engine applies a surplus for a gain stall', () => {
  const program = {
    client: { gender: 'male', weight_kg: 80 },
    nutrition_program: { macro_targets: { calories_kcal: 2800, protein_g: 170, carbohydrate_g: 350, fat_g: 80 } },
  };
  const analysis = evaluateCheckin(stableWeek({ primary_goal: 'MUSCLE_GAIN' }));
  const adapted = buildAdaptedPlan({ currentMasterProgram: program, checkinAnalysis: analysis });
  const text = JSON.stringify(adapted);
  assert.ok(text.includes(AdaptationAction.INCREASE_CALORIES_GAIN_STALL), 'adaptation action');
  assert.ok(!text.includes(AdaptationAction.REDUCE_CALORIES_FOR_PLATEAU));
});
