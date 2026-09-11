import test from 'node:test';
import assert from 'node:assert/strict';

import { mergeAdaptedPlanIntoProgram } from '../src/api/utils/planMergeEngine.js';
import { approveCheckin } from '../src/api/controllers/checkin.controller.js';
import { CheckinSubmission, Program } from '../src/api/models/index.js';
import programRouter from '../src/api/routes/program.routes.js';

test('Tier 1 Suite: Check-in Plan Preservation & Idempotent Plan Merge Engine', async (t) => {

  const sampleMasterProgram = {
    engine_version: '2.0.0',
    current_training_week: 1,
    client: { id: 42, name: 'كابتن أحمد' },
    nutrition: {
      targets: { calories: 2400, protein: 180, carbs: 260, fats: 70 },
      meals: [
        {
          id: 'meal_1',
          name: 'وجبة الإفطار',
          time: '08:00',
          items: [
            { food: 'بيض كامل مسلوق', amount_g: 150, calories: 232, protein: 19 },
            { food: 'شوفان مع حليب لوز', amount_g: 80, calories: 300, protein: 10 }
          ]
        },
        {
          id: 'meal_2',
          name: 'وجبة الغداء',
          time: '14:00',
          items: [
            { food: 'صدر دجاج مشوي', amount_g: 200, calories: 330, protein: 62 },
            { food: 'أرز بسمتي مطبوخ', amount_g: 250, calories: 325, protein: 7 }
          ]
        },
        {
          id: 'meal_3',
          name: 'وجبة العشاء',
          time: '20:00',
          items: [
            { food: 'جبن قريش طبيعي', amount_g: 200, calories: 196, protein: 28 },
            { food: 'زيت زيتون بكر', amount_g: 10, calories: 88, fats: 10 }
          ]
        }
      ]
    },
    nutrition_program: {
      targets: { calories_kcal: 2400, protein_g: 180, carb_g: 260, fat_g: 70 },
      macro_targets: { calories_kcal: 2400, protein_g: 180, carb_g: 260, fat_g: 70 },
      quantized_plan: {
        daily_totals: { calories_kcal: 2400, protein_g: 180, carbs_g: 260, fat_g: 70 }
      },
      culinary_meals: [
        { recipe_name: 'سلطة سيزر صحية مع فيليه الدجاج', prep_time_min: 15 }
      ]
    },
    training_program: {
      is_deload: false,
      weeks: [
        {
          week_number: 1,
          phase: 'HYPERTROPHY_BLOCK_1',
          days: [
            {
              day_number: 1,
              title: 'Push Day A',
              exercises: [
                { name: 'Barbell Bench Press', sets: 4, reps: '8-10', rpe: 8, rest_sec: 120 },
                { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', rpe: 8.5, rest_sec: 90 }
              ]
            }
          ]
        },
        {
          week_number: 2,
          phase: 'HYPERTROPHY_BLOCK_1',
          days: [
            {
              day_number: 1,
              title: 'Push Day A',
              exercises: [
                { name: 'Barbell Bench Press', sets: 4, reps: '8-10', rpe: 8.5, rest_sec: 120 },
                { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', rpe: 9, rest_sec: 90 }
              ]
            }
          ]
        }
      ]
    },
    cardio_program: {
      prescription: {
        daily_step_target: 8000,
        weekly_sessions: 3
      }
    }
  };

  await t.test('1. Preserves 100% of nutrition.meals and culinary_meals while updating macro targets', () => {
    const adaptationResult = {
      adapted_week_number: 2,
      adaptation_action: 'CALORIE_DEFICIT_TITRATION',
      adaptation_reasons: [{ code: 'PLATEAU_DEFICIT', message_ar: 'كسر ثبات الوزن' }],
      adapted_nutrition: {
        target_calories_kcal: 2275,
        protein_g: 180,
        carbohydrate_g: 235,
        fat_g: 65
      }
    };

    const merged = mergeAdaptedPlanIntoProgram(sampleMasterProgram, adaptationResult);

    // Nutrition meals MUST be completely preserved
    assert.ok(merged.nutrition);
    assert.equal(merged.nutrition.meals.length, 3);
    assert.deepEqual(merged.nutrition.meals, sampleMasterProgram.nutrition.meals);
    assert.deepEqual(merged.nutrition_program.culinary_meals, sampleMasterProgram.nutrition_program.culinary_meals);

    // Target macros must be updated across all schemas
    assert.equal(merged.nutrition.targets.calories, 2275);
    assert.equal(merged.nutrition.targets.carbs, 235);
    assert.equal(merged.nutrition.targets.protein, 180);
    assert.equal(merged.nutrition.targets.fats, 65);

    assert.equal(merged.nutrition_program.targets.target_calories, 2275);
    assert.equal(merged.nutrition_program.macro_targets.calories_kcal, 2275);
    assert.equal(merged.nutrition_program.macro_targets.carb_g, 235);
    assert.equal(merged.nutrition_program.quantized_plan.daily_totals.calories_kcal, 2275);
    assert.equal(merged.nutrition_program.quantized_plan.daily_totals.carbs_g, 235);

    // Original program object was NOT mutated
    assert.equal(sampleMasterProgram.nutrition.targets.calories, 2400);
  });

  await t.test('2. Coach custom overrides take precedence over adaptation engine recommendations', () => {
    const adaptationResult = {
      adapted_week_number: 2,
      adapted_nutrition: {
        target_calories_kcal: 2275,
        protein_g: 180,
        carbohydrate_g: 235,
        fat_g: 65
      }
    };

    const customMacros = {
      calories: 2100,
      protein: 190,
      carbs: 200,
      fats: 60
    };

    const merged = mergeAdaptedPlanIntoProgram(sampleMasterProgram, adaptationResult, customMacros);

    assert.equal(merged.nutrition.targets.calories, 2100);
    assert.equal(merged.nutrition.targets.protein, 190);
    assert.equal(merged.nutrition.targets.carbs, 200);
    assert.equal(merged.nutrition.targets.fats, 60);
    assert.equal(merged.nutrition_program.macro_targets.calories_kcal, 2100);
  });

  await t.test('3. Idempotency: Double approval never duplicates weeks or exercises', () => {
    const adaptationResult = {
      adapted_week_number: 2,
      adapted_training_week: {
        week_number: 2,
        phase: 'HYPERTROPHY_BLOCK_1_ADAPTED',
        days: [
          {
            day_number: 1,
            title: 'Push Day A - Progressive Micro-Load',
            exercises: [
              { name: 'Barbell Bench Press', sets: 4, reps: '8-10', rpe: 9, rest_sec: 120 }
            ]
          }
        ]
      }
    };

    // First merge
    const mergedOnce = mergeAdaptedPlanIntoProgram(sampleMasterProgram, adaptationResult);
    assert.equal(mergedOnce.training_program.weeks.length, 2, 'Weeks length should remain 2 after first adaptation');
    assert.equal(mergedOnce.training_program.weeks[1].phase, 'HYPERTROPHY_BLOCK_1_ADAPTED');

    // Second merge (simulating coach double click / retry / duplicate request)
    const mergedTwice = mergeAdaptedPlanIntoProgram(mergedOnce, adaptationResult);
    assert.equal(mergedTwice.training_program.weeks.length, 2, 'Weeks length MUST remain 2 after second adaptation');
    assert.equal(mergedTwice.training_program.weeks[0].week_number, 1);
    assert.equal(mergedTwice.training_program.weeks[1].week_number, 2);
    assert.equal(mergedTwice.training_program.weeks[1].phase, 'HYPERTROPHY_BLOCK_1_ADAPTED');
    assert.deepEqual(mergedOnce.training_program.weeks, mergedTwice.training_program.weeks);
  });

  await t.test('4. Chronological Week Insertion: Correctly sorts when appending higher week number', () => {
    const adaptationResult = {
      adapted_week_number: 3,
      adapted_training_week: {
        week_number: 3,
        phase: 'INTENSIFICATION_WEEK_3',
        days: [{ day_number: 1, title: 'Push Day Intensity' }]
      }
    };

    const merged = mergeAdaptedPlanIntoProgram(sampleMasterProgram, adaptationResult);
    assert.equal(merged.training_program.weeks.length, 3);
    assert.equal(merged.training_program.weeks[0].week_number, 1);
    assert.equal(merged.training_program.weeks[1].week_number, 2);
    assert.equal(merged.training_program.weeks[2].week_number, 3);
    assert.equal(merged.current_training_week, 3);
  });

  await t.test('5. Deload flag and cardio step targets are safely applied without touching meals', () => {
    const adaptationResult = {
      adapted_week_number: 2,
      is_deload_recommended: true,
      adapted_cardio: {
        daily_step_target: 10000
      }
    };

    const merged = mergeAdaptedPlanIntoProgram(sampleMasterProgram, adaptationResult);

    assert.equal(merged.training_program.is_deload, true);
    assert.ok(merged.training_program.deload_note.includes('تفريغ أحمال'));
    assert.equal(merged.cardio_program.prescription.daily_step_target, 10000);
    assert.equal(merged.cardio_program.prescription.weekly_sessions, 3); // Untouched
    assert.equal(merged.nutrition.meals.length, 3); // Untouched
  });

  await t.test('6. End-to-End Controller Integration: approveCheckin updates DB program while preserving meals and weeks', async () => {
    let savedProgramData = null;
    let savedCheckinStatus = null;

    const mockCheckin = {
      id: 501,
      user_id: 42,
      week_number: 1,
      status: 'PENDING',
      coach_notes: '',
      analysis_output: {
        suggested_calorie_delta: -150,
        suggested_carb_delta_g: -35,
        is_deload_recommended: false
      },
      save: async function() {
        savedCheckinStatus = this.status;
      }
    };

    const mockProgram = {
      id: 901,
      user_id: 42,
      program_data: JSON.parse(JSON.stringify(sampleMasterProgram)),
      update: async function({ program_data }) {
        savedProgramData = program_data;
        this.program_data = program_data;
      }
    };

    const origFindByPk = CheckinSubmission.findByPk;
    const origFindOne = Program.findOne;
    CheckinSubmission.findByPk = async (id) => (Number(id) === 501 ? mockCheckin : null);
    Program.findOne = async () => mockProgram;

    try {
      let statusCode = null;
      let jsonPayload = null;

      const req = {
        params: { checkinId: '501' },
        body: {
          coach_notes: 'استمر يا بطل، تم خفض الكارب لكسر الثبات',
          custom_macros: null
        }
      };

      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (payload) => { jsonPayload = payload; }
          };
        }
      };

      await approveCheckin(req, res);

      assert.equal(statusCode, 200);
      assert.equal(jsonPayload.success, true);
      assert.equal(savedCheckinStatus, 'APPROVED');
      assert.equal(mockCheckin.coach_notes, 'استمر يا بطل، تم خفض الكارب لكسر الثبات');

      // Crucial verification: Meals and Exercises must be preserved in DB program_data!
      assert.ok(savedProgramData, 'program_data must be saved');
      assert.equal(savedProgramData.nutrition.meals.length, 3, 'All 3 meals must be present');
      assert.deepEqual(savedProgramData.nutrition.meals, sampleMasterProgram.nutrition.meals);
      assert.equal(savedProgramData.training_program.weeks.length, 2, 'All training weeks must be present');

      // Calorie adjustment applied accurately
      assert.equal(savedProgramData.nutrition.targets.calories, 2250); // 2400 - 150
      assert.equal(savedProgramData.nutrition.targets.carbs, 225); // 260 - 35
    } finally {
      CheckinSubmission.findByPk = origFindByPk;
      Program.findOne = origFindOne;
    }
  });

  await t.test('7. Dead Route Elimination: POST /api/v1/programs/checkin/approve does NOT exist in programRouter', () => {
    // Check all routes registered in programRouter
    const routes = programRouter.stack
      .filter(layer => layer.route)
      .map(layer => {
        const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
        return `${methods} ${layer.route.path}`;
      });

    const deadRouteExists = routes.some(r => r.includes('checkin/approve') || r.includes('approveWeeklyCheckin'));
    assert.equal(deadRouteExists, false, 'The dead program checkin approve route must NOT exist in programRouter');
  });

});
