/* Phase 2: green auto-apply is a pure gate over the Phase 1 classifier plus
 * the buildAdaptedPlan result. It never runs on a shadow prediction alone:
 * the engine result is re-checked, and any engine flag blocks application.
 * This file is pure (no database) and tests behaviour by calling functions,
 * never by reading source files as text: the controller wiring that calls
 * these functions (transaction, routes, roles) is verified by integration
 * tests in the review environment, not by a text search here. */
import test from "node:test";
import assert from "node:assert/strict";

import {
  FOLLOW_UP_TRIAGE,
  classifyFollowUp,
} from "../src/execution-engines/coach-triage-engine.js";
import {
  baseTargetsFromProgram,
  deriveEngineProposed,
  decideFollowUpAutoApply,
  buildBlockedTriage,
  buildCoachDigest,
  selectYellowForBulkApprove,
} from "../src/execution-engines/follow-up-auto-apply.js";

function greenTriage(overrides = {}) {
  return {
    classifier_version: FOLLOW_UP_TRIAGE.CLASSIFIER_VERSION,
    tier: "GREEN",
    reasons: [{ code: "ON_TRACK", message_ar: "on track" }],
    habit_nudge: false,
    safety_correction: null,
    signals: {},
    ...overrides,
  };
}

function cleanAdapted(overrides = {}) {
  return {
    adaptation_action: "MAINTAIN_TRAJECTORY",
    requires_coach_approval: false,
    is_deload_recommended: false,
    is_diet_break_recommended: false,
    adapted_nutrition: {
      target_calories_kcal: 2000,
      protein_g: 150,
      carbohydrate_g: 250,
      fat_g: 60,
      alignment_conflict: false,
      refeed_config: null,
    },
    adapted_training_week: {
      week_number: 2,
      sessions: [{ exercises: [{ code: "SQUAT" }] }],
    },
    adapted_cardio: { daily_step_target: 8000 },
    adaptation_reasons: [],
    ...overrides,
  };
}

function baseProgram() {
  return {
    nutrition_program: {
      macro_targets: { calories_kcal: 2000, protein_g: 150, carbohydrate_g: 250, fat_g: 60 },
    },
    cardio_program: { prescription: { daily_step_target: 8000 } },
  };
}

test("base targets are read from the same program paths the adaptation engine uses", () => {
  const targets = baseTargetsFromProgram(baseProgram());
  assert.equal(targets.baseCaloriesKcal, 2000);
  assert.equal(targets.baseSteps, 8000);
  const fallback = baseTargetsFromProgram({});
  assert.equal(fallback.baseCaloriesKcal, 2000);
  assert.equal(fallback.baseSteps, 8000);
});

test("GREEN inside caps with a clean engine result is eligible", () => {
  const decision = decideFollowUpAutoApply({
    triage: greenTriage(),
    adapted: cleanAdapted(),
    baseCaloriesKcal: 2000,
    baseSteps: 8000,
  });
  assert.equal(decision.eligible, true);
  assert.deepEqual(decision.blocked_reasons, []);
  assert.equal(decision.calorie_delta, 0);
  assert.equal(decision.steps_delta, 0);
});

test("GREEN at exactly 200 kcal / 1000 steps is eligible; 201 / 1001 is not", () => {
  const atCap = decideFollowUpAutoApply({
    triage: greenTriage(),
    adapted: cleanAdapted({
      adapted_nutrition: {
        target_calories_kcal: 2200,
        protein_g: 150,
        carbohydrate_g: 300,
        fat_g: 60,
        alignment_conflict: false,
        refeed_config: null,
      },
      adapted_cardio: { daily_step_target: 9000 },
    }),
    baseCaloriesKcal: 2000,
    baseSteps: 8000,
  });
  assert.equal(atCap.eligible, true);

  const overCalories = decideFollowUpAutoApply({
    triage: greenTriage(),
    adapted: cleanAdapted({
      adapted_nutrition: {
        target_calories_kcal: 2201,
        protein_g: 150,
        carbohydrate_g: 300,
        fat_g: 60,
        alignment_conflict: false,
        refeed_config: null,
      },
    }),
    baseCaloriesKcal: 2000,
    baseSteps: 8000,
  });
  assert.equal(overCalories.eligible, false);
  assert.ok(overCalories.blocked_reasons.includes("PROPOSED_CHANGE_EXCEEDS_GREEN_CAP"));
});

