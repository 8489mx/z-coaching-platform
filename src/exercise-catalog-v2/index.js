export {
  EXERCISE_CATALOG_V2_VERSION,
  ExercisePrescriptionUnit,
  MovementSlotCodeV2,
  MuscleGroup,
} from "./domain/enums.js";

export {
  EXERCISE_CATALOG_V2,
  getExerciseV2ByCode,
} from "./exercise-catalog-v2.js";

// P2-C6 (2026-11-04) — V2 CATALOG PURPOSE DECISION: ACCEPT THE EFFECTIVE SET.
// Generation is NOT wired to V2 as its prescription source, and this stays that
// way: wiring it would change which exercises clients receive (new prescription
// logic with injury-guard, equipment, and progression implications), which is
// scope expansion inside a simplification phase, not simplification. The dead
// list accessors (listExercisesV2ForSlot, listExercisesV2ForMuscle) were deleted
// in P2-C5 and have zero references anywhere in the repo (verified 2026-11-04).
//
// EFFECTIVE PRESCRIBED SET — measured 2026-11-04 by running buildTrainingMesoCycle
// across 16 profiles (gym/home, beginner/intermediate/advanced, 2/3/4/5/6 days,
// elderly 65+/BMI 35+, shoulder/knee/lower-back/elbow injuries, QUADS/BICEPS bias,
// home dumbbells-only): 45 distinct exercise codes. A future decision starts here;
// this list is a measured baseline, NOT a closed allowlist (see the pool caveat).
//
// 30 V2 records prescribed directly:
//   BARBELL_BACK_SQUAT, BARBELL_BENT_OVER_ROW, BARBELL_HIP_THRUST,
//   BENCH_DIPS_BODYWEIGHT, BODYWEIGHT_GLUTE_BRIDGE, BODYWEIGHT_SPLIT_SQUAT,
//   BULGARIAN_SPLIT_SQUAT, CABLE_LATERAL_RAISE, CHEST_SUPPORTED_T_BAR_ROW,
//   DEAD_BUG, DUMBBELL_FLOOR_PRESS, DUMBBELL_LATERAL_RAISE,
//   DUMBBELL_OVERHEAD_TRICEPS_EXTENSION, DUMBBELL_ROMANIAN_DEADLIFT,
//   GLUTE_BIASED_45_HYPEREXTENSION, GOBLET_SQUAT, INCLINE_DUMBBELL_BENCH_PRESS,
//   INCLINE_DUMBBELL_CURL, LEG_PRESS_MACHINE, LYING_LEG_CURL_MACHINE,
//   MACHINE_CHEST_PRESS, MACHINE_LATERAL_RAISE, MACHINE_SHOULDER_PRESS,
//   NORDIC_HAMSTRING_CURL, ONE_ARM_DUMBBELL_ROW,
//   OVERHEAD_CABLE_TRICEPS_EXTENSION, PREACHER_CURL_MACHINE,
//   ROTATOR_CUFF_EXTERNAL_ROTATION, SEATED_CABLE_ROW,
//   SEATED_DUMBBELL_SHOULDER_PRESS.
//
// 6 V2 aliases prescribed (they resolve to 3 further V2 records, never prescribed
// directly: PUSH_UPS_STANDARD, BODYWEIGHT_STANDING_CALF_RAISE,
// DEFICIT_REVERSE_LUNGE):
//   HIP_THRUST, DUMBBELL_BICEPS_CURL, CLOSE_GRIP_PUSH_UP, DUMBBELL_CALF_RAISE,
//   DUMBBELL_REVERSE_LUNGE, PUSH_UP.
//
// 9 V1 passthrough codes prescribed with NO V2 record and no alias (audit C14
// precedent; the mesocycle infers their equipment from the code name itself):
//   BARBELL_BENCH_PRESS, BARBELL_OVERHEAD_PRESS, CHEST_SUPPORTED_ROW,
//   GLUTE_BRIDGE, LAT_PULLDOWN, SEATED_LEG_CURL, STANDING_CALF_RAISE,
//   DUMBBELL_GLUTE_BRIDGE, STANDING_DUMBBELL_SHOULDER_PRESS.
//
// SLOTS WITH ZERO V2-RECORD PRESCRIPTIONS: CHEST_FLY, CORE_FLEXION_ROTATION and
// KNEE_EXTENSION are used by no template at all; VERTICAL_PULL is filled only by
// the V1 passthrough LAT_PULLDOWN. No template slot went unfilled (held) in any
// tested profile — these are unused-by-design slots, not gaps, and C6 invents no
// fill for them. (INCLINE_PUSH does prescribe: INCLINE_DUMBBELL_BENCH_PRESS.)
//
// POOL CAVEAT: the home equipment-fallback pool (equipmentSafeAlternative) and
// the exercise-swap pool (getSmartExerciseSwaps) both draw from all 92 V2 records,
// so other V2 records remain reachable as fallbacks/swaps even though they are not
// in the prescribed set above. 58 of 92 V2 records were never prescribed in the
// 16 measured profiles. The catalog itself stays: it is live for enrichment,
// equipment checks, fallbacks, swaps, and display names — only its role as "the
// prescription source" is what this decision declines to wire.

export {
  MASTER_EXERCISE_DICTIONARY,
  resolveExerciseNames,
} from "./master-exercise-translations.js";
