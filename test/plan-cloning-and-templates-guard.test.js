import test from 'node:test';
import assert from 'node:assert/strict';

// Import Cloning Engine from frontend utils
import {
  cloneExercise,
  duplicateExerciseInSession,
  copyExerciseToSession,
  cloneTrainingSession,
  cloneMeal,
  copyMealItemToMeal,
  PRESET_TRAINING_DAY_TEMPLATES,
  applyTrainingDayTemplate,
  PRESET_MEAL_TEMPLATES,
  applyMealTemplate
} from '../frontend/src/utils/planCloningEngine.js';

import { MASTER_EXERCISE_DICTIONARY } from '../src/exercise-catalog-v2/master-exercise-translations.js';
import { FOOD_REFERENCE } from '../frontend/src/data/foodReference.js';

test('Plan Cloning and Templates Engine (Units E & F): Guardrails and Behavioral Verification', async (t) => {

  await t.test('1. cloneExercise produces deep-cloned exercise with unique ID and zero reference leaking', () => {
    const originalEx = {
      id: 'ex_bench_1',
      code: 'BARBELL_BENCH_PRESS',
      name: 'Barbell Bench Press',
      name_ar: 'بنش برس بالبار مستوي',
      name_en: 'Barbell Bench Press',
      sets: 4,
      reps: '8 - 10',
      rir: 2,
      restSec: 90,
      equipment: 'بار حر + بنش',
      safetyNote: 'الحفاظ على ثبات لوحي الكتف وملامسة الصدر بتحكم',
      prescription: { sets: 4, target_min: 8, target_max: 10, target_rir: 2, rest_seconds: 90 },
      tags: ['CHEST', 'COMPOUND']
    };

    const cloned = cloneExercise(originalEx);

    assert.notEqual(cloned.id, originalEx.id, 'Cloned exercise must have a distinct unique ID');
    assert.equal(cloned.code, originalEx.code, 'Exercise code must match');
    assert.equal(cloned.sets, 4);
    assert.equal(cloned.reps, '8 - 10');
    assert.equal(cloned.rir, 2);
    assert.equal(cloned.restSec, 90);

    // Deep isolation test: mutation on clone must not touch original
    cloned.sets = 5;
    cloned.tags.push('MUTATED');
    cloned.prescription.sets = 5;

    assert.equal(originalEx.sets, 4, 'Original sets must not be mutated');
    assert.equal(originalEx.tags.length, 2, 'Original tags array must remain isolated');
    assert.equal(originalEx.prescription.sets, 4, 'Original prescription must remain isolated');
  });

  await t.test('2. duplicateExerciseInSession inserts cloned exercise immediately after source exercise', () => {
    const session = {
      id: 'sess_1',
      name: 'اليوم التدريبي 1',
      exercises: [
        { id: 'ex_1', code: 'BARBELL_BENCH_PRESS', sets: 4, reps: '8 - 10' },
        { id: 'ex_2', code: 'INCLINE_DUMBBELL_BENCH_PRESS', sets: 3, reps: '10 - 12' },
        { id: 'ex_3', code: 'TRICEPS_ROPE_PUSHDOWN', sets: 3, reps: '12 - 15' }
      ]
    };

    const updated = duplicateExerciseInSession(session, 1);

    assert.equal(updated.exercises.length, 4, 'Must have 4 exercises after duplication');
    assert.equal(updated.exercises[1].code, 'INCLINE_DUMBBELL_BENCH_PRESS');
    assert.equal(updated.exercises[2].code, 'INCLINE_DUMBBELL_BENCH_PRESS', 'Cloned exercise must be at index 2');
    assert.notEqual(updated.exercises[2].id, updated.exercises[1].id, 'Must have unique ID');
    assert.equal(updated.exercises[3].code, 'TRICEPS_ROPE_PUSHDOWN');

    // Original session unchanged
    assert.equal(session.exercises.length, 3, 'Original session must not be modified in place');
  });

  await t.test('3. copyExerciseToSession copies exercise from source session to target session cleanly', () => {
    const sourceSession = {
      id: 'sess_push',
      name: 'يوم الدفع',
      exercises: [
        { id: 'ex_lateral', code: 'DUMBBELL_LATERAL_RAISE', sets: 4, reps: '12 - 15', rir: 1, restSec: 60 }
      ]
    };

    const targetSession = {
      id: 'sess_pull',
      name: 'يوم السحب',
      exercises: [
        { id: 'ex_lat', code: 'LAT_PULLDOWN', sets: 4, reps: '10 - 12' }
      ]
    };

    const updatedTarget = copyExerciseToSession(sourceSession, 0, targetSession);

    assert.equal(updatedTarget.exercises.length, 2);
    assert.equal(updatedTarget.exercises[1].code, 'DUMBBELL_LATERAL_RAISE');
    assert.notEqual(updatedTarget.exercises[1].id, sourceSession.exercises[0].id);

    // Source unchanged
    assert.equal(sourceSession.exercises.length, 1);
    assert.equal(targetSession.exercises.length, 1);
  });

  await t.test('4. cloneTrainingSession duplicates day with unique session ID, name suffix, and fresh exercise IDs', () => {
    const session = {
      id: 'sess_original',
      name: 'يوم الأرجل 1',
      target_muscles: 'عضلات الفخذ والسمانة',
      exercises: [
        { id: 'ex_squat', code: 'BARBELL_BACK_SQUAT', sets: 4, reps: '6 - 8' },
        { id: 'ex_rdl', code: 'ROMANIAN_DEADLIFT', sets: 3, reps: '8 - 10' }
      ],
      pre_workout_mobility: ['mob_hips', 'mob_ankles'],
      post_workout_stretches: ['stretch_quads']
    };

    const cloned = cloneTrainingSession(session);

    assert.notEqual(cloned.id, session.id);
    assert.ok(cloned.name.includes('(نسخة)'), `Name should include (نسخة), got: ${cloned.name}`);
    assert.equal(cloned.exercises.length, 2);
    assert.notEqual(cloned.exercises[0].id, session.exercises[0].id);
    assert.notEqual(cloned.exercises[1].id, session.exercises[1].id);

    // Mutating cloned session does not alter original
    cloned.exercises[0].sets = 10;
    cloned.pre_workout_mobility.push('mob_extra');
    assert.equal(session.exercises[0].sets, 4);
    assert.equal(session.pre_workout_mobility.length, 2);
  });

  await t.test('5. cloneMeal duplicates meal, items, and recalculates exact macros without reference leaks', () => {
    const meal = {
      id: 'm_lunch',
      name: 'وجبة الغداء',
      time: '02:00 م',
      macros: { calories: 550, protein: 45, carbs: 60, fats: 12 },
      items: [
        { id: 'it_1', code: 'CHICKEN_BREAST', name: 'صدور دجاج', amount: 150, p: 46.5, c: 0, f: 5.4, cal: 247.5 },
        { id: 'it_2', code: 'BASMATI_RICE_COOKED', name: 'أرز بسمتي مطهو', amount: 200, p: 7.0, c: 50.4, f: 0.8, cal: 242.0 },
        { id: 'it_3', code: 'OLIVE_OIL', name: 'زيت زيتون بكر ممتاز', amount: 10, p: 0, c: 0, f: 10.0, cal: 88.4 }
      ]
    };

    const cloned = cloneMeal(meal);

    assert.notEqual(cloned.id, meal.id);
    assert.ok(cloned.name.includes('(نسخة)'), `Cloned meal name must have (نسخة), got: ${cloned.name}`);
    assert.equal(cloned.items.length, 3);
    assert.notEqual(cloned.items[0].id, meal.items[0].id);
    assert.notEqual(cloned.items[1].id, meal.items[1].id);

    // Sum of items matches meal totals
    const sumP = Number(cloned.items.reduce((acc, it) => acc + (it.p || 0), 0).toFixed(1));
    const sumC = Number(cloned.items.reduce((acc, it) => acc + (it.c || 0), 0).toFixed(1));
    const sumF = Number(cloned.items.reduce((acc, it) => acc + (it.f || 0), 0).toFixed(1));
    const sumCal = Math.round(cloned.items.reduce((acc, it) => acc + (it.cal || 0), 0));

    assert.equal(cloned.macros.protein, sumP);
    assert.equal(cloned.macros.carbs, sumC);
    assert.equal(cloned.macros.fats, sumF);
    assert.equal(cloned.macros.calories, sumCal);

    // Mutation isolation
    cloned.items[0].amount = 300;
    cloned.items[0].p = 93;
    assert.equal(meal.items[0].amount, 150);
    assert.equal(meal.items[0].p, 46.5);
  });

  await t.test('6. copyMealItemToMeal copies food item with unique ID and recomputes target meal macros', () => {
    const sourceMeal = {
      id: 'm1',
      items: [
        { id: 'it_almond', code: 'ALMONDS_RAW', name: 'لوز نيء', amount: 30, p: 6.4, c: 6.5, f: 14.9, cal: 174 }
      ]
    };
    const targetMeal = {
      id: 'm2',
      name: 'سناك مسائي',
      macros: { calories: 100, protein: 10, carbs: 5, fats: 2 },
      items: [
        { id: 'it_cottage', code: 'COTTAGE_CHEESE_LOW_FAT_2_PERCENT', name: 'جبن قريش', amount: 100, p: 12.0, c: 4.0, f: 2.0, cal: 84 }
      ]
    };

    const updated = copyMealItemToMeal(sourceMeal, 0, targetMeal);

    assert.equal(updated.items.length, 2);
    assert.equal(updated.items[1].code, 'ALMONDS_RAW');
    assert.notEqual(updated.items[1].id, sourceMeal.items[0].id);

    // Recomputed macros for target
    assert.equal(updated.macros.protein, 18.4);
    assert.equal(updated.macros.carbs, 10.5);
    assert.equal(updated.macros.fats, 16.9);
    assert.equal(updated.macros.calories, 258);
  });

  await t.test('7. PRESET_TRAINING_DAY_TEMPLATES contains valid evidence-based split days recognized by catalog', () => {
    const expectedKeys = ['PUSH_DAY', 'PULL_DAY', 'LEGS_DAY', 'UPPER_BODY', 'LOWER_BODY', 'FULL_BODY'];
    for (const key of expectedKeys) {
      assert.ok(PRESET_TRAINING_DAY_TEMPLATES[key], `Preset training template ${key} must exist`);
      const tpl = PRESET_TRAINING_DAY_TEMPLATES[key];
      assert.ok(tpl.name_ar, `Template ${key} must have name_ar`);
      assert.ok(Array.isArray(tpl.exercises) && tpl.exercises.length >= 4, `Template ${key} must have at least 4 exercises`);

      // All exercise codes must exist in MASTER_EXERCISE_DICTIONARY
      for (const ex of tpl.exercises) {
        assert.ok(
          MASTER_EXERCISE_DICTIONARY[ex.code],
          `Template ${key} exercise code ${ex.code} must exist in MASTER_EXERCISE_DICTIONARY`
        );
        assert.ok(ex.sets >= 2 && ex.sets <= 5, `${ex.code} sets must be between 2 and 5`);
        assert.ok(ex.reps, `${ex.code} must have reps`);
        assert.ok(ex.rir >= 1 && ex.rir <= 3, `${ex.code} RIR must be between 1 and 3`);
        assert.ok(ex.restSec >= 45 && ex.restSec <= 180, `${ex.code} restSec must be realistic`);
      }

      // Test applyTrainingDayTemplate
      const session = applyTrainingDayTemplate(key, `يوم ${tpl.name_ar}`);
      assert.ok(session.id.startsWith('sess_'));
      assert.equal(session.name, `يوم ${tpl.name_ar}`);
      assert.equal(session.exercises.length, tpl.exercises.length);
    }
  });

  await t.test('8. PRESET_MEAL_TEMPLATES contains valid culinary meals recognized by FOOD_REFERENCE', () => {
    const expectedKeys = [
      'BALANCED_BREAKFAST',
      'HIGH_PROTEIN_LUNCH',
      'LEAN_BEEF_POTATO_DINNER',
      'HIGH_PROTEIN_SNACK',
      'LIGHT_COTTAGE_CHEESE_MEAL'
    ];

    for (const key of expectedKeys) {
      assert.ok(PRESET_MEAL_TEMPLATES[key], `Preset meal template ${key} must exist`);
      const tpl = PRESET_MEAL_TEMPLATES[key];
      assert.ok(tpl.name_ar, `Meal template ${key} must have name_ar`);
      assert.ok(Array.isArray(tpl.items) && tpl.items.length >= 2, `Meal template ${key} must have at least 2 items`);

      // Verify all foods exist in FOOD_REFERENCE
      for (const it of tpl.items) {
        assert.ok(
          FOOD_REFERENCE[it.code],
          `Meal template ${key} item code ${it.code} must exist in FOOD_REFERENCE`
        );
        assert.ok(it.amount > 0, `${it.code} amount must be > 0`);
      }

      // Test applyMealTemplate
      const meal = applyMealTemplate(key, 1);
      assert.ok(meal.id.startsWith('m_'));
      assert.equal(meal.name, tpl.name_ar);
      assert.equal(meal.items.length, tpl.items.length);
      assert.ok(meal.macros.calories > 100, 'Meal calories must be > 100');
      assert.ok(meal.macros.protein > 10, 'Meal protein must be > 10');
    }
  });

  await t.test('9. useCoachEditorData exports cloning, template application, and preset dictionaries', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const hookSrc = fs.readFileSync(path.resolve(process.cwd(), 'frontend/src/pages/CoachEditor/hooks/useCoachEditorData.js'), 'utf8');

    assert.ok(hookSrc.includes('handleDuplicateExercise,'), 'Must export handleDuplicateExercise');
    assert.ok(hookSrc.includes('handleCopyExerciseToSession,'), 'Must export handleCopyExerciseToSession');
    assert.ok(hookSrc.includes('handleApplyDayTemplate,'), 'Must export handleApplyDayTemplate');
    assert.ok(hookSrc.includes('handleApplyMealTemplate,'), 'Must export handleApplyMealTemplate');
    assert.ok(hookSrc.includes('PRESET_TRAINING_DAY_TEMPLATES,'), 'Must export PRESET_TRAINING_DAY_TEMPLATES');
    assert.ok(hookSrc.includes('PRESET_MEAL_TEMPLATES,'), 'Must export PRESET_MEAL_TEMPLATES');
  });

  await t.test('10. CoachTrainingTab and CoachEditorNutritionTab expose day and meal cloning/template UI controls', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const trainingTabSrc = fs.readFileSync(path.resolve(process.cwd(), 'frontend/src/pages/CoachEditor/components/CoachTrainingTab.jsx'), 'utf8');
    const nutritionTabSrc = fs.readFileSync(path.resolve(process.cwd(), 'frontend/src/features/coach/components/CoachEditorNutritionTab.jsx'), 'utf8');

    // Training Tab UI controls
    assert.ok(trainingTabSrc.includes('قوالب الأيام'), 'Training tab must render Day Templates button');
    assert.ok(trainingTabSrc.includes('handleDuplicateExercise'), 'Training tab must support duplicate exercise');
    assert.ok(trainingTabSrc.includes('نسخ ليوم...'), 'Training tab must support copy exercise to day');

    // Nutrition Tab UI controls
    assert.ok(nutritionTabSrc.includes('قوالب الوجبات'), 'Nutrition tab must render Meal Templates button');
    assert.ok(nutritionTabSrc.includes('handleDuplicateMeal'), 'Nutrition tab must support duplicate meal');
  });

});
