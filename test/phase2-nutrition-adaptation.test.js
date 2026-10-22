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

// Helper to compute macro calories
function macroCalories(nutrition) {
  const p = Number(nutrition.protein_g || 0);
  const c = Number(nutrition.carbohydrate_g || 0);
  const f = Number(nutrition.fat_g || 0);
  return p * 4 + c * 4 + f * 9;
}

// ============================================================================
// P1-A: Calorie Floor Enforcement & Plateau Adaptation
// ============================================================================

test('P1-A1. Male Calorie Floor: Large delta (-250) clamps to exact 1500 kcal floor', () => {
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
      suggested_calorie_delta: -250
    },
    options: { isFemale: false }
  });

  const cals = adapted.adapted_nutrition.target_calories_kcal;
  assert.equal(cals, 1500, 'Male calories must clamp exactly to 1500 kcal floor');
  assert.equal(adapted.adaptation_action, AdaptationAction.REDUCE_CALORIES_FOR_PLATEAU);
  const diff = Math.abs(cals - macroCalories(adapted.adapted_nutrition));
  assert.ok(diff <= 1, `Macro consistency: cal=${cals}, macroSum=${macroCalories(adapted.adapted_nutrition)}, diff=${diff}`);
});

test('P1-A2. Male Calorie Floor: Close to floor (<75 kcal available) switches to Refeed Day without cutting', () => {
  const maleMaster = {
    client: { gender: 'male' },
    nutrition_program: {
      targets: { calories_kcal: 1540, carbohydrate_g: 140, fat_g: 50, protein_g: 140 },
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
  assert.equal(cals, 1540, 'Calories must NOT be cut below safety threshold when room < 75 kcal');
  assert.equal(adapted.adaptation_action, AdaptationAction.SCHEDULE_REFEED_DAY);
  assert.ok(adapted.adapted_nutrition.refeed_config, 'Refeed config must be scheduled');
  assert.equal(adapted.adapted_cardio.daily_step_target, 8750, 'Steps must increase +750 to break plateau without calorie starvation');
});

test('P1-A3. Male Calorie Floor: Already at floor (1500 kcal) switches to Refeed Day', () => {
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
      suggested_calorie_delta: -125
    },
    options: { isFemale: false }
  });

  const cals = adapted.adapted_nutrition.target_calories_kcal;
  assert.equal(cals, 1500, 'Trainee at floor must remain at 1500 kcal');
  assert.equal(adapted.adaptation_action, AdaptationAction.SCHEDULE_REFEED_DAY);
  assert.ok(adapted.adapted_nutrition.refeed_config);
});

test('P1-A4. Female Calorie Floor: Large delta (-250) clamps to exact 1200 kcal floor', () => {
  const femaleMaster = {
    client: { gender: 'female' },
    nutrition_program: {
      targets: { calories_kcal: 1380, carbohydrate_g: 120, fat_g: 45, protein_g: 120 },
      cardio_program: { prescription: { daily_step_target: 7000 } }
    }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: femaleMaster,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.PLATEAU_DETECTED,
      suggested_calorie_delta: -250
    },
    options: { isFemale: true }
  });

  const cals = adapted.adapted_nutrition.target_calories_kcal;
  assert.equal(cals, 1200, 'Female calories must clamp to 1200 kcal floor');
  assert.equal(adapted.adaptation_action, AdaptationAction.REDUCE_CALORIES_FOR_PLATEAU);
  const diff = Math.abs(cals - macroCalories(adapted.adapted_nutrition));
  assert.ok(diff <= 1, `Macro consistency: cal=${cals}, diff=${diff}`);
});

test('P1-A5. Female Calorie Floor: Extreme delta (-400) never breaches 1200 kcal floor', () => {
  const femaleMaster = {
    client: { gender: 'female' },
    nutrition_program: {
      targets: { calories_kcal: 1450, carbohydrate_g: 130, fat_g: 45, protein_g: 125 },
      cardio_program: { prescription: { daily_step_target: 7000 } }
    }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: femaleMaster,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.PLATEAU_DETECTED,
      suggested_calorie_delta: -400
    },
    options: { isFemale: true }
  });

  const cals = adapted.adapted_nutrition.target_calories_kcal;
  assert.ok(cals >= 1200, `Female calories must be >= 1200, got ${cals}`);
  assert.equal(cals, 1200);
});

// ============================================================================
// P1-B: Macro & Calorie Exact Consistency Across All Adaptation Pathways
// ============================================================================