test("GREEN with any engine flag does not apply", () => {
  const cases = [
    ["requires_coach_approval", cleanAdapted({ requires_coach_approval: true }), "REQUIRES_COACH_APPROVAL"],
    ["alignment conflict", cleanAdapted({ adapted_nutrition: { target_calories_kcal: 2000, protein_g: 150, carbohydrate_g: 250, fat_g: 60, alignment_conflict: true, refeed_config: null } }), "MACRO_ALIGNMENT_CONFLICT"],
    ["diet break", cleanAdapted({ is_diet_break_recommended: true, adaptation_action: "SCHEDULE_DIET_BREAK" }), "DIET_BREAK_ELIGIBLE"],
    ["floor/ceiling clamp", cleanAdapted({ adaptation_reasons: [{ code: "CALORIE_CEILING_REACHED" }] }), "FLOOR_OR_CEILING_CLAMP"],
    ["exercise substitution", cleanAdapted({ adaptation_action: "SUBSTITUTE_INJURED_EXERCISE" }), "EXERCISE_SUBSTITUTION"],
    ["biomechanical swap in the week", cleanAdapted({ adapted_training_week: { sessions: [{ exercises: [{ code: "X", is_biomechanical_swap: true }] }] } }), "EXERCISE_SUBSTITUTION"],
    ["deload", cleanAdapted({ is_deload_recommended: true, adaptation_action: "SCHEDULE_DELOAD" }), "DELOAD_RECOMMENDED"],
    ["refeed", cleanAdapted({ adapted_nutrition: { target_calories_kcal: 2000, protein_g: 150, carbohydrate_g: 250, fat_g: 60, alignment_conflict: false, refeed_config: { refeed_day: "SATURDAY" } } }), "REFEED_CONFIGURED"],
  ];
  for (const [label, adapted, code] of cases) {
    const decision = decideFollowUpAutoApply({
      triage: greenTriage(),
      adapted,
      baseCaloriesKcal: 2000,
      baseSteps: 8000,
    });
    assert.equal(decision.eligible, false, label);
    assert.ok(decision.blocked_reasons.includes(code), `${label} -> ${code}`);
  }
});

test("YELLOW and RED never apply, even with a clean engine result", () => {
  for (const tier of ["YELLOW", "RED"]) {
    const decision = decideFollowUpAutoApply({
      triage: greenTriage({ tier }),
      adapted: cleanAdapted(),
      baseCaloriesKcal: 2000,
      baseSteps: 8000,
    });
    assert.equal(decision.eligible, false, tier);
    assert.ok(decision.blocked_reasons.includes("NOT_GREEN"));
  }
});

test("missing adapted plan, already-applied check-in, WITHHELD stage and safety correction all block", () => {
  const missing = decideFollowUpAutoApply({
    triage: greenTriage(),
    adapted: null,
    baseCaloriesKcal: 2000,
    baseSteps: 8000,
  });
  assert.equal(missing.eligible, false);
  assert.ok(missing.blocked_reasons.includes("ADAPTED_PLAN_MISSING"));

  const already = decideFollowUpAutoApply({
    triage: greenTriage(),
    adapted: cleanAdapted(),
    baseCaloriesKcal: 2000,
    baseSteps: 8000,
    alreadyApplied: true,
  });
  assert.equal(already.eligible, false);
  assert.ok(already.blocked_reasons.includes("ALREADY_APPLIED"));

  const withheld = decideFollowUpAutoApply({
    triage: greenTriage(),
    adapted: cleanAdapted(),
    baseCaloriesKcal: 2000,
    baseSteps: 8000,
    withheldStage: true,
  });
  assert.equal(withheld.eligible, false);
  assert.ok(withheld.blocked_reasons.includes("WITHHELD_STAGE"));

  const correction = decideFollowUpAutoApply({
    triage: greenTriage({ safety_correction: { calorie_delta: 150 } }),
    adapted: cleanAdapted(),
    baseCaloriesKcal: 2000,
    baseSteps: 8000,
  });
  assert.equal(correction.eligible, false);
  assert.ok(correction.blocked_reasons.includes("SAFETY_CORRECTION_PRESENT"));
});

