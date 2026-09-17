/**
 * Religious Calendar & Seasonal Fasting Adaptation Engine (محرك التقويم الموسمي والتكيف العقائدي)
 *
 * Provides deterministic meal scheduling, macro timing, hydration pacing, and training windows for:
 * 1. Islamic Ramadan & Voluntary Fasting (Dry Fasting / صيام رمضان والنوافل)
 * 2. Christian Fasting Seasons (الصوم الكبير، صوم الرسل، الميلاد - نباتي / سمك)
 * 3. Standard Non-Fasting Baseline
 */

export const FASTING_TYPES = {
  RAMADAN_DRY_FASTING: 'RAMADAN_DRY_FASTING',
  CHRISTIAN_FASTING_PESCATARIAN: 'CHRISTIAN_FASTING_PESCATARIAN',
  CHRISTIAN_FASTING_STRICT_VEGAN: 'CHRISTIAN_FASTING_STRICT_VEGAN',
  STANDARD_BASELINE: 'STANDARD_BASELINE'
};

export function evaluateReligiousCalendarSchedule({
  religion = 'MUSLIM',
  isFastingSeason = true,
  christianFastingStyle = 'PESCATARIAN_ALLOWED', // 'PESCATARIAN_ALLOWED' | 'STRICT_VEGAN'
  dailyCalories = 2000,
  dailyProteinGrams = 150,
  dailyCarbGrams = 200,
  dailyFatGrams = 60,
  dailyWaterLiters = 3.0,
  preferredWorkoutTime = 'AFTER_IFTAR' // 'BEFORE_IFTAR' | 'AFTER_IFTAR' | 'STANDARD'
}) {
  const normReligion = String(religion || 'NONE').toUpperCase();

  // 1. Islamic Ramadan Dry Fasting Mode
  if (normReligion === 'MUSLIM' && isFastingSeason) {
    const isPreIftar = preferredWorkoutTime === 'BEFORE_IFTAR';

    return {
      mode: FASTING_TYPES.RAMADAN_DRY_FASTING,
      mode_name_ar: 'صيام رمضان',
      eating_window_ar: 'من أذان المغرب حتى أذان الفجر',
      meals_distribution: [
        {
          meal_id: 'iftar',
          name_ar: 'وجبة الإفطار (كسر الصيام)',
          timing_ar: 'عند أذان المغرب مباشرة',
          calorie_percent: 35,
          calories: Math.round(dailyCalories * 0.35),
          guidelines_ar: [
            'كسر الصيام على 1-3 تمرات مع كوب ماء معتدل الحرارة ورشة ملح خفيفة.',
            'تناول مصدر بروتين سريع الامتصاص مع كربوهيدرات معقدة سهلة الهضم.',
            'تجنب الأطعمة الدسمة والمقلية لتفادي التخمة والخمول قبل التمرين.'
          ]
        },
        {
          meal_id: 'post_workout_dinner',
          name_ar: 'وجبة العشاء والاستشفاء (بعد التمرين)',
          timing_ar: isPreIftar ? 'بعد صلاة التراويح / بعد التمرين' : 'بعد التمرين بساعة (حوالي الساعة 10-11 مساءً)',
          calorie_percent: 40,
          calories: Math.round(dailyCalories * 0.40),
          guidelines_ar: [
            'الوجبة الأكبر من حيث الكربوهيدرات لملء مخازن الجليكوجين العضلي.',
            'تناول حصة بروتين كاملة (لحوم / دواجن / أسماك) مع خضروات ورقية.'
          ]
        },
        {
          meal_id: 'suhoor',
          name_ar: 'وجبة السحور البنائية',
          timing_ar: 'قبل أذان الفجر بـ 45-60 دقيقة',
          calorie_percent: 25,
          calories: Math.round(dailyCalories * 0.25),
          guidelines_ar: [
            'التركيز على البروتينات بطيئة الامتصاص (جبن قريش / بيض / كازين).',
            'إدراج دهون صحية وألياف وبوتاسيوم (أفوكادو / شوفان / موز / خيار) لمنع العطش والجوع.'
          ]
        }
      ],
      hydration_protocol: {
        total_target_liters: Math.max(3.0, dailyWaterLiters),
        pacing_schedule_ar: 'تناول 500 مل ماء كل ساعة من الإفطار حتى السحور لتفادي احتباس السوائل أو الجفاف.'
      },
      training_recommendation_ar: isPreIftar
        ? 'تمرين خفيف قبل الإفطار بـ 45 دقيقة (تركيز تكنيك وأوزان متوسطة) مع كسر الصيام فور انتهاء التمرين.'
        : 'التمرين بعد الإفطار بساعتين إلى 3 ساعات (أفضل أداء بدني وقوة عضلية مع وفرة السوائل والطاقة).'
    };
  }

  // 2. Christian Fasting Mode (Pescatarian / Strict Vegan)
  if (normReligion === 'CHRISTIAN' && isFastingSeason) {
    const isPescatarian = christianFastingStyle === 'PESCATARIAN_ALLOWED';

    return {
      mode: isPescatarian
        ? FASTING_TYPES.CHRISTIAN_FASTING_PESCATARIAN
        : FASTING_TYPES.CHRISTIAN_FASTING_STRICT_VEGAN,
      mode_name_ar: isPescatarian
        ? 'نظام الصيام المسيحي (نباتي مع السماح بالأسماك والمأكولات البحرية)'
        : 'نظام الصيام المسيحي الصارم (نباتي صرف بدون أسماك)',
      eating_window_ar: 'على مدار اليوم مع الامتناع عن المنتجات الحيوانية والألبان',
      meals_distribution: [
        {
          meal_id: 'breakfast',
          name_ar: 'وجبة الإفطار النباتية المعززة',
          calorie_percent: 30,
          calories: Math.round(dailyCalories * 0.30),
          guidelines_ar: [
            'دمج بروتين نباتي مركب (شوفان مع حليب صويا / بودرة بروتين نباتية / زبدة فول سوداني).',
            'إضافة بذور الشيا وبذور الكتان لأحماض أوميجا 3 النباتية.'
          ]
        },
        {
          meal_id: 'lunch',
          name_ar: 'وجبة الغداء الرئيسية',
          calorie_percent: 40,
          calories: Math.round(dailyCalories * 0.40),
          guidelines_ar: isPescatarian
            ? [
                'الاعتماد على الأسماك الدهنية والبيضاء (تونة، سلمون، بلطي، جمبري) لضمان بروتين كامل الأحماض.',
                'كربوهيدرات معقدة (أرز بني / بطاطا / كينوا) مع سلطة خضراء غنية بالحديد والليمون.'
              ]
            : [
                'دمج الحبوب والبقوليات معاً (أرز وعدس / كينوا وفاصوليا حمراء) لضمان بروتين مكتمل الأحماض الأمينية.',
                'إضافة الخميرة الغذائية (Nutritional Yeast) كمصدر طبيعي لفيتامين B12.'
              ]
        },
        {
          meal_id: 'dinner',
          name_ar: 'وجبة العشاء والاستشفاء',
          calorie_percent: 30,
          calories: Math.round(dailyCalories * 0.30),
          guidelines_ar: [
            'وجبة خفيفة غنية بالبروتين (توفو مشوي / حمص مسلوق مع متبل طحينة وخضروات).',
            'شرب الماء بانتظام ومتابعة كفاية المعادن الدقيقة.'
          ]
        }
      ],
      supplement_synergy_ar: [
        'فيتامين B12 (1000 mcg يومياً) لتعويض غياب اللحوم والألبان.',
        'مكمل أوميجا 3 نباتي (Algae Oil) أو زيت السمك في حال الصيام السمكي.',
        'فيتامين د3 وزنك لتعزيز المناعة وقوة المفاصل.'
      ]
    };
  }

  // 3. Standard Non-Fasting Baseline
  return {
    mode: FASTING_TYPES.STANDARD_BASELINE,
    mode_name_ar: 'النمط اليومي المعتاد (Non-Fasting Baseline)',
    eating_window_ar: 'موزع بانتظام على مدار ساعات الاستيقاظ',
    meals_distribution: [
      { name_ar: 'وجبة الإفطار المتوازنة', calories: Math.round(dailyCalories * 0.25) },
      { name_ar: 'وجبة الغداء الغنية بالبروتين', calories: Math.round(dailyCalories * 0.40) },
      { name_ar: 'سناك الطاقة قبل التمرين', calories: Math.round(dailyCalories * 0.15) },
      { name_ar: 'وجبة العشاء والاستشفاء', calories: Math.round(dailyCalories * 0.20) }
    ],
    hydration_protocol: {
      total_target_liters: dailyWaterLiters,
      pacing_schedule_ar: 'شرب 250-300 مل ماء كل 90 دقيقة على مدار اليوم.'
    }
  };
}
