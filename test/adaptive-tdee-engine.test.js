import test from 'node:test';
import assert from 'node:assert/strict';

import { estimateAdaptiveTdee, evaluateCheckin } from '../src/checkin-engine/index.js';
import { KCAL_PER_KG_TISSUE, MAX_WEEKLY_TARGET_STEP_KCAL } from '../src/checkin-engine/adaptive-tdee.js';
import { buildAdaptedPlan } from '../src/adaptation-engine/index.js';
import { AdaptationAction } from '../src/adaptation-engine/domain/enums.js';

// Client eating a 2000 kcal plan at 90% adherence, losing exactly 0.5 kg/week:
// observed TDEE = 2000 + 0.5 * 7700 / 7 = 2550 kcal.
const losingWeeks = (n = 3, perWeek = -0.5, extra = {}) => Array.from({ length: n }, (_, i) => ({
  week_number: i + 1,
  average_weight_kg: 90 + perWeek * i,
  adherence_percent: 90,
  planned_target_kcal: 2000,
  ...extra,
}));

test('needs 3 weekly weights (2 weeks of trend) before replacing the formula', () => {
  const r = estimateAdaptiveTdee({ weeks: losingWeeks(2), formula_tdee_kcal: 2500, current_target_kcal: 2000 });
  assert.equal(r.ready, false);
  assert.equal(r.source, 'FORMULA');
  assert.equal(r.recommended_target_kcal, 2000);
});

test('observed TDEE = mean intake - weight trend x 7700 / 7', () => {
  const r = estimateAdaptiveTdee({ weeks: losingWeeks(3), formula_tdee_kcal: 2500, current_target_kcal: 2000, primary_goal: 'FAT_LOSS' });
  assert.equal(r.ready, true);
  assert.equal(r.source, 'OBSERVED');
  assert.equal(r.weight_trend_kg_per_week, -0.5);
  assert.equal(r.observed_tdee_kcal, Math.round(2000 + (0.5 * KCAL_PER_KG_TISSUE) / 7));
  assert.equal(r.clamped, false);
});

test('recommended target follows the goal on the observed TDEE, at most 150 kcal per check-in', () => {
  // Stable weight on 2600 kcal: TDEE 2600, fat loss wants 2080 -> first step only -150.
  const stable = losingWeeks(4, 0).map((w) => ({ ...w, planned_target_kcal: 2600 }));
  const cut = estimateAdaptiveTdee({ weeks: stable, formula_tdee_kcal: 2500, current_target_kcal: 2600, primary_goal: 'FAT_LOSS' });
  assert.equal(cut.observed_tdee_kcal, 2600);
  assert.equal(cut.calorie_delta, -MAX_WEEKLY_TARGET_STEP_KCAL);
  assert.equal(cut.recommended_target_kcal, 2450);

  // Gaining goal, weight stable on 2600: TDEE 2600 x 1.1 = 2860 -> +150 step.
  const gain = estimateAdaptiveTdee({ weeks: stable, formula_tdee_kcal: 2500, current_target_kcal: 2600, primary_goal: 'MUSCLE_GAIN' });
  assert.equal(gain.calorie_delta, MAX_WEEKLY_TARGET_STEP_KCAL);

  // Already at the right deficit: 2000 kcal losing 0.5 kg/week -> TDEE 2550 x 0.8 = 2040 -> +40 only.
  const onTrack = estimateAdaptiveTdee({ weeks: losingWeeks(3), formula_tdee_kcal: 2500, current_target_kcal: 2000, primary_goal: 'FAT_LOSS' });
  assert.equal(onTrack.recommended_target_kcal, 2040);
});

test('low-adherence weeks without reported calories block the estimate; reported calories are used', () => {
  const weeks = losingWeeks(3);
  weeks[2].adherence_percent = 60;
  assert.equal(estimateAdaptiveTdee({ weeks, formula_tdee_kcal: 2500, current_target_kcal: 2000 }).ready, false);
  weeks[2].reported_intake_kcal = 2300;
  const r = estimateAdaptiveTdee({ weeks, formula_tdee_kcal: 2500, current_target_kcal: 2000 });
  assert.equal(r.ready, true);
  assert.deepEqual(r.intake_sources, ['PLANNED_HIGH_ADHERENCE', 'REPORTED']);
  assert.equal(r.mean_intake_kcal, 2150);
});

test('implausible readings are clamped to +-30% of the formula TDEE', () => {
  // 3 kg/week loss on 2000 kcal would mean ~5300 kcal expenditure.
  const r = estimateAdaptiveTdee({ weeks: losingWeeks(3, -3), formula_tdee_kcal: 2500, current_target_kcal: 2000 });
  assert.equal(r.clamped, true);
  assert.equal(r.observed_tdee_kcal, 3250);
});

test('women never get a target under 1200 kcal, men under 1500 kcal (unless maintenance is lower)', () => {
  const weeks = losingWeeks(3, 0).map((w) => ({ ...w, planned_target_kcal: 1300 }));
  const r = estimateAdaptiveTdee({ weeks, formula_tdee_kcal: 1400, current_target_kcal: 1300, primary_goal: 'FAT_LOSS', is_female: true });
  assert.ok(r.recommended_target_kcal >= 1200);
});

