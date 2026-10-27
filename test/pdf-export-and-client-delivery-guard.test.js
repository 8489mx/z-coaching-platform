import test from 'node:test';
import assert from 'node:assert/strict';

import {
  sanitizeCoachNotesForClient,
  generatePrintablePlanHTML,
  generateMasterPdfExportData,
  SMART_GUIDELINES_MATRIX
} from '../src/execution-engines/pdf-export-engine.js';
import {
  getItemPortionMeta,
  formatItemPortionDisplay,
  resolveFoodYieldRule,
  convertPortionCookingYield
} from '../src/execution-engines/kitchen-yield-engine.js';
import { generatePrintablePlanHTML as serverGeneratePrintablePlanHTML } from '../src/utils/pdf-plan-exporter.js';

const EMOJI_REGEX = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;

test('Phase 6: PDF Export & Client Delivery Guard Suite', async (suite) => {

  await suite.test('1. Clinical & Internal Notes Firewall: Strictly sanitizes coach notes and blocks internal clinical leaks', () => {
    // Hostile payload with internal clinical alerts, medical reviews, and diagnostic tags
    const hostileNotes = `
[CLINICAL] تنبيه سريري داخلي: المتدرب يعاني من تمزق في أوتار الكتف
MEDICAL_REVIEW_PROMPT: يتطلب تأكيد المراجعة الطبية قبل الاستمرار
TIER_0_FLAG: HIGH_HYPERTENSION_RISK
تحذير سريري: منع الرفرفة الجانبية الثقيلة
يرجى التركيز على الإحماء الجيد لمدة 10 دقائق وشرب 3.5 لتر ماء موزعة على مدار اليوم.
[INTERNAL_DEBUG] audit_id: 998822
    `.trim();

    const cleanNotes = sanitizeCoachNotesForClient(hostileNotes);

    assert.ok(cleanNotes.includes('يرجى التركيز على الإحماء الجيد لمدة 10 دقائق'));
    assert.ok(cleanNotes.includes('شرب 3.5 لتر ماء موزعة على مدار اليوم'));

    // Verify all internal and clinical leak keywords are purged
    assert.equal(cleanNotes.includes('[CLINICAL]'), false, 'Clinical tag must be stripped');
    assert.equal(cleanNotes.includes('تنبيه سريري داخلي'), false, 'Clinical alert text must be stripped');
    assert.equal(cleanNotes.includes('MEDICAL_REVIEW_PROMPT'), false, 'Medical review prompt must be stripped');
    assert.equal(cleanNotes.includes('TIER_0_FLAG'), false, 'Tier 0 flags must be stripped');
    assert.equal(cleanNotes.includes('تحذير سريري'), false, 'Clinical warning must be stripped');
    assert.equal(cleanNotes.includes('[INTERNAL_DEBUG]'), false, 'Internal debug tag must be stripped');
    assert.equal(cleanNotes.includes('998822'), false, 'Internal ID must be stripped');

    // Test purely clinical notes returns empty string
    const purelyClinical = '[CLINICAL] تحذير سريري: حالة حرجة ولا يوصى بالديدليفت';
    assert.equal(sanitizeCoachNotesForClient(purelyClinical), '', 'Purely clinical text must sanitize to empty string');
  });

  await suite.test('2. HTML Output Firewall: Plan compiler purges clinical alerts and renders only sanitized notes', () => {
    const renderedHtml = generatePrintablePlanHTML({
      client: {
        name: 'كريم عبد الله',
        goal_title: 'خسارة دهون وتنشيف',
        target_calories: 2100,
        target_protein: 170,
        target_carbs: 200,
        target_fats: 60
      },
      plan: {
        coach_notes: '[CLINICAL] تشخيص داخلي\nالتزم بأداء تمارين الكارديو صباحاً على الريق لتحسين حساسية الإنسولين.',
        clinical_alerts: ['تحذير سريري حاد للقلب'],
        clinical_warnings: ['تنبيه الكلى والمكملات'],
        internal_notes: ['سجل تدقيق داخلي سري'],
        medical_review_prompt: 'REQUIRE_CONFIRMATION',
        contraindicated_exercises: ['Barbell Deadlift Behind Back'],
        meals: [
          {
            title_ar: 'وجبة الغداء',
            calories: 550,
            items: [
              { name_ar: 'صدور دجاج مشوية', food_code: 'CHICKEN_BREAST', amount_g: 150, unit: 'جم' },
              { name_ar: 'أرز بسمتي مسلوق', food_code: 'BASMATI_RICE_COOKED', amount_g: 180, unit: 'جم' }
            ]
          }
        ],
        workout: {
          title_ar: 'تمرين السحب والظهر',
          exercises: [
            { name_ar: 'سحب كابل عالي', name_en: 'Lat Pulldown', sets: 3, reps: '10-12', target_rir: 2 }
          ]
        }
      }
    });

    // Valid notes rendered
    assert.ok(renderedHtml.includes('التزم بأداء تمارين الكارديو صباحاً'));

    // Internal clinical fields MUST NEVER be present in the HTML
    assert.equal(renderedHtml.includes('[CLINICAL]'), false);
    assert.equal(renderedHtml.includes('تشخيص داخلي'), false);
    assert.equal(renderedHtml.includes('تحذير سريري حاد للقلب'), false);
    assert.equal(renderedHtml.includes('تنبيه الكلى والمكملات'), false);
    assert.equal(renderedHtml.includes('سجل تدقيق داخلي سري'), false);
    assert.equal(renderedHtml.includes('REQUIRE_CONFIRMATION'), false);
    assert.equal(renderedHtml.includes('Barbell Deadlift Behind Back'), false);
  });

  await suite.test('3. Culinary Yield Engine: Accurately formats raw vs cooked portions across meats, grains, and oats', () => {
    // 150g Cooked Chicken Breast -> ~200g Raw (0.75 factor)
    const chickenMeta = getItemPortionMeta({
      name_ar: 'صدور دجاج مشوية',
      food_code: 'CHICKEN_BREAST',
      amount_g: 150,
      unit: 'جم'
    });
    assert.equal(chickenMeta.is_yield_applicable, true);
    assert.equal(chickenMeta.cooked_g, 150);
    assert.equal(chickenMeta.raw_g, 200);
    assert.ok(chickenMeta.badge_text.includes('150 جم مطبوخ'));
    assert.ok(chickenMeta.badge_text.includes('200 جم نيئ'));

    // 180g Cooked Basmati Rice -> ~72g Raw (2.50 factor)
    const riceMeta = getItemPortionMeta({
      name_ar: 'أرز بسمتي مسلوق',
      food_code: 'BASMATI_RICE_COOKED',
      amount_g: 180,
      unit: 'جم'
    });
    assert.equal(riceMeta.is_yield_applicable, true);
    assert.equal(riceMeta.cooked_g, 180);
    assert.equal(riceMeta.raw_g, 72);
    assert.ok(riceMeta.badge_text.includes('180 جم مطبوخ'));
    assert.ok(riceMeta.badge_text.includes('72 جم نيئ'));

    // 70g Raw Oats -> ~196g Cooked (2.80 factor, RAW base)
    const oatsMeta = getItemPortionMeta({
      name_ar: 'شوفان كامل الحبة',
      food_code: 'OATS_RAW',
      amount_g: 70,
      unit: 'جم'
    });
    assert.equal(oatsMeta.is_yield_applicable, true);
    assert.equal(oatsMeta.raw_g, 70);
    assert.equal(oatsMeta.cooked_g, 196);
    assert.ok(oatsMeta.badge_text.includes('70 جم خام'));
    assert.ok(oatsMeta.badge_text.includes('196 جم مطبوخ'));

    // Count-based items (e.g. 3 eggs)
    const eggMeta = getItemPortionMeta({
      name_ar: 'بيض طازج مسلوق',
      amount_g: 3,
      unit: 'حبات'
    });
    assert.equal(eggMeta.is_yield_applicable, false);
    assert.equal(eggMeta.badge_text, '3 حبات');

    // Display string formatter helper
    const chickenStr = formatItemPortionDisplay({
      name_ar: 'صدور دجاج مشوية',
      food_code: 'CHICKEN_BREAST',
      amount_g: 150,
      unit: 'جم'
    });
    assert.ok(chickenStr.includes('150 جم مطبوخ'));
    assert.ok(chickenStr.includes('200 جم نيئ'));
    assert.ok(chickenStr.includes('صدور دجاج مشوية'));
  });

  await suite.test('4. Dual Portion Display in Rendered PDF: Meals table reflects precise culinary yield metrics', () => {
    const renderedHtml = generatePrintablePlanHTML({
      client: { name: 'سامح فوزي' },
      plan: {
        meals: [
          {
            title_ar: 'وجبة التعافي',
            calories: 600,
            items: [
              { name_ar: 'صدور دجاج مشوية', food_code: 'CHICKEN_BREAST', amount_g: 150, unit: 'جم' },
              { name_ar: 'أرز بسمتي مسلوق', food_code: 'BASMATI_RICE_COOKED', amount_g: 180, unit: 'جم' }
            ]
          }
        ],
        workout: { exercises: [] }
      }
    });

    assert.ok(renderedHtml.includes('150 جم مطبوخ (200 جم نيئ)'));
    assert.ok(renderedHtml.includes('180 جم مطبوخ (72 جم نيئ)'));
  });

  await suite.test('5. Backend & Frontend PDF Engine Parity: Server exporter re-exports unified implementation', () => {
    const sampleInput = {
      client: { name: 'عصام مجدي' },
      plan: {
        coach_notes: '[CLINICAL] سريري\nالتزم بأوقات الراحة',
        meals: [{ title_ar: 'فطور', items: [{ name_ar: 'شوفان', food_code: 'OATS_RAW', amount_g: 50, unit: 'جم' }], calories: 200 }],
        workout: { exercises: [] }
      }
    };

    const frontendHtml = generatePrintablePlanHTML(sampleInput);
    const serverHtml = serverGeneratePrintablePlanHTML(sampleInput);

    assert.equal(serverHtml, frontendHtml, 'Server exporter must match frontend exporter byte-for-byte');
    assert.ok(serverHtml.includes('التزم بأوقات الراحة'));
    assert.equal(serverHtml.includes('[CLINICAL]'), false);
    assert.equal(serverHtml.includes('سريري'), false);
  });

  await suite.test('6. Design Invariants Guard: RTL direction, Zero Emojis, Zero Grocery Lists, Curved Aesthetics', () => {
    const testData = generateMasterPdfExportData({
      client_name: 'حازم شريف',
      client_code: '404',
      package_tier: 'MAX',
      current_week: 2
    });

    const renderedHtml = generatePrintablePlanHTML({
      client: { name: 'حازم شريف' },
      plan: {
        coach_notes: 'الاستمرار هو سر النجاح',
        meals: [{ title_ar: 'غداء', items: [{ name_ar: 'لحم بقري', food_code: 'LEAN_VEAL_BEEF', amount_g: 150, unit: 'جم' }], calories: 400 }],
        workout: { exercises: [] }
      }
    });

    // Zero Emojis invariant
    const jsonStr = JSON.stringify(testData);
    assert.equal(EMOJI_REGEX.test(jsonStr), false, 'PDF export data payload must contain ZERO emojis');
    assert.equal(EMOJI_REGEX.test(renderedHtml), false, 'Rendered PDF HTML must contain ZERO emojis');

    // Zero Grocery Lists invariant
    const forbiddenShoppingTerms = ['قائمة تسوق', 'قائمة المشتريات', 'سوبرماركت', 'grocery', 'shopping list', 'supermarket'];
    for (const term of forbiddenShoppingTerms) {
      assert.equal(jsonStr.toLowerCase().includes(term), false, `Payload must not contain grocery term: ${term}`);
      assert.equal(renderedHtml.toLowerCase().includes(term), false, `Rendered HTML must not contain grocery term: ${term}`);
    }

    // RTL & Curved System Aesthetics
    assert.ok(renderedHtml.includes('dir="rtl"'), 'HTML must declare dir="rtl"');
    assert.ok(renderedHtml.includes('border-radius:'), 'HTML styling must employ curved border-radius');
    assert.equal(renderedHtml.includes('border-radius: 0px'), false, 'HTML styling must have no 0px sharp corners');
  });

});
