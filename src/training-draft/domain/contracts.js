export const TRAINING_DRAFT_VERSION = "training-draft-v1";

/**
 * @typedef {Object} PipelineVersions
 * @property {string} plan_spec
 * @property {string} session_blueprint
 * @property {string} exercise_selection
 * @property {string} training_prescription
 */

/**
 * @typedef {Object} TrainingDraft
 * @property {string} draft_version
 * @property {PipelineVersions} pipeline_versions
 * @property {string} prescription_version
 * @property {string} status
 * @property {number} recommended_days
 * @property {string|null} split_code
 * @property {string} schedule_mode
 * @property {boolean} intro_week_required
 * @property {string} volume_start
 * @property {Array<Object>} sessions
 * @property {Array<Object>} constraints
 * @property {Array<Object>} reasons
 */
