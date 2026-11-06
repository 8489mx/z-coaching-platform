import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CardioStrategy,
  EatingDisorderHistory,
  MobilityStrategy,
  PlanStatus,
  PrimaryGoal,
  evaluateIntake,
} from "../src/intake-decision-engine/index.js";
import { ASSESSMENT_CONTEXT, completeIntake } from "./fixtures/complete-intake.js";
import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { assessServiceScope } from "../src/api/services/serviceScope.js";

/**
 * H3 (B3): an eating-disorder history must hold cleanly, never throw.
 *
 * Before this fix the engine threw `TypeError: MEDICAL_REVIEW_REQUIRED
 * requires cardio strategy REVIEW_REQUIRED.` for BOTH ACTIVE and PAST
 * histories: the intake decision marked the client medical-review but still
 * prescribed CARDIO_SESSIONS, which the cardio validator refuses to pair
 * with a medical-review status. Kidney, pregnancy and breastfeeding pair
 * the same status with REVIEW_REQUIRED and hold cleanly — this package
 * follows that pattern. The scope layer (B7) must agree with the engine:
 * an eating-disorder history or breastfeeding is outside the service,
 * like pregnancy and kidney disease.
 */

const evaluate = (input) => evaluateIntake(input, ASSESSMENT_CONTEXT);

const edIntake = (history) =>
  completeIntake({
    goals: { primary: PrimaryGoal.FAT_LOSS },
    medical: { eatingDisorderHistory: history },
  });

for (const history of [
  EatingDisorderHistory.ACTIVE,
  EatingDisorderHistory.PAST,
  EatingDisorderHistory.SUSPECTED,
]) {
  test(`decision: eating-disorder history ${history} pairs medical review with REVIEW_REQUIRED cardio, never CARDIO_SESSIONS`, () => {
    const result = evaluate(edIntake(history));
    assert.equal(result.plan_status, PlanStatus.MEDICAL_REVIEW_REQUIRED);
    assert.equal(result.cardio_decision.strategy, CardioStrategy.REVIEW_REQUIRED);
    assert.equal(result.cardio_decision.max_sessions, 0);
    assert.equal(result.cardio_decision.max_duration_minutes, 0);
    assert.equal(result.training_decision.recommended_days, 0);
    assert.equal(result.mobility_decision.strategy, MobilityStrategy.REVIEW_REQUIRED);
    assert.equal(result.nutrition_decision.calorie_direction, "REVIEW_REQUIRED");
  });
}

test("decision: no eating-disorder history keeps the automatic cardio decision", () => {
  const result = evaluate(edIntake(EatingDisorderHistory.NONE));
  assert.notEqual(result.cardio_decision.strategy, CardioStrategy.REVIEW_REQUIRED);
});

// ---------- engine level: the exact clients that threw ----------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"),
);
const EVAL_CTX = { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" };

function harnessIntake(p) {
  return {
    gender: p.sex, age: String(p.age), height_cm: String(p.height_cm),
    weight_kg: String(p.weight_kg), waist_cm: String(p.waist_cm),
    primary_goal: p.goal, neat_level: p.neat_level, occupation_type: "DESK_OFFICE",
    dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: p.medical.length > 0, selected: p.medical },
    injuries_map: { has_injuries: false, selected_areas: [] },
    religion: "MUSLIM",
    strict_allergies: p.allergies,
    meal_structure: { meals_count: p.meals_count, intermittent_fasting: p.fasting },
    training_environment: p.training_environment,
    training_logistics: { days_per_week: p.days_per_week, experience_level: p.experience },
    recent_training: "ACTIVE",
    cardio: { walkingAbility: p.walking, averageDailySteps: p.steps, maxSessionsPerWeek: 2, maxDurationMinutes: 30 },
    sleep_hours: p.sleep_hours,
    sleep_schedule: { pattern: p.sleep_pattern, average_hours: p.sleep_hours },
    ...(p.eating_disorder ? { eating_disorder_history: p.eating_disorder } : {}),
  };
}

