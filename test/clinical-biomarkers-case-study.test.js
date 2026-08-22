import test from 'node:test';
import assert from 'node:assert/strict';

import {
  analyzeBloodworkBiomarkers
} from '../src/execution-engines/biomarker-engine.js';

import {
  evaluateDrugNutrientInteractions,
  MONITORED_MEDICATIONS
} from '../src/execution-engines/drug-nutrient-engine.js';

import {
  generateClientCaseStudy
} from '../src/execution-engines/case-study-engine.js';

test('1. Biomarker Engine - Elevated HbA1c Enforces >= 35g Fiber & Complex Carbs', () => {
  const result = analyzeBloodworkBiomarkers({
    hba1c_percent: 6.1,
    fasting_glucose_mg_dl: 110
  });

  assert.equal(result.has_biomarker_flags, true);
  assert.equal(result.dietary_modifications.min_fiber_g, 35);
  assert.equal(result.dietary_modifications.complex_carbs_only, true);
  assert.ok(result.flags.some(f => f.biomarker === 'GLUCOMETABOLISM' || f.biomarker.includes('GLUCOSE')));
});

test('2. Biomarker Engine - Reduced eGFR (< 60) Enforces Renal Protein Cap & Withholds Creatine', () => {
  const result = analyzeBloodworkBiomarkers({
    egfr_ml_min: 52,
    creatinine_mg_dl: 1.5,
    gender: 'MALE'
  });

  assert.equal(result.has_biomarker_flags, true);
  assert.equal(result.dietary_modifications.protein_cap_g_per_kg, 1.1);
  assert.equal(result.dietary_modifications.withhold_creatine, true);
  assert.ok(result.flags.some(f => f.biomarker === 'RENAL_FUNCTION'));
});

test('3. Biomarker Engine - Elevated Triglycerides Caps Saturated Fats & Injects Omega-3', () => {
  const result = analyzeBloodworkBiomarkers({
    triglycerides_mg_dl: 210,
    alt_u_l: 55
  });

  assert.equal(result.dietary_modifications.saturated_fat_cap_percent, 7);
  assert.ok(result.supplement_recommendations.some(s => s.supplement.includes('Omega-3')));
});

test('4. Drug-Nutrient Timing Engine - Eltroxin Strict 4h Separation from Calcium & Iron', () => {
  const interactions = evaluateDrugNutrientInteractions(['Eltroxin 50mcg', 'Metformin 500mg']);

  assert.equal(interactions.has_medication_interactions, true);
  assert.equal(interactions.active_medication_rules.length, 2);

  const eltroxinRule = interactions.active_medication_rules.find(r => r.medication_code === 'ELTROXIN');
  assert.ok(eltroxinRule);
  assert.ok(eltroxinRule.rule_ar.includes('4 ساعات'));

  const metforminRule = interactions.active_medication_rules.find(r => r.medication_code === 'METFORMIN');
  assert.ok(metforminRule);
  assert.ok(metforminRule.rule_ar.includes('B12'));
});

test('5. Drug-Nutrient Timing Engine - ACE Inhibitors Prohibits KCl Salt Substitutes', () => {
  const interactions = evaluateDrugNutrientInteractions(['Captopril 25mg']);

  assert.equal(interactions.has_medication_interactions, true);
  const aceRule = interactions.active_medication_rules.find(r => r.medication_code === 'ACE_INHIBITORS');
  assert.ok(aceRule);
  assert.ok(aceRule.rule_ar.includes('كلوريد البوتاسيوم'));
});

test('6. Case Study Generator - 16-Week Transformation Calculation & Social Caption', () => {
  const caseStudy = generateClientCaseStudy({
    client_name: 'سارة المنصوري',
    client_code: '1',
    package_name: 'باقة ماكس (VIP)',
    starting_weight_kg: 88.0,
    final_weight_kg: 74.0, // 14 kg drop
    starting_waist_cm: 96.0,
    final_waist_cm: 78.0, // 18 cm drop
    starting_body_fat_percent: 32.0,
    final_body_fat_percent: 18.0, // 14% drop
    total_weeks: 16,
    adherence_rate_percent: 98
  });

  assert.equal(caseStudy.success, true);
  assert.equal(caseStudy.transformation_metrics.weight.delta, '-14 kg');
  assert.equal(caseStudy.transformation_metrics.waist.delta, '-18 cm');
  assert.equal(caseStudy.transformation_metrics.body_fat.drop, '-14%');
  assert.ok(caseStudy.social_caption_template_ar.includes('14 كجم'));
  assert.ok(caseStudy.social_caption_template_ar.includes('كابتن كريم زكريا'));
});