test("engine flags feed the classifier, so a flagged engine result re-classifies away from GREEN", () => {
  const { proposed } = deriveEngineProposed({
    adapted: cleanAdapted({ requires_coach_approval: true }),
    baseCaloriesKcal: 2000,
    baseSteps: 8000,
  });
  assert.equal(proposed.requires_coach_approval, true);
  const result = classifyFollowUp({
    analysis_status: "ON_TRACK",
    analysis: { weight_change_percent: -0.5, adherence_tier: "OPTIMAL", biofeedback_alerts: [], flagged_pains: [] },
    adherence_percent: 95,
    clinical_lockout: { locked: false },
    medical_review_required: false,
    proposed,
  });
  assert.equal(result.tier, "YELLOW");
  assert.ok(result.reasons.map((r) => r.code).includes("REQUIRES_COACH_APPROVAL"));
});

test("blocked triage: a gate-refused GREEN becomes YELLOW with blocked reasons, without mutating the original", () => {
  const original = greenTriage();
  const blocked = buildBlockedTriage({
    triage: original,
    blockedReasons: ["DELOAD_RECOMMENDED", "REFEED_CONFIGURED"],
  });
  assert.equal(blocked.tier, "YELLOW");
  assert.equal(blocked.auto_apply_blocked, true);
  assert.deepEqual(blocked.auto_apply_blocked_reasons, ["DELOAD_RECOMMENDED", "REFEED_CONFIGURED"]);
  assert.ok(blocked.reasons.map((r) => r.code).includes("ON_TRACK"));
  assert.ok(blocked.reasons.map((r) => r.code).includes("DELOAD_RECOMMENDED"));
  assert.ok(blocked.reasons.map((r) => r.code).includes("REFEED_CONFIGURED"));
  assert.equal(original.tier, "GREEN");
  assert.deepEqual(original.reasons.map((r) => r.code), ["ON_TRACK"]);
  // A blocked triage therefore lands in the yellow pending queue, not green.
  const digest = buildCoachDigest([
    { id: 9, user_id: 20, week_number: 4, status: "PENDING_REVIEW", analysis_output: { triage: blocked } },
  ]);
  assert.equal(digest.counts.yellow_pending, 1);
  assert.equal(digest.counts.green_pending, 0);
});

test("coach digest groups pending and auto-applied check-ins and never invents a tier", () => {
  const digest = buildCoachDigest([
    { id: 1, user_id: 10, week_number: 3, status: "AUTO_APPLIED", analysis_output: { triage: { tier: "GREEN", reasons: [{ code: "ON_TRACK" }], auto_apply: { program_id: 7 } } } },
    { id: 2, user_id: 11, week_number: 3, status: "PENDING_REVIEW", analysis_output: { triage: { tier: "YELLOW", reasons: [{ code: "PLATEAU_DETECTED" }] } } },
    { id: 3, user_id: 12, week_number: 3, status: "PENDING_REVIEW", analysis_output: { triage: { tier: "RED", reasons: [{ code: "INJURY_FLAGGED" }] } } },
    { id: 4, user_id: 13, week_number: 3, status: "PENDING_REVIEW", analysis_output: {} },
  ]);
  assert.equal(digest.counts.total, 4);
  assert.equal(digest.counts.auto_applied, 1);
  assert.equal(digest.counts.yellow_pending, 2);
  assert.equal(digest.counts.red_pending, 1);
  assert.equal(digest.yellow_pending[1].reason_codes[0], "UNKNOWN_TRIAGE");
  assert.equal(digest.auto_applied[0].program_id, 7);
});

test("bulk approve selects only pending YELLOW check-ins", () => {
  const result = selectYellowForBulkApprove(
    [
      { id: 1, status: "PENDING_REVIEW", analysis_output: { triage: { tier: "YELLOW" } } },
      { id: 2, status: "PENDING_REVIEW", analysis_output: { triage: { tier: "GREEN" } } },
      { id: 3, status: "APPROVED", analysis_output: { triage: { tier: "YELLOW" } } },
      { id: 4, status: "PENDING_REVIEW", analysis_output: { triage: { tier: "RED" } } },
      { id: 5, status: "PENDING_REVIEW", analysis_output: {} },
    ],
    [1, 2, 3, 4, 5, 99],
  );
  assert.deepEqual(result.selected_ids, [1]);
  assert.equal(result.skipped.length, 5);
  assert.ok(result.skipped.some((s) => s.checkin_id === 99 && s.reason === "NOT_FOUND"));
});

