import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BIOMARKER_PANELS,
  BIOMARKER_CATALOG,
  calculateHomaIR,
  evaluateClinicalBiomarkers
} from '../frontend/src/utils/clinicalBiomarkerEngine.js';

test('1. Biomarker Engine - Catalog covers all 6 clinical panels', () => {
  assert.strictEqual(Object.keys(BIOMARKER_PANELS).length, 6);
  assert.ok(BIOMARKER_CATALOG.some(m => m.panel === 'CBC' && m.key === 'hemoglobin'));
  assert.ok(BIOMARKER_CATALOG.some(m => m.panel === 'RENAL' && m.key === 'creatinine'));
  assert.ok(BIOMARKER_CATALOG.some(m => m.panel === 'LIVER' && m.key === 'alt'));
  assert.ok(BIOMARKER_CATALOG.some(m => m.panel === 'GLYCEMIC' && m.key === 'hba1c'));
  assert.ok(BIOMARKER_CATALOG.some(m => m.panel === 'LIPIDS' && m.key === 'triglycerides'));
  assert.ok(BIOMARKER_CATALOG.some(m => m.panel === 'MICRONUTRIENTS' && m.key === 'vitamin_d'));
  assert.ok(BIOMARKER_CATALOG.some(m => m.panel === 'MICRONUTRIENTS' && m.key === 'creatine_kinase'));
});

test('2. Biomarker Engine - Accurately calculates HOMA-IR insulin resistance index', () => {
  // Formula: (Glucose * Insulin) / 405
  // Example: Fasting Glucose 95 mg/dL, Fasting Insulin 12 uIU/mL => (95 * 12) / 405 = 2.81
  const homa = calculateHomaIR(95, 12);
  assert.strictEqual(homa, 2.81);

  // Normal HOMA: Glucose 85, Insulin 5 => (85 * 5) / 405 = 1.05
  const normalHoma = calculateHomaIR(85, 5);
  assert.strictEqual(normalHoma, 1.05);

  assert.strictEqual(calculateHomaIR(null, 10), null);
  assert.strictEqual(calculateHomaIR(90, 0), null);
});

test('3. Biomarker Engine - Triggers Renal Guardrail (Creatinine cap & withhold creatine)', () => {
  const result = evaluateClinicalBiomarkers({
    values: { creatinine: 1.45, egfr: 55 },
    client: { gender: 'MALE', weight_kg: 80 },
    supplementAdherence: 'FULL'
  });

  assert.strictEqual(result.has_flags, true);
  assert.ok(result.flags.some(f => f.panel === 'RENAL'));
  assert.strictEqual(result.dietary_modifications.withhold_creatine, true);
  assert.strictEqual(result.dietary_modifications.protein_cap_g_per_kg, 1.1);
  assert.strictEqual(result.dietary_modifications.daily_water_target_liters, 4.0);
});

test('4. Biomarker Engine - Food-First Mode replaces supplements with natural whole foods', () => {
  // Test case: Client has low Ferritin and low Vitamin D, but supplementAdherence === 'NONE'
  const result = evaluateClinicalBiomarkers({
    values: {
      ferritin: 18, // deficient
      vitamin_d: 19, // severe deficiency
      fasting_glucose: 105,
      fasting_insulin: 14 // HOMA-IR > 2.5
    },
    client: { gender: 'FEMALE', weight_kg: 65 },
    supplementAdherence: 'NONE' // 100% natural food only!
  });

  assert.strictEqual(result.has_flags, true);
  assert.strictEqual(result.is_food_only_mode, true);
  // Supplements array must be EMPTY because client doesn't take supplements
  assert.strictEqual(result.supplement_recommendations.length, 0);

  // Whole foods array must have specific clinical food interventions
  assert.ok(result.whole_food_interventions.length >= 3);
  
  // Must include iron whole-food protocol (liver, beef, vit C pairing, tea restriction)
  const ironProtocol = result.whole_food_interventions.find(i => i.food_title_ar.includes('الحديد'));
  assert.ok(ironProtocol);
  assert.ok(ironProtocol.rationale_ar.includes('كبدة بقري'));
  assert.ok(ironProtocol.rationale_ar.includes('فيتامين'));
  assert.ok(ironProtocol.rationale_ar.includes('الشاي'));

  // Must include vitamin D whole-food protocol
  const vitDProtocol = result.whole_food_interventions.find(i => i.food_title_ar.includes('فيتامين د'));
  assert.ok(vitDProtocol);
  assert.ok(vitDProtocol.rationale_ar.includes('صفار'));
  assert.ok(vitDProtocol.rationale_ar.includes('الشمس'));

  // Must include resistant starch / fiber protocol for insulin resistance
  const carbProtocol = result.whole_food_interventions.find(i => i.food_title_ar.includes('النشا المقاوم'));
  assert.ok(carbProtocol);
});

