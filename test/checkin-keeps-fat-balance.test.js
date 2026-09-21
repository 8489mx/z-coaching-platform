import test from "node:test";
import assert from "node:assert/strict";

import { buildAdaptedPlan } from "../src/adaptation-engine/index.js";

/**
 * The first plan keeps fat within 35% of energy (macro-balance-fat-share.test.js), but every check-in
 * increase for a diabetic moved carbohydrate above the 45% ceiling into fat, so months of steps crept
 * back to an oily plan. Check-ins now keep the same balance: protein takes the energy where the
 * kidneys allow (up to 2.2 g/kg of reference weight); otherwise the increase stops at the balance and
 * the coach decides.
 */
const program = ({ kidney }) => ({
  engine_version: "test",
  nutrition_program: {
    // As the first plan builds them: fat 35%; with a kidney cap carbohydrate carries the rest (54%).
    macro_targets: kidney ? { calories_kcal: 3000, protein_g: 80, carbohydrate_g: 407, fat_g: 117 } : { calories_kcal: 3000, protein_g: 150, carbohydrate_g: 337, fat_g: 98 },
    targets: { clinical_guardrails: { hypoglycemia_guard_active: true, kidney_protein_capped: kidney, kidney_condition: kidney, energy_reference_weight_kg: 100 } },
  },
  training_program: { weeks: [] },
});
const share = (n) => (n.fat_g * 9) / n.target_calories_kcal;

test("a diabetic's check-in increases never push fat above 35% of energy", () => {
  for (const kidney of [false, true]) {
    let current = program({ kidney });
    for (let i = 0; i < 6; i++) {
      const adapted = buildAdaptedPlan({ currentMasterProgram: current, checkinAnalysis: { analysis_status: "GAIN_STALL", current_average_weight_kg: 100, suggested_calorie_delta: 125 }, options: { currentWeekNumber: 1 } });
      const n = adapted.adapted_nutrition;
      assert.ok(share(n) <= 0.355, `kidney=${kidney} step ${i + 1}: fat ${Math.round(share(n) * 100)}%`);
      assert.ok((n.carbohydrate_g * 4) / n.target_calories_kcal <= (kidney ? 0.57 : 0.455), `carbs ${Math.round((n.carbohydrate_g * 400) / n.target_calories_kcal)}%`);
      current = JSON.parse(JSON.stringify(current));
      current.nutrition_program.macro_targets = { calories_kcal: n.target_calories_kcal, protein_g: n.protein_g, carbohydrate_g: n.carbohydrate_g, fat_g: n.fat_g };
    }
  }
});

test("without a kidney cap the extra energy goes to protein, up to 2.2 g/kg of reference weight", () => {
  const adapted = buildAdaptedPlan({ currentMasterProgram: program({ kidney: false }), checkinAnalysis: { analysis_status: "GAIN_STALL", current_average_weight_kg: 100, suggested_calorie_delta: 125 }, options: { currentWeekNumber: 1 } });
  assert.ok(adapted.adapted_nutrition.protein_g > 150 && adapted.adapted_nutrition.protein_g <= 220);
});

test("with a kidney cap the increase stops at the balance and the coach decides", () => {
  const adapted = buildAdaptedPlan({ currentMasterProgram: program({ kidney: true }), checkinAnalysis: { analysis_status: "GAIN_STALL", current_average_weight_kg: 100, suggested_calorie_delta: 125 }, options: { currentWeekNumber: 1 } });
  assert.equal(adapted.adapted_nutrition.protein_g, 80, "the kidney cap holds");
  assert.equal(adapted.requires_coach_approval, true);
  assert.ok(adapted.adaptation_reasons.some((r) => r.code === "FAT_SHARE_LIMIT_REACHED"));
});