test("full pure pipeline: a deload engine result is blocked, stored as YELLOW, and lands in yellow pending", () => {
  // This replaces the old text-search guard: instead of checking that the
  // controller file contains certain words, it runs the actual pipeline
  // the controller runs — derive, gate, blocked triage, digest — and checks
  // the outcome at each step. The controller wiring itself (transaction,
  // routes, roles) is verified by integration tests in the review
  // environment, not here.
  const targets = baseTargetsFromProgram(baseProgram());
  const derived = deriveEngineProposed({
    adapted: cleanAdapted({ is_deload_recommended: true, adaptation_action: "SCHEDULE_DELOAD" }),
    baseCaloriesKcal: targets.baseCaloriesKcal,
    baseSteps: targets.baseSteps,
  });
  assert.equal(derived.engine_flags.deload_recommended, true);
  const decision = decideFollowUpAutoApply({
    triage: greenTriage(),
    adapted: cleanAdapted({ is_deload_recommended: true, adaptation_action: "SCHEDULE_DELOAD" }),
    baseCaloriesKcal: targets.baseCaloriesKcal,
    baseSteps: targets.baseSteps,
  });
  assert.equal(decision.eligible, false);
  assert.ok(decision.blocked_reasons.includes("DELOAD_RECOMMENDED"));
  const blocked = buildBlockedTriage({ triage: greenTriage(), blockedReasons: decision.blocked_reasons });
  assert.equal(blocked.tier, "YELLOW");
  assert.equal(greenTriage().tier, "GREEN");
  const digest = buildCoachDigest([
    { id: 9, user_id: 20, week_number: 4, status: "PENDING_REVIEW", analysis_output: { triage: blocked } },
  ]);
  assert.equal(digest.counts.yellow_pending, 1);
  assert.equal(digest.counts.green_pending, 0);
  // A blocked YELLOW pending check-in is exactly what bulk approve may
  // select as a review action; a GREEN pending one is not.
  const bulk = selectYellowForBulkApprove(
    [
      { id: 9, status: "PENDING_REVIEW", analysis_output: { triage: blocked } },
      { id: 10, status: "PENDING_REVIEW", analysis_output: { triage: greenTriage() } },
    ],
    [9, 10],
  );
  assert.deepEqual(bulk.selected_ids, [9]);
});

test("full pure pipeline: a clean GREEN engine result is eligible and its applied record is visible in the digest", () => {
  const targets = baseTargetsFromProgram(baseProgram());
  const decision = decideFollowUpAutoApply({
    triage: greenTriage(),
    adapted: cleanAdapted(),
    baseCaloriesKcal: targets.baseCaloriesKcal,
    baseSteps: targets.baseSteps,
  });
  assert.equal(decision.eligible, true);
  assert.deepEqual(decision.blocked_reasons, []);
  const appliedTriage = {
    ...greenTriage(),
    auto_apply: {
      applied_at: "2026-10-31T00:00:00.000Z",
      program_id: 7,
      adapted_week: 2,
      calorie_delta: decision.calorie_delta,
      steps_delta: decision.steps_delta,
    },
  };
  const digest = buildCoachDigest([
    { id: 1, user_id: 10, week_number: 3, status: "AUTO_APPLIED", analysis_output: { triage: appliedTriage } },
  ]);
  assert.equal(digest.counts.auto_applied, 1);
  assert.equal(digest.auto_applied[0].program_id, 7);
  // An already applied check-in is not bulk-approvable and not re-appliable.
  const reapply = decideFollowUpAutoApply({
    triage: greenTriage(),
    adapted: cleanAdapted(),
    baseCaloriesKcal: targets.baseCaloriesKcal,
    baseSteps: targets.baseSteps,
    alreadyApplied: true,
  });
  assert.equal(reapply.eligible, false);
  assert.ok(reapply.blocked_reasons.includes("ALREADY_APPLIED"));
});
