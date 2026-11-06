
/**
 * Automatically evaluates the client's intake data across physiological, medical, and lifestyle markers
 * to deterministically resolve the most suitable Diet Framework if "AUTO_COACH_MATCH" is selected.
 *
 * @param {Object} canonicalIntake
 * @param {Object} [rawIntake={}]
 * @returns {{ framework: string, reason_ar: string, reason_en: string }}
 */
// Intake form answers that the canonical contract cannot carry.
function readFormFastingProtocol(effectiveRaw) {
  const protocol = String(effectiveRaw?.meal_structure?.intermittent_fasting || "").toLowerCase();
  if (protocol === "ramadan") return "RAMADAN";
  return protocol === "16_8" || protocol === "14_10" ? protocol : null;
}

// B3 (Ramadan): is this client fasting Ramadan, rather than a lifestyle
// 16:8/14:10 window? Two honest signals: the client picked Ramadan in the
// form, or a Muslim client on a generic window whose plan is generated on a
// Ramadan day (Umm al-Qura calendar, the same source the serve path uses).
// Either way the window below is the Ramadan one — never the generic clock
// window — and its iftar/suhoor times are HELD for the coach, because the
// intake carries no location to compute sunset from.
function isRamadanFasting(effectiveRaw, evaluationContext) {
  const protocol = readFormFastingProtocol(effectiveRaw);
  if (protocol === "RAMADAN") return true;
  if (protocol === null) return false;
  const religion = String(
    effectiveRaw?.religion || effectiveRaw?.personal?.religion || "",
  ).toUpperCase();
  if (religion !== "MUSLIM") return false;
  const dateStr = evaluationContext?.assessmentDate || evaluationContext?.system_time;
  if (!dateStr) return false;
  try {
    return isRamadanDay(localDay(new Date(dateStr)));
  } catch {
    return false;
  }
}

function isPostBariatric(effectiveRaw) {
  const med = effectiveRaw?.medical_conditions;
  if (!med || typeof med !== "object" || Array.isArray(med)) return false;
  const selected = Array.isArray(med.selected) ? med.selected.map((s) => String(s).toLowerCase()) : [];
  return selected.includes("bariatric_surgery") || med.bariatric?.is_operated === true;
}

export function resolveOptimalDietFramework(canonicalIntake, rawIntake = {}) {
  const effectiveRaw = (rawIntake?.answers && typeof rawIntake.answers === 'object')
    ? { ...rawIntake.answers, ...rawIntake }
    : (rawIntake || {});
  const medical = canonicalIntake?.medical || {};
  const nutrition = canonicalIntake?.nutrition || {};
  const lifestyle = canonicalIntake?.lifestyle || {};
  const training = canonicalIntake?.training || {};
  const rawMedical = effectiveRaw?.medical || {};
  const rawNutrition = effectiveRaw?.nutrition || {};

  // Pregnancy is outside the service (src/api/services/serviceScope.js): no plan is built for a
  // pregnant client, so the framework, the energy surplus, the 175 g carbohydrate floor and the
  // ban on low-carb and fasting that used to live here left with the case. Breastfeeding and a
  // recent birth stay inside the service and keep everything they had.

  // 1. IBS / Severe Digestion Bloating -> LOW_FODMAP
  const hasIbs =
    medical.hasIbs === true ||
    rawMedical.hasIbs === true ||
    medical.digestionIssues?.includes("IBS") ||
    rawMedical.digestionIssues?.includes("IBS") ||
    rawNutrition.hasBloating === true ||
    effectiveRaw?.digestive_issues === "IBS" ||
    effectiveRaw?.digestive_issues === "GERD" ||
    effectiveRaw?.digestive_issues === "BLOATING" ||
    (Array.isArray(nutrition.digestiveIssues) && nutrition.digestiveIssues.some(d => d.name === "IBS" || d.name === "ACID_REFLUX" || d.name === "BLOATING")) ||
    (Array.isArray(medical.conditions) && medical.conditions.some(c => c.conditionCode === "DIAGNOSED_DIGESTIVE_CONDITION"));

  if (hasIbs) {
    return {
      framework: "LOW_FODMAP",
      reason_ar: "تم اختيار بروتوكول القولون العصبي (Low-FODMAP) تلقائياً لوجود حساسية هضمية أو انتفاخات متكررة لإراحة الأمعاء وتحقيق بطن مسطحة.",
      reason_en: "Low-FODMAP protocol auto-selected due to reported digestive sensitivity and bloating.",
    };
  }

  // 2. PCOS / Insulin Resistance -> TARGETED_LOW_CARB
  const hasPcosOrIr =
    medical.hasPcos === true ||
    rawMedical.hasPcos === true ||
    medical.hasInsulinResistance === true ||
    rawMedical.hasInsulinResistance === true ||
    rawMedical.conditions?.includes("PCOS") ||
    rawMedical.conditions?.includes("INSULIN_RESISTANCE") ||
    (Array.isArray(effectiveRaw?.medical_conditions) && (effectiveRaw.medical_conditions.includes("PCOS") || effectiveRaw.medical_conditions.includes("INSULIN_RESISTANCE"))) ||
    (Array.isArray(medical.conditions) && medical.conditions.some(c => c.conditionCode === "PCOS" || c.conditionCode === "INSULIN_RESISTANCE"));

  if (hasPcosOrIr) {
    return {
      framework: "TARGETED_LOW_CARB",
      reason_ar: "تم اختيار نظام الكارب المنخفض المعتدل تلقائياً (نشويات بطيئة الامتصاص بكميات محسوبة) لتحسين حساسية الإنسولين وتنظيم الهرمونات مع سهولة الالتزام.",
      reason_en: "Targeted Low-Carb auto-selected to optimize insulin sensitivity and hormonal profile.",
    };
  }

  // 3. Busy schedule / Skips Breakfast -> INTERMITTENT_FASTING
  // Post-bariatric clients need frequent small protein-first meals, so fasting is never auto-selected.
  const prefersFasting = !isPostBariatric(effectiveRaw) && (
    readFormFastingProtocol(effectiveRaw) !== null ||
    nutrition.preferredMealCount === 2 ||
    rawNutrition.preferredMealCount === 2 ||
    rawNutrition.skipsBreakfast === true ||
    rawNutrition.prefersFasting === true ||
    lifestyle.dailyRoutine === "BUSY_MORNINGS");

  if (prefersFasting) {
    return {
      framework: "INTERMITTENT_FASTING",
      reason_ar: "تم اختيار الصيام المتقطع الذكي (16/8) تلقائياً ليتوافق مع نمط يومك المزدحم وتفضيلك لتخطي الإفطار والتمتع بوجبات كبيرة مشبعة.",
      reason_en: "Intermittent Fasting (16/8) auto-selected for lifestyle convenience and satiety control.",
    };
  }

  // 4. Craving history / Binge eating risk -> FLEXIBLE_80_20
  const hasBingeRisk =
    rawNutrition.hasBingeHistory === true ||
    rawNutrition.cravesSweets === true ||
    rawNutrition.strugglesWithDeprivation === true;

  if (hasBingeRisk) {
    return {
      framework: "FLEXIBLE_80_20",
      reason_ar: "تم اختيار الدايت المرن (80/20) تلقائياً لمنع الحرمان النفسي والسيطرة على نوبات الشره للسكريات مع ضمان عجز السعرات.",
      reason_en: "Flexible Dieting (80/20) auto-selected to prevent dietary fatigue and eliminate cravings.",
    };
  }

  // 5. Advanced athlete with intense training -> CARB_CYCLING
  const isAdvancedTrainee =
    training.experience === "ADVANCED" ||
    effectiveRaw?.training?.experience === "ADVANCED" ||
    effectiveRaw?.experience_level === "ADVANCED" ||
    Number(training.preferredDaysPerWeek) >= 5;

  if (isAdvancedTrainee) {
    return {
      framework: "CARB_CYCLING",
      reason_ar: "تم اختيار تدوير الكاربوهيدرات (Carb Cycling) تلقائياً لتزويدك بأقصى طاقة وجليكوجين في أيام التمرين الشاق وتسريع حرق الدهون في أيام الراحة.",
      reason_en: "Carb Cycling auto-selected to maximize training performance and lean definition.",
    };
  }

  // 6. Default General Baseline -> BALANCED_HIGH_PROTEIN
  return {
    framework: "BALANCED_HIGH_PROTEIN",
    reason_ar: "تم اختيار النظام المتوازن عالي البروتين (Balanced High-Protein) كنظام أساسي مستدام ومضمون النتائج لتوفير أعلى درجات الطاقة وسهولة الالتزام.",
    reason_en: "Balanced High-Protein auto-selected as the proven, sustainable default baseline.",
  };
}

import { evaluateIntake } from "../intake-decision-engine/index.js";
import { buildTrainingMesoCycle } from "../training-engine-v2/index.js";
import { buildCardioEngine } from "../cardio-engine/index.js";
import { evaluateFinalCardioPlan } from "../cardio-plan-preflight/index.js";
import { buildMobilityEngine } from "../mobility-engine/index.js";
import { buildSessionMobilityProtocol } from "../mobility-warmup-engine-v2/index.js";
import { buildNutritionEngine } from "../nutrition-engine/index.js";
import { rebalanceMacrosToTarget } from "../nutrition-engine/build-nutrition-engine.js";
import { sanitizeMealPlan, buildCulinaryRecipeMeals, enforceDiabeticCarbChoice, enforceClinicalSafety, splitOversizedPortions, carbPortionLimit, isDiabeticIntake, diversifyFatSources, buildAllergenContext, trimMealsToTarget, refreshActualMacros, applyCulinaryProteinFallback, isFoodClinicallySafe, splitOversizedProteinPortions, capWholeEggsForCholesterol, ensureLegumeForNoAnimalProtein, renameOmelettesToActualEggs, dropTokenPortions, reconcileDayCaloriesToTarget } from "../nutrition-meal-context-v2/index.js";
import { evaluateCulinaryPreflight } from "../nutrition-plan-preflight/evaluate-culinary-preflight.js";
import { quantizeNutritionPlan } from "../nutrition-serving-quantizer-v2/index.js";
import { adaptIntakePayloadToCanonicalEngine } from "../intake-decision-engine/adapters/intake-adapter.js";
import { applyDislikedNames } from "../intake-decision-engine/adapters/disliked-foods.js";
import { MASTER_ENGINE_V2_VERSION } from "./domain/enums.js";
import { resolveDailySteps, resolveTdeeActivityFactor } from "../steps-source/resolve-daily-steps.js";
import { readAdaptationState } from "../adaptation-engine/diet-break-state.js";
import { normalizeGoal, resolveBodyFat, resolvePrimaryGoal, isMaintenanceGoal } from "../goal-resolution/resolve-primary-goal.js";
import { CLINICAL_GUIDELINES } from "../config/clinical-guidelines.js";
import { analyzeBloodworkBiomarkers } from "../execution-engines/biomarker-engine.js";
// P1-B8: one zones engine — the server uses the same canonical Tanaka
// computation as the frontend (re-exported through cardio-zones-engine).
import { computeZone2Bpm } from "../execution-engines/cardio-zones-engine.js";
import { generatePeriWorkoutNutrientTimingSchedule, calculateCaffeineCutoffWindow } from "../execution-engines/circadian-nutrient-timing-engine.js";
import { isRamadanDay, localDay } from "../execution-engines/fasting-calendar-engine.js";
import {
  calculateTrainingReadiness,
  autoregulateWorkoutSession,
  rescheduleMissedWorkout,
  evaluateCumulativeFatigue
} from "../execution-engines/autoregulated-recovery-engine.js";


