import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ACQUISITION_CHANNELS,
  INTERACTION_TYPES,
  COACH_DIRECTIVE_TEMPLATES,
  parseClientCrmMeta,
  serializeClientCrmMeta,
  appendClientInteractionLog,
  separateClientFacingDirectives
} from '../src/execution-engines/coach-crm-and-templates-engine.js';

import {
  REMINDER_CATEGORIES,
  MESSAGE_TEMPLATES,
  compileReminderMessage,
  formatWhatsAppPhone,
  generateWhatsAppUrl
} from '../frontend/src/utils/whatsappRemindersEngine.js';

const EMOJI_REGEX = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;

test('Phase 14: Coach CRM, Acquisition Tracking, Directive Templates & WhatsApp Reminders Suite (Unit K, K-01..K-06)', async (suite) => {

  await suite.test('1. Client Acquisition Channels & Referral Tracking (K-01): Parses and serializes structured CRM metadata', () => {
    // Channel definitions
    assert.equal(ACQUISITION_CHANNELS.INSTAGRAM.code, 'INSTAGRAM');
    assert.equal(ACQUISITION_CHANNELS.TIKTOK.code, 'TIKTOK');
    assert.equal(ACQUISITION_CHANNELS.YOUTUBE.code, 'YOUTUBE');
    assert.equal(ACQUISITION_CHANNELS.WEBSITE.code, 'WEBSITE');
    assert.equal(ACQUISITION_CHANNELS.REFERRAL.code, 'REFERRAL');
    assert.equal(ACQUISITION_CHANNELS.DIRECT_COACH.code, 'DIRECT_COACH');

    // Parse empty / null notes
    const emptyMeta = parseClientCrmMeta('');
    assert.equal(emptyMeta.acquisition_channel, 'OTHER');
    assert.equal(emptyMeta.referral_code, null);
    assert.deepEqual(emptyMeta.interactions, []);

    // Serialize new CRM metadata into clean notes
    const existingNotes = 'المشترك يفضل التدريب في الصباح الباكر.';
    const serialized = serializeClientCrmMeta(existingNotes, {
      acquisition_channel: 'INSTAGRAM',
      referral_code: 'CAPTAIN_2026',
      referred_by: '105'
    });

    assert.ok(serialized.includes(existingNotes));
    assert.ok(serialized.includes('[CRM_META:'));

    // Parse back
    const parsed = parseClientCrmMeta(serialized);
    assert.equal(parsed.acquisition_channel, 'INSTAGRAM');
    assert.equal(parsed.referral_code, 'CAPTAIN_2026');
    assert.equal(parsed.referred_by, '105');
  });

  await suite.test('2. Lightweight Communication & Interaction Log (K-01): Appends calls and feedback without chat bloat', () => {
    let notes = 'سجل مبدئي للمشترك';

    // Append welcome call
    notes = appendClientInteractionLog(notes, {
      type: INTERACTION_TYPES.WELCOME_CALL.code,
      summary: 'مكالمة ترحيب وشرح آلية استخدام تطبيق الموبايل واستمارة المتابعة',
      logged_by: 'COACH_KAREEM'
    });

    let meta = parseClientCrmMeta(notes);
    assert.equal(meta.interactions.length, 1);
    assert.equal(meta.interactions[0].type, 'WELCOME_CALL');
    assert.match(meta.interactions[0].summary, /مكالمة ترحيب/);
    assert.equal(meta.interactions[0].logged_by, 'COACH_KAREEM');

    // Append checkin feedback voice note
    notes = appendClientInteractionLog(notes, {
      type: INTERACTION_TYPES.CHECKIN_FEEDBACK.code,
      summary: 'إرسال ملاحظات صوتية على تقييم الأسبوع الثاني والتأكيد على شرب الماء',
      logged_by: 'COACH_ASSISTANT'
    });

    meta = parseClientCrmMeta(notes);
    assert.equal(meta.interactions.length, 2);
    assert.equal(meta.interactions[0].type, 'CHECKIN_FEEDBACK'); // Newest first
    assert.equal(meta.interactions[1].type, 'WELCOME_CALL');
  });

  await suite.test('3. Reusable Directive Templates & Client Guidance Presets (K-05): Strict separation of client vs internal coach rationale', () => {
    assert.ok(COACH_DIRECTIVE_TEMPLATES.length >= 6);

    for (const t of COACH_DIRECTIVE_TEMPLATES) {
      assert.ok(t.id);
      assert.ok(t.title_ar);
      assert.ok(t.client_facing_ar);
      assert.ok(t.internal_rationale_ar);
      assert.ok(Array.isArray(t.tags));
      assert.equal(EMOJI_REGEX.test(t.title_ar), false);
      assert.equal(EMOJI_REGEX.test(t.client_facing_ar), false);
      assert.equal(EMOJI_REGEX.test(t.internal_rationale_ar), false);
    }

    // Test separation function
    const selectedIds = ['COOKED_WEIGHT_STANDARD', 'RIR_INTENSITY_PRESERVATION', 'CAFFEINE_SLEEP_WINDOW'];
    const separated = separateClientFacingDirectives(selectedIds);

    // Client text has bullet points and instructions
    assert.match(separated.client_text, /قاعدة الوزن بعد الطهي حصراً/);
    assert.match(separated.client_text, /الانضباط باحتياطي التكرارات RIR/);
    assert.match(separated.client_text, /فاصل أمان الكافيين والنوم العميق/);

    // Client text MUST NOT contain internal physiological rationales
    assert.equal(separated.client_text.includes('التباين الحجمي'), false);
    assert.equal(separated.client_text.includes('الإجهاد الجهازى'), false);
    assert.equal(separated.client_text.includes('مستقبلات الأدينوزين'), false);

    // Internal records contain the scientific rationales
    assert.equal(separated.internal_records.length, 3);
    assert.match(separated.internal_records[0].rationale, /التباين الحجمي/);
    assert.match(separated.internal_records[1].rationale, /الإجهاد الجهازى/);
    assert.match(separated.internal_records[2].rationale, /مستقبلات الأدينوزين/);
  });

  await suite.test('4. WhatsApp Reminders & 1-Click Link Generation (K-02): URL formatting and variable compilation', () => {
    // Template compilation
    const rawTemplate = MESSAGE_TEMPLATES[REMINDER_CATEGORIES.RENEWAL_UPCOMING].template;
    const compiled = compileReminderMessage(rawTemplate, {
      client_name: 'أحمد علي',
      package_name: 'باقة ELITE 4 شهور',
      days_left: 5,
      renewal_url: 'https://zcoaching.com/renew/z-101'
    });

    assert.match(compiled, /أحمد علي/);
    assert.match(compiled, /باقة ELITE 4 شهور/);
    assert.match(compiled, /5 أيام/);
    assert.match(compiled, /https:\/\/zcoaching.com\/renew\/z-101/);

    // Phone normalization (Egypt)
    assert.equal(formatWhatsAppPhone('01012345678'), '201012345678');
    assert.equal(formatWhatsAppPhone('+201012345678'), '201012345678');

    // Phone normalization (Saudi Arabia)
    assert.equal(formatWhatsAppPhone('0501234567'), '966501234567');
    assert.equal(formatWhatsAppPhone('501234567'), '966501234567');

    // WhatsApp URL generation
    const waUrl = generateWhatsAppUrl('01012345678', compiled);
    assert.match(waUrl, /^https:\/\/wa\.me\/201012345678\?text=/);
    assert.ok(waUrl.includes(encodeURIComponent('أحمد علي')));
    assert.equal(EMOJI_REGEX.test(waUrl), false);
  });

  await suite.test('5. Zero Emoji & Invariant Enforcement: All templates and records strictly free of emojis', () => {
    for (const [key, t] of Object.entries(MESSAGE_TEMPLATES)) {
      assert.equal(EMOJI_REGEX.test(t.title), false, `Template title has emoji: ${key}`);
      assert.equal(EMOJI_REGEX.test(t.template), false, `Template text has emoji: ${key}`);
      assert.equal(EMOJI_REGEX.test(t.category_label), false, `Category label has emoji: ${key}`);
    }

    for (const ch of Object.values(ACQUISITION_CHANNELS)) {
      assert.equal(EMOJI_REGEX.test(ch.name_ar), false, `Channel name has emoji: ${ch.code}`);
    }

    for (const it of Object.values(INTERACTION_TYPES)) {
      assert.equal(EMOJI_REGEX.test(it.name_ar), false, `Interaction name has emoji: ${it.code}`);
    }
  });

});
