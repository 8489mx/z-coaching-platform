import test from "node:test";
import assert from "node:assert/strict";

import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";

/** The form's step-count answer reaches the cardio decision instead of a count guessed from the activity level. */
const steps = (answer) => adaptIntakePayloadToCanonicalEngine({ neat_level: "moderate", average_daily_steps: answer }).cardio.averageDailySteps;

test("a known step count replaces the guess from the activity level", () => {
  assert.equal(steps("under_3000"), 2500);
  assert.equal(steps("3000_6000"), 4500);
  assert.equal(steps("6000_9000"), 7500);
  assert.equal(steps("over_9000"), 10500);
});

// P1-B1 (Q14): unknown stays unknown — the old activity-level guess (8500)
// is exactly the silent invention this package removes.
test("an unknown step count stays unknown instead of an activity-level guess", () => {
  assert.equal(steps("unknown"), null);
  assert.equal(steps(undefined), null);
});
