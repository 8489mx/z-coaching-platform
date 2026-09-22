import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";

/**
 * Every pregnancy got the second-trimester surplus (+340 kcal). IOM (2005): +0 in the first
 * trimester, +340 in the second, +452 in the third (the guideline keeps 450). The intake now asks
 * the trimester (only when pregnant); not given keeps +340. Never a deficit.
 */
const CATALOG = JSON.parse(fs.readFileSync("data/catalogs/core-global-food-batch-v1.json", "utf8"));
const CONTEXT = { system_time: "2026-09-22T08:00:00.000Z", assessmentDate: "2026-09-22" };
const kcalFor = (extra) => {
  const t = buildMasterEngineV2({ intake: {
    gender: "female", age: "30", height_cm: "165", weight_kg: "65", circumferences: { neck_cm: "32", waist_cm: "75", hips_cm: "98" },
    primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
    religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
    training_environment: "commercial_gym", training_logistics: { days_per_week: 3, training_age: "never" }, recent_training: "ACTIVE",
    female_pregnancy: "PREGNANT", ...extra,
  }, evaluationContext: CONTEXT, nutritionFoodCatalog: CATALOG, options: {} }).nutrition_program.targets;
  return t.calories_kcal ?? t.target_calories ?? t.calories;
};

test("pregnancy energy follows the trimester", () => {
  const first = kcalFor({ pregnancy_trimester: "1" });
  assert.equal(kcalFor({ pregnancy_trimester: "2" }) - first, 340);
  assert.equal(kcalFor({ pregnancy_trimester: "3" }) - first, 450);
  assert.equal(kcalFor({}) - first, 340, "not given: second trimester");
});

test("the form asks the trimester only when pregnant, and requires it", () => {
  const form = fs.readFileSync("frontend/src/pages/FullIntakeForm.jsx", "utf8");
  assert.match(form, /formData\.female_pregnancy === 'PREGNANT' && \(/);
  for (const v of ["'1'", "'2'", "'3'"]) assert.ok(form.includes(`pregnancy_trimester: ${v}`), v);
  assert.match(form, /formData\.female_pregnancy === 'PREGNANT' && !formData\.pregnancy_trimester/);
});
