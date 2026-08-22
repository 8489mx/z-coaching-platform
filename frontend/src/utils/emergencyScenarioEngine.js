/**
 * Emergency & Scenario Adaptation Engine (محرك سيناريوهات الطوارئ والتكيف اللحظي)
 *
 * 1. Travel Mode (Equipment Matrix):
 *    - FULL_COMMERCIAL_GYM: 100% original plan, optional condensed split (4 -> 3 days).
 *    - HOTEL_LIMITED_GYM: Auto-converts Barbell & specialized machines to Dumbbells, Cables, & Smith Machine.
 *    - NO_GYM_ROOM: Auto-converts to Bodyweight & Resistance Bands with 3s eccentric tempo control.
 *    - Travel Nutrition: Option to shift to maintenance calories (+300 Kcal) with locked protein.
 * 2. Sickness & Recovery Mode:
 *    - Halt deficit -> shift to maintenance, +1.0L water, immune micronutrients (Vit C, Zinc, D3).
 *    - Training: Pause heavy resistance -> light mobility & walking only.
 * 3. High-Stress & Exam Mode:
 *    - Condense to 2-3 time-efficient Full Body sessions (35-40 min).
 *    - Simplified fast-prep nutrition sources.
 */

export const TRAVEL_EQUIPMENT_TYPES = {
  FULL_COMMERCIAL_GYM: 'FULL_COMMERCIAL_GYM',
  HOTEL_LIMITED_GYM: 'HOTEL_LIMITED_GYM',
  NO_GYM_ROOM: 'NO_GYM_ROOM'
};

export const EXERCISE_CONVERSIONS = {
  // Barbell -> Hotel / Room
  BARBELL_BACK_SQUAT: {
    HOTEL_LIMITED_GYM: { name: 'سكوات بالدمبلز أو سميث (Goblet / Dumbbell Squat)', equipment: 'DUMBBELL', tempo: '2-0-1' },
    NO_GYM_ROOM: { name: 'سكوات وزن الجسم مع ثبات سلبي 3 ثوانٍ (Bodyweight Tempo Squat)', equipment: 'BODYWEIGHT', tempo: '3-1-1' }
  },
  BARBELL_BENCH_PRESS: {
    HOTEL_LIMITED_GYM: { name: 'تجميع صدر بالدمبلز على بنش (Dumbbell Flat Bench Press)', equipment: 'DUMBBELL', tempo: '2-0-1' },
    NO_GYM_ROOM: { name: 'ضغط أرضي بوزن الجسم مع حزام مقاومة (Push-ups with Tempo)', equipment: 'BODYWEIGHT_BAND', tempo: '3-0-1' }
  },
  BARBELL_DEADLIFT: {
    HOTEL_LIMITED_GYM: { name: 'ديدليفت روماني بالدمبلز (Dumbbell RDL)', equipment: 'DUMBBELL', tempo: '3-0-1' },
    NO_GYM_ROOM: { name: 'ديدليفت بحزام المقاومة أو فردي برجل واحدة (Single-Leg Bodyweight RDL)', equipment: 'BODYWEIGHT_BAND', tempo: '3-1-1' }
  },
  LAT_PULLDOWN_MACHINE: {
    HOTEL_LIMITED_GYM: { name: 'سحب ظهر بالكابل أو دمبل مفرد (Dumbbell Single-Arm Row)', equipment: 'DUMBBELL_CABLE', tempo: '2-0-1' },
    NO_GYM_ROOM: { name: 'سحب ظهر بحزام المقاومة مع ثبات علوي (Resistance Band Lat Pulls)', equipment: 'RESISTANCE_BAND', tempo: '3-1-1' }
  },
  LEG_PRESS_MACHINE: {
    HOTEL_LIMITED_GYM: { name: 'سكوات بلغاري بالدمبل (Bulgarian Split Squat)', equipment: 'DUMBBELL', tempo: '2-1-1' },
    NO_GYM_ROOM: { name: 'سكوات بلغاري بوزن الجسم وكرسي الفندق (Bulgarian Split Squat)', equipment: 'BODYWEIGHT', tempo: '3-1-1' }
  }
};

/**
 * Transforms client workout and nutrition programs on-demand based on emergency scenario.
 */
