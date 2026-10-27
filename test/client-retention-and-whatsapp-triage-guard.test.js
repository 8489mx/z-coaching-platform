import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  calculateClientRetentionHealth,
  batchEvaluateRetentionRadar
} from '../src/execution-engines/client-retention-radar-engine.js';
import {
  evaluateClientCheckinOverdue,
  resolveCheckinCycleDays,
  CHECKIN_CYCLE_DAYS_BY_TIER
} from '../src/execution-engines/overdue-checkin-engine.js';
import {
  formatWhatsAppPhone,
  generateWhatsAppUrl,
  compileReminderMessage,
  MESSAGE_TEMPLATES,
  REMINDER_CATEGORIES
} from '../frontend/src/utils/whatsappRemindersEngine.js';

const EMOJI_REGEX = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;

test('Phase 7: Client Retention & 1-Click WhatsApp Triage Guard Suite', async (suite) => {

  await suite.test('1. WhatsApp Phone & URL Normalization: Formats Egyptian and Saudi numbers without loss or malformed prefixes', () => {
    // Egyptian local phone numbers (01xxxxxxxxx -> 201xxxxxxxxx)
    assert.equal(formatWhatsAppPhone('01012345678'), '201012345678');
    assert.equal(formatWhatsAppPhone('01198765432'), '201198765432');
    assert.equal(formatWhatsAppPhone('+201234567890'), '201234567890');

    // Saudi numbers (05xxxxxxxx -> 9665xxxxxxxx)
    assert.equal(formatWhatsAppPhone('0512345678'), '966512345678');
    assert.equal(formatWhatsAppPhone('512345678'), '966512345678');
    assert.equal(formatWhatsAppPhone('+966512345678'), '966512345678');

    // WhatsApp URL generation
    const url = generateWhatsAppUrl('01012345678', 'رسالة تجديد الاشتراك');
    assert.ok(url.startsWith('https://wa.me/201012345678?text='));
    assert.ok(url.includes(encodeURIComponent('رسالة تجديد الاشتراك')));
  });

  await suite.test('2. Overdue Checkin Engine: Respects package cadences (MAX 7 days vs ELITE 14 days) and 48h grace period', () => {
    const now = new Date('2026-10-27T12:00:00Z');

    // 1. MAX Trainee: 7 days cycle + 2 days grace = 9 days threshold
    const maxClient = {
      subscription_package: 'MAX',
      status: 'ACTIVE',
      checkinSubmissions: [
        { submitted_at: new Date('2026-10-19T12:00:00Z') } // 8 days ago -> not overdue yet (within grace)
      ]
    };
    const maxAuditWithinGrace = evaluateClientCheckinOverdue(maxClient, now);
    assert.equal(maxAuditWithinGrace.isOverdue, false, 'MAX client at 8 days must not be overdue (48h grace)');

    // MAX at 10 days ago -> overdue by 3 days
    maxClient.checkinSubmissions = [{ submitted_at: new Date('2026-10-17T12:00:00Z') }];
    const maxAuditOverdue = evaluateClientCheckinOverdue(maxClient, now);
    assert.equal(maxAuditOverdue.isOverdue, true, 'MAX client at 10 days must be overdue');
    assert.equal(maxAuditOverdue.daysOverdue, 3);

    // 2. ELITE Trainee: 14 days cycle + 2 days grace = 16 days threshold
    const eliteClient = {
      subscription_package: 'ELITE_4M',
      status: 'ACTIVE',
      checkinSubmissions: [
        { submitted_at: new Date('2026-10-15T12:00:00Z') } // 12 days ago -> well within 14-day cycle
      ]
    };
    const eliteAuditOnTime = evaluateClientCheckinOverdue(eliteClient, now);
    assert.equal(eliteAuditOnTime.isOverdue, false, 'ELITE client at 12 days must not be overdue');

    // ELITE at 17 days ago -> overdue by 3 days
    eliteClient.checkinSubmissions = [{ submitted_at: new Date('2026-10-10T12:00:00Z') }];
    const eliteAuditOverdue = evaluateClientCheckinOverdue(eliteClient, now);
    assert.equal(eliteAuditOverdue.isOverdue, true, 'ELITE client at 17 days must be overdue');
    assert.equal(eliteAuditOverdue.daysOverdue, 3);
  });

  await suite.test('3. Client Retention Radar Engine: Scores health and stratifies into HIGH_PROPENSITY, NURTURE_ENGAGE, and AT_RISK', () => {
    // Trainee A: High adherence (95%), steady weight drop (-3.2 kg), urgent renewal (5 days left)
    const healthyTrainee = calculateClientRetentionHealth({
      client: {
        name: 'عمرو مصطفى',
        primary_goal: 'fat_loss',
        initial_weight: 90,
        weight_kg: 86.8
      },
      checkinHistory: [
        { weight_kg: 90, diet_adherence_percentage: 95, workout_adherence_percentage: 95, sleep_quality: 5, stress_level: 2 },
        { weight_kg: 88, diet_adherence_percentage: 90, workout_adherence_percentage: 95, sleep_quality: 4, stress_level: 2 },
        { weight_kg: 86.8, diet_adherence_percentage: 95, workout_adherence_percentage: 95, sleep_quality: 5, stress_level: 1 }
      ],
      subscription: { days_left: 5 },
      currentWeekNumber: 4
    });

    assert.ok(healthyTrainee.total_retention_score >= 80);
    assert.equal(healthyTrainee.category, 'HIGH_PROPENSITY');
    assert.equal(healthyTrainee.is_urgent_renewal, true);
    assert.ok(healthyTrainee.whatsapp_outreach_message.includes('عمرو مصطفى'));
    assert.ok(healthyTrainee.whatsapp_outreach_message.includes('5 يوماً'));

    // Trainee B: Low adherence (60%), weight stall, poor sleep, high stress
    const atRiskTrainee = calculateClientRetentionHealth({
      client: {
        name: 'سامح إبراهيم',
        primary_goal: 'fat_loss',
        initial_weight: 85,
        weight_kg: 85.5
      },
      checkinHistory: [
        { weight_kg: 85, diet_adherence_percentage: 60, workout_adherence_percentage: 65, sleep_quality: 2, stress_level: 5 },
        { weight_kg: 85.5, diet_adherence_percentage: 55, workout_adherence_percentage: 60, sleep_quality: 1, stress_level: 5 }
      ],
      subscription: { days_left: 12 },
      currentWeekNumber: 4
    });

    assert.ok(atRiskTrainee.total_retention_score < 60);
    assert.equal(atRiskTrainee.category, 'AT_RISK');
    assert.ok(atRiskTrainee.risk_factors.length >= 2);
    assert.ok(atRiskTrainee.recommended_action_ar.includes('تدخل فوري'));

    // Batch evaluation cohort analytics
    const batch = batchEvaluateRetentionRadar([
      { client: { name: 'أ' }, checkinHistory: [], subscription: { days_left: 20 } },
      { client: { name: 'ب' }, checkinHistory: [], subscription: { days_left: 5 } }
    ]);
    assert.equal(batch.total_trainees, 2);
    assert.ok(batch.average_retention_score > 0);
  });

  await suite.test('4. Zero Emojis Compliance: All reminder templates and generated WhatsApp scripts contain zero emojis', () => {
    // Audit all standard message templates
    for (const [key, tplObj] of Object.entries(MESSAGE_TEMPLATES)) {
      const compiled = compileReminderMessage(tplObj.template, {
        client_name: 'أحمد',
        checkin_url: 'https://app.com/checkin',
        app_url: 'https://app.com',
        renewal_url: 'https://app.com/renew',
        training_split: 'Push / Pull / Legs',
        training_days: '4 أيام',
        calories: 2000,
        protein: 160,
        carbs: 220,
        fats: 50,
        cardio_sessions: '3 جلسات',
        daily_steps: '8500 خطوة',
        package_name: 'باقة MAX',
        days_left: 5
      });

      assert.equal(
        EMOJI_REGEX.test(compiled),
        false,
        `Violation: Template "${key}" contains forbidden emojis: ${compiled}`
      );
    }
  });

  await suite.test('5. UI Components Integrity: WhatsAppModal, Drawer Retention Radar and Command Center 1-click triage', () => {
    // 1. WhatsAppModal contains renewal and rescue_overdue templates with zero emojis
    const modalSrc = fs.readFileSync('frontend/src/components/modals/WhatsAppModal.jsx', 'utf8');
    assert.ok(modalSrc.includes('renewal:'), 'WhatsAppModal must define renewal template');
    assert.ok(modalSrc.includes('rescue_overdue:'), 'WhatsAppModal must define rescue_overdue template');
    assert.ok(modalSrc.includes('initialTemplate'), 'WhatsAppModal must accept initialTemplate prop');
    assert.ok(modalSrc.includes('initialCustomText'), 'WhatsAppModal must accept initialCustomText prop');
    assert.equal(EMOJI_REGEX.test(modalSrc), false, 'WhatsAppModal must contain zero emojis');

    // 2. ClientSlideOverDrawer imports Retention Radar and renders health metrics
    const drawerSrc = fs.readFileSync('frontend/src/components/customers/ClientSlideOverDrawer.jsx', 'utf8');
    assert.ok(drawerSrc.includes('calculateClientRetentionHealth'), 'ClientSlideOverDrawer must import calculateClientRetentionHealth');
    assert.ok(drawerSrc.includes('رادار صحة التجديد والاحتفاظ'), 'ClientSlideOverDrawer must render Retention Radar title');
    assert.equal(EMOJI_REGEX.test(drawerSrc), false, 'ClientSlideOverDrawer must contain zero emojis');

    // 3. CoachCommandCenter supports 1-click WhatsApp renewal reminders
    const cccSrc = fs.readFileSync('frontend/src/pages/CoachCommandCenter.jsx', 'utf8');
    assert.ok(cccSrc.includes("action.type === 'RENEWAL' && Boolean(action.phone)"), 'CCC must identify RENEWAL with phone as WhatsApp action');
    assert.ok(cccSrc.includes('تذكير التجديد (واتساب)'), 'CCC must display WhatsApp renewal button text');
    assert.equal(EMOJI_REGEX.test(cccSrc), false, 'CoachCommandCenter must contain zero emojis');
  });

});
