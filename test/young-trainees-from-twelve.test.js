import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { assessServiceScope } from "../src/api/services/serviceScope.js";
import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";
import { evaluateIntake } from "z-coaching-intake-decision-engine";
import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { collectCoachAlerts } from "../frontend/src/utils/coachAlerts.js";

/**
 * Owner's decision (2026-09-25): we take trainees from 12 years old, with the guardian's consent,
 * and the engine follows the age instead of treating a child as a small adult:
 * - energy from the Schofield equations (FAO/WHO/UNU), which are the ones written for 10-18, and
 *   never the body-fat formulas, which are validated on adults;
 * - a growing body is never put in a calorie deficit: a young trainee's plan starts at maintenance;
 * - training the way the NSCA youth resistance training position statement (2009) asks: never to
 *   failure (at least 3 reps in reserve), no maximal attempts, and a supervision note for the coach.
 * Under 12 stays outside the service, and every young plan waits for the coach.
 */
const CATALOG = JSON.parse(fs.readFileSync("data/catalogs/core-global-food-batch-v1.json", "utf8"));
const CONTEXT = { system_time: "2026-09-25T08:00:00.000Z", assessmentDate: "2026-09-25" };
const intake = (age, extra = {}) => ({
  gender: "male", age: String(age), height_cm: "160", weight_kg: "50",
  circumferences: { neck_cm: "33", waist_cm: "70", hips_cm: "85" },
  primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "STUDENT", dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
  religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
  training_environment: "commercial_gym", training_logistics: { days_per_week: 3, training_age: "never" }, recent_training: "ACTIVE",
  guardian: { name: "والد المتدرب", phone: "01099000123", consent: true }, ...extra,
});
const plan = (age, extra) => buildMasterEngineV2({ intake: intake(age, extra), evaluationContext: CONTEXT, nutritionFoodCatalog: CATALOG, options: {} });
const decide = (age, extra) => evaluateIntake(adaptIntakePayloadToCanonicalEngine(structuredClone(intake(age, extra))), CONTEXT);

test("under twelve is outside the service; twelve and up is served", () => {
  assert.equal(assessServiceScope(intake(11)).supported, false);
  assert.ok(assessServiceScope(intake(11)).cases.includes("TOO_YOUNG"));
  assert.equal(assessServiceScope(intake(12)).supported, true);
  assert.equal(assessServiceScope(intake(25)).supported, true);
});

test("a young trainee needs the guardian's consent, and the plan waits for the coach", () => {
  const withConsent = decide(14);
  assert.equal(withConsent.plan_status, "COACH_REVIEW_REQUIRED");
  const withoutConsent = decide(14, { guardian: { name: "", phone: "", consent: false } });
  assert.equal(withoutConsent.plan_status, "BLOCKED");
});

test("energy comes from the Schofield equations and never from the body-fat formulas", () => {
  const targets = plan(13).nutrition_program.targets;
  // Schofield 10-18 male: 17.686 x 50 kg + 658.2 = 1542.5 -> 1543 kcal.
  assert.equal(targets.bmr, 1543);
  assert.equal(targets.bmr_formula, "SCHOFIELD_YOUTH");
  assert.equal(plan(25).nutrition_program.targets.bmr_formula, "KATCH_MCARDLE", "an adult keeps his own formula");
});

test("a growing body is never put in a deficit, and the coach is told the youth rules", () => {
  const targets = plan(13).nutrition_program.targets;
  assert.ok(targets.target_calories >= targets.tdee, `${targets.target_calories} vs maintenance ${targets.tdee}`);
  assert.equal(targets.clinical_guardrails.is_young_trainee, true);
  assert.ok(collectCoachAlerts(JSON.parse(JSON.stringify(plan(13)))).some((a) => /سن|إشراف|متابعة/.test(a)));
});

test("training never goes to failure and never asks for a maximal attempt", () => {
  const week = plan(13).training_program.weeks[0];
  const rirs = week.sessions.flatMap((s) => s.exercises.map((e) => Number(e.target_rir ?? e.rir)));
  assert.ok(rirs.every((r) => r >= 3), `at least 3 in reserve: ${rirs.join(",")}`);
  const reps = week.sessions.flatMap((s) => s.exercises.map((e) => String(e.target_reps ?? e.reps)));
  assert.ok(reps.every((r) => !/^[1-5](-|$)/.test(r)), `no heavy low-rep sets: ${reps.join(",")}`);
});

// Adult BMI cut-offs do not describe a growing child: a BMI of 17.8 is around the middle of the
// range for a 12 year old, so the thinness rules (refusal under 16, the goal redirect under 18.5)
// apply to adults only. A young trainee is seen by the coach and his guardian instead.
test("the thinness rules are for adults, not for children", () => {
  const child = { ...intake(12), weight_kg: "35", height_cm: "150" }; // BMI 15.6
  assert.equal(assessServiceScope(child).supported, true);
  const targets = buildMasterEngineV2({ intake: child, evaluationContext: CONTEXT, nutritionFoodCatalog: CATALOG, options: {} }).nutrition_program.targets;
  assert.equal(targets.goal_redirect, null, "no adult thinness redirect for a child");
  assert.equal(targets.target_calories, targets.tdee, "maintenance, no deficit and no surplus");
  const adult = { ...intake(30), weight_kg: "35", height_cm: "150" };
  assert.equal(assessServiceScope(adult).supported, false, "an adult at BMI 15.6 is still refused");
});

test("the form asks for the guardian only under 18", () => {
  const form = fs.readFileSync("frontend/src/pages/FullIntakeForm.jsx", "utf8");
  assert.match(form, /guardian/);
  assert.match(form, /Number\(formData\.age\) < 18/);
});
