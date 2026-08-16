import { MealTimeCategory, FoodMacroType } from "./domain/enums.js";

/**
 * Verified Swap Registry linking foods to macro classifications, meal suitability,
 * primary nutrient density per 100g, and bilingual display names.
 */
export const SMART_SWAP_REGISTRY = Object.freeze([
  // --- BREAKFAST PROTEINS ---
  {
    food_code: "WHOLE_EGG",
    name_ar: "بيض كامل مسلوق",
    name_en: "Whole Boiled Egg",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.SNACK]),
    primary_nutrient_per_100g: 13.0, // 13g Protein / 100g
    grams_per_household_unit: 50,
    unit_label_ar: "بيضة كاملة",
    unit_label_en: "Whole egg",
  },
  {
    food_code: "EGG_WHITE",
    name_ar: "بياض بيض",
    name_en: "Egg White",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.SNACK]),
    primary_nutrient_per_100g: 11.0,
    grams_per_household_unit: 33,
    unit_label_ar: "بياض بيضة",
    unit_label_en: "Egg white",
  },
  {
    food_code: "CHEESE_COTTAGE_LOW_FAT",
    name_ar: "جبن قريش قليل الدسم",
    name_en: "Low-fat Cottage Cheese",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.SNACK]),
    primary_nutrient_per_100g: 12.0,
    grams_per_household_unit: 100,
    unit_label_ar: "جرام جبن قريش",
    unit_label_en: "g Cottage Cheese",
  },
  {
    food_code: "YOGURT_GREEK_PLAIN_NONFAT",
    name_ar: "زبادي يوناني خالي الدسم",
    name_en: "Non-fat Greek Yogurt",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.SNACK]),
    primary_nutrient_per_100g: 10.0,
    grams_per_household_unit: 170,
    unit_label_ar: "علبة زبادي يوناني",
    unit_label_en: "Greek yogurt cup",
  },
  {
    food_code: "WHEY_PROTEIN_POWDER",
    name_ar: "واي بروتين باودر",
    name_en: "Whey Protein Powder",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.SNACK]),
    primary_nutrient_per_100g: 75.0,
    grams_per_household_unit: 30,
    unit_label_ar: "سكوب واي بروتين",
    unit_label_en: "Scoop Whey Protein",
  },

  // --- MAIN MEAL PROTEINS ---
  {
    food_code: "CHICKEN_BREAST_COOKED",
    name_ar: "صدور دجاج مشوية",
    name_en: "Grilled Chicken Breast",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.MAIN_MEAL]),
    primary_nutrient_per_100g: 31.0,
    grams_per_household_unit: 100,
    unit_label_ar: "جرام دجاج مشوي",
    unit_label_en: "g Grilled Chicken",
  },
  {
    food_code: "BEEF_TOP_SIRLOIN_LEAN",
    name_ar: "لحم بقري ستيك قليل الدسم",
    name_en: "Lean Beef Sirloin",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.MAIN_MEAL]),
    primary_nutrient_per_100g: 29.0,
    grams_per_household_unit: 100,
    unit_label_ar: "جرام لحم بقري",
    unit_label_en: "g Lean Beef",
  },
  {
    food_code: "TILAPIA_COOKED",
    name_ar: "سمك فيليه بلطي مشوي",
    name_en: "Grilled Tilapia Fillet",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.MAIN_MEAL]),
    primary_nutrient_per_100g: 26.0,
    grams_per_household_unit: 100,
    unit_label_ar: "جرام سمك فيليه",
    unit_label_en: "g Tilapia Fillet",
  },
  {
    food_code: "SALMON_ATLANTIC_COOKED",
    name_ar: "سلمون مشوي",
    name_en: "Grilled Atlantic Salmon",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.MAIN_MEAL]),
    primary_nutrient_per_100g: 25.0,
    grams_per_household_unit: 100,
    unit_label_ar: "جرام سلمون مشوي",
    unit_label_en: "g Grilled Salmon",
  },
  {
    food_code: "TUNA_CANNED_IN_WATER",
    name_ar: "تونة معلبة في الماء",
    name_en: "Canned Tuna in Water",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.MAIN_MEAL, MealTimeCategory.SNACK]),
    primary_nutrient_per_100g: 26.0,
    grams_per_household_unit: 120,
    unit_label_ar: "علبة تونة مصفاة",
    unit_label_en: "Can drained Tuna",
  },

  // --- BREAKFAST CARBS ---
  {
    food_code: "OATS_ROLLED_RAW",
    name_ar: "شوفان كامل الحبة",
    name_en: "Rolled Oats",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.SNACK]),
    primary_nutrient_per_100g: 66.0, // 66g Carbs / 100g
    grams_per_household_unit: 40,
    unit_label_ar: "ملعقة كبيرة شوفان",
    unit_label_en: "tbsp Oats",
  },
  {
    food_code: "BREAD_WHOLE_WHEAT",
    name_ar: "توست أسمر حبوب كاملة",
    name_en: "Whole Wheat Toast",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.SNACK]),
    primary_nutrient_per_100g: 43.0,
    grams_per_household_unit: 35,
    unit_label_ar: "شريحة توست أسمر",
    unit_label_en: "Slice whole wheat toast",
  },
  {
    food_code: "BANANA_RAW",
    name_ar: "موز طازج",
    name_en: "Fresh Banana",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.SNACK]),
    primary_nutrient_per_100g: 23.0,
    grams_per_household_unit: 120,
    unit_label_ar: "حبة موز متوسطة",
    unit_label_en: "Medium Banana",
  },

  // --- MAIN MEAL CARBS ---
  {
    food_code: "RICE_WHITE_COOKED",
    name_ar: "أرز أبيض مطبوخ",
    name_en: "Cooked White Rice",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.MAIN_MEAL]),
    primary_nutrient_per_100g: 28.0,
    grams_per_household_unit: 100,
    unit_label_ar: "جرام أرز مطبوخ",
    unit_label_en: "g Cooked Rice",
  },
  {
    food_code: "POTATO_BAKED",
    name_ar: "بطاطس مشوية / مسلوقة",
    name_en: "Baked / Boiled Potato",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.MAIN_MEAL]),
    primary_nutrient_per_100g: 21.0,
    grams_per_household_unit: 150,
    unit_label_ar: "حبة بطاطس متوسطة",
    unit_label_en: "Medium Potato",
  },
  {
    food_code: "SWEET_POTATO_BAKED",
    name_ar: "بطاطا حلوة مشوية",
    name_en: "Baked Sweet Potato",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.MAIN_MEAL, MealTimeCategory.BREAKFAST]),
    primary_nutrient_per_100g: 21.0,
    grams_per_household_unit: 150,
    unit_label_ar: "حبة بطاطا حلوة متوسطة",
    unit_label_en: "Medium Sweet Potato",
  },
  {
    food_code: "PASTA_WHOLE_WHEAT_COOKED",
    name_ar: "مكرونة قمح كامل مطبوخة",
    name_en: "Cooked Whole Wheat Pasta",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.MAIN_MEAL]),
    primary_nutrient_per_100g: 26.0,
    grams_per_household_unit: 100,
    unit_label_ar: "جرام مكرونة مطبوخة",
    unit_label_en: "g Cooked Pasta",
  },

  // --- FATS ---
  {
    food_code: "OLIVE_OIL",
    name_ar: "زيت زيتون بكر ممتاز",
    name_en: "Extra Virgin Olive Oil",
    macro_type: FoodMacroType.FAT_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.MAIN_MEAL]),
    primary_nutrient_per_100g: 100.0,
    grams_per_household_unit: 10,
    unit_label_ar: "ملعقة طعام زيت زيتون",
    unit_label_en: "tbsp Olive Oil",
  },
  {
    food_code: "PEANUT_BUTTER",
    name_ar: "زبدة فول سوداني طبيعية",
    name_en: "Natural Peanut Butter",
    macro_type: FoodMacroType.FAT_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.SNACK]),
    primary_nutrient_per_100g: 50.0,
    grams_per_household_unit: 15,
    unit_label_ar: "ملعقة طعام زبدة فول سوداني",
    unit_label_en: "tbsp Peanut Butter",
  },
  {
    food_code: "ALMONDS_RAW",
    name_ar: "لوز نيء غير مملح",
    name_en: "Raw Unsalted Almonds",
    macro_type: FoodMacroType.FAT_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.SNACK]),
    primary_nutrient_per_100g: 50.0,
    grams_per_household_unit: 15,
    unit_label_ar: "حبة لوز (~15g)",
    unit_label_en: "Almonds (~15g)",
  },
]);

export function getSmartFoodRegistryItem(foodCode) {
  return SMART_SWAP_REGISTRY.find((item) => item.food_code === foodCode) || null;
}

export function listSmartSwapCandidates(foodCode, mealCategory) {
  const currentItem = getSmartFoodRegistryItem(foodCode);
  if (!currentItem) return [];

  return SMART_SWAP_REGISTRY.filter(
    (item) =>
      item.food_code !== foodCode &&
      item.macro_type === currentItem.macro_type &&
      item.meal_categories.includes(mealCategory),
  );
}
