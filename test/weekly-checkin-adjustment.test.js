import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateWeeklyCheckinAudit,
  evaluateWeeklyProgress,
  CHECKIN_DECISION_CODES
} from '../src/execution-engines/weekly-audit-engine.js';
import { approveCheckin } from '../src/api/controllers/checkin.controller.js';
import { CheckinSubmission, Program } from '../src/api/models/index.js';

test('Weekly Check-in & Dynamic Adjustment Engine Suite', async (t) => {

  await t.test('1. Case 1: EXCELLENT_PROGRESS maintains current calories on weight loss or waist drop', () => {
    const result = evaluateWeeklyCheckinAudit({
      clientProfile: { name: 'عمر', current_daily_calories: 2000, protein_g: 160, carbs_g: 220, fat_g: 50 },
      previousWeekData: { weight_kg: 80.0, waist_cm: 85.0 },
      currentCheckin: { current_weight_kg: 79.4, waist_circumference_cm: 84.2, overall_adherence_percent: 95 }
    });

    assert.equal(result.decision_code, CHECKIN_DECISION_CODES.EXCELLENT_PROGRESS);
    assert.equal(result.action_type, 'MAINTAIN');
    assert.equal(result.next_week_calories, 2000);
    assert.equal(result.calorie_adjustment, 0);
    assert.ok(result.coach_action_summary_ar.includes('نزول ممتاز'));
  });

  await t.test('2. Case 2: LOW_ADHERENCE_WARNING warns client and locks calorie cuts on low adherence (<80%)', () => {
    const result = evaluateWeeklyCheckinAudit({
      clientProfile: { name: 'يوسف', current_daily_calories: 1900, protein_g: 150, carbs_g: 200, fat_g: 50 },
      previousWeekData: { weight_kg: 85.0, waist_cm: 90.0, consecutive_plateau_weeks: 1 },
      currentCheckin: { current_weight_kg: 85.0, waist_circumference_cm: 90.0, overall_adherence_percent: 65 }
    });

    assert.equal(result.decision_code, CHECKIN_DECISION_CODES.LOW_ADHERENCE_WARNING);
    assert.equal(result.action_type, 'WARN_ADHERENCE');
    assert.equal(result.next_week_calories, 1900); // Calories remain intact
    assert.equal(result.calorie_adjustment, 0);
    assert.ok(result.coach_action_summary_ar.includes('تنبيه المشترك'));
  });

  await t.test('3. Case 3: TRUE_PLATEAU_TITRATION cuts 120 kcal from carbs on 2+ weeks plateau with high adherence (>=85%)', () => {
    const result = evaluateWeeklyCheckinAudit({
      clientProfile: { name: 'طارق', current_daily_calories: 1950, protein_g: 160, carbs_g: 210, fat_g: 50 },
      previousWeekData: { weight_kg: 78.0, waist_cm: 82.0, consecutive_plateau_weeks: 1 },
      currentCheckin: { current_weight_kg: 78.0, waist_circumference_cm: 82.0, overall_adherence_percent: 92 }
    });

    assert.equal(result.decision_code, CHECKIN_DECISION_CODES.TRUE_PLATEAU_TITRATION);
    assert.equal(result.action_type, 'CUT_CARBS');
    assert.equal(result.calorie_adjustment, -120);
    assert.equal(result.next_week_calories, 1830);
    // 210 - 30g = 180g
    assert.equal(result.next_week_macros.carbs_g, 180);
    assert.equal(result.next_week_macros.protein_g, 160);
  });

  await t.test('4. Case 4: FEMALE_PMS_BUFFER locks calorie deficit cuts during PMS phase', () => {
    const result = evaluateWeeklyCheckinAudit({
      clientProfile: { name: 'سارة', is_female: true, current_daily_calories: 1700, protein_g: 130, carbs_g: 180, fat_g: 45 },
      previousWeekData: { weight_kg: 62.0, waist_cm: 70.0 },
      currentCheckin: { current_weight_kg: 63.2, waist_circumference_cm: 71.0, is_pms_active: true, overall_adherence_percent: 90 }
    });

    assert.equal(result.decision_code, CHECKIN_DECISION_CODES.FEMALE_PMS_BUFFER);
    assert.equal(result.action_type, 'MAINTAIN');
    assert.equal(result.next_week_calories, 1700);
    assert.equal(result.calorie_adjustment, 0);
    assert.ok(result.coach_action_summary_ar.includes('تثبيت السعرات') || result.coach_action_summary_ar.includes('PMS'));
  });

  await t.test('5. Case 5: DELOAD_ACTIVATION triggers deload on consecutive performance drops or joint pain', () => {
    const result = evaluateWeeklyCheckinAudit({
      clientProfile: { name: 'خالد', current_daily_calories: 2200, protein_g: 180, carbs_g: 240, fat_g: 60 },
      previousWeekData: { weight_kg: 82.0, waist_cm: 84.0, consecutive_training_weeks: 6 },
      currentCheckin: { current_weight_kg: 82.0, waist_circumference_cm: 84.0, consecutive_performance_drop_weeks: 2, joint_ache_flag: true, overall_adherence_percent: 90 }
    });

    assert.equal(result.decision_code, CHECKIN_DECISION_CODES.DELOAD_ACTIVATION);
    assert.equal(result.action_type, 'DELOAD');
    assert.equal(result.calorie_adjustment, 0);
    assert.ok(result.coach_action_summary_ar.includes('الديلود'));
  });

  await t.test('6. Produces valid 1-Click WhatsApp dispatch URL with encoded summary', () => {
    const result = evaluateWeeklyCheckinAudit({
      clientProfile: { name: 'أحمد', phone_number: '01012345678', current_daily_calories: 2000, protein_g: 160, carbs_g: 220, fat_g: 50 },
      previousWeekData: { weight_kg: 80.0, waist_cm: 85.0 },
      currentCheckin: { current_weight_kg: 79.2, waist_circumference_cm: 84.0, overall_adherence_percent: 95 }
    });

    assert.ok(result.whatsapp_dispatch);
    assert.ok(result.whatsapp_dispatch.dispatch_url.startsWith('https://wa.me/'));
    assert.ok(result.whatsapp_dispatch.message_ar.length > 20);
  });

  await t.test('7. evaluateWeeklyProgress: MENSTRUAL_RETENTION_LOCK locks calorie adjustments for females in menstrual phase', () => {
    const res = evaluateWeeklyProgress({
      currentWeightKg: 63.5,
      previousWeightKg: 62.0,
      currentWaistCm: 71.0,
      previousWaistCm: 70.0,
      adherenceRatePct: 95,
      currentCalories: 1700,
      goalType: 'FAT_LOSS',
      isFemale: true,
      isMenstrualPhase: true
    });

    assert.equal(res.status, 'MENSTRUAL_RETENTION_LOCK');
    assert.equal(res.decision, 'MAINTAIN_CALORIES');
    assert.equal(res.calorie_adjustment, 0);
    assert.equal(res.new_calories, 1700);
    assert.equal(res.action_required, false);
  });

  await t.test('8. evaluateWeeklyProgress: ADHERENCE_WARNING warns on low adherence (<85%) with no progress', () => {
    const res = evaluateWeeklyProgress({
      currentWeightKg: 85.0,
      previousWeightKg: 85.0,
      currentWaistCm: 90.0,
      previousWaistCm: 90.0,
      adherenceRatePct: 75,
      currentCalories: 1900,
      goalType: 'FAT_LOSS'
    });

    assert.equal(res.status, 'ADHERENCE_WARNING');
    assert.equal(res.decision, 'MAINTAIN_CALORIES');
    assert.equal(res.calorie_adjustment, 0);
    assert.equal(res.action_required, false);
  });

  await t.test('9. evaluateWeeklyProgress: CONFIRMED_PLATEAU drops 125 kcal on 2+ weeks stall with >=90% adherence', () => {
    const res = evaluateWeeklyProgress({
      currentWeightKg: 80.0,
      previousWeightKg: 80.0,
      currentWaistCm: 85.0,
      previousWaistCm: 85.0,
      adherenceRatePct: 92,
      currentCalories: 2000,
      weeksOnCurrentCalories: 2,
      goalType: 'FAT_LOSS'
    });

    assert.equal(res.status, 'CONFIRMED_PLATEAU');
    assert.equal(res.decision, 'REDUCE_CALORIES');
    assert.equal(res.calorie_adjustment, -125);
    assert.equal(res.new_calories, 1875);
    assert.equal(res.action_required, true);
    assert.equal(res.recommended_cardio_addition_mins, 15);
  });

  await t.test('10. approveCheckin controller updates program nutrition targets when custom_macros are provided', async () => {
    let savedProgData = null;
    const mockCheckin = {
      id: 99,
      user_id: 1,
      analysis_output: { suggested_calorie_delta: 0 },
      status: 'PENDING',
      coach_notes: '',
      save: async () => {}
    };
    const mockProgram = {
      id: 101,
      user_id: 1,
      program_data: {
        nutrition: { targets: { calories: 2000, protein: 140, carbs: 220, fats: 60 } },
        nutrition_program: { macro_targets: { calories_kcal: 2000, protein_g: 140, carb_g: 220, fat_g: 60 } }
      },
      update: async ({ program_data }) => {
        savedProgData = program_data;
      }
    };

    const origFindCheckin = CheckinSubmission.findByPk;
    const origFindProgram = Program.findOne;
    CheckinSubmission.findByPk = async () => mockCheckin;
    Program.findOne = async () => mockProgram;

    try {
      let responseBody = null;
      let responseStatus = null;
      const req = {
        params: { checkinId: '99' },
        body: {
          coach_notes: 'ملاحظات الكوتش المعتمدة',
          custom_macros: { calories: 1850, protein: 155, carbs: 180, fats: 48 }
        }
      };
      const res = {
        status: (code) => {
          responseStatus = code;
          return {
            json: (data) => { responseBody = data; }
          };
        }
      };

      await approveCheckin(req, res);

      assert.equal(responseStatus, 200);
      assert.equal(responseBody.success, true);
      assert.equal(mockCheckin.status, 'APPROVED');
      assert.equal(mockCheckin.coach_notes, 'ملاحظات الكوتش المعتمدة');
      assert.ok(savedProgData);
      assert.equal(savedProgData.nutrition.targets.calories, 1850);
      assert.equal(savedProgData.nutrition.targets.protein, 155);
      assert.equal(savedProgData.nutrition.targets.carbs, 180);
      assert.equal(savedProgData.nutrition.targets.fats, 48);
      assert.equal(savedProgData.nutrition_program.macro_targets.calories_kcal, 1850);
      assert.equal(savedProgData.nutrition_program.macro_targets.protein_g, 155);
      assert.equal(savedProgData.nutrition_program.macro_targets.carb_g, 180);
      assert.equal(savedProgData.nutrition_program.macro_targets.fat_g, 48);
    } finally {
      CheckinSubmission.findByPk = origFindCheckin;
      Program.findOne = origFindProgram;
    }
  });

  await t.test('11. Case 11: FALSE_PLATEAU_DETECTED locks calories when plateau is driven by constipation + poor sleep (False Plateau Triad)', () => {
    const result = evaluateWeeklyCheckinAudit({
      clientProfile: { name: 'سامح', current_daily_calories: 2100, protein_g: 170, carbs_g: 225, fat_g: 55 },
      previousWeekData: { weight_kg: 82.0, waist_cm: 86.0, consecutive_plateau_weeks: 1 },
      currentCheckin: {
        current_weight_kg: 82.0,
        waist_circumference_cm: 86.0,
        overall_adherence_percent: 92,
        bowel_regularity: 'CONSTIPATED',
        sleep_stress_composite: 2
      }
    });

    assert.equal(result.decision_code, CHECKIN_DECISION_CODES.FALSE_PLATEAU_DETECTED);
    assert.equal(result.action_type, 'MAINTAIN');
    assert.equal(result.calorie_adjustment, 0);
    assert.equal(result.next_week_calories, 2100);
    assert.ok(result.coach_action_summary_ar.includes('ثبات زائف'));
  });

  await t.test('12. Case 12: OCCUPATIONAL_NEAT_LOCK prevents calorie cut for desk worker during normal work week', () => {
    const result = evaluateWeeklyCheckinAudit({
      clientProfile: { name: 'كريم', occupation_type: 'DESK_OFFICE', current_daily_calories: 2000, protein_g: 160, carbs_g: 210, fat_g: 50 },
      previousWeekData: { weight_kg: 85.0, waist_cm: 89.0, consecutive_plateau_weeks: 1 },
      currentCheckin: {
        current_weight_kg: 85.1,
        waist_circumference_cm: 89.0,
        overall_adherence_percent: 90,
        lifestyle_variance: 'NORMAL_WORK',
        bowel_regularity: 'REGULAR',
        sleep_stress_composite: 4
      }
    });

    assert.equal(result.decision_code, CHECKIN_DECISION_CODES.OCCUPATIONAL_NEAT_LOCK);
    assert.equal(result.action_type, 'MAINTAIN');
    assert.equal(result.calorie_adjustment, 0);
    assert.equal(result.next_week_calories, 2000);
    assert.ok(result.coach_action_summary_ar.includes('العمل المكتبي') || result.coach_action_summary_ar.includes('مكتبي'));
  });

  await t.test('13. Case 13: TRAVEL_WEEK_PREVIEW triggers travel preparation forward-looking guidance', () => {
    const result = evaluateWeeklyCheckinAudit({
      clientProfile: { name: 'ماجد', current_daily_calories: 2200, protein_g: 180, carbs_g: 240, fat_g: 60 },
      previousWeekData: { weight_kg: 79.0, waist_cm: 83.0 },
      currentCheckin: {
        current_weight_kg: 78.8,
        waist_circumference_cm: 82.8,
        overall_adherence_percent: 88,
        next_week_travel: true
      }
    });

    assert.equal(result.decision_code, CHECKIN_DECISION_CODES.TRAVEL_WEEK_PREVIEW);
    assert.equal(result.action_type, 'TRAVEL_PREP');
    assert.equal(result.calorie_adjustment, 0);
    assert.ok(result.coach_action_summary_ar.includes('سفر مرتقب') || result.coach_action_summary_ar.includes('السفر'));
  });
});
