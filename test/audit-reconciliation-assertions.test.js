import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../');

import { buildMasterEngineV2 } from '../src/master-engine-v2/index.js';
import { evaluateIntake } from '../src/intake-decision-engine/index.js';
import { adaptIntakePayloadToCanonicalEngine } from '../src/intake-decision-engine/adapters/intake-adapter.js';
import { evaluateCheckin } from '../src/checkin-engine/evaluate-checkin.js';
import { CheckinAnalysisStatus } from '../src/checkin-engine/domain/enums.js';
import { buildAdaptedPlan } from '../src/adaptation-engine/build-adapted-plan.js';
import { evaluateFemaleCycleBuffer } from '../src/execution-engines/female-cycle-buffer-engine.js';
import { evaluateInsulinSafety } from '../src/execution-engines/drug-interaction-firewall.js';
import { evaluateClinicalSupplementSafety } from '../src/execution-engines/clinical-supplement-safety-engine.js';
import { completeIntake, ASSESSMENT_CONTEXT } from './fixtures/complete-intake.js';

const evaluationContext = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
});

const nutritionFoodCatalog = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'data/catalogs/core-global-food-batch-v1.json'), 'utf8')
);

test('1. Obese Client Protein Reference Basis: Uses Adjusted Body Weight, NOT Total Weight', () => {
  const intake = completeIntake();
  intake.body.weightKg = 132;
  intake.body.heightCm = 174;
  intake.body.bodyFat = 42; // Correct field name
  intake.goals.primary = 'FAT_LOSS';

  const res = buildMasterEngineV2({ intake, evaluationContext, nutritionFoodCatalog });
  const targets = res.nutrition_program.targets;

  assert.equal(targets.protein_reference_basis, 'LEAN_MASS_AT_HEALTHY_BODY_FAT');
  assert.ok(targets.protein_reference_weight_kg < 95, `Expected ref weight < 95kg, got ${targets.protein_reference_weight_kg}`);
  assert.ok(targets.protein_g < 210, `Expected protein < 210g, got ${targets.protein_g}`);
  assert.ok(targets.protein_g > 160, `Expected protein > 160g, got ${targets.protein_g}`);
});

test('2. Body Fat Input Mapping: bodyFat triggers KATCH_MCARDLE, absent triggers MIFFLIN', () => {
  const intakeWithFat = completeIntake();
  intakeWithFat.body.bodyFat = 20;
  const resWithFat = buildMasterEngineV2({ intake: intakeWithFat, evaluationContext, nutritionFoodCatalog });
  assert.equal(resWithFat.nutrition_program.targets.bmr_formula, 'KATCH_MCARDLE');

  const intakeWithFatPct = completeIntake();
  delete intakeWithFatPct.body.bodyFat;
  delete intakeWithFatPct.body.body_fat;
  intakeWithFatPct.body.bodyFatPct = 22;
  const resWithFatPct = buildMasterEngineV2({ intake: intakeWithFatPct, evaluationContext, nutritionFoodCatalog });
  assert.equal(resWithFatPct.nutrition_program.targets.bmr_formula, 'KATCH_MCARDLE');

  const intakeNoFat = completeIntake();
  delete intakeNoFat.body.bodyFat;
  delete intakeNoFat.body.body_fat;
  delete intakeNoFat.body.bodyFatPct;
  const resNoFat = buildMasterEngineV2({ intake: intakeNoFat, evaluationContext, nutritionFoodCatalog });
  assert.equal(resNoFat.nutrition_program.targets.bmr_formula, 'MIFFLIN_ST_JEOR');
});

test('3. Diabetes Carbohydrate Protection: Individualized without rigid 45% cap, Hypoglycemia Guard Active', () => {
  const intake = completeIntake();
  intake.medical.hasDiabetes = true;
  intake.medical.conditions = ['TYPE_2_DIABETES'];
  const res = buildMasterEngineV2({ intake, evaluationContext, nutritionFoodCatalog });

  assert.equal(res.nutrition_program.targets.clinical_guardrails.diabetic_carb_cap_applied, false);
  assert.equal(res.nutrition_program.targets.clinical_guardrails.hypoglycemia_guard_active, true);
  assert.ok(res.nutrition_program.hypoglycemia_guard.active);
});

