
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
  return protocol === "16_8" || protocol === "14_10" ? protocol : null;
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
import { buildMobilityEngine } from "../mobility-engine/index.js";
import { buildSessionMobilityProtocol } from "../mobility-warmup-engine-v2/index.js";
import { buildNutritionEngine } from "../nutrition-engine/index.js";
import { sanitizeMealPlan, buildCulinaryRecipeMeals, enforceDiabeticCarbChoice, splitOversizedPortions, carbPortionLimit, isDiabeticIntake, diversifyFatSources, buildAllergenContext, trimMealsToTarget, refreshActualMacros } from "../nutrition-meal-context-v2/index.js";
import { quantizeNutritionPlan } from "../nutrition-serving-quantizer-v2/index.js";
import { adaptIntakePayloadToCanonicalEngine } from "../intake-decision-engine/adapters/intake-adapter.js";
import { MASTER_ENGINE_V2_VERSION } from "./domain/enums.js";
import { CLINICAL_GUIDELINES } from "../config/clinical-guidelines.js";
import { analyzeBloodworkBiomarkers } from "../execution-engines/biomarker-engine.js";
import { generatePeriWorkoutNutrientTimingSchedule, calculateCaffeineCutoffWindow } from "../execution-engines/circadian-nutrient-timing-engine.js";
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
  return Math.max(16, Math.min(100, age));
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
export function calculateUniversalNutritionTargets(canonicalIntake, evaluationContext = {}, rawIntake = {}) {
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

  const age = personal.dateOfBirth
    ? calculateAge(personal.dateOfBirth, evaluationContext.assessmentDate)
    : Number(personal.age) || 28;
  const isMale = personal.sex !== "FEMALE";
  // The canonical body contract carries only height/weight/waist (and fills a missing waist with an
  // estimate), so body fat and the tape measurements are read from the submitted answers.
  const rawBody = effectiveRaw?.body || {};
  const rawCircumferences = effectiveRaw?.circumferences || {};
  let bodyFat = Number(
    body.bodyFat ?? body.body_fat ?? body.bodyFatPct ?? body.body_fat_pct ??
    rawBody.bodyFat ?? rawBody.body_fat ?? rawBody.bodyFatPct ?? rawBody.body_fat_pct ?? rawBody.body_fat_percent ?? rawBody.bodyFatPercentage ??
    effectiveRaw?.body_fat ?? effectiveRaw?.body_fat_percent ?? effectiveRaw?.bodyFatPct ?? effectiveRaw?.bodyFat ?? effectiveRaw?.body_fat_percentage,
  ) || null;
  if (bodyFat !== null && bodyFat > 0 && bodyFat <= 0.60) {
    bodyFat = Math.round(bodyFat * 100 * 10) / 10;
  }
  if (bodyFat !== null && (bodyFat < 3 || bodyFat > 65)) {
    bodyFat = null;
  }
  const neck = Number(body.neckCm || body.neck_cm || rawBody.neckCm || rawBody.neck_cm || rawCircumferences.neck_cm) || null;
  const waist = Number(rawBody.waistCm || rawBody.waist_cm || rawCircumferences.waist_cm || effectiveRaw?.waist_cm) || null;
  const hip = Number(body.hipCm || body.hip_cm || rawBody.hipCm || rawBody.hip_cm || rawCircumferences.hips_cm) || null;


  // Calculate US Navy Body Fat if neck and waist are present and direct bodyFat was not supplied
  if (!bodyFat && neck && waist && waist > neck) {
    if (isMale) {
      const logWaistNeck = Math.log10(waist - neck);
      const logHeight = Math.log10(height);
      const calculatedFat = 495 / (1.0324 - 0.19077 * logWaistNeck + 0.15456 * logHeight) - 450;
      if (calculatedFat >= 5 && calculatedFat <= 50) {
        bodyFat = Math.round(calculatedFat * 10) / 10;
      }
    } else if (hip && (waist + hip) > neck) {
      const logWaistHipNeck = Math.log10(waist + hip - neck);
      const logHeight = Math.log10(height);
      const calculatedFat = 495 / (1.29579 - 0.35004 * logWaistHipNeck + 0.22100 * logHeight) - 450;
      if (calculatedFat >= 8 && calculatedFat <= 55) {
        bodyFat = Math.round(calculatedFat * 10) / 10;
      }
    }
  }

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
  const steps = Number(cardio.averageDailySteps || cardio.average_daily_steps) || 6000;
  const trainDays = Number(training.preferredDaysPerWeek || training.preferred_days_per_week) || 3;
  let activityFactor = 1.20; // Sedentary (< 5000 steps)
  if (steps >= 12000) {
    activityFactor = 1.70; // High
  } else if (steps >= 8000) {
    activityFactor = 1.50; // Moderate
  } else if (steps >= 5000) {
    activityFactor = 1.35; // Light
  }
  if (trainDays >= 4 && activityFactor < 1.70) {
    activityFactor = Math.min(1.70, activityFactor + 0.05);
  }

  const tdee = Math.round(bmr * activityFactor);

  // 3. Goal-Driven Calorie Target
  // The canonical goal enum folds recomposition into FAT_LOSS; recover it from the submitted answer.
  const rawGoal = String(effectiveRaw?.goals?.primary ?? effectiveRaw?.primary_goal ?? "").trim().toUpperCase();
  const isRecomposition = rawGoal.includes("RECOMP") || rawGoal.includes("إعادة تكوين") || rawGoal.includes("اعادة تكوين");
  let primaryGoal = isRecomposition ? "BODY_RECOMPOSITION" : (goals.primary || "FAT_LOSS");
  // Bulking with high body fat (above 25% men / 35% women, or a BMI of 30+ when body fat is unknown)
  // adds fat to a body that already carries too much. Recomposition - a small deficit with high
  // protein and training - builds muscle while fat comes down; the coach sees why the goal changed.
  let goalRedirect = null;
  const bmiNow = weight / ((height / 100) ** 2);
  const tooMuchFatToBulk = bodyFat ? bodyFat > (isMale ? 25 : 35) : bmiNow >= 30;
  // "Let the coach decide": high body fat -> fat loss; moderate -> fat loss with muscle building
  // (recomposition); lean -> muscle gain. The coach sees the suggestion and why before approving.
  if (rawGoal === "COACH_DECIDES") {
    const moderateFat = bodyFat ? bodyFat > (isMale ? 18 : 28) : bmiNow >= 25;
    const chosen = tooMuchFatToBulk ? "FAT_LOSS" : moderateFat ? "BODY_RECOMPOSITION" : "MUSCLE_GAIN";
    const chosenAr = { FAT_LOSS: "نزول دهون ووزن", BODY_RECOMPOSITION: "نزول دهون مع شد وبناء عضل", MUSCLE_GAIN: "زيادة عضل ووزن" }[chosen];
    const basis = bodyFat ? `نسبة الدهون ${bodyFat}%` : `مؤشر كتلة الجسم ${bmiNow.toFixed(1)}`;
    goalRedirect = {
      from: "COACH_DECIDES",
      to: chosen,
      coach_review_required: true,
      reason_ar: `المتدرب ساب اختيار الهدف للكوتش؛ النظام اقترح "${chosenAr}" بناءً على ${basis}. راجعه قبل اعتماد الخطة.`,
    };
    primaryGoal = chosen;
  }
  // A body under BMI 18.5 asking to lose weight: never a deficit on a body that light. The goal
  // becomes building muscle and the coach reads why, so he can talk to the client and change it
  // (WHO thinness; severe thinness under 16 is refused earlier, api/services/serviceScope.js).
  const UNDERWEIGHT_BMI = 18.5;
  // Adults only: a BMI of 17-18 is normal for a growing child (see the young trainee rules below).
  if (!isYoungTrainee && bmiNow < UNDERWEIGHT_BMI && (primaryGoal === "FAT_LOSS" || primaryGoal === "BODY_RECOMPOSITION")) {
    goalRedirect = {
      from: primaryGoal,
      to: "MUSCLE_GAIN",
      coach_review_required: true,
      reason_ar: `وزن المتدرب تحت الطبيعي (مؤشر كتلة الجسم ${bmiNow.toFixed(1)}) وطلب نزول وزن؛ النظام حوّل الهدف لبناء عضل من غير أي عجز حراري. كلّمه: لو الهدف اتكتب غلط عدّله من المحرر، ولو مصمم على النزول وجّهه لدكتور الأول.`,
    };
    primaryGoal = "MUSCLE_GAIN";
  }
  if ((primaryGoal === "MUSCLE_GAIN" || primaryGoal === "LEAN_BULK") && tooMuchFatToBulk) {
    goalRedirect = {
      from: primaryGoal,
      to: "BODY_RECOMPOSITION",
      reason_ar: bodyFat
        ? `نسبة الدهون ${bodyFat}% أعلى من المناسب لزيادة الوزن؛ الهدف بقى "نزول دهون مع شد وبناء عضل" لحد ما النسبة تنزل، وبعدها نبدأ زيادة العضل والوزن.`
        : `مؤشر كتلة الجسم ${bmiNow.toFixed(1)} أعلى من المناسب لزيادة الوزن؛ الهدف بقى "نزول دهون مع شد وبناء عضل" لحد ما الوزن ينزل، وبعدها نبدأ زيادة العضل والوزن.`,
    };
    primaryGoal = "BODY_RECOMPOSITION";
  }
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

  // Minimum intake without medical supervision (AHA/ACC/TOS 2013 obesity guideline: 1200 kcal women,
  // 1500 kcal men). When maintenance itself is below the floor, the plan stays at maintenance.
  const calorieFloor = isMale ? 1500 : 1200;
  let calorieFloorApplied = false;
  if (targetCalories < calorieFloor && targetCalories < tdee) {
    targetCalories = Math.min(tdee, calorieFloor);
    calorieFloorApplied = true;
    calorieAdjustmentDesc += ` (تم رفع السعرات للحد الأدنى الآمن ${targetCalories} سعرة بدون إشراف طبي)`;
  }

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

  // Clinical Guard: Diabetes & Insulin Resistance Hypoglycemia Protection (ADA Guidelines)
  const hasDiabetesOrInsulinResistance =
    medical.hasDiabetes === true ||
    medical.hasInsulinResistance === true ||
    effectiveRaw?.medical?.hasDiabetes === true ||
    effectiveRaw?.medical?.hasInsulinResistance === true ||
    conditionsList.some(c => c.includes("DIABETES") || c.includes("INSULIN_RESISTANCE")) ||
    (biomarkerAnalysis.has_biomarker_flags && biomarkerAnalysis.flags.some(f => f.biomarker === 'GLUCOSE_METABOLISM'));

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

  if (
    rawDietChoice !== "AUTO_COACH_MATCH" &&
    rawDietChoice !== "AUTO" &&
    rawDietChoice !== "SMART_COACH_RECOMMENDATION" &&
    rawDietChoice !== "BALANCED_HIGH_PROTEIN" &&
    rawDietChoice !== ""
  ) {
    dietFramework = rawDietChoice;
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
    const fastingProtocol = readFormFastingProtocol(effectiveRaw) || "16_8";
    fastingWindowConfig = Object.freeze({
      framework: "INTERMITTENT_FASTING",
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
  // How a day is shared out. Protein is spread evenly over every sitting, snacks included: the
  // muscle answers to each meal on its own (about 0.3-0.4 g/kg a sitting, Moore 2015 / Schoenfeld
  // & Aragon 2018), so an even spread is worth more than the same protein piled into two plates.
  // Carbohydrate and fat follow the size of the sitting - a snack is a snack - and a snack of
  // protein with a little carbohydrate is also what keeps a client full between meals.
  const SNACK_ENERGY_SHARE = { 4: 0.15, 5: 0.14, 6: 0.12 };
  const isSnackMeal = (mealNumber) => mealCount >= 4 && mealNumber > 3;
  const mealDistribution = [];
  for (let i = 1; i <= mealCount; i++) {
    let pRatio = 1 / mealCount;
    let fRatio = 1 / mealCount;
    let cRatio = 1 / mealCount;

    let mealNameAr = `الوجبة ${i}`;
    if (mealCount === 2) {
      mealNameAr = i === 1 ? "الوجبة الأولى (كسر الصيام / إفطار كبير)" : "الوجبة الثانية (الوجبة الرئيسية / السحور أو العشاء)";
    } else if (mealCount === 3) {
      mealNameAr = i === 1 ? "وجبة الإفطار" : i === 2 ? "وجبة قبل التمرين / الغداء" : "وجبة العشاء / بعد التمرين";
      if (i === 1) cRatio = 0.30;
      else if (i === 2) cRatio = 0.40;
      else cRatio = 0.30;
    } else if (mealCount >= 4) {
      // The names say what the plate actually is: the kitchen writes breakfast, lunch and dinner
      // first and the snacks after them, and the names used to be shifted against it - meal 2 was
      // called a protein snack and came out as lunch.
      const SNACK_NAMES = ["سناك أول", "سناك تاني", "سناك تالت"];
      mealNameAr = i === 1 ? "وجبة الإفطار" : i === 2 ? "وجبة الغداء" : i === 3 ? "وجبة العشاء" : SNACK_NAMES[i - 4] || `سناك ${i - 3}`;
      // A snack used to take an equal share of the day: the "snack" of a 3574 kcal day was 927 kcal,
      // 357 g of sweet potato and 290 g of yogurt. It keeps its protein and gives back the rest.
      const snackShare = SNACK_ENERGY_SHARE[mealCount] || 0.15;
      const snacks = mealCount - 3;
      cRatio = fRatio = isSnackMeal(i) ? snackShare : (1 - snacks * snackShare) / 3;
    }

    mealDistribution.push({
      meal_number: i,
      meal_name_ar: mealNameAr,
      protein_g: Math.round(proteinG * pRatio),
      carb_g: Math.round(carbG * cRatio),
      fat_g: Math.round(fatG * fRatio),
      calories_kcal: Math.round((proteinG * pRatio * 4) + (carbG * cRatio * 4) + (fatG * fRatio * 9)),
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
      max_protein_per_kg: kidneyProteinCapped ? (biomarkerAnalysis?.dietary_modifications?.protein_cap_g_per_kg || null) : null,
      max_protein_g: kidneyProteinCapped ? proteinG : null,
      rationale_ar: kidneyProteinCapped ? `تحديد سقف البروتين عند ${proteinPerKg} جم/كجم لحماية وظائف الكلى بناءً على الفحوصات المخبرية` : null,
      liver_review_required: Boolean(hasLiverCondition),
      liver_guidance_ar: hasLiverCondition ? CLINICAL_GUIDELINES.LIVER.GUIDANCE_AR : null,
      hypoglycemia_guard_active: Boolean(hasDiabetesOrInsulinResistance),
      diabetes_type: isType1Diabetic ? "TYPE_1" : (isInsulinDependent ? "INSULIN_DEPENDENT_T2D" : (hasDiabetesOrInsulinResistance ? "DIABETES_OR_IR" : "NONE")),
      hypoglycemia_risk: (isType1Diabetic || isInsulinDependent || takesSecretagogue) ? "HIGH" : (hasDiabetesOrInsulinResistance ? "MODERATE" : "NONE"),
      takes_insulin_secretagogue: takesSecretagogue,
      secretagogue_alert_ar: takesSecretagogue ? "تنبيه سريري: أدوية محفزات إفراز الأنسولين (السلفونيل يوريا مثل أماريل أو دياميكرون) تزيد من خطر هبوط السكر أثناء الصيام أو التمارين المطولة؛ يجب توفير كربوهيدرات سريعة (قاعدة 15-15) ومراجعة الطبيب لتنسيق الجرعات." : null,
      hypoglycemia_guidance_ar: hasDiabetesOrInsulinResistance ? CLINICAL_GUIDELINES.DIABETES.SAFETY_GUIDANCE_AR : null,
      hypoglycemia_rescue_carbs_grams: hasDiabetesOrInsulinResistance ? CLINICAL_GUIDELINES.DIABETES.HYPOGLYCEMIA_RESCUE_CARBS_GRAMS : null,
      medical_coordination_required: Boolean(isType1Diabetic || isInsulinDependent),
      medical_coordination_notice_ar: (isType1Diabetic || isInsulinDependent) ? CLINICAL_GUIDELINES.DIABETES.INSULIN_COORDINATION_AR : null,
      ear_130g_disclaimer_ar: hasDiabetesOrInsulinResistance ? CLINICAL_GUIDELINES.DIABETES.EAR_130G_DISCLAIMER_AR : null,
      diabetic_carb_cap_applied: false,
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

  // 1. Evaluate Intake
  const intake_decision = evaluateIntake(canonicalIntake, evaluationContext);

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

  // Base weekly schedule for downstream cardio/mobility dependencies
  const baseWeeklySchedule =
    enrichedTrainingWeeks.length > 0 ? enrichedTrainingWeeks[0].sessions : [];
  const syntheticWeeklyPlan = {
    schedule_mode: training_mesocycle.schedule_mode,
    sessions: baseWeeklySchedule,
  };


  // 3. Cardio Engine V2 with Zone 2 Target Heart Rates
  const clientAge = canonicalIntake.personal?.dateOfBirth
    ? calculateAge(canonicalIntake.personal.dateOfBirth, evaluationContext.assessmentDate)
    : 30;
  const estimatedMaxHr = Math.round(208 - 0.7 * clientAge);
  const zone2LowBpm = Math.round(0.6 * estimatedMaxHr);
  const zone2HighBpm = Math.round(0.7 * estimatedMaxHr);

  const baseCardioProgram = buildCardioEngine(
    intake_decision,
    canonicalIntake,
    syntheticWeeklyPlan,
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

  const enrichedCardioSessions = (baseCardioProgram.weekly_schedule?.sessions || []).map(
    (session) => {
      const isHiit = String(session.modality_type || "").toUpperCase().includes("HIIT");
      const safeModality = (noHighIntensity && isHiit) ? "LISS" : session.modality_type;
      return Object.freeze({
        ...session,
        modality_type: safeModality,
        clinical_guidance_ar: noHighIntensity ? HIGH_INTENSITY_NOTE_AR : null,
        heart_rate_target: {
          estimated_hr_max: estimatedMaxHr,
          zone: "ZONE_2",
          target_range_bpm: `${zone2LowBpm} - ${zone2HighBpm} BPM`,
          target_low_bpm: zone2LowBpm,
          target_high_bpm: zone2HighBpm,
          guidance_ar: noHighIntensity
            ? `${HIGH_INTENSITY_NOTE_AR} معدل نبضات القلب المستهدف: بين ${zone2LowBpm} و ${zone2HighBpm} نبضة/دقيقة.`
            : `معدل نبضات القلب المستهدف أثناء جلسة الكارديو: بين ${zone2LowBpm} و ${zone2HighBpm} نبضة/دقيقة لحرق الدهون بكفاءة.`,
        },
      });
    },
  );

  const cardio_program_v2 = Object.freeze({
    ...baseCardioProgram,
    clinical_guardrails: {
      asthma_guard_active: Boolean(hasAsthma),
      cardiovascular_guard_active: Boolean(hasCardiovascular),
      hiit_banned: Boolean(noHighIntensity),
      preferred_modality: noHighIntensity ? "LISS_ZONE_2" : null,
      guidance_ar: noHighIntensity ? HIGH_INTENSITY_NOTE_AR : null,
    },
    weekly_schedule: Object.freeze({
      ...baseCardioProgram.weekly_schedule,
      sessions: Object.freeze(enrichedCardioSessions),
    }),
  });

  // 4. Mobility Engine V2
  const mobility_program = buildMobilityEngine(intake_decision, syntheticWeeklyPlan);

  // 5. Universal Nutrition Targets & Culinary Meal Generator
  const universalTargets = calculateUniversalNutritionTargets(canonicalIntake, evaluationContext, effectiveIntake);
  // The diabetic choice can replace a food after the generator split its large portions, so the
  // split runs again on the final meals.
  const isDiabeticClient = isDiabeticIntake(canonicalIntake, effectiveIntake);
  // Stored meal totals are recomputed from the items once every step has run.
  const culinaryRecipeMeals = refreshActualMacros(trimMealsToTarget(diversifyFatSources(
    splitOversizedPortions(enforceDiabeticCarbChoice(
      buildCulinaryRecipeMeals(universalTargets, canonicalIntake, effectiveIntake),
      isDiabeticClient,
    ), carbPortionLimit({ diabetic: isDiabeticClient })),
    buildAllergenContext(canonicalIntake, effectiveIntake),
    {
      kidneyProteinCapped: universalTargets.clinical_guardrails?.kidney_protein_capped === true,
    },
  )));

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

  const baseNutritionProgram = buildNutritionEngine({
    intake: canonicalIntake,
    evaluationContext,
    nutritionFoodCatalog,
  });

  const portionSolverStage = baseNutritionProgram.stages?.portion_solver;
  const sanitizedMealPlan = portionSolverStage ? sanitizeMealPlan(portionSolverStage, canonicalIntake) : null;
  const quantizedNutrition = sanitizedMealPlan ? quantizeNutritionPlan(sanitizedMealPlan) : null;

  // Format quantized plan to include both culinary recipes and smart swap alternatives
  const enhancedQuantizedPlan = {
    ...(quantizedNutrition || {}),
    daily_totals: {
      calories_kcal: universalTargets.target_calories || universalTargets.target_calories_kcal || 2000,
      protein_g: universalTargets.protein_g || 160,
      carbs_g: universalTargets.carb_g || universalTargets.carbohydrate_g || 200,
      fat_g: universalTargets.fat_g || 60,
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
  const preferredWorkoutTime = canonicalIntake.training?.preferredTime || effectiveIntake?.training?.preferredTime || effectiveIntake?.preferred_workout_time || "17:00";
  const clientBedtime = canonicalIntake.lifestyle?.sleep?.bedtime || effectiveIntake?.lifestyle?.sleep?.bedtime || effectiveIntake?.bedtime || "23:00";
  const clientWakeTime = canonicalIntake.lifestyle?.sleep?.wakeTime || effectiveIntake?.lifestyle?.sleep?.wakeTime || effectiveIntake?.wake_time || "07:00";

  const circadianTiming = generatePeriWorkoutNutrientTimingSchedule({
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
    targets: {
      ...universalTargets,
      meals: culinaryRecipeMeals,
    },
    macro_targets: {
      calories_kcal: universalTargets.target_calories || universalTargets.target_calories_kcal || 2000,
      protein_g: universalTargets.protein_g || 160,
      carbohydrate_g: universalTargets.carb_g || universalTargets.carbohydrate_g || 200,
      fat_g: universalTargets.fat_g || 60,
    },
    // The client's declared sugar in tea/coffee: not added to the targets, shown to the coach so the
    // extra 20-60 kcal a day is a decision and not a surprise.
    beverage_sugar_intake: effectiveIntake?.beverage_sugar_intake || null,
    sanitized_plan: sanitizedMealPlan,
    quantized_plan: enhancedQuantizedPlan,
    culinary_meals: culinaryRecipeMeals,
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
    age: Number(effectiveIntake?.age) || null,
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

  return Object.freeze({
    engine_version: MASTER_ENGINE_V2_VERSION,
    client_profile,
    intake_decision,
    training_program: enrichedTrainingMesocycle,
    cardio_program: cardio_program_v2,
    mobility_program,
    nutrition_program: nutrition_program_v2,
    hypoglycemia_guard: masterHypoglycemiaGuard,
    biomarker_analysis: universalTargets.biomarker_analysis,
    clinical_safety_shield: universalTargets.clinical_safety_shield,
    circadian_timing: Object.freeze(circadianTiming),
    recovery_autoregulation: Object.freeze({
      readiness_baseline: calculateTrainingReadiness({
        sleep_quality: canonicalIntake.lifestyle?.sleep?.quality || "GOOD",
        sleep_hours: canonicalIntake.lifestyle?.sleep?.hours || 7.5,
        stress_level: canonicalIntake.lifestyle?.stressLevel === 'HIGH' ? 8 : (canonicalIntake.lifestyle?.stressLevel === 'LOW' ? 2 : 4),
        energy_level: 8
      }),
      framework_ar: "نظام الاستشفاء وضبط الأحمال الذاتي (Autoregulated Recovery Framework)"
    }),
  });

}
