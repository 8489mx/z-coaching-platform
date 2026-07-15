/** @typedef {"KNEE_DOMINANT"|"HIP_HINGE"|"UNILATERAL_LOWER"|"KNEE_FLEXION"|"CALF_RAISE"|"HORIZONTAL_PUSH"|"HORIZONTAL_PULL"|"VERTICAL_PUSH"|"VERTICAL_PULL"|"SHOULDER_ABDUCTION"|"REAR_DELT"|"ELBOW_FLEXION"|"ELBOW_EXTENSION"|"CORE_STABILITY"} MovementSlotCodeValue */
/** @typedef {"BODYWEIGHT"|"DUMBBELLS"|"BARBELL_AND_PLATES"|"ADJUSTABLE_BENCH"|"FLAT_BENCH"|"RESISTANCE_BANDS"|"PULL_UP_BAR"|"SQUAT_RACK"|"SMITH_MACHINE"|"CABLE_STATION"|"SELECTORIZED_MACHINES"|"KETTLEBELLS"} EquipmentCodeValue */
/** @typedef {"BODYWEIGHT_ONLY"|"LIGHT"|"MODERATE"|"HEAVY"} CatalogLoadCapacityValue */
/** @typedef {"HOME"|"GYM"|"OUTDOORS"|"MIXED"} TrainingLocationValue */
/** @typedef {"REPS"|"REPS_PER_SIDE"|"SECONDS"} ExercisePrescriptionUnitValue */

/**
 * @typedef {Object} ExerciseEquipmentRequirement
 * @property {EquipmentCodeValue} equipment_code
 * @property {CatalogLoadCapacityValue} minimum_load_capacity
 */

/**
 * @typedef {Object} ExerciseRecord
 * @property {string} exercise_code
 * @property {string} name_en
 * @property {MovementSlotCodeValue} slot_code
 * @property {ExerciseEquipmentRequirement[]} equipment_requirements
 * @property {TrainingLocationValue[]} allowed_locations
 * @property {boolean} beginner_friendly
 * @property {ExercisePrescriptionUnitValue} prescription_unit
 */

/**
 * @typedef {Object} ExerciseCatalog
 * @property {"exercise-catalog-v1"} catalog_version
 * @property {ExerciseRecord[]} exercises
 */

export {};
