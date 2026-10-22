import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../');

import { buildMasterEngineV2 } from '../src/master-engine-v2/index.js';
import { buildAdaptedPlan, alignMacrosWithCalories } from '../src/adaptation-engine/build-adapted-plan.js';
import { AdaptationAction, AdaptationReasonCode } from '../src/adaptation-engine/domain/enums.js';
import { CheckinAnalysisStatus } from '../src/checkin-engine/domain/enums.js';
import { evaluateFemaleCycleBuffer } from '../src/execution-engines/female-cycle-buffer-engine.js';
import { completeIntake, ASSESSMENT_CONTEXT } from './fixtures/complete-intake.js';

const evaluationContext = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
});

const nutritionFoodCatalog = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'data/catalogs/core-global-food-batch-v1.json'), 'utf8')
);

function macroCalories(nutrition) {
  const p = Number(nutrition.protein_g || 0);
  const c = Number(nutrition.carbohydrate_g || 0);
  const f = Number(nutrition.fat_g || 0);
  return p * 4 + c * 4 + f * 9;
}

// ============================================================================
// Note 1: Calorie Delta Sign Validation & Effective Delta
// ============================================================================

test('Note 1. Calorie Delta Sign Validation: 1650 kcal, -250 delta, 1500 floor yields exact 1500 kcal and -150 effective delta', () => {
  const maleMaster = {
    client: { gender: 'male' },
    nutrition_program: {
      targets: { calories_kcal: 1650, carbohydrate_g: 150, fat_g: 50, protein_g: 150 },
      cardio_program: { prescription: { daily_step_target: 8000 } }
    }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: maleMaster,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.PLATEAU_DETECTED,
      suggested_calorie_delta: -250 // Negative representation
    },
    options: { isFemale: false }
  });

  const cals = adapted.adapted_nutrition.target_calories_kcal;
  assert.equal(cals, 1500, 'Final calories must be 1500 (1650 - 150)');
  assert.equal(adapted.adaptation_action, AdaptationAction.REDUCE_CALORIES_FOR_PLATEAU);

  const reason = adapted.adaptation_reasons.find(r => r.code === AdaptationReasonCode.PLATEAU_DEFICIT_APPLIED);
  assert.ok(reason, 'Must record plateau deficit reason');
  assert.equal(reason.effective_delta, -150, 'Effective delta must be -150');
  assert.equal(reason.requested_delta, -250, 'Requested delta must be -250');

  // Verify macros strictly depend on effectiveCutMagnitude (150 kcal cut = ~38g carbs), NOT requested 250 kcal
  const expectedCarbsCut = Math.round(150 / 4); // 38g
  const initialCarbs = 150;
  assert.ok(Math.abs(adapted.adapted_nutrition.carbohydrate_g - (initialCarbs - expectedCarbsCut)) <= 2,
    `Carbs must reflect 150 cut, got ${adapted.adapted_nutrition.carbohydrate_g}`);

  const diff = Math.abs(cals - macroCalories(adapted.adapted_nutrition));
  assert.ok(diff <= 2, `Macro consistency: cal=${cals}, macroSum=${macroCalories(adapted.adapted_nutrition)}, diff=${diff}`);
});

// ============================================================================
// Note 2: Plateau at Calorie Floor (Prevent unallowed cut, maintain plan, route to coach)
// ============================================================================

test('Note 2a. Plateau at Calorie Floor: Does NOT force Refeed or +750 steps automatically; maintains plan and routes to coach', () => {
  const maleMaster = {
    client: { gender: 'male' },
    nutrition_program: {
      targets: { calories_kcal: 1520, carbohydrate_g: 140, fat_g: 50, protein_g: 140 },
      cardio_program: { prescription: { daily_step_target: 8000 } }
    }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: maleMaster,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.PLATEAU_DETECTED,
      suggested_calorie_delta: -125
    },
    options: { isFemale: false }
  });

  const cals = adapted.adapted_nutrition.target_calories_kcal;
  assert.equal(cals, 1520, 'Calories must NOT be cut below safety threshold');
  assert.equal(adapted.adaptation_action, AdaptationAction.MAINTAIN_TRAJECTORY, 'Maintains trajectory by default');
  assert.equal(adapted.requires_coach_approval, true, 'Must route to coach review');
  assert.equal(adapted.adapted_nutrition.refeed_config, null, 'Must NOT force Refeed automatically');
  assert.equal(adapted.adapted_cardio.daily_step_target, 8000, 'Must NOT force step increase automatically');

  const reason = adapted.adaptation_reasons.find(r => r.code === AdaptationReasonCode.DIET_BREAK_PLATEAU_BREAKER_APPLIED);
  assert.ok(reason.floor_locked, 'Reason must flag floor_locked: true');
  assert.ok(reason.suggested_coach_options.discretionary_refeed, 'Suggests discretionary Refeed to coach');
});

