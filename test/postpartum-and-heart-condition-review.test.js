import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";
import { evaluateIntake } from "z-coaching-intake-decision-engine";
import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";

/**
 * Women's cases and heart disease from the intake form:
 * - a recent birth (female_cases.is_postpartum) became POSTPARTUM_LESS_THAN_12_MONTHS, a status the
 *   canonical intake rejects, so the plan could not be generated at all;
 * - a diagnosed heart condition went straight to READY_FOR_DRAFT. ACSM preparticipation screening
 *   (Riebe 2015) asks for medical clearance before exercise with known cardiovascular disease, and
 *   ACOG (2020) for an individual return to exercise after birth: both now need medical review.
 */
const CATALOG = JSON.parse(fs.readFileSync("data/catalogs/core-global-food-batch-v1.json", "utf8"));
const CONTEXT = { system_time: "2026-09-22T08:00:00.000Z", assessmentDate: "2026-09-22" };
const intake = (selected = [], femaleCases = {}, extra = {}) => ({
  gender: "female", age: "30", height_cm: "165", weight_kg: "75", circumferences: { neck_cm: "33", waist_cm: "80", hips_cm: "100" },
  primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
  medical_conditions: {
    has_conditions: selected.length > 0, selected: selected.length ? selected : ["none"],
    female_cases: { is_pcos: false, is_lactating: false, is_postpartum: false, ...femaleCases },
  },
  injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: ["none"],
  meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" }, training_environment: "commercial_gym",
  training_logistics: { days_per_week: 4, training_age: "1_2_years" }, recent_training: "ACTIVE", ...extra,
});
const decide = (answers) => evaluateIntake(adaptIntakePayloadToCanonicalEngine(structuredClone(answers)), CONTEXT);
const build = (answers) => buildMasterEngineV2({ intake: structuredClone(answers), evaluationContext: CONTEXT, nutritionFoodCatalog: CATALOG, options: {} });

test("a recent birth gets a plan, held for medical review", () => {
  const decision = decide(intake([], { is_postpartum: true }));
  assert.equal(decision.plan_status, "MEDICAL_REVIEW_REQUIRED");
  assert.ok(build(intake([], { is_postpartum: true })).nutrition_program);
});

test("breastfeeding wins over a recent birth, and pregnancy over both", () => {
  assert.equal(adaptIntakePayloadToCanonicalEngine(intake([], { is_postpartum: true, is_lactating: true })).medical.pregnancyStatus, "BREASTFEEDING");
  assert.equal(adaptIntakePayloadToCanonicalEngine(intake([], { is_lactating: true }, { female_pregnancy: "PREGNANT" })).medical.pregnancyStatus, "PREGNANT");
  assert.equal(decide(intake([], {}, { female_pregnancy: "PREGNANT" })).plan_status, "MEDICAL_REVIEW_REQUIRED");
});

test("a diagnosed heart condition needs medical review; asthma does not, but bans HIIT", () => {
  assert.equal(decide(intake(["heart_condition"])).plan_status, "MEDICAL_REVIEW_REQUIRED");
  assert.equal(decide(intake(["asthma"])).plan_status, "READY_FOR_DRAFT");
  const asthma = build(intake(["asthma"]));
  assert.equal(asthma.cardio_program.clinical_guardrails.hiit_banned, true);
});

test("a woman with none of these cases keeps the normal path", () => {
  assert.equal(decide(intake()).plan_status, "READY_FOR_DRAFT");
});
