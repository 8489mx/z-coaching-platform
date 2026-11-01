import test from "node:test";
import assert from "node:assert/strict";
import { mergeAdaptedPlanIntoProgram } from "../src/api/utils/planMergeEngine.js";

const baseProgram = () => ({
  client_profile: { weight_kg: 80, gender: "male" },
  nutrition_program: {
    targets: { target_calories_kcal: 2000 },
    macro_targets: { calories_kcal: 2000, protein_g: 140, carbohydrate_g: 200, fat_g: 50 },
  },
  nutrition: { targets: { calories: 2000 } },
});

const flaggedShield = () => ({
  has_biomarker_flags: true,
  flags: [{ biomarker: "RENAL_FUNCTION", severity: "HIGH" }],
  dietary_modifications: { protein_cap_g_per_kg: 0.8 },
});

test("S3-3: a new flagged biomarker shield is carried into the stored program, top level and nutrition program", () => {
  const program = baseProgram();
  const adapted = {
    adapted_nutrition: { target_calories_kcal: 2000, protein_g: 64, carbohydrate_g: 200, fat_g: 50 },
    biomarker_analysis: flaggedShield(),
    clinical_safety_shield: flaggedShield(),
  };
  const merged = mergeAdaptedPlanIntoProgram(program, adapted, null);
  assert.equal(merged.clinical_safety_shield.has_biomarker_flags, true);
  assert.equal(merged.biomarker_analysis.flags[0].biomarker, "RENAL_FUNCTION");
  assert.equal(merged.nutrition_program.clinical_safety_shield.has_biomarker_flags, true);
  assert.equal(merged.nutrition_program.biomarker_analysis.flags[0].biomarker, "RENAL_FUNCTION");
  // The adapted shield is also available through adapted_nutrition on the input.
  const adaptedViaNutrition = {
    adapted_nutrition: {
      target_calories_kcal: 2000, protein_g: 64, carbohydrate_g: 200, fat_g: 50,
      biomarker_analysis: flaggedShield(),
      clinical_safety_shield: flaggedShield(),
    },
  };
  const merged2 = mergeAdaptedPlanIntoProgram(baseProgram(), adaptedViaNutrition, null);
  assert.equal(merged2.clinical_safety_shield.has_biomarker_flags, true);
  assert.equal(merged2.nutrition_program.clinical_safety_shield.has_biomarker_flags, true);
});

test("S3-3: a merge with no new biomarker result preserves the old stored shield, never clears it", () => {
  const program = baseProgram();
  program.clinical_safety_shield = flaggedShield();
  program.biomarker_analysis = flaggedShield();
  program.nutrition_program.clinical_safety_shield = flaggedShield();
  program.nutrition_program.biomarker_analysis = flaggedShield();
  const adapted = {
    adapted_nutrition: { target_calories_kcal: 2100, protein_g: 140, carbohydrate_g: 220, fat_g: 55 },
  };
  const merged = mergeAdaptedPlanIntoProgram(program, adapted, null);
  assert.equal(merged.clinical_safety_shield.has_biomarker_flags, true);
  assert.equal(merged.biomarker_analysis.flags[0].biomarker, "RENAL_FUNCTION");
  assert.equal(merged.nutrition_program.clinical_safety_shield.has_biomarker_flags, true);
  // The original stored program is not mutated by the merge.
  assert.equal(program.nutrition_program.macro_targets.calories_kcal, 2000);
});