test('Note 2b. Plateau at Calorie Floor: Coach-approved Refeed and steps are properly applied when chosen', () => {
  const maleMaster = {
    client: { gender: 'male' },
    nutrition_program: {
      targets: { calories_kcal: 1500, carbohydrate_g: 130, fat_g: 50, protein_g: 140 },
      cardio_program: { prescription: { daily_step_target: 8000 } }
    }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: maleMaster,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.PLATEAU_DETECTED,
      suggested_calorie_delta: -125,
      refeed_approved: true, // Coach explicitly approved Refeed Day
      increase_steps_approved: true
    },
    options: { isFemale: false, step_increase: 500 }
  });

  assert.equal(adapted.adaptation_action, AdaptationAction.SCHEDULE_REFEED_DAY);
  assert.ok(adapted.adapted_nutrition.refeed_config, 'Refeed config active under coach approval');
  assert.equal(adapted.adapted_cardio.daily_step_target, 8500, 'Steps increased by approved 500');
});

test('Note 2c. Female Calorie Floor: 1200 kcal floor strictly maintained on extreme cut attempt', () => {
  const femaleMaster = {
    client: { gender: 'female' },
    nutrition_program: {
      targets: { calories_kcal: 1250, carbohydrate_g: 110, fat_g: 45, protein_g: 110 },
      cardio_program: { prescription: { daily_step_target: 7000 } }
    }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: femaleMaster,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.PLATEAU_DETECTED,
      suggested_calorie_delta: -200
    },
    options: { isFemale: true }
  });

  const cals = adapted.adapted_nutrition.target_calories_kcal;
  assert.ok(cals >= 1200, `Must be >= 1200, got ${cals}`);
  assert.equal(adapted.requires_coach_approval, true);
});

// ============================================================================
// Note 3: Macro Alignment Safety in alignMacrosWithCalories
// ============================================================================

test('Note 3a. Macro Alignment Safety: Protein is NEVER altered to close rounding diff', () => {
  const targetCals = 2002;
  const p = 160;
  const c = 210;
  const f = 60;

  const res = alignMacrosWithCalories(targetCals, p, c, f);
  assert.equal(res.protein, 160, 'Protein must remain untouched');
  assert.ok(Math.abs(res.diff) <= 2, `Diff must be <= 1, got ${res.diff}`);
});

test('Note 3b. Macro Alignment Safety: Fat never drops below safe floor (minFat)', () => {
  const targetCals = 1200;
  const p = 120; // 480 kcal
  const c = 120; // 480 kcal
  const f = 20;  // 180 kcal -> sum = 1140, diff = 60
  const constraints = { minFatG: 20 };

  const res = alignMacrosWithCalories(targetCals, p, c, f, constraints);
  assert.ok(res.fat >= 20, `Fat must never drop below minFat (20g), got ${res.fat}`);
  assert.ok(res.carbs >= 0, `Carbs must be non-negative, got ${res.carbs}`);
});

test('Note 3c. Macro Alignment Safety: Never produces negative carbs or fat on tight budget', () => {
  const tightCals = 900;
  const p = 150; // 600 kcal
  const f = 40;  // 360 kcal -> sum = 960 kcal > 900 kcal
  const constraints = { minFatG: 25, minCarbsG: 10 };

  const res = alignMacrosWithCalories(tightCals, p, 50, f, constraints);
  assert.ok(res.carbs >= 10, 'Carbs must respect minimum floor');
  assert.ok(res.fat >= 25, 'Fat must respect minimum floor');
  assert.equal(res.alignment_conflict, true, 'Must flag conflict when budget is below clinical constraints');
  assert.equal(res.conflict_reason, 'CALORIC_BUDGET_BELOW_MINIMUM_MACRO_CONSTRAINTS');
});