const X20 = { sex: "female", age: 26, height_cm: 160, weight_kg: 58, waist_cm: 70, goal: "fat_loss", neat_level: "moderate", medical: [], allergies: [], meals_count: "4_meals", fasting: "none", training_environment: "commercial_gym", days_per_week: 3, experience: "beginner", walking: "EASY", steps: 8000, sleep_hours: 7, sleep_pattern: "regular_night", eating_disorder: "ACTIVE" };
const L04 = { sex: "female", age: 24, height_cm: 162, weight_kg: 60, waist_cm: 72, goal: "fat_loss", neat_level: "moderate", medical: [], allergies: [], meals_count: "4_meals", fasting: "none", training_environment: "commercial_gym", days_per_week: 3, experience: "beginner", walking: "EASY", steps: 8000, sleep_hours: 7, sleep_pattern: "regular_night", eating_disorder: "PAST" };

for (const [id, profile] of [["X20", X20], ["L04", L04]]) {
  test(`engine: ${id} eating-disorder history holds cleanly at day 0 and at every weekly re-attempt, never throws`, () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const program = buildMasterEngineV2({
        intake: harnessIntake(profile),
        evaluationContext: EVAL_CTX,
        nutritionFoodCatalog: CATALOG,
        options: {},
      });
      assert.equal(program.intake_decision?.plan_status, "MEDICAL_REVIEW_REQUIRED", `${id} attempt ${attempt}`);
      assert.equal(
        program.intake_decision?.cardio_decision?.strategy,
        "REVIEW_REQUIRED",
        `${id} attempt ${attempt}`,
      );
      assert.equal(
        program.cardio_program?.plan_specification?.status,
        "WITHHELD",
        `${id} attempt ${attempt}: the cardio spec is withheld, not served`,
      );
      assert.equal(
        program.cardio_program?.plan_specification?.limits?.max_sessions_per_week,
        0,
        `${id} attempt ${attempt}: no cardio sessions are served to a held client`,
      );
    }
  });
}

// ---------- scope level (B7): the scope layer agrees with the engine ----------

const scopeBase = () => ({
  health_data_consent: { accepted: true, version: "PDPL-2026-09", accepted_at: new Date().toISOString() },
  gender: "female", age: "32", height_cm: "165", weight_kg: "80",
  circumferences: { neck_cm: "34", waist_cm: "90", hips_cm: "105" },
  primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: [], female_cases: { is_pcos: false, is_lactating: false, is_postpartum: false, answered: true }, diabetes: { type: "type2", uses_insulin: false } },
  injuries_map: { has_injuries: false, selected_areas: ["none"] },
  religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
  training_environment: "commercial_gym", training_logistics: { days_per_week: 3, experience_level: "beginner" }, recent_training: "ACTIVE",
});

test("scope: an eating-disorder history is outside the service, however it is written in the form", () => {
  const flatActive = assessServiceScope({ ...scopeBase(), eating_disorder_history: "ACTIVE" });
  assert.equal(flatActive.supported, false);
  assert.deepEqual(flatActive.cases, ["EATING_DISORDER_HISTORY"]);
  const flatPast = assessServiceScope({ ...scopeBase(), eating_disorder_history: "PAST" });
  assert.equal(flatPast.supported, false);
  assert.deepEqual(flatPast.cases, ["EATING_DISORDER_HISTORY"]);
  const structured = assessServiceScope({
    ...scopeBase(),
    medical_conditions: { ...scopeBase().medical_conditions, eatingDisorderHistory: "ACTIVE" },
  });
  assert.equal(structured.supported, false);
  assert.deepEqual(structured.cases, ["EATING_DISORDER_HISTORY"]);
  assert.equal(assessServiceScope({ ...scopeBase(), eating_disorder_history: "NONE" }).supported, true);
});

test("scope: breastfeeding is outside the service, like pregnancy", () => {
  const byFlag = assessServiceScope({ ...scopeBase(), female_pregnancy: "BREASTFEEDING" });
  assert.equal(byFlag.supported, false);
  assert.deepEqual(byFlag.cases, ["BREASTFEEDING"]);
  const byLactating = assessServiceScope({
    ...scopeBase(),
    medical_conditions: { ...scopeBase().medical_conditions, female_cases: { is_pcos: false, is_lactating: true, is_postpartum: true, answered: true } },
  });
  assert.equal(byLactating.supported, false);
  assert.deepEqual(byLactating.cases, ["BREASTFEEDING"]);
  const pregnant = assessServiceScope({ ...scopeBase(), female_pregnancy: "PREGNANT" });
  assert.equal(pregnant.supported, false);
  assert.deepEqual(pregnant.cases, ["PREGNANCY"]);
  assert.equal(assessServiceScope(scopeBase()).supported, true);
});
