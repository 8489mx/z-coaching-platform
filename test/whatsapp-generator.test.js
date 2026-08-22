import test from 'node:test';
import assert from 'node:assert/strict';

import {
  generateWhatsAppLink,
  getTriageWhatsAppAction
} from '../src/utils/whatsapp-generator.js';

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

});
