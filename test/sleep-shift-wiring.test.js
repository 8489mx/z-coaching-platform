// Sleep + shift wiring (Bugs B2/B3) — fail-first tests for fix/sleep-shift-wiring.
//
// B2: the recovery baseline read `lifestyle.sleep.hours`, a field no adapter
// ever wrote, so every client got the 7.5 h default; quality FAIR also fell
// through to a 90 sleep score. B3: circadian timing never saw a bedtime,
// wake time, or shift schedule, so every client got 17:00/23:00/07:00, and
// there was no Ramadan protocol — a Ramadan fast got the generic 16:8
// window (12:00–20:00).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { calculateTrainingReadiness } from "../src/execution-engines/autoregulated-recovery-engine.js";
import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";
import { validateIntake } from "../src/intake-decision-engine/validation/validate-intake.js";
import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { completeIntake, ASSESSMENT_CONTEXT } from "./fixtures/complete-intake.js";

const CATALOG = JSON.parse(
  fs.readFileSync(new URL("../data/catalogs/core-global-food-batch-v1.json", import.meta.url), "utf8"),
);
const EVAL_CTX = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate, // 2026-07-14, outside Ramadan
});
const RAMADAN_CTX = Object.freeze({
  system_time: "2026-03-01T08:00:00.000Z",
  assessmentDate: "2026-03-01", // Ramadan 1447 (Umm al-Qura)
});

// Flat-form intake in the shape the matrix runner builds (C15: 5 h, irregular;
// C14: 6 h, night shift, Ramadan 16:8; C01: 7.5 h, regular night).
function flatIntake({ sleepHours, pattern, fasting = "none", bedtimeHour, religion = "MUSLIM" }) {
  return {
    gender: "female", age: "23", height_cm: "158", weight_kg: "55",
    primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE",
    dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: false, selected: [] },
    injuries_map: { has_injuries: false, selected_areas: [] },
    religion,
    strict_allergies: [],
    meal_structure: { meals_count: "3_meals_snack", intermittent_fasting: fasting },
    training_environment: "home_bodyweight",
    training_logistics: { days_per_week: 2, experience_level: "BEGINNER" },
    recent_training: "ACTIVE",
    cardio: { walkingAbility: "EASY", averageDailySteps: 7500, maxSessionsPerWeek: 2, maxDurationMinutes: 30 },
    sleep_hours: sleepHours,
    sleep_schedule: {
      pattern,
      average_hours: sleepHours,
      ...(bedtimeHour ? { bedtime_hour: bedtimeHour } : {}),
    },
  };
}

function build(intake, evaluationContext = EVAL_CTX) {
  return buildMasterEngineV2({ intake, evaluationContext, nutritionFoodCatalog: CATALOG, options: {} });
}

test("B2: FAIR sleep quality scores between AVERAGE and GOOD, never 90", () => {
  // Same hours, only the quality changes: FAIR must sit between 65 and 90.
  const fair = calculateTrainingReadiness({ sleep_quality: "FAIR", sleep_hours: 7.5, stress_level: 4, energy_level: 8 });
  const average = calculateTrainingReadiness({ sleep_quality: "AVERAGE", sleep_hours: 7.5, stress_level: 4, energy_level: 8 });
  const good = calculateTrainingReadiness({ sleep_quality: "GOOD", sleep_hours: 7.5, stress_level: 4, energy_level: 8 });
  assert.equal(fair.metrics.sleep_score, 75);
  assert.equal(average.metrics.sleep_score, 65);
  assert.equal(good.metrics.sleep_score, 90);
});

test("B2: UNKNOWN sleep quality never scores as good sleep", () => {
  const out = calculateTrainingReadiness({ sleep_quality: "UNKNOWN", sleep_hours: 7.5, stress_level: 4, energy_level: 8 });
  assert.equal(out.metrics.sleep_score, 65);
});

