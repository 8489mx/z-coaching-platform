import test from 'node:test';
import assert from 'node:assert/strict';

import {
  generateWhatsAppLink,
  getTriageWhatsAppAction
} from '../src/utils/whatsapp-generator.js';

import {
  REMINDER_CATEGORIES,
  MESSAGE_TEMPLATES,
  compileReminderMessage,
  generateWhatsAppUrl,
  formatWhatsAppPhone
} from '../frontend/src/utils/whatsappRemindersEngine.js';

test('WhatsApp Generator Suite', async (t) => {

  await t.test('1. generateWhatsAppLink formats Egyptian phone numbers and encodes message', () => {
    const link = generateWhatsAppLink('01012345678', 'صباح الخير يا بطل');
    assert.ok(link.startsWith('https://wa.me/201012345678?text='));
    assert.ok(link.includes('%D8%B5%D8%A8%D8%A7%D8%AD'));
  });

  await t.test('2. getTriageWhatsAppAction generates correct action and message for RENEWAL_ALERT', () => {
    const action = getTriageWhatsAppAction(
      { name: 'أحمد', phone: '01122334455', days_remaining: 3 },
      'RENEWAL_ALERT'
    );
    assert.ok(action.url.startsWith('https://wa.me/201122334455?text='));
    assert.ok(action.message_text.includes('أحمد'));
    assert.ok(action.message_text.includes('3 أيام'));
    assert.ok(action.message_text.includes('مقعدك'));
  });

  await t.test('3. getTriageWhatsAppAction handles RADAR_RENEWAL_UPCOMING', () => {
    const action = getTriageWhatsAppAction(
      { name: 'سارة', phone: '01234567890', days_remaining: 5 },
      'RADAR_RENEWAL_UPCOMING'
    );
    assert.ok(action.url.startsWith('https://wa.me/201234567890?text='));
    assert.ok(action.message_text.includes('سارة'));
    assert.ok(action.message_text.includes('حجز مكانك'));
  });

  await t.test('4. getTriageWhatsAppAction handles APPROVE_CHECKIN', () => {
    const action = getTriageWhatsAppAction(
      { name: 'محمد', phone: '01511223344' },
      'APPROVE_CHECKIN'
    );
    assert.ok(action.message_text.includes('التشك إن'));
    assert.ok(action.message_text.includes('خطتك الجديدة جاهزة'));
  });

  await t.test('5. getTriageWhatsAppAction handles PLATEAU_REVIEW', () => {
    const action = getTriageWhatsAppAction(
      { name: 'كريم', phone: '01099887766' },
      'PLATEAU_REVIEW'
    );
    assert.ok(action.message_text.includes('ثبات في الميزان'));
  });

  await t.test('6. compileReminderMessage replaces variables including direct URLs', () => {
    const tpl = MESSAGE_TEMPLATES[REMINDER_CATEGORIES.CHECKIN_DUE].template;
    const msg = compileReminderMessage(tpl, {
      client_name: 'أحمد محمود',
      checkin_url: 'https://app.zcc.com/app/checkin'
    });
    assert.ok(msg.includes('أحمد محمود'));
    assert.ok(msg.includes('https://app.zcc.com/app/checkin'));
    assert.ok(!msg.includes('{client_name}'));
    assert.ok(!msg.includes('{checkin_url}'));
  });

  await t.test('7. formatWhatsAppPhone handles Egyptian numbers and international prefix', () => {
    assert.equal(formatWhatsAppPhone('01012345678'), '201012345678');
    assert.equal(formatWhatsAppPhone('00201012345678'), '201012345678');
    assert.equal(formatWhatsAppPhone('+201012345678'), '201012345678');
  });

  await t.test('8. generateWhatsAppUrl outputs proper wa.me link with encoded text', () => {
    const url = generateWhatsAppUrl('01098765432', 'مرحباً يا بطل');
    assert.ok(url.startsWith('https://wa.me/201098765432?text='));
    assert.ok(url.includes('%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B'));
  });

});
