import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getPracticalCardioPrescription,
  CARDIO_TYPES
} from '../src/execution-engines/cardio-zones-engine.js';

import {
  SMART_GUIDELINES_MATRIX,
  generateMasterPdfExportData,
  generatePrintablePlanHTML
} from '../src/execution-engines/pdf-export-engine.js';

test('Talk-Test Cardio and PDF Export Engines Suite', async (t) => {

  await t.test('4. Practical Cardio Engine: Formulates LISS Zone 2 prescription using The Talk Test', () => {
    const liss = getPracticalCardioPrescription({
      type: CARDIO_TYPES.LISS_TALK_TEST,
      duration_minutes: 25,
      sessions_per_week: 3
    });

    assert.equal(liss.type, CARDIO_TYPES.LISS_TALK_TEST);
    assert.equal(liss.duration_minutes, 25);
    assert.ok(liss.talk_test_cue_ar.includes('التحدث بجمل كاملة'));
    assert.ok(liss.execution_breakdown_ar.length >= 2);
  });

  await t.test('5. Practical Cardio Engine: Formulates HIIT 1:3 prescription with strict work/rest interval cues', () => {
    const hiit = getPracticalCardioPrescription({
      type: CARDIO_TYPES.HIIT_INTERVALS,
      duration_minutes: 15,
      sessions_per_week: 2
    });

    assert.equal(hiit.type, CARDIO_TYPES.HIIT_INTERVALS);
    assert.ok(hiit.talk_test_cue_ar.includes('لا يمكنك التحدث'));
    assert.equal(hiit.duration_minutes, 15);
  });

  await t.test('6. Master PDF Engine: Exports complete 5-point Smart Guidelines Matrix', () => {
    assert.equal(SMART_GUIDELINES_MATRIX.length, 5);
    const ids = SMART_GUIDELINES_MATRIX.map(g => g.id);
    assert.ok(ids.includes('COOKED_WEIGHT_RULE'));
    assert.ok(ids.includes('FLEXIBLE_TIMING_RULE'));
    assert.ok(ids.includes('CAFFEINE_CUTOFF_RULE'));
    assert.ok(ids.includes('HYDRATION_RULE'));
    assert.ok(ids.includes('RIR_INTENSITY_RULE'));
  });

  await t.test('7. Master PDF Engine: Generates full structured export object with dual portions and cues', () => {
    const pdfData = generateMasterPdfExportData({
      client_name: 'عمر مصطفى',
      package_tier: 'MAX_VIP',
      current_week: 3
    });

    assert.equal(pdfData.client.name, 'عمر مصطفى');
    assert.equal(pdfData.client.week, 'الأسبوع 3');
    assert.ok(pdfData.contextual_guidelines.length === 5);
    assert.ok(pdfData.nutrition.meals.length >= 2);
    assert.ok(pdfData.training.sessions.length >= 1);
    assert.ok(pdfData.cardio.talk_test_cue);
  });

  await t.test('8. generatePrintablePlanHTML: Compiles high-density, valid HTML document for 1-click print', () => {
    const html = generatePrintablePlanHTML({
      client: { name: 'مصطفى كمال', target_calories: 2100, target_protein: 165, target_carbs: 220, target_fats: 60 },
      plan: {
        prehab: {
          has_prehab: true,
          total_duration_minutes: 3,
          exercises: [
            { name_ar: 'سحب شريط المقاومة للصدر', sets: 2, reps: '20-25', cue: 'تثبيت لوحي الكتف للخلف' }
          ]
        },
        workout: {
          title_ar: 'يوم الدفع العلوي',
          environment: 'GYM',
          exercises: [
            { name_ar: 'ضغط دمبل مائل', name_en: 'Incline DB Press', sets: 3, reps: '8-10', target_rir: 2, rest_minutes: 2 }
          ]
        },
        meals: [
          {
            title_ar: 'وجبة الإفطار',
            calories: 520,
            items: [
              { name_ar: 'جبن قريش طبيعي', grams: 200, hand_portion: '4 ملاعق كبيرة' }
            ]
          }
        ]
      }
    });

    assert.ok(typeof html === 'string');
    assert.ok(html.includes('<!DOCTYPE html>'));
    assert.ok(html.includes('مصطفى كمال'));
    assert.ok(html.includes('2100 Kcal'));
    assert.ok(html.includes('سحب شريط المقاومة'));
    assert.ok(html.includes('Incline DB Press'));
    assert.ok(html.includes('جبن قريش طبيعي'));
    assert.ok(html.includes('Z COACHING PLATFORM'));
  });
});