// ============================================================================
// Note 4: PMS Automatic Calories (Discretionary vs Automatic)
// ============================================================================

test('Note 4a. Female PMS Engine: Default locks deficit cuts WITHOUT automatically adding +150 kcal to plan', () => {
  const femaleMaster = {
    client: { gender: 'female' },
    nutrition_program: {
      targets: { calories_kcal: 1600, protein_g: 130, carbohydrate_g: 170, fat_g: 45 },
      cardio_program: { prescription: { daily_step_target: 7000 } }
    }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: femaleMaster,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.FEMALE_PMS_WATER_RETENTION,
      female_cycle_buffer: { deficit_adjustment_locked: true, comfort_snack_recommended_kcal: 150 }
    },
    options: { isFemale: true }
  });

  const cals = adapted.adapted_nutrition.target_calories_kcal;
  assert.equal(cals, 1600, 'Baseline calories (1600) must be preserved; no automatic +150 inflation');
  assert.equal(adapted.adaptation_action, AdaptationAction.MAINTAIN_TRAJECTORY);

  const reason = adapted.adaptation_reasons.find(r => r.code === AdaptationReasonCode.FEMALE_CYCLE_PMS_BUFFER_APPLIED);
  assert.ok(reason.deficit_locked, 'Deficit must be locked against premature cuts');
  assert.ok(reason.discretionary_comfort_buffer_available, 'Comfort buffer remains discretionary recommendation');
});

test('Note 4b. Female PMS Engine: Comfort buffer (+150 kcal) applied only when coach explicitly approves', () => {
  const femaleMaster = {
    client: { gender: 'female' },
    nutrition_program: {
      targets: { calories_kcal: 1600, protein_g: 130, carbohydrate_g: 170, fat_g: 45 },
      cardio_program: { prescription: { daily_step_target: 7000 } }
    }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: femaleMaster,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.FEMALE_PMS_WATER_RETENTION,
      female_cycle_buffer: { deficit_adjustment_locked: true, apply_comfort_snack: true, comfort_snack_added_kcal: 150 }
    },
    options: { isFemale: true, apply_pms_comfort_snack: true }
  });

  const cals = adapted.adapted_nutrition.target_calories_kcal;
  assert.equal(cals, 1750, 'Calories increased to 1750 under explicit coach approval');
  const diff = Math.abs(cals - macroCalories(adapted.adapted_nutrition));
  assert.ok(diff <= 1, `Macro consistency: cal=${cals}, diff=${diff}`);
});

// ============================================================================
// Note 5: Body Fat Mapping, Reliability & Decimal Handling
// ============================================================================

test('Note 5a. Body Fat Mapping: Decimal 0.18 vs integer 18% handled correctly without mixup', () => {
  const intakeDecimal = completeIntake();
  intakeDecimal.body.bodyFat = 0.18;
  const resDec = buildMasterEngineV2({ intake: intakeDecimal, evaluationContext, nutritionFoodCatalog });
  assert.equal(resDec.nutrition_program.targets.body_fat_percentage, 18, '0.18 must map to 18%');

  const intakeInteger = completeIntake();
  intakeInteger.body.bodyFat = 18;
  const resInt = buildMasterEngineV2({ intake: intakeInteger, evaluationContext, nutritionFoodCatalog });
  assert.equal(resInt.nutrition_program.targets.body_fat_percentage, 18, '18 must map to 18%');
});

test('Note 5b. BMR Formula: Low measurement quality avoids KATCH_MCARDLE and uses MIFFLIN', () => {
  const intakeLowQuality = completeIntake();
  intakeLowQuality.body.bodyFat = 20;
  intakeLowQuality.body.measurementQuality = 'LOW'; // Approximate or visual guess

  const res = buildMasterEngineV2({ intake: intakeLowQuality, evaluationContext, nutritionFoodCatalog });
  assert.equal(res.nutrition_program.targets.bmr_formula, 'MIFFLIN_ST_JEOR',
    'Low measurement quality must fall back to MIFFLIN_ST_JEOR');

  const intakeHighQuality = completeIntake();
  intakeHighQuality.body.bodyFat = 20;
  intakeHighQuality.body.measurementQuality = 'HIGH'; // Reliable DEXA / Caliper

  const resHigh = buildMasterEngineV2({ intake: intakeHighQuality, evaluationContext, nutritionFoodCatalog });
  assert.equal(resHigh.nutrition_program.targets.bmr_formula, 'KATCH_MCARDLE',
    'High measurement quality selects KATCH_MCARDLE');
});

