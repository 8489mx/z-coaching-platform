// H5: a minor's real age must be recorded, shown, and used — never rewritten to 16.
// Before this package, calculateAge clamped every age to 16-100 and the shared
// Zone 2 computation did the same, so a 12-year-old got the note
// "متدرب سنه 16 سنة" and Tanaka zones for a 16-year-old (max HR 197 instead
// of the true 200). The minor guard itself was already correct (it reads the
// unclamped calculateAgeYears), so guard behaviour must not change: 12/14/16
// without guardian consent stay BLOCKED/WITHHELD, with consent stay
// COACH_REVIEW_REQUIRED, and 18 stays an adult. The T1D flag-message fix
// from H4 is locked in here too (INSULIN exactly once, ORGAN zero, never the
// old combined liver/stomach message).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";
import { evaluateIntake } from "../src/intake-decision-engine/index.js";
import { computeZone2Bpm } from "../frontend/src/utils/cardioInterferenceEngine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "catalogs", "core-global-food-batch-v1.json"), "utf8")
);

const evaluationContext = Object.freeze({
  system_time: "2026-10-21T00:00:00.000Z",
  assessmentDate: "2026-10-21",
});

// Flat intake shape, as used by the longitudinal harness builder.
function flatIntake(overrides = {}) {
  return {
    gender: "male",
    age: "30",
    height_cm: "178",
    weight_kg: "80",
    primary_goal: "fat_loss",
    neat_level: "MODERATE",
    occupation_type: "DESK_OFFICE",
    dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: false, selected: [] },
    injuries_map: { has_injuries: false, selected_areas: [] },
    religion: "MUSLIM",
    strict_allergies: [],
    meal_structure: { meals_count: 4, intermittent_fasting: "NONE" },
    training_environment: "commercial_gym",
    training_logistics: { days_per_week: 3, experience_level: "beginner" },
    recent_training: "ACTIVE",
    cardio: { walkingAbility: "GOOD", averageDailySteps: 7000, maxSessionsPerWeek: 2, maxDurationMinutes: 30 },
    sleep_hours: 7,
    sleep_schedule: { pattern: "REGULAR", average_hours: 7 },
    ...overrides,
  };
}

function build(rawIntake) {
  const canonical = adaptIntakePayloadToCanonicalEngine(rawIntake);
  const decision = evaluateIntake(canonical, evaluationContext);
  const master = buildMasterEngineV2({
    intake: canonical,
    evaluationContext,
    nutritionFoodCatalog: catalog,
    options: {},
  });
  return { canonical, decision, master };
}

function flagsOf(master, code) {
  return (master.intake_decision?.review_flags || []).filter((f) => f.code === code);
}

function minorIntake({ age, dob, sex, weight, height, consent }) {
  return flatIntake({
    gender: sex,
    age: String(age),
    date_of_birth: dob,
    height_cm: String(height),
    weight_kg: String(weight),
    primary_goal: "muscle_gain",
    training_logistics: { days_per_week: 3, experience_level: "beginner" },
    ...(consent ? { guardian: { consent: true, name: "Parent", phone: "01000000000" } } : {}),
  });
}

function youngTraineeNote(master) {
  return master.nutrition_program?.targets?.clinical_guardrails?.young_trainee_note_ar || null;
}

test("H5: a 12-year-old with guardian consent gets the note for age 12, not 16", () => {
  const { master } = build(minorIntake({ age: 12, dob: "2014-06-15", sex: "male", weight: 48, height: 155, consent: true }));
  assert.equal(master.client_profile.age, 12, "profile age stays 12");
  const note = youngTraineeNote(master);
  assert.ok(note, "young-trainee note exists for a 12-year-old");
  assert.match(note, /سنه 12 سنة/, "note names the real age 12");
  assert.doesNotMatch(note, /سنه 16 سنة/, "note must never rewrite 12 as 16");
  assert.equal(master.intake_decision.plan_status, "COACH_REVIEW_REQUIRED");
});

test("H5: a 14-year-old with guardian consent gets the note for age 14, not 16", () => {
  const { master } = build(minorIntake({ age: 14, dob: "2012-06-15", sex: "female", weight: 55, height: 160, consent: true }));
  assert.equal(master.client_profile.age, 14, "profile age stays 14");
  const note = youngTraineeNote(master);
  assert.ok(note, "young-trainee note exists for a 14-year-old");
  assert.match(note, /سنه 14 سنة/, "note names the real age 14");
  assert.doesNotMatch(note, /سنه 16 سنة/, "note must never rewrite 14 as 16");
});

