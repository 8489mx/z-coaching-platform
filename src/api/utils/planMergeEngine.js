/**
 * Plan Merge Engine (Deterministic & Idempotent Master Program Adapter)
 * 
 * Safely merges adaptation engine deltas (macros, training progression, cardio)
 * into an existing Master Program WITHOUT destroying meals or exercise blueprints.
 */

import { calculateSessionDemand, auditWeeklyMuscleVolume } from './trainingNutritionCoupling.js';
import { splitOversizedPortions, carbPortionLimit, flagHeavyOil, refreshActualMacros } from '../../nutrition-meal-context-v2/build-culinary-meals.js';
import { CLINICAL_GUIDELINES } from '../../config/clinical-guidelines.js';
import { endDietBreakState, readAdaptationState } from '../../adaptation-engine/diet-break-state.js';

const MAX_KCAL_PER_KG = 55;

function customMacrosOutOfRange(message) {
  const error = new Error(message);
  error.code = "CUSTOM_MACROS_OUT_OF_RANGE";
  return error;
}

/**
 * S3-2: coach custom macros pass the same sanity bounds the adaptation engine
 * applies to its own numbers. Out-of-range values are REJECTED, never silently
 * clamped: the coach is the approving actor, so a typo must come back for
 * correction, not become the client's plan under different numbers. The
 * approval handler maps this error to 400. Bounds mirror buildAdaptedPlan:
 * the sex-specific calorie floor, the 55 kcal/kg ceiling on the reference
 * weight, the under-18 maintenance rule, and the diabetic carbohydrate
 * share. A check that cannot be computed from the stored program (no usable
 * weight for the ceiling, no base energy for the carb share) is skipped,
 * never fatal. Only the custom-macros branch is guarded: adapted numbers
 * were already guarded by buildAdaptedPlan.
 */
function validateCustomMacros(merged, finals) {
  const { finalCalories, finalProtein, finalCarbs, finalFats } = finals;
  for (const [name, value] of [["calories", finalCalories], ["protein", finalProtein], ["carbs", finalCarbs], ["fats", finalFats]]) {
    if (!Number.isFinite(value) || value <= 0) {
      throw customMacrosOutOfRange(
        `الماكروز المخصصة غير صالحة: ${name} (${value}) يجب أن تكون رقماً موجباً. راجع الأرقام المدخلة وأعد الاعتماد.`
      );
    }
  }

  const planTargets = merged.nutrition_program?.targets || {};
  const gender = merged.client_profile?.gender ?? merged.client?.gender;
  const isFemale = ["female", "f", "أنثى"].includes(String(gender ?? "").trim().toLowerCase());
  const calorieFloor = isFemale ? 1200 : 1500;
  if (finalCalories < calorieFloor) {
    throw customMacrosOutOfRange(
      `السعرات المخصصة (${finalCalories}) أقل من الحد الأدنى (${calorieFloor} سعرة). راجع الرقم المدخل — غالباً رقم ناقص — وأعد الاعتماد.`
    );
  }

  const baseEnergy = Number(
    merged.nutrition_program?.macro_targets?.calories_kcal
    || planTargets.target_calories_kcal
    || planTargets.target_calories
    || merged.nutrition?.targets?.calories
    || 0
  );
  const currentWeightKg = Number(merged.client_profile?.weight_kg ?? merged.client?.weight_kg);
  const planReferenceKg = Number(planTargets.protein_reference_weight_kg);
  const usesReferenceWeight = Boolean(planTargets.protein_reference_basis)
    && planTargets.protein_reference_basis !== "TOTAL_BODY_WEIGHT"
    && Number.isFinite(planReferenceKg) && planReferenceKg > 30;
  const ceilingWeightKg = usesReferenceWeight ? Math.min(currentWeightKg, planReferenceKg) : currentWeightKg;
  if (Number.isFinite(ceilingWeightKg) && ceilingWeightKg > 30) {
    const ceiling = Math.max(Math.round(ceilingWeightKg * MAX_KCAL_PER_KG), Math.round(baseEnergy));
    if (finalCalories > ceiling) {
      throw customMacrosOutOfRange(
        `السعرات المخصصة (${finalCalories}) فوق السقف (${ceiling} سعرة = ${MAX_KCAL_PER_KG} سعرة لكل كجم). راجع الرقم المدخل وأعد الاعتماد.`
      );
    }
  }

  const guardrails = planTargets.clinical_guardrails || merged.clinical_guardrails || {};
  if (guardrails.is_young_trainee === true) {
    const maintenance = Number(planTargets.tdee);
    if (Number.isFinite(maintenance) && maintenance > 0 && finalCalories < maintenance) {
      throw customMacrosOutOfRange(
        `متدرب تحت 18 سنة: السعرات المخصصة (${finalCalories}) أقل من احتياجه اليومي (${Math.round(maintenance)} سعرة). الجسم في مرحلة نمو ولا يوضع في عجز سعرات.`
      );
    }
  }

  if (guardrails.hypoglycemia_guard_active === true && finalCalories > 0 && baseEnergy > 0) {
    const baseCarbs = Number(
      merged.nutrition_program?.macro_targets?.carbohydrate_g
      || planTargets.carbohydrate_g
      || planTargets.carb_g
      || 0
    );
    if (baseCarbs > 0) {
      const refCarbShare = CLINICAL_GUIDELINES.DIABETES.MAX_CARB_ENERGY_SHARE
        || CLINICAL_GUIDELINES.DIABETES.REFERENCE_CARB_ENERGY_SHARE || 0.45;
      const baseCarbShare = (baseCarbs * 4) / baseEnergy;
      const carbShare = guardrails.kidney_protein_capped === true
        ? Math.max(refCarbShare, baseCarbShare)
        : refCarbShare;
      const maxCarbG = Math.floor((finalCalories * carbShare) / 4);
      if (finalCarbs > maxCarbG) {
        throw customMacrosOutOfRange(
          `النشويات المخصصة (${finalCarbs} جم) تتجاوز سقف السكر (${maxCarbG} جم = ${Math.round(carbShare * 100)}% من السعرات). أعد توزيع الماكروز وأعد الاعتماد.`
        );
      }
    }
  }
}

