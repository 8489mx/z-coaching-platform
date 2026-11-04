import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateCheckin,
  estimateAdaptiveTdee,
  CheckinAnalysisStatus,
  PLATEAU_STEP_INCREASE,
  medianOfNumbers,
  compareWorkoutCompletion,
  buildReevaluationInput,
} from "../src/checkin-engine/index.js";
import { buildAdaptedPlan } from "../src/adaptation-engine/build-adapted-plan.js";
import { mergeAdaptedPlanIntoProgram, buildTrainingWeekDiff } from "../src/api/utils/planMergeEngine.js";
import { decideFollowUpAutoApply, buildBlockedTriage } from "../src/execution-engines/follow-up-auto-apply.js";
import { evaluateClientCheckinOverdue, CHECKIN_GRACE_HOURS } from "../frontend/src/utils/overdueCheckinEngine.js";
import { resolveTrainingCycleStatus } from "../src/api/services/trainingCycleService.js";
import { buildLateWindowOverride, isValidLateWindowOverride } from "../src/api/services/checkinLateWindow.js";

// P1-B10 "follow-up corrected": mirrors the fail-first probe's behavioral
// checks as committed tests. Controller/route wiring is static by nature
// (needs a live DB) and is covered by the probe's text checks, not here.

const baseProgram = (weeks) => ({
  nutrition_program: {
    macro_targets: { calories_kcal: 2000, protein_g: 160, carbohydrate_g: 200, fat_g: 60 },
    targets: {},
  },
  cardio_program: { prescription: { daily_step_target: 8000 }, weekly_schedule: { sessions: [] } },
  training_program: { weeks: weeks || [] },
  client: { gender: "male" },
});

const weekWithSessions = (sessionCodes) => {
  const sessions = sessionCodes.map((code) => ({ exercises: [{ code }] }));
  return [{ week_number: 1, sessions }, { week_number: 2, sessions: sessions.map((s) => ({ exercises: s.exercises.map((e) => ({ ...e })) })) }];
};

