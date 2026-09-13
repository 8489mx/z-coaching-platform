import { buildTrainingEngine } from "../training-engine/index.js";
import { getExerciseV2ByCode } from "../exercise-catalog-v2/index.js";
import { resolveExerciseNames } from "../exercise-catalog-v2/master-exercise-translations.js";
import {
  TRAINING_ENGINE_V2_VERSION,
  MesoCyclePhase,
  VolumeProgressionStrategy,
} from "./domain/enums.js";
import { CLINICAL_GUIDELINES } from "../config/clinical-guidelines.js";

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
]);

const SECONDARY_COMPOUNDS = new Set([
  "LAT_PULLDOWN",
  "SEATED_CABLE_ROW",
  "CHEST_SUPPORTED_ROW",
  "ONE_ARM_DUMBBELL_ROW",
  "STANDING_DUMBBELL_SHOULDER_PRESS",
  "DUMBBELL_BENCH_PRESS",
  "BULGARIAN_SPLIT_SQUAT",
  "DUMBBELL_REVERSE_LUNGE",
  "HACK_SQUAT_MACHINE",
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

/**
 * Builds a multi-week periodized meso-cycle from an Intake Decision.
 *
 * @param {import("../intake-decision-engine/domain/contracts.js").IntakeDecision} intakeDecision
 * @param {Object} [options]
 * @param {number} [options.weeksCount=5]
 * @param {string|null} [options.muscleBias=null]
 * @returns {import("./domain/contracts.js").MesoCycleProgram}
 */
export function buildTrainingMesoCycle(intakeDecision, options = {}) {
  const { weeksCount = 5, muscleBias = null } = options;

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
    "BEGINNER";
  const isAdvanced = intakeExperience === "ADVANCED";
  const isIntermediate = intakeExperience === "INTERMEDIATE";

  const rawIntake = options.rawIntake || {};
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
  const weekConfigs = DEFAULT_MESOCYCLE_CONFIG.slice(0, Math.min(weeksCount, DEFAULT_MESOCYCLE_CONFIG.length));

  const periodizedWeeks = weekConfigs.map((config) => {
    const weekTargetRir = hasHypertensionOrHeart
      ? Math.max(config.target_rir, CLINICAL_GUIDELINES.HYPERTENSION.MIN_RIR)
      : config.target_rir;
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
            { slot_code: "HORIZONTAL_PULL", exercise_code: isHome ? "ONE_ARM_DUMBBELL_ROW" : "SEATED_CABLE_ROW", custom_rest: 90, target_min: 10, target_max: 12, base_rir: 1 },
            { slot_code: "KNEE_FLEXION", exercise_code: isHome ? "GLUTE_BRIDGE" : "LYING_LEG_CURL_MACHINE", custom_rest: 90, target_min: 10, target_max: 12, base_rir: 1 },
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

        if (isHome && HOME_EQUIPMENT_REPLACEMENTS[finalCode]) {
          finalCode = HOME_EQUIPMENT_REPLACEMENTS[finalCode];
        }

        // Active injury overrides for safety
        if (hasKneeInjury && (finalCode === "BARBELL_BACK_SQUAT" || finalCode === "BULGARIAN_SPLIT_SQUAT" || finalCode === "LEG_PRESS_MACHINE" || finalCode === "HACK_SQUAT_MACHINE")) {
          finalCode = "GOBLET_SQUAT";
        }
        if (
          hasShoulderInjury &&
          (finalCode === "BARBELL_OVERHEAD_PRESS" ||
            finalCode === "STANDING_DUMBBELL_SHOULDER_PRESS" ||
            finalCode === "ARNOLD_DUMBBELL_PRESS" ||
            finalCode === "INCLINE_DUMBBELL_BENCH_PRESS" ||
            finalCode === "DUMBBELL_PULLOVER" ||
            finalCode === "DECLINE_DUMBBELL_BENCH_PRESS")
        ) {
          finalCode = "DUMBBELL_LATERAL_RAISE";
        }
        if (hasLowerBackInjury && (finalCode === "BARBELL_BENT_OVER_ROW" || finalCode === "BARBELL_DEADLIFT" || finalCode === "BARBELL_BACK_SQUAT")) {
          finalCode = isHome ? "ONE_ARM_DUMBBELL_ROW" : "CHEST_SUPPORTED_ROW";
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

        const v2Exercise = getExerciseV2ByCode(finalCode);

        // Calculate Evidence-Based Reps, Sets, Rest Intervals, and RIR
        let targetMin = ex.target_min || (isAdvanced ? 6 : isIntermediate ? 8 : 8);
        let targetMax = ex.target_max || (isAdvanced ? 8 : isIntermediate ? 10 : 10);
        let restSeconds = ex.custom_rest || 90;
        let baseSetCount = ex.sets_override || 3;
        let baseRir = ex.base_rir !== undefined ? ex.base_rir : (isAdvanced ? 2 : isIntermediate ? 2 : 3);

        // Beginners use higher rep floor for form mastery & safety
        if (!isAdvanced && !isIntermediate && targetMin === 6) {
          targetMin = 8;
          targetMax = 10;
          baseRir = 3;
        }

        if (!ex.target_min) {
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

        let calculatedSets = Math.max(
          2,
          Math.min(5, baseSetCount + config.set_delta),
        );

        if (config.phase === MesoCyclePhase.DELOAD) {
          // Exact 40% volume reduction for deload week
          calculatedSets = Math.max(2, Math.round(baseSetCount * 0.60));
        }

        // Apply muscle bias if specified (+1 set per session on target muscles)
        if (
          muscleBias &&
          v2Exercise &&
          (v2Exercise.primary_muscle === muscleBias ||
            v2Exercise.secondary_muscles.includes(muscleBias))
        ) {
          calculatedSets = Math.min(5, calculatedSets + 1);
        }

        // Adjust RIR across weeks (Intro RIR 3 -> Loading RIR 2 -> Intensify RIR 1 -> Peak RIR 0 -> Deload RIR 4)
        let effectiveRir = weekTargetRir !== undefined ? weekTargetRir : baseRir;
        if (hasHypertensionOrHeart) {
          effectiveRir = Math.max(effectiveRir, CLINICAL_GUIDELINES.HYPERTENSION.MIN_RIR);
        }

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

        return Object.freeze({
          ...ex,
          exercise_code: finalCode,
          code: finalCode,
          name: resolvedNameAr || resolvedNameEn || finalCode,
          name_en: resolvedNameEn,
          name_ar: resolvedNameAr,
          primary_muscle: v2Exercise ? v2Exercise.primary_muscle : null,
          specific_warmup_protocol: specificWarmupProtocol,
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
          }),
        });

      });

      return Object.freeze({
        ...baseSession,
        exercises: Object.freeze(periodizedExercises),
      });
    });

    return Object.freeze({
      week_number: config.week_number,
      phase: config.phase,
      target_rir: weekTargetRir,
      volume_modifier: config.volume_modifier,
      focus_note: hasHypertensionOrHeart && config.target_rir < CLINICAL_GUIDELINES.HYPERTENSION.MIN_RIR
        ? `${config.focus_note} (تم تقييد RIR >= 2 لمرضى الضغط والقلب لحظر الفشل العضلي وحبس النفس)`
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
    clinical_guardrails: {
      hypertension_guard_active: Boolean(hasHypertensionOrHeart),
      min_rir_enforced: hasHypertensionOrHeart ? CLINICAL_GUIDELINES.HYPERTENSION.MIN_RIR : null,
      valsalva_safety_cue_ar: hasHypertensionOrHeart ? CLINICAL_GUIDELINES.HYPERTENSION.VALSALVA_SAFETY_CUE_AR : null,
    },
    weeks: Object.freeze(periodizedWeeks),
    preflight_report: preflight,
  });
}

