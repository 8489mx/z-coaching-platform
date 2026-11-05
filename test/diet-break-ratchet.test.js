import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { buildAdaptedPlan, AdaptationAction } from "../src/adaptation-engine/index.js";
import {
  DIET_BREAK_MIN_STREAK,
  readAdaptationState,
  resolveDietBreakMaintenance,
} from "../src/adaptation-engine/diet-break-state.js";
import { mergeAdaptedPlanIntoProgram } from "../src/api/utils/planMergeEngine.js";
import { buildNextCycle } from "../src/api/services/nextCycleService.js";
import { baseTargetsFromProgram, decideFollowUpAutoApply, deriveEngineProposed } from "../src/execution-engines/follow-up-auto-apply.js";
import { completeIntake, ASSESSMENT_CONTEXT } from "./fixtures/complete-intake.js";

const evaluationContext = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
});

const nutritionFoodCatalog = JSON.parse(
  fs.readFileSync(new URL("../data/catalogs/core-global-food-batch-v1.json", import.meta.url), "utf8"),
);

function buildProgram(goal) {
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

function programMacros(program) {
  const m = program.nutrition_program.macro_targets;
  return { protein_g: m.protein_g, carbohydrate_g: m.carbohydrate_g, fat_g: m.fat_g };
}

function onTrackCheckin({ streak, suggestedDelta = null, adaptive = null } = {}) {
  const analysis = {
    status: "ON_TRACK",
    analysis_status: "ON_TRACK",
    consecutive_high_compliance_weeks: streak,
  };
  if (suggestedDelta !== null) analysis.suggested_calorie_delta = suggestedDelta;
  if (adaptive) analysis.adaptive_tdee = adaptive;
  return analysis;
}

/** One coach-approved week: adapt, then merge. Returns the stored program. */
function runWeek(program, { week, streak, suggestedDelta = null, adaptive = null, customMacros = null } = {}) {
  const adapted = buildAdaptedPlan({
    currentMasterProgram: program,
    checkinAnalysis: onTrackCheckin({ streak, suggestedDelta, adaptive }),
    options: { currentWeekNumber: week, consecutive_high_compliance_weeks: streak },
  });
  const merged = mergeAdaptedPlanIntoProgram(program, adapted, customMacros);
  return { adapted, merged };
}

test("H1 diet-break ratchet", async (t) => {
  await t.test("CB1/CB5: a diet break lasts one week, then the deficit returns automatically", () => {
    let program = buildProgram("FAT_LOSS");
    assert.equal(program.nutrition_program.targets.resolved_goal, "FAT_LOSS");
    const baseCalories = programCalories(program);
    const tdee = programTdee(program);
    assert.ok(tdee > baseCalories, "fat-loss base must be below TDEE");

    // Weeks 1-5: compliant, no break proposed.
    for (let week = 1; week <= 5; week += 1) {
      const { adapted, merged } = runWeek(program, { week, streak: week });
      assert.notEqual(adapted.adaptation_action, AdaptationAction.SCHEDULE_DIET_BREAK, `week ${week} must not propose a break`);
      assert.equal(programCalories(merged), baseCalories);
      program = merged;
    }

    // Week 6: streak 6 -> break to true maintenance (the plan TDEE).
    const week6 = runWeek(program, { week: 6, streak: 6 });
    assert.equal(week6.adapted.adaptation_action, AdaptationAction.SCHEDULE_DIET_BREAK);
    assert.equal(week6.adapted.adapted_nutrition.target_calories_kcal, tdee);
    assert.equal(week6.merged.nutrition_program.is_diet_break, true);
    assert.equal(readAdaptationState(week6.merged).diet_break.status, "ACTIVE");
    assert.equal(readAdaptationState(week6.merged).diet_break.pre_break_calories_kcal, baseCalories);
    program = week6.merged;

    // Week 7: the break is over — back to the exact pre-break deficit, no new proposal.
    const week7 = runWeek(program, { week: 7, streak: 7 });
    assert.notEqual(week7.adapted.adaptation_action, AdaptationAction.SCHEDULE_DIET_BREAK);
    assert.equal(week7.adapted.adapted_nutrition.target_calories_kcal, baseCalories);
    assert.equal(programCalories(week7.merged), baseCalories);
    assert.equal(week7.merged.nutrition_program.is_diet_break, false);
    assert.equal(readAdaptationState(week7.merged).diet_break.status, "COMPLETED");
    assert.equal(week7.adapted.diet_break.ended_this_week, true);
    program = week7.merged;

    // Weeks 8-13: still compliant, still no new break (fresh streak required).
    for (let week = 8; week <= 13; week += 1) {
      const { adapted, merged } = runWeek(program, { week, streak: week });
      assert.notEqual(adapted.adaptation_action, AdaptationAction.SCHEDULE_DIET_BREAK, `week ${week} must not propose a second break yet`);
      assert.equal(programCalories(merged), baseCalories);
      program = merged;
    }

    // Week 14: six deficit weeks since the break ended -> a new break is eligible again.
    const week14 = runWeek(program, { week: 14, streak: 14 });
    assert.equal(week14.adapted.adaptation_action, AdaptationAction.SCHEDULE_DIET_BREAK);
    assert.equal(week14.adapted.adapted_nutrition.target_calories_kcal, tdee);
  });

  await t.test("CB2: maintenance is the observed TDEE, never base + 350 — even when observed equals base", () => {
    // The old strict `observed > base` test failed once base had been set
    // to observed, so every following week added +350.
    assert.equal(
      resolveDietBreakMaintenance({ observedTdeeKcal: 2200, observedReady: true, planTdeeKcal: 2100, baseEnergyKcal: 2200 }),
      2200,
    );
    assert.equal(
      resolveDietBreakMaintenance({ observedTdeeKcal: 2300, observedReady: true, planTdeeKcal: 2100, baseEnergyKcal: 2000 }),
      2300,
    );
    assert.equal(
      resolveDietBreakMaintenance({ observedTdeeKcal: null, observedReady: false, planTdeeKcal: 2400, baseEnergyKcal: 2000 }),
      2400,
    );
    // No observed value and no plan TDEE: the base itself, never base + 350.
    assert.equal(
      resolveDietBreakMaintenance({ observedReady: false, planTdeeKcal: null, baseEnergyKcal: 2000 }),
      2000,
    );

    // End to end: a second break after the cooldown still lands on
    // maintenance, with no +350 ratchet in between.
    let program = buildProgram("FAT_LOSS");
    const baseCalories = programCalories(program);
    const tdee = programTdee(program);
    const observed = {
      ready: true,
      observed_tdee_kcal: tdee,
      recommended_target_kcal: baseCalories,
      weeks_used: 6,
      weight_trend_kg_per_week: -0.5,
      reason_ar: "test",
    };
    const week6 = runWeek(program, { week: 6, streak: 6, adaptive: observed });
    assert.equal(week6.adapted.adapted_nutrition.target_calories_kcal, tdee);
    program = week6.merged;
    const week7 = runWeek(program, { week: 7, streak: 7, adaptive: observed });
    assert.equal(programCalories(week7.merged), baseCalories);
    program = week7.merged;
    for (let week = 8; week <= 13; week += 1) {
      program = runWeek(program, { week, streak: week, adaptive: observed }).merged;
      assert.equal(programCalories(program), baseCalories, `week ${week} must stay at the deficit`);
    }
    const week14 = runWeek(program, { week: 14, streak: 14, adaptive: observed });
    assert.equal(week14.adapted.adapted_nutrition.target_calories_kcal, tdee);
  });

  await t.test("CB3: no diet break for a muscle-gain client, even when forced", () => {
    const program = buildProgram("MUSCLE_GAIN");
    assert.equal(program.nutrition_program.targets.resolved_goal, "MUSCLE_GAIN");
    const baseCalories = programCalories(program);
    const { adapted } = runWeek(program, { week: 6, streak: 6 });
    assert.notEqual(adapted.adaptation_action, AdaptationAction.SCHEDULE_DIET_BREAK);
    assert.equal(adapted.is_diet_break_recommended, false);

    const forced = buildAdaptedPlan({
      currentMasterProgram: program,
      checkinAnalysis: onTrackCheckin({ streak: 6 }),
      options: { currentWeekNumber: 6, consecutive_high_compliance_weeks: 6, force_diet_break: true },
    });
    assert.notEqual(forced.adaptation_action, AdaptationAction.SCHEDULE_DIET_BREAK);
    assert.equal(forced.is_diet_break_recommended, false);
    assert.equal(forced.adapted_nutrition.target_calories_kcal, baseCalories);
  });

  await t.test("CB6: a custom-macro deficit resume clears is_diet_break and ends the break", () => {
    let program = buildProgram("FAT_LOSS");
    const baseCalories = programCalories(program);
    const baseMacros = programMacros(program);
    const week6 = runWeek(program, { week: 6, streak: 6 });
    assert.equal(week6.merged.nutrition_program.is_diet_break, true);
    program = week6.merged;

    // C02 pattern: the coach resumes the deficit by hand-typing the
    // pre-break macros on top of the break adaptation.
    const resumed = mergeAdaptedPlanIntoProgram(
      program,
      buildAdaptedPlan({
        currentMasterProgram: program,
        checkinAnalysis: onTrackCheckin({ streak: 7 }),
        options: { currentWeekNumber: 7, consecutive_high_compliance_weeks: 7 },
      }),
      { calories: baseCalories, protein: baseMacros.protein_g, carbs: baseMacros.carbohydrate_g, fats: baseMacros.fat_g },
    );
    assert.equal(programCalories(resumed), baseCalories);
    assert.equal(resumed.nutrition_program.is_diet_break, false);
    assert.equal(resumed.nutrition.is_diet_break, false);
    assert.equal(readAdaptationState(resumed).diet_break.status, "COMPLETED");

    // The following week is a normal deficit week, not another break.
    const next = runWeek(resumed, { week: 8, streak: 8 });
    assert.notEqual(next.adapted.adaptation_action, AdaptationAction.SCHEDULE_DIET_BREAK);
    assert.equal(programCalories(next.merged), baseCalories);
  });

  await t.test("CB8: the analysis cut and the adaptation agree — a break defers the cut, it does not hide it", () => {
    const program = buildProgram("FAT_LOSS");
    const baseCalories = programCalories(program);
    // The analysis says cut 150 while the break raises to maintenance.
    const { adapted } = runWeek(program, { week: 6, streak: 6, suggestedDelta: -150 });
    assert.equal(adapted.adaptation_action, AdaptationAction.SCHEDULE_DIET_BREAK);
    assert.ok(adapted.adapted_nutrition.target_calories_kcal > baseCalories);
    assert.ok(adapted.analysis_delta_override, "the override must be recorded on the adaptation");
    assert.equal(adapted.analysis_delta_override.analysis_delta_kcal, -150);
    assert.equal(adapted.analysis_delta_override.applied_delta_kcal, adapted.adapted_nutrition.target_calories_kcal - baseCalories);
    assert.ok(adapted.adaptation_reasons.some((r) => r.code === "DIET_BREAK_DEFERS_ANALYSIS_CUT"));
    assert.equal(adapted.suggested_calorie_delta, adapted.adapted_nutrition.target_calories_kcal - baseCalories);

    // The return week moves DOWN again, agreeing with the cut direction.
    const merged = mergeAdaptedPlanIntoProgram(program, adapted);
    const returned = runWeek(merged, { week: 7, streak: 7, suggestedDelta: -150 });
    assert.equal(returned.adapted.suggested_calorie_delta, baseCalories - programTdee(program));
    assert.ok(returned.adapted.suggested_calorie_delta < 0);
    assert.equal(returned.adapted.analysis_delta_override, null);
  });

  await t.test("CB4: regeneration preserves adaptation history — no sawtooth", () => {
    let program = buildProgram("FAT_LOSS");
    const formulaCalories = programCalories(program);
    // Two approved +125 weeks (observed-TDEE driven), as in the C18/L29 climb.
    for (const [week, target] of [[1, formulaCalories + 125], [2, formulaCalories + 250]]) {
      const { merged } = runWeek(program, {
        week,
        streak: week,
        adaptive: {
          ready: true,
          observed_tdee_kcal: formulaCalories + 400,
          recommended_target_kcal: target,
          weeks_used: 3,
          weight_trend_kg_per_week: 0,
          reason_ar: "test",
        },
      });
      assert.equal(programCalories(merged), target);
      program = merged;
    }
    const state = readAdaptationState(program);
    assert.equal(state.calorie_offset_kcal, 250);

    // Regenerate from the same intake at the same weight: the rebuilt
    // plan starts from the adapted target, not the formula target.
    const intake = JSON.parse(JSON.stringify(completeIntake()));
    intake.goals = { ...intake.goals, primary: "FAT_LOSS" };
    const regenerated = buildMasterEngineV2({
      intake,
      evaluationContext,
      nutritionFoodCatalog,
      options: { adaptation_state: program.adaptation_state },
    });
    const regenCalories = regenerated.nutrition_program.macro_targets.calories_kcal;
    assert.ok(Math.abs(regenCalories - (formulaCalories + 250)) <= 10, `regenerated ${regenCalories} should be ~${formulaCalories + 250}`);
    assert.ok(Math.abs(regenCalories - formulaCalories) > 200, "regeneration must not drop back to the formula target");
    assert.equal(readAdaptationState(regenerated).calorie_offset_kcal, 250);

    // A second regeneration is idempotent: the offset is not applied twice.
    const regenerated2 = buildMasterEngineV2({
      intake,
      evaluationContext,
      nutritionFoodCatalog,
      options: { adaptation_state: regenerated.adaptation_state },
    });
    const regen2Calories = regenerated2.nutrition_program.macro_targets.calories_kcal;
    assert.ok(Math.abs(regen2Calories - regenCalories) <= 10, `second regen ${regen2Calories} must match first ${regenCalories}`);
  });

  await t.test("CB4: a regeneration during an ACTIVE diet break stays at maintenance with the deficit kept", () => {
    let program = buildProgram("FAT_LOSS");
    const baseCalories = programCalories(program);
    const tdee = programTdee(program);
    program = runWeek(program, { week: 6, streak: 6 }).merged;
    assert.equal(programCalories(program), tdee);

    const intake = JSON.parse(JSON.stringify(completeIntake()));
    intake.goals = { ...intake.goals, primary: "FAT_LOSS" };
    const regenerated = buildMasterEngineV2({
      intake,
      evaluationContext,
      nutritionFoodCatalog,
      options: { adaptation_state: program.adaptation_state },
    });
    assert.ok(
      Math.abs(regenerated.nutrition_program.macro_targets.calories_kcal - tdee) <= 2,
      `regenerated ${regenerated.nutrition_program.macro_targets.calories_kcal} should be maintenance ${tdee} (±2 macro rounding)`,
    );
    assert.equal(readAdaptationState(regenerated).diet_break.status, "ACTIVE");
    assert.equal(readAdaptationState(regenerated).diet_break.pre_break_calories_kcal, baseCalories);

    // The next check-in on the regenerated program still ends the break.
    const returned = runWeek(JSON.parse(JSON.stringify(regenerated)), { week: 7, streak: 7 });
    assert.equal(programCalories(returned.merged), baseCalories);
    assert.equal(readAdaptationState(returned.merged).diet_break.status, "COMPLETED");
  });

  await t.test("CB7/B4: a step target exists for every goal and strategy, and survives regeneration", () => {
    for (const goal of ["FAT_LOSS", "MUSCLE_GAIN", "BODY_RECOMPOSITION", "GENERAL_HEALTH"]) {
      const program = buildProgram(goal);
      const steps = program.cardio_program?.prescription?.daily_step_target;
      assert.ok(Number.isFinite(steps) && steps >= 5000, `${goal} must carry a step target, got ${steps}`);
    }
    // A muscle-gain client with NO_ADDITIONAL_CARDIO still gets one.
    const gainer = buildProgram("MUSCLE_GAIN");
    assert.ok(Number.isFinite(gainer.cardio_program.prescription.daily_step_target));

    // A coach-set target survives adaptation, merge, and regeneration.
    let program = buildProgram("FAT_LOSS");
    const intake = JSON.parse(JSON.stringify(completeIntake()));
    intake.goals = { ...intake.goals, primary: "FAT_LOSS" };
    const withCoachSteps = buildMasterEngineV2({
      intake,
      evaluationContext,
      nutritionFoodCatalog,
      options: { coach_step_target: 12000 },
    });
    assert.equal(withCoachSteps.cardio_program.prescription.daily_step_target, 12000);
    program = JSON.parse(JSON.stringify(withCoachSteps));
    const { merged } = runWeek(program, { week: 1, streak: 1 });
    assert.equal(merged.cardio_program.prescription.daily_step_target, 12000);
    const regenerated = buildMasterEngineV2({
      intake,
      evaluationContext,
      nutritionFoodCatalog,
      options: { adaptation_state: merged.adaptation_state },
    });
    assert.equal(regenerated.cardio_program.prescription.daily_step_target, 12000);
    assert.equal(readAdaptationState(regenerated).coach_step_target, 12000);
  });

  await t.test("B4: a step-free (pre-fix) program auto-adapts instead of gating forever", () => {
    const program = buildProgram("FAT_LOSS");
    // Simulate a pre-fix stored program: no step target anywhere.
    delete program.cardio_program.prescription.daily_step_target;
    const base = baseTargetsFromProgram(program);
    assert.equal(base.baseSteps, 5000, "the gate measures against the minimum, it does not block on a missing base");
    assert.ok(Number.isFinite(base.baseCaloriesKcal));

    const adapted = buildAdaptedPlan({
      currentMasterProgram: program,
      checkinAnalysis: onTrackCheckin({
        streak: 2,
        adaptive: {
          ready: true,
          observed_tdee_kcal: programTdee(program),
          recommended_target_kcal: programCalories(program) + 50,
          weeks_used: 3,
          weight_trend_kg_per_week: -0.4,
          reason_ar: "test",
        },
      }),
      options: { currentWeekNumber: 2, consecutive_high_compliance_weeks: 2 },
    });
    assert.equal(adapted.adapted_cardio.daily_step_target, 5000);
    assert.equal(adapted.requires_coach_approval, false);
    assert.ok(!adapted.adaptation_reasons.some((r) => r.code === "BASE_STEP_TARGET_UNREADABLE"));

    const derived = deriveEngineProposed({
      adapted,
      baseCaloriesKcal: base.baseCaloriesKcal,
      baseSteps: base.baseSteps,
    });
    assert.equal(derived.calorie_delta, 50);
    assert.equal(derived.steps_delta, 0);
    const gate = decideFollowUpAutoApply({
      triage: { tier: "GREEN", safety_correction: null },
      adapted,
      baseCaloriesKcal: base.baseCaloriesKcal,
      baseSteps: base.baseSteps,
    });
    assert.equal(gate.eligible, true, `auto-apply must not be blocked: ${gate.blocked_reasons.join(",")}`);
  });

  await t.test("CB4: the next cycle carries adaptation state and the step target", () => {
    let program = buildProgram("FAT_LOSS");
    program = runWeek(program, { week: 6, streak: 6 }).merged;
    const next = buildNextCycle({
      program: { program_data: program },
      progression: {},
      flagged_exercises: [],
    });
    assert.equal(readAdaptationState(next.program_data).diet_break.status, "ACTIVE");
    assert.equal(next.program_data.nutrition_program.macro_targets.calories_kcal, programTdee(program));
    assert.equal(
      next.program_data.cardio_program.prescription.daily_step_target,
      program.cardio_program.prescription.daily_step_target,
    );
  });

  await t.test("diet-break constants: one week, six-week streak, six-week cooldown", () => {
    assert.equal(DIET_BREAK_MIN_STREAK, 6);
  });
});
