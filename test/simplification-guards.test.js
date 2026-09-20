import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The intake and the weekly check-in are being made shorter and lighter for the client. Shortening
 * a form is a UI job; deciding what a client is no longer asked is a clinical one. These guards draw
 * that line: the questions the engines read stay, the safety gate stays visible to everyone, and no
 * measurement field is ever pre-filled with a number the client did not type this week.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INTAKE = fs.readFileSync(path.join(ROOT, "frontend/src/pages/FullIntakeForm.jsx"), "utf8");
const CHECKIN = fs.readFileSync(path.join(ROOT, "frontend/src/pages/WeeklyCheckinForm.jsx"), "utf8");

// Every one of these is read by an engine, a controller or a coach screen (audited field by field).
const FIELDS_THE_ENGINES_READ = [
  "gender", "age", "height_cm", "weight_kg", "neck_cm", "waist_cm", "hips_cm",
  "primary_goal", "neat_level", "occupation_type",
  "dangerous_symptoms", "medical_conditions", "bariatric", "dumping_syndrome", "favism_g6pd",
  "hypertension", "gout", "female_cases", "diabetes",
  "injuries_map", "injury_nature", "pain_relieved_by_rest",
  "current_meds_supplements_list",
  "religion", "christianFastingStyle", "strict_allergies", "disliked_foods",
  "meal_structure", "intermittent_fasting", "food_budget", "food_prep_ability",
  "beverage_sugar_intake", "sleep_schedule", "bedtime_hour",
  "training_environment", "training_logistics", "experience_level", "days_per_week",
  "has_other_sports", "sports_name", "hours_per_week", "recent_training", "focus_muscles",
  "media_uploads", "health_data_consent",
];

test("simplifying the intake never drops a field an engine reads", () => {
  const missing = FIELDS_THE_ENGINES_READ.filter((field) => !INTAKE.includes(field));
  assert.deepEqual(missing, [], "these answers drive the plan; hide them, group them, make them optional, but do not remove them");
});

test("the safety gate and the legal consent are asked of every client, not hidden behind a branch", () => {
  // The dangerous-symptoms question is what sends a chest-pain client to mandatory medical review.
  assert.ok(INTAKE.includes("dangerous_symptoms"), "the dangerous symptoms question is gone");
  const consentAt = INTAKE.indexOf('role="checkbox"');
  const firstQuestionAt = INTAKE.indexOf("{/* Gender Switcher */}");
  assert.ok(consentAt > 0 && consentAt < firstQuestionAt, "the health-data consent stays first in the form");
  assert.match(INTAKE, /if \(step > 1 && !consentGiven\)/, "no step may be reached before consent");
  assert.match(INTAKE, /const handleSubmit = async \(\) => \{\s*if \(!consentGiven\)/, "submit stays blocked without consent");
});

test("no measurement field is pre-filled: the client types this week's number", () => {
  for (const field of ["weight_kg", "waist_circumference_cm"]) {
    const declared = CHECKIN.match(new RegExp(`${field}: '([^']*)'`));
    assert.ok(declared, `${field} disappeared from the check-in form`);
    assert.equal(declared[1], "", `${field} starts empty; a previous reading may be shown as a hint, never typed into the field`);
  }
});

test("the check-in keeps sending what the engines need, however short the form gets", () => {
  for (const key of [
    "user_id", "weight_kg", "waist_circumference_cm", "nutrition_adherence_percent",
    "biofeedback_scale", "biofeedback", "pain_reports", "client_notes", "photos",
  ]) {
    assert.ok(CHECKIN.includes(key), `the check-in stopped sending ${key}`);
  }
  // The 1-10 sliders only mean anything because the server is told which scale they use.
  assert.match(CHECKIN, /biofeedback_scale: 10/);
});
