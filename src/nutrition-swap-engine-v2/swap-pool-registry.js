import { MealTimeCategory, FoodMacroType } from "./domain/enums.js";
import { canonicalMacros } from "../nutrition-food-catalog/canonical-food-table.js";

/**
 * Verified Swap Registry linking foods to macro classifications, meal suitability,
 * primary nutrient density per 100g, and bilingual display names.
 */
const SMART_SWAP_REGISTRY_ENTRIES = [
  // --- BREAKFAST PROTEINS ---
  {
    food_code: "WHOLE_EGG",
    name_ar: "بيض كامل مسلوق",
    name_en: "Whole Boiled Egg",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.SNACK]),
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
    grams_per_household_unit: 33,
    unit_label_ar: "بياض بيضة",
    unit_label_en: "Egg white",
  },
  // Batch 1 fixup: the Alt 2 breakfast bridge serves this code as a real
  // plate item (two cooked egg whites, 66 g); same food as EGG_WHITE, so it
  // needs its own registry entry or the live swap endpoint returns no
  // candidates for it. Density is derived from the canonical table (10.7 g
  // protein / 100 g), like every other entry.
  {
    food_code: "EGG_WHITE_COOKED",
    name_ar: "بياض بيض مسلوق",
    name_en: "Boiled Egg White",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.SNACK]),
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
    // P1-B7: was 12.0; base table COTTAGE_CHEESE_LOW_FAT_2_PERCENT = 10.45 (USDA).
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
    // P1-B7: was 25.0; culinary SALMON_FISH + JSON39 SALMON_ATLANTIC_COOKED = 22.1 (USDA).
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
    // P1-B7: was 26.0; base table TUNA_LIGHT_CANNED_WATER_DRAINED = 19.44 (USDA).
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
    // P1-B7: was 66.0; base table OATS_ROLLED_DRY 68.65755 rounded to 2dp = 68.66.
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
    grams_per_household_unit: 150,
    unit_label_ar: "حبة بطاطس متوسطة",
    unit_label_en: "Medium Potato",
  },
  {
    // Gluten-free, low glycemic starch (same code and USDA values as the plan and web lists).
    food_code: "COOKED_QUINOA",
    name_ar: "كينوا مسلوقة",
    name_en: "Cooked Quinoa",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.MAIN_MEAL, MealTimeCategory.BREAKFAST]),
    grams_per_household_unit: 185,
    unit_label_ar: "كوب كينوا مسلوقة",
    unit_label_en: "Cup of cooked quinoa",
  },
  {
    food_code: "SWEET_POTATO_BAKED",
    name_ar: "بطاطا حلوة مشوية",
    name_en: "Baked Sweet Potato",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.MAIN_MEAL, MealTimeCategory.BREAKFAST]),
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
    // P1-B7: was 26.0; JSON39 WHOLE_WHEAT_PASTA_COOKED = 30.1 (base spaghetti 30.7 corroborates).
    grams_per_household_unit: 100,
    unit_label_ar: "جرام مكرونة مطبوخة",
    unit_label_en: "g Cooked Pasta",
  },

  // --- REGIONAL GCC & EGYPT BREAKFAST & DINNER PROTEINS ---
  {
    food_code: "LABNEH_LIGHT",
    name_ar: "لبنة لايت قليلة الدسم بالزعتر",
    name_en: "Low-Fat Labneh with Thyme",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.MAIN_MEAL, MealTimeCategory.SNACK]),
    grams_per_household_unit: 30,
    unit_label_ar: "ملعقة كبيرة لبنة لايت",
    unit_label_en: "tbsp Labneh",
  },
  {
    food_code: "HALLOUMI_LIGHT",
    name_ar: "جبن حلوم لايت مشوي",
    name_en: "Grilled Light Halloumi Cheese",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.MAIN_MEAL]),
    grams_per_household_unit: 50,
    unit_label_ar: "شريحة حلوم مشوي",
    unit_label_en: "Slice Halloumi",
  },
  {
    food_code: "LABAN_RAYEB_LOWFAT",
    name_ar: "لبن رائب قليل الدسم (مراعي / نادك)",
    name_en: "Low-Fat Laban Rayeb Drink",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.MAIN_MEAL, MealTimeCategory.SNACK]),
    grams_per_household_unit: 200,
    unit_label_ar: "كوب لبن رائب",
    unit_label_en: "Cup Laban Rayeb",
  },
  // Milks: the same kind of dairy drink as laban (they were read as laban and nothing swapped).
  {
    food_code: "SKIM_MILK",
    name_ar: "لبن خالي الدسم",
    name_en: "Skim Milk",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.MAIN_MEAL, MealTimeCategory.SNACK]),
    grams_per_household_unit: 240,
    unit_label_ar: "كوب لبن",
    unit_label_en: "Cup of milk",
  },
  {
    food_code: "LACTOSE_FREE_MILK",
    name_ar: "لبن خالي من اللاكتوز",
    name_en: "Lactose-Free Milk",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.MAIN_MEAL, MealTimeCategory.SNACK]),
    grams_per_household_unit: 240,
    unit_label_ar: "كوب لبن",
    unit_label_en: "Cup of milk",
  },
  {
    food_code: "SHAKSHOUKA_EGGS",
    name_ar: "بيض شكشوكة بالخضار والطماطم",
    name_en: "Arabic Shakshouka Eggs",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.MAIN_MEAL]),
    grams_per_household_unit: 150,
    unit_label_ar: "طبق شكشوكة بالبيض",
    unit_label_en: "Dish Shakshouka",
  },
  {
    food_code: "FOUL_MUDAMMAS",
    name_ar: "فول مدمس بالليمون والكمون",
    name_en: "Foul Mudammas",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.MAIN_MEAL]),
    grams_per_household_unit: 150,
    unit_label_ar: "طبق فول مدمس",
    unit_label_en: "Bowl Foul Mudammas",
  },
  {
    food_code: "LUPINI_BEANS",
    name_ar: "ترمس مسلوق بالليمون والكمون",
    name_en: "Boiled Lupini Beans",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.SNACK, MealTimeCategory.BREAKFAST, MealTimeCategory.MAIN_MEAL]),
    grams_per_household_unit: 100,
    unit_label_ar: "كوب ترمس مسلوق",
    unit_label_en: "Cup Lupini Beans",
  },

  // --- REGIONAL GCC & EGYPT MAIN MEAL PROTEINS ---
  {
    food_code: "HAMOUR_FISH",
    name_ar: "سمك هامور خليجي مشوي",
    name_en: "Grilled Hamour Fish",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.MAIN_MEAL]),
    grams_per_household_unit: 100,
    unit_label_ar: "جرام هامور مشوي",
    unit_label_en: "g Grilled Hamour",
  },
  {
    food_code: "KANAAD_KINGFISH",
    name_ar: "سمك كنعد / شعري مشوي",
    name_en: "Grilled Kingfish (Kanaad)",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.MAIN_MEAL]),
    grams_per_household_unit: 100,
    unit_label_ar: "جرام كنعد مشوي",
    unit_label_en: "g Grilled Kingfish",
  },
  {
    food_code: "BOURI_FISH",
    name_ar: "سمك بوري مصري مشوي بالردة",
    name_en: "Egyptian Grilled Bouri Fish",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.MAIN_MEAL]),
    grams_per_household_unit: 100,
    unit_label_ar: "جرام بوري مشوي",
    unit_label_en: "g Grilled Bouri",
  },
  {
    food_code: "CAMEL_MEAT_LEAN",
    name_ar: "لحم حاشي هبرة خالي الشحم",
    name_en: "Lean Camel Meat (Hashi)",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.MAIN_MEAL]),
    grams_per_household_unit: 100,
    unit_label_ar: "جرام لحم حاشي",
    unit_label_en: "g Lean Camel Meat",
  },

  // --- REGIONAL GCC & EGYPT CARBS ---
  {
    food_code: "BALADI_BREAD",
    name_ar: "خبز بلدي مصري بالردة",
    name_en: "Egyptian Baladi Bread",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.MAIN_MEAL]),
    grams_per_household_unit: 85,
    unit_label_ar: "رغيف بلدي مصري",
    unit_label_en: "Baladi Bread Loaf",
  },
  {
    food_code: "TAMEES_BREAD_WHOLEWHEAT",
    name_ar: "خبز تميس بر أسمر",
    name_en: "Whole Wheat Tamees Bread",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.MAIN_MEAL]),
    grams_per_household_unit: 75,
    unit_label_ar: "ربع رغيف تميس بر",
    unit_label_en: "Quarter Tamees Bread",
  },
  {
    food_code: "SAJ_BREAD_WHOLEWHEAT",
    name_ar: "خبز صاج بر / رقاق أسمر",
    name_en: "Whole Wheat Saj Bread",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.MAIN_MEAL]),
    // P1-B7: was 50.0; culinary SAJ_BREAD_WHOLEWHEAT = 55.9.
    grams_per_household_unit: 50,
    unit_label_ar: "رغيف صاج بر",
    unit_label_en: "Saj Bread Loaf",
  },
  {
    food_code: "KABSA_SPICED_RICE",
    name_ar: "أرز بسمتي نثري كبسة/بخاري",
    name_en: "Kabsa Spiced Basmati Rice",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.MAIN_MEAL]),
    grams_per_household_unit: 25,
    unit_label_ar: "ملعقة كبيرة أرز كبسة",
    unit_label_en: "tbsp Kabsa Rice",
  },
  {
    food_code: "EGYPTIAN_RICE",
    name_ar: "أرز مصري مطبوخ",
    name_en: "Cooked Egyptian Rice",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.MAIN_MEAL]),
    grams_per_household_unit: 25,
    unit_label_ar: "ملعقة كبيرة أرز مصري",
    unit_label_en: "tbsp Egyptian Rice",
  },
  {
    food_code: "DATES_KHALAS",
    name_ar: "تمر خلاص / سكري / عجوة",
    name_en: "Saudi Dates (Khalas / Sukkari)",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.SNACK, MealTimeCategory.BREAKFAST]),
    grams_per_household_unit: 8,
    unit_label_ar: "حبة تمر",
    unit_label_en: "Date Piece",
  },

  // --- FRUITS & VOLUME SNACKS ---
  // P1-B7: BANANA_FRESH removed (duplicate of BANANA_RAW: same food, same 23.0 density).
  // The surviving BANANA_RAW keeps the true medium-banana unit (120 g); the culinary code
  // BANANA_FRESH still resolves via PLAN_FOOD_TO_REGISTRY in liveFoodSwapSafety.js.
  {
    food_code: "APPLE_FRESH",
    name_ar: "تفاح أحمر / أخضر طازج",
    name_en: "Fresh Apple",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.SNACK, MealTimeCategory.BREAKFAST]),
    grams_per_household_unit: 140,
    unit_label_ar: "ثمرة تفاح متوسطة",
    unit_label_en: "Medium Apple",
  },
  {
    food_code: "STRAWBERRY_FRESH",
    name_ar: "فراولة طازجة (سناك شبع)",
    name_en: "Fresh Strawberries",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.SNACK, MealTimeCategory.BREAKFAST]),
    grams_per_household_unit: 150,
    unit_label_ar: "كوب فراولة كبير",
    unit_label_en: "Large Strawberry Cup",
  },
  {
    food_code: "WATERMELON_FRESH",
    name_ar: "بطيخ صيفي منعش",
    name_en: "Fresh Summer Watermelon",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.SNACK, MealTimeCategory.BREAKFAST]),
    grams_per_household_unit: 200,
    unit_label_ar: "شريحة بطيخ كبيرة",
    unit_label_en: "Large Watermelon Slice",
  },
  {
    food_code: "ORANGE_FRESH",
    name_ar: "برتقال طازج",
    name_en: "Fresh Orange",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.SNACK, MealTimeCategory.BREAKFAST]),
    grams_per_household_unit: 150,
    unit_label_ar: "ثمرة برتقال متوسطة",
    unit_label_en: "Medium Orange",
  },
  {
    food_code: "AIR_POPPED_POPCORN",
    name_ar: "فشار ذرة بالهواء الساخن",
    name_en: "Air-Popped Popcorn",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.SNACK]),
    // P1-B7: was 74.0; culinary AIR_POPPED_POPCORN = 77.8.
    grams_per_household_unit: 25,
    unit_label_ar: "بولة فشار ضخمة (~25g جاف)",
    unit_label_en: "Jumbo Popcorn Bowl",
  },
  {
    food_code: "RICE_CAKES",
    name_ar: "رايس كيك (كعك الأرز)",
    name_en: "Crispy Rice Cakes",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.SNACK, MealTimeCategory.BREAKFAST]),
    grams_per_household_unit: 9,
    unit_label_ar: "قرص رايس كيك",
    unit_label_en: "Rice Cake",
  },

  // --- REGIONAL HEALTHY FATS ---
  {
    food_code: "RAW_TAHINI",
    name_ar: "طحينة سمسم خام",
    name_en: "Pure Sesame Tahini",
    macro_type: FoodMacroType.FAT_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.MAIN_MEAL]),
    grams_per_household_unit: 15,
    unit_label_ar: "ملعقة كبيرة طحينة",
    unit_label_en: "tbsp Tahini",
  },
  {
    food_code: "FRESH_AVOCADO",
    name_ar: "أفوكادو طازج",
    name_en: "Fresh Avocado",
    macro_type: FoodMacroType.FAT_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.MAIN_MEAL, MealTimeCategory.SNACK]),
    grams_per_household_unit: 75,
    unit_label_ar: "نصف ثمرة أفوكادو",
    unit_label_en: "Half Avocado",
  },
  {
    food_code: "NATURAL_BUTTER_GHEE",
    name_ar: "سمن بلدي / زبدة طبيعية",
    name_en: "Pure Ghee / Butter",
    macro_type: FoodMacroType.FAT_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.MAIN_MEAL]),
    grams_per_household_unit: 10,
    unit_label_ar: "ملعقة طعام سمن بلدي",
    unit_label_en: "tbsp Ghee",
  },

  // --- FATS ---
  {
    food_code: "OLIVE_OIL",
    name_ar: "زيت زيتون بكر ممتاز",
    name_en: "Extra Virgin Olive Oil",
    macro_type: FoodMacroType.FAT_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.MAIN_MEAL]),
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
    grams_per_household_unit: 15,
    unit_label_ar: "حبة لوز (~15g)",
    unit_label_en: "Almonds (~15g)",
  },
  // --- P1-B7: PLANT MILKS & VEGGIE SIDES ---
  // These culinary foods had no live-swap resolution: the milks mis-resolved through the
  // Arabic keyword fallback (oat milk -> dry oats, ~13x protein error) and the veggie sides
  // resolved to nothing. Milks follow the registry's own milk convention (protein primary,
  // like SKIM_MILK / LACTOSE_FREE_MILK); the live energy/family rules still gate absurd
  // portions. Primaries are the culinary densities, not new numbers.
  {
    food_code: "OAT_MILK",
    name_ar: "حليب شوفان غير محلى",
    name_en: "Unsweetened Oat Milk",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.MAIN_MEAL, MealTimeCategory.SNACK]),
    grams_per_household_unit: 240,
    unit_label_ar: "كوب حليب شوفان",
    unit_label_en: "Cup Oat Milk",
  },
  {
    food_code: "RICE_MILK",
    name_ar: "حليب أرز غير محلى",
    name_en: "Unsweetened Rice Milk",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.MAIN_MEAL, MealTimeCategory.SNACK]),
    grams_per_household_unit: 240,
    unit_label_ar: "كوب حليب أرز",
    unit_label_en: "Cup Rice Milk",
  },
  {
    food_code: "ALMOND_MILK_UNSWEETENED",
    name_ar: "حليب لوز غير محلى",
    name_en: "Unsweetened Almond Milk",
    macro_type: FoodMacroType.PROTEIN_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.BREAKFAST, MealTimeCategory.MAIN_MEAL, MealTimeCategory.SNACK]),
    grams_per_household_unit: 240,
    unit_label_ar: "كوب حليب لوز",
    unit_label_en: "Cup Almond Milk",
  },
  {
    food_code: "MEDITERRANEAN_SALAD",
    name_ar: "طبق سلطة خضراء طازجة",
    name_en: "Fresh Mediterranean Green Salad",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.MAIN_MEAL, MealTimeCategory.SNACK]),
    grams_per_household_unit: 150,
    unit_label_ar: "طبق سلطة متوسط",
    unit_label_en: "Medium Salad Bowl",
  },
  {
    food_code: "SAUTEED_VEGGIES",
    name_ar: "طبق خضار سوتيه",
    name_en: "Sautéed Garden Veggies",
    macro_type: FoodMacroType.CARBOHYDRATE_DOMINANT,
    meal_categories: Object.freeze([MealTimeCategory.MAIN_MEAL, MealTimeCategory.SNACK]),
    grams_per_household_unit: 150,
    unit_label_ar: "طبق خضار سوتيه متوسط",
    unit_label_en: "Medium Sautéed Veggies Bowl",
  },
];
// P2-C2: densities are NOT literals. Each entry's primary nutrient is filled from
// the one canonical food table at import time (protein, carb, or fat per the entry's
// macro_type), so a fix in the canonical table reaches swap ranking and portions.
// Names, meal categories, household units, and labels stay here: they are swap
// display metadata, not nutritional data. An entry with no canonical row fails the
// import loudly instead of ranking on a stale density.
const PRIMARY_NUTRIENT_KEY = {
  PROTEIN_DOMINANT: "protein_g",
  CARBOHYDRATE_DOMINANT: "carbohydrate_g",
  FAT_DOMINANT: "fat_g",
};
for (const entry of SMART_SWAP_REGISTRY_ENTRIES) {
  const macros = canonicalMacros(entry.food_code);
  const key = PRIMARY_NUTRIENT_KEY[entry.macro_type];
  if (!macros || !key) {
    throw new Error("canonical-food-table: no canonical density for registry code " + entry.food_code);
  }
  entry.primary_nutrient_per_100g = macros[key];
}

export const SMART_SWAP_REGISTRY = Object.freeze(SMART_SWAP_REGISTRY_ENTRIES);

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
