/**
 * @typedef {Object} EquipmentRequirement
 * @property {string} equipment_code
 * @property {string} minimum_load_capacity
 */

/**
 * @typedef {Object} ExerciseRecordV2
 * @property {string} exercise_code
 * @property {string} name_en
 * @property {string} name_ar
 * @property {string} slot_code
 * @property {string} primary_muscle
 * @property {string[]} secondary_muscles
 * @property {EquipmentRequirement[]} equipment_requirements
 * @property {string[]} allowed_locations
 * @property {boolean} beginner_friendly
 * @property {boolean} compound
 * @property {string} prescription_unit
 */

/**
 * @typedef {Object} ExerciseCatalogV2
 * @property {string} catalog_version
 * @property {ExerciseRecordV2[]} exercises
 */
