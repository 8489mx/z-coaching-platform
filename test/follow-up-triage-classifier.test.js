/* Phase 1 (shadow mode): classifyFollowUp is a pure classifier over composite
 * follow-up signals. It decides nothing by itself in production yet: the
 * shadow wiring in submitCheckin only stores its result. Safety signals are
 * computed independently of the single evaluateCheckin analysis_status, so
 * poor adherence can never hide a rapid-loss, cardiac, or injury signal.
 * The classifier is pure: no database, no network, no state, frozen output.
 * Thresholds live in FOLLOW_UP_TRIAGE in the same engine file. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  TRIAGE_TIERS,
  evaluateClientTriageItem,
  classifyFollowUp,
  FOLLOW_UP_TRIAGE,
} from "../src/execution-engines/coach-triage-engine.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function baseSignals(overrides = {}) {
  return {
    analysis_status: "ON_TRACK",
    analysis: {
      weight_change_percent: -0.5,
      adherence_tier: "OPTIMAL",
      suggested_calorie_delta: 0,
      suggested_steps_delta: 0,
      biofeedback_alerts: [],
      flagged_pains: [],
      requires_coach_review: false,
      training_locked: false,
    },
    adherence_percent: 95,
    clinical_lockout: { locked: false },
    medical_review_required: false,
    previous_analysis_status: "ON_TRACK",
    proposed: {
      requires_coach_approval: false,
      calorie_delta: 0,
      steps_delta: 0,
    },
    withheld_stage: false,
    ...overrides,
  };
}

function codes(result) {
  return result.reasons.map((r) => r.code);
}

test("triage thresholds are the named design constants", () => {
  assert.equal(FOLLOW_UP_TRIAGE.ADHERENCE_THRESHOLD_PERCENT, 80);
  assert.equal(FOLLOW_UP_TRIAGE.RAPID_LOSS_THRESHOLD_PERCENT, -1.5);
  assert.equal(FOLLOW_UP_TRIAGE.GREEN_MAX_CALORIE_DELTA_KCAL, 200);
  assert.equal(FOLLOW_UP_TRIAGE.GREEN_MAX_STEPS_DELTA, 1000);
  assert.equal(FOLLOW_UP_TRIAGE.FLAGGED_PAIN_LEVEL, 4);
  assert.equal(FOLLOW_UP_TRIAGE.SAFETY_CALORIE_CORRECTION_KCAL, 150);
});

test("GREEN: clean on-track check-in with both safety signals known-clear", () => {
  const result = classifyFollowUp(baseSignals());
  assert.equal(result.tier, "GREEN");
  assert.equal(result.safety_correction, null);
  assert.equal(result.habit_nudge, false);
  assert.deepEqual(codes(result), ["ON_TRACK"]);
  assert.equal(result.signals.clinical_lockout_locked, false);
  assert.equal(result.signals.medical_review_required, false);
});

test("RED: active clinical lockout", () => {
  const result = classifyFollowUp(
    baseSignals({ clinical_lockout: { locked: true } }),
  );
  assert.equal(result.tier, "RED");
  assert.ok(codes(result).includes("CLINICAL_LOCKOUT_ACTIVE"));
  assert.equal(result.safety_correction, null);
});

test("RED: lockout lookup that failed closed (locked with error) is still RED", () => {
  const result = classifyFollowUp(
    baseSignals({ clinical_lockout: { locked: true, error: true } }),
  );
  assert.equal(result.tier, "RED");
  assert.ok(codes(result).includes("CLINICAL_LOCKOUT_ACTIVE"));
});

test("RED: cardiac flag wins over optimal adherence", () => {
  const result = classifyFollowUp(
    baseSignals({
      analysis_status: "CRITICAL_CARDIAC_FLAG",
      analysis: {
        weight_change_percent: -0.4,
        adherence_tier: "OPTIMAL",
        biofeedback_alerts: ["CARDIAC_RED_FLAG"],
        flagged_pains: [],
        training_locked: true,
      },
      adherence_percent: 100,
    }),
  );
  assert.equal(result.tier, "RED");
  assert.ok(codes(result).includes("CARDIAC_RED_FLAG"));
});

test("RED: flagged joint pain at the threshold level", () => {
  const result = classifyFollowUp(
    baseSignals({
      analysis: {
        weight_change_percent: -0.4,
        adherence_tier: "OPTIMAL",
        biofeedback_alerts: [],
        flagged_pains: [{ pain_level: 4, body_part: "KNEE" }],
      },
      max_pain_level: 4,
    }),
  );
  assert.equal(result.tier, "RED");
  assert.ok(codes(result).includes("INJURY_FLAGGED"));
});

test("GREEN: mild pain below the flag threshold, with no other signal", () => {
  const result = classifyFollowUp(
    baseSignals({
      analysis: {
        weight_change_percent: -0.4,
        adherence_tier: "OPTIMAL",
        biofeedback_alerts: [],
        flagged_pains: [{ pain_level: 3, body_part: "KNEE" }],
      },
      max_pain_level: 3,
    }),
  );
  assert.equal(result.tier, "GREEN");
});

test("YELLOW with safety correction: poor adherence + rapid loss does not hide the rapid loss", () => {
  const result = classifyFollowUp(
    baseSignals({
      analysis_status: "POOR_ADHERENCE",
      analysis: {
        weight_change_percent: -2.0,
        adherence_tier: "LOW",
        suggested_calorie_delta: 0,
        suggested_steps_delta: 0,
        biofeedback_alerts: [],
        flagged_pains: [],
      },
      adherence_percent: 60,
      weight_change_percent: -2.0,
    }),
  );
  assert.equal(result.tier, "YELLOW");
  assert.deepEqual(result.safety_correction, { calorie_delta: 150 });
  assert.ok(codes(result).includes("RAPID_LOSS_SAFETY_CORRECTION"));
  assert.ok(codes(result).includes("POOR_ADHERENCE"));
});

test("RED: rapid loss plus injury gets no safety correction", () => {
  const result = classifyFollowUp(
    baseSignals({
      weight_change_percent: -2.0,
      max_pain_level: 5,
      analysis: {
        weight_change_percent: -2.0,
        adherence_tier: "OPTIMAL",
        biofeedback_alerts: [],
        flagged_pains: [{ pain_level: 5 }],
      },
    }),
  );
  assert.equal(result.tier, "RED");
  assert.equal(result.safety_correction, null);
  assert.ok(codes(result).includes("RAPID_LOSS_WARNING"));
  assert.ok(codes(result).includes("INJURY_FLAGGED"));
});

test("RED: rapid loss under a deficit lock gets no safety correction", () => {
  const result = classifyFollowUp(
    baseSignals({
      analysis_status: "FEMALE_PMS_WATER_RETENTION",
      analysis: {
        weight_change_percent: -2.0,
        adherence_tier: "OPTIMAL",
        biofeedback_alerts: [],
        flagged_pains: [],
        female_cycle_buffer: { deficit_adjustment_locked: true },
      },
      weight_change_percent: -2.0,
      deficit_locked: true,
    }),
  );
  assert.equal(result.tier, "RED");
  assert.equal(result.safety_correction, null);
  assert.ok(codes(result).includes("RAPID_LOSS_WARNING"));
});

test("RED: rapid loss on a file that requires medical review", () => {
  const result = classifyFollowUp(
    baseSignals({ weight_change_percent: -2.0, medical_review_required: true }),
  );
  assert.equal(result.tier, "RED");
  assert.equal(result.safety_correction, null);
  assert.ok(codes(result).includes("RAPID_LOSS_MEDICAL_REVIEW"));
});

test("RED: repeated rapid loss on a file that requires medical review", () => {
  const result = classifyFollowUp(
    baseSignals({
      weight_change_percent: -2.0,
      medical_review_required: true,
      previous_analysis_status: "RAPID_LOSS_WARNING",
    }),
  );
  assert.equal(result.tier, "RED");
  assert.ok(
    codes(result).includes("REPEATED_RAPID_LOSS_MEDICAL_CLIENT"),
  );
});

test("RED: a present clinical alert", () => {
  const result = classifyFollowUp(
    baseSignals({
      analysis: {
        weight_change_percent: -0.5,
        adherence_tier: "OPTIMAL",
        biofeedback_alerts: [],
        flagged_pains: [],
        clinical_alert: { code: "REPEATED_RAPID_LOSS_MEDICAL_CLIENT" },
      },
      clinical_alert: { code: "REPEATED_RAPID_LOSS_MEDICAL_CLIENT" },
    }),
  );
  assert.equal(result.tier, "RED");
  assert.ok(codes(result).includes("CLINICAL_ALERT_PRESENT"));
});

test("YELLOW: medical review required on its own is not RED", () => {
  const result = classifyFollowUp(
    baseSignals({ medical_review_required: true }),
  );
  assert.equal(result.tier, "YELLOW");
  assert.ok(codes(result).includes("MEDICAL_REVIEW_REQUIRED"));
});

test("YELLOW: plateau, false plateau, NEAT lock, PMS lock, fatigue, gain stall", () => {
  const cases = [
    ["PLATEAU_DETECTED", "PLATEAU_DETECTED", {}],
    ["TRUE_PLATEAU", "PLATEAU_DETECTED", {}],
    ["FALSE_PLATEAU_DETECTED", "FALSE_PLATEAU_DETECTED", {}],
    ["OCCUPATIONAL_NEAT_LOCK", "OCCUPATIONAL_NEAT_LOCK", {}],
    [
      "FEMALE_PMS_WATER_RETENTION",
      "PMS_DEFICIT_LOCK",
      { deficit_locked: true },
    ],
    ["HIGH_FATIGUE_WARNING", "FATIGUE_REFEED_RECOMMENDED", {}],
    ["GAIN_STALL", "GAIN_STALL", {}],
  ];
  for (const [status, code, extra] of cases) {
    const result = classifyFollowUp(
      baseSignals({ analysis_status: status, ...extra }),
    );
    assert.equal(result.tier, "YELLOW", status);
    assert.ok(codes(result).includes(code), `${status} -> ${code}`);
  }
});

test("YELLOW: deload recommended, diet-break eligible, coach approval required", () => {
  const deload = classifyFollowUp(
    baseSignals({
      analysis: {
        weight_change_percent: -0.5,
        adherence_tier: "OPTIMAL",
        biofeedback_alerts: [],
        flagged_pains: [],
        deload_recommendation: { recommended: true },
      },
    }),
  );
  assert.equal(deload.tier, "YELLOW");
  assert.ok(codes(deload).includes("DELOAD_RECOMMENDED"));

  const dietBreak = classifyFollowUp(
    baseSignals({ proposed: { diet_break_eligible: true } }),
  );
  assert.equal(dietBreak.tier, "YELLOW");
  assert.ok(codes(dietBreak).includes("DIET_BREAK_ELIGIBLE"));

  const approval = classifyFollowUp(
    baseSignals({ proposed: { requires_coach_approval: true } }),
  );
  assert.equal(approval.tier, "YELLOW");
  assert.ok(codes(approval).includes("REQUIRES_COACH_APPROVAL"));
});

test("YELLOW: floor/ceiling clamp, alignment conflict, exercise substitution, WITHHELD stage", () => {
  const cases = [
    [{ floor_or_ceiling_clamp: true }, "FLOOR_OR_CEILING_CLAMP"],
    [{ alignment_conflict: true }, "MACRO_ALIGNMENT_CONFLICT"],
    [{ exercise_substitution: true }, "EXERCISE_SUBSTITUTION"],
  ];
  for (const [proposedExtra, code] of cases) {
    const result = classifyFollowUp(
      baseSignals({ proposed: { ...proposedExtra } }),
    );
    assert.equal(result.tier, "YELLOW", code);
    assert.ok(codes(result).includes(code), code);
  }
  const withheld = classifyFollowUp(baseSignals({ withheld_stage: true }));
  assert.equal(withheld.tier, "YELLOW");
  assert.ok(codes(withheld).includes("WITHHELD_STAGE"));
});

test("YELLOW: plateau plus a floor clamp is YELLOW, never GREEN", () => {
  const result = classifyFollowUp(
    baseSignals({
      analysis_status: "PLATEAU_DETECTED",
      proposed: { floor_or_ceiling_clamp: true },
    }),
  );
  assert.equal(result.tier, "YELLOW");
  assert.ok(codes(result).includes("PLATEAU_DETECTED"));
  assert.ok(codes(result).includes("FLOOR_OR_CEILING_CLAMP"));
});

test("GREEN cap boundary: calorie delta 200 and steps 1000 are GREEN-eligible; 201 / 1001 are not", () => {
  const atCap = classifyFollowUp(
    baseSignals({ proposed: { calorie_delta: 200, steps_delta: 1000 } }),
  );
  assert.equal(atCap.tier, "GREEN");

  const overCalories = classifyFollowUp(
    baseSignals({ proposed: { calorie_delta: 201, steps_delta: 0 } }),
  );
  assert.equal(overCalories.tier, "YELLOW");
  assert.ok(
    codes(overCalories).includes("PROPOSED_CHANGE_EXCEEDS_GREEN_CAP"),
  );

  const overSteps = classifyFollowUp(
    baseSignals({ proposed: { calorie_delta: 0, steps_delta: 1001 } }),
  );
  assert.equal(overSteps.tier, "YELLOW");
  assert.ok(codes(overSteps).includes("PROPOSED_CHANGE_EXCEEDS_GREEN_CAP"));

  const underCap = classifyFollowUp(
    baseSignals({ proposed: { calorie_delta: -200, steps_delta: -1000 } }),
  );
  assert.equal(underCap.tier, "GREEN");
});

test("rapid-loss boundary: exactly -1.5% is not rapid loss; -1.51% is", () => {
  const exact = classifyFollowUp(
    baseSignals({ weight_change_percent: -1.5 }),
  );
  assert.equal(exact.tier, "GREEN");
  assert.equal(exact.safety_correction, null);

  const over = classifyFollowUp(
    baseSignals({ weight_change_percent: -1.51 }),
  );
  assert.equal(over.tier, "YELLOW");
  assert.deepEqual(over.safety_correction, { calorie_delta: 150 });
});

test("GREEN with habit nudge: poor adherence alone with a maintain proposal", () => {
  const result = classifyFollowUp(
    baseSignals({
      analysis_status: "POOR_ADHERENCE",
      analysis: {
        weight_change_percent: -0.3,
        adherence_tier: "LOW",
        suggested_calorie_delta: 0,
        suggested_steps_delta: 0,
        biofeedback_alerts: [],
        flagged_pains: [],
      },
      adherence_percent: 65,
      proposed: { calorie_delta: 0, steps_delta: 0 },
    }),
  );
  assert.equal(result.tier, "GREEN");
  assert.equal(result.habit_nudge, true);
  assert.ok(codes(result).includes("POOR_ADHERENCE_MAINTAIN"));
});

test("YELLOW: poor adherence plus any other signal, or plus a proposed change", () => {
  const withPlateau = classifyFollowUp(
    baseSignals({
      analysis_status: "PLATEAU_DETECTED",
      adherence_percent: 65,
      analysis: {
        weight_change_percent: -0.1,
        adherence_tier: "LOW",
        biofeedback_alerts: [],
        flagged_pains: [],
      },
    }),
  );
  assert.equal(withPlateau.tier, "YELLOW");
  assert.ok(codes(withPlateau).includes("POOR_ADHERENCE"));

  const withChange = classifyFollowUp(
    baseSignals({
      analysis_status: "POOR_ADHERENCE",
      adherence_percent: 65,
      analysis: {
        weight_change_percent: -0.3,
        adherence_tier: "LOW",
        biofeedback_alerts: [],
        flagged_pains: [],
      },
      proposed: { calorie_delta: -125, steps_delta: 0 },
    }),
  );
  assert.equal(withChange.tier, "YELLOW");
  assert.ok(codes(withChange).includes("POOR_ADHERENCE"));
});

test("fail closed: missing or unknown safety signals can never be GREEN", () => {
  const neither = classifyFollowUp({
    analysis_status: "ON_TRACK",
    analysis: { adherence_tier: "OPTIMAL", biofeedback_alerts: [], flagged_pains: [] },
    adherence_percent: 95,
    proposed: { calorie_delta: 0, steps_delta: 0 },
  });
  assert.equal(neither.tier, "YELLOW");
  assert.ok(codes(neither).includes("SAFETY_SIGNALS_UNKNOWN"));

  const noMedical = classifyFollowUp(
    baseSignals({ medical_review_required: undefined }),
  );
  assert.equal(noMedical.tier, "YELLOW");
  assert.ok(codes(noMedical).includes("SAFETY_SIGNALS_UNKNOWN"));

  const flagged = classifyFollowUp(
    baseSignals({ safety_signals_unknown: true }),
  );
  assert.equal(flagged.tier, "YELLOW");
  assert.ok(codes(flagged).includes("SAFETY_SIGNALS_UNKNOWN"));
});

test("classifier is pure and frozen: repeated calls agree, output cannot be mutated", () => {
  const input = baseSignals();
  const first = classifyFollowUp(input);
  const second = classifyFollowUp(input);
  assert.deepEqual(first, second);
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.reasons));
  assert.ok(Object.isFrozen(first.signals));
  assert.throws(() => {
    first.tier = "RED";
  }, TypeError);
});

test("classifier rejects non-object input; empty input fails closed to YELLOW", () => {
  assert.throws(() => classifyFollowUp("ON_TRACK"), TypeError);
  assert.throws(() => classifyFollowUp(42), TypeError);
  const empty = classifyFollowUp();
  assert.equal(empty.tier, "YELLOW");
  assert.ok(codes(empty).includes("SAFETY_SIGNALS_UNKNOWN"));
  const nullInput = classifyFollowUp(null);
  assert.equal(nullInput.tier, "YELLOW");
});

test("existing triage behaviour is unchanged", () => {
  const item = evaluateClientTriageItem({
    id: "1",
    name: "سارة",
    has_pending_checkin: true,
    phone: "01011111110",
  });
  assert.equal(item.tier, TRIAGE_TIERS.RED_FLAG);
  assert.equal(item.primary_action, "APPROVE_CHECKIN");
});

test("source guard: shadow wiring stores triage and never auto-applies", () => {
  const src = fs.readFileSync(
    path.join(ROOT, "src/api/controllers/checkin.controller.js"),
    "utf8",
  );
  const start = src.indexOf("TRIAGE SHADOW MODE (Phase 1)");
  assert.notEqual(start, -1, "shadow block marker not found");
  const end = src.indexOf("END TRIAGE SHADOW MODE", start);
  assert.notEqual(end, -1, "shadow block end marker not found");
  const block = src.slice(start, end);
  assert.match(block, /classifyFollowUp/);
  assert.match(block, /triage/);
  assert.match(block, /checkin\.update/);
  assert.doesNotMatch(block, /buildAdaptedPlan\s*\(/);
  assert.doesNotMatch(block, /mergeAdaptedPlanIntoProgram\s*\(/);
  assert.doesNotMatch(block, /AUTO_APPLIED/);
  assert.doesNotMatch(block, /status\s*:\s*"AUTO_APPLIED"/);
  assert.doesNotMatch(block, /notifyCheckinReviewed|notifyProgramPublished|sendPushNotification|sendSelfHostedNotification/);
});
