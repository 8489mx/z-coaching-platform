/**
 * Seasonal & Thermal Performance Adaptation Engine
 * Z Coaching Platform - Environmental Physiology Architecture
 *
 * Deterministic engine for adapting training schedules, hydration requirements,
 * electrolyte balance, and warm-up protocols based on climatic and seasonal stressors.
 * Zero emojis, strictly Arabic RTL clinical directives.
 */

export const SEASONAL_ENVIRONMENTS = {
  SUMMER_HEAT_HUMIDITY: {
    id: 'SUMMER_HEAT_HUMIDITY',
    title_ar: 'أجواء حارة ورطبة (صيف شديد)',
    title_en: 'Summer Heat & High Humidity',
    thermal_stress: 'HIGH',
    hydration_delta_liters: 0.8,
    sodium_target_mg: 4000,
    warmup_modifier_min: 0,
    rest_interval_delta_sec: 25,
    caloric_delta_kcal: 0,
    training_timing_directive_ar: 'جدولة الحصص التدريبية الشاقة في الصباح الباكر أو بعد غروب الشمس لتفادي الإجهاد الحراري العصبي.',
    warmup_directive_ar: 'إحماء ديناميكي معتدل (5 - 7 دقائق) مع الحفاظ على برودة الجسم وتجنب التعرق المفرط قبل بدء الجولات الأساسية.',
    electrolyte_directive_ar: 'تعويض الصوديوم بنسبة 3500 - 4500 مجم يومياً وإضافة 0.5 - 1.0 جم صوديوم لمحلول الترطيب أثناء التمرين.'
  },
  WINTER_COLD: {
    id: 'WINTER_COLD',
    title_ar: 'أجواء باردة وشتاء قارس',
    title_en: 'Winter & Cold Environment',
    thermal_stress: 'LOW',
    hydration_delta_liters: 0.0,
    sodium_target_mg: 2800,
    warmup_modifier_min: 6,
    rest_interval_delta_sec: 0,
    caloric_delta_kcal: 120,
    training_timing_directive_ar: 'التدريب في الساعات الأكثر دفئاً خلال النهار وارتداء طبقات عازلة للحفاظ على درجة حرارة العضلات.',
    warmup_directive_ar: 'تمديد الإحماء الحركي بمقدار 6 - 8 دقائق لرفع حرارة الأنسجة الضامة ولزوجة السائل الزلالي في المفاصل.',
    electrolyte_directive_ar: 'الالتزام بشرب الماء دورياً رغم تراجع الشعور بالعطش لتفادي الجفاف المستتر وانخفاض كفاءة الأيض.'
  },
  TEMPERATE_CONTROLLED: {
    id: 'TEMPERATE_CONTROLLED',
    title_ar: 'أجواء معتدلة / صالة مكيفة',
    title_en: 'Temperate / Climate Controlled Gym',
    thermal_stress: 'MODERATE',
    hydration_delta_liters: 0.0,
    sodium_target_mg: 3000,
    warmup_modifier_min: 0,
    rest_interval_delta_sec: 0,
    caloric_delta_kcal: 0,
    training_timing_directive_ar: 'مرونة كاملة في مواعيد التدريب وفق الجدول اليومي المريح للمتدرب.',
    warmup_directive_ar: 'إحماء حركي قياسي (5 - 8 دقائق) مخصص للمجموعات العضلية المستهدفة.',
    electrolyte_directive_ar: 'معدل الصوديوم والترطيب اليومي القياسي (3.5 - 4.0 لتر/اليوم) دون تعديلات استثنائية.'
  },
  RAMADAN_FASTING: {
    id: 'RAMADAN_FASTING',
    title_ar: 'الصيام الرمضاني والمتقطع',
    title_en: 'Ramadan & Intermittent Fasting',
    thermal_stress: 'VARIABLE',
    hydration_delta_liters: 0.0,
    sodium_target_mg: 3500,
    warmup_modifier_min: 2,
    rest_interval_delta_sec: 30,
    caloric_delta_kcal: 0,
    training_timing_directive_ar: 'التدريب بعد الإفطار بساعتين لضمان اكتمال مخازن الجليكوجين والترطيب، أو قبل الإفطار مباشرة لكارديو منخفض الشدة.',
    warmup_directive_ar: 'إحماء تدريجي هادئ مع تجنب استنزاف الطاقة السريعة.',
    electrolyte_directive_ar: 'توزيع الترطيب بين الإفطار والسحور بمعدل 400 - 500 مل كل 90 دقيقة مع ضبط الأملاح لمنع الصداع والجفاف.'
  }
};

export function calculateSeasonalAdaptation({
  environment = 'TEMPERATE_CONTROLLED',
  weightKg = 80,
  currentHydrationLiters = 3.5,
  currentCalories = 2200
} = {}) {
  const envKey = Object.keys(SEASONAL_ENVIRONMENTS).includes(environment) 
    ? environment 
    : 'TEMPERATE_CONTROLLED';

  const config = SEASONAL_ENVIRONMENTS[envKey];
  const weight = Number(weightKg) || 80;

  // Base hydration: 40 ml per kg
  const baseHydration = Number((weight * 0.040).toFixed(1));
  const adaptedHydration = Number((baseHydration + config.hydration_delta_liters).toFixed(1));
  const adaptedCalories = Math.round(Number(currentCalories || 2200) + config.caloric_delta_kcal);

  const directives = [
    `معدل الترطيب اليومي المستهدف: ${adaptedHydration} لتر/اليوم كنص استرشادي ثابت.`,
    config.training_timing_directive_ar,
    config.warmup_directive_ar,
    config.electrolyte_directive_ar
  ];

  if (config.rest_interval_delta_sec > 0) {
    directives.push(`زيادة فترات الراحة بين المجموعات المركبة بمقدار ${config.rest_interval_delta_sec} ثانية لتبديد الإجهاد الحراري.`);
  }

  return {
    environment_id: config.id,
    environment_title_ar: config.title_ar,
    thermal_stress: config.thermal_stress,
    base_hydration_liters: baseHydration,
    adapted_hydration_liters: adaptedHydration,
    hydration_delta_liters: config.hydration_delta_liters,
    sodium_target_mg: config.sodium_target_mg,
    adapted_calories: adaptedCalories,
    caloric_delta_kcal: config.caloric_delta_kcal,
    warmup_modifier_min: config.warmup_modifier_min,
    rest_interval_delta_sec: config.rest_interval_delta_sec,
    training_timing_directive_ar: config.training_timing_directive_ar,
    warmup_directive_ar: config.warmup_directive_ar,
    electrolyte_directive_ar: config.electrolyte_directive_ar,
    directives: directives,
    clinical_summary_ar: `تم تكييف الخطة فسيولوجياً لتناسب (${config.title_ar}): تعديل الترطيب إلى ${adaptedHydration} لتر/اليوم، والصوديوم إلى ${config.sodium_target_mg} مجم مع ضبط بروتوكول الإحماء وفترات الراحة.`
  };
}