test('adaptation engine applies the observed target, keeps protein and prefers carbs for the change', () => {
  const program = { client: { gender: 'male', weight_kg: 90 }, nutrition_program: { macro_targets: { calories_kcal: 2600, protein_g: 180, carbohydrate_g: 280, fat_g: 70 } } };
  const analysis = {
    ...evaluateCheckin({ weight_kg: 90, previous_weight_kg: 90, nutrition_adherence_percent: 95, occupation_type: 'ACTIVE_JOB', sleep_stress_composite: 4, primary_goal: 'FAT_LOSS' }),
    adaptive_tdee: estimateAdaptiveTdee({ weeks: losingWeeks(4, 0).map((w) => ({ ...w, planned_target_kcal: 2600 })), formula_tdee_kcal: 2500, current_target_kcal: 2600, primary_goal: 'FAT_LOSS' }),
  };
  const adapted = buildAdaptedPlan({ currentMasterProgram: program, checkinAnalysis: analysis });
  const text = JSON.stringify(adapted);
  assert.ok(text.includes(AdaptationAction.APPLY_OBSERVED_TDEE));
  assert.ok(text.includes('"target_calories_kcal":2450'), text.slice(0, 400));
  assert.ok(text.includes('"protein_g":180'));
});

test('locks win over the observed TDEE (poor adherence keeps calories)', () => {
  const program = { client: { gender: 'male', weight_kg: 90 }, nutrition_program: { macro_targets: { calories_kcal: 2600, protein_g: 180, carbohydrate_g: 280, fat_g: 70 } } };
  const analysis = {
    ...evaluateCheckin({ weight_kg: 90, previous_weight_kg: 90, nutrition_adherence_percent: 50, primary_goal: 'FAT_LOSS' }),
    adaptive_tdee: { ready: true, recommended_target_kcal: 2450, reason_ar: 'x' },
  };
  const text = JSON.stringify(buildAdaptedPlan({ currentMasterProgram: program, checkinAnalysis: analysis }));
  assert.ok(!text.includes(AdaptationAction.APPLY_OBSERVED_TDEE));
  assert.ok(text.includes('"target_calories_kcal":2600'));
});

// A month off the plan, three kilograms regained, then a steady return. The weeks on either side of
// the break used to form one trend, read as "gained weight while eating the target", and the
// calories were cut at every check-in while the client was losing on schedule.
test('a break in check-ins starts the trend again instead of reading the regain as a slow metabolism', () => {
  const weeks = [
    { week_number: 8, average_weight_kg: 88.4, adherence_percent: 85, planned_target_kcal: 1800 },
    { week_number: 10, average_weight_kg: 87.5, adherence_percent: 85, planned_target_kcal: 1800 },
    { week_number: 12, average_weight_kg: 86.6, adherence_percent: 85, planned_target_kcal: 1800 },
    // weeks 13-17: no check-ins, weight back up
    { week_number: 18, average_weight_kg: 89.3, adherence_percent: 80, planned_target_kcal: 1800 },
  ];
  const justBack = estimateAdaptiveTdee({ weeks, formula_tdee_kcal: 2100, current_target_kcal: 1800, primary_goal: 'FAT_LOSS', is_female: true });
  assert.equal(justBack.ready, false, 'one check-in after the break is not a trend');
  assert.equal(justBack.calorie_delta, 0);

  const back = [...weeks,
    { week_number: 20, average_weight_kg: 88.6, adherence_percent: 80, planned_target_kcal: 1800 },
    { week_number: 22, average_weight_kg: 87.9, adherence_percent: 80, planned_target_kcal: 1800 }];
  const r = estimateAdaptiveTdee({ weeks: back, formula_tdee_kcal: 2100, current_target_kcal: 1800, primary_goal: 'FAT_LOSS', is_female: true });
  assert.equal(r.weeks_used, 3, 'only the weeks since the return');
  assert.ok(r.weight_trend_kg_per_week < 0, 'the client is losing since the return');
  // Read from the return alone, the burn is the formula's again; the plan only settles toward its
  // own 20% deficit, instead of taking the full weekly cut as if the metabolism had slowed.
  assert.ok(r.observed_tdee_kcal >= 2100, `observed burn ${r.observed_tdee_kcal}`);
  assert.ok(r.calorie_delta > -MAX_WEEKLY_TARGET_STEP_KCAL, `calories cut by ${-r.calorie_delta} while losing on schedule`);
});

test('fortnightly check-ins are one unbroken trend', () => {
  const weeks = [2, 4, 6, 8].map((n, i) => ({ week_number: n, average_weight_kg: 90 - 0.8 * i, adherence_percent: 90, planned_target_kcal: 2000 }));
  const r = estimateAdaptiveTdee({ weeks, formula_tdee_kcal: 2500, current_target_kcal: 2000, primary_goal: 'FAT_LOSS' });
  assert.equal(r.ready, true);
  assert.equal(r.weeks_used, 4);
});
