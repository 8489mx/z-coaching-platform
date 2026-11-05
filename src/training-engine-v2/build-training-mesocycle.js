import { trainingAgePolicy, trainingAgeForExperience } from "./training-age.js";
import { buildTrainingEngine } from "../training-engine/index.js";
import { getExerciseV2ByCode } from "../exercise-catalog-v2/index.js";
import { EXERCISE_CATALOG_V2 } from "../exercise-catalog-v2/exercise-catalog-v2.js";

// The catalog records one piece of equipment per exercise. These are done just as well with any of
// several ("Cable / DB Rotator Cuff External Rotation"): a band or a light dumbbell at home.
const ANY_OF_EQUIPMENT = Object.freeze({
  ROTATOR_CUFF_EXTERNAL_ROTATION: ["CABLE_STATION", "DUMBBELLS", "RESISTANCE_BANDS"],
});

/** True when every piece of equipment the exercise needs is in the client's declared set. */
function exerciseFitsEquipment(code, available) {
  if (!available) return true;
  if (ANY_OF_EQUIPMENT[code]) return ANY_OF_EQUIPMENT[code].some((item) => available.has(item));
  const record = getExerciseV2ByCode(code);
  if (record) {
    return (record.equipment_requirements || []).every((req) => available.has(String(req.equipment_code).toUpperCase()));
  }
  // Not in the catalog (some template codes are not): read the equipment from the name itself.
  const named = String(code || "").toUpperCase();
  const needs = [];
  if (/DUMBBELL/.test(named)) needs.push("DUMBBELLS");
  if (/BARBELL/.test(named)) needs.push("BARBELL_AND_PLATES");
  if (/CABLE/.test(named)) needs.push("CABLE_STATION");
  if (/MACHINE/.test(named)) needs.push("SELECTORIZED_MACHINES");
  if (/SMITH/.test(named)) needs.push("SMITH_MACHINE");
  return needs.every((item) => available.has(item));
}

/**
 * The closest exercise the client can actually do: same movement slot first, then the same primary
 * muscle, then an exercise that trains it as a secondary muscle. Never one already in the session.
 */
function equipmentSafeAlternative(code, slotCode, available, used) {
  const original = getExerciseV2ByCode(code);
  const pool = EXERCISE_CATALOG_V2.exercises.filter((candidate) =>
    !used.has(candidate.exercise_code) &&
    (candidate.equipment_requirements || []).every((req) => available.has(String(req.equipment_code).toUpperCase())));
  return (
    pool.find((candidate) => candidate.slot_code === slotCode) ||
    (original && pool.find((candidate) => candidate.slot_code === original.slot_code)) ||
    (original && pool.find((candidate) => candidate.primary_muscle === original.primary_muscle)) ||
    (original && pool.find((candidate) => (candidate.secondary_muscles || []).includes(original.primary_muscle))) ||
    null
  );
}
import { resolveExerciseNames } from "../exercise-catalog-v2/master-exercise-translations.js";
import {
  TRAINING_ENGINE_V2_VERSION,
  MesoCyclePhase,
  VolumeProgressionStrategy,
} from "./domain/enums.js";
import { CLINICAL_GUIDELINES } from "../config/clinical-guidelines.js";
import {
  calculateMicroProgressionBridge,
  MICRO_PROGRESSION_STRATEGIES,
} from "../execution-engines/biomechanics-firewall-engine.js";

export function resolveMesocycleWeekConfigs({
  experience = 'BEGINNER',
  weeksCount = 5,
  plannedDeload = null,
  skipDeload = false,
  customWeeksConfig = null,
  targetRirWeek4 = null,
  fatigueScore = null,
  recoveryScore = null,
  performanceTrend = null,
  dataQuality = null,
  coachDeloadPreference = null,
} = {}) {
  if (Array.isArray(customWeeksConfig) && customWeeksConfig.length > 0) {
    // P1-B9: a custom config bypassed every floor, so a coach input of RIR 0 reached
    // delivery (audit S22). Custom targets are clamped to the global RIR floor 1 here;
    // the lifter/exercise floors are still applied at dosing time.
    return customWeeksConfig.slice(0, weeksCount).map((config) => ({
      ...config,
      target_rir: Math.max(1, Number(config.target_rir) || 1),
    }));
  }

  const exp = String(experience).toUpperCase();
  const isAdvanced = exp === 'ADVANCED';
  const isIntermediate = exp === 'INTERMEDIATE';
  const isBeginner = !isAdvanced && !isIntermediate;

  const count = Math.max(1, Math.min(6, Number(weeksCount) || 5));
  const configs = [];

  for (let w = 1; w <= count; w++) {
    if (w === 1) {
      configs.push({
        week_number: 1,
        phase: MesoCyclePhase.INTRO_ACCUMULATION,
        phase_ar: 'الأسبوع 1 (تأسيس وتكيف حركي)',
        target_rir: isAdvanced ? 2 : 3,
        volume_modifier: 1.0,
        set_delta: 0,
        focus_note: isAdvanced
          ? 'الأسبوع 1 (تأسيس): RIR 2 — معايرة أحمال العمل والتحكم في المسار الحركي.'
          : 'الأسبوع 1 (تأسيس): RIR 3 — التعود على النمط الحركي وضبط الأوزان الابتدائية.',
      });
    } else if (w === 2) {
      configs.push({
        week_number: 2,
        phase: MesoCyclePhase.PROGRESSIVE_OVERLOAD,
        phase_ar: 'الأسبوع 2 (تحميل وزيادة الحمل التدريجي)',
        target_rir: isAdvanced ? 1 : 2,
        volume_modifier: 1.0,
        set_delta: 0,
        focus_note: 'الأسبوع 2 (تحميل): زيادة الحمل التدريجي مع الحفاظ على تكرارين في الاحتياط.',
      });
    } else if (w === 3) {
      configs.push({
        week_number: 3,
        phase: MesoCyclePhase.PROGRESSIVE_OVERLOAD,
        phase_ar: 'الأسبوع 3 (تكثيف الجهد العضلي)',
        target_rir: isBeginner ? 2 : 1,
        volume_modifier: isBeginner ? 1.0 : 1.15,
        set_delta: isBeginner ? 0 : 1,
        focus_note: isBeginner
          ? 'الأسبوع 3 (تطور الأداء): تثبيت RIR 2 والتركيز على زيادة التكرارات ضمن النطاق بتكنيك نظيف.'
          : 'الأسبوع 3 (تكثيف): RIR 1 — رفع الشدة والاقتراب من الفشل العضلي مع إضافة مجموعة للحركات الأساسية.',
      });
    } else if (w === 4) {
      // Week 4 target RIR: customizable, never forced to 0 for advanced lifters
      // P1-B9: clamp any coach input to the global RIR floor 1 (audit S22).
      let w4Rir = targetRirWeek4 !== null ? Math.max(1, Number(targetRirWeek4) || 1) : null;
      if (w4Rir === null) {
        if (isBeginner) {
          w4Rir = 2;
        } else if (isIntermediate) {
          w4Rir = 1;
        } else {
          // Advanced lifter: default RIR 1; if fatigued or poor recovery, RIR 2; never forced RIR 0
          // P1-B9: one fatigue threshold everywhere — 7, matching the week-5 deload rule and
          // the P1-B5 deload table (audit C11: week 4 used 6, week 5 used 7).
          const fatigued = (fatigueScore !== null && Number(fatigueScore) >= 7) ||
                           (recoveryScore !== null && Number(recoveryScore) <= 2);
          w4Rir = fatigued ? 2 : 1;
        }
      }

      configs.push({
        week_number: 4,
        phase: isBeginner ? MesoCyclePhase.PROGRESSIVE_OVERLOAD : MesoCyclePhase.PEAK_OVERLOAD,
        phase_ar: isBeginner ? 'الأسبوع 4 (ذروة الحمل التدريجي للمبتدئ)' : 'الأسبوع 4 (القمة والأوفرلود المتقدم)',
        target_rir: w4Rir,
        volume_modifier: isBeginner ? 1.0 : (w4Rir <= 1 ? 1.25 : 1.15),
        set_delta: isBeginner ? 0 : 1,
        focus_note: isBeginner
          ? 'الأسبوع 4 (ذروة التحميل): استمرار الأداء المحكم عند RIR 2 دون الوصول للفشل العضلي غير المحسوب.'
          : `الأسبوع 4 (القمة والأوفرلود): RIR ${w4Rir} — تحفيز عصبي وعضلي عالٍ بتكنيك محكم وموجه ذاتياً.`,
      });
    } else if (w === 5) {
      // Week 5: Planned Deload vs Consolidation based on experience, performance, recovery, data quality, and coach preference
      let shouldDeload;
      if (skipDeload === true || plannedDeload === false || coachDeloadPreference === 'CONSOLIDATION') {
        shouldDeload = false;
      } else if (plannedDeload === true || coachDeloadPreference === 'DELOAD') {
        shouldDeload = true;
      } else if (Number(fatigueScore) >= 7 || performanceTrend === 'DROPPING') {
        // P1-B9: fatigue deloads even when data is insufficient (audit S21). The client
        // we know least about, who is also fatigued, used to get the hardest week-5 option.
        shouldDeload = true;
      } else if (dataQuality === 'INSUFFICIENT') {
        shouldDeload = false;
      } else if (Number(recoveryScore) >= 4 && performanceTrend === 'PROGRESSING') {
        shouldDeload = false;
      } else {
        // Standard Planned 5-Week Mesocycle
        shouldDeload = !isBeginner;
      }

      if (shouldDeload) {
        const isAdvancedDeload = isAdvanced;
        const volMod = isAdvancedDeload ? 0.60 : (isIntermediate ? 0.70 : 0.75);
        const rirTarget = isAdvancedDeload ? 4 : 3;
        configs.push({
          week_number: 5,
          phase: MesoCyclePhase.DELOAD,
          phase_ar: isBeginner
            ? 'الأسبوع 5 (تفريغ أحمال مخطط للمبتدئ - Deload)'
            : (isIntermediate ? 'الأسبوع 5 (تفريغ أحمال استراتيجي - Deload)' : 'الأسبوع 5 (تفريغ أحمال تجديدي - Regenerative Deload)'),
          target_rir: rirTarget,
          volume_modifier: volMod,
          set_delta: -1,
          focus_note: isBeginner
            ? 'الأسبوع 5 (تفريغ أحمال مخطط): خفض خفيف للحجم التدريبي بنسبة ~25% مع RIR 3 لإراحة المفاصل وتجديد الحيوية.'
            : (isIntermediate
              ? 'الأسبوع 5 (تفريغ أحمال استراتيجي): خفض الحجم التدريبي بنسبة ~30% وضبط RIR 3 لتجديد الأوتار والأنسجة الضامة.'
              : 'الأسبوع 5 (تفريغ أحمال تجديدي): خفض عدد المجموعات بنسبة 40% وضبط RIR 4 لتصفية الإجهاد العصبي المركزي العالي.'),
        });
      } else {
        configs.push({
          week_number: 5,
          phase: 'CONSOLIDATION',
          phase_ar: 'الأسبوع 5 (تثبيت الأداء والتكيف الحركي - Consolidation)',
          target_rir: 2,
          volume_modifier: 1.0,
          set_delta: 0,
          focus_note: 'الأسبوع 5 (تثبيت): استمرار الزخم وتثبيت الأوزان المكتسبة بتكنيك محكم وRIR 2 دون الحاجة لتفريغ أحمال حاد للمبتدئ.',
        });
      }
    } else {
      // P1-B9: week 6 after a deload ramps back in (W1-like volume) instead of jumping
      // straight back to heavy loading (audit C12). After consolidation it continues
      // progressively, exactly as before.
      const previousWasDeload = configs[4] && configs[4].phase === MesoCyclePhase.DELOAD;
      if (previousWasDeload) {
        configs.push({
          week_number: w,
          phase: MesoCyclePhase.PROGRESSIVE_OVERLOAD,
          phase_ar: 'الأسبوع ' + w + ' (عودة بعد الاستشفاء)',
          target_rir: isAdvanced ? 2 : 3,
          volume_modifier: 1.0,
          set_delta: 0,
          focus_note: 'الأسبوع ' + w + ' (عودة بعد الاستشفاء): حجم مثل الأسبوع الأول — إعادة إدخال تدريجي بعد أسبوع التفريغ بدل القفز المباشر للحمل الثقيل.',
        });
      } else {
        configs.push({
          week_number: w,
          phase: MesoCyclePhase.PROGRESSIVE_OVERLOAD,
          phase_ar: 'الأسبوع ' + w + ' (تحميل مستمر)',
          target_rir: 2,
          volume_modifier: 1.0,
          set_delta: 0,
          focus_note: 'الأسبوع ' + w + ': استمرار الحمل التدريجي المنتظم.',
        });
      }
    }
  }

  return configs;
}