test('5. Biomarker Engine - Enforces Deload on elevated Creatine Kinase (CK)', () => {
  const result = evaluateClinicalBiomarkers({
    values: { creatine_kinase: 520 },
    client: { gender: 'MALE', weight_kg: 85 }
  });

  assert.strictEqual(result.has_flags, true);
  assert.strictEqual(result.training_modifications.enforce_deload, true);
  assert.strictEqual(result.training_modifications.reduce_intensity, true);
  assert.ok(result.training_modifications.notes_ar.some(n => n.includes('ديلود')));
});

test('6. Biomarker Engine - Issues Medical Referral on dangerous diabetes or renal levels with NO prescription drugs', () => {
  const result = evaluateClinicalBiomarkers({
    values: { fasting_glucose: 145, hba1c: 7.2, creatinine: 2.1 },
    client: { gender: 'MALE', weight_kg: 90 }
  });

  assert.strictEqual(result.has_flags, true);
  assert.ok(result.medical_referrals.length >= 2);
  assert.ok(result.medical_referrals.some(r => r.includes('طبيب كلى')));
  assert.ok(result.medical_referrals.some(r => r.includes('طبيب غدد وباطنة')));

  // Ensure absolutely NO prescription medications (like metformin, insulin, statins) are prescribed
  const allText = JSON.stringify(result);
  assert.strictEqual(allText.toLowerCase().includes('metformin'), false);
  assert.strictEqual(allText.toLowerCase().includes('insulin dose'), false);
  assert.strictEqual(allText.toLowerCase().includes('statin'), false);
});

test('7. Biomarker Engine - Defaults to Food-First mode (NONE) and treats magnesium deficiency with whole food interventions first', () => {
  // Calling with NO supplementAdherence parameter must default to Food-First ('NONE')
  const result = evaluateClinicalBiomarkers({
    values: { magnesium: 1.5 },
    client: { gender: 'MALE', weight_kg: 80 }
  });

  assert.strictEqual(result.has_flags, true);
  assert.strictEqual(result.supplement_adherence, 'NONE');
  assert.strictEqual(result.is_food_only_mode, true);
  // Supplements must be empty because food is the primary default
  assert.strictEqual(result.supplement_recommendations.length, 0);

  // Must include magnesium food-first intervention (pumpkin seeds, spinach, almonds, dark chocolate)
  const mgProtocol = result.whole_food_interventions.find(i => i.food_title_ar.includes('الماغنسيوم'));
  assert.ok(mgProtocol);
  assert.ok(mgProtocol.rationale_ar.includes('بذور يقطين'));
  assert.ok(mgProtocol.rationale_ar.includes('سبانخ'));
  assert.ok(mgProtocol.rationale_ar.includes('لوز'));
});

test('8. Biomarker Engine - Fasting state computes HOMA-IR and evaluates fasting glucose (70-99 mg/dL)', () => {
  const fastingResult = evaluateClinicalBiomarkers({
    values: { fasting_glucose: 105, fasting_insulin: 12 },
    client: { gender: 'MALE', weight_kg: 80 },
    sampleFastingState: 'FASTING'
  });

  assert.strictEqual(fastingResult.is_sample_fasting, true);
  assert.strictEqual(fastingResult.sample_fasting_state, 'FASTING');
  assert.strictEqual(fastingResult.homa_ir, 3.11); // (105 * 12) / 405 = 3.11
  assert.ok(fastingResult.flags.some(f => f.panel === 'GLYCEMIC'));
});

test('9. Biomarker Engine - Non-Fasting (فاطر / عشوائي) disables HOMA-IR to prevent false positives and adapts glucose threshold (<140)', () => {
  // Client has glucose 120 after eating (postprandial), which is completely normal (<140), and HbA1c 5.2% (normal)
  const nonFastingResult = evaluateClinicalBiomarkers({
    values: { fasting_glucose: 120, fasting_insulin: 18, hba1c: 5.2 },
    client: { gender: 'MALE', weight_kg: 80 },
    sampleFastingState: 'NON_FASTING'
  });

  assert.strictEqual(nonFastingResult.is_sample_fasting, false);
  assert.strictEqual(nonFastingResult.sample_fasting_state, 'NON_FASTING');
  // HOMA-IR MUST be null to prevent false positive insulin resistance diagnosis on postprandial blood
  assert.strictEqual(nonFastingResult.homa_ir, null);
  // Glucose 120 after meal is safe, so no glycemic flags should be triggered
  assert.strictEqual(nonFastingResult.flags.some(f => f.panel === 'GLYCEMIC'), false);
});