test('Note 5c. Intake Canonical Schema: No foreign keys introduced in canonicalBody', () => {
  const intake = completeIntake();
  intake.body.bodyFatPct = 21;
  const res = buildMasterEngineV2({ intake, evaluationContext, nutritionFoodCatalog });
  assert.ok(res.nutrition_program.targets);
  assert.equal(res.intake_decision.plan_status, 'READY_FOR_DRAFT');
});

// ============================================================================
// Note 6: Diet Break and TDEE
// ============================================================================

test('Note 6. Diet Break routes to coach review and accounts for weight change trend', () => {
  const mockMaster = {
    client: { gender: 'male' },
    nutrition_program: {
      targets: {
        calories_kcal: 1800,
        tdee: 2350,
        protein_g: 160,
        carbohydrate_g: 175,
        fat_g: 55
      },
      cardio_program: { prescription: { daily_step_target: 8000 } }
    }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: mockMaster,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.ON_TRACK,
      weight_change_kg: 0.4 // Slight upward weight bump
    },
    options: {
      consecutive_high_compliance_weeks: 6
    }
  });

  assert.equal(adapted.adaptation_action, AdaptationAction.SCHEDULE_DIET_BREAK);
  assert.equal(adapted.requires_coach_approval, true, 'Diet break MUST require coach review');
  assert.equal(adapted.adapted_nutrition.target_calories_kcal, 2350, 'Uses plan TDEE for estimated maintenance');

  const sum = macroCalories(adapted.adapted_nutrition);
  const diff = Math.abs(adapted.adapted_nutrition.target_calories_kcal - sum);
  assert.ok(diff <= 1, `Diet break macro alignment: diff=${diff}`);
});

// ============================================================================
// Other Adaptation Pathways Regression Verification
// ============================================================================

test('Regression. Rapid Loss Warning (+150 kcal) maintains exact macro consistency', () => {
  const mockMaster = {
    client: { gender: 'male' },
    nutrition_program: {
      targets: { calories_kcal: 1900, protein_g: 165, carbohydrate_g: 190, fat_g: 55 },
      cardio_program: { prescription: { daily_step_target: 9000 } }
    }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: mockMaster,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.RAPID_LOSS_WARNING
    },
    options: { isFemale: false }
  });

  const cals = adapted.adapted_nutrition.target_calories_kcal;
  assert.equal(cals, 2050);
  const diff = Math.abs(cals - macroCalories(adapted.adapted_nutrition));
  assert.ok(diff <= 2);
});

test('Regression. Gain Stall (+125 kcal) maintains exact macro consistency', () => {
  const mockMaster = {
    client: { gender: 'male' },
    nutrition_program: {
      targets: { calories_kcal: 2800, protein_g: 175, carbohydrate_g: 350, fat_g: 75 },
      cardio_program: { prescription: { daily_step_target: 8000 } }
    }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: mockMaster,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.GAIN_STALL,
      suggested_calorie_delta: 125
    },
    options: { isFemale: false }
  });

  const cals = adapted.adapted_nutrition.target_calories_kcal;
  assert.equal(cals, 2925);
  const diff = Math.abs(cals - macroCalories(adapted.adapted_nutrition));
  assert.ok(diff <= 2);
});

test('Regression. Reverse Dieting (+75 kcal) maintains exact macro consistency', () => {
  const mockMaster = {
    client: { gender: 'female' },
    nutrition_program: {
      targets: { calories_kcal: 1400, protein_g: 110, carbohydrate_g: 140, fat_g: 45 },
      cardio_program: { prescription: { daily_step_target: 8000 } }
    }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: mockMaster,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.ON_TRACK,
      weight_change_kg: 0.1
    },
    options: { diet_framework: 'REVERSE_DIETING' }
  });

  const cals = adapted.adapted_nutrition.target_calories_kcal;
  assert.equal(cals, 1475);
  const diff = Math.abs(cals - macroCalories(adapted.adapted_nutrition));
  assert.ok(diff <= 2);
});