/**
 * Deep merges adaptation recommendations into a master program while guaranteeing
 * zero data loss for existing meals, culinary recipes, and workout exercises.
 * 
 * @param {Object} currentMasterProgram - The full existing master program JSON
 * @param {Object} adaptationResult - The output of buildAdaptedPlan or checkin analysis
 * @param {Object} [customMacros=null] - Optional coach overrides { calories, protein, carbs, fats }
 * @returns {Object} A fresh, deeply merged master program
 */
/**
 * P1-B10: the structural diff shown to the coach before approval.
 * Counts + per-session exercise-code lists, before vs after, so a
 * replacement is visible instead of silent. Pure: no writes.
 */
export function buildTrainingWeekDiff(existingWeek, adaptedWeek) {
  const sessionsOf = (week) => week?.sessions || week?.days || [];
  const codesOf = (session) => (session?.exercises || []).map((ex) => String(ex.code || ex.exercise_code || ex.id || ""));
  const existingSessions = sessionsOf(existingWeek);
  const adaptedSessions = sessionsOf(adaptedWeek);
  const count = Math.max(existingSessions.length, adaptedSessions.length);
  return {
    sessions_before: existingSessions.length,
    sessions_after: adaptedSessions.length,
    sessions: Array.from({ length: count }, (_, i) => ({
      before: codesOf(existingSessions[i] || {}),
      after: codesOf(adaptedSessions[i] || {}),
    })),
  };
}

