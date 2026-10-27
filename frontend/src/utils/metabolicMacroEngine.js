/**
 * Unified Metabolic & Macro Calculator Engine (2026 Sports Science Standard)
 *
 * 1. Additive TDEE Decoupling:
 *    TDEE = BMR * (Daily Activity Factor + Workout Frequency Factor)
 *    - Daily Activity: 1.20 (Desk/Sedentary), 1.30 (Light movement), 1.45 (Standing/Walking), 1.60 (Heavy physical work).
 *    - Workout Frequency: 0.0 (None), 0.075 (1-2 days), 0.15 (3-5 days), 0.25 (6+ days).
 *
 * 2. Obese BMI Protein Cap:
 *    If BMI >= 30 and not muscular:
 *    Adjusted Weight = 28 * (Height in meters)^2
 *
 * 3. Hormonal Fat Floor:
 *    Fat = Math.max(TargetCalories * 0.25 / 9, ProteinWeightKg * 0.6, MinimumFloor)
 *    Minimum Floor: >= 40g for females, >= 50g for males.
 */

export const DAILY_ACTIVITY_FACTORS = {
  SEDENTARY_DESK: { value: 1.20, label_ar: 'مكتبي خامل (قليل الحركة)' },
  LIGHT_MOVEMENT: { value: 1.30, label_ar: 'حركة خفيفة (5,000 - 7,000 خطوة)' },
  STANDING_WALKING: { value: 1.45, label_ar: 'وقوف ومشي مستمر (8,000 - 11,000 خطوة)' },
  HEAVY_PHYSICAL: { value: 1.60, label_ar: 'عمل بدني شاق ومجهد' }
};

export const WORKOUT_FREQUENCY_FACTORS = {
  NO_WORKOUTS: { value: 0.000, label_ar: 'بدون تمرين مقاومة' },
  DAYS_1_TO_2: { value: 0.075, label_ar: '1 - 2 يوم أسبوعياً' },
  DAYS_3_TO_5: { value: 0.150, label_ar: '3 - 5 أيام أسبوعياً' },
  DAYS_6_PLUS: { value: 0.250, label_ar: '6+ أيام أسبوعياً (مكثف)' }
};

export const GOAL_CALORIE_MULTIPLIERS = {
  AGGRESSIVE_CUT: { value: 0.75, label_ar: 'تنشيف سريع قاسي (-25%)' },
  FAT_LOSS_STANDARD: { value: 0.80, label_ar: 'تنشيف وحرق دهون معياري (-20%)' },
  MAINTENANCE: { value: 1.00, label_ar: 'ثبات وإعادة تشكيل الجسم (0%)' },
  LEAN_BULK: { value: 1.10, label_ar: 'بناء عضلي صافي (+10%)' },
  MAX_BULK: { value: 1.18, label_ar: 'تضخيم وزيادة وزن (+18%)' }
};

/**
 * Calculates BMR deterministically without silent anthropometric defaults.
 */
export function calculateBMR({
  gender = 'MALE',
  age,
  weight_kg,
  height_cm,
  body_fat_percent = null
} = {}) {
  const safeWeight = Number(weight_kg);
  const safeHeight = Number(height_cm);
  const safeAge = Number(age);

  if (
    !Number.isFinite(safeWeight) || safeWeight <= 0 ||
    !Number.isFinite(safeHeight) || safeHeight <= 0 ||
    !Number.isFinite(safeAge) || safeAge <= 0
  ) {
    return null;
  }

  if (body_fat_percent && body_fat_percent > 5 && body_fat_percent < 60) {
    const leanMass = safeWeight * (1 - (body_fat_percent / 100));
    return Math.round(370 + (21.6 * leanMass));
  }

  if (gender === 'FEMALE') {
    return Math.round((10 * safeWeight) + (6.25 * safeHeight) - (5 * safeAge) - 161);
  }
  return Math.round((10 * safeWeight) + (6.25 * safeHeight) - (5 * safeAge) + 5);
}

/**
 * Calculates complete metabolic and macronutrient profile without silent anthropometric defaults.
 */
