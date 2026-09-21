import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateCheckin } from '../src/checkin-engine/evaluate-checkin.js';
import { CheckinAnalysisStatus, AdherenceTier } from '../src/checkin-engine/domain/enums.js';
import { buildMasterEngineV2 } from '../src/master-engine-v2/build-master-engine-v2.js';

import fs from 'node:fs';
import { completeIntake, ASSESSMENT_CONTEXT } from './fixtures/complete-intake.js';

test('Trainee Complete Weekly Lifecycle & Auto-Regulation Suite', async (t) => {
  // 1. Initial Program Generation
  const VALID_MINIMAL_PROFILE = completeIntake();
  const evaluationContext = Object.freeze({
    system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
    assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
  });
  const nutritionFoodCatalog = JSON.parse(
    fs.readFileSync(new URL('../data/catalogs/core-global-food-batch-v1.json', import.meta.url), 'utf8'),
  );

  const initialEngineOutput = buildMasterEngineV2({
    intake: VALID_MINIMAL_PROFILE,
    evaluationContext,
    nutritionFoodCatalog,
  });
  assert.ok(initialEngineOutput);
  assert.ok(initialEngineOutput.nutrition_program);
  assert.ok(initialEngineOutput.nutrition_program.quantized_plan);

  const week1Calories = initialEngineOutput.nutrition_program.quantized_plan.daily_totals?.calories_kcal || 2200;



  // 2. Scenario A: Week 2 Check-in — Waist Drop with Stable Weight (Body Recomp)
  await t.test('Scenario A: Recomp detected (Waist dropped 1.0cm, weight stable)', () => {
    const week2Checkin = {
      weight_kg: 85.0, // Weight stayed 85.0 kg
      previous_weight_kg: 85.0,
      waist_circumference_cm: 87.0, // Dropped from 88.0 cm (-1.0 cm)
      previous_waist_circumference_cm: 88.0,
      nutrition_adherence_percent: 95,
      workouts_completed: 4,
      biofeedback: { hunger_level: 2, energy_level: 4, sleep_quality: 4, stress_level: 2 }
    };

    const analysis = evaluateCheckin(week2Checkin);
    assert.equal(analysis.analysis_status, CheckinAnalysisStatus.BODY_RECOMP_SUCCESS);
    assert.equal(analysis.suggested_calorie_delta, 0);
    assert.ok(analysis.recommendations_ar[0].includes('نزول دهون مع زيادة عضل بنجاح'));
  });

  // 3. Scenario B: Week 3 Check-in — True Plateau (Consecutive weeks no drop)
  await t.test('Scenario B: True Plateau (Weight & Waist unchanged under 95% adherence)', () => {
    const week3Checkin = {
      weight_kg: 85.0,
      previous_weight_kg: 85.0,
      waist_circumference_cm: 87.0,
      previous_waist_circumference_cm: 87.0,
      nutrition_adherence_percent: 95,
      is_consecutive_plateau: true,
      workouts_completed: 4,
      biofeedback: { hunger_level: 2, energy_level: 4, sleep_quality: 4 }
    };

    const analysis = evaluateCheckin(week3Checkin);
    assert.equal(analysis.analysis_status, CheckinAnalysisStatus.TRUE_PLATEAU);
    assert.equal(analysis.suggested_calorie_delta, -125);
    assert.equal(analysis.suggested_steps_delta, 1000);

    const adaptedCalories = week1Calories + analysis.suggested_calorie_delta;
    assert.equal(adaptedCalories, week1Calories - 125);
  });

  // 4. Scenario C: Week 4 Check-in — Low Adherence (< 80%)
  await t.test('Scenario C: Low Adherence (< 80%) locks calories', () => {
    const week4Checkin = {
      weight_kg: 85.2,
      previous_weight_kg: 85.0,
      waist_circumference_cm: 87.5,
      previous_waist_circumference_cm: 87.0,
      nutrition_adherence_percent: 65,
      workouts_completed: 2,
      biofeedback: { hunger_level: 3, energy_level: 3 }
    };

    const analysis = evaluateCheckin(week4Checkin);
    assert.equal(analysis.analysis_status, CheckinAnalysisStatus.POOR_ADHERENCE);
    assert.equal(analysis.adherence_tier, AdherenceTier.LOW);
    assert.equal(analysis.suggested_calorie_delta, 0);
    assert.ok(analysis.recommendations_ar[0].includes('تثبيت السعرات'));
  });

  // 5. Scenario D: Week 5 Check-in — High Fatigue & Joint Pain (Auto-Deload)
  await t.test('Scenario D: Lower back pain triggers deload & coach flag', () => {
    const week5Checkin = {
      weight_kg: 84.6,
      previous_weight_kg: 85.0,
      nutrition_adherence_percent: 90,
      workouts_completed: 4,
      biofeedback: { hunger_level: 3, energy_level: 2, sleep_quality: 2 },
      pain_reports: [{ body_part: 'LOWER_BACK', pain_level: 7, description: 'Sharp pain during deadlifts' }]
    };

    const analysis = evaluateCheckin(week5Checkin);
    assert.equal(analysis.analysis_status, CheckinAnalysisStatus.INJURY_FLAGGED);
    assert.equal(analysis.is_deload_recommended, true);
    assert.equal(analysis.requires_coach_review, true);
  });
});