export function mergeAdaptedPlanIntoProgram(currentMasterProgram, adaptationResult = {}, customMacros = null) {
  if (!currentMasterProgram || typeof currentMasterProgram !== 'object') {
    throw new TypeError('currentMasterProgram must be a valid non-null object');
  }

  // H4: a withheld program (medical review / blocked) must never have its
  // targets rewritten. The hands-on test caught a kidney program's targets
  // moving 2105 -> 2631 while its status stayed WITHHELD. Refuse loudly so
  // neither the check-in auto-apply path nor a coach approval can silently
  // serve a refused client a new target; the coach reviews the program
  // itself instead. The auto-apply gate already blocks withheld stages;
  // this is the backstop for every other caller.
  const programStatus = currentMasterProgram?.intake_decision?.plan_status;
  const programWithheld =
    programStatus === "MEDICAL_REVIEW_REQUIRED" ||
    programStatus === "BLOCKED" ||
    currentMasterProgram?.nutrition_program?.withheld === true ||
    currentMasterProgram?.training_program?.withheld === true;
  if (programWithheld) {
    const error = new Error("Cannot merge into a withheld program: the plan is held for medical review and its targets must not change.");
    error.code = "PROGRAM_WITHHELD";
    throw error;
  }

  // 1. Deep clone original program to guarantee immutability of input
  const merged = JSON.parse(JSON.stringify(currentMasterProgram));

  // 2. Extract final target macros. Engine values are computed first;
  // P0-A6: coach custom macros are a per-field overlay on those engine
  // values, never a wholesale replacement. A custom object carrying only
  // the fields the coach actually typed changes only those fields; the
  // rest keep the engine's adaptation. An untouched dashboard draft is
  // never sent (see CheckinReviewDashboard), so placeholder numbers can
  // no longer overwrite the engine's adaptation.
  const customField = (key) => customMacros && typeof customMacros === "object" && Number(customMacros[key]) > 0;
  const hasAnyCustom = ["calories", "protein", "carbs", "fats"].some(customField);

  let engineCalories = null;
  let engineProtein = null;
  let engineCarbs = null;
  let engineFats = null;

  if (adaptationResult?.adapted_nutrition?.target_calories_kcal) {
    engineCalories = Number(adaptationResult.adapted_nutrition.target_calories_kcal);
    engineProtein = Number(adaptationResult.adapted_nutrition.protein_g);
    engineCarbs = Number(adaptationResult.adapted_nutrition.carbohydrate_g);
    engineFats = Number(adaptationResult.adapted_nutrition.fat_g);
  } else if (adaptationResult?.suggested_calorie_delta !== undefined && adaptationResult?.suggested_calorie_delta !== null) {
    const baseCal = merged.nutrition_program?.macro_targets?.calories_kcal
      || merged.nutrition_program?.targets?.target_calories_kcal
      || merged.nutrition_program?.targets?.calories_kcal
      || merged.nutrition?.targets?.calories
      || 2000;
    engineCalories = baseCal + Number(adaptationResult.suggested_calorie_delta);
    const baseCarb = merged.nutrition_program?.macro_targets?.carbohydrate_g
      || merged.nutrition_program?.macro_targets?.carb_g
      || merged.nutrition_program?.targets?.carbohydrate_g
      || merged.nutrition_program?.targets?.carb_g
      || merged.nutrition?.targets?.carbs
      || 200;
    engineCarbs = baseCarb + (adaptationResult.suggested_carb_delta_g !== undefined
      ? Number(adaptationResult.suggested_carb_delta_g)
      : Math.round(Number(adaptationResult.suggested_calorie_delta) / 4));
    engineProtein = merged.nutrition_program?.macro_targets?.protein_g
      || merged.nutrition_program?.targets?.protein_g
      || merged.nutrition?.targets?.protein
      || 140;
    engineFats = merged.nutrition_program?.macro_targets?.fat_g
      || merged.nutrition_program?.targets?.fat_g
      || merged.nutrition?.targets?.fats
      || 50;
  }

  // Current program targets: last fallback under a partial custom
  // override only (a typed protein with no engine values must still
  // leave the other fields on the client's real targets, not literals).
  const programCalories = merged.nutrition_program?.macro_targets?.calories_kcal
    || merged.nutrition_program?.targets?.target_calories_kcal
    || merged.nutrition_program?.targets?.calories_kcal
    || merged.nutrition?.targets?.calories
    || null;
  const programProtein = merged.nutrition_program?.macro_targets?.protein_g
    || merged.nutrition_program?.targets?.protein_g
    || merged.nutrition?.targets?.protein
    || null;
  const programCarbs = merged.nutrition_program?.macro_targets?.carbohydrate_g
    || merged.nutrition_program?.macro_targets?.carb_g
    || merged.nutrition_program?.targets?.carbohydrate_g
    || merged.nutrition_program?.targets?.carb_g
    || merged.nutrition?.targets?.carbs
    || null;
  const programFats = merged.nutrition_program?.macro_targets?.fat_g
    || merged.nutrition_program?.targets?.fat_g
    || merged.nutrition?.targets?.fats
    || null;

  let finalCalories = null;
  let finalProtein = null;
  let finalCarbs = null;
  let finalFats = null;

  if (hasAnyCustom) {
    // Overlay: a typed field wins; an untyped field keeps the engine
    // value, then the current program value, then the historical literal.
    const finiteOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
    finalCalories = customField("calories") ? Number(customMacros.calories) : finiteOr(engineCalories, programCalories || 2000);
    finalProtein = customField("protein") ? Number(customMacros.protein) : finiteOr(engineProtein, programProtein || 140);
    finalCarbs = customField("carbs") ? Number(customMacros.carbs) : finiteOr(engineCarbs, programCarbs || 200);
    finalFats = customField("fats") ? Number(customMacros.fats) : finiteOr(engineFats, programFats || 50);
  } else {
    finalCalories = engineCalories;
    finalProtein = engineProtein;
    finalCarbs = engineCarbs;
    finalFats = engineFats;
  }

  // S3-2: guard coach custom macros before anything is written. The adapted
  // path was already guarded by buildAdaptedPlan; only custom numbers need
  // this check.
  const customMacrosApplied = hasAnyCustom;
  if (customMacrosApplied && finalCalories !== null) {
    validateCustomMacros(merged, { finalCalories, finalProtein, finalCarbs, finalFats });
  }

  // Clinical Preservation: P0-A12 — the kidney cap is the last word.
  // A custom protein number never defeats the cap or the documented
  // override: with an override, the only permitted proteins are the
  // override value itself or a custom value at or under the cap (a fresh
  // documented decision, audit-logged by the approval path); without an
  // override, anything above the cap is cut to the cap. This cap comes
  // from laboratory bloodwork for a client we do follow (see
  // build-master-engine-v2.js): a declared kidney disease is refused
  // entirely before generation (serviceScope, Q11), so no declared case
  // ever reaches this merge — this block can never open a bypass around
  // that refusal, it only guards the lab-cap path.
  const clinicalGuardrails = merged.nutrition_program?.targets?.clinical_guardrails
    || merged.nutrition?.targets?.clinical_guardrails
    || merged.clinical_guardrails;

  if (clinicalGuardrails?.kidney_protein_capped && clinicalGuardrails?.max_protein_g && finalProtein !== null) {
    const cap = Number(clinicalGuardrails.max_protein_g);
    const override = Number(clinicalGuardrails.coach_override_protein_g);
    if (Number.isFinite(override) && override > 0) {
      // Documented override exists: a custom number at or under the cap
      // is a fresh documented decision and stands; anything else —
      // including a custom number above the cap — falls back to the
      // override value itself, never to the arbitrary custom number.
      if (!(customMacros?.protein && Number(customMacros.protein) <= cap)) {
        finalProtein = override;
      }
    } else if (finalProtein > cap) {
      // Strict clinical baseline ceiling applies
      finalProtein = cap;
    }
  }


  // 3. Update nutrition targets across all known schema paths WITHOUT touching meals
  if (finalCalories) {
    // Path A: Client Interactive App / Standard Nutrition targets
    if (!merged.nutrition) merged.nutrition = {};
    if (!merged.nutrition.targets) merged.nutrition.targets = {};
    merged.nutrition.targets.calories = finalCalories;
    merged.nutrition.targets.protein = finalProtein;
    merged.nutrition.targets.carbs = finalCarbs;
    merged.nutrition.targets.fats = finalFats;

    // Path B: Clinical Nutrition Program & Stages
    if (!merged.nutrition_program) merged.nutrition_program = {};
    
    // B.1: nutrition_program.targets
    if (!merged.nutrition_program.targets) merged.nutrition_program.targets = {};
    merged.nutrition_program.targets.target_calories = finalCalories;
    merged.nutrition_program.targets.target_calories_kcal = finalCalories;
    merged.nutrition_program.targets.calories_kcal = finalCalories;
    merged.nutrition_program.targets.protein_g = finalProtein;
    merged.nutrition_program.targets.total_protein_g = finalProtein;
    merged.nutrition_program.targets.carbohydrate_g = finalCarbs;
    merged.nutrition_program.targets.carb_g = finalCarbs;
    merged.nutrition_program.targets.total_carbs_g = finalCarbs;
    merged.nutrition_program.targets.fat_g = finalFats;
    merged.nutrition_program.targets.total_fat_g = finalFats;

    // B.2: nutrition_program.macro_targets
    if (!merged.nutrition_program.macro_targets) merged.nutrition_program.macro_targets = {};
    merged.nutrition_program.macro_targets.calories_kcal = finalCalories;
    merged.nutrition_program.macro_targets.protein_g = finalProtein;
    merged.nutrition_program.macro_targets.carbohydrate_g = finalCarbs;
    merged.nutrition_program.macro_targets.carb_g = finalCarbs;
    merged.nutrition_program.macro_targets.fat_g = finalFats;

    // B.3b (S2-1 A1): keep the pipeline stages' headline numbers in agreement
    // with the merged targets, in both key shapes. A WITHHELD stage is left
    // untouched; stage metadata and all other stages are preserved.
    if (merged.nutrition_program.stages && typeof merged.nutrition_program.stages === "object") {
      const macroCaloriesTotal = finalProtein * 4 + finalCarbs * 4 + finalFats * 9;
      const round1 = (value) => Math.round(value * 10) / 10;
      const stageEnergy = merged.nutrition_program.stages.energy_target;
      if (stageEnergy && stageEnergy.status !== "WITHHELD") {
        merged.nutrition_program.stages.energy_target = {
          ...stageEnergy,
          target_calories: finalCalories,
          target_calories_kcal: finalCalories,
          calories_kcal: finalCalories,
          target_source: "UNIVERSAL_TARGETS",
        };
      }
      const stageMacros = merged.nutrition_program.stages.macro_targets;
      if (stageMacros && stageMacros.status !== "WITHHELD") {
        merged.nutrition_program.stages.macro_targets = {
          ...stageMacros,
          target_calories: finalCalories,
          protein: {
            ...(stageMacros.protein || {}),
            target_g: finalProtein,
            calories: finalProtein * 4,
            percent_of_calories: round1((finalProtein * 4 / finalCalories) * 100),
          },
          fat: {
            ...(stageMacros.fat || {}),
            target_g: finalFats,
            calories: finalFats * 9,
            percent_of_calories: round1((finalFats * 9 / finalCalories) * 100),
          },
          carbohydrate: {
            ...(stageMacros.carbohydrate || {}),
            target_g: finalCarbs,
            calories: finalCarbs * 4,
            percent_of_calories: round1((finalCarbs * 4 / finalCalories) * 100),
          },
          protein_g: finalProtein,
          carbohydrate_g: finalCarbs,
          carb_g: finalCarbs,
          carbs_g: finalCarbs,
          fat_g: finalFats,
          fats_g: finalFats,
          macro_calories_total: macroCaloriesTotal,
          calorie_difference: macroCaloriesTotal - finalCalories,
          target_source: "UNIVERSAL_TARGETS",
        };
      }
    }

    // B.3: nutrition_program.quantized_plan.daily_totals
    if (merged.nutrition_program.quantized_plan && merged.nutrition_program.quantized_plan.daily_totals) {
      merged.nutrition_program.quantized_plan.daily_totals.calories_kcal = finalCalories;
      merged.nutrition_program.quantized_plan.daily_totals.protein_g = finalProtein;
      merged.nutrition_program.quantized_plan.daily_totals.carbs_g = finalCarbs;
      merged.nutrition_program.quantized_plan.daily_totals.fat_g = finalFats;
    }

    // 3.1 Rebalance culinary meal ingredient grams and macros to match final targets
    // B-API-5 (S1): at a zero delta the targets did not move, yet the
    // re-quantization still ran and drifted grams by rounding (a 99 g
    // portion became 100 g, a 167 kcal meal 169 kcal). A merge that changes
    // nothing must change nothing: when every final target equals the
    // program's current target (within half a unit — rounding noise), the
    // whole re-quantization block is skipped. The training-week advance
    // below is a separate block and still rides the same merge.
    const isZeroDeltaMerge =
      finalCalories !== null &&
      programCalories !== null && programProtein !== null && programCarbs !== null && programFats !== null &&
      Math.abs(finalCalories - programCalories) <= 0.5 &&
      Math.abs((finalProtein ?? 0) - programProtein) <= 0.5 &&
      Math.abs((finalCarbs ?? 0) - programCarbs) <= 0.5 &&
      Math.abs((finalFats ?? 0) - programFats) <= 0.5;
    if (!isZeroDeltaMerge) {
    const targetPayload = { finalCalories, finalProtein, finalCarbs, finalFats };
    const portionLimit = carbPortionLimit({ diabetic: merged.nutrition_program?.targets?.clinical_guardrails?.hypoglycemia_guard_active === true });

    // Scaling up can take a carbohydrate item back over the plate cap; split it again.
    if (Array.isArray(merged.nutrition_program?.culinary_meals)) {
      rebalanceCulinaryMeals(merged.nutrition_program.culinary_meals, targetPayload);
      // ...and scaling fat up can take the olive oil past two tablespoons a meal: the coach is told.
      merged.nutrition_program.culinary_meals = refreshActualMacros(splitOversizedPortions(merged.nutrition_program.culinary_meals, portionLimit).map(flagHeavyOil));
    }

    if (Array.isArray(merged.nutrition_program?.quantized_plan?.meals)) {
      rebalanceCulinaryMeals(merged.nutrition_program.quantized_plan.meals, targetPayload);
    }

    if (Array.isArray(merged.nutrition_program?.targets?.meals)) {
      rebalanceCulinaryMeals(merged.nutrition_program.targets.meals, targetPayload);
    }

    if (Array.isArray(merged.nutrition?.culinary_meals)) {
      rebalanceCulinaryMeals(merged.nutrition.culinary_meals, targetPayload);
      merged.nutrition.culinary_meals = splitOversizedPortions(merged.nutrition.culinary_meals, portionLimit);
    }

    // Rebalance merged.nutrition.meals ONLY if it contains structured culinary items
    if (Array.isArray(merged.nutrition?.meals) &&
        merged.nutrition.meals.some(m => Array.isArray(m?.items) && m.items.some(it => Boolean(it?.category || it?.food_code)))) {
      rebalanceCulinaryMeals(merged.nutrition.meals, targetPayload);
    }
    }

    // 3.2 Diet Break and Refeed metadata preservation
    const adaptationProposedBreak = adaptationResult?.adaptation_action === 'SCHEDULE_DIET_BREAK' ||
      adaptationResult?.is_diet_break_recommended === true ||
      adaptationResult?.is_diet_break === true ||
      adaptationResult?.checkinAnalysis?.is_diet_break === true ||
      adaptationResult?.checkinAnalysis?.decision === 'SCHEDULE_DIET_BREAK';
    // H1 (CB6): the flag describes the food the client is actually on,
    // not the proposal. A custom-macro resume pulls the merged calories
    // below the break's own maintenance target, so the break flag must
    // clear even though the adaptation that week proposed a break.
    // The yardstick is the BREAK's maintenance, never the plan's formula
    // TDEE: observed-TDEE maintenance can legitimately sit below formula
    // TDEE, and judging a genuine break week against formula TDEE would
    // wrongly clear the flag on the break itself. The formula-TDEE test
    // only applies on a non-break week clearing a stale flag.
    const planTdeeKcal = Number(
      merged.nutrition_program?.targets?.tdee || merged.nutrition_program?.tdee || NaN,
    );
    const breakMaintenanceKcal = Number(
      adaptationResult?.adaptation_state?.diet_break?.maintenance_calories_kcal
      ?? (Number.isFinite(engineCalories) ? engineCalories : NaN),
    );
    const finalIsDeficit = adaptationProposedBreak
      ? (Number.isFinite(breakMaintenanceKcal) && finalCalories < breakMaintenanceKcal)
      : (Number.isFinite(planTdeeKcal) && finalCalories < planTdeeKcal);
    const isDietBreak = adaptationProposedBreak && !finalIsDeficit;

    if (isDietBreak) {
      if (merged.nutrition_program) {
        merged.nutrition_program.is_diet_break = true;
        merged.nutrition_program.diet_break_note = "استراحة دايت مبرمجة لرفع السعرات إلى حد الصيانة وإعادة تنشيط هرمونات الحرق واللبتين";
      }
      if (merged.nutrition) {
        merged.nutrition.is_diet_break = true;
        merged.nutrition.diet_break_note = "استراحة دايت مبرمجة لرفع السعرات إلى حد الصيانة وإعادة تنشيط هرمونات الحرق واللبتين";
      }
    } else if (merged.nutrition_program?.is_diet_break) {
      merged.nutrition_program.is_diet_break = false;
      delete merged.nutrition_program.diet_break_note;
      if (merged.nutrition) {
        merged.nutrition.is_diet_break = false;
        delete merged.nutrition.diet_break_note;
      }
    }

    const refeedConfig = adaptationResult?.adapted_nutrition?.refeed_config || adaptationResult?.refeed_config;
    if (refeedConfig) {
      if (merged.nutrition_program) merged.nutrition_program.refeed_config = refeedConfig;
      if (merged.nutrition) merged.nutrition.refeed_config = refeedConfig;
    }
  }

  // 4. Update Training Meso-Cycle with Idempotency & Chronological Order Guarantee
  // P0-A12: no week advance when the adapted week is empty or locked.
  // A cardiac/clinical lockout returns adapted_training_week null (see
  // build-adapted-plan.js), and advancing the counter then would skip a
  // week of progression the client never trained. The counter stays put
  // and the hold is recorded in _last_adaptation below, with a dedicated
  // cardiac message when the lockout reason is present. The same guard
  // also stops a macro-only re-application (adaptation {}) from
  // advancing the week a second time.
  const trainingWeekHeld = !adaptationResult?.adapted_training_week;
  const trainingWeekHeldForCardiac = trainingWeekHeld && (adaptationResult?.adaptation_reasons || []).some(
    (r) => r?.code === "CLINICAL_TRAINING_LOCKOUT",
  );
  const targetWeekNumber = trainingWeekHeld
    ? (Number(merged.current_training_week) || null)
    : (Number(adaptationResult?.adapted_week_number)
      || (Number(merged.current_training_week) ? Number(merged.current_training_week) + 1 : 2));

  if (!trainingWeekHeld) {
    merged.current_training_week = targetWeekNumber;
  }

  // P1-B10: structural merge mode + diff, recorded in _last_adaptation.
  let trainingWeekMergeMode = null;
  let trainingWeekDiff = null;

  if (adaptationResult?.adapted_training_week && merged.training_program) {
    if (!Array.isArray(merged.training_program.weeks)) {
      merged.training_program.weeks = [];
    }

    const weeks = merged.training_program.weeks;

    // Idempotency: Locate week by explicit week_number or array index
    const existingIdx = weeks.findIndex(w => 
      Number(w.week_number) === targetWeekNumber || Number(w.week) === targetWeekNumber
    );

    const formattedAdaptedWeek = {
      ...adaptationResult.adapted_training_week,
      week_number: targetWeekNumber
    };

    if (existingIdx !== -1) {
      // P1-B10 structural merge decision: in-place mapping walks the
      // EXISTING sessions only, so it is lossy by construction whenever
      // the adapted week has a different session count or a reschedule
      // rewrote the week. In exactly those cases the target week is
      // replaced wholesale with the adapted sessions, and the diff is
      // recorded so the coach sees what changed. Otherwise the in-place
      // path is kept, because it preserves coach custom blueprints.
      const existingWeek = weeks[existingIdx];
      const existingSessions = existingWeek.sessions || existingWeek.days || [];
      const adaptedSessions = formattedAdaptedWeek.sessions || formattedAdaptedWeek.days || [];
      trainingWeekDiff = buildTrainingWeekDiff(existingWeek, formattedAdaptedWeek);
      const needsReplacement = existingSessions.length !== adaptedSessions.length
        || Boolean(formattedAdaptedWeek.reschedule_info);
      if (needsReplacement) {
        trainingWeekMergeMode = "REPLACED";
        weeks[existingIdx] = {
          ...existingWeek,
          ...formattedAdaptedWeek,
          [existingWeek.sessions ? 'sessions' : 'days']: adaptedSessions,
        };
      } else {
        trainingWeekMergeMode = "IN_PLACE";
      }
      let mergedSessions = adaptedSessions;
      if (trainingWeekMergeMode === "IN_PLACE" && existingSessions.length > 0 && adaptedSessions.length > 0) {
        mergedSessions = existingSessions.map((exSess, sIdx) => {
          const adaptSess = adaptedSessions[sIdx] || {};
          const exList = exSess.exercises || [];
          const updatedExercises = exList.map((ex, exIdx) => {
            const adaptByOrig = (adaptSess.exercises || []).find(ae => ae?.is_biomechanical_swap && (ae?.original_exercise_code === ex.code || ae?.original_exercise_code === ex.id));
            const adaptEx = adaptByOrig || (adaptSess.exercises || [])[exIdx];
            if (adaptEx?.is_biomechanical_swap) {
              return {
                ...adaptEx,
                is_coach_custom: false
              };
            }

            let rir = ex.rir;
            if (formattedAdaptedWeek.target_rir !== undefined) {
              rir = formattedAdaptedWeek.target_rir;
            }
            let sets = ex.sets;
            if (adaptationResult?.is_deload_recommended || adaptationResult?.checkinAnalysis?.is_deload_recommended || formattedAdaptedWeek.phase === 'DELOAD') {
              sets = Math.max(2, Math.round(Number(ex.sets || 3) * 0.60));
            }
            return {
              ...ex,
              rir,
              target_rir: rir,
              sets,
              target_sets: sets
            };
          });
          return {
            ...adaptSess,
            ...exSess,
            exercises: updatedExercises.length > 0 ? updatedExercises : (adaptSess.exercises || [])
          };
        });
      }

      if (trainingWeekMergeMode === "IN_PLACE") {
        weeks[existingIdx] = {
          ...existingWeek,
          ...formattedAdaptedWeek,
          ...(existingSessions.length > 0 && adaptedSessions.length > 0 ? { [existingWeek.sessions ? 'sessions' : 'days']: mergedSessions } : {})
        };
      }
    } else {
      // New week: nothing to preserve, the adapted week is appended whole.
      trainingWeekMergeMode = "APPENDED";
      trainingWeekDiff = buildTrainingWeekDiff(null, formattedAdaptedWeek);
      // Safe insertion: Append and sort chronologically by week_number to preserve all existing weeks (handles gaps & out-of-order)
      weeks.push(formattedAdaptedWeek);
      weeks.sort((a, b) => (Number(a.week_number) || 0) - (Number(b.week_number) || 0));
    }
  }

  // 5. Apply Deload Flag if recommended
  if (adaptationResult?.is_deload_recommended || adaptationResult?.checkinAnalysis?.is_deload_recommended) {
    if (merged.training_program) {
      merged.training_program.is_deload = true;
      merged.training_program.deload_note = "أسبوع تفريغ أحمال تلقائي بناءً على مؤشرات الإجهاد وآلام المفاصل";
    }
  }

  // 6. Update Cardio step target if provided
  if (adaptationResult?.adapted_cardio && merged.cardio_program?.prescription) {
    merged.cardio_program.prescription.daily_step_target = 
      adaptationResult.adapted_cardio.daily_step_target || merged.cardio_program.prescription.daily_step_target;
  }

  // 7. Training-Nutrition Coupling and Volume Audit
  const activeSessions = (merged.training?.sessions && merged.training.sessions.length > 0)
    ? merged.training.sessions
    : (Array.isArray(merged.training_program?.weeks) && merged.training_program.weeks.length > 0)
      ? (merged.training_program.weeks.find(w => Number(w.week_number) === targetWeekNumber)?.sessions || merged.training_program.weeks[0]?.sessions || [])
      : [];

  if (activeSessions.length > 0) {
    const volumeAudit = auditWeeklyMuscleVolume(activeSessions, merged.client_profile?.experience_level || merged.training_program?.experience_level);
    const sessionDemand = calculateSessionDemand(activeSessions[0]?.exercises || []);

    merged._training_coupling = {
      session_demand: sessionDemand,
      volume_audit: volumeAudit,
      last_synced_at: new Date().toISOString()
    };
  }

  // 8. Store Audit Adaptation Metadata
  merged._last_adaptation = {
    action: adaptationResult?.adaptation_action || 'APPROVED',
    reasons: adaptationResult?.adaptation_reasons || [],
    adapted_week: targetWeekNumber,
    timestamp: new Date().toISOString(),
    // P0-A12: the week counter did not move on a held week, and a
    // cardiac hold carries its own message instead of falling through
    // to an "on track" reading.
    training_week_held: trainingWeekHeld,
    // P1-B10: how the week was merged and what changed, shown to the
    // coach before approval (preview endpoint) and after (approve reply).
    training_week_merge_mode: trainingWeekMergeMode,
    training_week_diff: trainingWeekDiff,
    ...(trainingWeekHeldForCardiac ? {
      cardiac_lockout_message_ar: "تم إيقاف التدريب بموجب قفل السلامة السريرية (أعراض قلبية أو إغماء)؛ لم يتقدم رقم الأسبوع التدريبي لأن الأسبوع المعدل فارغ وموقوف، وسيستأنف العميل من نفس الأسبوع بعد التصريح الطبي وموافقة الكوتش.",
      cardiac_lockout_message_en: "Training suspended under the clinical safety lockout (cardiac symptoms or syncope); the training week counter did not advance because the adapted week is empty and locked.",
    } : {}),
  };

  // S3-3: carry the biomarker analysis and the clinical safety shield into
  // the stored program. The adaptation engine already computes both, but
  // until now the merge dropped them, so a shield earned in one check-in
  // was lost from the stored program after approval. Copy from the top
  // level first, falling back to adapted_nutrition, to both the top level
  // and nutrition_program, because the adaptation engine reads both paths
  // and the client list reads the top level. Copy only when the adaptation
  // supplies a value: a missing value preserves the old stored shield and
  // never clears it silently. Values are deep-cloned so the stored program
  // never shares a frozen adaptation object. This is prospective only:
  // it changes future merges, it does not rewrite already stored programs.
  const newBiomarkerAnalysis = adaptationResult?.biomarker_analysis
    ?? adaptationResult?.adapted_nutrition?.biomarker_analysis
    ?? null;
  const newClinicalShield = adaptationResult?.clinical_safety_shield
    ?? adaptationResult?.adapted_nutrition?.clinical_safety_shield
    ?? null;
  if (newBiomarkerAnalysis && typeof newBiomarkerAnalysis === "object") {
    merged.biomarker_analysis = JSON.parse(JSON.stringify(newBiomarkerAnalysis));
    if (!merged.nutrition_program || typeof merged.nutrition_program !== "object") {
      merged.nutrition_program = {};
    }
    merged.nutrition_program.biomarker_analysis = JSON.parse(JSON.stringify(newBiomarkerAnalysis));
  }
  if (newClinicalShield && typeof newClinicalShield === "object") {
    merged.clinical_safety_shield = JSON.parse(JSON.stringify(newClinicalShield));
    if (!merged.nutrition_program || typeof merged.nutrition_program !== "object") {
      merged.nutrition_program = {};
    }
    merged.nutrition_program.clinical_safety_shield = JSON.parse(JSON.stringify(newClinicalShield));
  }

  // H1 (CB1/CB4/CB6/CB7): persist the diet-break / adaptation state the
  // adaptation computed, so it survives the next adaptation and the next
  // cycle. The adaptation's state wins where it carries a value; the
  // coach-set step target already stored is never dropped by an
  // adaptation that does not mention it. A break the coach ended early
  // with custom deficit macros is recorded as ended (COMPLETED) with
  // the custom macros as the resumed deficit — the flag above already
  // cleared, and the state must agree with it.
  const incomingState = adaptationResult?.adaptation_state;
  if (incomingState && typeof incomingState === "object") {
    const storedState = readAdaptationState(merged);
    let nextState = JSON.parse(JSON.stringify(incomingState));
    if (!Number.isFinite(nextState.coach_step_target) && Number.isFinite(storedState.coach_step_target)) {
      nextState.coach_step_target = storedState.coach_step_target;
    }
    if (adaptationProposedBreakForState(adaptationResult) && !isDietBreakAfterMerge(merged) && finalCalories) {
      nextState = endDietBreakState({
        state: nextState,
        resumedCaloriesKcal: finalCalories,
        resumedMacros: {
          protein_g: finalProtein,
          carbohydrate_g: finalCarbs,
          fat_g: finalFats,
        },
      });
    }
    merged.adaptation_state = JSON.parse(JSON.stringify(nextState));
  }

  return merged;
}