const HEAVY_PRIMARY_COMPOUNDS = new Set([
  "BARBELL_BACK_SQUAT",
  "BARBELL_FRONT_SQUAT",
  "BARBELL_BENCH_PRESS",
  "BARBELL_BENT_OVER_ROW",
  "BARBELL_OVERHEAD_PRESS",
  "BARBELL_DEADLIFT",
  "BARBELL_ROMANIAN_DEADLIFT",
  "DUMBBELL_ROMANIAN_DEADLIFT",
  "GOBLET_SQUAT",
  "LEG_PRESS_MACHINE",
  "DUMBBELL_INCLINE_BENCH_PRESS",
  // A loaded barbell across the hips: for a glute-led plan it is a primary lift, and it keeps a rep
  // in hand at the peak like the rest of them.
  "BARBELL_HIP_THRUST",
]);

const SECONDARY_COMPOUNDS = new Set([
  "DUMBBELL_GLUTE_BRIDGE",
  "HIP_THRUST",
  "LAT_PULLDOWN",
  "SEATED_CABLE_ROW",
  "CHEST_SUPPORTED_ROW",
  "ONE_ARM_DUMBBELL_ROW",
  "STANDING_DUMBBELL_SHOULDER_PRESS",
  "DUMBBELL_BENCH_PRESS",
  "BULGARIAN_SPLIT_SQUAT",
  "DUMBBELL_REVERSE_LUNGE",
  "HACK_SQUAT_MACHINE",
  "MACHINE_CHEST_PRESS",
  "DUMBBELL_FLOOR_PRESS",
  "SEATED_DUMBBELL_SHOULDER_PRESS",
  "BARBELL_HIP_THRUST",
  "CHEST_SUPPORTED_INCLINE_DB_ROW",
]);

const ISOLATION_STRETCH_MOVEMENTS = new Set([
  "INCLINE_DUMBBELL_CURL",
  "OVERHEAD_CABLE_TRICEPS_EXTENSION",
  "LYING_LEG_CURL_MACHINE",
  "SEATED_LEG_CURL",
  "LEG_EXTENSION_MACHINE",
  "CABLE_FLY",
  "PECK_DECK_FLIES",
  "DUMBBELL_LATERAL_RAISE",
  "LATERAL_RAISE",
  "CABLE_LATERAL_RAISE",
  "FACE_PULL",
  "REAR_DELT_FLY",
  "BICEPS_CURL",
  "TRICEPS_PUSHDOWN",
]);

// Joint-load groups used by the injury firewall (codes from both the V2 templates and the V1 catalog).
// P0-A9: the V1 barbell squat code belongs here too — without it a lower-back client on a
// 4/5/6-day plan kept a loaded barbell squat (audit S3).
const AXIAL_SQUATS = new Set(["BARBELL_BACK_SQUAT", "BARBELL_FRONT_SQUAT", "SMITH_MACHINE_SQUAT", "BARBELL_SQUAT"]);
const LOADED_HINGES = new Set([
  "BARBELL_DEADLIFT",
  "BARBELL_CONVENTIONAL_DEADLIFT",
  "BARBELL_ROMANIAN_DEADLIFT",
  "DUMBBELL_ROMANIAN_DEADLIFT",
  "B_STANCE_RDL",
]);
const LUNGE_PATTERNS = new Set([
  "BULGARIAN_SPLIT_SQUAT",
  "DUMBBELL_REVERSE_LUNGE",
  "DUMBBELL_WALKING_LUNGES",
  "DEFICIT_REVERSE_LUNGE",
  "BODYWEIGHT_SPLIT_SQUAT",
  // P0-A9: the V1 split-squat code (audit S4).
  "SPLIT_SQUAT",
]);
const KNEE_DOMINANT_LOADED = new Set(["LEG_PRESS_MACHINE", "GOBLET_SQUAT"]);
const STANDING_OVERHEAD_PRESSES = new Set([
  "BARBELL_OVERHEAD_PRESS",
  "STANDING_OVERHEAD_BARBELL_PRESS",
  "STANDING_DUMBBELL_SHOULDER_PRESS",
]);
const OVERHEAD_PRESSES = new Set([
  ...STANDING_OVERHEAD_PRESSES,
  "SEATED_DUMBBELL_SHOULDER_PRESS",
  "MACHINE_SHOULDER_PRESS",
  "ARNOLD_DUMBBELL_PRESS",
  "PIKE_PUSH_UP",
  "DUMBBELL_PULLOVER",
]);
const INCLINE_DECLINE_PRESSES = new Set([
  "INCLINE_DUMBBELL_BENCH_PRESS",
  "INCLINE_BARBELL_BENCH_PRESS",
  "INCLINE_SMITH_MACHINE_PRESS",
  "DECLINE_DUMBBELL_BENCH_PRESS",
  "DECLINE_BENCH_PRESS",
]);
// Overhead-arm triceps extensions: the arm is overhead even though the slot
// is elbow extension, not a press, so the press-only shoulder guard missed
// them (a shoulder-injured client kept the overhead cable triceps extension
// in every week). The gym substitute is the rope pushdown — the swap
// registry's safe swap for the overhead extension. At home the catalog has
// no non-overhead triceps substitute (bench dips load the front of the
// shoulder), so the slot is held for the coach instead.
const OVERHEAD_ARM_TRICEPS_EXTENSIONS = new Set([
  "OVERHEAD_CABLE_TRICEPS_EXTENSION",
  "CABLE_OVERHEAD_TRICEPS_EXTENSION",
  "DUMBBELL_OVERHEAD_TRICEPS_EXTENSION",
  "OVERHEAD_DUMBBELL_TRICEPS_EXTENSION",
  "ARMS_OVERHEAD_TRICEPS_EXTENSION",
]);
// P0-A9: elbow/wrist loading sets. V1 already holds push/pull slots for these injuries; the
// mesocycle must not refill them. The catalog carries no grip data, so elbow and wrist share
// the same exclusion sets.
const ELBOW_WRIST_PRESS = new Set([
  "BARBELL_BENCH_PRESS",
  "BARBELL_FLAT_BENCH_PRESS",
  "DUMBBELL_BENCH_PRESS",
  "DUMBBELL_FLOOR_PRESS",
  "MACHINE_CHEST_PRESS",
  "PUSH_UP",
  "INCLINE_PUSH_UP",
  "CLOSE_GRIP_PUSH_UP",
  ...INCLINE_DECLINE_PRESSES,
  ...OVERHEAD_PRESSES,
]);
const ELBOW_WRIST_PULL = new Set([
  "BARBELL_BENT_OVER_ROW",
  "CHEST_SUPPORTED_ROW",
  "SEATED_CABLE_ROW",
  "ONE_ARM_DUMBBELL_ROW",
  "CHEST_SUPPORTED_INCLINE_DB_ROW",
  "LAT_PULLDOWN",
]);
const ELBOW_WRIST_ARM = new Set([
  "DUMBBELL_BICEPS_CURL",
  "INCLINE_DUMBBELL_CURL",
  "DUMBBELL_HAMMER_CURL",
  "BICEPS_CURL",
  "OVERHEAD_CABLE_TRICEPS_EXTENSION",
  "DUMBBELL_OVERHEAD_TRICEPS_EXTENSION",
  "TRICEPS_ROPE_PUSHDOWN",
  "CABLE_TRICEPS_ROPE_PUSHDOWN",
  "CABLE_TRICEPS_PUSHDOWN",
]);
// P0-A9: hip loading = any squat, lunge, hinge, thrust or bridge under load.
const HIP_LOADED = new Set([
  ...AXIAL_SQUATS,
  "GOBLET_SQUAT",
  "LEG_PRESS_MACHINE",
  "HACK_SQUAT_MACHINE",
  "INCLINE_LEG_PRESS",
  ...LUNGE_PATTERNS,
  ...LOADED_HINGES,
  "BARBELL_HIP_THRUST",
  "HIP_THRUST",
  "DUMBBELL_GLUTE_BRIDGE",
  "GLUTE_BRIDGE",
]);
// P0-A9: ankle loading = squats, lunges and calf raises (the ankle moves under load).
const ANKLE_LOADED = new Set([
  ...AXIAL_SQUATS,
  "GOBLET_SQUAT",
  "LEG_PRESS_MACHINE",
  "HACK_SQUAT_MACHINE",
  "INCLINE_LEG_PRESS",
  ...LUNGE_PATTERNS,
  "BODYWEIGHT_SQUAT",
  "STANDING_CALF_RAISE",
  "SEATED_CALF_RAISE",
  "DUMBBELL_CALF_RAISE",
]);
// When a substitution would repeat an exercise already in the session, use this instead.
const DUPLICATE_ALTERNATIVES = Object.freeze({
  DUMBBELL_LATERAL_RAISE: "ROTATOR_CUFF_EXTERNAL_ROTATION",
  CABLE_LATERAL_RAISE: "ROTATOR_CUFF_EXTERNAL_ROTATION",
  CHEST_SUPPORTED_ROW: "SEATED_CABLE_ROW",
  ONE_ARM_DUMBBELL_ROW: "CHEST_SUPPORTED_INCLINE_DB_ROW",
  GOBLET_SQUAT: "GLUTE_BRIDGE",
  LEG_PRESS_MACHINE: "BARBELL_HIP_THRUST",
  BARBELL_HIP_THRUST: "GLUTE_BRIDGE",
  DUMBBELL_FLOOR_PRESS: "INCLINE_DUMBBELL_BENCH_PRESS",
  // A second chest movement in the same session (UPPER_B, push days) is an incline press.
  BARBELL_BENCH_PRESS: "INCLINE_DUMBBELL_BENCH_PRESS",
  PUSH_UP: "INCLINE_PUSH_UP",
});
const INJURY_CUES_AR = Object.freeze({
  LOWER_BACK: "حماية أسفل الظهر: تم استبدال التحميل المحوري والانحناء المحمل ببديل بظهر مسنود؛ ثبّت الحوض والعمود الفقري في وضع محايد وأوقف التمرين عند أي ألم ينزل للرجل.",
  KNEE: "حماية الركبة: اشتغل في مدى حركي بدون ألم (ثني الركبة حتى 90 درجة تقريباً) ونزول بطيء متحكم؛ ألم خفيف لا يتجاوز 3 من 10 ويختفي خلال 24 ساعة مقبول، وأكثر من ذلك يستدعي تقليل المدى أو الوزن.",
  SHOULDER: "حماية الكتف: تم حذف الضغط فوق الرأس وتمارين الذراع فوق الرأس (مثل الترايسبس خلف الرأس) والنزول العميق في تمارين الصدر؛ استخدم قبضة محايدة، وارفع الذراع في مستوى لوح الكتف (30 درجة أمام الجسم) بدون تجاوز مستوى الكتف.",
  // P0-A9: cues for the new guards (held slots are recorded on the plan flag, not here,
  // because a dropped exercise carries no prescription to attach a cue to).
  ELDERLY_HIGH_BMI: "بداية محافظة لكبار السن أو الوزن المرتفع: الأسبوع الأول تمارين تأسيسية بأوزان خفيفة بدون بار على الظهر وبدون قفز، ومراجعة المدرب مطلوبة قبل التقدم للبار من الأسبوع الثاني.",
  ELBOW: "حماية الكوع: تم حذف التمارين المحملة على الكوع من الخطة؛ راجع المدرب لاختيار بدائل مناسبة.",
  WRIST: "حماية الرسغ: تم حذف التمارين المحملة على الرسغ من الخطة؛ راجع المدرب لاختيار بدائل مناسبة.",
  HIP: "حماية الحوض: تم حذف التمارين المحملة على الحوض من الخطة؛ راجع المدرب لاختيار بدائل مناسبة.",
  ANKLE: "حماية الكاحل: تم حذف التمارين المحملة على الكاحل من الخطة؛ راجع المدرب لاختيار بدائل مناسبة.",
});

