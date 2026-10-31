import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { calculateBMR, calculateMetabolicMacroProfile } from "../frontend/src/utils/metabolicMacroEngine.js";

test("FIX-03: Metabolic macro engine rejects missing or zero anthropometric inputs without silent 75kg/175cm/25y defaults", async (t) => {
  await t.test("1. Missing weight_kg, height_cm, or age returns is_valid: false and null targets instead of silent 75kg/175cm/25y", () => {
    const missingWeight = calculateMetabolicMacroProfile({
      gender: "MALE",
      age: 30,
      weight_kg: null,
      height_cm: 180,
    });
    assert.equal(missingWeight.is_valid, false);
    assert.ok(missingWeight.missing_fields.includes("weight_kg"));
    assert.equal(missingWeight.bmr_kcal, null);
    assert.equal(missingWeight.tdee_kcal, null);
    assert.equal(missingWeight.target_calories_kcal, null);
    assert.equal(missingWeight.macro_targets.protein_g, null);

    const zeroHeight = calculateMetabolicMacroProfile({
      gender: "FEMALE",
      age: 28,
      weight_kg: 65,
      height_cm: 0,
    });
    assert.equal(zeroHeight.is_valid, false);
    assert.ok(zeroHeight.missing_fields.includes("height_cm"));
    assert.equal(zeroHeight.target_calories_kcal, null);

    const missingAge = calculateMetabolicMacroProfile({
      gender: "MALE",
      age: "",
      weight_kg: 80,
      height_cm: 175,
    });
    assert.equal(missingAge.is_valid, false);
    assert.ok(missingAge.missing_fields.includes("age"));
    assert.equal(missingAge.target_calories_kcal, null);

    assert.equal(calculateBMR({ gender: "MALE", age: 30, weight_kg: 0, height_cm: 180 }), null);
  });

  await t.test("2. Valid inputs return is_valid: true and deterministic targets", () => {
    const valid = calculateMetabolicMacroProfile({
      gender: "MALE",
      age: 30,
      weight_kg: 80,
      height_cm: 180,
      daily_activity: "SEDENTARY_DESK",
      workout_frequency: "DAYS_3_TO_5",
      goal: "MAINTENANCE",
      protein_per_kg: 2.0,
    });
    assert.equal(valid.is_valid, true);
    assert.deepEqual(valid.missing_fields, []);
    assert.equal(valid.bmr_kcal, 1780);
    assert.equal(valid.tdee_kcal, 2403);
    assert.equal(valid.target_calories_kcal, 2403);
  });

  await t.test("3. MacroCalculator.jsx does not fall back to previous weight/height/age when importing a client, calls the backend endpoint, and blocks saving without server-calculated targets", () => {
    const src = fs.readFileSync(new URL("../frontend/src/pages/MacroCalculator.jsx", import.meta.url), "utf8");
    assert.ok(!src.includes("Number(cl.weight_kg || cl.weight) || prev.weight"), "Must not fallback to prev.weight when client weight is missing");
    assert.ok(!src.includes("Number(cl.height_cm || cl.height) || prev.height"), "Must not fallback to prev.height when client height is missing");
    assert.ok(!src.includes("calculateMetabolicMacroProfile"), "Must not compute targets in the browser (S4-7)");
    assert.ok(src.includes("/programs/calculate-targets"), "Must calculate through the backend endpoint (S4-7)");
    assert.ok(src.includes("!calcResult"), "Must guard handleApplyToClient when no server result exists");
  });
});