test("B2: a 5-hour FAIR sleeper is no longer OPTIMAL (was readiness 82, sleep 90)", () => {
  const out = calculateTrainingReadiness({ sleep_quality: "FAIR", sleep_hours: 5, stress_level: 4, energy_level: 8 });
  // 75 (FAIR) − 30 (< 5.5 h) = 45 sleep; readiness 45*.35 + 80*.25 + 80*.20 + 70*.20 = 66.
  assert.equal(out.metrics.sleep_score, 45);
  assert.equal(out.readiness_score, 66);
  assert.equal(out.tier, "MODERATE_FATIGUE");
});

test("B2: the adapter carries the reported bedtime and derives the wake time", () => {
  const canonical = adaptIntakePayloadToCanonicalEngine(
    flatIntake({ sleepHours: 5, pattern: "irregular", bedtimeHour: "01:00" }),
  );
  assert.equal(canonical.lifestyle.sleep.averageHours, 5);
  assert.equal(canonical.lifestyle.sleep.quality, "FAIR");
  assert.equal(canonical.lifestyle.sleep.bedtime, "01:00");
  assert.equal(canonical.lifestyle.sleep.wakeTime, "06:00");
});

test("B2: a malformed bedtime is dropped, never repaired or invented", () => {
  const canonical = adaptIntakePayloadToCanonicalEngine(
    flatIntake({ sleepHours: 5, pattern: "irregular", bedtimeHour: "25:00" }),
  );
  assert.equal(canonical.lifestyle.sleep.bedtime, undefined);
  assert.equal(canonical.lifestyle.sleep.wakeTime, undefined);
});

test("B2/B3: the canonical sleep record keeps bedtime/wakeTime and passes strict validation", () => {
  const intake = completeIntake();
  intake.lifestyle.sleep.bedtime = "22:30";
  intake.lifestyle.sleep.wakeTime = "06:30";
  const ok = validateIntake(intake, ASSESSMENT_CONTEXT);
  assert.equal(ok.valid, true, JSON.stringify(ok.issues));
  const bad = completeIntake();
  bad.lifestyle.sleep.bedtime = "25:00";
  const rejected = validateIntake(bad, ASSESSMENT_CONTEXT);
  assert.equal(rejected.valid, false);
  assert.ok(rejected.issues.some((i) => i.path === "lifestyle.sleep.bedtime" && i.code === "INVALID_TIME"));
});

test("B2: C15 (5 h sleeper) — readiness and sleep score drop; C01 (7.5 h) is unchanged", () => {
  const c15 = build(flatIntake({ sleepHours: 5, pattern: "irregular" }));
  const base15 = c15.recovery_autoregulation.readiness_baseline;
  assert.equal(base15.metrics.sleep_score, 45);
  assert.equal(base15.readiness_score, 66);
  assert.equal(base15.tier, "MODERATE_FATIGUE");

  const c01 = build(flatIntake({ sleepHours: 7.5, pattern: "regular_night" }));
  const base01 = c01.recovery_autoregulation.readiness_baseline;
  assert.equal(base01.metrics.sleep_score, 90);
  assert.equal(base01.readiness_score, 82);
  assert.equal(base01.tier, "OPTIMAL");
  assert.equal(c01.circadian_timing.workout_time, "17:00");
  assert.equal(c01.circadian_timing.bedtime, "23:00");
  assert.equal(c01.circadian_timing.wake_time, "07:00");
});

test("B3: a night-shift worker with no reported times gets his timing HELD, not 17:00/23:00/07:00", () => {
  const c14 = build(flatIntake({ sleepHours: 6, pattern: "night_shift", fasting: "16_8" }));
  const circ = c14.circadian_timing;
  assert.equal(circ.held_for_coach_review, true);
  assert.equal(circ.status, "HELD_FOR_COACH_REVIEW");
  assert.equal(circ.workout_time, null);
  assert.equal(circ.bedtime, null);
  assert.equal(circ.wake_time, null);
  assert.equal(circ.timeline.length, 0);
  assert.match(circ.hold_reason_ar, /شفت/);
  // The hold is the same object the nutrition program serves.
  assert.equal(c14.nutrition_program.circadian_timing.held_for_coach_review, true);
  // And his short sleep still shows in readiness (6 h FAIR: 75 − 15 = 60).
  assert.equal(c14.recovery_autoregulation.readiness_baseline.metrics.sleep_score, 60);
});