function adaptationProposedBreakForState(adaptationResult) {
  return adaptationResult?.adaptation_action === "SCHEDULE_DIET_BREAK"
    || adaptationResult?.is_diet_break_recommended === true
    || adaptationResult?.is_diet_break === true;
}

function isDietBreakAfterMerge(merged) {
  return merged?.nutrition_program?.is_diet_break === true;
}

/**
 * Proportionally rebalances portion grams and macros in culinary meals to match
 * new nutrition target macros (e.g. after automated check-in deficit titration or coach overrides).
 * 
 * Clinical & Nutritional Invariants:
 * - VEGGIES & non-caloric BEVERAGE items are locked at 1.0 (never reduced) to safeguard micronutrients, satiety, and gut fiber.
 * - Minimum portion clamp: 5g (prevents absurd 0g or micro portions).
 * - Equivalent swap grams and macros are scaled synchronously with the parent item.
 * - Household measurements starting with portion gram amounts are updated to reflect the new portion.
 * - meal.actual_macros and meal.target_macros are recomputed to guarantee end-to-end mathematical consistency.
 * 
 * @param {Array<Object>} meals - Array of culinary meal objects
 * @param {Object} targets - { finalCalories, finalProtein, finalCarbs, finalFats }
 * @returns {Array<Object>} Rebalanced meals array
 */