const BEGINNER_MIN_RIR = 2;

/**
 * Minimum reps-in-reserve per exercise. Training to failure is not required for hypertrophy
 * (Refalo et al. 2023, Sports Med) and raises fatigue and injury risk on heavy free-weight
 * compounds; novices also misjudge RIR close to failure (Zourdos et al. 2016, JSCR).
 * - Beginners: RIR >= 2 on every exercise.
 * - Intermediate: RIR >= 2 on heavy primary compounds, >= 1 on secondary compounds.
 * - Advanced: RIR >= 1 on heavy primary compounds.
 * - Core stability drills are technique-limited, never taken to failure: RIR >= 2.
 */
function resolveRirFloor(exerciseCode, slotCode, isAdvanced, isIntermediate) {
  if (slotCode === "CORE_STABILITY") return 2;
  if (!isAdvanced && !isIntermediate) return BEGINNER_MIN_RIR;
  if (HEAVY_PRIMARY_COMPOUNDS.has(exerciseCode)) return isAdvanced ? 1 : 2;
  if (SECONDARY_COMPOUNDS.has(exerciseCode) && isIntermediate) return 1;
  return 0;
}

/**
 * P0-A11: the final check. It runs on the FINAL mesocycle weeks, after every
 * mutation above (templates, gym upgrades, injury guards, equipment guard,
 * dedup, re-dosing) — the upstream structural preflight cannot see exercises
 * the mesocycle itself introduced, so it is not reused here. The forbidden
 * sets are exactly the ones the guards above enforce, so a survivor is a
 * guard miss, not a new medical judgment. Equipment is checked only for
 * home clients against a declared set (null = undeclared, unverifiable,
 * skipped — never assumed), mirroring the in-build equipment guard, which
 * runs for home only: gym plans assume the full room today (audit S8,
 * owner decision Q5 still open), so the final check does not newly
 * withhold gym plans on equipment grounds. A failing plan is never fixed
 * up here: violations are reported and the caller withholds the plan via
 * the existing review mechanism.
 *
 * @param {Array} weeks final mesocycle weeks ({ sessions: [{ exercises: [{ exercise_code }] }] })
 * @param {Object} [context] injury flags, hypertension flag, declared equipment set
 * @returns {{ status: "PASSED"|"REVIEW_REQUIRED", violations: Array }}
 */
export function evaluateFinalTrainingWeeks(weeks, context = {}) {
  const violations = [];
  const push = (code, weekNumber, sessionCode, exerciseCode, message, messageAr) =>
    violations.push(Object.freeze({ code, severity: "REVIEW", week_number: weekNumber, session_code: sessionCode, exercise_code: exerciseCode, message, message_ar: messageAr }));

  const forbiddenByJoint = [
    ["LOWER_BACK", context.hasLowerBackInjury, new Set([...AXIAL_SQUATS, ...LOADED_HINGES, ...STANDING_OVERHEAD_PRESSES, "BARBELL_BENT_OVER_ROW"])],
    ["KNEE", context.hasKneeInjury, new Set([...AXIAL_SQUATS, "HACK_SQUAT_MACHINE", ...KNEE_DOMINANT_LOADED, ...LUNGE_PATTERNS, "BODYWEIGHT_SQUAT"])],
    ["SHOULDER", context.hasShoulderInjury, new Set(["BARBELL_BENCH_PRESS", "BARBELL_FLAT_BENCH_PRESS", ...INCLINE_DECLINE_PRESSES, ...OVERHEAD_PRESSES, ...OVERHEAD_ARM_TRICEPS_EXTENSIONS])],
    ["ELBOW", context.hasElbowInjury, new Set([...ELBOW_WRIST_PRESS, ...ELBOW_WRIST_PULL, ...ELBOW_WRIST_ARM])],
    ["WRIST", context.hasWristInjury, new Set([...ELBOW_WRIST_PRESS, ...ELBOW_WRIST_PULL, ...ELBOW_WRIST_ARM])],
    ["HIP", context.hasHipInjury, HIP_LOADED],
    ["ANKLE", context.hasAnkleInjury, ANKLE_LOADED],
  ];
  const hypertensionContraindicated = context.hasHypertensionOrHeart
    ? new Set(CLINICAL_GUIDELINES.HYPERTENSION.CONTRAINDICATED_EXERCISES)
    : null;

  for (const week of weeks || []) {
    for (const session of week?.sessions || []) {
      const seenInSession = new Set();
      for (const exercise of session?.exercises || []) {
        // P1-B9: a slot the mesocycle held (dedup or equipment exhausted) stays in the
        // session flagged for review instead of vanishing silently (audit C2). A held
        // slot withholds the plan exactly like any other final-check violation.
        if (exercise?.held_for_review) {
          push(exercise.held_reason === "EQUIPMENT_EXHAUSTED" ? "EQUIPMENT_SLOT_HELD_FOR_REVIEW" : "DEDUP_SLOT_HELD_FOR_REVIEW",
            week.week_number ?? null, session.session_code ?? null, exercise.slot_code || null,
            `Final weeks hold slot ${exercise.slot_code || "?"} for coach review (${exercise.held_reason || "DEDUP_EXHAUSTED"}).`,
            `الخطة النهائية فيها خانة ${exercise.slot_code || "?"} محجوزة لمراجعة المدرب — لازم المدرب يملاها قبل التسليم.`);
          continue;
        }
        const code = exercise?.exercise_code || exercise?.code;
        if (!code) continue;
        for (const [joint, active, forbidden] of forbiddenByJoint) {
          if (active && forbidden.has(code)) {
            push("FINAL_INJURY_VIOLATION", week.week_number ?? null, session.session_code ?? null, code,
              `Final weeks contain ${code}, forbidden for a ${joint} injury.`,
              `الخطة النهائية فيها تمرين ${code} وهو ممنوع على إصابة ${joint} — الخطة تحتاج مراجعة مدرب قبل التسليم.`);
          }
        }
        if (hypertensionContraindicated && hypertensionContraindicated.has(code)) {
          push("FINAL_INJURY_VIOLATION", week.week_number ?? null, session.session_code ?? null, code,
            `Final weeks contain ${code}, contraindicated for hypertension/cardiovascular conditions.`,
            `الخطة النهائية فيها تمرين ${code} وهو ممنوع لمرضى الضغط والقلب — الخطة تحتاج مراجعة مدرب قبل التسليم.`);
        }
        if (seenInSession.has(code)) {
          push("FINAL_DUPLICATE_EXERCISE", week.week_number ?? null, session.session_code ?? null, code,
            `Final weeks repeat ${code} twice in one session.`,
            `الخطة النهائية فيها تمرين ${code} مرتين في نفس الجلسة — الخطة تحتاج مراجعة مدرب قبل التسليم.`);
        }
        seenInSession.add(code);
        if (context.isHome && context.availableEquipment instanceof Set && !exerciseFitsEquipment(code, context.availableEquipment)) {
          push("FINAL_EQUIPMENT_MISMATCH", week.week_number ?? null, session.session_code ?? null, code,
            `Final weeks contain ${code}, which the client's declared equipment cannot perform.`,
            `الخطة النهائية فيها تمرين ${code} والعميل معندوش المعدات اللي تنفذه — الخطة تحتاج مراجعة مدرب قبل التسليم.`);
        }
      }
    }
  }

  return Object.freeze({
    status: violations.length > 0 ? "REVIEW_REQUIRED" : "PASSED",
    violations: Object.freeze(violations),
  });
}

/**
 * Builds a multi-week periodized meso-cycle from an Intake Decision.
 *
 * @param {import("../intake-decision-engine/domain/contracts.js").IntakeDecision} intakeDecision
 * @param {Object} [options]
 * @param {number} [options.weeksCount=5]
 * @param {string|string[]|null} [options.muscleBias=null] one muscle code, or the muscles the client asked to prioritise
 * @returns {import("./domain/contracts.js").MesoCycleProgram}
 */
