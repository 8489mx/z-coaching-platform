import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateWeeklyCheckinAudit,
  evaluateWeeklyProgress,
  CHECKIN_DECISION_CODES
} from '../src/execution-engines/weekly-audit-engine.js';

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
});