/**
 * Scale one meal item (portion, macros, swaps, household measurement) by
 * a ratio. Shared by the per-category scaling below and the R2 LO-1
 * post-scale kcal guard, so both use exactly the same mechanics.
 */
function scaleMealItem(item, ratio) {
  if (!item || typeof item !== "object") return;
  const origPortion = Number(item.portion_g ?? item.amount_g ?? item.amount) || 0;
  if (origPortion > 0 && Math.abs(ratio - 1.0) > 0.0001) {
    const newPortion = Math.max(5, Math.round(origPortion * ratio));
    item.portion_g = newPortion;
    if (item.amount_g !== undefined) item.amount_g = newPortion;
    if (item.amount !== undefined) item.amount = newPortion;

    const effectiveRatio = newPortion / origPortion;

    if (item.calories_kcal !== undefined) item.calories_kcal = Math.round(item.calories_kcal * effectiveRatio);
    if (item.protein_g !== undefined) item.protein_g = Math.round(item.protein_g * effectiveRatio);
    if (item.carb_g !== undefined) item.carb_g = Math.round(item.carb_g * effectiveRatio);
    if (item.fat_g !== undefined) item.fat_g = Math.round(item.fat_g * effectiveRatio);

    // Update leading portion number in household measurement if it matches origPortion
    if (typeof item.household_measurement === 'string') {
      const m = item.household_measurement.match(/^(\d+(?:\.\d+)?)/);
      if (m && Math.abs(Number(m[1]) - origPortion) <= 1) {
        item.household_measurement = item.household_measurement.replace(/^(\d+(?:\.\d+)?)/, String(newPortion));
      }
    }

    // Synchronously rebalance swap alternatives
    if (Array.isArray(item.swaps)) {
      for (const swap of item.swaps) {
        const origSwap = Number(swap.equivalent_grams ?? swap.portion_g) || 0;
        if (origSwap > 0) {
          const newSwap = Math.max(5, Math.round(origSwap * effectiveRatio));
          swap.equivalent_grams = newSwap;
          if (swap.portion_g !== undefined) swap.portion_g = newSwap;

          const swapRatio = newSwap / origSwap;
          if (swap.calories_kcal !== undefined) swap.calories_kcal = Math.round(swap.calories_kcal * swapRatio);
          if (swap.protein_g !== undefined) swap.protein_g = Math.round(swap.protein_g * swapRatio);
          if (swap.carb_g !== undefined) swap.carb_g = Math.round(swap.carb_g * swapRatio);
          if (swap.fat_g !== undefined) swap.fat_g = Math.round(swap.fat_g * swapRatio);

          if (typeof swap.household_measurement === 'string') {
            const sm = swap.household_measurement.match(/^(\d+(?:\.\d+)?)/);
            if (sm && Math.abs(Number(sm[1]) - origSwap) <= 1) {
              swap.household_measurement = swap.household_measurement.replace(/^(\d+(?:\.\d+)?)/, String(newSwap));
            }
          }
        }
      }
    }
  }
}

