/**
 * Drug-Nutrient Timing & Interaction Matrix Engine (مصفوفة الأمان الدوائي وتوقيت المكملات والوجبات)
 *
 * Prevents dangerous pharmacological-nutritional clashes:
 *   1. ELTROXIN / LEVOTHYROXINE: Strict 4-hour gap from Calcium (dairy), Iron, and high-fiber meals.
 *   2. METFORMIN / GLUCOPHAGE: Take with largest meal, auto-prescribe Vitamin B12.
 *   3. ACE INHIBITORS / ARBS: Strictly ban Potassium Chloride (KCl) salt substitutes.
 *   4. DIURETICS: Increase water target (+1L), balance Sodium & Magnesium electrolytes.
 */

export const MONITORED_MEDICATIONS = {
  ELTROXIN: {
    code: 'ELTROXIN',
    names: ['ELTROXIN', 'EUTHYROX', 'LEVOTHYROXINE', 'ثيروكسين', 'التروكسين', 'يوثيروكس'],
    interaction_type: 'ABSORPTION_BLOCKADE',
    critical_window_hours: 4,
    prohibited_with_dose: ['CALCIUM', 'DAIRY', 'IRON', 'HIGH_FIBER_MEAL', 'COFFEE_WITHIN_60MIN'],
    rule_ar: 'حظر تناول أي وجبة أو مكمل يحتوي على كالسيوم (ألبان/أجبان)، حديد، أو ألياف كثيفة إلا بعد مرور 4 ساعات كاملة من حبة الغدة لضمان الامتصاص الكامل.',
    rule_en: 'Strict 4-hour separation between thyroid medication and Calcium, Dairy, Iron, or High-Fiber meals.'
  },
  METFORMIN: {
    code: 'METFORMIN',
    names: ['METFORMIN', 'GLUCOPHAGE', 'ميتفورمين', 'جلوكوفاج', 'سيدوفاج'],
    interaction_type: 'MICRONUTRIENT_DEPLETION',
    timing_rule: 'WITH_LARGEST_CARB_MEAL',
    mandatory_supplement: 'VITAMIN_B12',
    rule_ar: 'تناول الجرعة مع أكبر وجبة كربوهيدرات لتقليل اضطرابات الجهاز الهضمي، وإدراج مكمل فيتامين B12 تلقائياً لتعويض استنزافه من الدواء.',
    rule_en: 'Take with largest carb-containing meal and supplement Vitamin B12 to prevent drug-induced depletion.'
  },
  ACE_INHIBITORS: {
    code: 'ACE_INHIBITORS',
    names: ['CAPTOPRIL', 'ENALAPRIL', 'LISINOPRIL', 'LOSARTAN', 'VALSARTAN', 'كابوتين', 'كونكور_بلس', 'لوسارتان', 'أدوية_ضغط'],
    interaction_type: 'ELECTROLYTE_DISTURBANCE',
    prohibited_ingredients: ['POTASSIUM_CHLORIDE_SALT_SUBSTITUTE', 'HIGH_POTASSIUM_SUPPLEMENTS'],
    rule_ar: 'حظر استخدام بدائل الملح التي تحتوي على كلوريد البوتاسيوم (KCl) في جدول التغذية لتجنب فرط بوتاسيوم الدم الخطير (Hyperkalemia).',
    rule_en: 'Strictly prohibit potassium-based salt substitutes to prevent hyperkalemia.'
  },
  DIURETICS: {
    code: 'DIURETICS',
    names: ['LASIX', 'HYDROCHLOROTHIAZIDE', 'SPIRONOLACTONE', 'لازيكس', 'مدرات_بول'],
    interaction_type: 'FLUID_MINERAL_DEPLETION',
    hydration_delta_liters: 1.0,
    rule_ar: 'رفع مستهدف شرب الماء اليومي بمقدار +1.0 لتر إضافي وضبط مستويات الصوديوم والمغنيسيوم في جدول الأملاح لتعويض الفقد البولي.',
    rule_en: 'Increase daily water target by +1.0L and optimize Sodium & Magnesium electrolytes.'
  }
};

/**
 * Detects active medications from client profile and generates explicit timing constraints and warnings.
 */
export function evaluateDrugNutrientInteractions(medicationList = []) {
  if (!Array.isArray(medicationList) || medicationList.length === 0) {
    return {
      has_medication_interactions: false,
      active_medication_rules: [],
      timing_schedule_ar: []
    };
  }

  const activeRules = [];
  const timingScheduleAr = [];

  for (const medInput of medicationList) {
    const medUpper = String(medInput).toUpperCase().trim();

    for (const [key, medConfig] of Object.entries(MONITORED_MEDICATIONS)) {
      const isMatch = medConfig.names.some(name => medUpper.includes(name.toUpperCase()));

      if (isMatch) {
        activeRules.push({
          medication_code: medConfig.code,
          interaction_type: medConfig.interaction_type,
          rule_ar: medConfig.rule_ar,
          rule_en: medConfig.rule_en
        });

        if (medConfig.code === 'ELTROXIN') {
          timingScheduleAr.push('06:30 ص: حبة التروكسين على معدة فارغة تماماً مع كوب ماء نقي.');
          timingScheduleAr.push('07:30 ص: وجبة إفطار خالية تماماً من منتجات الألبان ومكملات الكالسيوم أو الحديد.');
          timingScheduleAr.push('10:30 ص (بعد 4 ساعات): مسموح الآن بتناول الألبان، الأجبان، أو مكملات الكالسيوم والحديد بأمان.');
        } else if (medConfig.code === 'METFORMIN') {
          timingScheduleAr.push('مع وجبة الغداء: حبة الميتفورمين مع الوجبة + مكمل فيتامين B-Complex صباحاً.');
        }
      }
    }
  }

  return {
    has_medication_interactions: activeRules.length > 0,
    active_medication_rules: activeRules,
    timing_schedule_ar: timingScheduleAr
  };
}