test('P1-B1. Diet Break uses stored TDEE and satisfies |target - macroSum| <= 1', () => {
  const mockMaster = {
    client: { gender: 'male' },
    nutrition_program: {
      targets: {
        target_calories_kcal: 1800,
        tdee: 2320, // Measured / planned maintenance
        protein_g: 160,
        carbohydrate_g: 170,
        fat_g: 55
      },
      cardio_program: { prescription: { daily_step_target: 8000 } }
    }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: mockMaster,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.ON_TRACK,
    },
    options: {
      consecutive_high_compliance_weeks: 6 // Triggers diet break
    }
  });

  assert.equal(adapted.adaptation_action, AdaptationAction.SCHEDULE_DIET_BREAK);
  assert.equal(adapted.adapted_nutrition.target_calories_kcal, 2320, 'Diet break should use plan TDEE');
  const sum = macroCalories(adapted.adapted_nutrition);
  const diff = Math.abs(adapted.adapted_nutrition.target_calories_kcal - sum);
  assert.ok(diff <= 1, `Diet break macro alignment: cals=${adapted.adapted_nutrition.target_calories_kcal}, sum=${sum}, diff=${diff}`);
});

test('P1-B2. Reverse Dieting (+75 kcal) satisfies |target - macroSum| <= 1', () => {
  const mockMaster = {
    client: { gender: 'female' },
    nutrition_program: {
      targets: { target_calories_kcal: 1400, protein_g: 110, carbohydrate_g: 140, fat_g: 45 },
      cardio_program: { prescription: { daily_step_target: 8000 } }
    }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: mockMaster,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.ON_TRACK,
      weight_change_kg: 0.1
    },
    options: {
      diet_framework: 'REVERSE_DIETING'
    }
  });

  const cals = adapted.adapted_nutrition.target_calories_kcal;
  assert.equal(cals, 1475);
  const sum = macroCalories(adapted.adapted_nutrition);
  const diff = Math.abs(cals - sum);
  assert.ok(diff <= 1, `Reverse diet macro alignment: cals=${cals}, sum=${sum}, diff=${diff}`);
});

test('P1-B3. Female PMS Comfort Buffer (+150 kcal) satisfies |target - macroSum| <= 1', () => {
  const mockMaster = {
    client: { gender: 'female' },
    nutrition_program: {
      targets: { target_calories_kcal: 1500, protein_g: 120, carbohydrate_g: 155, fat_g: 45 },
      cardio_program: { prescription: { daily_step_target: 7500 } }
    }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: mockMaster,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.FEMALE_PMS_WATER_RETENTION,
      female_cycle_buffer: { deficit_adjustment_locked: true, comfort_snack_added_kcal: 150 }
    },
    options: { isFemale: true }
  });

  const cals = adapted.adapted_nutrition.target_calories_kcal;
  assert.equal(cals, 1650);
  const sum = macroCalories(adapted.adapted_nutrition);
  const diff = Math.abs(cals - sum);
  assert.ok(diff <= 1, `PMS buffer macro alignment: cals=${cals}, sum=${sum}, diff=${diff}`);
});

