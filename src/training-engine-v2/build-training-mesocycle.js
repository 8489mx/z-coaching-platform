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
    return customWeeksConfig.slice(0, weeksCount);
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
      let w4Rir = targetRirWeek4 !== null ? Number(targetRirWeek4) : null;
      if (w4Rir === null) {
        if (isBeginner) {
          w4Rir = 2;
        } else if (isIntermediate) {
          w4Rir = 1;
        } else {
          // Advanced lifter: default RIR 1; if fatigued or poor recovery, RIR 2; never forced RIR 0
          const fatigued = (fatigueScore !== null && Number(fatigueScore) >= 6) ||
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
      } else if (dataQuality === 'INSUFFICIENT') {
        shouldDeload = false;
      } else if (Number(fatigueScore) >= 7 || performanceTrend === 'DROPPING') {
        shouldDeload = true;
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

  return configs;
}

const DEFAULT_MESOCYCLE_CONFIG = Object.freeze([
  {
    week_number: 1,
    phase: MesoCyclePhase.INTRO_ACCUMULATION,
    phase_ar: "الأسبوع 1 (تأسيس وتكيف حركي)",
    target_rir: 3,
    volume_modifier: 1.0,
    set_delta: 0,
    focus_note: "الأسبوع 1 (تأسيس): RIR 3 — التعود على النمط الحركي وضبط الأوزان الابتدائية.",
  },
  {
    week_number: 2,
    phase: MesoCyclePhase.PROGRESSIVE_OVERLOAD,
    phase_ar: "الأسبوع 2 (تحميل وزيادة الحمل التدريجي)",
    target_rir: 2,
    volume_modifier: 1.0,
    set_delta: 0,
    focus_note: "الأسبوع 2 (تحميل): RIR 2 — زيادة الحمل التدريجي مع الحفاظ على تكرارين في الاحتياط.",
  },
  {
    week_number: 3,
    phase: MesoCyclePhase.PROGRESSIVE_OVERLOAD,
    phase_ar: "الأسبوع 3 (تكثيف الجهد العضلي)",
    target_rir: 1,
    volume_modifier: 1.15,
    set_delta: 1,
    focus_note: "الأسبوع 3 (تكثيف): RIR 1 — رفع الشدة والاقتراب من الفشل العضلي مع إضافة مجموعة للحركات الأساسية.",
  },
  {
    week_number: 4,
    phase: MesoCyclePhase.PEAK_OVERLOAD,
    phase_ar: "الأسبوع 4 (القمة والأوفرلود الأقصى)",
    target_rir: 0,
    volume_modifier: 1.25,
    set_delta: 1,
    focus_note: "الأسبوع 4 (القمة والأوفرلود الأقصى): RIR 0-1 — الوصول لأقصى أداء وتحدي عضلي كامل.",
  },
  {
    week_number: 5,
    phase: MesoCyclePhase.DELOAD,
    phase_ar: "الأسبوع 5 (تفريغ أحمال تلقائي - Deload)",
    target_rir: 4,
    volume_modifier: 0.60,
    set_delta: -1,
    focus_note: "الأسبوع 5 (تفريغ أحمال - Deload): خفض عدد المجموعات بنسبة 40% وضبط RIR 3-4 لتجديد الجهاز العصبي والمفاصل.",
  },
]);


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
const AXIAL_SQUATS = new Set(["BARBELL_BACK_SQUAT", "BARBELL_FRONT_SQUAT", "SMITH_MACHINE_SQUAT"]);
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
  SHOULDER: "حماية الكتف: تم حذف الضغط فوق الرأس والنزول العميق في تمارين الصدر؛ استخدم قبضة محايدة، وارفع الذراع في مستوى لوح الكتف (30 درجة أمام الجسم) بدون تجاوز مستوى الكتف.",
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
  const intakeExperience =
    options.experience ||
    (options.rawIntake && options.rawIntake.training && options.rawIntake.training.experience) ||
    intakeDecision.profile?.experience ||
    (intakeDecision.training_decision?.intro_week_required === false && intakeDecision.training_decision?.volume_start === "NORMAL" ? "INTERMEDIATE" : "BEGINNER");
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

  const periodizedWeeks = weekConfigs.map((config) => {
    const isBeginner = !isAdvanced && !isIntermediate;
    const weekTargetRir = Math.max(
      config.target_rir,
      hasHypertensionOrHeart ? CLINICAL_GUIDELINES.HYPERTENSION.MIN_RIR : 0,
      isBeginner ? BEGINNER_MIN_RIR : 0,
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
            { slot_code: "SHOULDER_ABDUCTION", exercise_code: "DUMBBELL_LATERAL_RAISE", custom_rest: 60, target_min: 12, target_max: 15, base_rir: isAdvanced ? 0 : 1, sets_override: isAdvanced ? 4 : 3 },
          ];

          if (isAdvanced) {
            sessionExerciseTemplates.push(
              { slot_code: "POSTERIOR_DELTOID", exercise_code: isHome ? "DUMBBELL_LATERAL_RAISE" : "FACE_PULL", custom_rest: 60, target_min: 12, target_max: 15, base_rir: 1, sets_override: 3 },
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
          if (AXIAL_SQUATS.has(finalCode) || finalCode === "HACK_SQUAT_MACHINE") {
            finalCode = isHome ? "GOBLET_SQUAT" : "LEG_PRESS_MACHINE";
          } else if (LUNGE_PATTERNS.has(finalCode)) {
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
          }
          if (finalCode !== beforeShoulder) injuryCues.push(INJURY_CUES_AR.SHOULDER);
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
        finalCode = fitHomeEquipment(finalCode);
        if (!finalCode) return null;

        // Never repeat an exercise inside one session after substitutions.
        if (usedSessionCodes.has(finalCode)) {
          const alternative = DUPLICATE_ALTERNATIVES[finalCode];
          if (!alternative || usedSessionCodes.has(alternative)) return null;
          finalCode = fitHomeEquipment(alternative);
          if (!finalCode || usedSessionCodes.has(finalCode)) return null;
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

        // Adjust RIR across weeks (Intro RIR 3 -> Loading RIR 2 -> Intensify RIR 1 -> Peak RIR 0 -> Deload RIR 4),
        // never below the proximity-to-failure floor for this lifter and exercise class.
        let effectiveRir = Math.max(
          weekTargetRir !== undefined ? weekTargetRir : baseRir,
          resolveRirFloor(finalCode, ex.slot_code, isAdvanced, isIntermediate),
        );
        if (hasHypertensionOrHeart) {
          effectiveRir = Math.max(effectiveRir, CLINICAL_GUIDELINES.HYPERTENSION.MIN_RIR);
        }
        if (agePolicy.minRir) effectiveRir = Math.max(effectiveRir, agePolicy.minRir);

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

        return Object.freeze({
          ...ex,
          exercise_code: finalCode,
          code: finalCode,
          name: resolvedNameAr || resolvedNameEn || finalCode,
          name_en: resolvedNameEn,
          name_ar: resolvedNameAr,
          primary_muscle: v2Exercise ? v2Exercise.primary_muscle : null,
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

  return Object.freeze({
    engine_version: TRAINING_ENGINE_V2_VERSION,
    total_weeks: periodizedWeeks.length,
    split_code: basePlan.split_code,
    schedule_mode: basePlan.schedule_mode,
    strategy: VolumeProgressionStrategy.LINEAR_RIR_DROP,
    muscle_bias: muscleBias,
    experience: intakeExperience,
    experience_level: intakeExperience,
    clinical_guardrails: {
      hypertension_guard_active: Boolean(hasHypertensionOrHeart),
      min_rir_enforced: hasHypertensionOrHeart ? CLINICAL_GUIDELINES.HYPERTENSION.MIN_RIR : null,
      valsalva_safety_cue_ar: hasHypertensionOrHeart ? CLINICAL_GUIDELINES.HYPERTENSION.VALSALVA_SAFETY_CUE_AR : null,
    },
    weeks: Object.freeze(periodizedWeeks),
    preflight_report: preflight,
  });
}