function requireObject(value, name) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object.`);
  }
}

// The intake asks for up to two priority muscles; the catalog speaks in muscle codes, and two of the
// choices cover more than one muscle. Anything unrecognised is ignored rather than guessed.
const FOCUS_MUSCLE_CODES = Object.freeze({
  UPPER_CHEST: ["UPPER_CHEST"],
  LATS_WIDTH: ["LATS"],
  SIDE_DELTS: ["SIDE_DELTS"],
  ARMS: ["BICEPS", "TRICEPS"],
  GLUTES_LEGS: ["GLUTES", "QUADS", "HAMSTRINGS"],
});

/**
 * The muscles the client asked to prioritise, as catalog codes for the training engine.
 * focus_muscles is not part of the canonical contract, so it is read from the raw answers
 * (the same way the fasting protocol and the bariatric fields are).
 */
export function resolveFocusMuscleBias(effectiveRaw, canonicalIntake = {}) {
  const picked = Array.isArray(effectiveRaw?.focus_muscles) && effectiveRaw.focus_muscles.length > 0
    ? effectiveRaw.focus_muscles
    : canonicalIntake?.training?.targetFocusMuscles;
  if (!Array.isArray(picked) || picked.length === 0) return null;
  const codes = [];
  for (const choice of picked.slice(0, 2)) {
    for (const muscle of FOCUS_MUSCLE_CODES[String(choice).toUpperCase()] || []) {
      if (!codes.includes(muscle)) codes.push(muscle);
    }
  }
  return codes.length > 0 ? codes : null;
}

function calculateAge(dobString, assessmentDateString) {
  const dob = new Date(dobString);
  const assessDate = new Date(assessmentDateString || new Date().toISOString());
  let age = assessDate.getFullYear() - dob.getFullYear();
  const m = assessDate.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && assessDate.getDate() < dob.getDate())) {
    age--;
  }
  // H5: the real age is returned — a 12-year-old is 12, never rewritten to 16.
  // Only the 100 upper sanity bound stays (validation already refuses a future
  // date of birth, so a negative age cannot arrive through the validated path).
  return Math.min(100, age);
}

/**
 * S2-1 (Option A1): the universal targets are the plan of record. A generated
 * program must not carry two headline prescriptions, so the pipeline stages'
 * headline numbers are unified from the universal targets, in both the
 * pipeline key shape (target_calories, nested target_g) and the flat key
 * shape live consumers read (target_calories_kcal, protein_g, ...).
 *
 * Deliberately preserved, not overwritten:
 * - The pipeline's own estimate stays as diagnostics: estimated_maintenance_kcal
 *   and calculation_method still describe the NASEM EER computation, and the
 *   protein factor/reference-weight fields still describe the pipeline's
 *   derivation. The recomputed calories/percent fields describe the unified
 *   numbers, so the stage stays arithmetically self-consistent.
 * - A WITHHELD stage is returned untouched: withholding is the pipeline's
 *   safety posture for medical-review/blocked intakes, and un-withholding it
 *   here would publish numbers the pipeline deliberately withheld.
 * - Every other stage (distribution, portion solver, swaps, preflight, ...)
 *   is returned unchanged. Under A1 the portion solver still runs on pipeline
 *   numbers; no live consumer reads its output.
 * - Stage C: the grams are rebalanced with the pipeline's
 *   rebalanceMacrosToTarget before they are written, so calorie_difference
 *   always lands inside -2..2 (protein unchanged, carbs never raised,
 *   target unchanged). Without this, the wrapper copied raw universal
 *   targets verbatim and a diabetic profile stored +3.
 *
 * Pure: returns a new stages object, never mutates its input.
 */
export function unifyNutritionStageTargets(stages, universalTargets) {
  if (!stages || typeof stages !== "object") return stages;
  const calories = Number(universalTargets?.target_calories ?? universalTargets?.target_calories_kcal ?? 0);
  const protein = Number(universalTargets?.protein_g ?? universalTargets?.total_protein_g ?? 0);
  const carbs = Number(universalTargets?.carb_g ?? universalTargets?.carbohydrate_g ?? universalTargets?.total_carbs_g ?? 0);
  const fat = Number(universalTargets?.fat_g ?? universalTargets?.total_fat_g ?? 0);
  if (!(calories > 0)) return stages;

  const energyTarget = stages.energy_target;
  const macroTargets = stages.macro_targets;
  const fiber = Number(universalTargets?.fiber_g);
  // Stage C: rebalance identically to the pipeline's unifyStageTargets, so
  // the stored stage never carries a calorie_difference outside -2..2.
  // Same hard rules: protein never changes, carbs never increase (this
  // funnel cannot see a clinical carb ceiling in grams), target never
  // changes. Canonical targets are already integers, so normalization is
  // a no-op for them; it only guards fractional grams from other producers.
  const normCalories = Number.isInteger(calories) ? calories : Math.round(calories);
  const normProtein = Number.isInteger(protein) ? protein : Math.ceil(protein);
  const normCarbsIn = Number.isInteger(carbs) ? carbs : Math.round(carbs);
  const normFatIn = Number.isInteger(fat) ? fat : Math.round(fat);
  const { carbs: balancedCarbs, fat: balancedFat } = rebalanceMacrosToTarget(
    normCalories, normProtein, normCarbsIn, normFatIn,
  );
  const macroCaloriesTotal = normProtein * 4 + balancedCarbs * 4 + balancedFat * 9;
  const round1 = (value) => Math.round(value * 10) / 10;

  return {
    ...stages,
    energy_target:
      !energyTarget || energyTarget.status === "WITHHELD"
        ? energyTarget
        : {
            ...energyTarget,
            target_calories: normCalories,
            target_calories_kcal: normCalories,
            calories_kcal: normCalories,
            target_source: "UNIVERSAL_TARGETS",
          },
    macro_targets:
      !macroTargets || macroTargets.status === "WITHHELD"
        ? macroTargets
        : {
            ...macroTargets,
            target_calories: normCalories,
            protein: {
              ...(macroTargets.protein || {}),
              target_g: normProtein,
              calories: normProtein * 4,
              percent_of_calories: round1((normProtein * 4 / normCalories) * 100),
            },
            fat: {
              ...(macroTargets.fat || {}),
              target_g: balancedFat,
              calories: balancedFat * 9,
              percent_of_calories: round1((balancedFat * 9 / normCalories) * 100),
            },
            carbohydrate: {
              ...(macroTargets.carbohydrate || {}),
              target_g: balancedCarbs,
              calories: balancedCarbs * 4,
              percent_of_calories: round1((balancedCarbs * 4 / normCalories) * 100),
            },
            protein_g: normProtein,
            carbohydrate_g: balancedCarbs,
            carb_g: balancedCarbs,
            carbs_g: balancedCarbs,
            fat_g: balancedFat,
            fats_g: balancedFat,
            ...(Number.isFinite(fiber) && fiber > 0 ? { fiber_target_g: fiber } : {}),
            macro_calories_total: macroCaloriesTotal,
            calorie_difference: macroCaloriesTotal - calories,
            target_source: "UNIVERSAL_TARGETS",
          },
  };
}

/**
 * Builds the comprehensive Master Program V2 with multi-week meso-cycles,
 * practical serving quantization, and Zone 2 cardiovascular heart-rate targets.
 *
 * @param {Object} inputs
 * @param {Object} inputs.intake
 * @param {Object} inputs.evaluationContext
 * @param {Object} inputs.nutritionFoodCatalog
 * @param {Object} [inputs.options]
 * @returns {Object}
 */
export function calculateUniversalNutritionTargets(canonicalIntake, evaluationContext = {}, rawIntake = {}, preserved = {}) {
  const effectiveRaw = (rawIntake?.answers && typeof rawIntake.answers === 'object')
    ? { ...rawIntake.answers, ...rawIntake }
    : (rawIntake || {});
  const body = canonicalIntake.body || {};
  const personal = canonicalIntake.personal || canonicalIntake.client || {};
  const goals = canonicalIntake.goals || {};
  const cardio = canonicalIntake.cardio || {};
  const training = canonicalIntake.training || {};
  const nutrition = canonicalIntake.nutrition || {};
  const medical = canonicalIntake.medical || {};
  const rawMedical = effectiveRaw?.medical || {};

  // Strict Physiological Validation: weight and height must be strictly positive and physiologically valid
  const rawWeight = body.weightKg ?? body.weight_kg ?? canonicalIntake.weight_kg ?? effectiveRaw?.weight_kg;
  if (rawWeight === undefined || rawWeight === null || String(rawWeight).trim() === '') {
    throw new RangeError("الوزن مطلوب لبناء خطة التغذية ولم يتم توفيره.");
  }
  const weight = Number(rawWeight);
  if (!Number.isFinite(weight) || weight < 30 || weight > 300) {
    throw new RangeError(`قيمة الوزن غير فسيولوجية (${rawWeight} كجم). يجب أن يتراوح الوزن البشري بين 30 و 300 كجم لبناء خطة التغذية.`);
  }

  const rawHeight = body.heightCm ?? body.height_cm ?? canonicalIntake.height_cm ?? effectiveRaw?.height_cm;
  if (rawHeight === undefined || rawHeight === null || String(rawHeight).trim() === '') {
    throw new RangeError("الطول مطلوب لبناء خطة التغذية ولم يتم توفيره.");
  }
  const height = Number(rawHeight);
  if (!Number.isFinite(height) || height < 120 || height > 250) {
    throw new RangeError(`قيمة الطول غير فسيولوجية (${rawHeight} سم). يجب أن يتراوح الطول البشري بين 120 و 250 سم لبناء خطة التغذية.`);
  }

  // P1-B3: a missing age stops generation — it never silently becomes 28.
  // (Weight/height already throw above; age and sex get the same treatment
  // so a direct master-engine call cannot plan on invented demographics.)
  const ageNum = Number(personal.age);
  const dobValid = typeof personal.dateOfBirth === "string" && /^\d{4}-\d{2}-\d{2}$/.test(personal.dateOfBirth);
  const age = dobValid
    ? calculateAge(personal.dateOfBirth, evaluationContext.assessmentDate)
    : (Number.isFinite(ageNum) && ageNum > 0 ? ageNum : null);
  if (age === null || !Number.isFinite(age)) {
    throw new RangeError("العمر أو تاريخ الميلاد مطلوب لبناء خطة التغذية ولم يتم توفيره.");
  }
  const sexProvided = personal.sex
    ? String(personal.sex).trim()
    : String(personal.gender || personal.client_gender || "").trim();
  if (!sexProvided) {
    throw new RangeError("الجنس مطلوب لبناء خطة التغذية ولم يتم توفيره.");
  }
  const isMale = personal.sex
    ? personal.sex !== "FEMALE"
    : (String(personal.gender || personal.client_gender || "").trim().toUpperCase() !== "FEMALE");
  // The canonical body contract carries only height/weight/waist (and fills a missing waist with an
  // estimate), so body fat and the tape measurements are read from the submitted answers.
  const rawBody = effectiveRaw?.body || {};
  const rawCircumferences = effectiveRaw?.circumferences || {};
  // P1-B2: body fat comes from the shared goal module — the same computation
  // the early decision-time resolution uses, so both resolve the same goal.
  const bodyFat = resolveBodyFat({ body, rawBody, rawCircumferences, effectiveRaw, isMale, height });
  const neck = Number(body.neckCm || body.neck_cm || rawBody.neckCm || rawBody.neck_cm || rawCircumferences.neck_cm) || null;
  const waist = Number(rawBody.waistCm || rawBody.waist_cm || rawCircumferences.waist_cm || effectiveRaw?.waist_cm) || null;
  const hip = Number(body.hipCm || body.hip_cm || rawBody.hipCm || rawBody.hip_cm || rawCircumferences.hips_cm) || null;



  // 1. BMR Calculation (Katch-McArdle if body fat provided, otherwise Mifflin-St Jeor)
  let bmr = 0;
  let bmrFormula = "MIFFLIN_ST_JEOR";
  // A trainee under 18 is not a small adult: the FAO/WHO/UNU (Schofield) equations are the ones
  // written for 10-18 year olds, and the body-fat formulas below are validated on adults only.
  const measurementQuality = String(
    body.measurementQuality || rawBody.measurementQuality || effectiveRaw?.measurement_quality || "HIGH"
  ).toUpperCase();
  const isReliableBodyFat = bodyFat && bodyFat >= 3 && bodyFat <= 60 && measurementQuality !== "LOW";
  const isYoungTrainee = Number.isFinite(age) && age > 0 && age < 18;
  if (isYoungTrainee) {
    bmr = Math.round(isMale ? (17.686 * weight) + 658.2 : (13.384 * weight) + 692.6);
    bmrFormula = "SCHOFIELD_YOUTH";
  } else if (isReliableBodyFat) {
    const lbm = weight * (1 - bodyFat / 100);
    bmr = Math.round(370 + (21.6 * lbm));
    bmrFormula = "KATCH_MCARDLE";
  } else {
    bmr = Math.round(10 * weight + 6.25 * height - 5 * age + (isMale ? 5 : -161));
  }


  // 2. Activity Multiplier based on real daily steps & resistance training
  // P1-B1: one step source — unknown steps stay unknown and take the
  // sedentary floor (1.20) instead of the old silent 6000 — and reported
  // daily activity enters TDEE through the same ladder, taking the higher
  // of the two signals so neither is ignored.
  const stepResolution = resolveDailySteps({
    averageDailySteps: cardio.averageDailySteps ?? cardio.average_daily_steps,
  });
  const trainDays = Number(training.preferredDaysPerWeek || training.preferred_days_per_week) || 3;
  let activityFactor = resolveTdeeActivityFactor({
    steps: stepResolution.value,
    dailyActivity: canonicalIntake.lifestyle?.dailyActivity,
  });
  if (trainDays >= 4 && activityFactor < 1.70) {
    activityFactor = Math.min(1.70, activityFactor + 0.05);
  }

  const tdee = Math.round(bmr * activityFactor);

  // 3. Goal-Driven Calorie Target
  // P1-B2: one shared resolution. The raw answer wins for RECOMP and
  // COACH_DECIDES (the canonical goal can only carry what the adapter
  // preserved); otherwise the canonical goal wins. A missing goal throws —
  // it never silently becomes fat loss.
  const rawGoal = String(effectiveRaw?.goals?.primary ?? effectiveRaw?.primary_goal ?? "").trim().toUpperCase();
  const rawNormalized = normalizeGoal(rawGoal);
  // P1-B2: the early decision-time resolution may already have replaced the
  // canonical goal with the resolved one; requested_primary (set there)
  // carries the ORIGINAL goal so the redirect record below is still built
  // (e.g. bulk -> recomposition) instead of silently vanishing.
  const requestedGoal = (rawNormalized === "BODY_RECOMPOSITION" || rawNormalized === "COACH_DECIDES")
    ? rawNormalized
    : (normalizeGoal(goals.requested_primary) ?? normalizeGoal(goals.primary) ?? rawNormalized);
  const bmiNow = weight / ((height / 100) ** 2);
  const { resolved: primaryGoal, redirect: goalRedirect } = resolvePrimaryGoal({
    goal: requestedGoal, bodyFat, bmi: bmiNow, isMale, isYoungTrainee,
  });
  let targetCalories = tdee;
  let proteinPerKg = 2.0;
  let calorieAdjustmentDesc = "سعرات صيانة (Maintenance)";

  if (primaryGoal === "BODY_RECOMPOSITION") {
    // Recomposition relies on resistance training + high protein near maintenance (Barakat et al. 2020, Strength Cond J).
    targetCalories = Math.round(tdee * 0.90); // 10% Deficit
    proteinPerKg = 2.2;
    calorieAdjustmentDesc = "عجز سعرات بسيط 10% لنزول الدهون مع شد وبناء العضل (حرق دهون مع بناء عضلي) مع بروتين مرتفع";
  } else if (primaryGoal === "FAT_LOSS") {
    targetCalories = Math.round(tdee * 0.80); // 20% Deficit
    proteinPerKg = 2.2; // High protein to spare lean mass
    calorieAdjustmentDesc = "عجز سعرات 20% لحرق الدهون وحماية الكتلة العضلية";
  } else if (primaryGoal === "MUSCLE_GAIN" || primaryGoal === "LEAN_BULK") {
    targetCalories = Math.round(tdee * 1.10); // 10% Surplus (150-250 kcal)
    proteinPerKg = 2.0;
    calorieAdjustmentDesc = "فائض محسوب +10% للبناء العضلي النقي بدون دهون زائدة";
  } else {
    // MAINTENANCE / GENERAL_HEALTH
    targetCalories = tdee;
    proteinPerKg = 1.8;
    calorieAdjustmentDesc = "سعرات صيانة وتثبيت الوزن مع تحسين اللياقة";
  }

  // Lactation Energy Adjustment (+450 kcal to protect milk supply)
  const isLactating =
    medical.pregnancyStatus === "BREASTFEEDING" ||
    medical.isLactating === true ||
    personal.isLactating === true ||
    goals.isLactating === true ||
    effectiveRaw?.personal?.isLactating === true ||
    effectiveRaw?.goals?.isLactating === true ||
    effectiveRaw?.medical?.pregnancyStatus === "BREASTFEEDING" ||
    effectiveRaw?.medical?.isLactating === true ||
    effectiveRaw?.isLactating === true ||
    effectiveRaw?.nutrition?.isLactating === true ||
    effectiveRaw?.female_pregnancy === "BREASTFEEDING";

  if (isLactating) {
    targetCalories += 450;
    calorieAdjustmentDesc = "خطة خسارة دهون تدريجية للمرضعات (+450 سعرة حرارية مضافة لحماية إدرار حليب الأم والوقاية من جفاف الرضاعة)";
  }

  // A growing body is never put in a calorie deficit: a young trainee's plan starts at maintenance,
  // and the weight settles as he grows into it. Building muscle keeps its small surplus.
  let youngTraineeMaintenanceApplied = false;
  if (isYoungTrainee && targetCalories < tdee) {
    targetCalories = Math.round(tdee);
    youngTraineeMaintenanceApplied = true;
    calorieAdjustmentDesc = "سعرات الاحتياج اليومي كاملة (متدرب تحت 18 سنة: ممنوع أي عجز حراري على جسم في مرحلة نمو)";
  }

  // Calorie floor invariance (Stage 3, Option A): floor absolute and unbreakable —
  // 1200 kcal female / 1500 kcal male. No sub-floor calorie override exists.
  const calorieFloor = isMale ? 1500 : 1200;
  let calorieFloorApplied = false;
  if (targetCalories < calorieFloor) {
    targetCalories = calorieFloor;
    calorieFloorApplied = true;
    calorieAdjustmentDesc += ` (تم رفع السعرات للحد الأدنى الفسيولوجي المطلق ${targetCalories} سعرة)`;
  }

  // P1-B2: the goal target the balance below is measured against, captured
  // after lactation, young-trainee, and floor adjustments — the energy the
  // client was actually promised.
  let goalTargetCalories = targetCalories;

  // Protein reference weight: grams per kg of total weight overshoot in people carrying a lot of fat
  // mass (a 140 kg client would get ~310 g/day). Use the weight this lean mass would have at a healthy
  // body fat (15% men / 25% women) when body fat is known, otherwise the dietetic adjusted body weight
  // (weight at BMI 25 + 25% of the excess) for BMI >= 30.
  const heightM = height / 100;
  let referenceWeight = weight;
  let referenceWeightBasis = "TOTAL_BODY_WEIGHT";
  if (bodyFat && bodyFat > (isMale ? 20 : 30)) {
    const leanMass = weight * (1 - bodyFat / 100);
    referenceWeight = Math.min(weight, leanMass / (1 - (isMale ? 0.15 : 0.25)));
    referenceWeightBasis = "LEAN_MASS_AT_HEALTHY_BODY_FAT";
  } else if (!bodyFat && weight / (heightM * heightM) >= 30) {
    const weightAtBmi25 = 25 * heightM * heightM;
    referenceWeight = weightAtBmi25 + 0.25 * (weight - weightAtBmi25);
    referenceWeightBasis = "ADJUSTED_BODY_WEIGHT";
  }
  referenceWeight = Math.round(referenceWeight * 10) / 10;

  // Clinical Guard: Kidney Disease & Renal Impairment Protein Cap (KDOQI Guideline)
  const conditionsList = [
    ...(Array.isArray(medical.conditions) ? medical.conditions : []),
    ...(Array.isArray(rawMedical.conditions) ? rawMedical.conditions : []),
    ...(Array.isArray(effectiveRaw?.medical_conditions) ? effectiveRaw.medical_conditions : [])
  ].map(c => typeof c === 'string' ? c.toUpperCase() : String(c?.conditionCode || c?.code || '').toUpperCase());

  // Declared kidney disease is outside the service: the plan is refused before the engine runs
  // (src/api/services/serviceScope.js), so the engine no longer carries a case it never builds -
  // the KDOQI energy ceiling, the potassium reading and the protein cap for a declared diagnosis.
  // What stays below is the protein cap the laboratory asks for, which belongs to a client we do
  // follow: normal history, kidney function off in the bloodwork.

  const hasLiverCondition =
    medical.hasLiverCondition === true ||
    conditionsList.some(c => c.includes("LIVER") || c.includes("HEPATIC"));

  let kidneyProteinCapped = false;

  // Clinical Guard: Laboratory Bloodwork Biomarkers Integration
  const rawBiomarkers = {
    ...(canonicalIntake.biomarkers || {}),
    ...(canonicalIntake.baseline_biomarkers || {}),
    ...(medical.biomarkers || {}),
    ...(medical.baseline_biomarkers || {}),
    ...(rawMedical.biomarkers || {}),
    ...(rawMedical.baseline_biomarkers || {}),
    ...(effectiveRaw?.biomarkers || {}),
    ...(effectiveRaw?.baseline_biomarkers || {}),
    ...(effectiveRaw?.bloodwork || {}),
  };

  const biomarkerAnalysis = analyzeBloodworkBiomarkers({
    body_weight_kg: weight,
    gender: isMale ? 'MALE' : 'FEMALE',
    ...rawBiomarkers
  });

  if (biomarkerAnalysis.has_biomarker_flags) {
    if (biomarkerAnalysis.dietary_modifications?.protein_cap_g_per_kg) {
      const cap = biomarkerAnalysis.dietary_modifications.protein_cap_g_per_kg;
      if (proteinPerKg > cap) {
        proteinPerKg = cap;
        kidneyProteinCapped = true;
        calorieAdjustmentDesc += ` (حظر وتحديد سقف البروتين عند ${cap} جم/كجم بناءً على الفحوصات المخبرية ووظائف الكلى)`;
      }
    }
  }

  // H8: at 65+ the protein rate is capped at 1.6 g/kg while kidney function
  // is unknown. The 2.2 g/kg deficit rate left an 85-year-old at 154 g
  // protein and 52 g carbs a day — near-ketogenic at the 1200 kcal floor.
  // A bloodwork cap still wins when it is lower. The cap is recorded in
  // clinical_guardrails and flagged in the decision
  // (ELDERLY_PROTEIN_KIDNEY_CHECK); it is a population rate change, never
  // a silent cut.
  let elderlyProteinCapped = false;
  if (Number.isFinite(age) && age >= 65 && proteinPerKg > 1.6) {
    proteinPerKg = 1.6;
    elderlyProteinCapped = true;
    calorieAdjustmentDesc += " (تم تحديد البروتين عند 1.6 جم/كجم لأن وظائف الكلى غير معروفة في السن ده — راجع الكلى قبل ما ترفع البروتين)";
  }

  // H8: hypertension gets a sodium limit in the plan, not just in the
  // guidance text. 2300 mg/day (AHA 2021) lands in the biomarker
  // modifications the plate reads, and in clinical_guardrails next to the
  // heart note. A bloodwork sodium limit still wins when one exists.
  const hasHypertension =
    conditionsList.some((c) => c.includes("HYPERTENSION") || c.includes("HIGH_BLOOD_PRESSURE"));
  if (hasHypertension && biomarkerAnalysis.dietary_modifications?.sodium_limit_mg == null) {
    biomarkerAnalysis.dietary_modifications = {
      ...(biomarkerAnalysis.dietary_modifications || {}),
      sodium_limit_mg: 2300,
    };
  }

  // Clinical Guard: Diabetes & Insulin Resistance Hypoglycemia Protection (ADA Guidelines)
  const hasDiabetesOrInsulinResistance =
    medical.hasDiabetes === true ||
    medical.hasInsulinResistance === true ||
    effectiveRaw?.medical?.hasDiabetes === true ||
    effectiveRaw?.medical?.hasInsulinResistance === true ||
    conditionsList.some(c => c.includes("DIABETES") || c.includes("INSULIN_RESISTANCE")) ||
    (biomarkerAnalysis.has_biomarker_flags && biomarkerAnalysis.flags.some(f => f.biomarker === 'GLUCOSE_METABOLISM'));

  // H1 (CB4): a regeneration must not discard adaptation history. When a
  // preserved adaptation state is supplied, the target is rebuilt from the
  // adapted target (formula + incremental offset), or from the stored
  // maintenance target while a diet break is ACTIVE — never from the plain
  // formula deficit, which produced the overnight -1000...-2200 kcal
  // sawtooth. The adjustment happens HERE, before the macro split, so
  // every derived config (carb cycling, weekend refeed, reverse diet,
  // flexible 80/20, meal distribution) is computed from the same target.
  {
    const preservedState = (preserved && typeof preserved === "object")
      ? (preserved.adaptation_state || preserved)
      : {};
    const preservedBreak = (preservedState && preservedState.diet_break) || {};
    let regeneratedTarget = null;
    if (preservedBreak.status === "ACTIVE" && Number.isFinite(preservedBreak.maintenance_calories_kcal)) {
      regeneratedTarget = Math.round(preservedBreak.maintenance_calories_kcal);
    } else if (Number.isFinite(preservedState.calorie_offset_kcal) && preservedState.calorie_offset_kcal !== 0) {
      regeneratedTarget = Math.round(targetCalories + preservedState.calorie_offset_kcal);
    }
    if (regeneratedTarget !== null) {
      const regenCeiling = Math.round(55 * referenceWeight);
      regeneratedTarget = Math.max(calorieFloor, Math.min(regenCeiling, regeneratedTarget));
      if (primaryGoal === "FAT_LOSS" || primaryGoal === "BODY_RECOMPOSITION") {
        regeneratedTarget = Math.min(regeneratedTarget, Math.round(tdee));
      } else if (primaryGoal === "MUSCLE_GAIN" || primaryGoal === "LEAN_BULK") {
        regeneratedTarget = Math.max(regeneratedTarget, Math.round(tdee));
      }
      if (regeneratedTarget !== targetCalories) {
        calorieAdjustmentDesc += ` (تم الحفاظ على السعرات المعدلة من المتابعات السابقة: ${regeneratedTarget} سعرة بدلاً من ${targetCalories} سعرة من المعادلة)`;
        targetCalories = regeneratedTarget;
        goalTargetCalories = targetCalories;
      }
    }
  }

  // 4. Macro Grams Breakdown
  let proteinG = Math.round(referenceWeight * proteinPerKg);
  // A protein cap from the bloodwork plus what breastfeeding costs, not the cap alone (a
  // breastfeeding 42 kg client got 34 g a day).
  if (kidneyProteinCapped && isLactating) {
    proteinG += CLINICAL_GUIDELINES.LAB_PROTEIN_CAP.LACTATION_EXTRA_PROTEIN_G;
  }
  const proteinKcal = proteinG * 4;

  const fatKcal = Math.round(targetCalories * 0.22); // 22% of total calories
  const minFatG = Math.round(weight * 0.6); // Minimum 0.6g/kg
  let fatG = Math.max(minFatG, Math.round(fatKcal / 9));

  const carbKcal = Math.max(0, targetCalories - proteinKcal - (fatG * 9));
  let carbG = Math.round(carbKcal / 4);

  // Clinical Guard: Diabetes & Insulin Resistance Hypoglycemia Protection (ADA Guidelines)
  // ADA Standards of Care: Carbohydrate distribution is individualized; no universal 45% mandatory ceiling.
    const INSULIN_SECRETAGOGUE_KEYS = [
    "AMARYL", "GLIMEPIRIDE", "أماريل", "جليميبيريد",
    "DIAMICRON", "GLICLAZIDE", "دياميكرون", "جليكلازيد",
    "DAONIL", "GLIBENCLAMIDE", "داونيل",
    "MINIDIAB", "GLIPIZIDE", "مينيدياب",
    "NOVONORM", "REPAGLINIDE", "نوفونورم"
  ];
  const allMedsTextMaster = [
    ...(medical?.medications || []),
    ...(rawMedical?.medications || []),
    ...(effectiveRaw?.medical?.medications || []),
    ...(effectiveRaw?.current_meds_supplements_list || []),
    String(effectiveRaw?.medical_conditions?.diabetes?.medication || ""),
    String(effectiveRaw?.current_meds_supplements || "")
  ].join(" ").toUpperCase();
  const takesSecretagogue = INSULIN_SECRETAGOGUE_KEYS.some(k => allMedsTextMaster.includes(k));
  const isType1Diabetic = conditionsList.some(c => c.includes("TYPE_1_DIABETES")) ||
    effectiveRaw?.medical_conditions?.diabetes?.type === 'type1';
  const isInsulinDependent = isType1Diabetic ||
    effectiveRaw?.medical_conditions?.diabetes?.uses_insulin === true ||
    conditionsList.some(c => c.includes("INSULIN_DEPENDENT"));
  let diabeticCarbCapped = false;
  if (hasDiabetesOrInsulinResistance) {
    const carbLimitShare = CLINICAL_GUIDELINES.DIABETES.MAX_CARB_ENERGY_SHARE || CLINICAL_GUIDELINES.DIABETES.REFERENCE_CARB_ENERGY_SHARE || 0.45;
    const maxCarbG = Math.floor((targetCalories * carbLimitShare) / 4);
    if (carbG > maxCarbG) {
      fatG += Math.round(((carbG - maxCarbG) * 4) / 9);
      carbG = maxCarbG;
      diabeticCarbCapped = true;
    }
  }

  // Balance of the day: fat within the adult range (IOM DRI 2005, AMDR fat 20-35% of energy). The
  // diabetic ceiling above (and a kidney protein cap) used to push every leftover calorie into fat -
  // 46% of energy, 40-50 g of olive oil a meal. Above the range: without diabetes carbohydrate takes
  // the energy back; with diabetes protein takes it where the kidneys allow (up to 2.2 g/kg), then
  // energy comes down (kidney disease: not below KDOQI 25 kcal/kg), and only then carbohydrate
  // passes the 45% ceiling - each step told to the coach.
  const maxFatShare = CLINICAL_GUIDELINES.NUTRITION_BALANCE.MAX_FAT_ENERGY_SHARE;
  const fatCeilingG = () => Math.floor((maxFatShare * targetCalories) / 9);
  const balanceSteps = [];
  if (fatG > fatCeilingG()) {
    if (!hasDiabetesOrInsulinResistance) {
      carbG += Math.round(((fatG - fatCeilingG()) * 9) / 4);
      fatG = fatCeilingG();
      balanceSteps.push("CARBS");
    } else {
      if (!kidneyProteinCapped) {
        const maxProteinG = Math.round(referenceWeight * CLINICAL_GUIDELINES.NUTRITION_BALANCE.MAX_PROTEIN_PER_KG);
        const addProteinG = Math.min(Math.max(0, maxProteinG - proteinG), Math.ceil(((fatG - fatCeilingG()) * 9) / 4));
        if (addProteinG > 0) {
          proteinG += addProteinG;
          fatG -= Math.round((addProteinG * 4) / 9);
          balanceSteps.push("PROTEIN");
        }
      }
      // Energy only comes down for someone who can afford it: never while breastfeeding, never below
      // the safety floor or the KDOQI minimum, and below maintenance only when overweight (BMI 25+).
      if (fatG > fatCeilingG() && !isLactating) {
        const carbCap = CLINICAL_GUIDELINES.DIABETES.REFERENCE_CARB_ENERGY_SHARE || 0.45;
        const energyFloor = Math.max(
          calorieFloor,
          weight / (heightM * heightM) < 25 ? Math.min(tdee, targetCalories) : 0,
        );
        const balancedEnergy = Math.round((proteinG * 4) / (1 - maxFatShare - carbCap));
        const nextEnergy = Math.min(targetCalories, Math.max(energyFloor, balancedEnergy));
        if (nextEnergy < targetCalories) {
          targetCalories = nextEnergy;
          carbG = Math.floor((targetCalories * carbCap) / 4);
          fatG = Math.round((targetCalories - proteinG * 4 - carbG * 4) / 9);
          balanceSteps.push("ENERGY");
        }
      }
      if (fatG > fatCeilingG()) {
        carbG += Math.round(((fatG - fatCeilingG()) * 9) / 4);
        fatG = fatCeilingG();
        balanceSteps.push("CARBS_ABOVE_DIABETIC_CEILING");
      }
    }
    targetCalories = proteinG * 4 + carbG * 4 + fatG * 9;
  }
  // P1-B2 (Q17): a maintenance-type goal whose balance cut more than 10%
  // under its goal target is refused, never delivered as maintenance. The
  // ENERGY step above can drag a maintenance client deep into deficit (the
  // audited case cut 32%); the coach must resolve the goal or the clinical
  // limits instead of approving a deficit wearing a maintenance label.
  if (isMaintenanceGoal(primaryGoal) && targetCalories < Math.round(goalTargetCalories * 0.90)) {
    const cutPct = Math.round((1 - targetCalories / goalTargetCalories) * 100);
    throw new RangeError(`خطة الصيانة رُفضت ولم تُسلَّم: الموازنة كانت ستنزل السعرات من ${goalTargetCalories} إلى ${targetCalories} سعرة (عجز ${cutPct}%) تحت هدف الصيانة، والحد المسموح 10%. راجع الهدف أو الحدود السريرية مع العميل قبل إعادة البناء.`);
  }
  // Built when the targets are returned: the PCOS lower-carb below may add its own steps.
  const energyBalanceNoteAr = () => balanceSteps.length === 0 ? null : [
    `توازن اليوم: الدهون اتحددت بـ ${Math.round(maxFatShare * 100)}% من السعرات كحد أعلى (المدى الطبيعي للبالغين 20-35%)`,
    balanceSteps.includes("PROTEIN") ? `البروتين اتزود لـ ${proteinG} جم` : null,
    balanceSteps.includes("ENERGY") ? `السعرات نزلت لـ ${targetCalories} سعرة بدل ما تتحول دهون` : null,
    balanceSteps.includes("CARBS") ? "الباقي راح للنشويات" : null,
    balanceSteps.includes("CARBS_ABOVE_DIABETIC_CEILING")
      ? `النشويات ${Math.round((carbG * 400) / targetCalories)}% فوق سقف السكر 45% لأن البروتين محدود للكلى؛ من المصادر بطيئة الامتصاص، راجعها مع الطبيب`
      : null,
  ].filter(Boolean).join("؛ ") + ".";

  // H8: the carbohydrate floor. A deficit split must never collapse to
  // near-ketogenic by arithmetic: at the 1200 kcal floor an elderly
  // client landed on 52 g carbs a day (17%). Carbs stay at least 30% of
  // energy by moving fat calories to carbs, bounded by fat's 0.6 g/kg
  // minimum — the floor can be short only when fat is already at its own
  // floor, never by silence. The PCOS/low-carb caps sit at 30% too, so
  // this guard and those caps agree.
  let carbFloor30Applied = false;
  {
    const minCarbG = Math.floor((targetCalories * 0.3) / 4);
    if (carbG < minCarbG) {
      const moveKcal = Math.min((minCarbG - carbG) * 4, Math.max(0, (fatG - minFatG) * 9));
      const moveCarbG = Math.floor(moveKcal / 4);
      if (moveCarbG > 0) {
        carbG += moveCarbG;
        fatG -= Math.round((moveCarbG * 4) / 9);
        carbFloor30Applied = true;
        balanceSteps.push("CARB_FLOOR_30");
      }
    }
  }

  // 5. Diet Framework Resolution
  const rawDietChoice = (
    nutrition.dietFramework ||
    nutrition.diet_framework ||
    effectiveRaw?.nutrition?.dietFramework ||
    effectiveRaw?.dietFramework ||
    "BALANCED_HIGH_PROTEIN"
  ).toUpperCase();

  let resolvedFrameworkObj = resolveOptimalDietFramework(canonicalIntake, effectiveRaw);
  let dietFramework = resolvedFrameworkObj.framework;

  let dietFrameworkConflict = null;

  if (
    rawDietChoice !== "AUTO_COACH_MATCH" &&
    rawDietChoice !== "AUTO" &&
    rawDietChoice !== "SMART_COACH_RECOMMENDATION" &&
    rawDietChoice !== "BALANCED_HIGH_PROTEIN" &&
    rawDietChoice !== ""
  ) {
    // S2-5: Safety gates for explicit manual diet framework choice against hard clinical constraints
    const isDiabeticContraindication =
      (isType1Diabetic || isInsulinDependent) &&
      (rawDietChoice === "INTERMITTENT_FASTING" ||
       rawDietChoice === "KETOGENIC" ||
       rawDietChoice === "VERY_LOW_CARB");

    const hasKidneyContraindication =
      (kidneyProteinCapped || conditionsList.some(c => c.includes("KIDNEY") || c.includes("RENAL"))) &&
      (rawDietChoice === "HIGH_PROTEIN" || rawDietChoice === "CARB_CYCLING");

    const isBariatricContraindication =
      isPostBariatric(effectiveRaw) &&
      rawDietChoice === "INTERMITTENT_FASTING";

    if (isDiabeticContraindication) {
      dietFrameworkConflict = {
        rejected_choice: rawDietChoice,
        safe_fallback: resolvedFrameworkObj.framework,
        coach_review_required: true,
        reason: "CLINICAL_CONTRAINDICATION_DIABETES",
        reason_ar: `المتدرب اختار نظام (${rawDietChoice}) يدوياً، وهو يتعارض مع أمان السكري من النوع الأول أو المعتمد على الإنسولين لمنع نوبات هبوط السكر الحادة. تم اعتماد النظام الآمن (${resolvedFrameworkObj.framework}) وتنبيه الكوتش للمراجعة.`,
      };
      dietFramework = resolvedFrameworkObj.framework;
    } else if (hasKidneyContraindication) {
      dietFrameworkConflict = {
        rejected_choice: rawDietChoice,
        safe_fallback: resolvedFrameworkObj.framework,
        coach_review_required: true,
        reason: "CLINICAL_CONTRAINDICATION_KIDNEY",
        reason_ar: `المتدرب اختار نظام (${rawDietChoice}) يدوياً، وهو يتعارض مع قيود وظائف الكلى وسقف البروتين. تم اعتماد النظام الآمن (${resolvedFrameworkObj.framework}) وتنبيه الكوتش للمراجعة.`,
      };
      dietFramework = resolvedFrameworkObj.framework;
    } else if (isBariatricContraindication) {
      dietFrameworkConflict = {
        rejected_choice: rawDietChoice,
        safe_fallback: resolvedFrameworkObj.framework,
        coach_review_required: true,
        reason: "CLINICAL_CONTRAINDICATION_BARIATRIC",
        reason_ar: `المتدرب اختار نظام الصيام المتقطع (${rawDietChoice}) يدوياً، وهو يتعارض مع جراحات السمنة (تكميم/تحويل مسار). تم اعتماد النظام الآمن (${resolvedFrameworkObj.framework}) وتنبيه الكوتش للمراجعة.`,
      };
      dietFramework = resolvedFrameworkObj.framework;
    } else {
      dietFramework = rawDietChoice;
    }
  }


  let carbCyclingConfig = null;
  let fastingWindowConfig = null;
  let flexible8020Config = null;
  let lowCarbConfig = null;
  let weekendRefeedConfig = null;
  let reverseDietConfig = null;
  let lowFodmapConfig = null;
  let mediterraneanConfig = null;

  // Framework Specific Macro Adjustments
  if (dietFramework === "TARGETED_LOW_CARB") {
    // Moderate lower-carb for PCOS / insulin resistance: about 30% of energy from slow carbohydrates,
    // never under 100 g. The benefit comes from the energy deficit and the carbohydrate quality; a
    // ketogenic 40 g adds nothing for insulin sensitivity over this and few people sustain it.
    carbG = Math.min(carbG, Math.max(100, Math.round((targetCalories * 0.3) / 4)));
    const lowCarbRemainingKcal = Math.max(minFatG * 9, targetCalories - proteinG * 4 - carbG * 4);
    fatG = Math.round(lowCarbRemainingKcal / 9);
    // The same balance as above: the lower carbohydrate must not become more than 35% fat (a kidney
    // protein cap left 65%). Protein takes it where the kidneys allow, then carbohydrate comes back
    // up; the international PCOS guideline (Teede et al. 2023) favours no diet type over another.
    if (fatG > fatCeilingG()) {
      if (!kidneyProteinCapped) {
        const maxProteinG = Math.round(referenceWeight * CLINICAL_GUIDELINES.NUTRITION_BALANCE.MAX_PROTEIN_PER_KG);
        const addProteinG = Math.min(Math.max(0, maxProteinG - proteinG), Math.ceil(((fatG - fatCeilingG()) * 9) / 4));
        if (addProteinG > 0) {
          proteinG += addProteinG;
          fatG -= Math.round((addProteinG * 4) / 9);
          balanceSteps.push("PROTEIN");
        }
      }
      if (fatG > fatCeilingG()) {
        carbG += Math.round(((fatG - fatCeilingG()) * 9) / 4);
        fatG = fatCeilingG();
        balanceSteps.push("CARBS");
      }
    }
    lowCarbConfig = Object.freeze({
      framework: "TARGETED_LOW_CARB",
      framework_name_ar: "نظام الكارب المنخفض المعتدل (Moderate Low-Carb)",
      net_carbs_target_g: carbG,
      fat_ratio_percent: Math.round((fatG * 9 / targetCalories) * 100),
      carb_timing_ar: `${carbG} جم كاربوهيدرات يومياً من مصادر بطيئة الامتصاص، والجزء الأكبر منها في الوجبة قبل التمرين وبعده.`,
      excluded_foods_ar: "السكريات والعصائر والمخبوزات البيضاء؛ النشويات مسموحة من الشوفان والخبز الأسمر والأرز البسمتي والبقوليات بالكميات المحددة.",
    });
  } else if (dietFramework === "FLEXIBLE_80_20") {
    const cleanKcal = Math.round(targetCalories * 0.80);
    const flexibleKcal = targetCalories - cleanKcal;
    const flexibleCarbG = Math.round((flexibleKcal * 0.60) / 4);
    const flexibleFatG = Math.round((flexibleKcal * 0.40) / 9);
    flexible8020Config = Object.freeze({
      framework: "FLEXIBLE_80_20",
      framework_name_ar: "الدايت المرن وقاعدة 80/20 (IIFYM)",
      clean_calories_kcal: cleanKcal,
      flexible_calories_kcal: flexibleKcal,
      flexible_carbs_g: flexibleCarbG,
      flexible_fat_g: flexibleFatG,
      min_fiber_g: 25,
      guidance_ar: "80% من السعرات مخصصة للأطعمة النظيفة، و 20% مخصصة كحصة مرنة لصنف مفضل (شوكولاتة داكنة، آيس كريم محسوب) مخصومة من كارب ودهون اليوم دون المساس بالبروتين والألياف.",
    });
  } else if (dietFramework === "WEEKEND_REFEED_2DAYS") {
    weekendRefeedConfig = Object.freeze({
      framework: "WEEKEND_REFEED_2DAYS",
      framework_name_ar: "نظام الريفيد الموجه ليومين نهاية الأسبوع (2-Day Weekend Refeed)",
      // 5 lower days + 2 maintenance days must average the daily target, or the weekly deficit shrinks.
      weekday_deficit_calories_kcal: Math.max(calorieFloor, Math.round((7 * targetCalories - 2 * tdee) / 5)),
      weekend_refeed_calories_kcal: Math.min(tdee, Math.round((7 * targetCalories - 5 * Math.max(calorieFloor, Math.round((7 * targetCalories - 2 * tdee) / 5))) / 2)),
      refeed_carbs_increase_g: 85,
      refeed_days_ar: "الجمعة والسبت (رفع السعرات لحد الصيانة بزيادة الكارب النظيف وخفض الدهون 10%)",
      weekly_energy_balance_ar: "عجز أسبوعي صافي مضمون مع ملء مخازن الجليكوجين وتحسين الأداء.",
    });
  } else if (dietFramework === "REVERSE_DIETING") {
    reverseDietConfig = Object.freeze({
      framework: "REVERSE_DIETING",
      framework_name_ar: "محرك الدايت العكسي (Reverse Dieting Engine)",
      initial_calories_kcal: targetCalories,
      weekly_increment_kcal: 75,
      weekly_increment_carbs_g: 18,
      stabilization_rule_ar: "إذا زاد الوزن بأكثر من 0.5 كجم في أسبوع المتابعة، يتم تثبيت السعرات أسبوعاً إضافياً قبل استئناف الرفع.",
    });
  } else if (dietFramework === "LOW_FODMAP") {
    lowFodmapConfig = Object.freeze({
      framework: "LOW_FODMAP",
      framework_name_ar: "بروتوكول القولون العصبي وعزل الانتفاخات (Low-FODMAP)",
      excluded_fermentable_foods_ar: "استبعاد تلقائي لمهيجات القولون: الثوم، البصل، البقوليات غير المنقوعة، القمح/الجلوتين، اللاكتوز، التفاح، والمحليات الصناعية.",
      safe_carb_sources_ar: "الاعتماد على النشويات المريحة للأمعاء: الأرز الأبيض والبسمتي، البطاطس، الشوفان الخالي من الجلوتين، الفراولة، والكوسة.",
    });
  } else if (dietFramework === "MEDITERRANEAN_HEALTH") {
    mediterraneanConfig = Object.freeze({
      framework: "MEDITERRANEAN_HEALTH",
      framework_name_ar: "دايت البحر الأبيض المتوسط لصحة القلب والدهون الثلاثية (Cardio-Protective)",
      healthy_fats_ratio_percent: 38,
      saturated_fat_cap_percent: 7,
      red_meat_cap_ar: "حصر اللحوم الحمراء في وجبة واحدة فقط أسبوعياً.",
      fatty_fish_frequency_ar: "إدراج الأسماك الغنية بالأوميجا 3 (سلمون، تونة، بوري، كنعد) من 2 إلى 3 مرات أسبوعياً مع زيت الزيتون والمكسرات النيئة.",
    });
  } else if (dietFramework === "CARB_CYCLING") {
    const carbCycleHighDays = Math.min(6, Math.max(1, Math.round(trainDays)));
    const carbCycleLowDays = 7 - carbCycleHighDays;
    // Low days drop up to 45 g carbs but never below 50 g.
    const carbCycleLowShiftG = Math.max(0, Math.min(45, carbG - 50));
    const carbCycleHighShiftG = Math.round((carbCycleLowShiftG * carbCycleLowDays) / carbCycleHighDays);
    // High days give back fat only down to the 0.6 g/kg floor; low days gain exactly what high days gave.
    const carbCycleHighFatShiftG = Math.min(
      Math.max(0, fatG - minFatG),
      Math.round((5 * carbCycleLowDays) / carbCycleHighDays),
    );
    const carbCycleLowFatShiftG = carbCycleLowDays > 0
      ? Math.round((carbCycleHighFatShiftG * carbCycleHighDays) / carbCycleLowDays)
      : 0;
    carbCyclingConfig = Object.freeze({
      framework: "CARB_CYCLING",
      framework_name_ar: "نظام تدوير الكاربوهيدرات الذكي (Carb Cycling)",
      high_carb_days_ar: "أيام تمرين العضلات الكبيرة (الأرجل / الظهر / الصدر)",
      low_carb_days_ar: "أيام الراحة والاستشفاء / الكارديو الخفيف",
      // Training days are high, the rest low; the carb and fat shifts are sized by the day counts so
      // the weekly average equals the daily target, and each day's calories are derived from its macros.
      high_carb_days_per_week: carbCycleHighDays,
      low_carb_days_per_week: 7 - carbCycleHighDays,
      high_carb_targets: Object.freeze({
        calories_kcal: proteinG * 4 + (carbG + carbCycleHighShiftG) * 4 + (fatG - carbCycleHighFatShiftG) * 9,
        protein_g: proteinG,
        carbohydrate_g: carbG + carbCycleHighShiftG,
        fat_g: fatG - carbCycleHighFatShiftG,
      }),
      low_carb_targets: Object.freeze({
        calories_kcal: proteinG * 4 + (carbG - carbCycleLowShiftG) * 4 + (fatG + carbCycleLowFatShiftG) * 9,
        protein_g: proteinG,
        carbohydrate_g: carbG - carbCycleLowShiftG,
        fat_g: fatG + carbCycleLowFatShiftG,
      }),
      weekly_energy_balance_ar: "متوسط السعرات الأسبوعية يطابق تماماً العجز المستهدف مع الاستفادة من قمم الجليكوجين وأكسدة الدهون.",
    });
  } else if (dietFramework === "INTERMITTENT_FASTING") {
    // B3 (Ramadan): a Ramadan fast is dawn-to-sunset, not a 12:00–20:00
    // lifestyle window. Its length changes with the day and the client's
    // location, and the intake carries neither sunset nor a city — so the
    // hours stay null and HELD for the coach instead of inventing an
    // iftar/suhoor clock time. The framework stays INTERMITTENT_FASTING
    // (same meal structure); only the window is Ramadan.
    if (isRamadanFasting(effectiveRaw, evaluationContext)) {
      fastingWindowConfig = Object.freeze({
        framework: "INTERMITTENT_FASTING",
        protocol: "RAMADAN",
        framework_name_ar: "صيام شهر رمضان (Ramadan)",
        fasting_hours: null,
        eating_window_hours: null,
        eating_window_schedule_ar: "نافذة تناول الطعام من الإفطار (وقت غروب الشمس) إلى السحور (قبل الفجر) — لازم الكوتش يحدد مواعيد الإفطار والسحور حسب موقع العميل وتاريخ اليوم، لأن مدة الصيام بتتغير كل يوم.",
        rules_ar: "الصيام من الفجر إلى غروب الشمس بدون أكل أو شرب؛ الإفطار عند الغروب والسحور قبل الفجر، وشرب الماء مسموح طول الليل.",
        held_for_coach_review: true,
        hold_reason_ar: "مواعيد الإفطار والسحور مش محسوبة لأن ملف العميل مفيهوش موقع لحساب وقت الغروب؛ لازم الكوتش يثبتها قبل التسليم.",
      });
    } else {
    const fastingProtocol = readFormFastingProtocol(effectiveRaw) || "16_8";
    fastingWindowConfig = Object.freeze({
      framework: "INTERMITTENT_FASTING",
      protocol: fastingProtocol,
      framework_name_ar: fastingProtocol === "14_10"
        ? "الصيام المتقطع الذكي (14/10 Intermittent Fasting)"
        : "الصيام المتقطع الذكي (16/8 Intermittent Fasting)",
      fasting_hours: fastingProtocol === "14_10" ? 14 : 16,
      eating_window_hours: fastingProtocol === "14_10" ? 10 : 8,
      eating_window_schedule_ar: fastingProtocol === "14_10"
        ? "نافذة تناول الطعام: 10:00 صباحاً إلى 8:00 مساءً (الصيام من 8 مساءً إلى 10 صباح اليوم التالي)"
        : "نافذة تناول الطعام: 12:00 ظهراً إلى 8:00 مساءً (الصيام من 8 مساءً إلى 12 ظهر اليوم التالي)",
      rules_ar: "شرب الماء والقهوة السادة والشاي الأخضر والأعشاب مسموح وحر أثناء ساعات الصيام بدون سكر أو حليب.",
    });
    }
  }

  // P1-B5 (Q16/Q20): clinical macro guardrails, applied AFTER every framework
  // block and BEFORE the meal split, so the plates reflect the final macros.
  // The PCOS 30% carb cap is a guardrail, not a framework feature: a manual
  // framework choice or an IBS-first LOW_FODMAP would otherwise bypass it,
  // and the low-carb branch's own fat-ceiling rebalance can push carbs back
  // above the cap it just applied. The 130 g carb floor for insulin /
  // secretagogue users is hypoglycemia protection: it outranks the cap, and
  // any conflict is flagged rather than hidden.
  const PCOS_CARB_CAP_SHARE = 0.30;
  const INSULIN_CARB_FLOOR_G = 130;
  let pcosCarbCapApplied = false;
  let pcosCapRelaxed = false;
  let pcosFatIncreaseG = 0;
  let pcosCapNoteAr = null;
  let carbFloorApplied = false;
  let pcosCapOverriddenByFloor = false;
  let carbFloorNoteAr = null;
  // Same PCOS / insulin-resistance signals the framework resolver uses
  // (that helper owns its own copy; this function needs one here).
  const hasPcosOrIr = medical.hasPcos === true || rawMedical.hasPcos === true ||
    medical.hasInsulinResistance === true || rawMedical.hasInsulinResistance === true ||
    conditionsList.some((c) => c === "PCOS" || c === "INSULIN_RESISTANCE");
  if (hasPcosOrIr) {
    // The cap never pushes carbs under 100 g: the low-carb branch's own rule
    // (a moderate lower-carb plan, never ketogenic) and its test.
    const pcosCapG = Math.max(100, Math.floor((targetCalories * PCOS_CARB_CAP_SHARE) / 4));
    if (carbG > pcosCapG) {
      const preCapFatG = fatG;
      const excessKcal = (carbG - pcosCapG) * 4;
      carbG = pcosCapG;
      // Displaced energy goes to fat first (reported, Q16), then to protein
      // up to its ceiling.
      const fatRoomG = Math.max(0, fatCeilingG() - fatG);
      const fatGainG = Math.min(fatRoomG, Math.round(excessKcal / 9));
      fatG += fatGainG;
      let remainingKcal = excessKcal - fatGainG * 9;
      if (remainingKcal > 0 && !kidneyProteinCapped) {
        const maxProteinG = Math.round(referenceWeight * CLINICAL_GUIDELINES.NUTRITION_BALANCE.MAX_PROTEIN_PER_KG);
        const proteinGainG = Math.min(Math.max(0, maxProteinG - proteinG), Math.ceil(remainingKcal / 4));
        proteinG += proteinGainG;
        remainingKcal -= proteinGainG * 4;
      }
      pcosCarbCapApplied = true;
      pcosFatIncreaseG = fatG - preCapFatG;
      if (remainingKcal > 0) {
        // Infeasible corner: protein is at its ceiling and fat is at its
        // ceiling, so the displaced energy fits nowhere. The codebase's own
        // tested resolution (macro-balance-fat-share, pcos-moderate-low-carb)
        // lets carbs rise in exactly this corner, up to 40% — but only
        // flagged, never silently. The alternatives would break a harder
        // contract: fat above 35%, energy below the floor, energy cut while
        // breastfeeding, or a maintenance plan cut more than 10% (P1-B2/Q17:
        // that is refused, never delivered as maintenance). So an energy cut
        // happens only when it is safe on all four counts; otherwise the
        // relaxed path below takes over and the energy is preserved.
        const sumAfterCap = proteinG * 4 + carbG * 4 + fatG * 9;
        const energyCutAllowed = !isLactating && sumAfterCap >= calorieFloor &&
          !(isMaintenanceGoal(primaryGoal) && sumAfterCap < Math.round(goalTargetCalories * 0.90));
        if (energyCutAllowed) {
          pcosCapNoteAr = `سقف كارب PCOS اتطبق: الكارب اتحدد بـ ${pcosCapG} جم (30% من السعرات)${pcosFatIncreaseG > 0 ? `، والدهون زادت ${pcosFatIncreaseG} جم لتعويض الطاقة` : ""}، والسعرات نزلت لأن البروتين والدهون وصلوا لسقفهم.`;
        } else {
          // 40% is the hard bound the codebase already blesses for this
          // corner; anything above it is refused by the flag, not delivered.
          const relaxedCapG = Math.floor((targetCalories * 0.40) / 4);
          const restoreG = Math.min(relaxedCapG - carbG, Math.ceil(remainingKcal / 4));
          carbG += Math.max(0, restoreG);
          pcosCapRelaxed = true;
        }
      } else {
        pcosCapNoteAr = `سقف كارب PCOS اتطبق: الكارب اتحدد بـ ${pcosCapG} جم (30% من السعرات)${pcosFatIncreaseG > 0 ? `، والدهون زادت ${pcosFatIncreaseG} جم لتعويض الطاقة` : ""}.`;
      }
      // Fat share is judged against the delivered sum, not the old target:
      // after an energy cut the old ceiling in grams would read above 35%.
      // Trimming fat to the share bound is a no-op whenever the share is
      // already legal, and binding only when it would break 35%.
      const fatShareCapG = Math.floor(((0.35 / 0.65) * (proteinG * 4 + carbG * 4)) / 9);
      fatG = Math.max(minFatG, Math.min(fatG, fatShareCapG));
      pcosFatIncreaseG = fatG - preCapFatG;
      if (pcosCapRelaxed) {
        const deliveredKcal = proteinG * 4 + carbG * 4 + fatG * 9;
        pcosCapNoteAr = `سقف كارب PCOS اترخى لحد 40% (الكارب ${carbG} جم) لأن البروتين وصل لسقفه والدهون وصلت لسقف 35%، وتقليل السعرات مش آمن هنا (رضاعة أو تحت الحد الأدنى). الطاقة المسلمة ${deliveredKcal} سعرة مقابل هدف ${targetCalories} سعرة. الرخاء ده معلم للمراجعة، مش سكوت.`;
      }
    }
  }
  const needsCarbFloor = isType1Diabetic || isInsulinDependent || takesSecretagogue;
  if (needsCarbFloor && carbG < INSULIN_CARB_FLOOR_G) {
    const deficitG = INSULIN_CARB_FLOOR_G - carbG;
    const deficitKcal = deficitG * 4;
    carbG = INSULIN_CARB_FLOOR_G;
    // Take the energy from fat down to its minimum; never cut protein for a
    // hypo floor, and never cut energy below the floor. Any remainder raises
    // the total: more energy is the safe direction here.
    const fatCutG = Math.min(Math.max(0, fatG - minFatG), Math.ceil(deficitKcal / 9));
    fatG -= fatCutG;
    carbFloorApplied = true;
    if (pcosCarbCapApplied) pcosCapOverriddenByFloor = true;
    carbFloorNoteAr = `أرضية كارب ${INSULIN_CARB_FLOOR_G} جم اتطبقت لحماية من هبوط السكر (إنسولين/محفزات إفراز)${pcosCapOverriddenByFloor ? "، وهي فوق سقف كارب PCOS لأن أمان الهبوط أهم" : ""}.`;
  }
  if (pcosCarbCapApplied || carbFloorApplied) {
    // Keep the reported total consistent with the final macros. The
    // maintenance >10% case cannot reach here: the cut condition above
    // already routes it to the relaxed path, so the energy is preserved
    // instead of a deficit wearing a maintenance label (P1-B2/Q17).
    targetCalories = proteinG * 4 + carbG * 4 + fatG * 9;
    if (dietFramework === "TARGETED_LOW_CARB" && lowCarbConfig) {
      lowCarbConfig = Object.freeze({
        ...lowCarbConfig,
        net_carbs_target_g: carbG,
        fat_ratio_percent: Math.round((fatG * 9 / targetCalories) * 100),
      });
    }
  }

  // 5. Meal Distribution (2, 3, 4, 5, 6 Meals)
  const preferredMealCount = Number(nutrition.preferredMealCount || nutrition.mealsPerDay || nutrition.preferred_meal_count) || 3;
  // After sleeve/bypass surgery the stomach holds ~150-250 g per sitting (ASMBS nutrition guideline):
  // at least 5 small meals so the day's protein fits.
  const chosenMealCount = isPostBariatric(effectiveRaw) ? Math.max(5, preferredMealCount) : preferredMealCount;
  // Owner decision: 3200+ kcal on three meals makes very large plates, so a fourth meal is added.
  // Two meals get the same rule (they made plates of 2300+ kcal); below 3200 kcal they stay. The
  // A plate holds about a thousand calories before it stops being a plate: 400 g of a cooked
  // carbohydrate, its protein and its fat. Owner decision: 3200 kcal on three meals already makes
  // plates too big, so a fourth is added - and the same reasoning keeps going, a fifth above 4200
  // and a sixth above 5200. Without them a big day cannot carry its own carbohydrate once the
  // clinical limits hold, and the client is served less than the plan promises.
  const platesForCalories = targetCalories >= 5200 ? 6 : targetCalories >= 4200 ? 5 : targetCalories >= 3200 ? 4 : 0;
  const mealCount = Math.max(chosenMealCount, platesForCalories);
  const mealAddedForCalories = mealCount > chosenMealCount;
  // How a day is shared out. Carbohydrate and fat follow the size of the
  // sitting - a snack is a snack - and a snack of protein with a little
  // carbohydrate is also what keeps a client full between meals.
  // Q28 snack-share redistribution (2026-11-05): protein used to be spread
  // evenly over every sitting, snacks included, while carbohydrate and fat
  // followed the size of the sitting. A 15%-of-calories snack was therefore
  // asked to carry 25% of the day's protein - 45-52 g in a ~365 kcal snack -
  // and the culinary snack overshot its calories by +31-71 kcal in 19 of 20
  // clients, because no snack plate can hold that much protein inside its
  // energy. Protein now follows the same energy weight as carbohydrate and
  // fat (largest remainder, so the day still closes exactly): a snack takes
  // only its own share, and the full meals take the rest. Each full meal
  // still carries roughly 0.4 g/kg a sitting (Moore 2015 / Schoenfeld &
  // Aragon 2018).
  const SNACK_ENERGY_SHARE = { 4: 0.15, 5: 0.14, 6: 0.12 };
  const isSnackMeal = (mealNumber) => mealCount >= 4 && mealNumber > 3;
  // P1-B5: protein is split by largest remainder, not per-meal rounding.
  // Math.round(proteinG / mealCount) per meal drifted the sum away from the
  // daily total (e.g. 154 g over 4 meals came out as 156 g). The earliest
  // meals take the leftover grams; the sum is exact.
  const allocateByLargestRemainder = (total, weights) => {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const allocations = weights.map((weight) =>
      Math.floor(total * weight / totalWeight));
    const remainders = weights.map((weight, index) => ({
      index,
      remainder: total * weight % totalWeight,
    }));
    let remaining = total - allocations.reduce((sum, value) => sum + value, 0);
    remainders.sort(
      (left, right) =>
        right.remainder - left.remainder || left.index - right.index,
    );
    for (let index = 0; index < remaining; index += 1) {
      allocations[remainders[index].index] += 1;
    }
    return allocations;
  };
  const mealRatios = [];
  for (let i = 1; i <= mealCount; i++) {
    let fRatio = 1 / mealCount;
    let cRatio = 1 / mealCount;
    if (mealCount === 3) {
      if (i === 1) cRatio = 0.30;
      else if (i === 2) cRatio = 0.40;
      else cRatio = 0.30;
    } else if (mealCount >= 4) {
      const snackShare = SNACK_ENERGY_SHARE[mealCount] || 0.15;
      const snacks = mealCount - 3;
      cRatio = fRatio = isSnackMeal(i) ? snackShare : (1 - snacks * snackShare) / 3;
    }
    mealRatios.push({ cRatio, fRatio });
  }
  const mealProteinAllocations = allocateByLargestRemainder(
    proteinG,
    mealRatios.map(({ cRatio, fRatio }) => carbG * cRatio * 4 + fatG * fRatio * 9),
  );
  const mealDistribution = [];
  for (let i = 1; i <= mealCount; i++) {
    const { cRatio, fRatio } = mealRatios[i - 1];

    let mealNameAr = `الوجبة ${i}`;
    if (mealCount === 2) {
      mealNameAr = i === 1 ? "الوجبة الأولى (كسر الصيام / إفطار كبير)" : "الوجبة الثانية (الوجبة الرئيسية / السحور أو العشاء)";
    } else if (mealCount === 3) {
      mealNameAr = i === 1 ? "وجبة الإفطار" : i === 2 ? "وجبة قبل التمرين / الغداء" : "وجبة العشاء / بعد التمرين";
    } else if (mealCount >= 4) {
      // The names say what the plate actually is: the kitchen writes breakfast, lunch and dinner
      // first and the snacks after them, and the names used to be shifted against it - meal 2 was
      // called a protein snack and came out as lunch.
      const SNACK_NAMES = ["سناك أول", "سناك تاني", "سناك تالت"];
      mealNameAr = i === 1 ? "وجبة الإفطار" : i === 2 ? "وجبة الغداء" : i === 3 ? "وجبة العشاء" : SNACK_NAMES[i - 4] || `سناك ${i - 3}`;
    }

    mealDistribution.push({
      meal_number: i,
      meal_name_ar: mealNameAr,
      protein_g: mealProteinAllocations[i - 1],
      carb_g: Math.round(carbG * cRatio),
      fat_g: Math.round(fatG * fRatio),
      calories_kcal: Math.round((mealProteinAllocations[i - 1] * 4) + (carbG * cRatio * 4) + (fatG * fRatio * 9)),
    });
  }

  if (!Number.isFinite(targetCalories) || Number.isNaN(targetCalories) || targetCalories < 1000) {
    throw new RangeError(`حساب السعرات المستهدفة غير صالح (${targetCalories}). تم منع توليد الخطة لحماية المتدرب.`);
  }

  return {
    bmr,
    bmr_formula: bmrFormula,
    body_fat_percentage: bodyFat,
    activity_factor: activityFactor,
    tdee,
    target_calories: targetCalories,
    target_calories_kcal: targetCalories,
    total_calories: targetCalories,
    calories_kcal: targetCalories,
    calorie_adjustment_desc: calorieAdjustmentDesc,
    effective_goal: goalRedirect ? goalRedirect.to : null,
    resolved_goal: primaryGoal,
    goal_redirect: goalRedirect,
    protein_g: proteinG,
    total_protein_g: proteinG,
    protein_per_kg: proteinPerKg,
    protein_reference_weight_kg: referenceWeight,
    protein_reference_basis: referenceWeightBasis,
    calorie_floor_applied: calorieFloorApplied,
    carbohydrate_g: carbG,
    carb_g: carbG,
    total_carbs_g: carbG,
    fat_g: fatG,
    total_fat_g: fatG,
    fiber_g: Math.max(isMale ? 35 : 25, biomarkerAnalysis?.dietary_modifications?.min_fiber_g || 0),
    water_liters: Math.max(Number((referenceWeight * 0.040).toFixed(1)), biomarkerAnalysis?.dietary_modifications?.daily_water_target_liters || 0),
    hydration: {
      formula: "(Weight * 0.040) + 0.5L per workout hour",
      rest_day_water_liters: Math.max(Number((referenceWeight * 0.040).toFixed(1)), biomarkerAnalysis?.dietary_modifications?.daily_water_target_liters || 0),
      training_day_water_liters: Math.max(Number((referenceWeight * 0.040 + 0.5).toFixed(1)), (biomarkerAnalysis?.dietary_modifications?.daily_water_target_liters || 0) + 0.5),
      recommended_range_liters: `${Math.max(Number((referenceWeight * 0.040).toFixed(1)), biomarkerAnalysis?.dietary_modifications?.daily_water_target_liters || 0)} - ${Math.max(Number((referenceWeight * 0.040 + 0.5).toFixed(1)), (biomarkerAnalysis?.dietary_modifications?.daily_water_target_liters || 0) + 0.5)} لتر/يوم`,
      guidance_ar: `احتياج السوائل اليومي: ${Math.max(Number((referenceWeight * 0.040).toFixed(1)), biomarkerAnalysis?.dietary_modifications?.daily_water_target_liters || 0)} لتر في أيام الراحة، و ${Math.max(Number((referenceWeight * 0.040 + 0.5).toFixed(1)), (biomarkerAnalysis?.dietary_modifications?.daily_water_target_liters || 0) + 0.5)} لتر في أيام التمرين (+0.5 لتر لتعويض العرق والأملاح أثناء التدريب).`,
    },
    meals_count: mealCount,
    // A high-calorie day on few meals makes very large plates: three meals get a fourth (above);
    // two meals are the client's fasting choice, so the coach is advised rather than the plan changed.
    meal_count_note_ar: mealAddedForCalories && chosenMealCount === 2
      ? `العميل اختار وجبتين، بس ${targetCalories} سعرة على وجبتين بتطلع أطباق ضخمة جداً؛ النظام خلّاها ${mealCount} وجبات (ممكن تتاكل كلها في نفس شباك الأكل لو صايم صيام متقطع). لو العميل مش هيقدر، احذف وجبة من المحرر وهيتوزع أكلها على الباقي.`
      : mealAddedForCalories
      ? `العميل اختار 3 وجبات، بس ${targetCalories} سعرة على 3 وجبات بتطلع أطباق كبيرة؛ النظام زوّد وجبة رابعة. لو العميل مش هيقدر، احذف الوجبة الرابعة من المحرر وهيتوزع أكلها على الباقي.`
      : targetCalories >= 3200 && mealCount <= 3
        ? `${targetCalories} سعرة على ${mealCount} وجبات بتطلع أطباق كبيرة؛ يُفضّل تتقسم على 4 أو 5 وجبات (زوّد وجبة خفيفة أو اتنين).`
        : null,
        meal_distribution: mealDistribution,
    diet_framework: dietFramework,
    diet_framework_conflict: dietFrameworkConflict,
    methodology_policy: {
      engine_id: "MASTER_ENGINE_V2",
      bmr_formula: bmrFormula,
      pal_model: "COMPOSITE_OCCUPATION_NEAT_PAL",
      deficit_model: "STEPPED_CALORIC_DEFICIT_WITH_FLOORS",
      protein_reference_basis: referenceWeightBasis
    },
    carb_cycling: carbCyclingConfig,
    fasting_window: fastingWindowConfig,
    flexible_80_20: flexible8020Config,
    targeted_low_carb: lowCarbConfig,
    weekend_refeed: weekendRefeedConfig,
    reverse_dieting: reverseDietConfig,
    low_fodmap: lowFodmapConfig,
    mediterranean_health: mediterraneanConfig,
    biomarker_analysis: biomarkerAnalysis,
    clinical_safety_shield: biomarkerAnalysis?.has_biomarker_flags ? biomarkerAnalysis : null,
    clinical_guardrails: {
      // The key keeps its name: a plan already saved carries it, and the merge that preserves a
      // capped protein reads it. What changed is where the cap comes from - the bloodwork only.
      kidney_protein_capped: Boolean(kidneyProteinCapped),
      // H8: the elderly protein cap (1.6 g/kg at 65+, kidney function
      // unknown) and the 30% carbohydrate floor, recorded like the kidney
      // cap — a coach reads them from the plan, never guesses.
      elderly_protein_capped: Boolean(elderlyProteinCapped),
      elderly_protein_cap_per_kg: elderlyProteinCapped ? 1.6 : null,
      carb_floor_30_applied: Boolean(carbFloor30Applied),
      carb_floor_30_share: carbFloor30Applied ? 0.3 : null,
      energy_reference_weight_kg: referenceWeight,
      energy_balance_steps: balanceSteps,
      energy_balance_note_ar: energyBalanceNoteAr(),
      is_young_trainee: isYoungTrainee,
      young_trainee_note_ar: isYoungTrainee
        ? `متدرب سنه ${age} سنة: السعرات محسوبة بمعادلة الأطفال والمراهقين (Schofield) والخطة على سعرات الاحتياج من غير أي عجز${youngTraineeMaintenanceApplied ? " (اتعدلت من هدف النزول)" : ""}. التمرين بإشراف مباشر، تركيز على الأداء الصحيح، ممنوع الوصول للفشل أو تجربة أقصى وزن (NSCA)، والمتابعة على الأداء والطول والنشاط مش على الوزن بس.`
        : null,
      // A heart client is served with his cardiologist's clearance: the plate follows the same
      // advice his doctor gives (AHA 2021 dietary guidance - less salt, less saturated fat).
      heart_diet_note_ar: conditionsList.some((c) => c.includes("HEART") || c.includes("CARDIAC"))
        ? "مريض قلب: خفّف الملح في الطبخ وعلى السفرة (أقل من معلقة صغيرة ملح في اليوم)، وقلّل الدهون المشبعة (السمن والزبدة واللحوم الدسمة)، وخلي الدهون من زيت الزيتون والمكسرات والسمك. ولو دكتوره ادّاه تعليمات أكل، تعليماته هي الأصل."
        : null,
      // H8: hypertension carries the same salt advice as the heart note,
      // with the number on it (2300 mg/day, AHA 2021), and high
      // cholesterol carries its own egg and saturated-fat limits.
      hypertension_sodium_limit_mg: hasHypertension ? 2300 : null,
      hypertension_diet_note_ar: hasHypertension
        ? "ضغط عالي: الملح في اليوم كله 2300 مجم كحد أقصى (أقل من معلقة صغيرة ملح)، وقلّل الأكل المملح والمعلب والمخللات، وخلي الدهون من زيت الزيتون والمكسرات والسمك. ولو دكتوره ادّاه تعليمات أكل، تعليماته هي الأصل."
        : null,
      cholesterol_guidance_ar: conditionsList.some((c) => c.includes("CHOLESTEROL"))
        ? "كوليسترول عالي: بيضة كاملة واحدة في اليوم كحد أقصى (بيضتين في اليوم كله لو مفيش بديل)، والدهون المشبعة أقل من 7% من السعرات (من غير سمن وزبدة ولحوم دسمة)، والألياف من الشوفان والبقوليات والخضار كل يوم."
        : null,
      max_protein_per_kg: kidneyProteinCapped ? (biomarkerAnalysis?.dietary_modifications?.protein_cap_g_per_kg || null) : null,
      max_protein_g: kidneyProteinCapped ? proteinG : null,
      rationale_ar: kidneyProteinCapped ? `تحديد سقف البروتين عند ${proteinPerKg} جم/كجم لحماية وظائف الكلى بناءً على الفحوصات المخبرية` : null,
      liver_review_required: Boolean(hasLiverCondition),
      liver_guidance_ar: hasLiverCondition ? CLINICAL_GUIDELINES.LIVER.GUIDANCE_AR : null,
      hypoglycemia_guard_active: Boolean(hasDiabetesOrInsulinResistance),
      diabetes_type: isType1Diabetic ? "TYPE_1" : (isInsulinDependent ? "INSULIN_DEPENDENT_T2D" : (hasDiabetesOrInsulinResistance ? "DIABETES_OR_IR" : "NONE")),
      hypoglycemia_risk: (isType1Diabetic || isInsulinDependent || takesSecretagogue) ? "HIGH" : (hasDiabetesOrInsulinResistance ? "MODERATE" : "NONE"),
      // P1-B5 (Q16/Q20): clinical macro guardrails, flagged not hidden.
      pcos_carb_cap_applied: pcosCarbCapApplied,
      pcos_carb_cap_relaxed: pcosCapRelaxed,
      pcos_carb_cap_share: pcosCarbCapApplied ? PCOS_CARB_CAP_SHARE : null,
      pcos_fat_increase_g: pcosCarbCapApplied ? pcosFatIncreaseG : null,
      pcos_carb_cap_note_ar: pcosCapNoteAr,
      carb_floor_applied: carbFloorApplied,
      carb_floor_g: carbFloorApplied ? INSULIN_CARB_FLOOR_G : null,
      carb_floor_note_ar: carbFloorNoteAr,
      pcos_cap_overridden_by_floor: pcosCapOverriddenByFloor,
      takes_insulin_secretagogue: takesSecretagogue,
      secretagogue_alert_ar: takesSecretagogue ? "تنبيه سريري: أدوية محفزات إفراز الأنسولين (السلفونيل يوريا مثل أماريل أو دياميكرون) تزيد من خطر هبوط السكر أثناء الصيام أو التمارين المطولة؛ يجب توفير كربوهيدرات سريعة (قاعدة 15-15) ومراجعة الطبيب لتنسيق الجرعات." : null,
      hypoglycemia_guidance_ar: hasDiabetesOrInsulinResistance ? CLINICAL_GUIDELINES.DIABETES.SAFETY_GUIDANCE_AR : null,
      hypoglycemia_rescue_carbs_grams: hasDiabetesOrInsulinResistance ? CLINICAL_GUIDELINES.DIABETES.HYPOGLYCEMIA_RESCUE_CARBS_GRAMS : null,
      medical_coordination_required: Boolean(isType1Diabetic || isInsulinDependent),
      medical_coordination_notice_ar: (isType1Diabetic || isInsulinDependent) ? CLINICAL_GUIDELINES.DIABETES.INSULIN_COORDINATION_AR : null,
      ear_130g_disclaimer_ar: hasDiabetesOrInsulinResistance ? CLINICAL_GUIDELINES.DIABETES.EAR_130G_DISCLAIMER_AR : null,
      diabetic_carb_cap_applied: false,
      diabetic_reference_ceiling_applied: Boolean(diabeticCarbCapped),
      diabetic_reference_carb_share: diabeticCarbCapped ? (CLINICAL_GUIDELINES.DIABETES.REFERENCE_CARB_ENERGY_SHARE || 0.45) : null,
      max_carb_energy_share: null,
      diabetic_carb_cap_note_ar: diabeticCarbCapped ? CLINICAL_GUIDELINES.DIABETES.CARB_CAP_RATIONALE_AR : null,
      coach_review_high_fat: hasDiabetesOrInsulinResistance && (fatG * 9) / targetCalories > CLINICAL_GUIDELINES.DIABETES.FAT_SHARE_REVIEW_THRESHOLD,
      coach_review_high_fat_ar: hasDiabetesOrInsulinResistance && (fatG * 9) / targetCalories > CLINICAL_GUIDELINES.DIABETES.FAT_SHARE_REVIEW_THRESHOLD
        ? `الدهون ${Math.round((fatG * 900) / targetCalories)}% من السعرات بعد سقف الكربوهيدرات؛ راجع توزيع الطاقة مع الحالة.`
        : null,
      biomarker_guard_active: Boolean(biomarkerAnalysis?.has_biomarker_flags),
      withhold_creatine: Boolean(biomarkerAnalysis?.dietary_modifications?.withhold_creatine),
      purine_restriction: Boolean(biomarkerAnalysis?.dietary_modifications?.purine_restriction),
      saturated_fat_cap_percent: biomarkerAnalysis?.dietary_modifications?.saturated_fat_cap_percent || null,
      diet_framework_conflict: dietFrameworkConflict,
      coach_review_diet_conflict: Boolean(dietFrameworkConflict),
    },
  };

}


/**
 * Builds the comprehensive Master Program V2 with multi-week meso-cycles,
 * practical serving quantization, and Zone 2 cardiovascular heart-rate targets.
 *
 * @param {Object} inputs
 * @param {Object} inputs.intake
 * @param {Object} inputs.evaluationContext
 * @param {Object} inputs.nutritionFoodCatalog
 * @param {Object} [inputs.options]
 * @returns {Object}
 */
export function buildMasterEngineV2(inputs) {
  requireObject(inputs, "inputs");

  const { intake, evaluationContext, nutritionFoodCatalog, options = {} } = inputs;
  requireObject(intake, "intake");
  requireObject(evaluationContext, "evaluationContext");
  requireObject(nutritionFoodCatalog, "nutritionFoodCatalog");

  const effectiveIntake = (intake?.answers && typeof intake.answers === 'object')
    ? { ...intake.answers, ...intake }
    : (intake || {});

  const canonicalIntake = adaptIntakePayloadToCanonicalEngine(effectiveIntake);

  // Strict Physiological Validation Firewall
  const bodyWeight = Number(canonicalIntake.body?.weightKg ?? canonicalIntake.weight_kg ?? effectiveIntake?.weight_kg);
  if (!Number.isFinite(bodyWeight) || bodyWeight < 30 || bodyWeight > 300) {
    throw new RangeError(`قيمة الوزن غير صالحة فسيولوجياً (${canonicalIntake.body?.weightKg} كجم). لا يمكن بناء خطة بوزن غير صالح.`);
  }
  const bodyHeight = Number(canonicalIntake.body?.heightCm ?? canonicalIntake.height_cm ?? effectiveIntake?.height_cm);
  if (!Number.isFinite(bodyHeight) || bodyHeight < 120 || bodyHeight > 250) {
    throw new RangeError(`قيمة الطول غير صالحة فسيولوجياً (${canonicalIntake.body?.heightCm} سم). لا يمكن بناء خطة بطول غير صالح.`);
  }

  // P1-B2: resolve the goal BEFORE the decision is evaluated, so the decision
  // record, the training/mobility engines, and the nutrition pipeline all read
  // the goal the plan is actually built on — never a folded canonical goal.
  // Same shared module and same body-fat computation as the plan-time
  // resolution below, so both agree by construction. A missing goal throws
  // here, before any plan is built.
  const earlyPersonal = canonicalIntake.personal || canonicalIntake.client || {};
  const earlyIsMale = earlyPersonal.sex
    ? earlyPersonal.sex !== "FEMALE"
    : (String(earlyPersonal.gender || earlyPersonal.client_gender || "").trim().toUpperCase() !== "FEMALE");
  const earlyAge = earlyPersonal.dateOfBirth
    ? calculateAge(earlyPersonal.dateOfBirth, evaluationContext.assessmentDate)
    : Number(earlyPersonal.age) || 28;
  const earlyBodyFat = resolveBodyFat({
    body: canonicalIntake.body || {},
    rawBody: effectiveIntake?.body || {},
    rawCircumferences: effectiveIntake?.circumferences || {},
    effectiveRaw: effectiveIntake,
    isMale: earlyIsMale,
    height: bodyHeight,
  });
  const earlyRawNormalized = normalizeGoal(effectiveIntake?.goals?.primary ?? effectiveIntake?.primary_goal);
  const earlyRequestedGoal = (earlyRawNormalized === "BODY_RECOMPOSITION" || earlyRawNormalized === "COACH_DECIDES")
    ? earlyRawNormalized
    : (normalizeGoal(canonicalIntake.goals?.primary) ?? earlyRawNormalized);
  const earlyResolution = resolvePrimaryGoal({
    goal: earlyRequestedGoal,
    bodyFat: earlyBodyFat,
    bmi: bodyWeight / ((bodyHeight / 100) ** 2),
    isMale: earlyIsMale,
    isYoungTrainee: Number.isFinite(earlyAge) && earlyAge > 0 && earlyAge < 18,
  });
  const earlyResolved = earlyResolution.resolved;
  const earlyGoalRedirect = earlyResolution.redirect || null;
  // The original goal is kept as requested_primary so the plan-time
  // resolution below can still record its redirect (see there).
  canonicalIntake.goals = { ...canonicalIntake.goals, primary: earlyResolved, requested_primary: canonicalIntake.goals?.primary };

  // 1. Evaluate Intake
  const intake_decision = evaluateIntake(canonicalIntake, evaluationContext);

  // H8: a goal the engine redirected (an underweight client asking for fat
  // loss is moved to muscle gain) used to reach the plan with ZERO review
  // flags and a READY decision — the redirect lived only in
  // targets.goal_redirect, which the decision never saw, because the early
  // resolution above discarded it before evaluateIntake ran. A redirect is
  // a coach decision, so it is flagged here and a READY decision is
  // downgraded to COACH_REVIEW_REQUIRED. A stricter status (BLOCKED,
  // MEDICAL_REVIEW_REQUIRED) is never softened.
  if (earlyGoalRedirect) {
    const redirectFlag = {
      code: "GOAL_REDIRECTED_REQUIRES_COACH_REVIEW",
      scope: "GLOBAL",
      level: "COACH",
      message: earlyGoalRedirect.reason_ar || "The requested goal was redirected by the engine and needs coach confirmation.",
      sourcePath: "goals.primary",
    };
    intake_decision.review_flags = [...(intake_decision.review_flags || []), redirectFlag];
    intake_decision.decision_reasons = [
      ...(intake_decision.decision_reasons || []),
      { code: "GOAL_REDIRECTED_REQUIRES_COACH_REVIEW", scope: "GLOBAL", message: redirectFlag.message },
    ];
    if (intake_decision.plan_status === "READY_FOR_DRAFT") {
      intake_decision.plan_status = "COACH_REVIEW_REQUIRED";
    }
  }

  // P0-A10 (Q36): the weekly mobility prescription is the gate for automatic
  // warm-ups. This prescription-only run reads exactly the status the full
  // Mobility Engine run below will store (it needs no weekly plan, so it can
  // run before session enrichment); it changes no stored output.
  const mobilityPrescriptionStatus = buildMobilityEngine(intake_decision, null).prescription?.status;

  // 2. Training Engine V2 (Multi-Week Meso-Cycle Periodization)
  const training_mesocycle = buildTrainingMesoCycle(intake_decision, {
    weeksCount: options.weeksCount || 5,
    muscleBias: options.muscleBias || resolveFocusMuscleBias(effectiveIntake, canonicalIntake),
    rawIntake: canonicalIntake,
    experience: canonicalIntake.training?.experience,
  });

  // Enrich each session with tailored Dynamic Warm-Up & Static Cool-Down protocols
  const enrichedTrainingWeeks = training_mesocycle.weeks.map((week) =>
    Object.freeze({
      ...week,
      sessions: week.sessions.map((session) =>
        Object.freeze({
          ...session,
          mobility_protocol: Object.freeze(
            buildSessionMobilityProtocol(session.session_code, session.exercises, {
              ...(canonicalIntake.medical || {}),
              ...(effectiveIntake?.medical || {}),
              injuries: [
                ...(canonicalIntake.training?.injuries || []),
                ...(effectiveIntake?.training?.injuries || []),
                ...(canonicalIntake.medical?.injuries || []),
                ...(effectiveIntake?.medical?.injuries || []),
              ],
              movementRestrictions: [
                ...(canonicalIntake.training?.medicalMovementRestrictions || []),
                ...(intake?.training?.medicalMovementRestrictions || []),
              ],
              // P0-A10 (Q36): a review-held weekly prescription withholds the
              // automatic warm-up/cool-down instead of serving it.
              mobilityPrescriptionStatus,
            }),
          ),
        }),

      ),
    }),
  );

  const enrichedTrainingMesocycle = Object.freeze({
    ...training_mesocycle,
    weeks: Object.freeze(enrichedTrainingWeeks),
  });

  // R1 (HO-1): a held training slot must never be silent at the decision
  // level. The mesocycle flags held slots on the training program
  // (coach_review_flags), but the intake decision is computed BEFORE the
  // program is built, so a plan whose only fault is an equipment-held slot
  // reached the coach as READY_FOR_DRAFT with zero decision-level flags —
  // the coach reading only the decision saw nothing wrong. When the built
  // program holds a slot because no exercise fits the client's declared
  // equipment (EQUIPMENT_EXHAUSTED / DEDUP_EXHAUSTED), the decision gains
  // one flag per held slot and a READY decision is downgraded to
  // COACH_REVIEW_REQUIRED (the H8 redirect pattern above). Injury-held
  // slots are not added here: the safety rules already flag the injury
  // itself, so the decision is already held for review. A stricter status
  // (BLOCKED, MEDICAL_REVIEW_REQUIRED) is never softened.
  const heldEquipmentSlots = new Map();
  for (const week of training_mesocycle?.weeks || []) {
    for (const session of week.sessions || []) {
      for (const exercise of session.exercises || []) {
        if (!String(exercise?.exercise_code || "").startsWith("HELD_SLOT")) continue;
        if (exercise.held_reason !== "EQUIPMENT_EXHAUSTED" && exercise.held_reason !== "DEDUP_EXHAUSTED") continue;
        const slot = exercise.slot_code || exercise.exercise_code;
        if (!heldEquipmentSlots.has(slot)) heldEquipmentSlots.set(slot, new Set());
        heldEquipmentSlots.get(slot).add(week.week_number);
      }
    }
  }
  if (heldEquipmentSlots.size > 0) {
    const existingHeldFlags = (intake_decision.review_flags || [])
      .filter((f) => f.code === "EQUIPMENT_SLOT_HELD_FOR_REVIEW")
      .map((f) => f.message || "");
    for (const [slot, weeks] of heldEquipmentSlots) {
      const message = `الخطة فيها خانة ${slot} محجوزة للمدرب في ${weeks.size} أسابيع — مفيش تمرين مناسب بمعدات العميل المعلنة، ولازم المدرب يختار بديل قبل التسليم.`;
      if (existingHeldFlags.some((m) => m.includes(slot))) continue;
      intake_decision.review_flags = [...(intake_decision.review_flags || []), {
        code: "EQUIPMENT_SLOT_HELD_FOR_REVIEW",
        scope: "TRAINING",
        level: "COACH",
        message,
        sourcePath: "training_program.weeks",
      }];
      intake_decision.decision_reasons = [...(intake_decision.decision_reasons || []), {
        code: "EQUIPMENT_SLOT_HELD_FOR_REVIEW",
        scope: "TRAINING",
        message,
      }];
    }
    if (intake_decision.plan_status === "READY_FOR_DRAFT") {
      intake_decision.plan_status = "COACH_REVIEW_REQUIRED";
    }
  }

  // Base weekly schedule for downstream cardio/mobility dependencies
  const baseWeeklySchedule =
    enrichedTrainingWeeks.length > 0 ? enrichedTrainingWeeks[0].sessions : [];
  const syntheticWeeklyPlan = {
    schedule_mode: training_mesocycle.schedule_mode,
    sessions: baseWeeklySchedule,
  };


  // 3. Cardio Engine V2 with Zone 2 Target Heart Rates
  // S2-6 (P1-B3 note): a missing date of birth/age now stops generation in
  // the targets step above, so this fallback is defense-in-depth only. Its
  // output stays flagged estimated and held for review (P0-A16), never
  // served as a confirmed zone.
  const rawDobCandidates = [
    effectiveIntake?.personal?.dateOfBirth,
    effectiveIntake?.personal?.date_of_birth,
    effectiveIntake?.dateOfBirth,
    effectiveIntake?.date_of_birth,
  ];
  const validDob = rawDobCandidates.find(
    (candidate) => typeof candidate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(candidate)
  );
  const rawAgeCandidates = [
    effectiveIntake?.personal?.age,
    effectiveIntake?.age,
    canonicalIntake?.personal?.age,
  ];
  const validAgeCandidate = rawAgeCandidates.find((candidate) => {
    if (candidate === undefined || candidate === null) return false;
    if (typeof candidate === "string" && candidate.trim() === "") return false;
    const parsed = Number(candidate);
    return Number.isFinite(parsed) && parsed > 0;
  });

  let clientAge;
  let isAgeEstimated;
  let ageSource;

  if (validDob) {
    clientAge = calculateAge(validDob, evaluationContext.assessmentDate);
    isAgeEstimated = false;
    ageSource = "CLIENT_PROVIDED";
  } else if (validAgeCandidate !== undefined) {
    // H5: the stated age is used as stated — a 12-year-old is 12, never 16.
    clientAge = Math.min(100, Math.round(Number(validAgeCandidate)));
    isAgeEstimated = false;
    ageSource = "CLIENT_PROVIDED";
  } else {
    clientAge = 30;
    isAgeEstimated = true;
    ageSource = "DEFAULT_FALLBACK";
  }

  // P1-B8: canonical Zone 2 computation (same function as the frontend).
  // H5: zones use the real age (a 12-year-old gets max HR 200, not 197);
  // the P0-A16 estimated-age hold and beta-blocker talk-test-only paths
  // below are untouched.
  const canonicalZones = computeZone2Bpm(clientAge);
  const estimatedMaxHr = canonicalZones.max_heart_rate_bpm;
  const zone2LowBpm = canonicalZones.min_bpm;
  const zone2HighBpm = canonicalZones.max_bpm;

  // H1 (CB4/CB7): a regeneration rebuilds the plan from the intake, so
  // without the previous program's state it would wipe the coach's step
  // target and every approved adaptation. Callers that regenerate pass
  // the previous program's adaptation_state (and the coach step target)
  // in options; both are carried into the rebuilt plan below.
  let preservedAdaptationState = readAdaptationState({
    adaptation_state: options.adaptation_state ?? options.previous_program?.adaptation_state ?? null,
  });
  const preservedCoachStepTarget = Number(
    options.coach_step_target ?? options.coachStepTarget
    ?? preservedAdaptationState.coach_step_target ?? NaN,
  );
  // A coach step target passed as an option is part of the state from
  // now on, so adaptations and later regenerations keep it without the
  // caller re-passing it every time.
  if (Number.isFinite(preservedCoachStepTarget) && preservedCoachStepTarget > 0) {
    preservedAdaptationState = { ...preservedAdaptationState, coach_step_target: Math.round(preservedCoachStepTarget) };
  }
  const baseCardioProgram = buildCardioEngine(
    intake_decision,
    canonicalIntake,
    syntheticWeeklyPlan,
    {
      ...(Number.isFinite(preservedCoachStepTarget) && preservedCoachStepTarget > 0
        ? { coach_step_target: preservedCoachStepTarget }
        : {}),
    },
  );

  const medical = canonicalIntake?.medical || {};
  const rawMedical = effectiveIntake?.medical || {};
  const rawConditions = [
    ...(Array.isArray(medical.conditions) ? medical.conditions : []),
    ...(Array.isArray(rawMedical.conditions) ? rawMedical.conditions : []),
    ...(Array.isArray(effectiveIntake?.medical_conditions) ? effectiveIntake.medical_conditions : []),
    ...(Array.isArray(intake_decision.profile?.medical_conditions) ? intake_decision.profile.medical_conditions : []),
    ...(Array.isArray(intake_decision.hard_constraints) ? intake_decision.hard_constraints.map(c => c.code) : [])
  ].map(c => typeof c === 'string' ? c.toUpperCase() : String(c?.conditionCode || c?.code || '').toUpperCase());

  const hasAsthma =
    medical.hasAsthma === true ||
    rawMedical.hasAsthma === true ||
    rawConditions.some(c => c.includes("ASTHMA") || c.includes("RESPIRATORY"));

  // Blood pressure and heart conditions take the same road asthma does here: intervals out,
  // steady moderate cardio in (ACSM/AHA; the same rule the cardio prescription engine applies).
  const hasCardiovascular = rawConditions.some((c) => c.includes("HEART") || c.includes("CARDIAC") || c.includes("HYPERTENSION"));
  const noHighIntensity = hasAsthma || hasCardiovascular;
  const HIGH_INTENSITY_NOTE_AR = hasAsthma
    ? CLINICAL_GUIDELINES.RESPIRATORY.SAFETY_GUIDANCE_AR
    : "توجيه سريري لمرضى الضغط والقلب: الكارديو معتدل ومستقر (Zone 2) بدل الفترات عالية الشدة، ولو حسيت بأي ألم في الصدر أو دوخة أو ضيق نفس وقف فوراً وكلم دكتورك.";

  // P0-A16: beta-blockers blunt heart rate, so Tanaka BPM targets are
  // unreliable for these clients (talk test only, never BPM numbers).
  // The medication question already feeds medical.medications via the
  // adapter; the cardio overlay never consulted it until now.
  const BETA_BLOCKER_KEYS = [
    "BETA_BLOCKER", "BETA-BLOCKER", "BISOPROLOL", "CONCOR", "ATENOLOL",
    "METOPROLOL", "PROPRANOLOL", "CARVEDILOL", "NEBIVOLOL",
    "حاصرات بيتا", "بيسوبرولول", "كونكور",
  ];
  const betaBlockerMedsText = [
    ...(Array.isArray(medical?.medications) ? medical.medications : []),
    ...(Array.isArray(rawMedical?.medications) ? rawMedical.medications : []),
    ...(Array.isArray(effectiveIntake?.current_meds_supplements_list) ? effectiveIntake.current_meds_supplements_list : []),
    String(effectiveIntake?.current_meds_supplements || ""),
  ].join(" ").toUpperCase();
  const hasBetaBlocker = BETA_BLOCKER_KEYS.some((k) => betaBlockerMedsText.includes(k));
  const BETA_BLOCKER_NOTE_AR = "إرشاد اختبار الكلام فقط: أدوية حاصرات بيتا بتغيّر نبض القلب، فأرقام النبض مش موثوقة — اعتمد على قدرتك على الكلام بجمل كاملة أثناء الكارديو، ولو حسيت بدوخة أو ضيق نفس وقف فوراً وكلم دكتورك.";
  // P0-A16: the HTN/asthma group gets a real LOW cap, not text only. The
  // same group already gets the HIIT->LISS rewrite below; the cap is the
  // enforced part. Coach clearance of the cap is a future editor toggle,
  // not invented here — until then the cap stands and the coach is flagged.
  const LOW_CAP_NOTE_AR = "سقف شدة الكارديو: منخفض (LOW) لحد ما المدرب يسمح بغير كده، بسبب الضغط أو الربو.";

  const enrichedCardioSessions = (baseCardioProgram.weekly_schedule?.sessions || []).map(
    (session) => {
      const isHiit = String(session.modality_type || "").toUpperCase().includes("HIIT");
      const safeModality = (noHighIntensity && isHiit) ? "LISS" : session.modality_type;
      const heartRateTarget = hasBetaBlocker
        ? {
            estimated_hr_max: null,
            zone: "ZONE_2",
            target_range_bpm: null,
            target_low_bpm: null,
            target_high_bpm: null,
            is_age_estimated: isAgeEstimated,
            age_source: ageSource,
            talk_test_only: true,
            guidance_ar: isAgeEstimated
              ? `${BETA_BLOCKER_NOTE_AR} والعمر غير مؤكد، فالمناطق محجوزة لمراجعة المدرب لحد ما السن يتأكد.`
              : BETA_BLOCKER_NOTE_AR,
          }
        : {
            estimated_hr_max: estimatedMaxHr,
            zone: "ZONE_2",
            target_range_bpm: `${zone2LowBpm} - ${zone2HighBpm} BPM`,
            target_low_bpm: zone2LowBpm,
            target_high_bpm: zone2HighBpm,
            is_age_estimated: isAgeEstimated,
            age_source: ageSource,
            guidance_ar: isAgeEstimated
              ? (noHighIntensity
                  ? `${HIGH_INTENSITY_NOTE_AR} معدل نبضات القلب المستهدف تقريبي (بين ${zone2LowBpm} و ${zone2HighBpm} نبضة/دقيقة) لعدم تحديد العمر بدقة.`
                  : `معدل نبضات القلب المستهدف تقريبي (بين ${zone2LowBpm} و ${zone2HighBpm} نبضة/دقيقة) لعدم تحديد العمر بدقة، وذلك لحرق الدهون بكفاءة.`)
              : (noHighIntensity
                  ? `${HIGH_INTENSITY_NOTE_AR} معدل نبضات القلب المستهدف: بين ${zone2LowBpm} و ${zone2HighBpm} نبضة/دقيقة.`
                  : `معدل نبضات القلب المستهدف أثناء جلسة الكارديو: بين ${zone2LowBpm} و ${zone2HighBpm} نبضة/دقيقة لحرق الدهون بكفاءة.`),
          };
      return Object.freeze({
        ...session,
        modality_type: safeModality,
        ...(noHighIntensity && session.intensity !== undefined ? { intensity: "LOW" } : {}),
        clinical_guidance_ar: noHighIntensity
          ? `${LOW_CAP_NOTE_AR}${hasAsthma ? ` ${HIGH_INTENSITY_NOTE_AR}` : ""}`
          : null,
        heart_rate_target: heartRateTarget,
      });
    },
  );

  // P0-A11: the final cardio check runs on the FINAL sessions (after the
  // HIIT->LISS overlay and day assignment), not on the upstream schedule —
  // the structural preflight never inspects modality, intensity, duration,
  // or day. The duration bound is the client's own prescribed session max
  // (the prescription dose); when no prescription dose exists there is no
  // duration bound to enforce and none is invented. A failing plan is
  // reported here and withheld by the generate handlers (DRAFT on
  // final_preflight REVIEW_REQUIRED), same pattern as the culinary preflight.
  // P1-B8: weekly-dose bound for the final check — the prescribed weekly
  // dose is the prescription's session count x its per-session ceiling.
  const prescribedSessionMax = baseCardioProgram.prescription?.sessions?.[0]?.duration_minutes ?? null;
  const prescribedSessionCount = Array.isArray(baseCardioProgram.prescription?.sessions)
    ? baseCardioProgram.prescription.sessions.length
    : 0;
  const cardioFinalPreflight = evaluateFinalCardioPlan(enrichedCardioSessions, {
    maxDurationMinutes: prescribedSessionMax,
    weeklyMinutesTotal: enrichedCardioSessions.reduce(
      (sum, s) => sum + (Number.isFinite(s?.duration_minutes) ? s.duration_minutes : 0),
      0,
    ),
    maxWeeklyMinutes:
      typeof prescribedSessionMax === "number" && prescribedSessionCount > 0
        ? prescribedSessionCount * prescribedSessionMax
        : null,
  });

  // P0-A16: the prescription dose carries the same LOW cap as the weekly
  // sessions (both derive from intensity_start, which the decision layer
  // still sets to MODERATE for experienced HTN/asthma clients because
  // conditions never reach the decision input — the served dose is what
  // is enforced here; the decision-layer rule is a follow-up).
  const cappedPrescription = noHighIntensity && Array.isArray(baseCardioProgram.prescription?.sessions)
    ? {
        ...baseCardioProgram.prescription,
        sessions: baseCardioProgram.prescription.sessions.map((s) => (s.intensity !== undefined ? { ...s, intensity: "LOW" } : s)),
      }
    : baseCardioProgram.prescription;

  const cardio_program_v2 = Object.freeze({
    ...baseCardioProgram,
    prescription: cappedPrescription,
    // P0-A16 (Q48): zones computed on an estimated/unconfirmed age are
    // HELD for coach review — never served as READY. The generate
    // handlers save DRAFT while this flag is set.
    heart_rate_zones_held_for_review: isAgeEstimated,
    heart_rate_zones_status: isAgeEstimated ? "HELD_FOR_COACH_REVIEW" : "READY",
    clinical_guardrails: {
      asthma_guard_active: Boolean(hasAsthma),
      cardiovascular_guard_active: Boolean(hasCardiovascular),
      hiit_banned: Boolean(noHighIntensity),
      preferred_modality: noHighIntensity ? "LISS_ZONE_2" : null,
      guidance_ar: noHighIntensity ? `${LOW_CAP_NOTE_AR}${hasAsthma ? ` ${HIGH_INTENSITY_NOTE_AR}` : ""}` : null,
      beta_blocker_talk_test_only: Boolean(hasBetaBlocker),
      htn_asthma_low_cap_active: Boolean(noHighIntensity),
    },
    final_preflight: cardioFinalPreflight,
    weekly_schedule: Object.freeze({
      ...baseCardioProgram.weekly_schedule,
      sessions: Object.freeze(enrichedCardioSessions),
    }),
  });

  // 4. Mobility Engine V2
  const mobility_program = buildMobilityEngine(intake_decision, syntheticWeeklyPlan);

  // 5. Universal Nutrition Targets & Culinary Meal Generator
  // H1 (CB4): the preserved adaptation state is passed into the targets
  // calculation so the rebuilt target (and every config derived from it,
  // e.g. carb cycling) keeps the adaptation history instead of resetting
  // to the plain formula target.
  const universalTargets = calculateUniversalNutritionTargets(canonicalIntake, evaluationContext, effectiveIntake, { adaptation_state: preservedAdaptationState });
  // The diabetic choice can replace a food after the generator split its large portions, so the
  // split runs again on the final meals.
  const isDiabeticClient = isDiabeticIntake(canonicalIntake, effectiveIntake);
  // Stored meal totals are recomputed from the items once every step has run.
  // The allergen context is built once and shared: diversifyFatSources reads
  // it, and the clinical-safety gate below enforces it on the final plates.
  const culinaryAllergenContext = buildAllergenContext(canonicalIntake, effectiveIntake);
  // The safety gate runs last (before totals are recomputed) because templates
  // emit some items unconditionally: without it, a refused food the flags
  // forbid could still reach the plate, and its swaps would still offer it.
  // P1-B6: a final trim runs AFTER the safety gate. The old order (trim, then
  // safety, then only re-sum) let a safety swap re-break macros with no
  // correction — a fattier equivalent landing after trim already ran. Trim
  // only scales items, never removes them, so the final trim cannot undo a
  // safety replacement; and with its protein re-add direction it cannot
  // break protein either.
  const builtCulinaryMeals = refreshActualMacros(trimMealsToTarget(enforceClinicalSafety(trimMealsToTarget(diversifyFatSources(
    splitOversizedPortions(enforceDiabeticCarbChoice(
      buildCulinaryRecipeMeals(universalTargets, canonicalIntake, effectiveIntake),
      isDiabeticClient,
    ), carbPortionLimit({ diabetic: isDiabeticClient })),
    culinaryAllergenContext,
    {
      kidneyProteinCapped: universalTargets.clinical_guardrails?.kidney_protein_capped === true,
    },
  )), culinaryAllergenContext)));
  // P0-A7: the served plate is checked before it reaches anyone. A meal with
  // no protein food gets one safe fallback protein (never a refused food);
  // then the culinary preflight audits every final meal — targets, portions,
  // unsafe items, forbidden foods, listed swaps. An invalid plate is flagged
  // REVIEW_REQUIRED on the program below and is never saved ACTIVE or served.
  // Valid meals are untouched: annotation fields are added only when a meal
  // actually fails or was rescued, so a passing plate serializes as before.
  const fallbackCulinaryMeals = refreshActualMacros(applyCulinaryProteinFallback(builtCulinaryMeals, culinaryAllergenContext));
  // H8: portion passes on the FINAL plate (after the trims and the protein
  // fallback, before the preflight audits it). Order matters: the
  // cholesterol yolk cap first (it may replace an omelette with a vetted
  // swap), then the legume plate for a client with no animal protein (the
  // selection stage picks legume patterns, but the recipe-built plate never
  // saw them), then the protein split (an oversized tuna/cottage/omelette is
  // split into two real portions, not cut), then the omelette rename (the
  // trim scales portions without renaming them), then token cleanup, then
  // the day reconciliation (each meal's few-kcal trim residual adds up to
  // +16..+64 a day). The passes only move food already on the plate.
  const hasHighCholesterol = (canonicalIntake?.medical?.conditions || []).some(
    (c) => String(c?.conditionCode || "").toUpperCase() === "HIGH_CHOLESTEROL",
  );
  const h8CulinaryMeals = refreshActualMacros(
    // A pass that introduces a new food (the protein split's swap partner)
    // runs after buildCulinaryRecipeMeals already applied the disliked
    // names, so the new food's name is never adjusted: a shakshouka partner
    // keeps "وزيت الزيتون" in its name for a client who dislikes olive oil.
    // Re-apply the same adjustment here, on the final plate.
    // R1 (HO-2): the protein fallback runs a SECOND time here, after the
    // token pass and before the day reconciliation. The first fallback (above)
    // already ran — but the token pass can delete a meal's only protein AFTER
    // it: a template chicken anchor of 48 g, trimmed to 38 g / 22 g by the
    // trim passes, sits below the 50 g real-portion minimum and is dropped
    // as a token, leaving lunch and dinner protein-less while the plan is
    // still served. A rescue after every removal guarantees no served plate
    // ends up without a protein food; the reconciliation after it re-balances
    // the day total (it only moves starch and oil, never the rescued protein).
    applyDislikedNames(
      reconcileDayCaloriesToTarget(
        applyCulinaryProteinFallback(
          dropTokenPortions(
            renameOmelettesToActualEggs(
              splitOversizedProteinPortions(
                ensureLegumeForNoAnimalProtein(
                  capWholeEggsForCholesterol(fallbackCulinaryMeals, hasHighCholesterol),
                  culinaryAllergenContext,
                ),
              ),
            ),
          ),
          culinaryAllergenContext,
        ),
        universalTargets.target_calories,
      ),
      effectiveIntake?.disliked_foods,
    ),
  );
  const culinaryPreflight = evaluateCulinaryPreflight(h8CulinaryMeals, {
    isSafe: (code) => isFoodClinicallySafe(code, culinaryAllergenContext),
  });
  const culinaryRecipeMeals = h8CulinaryMeals.map((meal) => {
    const result = culinaryPreflight.meals.find((m) => m.meal_number === meal.meal_number) || {};
    return {
      ...meal,
      ...(result.missing_protein === true ? { missing_protein: true } : {}),
      ...(result.issues?.length ? { culinary_issues: result.issues } : {}),
    };
  });

  // What the plates actually carry against what the plan asks for. They part company when the food
  // a client can have cannot hold the day: an operated stomach on small fixed plates, or a client
  // whose limits (a diabetic's potato ceiling, a coeliac's missing starches) leave the plate full
  // before the target is met. The coach sees both numbers rather than the gap going unnoticed.
  const servedCalories = culinaryRecipeMeals.reduce(
    (total, meal) => total + (meal.items || []).reduce((sum, item) => sum + (Number(item.calories_kcal) || 0), 0),
    0,
  );
  const servedGap = universalTargets.target_calories > 0
    ? (servedCalories - universalTargets.target_calories) / universalTargets.target_calories
    : 0;
  if (Math.abs(servedGap) > 0.1) {
    universalTargets.plate_capacity_note_ar = servedGap < 0
      ? `الأكل اللي في الأطباق ${Math.round(servedCalories)} سعرة مقابل هدف ${universalTargets.target_calories} سعرة: الأصناف المتاحة للعميل (حدود سريرية، حساسية، أو سعة معدة بعد عملية) مش قادرة تشيل اليوم كله. راجع عدد الوجبات أو الهدف مع العميل.`
      : `الأكل اللي في الأطباق ${Math.round(servedCalories)} سعرة مقابل هدف ${universalTargets.target_calories} سعرة: الأطباق زيادة عن الهدف، راجع الكميات.`;
  }

  // The canonical targets go INTO the pipeline so its own stages (and the
  // meals built from them) follow the same number as the headline below.
  const baseNutritionProgram = buildNutritionEngine({
    intake: canonicalIntake,
    evaluationContext,
    nutritionFoodCatalog,
    universalTargets,
  });

  // S2-1 (A1): one headline prescription. The stage numbers are unified from
  // the universal targets; the portion solver below still runs on the
  // pipeline stages, whose other stages are unchanged by the unification.
  const unifiedNutritionStages = unifyNutritionStageTargets(
    baseNutritionProgram.stages,
    universalTargets,
  );

  const portionSolverStage = baseNutritionProgram.stages?.portion_solver;
  const sanitizedMealPlan = portionSolverStage ? sanitizeMealPlan(portionSolverStage, canonicalIntake) : null;
  const quantizedNutrition = sanitizedMealPlan ? quantizeNutritionPlan(sanitizedMealPlan) : null;

  // Format quantized plan to include both culinary recipes and smart swap alternatives
  const enhancedQuantizedPlan = {
    ...(quantizedNutrition || {}),
    daily_totals: {
      // P1-B3: no invented headline — a missing target stays null, never 2000/160/200/60.
      calories_kcal: universalTargets.target_calories || universalTargets.target_calories_kcal || null,
      protein_g: universalTargets.protein_g || null,
      carbs_g: universalTargets.carb_g || universalTargets.carbohydrate_g || null,
      fat_g: universalTargets.fat_g || null,
    },
    meals: culinaryRecipeMeals.map((crm) => ({
      meal_number: crm.meal_number,
      meal_name_ar: crm.meal_name_ar,
      recipe_title_ar: crm.recipe_title_ar,
      recipe_description_ar: crm.recipe_description_ar,
      target_macros: crm.target_macros,
      actual_macros: crm.actual_macros,
      items: crm.items.map((it) => ({
        food_code: it.food_code,
        name_ar: it.name_ar,
        name_en: it.name_en,
        category: it.category,
        portion_g: it.portion_g,
        household_measurement: it.household_measurement,
        protein_g: it.protein_g,
        carb_g: it.carb_g,
        fat_g: it.fat_g,
        calories_kcal: it.calories_kcal,
        swaps: it.swaps || [],
      })),
    })),
  };

  // 6. Circadian Rhythm & Peri-Workout Nutrient Timing Synthesis
  // B3: every circadian input is read here, in priority order — canonical
  // sleep clock times first, then the flat form's bedtime_hour (with the
  // wake time derived from bedtime + reported hours), then the legacy raw
  // fields. A shift worker's day does NOT run on 17:00/23:00/07:00:
  // - rotating shifts: one bedtime cannot describe the roster, so the
  //   timing is always held for the coach, even if a bedtime was given;
  // - a fixed night shift: the timing is computed only when the client
  //   actually reported a bedtime AND an explicit workout time; otherwise
  //   it is held rather than inventing a schedule for him.
  // A held timing keeps any known clock time (e.g. a reported bedtime) and
  // nulls the rest, with an Arabic reason the coach must act on.
  const sleepPattern = String(effectiveIntake?.sleep_schedule?.pattern || "").toLowerCase();
  const isShiftWork = canonicalIntake.lifestyle?.workSchedule?.type === "SHIFT_BASED"
    || sleepPattern === "night_shift" || sleepPattern === "rotating_shifts";
  const isRotatingShift = sleepPattern === "rotating_shifts";
  const explicitWorkoutTime = canonicalIntake.training?.preferredTime
    || effectiveIntake?.training?.preferredTime || effectiveIntake?.preferred_workout_time || null;
  const reportedBedtime = canonicalIntake.lifestyle?.sleep?.bedtime
    || effectiveIntake?.lifestyle?.sleep?.bedtime
    || effectiveIntake?.sleep_schedule?.bedtime_hour
    || effectiveIntake?.bedtime || null;
  const reportedWakeTime = canonicalIntake.lifestyle?.sleep?.wakeTime
    || effectiveIntake?.lifestyle?.sleep?.wakeTime
    || effectiveIntake?.wake_time || null;
  const preferredWorkoutTime = explicitWorkoutTime || "17:00";
  const clientBedtime = reportedBedtime || "23:00";
  const clientWakeTime = reportedWakeTime || "07:00";

  const circadianHeldForReview = isShiftWork
    && (isRotatingShift || !reportedBedtime || !explicitWorkoutTime);
  const circadianTiming = circadianHeldForReview
    ? Object.freeze({
        held_for_coach_review: true,
        status: "HELD_FOR_COACH_REVIEW",
        workout_time: null,
        bedtime: reportedBedtime,
        wake_time: reportedWakeTime,
        timeline: [],
        caffeine_cutoff: null,
        hold_reason_ar: isRotatingShift
          ? "عميل شفتات متغيرة: موعد نوم واحد مش بيوصف جدول الشفتات، فلازم الكوتش يحدد مواعيد النوم والتمرين بنفسه قبل التسليم."
          : "عميل شفت ليلي من غير موعد نوم أو موعد تمرين معلن: توقيت النوم والتمرين محجوز لمراجعة الكوتش بدل ما يتخمن جدول من 17:00/23:00/07:00.",
        circadian_summary_ar: "توقيت النوم والتمرين محجوز لمراجعة الكوتش (عميل شفتات).",
      })
    : generatePeriWorkoutNutrientTimingSchedule({
        workout_time: preferredWorkoutTime,
        workout_duration_minutes: 60,
        bedtime: clientBedtime,
        wake_time: clientWakeTime,
        daily_calories: universalTargets.target_calories,
        daily_protein_g: universalTargets.protein_g,
        daily_carbs_g: universalTargets.carb_g,
        daily_fat_g: universalTargets.fat_g,
        meal_count: universalTargets.meals_count,
      });

  const nutrition_program_v2 = Object.freeze({
    ...baseNutritionProgram,
    stages: unifiedNutritionStages,
    targets: {
      ...universalTargets,
      meals: culinaryRecipeMeals,
    },
    macro_targets: {
      // P1-B3: no invented headline — a missing target stays null, never 2000/160/200/60.
      calories_kcal: universalTargets.target_calories || universalTargets.target_calories_kcal || null,
      protein_g: universalTargets.protein_g || null,
      carbohydrate_g: universalTargets.carb_g || universalTargets.carbohydrate_g || null,
      fat_g: universalTargets.fat_g || null,
    },
    // The client's declared sugar in tea/coffee: not added to the targets, shown to the coach so the
    // extra 20-60 kcal a day is a decision and not a surprise.
    beverage_sugar_intake: effectiveIntake?.beverage_sugar_intake || null,
    quantized_plan: enhancedQuantizedPlan,
    culinary_meals: culinaryRecipeMeals,
    // P0-A7: the served-plate check. Generate handlers save the program DRAFT
    // (never ACTIVE) when this is REVIEW_REQUIRED, and the serve path
    // withholds the plate from the client until a coach fixes it.
    culinary_preflight: culinaryPreflight,
    biomarker_analysis: universalTargets.biomarker_analysis,
    clinical_safety_shield: universalTargets.clinical_safety_shield,
    clinical_supplements: universalTargets.biomarker_analysis?.supplement_recommendations || [],
    whole_food_interventions: universalTargets.biomarker_analysis?.whole_food_interventions || [],
    medical_referrals: universalTargets.biomarker_analysis?.medical_referrals || [],
    circadian_timing: Object.freeze(circadianTiming),
    hypoglycemia_guard: universalTargets.clinical_guardrails?.hypoglycemia_guard_active ? Object.freeze({
      active: true,
      guidance_ar: CLINICAL_GUIDELINES.DIABETES.SAFETY_GUIDANCE_AR,
      rescue_carbs_grams: CLINICAL_GUIDELINES.DIABETES.HYPOGLYCEMIA_RESCUE_CARBS_GRAMS,
      session_threshold_minutes: CLINICAL_GUIDELINES.DIABETES.SESSION_DURATION_THRESHOLD_MINUTES,
      scientific_source: "ADA Standards of Care in Diabetes: Physical Activity & Hypoglycemia Management",
    }) : null,
  });

  const masterHypoglycemiaGuard = universalTargets.clinical_guardrails?.hypoglycemia_guard_active ? Object.freeze({
    active: true,
    guidance_ar: CLINICAL_GUIDELINES.DIABETES.SAFETY_GUIDANCE_AR,
    rescue_carbs_grams: CLINICAL_GUIDELINES.DIABETES.HYPOGLYCEMIA_RESCUE_CARBS_GRAMS,
    session_threshold_minutes: CLINICAL_GUIDELINES.DIABETES.SESSION_DURATION_THRESHOLD_MINUTES,
    scientific_source: "ADA Standards of Care in Diabetes: Physical Activity & Hypoglycemia Management",
  }) : null;

  // What the coach editor and the swap screens need to know about the client, from the intake
  // (the plan used to carry none of it, so the editor showed every client as healthy and in a gym).
  const listOf = (value) => (Array.isArray(value) ? value : []).map((v) => String(v).trim()).filter((v) => v && v.toLowerCase() !== "none");
  const femaleCases = effectiveIntake?.medical_conditions?.female_cases || {};
  const client_profile = Object.freeze({
    gender: effectiveIntake?.gender || null,
    // H5: the recorded age is the engine's resolved real age (from the date of
    // birth or the stated age), never the flat intake field — the production
    // path passes the canonical intake, which carries no top-level age, so
    // every client used to be recorded as null (and the editor showed 27).
    // No age was supplied at all -> null, never the 30 fallback.
    age: ageSource === "CLIENT_PROVIDED" ? clientAge : null,
    weight_kg: bodyWeight,
    height_cm: bodyHeight,
    bmi: Math.round((bodyWeight / ((bodyHeight / 100) ** 2)) * 10) / 10,
    training_environment: effectiveIntake?.training_environment || null,
    experience: enrichedTrainingMesocycle?.experience || intake_decision?.profile?.experience || canonicalIntake.training?.experience || null,
    experience_level: enrichedTrainingMesocycle?.experience || intake_decision?.profile?.experience || canonicalIntake.training?.experience || null,
    injuries: effectiveIntake?.injuries_map?.has_injuries === false ? [] : listOf(effectiveIntake?.injuries_map?.selected_areas),
    conditions: listOf(effectiveIntake?.medical_conditions?.selected),
    allergies: listOf(effectiveIntake?.strict_allergies),
    is_pregnant: effectiveIntake?.is_pregnant === true || effectiveIntake?.female_pregnancy === "PREGNANT",
    is_lactating: femaleCases.is_lactating === true,
  });

  // H4: a withheld program (MEDICAL_REVIEW_REQUIRED or BLOCKED) must not
  // carry a servable plan. The generate handlers already save it DRAFT and
  // the serve path withholds it from the client, but the engine object
  // itself leaked a complete nutrition plan (culinary meals, targets,
  // quantized plan) and a full 5-week training program — any path returning
  // the object verbatim would serve a full plan to a refused client.
  // Strip both programs down to a review stub: the reason and the safety
  // metadata the coach needs, never meals with quantities and never a
  // training program. The stage statuses stay WITHHELD (the check-in
  // auto-apply gate reads them), and adults keep only the clinical
  // guardrails inside targets (the hypoglycemia guard the safety tests
  // and the coach rely on). Minors carry no nutrition numbers at all.
  // Circadian timing carries per-meal macro targets, so it takes the same
  // held shape shift workers already get. COACH_REVIEW_REQUIRED is
  // servable-with-review and is NOT stripped.
  const isWithheldProgram =
    intake_decision?.plan_status === "MEDICAL_REVIEW_REQUIRED" ||
    intake_decision?.plan_status === "BLOCKED";
  const withheldFlagCodes = [
    ...new Set(
      (intake_decision?.review_flags || []).map((flag) => flag.code).filter(Boolean)
    ),
  ];
  const isMinorWithheld =
    isWithheldProgram &&
    (intake_decision?.review_flags || []).some(
      (flag) =>
        flag.code === "MINOR_WITHOUT_GUARDIAN_CONSENT" ||
        flag.code === "MINOR_REQUIRES_SEPARATE_PATH"
    );
  const withheldReasonAr =
    "الخطة محجوبة لمراجعة طبية — لا وجبات ولا برنامج تدريبي في هذا الكائن حتى يراجع الكوتش والفريق الطبي السبب.";
  const withheldNutritionProgram = isWithheldProgram
    ? Object.freeze({
        status: "WITHHELD",
        withheld: true,
        reason_ar: withheldReasonAr,
        review_flag_codes: withheldFlagCodes,
        stages: Object.freeze({
          energy_target: Object.freeze({ status: "WITHHELD" }),
          macro_targets: Object.freeze({ status: "WITHHELD" }),
        }),
        // Adults keep only the clinical guardrails (safety limits and
        // notices, never calorie or macro numbers). Minors keep no
        // targets object at all.
        ...(isMinorWithheld
          ? {}
          : {
              targets: Object.freeze({
                clinical_guardrails: universalTargets.clinical_guardrails ?? null,
              }),
            }),
      })
    : nutrition_program_v2;
  const withheldTrainingProgram = isWithheldProgram
    ? Object.freeze({
        status: "WITHHELD",
        withheld: true,
        reason_ar: withheldReasonAr,
        review_flag_codes: withheldFlagCodes,
        weeks: [],
        total_weeks: 0,
      })
    : enrichedTrainingMesocycle;
  const withheldCircadianTiming = isWithheldProgram
    ? Object.freeze({
        held_for_coach_review: true,
        status: "HELD_FOR_COACH_REVIEW",
        workout_time: null,
        bedtime: reportedBedtime,
        wake_time: reportedWakeTime,
        timeline: [],
        caffeine_cutoff: null,
        hold_reason_ar: "الخطة محجوبة لمراجعة طبية: توقيت الوجبات والتمرين محجوز لمراجعة الكوتش.",
        circadian_summary_ar: "توقيت النوم والتمرين محجوز لمراجعة الكوتش (خطة محجوبة).",
      })
    : circadianTiming;

  return Object.freeze({
    engine_version: MASTER_ENGINE_V2_VERSION,
    client_profile,
    intake_decision,
    training_program: withheldTrainingProgram,
    cardio_program: cardio_program_v2,
    mobility_program,
    nutrition_program: withheldNutritionProgram,
    // H1: the adaptation history (diet-break state, preserved calorie
    // offset, coach step target) travels with the program, so a
    // regeneration or a new cycle starts from it instead of from zero.
    adaptation_state: Object.freeze({ ...preservedAdaptationState }),
    hypoglycemia_guard: masterHypoglycemiaGuard,
    biomarker_analysis: universalTargets.biomarker_analysis,
    clinical_safety_shield: universalTargets.clinical_safety_shield,
    circadian_timing: Object.freeze(withheldCircadianTiming),
    recovery_autoregulation: Object.freeze({
      readiness_baseline: calculateTrainingReadiness({
        sleep_quality: canonicalIntake.lifestyle?.sleep?.quality || "GOOD",
        // B2: the canonical record carries the reported hours as
        // `averageHours` — the `hours` field this read used to read was
        // never written by any adapter, so the 7.5 h default applied to
        // everyone. `hours` stays as a fallback for callers that set it.
        sleep_hours: (() => {
          const h = canonicalIntake.lifestyle?.sleep?.hours ?? canonicalIntake.lifestyle?.sleep?.averageHours;
          return Number.isFinite(Number(h)) ? Number(h) : 7.5;
        })(),
        stress_level: canonicalIntake.lifestyle?.stressLevel === 'HIGH' ? 8 : (canonicalIntake.lifestyle?.stressLevel === 'LOW' ? 2 : 4),
        energy_level: 8
      }),
      framework_ar: "نظام الاستشفاء وضبط الأحمال الذاتي (Autoregulated Recovery Framework)"
    }),
  });

}
