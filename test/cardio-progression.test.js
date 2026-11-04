import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCardioProgression,
  weekOneDuration,
} from "../src/cardio-progression/build-cardio-progression.js";

test("P1-B8: progression ramps to the ceiling by week 3 and deloads week 4", () => {
  const weeks = buildCardioProgression({
    baseDurationMinutes: 20,
    intensity: "LOW",
    sessionsPerWeek: 2,
  });
  assert.equal(weeks.length, 5);
  assert.deepEqual(
    weeks.map((w) => w.duration_minutes),
    [16, 18, 20, 15, 16],
  );
  assert.equal(weeks[3].is_deload, true);
  assert.equal(weeks[0].is_deload, false);
  assert.equal(weeks[0].sessions_per_week, 2);
  assert.equal(weeks[0].intensity, "LOW");
});

test("P1-B8: progression never exceeds the ceiling and never drops below the 15-minute floor", () => {
  const weeks = buildCardioProgression({
    baseDurationMinutes: 15,
    intensity: "LOW",
    sessionsPerWeek: 3,
  });
  assert.ok(weeks.every((w) => w.duration_minutes >= 15 && w.duration_minutes <= 15));
  assert.equal(weekOneDuration(30), 24);
  assert.equal(weekOneDuration(20), 16);
});
