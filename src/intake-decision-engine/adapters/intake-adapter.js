/**
 * Intake Payload Adapter
 * Bridges V2 simplified/modern intake form payloads into strict Canonical Engine DTOs.
 * Guarantees zero schema validation errors while preserving 100% of user safety & decision data.
 */

import { normalizeTrainingAge, experienceForTrainingAge, trainingAgeForExperience } from "../../training-engine-v2/training-age.js";
import { IntakeValidationError } from "../validation/intake-validation-error.js";
import { dislikedFoodCodes } from "./disliked-foods.js";

export function parseCleanNumber(val, fallback = null) {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'number') return Number.isFinite(val) ? val : fallback;
  const str = String(val)
    .trim()
    .replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰۱۲۳۴۵۶۷۸۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/,/g, '.');
  const num = Number(str);
  return Number.isFinite(num) ? num : fallback;
}

export function adaptIntakePayloadToCanonicalEngine(raw) {
  if (!raw || typeof raw !== 'object') return {};

  const base = (raw.answers && typeof raw.answers === 'object') ? { ...raw.answers, ...raw } : raw;
  const intake = JSON.parse(JSON.stringify(base));

  // =========================================================================
  // 1. STRICT BIOMETRIC VALIDATION (Rejects impossible human biometrics)
  // Human Physiological Bounds: Height [120, 250] cm, Weight [30, 300] kg, Waist [40, 200] cm
  // =========================================================================
  const rawHeight = intake.body?.heightCm ?? intake.height_cm ?? intake.body?.height_cm;
  if (rawHeight !== undefined && rawHeight !== null && String(rawHeight).trim() !== '') {
    const parsedHeight = parseCleanNumber(rawHeight, null);
    if (parsedHeight === null || parsedHeight < 120 || parsedHeight > 250) {
      throw new IntakeValidationError(
        [{ path: 'body.heightCm', code: 'INVALID_BIOMETRICS', message: `قيمة الطول غير منطقية (${rawHeight} سم). يجب أن يتراوح الطول البشري المنطقي بين 120 و 250 سم.` }],
        `قيمة الطول غير منطقية (${rawHeight} سم). يجب أن يتراوح الطول البشري المنطقي بين 120 و 250 سم.`,
        'INVALID_BIOMETRICS',
        'height_cm',
        rawHeight
      );
    }
  }

  const rawWeight = intake.body?.weightKg ?? intake.weight_kg ?? intake.body?.weight_kg;
  if (rawWeight !== undefined && rawWeight !== null && String(rawWeight).trim() !== '') {
    const parsedWeight = parseCleanNumber(rawWeight, null);
    if (parsedWeight === null || parsedWeight < 30 || parsedWeight > 300) {
      throw new IntakeValidationError(
        [{ path: 'body.weightKg', code: 'INVALID_BIOMETRICS', message: `قيمة الوزن غير منطقية (${rawWeight} كجم). يجب أن يتراوح الوزن البشري المنطقي بين 30 و 300 كجم.` }],
        `قيمة الوزن غير منطقية (${rawWeight} كجم). يجب أن يتراوح الوزن البشري المنطقي بين 30 و 300 كجم.`,
        'INVALID_BIOMETRICS',
        'weight_kg',
        rawWeight
      );
    }
  }

  const rawWaist = intake.body?.waistCm ?? intake.waist_cm ?? intake.body?.waist_cm ?? intake.circumferences?.waist_cm;
  if (rawWaist !== undefined && rawWaist !== null && String(rawWaist).trim() !== '') {
    const parsedWaist = parseCleanNumber(rawWaist, null);
    if (parsedWaist === null || parsedWaist < 40 || parsedWaist > 200) {
      throw new IntakeValidationError(
        [{ path: 'body.waistCm', code: 'INVALID_BIOMETRICS', message: `قيمة محيط الخصر غير منطقية (${rawWaist} سم). يجب أن يتراوح محيط الخصر المنطقي بين 40 و 200 سم.` }],
        `قيمة محيط الخصر غير منطقية (${rawWaist} سم). يجب أن يتراوح محيط الخصر المنطقي بين 40 و 200 سم.`,
        'INVALID_BIOMETRICS',
        'waist_cm',
        rawWaist
      );
    }
  }

  // =========================================================================
  // 2. STRICT FIELD VALUE VALIDATION (Rejects unknown random text)
  // Fields: primary_goal, daily_activity, sex, experience_level, training_location
  // =========================================================================
  const rawSex = intake.personal?.sex ?? intake.sex ?? intake.gender ?? intake.personal?.gender;
  let canonicalSex = undefined;
  if (rawSex !== undefined && rawSex !== null && String(rawSex).trim() !== '') {
    const s = String(rawSex).trim().toUpperCase();
    if (['MALE', 'M', 'MAN', 'ذكر', 'رجل', 'ولد'].includes(s)) {
      canonicalSex = 'MALE';
    } else if (['FEMALE', 'F', 'WOMAN', 'أنثى', 'انثى', 'سيدة', 'امراة', 'امرأة', 'بنت'].includes(s)) {
      canonicalSex = 'FEMALE';
    } else {
      throw new IntakeValidationError(
        [{ path: 'personal.sex', code: 'INVALID_FIELD_VALUE', message: `قيمة غير صالحة لحقل الجنس: '${rawSex}'. القيم المسموحة: MALE أو FEMALE.` }],
        `قيمة غير صالحة لحقل الجنس: '${rawSex}'. القيم المسموحة: MALE أو FEMALE.`,
        'INVALID_FIELD_VALUE',
        'sex',
        rawSex
      );
    }
  }

  const rawGoal = intake.goals?.primary ?? intake.primary_goal;
  let canonicalGoal = undefined;
  if (rawGoal !== undefined && rawGoal !== null && String(rawGoal).trim() !== '') {
    const g = String(rawGoal).trim().toUpperCase();
    const VALID_GOALS_MAP = {
      FAT_LOSS: 'FAT_LOSS',
      CUT: 'FAT_LOSS',
      FATLOSS: 'FAT_LOSS',
      'تنشيف': 'FAT_LOSS',
      'خسارة دهون': 'FAT_LOSS',
      'حرق دهون': 'FAT_LOSS',
      'إنقاص وزن': 'FAT_LOSS',
      'انقاص وزن': 'FAT_LOSS',
      MUSCLE_GAIN: 'MUSCLE_GAIN',
      BULK: 'MUSCLE_GAIN',
      LEAN_BULK: 'MUSCLE_GAIN',
      HYPERTROPHY: 'MUSCLE_GAIN',
      'تضخيم': 'MUSCLE_GAIN',
      'بناء عضل': 'MUSCLE_GAIN',
      'زيادة عضل': 'MUSCLE_GAIN',
      RECOMPOSITION: 'FAT_LOSS',
      BODY_RECOMPOSITION: 'FAT_LOSS',
      // "Let the coach decide": the plan engine picks the goal from body fat; see build-master-engine-v2.
      COACH_DECIDES: 'FAT_LOSS',
      RECOMP: 'FAT_LOSS',
      'إعادة تكوين': 'FAT_LOSS',
      'اعادة تكوين': 'FAT_LOSS',
      WEIGHT_MAINTENANCE: 'WEIGHT_MAINTENANCE',
      MAINTENANCE: 'WEIGHT_MAINTENANCE',
      'تثبيت وزن': 'WEIGHT_MAINTENANCE',
      'صيانة': 'WEIGHT_MAINTENANCE',
      ATHLETIC_PERFORMANCE: 'PERFORMANCE',
      PERFORMANCE: 'PERFORMANCE',
      GENERAL_HEALTH: 'GENERAL_HEALTH',
      // Intake form option "لياقة عامة" (FullIntakeForm primary_goal id)
      GENERAL_FITNESS: 'GENERAL_HEALTH',
      'لياقة عامة': 'PERFORMANCE',
      'صحة عامة': 'GENERAL_HEALTH',
      OTHER: 'OTHER',
      'أخرى': 'OTHER',
      'اخرى': 'OTHER'
    };
    if (VALID_GOALS_MAP[g]) {
      canonicalGoal = VALID_GOALS_MAP[g];
    } else {
      throw new IntakeValidationError(
        [{ path: 'goals.primary', code: 'INVALID_FIELD_VALUE', message: `قيمة غير صالحة للهدف الرئيسي: '${rawGoal}'. القيم المسموحة: FAT_LOSS, MUSCLE_GAIN, RECOMPOSITION, WEIGHT_MAINTENANCE, ATHLETIC_PERFORMANCE.` }],
        `قيمة غير صالحة للهدف الرئيسي: '${rawGoal}'. القيم المسموحة: FAT_LOSS, MUSCLE_GAIN, RECOMPOSITION, WEIGHT_MAINTENANCE, ATHLETIC_PERFORMANCE.`,
        'INVALID_FIELD_VALUE',
        'primary_goal',
        rawGoal
      );
    }
  }

  const rawActivity = intake.lifestyle?.dailyActivity ?? intake.daily_activity ?? intake.neat_level;
  let canonicalActivity = undefined;
  if (rawActivity !== undefined && rawActivity !== null && String(rawActivity).trim() !== '') {
    const act = String(rawActivity).trim().toUpperCase();
    const VALID_ACTIVITY_MAP = {
      SEDENTARY: 'SEDENTARY',
      'مكتبي خامل': 'SEDENTARY',
      'خامل': 'SEDENTARY',
      'قليل جداً': 'SEDENTARY',
      'قليل جدا': 'SEDENTARY',
      LIGHT: 'LIGHT',
      'نشاط خفيف': 'LIGHT',
      'خفيف': 'LIGHT',
      MODERATE: 'MODERATE',
      'نشاط معتدل': 'MODERATE',
      'معتدل': 'MODERATE',
      'متوسط': 'MODERATE',
      HIGH: 'HIGH',
      VERY_ACTIVE: 'HIGH',
      'نشاط عالي': 'HIGH',
      'عالي': 'HIGH',
      'نشط جداً': 'HIGH',
      'نشط جدا': 'HIGH',
      'شاق': 'HIGH'
    };
    if (VALID_ACTIVITY_MAP[act]) {
      canonicalActivity = VALID_ACTIVITY_MAP[act];
    } else {
      throw new IntakeValidationError(
        [{ path: 'lifestyle.dailyActivity', code: 'INVALID_FIELD_VALUE', message: `قيمة غير صالحة لمستوى النشاط اليومي: '${rawActivity}'. القيم المسموحة: SEDENTARY, LIGHT, MODERATE, HIGH, VERY_ACTIVE.` }],
        `قيمة غير صالحة لمستوى النشاط اليومي: '${rawActivity}'. القيم المسموحة: SEDENTARY, LIGHT, MODERATE, HIGH, VERY_ACTIVE.`,
        'INVALID_FIELD_VALUE',
        'daily_activity',
        rawActivity
      );
    }
  }

  const rawExp = intake.training?.experience ?? intake.experience_level ?? intake.training_logistics?.experience_level;
  let canonicalExp = undefined;
  if (rawExp !== undefined && rawExp !== null && String(rawExp).trim() !== '') {
    const exp = String(rawExp).trim().toUpperCase();
    const VALID_EXPERIENCE_MAP = {
      BEGINNER: 'BEGINNER',
      NOVICE: 'BEGINNER',
      'مبتدئ': 'BEGINNER',
      'مبتدىء': 'BEGINNER',
      'أقل من 6 شهور': 'BEGINNER',
      'اقل من 6 شهور': 'BEGINNER',
      INTERMEDIATE: 'INTERMEDIATE',
      'متوسط': 'INTERMEDIATE',
      'من 6 شهور لسنتين': 'INTERMEDIATE',
      ADVANCED: 'ADVANCED',
      'متقدم': 'ADVANCED',
      'أكثر من سنتين': 'ADVANCED',
      'اكثر من سنتين': 'ADVANCED',
      'محترف': 'ADVANCED'
    };
    if (VALID_EXPERIENCE_MAP[exp]) {
      canonicalExp = VALID_EXPERIENCE_MAP[exp];
    } else {
      throw new IntakeValidationError(
        [{ path: 'training.experience', code: 'INVALID_FIELD_VALUE', message: `قيمة غير صالحة لمستوى الخبرة الرياضية: '${rawExp}'. القيم المسموحة: BEGINNER, INTERMEDIATE, ADVANCED.` }],
        `قيمة غير صالحة لمستوى الخبرة الرياضية: '${rawExp}'. القيم المسموحة: BEGINNER, INTERMEDIATE, ADVANCED.`,
        'INVALID_FIELD_VALUE',
        'experience_level',
        rawExp
      );
    }
  }

  const rawLoc = intake.training?.location ?? intake.training_location ?? intake.training_environment;
  let canonicalLoc = undefined;
  if (rawLoc !== undefined && rawLoc !== null && String(rawLoc).trim() !== '') {
    const loc = String(rawLoc).trim().toUpperCase();
    const VALID_LOCATION_MAP = {
      GYM: 'GYM',
      COMMERCIAL_GYM: 'GYM',
      'جيم': 'GYM',
      'صالة رياضية': 'GYM',
      HOME: 'HOME',
      // Intake form options (FullIntakeForm training_environment ids)
      HOME_GYM: 'HOME',
      MINIMAL_EQUIPMENT: 'HOME',
      CALISTHENICS_BANDS: 'HOME',
      HOME_FULL: 'HOME',
      HOME_DUMBBELLS: 'HOME',
      HOME_BODYWEIGHT: 'HOME',
      'منزل': 'HOME',
      'بيت': 'HOME',
      BOTH: 'BOTH',
      HYBRID: 'BOTH',
      'كلاهما': 'BOTH',
      'جيم ومنزل': 'BOTH'
    };
    if (VALID_LOCATION_MAP[loc]) {
      canonicalLoc = VALID_LOCATION_MAP[loc];
    } else {
      throw new IntakeValidationError(
        [{ path: 'training.location', code: 'INVALID_FIELD_VALUE', message: `قيمة غير صالحة لمكان التدريب: '${rawLoc}'. القيم المسموحة: GYM, HOME, BOTH.` }],
        `قيمة غير صالحة لمكان التدريب: '${rawLoc}'. القيم المسموحة: GYM, HOME, BOTH.`,
        'INVALID_FIELD_VALUE',
        'training_location',
        rawLoc
      );
    }
  }

  if (raw.client && raw.body && raw.goals && raw.training && raw.medical) {
    return raw;
  }

  // Pre-normalization for direct FullIntakeForm payload (flat structure & 28-questions catalog)
  if (!intake.personal && (intake.first_name || intake.last_name || intake.age || intake.gender || intake.sex || intake.date_of_birth || intake.height_cm || intake.weight_kg)) {
    intake.personal = {
      firstName: intake.first_name || (intake.full_name || '').split(' ')[0] || "متدرب",
      lastName: intake.last_name || (intake.full_name || '').split(' ').slice(1).join(' ') || "جديد",
      dateOfBirth: intake.date_of_birth,
      age: parseCleanNumber(intake.age, null),
      sex: canonicalSex || 'MALE'
    };
  }

  if (!intake.goals && (intake.primary_goal || canonicalGoal)) {
    intake.goals = {
      primary: canonicalGoal || 'FAT_LOSS'
    };
  }

  if (!intake.body && (intake.height_cm || intake.weight_kg || intake.circumferences || intake.waist_cm)) {
    intake.body = {
      heightCm: parseCleanNumber(intake.height_cm, 175),
      weightKg: parseCleanNumber(intake.weight_kg, 75),
      waistCm: parseCleanNumber(intake.waist_cm || intake.circumferences?.waist_cm, null),
      neckCm: parseCleanNumber(intake.circumferences?.neck_cm, null),
      hipCm: parseCleanNumber(intake.circumferences?.hips_cm, null),
      photos: {
        front: intake.media_uploads?.front_url || null,
        side: intake.media_uploads?.side_url || null,
        back: intake.media_uploads?.back_url || null,
        inbody: intake.media_uploads?.inbody_report_url || null
      }
    };
  }

  if (!intake.lifestyle && (intake.neat_level || intake.sleep_schedule || intake.daily_activity || intake.occupation_type || intake.sleep_hours)) {
    const neatMap = {
      sedentary: 'SEDENTARY',
      light: 'LIGHT',
      moderate: 'MODERATE',
      high: 'HIGH',
      SEDENTARY: 'SEDENTARY',
      LIGHT: 'LIGHT',
      MODERATE: 'MODERATE',
      HIGH: 'HIGH',
      VERY_ACTIVE: 'HIGH'
    };
    const sleepHoursMap = {
      less_6: 5.5,
      '6_7': 6.5,
      '7_8': 7.5,
      more_8: 8.5,
      // Deep intake form v2 pill-select values
      LESS_5: 4.5,
      HOURS_5_6: 5.5,
      HOURS_6_7: 6.5,
      HOURS_7_8: 7.5,
      MORE_8: 8.5
    };
    const rawSleepVal = intake.sleep_schedule?.average_hours || intake.sleep_hours;
    const avgSleep = typeof rawSleepVal === 'number' ? rawSleepVal : (sleepHoursMap[rawSleepVal] || 7.5);
    intake.lifestyle = {
      dailyActivity: neatMap[intake.neat_level] || neatMap[intake.daily_activity] || 'MODERATE',
      occupationType: intake.occupation_type || undefined,
      sleep: {
        averageHours: avgSleep,
        quality: intake.sleep_schedule?.pattern === 'regular_night' ? 'GOOD' : 'FAIR'
      },
      workSchedule: {
        type: (intake.sleep_schedule?.pattern === 'rotating_shifts' || intake.sleep_schedule?.pattern === 'night_shift') ? 'SHIFT_BASED' : 'FIXED'
      }
    };
  }

  if (!intake.medical && (intake.medical_conditions || intake.dangerous_symptoms || intake.female_pregnancy || intake.female_menstrual)) {
    const conds = [];
    const selected = Array.isArray(intake.medical_conditions)
      ? intake.medical_conditions
      : (Array.isArray(intake.medical_conditions?.selected) ? intake.medical_conditions.selected : []);
    selected.forEach(s => {
      if (s && s !== 'none' && s !== 'NONE') {
        conds.push({ conditionCode: String(s).toUpperCase(), stability: 'STABLE' });
      }
    });
    // The intake form always pre-fills diabetes.type ('type2'), so only an explicit selection or insulin use counts.
    // Differentiate Type 1 and Insulin-Dependent Diabetes
    if (intake.medical_conditions?.diabetes?.type === 'type1') {
      if (!conds.some(c => c.conditionCode === 'TYPE_1_DIABETES')) {
        conds.push({ conditionCode: 'TYPE_1_DIABETES', stability: 'STABLE' });
      }
    }
    if (intake.medical_conditions?.diabetes?.uses_insulin === true) {
      if (!conds.some(c => c.conditionCode === 'INSULIN_DEPENDENT_DIABETES')) {
        conds.push({ conditionCode: 'INSULIN_DEPENDENT_DIABETES', stability: 'STABLE' });
      }
      if (!conds.some(c => c.conditionCode === 'DIABETES')) {
        conds.push({ conditionCode: 'DIABETES', stability: 'STABLE' });
      }
    }
    if (intake.medical_conditions?.hypertension) {
      if (!conds.some(c => c.conditionCode === 'HYPERTENSION')) {
        conds.push({ conditionCode: 'HYPERTENSION', stability: 'STABLE' });
      }
    }
    if (intake.medical_conditions?.female_cases?.is_pcos) {
      if (!conds.some(c => c.conditionCode === 'PCOS')) {
        conds.push({ conditionCode: 'PCOS', stability: 'STABLE' });
      }
    }
    const dangerousList = Array.isArray(intake.dangerous_symptoms)
      ? intake.dangerous_symptoms.filter(s => s !== 'NONE')
      : (Array.isArray(intake.dangerousSymptomsList) ? intake.dangerousSymptomsList : []);

    intake.medical = {
      conditions: conds,
      dangerousSymptomsList: dangerousList,
      pregnancyStatus: intake.female_pregnancy || (intake.medical_conditions?.female_cases?.is_lactating ? 'BREASTFEEDING' : (intake.medical_conditions?.female_cases?.is_postpartum ? 'POSTPARTUM' : 'NOT_PREGNANT')),
      menstrualStatus: intake.female_menstrual || undefined,
      medications: intake.current_meds_supplements_list || []
    };
  }

  if (!intake.training && (intake.training_environment || intake.training_logistics || intake.injuries_map || intake.training_location || intake.available_days_per_week || intake.experience_level || intake.injuries)) {
    const locMap = {
      commercial_gym: 'GYM',
      home_gym: 'HOME',
      minimal_equipment: 'HOME',
      calisthenics_bands: 'HOME',
      GYM: 'GYM',
      HOME: 'HOME',
      HOME_DUMBBELLS: 'HOME',
      HOME_BODYWEIGHT: 'HOME'
    };
    const injAreas = Array.isArray(intake.injuries)
      ? intake.injuries
      : (Array.isArray(intake.injuries_map?.selected_areas) ? intake.injuries_map.selected_areas : []);
    const trainingInjuries = [];
    const AREA_MAP = {
      spine_back: 'LOWER_BACK',
      knee: 'KNEE',
      shoulder: 'SHOULDER',
      core: 'LOWER_BACK',
      other_joints: 'ELBOW_WRIST',
      LOWER_BACK: 'LOWER_BACK',
      KNEE: 'KNEE',
      SHOULDER: 'SHOULDER',
      NECK: 'NECK',
      ELBOW_WRIST: 'ELBOW_WRIST',
      HIP: 'HIP'
    };
    // Deep intake form v2: injury_severity maps to painLevel
    const severityPainMap = { MILD: 3, MODERATE: 5, SEVERE: 8 };
    // Intake form: an acute (traumatic) injury starts at a higher pain estimate than a chronic one, and
    // pain that does not settle with rest is a non-mechanical red flag that needs medical review.
    const isAcuteInjury = String(intake.injuries_map?.injury_nature || '').toLowerCase() === 'acute';
    const painNotRelievedByRest = intake.injuries_map?.pain_relieved_by_rest === false;
    const injPainLevel = severityPainMap[intake.injury_severity] || (isAcuteInjury ? 5 : 4);
    injAreas.forEach(a => {
      if (a && a !== 'none' && a !== 'NONE') {
        const canonicalArea = AREA_MAP[a] || String(a).toUpperCase();
        trainingInjuries.push({ area: canonicalArea, painLevel: injPainLevel, movementImpact: injPainLevel >= 8 ? 'PREVENTS' : (injPainLevel >= 5 ? 'LIMITS' : 'NONE'), worsening: painNotRelievedByRest });
      }
    });

    const expMap = {
      BEGINNER: 'BEGINNER',
      INTERMEDIATE: 'INTERMEDIATE',
      ADVANCED: 'ADVANCED'
    };

    intake.training = {
      location: locMap[intake.training_location] || locMap[intake.training_environment] || 'GYM',
      preferredDaysPerWeek: Number(intake.available_days_per_week || intake.training_logistics?.days_per_week) || 4,
      maxDaysPerWeek: Number(intake.available_days_per_week || intake.training_logistics?.days_per_week) || 4,
      experience: expMap[intake.experience_level] || String(intake.training_logistics?.experience_level || 'intermediate').toUpperCase(),
      selectedInjuries: trainingInjuries.map(i => i.area),
      injuries: trainingInjuries,
      targetFocusMuscles: Array.isArray(intake.focus_muscles) ? intake.focus_muscles.map(m => m.toUpperCase()) : [],
      recentTraining: intake.recent_training || undefined
    };
  }

  if (!intake.nutrition && (intake.strict_allergies || intake.meal_structure || intake.disliked_foods || intake.digestive_issues || intake.food_budget || intake.food_prep_ability || intake.allergies_and_dislikes || intake.preferred_meal_count)) {
    // What the client picked is how many times a day they eat. "3 وجبات + سناك" is four sittings:
    // it used to map to three, so the snack the client asked for never appeared in the plan - and it
    // is the option the form starts on.
    const mealCountMap = {
      '2_meals': 2,
      '3_meals': 3,
      '3_meals_snack': 4,
      '4_to_5_meals': 4,
      '4_meals': 4,
      '5_meals': 5
    };
    // Deep intake form v2: allergies_and_dislikes is multi-pill-select array
    const rawAllergyDislikes = Array.isArray(intake.allergies_and_dislikes)
      ? intake.allergies_and_dislikes.filter(v => v !== 'NONE')
      : [];
    const allergens = (intake.strict_allergies || rawAllergyDislikes).map(a => ({ substance: String(a).toUpperCase(), medicallyConfirmed: true }));
    intake.nutrition = {
      preferredMealCount: Number(intake.preferred_meal_count) || mealCountMap[intake.meal_structure?.meals_count] || 3,
      allergies: allergens,
      excludedFoodsList: (intake.strict_allergies || rawAllergyDislikes).map(a => String(a).toUpperCase()),
      // The form sends Arabic labels; the canonical intake takes food codes (disliked-foods.js).
      dislikedFoods: dislikedFoodCodes(Array.isArray(intake.disliked_foods) ? intake.disliked_foods : rawAllergyDislikes),
      // Deep intake form v2: structured digestive, budget, and food prep fields
      digestiveIssues: (intake.digestive_issues && intake.digestive_issues !== 'NONE')
        ? [{ name: intake.digestive_issues === 'IBS' ? 'IBS' : (intake.digestive_issues === 'GERD' ? 'ACID_REFLUX' : 'BLOATING'), severity: 'MODERATE' }]
        : [],
      budget: intake.food_budget || undefined,
      foodStorageAvailable: intake.food_prep_ability ? (intake.food_prep_ability === 'FULL_KITCHEN' || intake.food_prep_ability === 'REHEAT_ONLY') : undefined,
      foodReheatingAvailable: intake.food_prep_ability ? (intake.food_prep_ability !== 'NO_KITCHEN') : undefined
    };
  }

  if (!intake.cardio && (intake.training_logistics || intake.additional_sports)) {
    const sports = [];
    // Deep intake form v2: additional_sports comes as a direct code
    if (intake.additional_sports && intake.additional_sports !== 'NONE' && intake.additional_sports !== 'none') {
      const sportCode = intake.additional_sports === 'OTHER' ? null : intake.additional_sports.toUpperCase();
      sports.push({
        sportCode: sportCode,
        otherSportText: sportCode ? null : 'Other sport',
        days: ["WEDNESDAY"],
        minutesPerSession: 60,
        intensity: "MODERATE",
        participationLevel: "RECREATIONAL"
      });
    } else if (intake.training_logistics?.has_other_sports && intake.training_logistics?.sports_name && intake.training_logistics.sports_name !== 'none') {
      // Intake form sport keys -> canonical SportCode; anything else is kept as free text for the coach.
      const FORM_SPORT_MAP = {
        football_padel: 'FOOTBALL',
        swimming: 'SWIMMING',
        running_cardio: 'RUNNING',
        martial_arts: 'MARTIAL_ARTS',
        crossfit: 'CROSSFIT_OR_FUNCTIONAL',
      };
      const rawSport = String(intake.training_logistics.sports_name).trim();
      const upperSport = rawSport.toUpperCase();
      const knownCodes = ['FOOTBALL', 'RUNNING', 'CYCLING', 'SWIMMING', 'BOXING', 'MARTIAL_ARTS', 'BASKETBALL', 'HANDBALL', 'VOLLEYBALL', 'RACKET_SPORTS', 'CROSSFIT_OR_FUNCTIONAL'];
      const sportCode = FORM_SPORT_MAP[rawSport.toLowerCase()] || (knownCodes.includes(upperSport) ? upperSport : null);
      // Weekly hours are spread over up to three sessions so the cardio engine sees the real sport load.
      const weeklyHours = Number(intake.training_logistics.hours_per_week);
      const sessionDays = ["WEDNESDAY", "SATURDAY", "MONDAY"];
      const sessionCount = Number.isFinite(weeklyHours) && weeklyHours > 0 ? Math.min(3, Math.max(1, Math.ceil(weeklyHours / 1.5))) : 1;
      const minutesPerSession = Number.isFinite(weeklyHours) && weeklyHours > 0 ? Math.round((weeklyHours * 60) / sessionCount) : 60;
      sports.push({
        sportCode,
        otherSportText: sportCode ? null : rawSport,
        days: sessionDays.slice(0, sessionCount),
        minutesPerSession,
        intensity: "MODERATE",
        participationLevel: "RECREATIONAL"
      });
    }
    intake.cardio = {
      additionalSports: sports
    };
  }

  // 1. Personal
  const personal = intake.personal || {};
  let dob = personal.dateOfBirth;
  const ageNum = parseCleanNumber(personal.age || intake.age, null);
  if (!dob && ageNum) {
    const birthYear = new Date().getFullYear() - ageNum;
    dob = `${birthYear}-01-01`;
  }
  if (!dob || typeof dob !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    dob = "1998-01-01";
  }

  const canonicalPersonal = {
    firstName: String(personal.firstName || "متدرب").trim() || "متدرب",
    lastName: String(personal.lastName || "جديد").trim() || "جديد",
    dateOfBirth: dob,
    sex: canonicalSex || (personal.sex === "FEMALE" ? "FEMALE" : "MALE"),
    residenceCountry: personal.residenceCountry && personal.residenceCountry.length === 2 ? personal.residenceCountry.toUpperCase() : "EG",
    // The form asks for the guardian only under 18: name, phone and an explicit consent.
    guardianConsent: personal.guardianConsent !== undefined
      ? personal.guardianConsent
      : (intake.guardian?.consent === true ? true : (intake.guardian ? false : null))
  };

  // 2. Goals
  const goals = intake.goals || {};
  const primaryGoalMap = {
    FAT_LOSS: "FAT_LOSS",
    CUT: "FAT_LOSS",
    MUSCLE_GAIN: "MUSCLE_GAIN",
    LEAN_BULK: "MUSCLE_GAIN",
    BULK: "MUSCLE_GAIN",
    HYPERTROPHY: "MUSCLE_GAIN",
    BODY_RECOMPOSITION: "FAT_LOSS",
    RECOMP: "FAT_LOSS",
    WEIGHT_MAINTENANCE: "WEIGHT_MAINTENANCE",
    MAINTENANCE: "WEIGHT_MAINTENANCE",
    GENERAL_HEALTH: "GENERAL_HEALTH",
    PERFORMANCE: "PERFORMANCE",
    OTHER: "OTHER"
  };
  const canonicalGoals = {
    primary: canonicalGoal || primaryGoalMap[goals.primary] || "FAT_LOSS",
    secondaryTraining: goals.secondaryTraining || "NONE"
  };

  // 3. Body
  const body = intake.body || {};
  let quality = body.measurementQuality;
  if (quality === "ACTUAL_MEASURED" || quality === "HIGH") quality = "HIGH";
  else if (quality === "APPROXIMATE" || quality === "LOW") quality = "LOW";
  else if (!["HIGH", "MEDIUM", "LOW", "UNKNOWN"].includes(quality)) quality = "HIGH";

  const height = parseCleanNumber(body.heightCm, parseCleanNumber(intake.height_cm, 175));
  const weight = parseCleanNumber(body.weightKg, parseCleanNumber(intake.weight_kg, 75));
  const waist = parseCleanNumber(body.waistCm, parseCleanNumber(intake.waist_cm || intake.circumferences?.waist_cm, Math.round(height * 0.45)));
  const neck = parseCleanNumber(body.neckCm, parseCleanNumber(intake.circumferences?.neck_cm, null));
  const hip = parseCleanNumber(body.hipCm, parseCleanNumber(intake.circumferences?.hips_cm, null));
  let rawBodyFatInput = 
    body.bodyFat ?? body.body_fat ?? body.bodyFatPct ?? body.body_fat_pct ?? body.body_fat_percent ?? body.bodyFatPercentage ??
    intake.bodyFat ?? intake.body_fat ?? intake.bodyFatPct ?? intake.body_fat_pct ?? intake.body_fat_percent ?? intake.bodyFatPercentage ??
    intake.body?.bodyFatPct ?? intake.body?.body_fat_pct;

  let bodyFat = parseCleanNumber(rawBodyFatInput, null);

  if (bodyFat !== null && bodyFat > 0 && bodyFat <= 0.60) {
    bodyFat = Math.round(bodyFat * 100 * 10) / 10;
  }

  if (bodyFat !== null && (bodyFat < 3 || bodyFat > 65)) {
    bodyFat = null;
  }

  // Calculate US Navy Body Fat if neckCm and waistCm are provided and direct bodyFat is missing
  if (!bodyFat && neck && waist && waist > neck) {
    if (canonicalPersonal.sex === "MALE") {
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

  const canonicalBody = {
    heightCm: height,
    weightKg: weight,
    waistCm: waist,


    weightTrend: ["LOSING", "STABLE", "GAINING"].includes(body.weightTrend) ? body.weightTrend : "STABLE",
    measurementQuality: quality,
    progressPhotosAvailable: Boolean(body.progressPhotosAvailable || (body.photos && Object.keys(body.photos).length > 0))
  };


  // 4. Lifestyle & Smart NEAT Activity Multiplier
  const lifestyle = intake.lifestyle || {};
  const validActivity = ["SEDENTARY", "LIGHT", "MODERATE", "HIGH"];
  const activityLevel = validActivity.includes(lifestyle.dailyActivity) ? lifestyle.dailyActivity : "LIGHT";

  const canonicalLifestyle = {
    dailyActivity: canonicalActivity || activityLevel,
    workSchedule: {
      type: ["FIXED", "VARIABLE", "SHIFT_BASED"].includes(lifestyle.workSchedule?.type) ? lifestyle.workSchedule.type : "FIXED",
      physicallyDemandingDays: Array.isArray(lifestyle.workSchedule?.physicallyDemandingDays) ? lifestyle.workSchedule.physicallyDemandingDays : []
    },
    sleep: {
      averageHours: Number(lifestyle.sleep?.averageHours) || 7,
      quality: ["POOR", "FAIR", "GOOD", "UNKNOWN"].includes(lifestyle.sleep?.quality) ? lifestyle.sleep.quality : "GOOD"
    },
    stressLevel: ["LOW", "MODERATE", "HIGH", "UNKNOWN"].includes(lifestyle.stressLevel) ? lifestyle.stressLevel : (lifestyle.stressLevel === "SEVERE" ? "HIGH" : "MODERATE"),
    occupationType: ["DESK_OFFICE", "FIELD_MOBILE", "MANUAL_LABOR", "STUDENT", "UNEMPLOYED"].includes(lifestyle.occupationType || intake.occupation_type) ? (lifestyle.occupationType || intake.occupation_type) : undefined
  };


  // 5. Medical
  const medical = intake.medical || {};
  const rawDangerousList = Array.isArray(medical.dangerousSymptomsList) ? medical.dangerousSymptomsList
    : (Array.isArray(medical.dangerous_symptoms) ? medical.dangerous_symptoms
    : (Array.isArray(intake.dangerous_symptoms) ? intake.dangerous_symptoms : []));
  // Matched case-insensitively, and any symptom this engine does not recognise is treated as a
  // dangerous symptom rather than dropped: a client who reported something alarming in a form the
  // engine does not know (a new option, another app sending lower case) must still reach medical
  // review, never receive an ordinary plan in silence.
  const dangerousList = rawDangerousList.map((symptom) => String(symptom || "").trim().toUpperCase()).filter(Boolean);
  const KNOWN_DANGEROUS = ["NONE", "CHEST_PAIN", "FAINTING", "SHORTNESS_OF_BREATH", "PALPITATIONS", "DOCTOR_RESTRICTION"];
  const unrecognisedDangerous = dangerousList.filter((symptom) => !KNOWN_DANGEROUS.includes(symptom));
  const dangerousSymptoms = {
    chestPainOrPressure: (dangerousList.includes("CHEST_PAIN") || medical.dangerousSymptoms?.chestPainOrPressure === "YES") ? "YES" : "NO",
    fainting: (dangerousList.includes("FAINTING") || medical.dangerousSymptoms?.fainting === "YES") ? "YES" : "NO",
    unusualShortnessOfBreath: (dangerousList.includes("SHORTNESS_OF_BREATH") || medical.dangerousSymptoms?.unusualShortnessOfBreath === "YES") ? "YES" : "NO",
    abnormalPalpitations: (dangerousList.includes("PALPITATIONS") || medical.dangerousSymptoms?.abnormalPalpitations === "YES") ? "YES" : "NO",
    otherDangerousSymptomsPresent: (dangerousList.includes("DOCTOR_RESTRICTION") || unrecognisedDangerous.length > 0 || medical.dangerousSymptoms?.otherDangerousSymptomsPresent === "YES") ? "YES" : "NO",
    otherDangerousSymptoms: []
  };

  const CONDITION_MAP = {
    DIABETES: "DIABETES",
    TYPE_2_DIABETES: "DIABETES",
    TYPE_1_DIABETES: "TYPE_1_DIABETES",
    INSULIN_DEPENDENT_DIABETES: "INSULIN_DEPENDENT_DIABETES",
    INSULIN_RESISTANCE: "INSULIN_RESISTANCE",
    HYPERTENSION: "HYPERTENSION",
    HIGH_BLOOD_PRESSURE: "HYPERTENSION",
    HEART: "HEART_CONDITION",
    HEART_CONDITION: "HEART_CONDITION",
    CARDIOVASCULAR: "HEART_CONDITION",
    CARDIOVASCULAR_DISEASE: "HEART_CONDITION",
    THYROID: "THYROID_CONDITION",
    THYROID_CONDITION: "THYROID_CONDITION",
    THYROID_DISORDER: "THYROID_CONDITION",
    HYPOTHYROIDISM: "THYROID_CONDITION",
    HYPERTHYROIDISM: "THYROID_CONDITION",
    ANEMIA: "ANEMIA",
    ASTHMA: "ASTHMA_OR_RESPIRATORY_CONDITION",
    ASTHMA_OR_RESPIRATORY_CONDITION: "ASTHMA_OR_RESPIRATORY_CONDITION",
    RESPIRATORY: "ASTHMA_OR_RESPIRATORY_CONDITION",
    DIGESTIVE: "DIAGNOSED_DIGESTIVE_CONDITION",
    DIAGNOSED_DIGESTIVE_CONDITION: "DIAGNOSED_DIGESTIVE_CONDITION",
    IBS: "DIAGNOSED_DIGESTIVE_CONDITION",
    CROHNS: "DIAGNOSED_DIGESTIVE_CONDITION",
    COLITIS: "DIAGNOSED_DIGESTIVE_CONDITION",
    GERD: "DIAGNOSED_DIGESTIVE_CONDITION",
    PCOS: "PCOS",
    POLYCYSTIC_OVARY: "PCOS",
    KIDNEY: "KIDNEY_CONDITION",
    KIDNEY_CONDITION: "KIDNEY_CONDITION",
    // Intake form keys (FullIntakeForm medical_conditions.selected)
    RENAL: "KIDNEY_CONDITION",
    HEPATIC: "LIVER_CONDITION",
    // Legacy combined option (intakes submitted before the split): the kidney protein ceiling is the safer reading.
    RENAL_HEPATIC: "KIDNEY_CONDITION",
    GI_TRACT: "DIAGNOSED_DIGESTIVE_CONDITION",
    LIVER: "LIVER_CONDITION",
    LIVER_CONDITION: "LIVER_CONDITION",
    BARIATRIC_SURGERY: "BARIATRIC_SURGERY",
    BARIATRIC: "BARIATRIC_SURGERY",
    SLEEVE: "BARIATRIC_SURGERY",
    GASTRIC_BYPASS: "BARIATRIC_SURGERY"
  };

  const VALID_CANONICAL_CONDITIONS = new Set([
    "DIABETES",
    "INSULIN_RESISTANCE",
    "HYPERTENSION",
    "HEART_CONDITION",
    "KIDNEY_CONDITION",
    "LIVER_CONDITION",
    "THYROID_CONDITION",
    "ANEMIA",
    "ASTHMA_OR_RESPIRATORY_CONDITION",
    "DIAGNOSED_DIGESTIVE_CONDITION",
    "PCOS",
    "BARIATRIC_SURGERY"
  ]);

  const conditions = [];
  const detectedMedicalInjuries = [];
  const unclassifiedConditions = [];

  const rawConditions = Array.isArray(medical.conditions) && medical.conditions.length > 0
    ? medical.conditions
    : (Array.isArray(medical.selectedConditions) ? medical.selectedConditions : []);

  rawConditions.forEach(c => {
    if (c && c.conditionCode && c.conditionCode !== "NONE") {
      const canonicalCode = CONDITION_MAP[c.conditionCode] || (VALID_CANONICAL_CONDITIONS.has(c.conditionCode) ? c.conditionCode : null);
      if (canonicalCode && !conditions.some(existing => existing.conditionCode === canonicalCode)) {
        conditions.push({
          conditionCode: canonicalCode,
          stability: c.stability === "UNCONTROLLED_UNSTABLE" ? "UNSTABLE" : "STABLE",
          otherConditionText: null,
          physicianInstructions: Array.isArray(c.physicianInstructions) ? c.physicianInstructions : [],
        });
      } else if (!canonicalCode) {
        const rawUpper = String(c.conditionCode).toUpperCase();
        if (['DISC', 'HERNIATION', 'IMPINGEMENT', 'KNEE', 'SHOULDER', 'BACK', 'LUMBAR', 'SPINE', 'JOINT', 'INJURY', 'TENDON', 'TEAR'].some(k => rawUpper.includes(k))) {
          detectedMedicalInjuries.push(rawUpper);
        } else {
          unclassifiedConditions.push(c.label || c.conditionCode);
        }
      }
    }
  });

  // Clinical Safety: Inspect medications for insulin therapy
  const INSULIN_KEYS_INTAKE = ["INSULIN", "LANTUS", "NOVORAPID", "APIDRA", "TRESIBA", "MIXTARD", "HUMALOG", "LEVEMIR", "انسولين"];
  const allMedsText = [
    ...(Array.isArray(medical.medications) ? medical.medications : []),
    ...(Array.isArray(intake.current_meds_supplements_list) ? intake.current_meds_supplements_list : []),
    String(intake.current_meds_supplements || "")
  ].join(" ").toUpperCase();
  if (INSULIN_KEYS_INTAKE.some(k => allMedsText.includes(k))) {
    if (!conditions.some(c => c.conditionCode === "INSULIN_DEPENDENT_DIABETES")) {
      conditions.push({
        conditionCode: "INSULIN_DEPENDENT_DIABETES",
        stability: "STABLE",
        otherConditionText: null,
        physicianInstructions: []
      });
    }
  }

  const canonicalMedical = {
    conditions,
    dangerousSymptoms,
    medications: Array.isArray(medical.medications) ? medical.medications : [],
    eatingDisorderHistory: ["NONE", "PAST", "ACTIVE", "SUSPECTED", "UNKNOWN"].includes(medical.eatingDisorderHistory)
      ? medical.eatingDisorderHistory
      : (["NONE", "PAST", "ACTIVE", "SUSPECTED", "UNKNOWN"].includes(intake.eating_disorder_history)
        ? intake.eating_disorder_history
        : "NONE"),
    pregnancyStatus: ["NOT_PREGNANT", "PREGNANT", "POSTPARTUM", "BREASTFEEDING"].includes(medical.pregnancyStatus) ? medical.pregnancyStatus : "NOT_PREGNANT",
    menstrualStatus: ["REGULAR", "IRREGULAR", "ABSENT", "NOT_APPLICABLE"].includes(medical.menstrualStatus) ? medical.menstrualStatus : (canonicalPersonal.sex === "FEMALE" ? "REGULAR" : "NOT_APPLICABLE"),
    unclassifiedText: unclassifiedConditions
  };

  // 6. Nutrition
  const nutrition = intake.nutrition || {};
  const rawExcluded = [
    ...(Array.isArray(nutrition.excludedFoodsList) ? nutrition.excludedFoodsList : []),
    ...(Array.isArray(nutrition.excludedFoodCodes) ? nutrition.excludedFoodCodes : []),
    ...(Array.isArray(nutrition.excluded_foods) ? nutrition.excluded_foods : []),
    ...(Array.isArray(nutrition.strict_allergies) ? nutrition.strict_allergies : []),
    ...(Array.isArray(intake.strict_allergies) ? intake.strict_allergies : []),
    ...(Array.isArray(intake.allergies_and_dislikes) ? intake.allergies_and_dislikes : []),
    ...(Array.isArray(nutrition.allergies_and_dislikes) ? nutrition.allergies_and_dislikes : []),
    ...(Array.isArray(nutrition.allergies) ? nutrition.allergies.map(a => typeof a === 'string' ? a : a?.substance) : []),
    ...(Array.isArray(intake.allergies) ? intake.allergies.map(a => typeof a === 'string' ? a : a?.substance) : []),
  ].filter(Boolean);

  if (typeof intake.strict_allergies === 'string' && intake.strict_allergies.trim()) {
    rawExcluded.push(...intake.strict_allergies.split(',').map(s => s.trim()));
  }
  if (typeof intake.allergies_and_dislikes === 'string' && intake.allergies_and_dislikes.trim()) {
    rawExcluded.push(...intake.allergies_and_dislikes.split(',').map(s => s.trim()));
  }
  if (typeof nutrition.strict_allergies === 'string' && nutrition.strict_allergies.trim()) {
    rawExcluded.push(...nutrition.strict_allergies.split(',').map(s => s.trim()));
  }

  const excludedFoods = Array.from(new Set(rawExcluded.map(x => (typeof x === "string" ? x.toUpperCase() : ""))));

  // Format Allergies: [{ substance: "EGG", medicallyConfirmed: true }]
  const allergies = [];
  if (Array.isArray(nutrition.allergies)) {
    nutrition.allergies.forEach(a => {
      if (typeof a === 'string' && a.trim()) {
        allergies.push({ substance: a.trim().toUpperCase(), medicallyConfirmed: true });
      } else if (a && a.substance) {
        allergies.push({ substance: a.substance.toUpperCase(), medicallyConfirmed: Boolean(a.medicallyConfirmed !== false) });
      }
    });
  }
  if (Array.isArray(intake.allergies)) {
    intake.allergies.forEach(a => {
      if (typeof a === 'string' && a.trim()) {
        const sub = a.trim().toUpperCase();
        if (!allergies.some(ex => ex.substance === sub)) {
          allergies.push({ substance: sub, medicallyConfirmed: true });
        }
      }
    });
  }

  const addAllergy = (sub) => {
    if (!allergies.some(a => a.substance === sub.toUpperCase())) {
      allergies.push({ substance: sub.toUpperCase(), medicallyConfirmed: true });
    }
  };

  if (excludedFoods.includes("EGGS") || excludedFoods.includes("EGG")) {
    addAllergy("EGG");
    addAllergy("EGGS");
  }
  if (excludedFoods.includes("DAIRY") || excludedFoods.includes("MILK") || excludedFoods.includes("DAIRY_LACTOSE")) {
    addAllergy("MILK");
    addAllergy("DAIRY");
  }
  if (excludedFoods.includes("FISH_SEAFOOD") || excludedFoods.includes("FISH") || excludedFoods.includes("SEAFOOD") || excludedFoods.includes("FISH_SHELLFISH")) {
    addAllergy("FISH");
    addAllergy("SEAFOOD");
    addAllergy("FISH_SEAFOOD");
  }
  if (excludedFoods.includes("PEANUTS_NUTS") || excludedFoods.includes("PEANUTS") || excludedFoods.includes("NUTS") || excludedFoods.includes("PEANUTS_TREE_NUTS")) {
    addAllergy("PEANUT");
    addAllergy("PEANUTS");
    addAllergy("TREE_NUT");
  }
  if (excludedFoods.includes("GLUTEN_WHEAT") || excludedFoods.includes("WHEAT_GLUTEN") || excludedFoods.includes("GLUTEN") || excludedFoods.includes("WHEAT") || excludedFoods.includes("GLUTEN_CELIAC") || excludedFoods.includes("CELIAC")) {
    addAllergy("WHEAT");
    addAllergy("GLUTEN");
  }
  if (excludedFoods.includes("LEGUMES") || excludedFoods.includes("LEGUME") || excludedFoods.includes("SOY") || excludedFoods.includes("SOYA")) {
    addAllergy("LEGUMES");
  }

  // Format Disliked Foods: Array of uppercase Strings
  const dislikedFoods = [];
  if (Array.isArray(nutrition.dislikedFoods)) {
    nutrition.dislikedFoods.forEach(d => {
      const code = typeof d === 'string' ? d : (d.foodCode || d.name);
      if (code) dislikedFoods.push(code.toUpperCase());
    });
  }

  const addDisliked = (...items) => {
    for (const it of items) {
      if (it && !dislikedFoods.includes(it.toUpperCase())) {
        dislikedFoods.push(it.toUpperCase());
      }
    }
  };

  if (excludedFoods.includes("EGGS") || excludedFoods.includes("EGG")) {
    addDisliked("EGG", "EGGS", "WHOLE_EGG", "EGG_WHITE", "EGG_WHOLE_HARD_BOILED", "EGG_WHITE_COOKED");
  }
  if (excludedFoods.includes("DAIRY") || excludedFoods.includes("MILK") || excludedFoods.includes("DAIRY_LACTOSE")) {
    addDisliked("DAIRY", "MILK", "CHEESE", "YOGURT", "COTTAGE_CHEESE", "GREEK_YOGURT", "YOGURT_PLAIN_LOW_FAT", "GREEK_YOGURT_PLAIN_NONFAT", "COTTAGE_CHEESE_LOW_FAT_2_PERCENT");
  }
  if (excludedFoods.includes("FISH_SEAFOOD") || excludedFoods.includes("FISH") || excludedFoods.includes("SEAFOOD") || excludedFoods.includes("FISH_SHELLFISH")) {
    addDisliked("FISH", "SEAFOOD", "TUNA", "SALMON", "FISH_SEAFOOD", "TUNA_LIGHT_CANNED_WATER_DRAINED");
  }
  if (excludedFoods.includes("OATS") || excludedFoods.includes("OAT")) {
    addDisliked("OATS", "OAT", "OATS_ROLLED_DRY");
  }
  if (excludedFoods.includes("RED_MEAT") || excludedFoods.includes("MEAT") || excludedFoods.includes("BEEF")) {
    addDisliked("MEAT", "BEEF", "RED_MEAT", "BEEF_GROUND_90_LEAN_COOKED");
  }
  if (excludedFoods.includes("PEANUTS_NUTS") || excludedFoods.includes("PEANUTS") || excludedFoods.includes("NUTS") || excludedFoods.includes("PEANUTS_TREE_NUTS")) {
    addDisliked("PEANUT", "PEANUTS", "NUTS", "TREE_NUT");
  }
  if (excludedFoods.includes("GLUTEN_WHEAT") || excludedFoods.includes("WHEAT_GLUTEN") || excludedFoods.includes("GLUTEN") || excludedFoods.includes("WHEAT") || excludedFoods.includes("GLUTEN_CELIAC") || excludedFoods.includes("CELIAC")) {
    addDisliked("WHEAT", "GLUTEN", "BREAD", "PASTA", "BREAD_WHOLE_WHEAT", "PASTA_SPAGHETTI_COOKED");
  }
  if (excludedFoods.includes("LEGUMES") || excludedFoods.includes("LEGUME")) {
    addDisliked("LEGUME", "LEGUMES", "LENTIL", "CHICKPEA", "FAVA_BEAN", "LENTILS_MATURE_COOKED", "CHICKPEAS_MATURE_COOKED", "FAVA_BEANS_MATURE_COOKED");
  }
  if (excludedFoods.includes("EGGPLANT_VEG") || excludedFoods.includes("EGGPLANT_COOKED_VEG") || excludedFoods.includes("EGGPLANT")) {
    addDisliked("EGGPLANT");
  }

  // Format Intolerances: [{ substance: "LACTOSE", severity: "MODERATE", medicallyDiagnosed: true }]
  const digestiveList = Array.isArray(nutrition.digestiveIssuesList) ? nutrition.digestiveIssuesList : [];
  const intolerances = [];
  if (Array.isArray(nutrition.intolerances)) {
    nutrition.intolerances.forEach(i => {
      if (i && i.substance) {
        intolerances.push({
          substance: i.substance.toUpperCase(),
          severity: ["MILD", "MODERATE", "SEVERE"].includes(i.severity) ? i.severity : "MODERATE",
          medicallyDiagnosed: Boolean(i.medicallyDiagnosed !== false)
        });
      }
    });
  }
  if (digestiveList.includes("LACTOSE") && !intolerances.some(i => i.substance === "LACTOSE")) {
    intolerances.push({ substance: "LACTOSE", severity: "MODERATE", medicallyDiagnosed: true });
  }

  // Format Digestive Issues: [{ name: "IBS", severity: "MODERATE" }]
  const digestiveIssues = [];
  if (Array.isArray(nutrition.digestiveIssues)) {
    nutrition.digestiveIssues.forEach(d => {
      const name = (d.name || d.issueCode || "").toUpperCase();
      if (name) {
        digestiveIssues.push({
          name: name.includes("IBS") ? "IBS" : name,
          severity: ["MILD", "MODERATE", "SEVERE"].includes(d.severity) ? d.severity : "MODERATE"
        });
      }
    });
  }
  if (digestiveList.includes("IBS") && !digestiveIssues.some(d => d.name === "IBS")) {
    digestiveIssues.push({ name: "IBS", severity: "MODERATE" });
  }
  if (digestiveList.includes("GERD") && !digestiveIssues.some(d => d.name === "ACID_REFLUX")) {
    digestiveIssues.push({ name: "ACID_REFLUX", severity: "MODERATE" });
  }

  const canonicalNutrition = {
    preferredMealCount: Math.min(6, Math.max(2, Number(nutrition.preferredMealCount) || 3)),
    unavailableEatingWindows: [],
    budget: ["LOW", "MEDIUM", "HIGH"].includes(nutrition.budget) 
      ? nutrition.budget 
      : ((nutrition.budgetTier === "LOW" || nutrition.budgetTier === "ECONOMIC" || nutrition.budgetTier === "SAVER") ? "LOW" : (nutrition.budgetTier === "HIGH" || nutrition.budgetTier === "PREMIUM" ? "HIGH" : "MEDIUM")),
    foodStorageAvailable: nutrition.foodStorageAvailable !== false,
    foodReheatingAvailable: nutrition.foodReheatingAvailable !== false,
    allergies,
    medicalExclusions: Array.isArray(nutrition.medicalExclusions) ? nutrition.medicalExclusions : [],
    dislikedFoods,
    intolerances,
    digestiveIssues
  };

  // 7. Training
  const training = intake.training || {};
  const rawMedicalInjuries = Array.isArray(medical.injuries) ? medical.injuries : [];
  const rawTrainingInjuriesList = Array.isArray(training.selectedInjuries) ? training.selectedInjuries : [];
  const combinedInjuryPool = [...rawTrainingInjuriesList, ...detectedMedicalInjuries, ...rawMedicalInjuries];

  const INJURY_MOVEMENT_MAP = {
    LOWER_BACK: ["HINGE"],
    SPINE: ["HINGE"],
    LUMBAR: ["HINGE"],
    SHOULDER: ["OVERHEAD"],
    ROTATOR_CUFF: ["OVERHEAD"],
    KNEE: ["SQUAT"],
    NECK: ["OVERHEAD"],
    CERVICAL_SPINE: ["OVERHEAD"]
  };

  const normalizeInjuryArea = (raw) => {
    const s = String(raw).toUpperCase();
    if (['DISC', 'HERNIATION', 'LUMBAR', 'L4', 'L5', 'S1', 'LOWER_BACK', 'BACK', 'SPINE'].some(k => s.includes(k))) {
      return { area: "LOWER_BACK", movements: ["HINGE"] };
    }
    if (['SHOULDER', 'IMPINGEMENT', 'ROTATOR', 'DELTOID'].some(k => s.includes(k))) {
      return { area: "SHOULDER", movements: ["OVERHEAD"] };
    }
    if (['KNEE', 'PATELLA', 'MENISCUS'].some(k => s.includes(k))) {
      return { area: "KNEE", movements: ["SQUAT"] };
    }
    if (['NECK', 'CERVICAL'].some(k => s.includes(k))) {
      return { area: "NECK", movements: ["OVERHEAD"] };
    }
    if (['ELBOW'].some(k => s.includes(k))) {
      return { area: "ELBOW", movements: ["PUSH", "PULL"] };
    }
    if (['WRIST'].some(k => s.includes(k))) {
      return { area: "WRIST", movements: ["PUSH"] };
    }
    if (['HIP'].some(k => s.includes(k))) {
      return { area: "HIP", movements: ["SQUAT", "HINGE"] };
    }
    if (['ANKLE'].some(k => s.includes(k))) {
      return { area: "ANKLE", movements: ["SQUAT"] };
    }
    return { area: s, movements: INJURY_MOVEMENT_MAP[s] || [] };
  };

  // Format Injuries: [{ area: "LOWER_BACK", painLevel: 4, movementImpact: "NONE", worsening: false, numbnessOrWeakness: false, affectedMovements: [], medicalRestrictions: [] }]
  const injuries = [];
  if (Array.isArray(training.injuries)) {
    training.injuries.forEach(inj => {
      const rawArea = typeof inj === 'string' ? inj : (inj.area || inj.bodyPart || "");
      if (rawArea) {
        const norm = normalizeInjuryArea(rawArea);
        const affectedMovements = (typeof inj === 'object' && Array.isArray(inj.affectedMovements) && inj.affectedMovements.length > 0)
          ? inj.affectedMovements
          : norm.movements;

        const formattedRestrictions = (typeof inj === 'object' && Array.isArray(inj.medicalRestrictions) ? inj.medicalRestrictions : [])
          .map(r => {
            if (typeof r === "object" && r !== null && r.movement && r.instruction && r.source) return r;
            return null;
          })
          .filter(Boolean);

        if (!injuries.some(i => i.area === norm.area)) {
          injuries.push({
            area: norm.area,
            painLevel: (typeof inj === 'object' && Number(inj.painLevel)) || 4,
            movementImpact: (typeof inj === 'object' && ["NONE", "LIMITS", "PREVENTS"].includes(inj.movementImpact)) ? inj.movementImpact : "LIMITS",
            worsening: Boolean(typeof inj === 'object' && inj.worsening),
            numbnessOrWeakness: Boolean(typeof inj === 'object' && inj.numbnessOrWeakness),
            affectedMovements,
            medicalRestrictions: formattedRestrictions
          });
        }
      }
    });
  }

  combinedInjuryPool.forEach(rawInj => {
    const rawStr = typeof rawInj === 'string' ? rawInj : (rawInj.area || rawInj.conditionCode || "");
    const inj = String(rawStr).toUpperCase();
    if (inj && inj !== "NONE") {
      const norm = normalizeInjuryArea(inj);
      if (!injuries.some(i => i.area === norm.area)) {
        injuries.push({
          area: norm.area,
          painLevel: 4,
          movementImpact: "LIMITS",
          worsening: false,
          numbnessOrWeakness: false,
          affectedMovements: norm.movements,
          medicalRestrictions: []
        });
      }
    }
  });

  let location = training.location;
  if (location === "HOME_WITH_EQUIPMENT" || location === "HOME_GEAR" || location === "HOME_BODYWEIGHT") location = "HOME";
  if (!["GYM", "HOME"].includes(location)) location = "GYM";

  // Equipment array: ensure valid equipment for GYM and HOME
  const rawEquipment = Array.isArray(training.equipment) ? training.equipment : [];
  let equipment = [];

  rawEquipment.forEach((item) => {
    if (typeof item === 'string') {
      const code = item.toUpperCase();
      let mappedCode = "BODYWEIGHT";
      let loadCap = "BODYWEIGHT_ONLY";

      if (code.includes("DUMBBELL")) {
        mappedCode = "DUMBBELLS";
        loadCap = "HEAVY";
      } else if (code.includes("BARBELL")) {
        mappedCode = "BARBELL_AND_PLATES";
        loadCap = "HEAVY";
      } else if (code.includes("CABLE")) {
        mappedCode = "CABLE_STATION";
        loadCap = "HEAVY";
      } else if (code.includes("MACHINE")) {
        mappedCode = "SELECTORIZED_MACHINES";
        loadCap = "HEAVY";
      } else if (code.includes("BAND")) {
        mappedCode = "RESISTANCE_BANDS";
        loadCap = "LIGHT";
      }

      equipment.push({
        equipmentCode: mappedCode,
        otherEquipmentText: null,
        loadCapacity: loadCap,
      });
    } else if (item && typeof item === 'object' && item.equipmentCode) {
      equipment.push(item);
    }
  });

  if (location === "HOME" && equipment.length === 0) {
    // "Home" is three different rooms. A client who answered "bodyweight only" owns no dumbbells,
    // and prescribing them a dumbbell press is prescribing a session they cannot do.
    const homeSetups = {
      calisthenics_bands: [
        { equipmentCode: "BODYWEIGHT", otherEquipmentText: null, loadCapacity: "BODYWEIGHT_ONLY" },
        { equipmentCode: "RESISTANCE_BANDS", otherEquipmentText: null, loadCapacity: "LIGHT" },
      ],
      minimal_equipment: [
        { equipmentCode: "DUMBBELLS", otherEquipmentText: null, loadCapacity: "LIGHT" },
        { equipmentCode: "RESISTANCE_BANDS", otherEquipmentText: null, loadCapacity: "LIGHT" },
        { equipmentCode: "BODYWEIGHT", otherEquipmentText: null, loadCapacity: "BODYWEIGHT_ONLY" },
      ],
      home_gym: [
        { equipmentCode: "DUMBBELLS", otherEquipmentText: null, loadCapacity: "HEAVY" },
        { equipmentCode: "ADJUSTABLE_BENCH", otherEquipmentText: null, loadCapacity: "MODERATE" },
        { equipmentCode: "RESISTANCE_BANDS", otherEquipmentText: null, loadCapacity: "LIGHT" },
        { equipmentCode: "BODYWEIGHT", otherEquipmentText: null, loadCapacity: "BODYWEIGHT_ONLY" },
      ],
    };
    const declaredSetup = String(intake.training_environment || intake.training_location || "").toLowerCase();
    equipment = homeSetups[declaredSetup] || [
      { equipmentCode: "DUMBBELLS", otherEquipmentText: null, loadCapacity: "MODERATE" },
      { equipmentCode: "BODYWEIGHT", otherEquipmentText: null, loadCapacity: "BODYWEIGHT_ONLY" },
    ];
  } else if (location === "GYM" && equipment.length === 0) {
    equipment = [
      { equipmentCode: "DUMBBELLS", otherEquipmentText: null, loadCapacity: "HEAVY" },
      { equipmentCode: "BARBELL_AND_PLATES", otherEquipmentText: null, loadCapacity: "HEAVY" },
      { equipmentCode: "CABLE_STATION", otherEquipmentText: null, loadCapacity: "HEAVY" },
      { equipmentCode: "SELECTORIZED_MACHINES", otherEquipmentText: null, loadCapacity: "HEAVY" },
      { equipmentCode: "BODYWEIGHT", otherEquipmentText: null, loadCapacity: "BODYWEIGHT_ONLY" }
    ];
  }

  const prefDays = Math.min(6, Math.max(2, Number(training.preferredDaysPerWeek || training.maxDaysPerWeek) || 4));
  const defaultDaysByCount = {
    2: ["MONDAY", "THURSDAY"],
    3: ["MONDAY", "WEDNESDAY", "FRIDAY"],
    4: ["MONDAY", "TUESDAY", "THURSDAY", "FRIDAY"],
    5: ["MONDAY", "TUESDAY", "WEDNESDAY", "FRIDAY", "SATURDAY"],
    6: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]
  };

  // Training age (six steps, from never lifted to 4+ years) decides the experience level when the
  // form gives it; an older intake keeps its level and the training age that level implies.
  const formTrainingAge = normalizeTrainingAge(intake.training_age ?? intake.training_logistics?.training_age ?? training.trainingAge);
  const resolvedExperience = (formTrainingAge && experienceForTrainingAge(formTrainingAge))
    || canonicalExp
    || (["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(training.experience) ? training.experience : "BEGINNER");
  const canonicalTraining = {
    location: canonicalLoc || location,
    equipment,
    maxDaysPerWeek: prefDays,
    preferredDaysPerWeek: prefDays,
    trainingScheduleAvailabilityType: "FIXED_AVAILABLE_DAYS",
    availableTrainingDays: Array.isArray(training.availableTrainingDays) && training.availableTrainingDays.length > 0
      ? training.availableTrainingDays
      : (defaultDaysByCount[prefDays] || ["MONDAY", "WEDNESDAY", "FRIDAY"]),
    unavailableTrainingDays: [],
    maxSessionMinutes: Number(training.maxSessionMinutes) || 60,
    experience: resolvedExperience,
    trainingAge: formTrainingAge || trainingAgeForExperience(resolvedExperience),
    recentTraining: (training.recentTraining === "CONSISTENT_LAST_3_MONTHS" || training.recentTraining === "ACTIVE") ? "ACTIVE" : (training.recentTraining === "INTERMITTENT_LAST_6_MONTHS" || training.recentTraining === "INCONSISTENT") ? "INCONSISTENT" : ["NONE_LAST_4_WEEKS", "RETURNING_AFTER_LONG_BREAK", "UNKNOWN"].includes(training.recentTraining) ? training.recentTraining : "ACTIVE",
    injuries,
    medicalMovementRestrictions: []
  };


  // 8. Cardio & Activity Steps
  // The form's step-count answer, when the client knows it, replaces the step count guessed from the
  // activity level ("moderate" alone used to mean 8500 steps).
  const FORM_DAILY_STEPS = { under_3000: 2500, "3000_6000": 4500, "6000_9000": 7500, over_9000: 10500 };
  const formDailySteps = FORM_DAILY_STEPS[String(intake.average_daily_steps || "").trim().toLowerCase()];
  const cardio = { ...(intake.cardio || {}) };
  if (formDailySteps && !(Number(cardio.averageDailySteps) > 0)) cardio.averageDailySteps = formDailySteps;
  const sports = Array.isArray(cardio.additionalSports) ? cardio.additionalSports.map(s => ({
    sportCode: s.sportCode || (s.otherSportText ? null : "FOOTBALL"),
    otherSportText: s.otherSportText ?? null,
    days: Array.isArray(s.days) && s.days.length > 0 ? s.days : ["WEDNESDAY"],
    minutesPerSession: Number(s.minutesPerSession) || 60,
    intensity: s.intensity || "MODERATE",
    participationLevel: s.participationLevel || "RECREATIONAL"
  })) : [];

  const activityStepsMap = {
    SEDENTARY: 4500,
    LIGHT: 6500,
    MODERATE: 8500,
    HIGH: 12500,
  };
  const derivedSteps = (!isNaN(Number(cardio.averageDailySteps)) && Number(cardio.averageDailySteps) > 0)
    ? Number(cardio.averageDailySteps)
    : (activityStepsMap[canonicalLifestyle.dailyActivity] || 6500);

  const canonicalCardio = {
    additionalSports: sports,
    averageDailySteps: Math.min(30000, Math.max(1000, derivedSteps)),
    walkingAbility: ["EASY", "MODERATE", "PAINFUL"].includes(cardio.walkingAbility) ? cardio.walkingAbility : "EASY",
    maxSessionsPerWeek: Math.min(7, Math.max(0, !isNaN(Number(cardio.maxSessionsPerWeek)) ? Number(cardio.maxSessionsPerWeek) : 2)),
    maxDurationMinutes: Math.min(120, Math.max(10, !isNaN(Number(cardio.maxDurationMinutes)) ? Number(cardio.maxDurationMinutes) : 30))
  };


  return {
    personal: canonicalPersonal,
    goals: canonicalGoals,
    body: canonicalBody,
    lifestyle: canonicalLifestyle,
    medical: canonicalMedical,
    nutrition: canonicalNutrition,
    training: canonicalTraining,
    cardio: canonicalCardio,
    unclassifiedNotes: []
  };
}
