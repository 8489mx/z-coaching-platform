import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateBMR,
  calculateMetabolicMacroProfile,
  DAILY_ACTIVITY_FACTORS,
  WORKOUT_FREQUENCY_FACTORS,
  GOAL_CALORIE_MULTIPLIERS
} from '../src/execution-engines/index.js';

test('1. Metabolic Engine - Additive TDEE Decoupling (Daily Activity + Workout Frequency)', () => {
  // Desk worker (1.20) + 3-5 days resistance training (0.150) = 1.35 combined multiplier
  const res = calculateMetabolicMacroProfile({
    gender: 'MALE',
    age: 30,
    weight_kg: 80,
    height_cm: 180,
    daily_activity: 'SEDENTARY_DESK',
    workout_frequency: 'DAYS_3_TO_5',
    goal: 'MAINTENANCE',
    protein_per_kg: 2.0
  });

  // BMR = 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
  assert.equal(res.bmr_kcal, 1780);
  assert.equal(res.tdee_multiplier, 1.35);
  // TDEE = 1780 * 1.35 = 2403
  assert.equal(res.tdee_kcal, 2403);
  assert.equal(res.target_calories_kcal, 2403);
});

test('2. Metabolic Engine - Obese BMI Protein Cap (BMI >= 30)', () => {
  // Obese client: 120kg at 170cm -> BMI = 120 / (1.70^2) = 41.5
  // Adjusted weight = 28 * (1.70^2) = 80.92kg -> 80.9kg
  const res = calculateMetabolicMacroProfile({
    gender: 'MALE',
    age: 28,
    weight_kg: 120,
    height_cm: 170,
    daily_activity: 'LIGHT_MOVEMENT',
    workout_frequency: 'DAYS_3_TO_5',
    goal: 'FAT_LOSS_STANDARD',
    protein_per_kg: 2.2,
    is_muscular: false
  });

  assert.equal(res.is_bmi_cap_applied, true);
  assert.equal(res.calculation_weight_for_protein_kg, 80.9);
  // Protein = 80.9 * 2.2 = 177.98 -> 178g (NOT 120 * 2.2 = 264g!)
  assert.equal(res.macro_targets.protein_g, 178);
});

test('3. Metabolic Engine - Hormonal Fat Floor (>=40g Female / >=50g Male)', () => {
  // Female on low calorie cut
  const femaleRes = calculateMetabolicMacroProfile({
    gender: 'FEMALE',
    age: 25,
    weight_kg: 55,
    height_cm: 160,
    daily_activity: 'SEDENTARY_DESK',
    workout_frequency: 'DAYS_1_TO_2',
    goal: 'AGGRESSIVE_CUT',
    protein_per_kg: 2.0
  });

  assert.ok(femaleRes.macro_targets.fat_g >= 40);

  // Male on cut
  const maleRes = calculateMetabolicMacroProfile({
    gender: 'MALE',
    age: 25,
    weight_kg: 70,
    height_cm: 175,
    daily_activity: 'SEDENTARY_DESK',
    workout_frequency: 'DAYS_1_TO_2',
    goal: 'AGGRESSIVE_CUT',
    protein_per_kg: 2.0
  });

  assert.ok(maleRes.macro_targets.fat_g >= 50);
});

test('4. Metabolic Engine - Katch-McArdle LBM calculation when Body Fat % is provided', () => {
  // 80kg with 15% body fat -> LBM = 80 * 0.85 = 68kg
  // BMR = 370 + (21.6 * 68) = 370 + 1468.8 = 1838.8 -> 1839
  const bmr = calculateBMR({
    gender: 'MALE',
    age: 25,
    weight_kg: 80,
    height_cm: 180,
    body_fat_percent: 15
  });

  assert.equal(bmr, 1839);
});
