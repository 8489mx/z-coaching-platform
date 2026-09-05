import test from 'node:test';
import assert from 'node:assert/strict';

import { 
  CARD_FORMATS, 
  calculateTransformationStats, 
  buildTransformationWhatsAppShare 
} from '../frontend/src/utils/transformationCardGenerator.js';

test('1. Transformation Card Engine - Provides all 3 standard aspect ratio formats', () => {
  assert.ok(CARD_FORMATS.PORTRAIT_4_5);
  assert.strictEqual(CARD_FORMATS.PORTRAIT_4_5.width, 1080);
  assert.strictEqual(CARD_FORMATS.PORTRAIT_4_5.height, 1350);

  assert.ok(CARD_FORMATS.SQUARE_1_1);
  assert.strictEqual(CARD_FORMATS.SQUARE_1_1.width, 1080);
  assert.strictEqual(CARD_FORMATS.SQUARE_1_1.height, 1080);

  assert.ok(CARD_FORMATS.STORY_9_16);
  assert.strictEqual(CARD_FORMATS.STORY_9_16.width, 1080);
  assert.strictEqual(CARD_FORMATS.STORY_9_16.height, 1920);
});

test('2. Transformation Card Engine - Accurately calculates fat loss and waist reduction stats', () => {
  const stats = calculateTransformationStats({
    beforeWeight: 88.5,
    afterWeight: 80.2,
    beforeWaist: 94,
    afterWaist: 82,
    beforeWeek: 1,
    afterWeek: 9,
    adherence: 95
  });

  assert.strictEqual(stats.weightDiff, -8.3);
  assert.strictEqual(stats.waistDiff, -12);
  assert.strictEqual(stats.weeksCount, 8);
  assert.strictEqual(stats.isWeightLoss, true);
  assert.strictEqual(stats.isWaistLoss, true);
  assert.ok(stats.weightText.includes('8.3 كجم نزول'));
  assert.ok(stats.waistText.includes('12 سم نزول'));
  assert.strictEqual(stats.adherenceRate, 95);
});

test('3. Transformation Card Engine - Accurately calculates muscle gain progression', () => {
  const stats = calculateTransformationStats({
    beforeWeight: 68.0,
    afterWeight: 72.4,
    beforeWaist: 76,
    afterWaist: 77,
    beforeWeek: 0,
    afterWeek: 12,
    adherence: 98
  });

  assert.strictEqual(stats.weightDiff, 4.4);
  assert.strictEqual(stats.waistDiff, 1);
  assert.strictEqual(stats.weeksCount, 12);
  assert.strictEqual(stats.isWeightLoss, false);
  assert.ok(stats.weightText.includes('+4.4 كجم زيادة'));
  assert.strictEqual(stats.adherenceRate, 98);
});

test('4. Transformation Card Engine - Builds executive WhatsApp share text with Arabic RTL and zero emojis', () => {
  const msg = buildTransformationWhatsAppShare({
    client: { code: '12', name: 'أحمد علي' },
    beforeData: { weight: 85, waist: 90, week: 0 },
    afterData: { weight: 77, waist: 80, week: 8 }
  });

  assert.ok(msg.includes('#12'));
  assert.ok(msg.includes('Z Coaching'));
  assert.ok(msg.includes('8 أسابيع'));
  assert.ok(msg.includes('فارق الوزن'));
  // Ensure no emojis
  assert.strictEqual(/[\u{1F300}-\u{1F9FF}]/u.test(msg), false);
});
