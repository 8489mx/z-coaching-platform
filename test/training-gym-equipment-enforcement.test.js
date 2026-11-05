import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";

/**
 * Q5 / Bug B1 (20-client matrix): a machines-only gym client was prescribed barbell
 * bench, barbell squat, barbell overhead press and dumbbell work — 90 of 145 exercises
 * needed equipment he does not have. The equipment guard used to run for home clients
 * only ("gyms are assumed to have the full room"); it now enforces whatever equipment
 * the client declared, at the gym too. A gym client whose equipment list is explicitly
 * empty fails closed on bodyweight only instead of inheriting the full room.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const CTX = Object.freeze({ system_time: "2026-09-20T08:00:00.000Z", assessmentDate: "2026-09-20" });

const INTAKE = {
  gender: "male", age: "41", height_cm: "176", weight_kg: "88",
  circumferences: { neck_cm: "40", waist_cm: "96", hips_cm: "100" },
  primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE",
  dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: ["none"] },
  injuries_map: { has_injuries: false, selected_areas: ["none"] },
  cardio: { walkingAbility: "EASY" },
  religion: "MUSLIM", strict_allergies: ["none"],
  meal_structure: { meals_count: "4_meals", intermittent_fasting: "none" },
  recent_training: "ACTIVE",
};

function programFor(equipmentCodes, days = 4, experience = "INTERMEDIATE") {
  return buildMasterEngineV2({
    intake: {
      ...INTAKE,
      // Canonical training with an explicit equipment list (the flat form has no
      // equipment-list field, so this is the only honest encoding of a restricted gym).
      training: {
        location: "GYM",
        equipment: equipmentCodes.map((code) => ({
          equipmentCode: code,
          otherEquipmentText: null,
          loadCapacity: code === "BODYWEIGHT" ? "BODYWEIGHT_ONLY" : "HEAVY",
        })),
        preferredDaysPerWeek: days, maxDaysPerWeek: days, experience,
        selectedInjuries: [], injuries: [], targetFocusMuscles: [], recentTraining: "ACTIVE",
      },
    },
    evaluationContext: CTX,
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
}

function exerciseCodes(program) {
  const weeks = program.training_program?.weeks || [];
  return weeks.flatMap((week) => (week.sessions || []).flatMap((session) =>
    (session.exercises || []).map((ex) => String(ex.exercise_code || ex.code || ""))));
}

function heldSlots(program) {
  const weeks = program.training_program?.weeks || [];
  return weeks.flatMap((week) => (week.sessions || []).flatMap((session) =>
    (session.exercises || []).filter((ex) => ex.held_for_review || !ex.exercise_code)));
}

test("a machines-only gym client gets a machines-only program: zero barbell or dumbbell work", () => {
  const program = programFor(["SELECTORIZED_MACHINES"]);
  const codes = exerciseCodes(program);
  assert.ok(codes.length > 0, "a program was produced at all");
  assert.deepEqual(
    codes.filter((code) => /BARBELL|DUMBBELL/.test(code)),
    [],
    "no barbell or dumbbell exercise may reach a client who declared machines only",
  );
  assert.ok(codes.some((code) => code === "LEG_PRESS_MACHINE"), "the knee-dominant slot uses the leg press machine");
  assert.ok(codes.some((code) => code === "MACHINE_CHEST_PRESS"), "the horizontal push uses the machine chest press");
  assert.ok(codes.some((code) => code === "MACHINE_SHOULDER_PRESS"), "the vertical push uses the machine shoulder press");
  assert.equal(heldSlots(program).length, 0, "every slot was filled with a machine or bodyweight movement, nothing held");
  assert.equal(program.training_program?.final_preflight?.status, "PASSED", "the final check agrees the program fits the declared equipment");
  assert.equal(program.training_program?.weeks?.[0]?.sessions?.length, 4, "the client asked for four days");
});

test("a machines-only gym client gets a machines-only program on every split", () => {
  for (const [days, experience] of [[2, "BEGINNER"], [3, "BEGINNER"], [3, "INTERMEDIATE"], [5, "ADVANCED"], [6, "ADVANCED"]]) {
    const program = programFor(["SELECTORIZED_MACHINES"], days, experience);
    const codes = exerciseCodes(program);
    assert.ok(codes.length > 0, `${days}d ${experience}: a program was produced at all`);
    assert.deepEqual(
      codes.filter((code) => /BARBELL|DUMBBELL/.test(code)),
      [],
      `${days}d ${experience}: no barbell or dumbbell exercise in the ${program.training_program?.split_code} split`,
    );
  }
});

test("a gym client with dumbbells and machines but no barbell never gets a barbell", () => {
  const program = programFor(["DUMBBELLS", "SELECTORIZED_MACHINES"]);
  const codes = exerciseCodes(program);
  assert.deepEqual(codes.filter((code) => /BARBELL/.test(code)), [], "no barbell without a declared barbell");
  assert.ok(codes.some((code) => /DUMBBELL/.test(code)), "the declared dumbbells are actually used");
  assert.ok(codes.some((code) => /MACHINE/.test(code)), "the declared machines are actually used");
  assert.equal(heldSlots(program).length, 0, "the partial gym still fills every slot");
});

test("a gym client with an explicitly empty equipment list fails closed on bodyweight only", () => {
  const program = programFor([]);
  const codes = exerciseCodes(program);
  assert.ok(codes.length > 0, "a program was produced at all");
  // No code may NAME equipment the client did not declare. LAT_PULLDOWN is the one
  // exception the name check cannot see: a template code with no V2 record and no
  // equipment word in its name (a machine/cable movement by nature). It stays inside
  // a plan the final check withholds as a whole, so it is never served untouched.
  assert.deepEqual(
    codes.filter((code) => /BARBELL|DUMBBELL|MACHINE|CABLE|SMITH/.test(code)),
    [],
    "an empty equipment list must not serve any named-equipment exercise",
  );
  const held = heldSlots(program);
  assert.ok(held.length > 0, "slots nothing owned fits are held for the coach instead of invented");
  assert.ok(
    held.every((ex) => ex.held_reason === "EQUIPMENT_EXHAUSTED"),
    "every held slot names the equipment exhaustion, not a silent drop",
  );
  assert.equal(program.training_program?.final_preflight?.status, "REVIEW_REQUIRED", "the plan is withheld until the coach fills the held slots");
  assert.ok(
    (program.training_program?.final_preflight?.violations || []).some((v) => v.code === "EQUIPMENT_SLOT_HELD_FOR_REVIEW"),
    "the final check flags the held equipment slots",
  );
});

test("a full gym client still gets the full room through the canonical path", () => {
  const program = programFor(["DUMBBELLS", "BARBELL_AND_PLATES", "CABLE_STATION", "SELECTORIZED_MACHINES", "BODYWEIGHT"]);
  const codes = exerciseCodes(program);
  assert.ok(codes.some((code) => /BARBELL/.test(code)), "a barbell is available and should be used");
  assert.ok(codes.some((code) => /MACHINE|CABLE/.test(code)), "machines are available and should be used");
  assert.equal(heldSlots(program).length, 0, "the full room fills every slot");
  assert.equal(program.training_program?.final_preflight?.status, "PASSED", "the final check passes a full-gym program");
});