export function applyEmergencyScenarioAdaptation({
  scenario_type = 'TRAVEL', // 'TRAVEL' | 'SICKNESS' | 'HIGH_STRESS'
  equipment_tier = TRAVEL_EQUIPMENT_TYPES.HOTEL_LIMITED_GYM,
  base_calories = 2000,
  base_protein_g = 160,
  base_daily_water_liters = 3.0,
  base_sessions_per_week = 4,
  exercises = []
}) {
  const scenario = String(scenario_type).toUpperCase();

  // 1. TRAVEL MODE
  if (scenario === 'TRAVEL') {
    let adaptedCalories = base_calories + 300; // Maintenance shift
    let adaptedExercises = [];

    if (equipment_tier === TRAVEL_EQUIPMENT_TYPES.FULL_COMMERCIAL_GYM) {
      adaptedExercises = exercises.map(ex => ({ ...ex, note_ar: 'الاستمرار على نفس الأوزان والتمارين الأصلية' }));
    } else {
      adaptedExercises = exercises.map(ex => {
        const code = String(ex.code || ex.name || '').toUpperCase();
        for (const [key, mapping] of Object.entries(EXERCISE_CONVERSIONS)) {
          if (code.includes(key) || String(ex.name).includes(key)) {
            const replacement = mapping[equipment_tier] || mapping.HOTEL_LIMITED_GYM;
            return {
              ...ex,
              name: replacement.name,
              equipment_used: replacement.equipment,
              tempo_tempo: replacement.tempo,
              note_ar: `تم التبديل التلقائي لتناسب تجهيزات ${equipment_tier === TRAVEL_EQUIPMENT_TYPES.HOTEL_LIMITED_GYM ? 'جيم الفندق' : 'غرفة الفندق'}`
            };
          }
        }
        return {
          ...ex,
          name: equipment_tier === TRAVEL_EQUIPMENT_TYPES.NO_GYM_ROOM ? `${ex.name} (بديل بوزن الجسم وحزام المقاومة)` : ex.name,
          note_ar: 'تم تكييف الأداء وتطبيق سرعة النزول السلبي 3 ثوانٍ'
        };
      });
    }

    return {
      scenario_applied: 'TRAVEL_MODE',
      equipment_tier,
      nutrition_adjustment: {
        target_calories: adaptedCalories,
        target_protein_g: base_protein_g,
        rationale_ar: 'تم رفع السعرات لحد الصيانة (+300 Kcal) لتفادي الإجهاد العصبي أثناء السفر مع تثبيت البروتين.',
        fast_food_rules_ar: [
          'اختر المشويات الصريحة (دجاج، لحم، سمك مشوي) وتجنب المقليات والزيوت المهدرجة.',
          'استبدل البطاطس المقلية بالسلطة الخضراء أو البطاطس المشوية.',
          'احرص على شراء زجاجات مياه 1.5 لتر في المطار للحفاظ على الترطيب.'
        ]
      },
      training_adjustment: {
        adapted_exercises: adaptedExercises,
        condensed_split_available: true,
        condensed_sessions_count: 3,
        tempo_focus: equipment_tier === TRAVEL_EQUIPMENT_TYPES.NO_GYM_ROOM ? '3-1-1 (تحكم سلبي لتعويض غياب الأوزان)' : '2-0-1'
      }
    };
  }

  // 2. SICKNESS & RECOVERY MODE
  if (scenario === 'SICKNESS') {
    return {
      scenario_applied: 'SICKNESS_RECOVERY_MODE',
      nutrition_adjustment: {
        target_calories: base_calories + 400, // Maintenance
        target_protein_g: Math.round(base_protein_g * 0.85), // Gentle on digestion
        target_water_liters: base_daily_water_liters + 1.0,
        rationale_ar: 'إيقاف عجز السعرات فوراً والتحول لسعرات الصيانة لدعم الجهاز المناعي مع رفع السوائل (+1.0L).',
        immune_protocol_ar: [
          'فيتامين C (1,000 mg) مقسمة على جرعتين.',
          'زنك جلوكونات (25 mg) بعد وجبة الغداء.',
          'شوربة عظام / دجاج دافئة مع الليمون لتعزيز الشوارد والترطيب.'
        ]
      },
      training_adjustment: {
        is_resistance_paused: true,
        recovery_routine_ar: 'إيقاف أوزان الجيم بالكامل. يقتصر النشاط على 15-20 دقيقة مشي خفيف جداً واستطالات استشفائية.'
      }
    };
  }

  // 3. HIGH-STRESS & EXAM MODE
  if (scenario === 'HIGH_STRESS') {
    return {
      scenario_applied: 'HIGH_STRESS_EXAM_MODE',
      nutrition_adjustment: {
        target_calories: base_calories,
        target_protein_g: base_protein_g,
        rationale_ar: 'تثبيت الماكروز مع تحويل مصادر الوجبات لأطعمة سهلة وسريعة التحضير (تونة، بيض، شوفان، أرز جاهز).'
      },
      training_adjustment: {
        condensed_sessions_count: 2,
        session_duration_minutes: 35,
        split_type: 'TIME_EFFICIENT_FULL_BODY',
        rationale_ar: 'تقليص البرنامج إلى جلستين Full Body أسبوعياً (35 دقيقة للجلسة) بأعلى كفاءة زمنية.'
      }
    };
  }

  throw new Error(`Unknown scenario type '${scenario_type}'. Supported: TRAVEL, SICKNESS, HIGH_STRESS.`);
}