test('P1-B4. Rapid Loss Warning (+150 kcal) satisfies |target - macroSum| <= 1', () => {
  const mockMaster = {
    client: { gender: 'male' },
    nutrition_program: {
      targets: { target_calories_kcal: 1900, protein_g: 165, carbohydrate_g: 190, fat_g: 55 },
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
  const sum = macroCalories(adapted.adapted_nutrition);
  const diff = Math.abs(cals - sum);
  assert.ok(diff <= 1, `Rapid loss macro alignment: cals=${cals}, sum=${sum}, diff=${diff}`);
});

test('P1-B5. Gain Stall (+125 kcal) satisfies |target - macroSum| <= 1', () => {
  const mockMaster = {
    client: { gender: 'male' },
    nutrition_program: {
      targets: { target_calories_kcal: 2800, protein_g: 175, carbohydrate_g: 350, fat_g: 75 },
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
  const sum = macroCalories(adapted.adapted_nutrition);
  const diff = Math.abs(cals - sum);
  assert.ok(diff <= 1, `Gain stall macro alignment: cals=${cals}, sum=${sum}, diff=${diff}`);
});

test('P1-B6. Diophantine Helper alignMacrosWithCalories guarantees diff <= 1 for all integers', () => {
  for (let cals = 1200; cals <= 3500; cals += 1) {
    const p = cals < 1500 ? 100 : 150;
    const f = cals < 1500 ? 35 : 60;
    const res = alignMacrosWithCalories(cals, p, 200, f);
    assert.ok(Math.abs(res.diff) <= 1, `Failed for ${cals}: diff=${res.diff}`);
    assert.ok(res.protein === p, 'Protein must be preserved');
    assert.ok(res.carbs >= 0, 'Carbs must be non-negative');
    assert.ok(res.fat >= 15, 'Fat must be >= 15g');
  }
});

// ============================================================================
// P1-C: Body Fat Field Mapping & BMR Formula Selection
// ============================================================================

test('P1-C1. Direct bodyFatPct triggers KATCH_MCARDLE and maps body_fat_percentage', () => {
  const intake = completeIntake();
  delete intake.body.bodyFat;
  intake.body.bodyFatPct = 16;

  const res = buildMasterEngineV2({ intake, evaluationContext, nutritionFoodCatalog });
  const targets = res.nutrition_program.targets;
  assert.equal(targets.bmr_formula, 'KATCH_MCARDLE');
  assert.equal(targets.body_fat_percentage, 16);
});

test('P1-C2. Direct body_fat triggers KATCH_MCARDLE and maps body_fat_percentage', () => {
  const intake = completeIntake();
  delete intake.body.bodyFat;
  intake.body.body_fat = 22;

  const res = buildMasterEngineV2({ intake, evaluationContext, nutritionFoodCatalog });
  const targets = res.nutrition_program.targets;
  assert.equal(targets.bmr_formula, 'KATCH_MCARDLE');
  assert.equal(targets.body_fat_percentage, 22);
});

test('P1-C3. Top-level bodyFatPct (intake.bodyFatPct) is captured by engine', () => {
  const intake = completeIntake();
  delete intake.body.bodyFat;
  intake.bodyFatPct = 19;

  const res = buildMasterEngineV2({ intake, evaluationContext, nutritionFoodCatalog });
  const targets = res.nutrition_program.targets;
  assert.equal(targets.bmr_formula, 'KATCH_MCARDLE');
  assert.equal(targets.body_fat_percentage, 19);
});

test('P1-C4. Decimal fraction bodyFat (0.18) is normalized to 18%', () => {
  const intake = completeIntake();
  intake.body.bodyFat = 0.18;

  const res = buildMasterEngineV2({ intake, evaluationContext, nutritionFoodCatalog });
  const targets = res.nutrition_program.targets;
  assert.equal(targets.bmr_formula, 'KATCH_MCARDLE');
  assert.equal(targets.body_fat_percentage, 18);
});

test('P1-C5. Missing bodyFat gracefully falls back to MIFFLIN_ST_JEOR without error', () => {
  const intake = completeIntake();
  delete intake.body.bodyFat;
  delete intake.body.body_fat;
  delete intake.body.bodyFatPct;

  const res = buildMasterEngineV2({ intake, evaluationContext, nutritionFoodCatalog });
  const targets = res.nutrition_program.targets;
  assert.equal(targets.bmr_formula, 'MIFFLIN_ST_JEOR');
  assert.equal(targets.body_fat_percentage, null);
});

test('P1-C6. Out-of-bounds bodyFat (>65% or <3%) is treated as null, falling back to MIFFLIN', () => {
  const intakeTooHigh = completeIntake();
  intakeTooHigh.body.bodyFat = 95; // Impossible physiological value

  const resHigh = buildMasterEngineV2({ intake: intakeTooHigh, evaluationContext, nutritionFoodCatalog });
  assert.equal(resHigh.nutrition_program.targets.bmr_formula, 'MIFFLIN_ST_JEOR');
  assert.equal(resHigh.nutrition_program.targets.body_fat_percentage, null);

  const intakeNegative = completeIntake();
  intakeNegative.body.bodyFat = -5;

  const resNeg = buildMasterEngineV2({ intake: intakeNegative, evaluationContext, nutritionFoodCatalog });
  assert.equal(resNeg.nutrition_program.targets.bmr_formula, 'MIFFLIN_ST_JEOR');
  assert.equal(resNeg.nutrition_program.targets.body_fat_percentage, null);
});

test('P1-C7. Obese client with bodyFat=45% uses LEAN_MASS_AT_HEALTHY_BODY_FAT', () => {
  const intake = completeIntake();
  intake.body.weightKg = 125;
  intake.body.heightCm = 175;
  intake.body.bodyFat = 45;
  intake.goals.primary = 'FAT_LOSS';

  const res = buildMasterEngineV2({ intake, evaluationContext, nutritionFoodCatalog });
  const targets = res.nutrition_program.targets;
  assert.equal(targets.bmr_formula, 'KATCH_MCARDLE');
  assert.equal(targets.protein_reference_basis, 'LEAN_MASS_AT_HEALTHY_BODY_FAT');
  assert.ok(targets.protein_reference_weight_kg < 90, `Ref weight must be lean reference, got ${targets.protein_reference_weight_kg}`);
});

// ============================================================================
// P2 Auxiliary: Female Cycle Buffer & Magnesium Glycinate Precision
// ============================================================================

test('P2-Aux. Female cycle buffer standardized to 150 kcal with elemental magnesium note', () => {
  const res = evaluateFemaleCycleBuffer({
    is_female: true,
    is_pms_active: true,
    weight_delta_kg: 1.0,
    adherence_score: 90,
    current_calories: 1600
  });

  assert.equal(res.comfort_snack_added_kcal, 150, 'Standardized to 150 kcal comfort buffer');
  assert.equal(res.adjusted_calories_with_comfort_snack, 1750);
  assert.ok(res.micro_adjustments.recommended_supplement.includes('مغنسيوم عنصري'), 'Must specify elemental magnesium');
});
