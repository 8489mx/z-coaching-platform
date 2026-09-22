import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { mealCountNoteForCheckin } from "../src/checkin-engine/meal-count-note.js";

/**
 * The first plan adds a fourth meal at 3200+ kcal on three meals; a check-in that later raises a
 * three-meal plan past 3200 only rescales the three meals. The coach is told to add a meal (the
 * editor's "إضافة وجبة"), since the check-in merge cannot rebuild meals.
 */
test("a check-in that takes a three-meal plan to 3200+ kcal tells the coach to add a meal", () => {
  const note = mealCountNoteForCheckin({ planTargetKcal: 3100, calorieDelta: 150, mealsCount: 3 });
  assert.match(note, /3250/);
  assert.match(note, /إضافة وجبة/);
});

// Two meals get the note too since 2026-09-22 (test/two-meals-never-make-giant-plates.test.js).
test("no note below 3200 or on four or more meals", () => {
  assert.equal(mealCountNoteForCheckin({ planTargetKcal: 3000, calorieDelta: 150, mealsCount: 3 }), null);
  assert.equal(mealCountNoteForCheckin({ planTargetKcal: 3300, calorieDelta: 150, mealsCount: 4 }), null);
  assert.equal(mealCountNoteForCheckin({ planTargetKcal: null, calorieDelta: 150, mealsCount: 3 }), null);
});

test("the check-in controller puts the note in front of the coach (coach_action)", () => {
  const src = fs.readFileSync("src/api/controllers/checkin.controller.js", "utf8");
  assert.match(src, /mealCountNoteForCheckin\(/);
  assert.match(src, /mealCountNote/);
});
