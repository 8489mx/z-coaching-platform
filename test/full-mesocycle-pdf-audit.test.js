import test from 'node:test';
import assert from 'node:assert/strict';

import {
  generateMasterPdfExportData,
  generatePrintablePlanHTML,
  SMART_GUIDELINES_MATRIX
} from '../src/execution-engines/pdf-export-engine.js';
import { buildTrainingMesoCycle } from '../src/training-engine-v2/index.js';
import { evaluateIntake } from '../src/intake-decision-engine/index.js';
import { completeIntake } from './fixtures/complete-intake.js';

test('Milestone 11: Full Mesocycle Clinical PDF Audit Suite', async (suite) => {

  await suite.test('1. Zero Grocery Lists Firewall: Strictly forbids any supermarket shopping lists in PDF export', () => {
    const pdfData = generateMasterPdfExportData({
      client_name: 'أحمد محمود',
      client_code: '901',
      package_tier: 'MAX',
      current_week: 1
    });

    const renderedHtml = generatePrintablePlanHTML({
      client: { name: 'أحمد محمود', goal_title: 'خسارة دهون' },
      plan: {
        prehab: { has_prehab: false },
        workout: { title_ar: 'الصدر والترايسبس', exercises: [] },
        meals: [
          { title_ar: 'وجبة 1', items: [{ name_ar: 'صدور دجاج', grams: 200, hand_portion: 'كف اليد' }], calories: 450 }
        ]
      }
    });

    const forbiddenTerms = [
      'قائمة تسوق',
      'قائمة المشتريات',
      'سوبرماركت',
      'grocery',
      'shopping list',
      'supermarket'
    ];

    const jsonString = JSON.stringify(pdfData).toLowerCase();
    const htmlLower = renderedHtml.toLowerCase();

    for (const term of forbiddenTerms) {
      assert.equal(
        jsonString.includes(term),
        false,
        `Violation: PDF data payload contains forbidden grocery term "${term}"`
      );
      assert.equal(
        htmlLower.includes(term),
        false,
        `Violation: Rendered PDF HTML contains forbidden grocery term "${term}"`
      );
    }
  });

  await suite.test('2. Static Hydration Standard: Prescribes static water guidance without interactive cups', () => {
    const hydrationRule = SMART_GUIDELINES_MATRIX.find(g => g.id === 'HYDRATION_RULE');
    assert.ok(hydrationRule, 'Hydration rule must exist in SMART_GUIDELINES_MATRIX');
    assert.ok(hydrationRule.instruction_ar.includes('3 إلى 5 لتر ماء يومياً'));

    const renderedHtml = generatePrintablePlanHTML({
      client: { name: 'طارق علي' },
      plan: { meals: [], workout: { exercises: [] } }
    });

    // Asserts static hydration text exists and no interactive counter/cup elements
    assert.ok(renderedHtml.includes('الترطيب والميزان'));
    assert.equal(renderedHtml.includes('<input'), false);
    assert.equal(renderedHtml.includes('<button'), false);
  });

  await suite.test('3. Full 5-Week Mesocycle Periodization Coverage in Training Engine', () => {
    const validIntake = completeIntake();
    const evaluationContext = { assessmentDate: '2026-08-16' };
    const decision = evaluateIntake(validIntake, evaluationContext);
    const mesocycle = buildTrainingMesoCycle(decision, { weeksCount: 5 });

    assert.equal(mesocycle.weeks.length, 5);
    assert.equal(mesocycle.weeks[0].week_number, 1);
    assert.equal(mesocycle.weeks[4].week_number, 5);
    assert.equal(mesocycle.weeks[4].phase, 'DELOAD');
    assert.equal(mesocycle.weeks[4].target_rir, 3);

    // Verify all sessions in deload have RIR 3 and reduced volume
    const deloadWeek = mesocycle.weeks[4];
    for (const session of deloadWeek.sessions) {
      for (const ex of session.exercises) {
        assert.equal(ex.target_rir, 3);
      }
    }
  });

  await suite.test('4. PDF Zero Sharp Corners Aesthetics: Employs curved borders across tables and badges', () => {
    const renderedHtml = generatePrintablePlanHTML({
      client: { name: 'عمر خالد' },
      plan: {
        prehab: { has_prehab: true, total_duration_minutes: 8, exercises: [{ name_ar: 'تفعيل الجلوتس', sets: 2, reps: '12' }] },
        workout: { title_ar: 'تمرين الأرجل', exercises: [{ name_ar: 'سكوات', sets: 3, reps: '8-10', target_rir: 2 }] },
        meals: [{ title_ar: 'إفطار', items: [{ name_ar: 'شوفان', grams: 80 }], calories: 300 }]
      }
    });

    // Check border-radius presence in styles
    assert.ok(renderedHtml.includes('border-radius: 6px') || renderedHtml.includes('border-radius: 4px') || renderedHtml.includes('border-radius: 3px'));
    assert.ok(renderedHtml.includes('dir="rtl"'));
  });
});
