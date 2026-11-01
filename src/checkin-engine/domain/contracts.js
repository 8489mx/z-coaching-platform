/**
 * @typedef {Object} BiofeedbackScores
 * @property {number} hunger_level - 1 (Low) to 5 (Ravenous)
 * @property {number} energy_in_gym - 1 (Exhausted) to 5 (Peak)
 * @property {number} sleep_quality - 1 (Poor) to 5 (Deep/Restful)
 * @property {number} stress_level - 1 (Calm) to 5 (High Stress)
 */

/**
 * @typedef {Object} PainReport
 * @property {string} body_part
 * @property {number} pain_level - 1 to 10
 * @property {string} description
 */

/**
 * @typedef {Object} CheckinSubmissionInput
 * @property {number[]} daily_weights_kg - 1 to 7 weight records for the week
 * @property {number} [previous_week_average_weight_kg]
 * @property {number} [waist_circumference_cm]
 * @property {number} [previous_waist_circumference_cm]
 * @property {number} nutrition_adherence_percent - 0 to 100
 * @property {number} workouts_completed - Count of completed sessions
 * @property {number} workouts_scheduled - Count of planned sessions
 * @property {number} [average_daily_steps]
 * @property {BiofeedbackScores} biofeedback
 * @property {PainReport[]} [pain_reports]
 * @property {string|null} [client_notes]
 * @property {string} [lifestyle_variance] - NORMAL_WORK, HOME_VACATION, TRAVEL_AWAY, DOUBLED_EFFORT, SICK_RECOVERY
 * @property {string} [bowel_regularity] - REGULAR, IRREGULAR, CONSTIPATED
 * @property {number} [sleep_stress_composite] - 1 to 5
 * @property {string} [menstrual_phase] - NOT_APPLICABLE, FOLLICULAR, OVULATION, LUTEAL, MENSTRUATION
 * @property {string} [occupation_type] - Trainee occupational baseline
 * @property {boolean} [next_week_travel]
 * @property {boolean} [next_week_gym_available]
 * @property {number} [next_week_realistic_days]
 * @property {string} [next_week_notes]
 */

/**
 * @typedef {Object} CheckinAnalysisOutput
 * @property {string} engine_version
 * @property {string} analysis_status
 * @property {boolean} is_rapid_loss
 * @property {number} current_average_weight_kg
 * @property {number|null} weight_change_kg
 * @property {number|null} weight_change_percent
 * @property {number|null} waist_change_cm
 * @property {string} adherence_tier
 * @property {string[]} biofeedback_alerts
 * @property {PainReport[]} flagged_pains
 * @property {string[]} recommendations_ar
 * @property {string[]} recommendations_en
 * @property {boolean} requires_coach_review
 * @property {Object} [false_plateau_triad]
 * @property {string} [lifestyle_variance]
 * @property {boolean} [occupational_neat_lock]
 * @property {Object} [forward_looking]
 */