test('4. Differentiated 5-Week Deload: Advanced has Regenerative Deload (60% sets, RIR 4), Beginner consolidates unless planned', () => {
  const advIntake = completeIntake();
  advIntake.training.experience = 'ADVANCED';
  const advRes = buildMasterEngineV2({ intake: advIntake, evaluationContext, nutritionFoodCatalog });
  const advWeeks = advRes.training_program.weeks;

  assert.equal(advRes.training_program.total_weeks, 5);
  assert.equal(advWeeks[0].target_rir, 2);
  assert.equal(advWeeks[1].target_rir, 1);
  assert.equal(advWeeks[4].target_rir, 4);
  assert.equal(advWeeks[4].phase, 'DELOAD');

  const advW4Sets = advWeeks[3].sessions[0].exercises[0].sets;
  const advW5Sets = advWeeks[4].sessions[0].exercises[0].sets;
  assert.ok(advW5Sets < advW4Sets, 'Deload sets must drop from peak volume');
  assert.equal(advW5Sets, 2);

  // Beginner with normal progress consolidates in week 5 without forced deload
  const begIntake = completeIntake();
  begIntake.training.experience = 'BEGINNER';
  const begRes = buildMasterEngineV2({ intake: begIntake, evaluationContext, nutritionFoodCatalog });
  assert.equal(begRes.training_program.weeks[4].phase, 'CONSOLIDATION');
  assert.equal(begRes.training_program.weeks[4].target_rir, 2);
});

test('5. Check-in Time-Series: 3kg/week Rapid Loss Triggers RAPID_LOSS_WARNING and +150 kcal', () => {
  const res = evaluateCheckin({
    previous_weight_kg: 85,
    current_weight_kg: 82,
    adherence_score: 95
  });
  assert.equal(res.analysis_status, CheckinAnalysisStatus.RAPID_LOSS_WARNING);
  assert.equal(res.suggested_calorie_delta, 150);
});

test('6. Check-in Time-Series: 4-Week Plateau Triggers PLATEAU_DETECTED and -125 kcal', () => {
  const res = evaluateCheckin({
    previous_weight_kg: 92,
    current_weight_kg: 92,
    weight_history: [92, 92, 92, 92],
    adherence_score: 95
  });
  assert.equal(res.analysis_status, CheckinAnalysisStatus.PLATEAU_DETECTED);
  assert.equal(res.suggested_calorie_delta, -125);
});

test('7. Boundary Protection in build-adapted-plan: Caloric Floor Guard Prevents Breach on Large Delta', () => {
  const maleFloor = 1500;
  const mockMaster = {
    client: { gender: 'male' },
    nutrition_program: {
      targets: { calories_kcal: 1650, carbohydrate_g: 150, fat_g: 50, protein_g: 150 },
      cardio_program: { prescription: { daily_step_target: 8000 } }
    }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: mockMaster,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.PLATEAU_DETECTED,
      suggested_calorie_delta: -250 // Large delta
    },
    options: { isFemale: false }
  });

  const adaptedCalories = adapted.adapted_nutrition.target_calories_kcal;
  assert.ok(adaptedCalories >= maleFloor, `Calorie floor enforced: adapted_calories ${adaptedCalories} >= floor ${maleFloor}`);
  assert.equal(adaptedCalories, maleFloor, `Clamped exactly to floor ${maleFloor}`);
  const macrosSum = adapted.adapted_nutrition.protein_g * 4 + adapted.adapted_nutrition.carbohydrate_g * 4 + adapted.adapted_nutrition.fat_g * 9;
  assert.ok(Math.abs(adaptedCalories - macrosSum) <= 2, `Exact macro alignment: cal=${adaptedCalories}, sum=${macrosSum}`);
});

test('8. Warfarin Contraindication in Supplement Safety Engine', () => {
  const result = evaluateClinicalSupplementSafety({
    supplements: ['OMEGA_3', 'VITAMIN_D3_K2'],
    activeMedications: ['WARFARIN'],
    medicalConditions: []
  });

  const omega3 = result.evaluations.find(s => s.supplement_code === 'HIGH_DOSE_OMEGA3');
  const d3k2 = result.evaluations.find(s => s.supplement_code === 'VITAMIN_D3_K2');

  assert.ok(omega3, 'Expected OMEGA_3 to be evaluated');
  assert.equal(omega3.safety_status, 'CONTRAINDICATED');
  assert.ok(d3k2, 'Expected VITAMIN_D3_K2 to be evaluated');
  assert.equal(d3k2.safety_status, 'CONTRAINDICATED');
  assert.equal(result.overall_status, 'CONTRAINDICATED');
});

test('9. Insulin Safety Engine Enforces 130g Floor and Lockout on Keto', () => {
  const insulinSafety = evaluateInsulinSafety(['LANTUS', 'HUMALOG']);
  assert.equal(insulinSafety.requires_insulin_protocol, true);
  assert.equal(insulinSafety.carb_floor_grams, 130);
  assert.equal(insulinSafety.lock_keto, true);
  assert.ok(insulinSafety.safety_cues_ar.length >= 3);
});

test('10. Lactation Nutrition Extra Protein is Maintained', () => {
  const intake = completeIntake();
  intake.personal.sex = 'FEMALE';
  intake.medical.isLactating = true;
  intake.medical.conditions = ['LACTATION'];
  const res = buildMasterEngineV2({ intake, evaluationContext, nutritionFoodCatalog });
  assert.ok(res.nutrition_program.targets.protein_g >= 140);
});