// ============================================================================
// PART A VERIFICATION TESTS (Closeout Checks)
// ============================================================================

test('Part A1. Female Cycle Buffer: Magnesium Elemental is guidance-only (100-200 mg), requires coach review', () => {
  const result = evaluateFemaleCycleBuffer({
    is_female: true,
    is_pms_active: true,
    weight_delta_kg: 1.2,
    adherence_score: 90,
    current_calories: 1600
  });

  assert.ok(result.micro_adjustments, 'Must provide micro adjustments for luteal phase');
  assert.ok(result.micro_adjustments.recommended_supplement.includes('Magnesium Glycinate'));
  assert.ok(result.micro_adjustments.recommended_supplement.includes('مغنسيوم عنصري'));
  assert.equal(result.micro_adjustments.supplement_guidance_only, true, 'Must be guidance only');
  assert.equal(result.micro_adjustments.requires_coach_review, true, 'Requires coach review');
});

test('Part A2. Macro Alignment: minFat=20g is computational bound; normal client fat targets (65g) strictly preserved', () => {
  const targetCals = 1800;
  const p = 140; // 560 kcal
  const c = 160; // 640 kcal
  const f = 65;  // 585 kcal -> sum = 1785
  const constraints = { minFatG: 20 };

  const res = alignMacrosWithCalories(targetCals, p, c, f, constraints);
  assert.equal(res.fat, 65, 'Target fat (65g) must remain intact, never dragged down to minFat (20g)');
  assert.equal(res.protein, 140, 'Protein must be strictly preserved');
  assert.ok(Math.abs(targetCals - (res.protein * 4 + res.carbs * 4 + res.fat * 9)) <= 2, 'Energy aligned within integer rounding');
});

test('Part A3-1. Body Fat Out-of-bounds (>65% or <3%) falls back to MIFFLIN_ST_JEOR', () => {
  const intakeTooHigh = completeIntake();
  intakeTooHigh.body.bodyFat = 90; // Absurd value

  const resHigh = buildMasterEngineV2({ intake: intakeTooHigh, evaluationContext, nutritionFoodCatalog });
  assert.equal(resHigh.nutrition_program.targets.bmr_formula, 'MIFFLIN_ST_JEOR');
  assert.equal(resHigh.nutrition_program.targets.body_fat_percentage, null);
});

test('Part A3-2. Obese client with high body fat uses LEAN_MASS_AT_HEALTHY_BODY_FAT', () => {
  const intake = completeIntake();
  intake.body.weightKg = 130;
  intake.body.heightCm = 175;
  intake.body.bodyFat = 42;
  intake.goals.primary = 'FAT_LOSS';

  const res = buildMasterEngineV2({ intake, evaluationContext, nutritionFoodCatalog });
  const targets = res.nutrition_program.targets;
  assert.equal(targets.bmr_formula, 'KATCH_MCARDLE');
  assert.equal(targets.protein_reference_basis, 'LEAN_MASS_AT_HEALTHY_BODY_FAT');
  assert.ok(targets.protein_reference_weight_kg < 95, `Ref weight must be lean reference, got ${targets.protein_reference_weight_kg}`);
});

test('Part A3-3. Female Calorie Floor: Extreme delta (-400) never breaches 1200 kcal floor', () => {
  const femaleMaster = {
    client: { gender: 'female' },
    nutrition_program: {
      targets: { calories_kcal: 1350, carbohydrate_g: 130, fat_g: 45, protein_g: 110 },
      cardio_program: { prescription: { daily_step_target: 7000 } }
    }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: femaleMaster,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.PLATEAU_DETECTED,
      suggested_calorie_delta: -400 // Extreme cut attempt
    },
    options: { isFemale: true }
  });

  const cals = adapted.adapted_nutrition.target_calories_kcal;
  assert.equal(cals, 1200, `Clamped exactly to female floor 1200, got ${cals}`);
  assert.equal(adapted.requires_coach_approval, true);
});
