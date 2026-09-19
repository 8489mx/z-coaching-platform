import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { adaptIntakePayloadToCanonicalEngine } from '../src/intake-decision-engine/adapters/intake-adapter.js';
import { buildMasterEngineV2 } from '../src/master-engine-v2/index.js';

// Payload shape sent by frontend/src/pages/FullIntakeForm.jsx (answers object).
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/catalogs/core-global-food-batch-v1.json'), 'utf8'));
const ctx = Object.freeze({ system_time: '2026-09-19T08:00:00.000Z', assessmentDate: '2026-09-19' });

function formAnswers(selected = [], overrides = {}) {
  return {
    gender: 'male', age: '32', height_cm: '178', weight_kg: '92',
    circumferences: { neck_cm: '40', waist_cm: '98', hips_cm: '', chest_cm: '', arm_cm: '', thigh_cm: '' },
    primary_goal: 'fat_loss', neat_level: 'moderate', occupation_type: 'DESK_OFFICE',
    dangerous_symptoms: ['NONE'],
    medical_conditions: {
      has_conditions: selected.length > 0,
      selected,
      // The form pre-fills these sub-objects for every client, selected or not.
      bariatric: { is_operated: false, meal_capacity_grams: '150_200', dumping_syndrome: false },
      diabetes: { type: 'type2', uses_insulin: false, icr_ratio: '', hba1c: '' },
      favism_g6pd: false, renal_hepatic_issue: false, thyroid: 'hypo', gi_issues: [],
      female_cases: { is_pcos: false, is_lactating: false, is_postpartum: false },
      hypertension: false, gout: false, cholecystectomy: false, other_notes: '',
    },
    injuries_map: { has_injuries: false, selected_areas: [] },
    meal_structure: { meals_count: '3_meals_snack', intermittent_fasting: 'none' },
    sleep_schedule: { pattern: 'regular_night', average_hours: '7_8', bedtime_hour: '23:00' },
    training_environment: 'commercial_gym',
    training_logistics: { days_per_week: 4, experience_level: 'intermediate', has_other_sports: false },
    ...overrides,
  };
}

const codes = (answers) => adaptIntakePayloadToCanonicalEngine(structuredClone(answers)).medical.conditions.map((c) => c.conditionCode);
const build = (answers) => buildMasterEngineV2({ intake: answers, evaluationContext: ctx, nutritionFoodCatalog: catalog, options: {} });
const plannedFoodCodes = (program) => program.nutrition_program.culinary_meals
  .flatMap((m) => m.items.flatMap((it) => [it.food_code, ...(it.swaps || []).map((s) => s.food_code || s.code || s.id)]));

test('a client who selected no condition is not tagged diabetic by the pre-filled diabetes.type', () => {
  assert.deepEqual(codes(formAnswers()), []);
  const program = build(formAnswers());
  assert.equal(program.nutrition_program.targets.clinical_guardrails.hypoglycemia_guard_active, false);
});

test('selecting diabetes still activates the hypoglycemia guard', () => {
  assert.deepEqual(codes(formAnswers(['diabetes'])), ['DIABETES']);
  assert.equal(build(formAnswers(['diabetes'])).nutrition_program.targets.clinical_guardrails.hypoglycemia_guard_active, true);
});

test('renal from the form caps protein at the KDOQI ceiling and forces medical review', () => {
  assert.deepEqual(codes(formAnswers(['renal'])), ['KIDNEY_CONDITION']);
  const program = build(formAnswers(['renal']));
  const targets = program.nutrition_program.targets;
  assert.equal(targets.clinical_guardrails.kidney_protein_capped, true);
  assert.equal(targets.protein_per_kg, 0.8);
  assert.equal(program.intake_decision.plan_status, 'MEDICAL_REVIEW_REQUIRED');
});

test('hepatic from the form forces medical review without a protein cap', () => {
  assert.deepEqual(codes(formAnswers(['hepatic'])), ['LIVER_CONDITION']);
  const program = build(formAnswers(['hepatic']));
  const targets = program.nutrition_program.targets;
  assert.equal(targets.clinical_guardrails.kidney_protein_capped, false);
  assert.equal(targets.protein_per_kg, 2.2);
  assert.equal(targets.clinical_guardrails.liver_review_required, true);
  assert.ok(targets.clinical_guardrails.liver_guidance_ar);
  assert.equal(program.intake_decision.plan_status, 'MEDICAL_REVIEW_REQUIRED');
});

