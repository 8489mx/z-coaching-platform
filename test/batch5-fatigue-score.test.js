import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { buildAdaptedPlan } from "../src/adaptation-engine/index.js";
import { readAdaptationState } from "../src/adaptation-engine/diet-break-state.js";
import { mergeAdaptedPlanIntoProgram } from "../src/api/utils/planMergeEngine.js";
import { completeIntake, ASSESSMENT_CONTEXT } from "./fixtures/complete-intake.js";

const evaluationContext = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
});
const nutritionFoodCatalog = JSON.parse(
  fs.readFileSync(new URL("../data/catalogs/core-global-food-batch-v1.json", import.meta.url), "utf8"),
);

// A beginner first plan: week 5 is CONSOLIDATION by the experience
// heuristic (shouldDeload = !isBeginner), so a stored fatigue score >= 7
// flipping it to DELOAD is observable and unambiguous.
function buildBeginnerProgram(adaptationState) {
  const intake = JSON.parse(JSON.stringify(completeIntake()));
  intake.training = { ...(intake.training || {}), experience: "BEGINNER" };
  intake.goals = { ...(intake.goals || {}), primary: "FAT_LOSS" };
  const options = adaptationState ? { adaptation_state: adaptationState } : {};
  return buildMasterEngineV2({ intake, evaluationContext, nutritionFoodCatalog, options });
}

function week5Phase(program) {
  return program.training_program.weeks[4].phase;
}

function onTrackCheckin(extra = {}) {
  return {
    status: "ON_TRACK",
    analysis_status: "ON_TRACK",
    consecutive_high_compliance_weeks: 1,
    ...extra,
  };
}

test("B5-1: buildAdaptedPlan stores a real check-in fatigue score in adaptation_state", () => {
  const base = buildBeginnerProgram(null);
  const adapted = buildAdaptedPlan({
    currentMasterProgram: base,
    checkinAnalysis: onTrackCheckin(),
    options: {
      currentWeekNumber: 2,
      consecutive_high_compliance_weeks: 1,
      accumulated_fatigue_score: 8,
    },
  });
  assert.equal(adapted.adaptation_state.accumulated_fatigue_score, 8);
});

test("B5-1: buildAdaptedPlan stores the score from checkinAnalysis when options carry none", () => {
  const base = buildBeginnerProgram(null);
  const adapted = buildAdaptedPlan({
    currentMasterProgram: base,
    checkinAnalysis: onTrackCheckin({ fatigue_score: 7 }),
    options: { currentWeekNumber: 2, consecutive_high_compliance_weeks: 1 },
  });
  assert.equal(adapted.adaptation_state.accumulated_fatigue_score, 7);
});

test("B5-1: a missing fatigue score is stored as nothing — never the follow-up default (4)", () => {
  const base = buildBeginnerProgram(null);
  const adapted = buildAdaptedPlan({
    currentMasterProgram: base,
    checkinAnalysis: onTrackCheckin(),
    options: { currentWeekNumber: 2, consecutive_high_compliance_weeks: 1 },
  });
  // The follow-up path defaults an absent score to 4 for its own deload
  // decision; that default is a fallback, not a measurement, and must
  // never be persisted as if the client reported it. The whitelisted
  // read always carries the key, so absent reads as null — exactly like
  // every other unset field in the adaptation state.
  assert.equal(adapted.adaptation_state.accumulated_fatigue_score, null);
});

test("B5-1: readAdaptationState preserves a stored fatigue score and drops garbage", () => {
  assert.equal(
    readAdaptationState({ adaptation_state: { accumulated_fatigue_score: 8 } }).accumulated_fatigue_score,
    8,
  );
  assert.equal(readAdaptationState({ adaptation_state: {} }).accumulated_fatigue_score, null);
  assert.equal(readAdaptationState({}).accumulated_fatigue_score, null);
  assert.equal(
    readAdaptationState({ adaptation_state: { accumulated_fatigue_score: "high" } }).accumulated_fatigue_score,
    null,
  );
  // finiteOrNull maps 0 to null, same as the other fields; a 0 behaves
  // exactly as absent in the mesocycle (0 >= 7 is false), so nothing is lost.
  assert.equal(
    readAdaptationState({ adaptation_state: { accumulated_fatigue_score: 0 } }).accumulated_fatigue_score,
    null,
  );
});

test("B5-1: a regen with a stored fatigue score >= 7 takes the week-5 deload path (beginner)", () => {
  const first = buildBeginnerProgram(null);
  assert.equal(week5Phase(first), "CONSOLIDATION");
  const regen = buildBeginnerProgram({ accumulated_fatigue_score: 8 });
  assert.equal(week5Phase(regen), "DELOAD");
});

test("B5-1: a regen with no stored score falls through to the experience heuristic", () => {
  const regen = buildBeginnerProgram({});
  assert.equal(week5Phase(regen), "CONSOLIDATION");
});

test("B5-1: a stored score below 7 changes nothing at week 5", () => {
  const regen = buildBeginnerProgram({ accumulated_fatigue_score: 4 });
  assert.equal(week5Phase(regen), "CONSOLIDATION");
});

test("B5-1: the stored score survives adapt + merge and drives the next regen (full chain)", () => {
  const base = buildBeginnerProgram(null);
  const adapted = buildAdaptedPlan({
    currentMasterProgram: base,
    checkinAnalysis: onTrackCheckin(),
    options: {
      currentWeekNumber: 2,
      consecutive_high_compliance_weeks: 1,
      accumulated_fatigue_score: 8,
    },
  });
  const merged = mergeAdaptedPlanIntoProgram(base, adapted);
  assert.equal(merged.adaptation_state.accumulated_fatigue_score, 8);
  const regen = buildBeginnerProgram(merged.adaptation_state);
  assert.equal(week5Phase(regen), "DELOAD");
});
