import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FORM = fs.readFileSync(path.join(ROOT, "frontend/src/pages/FullIntakeForm.jsx"), "utf8");

// House rule: a question is only asked if some engine acts on the answer. These were asked and
// then ignored by every engine, so they were removed; they do not come back without a reader.
test("the intake no longer asks questions no engine reads", () => {
  for (const field of ["smoking_status", "cuisine_preference", "cravings_pattern"]) {
    assert.ok(!FORM.includes(field), `${field} is back in the intake form without an engine that reads it`);
  }
  // Never-rendered leftovers in the defaults.
  for (const field of ["chest_cm", "arm_cm", "thigh_cm", "thyroid: '"]) {
    assert.ok(!FORM.includes(field), `${field} is back in the intake defaults`);
  }
});

test("the questions that do drive the plan are still asked", () => {
  for (const field of ["focus_muscles", "strict_allergies", "disliked_foods", "food_budget", "food_prep_ability",
    "injuries_map", "dangerous_symptoms", "meal_structure", "sleep_schedule", "religion", "neat_level",
    "occupation_type", "recent_training", "training_logistics", "health_data_consent"]) {
    assert.ok(FORM.includes(field), `${field} disappeared from the intake form`);
  }
});
