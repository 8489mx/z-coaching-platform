import { buildTrainingEngine } from "../training-engine/index.js";
import { getExerciseV2ByCode } from "../exercise-catalog-v2/index.js";
import { resolveExerciseNames } from "../exercise-catalog-v2/master-exercise-translations.js";
import {
  TRAINING_ENGINE_V2_VERSION,
  MesoCyclePhase,
  VolumeProgressionStrategy,
} from "./domain/enums.js";

const DEFAULT_MESOCYCLE_CONFIG = Object.freeze([
  {
    week_number: 1,
    phase: MesoCyclePhase.INTRO_ACCUMULATION,
    target_rir: 3,
    volume_modifier: 0.85,
    set_delta: 0,
    focus_note: "أسبوع التعود والتركيز على التكنيك الصحيح وتحديد الأوزان الابتدائية (RIR 3).",
  },
  {
    week_number: 2,
    phase: MesoCyclePhase.PROGRESSIVE_OVERLOAD,
    target_rir: 2,
    volume_modifier: 1.0,
    set_delta: 0,
    focus_note: "بدء التدرج في الأحمال وزيادة الوزن مع الحفاظ على تكرارين في الاحتياط (RIR 2).",
  },
  {
    week_number: 3,
    phase: MesoCyclePhase.PROGRESSIVE_OVERLOAD,
    target_rir: 1,
    volume_modifier: 1.15,
    set_delta: 1,
    focus_note: "زيادة الحجم التدريبي بمجموعة إضافية على الحركات الأساسية ورفع الشدة (RIR 1-2).",
  },
  {
    week_number: 4,
    phase: MesoCyclePhase.PEAK_OVERLOAD,
    target_rir: 0,
    volume_modifier: 1.25,
    set_delta: 1,
    focus_note: "أسبوع ذروة الحجم والأوزان (Peak Overload) والوصول لأقصى جهد تدريبي آمن (RIR 0-1).",
  },
  {
    week_number: 5,
    phase: MesoCyclePhase.DELOAD,
    target_rir: 4,
    volume_modifier: 0.5,
    set_delta: -1,
    focus_note: "أسبوع تفريغ الأحمال (Deload): خفض الحجم التدريبي 50% لشفاء المفاصل والجهاز العصبي.",
  },
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
  const baseTrainingOutput = buildTrainingEngine(intakeDecision);
  const basePlan = baseTrainingOutput.weekly_training_plan;
  const preflight = baseTrainingOutput.preflight_report;

  if (basePlan.status === "WITHHELD") {
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

  // Map fallback exercises to primary gym compounds when equipment allows
  const GYM_COMPOUND_UPGRADES = Object.freeze({
    DUMBBELL_FLOOR_PRESS: "BARBELL_BENCH_PRESS",
    GOBLET_SQUAT: "BARBELL_BACK_SQUAT",
    ONE_ARM_DUMBBELL_ROW: "BARBELL_BENT_OVER_ROW",
    STANDING_DUMBBELL_SHOULDER_PRESS: "BARBELL_OVERHEAD_PRESS",
  });

  // 2. Generate Periodized Weeks
  const weekConfigs = DEFAULT_MESOCYCLE_CONFIG.slice(0, Math.min(weeksCount, DEFAULT_MESOCYCLE_CONFIG.length));

  const periodizedWeeks = weekConfigs.map((config) => {
    const periodizedSessions = basePlan.sessions.map((baseSession) => {
      const periodizedExercises = baseSession.exercises.map((ex) => {
        let finalCode = ex.exercise_code;
        let finalNameEn = ex.name_en;

        if (GYM_COMPOUND_UPGRADES[finalCode]) {
          finalCode = GYM_COMPOUND_UPGRADES[finalCode];
          const upgradedV2 = getExerciseV2ByCode(finalCode);
          if (upgradedV2) {
            finalNameEn = upgradedV2.name_en;
          }
        }

        const v2Exercise = getExerciseV2ByCode(finalCode);
        
        let calculatedSets = Math.max(
          2,
          Math.min(5, (ex.prescription.sets || 3) + config.set_delta),
        );

        if (config.phase === MesoCyclePhase.DELOAD) {
          calculatedSets = 2; // Fixed 2 sets for deload
        }

        // Apply muscle bias if specified
        if (muscleBias && v2Exercise && (v2Exercise.primary_muscle === muscleBias || v2Exercise.secondary_muscles.includes(muscleBias))) {
          calculatedSets = Math.min(5, calculatedSets + 1);
        }

        const names = resolveExerciseNames(finalCode);
        const resolvedNameEn = names.name_en || finalNameEn;
        const resolvedNameAr = names.name_ar || (v2Exercise ? v2Exercise.name_ar : null);

        return Object.freeze({
          ...ex,
          exercise_code: finalCode,
          name_en: resolvedNameEn,
          name_ar: resolvedNameAr,
          primary_muscle: v2Exercise ? v2Exercise.primary_muscle : null,
          prescription: Object.freeze({
            ...ex.prescription,
            sets: calculatedSets,
            target_rir: config.target_rir,
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
      target_rir: config.target_rir,
      volume_modifier: config.volume_modifier,
      focus_note: config.focus_note,
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
    weeks: Object.freeze(periodizedWeeks),
    preflight_report: preflight,
  });
}
