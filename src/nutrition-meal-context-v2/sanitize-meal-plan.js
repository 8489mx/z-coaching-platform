import { NUTRITION_MEAL_CONTEXT_V2_VERSION, ErgonomicPortionCaps } from "./domain/enums.js";

/**
 * Validates, adjusts, and sanitizes a raw solved meal plan into culturally realistic,
 * stomach-capacity-bounded meals with appropriate breakfast, lunch, and dinner foods.
 *
 * @param {Object} rawMealPlan - Meal plan from portion solver
 * @returns {Object} Sanitized and ergonomically optimized meal plan
 */
export function sanitizeMealPlan(rawMealPlan, intakeOrRestrictions = {}) {
  if (!rawMealPlan || !Array.isArray(rawMealPlan.meals)) {
    throw new TypeError("rawMealPlan must contain meals array.");
  }

  const exclusions = new Set();
  const nutrition = intakeOrRestrictions.nutrition || intakeOrRestrictions || {};
  const excludedList = Array.isArray(nutrition.excludedFoodsList) ? nutrition.excludedFoodsList : [];
  for (const ex of excludedList) {
    if (typeof ex === 'string') exclusions.add(ex.toUpperCase());
  }
  const dislikedList = Array.isArray(nutrition.dislikedFoods || nutrition.disliked_foods) ? (nutrition.dislikedFoods || nutrition.disliked_foods) : [];
  for (const d of dislikedList) {
    const code = typeof d === 'string' ? d : (d.foodCode || d.name || '');
    if (code) exclusions.add(code.toUpperCase());
  }
  const allergiesList = Array.isArray(nutrition.allergies) ? nutrition.allergies : [];
  for (const a of allergiesList) {
    if (a && a.substance) exclusions.add(a.substance.toUpperCase());
  }

  const isOatsExcluded = exclusions.has("OATS") || exclusions.has("OAT") || exclusions.has("OATS_ROLLED_DRY");
  const isWheatExcluded = exclusions.has("GLUTEN") || exclusions.has("WHEAT") || exclusions.has("GLUTEN_WHEAT") || exclusions.has("WHEAT_GLUTEN") || exclusions.has("BREAD");
  const isBananaExcluded = exclusions.has("BANANA") || exclusions.has("FRUIT");

  const sanitizedMeals = rawMealPlan.meals.map((meal) => {
    const isBreakfast = meal.role === "BREAKFAST" || meal.sequence === 1;
    const isEvening = meal.role === "EVENING_MEAL" || meal.sequence === 3;
    const items = [...(meal.items || meal.foods || [])];
    const newItems = [];

    for (const item of items) {
      let foodCode = item.food_code;
      let grams = item.grams || item.portion_g || 100;
      let nameAr = item.name_ar;
      let nameEn = item.name_en;

      // 1. Cultural Breakfast Replacement: No Rice/Pasta at Breakfast!
      if (isBreakfast && (foodCode.includes("RICE") || foodCode.includes("PASTA"))) {
        const carbGrams = grams * 0.28;
        if (!isOatsExcluded) {
          foodCode = "OATS_ROLLED_DRY";
          grams = Math.min(80, Math.round(carbGrams / 0.68));
          nameAr = "شوفان كامل الحبة";
          nameEn = "Rolled Oats";
        } else if (!isWheatExcluded) {
          foodCode = "BREAD_WHOLE_WHEAT";
          grams = Math.min(120, Math.round(carbGrams / 0.43));
          nameAr = "خبز قمح كامل (بلدي / توست بني)";
          nameEn = "Whole Wheat Bread";
        } else {
          foodCode = "POTATO_BOILED_WITHOUT_SKIN";
          grams = Math.min(250, Math.round(carbGrams / 0.20));
          nameAr = "بطاطس مسلوقة بدون قشر";
          nameEn = "Boiled Potato";
        }

        // If extra carbs remain, add safe fresh fruit
        const remainingCarbs = carbGrams - (grams * 0.4);
        if (remainingCarbs > 15 && !isBananaExcluded) {
          newItems.push({
            food_code: "BANANA_RAW",
            name_ar: "موز طازج",
            name_en: "Fresh Banana",
            grams: 120,
            portion_g: 120,
            nutrition: {
              calories_kcal: 105,
              protein_g: 1.3,
              fat_g: 0.3,
              carbohydrate_g: 27,
              fiber_g: 3,
            },
          });
        }
      }

      // 2. Evening Meal Context: No Breakfast Oatmeal Bowls for Dinner!
      if (isEvening && foodCode === "OATS_ROLLED_DRY") {
        foodCode = "POTATO_BOILED_WITHOUT_SKIN";
        grams = Math.min(250, Math.round((grams * 0.68) / 0.20));
        nameAr = "بطاطس مسلوقة بدون قشر";
        nameEn = "Boiled Potato";
      }

      // 3. Ergonomic Stomach Capacity Portion Caps
      if (foodCode === "POTATO_BOILED_WITHOUT_SKIN" && grams > ErgonomicPortionCaps.POTATO_BOILED_MAX_G) {
        grams = ErgonomicPortionCaps.POTATO_BOILED_MAX_G;
      }
      if (foodCode === "CUCUMBER_WITH_PEEL_RAW" && grams > ErgonomicPortionCaps.CUCUMBER_MAX_G) {
        grams = ErgonomicPortionCaps.CUCUMBER_MAX_G;
      }
      if (foodCode === "CARROT_RAW" && grams > ErgonomicPortionCaps.CARROT_MAX_G) {
        grams = ErgonomicPortionCaps.CARROT_MAX_G;
      }
      if (foodCode === "TOMATO_RED_RAW" && grams > ErgonomicPortionCaps.TOMATO_MAX_G) {
        grams = ErgonomicPortionCaps.TOMATO_MAX_G;
      }
      if (foodCode === "OLIVE_OIL" && grams > ErgonomicPortionCaps.OLIVE_OIL_MAX_G) {
        grams = ErgonomicPortionCaps.OLIVE_OIL_MAX_G;
      }
      if (foodCode === "OATS_ROLLED_DRY" && grams > ErgonomicPortionCaps.OATS_DRY_MAX_G) {
        grams = ErgonomicPortionCaps.OATS_DRY_MAX_G;
      }

      newItems.push({
        ...item,
        food_code: foodCode,
        name_ar: nameAr || item.name_ar,
        name_en: nameEn || item.name_en,
        grams,
        portion_g: grams,
      });
    }

    return Object.freeze({
      ...meal,
      items: Object.freeze(newItems),
      foods: Object.freeze(newItems),
    });
  });

  return Object.freeze({
    engine_version: NUTRITION_MEAL_CONTEXT_V2_VERSION,
    meals: Object.freeze(sanitizedMeals),
  });
}