/** Recompute one meal's actual macros from its (possibly rescaled) items. */
function recomputeMealActualMacros(meal) {
  if (!meal || !Array.isArray(meal.items)) return { mealP: 0, mealC: 0, mealF: 0, mealKcal: 0 };
  const mealP = meal.items.reduce((sum, it) => sum + (Number(it.protein_g) || 0), 0);
  const mealC = meal.items.reduce((sum, it) => sum + (Number(it.carb_g) || 0), 0);
  const mealF = meal.items.reduce((sum, it) => sum + (Number(it.fat_g) || 0), 0);
  const mealKcal = meal.items.reduce((sum, it) => sum + (Number(it.calories_kcal) || 0), 0);

  meal.actual_macros = {
    protein_g: Math.round(mealP),
    carb_g: Math.round(mealC),
    fat_g: Math.round(mealF),
    calories_kcal: Math.round(mealKcal),
  };
  return { mealP, mealC, mealF, mealKcal };
}

// R2 LO-1: the kcal tolerance the post-scale guard shares with
// reconcileDayCaloriesToTarget (its default toleranceKcal = 30). The
// guard fires only when the scaled day total exceeds the new calorie
// target by MORE than this; it never changes the tolerance itself.
const MERGE_KCAL_GUARD_TOLERANCE_KCAL = 30;

