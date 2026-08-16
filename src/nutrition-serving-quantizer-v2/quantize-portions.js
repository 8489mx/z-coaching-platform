import { HouseholdUnitType, NUTRITION_SERVING_QUANTIZER_V2_VERSION } from "./domain/enums.js";

export const ARABIC_FOOD_NAMES = Object.freeze({
  COTTAGE_CHEESE_LOW_FAT_2_PERCENT: "جبن قريش قليل الدسم",
  EGG_WHOLE_HARD_BOILED: "بيض مسلوق كامل",
  WHOLE_EGG: "بيض مسلوق كامل",
  EGG_WHITE_COOKED: "بياض بيض مسلوق",
  EGG_WHITE: "بياض بيض مسلوق",
  OATS_ROLLED_DRY: "شوفان كامل الحبة",
  BANANA_RAW: "موز طازج",
  CHICKEN_BREAST_ROASTED_SKINLESS: "صدور دجاج مشوية",
  CHICKEN_BREAST: "صدور دجاج مشوية",
  POTATO_BOILED_WITHOUT_SKIN: "بطاطس مسلوقة",
  POTATO_BOILED: "بطاطس مسلوقة",
  RICE_WHITE_COOKED: "أرز أبيض مطبوخ",
  RICE_WHITE: "أرز أبيض مطبوخ",
  CARROT_RAW: "جزر طازج",
  CUCUMBER_WITH_PEEL_RAW: "خيار طازج",
  TOMATO_RED_RAW: "طماطم طازجة",
  OLIVE_OIL: "زيت زيتون",
  BREAD_WHOLE_WHEAT: "توست أسمر",
  TUNA_CANNED_IN_WATER: "تونة بالماء",
  SALMON_ATLANTIC_WILD_RAW: "سمك سلمون",
  BEEF_GROUND_95_5_RAW: "لحم بقري مفروم قليل الدسم",
  SWEET_POTATO_COOKED: "بطاطا حلوة مشوية",
  PASTA_WHOLE_WHEAT_COOKED: "مكرونة قمح كامل مسلوقة",
  AVOCADO_RAW: "أفوكادو طازج",
  GREEK_YOGURT_PLAIN_NONFAT: "زبادي يوناني خالي الدسم",
  ALMONDS_RAW: "لوز نيء",
  PEANUT_BUTTER_ALL_NATURAL: "زبدة فول سوداني",
  APPLE_RAW: "تفاح طازج",
  BERRIES_MIXED_RAW: "توت مشكل",
  SPINACH_RAW: "سبانخ طازجة",
  BROCCOLI_COOKED: "بروكلي مسلوق",
});

const FOOD_HOUSEHOLD_CONVERSIONS = Object.freeze({
  WHOLE_EGG: {
    unit: HouseholdUnitType.WHOLE_PIECE,
    gramsPerUnit: 50,
    arLabel: "بيضة كاملة",
    enLabel: "Whole egg",
  },
  EGG_WHOLE_HARD_BOILED: {
    unit: HouseholdUnitType.WHOLE_PIECE,
    gramsPerUnit: 50,
    arLabel: "بيضة مسلوقة",
    enLabel: "Whole egg",
  },
  EGG_WHITE: {
    unit: HouseholdUnitType.WHOLE_PIECE,
    gramsPerUnit: 33,
    arLabel: "بياض بيضة",
    enLabel: "Egg white",
  },
  EGG_WHITE_COOKED: {
    unit: HouseholdUnitType.WHOLE_PIECE,
    gramsPerUnit: 33,
    arLabel: "بياض بيضة",
    enLabel: "Egg white",
  },
  OLIVE_OIL: {
    unit: HouseholdUnitType.TABLESPOON,
    gramsPerUnit: 10,
    arLabel: "ملعقة طعام",
    enLabel: "tbsp Olive Oil",
  },
  APPLE_RAW: {
    unit: HouseholdUnitType.WHOLE_PIECE,
    gramsPerUnit: 150,
    arLabel: "حبة متوسطة",
    enLabel: "Medium Apple",
  },
  BANANA_RAW: {
    unit: HouseholdUnitType.WHOLE_PIECE,
    gramsPerUnit: 120,
    arLabel: "حبة متوسطة",
    enLabel: "Medium Banana",
  },
  BREAD_WHOLE_WHEAT: {
    unit: HouseholdUnitType.SLICE,
    gramsPerUnit: 35,
    arLabel: "شريحة",
    enLabel: "Slice whole wheat toast",
  },
});

