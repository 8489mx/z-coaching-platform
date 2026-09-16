import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { auditPlanPreflightQuality, AUDIT_STATUS } from '../src/execution-engines/plan-quality-preflight-shield.js';

describe('Pre-Flight Plan Quality & Clinical Audit Shield Suite', () => {

  test('1. Clears high-quality, clinically coherent plan with READY status (score >= 85)', () => {
    const mockProgram = {
      client: {
        id: 'client_01',
        full_name: 'كريم الألفي',
        weight_kg: 80,
        height_cm: 180,
        injuries: []
      },
      training_plan: {
        days: [
          {
            day_number: 1,
            exercises: [
              { name_ar: 'بنش برس بالبار', target_muscle: 'chest', sets: 4, rest_seconds: 90, notes: 'تحكم كامل في النزول' },
              { name_ar: 'تفتيح دمبل مائل', target_muscle: 'chest', sets: 3, rest_seconds: 75, notes: 'مدى حركي كامل' },
              { name_ar: 'ترايسبس بالحبل', target_muscle: 'triceps', sets: 3, rest_seconds: 60, notes: 'عصر في نهاية الحركة' }
            ]
          },
          {
            day_number: 2,
            exercises: [
              { name_ar: 'سحب أرضي بالبار', target_muscle: 'back', sets: 4, rest_seconds: 90, notes: 'استقامة الظهر' },
              { name_ar: 'سحب عالي واسع', target_muscle: 'back', sets: 3, rest_seconds: 75, notes: 'تثبيت اللوحين' },
              { name_ar: 'بايسبس بار متعرج', target_muscle: 'biceps', sets: 3, rest_seconds: 60, notes: 'كوع ثابت' }
            ]
          },
          {
            day_number: 3,
            exercises: [
              { name_ar: 'سكوات حر', target_muscle: 'legs', sets: 4, rest_seconds: 120, notes: 'عمق كامل' },
              { name_ar: 'ليج بريس', target_muscle: 'legs', sets: 3, rest_seconds: 90, notes: 'بدون قفل الركبة' },
              { name_ar: 'رفرفة كتف جانبي', target_muscle: 'shoulders', sets: 4, rest_seconds: 60, notes: 'تركيز على الرأس الجانبي' }
            ]
          }
        ]
      },
      nutrition_plan: {
        target_calories: 2200,
        target_protein: 160,
        hydration_liters: 3.8,
        meals: [
          { name: 'وجبة 1', items: [{ name: 'بيض وشوفان' }] },
          { name: 'وجبة 2', items: [{ name: 'صدور دجاج وأرز بسمتي' }] },
          { name: 'وجبة 3', items: [{ name: 'زبادي يوناني ومكسرات' }] }
        ]
      },
      supplements_plan: [
        { name_ar: 'كرياتين مونوهيدرات', dosage: '5g' },
        { name_ar: 'أوميجا 3', dosage: '2000mg' }
      ]
    };

    const audit = auditPlanPreflightQuality({ program: mockProgram });

    assert.ok(audit.total_score >= 85, `Expected score >= 85, got ${audit.total_score}`);
    assert.strictEqual(audit.status, AUDIT_STATUS.READY);
    assert.strictEqual(audit.is_deployable, true);
    assert.strictEqual(audit.blockers.length, 0);
    assert.ok(audit.passed_items.length >= 4);
  });

  test('2. Blocks plan when severe medical contraindication or critical defect exists', () => {
    const blockedProgram = {
      client: {
        id: 'client_02',
        full_name: 'محمود شاكر',
        weight_kg: 85,
        medical_conditions: ['قصور كلوي مزمن'],
        injuries: ['انزلاق غضروفي قطني L4-L5']
      },
      training_plan: {
        days: [
          {
            day_number: 1,
            exercises: [
              { name_ar: 'ديدليفت ثقيل بالبار', target_muscle: 'back', sets: 5 } // conflicts with disc injury
            ]
          }
        ]
      },
      nutrition_plan: {
        target_calories: 800, // extremely low crash calories
        target_protein: 60,
        meals: []
      },
      supplements_plan: [
        { name_ar: 'كرياتين مونوهيدرات', dosage: '10g' } // critical renal contraindication!
      ]
    };

    const audit = auditPlanPreflightQuality({ program: blockedProgram });

    assert.strictEqual(audit.status, AUDIT_STATUS.BLOCKED);
    assert.strictEqual(audit.is_deployable, false);
    assert.ok(audit.blockers.length >= 2, 'Should detect critical blockers');
    assert.ok(audit.total_score < 70, `Score should be < 70, got ${audit.total_score}`);
  });

  test('3. Flags warnings when sub-optimal volume, aggressive deficit, or missing cues exist', () => {
    const warningProgram = {
      client: {
        id: 'client_03',
        full_name: 'سارة خالد',
        weight_kg: 60,
        injuries: []
      },
      training_plan: {
        days: [
          {
            day_number: 1,
            exercises: [
              { name_ar: 'تمرين عام', target_muscle: 'chest', sets: 2 }, // under MEV
              { name_ar: 'تمرين ثاني', target_muscle: 'chest', sets: 2 }
            ]
          },
          {
            day_number: 2,
            exercises: [
              { name_ar: 'تمرين ظهر', target_muscle: 'back', sets: 28 } // over MRV
            ]
          }
        ]
      },
      nutrition_plan: {
        target_calories: 1400,
        target_protein: 70, // ~1.16 g/kg
        hydration_liters: 0, // missing hydration
        meals: [{ name: 'وجبة 1' }]
      },
      supplements_plan: []
    };

    const audit = auditPlanPreflightQuality({ program: warningProgram });

    assert.strictEqual(audit.status, AUDIT_STATUS.WARNING);
    assert.strictEqual(audit.is_deployable, true);
    assert.ok(audit.warnings.length >= 3, 'Should have multiple actionable warnings');
    assert.strictEqual(audit.blockers.length, 0);
  });

});
