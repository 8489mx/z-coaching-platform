/* R2 RE-HUNT, LO-2: a diet-break return whose gap exceeds the 200 kcal
 * green cap must auto-apply — the return target is the stored pre-break
 * plan (already floor-checked at generation), not a fresh proposal from
 * noisy check-in data. The cap stays for every other delta.
 *
 * Fail-first: on the R1 base the return -222 goes YELLOW with
 * PROPOSED_CHANGE_EXCEEDS_GREEN_CAP in both the triage and the gate,
 * and the return week never auto-applies. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { completeIntake, ASSESSMENT_CONTEXT } from "./fixtures/complete-intake.js";
import { buildAdaptedPlan } from "../src/adaptation-engine/build-adapted-plan.js";
import { readAdaptationState } from "../src/adaptation-engine/diet-break-state.js";
import { mergeAdaptedPlanIntoProgram } from "../src/api/utils/planMergeEngine.js";
import { classifyFollowUp } from "../src/execution-engines/coach-triage-engine.js";
import {
  baseTargetsFromProgram,
  deriveEngineProposed,
  decideFollowUpAutoApply,
} from "../src/execution-engines/follow-up-auto-apply.js";

const evaluationContext = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
});

const nutritionFoodCatalog = JSON.parse(
  fs.readFileSync(new URL("../data/catalogs/core-global-food-batch-v1.json", import.meta.url), "utf8"),
);

function buildProgram(goal = "FAT_LOSS") {
  const intake = JSON.parse(JSON.stringify(completeIntake()));
  intake.goals = { ...intake.goals, primary: goal };
  const program = buildMasterEngineV2({
    intake,
    evaluationContext,
    nutritionFoodCatalog,
  });
  return JSON.parse(JSON.stringify(program));
}

function programCalories(program) {
  return program.nutrition_program.macro_targets.calories_kcal;
}

function programTdee(program) {
  return Number(program.nutrition_program.targets.tdee);
}

function onTrackCheckin({ streak, suggestedDelta = null } = {}) {
  const analysis = {
    status: "ON_TRACK",
    analysis_status: "ON_TRACK",
    consecutive_high_compliance_weeks: streak,
  };
  if (suggestedDelta !== null) analysis.suggested_calorie_delta = suggestedDelta;
  return analysis;
}

function runWeek(program, { week, streak, suggestedDelta = null } = {}) {
  const adapted = buildAdaptedPlan({
    currentMasterProgram: program,
    checkinAnalysis: onTrackCheckin({ streak, suggestedDelta }),
    options: { currentWeekNumber: week, consecutive_high_compliance_weeks: streak },
  });
  const merged = mergeAdaptedPlanIntoProgram(program, adapted);
  return { adapted, merged };
}

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

function returnAdapted(overrides = {}) {
  return {
    adaptation_action: "MAINTAIN_TRAJECTORY",
    requires_coach_approval: false,
    is_deload_recommended: false,
    is_diet_break_recommended: false,
    adapted_nutrition: {
      target_calories_kcal: 2356,
      protein_g: 209,
      carbohydrate_g: 249,
      fat_g: 58,
      alignment_conflict: false,
      refeed_config: null,
    },
    adapted_training_week: {
      week_number: 2,
      sessions: [{ exercises: [{ code: "SQUAT" }] }],
    },
    adapted_cardio: { daily_step_target: 8000 },
    adaptation_reasons: [
      {
        code: "DIET_BREAK_ENDED_RETURN_TO_DEFICIT",
        message_ar: "انتهت استراحة الدايت؛ رجعت السعرات لعجز ما قبل الاستراحة تلقائياً.",
      },
    ],
    ...overrides,
  };
}

function greenTriage(overrides = {}) {
  return {
    classifier_version: "follow-up-triage-v1",
    tier: "GREEN",
    reasons: [{ code: "ON_TRACK", message_ar: "on track" }],
    habit_nudge: false,
    safety_correction: null,
    signals: {},
    ...overrides,
  };
}

test("R2 LO-2: diet-break return over the 200 kcal green cap auto-applies", async (suite) => {
  await suite.test("1. deriveEngineProposed surfaces the return as a first-class flag", () => {
    const derived = deriveEngineProposed({
      adapted: returnAdapted(),
      baseCaloriesKcal: 2578,
      baseSteps: 8000,
    });
    assert.equal(derived.calorie_delta, -222, "return delta is the stored gap (2356 - 2578)");
    assert.equal(derived.proposed.diet_break_return, true, "proposed must carry the return marker");
    assert.equal(derived.engine_flags.diet_break_return, true, "engine flags must carry the return marker");

    const plain = deriveEngineProposed({
      adapted: returnAdapted({ adaptation_reasons: [] }),
      baseCaloriesKcal: 2578,
      baseSteps: 8000,
    });
    assert.equal(plain.proposed.diet_break_return, false, "no return reason means no marker");
    assert.equal(plain.engine_flags.diet_break_return, false);
  });

  await suite.test("2. triage: a return of -222 is GREEN; the same delta without the marker stays YELLOW", () => {
    const returned = classifyFollowUp(
      baseSignals({
        proposed: { calorie_delta: -222, steps_delta: 0, diet_break_return: true },
      }),
    );
    assert.equal(returned.tier, "GREEN", "a return is not a fresh proposal — the cap must not hold it");
    assert.ok(
      !codes(returned).includes("PROPOSED_CHANGE_EXCEEDS_GREEN_CAP"),
      "no cap reason on a return week",
    );

    const fresh = classifyFollowUp(
      baseSignals({ proposed: { calorie_delta: -222, steps_delta: 0 } }),
    );
    assert.equal(fresh.tier, "YELLOW", "a non-return -222 delta still exceeds the green cap");
    assert.ok(codes(fresh).includes("PROPOSED_CHANGE_EXCEEDS_GREEN_CAP"));
  });

  await suite.test("3. triage: the steps cap stays unconditional on a return week", () => {
    const returned = classifyFollowUp(
      baseSignals({
        proposed: { calorie_delta: -222, steps_delta: 1001, diet_break_return: true },
      }),
    );
    assert.equal(returned.tier, "YELLOW", "a 1001-step jump still exceeds the cap even on a return");
    assert.ok(codes(returned).includes("PROPOSED_CHANGE_EXCEEDS_GREEN_CAP"));
  });

  await suite.test("4. gate: a return of -222 is eligible; the same delta without the marker is blocked", () => {
    const eligible = decideFollowUpAutoApply({
      triage: greenTriage(),
      adapted: returnAdapted(),
      baseCaloriesKcal: 2578,
      baseSteps: 8000,
    });
    assert.equal(eligible.eligible, true, "the return must auto-apply");
    assert.ok(!eligible.blocked_reasons.includes("PROPOSED_CHANGE_EXCEEDS_GREEN_CAP"));

    const blocked = decideFollowUpAutoApply({
      triage: greenTriage(),
      adapted: returnAdapted({ adaptation_reasons: [] }),
      baseCaloriesKcal: 2578,
      baseSteps: 8000,
    });
    assert.equal(blocked.eligible, false, "a non-return -222 delta must stay blocked");
    assert.ok(blocked.blocked_reasons.includes("PROPOSED_CHANGE_EXCEEDS_GREEN_CAP"));
  });

  await suite.test("5. gate: a return week with a clinical flag still blocks on the clinical reason", () => {
    const triage = classifyFollowUp(
      baseSignals({
        clinical_lockout: { locked: true },
        proposed: { calorie_delta: -222, steps_delta: 0, diet_break_return: true },
      }),
    );
    assert.equal(triage.tier, "RED", "a clinical lockout stays RED even on a return week");
    assert.ok(codes(triage).includes("CLINICAL_LOCKOUT_ACTIVE"));

    const decision = decideFollowUpAutoApply({
      triage,
      adapted: returnAdapted(),
      baseCaloriesKcal: 2578,
      baseSteps: 8000,
    });
    assert.equal(decision.eligible, false, "the exemption must never leak into safety");
    assert.ok(decision.blocked_reasons.includes("NOT_GREEN"));
  });

  await suite.test("6. end to end: break week then return week — the cap no longer blocks the return, the merge lands on the stored pre-break deficit", () => {
    let program = buildProgram("FAT_LOSS");
    const baseCalories = programCalories(program);
    const tdee = programTdee(program);
    assert.ok(tdee > baseCalories, "fat-loss base must be below TDEE");
    // The fixture program's real gap is 527 kcal — a return far over the
    // 200 kcal cap, like C02's 222 in the longitudinal journey.

    // Weeks 1-5: compliant, no break proposed.
    for (let week = 1; week <= 5; week += 1) {
      const { merged } = runWeek(program, { week, streak: week });
      program = merged;
    }

    // Week 6: streak 6 -> break to maintenance.
    const week6 = runWeek(program, { week: 6, streak: 6 });
    assert.equal(week6.merged.nutrition_program.is_diet_break, true);
    assert.equal(readAdaptationState(week6.merged).diet_break.status, "ACTIVE");
    assert.equal(readAdaptationState(week6.merged).diet_break.pre_break_calories_kcal, baseCalories);
    program = week6.merged;

    // Week 7: the break is over — the return must flow through
    // derive -> triage -> merge with the cap exempted. (This fixture
    // client is intermediate with 7 accumulated weeks, so the engine
    // also prescribes a deload this week — a legitimate independent
    // hold that keeps the week YELLOW on coach approval. The cap
    // exemption is proven by the ABSENCE of the cap reason, not by
    // a GREEN tier here; GREEN + eligible at -222 is covered by
    // tests 2 and 4, and the C02 journey re-proof covers auto-apply.)
    const week7adapted = buildAdaptedPlan({
      currentMasterProgram: program,
      checkinAnalysis: onTrackCheckin({ streak: 7 }),
      options: { currentWeekNumber: 7, consecutive_high_compliance_weeks: 7 },
    });
    assert.equal(week7adapted.adapted_nutrition.target_calories_kcal, baseCalories);
    assert.ok(
      week7adapted.adaptation_reasons.some((r) => r.code === "DIET_BREAK_ENDED_RETURN_TO_DEFICIT"),
      "the return reason must be present",
    );
    const base = baseTargetsFromProgram(program);
    const derived = deriveEngineProposed({
      adapted: week7adapted,
      baseCaloriesKcal: base.baseCaloriesKcal,
      baseSteps: base.baseSteps,
    });
    assert.equal(derived.proposed.diet_break_return, true);
    assert.ok(derived.calorie_delta < -200, `return gap must exceed the cap (got ${derived.calorie_delta})`);
    const triage = classifyFollowUp(
      baseSignals({ proposed: derived.proposed, analysis: { ...baseSignals().analysis, suggested_calorie_delta: derived.calorie_delta } }),
    );
    assert.ok(
      !codes(triage).includes("PROPOSED_CHANGE_EXCEEDS_GREEN_CAP"),
      `the cap must not block a return week (reasons: ${codes(triage).join(", ")})`,
    );
    const decision = decideFollowUpAutoApply({
      triage,
      adapted: week7adapted,
      baseCaloriesKcal: base.baseCaloriesKcal,
      baseSteps: base.baseSteps,
    });
    assert.ok(
      !decision.blocked_reasons.includes("PROPOSED_CHANGE_EXCEEDS_GREEN_CAP"),
      "the gate must not block a return week on the cap",
    );
    const merged = mergeAdaptedPlanIntoProgram(program, week7adapted);
    assert.equal(programCalories(merged), baseCalories, "merged to the stored pre-break calories");
    assert.equal(merged.nutrition_program.is_diet_break, false);
    assert.equal(readAdaptationState(merged).diet_break.status, "COMPLETED");

    // Week 8: no new break the week after a return (cooldown intact).
    const week8 = runWeek(merged, { week: 8, streak: 8 });
    assert.notEqual(week8.adapted.adaptation_action, "SCHEDULE_DIET_BREAK");
    assert.equal(programCalories(week8.merged), baseCalories);
  });
});
