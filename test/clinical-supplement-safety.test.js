import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SUPPLEMENT_REGISTRY,
  evaluateSingleSupplement,
  evaluateClinicalSupplementSafety,
  getStandardSupplementCatalog
} from '../src/execution-engines/clinical-supplement-safety-engine.js';

test('Clinical Supplement Safety & Interaction Engine Suite', async (t) => {

  await t.test('1. Blocks Creatine when client has renal insufficiency or low eGFR', () => {
    const res1 = evaluateSingleSupplement('CREATINE', {
      medicalConditions: ['RENAL_INSUFFICIENCY'],
      biomarkers: { egfr: 55 }
    });
    assert.strictEqual(res1.safety_status, 'CONTRAINDICATED');
    assert.strictEqual(res1.severity, 'CRITICAL');
    assert.ok(res1.alert_title_ar.includes('الكرياتين'));
    assert.ok(res1.trigger_factors.length > 0);

    const res2 = evaluateSingleSupplement('CREATINE', {
      medicalConditions: ['NONE'],
      biomarkers: { egfr: 95, creatinine: 0.9 }
    });
    assert.strictEqual(res2.safety_status, 'SAFE');
  });

  await t.test('2. Blocks High-Stim Pre-workout and Yohimbine when client has hypertension or heart condition', () => {
    const resStim = evaluateSingleSupplement('HIGH_STIM_PREWORKOUT', {
      medicalConditions: ['HYPERTENSION'],
      biomarkers: { systolic_bp: 145 }
    });
    assert.strictEqual(resStim.safety_status, 'CONTRAINDICATED');
    assert.ok(resStim.trigger_factors.some(f => f.includes('HYPERTENSION') || f.includes('140')));

    const resYohimbine = evaluateSingleSupplement('YOHIMBINE', {
      medicalConditions: ['ضغط دم مرتفع']
    });
    assert.strictEqual(resYohimbine.safety_status, 'CONTRAINDICATED');
  });

  await t.test('3. Triggers caution for high-dose Omega-3 when taking blood thinners (Warfarin/Aspirin)', () => {
    const res = evaluateSingleSupplement('HIGH_DOSE_OMEGA3', {
      activeMedications: ['WARFARIN']
    });
    assert.strictEqual(res.safety_status, 'CONTRAINDICATED');
    assert.strictEqual(res.severity, 'CRITICAL');

    const resAsp = evaluateSingleSupplement('HIGH_DOSE_OMEGA3', {
      activeMedications: ['ASPIRIN']
    });
    assert.strictEqual(resAsp.safety_status, 'CAUTION');
    assert.strictEqual(resAsp.severity, 'MODERATE');
  });

  await t.test('4. Blocks Ashwagandha for hyperthyroidism and triggers caution with Levothyroxine', () => {
    const resHyper = evaluateSingleSupplement('ASHWAGANDHA', {
      medicalConditions: ['HYPERTHYROIDISM']
    });
    assert.strictEqual(resHyper.safety_status, 'CONTRAINDICATED');

    const resHypoMeds = evaluateSingleSupplement('ASHWAGANDHA', {
      medicalConditions: ['HYPOTHYROIDISM'],
      activeMedications: ['LEVOTHYROXINE']
    });
    assert.strictEqual(resHypoMeds.safety_status, 'CAUTION');
  });

  await t.test('5. Evaluates Citrulline Malate against hypotension and nitrates', () => {
    const res = evaluateSingleSupplement('CITRULLINE_MALATE', {
      medicalConditions: ['HYPOTENSION'],
      biomarkers: { systolic_bp: 85 }
    });
    assert.strictEqual(res.safety_status, 'CONTRAINDICATED');
  });

  await t.test('6. Batch evaluation computes overall status and clinical summary', () => {
    const batchRes = evaluateClinicalSupplementSafety({
      supplements: ['CREATINE', 'MAGNESIUM_GLYCINATE', 'HIGH_STIM_PREWORKOUT'],
      medicalConditions: ['HYPERTENSION'],
      biomarkers: { egfr: 90, systolic_bp: 145 }
    });

    assert.strictEqual(batchRes.overall_status, 'CONTRAINDICATED');
    assert.strictEqual(batchRes.is_fully_safe, false);
    assert.strictEqual(batchRes.contraindicated_count, 1); // Pre-workout
    assert.strictEqual(batchRes.safe_count, 2); // Creatine is safe here, Magnesium is safe
    assert.ok(batchRes.clinical_summary_ar.includes('تحذير سريري حاسم'));
  });

  await t.test('7. Clean profile returns fully safe status with no contraindications', () => {
    const batchClean = evaluateClinicalSupplementSafety({
      supplements: ['MAGNESIUM_GLYCINATE', 'VITAMIN_D3_K2', 'WHEY_PROTEIN'],
      medicalConditions: ['NONE'],
      activeMedications: []
    });

    assert.strictEqual(batchClean.overall_status, 'SAFE');
    assert.strictEqual(batchClean.is_fully_safe, true);
    assert.strictEqual(batchClean.safe_count, 3);
    assert.strictEqual(batchClean.contraindicated_count, 0);
  });

  await t.test('8. Catalog export returns standard supplements list', () => {
    const catalog = getStandardSupplementCatalog();
    assert.ok(Array.isArray(catalog));
    assert.ok(catalog.length >= 8);
    assert.ok(catalog.some(c => c.code === 'CREATINE'));
    assert.ok(catalog.some(c => c.code === 'MAGNESIUM_GLYCINATE'));
  });
});
