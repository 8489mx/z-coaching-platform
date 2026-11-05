import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";
import { evaluateIntake } from "../src/intake-decision-engine/index.js";
import { buildTrainingMesoCycle } from "../src/training-engine-v2/index.js";
import { evaluateFinalTrainingWeeks } from "../src/training-engine-v2/build-training-mesocycle.js";
import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";

/**
 * Bug B4 (20-client matrix): held slots shipped as blank null-code exercises
 * ({ exercise_code: null, name_en: null, no sets/reps/RIR }) — any consumer
 * that does not read final_preflight rendered a blank row. A held slot is now
 * served as an explicit named placeholder: sentinel code HELD_SLOT (never a
 * catalog code), the slot, the hold reason, an Arabic why, and the coach
 * action — with dose fields explicitly null so no consumer invents a dose.
 * The hold itself is unchanged: the plan is still withheld (REVIEW_REQUIRED).
 *
 * The same section had a second silent failure: elbow/wrist/hip/ankle guards
 * nulled the exercise and the session `.filter(Boolean)` deleted the row, so
 * the served plan came back short (an elbow client lost 45 of 100 rows) and
 * the final check still PASSED. Those rows are now held placeholders too.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const CTX = Object.freeze({ system_time: "2026-09-20T08:00:00.000Z", assessmentDate: "2026-09-20" });

const allExercises = (program) =>
  (program.training_program?.weeks || []).flatMap((week) =>
    (week.sessions || []).flatMap((session) => session.exercises || []),
  );

function assertPlaceholderShape(ex, where) {
  assert.ok(String(ex.exercise_code).startsWith("HELD_SLOT_"), `${where}: held slot must carry a HELD_SLOT_<SLOT> code, not a null code: ${ex.exercise_code}`);
  assert.ok(String(ex.exercise_code).includes(ex.slot_code), `${where}: held slot code must name the held slot: ${ex.exercise_code}`);
  assert.equal(ex.code, ex.exercise_code, `${where}: code must match exercise_code`);
  assert.equal(typeof ex.name_en, "string", `${where}: name_en must be a string`);
  assert.ok(ex.name_en.includes("Coach to fill"), `${where}: name_en must say Coach to fill: ${ex.name_en}`);
  assert.ok(ex.name_en.includes(ex.slot_code), `${where}: name_en must name the held slot: ${ex.name_en}`);
  assert.equal(typeof ex.name_ar, "string", `${where}: name_ar must be a string`);
  assert.ok(ex.name_ar.length > 0, `${where}: name_ar must not be blank`);
  assert.ok(ex.name_ar.includes(ex.slot_code), `${where}: name_ar must name the held slot: ${ex.name_ar}`);
  assert.equal(typeof ex.reason_code, "string", `${where}: reason_code must be a string`);
  assert.ok(ex.reason_code.length > 0, `${where}: reason_code must not be blank`);
  assert.equal(ex.held_reason, ex.reason_code, `${where}: held_reason must equal reason_code`);
  assert.equal(typeof ex.held_note_ar, "string", `${where}: held_note_ar (Arabic why) must be a string`);
  assert.ok(ex.held_note_ar.length > 0, `${where}: held_note_ar must not be blank`);
  assert.equal(typeof ex.coach_action_ar, "string", `${where}: coach_action_ar (what the coach must do) must be a string`);
  assert.ok(ex.coach_action_ar.length > 0, `${where}: coach_action_ar must not be blank`);
  assert.equal(ex.held_for_review, true, `${where}: held_for_review must be true`);
  assert.equal(ex.selection_status, "REVIEW_REQUIRED", `${where}: selection_status must stay REVIEW_REQUIRED`);
  assert.equal(ex.placeholder, true, `${where}: placeholder marker must be true`);
  assert.equal(ex.prescription, null, `${where}: prescription must be null — a held slot has no dose`);
  for (const field of ["target_sets", "target_reps", "target_rir", "sets", "reps", "rir", "rest_seconds", "rest"]) {
    assert.equal(ex[field], null, `${where}: ${field} must be null — never invent a dose for a held slot`);
  }
}

function assertNoNullCodeExercises(program, where) {
  for (const ex of allExercises(program)) {
    assert.notEqual(ex.exercise_code, null, `${where}: served exercise must never have a null code (slot ${ex.slot_code})`);
    assert.notEqual(ex.exercise_code, undefined, `${where}: served exercise must never have a missing code (slot ${ex.slot_code})`);
    assert.equal(typeof ex.exercise_code, "string", `${where}: exercise_code must be a string (slot ${ex.slot_code})`);
    assert.ok(ex.exercise_code.length > 0, `${where}: exercise_code must not be blank (slot ${ex.slot_code})`);
    if (ex.held_for_review) assertPlaceholderShape(ex, where);
  }
}

// ---------- full-engine cases: the four matrix clients ----------

const BASE_INTAKE = {
  neat_level: "moderate", occupation_type: "DESK_OFFICE",
  dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: ["none"] },
  injuries_map: { has_injuries: false, selected_areas: ["none"] },
  religion: "MUSLIM", strict_allergies: ["none"],
  meal_structure: { meals_count: "4_meals", intermittent_fasting: "none" },
  recent_training: "ACTIVE",
  cardio: { walkingAbility: "EASY", averageDailySteps: 7000, maxSessionsPerWeek: 2, maxDurationMinutes: 30 },
  sleep_hours: 7, sleep_schedule: { pattern: "regular_night", average_hours: 7 },
};

function fullProgram(intake) {
  return buildMasterEngineV2({ intake, evaluationContext: CTX, nutritionFoodCatalog: CATALOG, options: {} });
}

test("C03 (shoulder, home dumbbells): 5 held elbow-extension slots are named placeholders, plan still withheld", () => {
  const program = fullProgram({
    ...BASE_INTAKE,
    gender: "female", age: "31", height_cm: "160", weight_kg: "82",
    primary_goal: "fat_loss", neat_level: "light",
    injuries_map: { has_injuries: true, selected_areas: ["shoulder"], pain_level: 5 },
    injury_severity: "MODERATE",
    training_environment: "minimal_equipment",
    training_logistics: { days_per_week: 3, experience_level: "BEGINNER" },
  });
  assertNoNullCodeExercises(program, "C03");
  const held = allExercises(program).filter((ex) => ex.held_for_review);
  assert.equal(held.length, 5, `C03 must hold exactly 5 slots, got ${held.length}`);
  assert.ok(held.every((ex) => ex.slot_code === "ELBOW_EXTENSION"), "C03 held slots must all be ELBOW_EXTENSION");
  assert.ok(held.every((ex) => ex.held_reason === "SHOULDER_OVERHEAD_ARM_HELD"), "C03 held reason must be SHOULDER_OVERHEAD_ARM_HELD");
  assert.equal(program.training_program.final_preflight.status, "REVIEW_REQUIRED", "C03 final preflight must still withhold");
  assert.equal(program.nutrition_program.status, "REVIEW_REQUIRED", "C03 plan must still be REVIEW_REQUIRED");
});

test("C06 (home, no equipment): 15 held slots are named placeholders, plan still withheld", () => {
  const program = fullProgram({
    ...BASE_INTAKE,
    gender: "male", age: "22", height_cm: "175", weight_kg: "78",
    primary_goal: "muscle_gain",
    training_environment: "home_bodyweight",
    training_logistics: { days_per_week: 3, experience_level: "BEGINNER" },
    cardio: { walkingAbility: "EASY", averageDailySteps: 8000, maxSessionsPerWeek: 2, maxDurationMinutes: 30 },
    sleep_hours: 8, sleep_schedule: { pattern: "regular_night", average_hours: 8 },
  });
  assertNoNullCodeExercises(program, "C06");
  const held = allExercises(program).filter((ex) => ex.held_for_review);
  assert.equal(held.length, 15, `C06 must hold exactly 15 slots, got ${held.length}`);
  assert.ok(held.every((ex) => ex.held_reason === "EQUIPMENT_EXHAUSTED"), "C06 held reason must be EQUIPMENT_EXHAUSTED");
  assert.equal(program.training_program.final_preflight.status, "REVIEW_REQUIRED", "C06 final preflight must still withhold");
  assert.equal(program.nutrition_program.status, "REVIEW_REQUIRED", "C06 plan must still be REVIEW_REQUIRED");
});

test("C15 (home, no equipment, 2 days): 10 held slots are named placeholders, plan still withheld", () => {
  const program = fullProgram({
    ...BASE_INTAKE,
    gender: "female", age: "23", height_cm: "158", weight_kg: "55",
    primary_goal: "fat_loss",
    meal_structure: { meals_count: "3_meals_snack", intermittent_fasting: "none" },
    training_environment: "home_bodyweight",
    training_logistics: { days_per_week: 2, experience_level: "BEGINNER" },
    cardio: { walkingAbility: "EASY", averageDailySteps: 7500, maxSessionsPerWeek: 2, maxDurationMinutes: 30 },
    sleep_hours: 5, sleep_schedule: { pattern: "irregular", average_hours: 5 },
  });
  assertNoNullCodeExercises(program, "C15");
  const held = allExercises(program).filter((ex) => ex.held_for_review);
  assert.equal(held.length, 10, `C15 must hold exactly 10 slots, got ${held.length}`);
  assert.ok(held.every((ex) => ex.held_reason === "EQUIPMENT_EXHAUSTED"), "C15 held reason must be EQUIPMENT_EXHAUSTED");
  assert.equal(program.training_program.final_preflight.status, "REVIEW_REQUIRED", "C15 final preflight must still withhold");
  assert.equal(program.nutrition_program.status, "REVIEW_REQUIRED", "C15 plan must still be REVIEW_REQUIRED");
});

test("C16 (knee + back, gym): 10 held unilateral-lower slots are named placeholders, plan still withheld", () => {
  const program = fullProgram({
    ...BASE_INTAKE,
    gender: "male", age: "37", height_cm: "178", weight_kg: "120",
    primary_goal: "fat_loss", neat_level: "sedentary",
    medical_conditions: { has_conditions: false, selected: ["none"] },
    injuries_map: { has_injuries: true, selected_areas: ["spine_back", "knee"], pain_level: 6 },
    injury_severity: "MODERATE",
    training_environment: "commercial_gym",
    training_logistics: { days_per_week: 4, experience_level: "INTERMEDIATE" },
    cardio: { walkingAbility: "EASY", averageDailySteps: 3000, maxSessionsPerWeek: 2, maxDurationMinutes: 30 },
    sleep_hours: 6.5, sleep_schedule: { pattern: "regular_night", average_hours: 6.5 },
  });
  assertNoNullCodeExercises(program, "C16");
  const held = allExercises(program).filter((ex) => ex.held_for_review);
  assert.equal(held.length, 10, `C16 must hold exactly 10 slots, got ${held.length}`);
  assert.ok(held.every((ex) => ex.slot_code === "UNILATERAL_LOWER"), "C16 held slots must all be UNILATERAL_LOWER");
  assert.ok(held.every((ex) => ex.held_reason === "DEDUP_EXHAUSTED"), "C16 held reason must be DEDUP_EXHAUSTED");
  assert.equal(program.training_program.final_preflight.status, "REVIEW_REQUIRED", "C16 final preflight must still withhold");
  assert.equal(program.nutrition_program.status, "REVIEW_REQUIRED", "C16 plan must still be REVIEW_REQUIRED");
});

test("clean gym client (no held slots): no placeholders, every exercise a real code with a dose", () => {
  const program = fullProgram({
    ...BASE_INTAKE,
    gender: "male", age: "30", height_cm: "178", weight_kg: "85",
    primary_goal: "fat_loss",
    training_environment: "commercial_gym",
    training_logistics: { days_per_week: 4, experience_level: "INTERMEDIATE" },
  });
  assertNoNullCodeExercises(program, "clean gym client");
  const exs = allExercises(program);
  assert.equal(exs.filter((ex) => ex.held_for_review).length, 0, "clean client must have zero held slots");
  assert.ok(exs.length > 0, "clean client must have exercises");
  for (const ex of exs) {
    assert.ok(!String(ex.exercise_code).startsWith("HELD_SLOT"), "clean client must not contain the placeholder sentinel");
    assert.equal(typeof ex.target_sets, "number", `${ex.exercise_code}: real exercise must carry target_sets`);
    assert.equal(typeof ex.target_reps, "string", `${ex.exercise_code}: real exercise must carry target_reps`);
    assert.equal(typeof ex.target_rir, "number", `${ex.exercise_code}: real exercise must carry target_rir`);
  }
});

// ---------- mesocycle unit cases: joint holds are held, not dropped ----------

const EVAL_CTX = { assessmentDate: "2026-09-19" };

function mesocycle({ injuries = [], experience = "BEGINNER", days = 3, location = "GYM" } = {}) {
  const canonical = adaptIntakePayloadToCanonicalEngine({
    personal: { sex: "MALE", age: 30 },
    body: { weightKg: 85, heightCm: 178 },
    goals: { primary: "FAT_LOSS" },
    medical: { hasInjuries: injuries.length > 0, injuries, conditions: [] },
    cardio: { averageDailySteps: 7000, walkingAbility: "EASY" },
    training: { preferredDaysPerWeek: days, experience, environment: location === "HOME" ? "HOME" : "COMMERCIAL_GYM", location },
    lifestyle: {},
  });
  return buildTrainingMesoCycle(evaluateIntake(canonical, EVAL_CTX), { rawIntake: canonical, experience });
}

const mesoExercises = (meso) => meso.weeks.flatMap((w) => w.sessions.flatMap((s) => s.exercises));

test("elbow injury: forbidden arm work is held as placeholders (45 of 100), never silently dropped, final check withholds", () => {
  const meso = mesocycle({ injuries: ["ELBOW"] });
  const exs = mesoExercises(meso);
  assert.equal(exs.filter((ex) => ex.exercise_code == null).length, 0, "no null-code exercise may reach the served weeks");
  const held = exs.filter((ex) => ex.held_for_review);
  assert.equal(held.length, 45, `elbow client must hold 45 slots (the rows the old code deleted), got ${held.length}`);
  assert.ok(held.every((ex) => ex.held_reason === "ELBOW_INJURY_HELD"), "elbow held reason must be ELBOW_INJURY_HELD");
  for (const ex of held) assertPlaceholderShape(ex, "elbow");
  assert.equal(meso.final_preflight.status, "REVIEW_REQUIRED", "elbow plan must be withheld — the old code passed the final check with 45 rows missing");
});

test("wrist injury: forbidden arm work is held as placeholders (45 of 100)", () => {
  const meso = mesocycle({ injuries: ["WRIST"] });
  const exs = mesoExercises(meso);
  assert.equal(exs.filter((ex) => ex.exercise_code == null).length, 0, "no null-code exercise may reach the served weeks");
  const held = exs.filter((ex) => ex.held_for_review);
  assert.equal(held.length, 45, `wrist client must hold 45 slots, got ${held.length}`);
  assert.ok(held.every((ex) => ex.held_reason === "WRIST_INJURY_HELD"), "wrist held reason must be WRIST_INJURY_HELD");
  for (const ex of held) assertPlaceholderShape(ex, "wrist");
  assert.equal(meso.final_preflight.status, "REVIEW_REQUIRED", "wrist plan must be withheld");
});

test("hip injury: forbidden hip-loaded work is held as placeholders (25 of 100), never silently dropped", () => {
  const meso = mesocycle({ injuries: ["HIP"] });
  const exs = mesoExercises(meso);
  assert.equal(exs.filter((ex) => ex.exercise_code == null).length, 0, "no null-code exercise may reach the served weeks");
  const held = exs.filter((ex) => ex.held_for_review);
  assert.equal(held.length, 25, `hip client must hold 25 slots, got ${held.length}`);
  assert.ok(held.every((ex) => ex.held_reason === "HIP_INJURY_HELD"), "hip held reason must be HIP_INJURY_HELD");
  for (const ex of held) assertPlaceholderShape(ex, "hip");
  assert.equal(meso.final_preflight.status, "REVIEW_REQUIRED", "hip plan must be withheld");
});

test("ankle injury: forbidden ankle-loaded work is held as placeholders (5 of 100)", () => {
  const meso = mesocycle({ injuries: ["ANKLE"] });
  const exs = mesoExercises(meso);
  assert.equal(exs.filter((ex) => ex.exercise_code == null).length, 0, "no null-code exercise may reach the served weeks");
  const held = exs.filter((ex) => ex.held_for_review);
  assert.equal(held.length, 5, `ankle client must hold 5 slots, got ${held.length}`);
  assert.ok(held.every((ex) => ex.held_reason === "ANKLE_INJURY_HELD"), "ankle held reason must be ANKLE_INJURY_HELD");
  for (const ex of held) assertPlaceholderShape(ex, "ankle");
  assert.equal(meso.final_preflight.status, "REVIEW_REQUIRED", "ankle plan must be withheld");
});

// ---------- final-preflight violation codes name the hold reason ----------

test("final preflight names the hold reason: shoulder, joint, equipment, dedup each get their own code", () => {
  const weeks = (reason) => [{ week_number: 1, sessions: [{ session_code: "A", exercises: [{ slot_code: "ELBOW_EXTENSION", held_for_review: true, held_reason: reason }] }] }];
  const codeFor = (reason) => evaluateFinalTrainingWeeks(weeks(reason), {}).violations[0]?.code;
  assert.equal(codeFor("SHOULDER_OVERHEAD_ARM_HELD"), "SHOULDER_SLOT_HELD_FOR_REVIEW", "a shoulder hold must not be labelled DEDUP");
  assert.equal(codeFor("ELBOW_INJURY_HELD"), "JOINT_SLOT_HELD_FOR_REVIEW");
  assert.equal(codeFor("HIP_INJURY_HELD"), "JOINT_SLOT_HELD_FOR_REVIEW");
  assert.equal(codeFor("EQUIPMENT_EXHAUSTED"), "EQUIPMENT_SLOT_HELD_FOR_REVIEW");
  assert.equal(codeFor("DEDUP_EXHAUSTED"), "DEDUP_SLOT_HELD_FOR_REVIEW");
  assert.equal(evaluateFinalTrainingWeeks(weeks("SHOULDER_OVERHEAD_ARM_HELD"), {}).status, "REVIEW_REQUIRED");
});
