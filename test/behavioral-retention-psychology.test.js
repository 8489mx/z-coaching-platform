import test from 'node:test';
import assert from 'node:assert/strict';

import {
  compileFourStepFeedback,
  evaluatePreChurnSignals,
  generateRoadmapRenewalScript,
  handleBingeRelapseRecovery,
  getPlugAndPlayWhatsAppScript,
  WHATSAPP_TEMPLATES
} from '../src/execution-engines/behavioral-retention-psychology-engine.js';

test('Behavioral Retention, Communication & Psychology Suite', async (t) => {

  await t.test('1. 4-Step Clinical Feedback Framework: Structured & Actionable', () => {
    const feedback = compileFourStepFeedback({
      clientName: 'محمود',
      microWin: 'نزول 1.5 سم من الخصر مع ثبات أوزان السكوات.',
      physiologicalWhy: 'ثبات الميزان طبيعي بسبب قلة النوم واحتباس الماء.',
      actionableDirective: 'زيادة الكارب 30 جم في أيام الأرجل ورفع الخطوات لـ 8500.',
      psychologicalReassurance: 'ملتزمين بالخطة ومستني أشوف أوزانك بكرة!'
    });

    assert.equal(feedback.client_name, 'محمود');
    assert.ok(feedback.formatted_feedback_text.includes('[توثيق الإنجاز]'));
    assert.ok(feedback.formatted_feedback_text.includes('[التحليل الفسيولوجي]'));
    assert.ok(feedback.formatted_feedback_text.includes('[التوجيه التنفيذي]'));
    assert.ok(feedback.formatted_feedback_text.includes('[التثبيت النفسي]'));
  });

  await t.test('2. Pre-Churn Early Warning System: Signal Detection', () => {
    // Case 1: Inactivity 3 days -> High Risk
    const churn1 = evaluatePreChurnSignals({
      consecutiveInactiveDays: 3,
      checkinWordCount: 15,
      lowSleepEnergyStreakDays: 1
    });
    assert.equal(churn1.is_at_risk, true);
    assert.equal(churn1.risk_level, 'HIGH');
    assert.ok(churn1.detected_flags.some((f) => f.signal_type === 'INACTIVITY_3_DAYS'));

    // Case 2: Terse checkin (3 words) -> Medium Risk
    const churn2 = evaluatePreChurnSignals({
      consecutiveInactiveDays: 0,
      checkinWordCount: 3,
      lowSleepEnergyStreakDays: 1
    });
    assert.equal(churn2.is_at_risk, true);
    assert.ok(churn2.detected_flags.some((f) => f.signal_type === 'TERSE_CHECKIN_ANSWERS'));

    // Case 3: Chronic low sleep & energy 5 days -> Critical Risk
    const churn3 = evaluatePreChurnSignals({
      consecutiveInactiveDays: 0,
      checkinWordCount: 20,
      lowSleepEnergyStreakDays: 5
    });
    assert.equal(churn3.risk_level, 'CRITICAL');
    assert.ok(churn3.detected_flags.some((f) => f.signal_type === 'CHRONIC_LOW_SLEEP_ENERGY_5_DAYS'));
  });

  await t.test('3. Roadmap-Based Renewal Engine: Value Anchoring', () => {
    // 5 days before
    const r5 = generateRoadmapRenewalScript({ daysRemaining: 5, clientName: 'كابتن عمر' });
    assert.equal(r5.stage, 'RADAR_1_MILESTONE_CELEBRATION');

    // 3 days before -> Seat reservation & Phase 2 roadmap
    const r3 = generateRoadmapRenewalScript({ daysRemaining: 3, clientName: 'كابتن عمر' });
    assert.equal(r3.stage, 'RADAR_2_SEAT_RESERVATION_ROADMAP');
    assert.ok(r3.message_ar.includes('Phase 2'));
    assert.ok(r3.message_ar.includes('مكانك'));

    // Expiration day
    const r0 = generateRoadmapRenewalScript({ daysRemaining: 0, clientName: 'كابتن عمر' });
    assert.equal(r0.stage, 'EXPIRATION_DAY_ACTION');
    assert.ok(r0.message_ar.includes('تجديد اشتراكك'));
  });

  await t.test('4. Anti-Guilt Relapse Recovery & Never Miss Twice Rule', () => {
    const recovery = handleBingeRelapseRecovery({ bingeMealsCount: 2, missedWorkoutDays: 1 });
    assert.equal(recovery.strategy, 'ANTI_GUILT_NEXT_MEAL_RESET');
    assert.ok(recovery.never_miss_twice_rule_ar.includes('تفويت يومين متتاليين'));
  });

  await t.test('5. Plug-and-Play WhatsApp Scripts Matrix & 1-Click Dispatch URL', () => {
    const onboarding = getPlugAndPlayWhatsAppScript({
      scriptType: 'DAY_1_ONBOARDING_KICKOFF',
      clientName: 'طارق',
      customParam: 'https://zcoaching.com/app/tarek'
    });
    assert.equal(onboarding.success, true);
    assert.ok(onboarding.whatsapp_direct_url.startsWith('https://wa.me/?text='));
    assert.ok(onboarding.message_text.includes('طارق'));

    const stall = getPlugAndPlayWhatsAppScript({
      scriptType: 'SCALE_STALL_REASSURANCE',
      clientName: 'كريم'
    });
    assert.equal(stall.success, true);
    assert.ok(stall.message_text.includes('Body Recomposition'));
  });

});
