/**
 * @typedef {Object} AdaptationReason
 * @property {string} code
 * @property {string} message_ar
 * @property {string} message_en
 */

/**
 * @typedef {Object} AdaptedNutritionTargets
 * @property {number} target_calories_kcal
 * @property {number} protein_g
 * @property {number} carbohydrate_g
 * @property {number} fat_g
 * @property {number} fiber_g
 * @property {Object|null} refeed_config
 */

/**
 * @typedef {Object} AdaptedMasterProgram
 * @property {string} engine_version
 * @property {string} source_program_version
 * @property {number} adapted_week_number
 * @property {string} adaptation_action
 * @property {AdaptationReason[]} adaptation_reasons
 * @property {AdaptedNutritionTargets} adapted_nutrition
 * @property {Object} adapted_training_week
 * @property {Object} adapted_cardio
 * @property {boolean} requires_coach_approval
 */
