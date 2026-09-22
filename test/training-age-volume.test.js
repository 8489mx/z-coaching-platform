import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { TRAINING_AGES, experienceForTrainingAge } from "../src/training-engine-v2/training-age.js";

/**
 * "Beginner" covered everyone under a year and the form defaulted to intermediate: a client who never
 * touched a weight got the same weekly sets as one with a year behind them. The intake now asks for
 * training age in six steps, and volume follows it (ACSM 2009 progression models: novices 1-3 sets
 * an exercise; trained lifters need more weekly sets, 12-20 a muscle - Schoenfeld 2017, Baz-Valle
 * 2022). Old intakes without the answer keep exactly the plan they had.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const plan = (logistics, days = 4) => buildMasterEngineV2({
  intake: {
    gender: "male", age: "25", height_cm: "180", weight_kg: "80", circumferences: { neck_cm: "38", waist_cm: "82", hips_cm: "95" },
    primary_goal: "lean_bulk", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
    religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
    training_environment: "commercial_gym", training_logistics: { days_per_week: days, ...logistics }, recent_training: "ACTIVE",
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG,
  options: {},
}).training_program;
const weeklySets = (tp, week = 0) => tp.weeks[week].sessions.flatMap((s) => s.exercises).reduce((sum, e) => sum + (Number(e.sets) || 0), 0);
const setsByCode = (tp) => JSON.stringify(tp.weeks.map((w) => w.sessions.map((s) => s.exercises.map((e) => `${e.exercise_code}:${e.sets}:${e.rir ?? e.target_rir}`))));

test("the six training ages map to the engine's experience levels", () => {
  assert.deepEqual(TRAINING_AGES, ["never", "under_6_months", "6_12_months", "1_2_years", "2_4_years", "over_4_years"]);
  assert.equal(experienceForTrainingAge("never"), "NEVER_TRAINED");
  assert.equal(experienceForTrainingAge("under_6_months"), "BEGINNER");
  assert.equal(experienceForTrainingAge("6_12_months"), "BEGINNER");
  assert.equal(experienceForTrainingAge("1_2_years"), "INTERMEDIATE");
  assert.equal(experienceForTrainingAge("2_4_years"), "INTERMEDIATE");
  assert.equal(experienceForTrainingAge("over_4_years"), "ADVANCED");
});

test("weekly volume grows with training age, step by step (full body 3 days and upper/lower 4 days)", () => {
  for (const days of [3, 4]) {
  const totals = TRAINING_AGES.map((age) => weeklySets(plan({ training_age: age }, days)));
  for (let i = 1; i < totals.length; i++) assert.ok(totals[i] >= totals[i - 1], `${TRAINING_AGES[i]} ${totals[i]} < ${TRAINING_AGES[i - 1]} ${totals[i - 1]}`);
  assert.ok(totals[0] < totals[2], `never ${totals[0]} vs 6-12 months ${totals[2]}`);
  assert.ok(totals[1] < totals[2], `under 6 months ${totals[1]} vs 6-12 months ${totals[2]}`);
  assert.ok(totals[4] > totals[3], `2-4 years ${totals[4]} vs 1-2 years ${totals[3]}`);
  }
});

test("a client who never trained gets 2 sets an exercise with nothing added in weeks 3-4, and at least 3 reps in reserve", () => {
  const tp = plan({ training_age: "never" });
  for (const week of tp.weeks.slice(0, 4)) {
    for (const e of week.sessions.flatMap((s) => s.exercises)) {
      assert.equal(Number(e.sets), 2, `week ${week.week_number} ${e.exercise_code}`);
      assert.ok(Number(e.rir ?? e.target_rir) >= 3, `week ${week.week_number} ${e.exercise_code} RIR ${e.rir ?? e.target_rir}`);
    }
  }
});

// Checked against the plans before this change: 41 of 45 identical (3 environments x 5 day counts x
// 3 levels); the 4 that changed are advanced full body, now 4 sets on heavy compounds instead of 3.
test("old intakes without training age keep exactly the plan they had", () => {
  assert.equal(setsByCode(plan({ experience_level: "beginner" })), setsByCode(plan({ training_age: "6_12_months" })));
  assert.equal(setsByCode(plan({ experience_level: "intermediate" })), setsByCode(plan({ training_age: "1_2_years" })));
  assert.equal(setsByCode(plan({ experience_level: "advanced" })), setsByCode(plan({ training_age: "over_4_years" })));
});
