import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PAGE_LAYOUT_CONFIG,
  SMART_GUIDELINES_MATRIX,
  sanitizeCoachNotesForClient,
  filterEmptyDaysAndSections,
  validateExerciseMediaLinks,
  auditMicronutrientCoverage,
  sanitizeClientFacingPlan,
  buildPdfExportContract,
  generateMasterPdfExportData,
  generatePrintablePlanHTML
} from '../src/execution-engines/pdf-export-engine.js';

const EMOJI_REGEX = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;

test('Phase 13: PDF Export, Tripartite Contract & Layout Governance Suite (Unit J, J-01..J-06)', async (suite) => {

  await suite.test('1. Tripartite Consistency & Field Equivalence Contract (J-01): 100% equivalence across stored, client, and PDF', () => {
    const mockProgram = {
      id: 101,
      program_data: {
        nutrition: {
          targets: { calories: 2200, protein: 180, carbs: 230, fat: 60 },
          meals: [
            { title_ar: 'الوجبة الأولى: إفطار التأسيس', calories: 550, items: [] },
            { title_ar: 'الوجبة الثانية: غداء البناء', calories: 850, items: [] },
            { title_ar: 'الوجبة الثالثة: عشاء الاستشفاء', calories: 800, items: [] }
          ]
        },
        training: {
          sessions: [
            { session_name: 'اليوم الأول: سحب الجزء العلوي', exercises: [{ name_en: 'Lat Pulldown', sets: 4, reps: '10-12' }] },
            { session_name: 'اليوم الثاني: الجزء السفلي', exercises: [{ name_en: 'Barbell Squat', sets: 3, reps: '8-10' }] },
            { session_name: 'اليوم الثالث: فارغ غير مسكون', exercises: [] } // Empty phantom session to test pruning
          ]
        }
      }
    };

    const mockClient = { id: 50, name: 'أحمد محمود', client_code: 'Z-50' };

    const contract = buildPdfExportContract({ program: mockProgram, client: mockClient });

    assert.equal(contract.tripartite_contract.is_consistent, true);
    assert.equal(contract.tripartite_contract.fields.calories.stored, 2200);
    assert.equal(contract.tripartite_contract.fields.calories.client_view, 2200);
    assert.equal(contract.tripartite_contract.fields.calories.pdf_export, 2200);
    assert.equal(contract.tripartite_contract.fields.calories.unit, 'kcal');

    assert.equal(contract.tripartite_contract.fields.protein.stored, 180);
    assert.equal(contract.tripartite_contract.fields.protein.pdf_export, 180);

    assert.equal(contract.tripartite_contract.fields.carbs.stored, 230);
    assert.equal(contract.tripartite_contract.fields.carbs.pdf_export, 230);

    assert.equal(contract.tripartite_contract.fields.fats.stored, 60);
    assert.equal(contract.tripartite_contract.fields.fats.pdf_export, 60);

    // Pruned phantom sessions count
    assert.equal(contract.tripartite_contract.counts.raw_sessions_count, 3);
    assert.equal(contract.tripartite_contract.counts.printable_sessions_count, 2);
    assert.equal(contract.tripartite_contract.counts.empty_sessions_pruned, 1);
    assert.equal(contract.tripartite_contract.counts.meals_count, 3);
  });

  await suite.test('2. Arabic RTL Typography, Bidirectional Text & Bidi Isolation (J-02): Zero Emojis and RTL integrity', () => {
    const sampleData = generateMasterPdfExportData({
      client_name: 'خالد التميمي',
      client_code: '501',
      package_tier: 'MAX',
      current_week: 3
    });

    assert.equal(sampleData.branding.platform, 'Z Coaching Platform');
    assert.equal(sampleData.branding.coach_name, 'كابتن كريم زكريا');
    assert.match(sampleData.document_title, /خالد التميمي/);
    assert.match(sampleData.client.package, /باقة MAX/);

    // Verify smart guidelines matrix
    assert.ok(sampleData.contextual_guidelines.length >= 5);
    for (const guide of sampleData.contextual_guidelines) {
      assert.ok(guide.title_ar.length > 5);
      assert.ok(guide.instruction_ar.length > 10);
      assert.equal(EMOJI_REGEX.test(guide.title_ar), false);
      assert.equal(EMOJI_REGEX.test(guide.instruction_ar), false);
    }

    // Verify printable HTML output
    const html = generatePrintablePlanHTML({
      client: { name: 'طارق سليم', goal_title: 'نزول دهون وبناء عضل' },
      plan: {
        workout: {
          title_ar: 'سحب الجزء العلوي',
          exercises: [{ name_en: 'Dumbbell Incline Bench Press', name_ar: 'ضغط دمبل مائل للصدر العلوي', sets: 3, reps: '8 - 10' }]
        },
        meals: [
          { title_ar: 'وجبة الإفطار', calories: 450, items: [{ name: 'شوفان بالحليب', portion: '80 جم', hand_portion: 'كوب متوسط' }] }
        ]
      }
    });

    assert.match(html, /dir="rtl"/);
    assert.match(html, /lang="ar"/);
    assert.match(html, /Dumbbell Incline Bench Press/);
    assert.match(html, /ضغط دمبل مائل للصدر العلوي/);
    assert.equal(EMOJI_REGEX.test(html), false);
  });

  await suite.test('3. Pruning Phantom Sessions & Preserving Designated Rest Days (J-03): Zero orphaned pages', () => {
    const rawSessions = [
      {
        session_name: 'اليوم الأول: صدر وبايسبس',
        exercises: [{ name_en: 'Bench Press', sets: 4, reps: '8-10' }]
      },
      {
        session_name: 'اليوم الثاني: خالي بدون تمارين', // Phantom empty session: must be pruned
        exercises: []
      },
      {
        session_name: 'اليوم الثالث: راحة واستشفاء نشط', // Designated Rest Day: must be kept with recovery notice
        is_rest_day: true,
        exercises: []
      },
      {
        session_name: 'اليوم الرابع: ظهر وترايسبس',
        exercises: [{ name_en: 'Lat Pulldown', sets: 4, reps: '10-12' }]
      }
    ];

    const pruned = filterEmptyDaysAndSections(rawSessions);

    assert.equal(pruned.length, 3); // 2 training sessions + 1 rest day (phantom pruned)
    assert.equal(pruned[0].session_name, 'اليوم الأول: صدر وبايسبس');
    assert.equal(pruned[1].session_name, 'اليوم الثالث: راحة واستشفاء نشط');
    assert.equal(pruned[1].is_rest_day, true);
    assert.match(pruned[1].recovery_guideline_ar, /يوم استشفاء عضلي وتجديد طاقة الجهاز العصبي/);
    assert.equal(pruned[2].session_name, 'اليوم الرابع: ظهر وترايسبس');
  });

  await suite.test('4. Visual Identity & Clinical Privacy Shield (J-04): Sanitizes internal codes and clinical tags', () => {
    const dirtyNotes = `
      [CLINICAL_LOCKOUT_UNLOCKED: DOCTOR_NOTE_ATTACHED]
      [TIER_0_RESTRICTION: HYPERTENSION_DETECTED]
      يرجى الالتزام بفترات الراحة بين الجولات لضبط معدل النبض.
      [INTERNAL_DEBUG_FLAG: REF_1092]
      موانع الاستخدام: يمنع حمل أوزان حرة على الكتف المصاب.
      احرص على أداء الإحماء الحركي لمدة 8 دقائق قبل البدء.
    `;

    const sanitizedNotes = sanitizeCoachNotesForClient(dirtyNotes);

    assert.equal(sanitizedNotes.includes('CLINICAL_LOCKOUT_UNLOCKED'), false);
    assert.equal(sanitizedNotes.includes('TIER_0_RESTRICTION'), false);
    assert.equal(sanitizedNotes.includes('INTERNAL_DEBUG_FLAG'), false);
    assert.equal(sanitizedNotes.includes('موانع الاستخدام'), false);
    assert.match(sanitizedNotes, /يرجى الالتزام بفترات الراحة بين الجولات لضبط معدل النبض/);
    assert.match(sanitizedNotes, /احرص على أداء الإحماء الحركي لمدة 8 دقائق قبل البدء/);
    assert.equal(EMOJI_REGEX.test(sanitizedNotes), false);

    // Full client facing plan sanitizer
    const dirtyPlan = {
      coach_notes: dirtyNotes,
      clinical_guardrails: { asthma: true, high_fat_alert: true },
      requires_medical_review: true,
      tier_0_lock: true,
      training: { split: 'Upper/Lower' }
    };

    const cleanPlan = sanitizeClientFacingPlan(dirtyPlan);
    assert.equal(cleanPlan.clinical_guardrails, undefined);
    assert.equal(cleanPlan.requires_medical_review, undefined);
    assert.equal(cleanPlan.tier_0_lock, undefined);
    assert.ok(cleanPlan.coach_notes.length > 10);
    assert.equal(cleanPlan.coach_notes.includes('CLINICAL'), false);
  });

  await suite.test('5. Exercise Media & Page Layout Standards (J-05): Validates media URLs and page sizes', () => {
    // Page layout standards
    assert.equal(PAGE_LAYOUT_CONFIG.A4.width_mm, 210);
    assert.equal(PAGE_LAYOUT_CONFIG.A4.height_mm, 297);
    assert.equal(PAGE_LAYOUT_CONFIG.LETTER.width_mm, 215.9);
    assert.equal(PAGE_LAYOUT_CONFIG.LETTER.height_mm, 279.4);

    // Media validation
    const testExercises = [
      { name: 'Lat Pulldown', video_url: 'https://zcoaching.com/videos/lat-pulldown.mp4' },
      { name: 'Cable Row', video_url: 'not-a-valid-url' },
      { name: 'Face Pull' } // Missing URL
    ];

    const validatedMedia = validateExerciseMediaLinks(testExercises);
    assert.equal(validatedMedia[0].has_valid_video, true);
    assert.equal(validatedMedia[0].media_source, 'VERIFIED_REMOTE');

    assert.equal(validatedMedia[1].has_valid_video, false);
    assert.equal(validatedMedia[1].media_source, 'LOCAL_DEMO_CARD');

    assert.equal(validatedMedia[2].has_valid_video, false);
    assert.equal(validatedMedia[2].media_source, 'LOCAL_DEMO_CARD');
  });

  await suite.test('6. Micronutrient Integrity & Zero False-Precision Zeroes (J-06): Discloses unmeasured nutrients', () => {
    // Nutrient dataset where sodium and potassium are measured, but calcium and iron were unrecorded
    const partialNutrients = {
      sodium: 1800,
      potassium: 2900
    };

    const audit = auditMicronutrientCoverage(partialNutrients);

    assert.equal(audit.total_count, 8);
    assert.equal(audit.measured_count, 2);
    assert.equal(audit.coverage_percentage, 25);

    const sodiumItem = audit.items.find(i => i.key === 'sodium');
    assert.equal(sodiumItem.amount, 1800);
    assert.equal(sodiumItem.unit, 'mg');
    assert.equal(sodiumItem.status, 'MEASURED');
    assert.equal(sodiumItem.display_text, '1800 mg');

    const calciumItem = audit.items.find(i => i.key === 'calcium');
    assert.equal(calciumItem.amount, null);
    assert.equal(calciumItem.is_available, false);
    assert.equal(calciumItem.status, 'DATA_UNAVAILABLE');
    assert.match(calciumItem.display_text, /غير متوفر في قاعدة البيانات/);
    assert.equal(calciumItem.is_zero_fallback, false); // Prevents false 0 mg display!
  });

});
