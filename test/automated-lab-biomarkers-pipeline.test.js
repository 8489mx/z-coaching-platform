import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  analyzeBloodworkBiomarkers
} from '../src/execution-engines/biomarker-engine.js';
import {
  buildMasterEngineV2,
  calculateUniversalNutritionTargets
} from '../src/master-engine-v2/index.js';
import {
  buildAdaptedPlan
} from '../src/adaptation-engine/index.js';
import {
  CheckinAnalysisStatus
} from '../src/checkin-engine/index.js';
import { completeIntake, ASSESSMENT_CONTEXT } from './fixtures/complete-intake.js';

const evaluationContext = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
});

const nutritionFoodCatalog = JSON.parse(
  fs.readFileSync(new URL('../data/catalogs/core-global-food-batch-v1.json', import.meta.url), 'utf8')
);

function buildTestProgramWithBiomarkers(biomarkers = {}) {
  const intake = completeIntake();
  const modifiedIntake = {
    ...intake,
    medical: {
      ...intake.medical,
      biomarkers
    }
  };
  return buildMasterEngineV2({
    intake: modifiedIntake,
    evaluationContext,
    nutritionFoodCatalog,
  });
}

test('Milestone 4: Automated Lab Biomarkers Pipeline Suite', async (suite) => {

  await suite.test('1. Renal Safety Pipeline: Caps protein at 1.1 g/kg and withholds creatine upon eGFR < 60', () => {
    const program = buildTestProgramWithBiomarkers({
      egfr_ml_min: 52,
      creatinine_mg_dl: 1.55
    });

    assert.equal(program.nutrition_program.targets.clinical_guardrails.kidney_protein_capped, true);
    assert.equal(program.nutrition_program.targets.clinical_guardrails.max_protein_per_kg, 1.1);
    assert.equal(program.nutrition_program.targets.clinical_guardrails.withhold_creatine, true);
    
    // Client weight is 82kg -> 82 * 1.1 = 90g protein
    assert.equal(program.nutrition_program.macro_targets.protein_g, 90);
    assert.ok(program.clinical_safety_shield);
    assert.equal(program.clinical_safety_shield.has_biomarker_flags, true);
    assert.ok(program.clinical_safety_shield.flags.some(f => f.biomarker === 'RENAL_FUNCTION'));
  });

  await suite.test('2. Uric Acid & Gout Shield: Activates purine restriction, 4.0L hydration, and Tart Cherry', () => {
    const program = buildTestProgramWithBiomarkers({
      uric_acid_mg_dl: 8.4
    });

    const guardrails = program.nutrition_program.targets.clinical_guardrails;
    assert.equal(guardrails.purine_restriction, true);
    assert.equal(guardrails.biomarker_guard_active, true);
    assert.equal(program.nutrition_program.targets.water_liters, 4.0);

    const shield = program.clinical_safety_shield;
    assert.ok(shield.flags.some(f => f.biomarker === 'URIC_ACID_HYPERURICEMIA'));
    assert.ok(shield.supplement_recommendations.some(s => s.supplement.includes('Tart Cherry')));
    assert.ok(shield.whole_food_interventions.some(w => w.food_title_ar.includes('استبدال اللحوم')));
  });

  await suite.test('3. Glycemic & HbA1c Pipeline: Enforces >= 35g fiber, complex carbs, and hypoglycemia guard', () => {
    const program = buildTestProgramWithBiomarkers({
      hba1c_percent: 6.2,
      fasting_glucose_mg_dl: 115
    });

    assert.ok(program.nutrition_program.targets.fiber_g >= 35);
    assert.equal(program.hypoglycemia_guard.active, true);
    assert.ok(program.clinical_safety_shield.supplement_recommendations.some(s => s.supplement.includes('Chromium')));
    assert.ok(program.clinical_safety_shield.whole_food_interventions.some(w => w.food_title_ar.includes('النشا المقاوم')));
  });

  await suite.test('4. Lipid Profile Pipeline: Saturated fat capped at < 7% and high EPA/DHA Omega-3 prescribed', () => {
    const program = buildTestProgramWithBiomarkers({
      total_cholesterol_mg_dl: 235,
      triglycerides_mg_dl: 220,
      ldl_mg_dl: 155
    });

    const shield = program.clinical_safety_shield;
    assert.equal(shield.dietary_modifications.saturated_fat_cap_percent, 7);
    assert.ok(shield.supplement_recommendations.some(s => s.supplement.includes('Omega-3')));
    assert.ok(shield.whole_food_interventions.some(w => w.food_title_ar.includes('الدهون غير المشبعة')));
  });

  await suite.test('5. Weekly Adaptation Pipeline: Preserves renal protein cap and routes checkin with new biomarkers to coach', () => {
    const baseProgram = buildTestProgramWithBiomarkers({
      egfr_ml_min: 50
    });

    const checkinAnalysis = {
      analysis_status: CheckinAnalysisStatus.ON_TRACK,
      weight_change_kg: -0.5,
      weight_kg: 82,
      adherence_score: 95,
      biomarkers: {
        uric_acid_mg_dl: 8.8
      }
    };

    const adaptedPlan = buildAdaptedPlan({
      currentMasterProgram: baseProgram,
      checkinAnalysis,
      options: {
        weight_kg: 82,
        currentWeekNumber: 2
      }
    });

    // Protein must still remain capped at 90g (82 * 1.1)
    assert.equal(adaptedPlan.adapted_nutrition.protein_g, 90);
    assert.equal(adaptedPlan.requires_coach_approval, true);
    assert.ok(adaptedPlan.adaptation_reasons.some(r => r.code === 'CLINICAL_BIOMARKER_PROTECTION_APPLIED'));
    assert.ok(adaptedPlan.biomarker_analysis.flags.some(f => f.biomarker === 'URIC_ACID_HYPERURICEMIA'));
  });
});