test('legacy renal_hepatic intakes keep the safer kidney reading', () => {
  assert.deepEqual(codes(formAnswers(['renal_hepatic'])), ['KIDNEY_CONDITION']);
});

test('gi_tract from the form reaches the engine and selects the Low-FODMAP framework', () => {
  assert.deepEqual(codes(formAnswers(['gi_tract'])), ['DIAGNOSED_DIGESTIVE_CONDITION']);
  assert.equal(build(formAnswers(['gi_tract'])).nutrition_program.targets.diet_framework, 'LOW_FODMAP');
});

for (const key of ['favism_g6pd', 'gout']) {
  test(`${key} from the form removes legumes from meals and swaps`, () => {
    const legumes = plannedFoodCodes(build(formAnswers([key]))).filter((c) => /FAVA|FUL|BEAN|LENTIL|CHICKPEA|LEGUM/i.test(String(c)));
    assert.deepEqual(legumes, []);
  });
}

test('neck and waist from the form feed the US Navy body-fat estimate (Katch-McArdle BMR)', () => {
  const targets = build(formAnswers()).nutrition_program.targets;
  assert.equal(targets.bmr_formula, 'KATCH_MCARDLE');
  const noNeck = formAnswers([], { circumferences: { neck_cm: '', waist_cm: '98' } });
  assert.equal(build(noNeck).nutrition_program.targets.bmr_formula, 'MIFFLIN_ST_JEOR');
});

test('recomposition from the form uses a 10% deficit, fat loss keeps 20%', () => {
  const recomp = build(formAnswers([], { primary_goal: 'recomposition' })).nutrition_program.targets;
  const cut = build(formAnswers([], { primary_goal: 'fat_loss' })).nutrition_program.targets;
  assert.equal(recomp.tdee, cut.tdee);
  assert.equal(recomp.target_calories, Math.round(recomp.tdee * 0.9));
  assert.equal(cut.target_calories, Math.round(cut.tdee * 0.8));
});

test('every form option for goal, environment, meals and sport is accepted on submit (no 400)', () => {
  const cases = [
    { primary_goal: 'general_fitness' }, { primary_goal: 'lean_bulk' }, { training_environment: 'home_gym' },
    { meal_structure: { meals_count: '4_to_5_meals', intermittent_fasting: 'none' } },
    ...['football_padel', 'swimming', 'running_cardio', 'martial_arts', 'crossfit'].map((sport) => ({
      training_logistics: { days_per_week: 4, experience_level: 'intermediate', has_other_sports: true, sports_name: sport, hours_per_week: '5' },
    })),
  ];
  for (const overrides of cases) {
    const answers = formAnswers([], overrides);
    assert.doesNotThrow(() => adaptIntakePayloadToCanonicalEngine({ answers: structuredClone(answers) }), JSON.stringify(overrides));
    assert.ok(build(answers).training_program.total_weeks > 0, JSON.stringify(overrides));
  }
});

test('injury pain that does not settle with rest is a red flag for medical review', () => {
  const injured = (pain_relieved_by_rest) => formAnswers([], { injuries_map: { has_injuries: true, selected_areas: ['knee'], injury_nature: 'chronic', pain_relieved_by_rest } });
  assert.equal(build(injured(true)).intake_decision.plan_status, 'COACH_REVIEW_REQUIRED');
  assert.equal(build(injured(false)).intake_decision.plan_status, 'MEDICAL_REVIEW_REQUIRED');
});

test('post-bariatric clients get at least 5 small meals and never an auto fasting protocol', () => {
  const answers = formAnswers(['bariatric_surgery'], { meal_structure: { meals_count: '3_meals', intermittent_fasting: '16_8' } });
  const targets = build(answers).nutrition_program.targets;
  assert.ok(targets.meals_count >= 5);
  assert.notEqual(targets.diet_framework, 'INTERMITTENT_FASTING');
});
