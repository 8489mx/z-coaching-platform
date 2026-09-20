/**
 * @typedef {Object} MesoCycleWeek
 * @property {number} week_number
 * @property {string} phase
 * @property {number} target_rir
 * @property {number} volume_modifier
 * @property {string} focus_note
 * @property {import("../weekly-training-schedule/domain/contracts.js").WeeklyTrainingSession[]} sessions
 */

/**
 * @typedef {Object} MesoCycleProgram
 * @property {string} engine_version
 * @property {number} total_weeks
 * @property {string} split_code
 * @property {string} schedule_mode
 * @property {string} strategy
 * @property {string|string[]|null} muscle_bias
 * @property {MesoCycleWeek[]} weeks
 * @property {Object} preflight_report
 */
