export const EXERCISE_CATALOG_V2_VERSION = "exercise-catalog-v2";

export const ExercisePrescriptionUnit = Object.freeze({
  REPS: "REPS",
  REPS_PER_SIDE: "REPS_PER_SIDE",
  SECONDS: "SECONDS",
});

export const MovementSlotCodeV2 = Object.freeze({
  // Lower Body Primary
  KNEE_DOMINANT: "KNEE_DOMINANT",
  HIP_HINGE: "HIP_HINGE",
  UNILATERAL_LOWER: "UNILATERAL_LOWER",
  // The hip thrust and the glute bridge sat under HIP_HINGE and lost every time to the Romanian
  // deadlift, so no plan ever trained the glutes directly - not even a woman's.
  HIP_EXTENSION: "HIP_EXTENSION",
  
  // Upper Body Compound
  HORIZONTAL_PUSH: "HORIZONTAL_PUSH",
  INCLINE_PUSH: "INCLINE_PUSH",
  HORIZONTAL_PULL: "HORIZONTAL_PULL",
  VERTICAL_PUSH: "VERTICAL_PUSH",
  VERTICAL_PULL: "VERTICAL_PULL",
  
  // Delts & Upper Back
  SHOULDER_ABDUCTION: "SHOULDER_ABDUCTION",
  REAR_DELT: "REAR_DELT",
  
  // Arms Isolation
  ELBOW_FLEXION: "ELBOW_FLEXION",
  ELBOW_EXTENSION: "ELBOW_EXTENSION",
  
  // Lower Body Isolation
  KNEE_FLEXION: "KNEE_FLEXION",
  KNEE_EXTENSION: "KNEE_EXTENSION",
  CALF_RAISE: "CALF_RAISE",
  
  // Chest Isolation
  CHEST_FLY: "CHEST_FLY",
  
  // Core & Trunk
  CORE_STABILITY: "CORE_STABILITY",
  CORE_FLEXION_ROTATION: "CORE_FLEXION_ROTATION",
});

export const MuscleGroup = Object.freeze({
  CHEST: "CHEST",
  UPPER_CHEST: "UPPER_CHEST",
  LATS: "LATS",
  UPPER_BACK: "UPPER_BACK",
  FRONT_DELTS: "FRONT_DELTS",
  SIDE_DELTS: "SIDE_DELTS",
  REAR_DELTS: "REAR_DELTS",
  BICEPS: "BICEPS",
  TRICEPS: "TRICEPS",
  FOREARMS: "FOREARMS",
  QUADS: "QUADS",
  HAMSTRINGS: "HAMSTRINGS",
  GLUTES: "GLUTES",
  CALVES: "CALVES",
  ABS: "ABS",
  OBLIQUES: "OBLIQUES",
  LOWER_BACK: "LOWER_BACK",
});
