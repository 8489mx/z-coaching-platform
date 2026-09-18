import test from 'node:test';
import assert from 'node:assert/strict';

import {
  analyzeBloodworkBiomarkers
} from '../src/execution-engines/biomarker-engine.js';

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