test("B3: a night-shift worker who DID report a bedtime and a workout time gets a shifted schedule", () => {
  const intake = flatIntake({ sleepHours: 6, pattern: "night_shift", fasting: "16_8", bedtimeHour: "08:00" });
  intake.training = {
    location: "GYM", preferredTime: "20:00", preferredDaysPerWeek: 3, maxDaysPerWeek: 3,
    experience: "BEGINNER", selectedInjuries: [], injuries: [], targetFocusMuscles: [], recentTraining: "ACTIVE",
  };
  delete intake.training_environment;
  delete intake.training_logistics;
  const out = build(intake);
  assert.equal(out.circadian_timing.held_for_coach_review, undefined);
  assert.equal(out.circadian_timing.workout_time, "20:00");
  assert.equal(out.circadian_timing.bedtime, "08:00");
  assert.equal(out.circadian_timing.wake_time, "14:00");
  assert.equal(out.circadian_timing.caffeine_cutoff.caffeine_cutoff_24h, "00:00");
});

test("B3: a rotating-shift worker is always held, even with a bedtime given", () => {
  const out = build(flatIntake({ sleepHours: 6, pattern: "rotating_shifts", bedtimeHour: "08:00" }));
  assert.equal(out.circadian_timing.held_for_coach_review, true);
  assert.equal(out.circadian_timing.workout_time, null);
  // The reported bedtime is kept as a known fact, not discarded.
  assert.equal(out.circadian_timing.bedtime, "08:00");
});

test("B3: an irregular sleeper who reported a bedtime gets it (with a derived wake time)", () => {
  const out = build(flatIntake({ sleepHours: 5, pattern: "irregular", bedtimeHour: "01:00" }));
  assert.equal(out.circadian_timing.held_for_coach_review, undefined);
  assert.equal(out.circadian_timing.bedtime, "01:00");
  assert.equal(out.circadian_timing.wake_time, "06:00");
});

test("B3 Ramadan: the explicit Ramadan value gets a Ramadan window, never generic 12:00–20:00", () => {
  const out = build(flatIntake({ sleepHours: 6, pattern: "night_shift", fasting: "ramadan" }));
  const fw = out.nutrition_program.targets.fasting_window;
  assert.equal(out.nutrition_program.targets.diet_framework, "INTERMITTENT_FASTING");
  assert.equal(fw.protocol, "RAMADAN");
  assert.match(fw.framework_name_ar, /رمضان/);
  assert.equal(fw.fasting_hours, null);
  assert.equal(fw.eating_window_hours, null);
  assert.equal(fw.held_for_coach_review, true);
  assert.doesNotMatch(fw.eating_window_schedule_ar, /12:00/);
  assert.match(fw.eating_window_schedule_ar, /الإفطار/);
  assert.match(fw.eating_window_schedule_ar, /السحور/);
});

test("B3 Ramadan: a Muslim on generic 16:8 generated on a Ramadan day is Ramadan, off-Ramadan stays 16:8", () => {
  const inRamadan = build(flatIntake({ sleepHours: 6, pattern: "night_shift", fasting: "16_8" }), RAMADAN_CTX);
  const fwRam = inRamadan.nutrition_program.targets.fasting_window;
  assert.equal(fwRam.protocol, "RAMADAN");
  assert.equal(fwRam.held_for_coach_review, true);

  const offRamadan = build(flatIntake({ sleepHours: 6, pattern: "night_shift", fasting: "16_8" }));
  const fwOff = offRamadan.nutrition_program.targets.fasting_window;
  assert.equal(fwOff.protocol, "16_8");
  assert.equal(fwOff.fasting_hours, 16);
  assert.equal(fwOff.eating_window_hours, 8);
  assert.match(fwOff.eating_window_schedule_ar, /12:00/);
});
