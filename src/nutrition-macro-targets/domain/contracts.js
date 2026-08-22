export const NUTRITION_MACRO_TARGETS_VERSION =
  "nutrition-macro-targets-v1";

/** @typedef {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} NutritionMacroTargetsStatusValue */
/** @typedef {"Z_COACHING_MACRO_POLICY_V1"} NutritionMacroCalculationPolicyValue */
/** @typedef {"ACTUAL_WEIGHT"|"BMI_30_CAPPED_WEIGHT"} ProteinReferenceWeightBasisValue */

/**
 * @typedef {Object} ProteinMacroTarget
 * @property {number} target_g
 * @property {number} factor_g_per_kg
 * @property {number} reference_weight_kg
 * @property {ProteinReferenceWeightBasisValue} reference_weight_basis
 * @property {number} energy_cap_g
 * @property {boolean} capped_by_energy_budget
 * @property {number} calories
 * @property {number} percent_of_calories
 */

/**
 * @typedef {Object} FatMacroTarget
 * @property {number} target_g
 * @property {number} calories
 * @property {number} percent_of_calories
 */

/**
 * @typedef {Object} CarbohydrateMacroTarget
 * @property {number} target_g
 * @property {number} calories
 * @property {number} percent_of_calories
 */

/**
 * @typedef {Object} NutritionMacroTargetReason
 * @property {string} code
 * @property {string} message
 */

/**
 * @typedef {Object} NutritionMacroTargets
 * @property {"nutrition-macro-targets-v1"} macro_targets_version
 * @property {"nutrition-planning-snapshot-v1"} source_snapshot_version
 * @property {"nutrition-energy-target-v1"} source_energy_target_version
 * @property {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} source_energy_status
 * @property {NutritionMacroTargetsStatusValue} status
 * @property {NutritionMacroCalculationPolicyValue} calculation_policy
 * @property {number|null} target_calories
 * @property {ProteinMacroTarget|null} protein
 * @property {FatMacroTarget|null} fat
 * @property {CarbohydrateMacroTarget|null} carbohydrate
 * @property {number|null} fiber_target_g
 * @property {number|null} macro_calories_total
 * @property {number|null} calorie_difference
 * @property {Object[]} constraints
 * @property {NutritionMacroTargetReason[]} reasons
 */

export {};
