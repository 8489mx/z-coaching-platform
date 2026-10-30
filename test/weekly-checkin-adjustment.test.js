import test from 'node:test';
import assert from 'node:assert/strict';

import { approveCheckin } from '../src/api/controllers/checkin.controller.js';
import { CheckinSubmission, Program } from '../src/api/models/index.js';

test('Check-in Approval Custom Macros Suite (weekly-audit tests retired in S3-4/S4-5)', async (t) => {

  await t.test('10. approveCheckin controller updates program nutrition targets when custom_macros are provided', async () => {
    let savedProgData = null;
    const mockCheckin = {
      id: 99,
      user_id: 1,
      analysis_output: { suggested_calorie_delta: 0 },
      status: 'PENDING',
      coach_notes: '',
      save: async () => {}
    };
    const mockProgram = {
      id: 101,
      user_id: 1,
      program_data: {
        nutrition: { targets: { calories: 2000, protein: 140, carbs: 220, fats: 60 } },
        nutrition_program: { macro_targets: { calories_kcal: 2000, protein_g: 140, carb_g: 220, fat_g: 60 } }
      },
      update: async ({ program_data }) => {
        savedProgData = program_data;
      }
    };

    const origFindCheckin = CheckinSubmission.findByPk;
    const origFindProgram = Program.findOne;
    CheckinSubmission.findByPk = async () => mockCheckin;
    Program.findOne = async () => mockProgram;

    try {
      let responseBody = null;
      let responseStatus = null;
      const req = {
        params: { checkinId: '99' },
        body: {
          coach_notes: 'ملاحظات الكوتش المعتمدة',
          custom_macros: { calories: 1850, protein: 155, carbs: 180, fats: 48 }
        }
      };
      const res = {
        status: (code) => {
          responseStatus = code;
          return {
            json: (data) => { responseBody = data; }
          };
        }
      };

      await approveCheckin(req, res);

      assert.equal(responseStatus, 200);
      assert.equal(responseBody.success, true);
      assert.equal(mockCheckin.status, 'APPROVED');
      assert.equal(mockCheckin.coach_notes, 'ملاحظات الكوتش المعتمدة');
      assert.ok(savedProgData);
      assert.equal(savedProgData.nutrition.targets.calories, 1850);
      assert.equal(savedProgData.nutrition.targets.protein, 155);
      assert.equal(savedProgData.nutrition.targets.carbs, 180);
      assert.equal(savedProgData.nutrition.targets.fats, 48);
      assert.equal(savedProgData.nutrition_program.macro_targets.calories_kcal, 1850);
      assert.equal(savedProgData.nutrition_program.macro_targets.protein_g, 155);
      assert.equal(savedProgData.nutrition_program.macro_targets.carb_g, 180);
      assert.equal(savedProgData.nutrition_program.macro_targets.fat_g, 48);
    } finally {
      CheckinSubmission.findByPk = origFindCheckin;
      Program.findOne = origFindProgram;
    }
  });

});

