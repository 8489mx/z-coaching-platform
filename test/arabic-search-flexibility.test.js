import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeArabic, arabicSearchMatch, multiFieldArabicMatch } from '../frontend/src/utils/searchUtils.js';

test('1. Arabic Search Engine - Hamza and Alef Variants Flexibility', () => {
  // Alef with Hamza Above (أ), Below (إ), Madda (آ), Wasla (ٱ), Bare Alef (ا)
  assert.equal(arabicSearchMatch('أحمد مصطفى', 'احمد'), true);
  assert.equal(arabicSearchMatch('احمد علي', 'أحمد'), true);
  assert.equal(arabicSearchMatch('إسلام إبراهيم', 'اسلام ابراهيم'), true);
  assert.equal(arabicSearchMatch('آسر ياسين', 'اسر'), true);
  assert.equal(arabicSearchMatch('ٱلتمرين', 'التمرين'), true);
});

test('2. Arabic Search Engine - Taa Marbuta and Haa Flexibility', () => {
  // Taa Marbuta (ة) matches Haa (ه) and vice versa
  assert.equal(arabicSearchMatch('مكرونة مسلوقة', 'مكرونه'), true);
  assert.equal(arabicSearchMatch('كفته مشوية', 'كفتة'), true);
  assert.equal(arabicSearchMatch('جبنة قريش', 'جبنه'), true);
  assert.equal(arabicSearchMatch('فراوله طازجة', 'فراولة'), true);
});

test('3. Arabic Search Engine - Alef Maqsura and Yaa Flexibility', () => {
  // Alef Maqsura (ى) matches Yaa (ي)
  assert.equal(arabicSearchMatch('مصطفى محمود', 'مصطفي'), true);
  assert.equal(arabicSearchMatch('علي حسن', 'على'), true);
  assert.equal(arabicSearchMatch('يسرى', 'يسري'), true);
});

test('4. Arabic Search Engine - Solitary Hamza & Nabira Normalization', () => {
  // Solitary Hamza (ء) and Hamza on Nabira (ئ)
  assert.equal(arabicSearchMatch('شيء آخر', 'شئ'), true);
  assert.equal(arabicSearchMatch('شئ آخر', 'شيء'), true);
  assert.equal(arabicSearchMatch('بئر سبع', 'بير'), true);
});

test('5. Arabic Search Engine - Definite Article (ال) Flexibility', () => {
  // Searching with 'ال' matches target without 'ال'
  assert.equal(arabicSearchMatch('بنش مائل بالبار', 'البنش'), true);
  // Searching without 'ال' matches target with 'ال'
  assert.equal(arabicSearchMatch('تمرين البنش المستوي', 'بنش'), true);
});

test('6. Arabic Search Engine - Prepositions (بال، لل) Flexibility', () => {
  // User types "بالدمبل" -> matches "دمبل" and "الدمبل"
  assert.equal(arabicSearchMatch('تمرين تجميع دمبل', 'بالدمبل'), true);
  // User types "للصدر" -> matches "صدر" and "الصدر"
  assert.equal(arabicSearchMatch('تمارين الصدر العلوي', 'للصدر'), true);
});

test('7. Arabic Search Engine - Gym Slang Transliterations (اسكوات / سكوات)', () => {
  // Initial Alef on foreign terms: اسكوات <-> سكوات
  assert.equal(arabicSearchMatch('سكوات بالبار الخلفي', 'اسكوات'), true);
  assert.equal(arabicSearchMatch('اسكوات حر', 'سكوات'), true);
  assert.equal(arabicSearchMatch('ستريتش عضلي', 'استريتش'), true);
  assert.equal(arabicSearchMatch('استريتش خلفيات', 'ستريتش'), true);
});

test('8. Arabic Search Engine - Multi-token Out-of-Order Matching', () => {
  // Typing "صدر دمبل" matches "بنش مائل بالدمبل للصدر العلوي"
  assert.equal(arabicSearchMatch('بنش مائل بالدمبل للصدر العلوي', 'صدر دمبل'), true);
  assert.equal(arabicSearchMatch('تجديف بار قبضة واسعة للظهر', 'ظهر بار واسع'), true);
});

test('9. Arabic Search Engine - Persian / Urdu Keyboard Letter Normalization', () => {
  // Persian Kaf (ک) matches Arabic Kaf (ك)
  assert.equal(arabicSearchMatch('تكنيك التمرين السليم', 'تکنيك'), true);
  // Persian Yeh (ی) matches Arabic Yaa (ي)
  assert.equal(arabicSearchMatch('تمرين السكوات', 'تمرین'), true);
});

test('10. Arabic Search Engine - Multi-field Search Matching', () => {
  const fields = ['بنش مستوي', 'BARBELL_BENCH_PRESS', 'الصدر الأوسط'];
  assert.equal(multiFieldArabicMatch(fields, 'صدر'), true);
  assert.equal(multiFieldArabicMatch(fields, 'bench'), true);
  assert.equal(multiFieldArabicMatch(fields, 'البنش'), true);
  assert.equal(multiFieldArabicMatch(fields, 'مستوي'), true);
  assert.equal(multiFieldArabicMatch(fields, 'مستوى'), true);
});
