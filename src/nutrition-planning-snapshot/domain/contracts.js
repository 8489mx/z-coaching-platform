export const NUTRITION_PLANNING_SNAPSHOT_VERSION =
  "nutrition-planning-snapshot-v1";

/**
 * @typedef {Object} NutritionPlanningSnapshot
 * @property {"nutrition-planning-snapshot-v1"} snapshot_version
 * @property {string} assessment_date
 * @property {NutritionPlanningClient} client
 * @property {NutritionPlanningGoal} goal
 * @property {NutritionPlanningBody} body
 * @property {NutritionPlanningActivity} activity
 * @property {NutritionPlanningRecovery} recovery
 * @property {NutritionPlanningMealPreferences} meal_preferences
 * @property {NutritionPlanningFoodRestrictions} food_restrictions
 * @property {NutritionPlanningDecisionContext} decision_context
 */

/**
 * @typedef {Object} NutritionPlanningClient
 * @property {number} age_years
 * @property {string} sex
 * @property {string} residence_country
 */

/**
 * @typedef {Object} NutritionPlanningGoal
 * @property {string} primary
 * @property {string} calorie_direction
 * @property {string} decision_confidence
 */

/**
 * @typedef {Object} NutritionPlanningBody
 * @property {number} height_cm
 * @property {number} weight_kg
 * @property {number|null} waist_cm
 * @property {string} weight_trend
 * @property {string} measurement_quality
 */

/**
 * @typedef {Object} NutritionPlanningActivity
 * @property {string} daily_activity
 * @property {string} work_schedule_type
 * @property {string[]} physically_demanding_days
 * @property {number|null} average_daily_steps
 * @property {Object[]} additional_sports
 * @property {number} recommended_resistance_days
 * @property {string} training_schedule_mode
 * @property {boolean} intro_week_required
 * @property {string} training_volume_start
 */

/**
 * @typedef {Object} NutritionPlanningRecovery
 * @property {number} sleep_average_hours
 * @property {string} sleep_quality
 * @property {string} stress_level
 */

/**
 * @typedef {Object} NutritionPlanningMealPreferences
 * @property {number} preferred_meal_count
 * @property {string} meal_count_strategy
 * @property {Object[]} unavailable_eating_windows
 * @property {string} budget
 * @property {boolean} food_storage_available
 * @property {boolean} food_reheating_available
 */

/**
 * @typedef {Object} NutritionPlanningFoodRestrictions
 * @property {Object[]} allergies
 * @property {Object[]} medical_exclusions
 * @property {Object[]} intolerances
 * @property {Object[]} digestive_issues
 * @property {string[]} disliked_foods
 */

/**
 * @typedef {Object} NutritionPlanningDecisionContext
 * @property {string} plan_status
 * @property {Object[]} hard_constraints
 * @property {Object[]} soft_preferences
 * @property {Object[]} nutrition_constraints
 * @property {Object[]} nutrition_reasons
 * @property {Object} cardio_decision
 */