test("H5: a 16-year-old is unchanged — the note still says 16 (control)", () => {
  const { master } = build(minorIntake({ age: 16, dob: "2010-06-15", sex: "male", weight: 70, height: 175, consent: true }));
  assert.equal(master.client_profile.age, 16, "profile age stays 16");
  const note = youngTraineeNote(master);
  assert.ok(note, "young-trainee note exists for a 16-year-old");
  assert.match(note, /سنه 16 سنة/, "note still names 16 for a real 16-year-old");
});

test("H5: Zone 2 uses the real age — 12 and 14 are no longer computed as 16", () => {
  // Tanaka 208 - 0.7 * age, Zone 2 60%-70%.
  assert.deepEqual(computeZone2Bpm(12), { age: 12, max_heart_rate_bpm: 200, min_bpm: 120, max_bpm: 140 });
  assert.deepEqual(computeZone2Bpm(14), { age: 14, max_heart_rate_bpm: 198, min_bpm: 119, max_bpm: 139 });
  // Unchanged behaviour for ages the old clamp did not touch.
  assert.deepEqual(computeZone2Bpm(16), { age: 16, max_heart_rate_bpm: 197, min_bpm: 118, max_bpm: 138 });
  assert.deepEqual(computeZone2Bpm(85), { age: 85, max_heart_rate_bpm: 149, min_bpm: 89, max_bpm: 104 });
  // Upper sanity bound stays: 101 still reads as 100.
  assert.equal(computeZone2Bpm(101).age, 100);
  // Missing/invalid age still yields nulls, never a fabricated age.
  assert.deepEqual(computeZone2Bpm(0), { age: null, max_heart_rate_bpm: null, min_bpm: null, max_bpm: null });
  assert.deepEqual(computeZone2Bpm(null), { age: null, max_heart_rate_bpm: null, min_bpm: null, max_bpm: null });
});

test("H5: the minor guard is unchanged — no consent still blocks, consent still needs coach review", () => {
  for (const [age, dob, sex, weight, height] of [
    [12, "2014-06-15", "male", 48, 155],
    [14, "2012-06-15", "female", 55, 160],
    [16, "2010-06-15", "male", 70, 175],
  ]) {
    const blocked = build(minorIntake({ age, dob, sex, weight, height, consent: false }));
    assert.equal(flagsOf(blocked.master, "MINOR_WITHOUT_GUARDIAN_CONSENT").length, 1, `age ${age}: blocked without consent`);
    assert.equal(blocked.master.nutrition_program?.status, "WITHHELD", `age ${age}: nutrition withheld without consent`);
    assert.equal(blocked.master.intake_decision.plan_status, "BLOCKED", `age ${age}: plan BLOCKED without consent`);

    const consented = build(minorIntake({ age, dob, sex, weight, height, consent: true }));
    assert.equal(flagsOf(consented.master, "MINOR_REQUIRES_SEPARATE_PATH").length, 1, `age ${age}: separate path with consent`);
    assert.equal(consented.master.nutrition_program?.status, "REVIEW_REQUIRED", `age ${age}: nutrition review-required with consent`);
    assert.equal(consented.master.intake_decision.plan_status, "COACH_REVIEW_REQUIRED", `age ${age}: plan coach-review with consent`);
  }
});

test("H5: an 18-year-old is an adult — no minor flags, no young-trainee note", () => {
  const { master } = build(minorIntake({ age: 18, dob: "2008-06-15", sex: "male", weight: 70, height: 175, consent: false }));
  assert.equal(flagsOf(master, "MINOR_WITHOUT_GUARDIAN_CONSENT").length, 0);
  assert.equal(flagsOf(master, "MINOR_REQUIRES_SEPARATE_PATH").length, 0);
  assert.equal(youngTraineeNote(master), null, "no young-trainee note for an adult");
});

test("H5 (H4 lock-in): a T1D client carries the insulin flag exactly once, never the liver/stomach message", () => {
  for (const meds of [["INSULIN"], ["INSULIN_PUMP"]]) {
    const { master } = build(flatIntake({
      gender: "female",
      age: "28",
      height_cm: "165",
      weight_kg: "65",
      medical_conditions: { has_conditions: true, selected: ["TYPE_1_DIABETES"] },
      current_meds_supplements_list: meds,
    }));
    const insulin = flagsOf(master, "INSULIN_SAFETY_REVIEW_REQUIRED");
    assert.equal(insulin.length, 1, `insulin flag exactly once (meds ${meds})`);
    assert.match(insulin[0].message || "", /Type 1 diabetes or insulin therapy/, "insulin flag carries the diabetes message");
    assert.equal(flagsOf(master, "ORGAN_CONDITION_REQUIRES_MEDICAL_REVIEW").length, 0, "no ORGAN flag for a diabetes client");
    assert.ok(
      !(master.intake_decision.review_flags || []).some((f) => (f.message || "").includes("Liver disease or a stomach that has been operated on")),
      "the old combined liver/stomach message never appears"
    );
  }
});
