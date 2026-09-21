import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { collectCoachAlerts } from "../frontend/src/utils/coachAlerts.js";
import { CLINICAL_GUIDELINES } from "../src/config/clinical-guidelines.js";

/**
 * KDIGO 2024 (CKD guideline, practice points 3.11.5.1-2): potassium is managed per person, limiting
 * potassium-rich foods when there is hyperkalaemia or a risk of it. The intake does not collect a
 * potassium result, so a kidney client's avocado stays a moderate portion (was up to 100 g a meal,
 * ~485 mg potassium) and the coach is asked for the latest potassium test.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const plan = (selected) => buildMasterEngineV2({
  intake: {
    gender: "male", age: "35", height_cm: "180", weight_kg: "100", circumferences: { neck_cm: "40", waist_cm: "95", hips_cm: "100" },
    primary_goal: "lean_bulk", neat_level: "very_active", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: true, selected, diabetes: { type: "type2", uses_insulin: false } },
    injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: ["none"],
    meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" }, training_environment: "commercial_gym",
    training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG,
  options: {},
});
const avocados = (program) => program.nutrition_program.culinary_meals.flatMap((m) => m.items).filter((i) => i.food_code === "FRESH_AVOCADO");

test("a kidney client's avocado is a moderate portion, and the fat target still holds", () => {
  const program = plan(["diabetes", "renal"]);
  const max = CLINICAL_GUIDELINES.KIDNEY.AVOCADO_MAX_G_PER_MEAL;
  assert.ok(max <= 50);
  for (const a of avocados(program)) assert.ok(a.portion_g <= max, `${a.portion_g} g avocado`);
  const n = program.nutrition_program;
  const fat = n.culinary_meals.flatMap((m) => m.items).reduce((s, i) => s + (Number(i.fat_g) || 0), 0);
  assert.ok(Math.abs(fat - n.macro_targets.fat_g) / n.macro_targets.fat_g < 0.05, `${fat} g fat for ${n.macro_targets.fat_g}`);
});

test("the coach is asked for the kidney client's potassium result", () => {
  const program = JSON.parse(JSON.stringify(plan(["diabetes", "renal"])));
  assert.ok(collectCoachAlerts(program).some((a) => /بوتاسيوم/.test(a)));
});

test("without a kidney condition the avocado portion and notes are unchanged", () => {
  const program = JSON.parse(JSON.stringify(plan(["diabetes"])));
  assert.ok(avocados(program).some((a) => a.portion_g > 50), "a diabetic's high-fat plan still uses up to 100 g");
  assert.ok(!collectCoachAlerts(program).some((a) => /بوتاسيوم/.test(a)));
});