/**
 * Formats a food item into a single line: Arabic Name first, followed by grams in parentheses.
 * @param {Object} foodItem 
 * @returns {string}
 */
export function formatSingleLineArabicFood(foodItem) {
  const code = foodItem?.food_code || "";
  const arName = foodItem?.name_ar || ARABIC_FOOD_NAMES[code] || "صنف غذائي";
  const grams = Math.round(foodItem?.portion_g_rounded ?? foodItem?.grams ?? foodItem?.portion_g ?? 100);
  const conversion = FOOD_HOUSEHOLD_CONVERSIONS[code];

  if (conversion) {
    const unitCount = Math.round((grams / conversion.gramsPerUnit) * 2) / 2;
    if (unitCount >= 1) {
      return `${arName} (${unitCount} ${conversion.arLabel} - ${grams} جرام)`;
    }
  }

  return `${arName} (${grams} جرام)`;
}

/**
 * Converts a raw solved food portion in grams into a clean, practical household serving description.
 *
 * @param {Object} foodItem
 * @returns {Object}
 */
export function quantizeFoodPortion(foodItem) {
  const rawGrams = foodItem?.portion_g ?? foodItem?.grams;
  if (typeof rawGrams !== "number" || !Number.isFinite(rawGrams)) {
    throw new TypeError("foodItem must have a numeric portion_g or grams.");
  }
  const foodCode = foodItem.food_code;
  const conversion = FOOD_HOUSEHOLD_CONVERSIONS[foodCode];
  const arName = foodItem.name_ar || ARABIC_FOOD_NAMES[foodCode] || foodCode;

  let householdUnit = HouseholdUnitType.GRAMS;
  let unitCount = null;
  let servingDisplayAr = `${arName} (${Math.round(rawGrams)} جرام)`;
  let servingDisplayEn = `${Math.round(rawGrams)}g`;

  if (conversion) {
    unitCount = Math.round((rawGrams / conversion.gramsPerUnit) * 2) / 2;
    householdUnit = conversion.unit;

    if (unitCount >= 1) {
      servingDisplayAr = `${arName} (${unitCount} ${conversion.arLabel} - ${Math.round(rawGrams)} جرام)`;
      servingDisplayEn = `${unitCount} ${conversion.enLabel} (~${Math.round(rawGrams)}g)`;
    } else {
      servingDisplayAr = `${arName} (${Math.round(rawGrams)} جرام)`;
      servingDisplayEn = `${Math.round(rawGrams)}g`;
    }
  }

  return Object.freeze({
    ...foodItem,
    name_ar: arName,
    portion_g_rounded: Math.round(rawGrams),
    household_unit_type: householdUnit,
    unit_count: unitCount,
    serving_display_ar: servingDisplayAr,
    serving_display_en: servingDisplayEn,
  });
}

/**
 * Quantizes an entire solved nutrition meal plan into practical household portions.
 *
 * @param {import("../nutrition-portion-solver/domain/contracts.js").NutritionPortionSolverOutput} portionSolverOutput
 * @returns {Object}
 */
export function quantizeNutritionPlan(portionSolverOutput) {
  if (!portionSolverOutput || !Array.isArray(portionSolverOutput.meals)) {
    throw new TypeError("portionSolverOutput must contain meals array.");
  }

  const quantizedMeals = portionSolverOutput.meals.map((meal) => {
    const quantizedFoods = (meal.foods || []).map((food) => quantizeFoodPortion(food));

    return Object.freeze({
      ...meal,
      foods: Object.freeze(quantizedFoods),
    });
  });

  return Object.freeze({
    quantizer_version: NUTRITION_SERVING_QUANTIZER_V2_VERSION,
    meals: Object.freeze(quantizedMeals),
  });
}