export function calculateMetabolicMacroProfile({
  gender = 'MALE',
  age,
  weight_kg,
  height_cm,
  body_fat_percent = null,
  daily_activity = 'STANDING_WALKING',
  workout_frequency = 'DAYS_3_TO_5',
  goal = 'FAT_LOSS_STANDARD',
  protein_per_kg = 2.2,
  is_muscular = false
} = {}) {
  const safeWeight = Number(weight_kg);
  const safeHeight = Number(height_cm);
  const safeAge = Number(age);

  const missing_fields = [];
  if (!Number.isFinite(safeWeight) || safeWeight <= 0) missing_fields.push('weight_kg');
  if (!Number.isFinite(safeHeight) || safeHeight <= 0) missing_fields.push('height_cm');
  if (!Number.isFinite(safeAge) || safeAge <= 0) missing_fields.push('age');

  if (missing_fields.length > 0) {
    return {
      is_valid: false,
      missing_fields,
      error_ar: 'بيانات القياسات الأساسية غير مكتملة (الوزن والطول والعمر مطلوبة لحساب السعرات والماكروز بدقة دون افتراضات صامتة).',
      gender,
      age: Number.isFinite(safeAge) && safeAge > 0 ? safeAge : null,
      weight_kg: Number.isFinite(safeWeight) && safeWeight > 0 ? safeWeight : null,
      height_cm: Number.isFinite(safeHeight) && safeHeight > 0 ? safeHeight : null,
      bmi: null,
      is_bmi_cap_applied: false,
      calculation_weight_for_protein_kg: null,
      bmr_kcal: null,
      tdee_multiplier: null,
      tdee_kcal: null,
      target_calories_kcal: null,
      macro_targets: {
        protein_g: null,
        protein_kcal: null,
        protein_percent: 0,
        fat_g: null,
        fat_kcal: null,
        fat_percent: 0,
        carbs_g: null,
        carbs_kcal: null,
        carbs_percent: 0
      },
      hormonal_fat_floor_active: false,
      water_target_liters: null,
      steps_target: null
    };
  }

  const heightMeters = safeHeight / 100;
  const bmi = safeWeight / (heightMeters * heightMeters);

  // 1. Obese BMI Protein Cap
  let calculationWeightForProtein = safeWeight;
  let isBmiCapApplied = false;

  if (bmi >= 30 && !is_muscular) {
    calculationWeightForProtein = Math.round(28 * (heightMeters * heightMeters) * 10) / 10;
    isBmiCapApplied = true;
  }

  // 2. BMR & Additive TDEE Decoupling
  const bmr = calculateBMR({ gender, age: safeAge, weight_kg: safeWeight, height_cm: safeHeight, body_fat_percent });

  const activityFactor = (DAILY_ACTIVITY_FACTORS[daily_activity] || DAILY_ACTIVITY_FACTORS.STANDING_WALKING).value;
  const workoutFactor = (WORKOUT_FREQUENCY_FACTORS[workout_frequency] || WORKOUT_FREQUENCY_FACTORS.DAYS_3_TO_5).value;
  const combinedTdeeMultiplier = Math.round((activityFactor + workoutFactor) * 1000) / 1000;

  const tdee = Math.round(bmr * combinedTdeeMultiplier);

  // 3. Target Calories
  const goalMultiplier = (GOAL_CALORIE_MULTIPLIERS[goal] || GOAL_CALORIE_MULTIPLIERS.FAT_LOSS_STANDARD).value;
  const targetCalories = Math.round(tdee * goalMultiplier);

  // 4. Protein Partitioning
  const targetProteinGrams = Math.round(calculationWeightForProtein * Number(protein_per_kg || 2.2));
  const proteinCalories = targetProteinGrams * 4;

  // 5. Hormonal Fat Floor
  const absoluteMinFat = gender === 'FEMALE' ? 40 : 50;
  const percentageBasedFat = (targetCalories * 0.25) / 9;
  const bodyWeightBasedFat = calculationWeightForProtein * 0.6;
  const targetFatGrams = Math.round(Math.max(percentageBasedFat, bodyWeightBasedFat, absoluteMinFat));
  const fatCalories = targetFatGrams * 9;

  // 6. Carbohydrate Remainder
  const remainingCalories = Math.max(0, targetCalories - (proteinCalories + fatCalories));
  const targetCarbGrams = Math.round(remainingCalories / 4);

  // 7. Water & NEAT
  const waterTargetLiters = (safeWeight * 0.035 + (workoutFactor > 0 ? 0.6 : 0)).toFixed(1);
  const stepsTarget = (goal.includes('CUT') || goal.includes('FAT')) ? 10000 : 8000;

  return {
    is_valid: true,
    missing_fields: [],
    gender,
    age: safeAge,
    weight_kg: safeWeight,
    height_cm: safeHeight,
    bmi: Math.round(bmi * 10) / 10,
    is_bmi_cap_applied: isBmiCapApplied,
    calculation_weight_for_protein_kg: calculationWeightForProtein,
    bmr_kcal: bmr,
    tdee_multiplier: combinedTdeeMultiplier,
    tdee_kcal: tdee,
    target_calories_kcal: targetCalories,
    macro_targets: {
      protein_g: targetProteinGrams,
      protein_kcal: proteinCalories,
      protein_percent: Math.round((proteinCalories / targetCalories) * 100),
      fat_g: targetFatGrams,
      fat_kcal: fatCalories,
      fat_percent: Math.round((fatCalories / targetCalories) * 100),
      carbs_g: targetCarbGrams,
      carbs_kcal: targetCarbGrams * 4,
      carbs_percent: Math.round(((targetCarbGrams * 4) / targetCalories) * 100)
    },
    hormonal_fat_floor_active: targetFatGrams === absoluteMinFat,
    water_target_liters: Number(waterTargetLiters),
    steps_target: stepsTarget,
    methodology_policy: {
      engine_id: 'MANUAL_PRECISION_CALCULATOR_V1',
      bmr_formula: (body_fat_percent && Number(body_fat_percent) > 3 && Number(body_fat_percent) < 60) ? 'KATCH_MCARDLE' : 'MIFFLIN_ST_JEOR',
      pal_model: 'ADDITIVE_NEAT_PLUS_EAT',
      deficit_model: 'MULTIPLICATIVE_GOAL_FACTOR',
      protein_reference_basis: isBmiCapApplied ? 'IDEAL_BODY_WEIGHT_BMI_30_CAP' : 'TOTAL_BODY_WEIGHT'
    }
  };
}
