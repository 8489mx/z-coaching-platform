import test from "node:test";
import assert from "node:assert/strict";

import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";

/**
 * A dangerous symptom the adapter does not recognise used to be dropped, so the client received an
 * ordinary plan. It must reach medical review instead; case must not matter either.
 */
const symptomsOf = (list) => adaptIntakePayloadToCanonicalEngine({ dangerous_symptoms: list }).medical.dangerousSymptoms;

test("the form's own values map as before", () => {
  assert.equal(symptomsOf(["NONE"]).otherDangerousSymptomsPresent, "NO");
  assert.equal(symptomsOf(["NONE"]).chestPainOrPressure, "NO");
  assert.equal(symptomsOf(["CHEST_PAIN"]).chestPainOrPressure, "YES");
  assert.equal(symptomsOf(["PALPITATIONS"]).abnormalPalpitations, "YES");
});

test("a lower case symptom is still recognised", () => {
  assert.equal(symptomsOf(["chest_pain"]).chestPainOrPressure, "YES");
  assert.equal(symptomsOf(["none"]).otherDangerousSymptomsPresent, "NO");
});

test("an unrecognised symptom is treated as dangerous, not dropped", () => {
  assert.equal(symptomsOf(["SEVERE_HEADACHE_ON_EXERTION"]).otherDangerousSymptomsPresent, "YES");
});
