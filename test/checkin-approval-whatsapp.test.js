import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCheckinApprovalWhatsAppMessage } from '../src/execution-engines/checkin-approval-whatsapp.js';

test('Check-in Approval WhatsApp Summary Suite', async (suite) => {
  await suite.test('1. Generates structured approval message with weight loss and macros', () => {
    const msg = generateCheckinApprovalWhatsAppMessage({
      clientName: 'أحمد محمود',
      clientCode: '104',
      weekNumber: 3,
      currentWeight: 84.5,
      weightDiff: -0.7,
      waistCurrent: 86,
      waistDiff: -1.5,
      macros: { calories: 2100, protein: 160, carbs: 220, fats: 60 },
      cardioTarget: '30 دقيقة كارديو خفيف 4 أيام أسبوعياً',
      coachNotes: 'التزم بشرب 3.5 لتر ماء ووزع وجباتك بانتظام.',
      appBaseUrl: 'https://zakaria.fit'
    });

    assert.ok(msg.includes('عاش يا أحمد! تم مراجعة واعتماد تقييمك للأسبوع 3 بنجاح.'));
    assert.ok(msg.includes('الميزان الحالي: 84.5 كجم (-0.7 كجم عن الأسبوع السابق)'));
    assert.ok(msg.includes('محيط الخصر: 86 سم (-1.5 سم)'));
    assert.ok(msg.includes('الأهداف الغذائية المعتمدة: 2100 سعرة (بروتين 160 جم | كارب 220 جم | دهون 60 جم)'));
    assert.ok(msg.includes('خطة الكارديو والنشاط: 30 دقيقة كارديو خفيف 4 أيام أسبوعياً'));
    assert.ok(msg.includes('التزم بشرب 3.5 لتر ماء'));
    assert.ok(msg.includes('https://zakaria.fit/client?code=104'));
    assert.ok(!/[^\u0000-\u007F\u0600-\u06FF\s.,:;!?()[\]{}<>=+/%#•\-_]/.test(msg)); // No emojis
  });

  await suite.test('2. Handles weight plateau / stall gracefully with positive reinforcement', () => {
    const msg = generateCheckinApprovalWhatsAppMessage({
      clientName: 'سارة خالد',
      clientCode: '205',
      weekNumber: 2,
      currentWeight: 68.0,
      weightDiff: 0,
      macros: { calories: 1750, protein: 130 },
      coachNotes: 'ثبات طبيعي بسبب احتباس سوائل ما بعد بداية الدايت، مكملين بنفس الخطة.',
      appBaseUrl: 'https://zakaria.fit'
    });

    assert.ok(msg.includes('عاش يا سارة!'));
    assert.ok(msg.includes('الميزان الحالي: 68 كجم (ثبات ممتاز)'));
    assert.ok(msg.includes('1750 سعرة'));
    assert.ok(msg.includes('ثبات طبيعي'));
  });

  await suite.test('3. Handles lean bulk weight increase properly', () => {
    const msg = generateCheckinApprovalWhatsAppMessage({
      clientName: 'محمود عبد الله',
      clientCode: '310',
      weekNumber: 4,
      currentWeight: 76.4,
      weightDiff: 0.3,
      macros: { calories: 2800, protein: 170, carbs: 360, fats: 70 },
      appBaseUrl: 'https://zakaria.fit'
    });

    assert.ok(msg.includes('الميزان الحالي: 76.4 كجم (+0.3 كجم عن الأسبوع السابق)'));
    assert.ok(msg.includes('https://zakaria.fit/client?code=310'));
  });

  await suite.test('4. Omits missing optional fields cleanly without undefined or null', () => {
    const msg = generateCheckinApprovalWhatsAppMessage({
      clientName: 'كريم حسن',
      clientCode: '401',
      weekNumber: 1
    });

    assert.ok(!msg.includes('undefined'));
    assert.ok(!msg.includes('null'));
    assert.ok(msg.includes('عاش يا كريم!'));
    assert.ok(msg.includes('https://zakaria.fit/client?code=401'));
  });
});