export function rebalanceCulinaryMeals(meals, { finalCalories, finalProtein, finalCarbs, finalFats } = {}) {
  if (!Array.isArray(meals) || meals.length === 0) return meals;

  // Calculate current actual macronutrient totals across all meal items
  let currentTotalP = 0;
  let currentTotalC = 0;
  let currentTotalF = 0;
  let currentTotalKcal = 0;

  for (const meal of meals) {
    if (Array.isArray(meal?.items)) {
      for (const item of meal.items) {
        currentTotalP += Number(item.protein_g) || 0;
        currentTotalC += Number(item.carb_g) || 0;
        currentTotalF += Number(item.fat_g) || 0;
        currentTotalKcal += Number(item.calories_kcal) || 0;
      }
    }
  }

  // If no items with caloric content exist, return untouched
  if (currentTotalKcal === 0) return meals;

  const calRatio = (Number(finalCalories) > 0 && currentTotalKcal > 0)
    ? (Number(finalCalories) / currentTotalKcal)
    : 1.0;

  const carbRatio = (Number(finalCarbs) > 0 && currentTotalC > 0)
    ? (Number(finalCarbs) / currentTotalC)
    : calRatio;

  const proteinRatio = (Number(finalProtein) > 0 && currentTotalP > 0)
    ? (Number(finalProtein) / currentTotalP)
    : calRatio;

  const fatRatio = (Number(finalFats) > 0 && currentTotalF > 0)
    ? (Number(finalFats) / currentTotalF)
    : calRatio;

  for (const meal of meals) {
    if (!Array.isArray(meal?.items)) continue;

    for (const item of meal.items) {
      const cat = String(item.category || '').toUpperCase();
      let ratio = 1.0;

      if (cat === 'CARBS') {
        ratio = carbRatio;
      } else if (cat === 'PROTEIN') {
        ratio = proteinRatio;
      } else if (cat === 'FATS') {
        ratio = fatRatio;
      } else if (cat === 'VEGGIES' || cat === 'BEVERAGE') {
        ratio = 1.0;
      } else {
        ratio = calRatio;
      }

      scaleMealItem(item, ratio);
    }

    // Recompute actual meal macros
    const { mealP, mealC, mealF, mealKcal } = recomputeMealActualMacros(meal);

    if (meal.target_macros && typeof meal.target_macros === 'object') {
      meal.target_macros = {
        protein_g: Math.round((Number(meal.target_macros.protein_g) || mealP) * proteinRatio),
        carb_g: Math.round((Number(meal.target_macros.carb_g) || mealC) * carbRatio),
        fat_g: Math.round((Number(meal.target_macros.fat_g) || mealF) * fatRatio),
        calories_kcal: Math.round((Number(meal.target_macros.calories_kcal) || mealKcal) * calRatio),
      };
    }
  }

  // R2 LO-1 — post-scale kcal guard. The day-0 plate is systematically
  // macro-short of its headline (reconcile fixes kcal by cutting starch
  // only), so the per-category ratios above can exceed 1.0 even when the
  // calorie target falls, and the food scales UP while the prescription
  // goes DOWN. Measure the scaled day total: if it exceeds the new calorie
  // target by more than the reconcile tolerance, scale every
  // macro-category item down uniformly by finalCalories / resultKcal so
  // the served food lands on target. Direction-neutral (it only ever
  // scales down, never up) and it never touches VEGGIES/BEVERAGE (locked
  // at 1.0, same as the ratio scaling) or the targets themselves.
  const targetKcal = Number(finalCalories);
  if (targetKcal > 0) {
    let resultKcal = 0;
    for (const meal of meals) {
      if (!Array.isArray(meal?.items)) continue;
      for (const item of meal.items) {
        resultKcal += Number(item.calories_kcal) || 0;
      }
    }
    if (resultKcal - targetKcal > MERGE_KCAL_GUARD_TOLERANCE_KCAL) {
      const guardFactor = targetKcal / resultKcal;
      for (const meal of meals) {
        if (!Array.isArray(meal?.items)) continue;
        for (const item of meal.items) {
          const cat = String(item.category || '').toUpperCase();
          if (cat === 'VEGGIES' || cat === 'BEVERAGE') continue;
          scaleMealItem(item, guardFactor);
        }
      }
      // The guard moved the items again: recompute the reported macros so
      // they agree with the guarded food, not the pre-guard scaling.
      for (const meal of meals) {
        recomputeMealActualMacros(meal);
      }
    }
  }

  return meals;
}

