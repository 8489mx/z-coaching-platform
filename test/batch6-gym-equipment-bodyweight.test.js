import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { evaluateFinalTrainingWeeks } from "../src/training-engine-v2/build-training-mesocycle.js";

/**
 * B6-2 (from B5-4): bodyweight-only gym equipment blind spot.
 *
 * `exerciseFitsEquipment` knew equipment from exactly two sources — the V2
 * catalog record and the code name. A code in NEITHER catalog whose name
 * implies no equipment passed EVERY declared set, including a bodyweight-only
 * gym client who owns no machine. Three such codes were served to that
 * client: LAT_PULLDOWN (V1: CABLE_STATION), SEATED_LEG_CURL (no record
 * anywhere), CHEST_SUPPORTED_ROW (no record anywhere). The final check
 * `evaluateFinalTrainingWeeks` uses the same function, so it shared the
 * blind spot and reported 0 FINAL_EQUIPMENT_MISMATCH violations.
 *
 * Coordinator decisions (locked, not re-decided here):
 * (a) LAT_PULLDOWN is covered by SELECTORIZED_MACHINES — a lat pulldown
 *     station IS a selectorized machine; the V1 CABLE_STATION label is the
 *     narrower/older vocabulary. It must NOT be newly rejected for
 *     machines-only clients (C08 check (f) still PASSES with it served),
 *     but it MUST be rejected for a bodyweight-only gym client.
 * (b) SEATED_LEG_CURL and CHEST_SUPPORTED_ROW are assigned
 *     SELECTORIZED_MACHINES — a seated leg curl is done on a leg-curl
 *     machine, a chest-supported row on a supported-row machine. This is
 *     definitional (the exercise IS the machine), not invented data.
 *
 * The fix consults the V1 record as a fallback inside
 * `exerciseFitsEquipment`, plus an explicit assignment map for codes with
 * no record anywhere. The V2 catalog file is NOT touched (see the report:
 * adding V2 records would duplicate the same data on a second surface and
 * require inventing slot/muscle fields the fix does not need).
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const EVAL_CTX = { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" };

// Matrix client C08 (man, 41, fat loss, no injuries) — the same profile the
// B5-4 re-probe used, so the numbers below reproduce its inventory exactly.
const C08 = {
  sex: "male", age: 41, height_cm: 176, weight_kg: 88, waist_cm: 96,
  goal: "fat_loss", neat_level: "moderate", medical: [], injuries: [],
  allergies: [], meals_count: "4_meals", fasting: "none",
  walking: "EASY", steps: 9000, sleep_hours: 7, sleep_pattern: "regular_night",
};

const MACHINE_CODES = ["LAT_PULLDOWN", "SEATED_LEG_CURL", "CHEST_SUPPORTED_ROW"];

function flatIntake(p, training, env) {
  const intake = {
    gender: p.sex, age: String(p.age), height_cm: String(p.height_cm), weight_kg: String(p.weight_kg),
    ...(p.waist_cm ? { waist_cm: String(p.waist_cm) } : {}),
    primary_goal: p.goal, neat_level: p.neat_level, occupation_type: "DESK_OFFICE",
    dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: p.medical.length > 0, selected: p.medical },
    injuries_map: {
      has_injuries: p.injuries.length > 0,
      selected_areas: p.injuries.map((i) => i.area),
      ...(p.injuries[0]?.pain_level != null ? { pain_level: p.injuries[0].pain_level } : {}),
    },
    religion: "MUSLIM", strict_allergies: p.allergies,
    meal_structure: { meals_count: p.meals_count, intermittent_fasting: p.fasting },
    recent_training: "ACTIVE",
    cardio: { walkingAbility: p.walking, averageDailySteps: p.steps, maxSessionsPerWeek: 2, maxDurationMinutes: 30 },
    sleep_hours: p.sleep_hours, sleep_schedule: { pattern: p.sleep_pattern, average_hours: p.sleep_hours },
    training,
  };
  if (env) intake.training_environment = env;
  return intake;
}

const gymMachines = (days, exp) => ({
  location: "GYM",
  equipment: [{ equipmentCode: "SELECTORIZED_MACHINES", otherEquipmentText: null, loadCapacity: "HEAVY" }],
  preferredDaysPerWeek: days, maxDaysPerWeek: days, experience: exp,
  selectedInjuries: [], injuries: [], targetFocusMuscles: [], recentTraining: "ACTIVE",
});
const gymEmpty = (days, exp) => ({
  location: "GYM", equipment: [],
  preferredDaysPerWeek: days, maxDaysPerWeek: days, experience: exp,
  selectedInjuries: [], injuries: [], targetFocusMuscles: [], recentTraining: "ACTIVE",
});
const gymFull = (days, exp) => ({
  location: "GYM",
  equipment: [
    { equipmentCode: "SELECTORIZED_MACHINES", otherEquipmentText: null, loadCapacity: "HEAVY" },
    { equipmentCode: "CABLE_STATION", otherEquipmentText: null, loadCapacity: "HEAVY" },
    { equipmentCode: "DUMBBELLS", otherEquipmentText: null, loadCapacity: "HEAVY" },
    { equipmentCode: "BARBELL_AND_PLATES", otherEquipmentText: null, loadCapacity: "HEAVY" },
  ],
  preferredDaysPerWeek: days, maxDaysPerWeek: days, experience: exp,
  selectedInjuries: [], injuries: [], targetFocusMuscles: [], recentTraining: "ACTIVE",
});

function runProgram(training, env) {
  return buildMasterEngineV2({ intake: flatIntake(C08, training, env), evaluationContext: EVAL_CTX, nutritionFoodCatalog: CATALOG, options: {} });
}

const servedCodes = (program) => {
  const codes = new Set();
  for (const w of program.training_program?.weeks || []) {
    for (const s of w.sessions || []) {
      for (const e of s.exercises || []) {
        if (e.exercise_code && !String(e.exercise_code).startsWith("HELD_SLOT")) codes.add(e.exercise_code);
      }
    }
  }
  return codes;
};

test("B6-2 bodyweight-only gym (3d FULL_BODY): zero machine exercises served — LAT_PULLDOWN, SEATED_LEG_CURL, CHEST_SUPPORTED_ROW all gone", () => {
  const program = runProgram(gymEmpty(3, "INTERMEDIATE"), null);
  const codes = servedCodes(program);
  for (const code of MACHINE_CODES) {
    assert.ok(!codes.has(code), `bodyweight-only gym client must never be served ${code}; served codes include it`);
  }
  // The plan is held for the coach, not silently served as if it were fine.
  assert.equal(program.intake_decision.plan_status, "COACH_REVIEW_REQUIRED",
    `bodyweight-only gym plan must stay COACH_REVIEW_REQUIRED, got ${program.intake_decision.plan_status}`);
  assert.equal(program.training_program.final_preflight.status, "REVIEW_REQUIRED",
    "bodyweight-only gym final preflight must withhold (held slots)");
  assert.ok(!program.training_program.final_preflight.violations.some((v) => v.code === "FINAL_EQUIPMENT_MISMATCH"),
    "bodyweight-only gym final preflight must not contain a FINAL_EQUIPMENT_MISMATCH — the machine rows must be gone, not flagged after the fact");
});

test("B6-2 bodyweight-only gym (4d UPPER_LOWER): LAT_PULLDOWN is gone from the vertical-pull slot", () => {
  const program = runProgram(gymEmpty(4, "INTERMEDIATE"), null);
  const codes = servedCodes(program);
  assert.ok(!codes.has("LAT_PULLDOWN"), "bodyweight-only gym 4d client must never be served LAT_PULLDOWN");
  assert.equal(program.intake_decision.plan_status, "COACH_REVIEW_REQUIRED",
    `bodyweight-only gym 4d plan must stay COACH_REVIEW_REQUIRED, got ${program.intake_decision.plan_status}`);
});

test("B6-2 machines-only gym (4d): LAT_PULLDOWN is still served and the final preflight still PASSES (C08 check (f) pin)", () => {
  const program = runProgram(gymMachines(4, "INTERMEDIATE"), "machines_only");
  const codes = servedCodes(program);
  assert.ok(codes.has("LAT_PULLDOWN"),
    "machines-only gym client must KEEP LAT_PULLDOWN — a lat pulldown station is a selectorized machine");
  assert.equal(program.training_program.final_preflight.status, "PASSED",
    `machines-only gym final preflight must still PASS, got ${program.training_program.final_preflight.status}`);
  assert.equal(program.intake_decision.plan_status, "READY_FOR_DRAFT",
    `machines-only gym plan must stay READY_FOR_DRAFT, got ${program.intake_decision.plan_status}`);
});

test("B6-2 full gym (4d): LAT_PULLDOWN is still served and the final preflight still PASSES", () => {
  const program = runProgram(gymFull(4, "INTERMEDIATE"), null);
  const codes = servedCodes(program);
  assert.ok(codes.has("LAT_PULLDOWN"), "full-gym client must keep LAT_PULLDOWN");
  assert.equal(program.training_program.final_preflight.status, "PASSED",
    `full-gym final preflight must still PASS, got ${program.training_program.final_preflight.status}`);
});

test("B6-2 final check shares the fix: LAT_PULLDOWN in served weeks is a FINAL_EQUIPMENT_MISMATCH for bodyweight-only, and clean for machines-only", () => {
  const weeks = [{ week_number: 1, sessions: [{ session_code: "S1", exercises: [{ exercise_code: "LAT_PULLDOWN", slot_code: "VERTICAL_PULL" }] }] }];
  const bodyweightOnly = evaluateFinalTrainingWeeks(weeks, { availableEquipment: new Set(["BODYWEIGHT"]) });
  assert.equal(bodyweightOnly.status, "REVIEW_REQUIRED", "final check must withhold a bodyweight-only plan serving LAT_PULLDOWN");
  assert.ok(bodyweightOnly.violations.some((v) => v.code === "FINAL_EQUIPMENT_MISMATCH" && v.exercise_code === "LAT_PULLDOWN"),
    `final check must flag LAT_PULLDOWN as FINAL_EQUIPMENT_MISMATCH for bodyweight-only, got ${JSON.stringify(bodyweightOnly.violations)}`);
  const machinesOnly = evaluateFinalTrainingWeeks(weeks, { availableEquipment: new Set(["SELECTORIZED_MACHINES", "BODYWEIGHT"]) });
  assert.equal(machinesOnly.status, "PASSED", "final check must PASS LAT_PULLDOWN for a machines-only client");
  assert.ok(!machinesOnly.violations.some((v) => v.code === "FINAL_EQUIPMENT_MISMATCH"),
    "final check must not flag LAT_PULLDOWN for a machines-only client");
});
