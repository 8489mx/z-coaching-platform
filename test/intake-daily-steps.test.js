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

test("an unknown step count keeps the activity-level estimate", () => {
  assert.equal(steps("unknown"), 8500);
  assert.equal(steps(undefined), 8500);
});
