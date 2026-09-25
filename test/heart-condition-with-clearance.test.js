import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { assessServiceScope } from "../src/api/services/serviceScope.js";
import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";
import { evaluateIntake } from "z-coaching-intake-decision-engine";
import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { collectCoachAlerts } from "../frontend/src/utils/coachAlerts.js";

/**
 * Owner's decision (2026-09-25): a diagnosed heart condition is served when the client brings his
 * cardiologist's written clearance to exercise - we ask for no labs and run no tests. Without that
 * clearance, or with a recent event (heart attack, stent, open-heart surgery, heart failure, an
 * arrhythmia or a pacemaker, or chest pain on exertion), the case stays outside the service.
 * A served heart client trains the careful way blood pressure clients already do (ACSM/AHA: no
 * failure, no breath holding, no HIIT) and his plan waits for the coach's medical confirmation.
 */
const CATALOG = JSON.parse(fs.readFileSync("data/catalogs/core-global-food-batch-v1.json", "utf8"));
const CONTEXT = { system_time: "2026-09-25T08:00:00.000Z", assessmentDate: "2026-09-25" };
const intake = (heart) => ({
  gender: "male", age: "45", height_cm: "175", weight_kg: "85", circumferences: { neck_cm: "40", waist_cm: "100", hips_cm: "104" },
  primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: true, selected: ["heart_condition"], heart },
  injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: ["none"],
  meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" }, training_environment: "commercial_gym",
  training_logistics: { days_per_week: 3, training_age: "never" }, recent_training: "ACTIVE",
});
const CLEARED = { doctor_clearance: "YES", recent_events: ["none"] };

test("no clearance, or a recent event, keeps the case outside the service", () => {
  for (const heart of [undefined, { doctor_clearance: "NO", recent_events: ["none"] }, { doctor_clearance: "YES", recent_events: ["heart_attack"] }, { doctor_clearance: "YES", recent_events: ["arrhythmia_pacemaker"] }]) {
    const scope = assessServiceScope(intake(heart));
    assert.equal(scope.supported, false, JSON.stringify(heart));
    assert.ok(scope.cases.includes("HEART_CONDITION"));
    assert.match(scope.reasons_ar.join(" "), /القلب/);
  }
});

test("with the cardiologist's clearance and no recent event, the client is served", () => {
  assert.equal(assessServiceScope(intake(CLEARED)).supported, true);
});

test("a served heart client's plan waits for medical review and trains the careful way", () => {
  const decision = evaluateIntake(adaptIntakePayloadToCanonicalEngine(structuredClone(intake(CLEARED))), CONTEXT);
  assert.equal(decision.plan_status, "MEDICAL_REVIEW_REQUIRED");
  const program = buildMasterEngineV2({ intake: intake(CLEARED), evaluationContext: CONTEXT, nutritionFoodCatalog: CATALOG, options: {} });
  assert.equal(program.cardio_program.clinical_guardrails.hiit_banned, true);
  const rirs = program.training_program.weeks[0].sessions.flatMap((s) => s.exercises.map((e) => Number(e.target_rir ?? e.rir)));
  assert.ok(rirs.every((r) => r >= 2), `every set keeps at least 2 in reserve: ${rirs.join(",")}`);
  const alerts = collectCoachAlerts(JSON.parse(JSON.stringify(program)));
  assert.ok(alerts.some((a) => /ملح|صوديوم/.test(a)), `the heart diet note reaches the coach: ${alerts.join(" | ")}`);
});

test("the form asks for the clearance and the recent events, only when a heart condition is ticked", () => {
  const form = fs.readFileSync("frontend/src/pages/FullIntakeForm.jsx", "utf8");
  assert.match(form, /medSelected\.includes\('heart_condition'\)/);
  assert.match(form, /doctor_clearance/);
  for (const key of ["heart_attack", "stent_catheter", "open_heart_surgery", "heart_failure", "arrhythmia_pacemaker", "chest_pain_on_effort"]) {
    assert.ok(form.includes(key), key);
  }
});