test("P1-B10 follow-up corrected", async (t) => {
  await t.test("forward-looking realistic days trim the adapted week", () => {
    const adapted = buildAdaptedPlan({
      currentMasterProgram: baseProgram(weekWithSessions(["A", "B", "C", "D"])),
      checkinAnalysis: {
        analysis_status: CheckinAnalysisStatus.ON_TRACK,
        forward_looking: { next_week_travel: false, next_week_gym_available: true, next_week_realistic_days: 2 },
      },
      options: { currentWeekNumber: 1 },
    });
    assert.equal(adapted.adapted_training_week.sessions.length, 2);
    assert.ok((adapted.adaptation_reasons || []).some((r) => /realistic|واقعي/i.test(r.message_ar || "") || /realistic/i.test(r.message_en || "")));
  });

  await t.test("forward-looking travel holds the plan for coach review", () => {
    const adapted = buildAdaptedPlan({
      currentMasterProgram: baseProgram(weekWithSessions(["A", "B"])),
      checkinAnalysis: {
        analysis_status: CheckinAnalysisStatus.ON_TRACK,
        forward_looking: { next_week_travel: true, next_week_gym_available: true, next_week_realistic_days: null },
      },
      options: { currentWeekNumber: 1 },
    });
    assert.equal(adapted.requires_coach_approval, true);
    assert.ok((adapted.adaptation_reasons || []).some((r) => /travel|مسافر/i.test(r.message_ar || "") || /travel/i.test(r.message_en || "")));
  });

  await t.test("plateau step increase is one shared constant (500)", () => {
    assert.equal(PLATEAU_STEP_INCREASE, 500);
    const ev = evaluateCheckin({
      current_weight_kg: 80, previous_weight_kg: 80,
      current_waist_cm: 90, previous_waist_cm: 90,
      nutrition_adherence_percent: 95, workouts_completed: 3, workouts_scheduled: 3,
    });
    assert.equal(ev.suggested_steps_delta, 500);
  });

  await t.test("adaptive TDEE resists a single bad weigh-in (Theil-Sen)", () => {
    const weeks = (weights, intakes) => weights.map((w, i) => ({
      week_number: i + 1, average_weight_kg: w, adherence_percent: 95, planned_target_kcal: 2000,
      reported_intake_kcal: intakes ? intakes[i] : null,
    }));
    const outlier = estimateAdaptiveTdee({
      weeks: weeks([80, 80, 80, 78.5], [2000, 2000, 2000, 2000]),
      formula_tdee_kcal: 2000, current_target_kcal: 2000, primary_goal: "FAT_LOSS", is_female: false,
    });
    // Least squares gave -0.45 kg/wk and target 1996. Theil-Sen gives
    // -0.25 kg/wk, and its target 1850 is exactly the truth value for a
    // flat trend (current 2000 minus the 150 max weekly step): the bad
    // weigh-in no longer drags the target toward the false deficit.
    assert.equal(outlier.weight_trend_kg_per_week, -0.25);
    assert.equal(outlier.recommended_target_kcal, 1850);
  });

  await t.test("low-adherence reported intake is not trusted", () => {
    const res = estimateAdaptiveTdee({
      weeks: [
        { week_number: 1, average_weight_kg: 80, adherence_percent: 95, planned_target_kcal: 2000, reported_intake_kcal: 2000 },
        { week_number: 2, average_weight_kg: 80, adherence_percent: 95, planned_target_kcal: 2000, reported_intake_kcal: 2000 },
        { week_number: 3, average_weight_kg: 80, adherence_percent: 40, planned_target_kcal: 2000, reported_intake_kcal: 1200 },
        { week_number: 4, average_weight_kg: 80, adherence_percent: 40, planned_target_kcal: 2000, reported_intake_kcal: 1200 },
      ],
      formula_tdee_kcal: 2000, current_target_kcal: 2000, primary_goal: "FAT_LOSS", is_female: false,
    });
    assert.equal(res.ready, false);
    assert.deepEqual(res.intake_disagreement_weeks, [3, 4]);
  });

  await t.test("daily weights are summarized by median, not mean", () => {
    assert.equal(medianOfNumbers([80, 80, 80, 80, 80, 80, 95]), 80);
    const ev = evaluateCheckin({
      daily_weights_kg: [80, 80, 80, 80, 80, 80, 95],
      weight_kg: 95,
      previous_weight_kg: 80,
      nutrition_adherence_percent: 95, workouts_completed: 3, workouts_scheduled: 3,
    });
    assert.equal(ev.current_average_weight_kg, 80);
  });

  await t.test("structural merge replaces on session-count change, diff recorded", () => {
    const prog = baseProgram([
      { week_number: 1, sessions: [{ exercises: [{ code: "X" }] }] },
      { week_number: 2, sessions: [{ exercises: [{ code: "A" }] }, { exercises: [{ code: "B" }] }, { exercises: [{ code: "C" }] }] },
    ]);
    prog.current_training_week = 1;
    const merged = mergeAdaptedPlanIntoProgram(prog, {
      adapted_training_week: { sessions: [{ exercises: [{ code: "N1" }] }, { exercises: [{ code: "N2" }] }] },
      adapted_week_number: 2, adaptation_reasons: [],
    }, null);
    const w2 = merged.training_program.weeks.find((w) => Number(w.week_number) === 2);
    assert.equal(w2.sessions.length, 2);
    assert.equal(merged._last_adaptation.training_week_merge_mode, "REPLACED");
    assert.equal(merged._last_adaptation.training_week_diff.sessions_before, 3);
    assert.equal(merged._last_adaptation.training_week_diff.sessions_after, 2);
  });

  await t.test("in-place merge preserves coach custom blueprints", () => {
    const prog = baseProgram([
      { week_number: 1, sessions: [{ exercises: [{ code: "X" }] }] },
      { week_number: 2, sessions: [{ exercises: [{ code: "KEEP", is_coach_custom: true }] }, { exercises: [{ code: "B" }] }, { exercises: [{ code: "C" }] }] },
    ]);
    prog.current_training_week = 1;
    const merged = mergeAdaptedPlanIntoProgram(prog, {
      adapted_training_week: { sessions: [{ exercises: [{ code: "N1" }] }, { exercises: [{ code: "N2" }] }, { exercises: [{ code: "N3" }] }] },
      adapted_week_number: 2, adaptation_reasons: [],
    }, null);
    const w2 = merged.training_program.weeks.find((w) => Number(w.week_number) === 2);
    assert.ok(w2.sessions[0].exercises.some((e) => e.code === "KEEP"));
    assert.equal(merged._last_adaptation.training_week_merge_mode, "IN_PLACE");
  });

  await t.test("buildTrainingWeekDiff reports counts and per-session codes", () => {
    const diff = buildTrainingWeekDiff(
      { sessions: [{ exercises: [{ code: "A" }] }, { exercises: [{ code: "B" }] }] },
      { sessions: [{ exercises: [{ code: "N1" }] }] },
    );
    assert.equal(diff.sessions_before, 2);
    assert.equal(diff.sessions_after, 1);
    assert.deepEqual(diff.sessions[0], { before: ["A"], after: ["N1"] });
  });

  await t.test("ended cycle is detected", () => {
    const now = new Date("2026-11-04T12:00:00Z");
    const started = new Date(now.getTime() - 6 * 7 * 24 * 3600 * 1000).toISOString();
    const st = resolveTrainingCycleStatus({ program_data: { training_program: { weeks: [{}, {}, {}, {}, {}] }, cycle_started_at: started }, createdAt: started }, now);
    assert.equal(st.status, "ENDED");
  });

  await t.test("correction re-evaluation changes the verdict", () => {
    const reeval = evaluateCheckin(buildReevaluationInput({
      checkin: { average_weight_kg: 78, daily_weights_kg: [78], waist_circumference_cm: 90, nutrition_adherence_percent: 95, workouts_completed: 3, workouts_scheduled: 3, pain_reports: [], biofeedback: {} },
      prevCheckin: { average_weight_kg: 80, waist_circumference_cm: 90, analysis_output: {} },
      primaryGoal: "FAT_LOSS", isFemale: false,
    }));
    assert.equal(reeval.analysis_status, CheckinAnalysisStatus.RAPID_LOSS_WARNING);
    assert.equal(reeval.weight_change_percent, -2.5);
  });

  await t.test("overdue reference is the latest approved check-in, grace is 72h", () => {
    assert.equal(CHECKIN_GRACE_HOURS, 72);
    const now = new Date("2026-11-04T12:00:00Z");
    const d = (n) => new Date(now.getTime() - n * 24 * 3600 * 1000).toISOString();
    const r = evaluateClientCheckinOverdue({
      status: "ACTIVE", subscription_package: "MAX",
      checkinSubmissions: [
        { status: "APPROVED", created_at: d(20) },
        { status: "PENDING_REVIEW", created_at: d(5) },
      ],
    }, now);
    assert.equal(r.isOverdue, true);
  });

  await t.test("workout-log mismatch forces coach review; match and no-logs stay neutral", () => {
    assert.deepEqual(
      compareWorkoutCompletion({ reported: 4, logged: 2 }),
      { agreement: "MISMATCH", reported_workouts: 4, logged_workouts: 2, requires_coach_review: true },
    );
    assert.equal(compareWorkoutCompletion({ reported: 3, logged: 3 }).agreement, "MATCH");
    assert.equal(compareWorkoutCompletion({ reported: 3, logged: null }).agreement, "NO_LOGS");
    const mismatch = evaluateCheckin({
      current_weight_kg: 80, previous_weight_kg: 80,
      nutrition_adherence_percent: 95, workouts_completed: 4, workouts_scheduled: 4,
      logged_workouts_completed: 2,
    });
    assert.equal(mismatch.requires_coach_review, true);
    assert.ok(mismatch.biofeedback_alerts.includes("WORKOUT_LOG_MISMATCH"));
  });

  await t.test("base targets fail closed instead of inventing 2000/160/200/60", () => {
    assert.throws(
      () => buildAdaptedPlan({
        currentMasterProgram: { nutrition_program: {}, cardio_program: {}, training_program: { weeks: [] } },
        checkinAnalysis: { analysis_status: CheckinAnalysisStatus.ON_TRACK },
        options: {},
      }),
      (e) => e.code === "BASE_TARGETS_UNREADABLE",
    );
  });

  await t.test("biomarker cap uses the real weight, and skips without one", () => {
    const withWeight = buildAdaptedPlan({
      currentMasterProgram: baseProgram([]),
      checkinAnalysis: { analysis_status: CheckinAnalysisStatus.ON_TRACK },
      options: { weight_kg: 110, biomarkers: { creatinine_mg_dl: 2.0 }, gender: "MALE" },
    });
    assert.equal(withWeight.adapted_nutrition.protein_g, 99);
    const withoutWeight = buildAdaptedPlan({
      currentMasterProgram: baseProgram([]),
      checkinAnalysis: { analysis_status: CheckinAnalysisStatus.ON_TRACK },
      options: { biomarkers: { creatinine_mg_dl: 2.0 }, gender: "MALE" },
    });
    assert.equal(withoutWeight.adapted_nutrition.protein_g, 160);
    assert.equal(withoutWeight.requires_coach_approval, true);
  });

  await t.test("all pains are swapped, not just the first", () => {
    const adapted = buildAdaptedPlan({
      currentMasterProgram: baseProgram(weekWithSessions(["BARBELL_BACK_SQUAT", "FLAT_BARBELL_BENCH_PRESS", "LEG_PRESS"])),
      checkinAnalysis: { analysis_status: CheckinAnalysisStatus.ON_TRACK },
      options: {
        currentWeekNumber: 1,
        pain_reports: [
          { area: "LOWER_BACK", pain_level: 7 },
          { area: "SHOULDER", pain_level: 6 },
        ],
      },
    });
    const codes = adapted.adapted_training_week.sessions.flatMap((s) => s.exercises.map((e) => String(e.code || "").toUpperCase()));
    assert.ok(!codes.includes("BARBELL_BACK_SQUAT"), `squat still present: ${codes}`);
    assert.ok(!codes.includes("FLAT_BARBELL_BENCH_PRESS"), `bench still present: ${codes}`);
    assert.ok(codes.includes("LEG_PRESS"), `leg press swapped away: ${codes}`);
  });

  await t.test("refeed-only and deload-only check-ins stay blocked (fail-closed gate)", () => {
    const base = { triage: { tier: "GREEN" }, adapted: { adapted_nutrition: { refeed_config: { day: "x" } } }, baseCaloriesKcal: 2000, baseSteps: 8000, alreadyApplied: false, withheldStage: false };
    assert.equal(decideFollowUpAutoApply(base).eligible, false);
    const blocked = buildBlockedTriage({ triage: { tier: "GREEN" }, blockedReasons: ["REFEED_CONFIGURED"] });
    assert.equal(blocked.tier, "YELLOW");
  });

  await t.test("late-window override shape, validity, and rejection", () => {
    const now = Date.now();
    const o = buildLateWindowOverride({ cycleSequence: 3, windowHours: 72, coachId: 7, reason: "late" });
    assert.equal(o.cycle_sequence, 3);
    assert.ok(new Date(o.expires_at).getTime() > now);
    assert.equal(o.opened_by, 7);
    assert.ok(Object.isFrozen(o));
    assert.equal(isValidLateWindowOverride(o, now), true);
    assert.equal(isValidLateWindowOverride({ ...o, expires_at: new Date(now - 1000).toISOString() }, now), false);
    assert.throws(() => buildLateWindowOverride({ cycleSequence: 0 }), TypeError);
  });
});
