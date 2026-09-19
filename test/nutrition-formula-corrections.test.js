import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateUniversalNutritionTargets } from '../src/master-engine-v2/index.js';
import { adaptIntakePayloadToCanonicalEngine } from '../src/intake-decision-engine/adapters/intake-adapter.js';

const ctx = { assessmentDate: '2026-09-19' };

function targets({ sex = 'MALE', age = 35, w, h, bf, goal = 'FAT_LOSS', days = 3, exp = 'BEGINNER', steps = 4000, fw } = {}) {
  const raw = {
    personal: { sex, age },
    body: { weightKg: w, heightCm: h, ...(bf ? { bodyFat: bf } : {}) },
    goals: { primary: goal },
    training: { preferredDaysPerWeek: days, experience: exp },
    cardio: { averageDailySteps: steps },
    nutrition: fw ? { dietFramework: fw } : {},
  };
  return calculateUniversalNutritionTargets(adaptIntakePayloadToCanonicalEngine(structuredClone(raw)), ctx, raw);
}

test('protein is dosed on a reference weight, not total weight, when fat mass is high', () => {
  const obese = targets({ w: 140, h: 175 });
  assert.equal(obese.protein_reference_basis, 'ADJUSTED_BODY_WEIGHT');
  assert.ok(obese.protein_g <= 210, `140 kg / BMI 45.7 got ${obese.protein_g} g protein`);

  const obeseKnownFat = targets({ w: 140, h: 175, bf: 42 });
  assert.equal(obeseKnownFat.protein_reference_basis, 'LEAN_MASS_AT_HEALTHY_BODY_FAT');
  // lean mass 81.2 kg at 15% body fat -> 95.5 kg reference
  assert.equal(obeseKnownFat.protein_reference_weight_kg, 95.5);

  const lean = targets({ w: 80, h: 180, bf: 12 });
  assert.equal(lean.protein_reference_basis, 'TOTAL_BODY_WEIGHT');
  assert.equal(lean.protein_g, Math.round(80 * 2.2));
});

test('calorie target never drops below 1200 kcal (women) / 1500 kcal (men) unless maintenance is lower', () => {
  const petite = targets({ sex: 'FEMALE', w: 50, h: 152, age: 45, steps: 3000 });
  assert.ok(petite.tdee * 0.8 < 1200);
  assert.equal(petite.target_calories, 1200);
  assert.equal(petite.calorie_floor_applied, true);

  const man = targets({ w: 58, h: 165, age: 60, steps: 3000 });
  assert.ok(man.target_calories >= Math.min(1500, man.tdee));
});

test('weekend refeed keeps the weekly average equal to the daily target', () => {
  const t = targets({ w: 85, h: 180, fw: 'WEEKEND_REFEED_2DAYS' });
  const r = t.weekend_refeed;
  assert.equal(r.weekend_refeed_calories_kcal, t.tdee);
  const weeklyAverage = (5 * r.weekday_deficit_calories_kcal + 2 * r.weekend_refeed_calories_kcal) / 7;
  assert.ok(Math.abs(weeklyAverage - t.target_calories) <= 3, `weekly average ${weeklyAverage} vs target ${t.target_calories}`);
});

for (const days of [3, 5]) {
  test(`carb cycling with ${days} training days: day calories match their macros and the week averages the target`, () => {
    const t = targets({ w: 85, h: 180, days, exp: days >= 5 ? 'ADVANCED' : 'BEGINNER', steps: 9000, fw: 'CARB_CYCLING' });
    const c = t.carb_cycling;
    assert.equal(c.high_carb_days_per_week, days);
    for (const day of [c.high_carb_targets, c.low_carb_targets]) {
      assert.equal(day.calories_kcal, day.protein_g * 4 + day.carbohydrate_g * 4 + day.fat_g * 9);
    }
    const dailyMacroKcal = t.protein_g * 4 + t.carb_g * 4 + t.fat_g * 9;
    const weeklyAverage = (c.high_carb_days_per_week * c.high_carb_targets.calories_kcal + c.low_carb_days_per_week * c.low_carb_targets.calories_kcal) / 7;
    assert.ok(Math.abs(weeklyAverage - dailyMacroKcal) <= 15, `weekly average ${weeklyAverage.toFixed(0)} vs daily ${dailyMacroKcal}`);
  });
}
