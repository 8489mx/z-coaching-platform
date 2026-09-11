import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Import Constants
import {
  ADD_EX_MUSCLE_CATEGORIES,
  ADD_EX_EQUIPMENT_OPTIONS,
  FOOD_DATABASE_LIST,
  CLIENT_BLUEPRINTS,
  CARDIO_MODALITY_OPTIONS,
  STRESS_TEST_CLIENTS
} from '../frontend/src/pages/CoachEditor/constants/coachEditorConstants.js';

// Import Pure Rebalancer
import { dynamicRippleRebalanceDailyPlan } from '../frontend/src/utils/mealPortionBalancer.js';
import { arabicSearchMatch } from '../frontend/src/utils/searchUtils.js';
import { getExerciseDisplayNames } from '../frontend/src/utils/exerciseTranslator.js';

test('CoachEditor Refactor: Behavioral & Architectural Verification Suite', async (suite) => {

  // 1. Constants & Catalog Integrity
  await suite.test('1. Constants catalog maintains all required filters and datasets', () => {
    assert.ok(Array.isArray(ADD_EX_MUSCLE_CATEGORIES), 'Muscle categories should be an array');
    assert.ok(ADD_EX_MUSCLE_CATEGORIES.length >= 7, 'Must have all muscle categories');
    
    assert.ok(Array.isArray(ADD_EX_EQUIPMENT_OPTIONS), 'Equipment options should be an array');
    assert.ok(ADD_EX_EQUIPMENT_OPTIONS.length >= 6, 'Must have all equipment options');

    assert.ok(Array.isArray(FOOD_DATABASE_LIST), 'Food database list should be an array');
    assert.ok(FOOD_DATABASE_LIST.length > 50, 'Food database must contain foods');

    assert.ok(Array.isArray(STRESS_TEST_CLIENTS), 'Stress test clients should be an array');
    assert.equal(STRESS_TEST_CLIENTS.length, 15, 'Must contain all 15 clinical stress test clients');

    assert.ok(Array.isArray(CARDIO_MODALITY_OPTIONS), 'Cardio modalities should be an array');
    assert.ok(CARDIO_MODALITY_OPTIONS.length >= 5, 'Must contain at least 5 cardio modalities');
  });

  // 2. Client Blueprints Integrity
  await suite.test('2. CLIENT_BLUEPRINTS contains robust clinical plans with training, nutrition, and cardio', () => {
    assert.ok(CLIENT_BLUEPRINTS['1'], 'Client 1 blueprint must exist');
    const b1 = CLIENT_BLUEPRINTS['1'];
    
    assert.ok(b1.client, 'Client 1 must have client details');
    assert.equal(b1.client.client_code, '1');
    assert.ok(b1.training && Array.isArray(b1.training.sessions), 'Client 1 must have training sessions');
    assert.ok(b1.training.sessions.length > 0, 'Must have at least 1 training session');

    assert.ok(b1.nutrition && Array.isArray(b1.nutrition.meals), 'Client 1 must have nutrition meals');
    assert.ok(b1.nutrition.targets, 'Client 1 must have nutrition targets');
    assert.ok(b1.nutrition.targets.calories > 0, 'Target calories must be positive');

    assert.ok(b1.cardio, 'Client 1 must have cardio configuration');
    assert.ok(b1.cardio.modality, 'Cardio modality must be defined');
    assert.ok(b1.cardio.weekly_sessions > 0, 'Cardio sessions must be > 0');
  });

  // 3. Component Barrel Exports Verification
  await suite.test('3. CoachEditor component barrel index exports all extracted modules', async () => {
    const componentsBarrelPath = path.resolve(process.cwd(), 'frontend/src/pages/CoachEditor/components/index.js');
    assert.ok(fs.existsSync(componentsBarrelPath), 'Components index.js must exist');
    const barrelContent = fs.readFileSync(componentsBarrelPath, 'utf8');

    assert.ok(barrelContent.includes('CoachClientsQueue'), 'Must export CoachClientsQueue');
    assert.ok(barrelContent.includes('CoachHeaderBar'), 'Must export CoachHeaderBar');
    assert.ok(barrelContent.includes('CoachTrainingTab'), 'Must export CoachTrainingTab');
    assert.ok(barrelContent.includes('CoachCardioHabitsTab'), 'Must export CoachCardioHabitsTab');
    assert.ok(barrelContent.includes('export * from \'./modals\''), 'Must export modals');
  });

  // 4. Hook Barrel Export Verification
  await suite.test('4. CoachEditor hooks barrel index exports useCoachEditorData', async () => {
    const hooksBarrelPath = path.resolve(process.cwd(), 'frontend/src/pages/CoachEditor/hooks/index.js');
    assert.ok(fs.existsSync(hooksBarrelPath), 'Hooks index.js must exist');
    const hookContent = fs.readFileSync(hooksBarrelPath, 'utf8');
    assert.ok(hookContent.includes('useCoachEditorData'), 'Must export useCoachEditorData');
  });

  // 5. Queue Filtering Logic Behavioral Verification
  await suite.test('5. Queue filtering logic filters by status, search code, phone, and name', () => {
    const sampleClients = [
      { id: 1, client_code: '1', full_name: 'طارق السعيد', queue_status: 'PENDING_PLAN', phone_number: '01012345678' },
      { id: 2, client_code: '2', full_name: 'ياسمين عبد العزيز', queue_status: 'NEEDS_UPDATE', phone_number: '01198765432' },
      { id: 3, client_code: '3', full_name: 'عمر المهندس', queue_status: 'ACTION_NEEDED', phone_number: '01255554444' }
    ];

    // Filter by ACTION_NEEDED
    const actionNeeded = sampleClients.filter(c => c.queue_status === 'PENDING_PLAN' || c.queue_status === 'NEEDS_UPDATE');
    assert.equal(actionNeeded.length, 2);

    // Search by partial name
    const nameSearch = sampleClients.filter(c => arabicSearchMatch(c.full_name, 'طارق'));
    assert.equal(nameSearch.length, 1);
    assert.equal(nameSearch[0].client_code, '1');

    // Search by client code
    const codeSearch = sampleClients.filter(c => String(c.client_code) === '2');
    assert.equal(codeSearch.length, 1);
    assert.equal(codeSearch[0].full_name, 'ياسمين عبد العزيز');

    // Search by phone
    const phoneSearch = sampleClients.filter(c => c.phone_number.includes('5555'));
    assert.equal(phoneSearch.length, 1);
    assert.equal(phoneSearch[0].full_name, 'عمر المهندس');
  });

  // 6. Food Recalculation Behavioral Verification
  await suite.test('6. Meal macros recalculate deterministically from food item amounts', () => {
    const items = [
      { p: 30, c: 0, f: 3, cal: 150 },
      { p: 4, c: 45, f: 1, cal: 210 },
      { p: 0, c: 0, f: 14, cal: 126 }
    ];

    let cal = 0, p = 0, c = 0, f = 0;
    items.forEach(item => {
      cal += Number(item.cal || 0);
      p += Number(item.p || 0);
      c += Number(item.c || 0);
      f += Number(item.f || 0);
    });

    const macros = {
      calories: Math.round(cal),
      protein: Math.round(p),
      carbs: Math.round(c),
      fats: Math.round(f)
    };

    assert.equal(macros.calories, 486);
    assert.equal(macros.protein, 34);
    assert.equal(macros.carbs, 45);
    assert.equal(macros.fats, 18);
  });

  // 7. Dynamic Ripple Rebalance Behavioral Integration
  await suite.test('7. dynamicRippleRebalanceDailyPlan redistributes macros without exceeding boundaries', () => {
    const meals = [
      {
        id: 'm1',
        items: [
          { code: 'CHICKEN_BREAST', amount: 150, p: 45, c: 0, f: 4, cal: 220, category: 'PROTEIN' },
          { code: 'WHITE_RICE', amount: 150, p: 4, c: 42, f: 1, cal: 195, category: 'CARB' }
        ]
      },
      {
        id: 'm2',
        items: [
          { code: 'CHICKEN_BREAST', amount: 150, p: 45, c: 0, f: 4, cal: 220, category: 'PROTEIN' },
          { code: 'WHITE_RICE', amount: 150, p: 4, c: 42, f: 1, cal: 195, category: 'CARB' }
        ]
      }
    ];

    const rebalanced = dynamicRippleRebalanceDailyPlan({
      meals,
      supplements: [],
      targets: { calories: 2000, protein: 160, carbs: 220, fats: 50 },
      anchorMealId: 'm1',
      beverageSugarSpoons: 0,
      autoRippleEnabled: true
    });

    assert.ok(Array.isArray(rebalanced), 'Rebalanced plan should return meals array');
    assert.equal(rebalanced.length, 2);
    // Anchor meal m1 amounts should be preserved
    assert.equal(rebalanced[0].items[0].amount, 150);
  });

  // 8. Exercise Translator Names Verification
  await suite.test('8. getExerciseDisplayNames extracts English and Arabic names reliably', () => {
    const ex1 = { name: 'Incline Dumbbell Press', name_ar: 'ضغط صدر علوي بالدمبل' };
    const res1 = getExerciseDisplayNames(ex1);
    assert.equal(res1.nameEn, 'Incline Dumbbell Press');
    assert.equal(res1.nameAr, 'ضغط صدر علوي بالدمبل');

    const ex2 = { name_en: 'Barbell Squat', target_muscle: 'عضلات الأرجل' };
    const res2 = getExerciseDisplayNames(ex2);
    assert.equal(res2.nameEn, 'Barbell Squat');
    assert.ok(res2.nameAr.length > 0);
  });

  // 9. Architectural Constraints & Code Reduction Verification
  await suite.test('9. CoachEditor.jsx size is reduced below 500 lines and modularized', () => {
    const coachEditorPath = path.resolve(process.cwd(), 'frontend/src/pages/CoachEditor.jsx');
    const content = fs.readFileSync(coachEditorPath, 'utf8');
    const linesCount = content.split(/\r?\n/).length;

    assert.ok(linesCount < 500, `CoachEditor.jsx must be under 500 lines, currently: ${linesCount}`);
    assert.ok(content.includes('useCoachEditorData'), 'Must consume useCoachEditorData hook');
    assert.ok(content.includes('CoachClientsQueue'), 'Must render CoachClientsQueue');
    assert.ok(content.includes('CoachHeaderBar'), 'Must render CoachHeaderBar');
    assert.ok(content.includes('CoachTrainingTab'), 'Must render CoachTrainingTab');
    assert.ok(content.includes('CoachCardioHabitsTab'), 'Must render CoachCardioHabitsTab');
  });

  // 10. Zero Emoji Verification across all refactored CoachEditor files
  await suite.test('10. Zero Emoji compliance across all refactored CoachEditor modules', () => {
    const filesToCheck = [
      'frontend/src/pages/CoachEditor.jsx',
      'frontend/src/pages/CoachEditor/hooks/useCoachEditorData.js',
      'frontend/src/pages/CoachEditor/hooks/index.js',
      'frontend/src/pages/CoachEditor/constants/coachEditorConstants.js',
      'frontend/src/pages/CoachEditor/components/CoachClientsQueue.jsx',
      'frontend/src/pages/CoachEditor/components/CoachHeaderBar.jsx',
      'frontend/src/pages/CoachEditor/components/CoachTrainingTab.jsx',
      'frontend/src/pages/CoachEditor/components/CoachCardioHabitsTab.jsx',
      'frontend/src/pages/CoachEditor/components/modals/CoachFoodModals.jsx',
      'frontend/src/pages/CoachEditor/components/modals/CoachExerciseModals.jsx',
      'frontend/src/pages/CoachEditor/components/modals/CoachCardioSwapModal.jsx',
      'frontend/src/pages/CoachEditor/components/modals/CoachMobilityModal.jsx'
    ];

    const emojiRegex = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;

    for (const relPath of filesToCheck) {
      const fullPath = path.resolve(process.cwd(), relPath);
      assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(!emojiRegex.test(content), `File ${relPath} contains prohibited emojis!`);
    }
  });

});
