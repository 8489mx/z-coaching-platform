import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";

/**
 * "At home" is three different rooms, and the intake asks which one. A client who answered
 * "bodyweight only" owns no dumbbells: prescribing them a dumbbell press is prescribing a session
 * they cannot do, and the plan quietly becomes someone else's plan.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const CTX = Object.freeze({ system_time: "2026-09-20T08:00:00.000Z", assessmentDate: "2026-09-20" });

// Band variants carry the name of the gym movement they replace (BAND_LAT_PULLDOWN), so the check
// is for the equipment itself, not for the movement it imitates.
const GYM_ONLY = /^(?!BAND_)(.*(DUMBBELL|BARBELL|CABLE|MACHINE|SMITH|LAT_PULLDOWN).*)$/;
const GYM_ONLY_HEAVY = /^(?!BAND_)(.*(BARBELL|CABLE|MACHINE|SMITH|LAT_PULLDOWN).*)$/;

const INTAKE = {
  gender: "male", age: "30", height_cm: "176", weight_kg: "88",
  circumferences: { neck_cm: "40", waist_cm: "95", hips_cm: "100" },
  primary_goal: "recomposition", neat_level: "moderate", occupation_type: "DESK_OFFICE",
  dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: ["none"] },
  injuries_map: { has_injuries: false, selected_areas: ["none"] },
  religion: "MUSLIM", strict_allergies: ["none"],
  meal_structure: { meals_count: "3_meals_snack", intermittent_fasting: "none" },
  training_logistics: { days_per_week: 4, experience_level: "intermediate" },
  recent_training: "ACTIVE",
};

function exerciseCodesFor(environment, days = 4) {
  const program = buildMasterEngineV2({
    intake: { ...INTAKE, training_environment: environment, training_logistics: { days_per_week: days, experience_level: "intermediate" } },
    evaluationContext: CTX,
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
  const weeks = program.training_program?.weeks || [];
  const codes = weeks.flatMap((week) => (week.sessions || []).flatMap((session) => (session.exercises || []).map((ex) => String(ex.exercise_code || ex.code || "").toUpperCase())));
  assert.ok(codes.length > 0, `${environment}: no exercises were produced at all`);
  return codes;
}

// Every weekly frequency: the two- and three-day plans use a hand-written full-body template, the
// five- and six-day ones others again, and the first version of this test only tried four days.
for (const days of [2, 3, 4, 5, 6]) {
  test(`a bodyweight-only client training ${days} days a week is never prescribed equipment they do not own`, () => {
    const codes = exerciseCodesFor("calisthenics_bands", days);
    const forbidden = codes.filter((code) => GYM_ONLY.test(code) || /GOBLET/.test(code));
    assert.deepEqual(forbidden, [], "these need a gym or dumbbells the client said they do not have");
    assert.ok(codes.some((code) => /PUSH_UP|SQUAT|BRIDGE|BAND|PLANK|ROW/.test(code)), "the plan is built from what they do have");
  });
}

test("a client with light home equipment trains with dumbbells and bands, never with a barbell or machines", () => {
  for (const [environment, days] of [["minimal_equipment", 3], ["minimal_equipment", 4], ["home_gym", 3], ["home_gym", 5]]) {
    const codes = exerciseCodesFor(environment, days);
    const forbidden = codes.filter((code) => GYM_ONLY_HEAVY.test(code));
    assert.deepEqual(forbidden, [], `${environment}: a home client cannot load a barbell or use a machine`);
    assert.ok(codes.some((code) => /DUMBBELL|BAND/.test(code)), `${environment}: the equipment they declared is actually used`);
  }
});

test("a gym client still gets the full room", () => {
  const codes = exerciseCodesFor("commercial_gym");
  assert.ok(codes.some((code) => /BARBELL/.test(code)), "a barbell is available and should be used");
  assert.ok(codes.some((code) => /LAT_PULLDOWN|CABLE|MACHINE/.test(code)), "machines are available and should be used");
});

test("every environment gets a full week, a warm-up and a cool-down", () => {
  for (const environment of ["commercial_gym", "home_gym", "minimal_equipment", "calisthenics_bands"]) {
    const program = buildMasterEngineV2({
      intake: { ...INTAKE, training_environment: environment },
      evaluationContext: CTX,
      nutritionFoodCatalog: CATALOG,
      options: {},
    });
    const sessions = program.training_program?.weeks?.[0]?.sessions || [];
    assert.equal(sessions.length, 4, `${environment}: the client asked for four days`);
    for (const session of sessions) {
      const mobility = session.mobility_protocol || {};
      assert.ok((mobility.dynamic_warmup?.exercises || []).length > 0, `${environment}: a session without a warm-up`);
      assert.ok((mobility.static_cooldown?.exercises || []).length > 0, `${environment}: a session without a cool-down`);
    }
    assert.ok(program.cardio_program, `${environment}: the cardio decision is missing`);
    assert.ok(program.mobility_program, `${environment}: the mobility programme is missing`);
  }
});
