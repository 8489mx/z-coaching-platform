import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { User, Program } from "../src/api/models/index.js";
import { updateCustomProgram, getActiveProgramByUserId } from "../src/api/controllers/program.controller.js";

const CODE = "TEST_FIX01_CALC";
const PHONE = "01099880101";

function callController(fn, req) {
  const out = { status: 200, body: null };
  const res = {
    status(c) {
      out.status = c;
      return res;
    },
    json(b) {
      out.body = b;
      return res;
    },
  };
  return fn(req, res).then(() => out);
}

async function cleanup() {
  const u = await User.findOne({ where: { client_code: CODE } });
  if (u) {
    await Program.destroy({ where: { user_id: u.id } });
    await u.destroy();
  }
}

test("FIX-01: MacroCalculator save contract updates stored plan, editor targets, client_view, and PDF stages while preserving meals and fasting", async (t) => {
  await cleanup();
  t.after(async () => {
    await cleanup();
    await User.sequelize.close();
  });

  const user = await User.create({
    client_code: CODE,
    phone_number: PHONE,
    full_name: "متدرب اختبار الحاسبة",
    role: "CLIENT",
    subscription_status: "ACTIVE",
    plan_approval_status: "APPROVED",
  });

  const initialMeals = [
    {
      id: "meal_1",
      title: "وجبة الإفطار",
      macros: { calories: 600, protein: 45, carbs: 65, fats: 18 },
      items: [{ name: "بيض مسلوق", grams: 150, calories_kcal: 230 }],
    },
  ];

  await Program.create({
    user_id: user.id,
    status: "ACTIVE",
    program_data: {
      coach_notes: "ملاحظة الكوتش الأصلية محفوظة",
      intermittent_fasting_enabled: true,
      nutrition: {
        targets: { calories: 1800, protein: 150, carbs: 180, fats: 53 },
        meals: initialMeals,
      },
      nutrition_program: {
        targets: { target_calories_kcal: 1800, calories_kcal: 1800, protein_g: 150, carbohydrate_g: 180, fat_g: 53 },
        macro_targets: { calories_kcal: 1800, protein_g: 150, carbohydrate_g: 180, carb_g: 180, fat_g: 53 },
        stages: {
          energy_target: { target_calories_kcal: 1800, bmr_kcal: 1650, tdee_kcal: 2250 },
          macro_targets: { protein_g: 150, carbs_g: 180, carbohydrate_g: 180, fats_g: 53, fat_g: 53 },
        },
      },
    },
  });

  await t.test("1. Empty update payload without program_data or master_program is rejected with 400", async () => {
    const emptyRes = await callController(updateCustomProgram, {
      user: { id: user.id, role: "ADMIN" },
      body: { client_code: CODE },
    });
    assert.equal(emptyRes.status, 400);
  });

  await t.test("2. MacroCalculator payload updates stored calories from 1800 to 2032 across all consumers", async () => {
    const activeBefore = await callController(getActiveProgramByUserId, {
      user: { id: user.id, role: "ADMIN" },
      params: { user_id: CODE },
      query: {},
    });
    const master = JSON.parse(JSON.stringify(activeBefore.body.master_program));

    master.nutrition_program.stages.energy_target = {
      target_calories_kcal: 2032,
      bmr_kcal: 1730,
      tdee_kcal: 2540,
    };
    master.nutrition_program.stages.macro_targets = {
      protein_g: 176,
      carbs_g: 215,
      carbohydrate_g: 215,
      fats_g: 52,
      fat_g: 52,
    };

    const saveRes = await callController(updateCustomProgram, {
      user: { id: user.id, role: "ADMIN" },
      body: {
        client_code: CODE,
        master_program: master,
      },
    });
    assert.equal(saveRes.status, 200);

    const activeAfter = await callController(getActiveProgramByUserId, {
      user: { id: user.id, role: "ADMIN" },
      params: { user_id: CODE },
      query: {},
    });
    assert.equal(activeAfter.status, 200);

    const updatedMaster = activeAfter.body.master_program;
    // PDF view consumer
    assert.equal(updatedMaster.nutrition_program.stages.energy_target.target_calories_kcal, 2032);
    assert.equal(updatedMaster.nutrition_program.stages.macro_targets.protein_g, 176);
    // Coach editor consumer
    assert.equal(updatedMaster.nutrition_program.macro_targets.calories_kcal, 2032);
    assert.equal(updatedMaster.nutrition_program.macro_targets.protein_g, 176);
    assert.equal(updatedMaster.nutrition_program.macro_targets.carbohydrate_g, 215);
    assert.equal(updatedMaster.nutrition_program.macro_targets.fat_g, 52);
    assert.equal(updatedMaster.nutrition.targets.calories, 2032);
    assert.equal(updatedMaster.nutrition.targets.protein, 176);
    assert.equal(updatedMaster.nutrition.targets.carbs, 215);
    assert.equal(updatedMaster.nutrition.targets.fats, 52);
    // Client view / Flutter consumer
    assert.equal(activeAfter.body.client_view.target_macros.calories, 2032);
    assert.equal(activeAfter.body.client_view.target_macros.protein_g, 176);
    assert.equal(activeAfter.body.client_view.target_macros.carbs_g, 215);
    assert.equal(activeAfter.body.client_view.target_macros.fat_g, 52);
    // Preserved meals, fasting toggle, and coach notes
    assert.equal(updatedMaster.intermittent_fasting_enabled, true);
    assert.equal(updatedMaster.nutrition.meals.length, 1);
    assert.equal(updatedMaster.nutrition.meals[0].title, "وجبة الإفطار");

    const storedRow = await Program.findOne({ where: { user_id: user.id }, order: [["id", "DESC"]] });
    assert.equal(storedRow.program_data.coach_notes, "ملاحظة الكوتش الأصلية محفوظة");
  });

  await t.test("3. MacroCalculator.jsx sends program_data and populates nutrition.targets and macro_targets", () => {
    const src = fs.readFileSync(new URL("../frontend/src/pages/MacroCalculator.jsx", import.meta.url), "utf8");
    assert.ok(src.includes("program_data: master"), "MacroCalculator.jsx must send program_data: master");
    assert.ok(src.includes("master.nutrition.targets"), "MacroCalculator.jsx must update master.nutrition.targets");
    assert.ok(src.includes("master.nutrition_program.macro_targets"), "MacroCalculator.jsx must update master.nutrition_program.macro_targets");
  });
});
