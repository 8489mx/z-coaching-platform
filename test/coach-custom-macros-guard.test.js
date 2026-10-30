/* Guard for audit finding S3-2: coach custom macros must pass the same
   sanity bounds the adaptation engine applies to its own numbers. Today the
   merge applies custom macros verbatim, so a typo (800 kcal) becomes the
   client's plan. The coach stays the approving actor: out-of-range custom
   macros are rejected with a named error (the approval handler maps it to
   400) instead of being silently clamped, so the coach fixes the numbers
   and re-approves. Bounds mirror buildAdaptedPlan exactly: the sex-specific
   calorie floor (1200/1500), the 55 kcal/kg ceiling on the reference
   weight, the under-18 maintenance rule, and the diabetic carbohydrate
   share. The laboratory kidney protein cap was already enforced by the
   merge and is pinned here as a regression. A check the merge cannot
   compute (no usable weight for the ceiling) is skipped, never fatal. */
import test from "node:test";
import assert from "node:assert/strict";

import { mergeAdaptedPlanIntoProgram } from "../src/api/utils/planMergeEngine.js";

function baseProgram(overrides = {}) {
  return {
    client_profile: { gender: "male", weight_kg: 82, age: 36 },
    nutrition_program: {
      targets: {
        target_calories: 2637,
        protein_g: 148,
        carb_g: 367,
        fat_g: 64,
        tdee: 2637,
        protein_reference_weight_kg: 82,
        protein_reference_basis: "TOTAL_BODY_WEIGHT",
        clinical_guardrails: {},
      },
      macro_targets: { calories_kcal: 2637, protein_g: 148, carbohydrate_g: 367, fat_g: 64 },
    },
    ...overrides,
  };
}

function expectRejected(program, custom, pattern) {
  assert.throws(
    () => mergeAdaptedPlanIntoProgram(program, {}, custom),
    (err) => {
      assert.equal(err.code, "CUSTOM_MACROS_OUT_OF_RANGE");
      assert.match(err.message, pattern);
      return true;
    }
  );
}

test("custom calories below the male floor are rejected, not merged", () => {
  expectRejected(baseProgram(), { calories: 800, protein: 50, carbs: 100, fats: 20 }, /1500/);
});

test("custom calories below the female floor are rejected", () => {
  const program = baseProgram();
  program.client_profile.gender = "female";
  expectRejected(program, { calories: 1100, protein: 90, carbs: 140, fats: 35 }, /1200/);
});

test("custom calories above the 55 kcal/kg ceiling are rejected", () => {
  // Ceiling: max(round(82 * 55), 2637) = 4510.
  expectRejected(baseProgram(), { calories: 6000, protein: 200, carbs: 700, fats: 150 }, /4510/);
});

test("a non-positive custom macro is rejected", () => {
  expectRejected(baseProgram(), { calories: 2400, protein: -20, carbs: 330, fats: 60 }, /protein/i);
});

test("sane custom macros merge normally", () => {
  const merged = mergeAdaptedPlanIntoProgram(baseProgram(), {}, { calories: 2400, protein: 140, carbs: 330, fats: 60 });
  assert.equal(merged.nutrition_program.macro_targets.calories_kcal, 2400);
  assert.equal(merged.nutrition_program.targets.protein_g, 140);
});

test("the ceiling is skipped when no usable weight exists, without crashing", () => {
  const program = baseProgram();
  delete program.client_profile.weight_kg;
  program.nutrition_program.targets.protein_reference_weight_kg = undefined;
  const merged = mergeAdaptedPlanIntoProgram(program, {}, { calories: 9000, protein: 200, carbs: 700, fats: 150 });
  assert.equal(merged.nutrition_program.macro_targets.calories_kcal, 9000);
});

test("the kidney protein cap still applies to custom macros", () => {
  const program = baseProgram();
  program.nutrition_program.targets.clinical_guardrails = {
    kidney_protein_capped: true,
    max_protein_g: 100,
  };
  const merged = mergeAdaptedPlanIntoProgram(program, {}, { calories: 2400, protein: 150, carbs: 330, fats: 60 });
  assert.equal(merged.nutrition_program.macro_targets.protein_g, 100);
});

test("an under-18 trainee cannot be custom-set below maintenance", () => {
  const program = baseProgram();
  program.nutrition_program.targets.clinical_guardrails = { is_young_trainee: true };
  expectRejected(program, { calories: 2000, protein: 140, carbs: 300, fats: 55 }, /maintenance|نمو/i);
});

test("diabetic carbohydrate share is enforced on custom macros", () => {
  const program = baseProgram();
  program.nutrition_program.targets.clinical_guardrails = { hypoglycemia_guard_active: true };
  // Max carbs at 45% of 2400 kcal = 270 g; 400 g breaches it.
  expectRejected(program, { calories: 2400, protein: 140, carbs: 400, fats: 60 }, /carbohydrate|نشويات/i);
  const ok = mergeAdaptedPlanIntoProgram(program, {}, { calories: 2400, protein: 140, carbs: 260, fats: 60 });
  assert.equal(ok.nutrition_program.macro_targets.carbohydrate_g, 260);
});
