export const WEEKLY_TRAINING_SCHEDULE_VERSION = "weekly-training-schedule-v1";

/** @typedef {"NONE"|"LOW"|"MODERATE"|"HIGH"} WeeklySportLoadValue */
/** @typedef {"SESSION_SEQUENCE_REQUIRED"|"SELECTED_FIXED_TRAINING_DAY"|"SELECTED_AROUND_ADDITIONAL_SPORT"|"HIGH_SPORT_DAY_REQUIRES_REVIEW"} ScheduleReasonCodeValue */
/** @typedef {"MONDAY"|"TUESDAY"|"WEDNESDAY"|"THURSDAY"|"FRIDAY"|"SATURDAY"|"SUNDAY"} DayOfWeekValue */

/**
 * @typedef {Object} TrainingDraftSession
 * @property {number} sequence
 * @property {string} session_code
 * @property {string} focus
 * @property {Array<Object>} exercises
 */

/**
 * @typedef {Object} TrainingDraftInput
 * @property {"training-draft-v1"} draft_version
 * @property {Object} pipeline_versions
 * @property {"training-prescription-v1"} prescription_version
 * @property {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} status
 * @property {number} recommended_days
 * @property {string|null} split_code
 * @property {"FIXED_DAYS"|"SESSION_SEQUENCE"} schedule_mode
 * @property {boolean} intro_week_required
 * @property {"CONSERVATIVE"|"NORMAL"} volume_start
 * @property {TrainingDraftSession[]} sessions
 * @property {Array<Object>} constraints
 * @property {Array<Object>} reasons
 */

/**
 * @typedef {TrainingDraftSession & {
 *   scheduled_day: DayOfWeekValue|null,
 *   sport_load: WeeklySportLoadValue,
 *   schedule_reason_code: ScheduleReasonCodeValue
 * }} ScheduledTrainingSession
 */

/**
 * @typedef {Object} WeeklyTrainingSchedule
 * @property {"weekly-training-schedule-v1"} schedule_version
 * @property {"training-draft-v1"} draft_version
 * @property {Object} pipeline_versions
 * @property {"training-prescription-v1"} prescription_version
 * @property {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} status
 * @property {number} recommended_days
 * @property {string|null} split_code
 * @property {"FIXED_DAYS"|"SESSION_SEQUENCE"} schedule_mode
 * @property {boolean} intro_week_required
 * @property {"CONSERVATIVE"|"NORMAL"} volume_start
 * @property {boolean} schedule_review_required
 * @property {Array<{code:ScheduleReasonCodeValue,message:string}>} schedule_reasons
 * @property {ScheduledTrainingSession[]} sessions
 * @property {Array<Object>} constraints
 * @property {Array<Object>} reasons
 */