export function buildTrainingMesoCycle(intakeDecision, options = {}) {
  const { weeksCount = 5, muscleBias = null } = options;
  // The client may prioritise more than one muscle, and a single choice ("arms") can cover two.
  const muscleBiasList = Object.freeze(
    (Array.isArray(muscleBias) ? muscleBias : muscleBias ? [muscleBias] : [])
      .map((m) => String(m).toUpperCase())
      .filter(Boolean),
  );

  // 1. Build Base Training Engine V1 Program
  let effectiveDecision = intakeDecision;
  const isBlockedOrWithheld = intakeDecision.plan_status === "BLOCKED" || intakeDecision.plan_status === "WITHHELD";
  if (
    !isBlockedOrWithheld &&
    (options.allowProvisional !== false) &&
    (intakeDecision.plan_status === "MEDICAL_REVIEW_REQUIRED" ||
      (intakeDecision.training_decision?.recommended_days === 0 && options.rawIntake))
  ) {
    const rawDays = options.rawIntake?.training?.preferredDaysPerWeek ||
      options.rawIntake?.available_days_per_week ||
      intakeDecision.profile?.preferred_days_per_week || 3;
    const days = Math.min(6, Math.max(2, Number(rawDays) || 3));
    effectiveDecision = {
      ...intakeDecision,
      plan_status: "COACH_REVIEW_REQUIRED",
      training_decision: {
        ...intakeDecision.training_decision,
        recommended_days: days,
      },
    };
  }

  const baseTrainingOutput = buildTrainingEngine(effectiveDecision);
  const basePlan = baseTrainingOutput.weekly_training_plan;
  const preflight = baseTrainingOutput.preflight_report;

  if (isBlockedOrWithheld || basePlan.status === "WITHHELD" || basePlan.status === "BLOCKED") {
    return Object.freeze({
      engine_version: TRAINING_ENGINE_V2_VERSION,
      total_weeks: 0,
      split_code: basePlan.split_code,
      schedule_mode: basePlan.schedule_mode,
      strategy: VolumeProgressionStrategy.LINEAR_RIR_DROP,
      muscle_bias: muscleBias,
      weeks: Object.freeze([]),
      preflight_report: preflight,
    });
  }

  // Detect Client Experience Level
  // P1-B9: unknown experience fails toward safer training, never harder (audit S23).
  // The old fallback dosed a client with no experience recorded anywhere as INTERMEDIATE
  // whenever the intro flag was false and volume was NORMAL.
  const intakeExperience =
    options.experience ||
    (options.rawIntake && options.rawIntake.training && options.rawIntake.training.experience) ||
    intakeDecision.profile?.experience ||
    "BEGINNER";

  // P1-B9: a real intro week (audit C10). The decision flag comes from the intake
  // rules (never trained, returning after a break, or uncertain data). An intro
  // week caps week-1 sets at 2 and floors week-1 RIR at 3 (technique-first loads).
  // It only caps sets/RIR — it never replaces exercises, so it cannot conflict with
  // the P0-A9 elderly/high-BMI intro guard, which swaps exercises and caps sets too.
  // Separately, a CONSERVATIVE volume start (poor sleep, high stress, high sport
  // load, physical work, or the intro itself) also caps week-1 sets at 2, honouring
  // the V1 prescription's 2-set promise that the mesocycle used to ignore — but it
  // does NOT impose the intro RIR floor, because it is not an intro week.
  const introWeekRequired =
    intakeDecision.training_decision?.intro_week_required === true ||
    options.introWeekRequired === true;
  const conservativeVolumeStart =
    intakeDecision.training_decision?.volume_start === "CONSERVATIVE";
  const isAdvanced = intakeExperience === "ADVANCED";
  const isIntermediate = intakeExperience === "INTERMEDIATE";
  // Volume by training age (never lifted ... 4+ years); older intakes follow their level exactly.
  const agePolicy = trainingAgePolicy(options.rawIntake?.training?.trainingAge ?? trainingAgeForExperience(intakeExperience));

  const rawIntake = options.rawIntake || {};
  // What the client said they own. Unknown (no list) leaves every template exactly as it was.
  const declaredEquipment = Array.isArray(rawIntake?.training?.equipment)
    ? rawIntake.training.equipment.map((item) => String(item?.equipmentCode || item).toUpperCase())
    : [];
  const availableEquipment = declaredEquipment.length > 0 ? new Set([...declaredEquipment, "BODYWEIGHT"]) : null;
  const isHome =
    rawIntake.training?.location === "HOME" ||
    rawIntake.training_location === "HOME" ||
    rawIntake.location === "HOME" ||
    intakeDecision.profile?.training_location === "HOME" ||
    intakeDecision.profile?.location === "HOME";

  // Map fallback exercises to primary gym compounds when equipment allows (Gym trainees only)
  const GYM_COMPOUND_UPGRADES = Object.freeze({
    DUMBBELL_FLOOR_PRESS: "BARBELL_BENCH_PRESS",
    GOBLET_SQUAT: "BARBELL_BACK_SQUAT",
    ONE_ARM_DUMBBELL_ROW: "BARBELL_BENT_OVER_ROW",
    STANDING_DUMBBELL_SHOULDER_PRESS: "BARBELL_OVERHEAD_PRESS",
  });

  const HOME_EQUIPMENT_REPLACEMENTS = Object.freeze({
    BARBELL_BACK_SQUAT: "GOBLET_SQUAT",
    BARBELL_BENCH_PRESS: "DUMBBELL_FLOOR_PRESS",
    BARBELL_BENT_OVER_ROW: "ONE_ARM_DUMBBELL_ROW",
    BARBELL_OVERHEAD_PRESS: "STANDING_DUMBBELL_SHOULDER_PRESS",
    BARBELL_DEADLIFT: "DUMBBELL_ROMANIAN_DEADLIFT",
    SEATED_LEG_CURL: "DUMBBELL_ROMANIAN_DEADLIFT",
    LYING_LEG_CURL_MACHINE: "GLUTE_BRIDGE",
    LEG_PRESS_MACHINE: "GOBLET_SQUAT",
    INCLINE_LEG_PRESS: "GOBLET_SQUAT",
    HACK_SQUAT_MACHINE: "GOBLET_SQUAT",
    DECLINE_DUMBBELL_BENCH_PRESS: "DUMBBELL_FLOOR_PRESS",
    CABLE_LATERAL_RAISE: "DUMBBELL_LATERAL_RAISE",
    LAT_PULLDOWN: "ONE_ARM_DUMBBELL_ROW",
    SEATED_CABLE_ROW: "ONE_ARM_DUMBBELL_ROW",
    CHEST_SUPPORTED_ROW: "ONE_ARM_DUMBBELL_ROW",
    TRICEPS_ROPE_PUSHDOWN: "DUMBBELL_OVERHEAD_TRICEPS_EXTENSION",
    CABLE_TRICEPS_ROPE_PUSHDOWN: "DUMBBELL_OVERHEAD_TRICEPS_EXTENSION",
    CABLE_TRICEPS_PUSHDOWN: "DUMBBELL_OVERHEAD_TRICEPS_EXTENSION",
    OVERHEAD_CABLE_TRICEPS_EXTENSION: "DUMBBELL_OVERHEAD_TRICEPS_EXTENSION",
    FACE_PULL: "DUMBBELL_LATERAL_RAISE",
    CABLE_FACE_PULL: "DUMBBELL_LATERAL_RAISE",
    HANGING_LEG_RAISE: "DEAD_BUG",
    LEG_EXTENSION_MACHINE: "GOBLET_SQUAT",
    SEATED_CALF_RAISE: "STANDING_CALF_RAISE",
  });

  const constraints = intakeDecision.hard_constraints || [];

  const rawInjuriesList = [
    ...(Array.isArray(rawIntake.injuries) ? rawIntake.injuries : []),
    ...(Array.isArray(rawIntake.training?.injuries) ? rawIntake.training.injuries : []),
    ...(Array.isArray(rawIntake.training?.selectedInjuries) ? rawIntake.training.selectedInjuries : []),
    ...(Array.isArray(rawIntake.injuries_map?.selected_areas) ? rawIntake.injuries_map.selected_areas : []),
    ...(Array.isArray(rawIntake.medical?.injuries) ? rawIntake.medical.injuries : []),
    ...(Array.isArray(intakeDecision.profile?.injuries) ? intakeDecision.profile.injuries : []),
  ].map((item) => {
    if (typeof item === "string") return item.toUpperCase();
    return String(item?.area || item?.code || item?.location || "").toUpperCase();
  });

  const checkInjury = (areaKeywords, movementKeywords = []) => {
    const matchesConstraint = constraints.some((c) => {
      const code = String(c.code || "").toUpperCase();
      const area = String(c.value?.area || "").toUpperCase();
      const movement = String(c.value?.movement || "").toUpperCase();
      const desc = String(c.reason || c.description || "").toUpperCase();
      const areaMatch = areaKeywords.some((k) => code.includes(k) || area.includes(k) || desc.includes(k));
      const movMatch = movementKeywords.some((m) => movement.includes(m) || desc.includes(m));
      return areaMatch || movMatch;
    });
    const matchesRaw = rawInjuriesList.some((inj) => areaKeywords.some((k) => inj.includes(k)));
    return matchesConstraint || matchesRaw;
  };

  const hasLowerBackInjury = checkInjury(["LOWER_BACK", "SPINE", "LUMBAR", "BACK"], ["HINGE", "DEADLIFT"]);
  const hasShoulderInjury = checkInjury(["SHOULDER", "ROTATOR_CUFF", "NECK"], ["OVERHEAD", "PRESS"]);
  const hasKneeInjury = checkInjury(["KNEE"], ["SQUAT", "LUNGE"]);
  // P0-A9: area-only matching for the new joints. Movement keywords are deliberately empty:
  // movement-alone matching falsely fires other joints' guards (audit S19: hip/ankle mapped
  // to SQUAT/HINGE movements would otherwise trigger the knee/lower-back guards).
  const hasElbowInjury = checkInjury(["ELBOW"]);
  const hasWristInjury = checkInjury(["WRIST"]);
  const hasHipInjury = checkInjury(["HIP"]);
  const hasAnkleInjury = checkInjury(["ANKLE"]);
  const hasInjuries =
    hasLowerBackInjury ||
    hasShoulderInjury ||
    hasKneeInjury ||
    constraints.some((c) => String(c.code).includes("INJURY")) ||
    rawInjuriesList.length > 0;

  // Clinical Guard: Hypertension & Cardiovascular Conditions (ACSM/AHA Guidelines)
  const medical = rawIntake.medical || {};
  const rawMedicalConditions = [
    ...(Array.isArray(medical.conditions) ? medical.conditions : []),
    ...(Array.isArray(intakeDecision.profile?.medical_conditions) ? intakeDecision.profile.medical_conditions : []),
    ...(Array.isArray(intakeDecision.constraints) ? intakeDecision.constraints.map(c => c.code) : [])
  ].map(c => typeof c === 'string' ? c.toUpperCase() : String(c?.conditionCode || c?.code || '').toUpperCase());

  const hasHypertensionOrHeart =
    medical.hasHypertension === true ||
    medical.hasHeartCondition === true ||
    rawIntake.hasHypertension === true ||
    rawMedicalConditions.some(c => c.includes("HYPERTENSION") || c.includes("HEART_CONDITION") || c.includes("HIGH_BLOOD_PRESSURE"));

  // P0-A9: elderly / high-BMI guard (owner decision Q13: age 65+ and/or BMI 35+, beginners).
  // Age sources, in order: explicit option, raw personal.age, date of birth (the canonical
  // intake stores an age input as a birth year), decision profile. BMI from raw body
  // weight/height. Fail-closed: a beginner whose age or BMI cannot be determined is flagged
  // for coach review instead of being treated as young/lean. Note: the intake adapter
  // defaults a missing age to 1998-01-01 and missing weight/height to 75kg/175cm, so
  // callers passing adapter output can never look "unknown" — the unknown branch covers
  // direct callers that omit personal/body entirely.
  const toFiniteNumberOrNull = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const rawPersonal = rawIntake.personal || {};
  const rawBody = rawIntake.body || {};
  let clientAge = toFiniteNumberOrNull(options.clientAge ?? rawPersonal.age ?? rawIntake.age ?? intakeDecision.profile?.age);
  if (clientAge === null) {
    const dob = rawPersonal.dateOfBirth || rawIntake.dateOfBirth || intakeDecision.profile?.dateOfBirth;
    if (typeof dob === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      const birth = new Date(dob + "T00:00:00Z");
      if (!Number.isNaN(birth.getTime())) {
        const now = new Date();
        let years = now.getUTCFullYear() - birth.getUTCFullYear();
        const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
        if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())) years -= 1;
        clientAge = years;
      }
    }
  }
  const clientWeightKg = toFiniteNumberOrNull(options.clientWeightKg ?? rawBody.weightKg ?? rawIntake.weight_kg ?? intakeDecision.profile?.weight_kg);
  const clientHeightCm = toFiniteNumberOrNull(options.clientHeightCm ?? rawBody.heightCm ?? rawIntake.height_cm ?? intakeDecision.profile?.height_cm);
  const clientBmi = (clientWeightKg !== null && clientHeightCm !== null && clientHeightCm > 0)
    ? clientWeightKg / ((clientHeightCm / 100) ** 2)
    : null;
  const isBeginnerClient = !isAdvanced && !isIntermediate;
  const elderlyHighBmi = isBeginnerClient && ((clientAge !== null && clientAge >= 65) || (clientBmi !== null && clientBmi >= 35));
  const unknownAgeOrBmi = isBeginnerClient && (clientAge === null || clientBmi === null);

  // P0-A9: plan-level coach-review flags. Every held/excluded slot is recorded here (deduped
  // by joint+slot+code) so nothing is silently dropped; the flags ride on the returned program.
  const guardReviewFlags = [];
  const guardReviewFlagKeys = new Set();
  const flagHeldSlot = (joint, slotCode, code) => {
    const key = joint + "|" + slotCode + "|" + code;
    if (!guardReviewFlagKeys.has(key)) {
      guardReviewFlagKeys.add(key);
      guardReviewFlags.push(Object.freeze({ joint, slot_code: slotCode, excluded_exercise: code }));
    }
  };
  if (elderlyHighBmi) {
    guardReviewFlags.push(Object.freeze({
      type: "ELDERLY_HIGH_BMI",
      age: clientAge,
      bmi: clientBmi !== null ? Math.round(clientBmi * 10) / 10 : null,
      note_ar: INJURY_CUES_AR.ELDERLY_HIGH_BMI,
    }));
  }
  if (unknownAgeOrBmi) {
    guardReviewFlags.push(Object.freeze({
      type: "UNKNOWN_AGE_OR_BMI",
      note_ar: "عمر العميل أو مؤشر كتلة جسمه غير معروف: لا يمكن التأكد أنه ليس من فئة كبار السن أو الوزن المرتفع، لذا الخطة تحتاج مراجعة مدرب قبل التسليم.",
    }));
  }

  // P1-B9: helpers for slots the mesocycle cannot fill (dedup or equipment exhausted)
  // and slots it refills from an upstream REVIEW. Plan-level flags dedupe by
  // reason+slot+code (the P0-A9 precedent); the session itself keeps one held entry
  // per week, so the gap stays visible week by week.
  const reviewFlagKeys = new Set();
  const flagReviewSlot = (flag) => {
    const key = flag.type + "|" + (flag.slot_code || "") + "|" + (flag.excluded_exercise || flag.refilled_exercise || "");
    if (reviewFlagKeys.has(key)) return;
    reviewFlagKeys.add(key);
    guardReviewFlags.push(Object.freeze(flag));
  };
  const heldEntryFor = (ex, reason, codeBefore, weekNumber, sessionCode) => {
    const noteAr = reason === "EQUIPMENT_EXHAUSTED"
      ? "الخانة دي ملهاش تمرين مناسب بمعدات العميل المعلنة — لازم المدرب يختار بديل قبل التسليم."
      : reason === "SHOULDER_OVERHEAD_ARM_HELD"
        ? "تمارين الذراع فوق الرأس ممنوعة على إصابة الكتف ومفيش بديل آمن بدون كيبل — لازم المدرب يختار بديل قبل التسليم."
        : "الخانة دي اتكرر تمرينها في نفس الجلسة وملهاش بديل متاح — لازم المدرب يختار بديل قبل التسليم.";
    flagReviewSlot({
      type: reason,
      week_number: weekNumber,
      session_code: sessionCode,
      slot_code: ex.slot_code,
      excluded_exercise: codeBefore,
      note_ar: noteAr,
    });
    return Object.freeze({
      order: ex.order ?? null,
      slot_code: ex.slot_code,
      exercise_code: null,
      code: null,
      name: null,
      name_en: null,
      name_ar: null,
      selection_status: "REVIEW_REQUIRED",
      reason_code: reason,
      prescription: null,
      held_for_review: true,
      held_reason: reason,
      held_note_ar: noteAr,
    });
  };

  // 2. Generate Periodized Weeks
  const weekConfigs = resolveMesocycleWeekConfigs({
    experience: intakeExperience,
    weeksCount,
    plannedDeload: options.plannedDeload ?? options.forceDeload,
    skipDeload: options.skipDeload ?? (options.includeDeload === false),
    customWeeksConfig: options.weeksConfig || options.customWeeksConfig,
    targetRirWeek4: options.targetRirWeek4 ?? options.peakRir,
    fatigueScore: options.fatigueScore ?? options.accumulated_fatigue_score,
    recoveryScore: options.recoveryScore,
    performanceTrend: options.performanceTrend,
    dataQuality: options.dataQuality,
    coachDeloadPreference: options.coachDeloadPreference,
  });

  // P1-B9: label the intro week so the coach sees why week 1 is light.
  if (introWeekRequired && weekConfigs.length > 0) {
    weekConfigs[0] = { ...weekConfigs[0], focus_note: (weekConfigs[0].focus_note || "") + " (أسبوع تمهيدي: مجموعتين كحد أقصى وأحمال تقنية بـ RIR 3 على الأقل.)" };
  }

  const periodizedWeeks = weekConfigs.map((config) => {
    const isBeginner = !isAdvanced && !isIntermediate;
    // P1-B9: the week title is the maximum AFTER floors (audit C7), so the header
    // matches the delivered dose — including the training-age floor (a never-trained
    // client is dosed at RIR 3 while the old title said 2) and the global floor 1.
    const weekTargetRir = Math.max(
      config.target_rir,
      hasHypertensionOrHeart ? CLINICAL_GUIDELINES.HYPERTENSION.MIN_RIR : 0,
      isBeginner ? BEGINNER_MIN_RIR : 0,
      agePolicy.minRir || 0,
      1,
    );
    const periodizedSessions = basePlan.sessions.map((baseSession, sessionIdx) => {
      // Create session-specific exercise layout to prevent repetitive duplicates
      let sessionExerciseTemplates = [...(baseSession.exercises || [])];

      // 3-Day Undulating Full Body Architecture (A / B / C)
      if (basePlan.split_code === "FULL_BODY") {
        if (sessionIdx === 0) {
          // Day 1 (Full Body A - Quad Focus & Horizontal Push/Pull + Knee Flexion + Calves + Side Delts + Optional Arm Finisher)
          sessionExerciseTemplates = [
            { slot_code: "KNEE_DOMINANT", exercise_code: isHome ? "GOBLET_SQUAT" : "BARBELL_BACK_SQUAT", custom_rest: 150, target_min: isHome ? 8 : 6, target_max: isHome ? 10 : 8, base_rir: 2 },
            { slot_code: "HORIZONTAL_PUSH", exercise_code: isHome ? "DUMBBELL_FLOOR_PRESS" : "BARBELL_BENCH_PRESS", custom_rest: 120, target_min: isHome ? 8 : 6, target_max: isHome ? 10 : 8, base_rir: 2 },
            { slot_code: "HORIZONTAL_PULL", exercise_code: isHome ? "ONE_ARM_DUMBBELL_ROW" : "CHEST_SUPPORTED_ROW", custom_rest: 90, target_min: 8, target_max: 10, base_rir: 2 },
            { slot_code: "KNEE_FLEXION", exercise_code: isHome ? "DUMBBELL_ROMANIAN_DEADLIFT" : "SEATED_LEG_CURL", custom_rest: 90, target_min: 10, target_max: 12, base_rir: 1 },
            { slot_code: "CALF_RAISE", exercise_code: "STANDING_CALF_RAISE", custom_rest: 60, target_min: 10, target_max: 15, base_rir: 1 },
            { slot_code: "SHOULDER_ABDUCTION", exercise_code: isHome ? "DUMBBELL_LATERAL_RAISE" : "CABLE_LATERAL_RAISE", custom_rest: 60, target_min: 12, target_max: 15, base_rir: 1 },
          ];

          if (isAdvanced) {
            sessionExerciseTemplates.push(
              { slot_code: "ELBOW_EXTENSION", exercise_code: isHome ? "DUMBBELL_OVERHEAD_TRICEPS_EXTENSION" : "TRICEPS_ROPE_PUSHDOWN", custom_rest: 60, target_min: 12, target_max: 15, base_rir: 1, sets_override: 3 },
              { slot_code: "ELBOW_FLEXION", exercise_code: "DUMBBELL_HAMMER_CURL", custom_rest: 60, target_min: 12, target_max: 15, base_rir: 1, sets_override: 3 },
            );
          }
        } else if (sessionIdx === 1) {
          // Day 2 (Full Body B - Posterior Hinge, Incline Push, Vertical Pull, Quad Machine & Stretch Arms)
          sessionExerciseTemplates = [
            { slot_code: "HIP_HINGE", exercise_code: "DUMBBELL_ROMANIAN_DEADLIFT", custom_rest: 150, target_min: 6, target_max: 8, base_rir: 2 },
            // The glutes worked in every squat and hinge and were never trained on their own.
            { slot_code: "HIP_EXTENSION", exercise_code: isHome ? "DUMBBELL_GLUTE_BRIDGE" : "BARBELL_HIP_THRUST", custom_rest: 90, target_min: 8, target_max: 12, base_rir: 2 },
            { slot_code: "HORIZONTAL_PUSH", exercise_code: "INCLINE_DUMBBELL_BENCH_PRESS", custom_rest: 120, target_min: 8, target_max: 10, base_rir: 2 },
            { slot_code: "VERTICAL_PULL", exercise_code: isHome ? "ONE_ARM_DUMBBELL_ROW" : "LAT_PULLDOWN", custom_rest: 90, target_min: 8, target_max: 10, base_rir: 1 },
            { slot_code: "KNEE_DOMINANT", exercise_code: isHome ? "GOBLET_SQUAT" : "LEG_PRESS_MACHINE", custom_rest: 120, target_min: 8, target_max: 10, base_rir: 2 },
            { slot_code: "ELBOW_FLEXION", exercise_code: "INCLINE_DUMBBELL_CURL", custom_rest: 60, target_min: 10, target_max: 12, base_rir: 1 },
            { slot_code: "ELBOW_EXTENSION", exercise_code: isHome ? "DUMBBELL_OVERHEAD_TRICEPS_EXTENSION" : "OVERHEAD_CABLE_TRICEPS_EXTENSION", custom_rest: 60, target_min: 10, target_max: 12, base_rir: 1 },
          ];
        } else if (sessionIdx === 2) {
          // Day 3 (Full Body C - Unilateral Lower, Overhead Press, Isolation & Core)
          sessionExerciseTemplates = [
            { slot_code: "UNILATERAL_LOWER", exercise_code: "BULGARIAN_SPLIT_SQUAT", custom_rest: 90, target_min: 8, target_max: 10, base_rir: 2 },
            { slot_code: "VERTICAL_PUSH", exercise_code: isHome ? "STANDING_DUMBBELL_SHOULDER_PRESS" : "BARBELL_OVERHEAD_PRESS", custom_rest: 120, target_min: 6, target_max: 8, base_rir: 2 },
            // Chest had two sessions of three (6 weekly sets against ~10 for the back): a third press.
            { slot_code: "HORIZONTAL_PUSH", exercise_code: isHome ? "PUSH_UP" : "MACHINE_CHEST_PRESS", custom_rest: 90, target_min: 10, target_max: 12, base_rir: 1 },
            { slot_code: "HORIZONTAL_PULL", exercise_code: isHome ? "ONE_ARM_DUMBBELL_ROW" : "SEATED_CABLE_ROW", custom_rest: 90, target_min: 10, target_max: 12, base_rir: 1 },
            { slot_code: "KNEE_FLEXION", exercise_code: isHome ? "NORDIC_HAMSTRING_CURL" : "LYING_LEG_CURL_MACHINE", custom_rest: 90, target_min: 10, target_max: 12, base_rir: 1 },
            { slot_code: "SHOULDER_ABDUCTION", exercise_code: "DUMBBELL_LATERAL_RAISE", custom_rest: 60, target_min: 12, target_max: 15, base_rir: 1, sets_override: isAdvanced ? 4 : 3 },
          ];

          if (isAdvanced) {
            sessionExerciseTemplates.push(
              { slot_code: "REAR_DELT", exercise_code: isHome ? "DUMBBELL_LATERAL_RAISE" : "FACE_PULL", custom_rest: 60, target_min: 12, target_max: 15, base_rir: 1, sets_override: 3 },
              { slot_code: "CORE_STABILITY", exercise_code: isHome ? "DEAD_BUG" : "HANGING_LEG_RAISE", custom_rest: 60, target_min: 12, target_max: 15, base_rir: 1 },
            );
          } else {
            sessionExerciseTemplates.push(
              { slot_code: "CORE_STABILITY", exercise_code: "DEAD_BUG", custom_rest: 60, target_min: 12, target_max: 15, base_rir: 1 },
            );
          }
        }
      }

      const usedSessionCodes = new Set();
      const periodizedExercises = sessionExerciseTemplates.map((ex, exIdx) => {
        let finalCode = ex.exercise_code;

        let finalNameEn = ex.name_en;

        // Safe defaults if an upstream slot was marked for review due to injury/equipment
        if (!finalCode) {
          if (ex.slot_code === "HIP_HINGE") finalCode = "GLUTE_BRIDGE";
          else if (ex.slot_code === "VERTICAL_PUSH") finalCode = "DUMBBELL_LATERAL_RAISE";
          else if (ex.slot_code === "KNEE_DOMINANT") finalCode = "GOBLET_SQUAT";
          else if (ex.slot_code === "SHOULDER_ABDUCTION") finalCode = "DUMBBELL_LATERAL_RAISE";
          else if (ex.slot_code === "ELBOW_FLEXION") finalCode = "INCLINE_DUMBBELL_CURL";
          else if (ex.slot_code === "ELBOW_EXTENSION") finalCode = isHome ? "DUMBBELL_OVERHEAD_TRICEPS_EXTENSION" : "OVERHEAD_CABLE_TRICEPS_EXTENSION";
          else if (ex.slot_code === "CALF_RAISE") finalCode = "STANDING_CALF_RAISE";
          else if (ex.slot_code === "KNEE_FLEXION") finalCode = isHome ? "GLUTE_BRIDGE" : "LYING_LEG_CURL_MACHINE";
          else if (ex.slot_code === "UNILATERAL_LOWER") finalCode = "DUMBBELL_REVERSE_LUNGE";
          else finalCode = isHome ? "ONE_ARM_DUMBBELL_ROW" : "CHEST_SUPPORTED_ROW";
        } else if (!isHome && !hasInjuries && GYM_COMPOUND_UPGRADES[finalCode]) {
          finalCode = GYM_COMPOUND_UPGRADES[finalCode];
          const upgradedV2 = getExerciseV2ByCode(finalCode);
          if (upgradedV2) {
            finalNameEn = upgradedV2.name_en;
          }
        }

        // Equipment guard. The session templates above name specific movements (goblet squats and
        // dumbbell rows for "home"), but home is three different rooms: a client who trains with
        // bodyweight and bands owns no dumbbells. Swap to the closest exercise their equipment
        // allows. Gyms are assumed to have the full room, so gym plans are never touched here.
        if (isHome && !exerciseFitsEquipment(finalCode, availableEquipment)) {
          const alternative = equipmentSafeAlternative(finalCode, ex.slot_code, availableEquipment, usedSessionCodes);
          if (alternative) {
            finalCode = alternative.exercise_code;
            finalNameEn = alternative.name_en;
          }
        }

        if (isHome && HOME_EQUIPMENT_REPLACEMENTS[finalCode] && exerciseFitsEquipment(HOME_EQUIPMENT_REPLACEMENTS[finalCode], availableEquipment)) {
          finalCode = HOME_EQUIPMENT_REPLACEMENTS[finalCode];
        }

        // Active injury overrides for safety: each substitute keeps the slot's movement pattern
        // (a squat stays a lower-body exercise) while removing the aggravating joint load.
        const codeBeforeClinicalGuards = finalCode;
        const injuryCues = [];
        if (hasLowerBackInjury) {
          if (AXIAL_SQUATS.has(finalCode)) {
            finalCode = isHome ? "GOBLET_SQUAT" : "LEG_PRESS_MACHINE";
          } else if (LOADED_HINGES.has(finalCode)) {
            finalCode = isHome ? "GLUTE_BRIDGE" : "BARBELL_HIP_THRUST";
          } else if (finalCode === "BARBELL_BENT_OVER_ROW") {
            finalCode = isHome ? "ONE_ARM_DUMBBELL_ROW" : "CHEST_SUPPORTED_ROW";
          } else if (STANDING_OVERHEAD_PRESSES.has(finalCode)) {
            finalCode = "SEATED_DUMBBELL_SHOULDER_PRESS";
          }
          if (finalCode !== codeBeforeClinicalGuards) injuryCues.push(INJURY_CUES_AR.LOWER_BACK);
        }
        if (hasKneeInjury) {
          const beforeKnee = finalCode;
          // A knee-loaded substitute is not a safe substitute: axial squats, hack squats and
          // the knee-dominant loaded pair (goblet squat / leg press, including the lower-back
          // guard's substitutes above) all become hip-extension work, exactly like lunges.
          // Goblet squats and leg presses stay in the plan only for clients without a knee injury.
          // P0-A9: the V1 bodyweight squat is knee-dominant too (audit S4); it is not in the
          // loaded pair, so it is listed explicitly rather than renamed into that set.
          if (
            AXIAL_SQUATS.has(finalCode) ||
            finalCode === "HACK_SQUAT_MACHINE" ||
            KNEE_DOMINANT_LOADED.has(finalCode) ||
            LUNGE_PATTERNS.has(finalCode) ||
            finalCode === "BODYWEIGHT_SQUAT"
          ) {
            finalCode = isHome ? "GLUTE_BRIDGE" : "BARBELL_HIP_THRUST";
          }
          if (finalCode !== beforeKnee || KNEE_DOMINANT_LOADED.has(finalCode)) injuryCues.push(INJURY_CUES_AR.KNEE);
        }
        if (hasShoulderInjury) {
          const beforeShoulder = finalCode;
          if (finalCode === "BARBELL_BENCH_PRESS" || finalCode === "BARBELL_FLAT_BENCH_PRESS") {
            finalCode = isHome ? "DUMBBELL_FLOOR_PRESS" : "MACHINE_CHEST_PRESS";
          } else if (INCLINE_DECLINE_PRESSES.has(finalCode)) {
            finalCode = "DUMBBELL_FLOOR_PRESS";
          } else if (OVERHEAD_PRESSES.has(finalCode)) {
            // Pressing overhead narrows the subacromial space; external-rotation strengthening is
            // first-line exercise therapy for subacromial shoulder pain, and lateral raises stay in the week.
            finalCode = "ROTATOR_CUFF_EXTERNAL_ROTATION";
          } else if (OVERHEAD_ARM_TRICEPS_EXTENSIONS.has(finalCode)) {
            // The arm is overhead even though this is elbow extension, not a
            // press: the same subacromial narrowing applies. In the gym the
            // rope pushdown trains the same muscle with the arms down (the
            // swap registry's safe swap). At home the catalog has no
            // non-overhead triceps substitute, so the slot is held for the
            // coach instead of serving an overhead movement.
            if (isHome) {
              return heldEntryFor(ex, "SHOULDER_OVERHEAD_ARM_HELD", beforeShoulder, config.week_number, baseSession.session_code);
            }
            finalCode = "CABLE_TRICEPS_ROPE_PUSHDOWN";
          }
          if (finalCode !== beforeShoulder) injuryCues.push(INJURY_CUES_AR.SHOULDER);
        }

        // P0-A9: elderly / high-BMI intro week (week 1 only): no barbell axial loading and
        // no Bulgarian split squat as opening lifts. The replacements are the safest
        // alternatives the codebase already offers beginners: goblet squat (the home
        // template and the safe default for KNEE_DOMINANT), bodyweight split squat
        // (audit S1: stable split stance before Bulgarian, with support), and dumbbell
        // Romanian deadlift (the FULL_BODY_B hinge). Week 1 sets are capped at 2 below.
        // Weeks 2+ still contain barbell work: the plan-level ELDERLY_HIGH_BMI flag tells
        // the coach that barbell progression from week 2 needs their clearance.
        if (elderlyHighBmi && config.week_number === 1) {
          const beforeElderly = finalCode;
          if (AXIAL_SQUATS.has(finalCode)) {
            finalCode = "GOBLET_SQUAT";
          } else if (finalCode === "BULGARIAN_SPLIT_SQUAT") {
            finalCode = "BODYWEIGHT_SPLIT_SQUAT";
          } else if (LOADED_HINGES.has(finalCode)) {
            finalCode = "DUMBBELL_ROMANIAN_DEADLIFT";
          }
          if (finalCode !== beforeElderly) injuryCues.push(INJURY_CUES_AR.ELDERLY_HIGH_BMI);
        }

        // P0-A9: elbow/wrist/hip/ankle guards. The codebase defines no safe substitute for
        // loaded upper-body work without elbow/wrist load, and no hip-safe substitute for
        // hip patterns (the knee guard's hip-extension conversion is exactly what a hip
        // injury must avoid), so the joint-loading exercise is excluded and the held slot
        // is recorded on the plan flag for the coach to fill. This follows V1, which
        // already holds push/pull slots for these injuries — the mesocycle must not refill
        // them with loaded work. These guards run after the knee/lower-back guards on
        // purpose: a hip client falsely tripping the knee guard (audit S19) gets the
        // knee guard's hip-thrust substitute removed again here.
        if (hasElbowInjury && (ELBOW_WRIST_PRESS.has(finalCode) || ELBOW_WRIST_PULL.has(finalCode) || ELBOW_WRIST_ARM.has(finalCode))) {
          flagHeldSlot("ELBOW", ex.slot_code, finalCode);
          finalCode = null;
        }
        if (hasWristInjury && (ELBOW_WRIST_PRESS.has(finalCode) || ELBOW_WRIST_PULL.has(finalCode) || ELBOW_WRIST_ARM.has(finalCode))) {
          flagHeldSlot("WRIST", ex.slot_code, finalCode);
          finalCode = null;
        }
        if (hasHipInjury && HIP_LOADED.has(finalCode)) {
          flagHeldSlot("HIP", ex.slot_code, finalCode);
          finalCode = null;
        }
        if (hasAnkleInjury && ANKLE_LOADED.has(finalCode)) {
          flagHeldSlot("ANKLE", ex.slot_code, finalCode);
          finalCode = null;
        }

        // Hypertension & Cardiovascular Guard: Exclude inverted postures & excessive Valsalva compressive exercises
        if (hasHypertensionOrHeart && CLINICAL_GUIDELINES.HYPERTENSION.CONTRAINDICATED_EXERCISES.includes(finalCode)) {
          if (finalCode === "LEG_PRESS_MACHINE" || finalCode === "INCLINE_LEG_PRESS" || finalCode === "HACK_SQUAT_MACHINE") {
            finalCode = "GOBLET_SQUAT";
          } else if (finalCode === "DECLINE_CRUNCH") {
            finalCode = "DEAD_BUG";
          } else if (finalCode === "DECLINE_BENCH_PRESS" || finalCode === "DECLINE_DUMBBELL_BENCH_PRESS") {
            finalCode = isHome ? "DUMBBELL_FLOOR_PRESS" : "DUMBBELL_BENCH_PRESS";
          } else {
            finalCode = isHome ? "ONE_ARM_DUMBBELL_ROW" : "CHEST_SUPPORTED_ROW";
          }
        }

        // The clinical guards above name dumbbell substitutes for "home"; a bodyweight-and-bands
        // client owns none, so the substitute is checked again against the declared equipment and,
        // when it does not fit, swapped for the closest exercise of the substitute's own slot. When
        // nothing they own fits (a second lateral raise once the band version is already in the
        // session) the exercise is left out, exactly as a duplicate is below.
        const fitHomeEquipment = (code) => {
          if (!isHome || exerciseFitsEquipment(code, availableEquipment)) return code;
          const own = getExerciseV2ByCode(code);
          const alternative = equipmentSafeAlternative(code, own?.slot_code || ex.slot_code, availableEquipment, usedSessionCodes);
          return alternative ? alternative.exercise_code : null;
        };
        // P1-B9: a slot the equipment guard empties stays held for review instead of
        // vanishing silently. An injury hold (already null + flagged above) still returns
        // null exactly as before — only a code the guard itself drops becomes a held entry.
        const codeBeforeFit = finalCode;
        finalCode = fitHomeEquipment(finalCode);
        if (!finalCode) {
          if (codeBeforeFit) return heldEntryFor(ex, "EQUIPMENT_EXHAUSTED", codeBeforeFit, config.week_number, baseSession.session_code);
          return null;
        }

        // The equipment fit above can reintroduce an overhead-arm movement:
        // the home replacement for a rope pushdown is a dumbbell overhead
        // extension. Re-check the final code for a shoulder injury; at home
        // there is no safe substitute, so the slot is held for the coach.
        if (hasShoulderInjury && OVERHEAD_ARM_TRICEPS_EXTENSIONS.has(finalCode)) {
          return heldEntryFor(ex, "SHOULDER_OVERHEAD_ARM_HELD", finalCode, config.week_number, baseSession.session_code);
        }

        // Never repeat an exercise inside one session after substitutions.
        // P1-B9: when dedup exhausts its alternatives, the slot stays held for review
        // instead of being silently deleted (audit C2).
        if (usedSessionCodes.has(finalCode)) {
          const duplicateCode = finalCode;
          const alternative = DUPLICATE_ALTERNATIVES[finalCode];
          if (!alternative || usedSessionCodes.has(alternative)) return heldEntryFor(ex, "DEDUP_EXHAUSTED", duplicateCode, config.week_number, baseSession.session_code);
          finalCode = fitHomeEquipment(alternative);
          if (!finalCode) return heldEntryFor(ex, "EQUIPMENT_EXHAUSTED", alternative, config.week_number, baseSession.session_code);
          if (usedSessionCodes.has(finalCode)) return heldEntryFor(ex, "DEDUP_EXHAUSTED", finalCode, config.week_number, baseSession.session_code);
        }
        usedSessionCodes.add(finalCode);

        // A clinical substitute takes the dosing of its own exercise class, not the replaced slot's
        // (e.g. a lateral raise replacing an overhead press must not inherit 6-8 heavy reps).
        const clinicallySubstituted = finalCode !== codeBeforeClinicalGuards;
        const dose = clinicallySubstituted ? {} : ex;

        const v2Exercise = getExerciseV2ByCode(finalCode);

        // Calculate Evidence-Based Reps, Sets, Rest Intervals, and RIR
        let targetMin = dose.target_min || (isAdvanced ? 6 : isIntermediate ? 8 : 8);
        let targetMax = dose.target_max || (isAdvanced ? 8 : isIntermediate ? 10 : 10);
        let restSeconds = dose.custom_rest || 90;
        let baseSetCount = dose.sets_override || 3;
        let baseRir = dose.base_rir !== undefined ? dose.base_rir : (isAdvanced ? 2 : isIntermediate ? 2 : 3);

        // Beginners use higher rep floor for form mastery & safety
        if (!isAdvanced && !isIntermediate && targetMin === 6) {
          targetMin = 8;
          targetMax = 10;
          baseRir = 3;
        }

        if (!dose.target_min) {
          if (HEAVY_PRIMARY_COMPOUNDS.has(finalCode)) {
            targetMin = isAdvanced ? 6 : 8;
            targetMax = isAdvanced ? 8 : 10;
            restSeconds = 120;
            baseSetCount = isAdvanced ? 4 : 3;
            baseRir = isAdvanced ? 2 : 3;
          } else if (SECONDARY_COMPOUNDS.has(finalCode)) {
            targetMin = 8;
            targetMax = 12;
            restSeconds = 90;
            baseSetCount = 3;
            baseRir = isAdvanced ? 1 : 2;
          } else if (ISOLATION_STRETCH_MOVEMENTS.has(finalCode)) {
            targetMin = 10;
            targetMax = 15;
            restSeconds = 60;
            baseSetCount = 3;
            baseRir = isAdvanced ? 1 : 2;
          } else {
            targetMin = 12;
            targetMax = 20;
            restSeconds = 60;
            baseSetCount = 3;
            baseRir = isAdvanced ? 1 : 2;
          }
        }

        if (agePolicy.baseSets) {
          baseSetCount = agePolicy.baseSets;
        } else {
          const isCompound = HEAVY_PRIMARY_COMPOUNDS.has(finalCode) || SECONDARY_COMPOUNDS.has(finalCode);
          if (agePolicy.isolationSets && !isCompound) baseSetCount = Math.min(baseSetCount, agePolicy.isolationSets);
          if (agePolicy.heavyCompoundSets && HEAVY_PRIMARY_COMPOUNDS.has(finalCode)) baseSetCount = Math.max(baseSetCount, agePolicy.heavyCompoundSets);
        }
        const setDelta = agePolicy.addSetsInLoadingWeeks === false ? Math.min(0, config.set_delta) : config.set_delta;

        let calculatedSets = Math.max(
          2,
          Math.min(5, baseSetCount + setDelta),
        );

        if (config.phase === MesoCyclePhase.DELOAD) {
          const volMod = typeof config.volume_modifier === 'number' ? config.volume_modifier : (isBeginner ? 0.75 : isIntermediate ? 0.70 : 0.60);
          calculatedSets = Math.max(2, Math.round(baseSetCount * volMod));
        } else if (config.phase === 'CONSOLIDATION') {
          calculatedSets = baseSetCount;
        }

        // Apply muscle bias if specified (+1 set per session on target muscles)
        // A client who never lifted learns the basic movements first: no extra sets for focus muscles.
        if (
          !agePolicy.baseSets &&
          muscleBiasList.length > 0 &&
          v2Exercise &&
          muscleBiasList.some(
            (biasMuscle) =>
              v2Exercise.primary_muscle === biasMuscle ||
              v2Exercise.secondary_muscles.includes(biasMuscle),
          )
        ) {
          calculatedSets = Math.min(5, calculatedSets + 1);
        }

        // P0-A9: elderly / high-BMI intro week is technique-first: at most 2 sets in week 1.
        // Placed after the muscle-bias block so the cap wins over any +1 set.
        if (elderlyHighBmi && config.week_number === 1) calculatedSets = Math.min(calculatedSets, 2);
        // P1-B9: a real intro week (2 sets, technique loads) and a CONSERVATIVE volume
        // start (the V1 2-set promise) both cap week-1 sets at 2, after the bias block
        // so the cap wins over any +1 set.
        if ((introWeekRequired || conservativeVolumeStart) && config.week_number === 1) calculatedSets = Math.min(calculatedSets, 2);

        // Adjust RIR across weeks (Intro RIR 3 -> Loading RIR 2 -> Intensify RIR 1 -> Peak RIR 1 -> Deload RIR 4),
        // never below the proximity-to-failure floor for this lifter and exercise class.
        // P1-B9: RIR 0 is never prescribed (global floor 1); an intro week floors
        // week-1 RIR at 3 (technique-first loads).
        let effectiveRir = Math.max(
          weekTargetRir !== undefined ? weekTargetRir : baseRir,
          resolveRirFloor(finalCode, ex.slot_code, isAdvanced, isIntermediate),
          1,
        );
        if (hasHypertensionOrHeart) {
          effectiveRir = Math.max(effectiveRir, CLINICAL_GUIDELINES.HYPERTENSION.MIN_RIR);
        }
        if (agePolicy.minRir) effectiveRir = Math.max(effectiveRir, agePolicy.minRir);
        if (introWeekRequired && config.week_number === 1) effectiveRir = Math.max(effectiveRir, 3);

        const isFirstExerciseInSession = exIdx === 0;
        const isPrimaryHeavy = isFirstExerciseInSession || HEAVY_PRIMARY_COMPOUNDS.has(finalCode);

        const specificWarmupProtocol = isPrimaryHeavy
          ? Object.freeze({
              title_ar: "مجموعات التسخين النوعية للتمرين الأول (Ramping Warm-Up Sets)",
              description_ar: "مجموعات تسخين متدرجة بأوزان تصاعدية لتجهيز الجهاز العصبي وتحديد المسار الحركي قبل مجموعات العمل الأساسية.",
              sets: Object.freeze([
                {
                  set_number: 1,
                  intensity_percent: "50%",
                  target_reps: 8,
                  rest_seconds: 60,
                  purpose_ar: "ضخ الدم وتحديد المسار الحركي (Groove Patterning)",
                },
                {
                  set_number: 2,
                  intensity_percent: "70%",
                  target_reps: 4,
                  rest_seconds: 90,
                  purpose_ar: "تفعيل التوافق العصبي واستثارة الألياف العضلية (Neural Potentiation)",
                },
                {
                  set_number: 3,
                  intensity_percent: "90%",
                  target_reps: 1,
                  rest_seconds: 120,
                  purpose_ar: "تهيئة الثقل العصبي للوزن الفعلي دون إجهاد عضلي",
                },
              ]),
            })
          : null;

        const names = resolveExerciseNames(finalCode);
        const resolvedNameEn = names.name_en || finalNameEn || (v2Exercise ? v2Exercise.name_en : finalCode);
        const resolvedNameAr = names.name_ar || (v2Exercise ? v2Exercise.name_ar : null);
        const effectiveTempo = ex.tempo || (ex.prescription && ex.prescription.tempo) || "2-0-1-0";

        const isDumbbell = String(finalCode).includes("DUMBBELL") || 
          String(finalCode).includes("DB_") || 
          String(finalCode).startsWith("DB_") ||
          (v2Exercise && (v2Exercise.equipment === "DUMBBELL" || v2Exercise.equipment_code === "DUMBBELL"));

        const microBridge = isDumbbell ? calculateMicroProgressionBridge({
          currentWeightKg: 15,
          targetRepRange: [targetMin, targetMax],
          currentReps: targetMax,
          currentRir: effectiveRir,
          bridgeStrategy: MICRO_PROGRESSION_STRATEGIES.REP_EXTENSION,
        }) : null;

        const dumbbellCueAr = isDumbbell 
          ? `استراتيجية قفزة الدمبل: استهدف الوصول لـ ${targetMax + 3} تكراراً بـ RIR ${effectiveRir} أولاً، أو تحكم بالنزول في 4 ثوانٍ (Tempo 4-1-1-0) لتجاوز قفزة الوزن (${microBridge?.percentage_jump_to_next || 16.7}%) بأمان.`
          : null;

        // P1-B9: a slot upstream marked REVIEW_REQUIRED that the mesocycle filled gets
        // a distinct state — SELECTED plus a refilled marker — instead of carrying the
        // stale REVIEW forward (the old spread kept selection_status REVIEW_REQUIRED on
        // a delivered exercise). The refill is also recorded on the plan flags so the
        // coach sees it at approval time. No downstream gate reads selection_status,
        // so this is honest labeling, not a gate change.
        const refillMarker = ex.selection_status === "REVIEW_REQUIRED" ? {
          selection_status: "SELECTED",
          refilled_from_review: true,
          reason_code: "MESOCYCLE_REFILLED",
          ...(ex.reason_code ? { upstream_reason_code: ex.reason_code } : {}),
          refill_note_ar: "الخانة دي كانت محتاجة مراجعة واتملت تلقائياً ببديل آمن — راجعها قبل الاعتماد.",
        } : {};
        if (refillMarker.refilled_from_review) {
          flagReviewSlot({
            type: "SLOT_REFILLED_FROM_REVIEW",
            week_number: config.week_number,
            session_code: baseSession.session_code,
            slot_code: ex.slot_code,
            refilled_exercise: finalCode,
            note_ar: refillMarker.refill_note_ar,
          });
        }

        return Object.freeze({
          ...ex,
          ...refillMarker,
          exercise_code: finalCode,
          code: finalCode,
          name: resolvedNameAr || resolvedNameEn || finalCode,
          name_en: resolvedNameEn,
          name_ar: resolvedNameAr,
          primary_muscle: v2Exercise ? v2Exercise.primary_muscle : null,
          // P1-B9: progression must know this exercise was clinically substituted, so
          // the next-session suggestion does not auto-increase it like a healthy lift
          // (audit S15). Additive field; consumers ignore unknown fields.
          clinically_substituted: clinicallySubstituted,
          specific_warmup_protocol: specificWarmupProtocol,
          micro_progression_bridge: microBridge ? Object.freeze(microBridge) : null,
          target_sets: calculatedSets,
          sets: calculatedSets,
          target_reps: `${targetMin}-${targetMax}`,
          reps: `${targetMin}-${targetMax}`,
          target_rir: effectiveRir,
          rir: effectiveRir,
          tempo: effectiveTempo,
          rest_seconds: restSeconds,
          rest: restSeconds,
          prescription: Object.freeze({
            sets: calculatedSets,
            target_min: targetMin,
            target_max: targetMax,
            rest_seconds: restSeconds,
            unit: "REPS",
            target_rir: effectiveRir,
            tempo: effectiveTempo,
            clinical_valsalva_cue_ar: hasHypertensionOrHeart ? CLINICAL_GUIDELINES.HYPERTENSION.VALSALVA_SAFETY_CUE_AR : null,
            injury_safety_cues_ar: injuryCues.length > 0 ? Object.freeze(injuryCues) : null,
            dumbbell_progression_cue_ar: dumbbellCueAr,
            micro_progression_bridge: microBridge ? Object.freeze(microBridge) : null,
          }),
        });

      });

      return Object.freeze({
        ...baseSession,
        exercises: Object.freeze(periodizedExercises.filter(Boolean)),
      });
    });

    return Object.freeze({
      week_number: config.week_number,
      phase: config.phase,
      target_rir: weekTargetRir,
      volume_modifier: config.volume_modifier,
      focus_note: hasHypertensionOrHeart && config.target_rir < CLINICAL_GUIDELINES.HYPERTENSION.MIN_RIR
        ? `${config.focus_note} (تم تقييد RIR >= 2 لمرضى الضغط والقلب لحظر الفشل العضلي وحبس النفس)`
        : isBeginner && config.target_rir < BEGINNER_MIN_RIR
          ? `${config.focus_note} (للمبتدئ: RIR لا يقل عن 2 في كل التمارين؛ التقدم هذا الأسبوع بزيادة الوزن أو التكرار مع ثبات الأداء، بدون الوصول للفشل العضلي)`
          : config.focus_note,
      sessions: Object.freeze(periodizedSessions),
    });
  });

  // P0-A11: the final check runs on the FINAL weeks, after every mutation
  // above. The upstream preflight carried in `preflight` was computed before
  // the mesocycle rewrote exercises, so it cannot describe these weeks.
  // A failing plan is flagged here and withheld by the caller (generate
  // handlers save DRAFT on final_preflight REVIEW_REQUIRED); nothing is
  // silently fixed up or dropped at this layer.
  const finalPreflight = evaluateFinalTrainingWeeks(periodizedWeeks, {
    hasLowerBackInjury,
    hasShoulderInjury,
    hasKneeInjury,
    hasElbowInjury,
    hasWristInjury,
    hasHipInjury,
    hasAnkleInjury,
    hasHypertensionOrHeart,
    isHome,
    availableEquipment,
  });
  if (finalPreflight.status === "REVIEW_REQUIRED") {
    for (const violation of finalPreflight.violations) {
      guardReviewFlags.push(Object.freeze({
        type: "FINAL_PREFLIGHT",
        code: violation.code,
        week_number: violation.week_number,
        session_code: violation.session_code,
        exercise_code: violation.exercise_code,
        note_ar: violation.message_ar,
      }));
    }
  }

  return Object.freeze({
    engine_version: TRAINING_ENGINE_V2_VERSION,
    total_weeks: periodizedWeeks.length,
    split_code: basePlan.split_code,
    schedule_mode: basePlan.schedule_mode,
    strategy: VolumeProgressionStrategy.LINEAR_RIR_DROP,
    muscle_bias: muscleBias,
    experience: intakeExperience,
    experience_level: intakeExperience,
    final_preflight: finalPreflight,
    clinical_guardrails: {
      hypertension_guard_active: Boolean(hasHypertensionOrHeart),
      min_rir_enforced: hasHypertensionOrHeart ? CLINICAL_GUIDELINES.HYPERTENSION.MIN_RIR : null,
      valsalva_safety_cue_ar: hasHypertensionOrHeart ? CLINICAL_GUIDELINES.HYPERTENSION.VALSALVA_SAFETY_CUE_AR : null,
      // P0-A9: elderly / high-BMI guard (Q13) and the new joint guards.
      elderly_high_bmi_guard_active: elderlyHighBmi,
      elderly_high_bmi_age: elderlyHighBmi ? clientAge : null,
      elderly_high_bmi_bmi: elderlyHighBmi && clientBmi !== null ? Math.round(clientBmi * 10) / 10 : null,
      unknown_age_or_bmi_flagged: unknownAgeOrBmi,
      joint_guards_active: Object.freeze({
        elbow: hasElbowInjury,
        wrist: hasWristInjury,
        hip: hasHipInjury,
        ankle: hasAnkleInjury,
      }),
    },
    // P0-A9: every held/excluded slot + the elderly/unknown flags, for the coach to review
    // before approving the plan. The approval gate withholds the plan until then.
    coach_review_flags: Object.freeze(guardReviewFlags),
    weeks: Object.freeze(periodizedWeeks),
    preflight_report: preflight,
  });
}

