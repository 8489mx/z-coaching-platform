import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { buildMasterEngineV2 } from "./../src/master-engine-v2/index.js";
import { assessServiceScope } from "./../src/api/services/serviceScope.js";
import { collectCoachAlerts } from "./../frontend/src/utils/coachAlerts.js";

/**
 * Owner's decision (2026-09-25): a body under BMI 18.5 asking to lose weight is not refused any
 * more - the coach talks to the client. The plan is built with the goal moved to building muscle
 * (never a deficit on a body that light) and the coach reads why. A BMI under 16 stays outside the
 * service: that is a medical case whatever the goal.
 */
const CATALOG = JSON.parse(fs.readFileSync("data/catalogs/core-global-food-batch-v1.json", "utf8"));
const CONTEXT = { system_time: "2026-09-25T08:00:00.000Z", assessmentDate: "2026-09-25" };
// 175 cm: 55 kg -> BMI 18.0 (thin), 45 kg -> BMI 14.7 (severe), 70 kg -> BMI 22.9 (normal).
const intake = (weight, goal = "fat_loss") => ({
  gender: "male", age: "25", height_cm: "175", weight_kg: String(weight),
  primary_goal: goal, neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
  religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
  training_environment: "commercial_gym", training_logistics: { days_per_week: 3, training_age: "never" }, recent_training: "ACTIVE",
});
const plan = (weight, goal) => buildMasterEngineV2({ intake: intake(weight, goal), evaluationContext: CONTEXT, nutritionFoodCatalog: CATALOG, options: {} });

test("a thin client asking to lose weight is served, with the goal moved and the coach told", () => {
  assert.equal(assessServiceScope(intake(55)).supported, true, "not refused any more");
  const targets = plan(55).nutrition_program.targets;
  assert.equal(targets.goal_redirect?.to, "MUSCLE_GAIN");
  assert.match(targets.goal_redirect.reason_ar, /تحت|نحيف|18/);
  assert.equal(targets.goal_redirect.coach_review_required, true);
  assert.ok(targets.target_calories >= targets.tdee, `no deficit: ${targets.target_calories} vs ${targets.tdee}`);
  assert.ok(collectCoachAlerts({ nutrition_program: { targets } }).some((a) => /تحت|نحيف/.test(a)), "the coach sees it");
});

test("a very light body (BMI under 16) stays outside the service, whatever the goal", () => {
  for (const goal of ["fat_loss", "lean_bulk"]) {
    const scope = assessServiceScope(intake(45, goal));
    assert.equal(scope.supported, false, goal);
    assert.ok(scope.cases.includes("UNDERWEIGHT"), goal);
  }
});

test("a thin client who asks to build muscle is untouched, and a normal client too", () => {
  assert.equal(plan(55, "lean_bulk").nutrition_program.targets.goal_redirect, null);
  assert.equal(plan(70, "fat_loss").nutrition_program.targets.goal_redirect, null);
});
