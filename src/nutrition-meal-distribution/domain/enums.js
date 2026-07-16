export const NutritionMealDistributionStatus = Object.freeze({
  READY: "READY",
  PROVISIONAL_REVIEW_REQUIRED: "PROVISIONAL_REVIEW_REQUIRED",
  WITHHELD: "WITHHELD",
});

export const NutritionMealDistributionPolicy = Object.freeze({
  Z_COACHING_MEAL_DISTRIBUTION_V1:
    "Z_COACHING_MEAL_DISTRIBUTION_V1",
});

export const NutritionMealRole = Object.freeze({
  BREAKFAST: "BREAKFAST",
  MAIN_MEAL: "MAIN_MEAL",
  SNACK: "SNACK",
  EVENING_MEAL: "EVENING_MEAL",
});

export const NutritionMealTimingMode = Object.freeze({
  FLEXIBLE_SEQUENCE: "FLEXIBLE_SEQUENCE",
  AVOID_UNAVAILABLE_WINDOWS: "AVOID_UNAVAILABLE_WINDOWS",
  COACH_TO_CONFIRM: "COACH_TO_CONFIRM",
});
