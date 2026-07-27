/**
 * @typedef {import("../../cardio-plan-specification/domain/contracts.js").CardioPlanSpecification} CardioPlanSpecification
 */

/**
 * @typedef {Object} CardioModalityRequirement
 * @property {"LISS"|"STEPS"} modality_type
 * @property {"LOW"|"MODERATE"} allowed_intensity
 * @property {number} max_duration_minutes
 */

/**
 * @typedef {Object} CardioModalityRequirements
 * @property {"cardio-modality-requirements-v1"} cardio_modality_requirements_version
 * @property {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} status
 * @property {CardioModalityRequirement[]} requirements
 * @property {import("../../cardio-plan-specification/domain/contracts.js").CardioConstraint[]} constraints
 * @property {import("../../cardio-plan-specification/domain/contracts.js").CardioReason[]} reasons
 */

export {};
