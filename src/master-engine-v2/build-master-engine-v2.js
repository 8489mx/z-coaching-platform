
/**
 * Automatically evaluates the client's intake data across physiological, medical, and lifestyle markers
 * to deterministically resolve the most suitable Diet Framework if "AUTO_COACH_MATCH" is selected.
 *
 * @param {Object} canonicalIntake
 * @param {Object} [rawIntake={}]
 * @returns {{ framework: string, reason_ar: string, reason_en: string }}
 */
export function resolveOptimalDietFramework(canonicalIntake, rawIntake = {}) {
  const medical = canonicalIntake?.medical || {};
  const nutrition = canonicalIntake?.nutrition || {};
  const lifestyle = canonicalIntake?.lifestyle || {};
  const training = canonicalIntake?.training || {};
  const rawMedical = rawIntake?.medical || {};
  const rawNutrition = rawIntake?.nutrition || {};

  // 1. IBS / Severe Digestion Bloating -> LOW_FODMAP
  const hasIbs =
    medical.hasIbs === true ||
    rawMedical.hasIbs === true ||
    medical.digestionIssues?.includes("IBS") ||
    rawMedical.digestionIssues?.includes("IBS") ||
    rawNutrition.hasBloating === true ||
    rawIntake?.digestive_issues === "IBS" ||
    rawIntake?.digestive_issues === "GERD" ||
    rawIntake?.digestive_issues === "BLOATING" ||
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
    (Array.isArray(rawIntake?.medical_conditions) && (rawIntake.medical_conditions.includes("PCOS") || rawIntake.medical_conditions.includes("INSULIN_RESISTANCE"))) ||
    (Array.isArray(medical.conditions) && medical.conditions.some(c => c.conditionCode === "PCOS" || c.conditionCode === "INSULIN_RESISTANCE"));

  if (hasPcosOrIr) {
    return {
      framework: "TARGETED_LOW_CARB",
      reason_ar: "تم اختيار اللو كارب المقنن (Targeted Low-Carb) تلقائياً لتحسين حساسية الإنسولين وتنظيم الهرمونات وتسريع حرق الدهون.",
      reason_en: "Targeted Low-Carb auto-selected to optimize insulin sensitivity and hormonal profile.",
    };
  }

  // 3. Busy schedule / Skips Breakfast -> INTERMITTENT_FASTING
  const prefersFasting =
    nutrition.preferredMealCount === 2 ||
    rawNutrition.preferredMealCount === 2 ||
    rawNutrition.skipsBreakfast === true ||
    rawNutrition.prefersFasting === true ||
    lifestyle.dailyRoutine === "BUSY_MORNINGS";

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
    rawIntake?.training?.experience === "ADVANCED" ||
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
import { sanitizeMealPlan, buildCulinaryRecipeMeals } from "../nutrition-meal-context-v2/index.js";
import { quantizeNutritionPlan } from "../nutrition-serving-quantizer-v2/index.js";
import { adaptIntakePayloadToCanonicalEngine } from "../intake-decision-engine/adapters/intake-adapter.js";
import { MASTER_ENGINE_V2_VERSION } from "./domain/enums.js";
import { CLINICAL_GUIDELINES } from "../config/clinical-guidelines.js";


function requireObject(value, name) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object.`);
  }
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
  const body = canonicalIntake.body || {};
  const personal = canonicalIntake.personal || canonicalIntake.client || {};
  const goals = canonicalIntake.goals || {};
  const cardio = canonicalIntake.cardio || {};
  const training = canonicalIntake.training || {};
  const nutrition = canonicalIntake.nutrition || {};
  const medical = canonicalIntake.medical || {};
  const rawMedical = rawIntake?.medical || {};

  const weight = Number(body.weightKg || body.weight_kg) || 75;
  const height = Number(body.heightCm || body.height_cm) || 175;
  const age = personal.dateOfBirth
    ? calculateAge(personal.dateOfBirth, evaluationContext.assessmentDate)
    : Number(personal.age) || 28;
  const isMale = personal.sex !== "FEMALE";
  let bodyFat = Number(body.bodyFat || body.body_fat) || null;
  const neck = Number(body.neckCm || body.neck_cm) || null;
  const waist = Number(body.waistCm || body.waist_cm) || null;
  const hip = Number(body.hipCm || body.hip_cm) || null;


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
  if (bodyFat && bodyFat > 0 && bodyFat < 50) {
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
  const primaryGoal = goals.primary || "FAT_LOSS";
  let targetCalories = tdee;
  let proteinPerKg = 2.0;
  let calorieAdjustmentDesc = "سعرات صيانة (Maintenance)";

  if (primaryGoal === "FAT_LOSS" || primaryGoal === "BODY_RECOMPOSITION") {
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
    rawIntake?.personal?.isLactating === true ||
    rawIntake?.goals?.isLactating === true ||
    rawIntake?.medical?.pregnancyStatus === "BREASTFEEDING" ||
    rawIntake?.medical?.isLactating === true ||
    rawIntake?.isLactating === true ||
    rawIntake?.nutrition?.isLactating === true;

  if (isLactating) {
    targetCalories += 450;
    calorieAdjustmentDesc = "خطة خسارة دهون تدريجية للمرضعات (+450 سعرة حرارية مضافة لحماية إدرار حليب الأم والوقاية من جفاف الرضاعة)";
  }

  // Clinical Guard: Kidney Disease & Renal Impairment Protein Cap (KDOQI Guideline)
  const conditionsList = [
    ...(Array.isArray(medical.conditions) ? medical.conditions : []),
    ...(Array.isArray(rawMedical.conditions) ? rawMedical.conditions : []),
    ...(Array.isArray(rawIntake?.medical_conditions) ? rawIntake.medical_conditions : [])
  ].map(c => typeof c === 'string' ? c.toUpperCase() : String(c?.conditionCode || c?.code || '').toUpperCase());

  const hasKidneyCondition =
    medical.hasKidneyCondition === true ||
    rawIntake?.medical?.hasKidneyCondition === true ||
    conditionsList.some(c => c.includes("KIDNEY") || c.includes("RENAL"));

  let kidneyProteinCapped = false;
  if (hasKidneyCondition) {
    if (proteinPerKg > CLINICAL_GUIDELINES.KIDNEY.MAX_PROTEIN_PER_KG) {
      proteinPerKg = CLINICAL_GUIDELINES.KIDNEY.MAX_PROTEIN_PER_KG;
      kidneyProteinCapped = true;
      calorieAdjustmentDesc += ` (${CLINICAL_GUIDELINES.KIDNEY.RATIONALE_AR})`;
    }
  }

  // Clinical Guard: Diabetes & Insulin Resistance Hypoglycemia Protection (ADA Guidelines)
  const hasDiabetesOrInsulinResistance =
    medical.hasDiabetes === true ||
    medical.hasInsulinResistance === true ||
    rawIntake?.medical?.hasDiabetes === true ||
    rawIntake?.medical?.hasInsulinResistance === true ||
    conditionsList.some(c => c.includes("DIABETES") || c.includes("INSULIN_RESISTANCE"));

  // 4. Macro Grams Breakdown
  const proteinG = Math.round(weight * proteinPerKg);
  const proteinKcal = proteinG * 4;

  const fatKcal = Math.round(targetCalories * 0.22); // 22% of total calories
  const minFatG = Math.round(weight * 0.6); // Minimum 0.6g/kg
  let fatG = Math.max(minFatG, Math.round(fatKcal / 9));

  const carbKcal = Math.max(0, targetCalories - proteinKcal - (fatG * 9));
  let carbG = Math.round(carbKcal / 4);


  
    // 5. Diet Framework Resolution
  const rawDietChoice = (
    nutrition.dietFramework ||
    nutrition.diet_framework ||
    rawIntake?.nutrition?.dietFramework ||
    rawIntake?.dietFramework ||
    "BALANCED_HIGH_PROTEIN"
  ).toUpperCase();

  let resolvedFrameworkObj = null;
  let dietFramework = rawDietChoice;

  if (rawDietChoice === "AUTO_COACH_MATCH" || rawDietChoice === "AUTO" || rawDietChoice === "SMART_COACH_RECOMMENDATION") {
    resolvedFrameworkObj = resolveOptimalDietFramework(canonicalIntake, rawIntake);
    dietFramework = resolvedFrameworkObj.framework;
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
    // Hard cap net carbs at 40g, rest fat 65-70%
    carbG = 40;
    const lowCarbProteinKcal = proteinG * 4;
    const lowCarbRemainingKcal = Math.max(0, targetCalories - lowCarbProteinKcal - 160);
    fatG = Math.round(lowCarbRemainingKcal / 9);
    lowCarbConfig = Object.freeze({
      framework: "TARGETED_LOW_CARB",
      framework_name_ar: "نظام اللو كارب والكيتو المقنن (Targeted Low-Carb)",
      net_carbs_target_g: 40,
      fat_ratio_percent: Math.round((fatG * 9 / targetCalories) * 100),
      carb_timing_ar: "توجيه حصة الكاربوهيدرات المحدودة (40 جم) لتكون حصراً قبل التمرين مباشرة لرفع الأداء.",
      excluded_foods_ar: "حظر تام لكافة المخبوزات والنشويات الصريحة (أرز، خبز، مكرونة، بطاطس).",
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
      weekday_deficit_calories_kcal: Math.round(targetCalories - 80),
      weekend_refeed_calories_kcal: Math.round(tdee),
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
    carbCyclingConfig = Object.freeze({
      framework: "CARB_CYCLING",
      framework_name_ar: "نظام تدوير الكاربوهيدرات الذكي (Carb Cycling)",
      high_carb_days_ar: "أيام تمرين العضلات الكبيرة (الأرجل / الظهر / الصدر)",
      low_carb_days_ar: "أيام الراحة والاستشفاء / الكارديو الخفيف",
      high_carb_targets: Object.freeze({
        calories_kcal: Math.round(targetCalories + 120),
        protein_g: proteinG,
        carbohydrate_g: Math.round(carbG + 35),
        fat_g: Math.max(minFatG, Math.round(fatG - 5)),
      }),
      low_carb_targets: Object.freeze({
        calories_kcal: Math.round(targetCalories - 160),
        protein_g: proteinG,
        carbohydrate_g: Math.max(50, Math.round(carbG - 45)),
        fat_g: Math.round(fatG + 5),
      }),
      weekly_energy_balance_ar: "متوسط السعرات الأسبوعية يطابق تماماً العجز المستهدف مع الاستفادة من قمم الجليكوجين وأكسدة الدهون.",
    });
  } else if (dietFramework === "INTERMITTENT_FASTING") {
    fastingWindowConfig = Object.freeze({
      framework: "INTERMITTENT_FASTING",
      framework_name_ar: "الصيام المتقطع الذكي (16/8 Intermittent Fasting)",
      fasting_hours: 16,
      eating_window_hours: 8,
      eating_window_schedule_ar: "نافذة تناول الطعام: 12:00 ظهراً إلى 8:00 مساءً (الصيام من 8 مساءً إلى 12 ظهر اليوم التالي)",
      rules_ar: "شرب الماء والقهوة السادة والشاي الأخضر والأعشاب مسموح وحر أثناء ساعات الصيام بدون سكر أو حليب.",
    });
  }

  // 5. Meal Distribution (2, 3, 4, 5, 6 Meals)
  const mealCount = Number(nutrition.preferredMealCount || nutrition.mealsPerDay || nutrition.preferred_meal_count) || 3;
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
    } else if (mealCount === 4) {
      mealNameAr = i === 1 ? "وجبة الإفطار" : i === 2 ? "وجبة الغداء" : i === 3 ? "وجبة العشاء" : "سناك صحي خفيف";
    } else if (mealCount === 5) {
      mealNameAr = i === 1 ? "الوجبة 1 (إفطار صغير عالي الكثافة)" : i === 2 ? "الوجبة 2 (سناك بروتيني أول)" : i === 3 ? "الوجبة 3 (غداء صغير الحجم)" : i === 4 ? "الوجبة 4 (سناك بروتيني ثانٍ)" : "الوجبة 5 (عشاء مريح للهضم)";
    } else if (mealCount === 6) {
      mealNameAr = i === 1 ? "الوجبة 1 (إفطار صغير عالي الكثافة)" : i === 2 ? "الوجبة 2 (سناك بروتيني أول)" : i === 3 ? "الوجبة 3 (غداء صغير الحجم)" : i === 4 ? "الوجبة 4 (سناك بروتيني ثانٍ)" : i === 5 ? "الوجبة 5 (عشاء خفيف)" : "الوجبة 6 (سناك مسائي خفيف)";
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


  return {
    bmr,
    bmr_formula: bmrFormula,
    activity_factor: activityFactor,
    tdee,
    target_calories: targetCalories,
    target_calories_kcal: targetCalories,
    total_calories: targetCalories,
    calories_kcal: targetCalories,
    calorie_adjustment_desc: calorieAdjustmentDesc,
    protein_g: proteinG,
    total_protein_g: proteinG,
    protein_per_kg: proteinPerKg,
    carbohydrate_g: carbG,
    carb_g: carbG,
    total_carbs_g: carbG,
    fat_g: fatG,
    total_fat_g: fatG,
    fiber_g: isMale ? 35 : 25,
    water_liters: Number((weight * 0.040).toFixed(1)),
    hydration: {
      formula: "(Weight * 0.040) + 0.5L per workout hour",
      rest_day_water_liters: Number((weight * 0.040).toFixed(1)),
      training_day_water_liters: Number((weight * 0.040 + 0.5).toFixed(1)),
      recommended_range_liters: `${(weight * 0.040).toFixed(1)} - ${(weight * 0.040 + 0.5).toFixed(1)} لتر/يوم`,
      guidance_ar: `احتياج السوائل اليومي: ${(weight * 0.040).toFixed(1)} لتر في أيام الراحة، و ${(weight * 0.040 + 0.5).toFixed(1)} لتر في أيام التمرين (+0.5 لتر لتعويض العرق والأملاح أثناء التدريب).`,
    },
    meals_count: mealCount,
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
    clinical_guardrails: {
      kidney_protein_capped: Boolean(kidneyProteinCapped),
      max_protein_per_kg: kidneyProteinCapped ? CLINICAL_GUIDELINES.KIDNEY.MAX_PROTEIN_PER_KG : null,
      max_protein_g: kidneyProteinCapped ? proteinG : null,
      rationale_ar: kidneyProteinCapped ? CLINICAL_GUIDELINES.KIDNEY.RATIONALE_AR : null,
      hypoglycemia_guard_active: Boolean(hasDiabetesOrInsulinResistance),
      hypoglycemia_guidance_ar: hasDiabetesOrInsulinResistance ? CLINICAL_GUIDELINES.DIABETES.SAFETY_GUIDANCE_AR : null,
      hypoglycemia_rescue_carbs_grams: hasDiabetesOrInsulinResistance ? CLINICAL_GUIDELINES.DIABETES.HYPOGLYCEMIA_RESCUE_CARBS_GRAMS : null,
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

  const canonicalIntake = adaptIntakePayloadToCanonicalEngine(intake);

  // 1. Evaluate Intake
  const intake_decision = evaluateIntake(canonicalIntake, evaluationContext);

  // 2. Training Engine V2 (Multi-Week Meso-Cycle Periodization)
  const training_mesocycle = buildTrainingMesoCycle(intake_decision, {
    weeksCount: options.weeksCount || 5,
    muscleBias: options.muscleBias || null,
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
              ...(intake?.medical || {}),
              injuries: [
                ...(canonicalIntake.training?.injuries || []),
                ...(intake?.training?.injuries || []),
                ...(canonicalIntake.medical?.injuries || []),
                ...(intake?.medical?.injuries || []),
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
  const rawMedical = intake?.medical || {};
  const rawConditions = [
    ...(Array.isArray(medical.conditions) ? medical.conditions : []),
    ...(Array.isArray(rawMedical.conditions) ? rawMedical.conditions : []),
    ...(Array.isArray(intake?.medical_conditions) ? intake.medical_conditions : []),
    ...(Array.isArray(intake_decision.profile?.medical_conditions) ? intake_decision.profile.medical_conditions : []),
    ...(Array.isArray(intake_decision.hard_constraints) ? intake_decision.hard_constraints.map(c => c.code) : [])
  ].map(c => typeof c === 'string' ? c.toUpperCase() : String(c?.conditionCode || c?.code || '').toUpperCase());

  const hasAsthma =
    medical.hasAsthma === true ||
    rawMedical.hasAsthma === true ||
    rawConditions.some(c => c.includes("ASTHMA") || c.includes("RESPIRATORY"));

  const enrichedCardioSessions = (baseCardioProgram.weekly_schedule?.sessions || []).map(
    (session) => {
      const isHiit = String(session.modality_type || "").toUpperCase().includes("HIIT");
      const safeModality = (hasAsthma && isHiit) ? "LISS" : session.modality_type;
      return Object.freeze({
        ...session,
        modality_type: safeModality,
        clinical_guidance_ar: hasAsthma ? CLINICAL_GUIDELINES.RESPIRATORY.SAFETY_GUIDANCE_AR : null,
        heart_rate_target: {
          estimated_hr_max: estimatedMaxHr,
          zone: "ZONE_2",
          target_range_bpm: `${zone2LowBpm} - ${zone2HighBpm} BPM`,
          target_low_bpm: zone2LowBpm,
          target_high_bpm: zone2HighBpm,
          guidance_ar: hasAsthma
            ? `${CLINICAL_GUIDELINES.RESPIRATORY.SAFETY_GUIDANCE_AR} معدل نبضات القلب المستهدف: بين ${zone2LowBpm} و ${zone2HighBpm} نبضة/دقيقة.`
            : `معدل نبضات القلب المستهدف أثناء جلسة الكارديو: بين ${zone2LowBpm} و ${zone2HighBpm} نبضة/دقيقة لحرق الدهون بكفاءة.`,
        },
      });
    },
  );

  const cardio_program_v2 = Object.freeze({
    ...baseCardioProgram,
    clinical_guardrails: {
      asthma_guard_active: Boolean(hasAsthma),
      hiit_banned: Boolean(hasAsthma),
      preferred_modality: hasAsthma ? "LISS_ZONE_2" : null,
      guidance_ar: hasAsthma ? CLINICAL_GUIDELINES.RESPIRATORY.SAFETY_GUIDANCE_AR : null,
    },
    weekly_schedule: Object.freeze({
      ...baseCardioProgram.weekly_schedule,
      sessions: Object.freeze(enrichedCardioSessions),
    }),
  });

  // 4. Mobility Engine V2
  const mobility_program = buildMobilityEngine(intake_decision, syntheticWeeklyPlan);

  // 5. Universal Nutrition Targets & Culinary Meal Generator
  const universalTargets = calculateUniversalNutritionTargets(canonicalIntake, evaluationContext, intake);
  const culinaryRecipeMeals = buildCulinaryRecipeMeals(universalTargets, canonicalIntake, intake);

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
    sanitized_plan: sanitizedMealPlan,
    quantized_plan: enhancedQuantizedPlan,
    culinary_meals: culinaryRecipeMeals,
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

  return Object.freeze({
    engine_version: MASTER_ENGINE_V2_VERSION,
    intake_decision,
    training_program: enrichedTrainingMesocycle,
    cardio_program: cardio_program_v2,
    mobility_program,
    nutrition_program: nutrition_program_v2,
    hypoglycemia_guard: masterHypoglycemiaGuard,
  });

}
