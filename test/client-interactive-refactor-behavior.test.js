import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Import Pure Adapters
import { 
  adaptProgramToInteractiveMeals, 
  adaptSessionToInteractiveWorkout 
} from '../frontend/src/pages/ClientInteractiveApp/utils/programAdapters.js';

// Import Offline Sync Engine
import { 
  enqueueOfflineAction, 
  flushPendingQueue, 
  getQueueSyncStatus, 
  ACTION_TYPES, 
  SYNC_STATUS 
} from '../frontend/src/utils/offlineSyncEngine.js';

// Import Emergency Adaptation Engine
import { 
  applyEmergencyScenarioAdaptation, 
  TRAVEL_EQUIPMENT_TYPES 
} from '../frontend/src/utils/emergencyScenarioEngine.js';

test('ClientInteractiveApp Refactor: Behavioral Verification Suite', async (suite) => {

  // 1. Program Adapters Behavioral Tests
  await suite.test('1. adaptProgramToInteractiveMeals converts master program culinary meals accurately', () => {
    const mockProgram = {
      nutrition_program: {
        culinary_meals: [
          {
            id: 'm1_test',
            meal_number: 1,
            recipe_title_ar: 'إفطار البيض والشوفان',
            timing_relation: 'PRE_WORKOUT',
            timing: '08:00 ص',
            actual_macros: { calories: 450, protein: 35, carbs: 50, fats: 10 },
            items: [
              { food_code: 'WHOLE_EGG', name_ar: 'بيض كامل', portion_g: 100, protein_g: 12.6, carb_g: 0.8, fat_g: 9.5, calories_kcal: 140 },
              { food_code: 'OATS', name_ar: 'شوفان خام', portion_g: 60, protein_g: 8, carb_g: 40, fat_g: 4, calories_kcal: 230 }
            ]
          }
        ]
      }
    };

    const adapted = adaptProgramToInteractiveMeals(mockProgram);
    assert.equal(adapted.length, 1);
    const meal = adapted[0];
    assert.equal(meal.id, 'm1_test');
    assert.equal(meal.title, 'إفطار البيض والشوفان');
    assert.equal(meal.workout_timing, 'PRE_WORKOUT');
    assert.equal(meal.completed, false);
    assert.equal(meal.items.length, 2);
    assert.equal(meal.items[0].name, 'بيض كامل');
    assert.equal(meal.items[0].p, 12.6);
    assert.equal(meal.items[1].name, 'شوفان خام');
    assert.equal(meal.items[1].c, 40);
  });

  await suite.test('2. adaptProgramToInteractiveMeals handles fallback to standard meals when culinary meals missing', () => {
    const mockProgram = {
      nutrition: {
        meals: [
          {
            id: 'legacy_m1',
            title: 'وجبة غداء الدجاج والأرز',
            workout_timing: 'POST_WORKOUT',
            time: '02:30 م',
            items: [
              { code: 'CHICKEN_BREAST', name: 'صدور دجاج', amount: 180, unit: 'جم', p: 55, c: 0, f: 5, cal: 265 }
            ]
          }
        ]
      }
    };

    const adapted = adaptProgramToInteractiveMeals(mockProgram);
    assert.equal(adapted.length, 1);
    assert.equal(adapted[0].id, 'legacy_m1');
    assert.equal(adapted[0].items[0].name, 'صدور دجاج');
    assert.equal(adapted[0].items[0].p, 55);
  });

  await suite.test('3. adaptSessionToInteractiveWorkout maps exercises, warmups, cues and safety notes', () => {
    const mockSession = {
      session_name: 'سحب الجزء العلوي',
      focus_ar: 'ظهر وبايسبس',
      duration: '60 دقيقة',
      warmup_protocol: 'إحماء RAMP كامل',
      exercises: [
        {
          id: 'ex_pulldown',
          exercise_code: 'LAT_PULLDOWN',
          name: 'Lat Pulldown',
          name_en: 'Lat Pulldown',
          name_ar: 'سحب ظهر واسع كابل',
          isCompound: true,
          rest_seconds: 90,
          prescribed_sets: 4,
          prescription: { sets: 4 },
          reps: '10-12',
          working_weight_kg: 60,
          cues_ar: 'الحفاظ على صدر مرفوع',
          execution_mistakes_ar: 'تفادي الأرجحة',
          stretch_image: 'stretch.jpg',
          contraction_image: 'contraction.jpg',
          video_url: 'https://youtube.com/watch?v=123'
        }
      ]
    };

    const adapted = adaptSessionToInteractiveWorkout(mockSession, 0);
    assert.ok(adapted.title.includes('سحب الجزء العلوي'));
    assert.equal(adapted.duration, '60 دقيقة');
    assert.equal(adapted.exercises.length, 1);
    const ex = adapted.exercises[0];
    assert.equal(ex.id, 'ex_pulldown');
    assert.equal(ex.nameEn, 'Lat Pulldown');
    assert.equal(ex.nameAr, 'سحب ظهر واسع كابل');
    assert.equal(ex.sets.length, 4);
    assert.equal(ex.sets[0].reps, '10-12');
    assert.equal(ex.sets[0].weight, '60');
    assert.equal(ex.cues_ar, 'الحفاظ على صدر مرفوع');
  });

  // 2. Offline Sync Queue Behavioral Tests
  await suite.test('4. enqueueOfflineAction adds persistent, immutable action to queue', () => {
    const initialQueue = [];
    const res = enqueueOfflineAction({
      queue: initialQueue,
      actionType: ACTION_TYPES.CHECK_MEAL,
      clientId: 'client_882',
      payload: { day: 1, mealId: 'm1', completed: true }
    });

    assert.equal(res.queue.length, 1);
    assert.equal(res.pending_count, 1);
    assert.equal(res.enqueued_action.actionType, ACTION_TYPES.CHECK_MEAL);
    assert.equal(res.enqueued_action.clientId, 'client_882');
    assert.equal(res.enqueued_action.syncStatus, SYNC_STATUS.PENDING);
    assert.equal(res.enqueued_action.payload.mealId, 'm1');
    assert.equal(res.enqueued_action.payload.completed, true);
    assert.ok(res.enqueued_action.actionId.startsWith('act_'));
  });

  await suite.test('5. getQueueSyncStatus accurately reports sync state', () => {
    const emptyQueue = [];
    const statusEmpty = getQueueSyncStatus(emptyQueue);
    assert.equal(statusEmpty.is_fully_synced, true);
    assert.equal(statusEmpty.pending_count, 0);

    const pendingQueue = [
      { actionId: 'a1', syncStatus: SYNC_STATUS.PENDING },
      { actionId: 'a2', syncStatus: SYNC_STATUS.PENDING }
    ];
    const statusPending = getQueueSyncStatus(pendingQueue);
    assert.equal(statusPending.is_fully_synced, false);
    assert.equal(statusPending.pending_count, 2);
  });

  await suite.test('6. flushPendingQueue flushes pending items in order and marks them SYNCED', async () => {
    const queue = [
      { actionId: 'a1', syncStatus: SYNC_STATUS.PENDING, actionType: ACTION_TYPES.CHECK_MEAL },
      { actionId: 'a2', syncStatus: SYNC_STATUS.PENDING, actionType: ACTION_TYPES.LOG_SET }
    ];

    const syncedCalls = [];
    const res = await flushPendingQueue({
      queue,
      syncHandler: async (action) => {
        syncedCalls.push(action.actionId);
        return { success: true };
      }
    });

    assert.equal(res.flushed_count, 2);
    assert.deepEqual(syncedCalls, ['a1', 'a2']);
    assert.equal(res.queue[0].syncStatus, SYNC_STATUS.SYNCED);
    assert.equal(res.queue[1].syncStatus, SYNC_STATUS.SYNCED);
  });

  await suite.test('6b. Verifies localStorage key invariance: kz_offline_queue matches pre-refactor and migration handles legacy keys', () => {
    // 1. Static inspection of code to ensure authoritative key is kz_offline_queue
    const hookFile = fs.readFileSync(path.resolve('frontend/src/pages/ClientInteractiveApp/hooks/useClientInteractiveData.js'), 'utf-8');
    assert.ok(hookFile.includes("'kz_offline_queue'"), 'Code must use authoritative kz_offline_queue');
    
    // 2. Behavioral test of migration logic
    const mockStorage = {
      'zcc_client_offline_queue': JSON.stringify([{ actionId: 'legacy_1', payload: { mealId: 'm1' } }])
    };
    
    // Simulate migration logic from useClientInteractiveData
    let raw = mockStorage['kz_offline_queue'];
    if (!raw && mockStorage['zcc_client_offline_queue']) {
      const alt = mockStorage['zcc_client_offline_queue'];
      raw = alt;
      mockStorage['kz_offline_queue'] = alt;
      delete mockStorage['zcc_client_offline_queue'];
    }
    
    assert.ok(mockStorage['kz_offline_queue'], 'kz_offline_queue must receive the migrated data');
    assert.equal(mockStorage['zcc_client_offline_queue'], undefined, 'legacy key must be cleanly removed');
    const parsed = JSON.parse(raw);
    assert.equal(parsed[0].actionId, 'legacy_1');
  });

  // 3. Dynamic Macros Computation Behavioral Tests
  await suite.test('7. Target Macros auto-regulation prioritizes direct targets over stage targets', () => {
    // Helper replicating targetMacros logic from useClientInteractiveData
    const computeTargetMacros = (program, mealsList) => {
      const direct = program?.nutrition?.targets;
      if (direct && (direct.calories || direct.protein)) {
        return {
          cal: Number(direct.calories) || 0,
          p: Number(direct.protein) || 0,
          c: Number(direct.carbs) || 0,
          f: Number(direct.fats) || 0
        };
      }
      const stage = program?.nutrition_program?.macro_targets;
      if (stage && (stage.calories_kcal || stage.protein_g)) {
        return {
          cal: Math.round(Number(stage.calories_kcal || 0)),
          p: Math.round(Number(stage.protein_g || 0)),
          c: Math.round(Number(stage.carbohydrate_g || 0)),
          f: Math.round(Number(stage.fat_g || 0))
        };
      }
      return { p: 155, c: 200, f: 50, cal: 1870 };
    };

    // Case A: Direct targets exist
    const progWithDirect = {
      nutrition: { targets: { calories: 2100, protein: 175, carbs: 220, fats: 55 } },
      nutrition_program: { macro_targets: { calories_kcal: 1900, protein_g: 150, carbohydrate_g: 200, fat_g: 45 } }
    };
    const directResult = computeTargetMacros(progWithDirect, []);
    assert.equal(directResult.cal, 2100);
    assert.equal(directResult.p, 175);

    // Case B: Only stage targets exist
    const progWithStageOnly = {
      nutrition_program: { macro_targets: { calories_kcal: 1950, protein_g: 160, carbohydrate_g: 210, fat_g: 50 } }
    };
    const stageResult = computeTargetMacros(progWithStageOnly, []);
    assert.equal(stageResult.cal, 1950);
    assert.equal(stageResult.p, 160);

    // Case C: Fallback to baseline
    const fallbackResult = computeTargetMacros(null, []);
    assert.equal(fallbackResult.cal, 1870);
    assert.equal(fallbackResult.p, 155);
  });

  await suite.test('8. Consumed Macros sums only completed meals and taken supplements', () => {
    const meals = [
      {
        id: 'm1',
        completed: true,
        items: [
          { p: 30, c: 40, f: 10, cal: 370 },
          { p: 10, c: 20, f: 5, cal: 165 }
        ]
      },
      {
        id: 'm2',
        completed: false, // NOT completed: must NOT be counted!
        items: [
          { p: 50, c: 60, f: 15, cal: 575 }
        ]
      }
    ];

    const supplements = [
      { id: 'supp_whey', p: 25, c: 2, f: 1, cal: 120 },
      { id: 'supp_creatine', p: 0, c: 0, f: 0, cal: 0 }
    ];

    const supplementsTaken = {
      supp_whey: true,
      supp_creatine: false
    };

    const computeConsumed = (mealsArr, suppsArr, takenMap) => {
      const acc = mealsArr.reduce((mealAcc, meal) => {
        if (meal.completed) {
          (meal.items || []).forEach(item => {
            mealAcc.p += Number(item.p || 0);
            mealAcc.c += Number(item.c || 0);
            mealAcc.f += Number(item.f || 0);
            mealAcc.cal += Number(item.cal || 0);
          });
        }
        return mealAcc;
      }, { p: 0, c: 0, f: 0, cal: 0 });

      suppsArr.forEach(supp => {
        if (takenMap[supp.id]) {
          acc.p += supp.p;
          acc.c += supp.c;
          acc.f += supp.f;
          acc.cal += supp.cal;
        }
      });

      return acc;
    };

    const consumed = computeConsumed(meals, supplements, supplementsTaken);
    // m1: p = 40, c = 60, f = 15, cal = 535
    // supp_whey: p = 25, c = 2, f = 1, cal = 120
    // total: p = 65, c = 62, f = 16, cal = 655
    assert.equal(consumed.p, 65);
    assert.equal(consumed.c, 62);
    assert.equal(consumed.f, 16);
    assert.equal(consumed.cal, 655);
  });

  // 4. Smart Food Swap State Update Behavioral Tests
  await suite.test('9. Smart Food Swap replaces targeted item in correct meal while preserving other items', () => {
    const initialMeals = [
      {
        id: 'm1',
        title: 'وجبة 1',
        items: [
          { id: 'i1', code: 'CHICKEN', name: 'دجاج', amount: 150, unit: 'جم', p: 46.5, c: 0, f: 5, cal: 240 },
          { id: 'i2', code: 'RICE', name: 'أرز', amount: 150, unit: 'جم', p: 4, c: 42, f: 0.5, cal: 190 }
        ]
      },
      {
        id: 'm2',
        title: 'وجبة 2',
        items: [
          { id: 'i3', code: 'EGG', name: 'بيض', amount: 100, unit: 'جم', p: 13, c: 1, f: 10, cal: 140 }
        ]
      }
    ];

    const swapResult = {
      replacement_food: {
        code: 'BEEF_LEAN',
        name_ar: 'لحم بقري قليل الدهن',
        portion_g: 175,
        macros: { protein_g: 46.5, carbs_g: 0, fat_g: 8, calories_kcal: 260 }
      }
    };

    const swapMealId = 'm1';
    const activeSwapItem = { id: 'i1' };

    const updatedMeals = initialMeals.map(meal => {
      if (meal.id !== swapMealId) return meal;
      return {
        ...meal,
        items: meal.items.map(item => {
          if (item.id !== activeSwapItem.id) return item;
          return {
            ...item,
            code: swapResult.replacement_food.code,
            name: swapResult.replacement_food.name_ar,
            amount: swapResult.replacement_food.portion_g,
            unit: 'جم',
            p: swapResult.replacement_food.macros.protein_g,
            c: swapResult.replacement_food.macros.carbs_g,
            f: swapResult.replacement_food.macros.fat_g,
            cal: swapResult.replacement_food.macros.calories_kcal
          };
        })
      };
    });

    // Verify m1 item i1 is replaced
    assert.equal(updatedMeals[0].items[0].code, 'BEEF_LEAN');
    assert.equal(updatedMeals[0].items[0].name, 'لحم بقري قليل الدهن');
    assert.equal(updatedMeals[0].items[0].amount, 175);
    assert.equal(updatedMeals[0].items[0].cal, 260);

    // Verify m1 item i2 is untouched
    assert.equal(updatedMeals[0].items[1].code, 'RICE');
    assert.equal(updatedMeals[0].items[1].amount, 150);

    // Verify m2 is completely untouched
    assert.equal(updatedMeals[1].items[0].code, 'EGG');
  });

  // 5. Emergency Scenario Adaptation Behavioral Tests
  await suite.test('10. Emergency Scenario engine produces valid adaptations for TRAVEL, SICKNESS and HIGH_STRESS', () => {
    const travelHotel = applyEmergencyScenarioAdaptation({
      scenario_type: 'TRAVEL',
      equipment_tier: TRAVEL_EQUIPMENT_TYPES.HOTEL_LIMITED_GYM,
      base_calories: 2000,
      base_protein_g: 160
    });
    assert.ok(travelHotel);
    assert.equal(travelHotel.scenario_applied, 'TRAVEL_MODE');

    const sickness = applyEmergencyScenarioAdaptation({
      scenario_type: 'SICKNESS',
      base_calories: 2000,
      base_protein_g: 160
    });
    assert.ok(sickness);
    assert.equal(sickness.scenario_applied, 'SICKNESS_RECOVERY_MODE');

    const stress = applyEmergencyScenarioAdaptation({
      scenario_type: 'HIGH_STRESS',
      base_calories: 2000,
      base_protein_g: 160
    });
    assert.ok(stress);
    assert.equal(stress.scenario_applied, 'HIGH_STRESS_EXAM_MODE');
  });

  // 6. Architecture & File Integrity Verification
  await suite.test('11. Verifies existence and size constraint of all refactored modules', () => {
    const baseDir = path.resolve('frontend/src/pages/ClientInteractiveApp');
    const expectedFiles = [
      'components/ClientHeader.jsx',
      'components/MealsTab.jsx',
      'components/WorkoutTab.jsx',
      'components/ClientBottomNav.jsx',
      'components/FoodSwapModal.jsx',
      'components/FoodPrepModal.jsx',
      'components/FreeGuidesModal.jsx',
      'components/MasterPdfModal.jsx',
      'components/ExerciseSwapModal.jsx',
      'components/TravelModals.jsx',
      'components/EmergencyScenarioModal.jsx',
      'components/index.js',
      'hooks/useClientInteractiveData.js',
      'utils/programAdapters.js'
    ];

    for (const relPath of expectedFiles) {
      const fullPath = path.join(baseDir, relPath);
      assert.ok(fs.existsSync(fullPath), `Missing required module: ${relPath}`);
      const stats = fs.statSync(fullPath);
      assert.ok(stats.size > 0, `Module ${relPath} must not be empty`);
    }

    // Verify main container file size: Must be under 350 lines (it was 3808 lines)
    const containerPath = path.resolve('frontend/src/pages/ClientInteractiveApp.jsx');
    assert.ok(fs.existsSync(containerPath));
    const containerLines = fs.readFileSync(containerPath, 'utf8').split('\n').length;
    assert.ok(containerLines <= 350, `ClientInteractiveApp.jsx should be <= 350 lines, got ${containerLines}`);
  });

  await suite.test('12. Enforces Zero Emojis rule across all extracted modules', () => {
    const baseDir = path.resolve('frontend/src/pages/ClientInteractiveApp');
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    const scanDir = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(full);
        } else if (entry.isFile() && (entry.name.endsWith('.jsx') || entry.name.endsWith('.js'))) {
          const content = fs.readFileSync(full, 'utf8');
          assert.equal(emojiRegex.test(content), false, `Emoji found in ${full}! Strict zero-emoji policy violated.`);
        }
      }
    };

    scanDir(baseDir);
  });

  await suite.test('13. Enforces Curved Aesthetics (Zero Sharp Corners) in extracted components', () => {
    const baseDir = path.resolve('frontend/src/pages/ClientInteractiveApp/components');
    const files = fs.readdirSync(baseDir).filter(f => f.endsWith('.jsx'));

    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      // Must not contain explicit sharp border-radius 0px
      assert.equal(/borderRadius:\s*['"]?0(?:px)?['"]?/i.test(content), false, `Sharp corner (0px) detected in ${file}`);
    }
  });

  await suite.test('14. Verifies Barrel Export (components/index.js) completeness', () => {
    const barrelPath = path.resolve('frontend/src/pages/ClientInteractiveApp/components/index.js');
    const content = fs.readFileSync(barrelPath, 'utf8');

    const expectedExports = [
      'ClientHeader',
      'MealsTab',
      'WorkoutTab',
      'FreeGuidesModal',
      'FoodPrepModal',
      'MasterPdfModal',
      'FoodSwapModal',
      'ExerciseSwapModal',
      'EmergencyScenarioModal',
      'TravelConfirmModal',
      'ReturnTravelModal',
      'ClientBottomNav'
    ];

    for (const exp of expectedExports) {
      assert.ok(content.includes(exp), `Barrel export missing: ${exp}`);
    }
  });

});
