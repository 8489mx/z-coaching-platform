import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { collectCoachAlerts } from "../frontend/src/utils/coachAlerts.js";

/** The notes the engine leaves for the coach reach one list the coach editor shows. */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));

test("a 'coach decides' diabetic plan puts the goal suggestion and the carbohydrate ceiling in front of the coach", () => {
  const program = buildMasterEngineV2({
    intake: {
      gender: "male", age: "45", height_cm: "175", weight_kg: "118", circumferences: { neck_cm: "44", waist_cm: "118", hips_cm: "112" },
      primary_goal: "coach_decides", neat_level: "sedentary", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
      medical_conditions: { has_conditions: true, selected: ["diabetes", "renal"], diabetes: { type: "type2", uses_insulin: false } },
      injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: ["none"],
      meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" }, training_environment: "commercial_gym",
      training_logistics: { days_per_week: 3, experience_level: "beginner" }, recent_training: "ACTIVE",
    },
    evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
  const alerts = collectCoachAlerts(JSON.parse(JSON.stringify(program)));
  assert.ok(alerts.some((a) => /ساب اختيار الهدف للكوتش/.test(a)), alerts.join(" | "));
});

test("item notes carry the meal number and the food", () => {
  const alerts = collectCoachAlerts({ nutrition_program: { culinary_meals: [{ items: [] }, { items: [{ name_ar: "أرز", portion_warning_ar: "راجع" }] }] } });
  assert.deepEqual(alerts, ["الوجبة 2 - أرز: راجع"]);
});

test("a plan with nothing to note gives an empty list", () => {
  assert.deepEqual(collectCoachAlerts({}), []);
});

test("a 3200+ kcal day on three meals tells the coach a fourth meal was added", async () => {
  const program = buildMasterEngineV2({
    intake: {
      gender: "male", age: "20", height_cm: "190", weight_kg: "92", circumferences: { neck_cm: "38", waist_cm: "80", hips_cm: "95" },
      primary_goal: "lean_bulk", neat_level: "very_active", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
      medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
      religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
      training_environment: "commercial_gym", training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
    },
    evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
  assert.ok(program.nutrition_program.targets.target_calories >= 3200, "precondition: a high-calorie day");
  assert.ok(collectCoachAlerts(JSON.parse(JSON.stringify(program))).some((a) => /وجبة رابعة/.test(a)));
});
