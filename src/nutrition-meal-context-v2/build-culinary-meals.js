import { getFoodClinicalProperties } from "../execution-engines/food-swap-engine.js";
import { CLINICAL_GUIDELINES } from "../config/clinical-guidelines.js";
import { dislikedFoodCodes } from "../intake-decision-engine/adapters/disliked-foods.js";
import { isEquivalentSwap, sharesSwapFamily, isNoSwapFood, NO_SWAP_NOTE_AR } from "../../frontend/src/utils/swapExchangeRules.js";

/**
 * Advanced Contextual Culinary Meal Archetype, Dynamic Fat Offset & Extreme Edge-Case Engine
 * 
 * Supports:
 * 1. Vegan + Soy-Free + Nut-Free (Pea & Rice Protein Isolate, Mixed Legumes, Chia/Hemp Seeds).
 * 2. Gout & High Uric Acid (Purine restriction: Zero Red Meat, Zero Organ Meat, Zero Seafood/Tuna/Lentils).
 * 3. Intermittent Fasting (2 Large Meals with Multi-Component Protein Pairing).
 * 4. Post-Gastric Sleeve Bariatric Pouch (5-6 Mini-Meals, Portion <= 150-180g, High Protein Density).
 * 5. Lactating Mothers (Gluten-Free, Dairy-Free, +450 kcal milk preservation).
 * 6. Shift Workers & Low-Budget Economic Staples (Whole eggs, Cottage cheese, Chicken breast, Potatoes, Baladi bread).
 * 7. Dynamic Fat Offset & Sanity Caps (Deducting olive oil for fatty proteins, capping meats at 200-220g).
 */

export const FoodFatTier = Object.freeze({
  LEAN: "LEAN",       // <= 3g fat / 100g
  MODERATE: "MODERATE", // 4 - 6g fat / 100g
  FATTY: "FATTY",     // >= 7g fat / 100g
});

export const FOOD_SWAP_DATABASE = Object.freeze({
  // --- ANIMAL PROTEIN SOURCES ---
  CHICKEN_BREAST: {
    code: "CHICKEN_BREAST",
    name_ar: "صدور دجاج متبلة مشوية على الجريل",
    name_en: "Grilled Chicken Breast",
    protein_per_100g: 31,
    carb_per_100g: 0,
    fat_per_100g: 3.6,
    kcal_per_100g: 165,
    fat_tier: FoodFatTier.LEAN,
    unit_label: "جم وزن مطبوخ (حجم كف اليد)",
    category: "PROTEIN",
    is_gluten_free: true,
    is_dairy_free: true,
    is_fish_free: true,
    is_economic: true,
    is_gout_safe: true,
  },
  LEAN_BEEF: {
    code: "LEAN_BEEF",
    name_ar: "لحم بقري مفروم/ستيك قليل الدسم (95/5)",
    name_en: "Lean Beef (95/5)",
    protein_per_100g: 26.3,
    carb_per_100g: 0,
    fat_per_100g: 6.8,
    kcal_per_100g: 174,
    fat_tier: FoodFatTier.MODERATE,
    unit_label: "جم مطبوخ (حجم كف اليد)",
    category: "PROTEIN",
    is_gluten_free: true,
    is_dairy_free: true,
    is_fish_free: true,
    is_economic: false,
    is_gout_safe: false, // High purine
  },
  TILAPIA_FISH: {
    code: "TILAPIA_FISH",
    name_ar: "سمك فيليه أبيض مشوي (بلطي/قشر بياض)",
    name_en: "Grilled White Fish Fillet",
    protein_per_100g: 26.2,
    carb_per_100g: 0,
    fat_per_100g: 2.7,
    kcal_per_100g: 128,
    fat_tier: FoodFatTier.LEAN,
    unit_label: "جم مطبوخ",
    category: "PROTEIN",
    is_gluten_free: true,
    is_dairy_free: true,
    is_fish: true,
    is_economic: true,
    is_gout_safe: false,
  },
  SALMON_FISH: {
    code: "SALMON_FISH",
    name_ar: "سمك سلمون مشوي غني بالأوميجا 3",
    name_en: "Grilled Atlantic Salmon",
    protein_per_100g: 22.1,
    carb_per_100g: 0,
    fat_per_100g: 12.4,
    kcal_per_100g: 206,
    fat_tier: FoodFatTier.FATTY,
    unit_label: "جم مطبوخ",
    category: "PROTEIN",
    is_gluten_free: true,
    is_dairy_free: true,
    is_fish: true,
    is_economic: false,
    is_gout_safe: false,
  },
  CANNED_TUNA: {
    code: "CANNED_TUNA",
    name_ar: "تونة لايت قطع مصفاة بالليمون والكمون",
    name_en: "Canned Tuna in Water (Drained)",
    protein_per_100g: 19.4,
    carb_per_100g: 0,
    fat_per_100g: 1,
    kcal_per_100g: 86,
    fat_tier: FoodFatTier.LEAN,
    unit_label: "جم مصفى (علبة إلى علبة ونصف)",
    category: "PROTEIN",
    is_gluten_free: true,
    is_dairy_free: true,
    is_fish: true,
    is_economic: true,
    is_gout_safe: false, // High purine
  },
  COTTAGE_CHEESE: {
    code: "COTTAGE_CHEESE",
    name_ar: "جبن قريش طبيعي متبل بزيت الزيتون والزعتر",
    name_en: "Natural Cottage Cheese with Olive Oil",
    protein_per_100g: 10.5,
    carb_per_100g: 4.8,
    fat_per_100g: 2.3,
    kcal_per_100g: 81,
    fat_tier: FoodFatTier.LEAN,
    unit_label: "جم (كوب متوسط)",
    category: "PROTEIN",
    is_gluten_free: true,
    is_dairy: true,
    is_fish_free: true,
    is_economic: true,
    is_gout_safe: true,
  },
  EGGS_OMELETTE: {
    code: "EGGS_OMELETTE",
    name_ar: "بيض كامل مسلوق أو أومليت بالخضار (كامل بدون هدر الصفار)",
    name_en: "Whole Eggs (Boiled / Omelette)",
    protein_per_100g: 10.6,
    carb_per_100g: 0.6,
    fat_per_100g: 11.7,
    kcal_per_100g: 154,
    fat_tier: FoodFatTier.FATTY,
    unit_label: "2 إلى 3 بيضات كاملة",
    category: "PROTEIN",
    is_gluten_free: true,
    is_dairy_free: true,
    is_fish_free: true,
    is_economic: true,
    is_gout_safe: true,
  },
  SMOKED_TURKEY: {
    code: "SMOKED_TURKEY",
    name_ar: "شرائح صدور رومي مدخن فاخرة",
    name_en: "Smoked Turkey Breast Slices",
    protein_per_100g: 14.8,
    carb_per_100g: 2.2,
    fat_per_100g: 3.8,
    kcal_per_100g: 106,
    fat_tier: FoodFatTier.LEAN,
    unit_label: "جم (3-4 شرائح)",
    category: "PROTEIN",
    is_gluten_free: true,
    is_dairy_free: true,
    is_fish_free: true,
    is_economic: false,
    is_gout_safe: false,
  },
  GREEK_YOGURT: {
    code: "GREEK_YOGURT",
    name_ar: "زبادي يوناني طبيعي عالي البروتين",
    name_en: "Non-fat Greek Yogurt",
    protein_per_100g: 10.2,
    carb_per_100g: 3.6,
    fat_per_100g: 0.4,
    kcal_per_100g: 59,
    fat_tier: FoodFatTier.LEAN,
    unit_label: "جم (علبة 170 جم)",
    category: "PROTEIN",
    is_gluten_free: true,
    is_dairy: true,
    is_fish_free: true,
    is_economic: false,
    is_gout_safe: true,
  },
  WHEY_PROTEIN: {
    code: "WHEY_PROTEIN",
    name_ar: "سكوب واي بروتين معزول (Whey Isolate)",
    name_en: "Whey Protein Isolate Scoop",
    protein_per_100g: 80,
    carb_per_100g: 3,
    fat_per_100g: 1.5,
    kcal_per_100g: 360,
    fat_tier: FoodFatTier.LEAN,
    unit_label: "سكوب (30 جم)",
    category: "PROTEIN",
    is_gluten_free: true,
    is_dairy: true,
    is_fish_free: true,
    is_economic: false,
    is_gout_safe: true,
  },

  // --- VEGAN PLANT-BASED PROTEIN SOURCES (SOY-FREE & NUT-FREE) ---
  PEA_RICE_PROTEIN_POWDER: {
    code: "PEA_RICE_PROTEIN_POWDER",
    name_ar: "سكوب بروتين نباتي معزول من البازلاء والأرز (Plant Protein Isolate)",
    name_en: "Organic Pea & Rice Protein Isolate Scoop",
    protein_per_100g: 80,
    carb_per_100g: 3,
    fat_per_100g: 1.5,
    kcal_per_100g: 350,
    fat_tier: FoodFatTier.LEAN,
    unit_label: "1 سكوب (30 جم) مع ماء أو حليب الشوفان",
    category: "PROTEIN",
    is_vegan: true,
    is_gluten_free: true,
    is_dairy_free: true,
    is_soy_free: true,
    is_nut_free: true,
    is_fish_free: true,
    is_economic: false,
    is_gout_safe: true,
  },
  MIXED_LEGUMES_STEW: {
    code: "MIXED_LEGUMES_STEW",
    name_ar: "يخنة البقوليات المشكلة (حمص، عدس بني، فاصوليا حمراء متبلة بالكمون وزيت الزيتون)",
    name_en: "Mixed Legumes Stew (Chickpeas, Brown Lentils, Red Kidney Beans)",
    protein_per_100g: 9,
    carb_per_100g: 20,
    fat_per_100g: 1.5,
    kcal_per_100g: 130,
    fat_tier: FoodFatTier.LEAN,
    unit_label: "جم مطبوخ (طبق عميق متبل)",
    category: "PROTEIN",
    is_vegan: true,
    is_gluten_free: true,
    is_dairy_free: true,
    is_soy_free: true,
    is_nut_free: true,
    is_fish_free: true,
    is_economic: true,
    is_gout_safe: false, // High purine
    is_legume: true,
  },

  // --- CARBOHYDRATE SOURCES ---
  BASMATI_RICE: {
    code: "BASMATI_RICE",
    name_ar: "أرز بسمتي أبيض أو حبة طويلة مطبوخ",
    name_en: "Cooked Basmati Rice",
    protein_per_100g: 2.7,
    carb_per_100g: 28.2,
    fat_per_100g: 0.3,
    kcal_per_100g: 130,
    unit_label: "جم مطبوخ (6-8 ملاعق طعام كبيرة)",
    category: "CARBS",
    meal_suitability: ["LUNCH", "DINNER"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  // Gluten-free, low glycemic savory starch (USDA FoodData Central, quinoa, cooked; the web list's code).
  COOKED_QUINOA: {
    code: "COOKED_QUINOA",
    name_ar: "كينوا مسلوقة",
    name_en: "Cooked Quinoa",
    protein_per_100g: 4.4,
    carb_per_100g: 21.3,
    fat_per_100g: 1.9,
    kcal_per_100g: 120,
    unit_label: "جم مسلوقة (4-6 ملاعق طعام كبيرة)",
    category: "CARBS",
    meal_suitability: ["BREAKFAST", "LUNCH", "DINNER"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: false,
    is_gout_safe: true,
  },
  ROASTED_POTATOES: {
    code: "ROASTED_POTATOES",
    name_ar: "بطاطس ودجز مشوية بالأعشاب في الإيرفراير",
    name_en: "Air-Fryer Herb Roasted Potatoes",
    protein_per_100g: 2.5,
    carb_per_100g: 21.2,
    fat_per_100g: 0.1,
    kcal_per_100g: 93,
    unit_label: "جم (ثمرة ونصف متوسطة)",
    category: "CARBS",
    meal_suitability: ["BREAKFAST", "LUNCH", "DINNER"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  SWEET_POTATO: {
    code: "SWEET_POTATO",
    name_ar: "بطاطا حلوة مشوية في الفرن",
    name_en: "Baked Sweet Potato",
    protein_per_100g: 2,
    carb_per_100g: 20.7,
    fat_per_100g: 0.2,
    kcal_per_100g: 90,
    unit_label: "جم (ثمرة متوسطة)",
    category: "CARBS",
    meal_suitability: ["BREAKFAST", "LUNCH", "DINNER", "SNACK"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  WHOLE_WHEAT_PASTA: {
    code: "WHOLE_WHEAT_PASTA",
    name_ar: "مكرونة مسلوقة (قمح كامل)",
    name_en: "Cooked Whole Wheat Pasta",
    protein_per_100g: 6,
    carb_per_100g: 30.1,
    fat_per_100g: 1.7,
    kcal_per_100g: 149,
    unit_label: "جم مطبوخ (5-6 ملاعق طعام)",
    category: "CARBS",
    meal_suitability: ["LUNCH", "DINNER"],
    is_gluten_free: false,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  BALADI_BREAD: {
    code: "BALADI_BREAD",
    name_ar: "خبز بلدي مصري بالردة (قمح كامل)",
    name_en: "Egyptian Baladi Bread",
    protein_per_100g: 9,
    carb_per_100g: 52,
    fat_per_100g: 1.2,
    kcal_per_100g: 260,
    unit_label: "رغيف متوسط (85-90 جم)",
    category: "CARBS",
    meal_suitability: ["BREAKFAST", "DINNER", "LUNCH"],
    is_gluten_free: false,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  BROWN_TOAST: {
    code: "BROWN_TOAST",
    name_ar: "توست بني قمح كامل الحبوب",
    name_en: "Whole Grain Brown Toast",
    protein_per_100g: 12.5,
    carb_per_100g: 42.7,
    fat_per_100g: 3.5,
    kcal_per_100g: 252,
    unit_label: "شرائح توست (3 شرائح = 85 جم)",
    category: "CARBS",
    meal_suitability: ["BREAKFAST", "DINNER"],
    is_gluten_free: false,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  ROLLED_OATS: {
    code: "ROLLED_OATS",
    name_ar: "شوفان كامل الحبة (مطبوخ بالماء أو حليب الشوفان)",
    name_en: "Whole Rolled Oats",
    protein_per_100g: 13.5,
    carb_per_100g: 68.7,
    fat_per_100g: 5.9,
    kcal_per_100g: 379,
    unit_label: "جم جاف (6-7 ملاعق طعام)",
    category: "CARBS",
    meal_suitability: ["BREAKFAST", "SNACK"],
    is_gluten_free: false,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },

  // --- HEALTHY FATS & FLAVOR ---

  // --- REGIONAL GCC & EGYPT PROTEINS ---
  LABNEH_LIGHT: {
    code: "LABNEH_LIGHT",
    name_ar: "لبنة لايت قليلة الدسم بالزعتر وزيت الزيتون",
    name_en: "Low-Fat Labneh with Thyme",
    protein_per_100g: 10,
    carb_per_100g: 4,
    fat_per_100g: 5,
    kcal_per_100g: 101,
    fat_tier: FoodFatTier.MODERATE,
    unit_label: "جم (3-4 ملاعق طعام كبيرة)",
    category: "PROTEIN",
    meal_suitability: ["BREAKFAST", "DINNER", "SNACK"],
    is_gluten_free: true,
    is_dairy: true,
    is_fish_free: true,
    is_economic: true,
    is_gout_safe: true,
  },
  HALLOUMI_LIGHT: {
    code: "HALLOUMI_LIGHT",
    name_ar: "جبن حلوم لايت مشوي قليل الدسم والصوديوم",
    name_en: "Grilled Light Halloumi Cheese",
    protein_per_100g: 22,
    carb_per_100g: 2,
    fat_per_100g: 10,
    kcal_per_100g: 186,
    fat_tier: FoodFatTier.FATTY,
    unit_label: "جم (شريحتان مشويتان)",
    category: "PROTEIN",
    meal_suitability: ["BREAKFAST", "DINNER"],
    is_gluten_free: true,
    is_dairy: true,
    is_fish_free: true,
    is_economic: false,
    is_gout_safe: true,
  },
  LABAN_RAYEB_LOWFAT: {
    code: "LABAN_RAYEB_LOWFAT",
    name_ar: "لبن رائب قليل الدسم (مراعي / نادك / الصافي)",
    name_en: "Low-Fat Laban Rayeb Drink",
    protein_per_100g: 3.3,
    carb_per_100g: 4.8,
    fat_per_100g: 1.1,
    kcal_per_100g: 40,
    fat_tier: FoodFatTier.LEAN,
    unit_label: "مل (كوب متوسط 200 مل)",
    category: "PROTEIN",
    meal_suitability: ["BREAKFAST", "DINNER", "SNACK"],
    is_gluten_free: true,
    is_dairy: true,
    is_fish_free: true,
    is_economic: true,
    is_gout_safe: true,
  },
  HAMOUR_FISH: {
    code: "HAMOUR_FISH",
    name_ar: "سمك هامور خليجي طازج مشوي بالتوابل والليمون",
    name_en: "Fresh Grilled Hamour Fish (Grouper)",
    protein_per_100g: 24.8,
    carb_per_100g: 0,
    fat_per_100g: 1.3,
    kcal_per_100g: 118,
    fat_tier: FoodFatTier.LEAN,
    unit_label: "جم مطبوخ (قطعة فيليه)",
    category: "PROTEIN",
    meal_suitability: ["LUNCH", "DINNER"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_fish: true,
    is_economic: false,
    is_gout_safe: false,
  },
  KANAAD_KINGFISH: {
    code: "KANAAD_KINGFISH",
    name_ar: "سمك كنعد / شعري خليجي مشوي غني بالأوميجا 3",
    name_en: "Grilled Kingfish (Kanaad / Sherry)",
    protein_per_100g: 26,
    carb_per_100g: 0,
    fat_per_100g: 2.6,
    kcal_per_100g: 134,
    fat_tier: FoodFatTier.MODERATE,
    unit_label: "جم مطبوخ (شريحة ستيك كنعد)",
    category: "PROTEIN",
    meal_suitability: ["LUNCH", "DINNER"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_fish: true,
    is_economic: false,
    is_gout_safe: false,
  },
  BOURI_FISH: {
    code: "BOURI_FISH",
    name_ar: "سمك بوري مصري مشوي بالردة والليمون",
    name_en: "Egyptian Grilled Bouri Fish",
    protein_per_100g: 24.8,
    carb_per_100g: 0,
    fat_per_100g: 4.9,
    kcal_per_100g: 150,
    fat_tier: FoodFatTier.MODERATE,
    unit_label: "جم لحم سمك مشوي صافي",
    category: "PROTEIN",
    meal_suitability: ["LUNCH", "DINNER"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_fish: true,
    is_economic: true,
    is_gout_safe: false,
  },
  CAMEL_MEAT_LEAN: {
    code: "CAMEL_MEAT_LEAN",
    name_ar: "لحم حاشي (إبل) هبرة خالي الشحم متبل بالبهارات العربية",
    name_en: "Extra Lean Camel Meat (Hashi)",
    protein_per_100g: 28,
    carb_per_100g: 0,
    fat_per_100g: 3,
    kcal_per_100g: 140,
    fat_tier: FoodFatTier.LEAN,
    unit_label: "جم مطبوخ (قطع هبرة بدون شحم)",
    category: "PROTEIN",
    meal_suitability: ["LUNCH", "DINNER"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_fish_free: true,
    is_economic: true,
    is_gout_safe: false,
  },
  FOUL_MUDAMMAS: {
    code: "FOUL_MUDAMMAS",
    name_ar: "فول مدمس متبل بالليمون والكمون وزيت الزيتون",
    name_en: "Seasoned Foul Mudammas (Fava Beans)",
    protein_per_100g: 8,
    carb_per_100g: 18,
    fat_per_100g: 2,
    kcal_per_100g: 122,
    fat_tier: FoodFatTier.LEAN,
    unit_label: "جم مطبوخ (طبق فول متبل)",
    category: "PROTEIN",
    meal_suitability: ["BREAKFAST", "DINNER"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: false,
    is_legume: true,
    is_fava: true,
  },
  LUPINI_BEANS: {
    code: "LUPINI_BEANS",
    name_ar: "ترمس مسلوق بالليمون والكمون (سناك عالي البروتين والألياف)",
    name_en: "Boiled Lupini Beans with Lemon & Cumin",
    protein_per_100g: 15.6,
    carb_per_100g: 9.9,
    fat_per_100g: 2.9,
    kcal_per_100g: 119,
    fat_tier: FoodFatTier.LEAN,
    unit_label: "جم مسلوق (كوب تسالي بروتيني)",
    category: "PROTEIN",
    meal_suitability: ["SNACK", "BREAKFAST", "DINNER"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: false, // High-purine legume, unsafe in gout
    is_legume: true,
  },
  SHAKSHOUKA_EGGS: {
    code: "SHAKSHOUKA_EGGS",
    name_ar: "بيض شكشوكة بالخضار والطماطم وزيت الزيتون",
    name_en: "Traditional Arabic Shakshouka Eggs",
    protein_per_100g: 11,
    carb_per_100g: 3,
    fat_per_100g: 8,
    kcal_per_100g: 128,
    fat_tier: FoodFatTier.FATTY,
    unit_label: "طبق شكشوكة (2-3 بيضات بالخضار)",
    category: "PROTEIN",
    meal_suitability: ["BREAKFAST", "DINNER"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_fish_free: true,
    is_economic: true,
    is_gout_safe: true,
  },

  // --- REGIONAL GCC & EGYPT CARBS ---
  TAMEES_BREAD_WHOLEWHEAT: {
    code: "TAMEES_BREAD_WHOLEWHEAT",
    name_ar: "خبز تميس بر أسمر بالنخالة (مخبوز حجري)",
    name_en: "Whole Wheat Tamees Bread",
    protein_per_100g: 9.8,
    carb_per_100g: 55.9,
    fat_per_100g: 1.7,
    kcal_per_100g: 262,
    unit_label: "جم (ربع إلى نصف رغيف تميس بر)",
    category: "CARBS",
    meal_suitability: ["BREAKFAST", "DINNER"],
    is_gluten_free: false,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  SAJ_BREAD_WHOLEWHEAT: {
    code: "SAJ_BREAD_WHOLEWHEAT",
    name_ar: "خبز صاج بر / رقاق أسمر خفيف",
    name_en: "Whole Wheat Saj / Markouk Bread",
    protein_per_100g: 9.8,
    carb_per_100g: 55.9,
    fat_per_100g: 1.7,
    kcal_per_100g: 262,
    unit_label: "جم (رغيف صاج كبير خفيف = 50 جم)",
    category: "CARBS",
    meal_suitability: ["BREAKFAST", "DINNER"],
    is_gluten_free: false,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  EGYPTIAN_RICE: {
    code: "EGYPTIAN_RICE",
    name_ar: "أرز مصري مطبوخ بالشعرية الخفيفة",
    name_en: "Cooked Egyptian Rice",
    protein_per_100g: 2.4,
    carb_per_100g: 28.7,
    fat_per_100g: 0.2,
    kcal_per_100g: 130,
    unit_label: "جم مطبوخ (6-8 ملاعق كبيرة)",
    category: "CARBS",
    meal_suitability: ["LUNCH", "DINNER"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  KABSA_SPICED_RICE: {
    code: "KABSA_SPICED_RICE",
    name_ar: "أرز بسمتي نثري بنكهة الكبسة/البخاري خفيف الزيت",
    name_en: "Lightly Spiced Kabsa Basmati Rice",
    protein_per_100g: 2.9,
    carb_per_100g: 28,
    fat_per_100g: 1.2,
    kcal_per_100g: 134,
    unit_label: "جم مطبوخ (6-8 ملاعق طعام كبيرة)",
    category: "CARBS",
    meal_suitability: ["LUNCH", "DINNER"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  DATES_KHALAS: {
    code: "DATES_KHALAS",
    name_ar: "تمر خلاص / سكري / عجوة فاخر (طاقة طبيعية قبل التمرين)",
    name_en: "Saudi Dates (Khalas / Sukkari / Ajwa)",
    protein_per_100g: 2.5,
    carb_per_100g: 75,
    fat_per_100g: 0.4,
    kcal_per_100g: 282,
    unit_label: "حبات تمر (الحبة ~7-8 جم = 20-22 سعرة)",
    category: "CARBS",
    meal_suitability: ["SNACK", "BREAKFAST"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },


  // --- FRUITS & PRE-WORKOUT SNACKS ---
  BANANA_FRESH: {
    code: "BANANA_FRESH",
    name_ar: "موز طازج (طاقة سريعة قبل التمرين)",
    name_en: "Fresh Banana",
    protein_per_100g: 0.7,
    carb_per_100g: 23,
    fat_per_100g: 0.3,
    kcal_per_100g: 88,
    unit_label: "حبة موز متوسطة (~100 جم = 23 جم كارب)",
    category: "CARBS",
    meal_suitability: ["SNACK", "BREAKFAST"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  APPLE_FRESH: {
    code: "APPLE_FRESH",
    name_ar: "تفاح أحمر / أخضر طازج غني بألياف البكتين للشبع",
    name_en: "Fresh Crisp Apple",
    protein_per_100g: 0.3,
    carb_per_100g: 13.8,
    fat_per_100g: 0.2,
    kcal_per_100g: 52,
    unit_label: "ثمرة تفاح متوسطة (~140 جم = 19 جم كارب)",
    category: "CARBS",
    meal_suitability: ["SNACK", "BREAKFAST"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  STRAWBERRY_FRESH: {
    code: "STRAWBERRY_FRESH",
    name_ar: "فراولة / توتيات طازجة (حجم شبع ضخم وأقل سعرات)",
    name_en: "Fresh Strawberries / Berries",
    protein_per_100g: 0.7,
    carb_per_100g: 7.7,
    fat_per_100g: 0.3,
    kcal_per_100g: 32,
    unit_label: "جم (طبق فراولة كبير 200 جم = 16 جم كارب، 66 سعرة)",
    category: "CARBS",
    meal_suitability: ["SNACK", "BREAKFAST"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  WATERMELON_FRESH: {
    code: "WATERMELON_FRESH",
    name_ar: "بطيخ صيفي منعش (ترطيب فائق ومؤشر إشباع عالي)",
    name_en: "Fresh Summer Watermelon",
    protein_per_100g: 0.6,
    carb_per_100g: 7.6,
    fat_per_100g: 0.2,
    kcal_per_100g: 30,
    unit_label: "جم مكعبات بطيخ (شريحة كبيرة 250 جم = 18 جم كارب)",
    category: "CARBS",
    meal_suitability: ["SNACK", "BREAKFAST"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  ORANGE_FRESH: {
    code: "ORANGE_FRESH",
    name_ar: "برتقال / يوسفي طازج غني بفيتامين C والألياف",
    name_en: "Fresh Orange / Tangerine",
    protein_per_100g: 0.9,
    carb_per_100g: 11.8,
    fat_per_100g: 0.1,
    kcal_per_100g: 47,
    unit_label: "ثمرة برتقال متوسطة (~150 جم = 18 جم كارب)",
    category: "CARBS",
    meal_suitability: ["SNACK", "BREAKFAST"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },

  // --- VOLUME EATING & HEALTHY CRUNCH SNACKS ---
  AIR_POPPED_POPCORN: {
    code: "AIR_POPPED_POPCORN",
    name_ar: "فشار ذرة محضر بالهواء الساخن / رذاذ زيت خفيف (سناك حجم عملاق)",
    name_en: "Air-Popped Whole Grain Popcorn",
    protein_per_100g: 12.9,
    carb_per_100g: 77.8,
    fat_per_100g: 4.5,
    kcal_per_100g: 387,
    unit_label: "جم جاف (25 جم حبوب تصنع بولة فشار ضخمة مشبعة = 18 جم كارب، 95 سعرة)",
    category: "CARBS",
    meal_suitability: ["SNACK"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  RICE_CAKES: {
    code: "RICE_CAKES",
    name_ar: "كعك الأرز المقرمش (Rice Cakes / رايس كيك)",
    name_en: "Crispy Rice Cakes",
    protein_per_100g: 8.2,
    carb_per_100g: 81.5,
    fat_per_100g: 2.8,
    kcal_per_100g: 387,
    unit_label: "أقراص رايس كيك (القرص ~9 جم = 7.5 جم كارب، 35 سعرة)",
    category: "CARBS",
    meal_suitability: ["SNACK", "BREAKFAST"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },

  // --- REGIONAL HEALTHY FATS & COOKING FATS ---
  RAW_TAHINI: {
    code: "RAW_TAHINI",
    is_sesame_free: false,
    name_ar: "طحينة سمسم خام نقية 100% (غنية بالكالسيوم والدهون المفيدة)",
    name_en: "Pure 100% Sesame Tahini",
    protein_per_100g: 17.0,
    carb_per_100g: 21.2,
    fat_per_100g: 53.8,
    kcal_per_100g: 595,
    unit_label: "ملعقة طعام كبيرة (15 جم = 8 جم دهون صحية)",
    category: "FATS",
    meal_suitability: ["BREAKFAST", "LUNCH", "DINNER"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  FRESH_AVOCADO: {
    code: "FRESH_AVOCADO",
    name_ar: "أفوكادو طازج (دهون أحادية غير مشبعة وألياف ذائبة)",
    name_en: "Fresh Hass Avocado",
    protein_per_100g: 2.0,
    carb_per_100g: 8.5,
    fat_per_100g: 14.7,
    kcal_per_100g: 160,
    unit_label: "جم (نصف ثمرة أفوكادو متوسطة = 75 جم)",
    category: "FATS",
    meal_suitability: ["BREAKFAST", "DINNER", "SNACK"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: false,
    is_gout_safe: true,
  },
  NATURAL_BUTTER_GHEE: {
    code: "NATURAL_BUTTER_GHEE",
    name_ar: "سمن بلدي فلاحي / زبدة طبيعية نيوزيلندي (بديل دهون الطهي الشرقي)",
    name_en: "Pure Grass-Fed Ghee / Natural Butter",
    protein_per_100g: 0.3,
    carb_per_100g: 0,
    fat_per_100g: 99.5,
    kcal_per_100g: 876,
    unit_label: "ملعقة صغيرة (5-10 جم حسب حصة دهون الوجبة)",
    category: "FATS",
    meal_suitability: ["BREAKFAST", "LUNCH", "DINNER"],
    is_gluten_free: true,
    is_dairy: true,
    is_economic: true,
    is_gout_safe: true,
  },

  DARK_CHOCOLATE_85: {
    code: "DARK_CHOCOLATE_85",
    name_ar: "شوكولاتة داكنة 85% كاكاو (حصة مرونة محسوبة الماكروز)",
    name_en: "85% Dark Chocolate (Flexible IIFYM Slot)",
    protein_per_100g: 7.8,
    carb_per_100g: 45.9,
    fat_per_100g: 42.6,
    kcal_per_100g: 598,
    unit_label: "مكعبات (25 جم = 9 جم كارب، 11.5 جم دهون، 145 سعرة)",
    category: "FATS",
    meal_suitability: ["SNACK", "DINNER"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: false,
    is_gout_safe: true,
  },
  OLIVE_OIL: {
    code: "OLIVE_OIL",
    name_ar: "زيت زيتون بكر ممتاز للطهي أو تتبيل السلطة",
    name_en: "Extra Virgin Olive Oil",
    protein_per_100g: 0,
    carb_per_100g: 0,
    fat_per_100g: 100,
    kcal_per_100g: 884,
    unit_label: "ملعقة طعام كبيرة (10-12 جم)",
    category: "FATS",
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  OAT_MILK: {
    code: "OAT_MILK",
    name_ar: "حليب شوفان عضوي غير محلى (خالي من الصويا والمكسرات)",
    name_en: "Unsweetened Oat Milk",
    protein_per_100g: 1.0,
    carb_per_100g: 6.5,
    fat_per_100g: 1.5,
    kcal_per_100g: 45,
    unit_label: "مل (كوب متوسط)",
    category: "BEVERAGE",
    is_gluten_free: false,
    is_dairy_free: true,
    is_soy_free: true,
    is_nut_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  RICE_MILK: {
    code: "RICE_MILK",
    name_ar: "حليب أرز عضوي غير محلى (خالي من الجلوتين والصويا والمكسرات)",
    name_en: "Unsweetened Rice Milk",
    protein_per_100g: 0.3,
    carb_per_100g: 9.0,
    fat_per_100g: 1.0,
    kcal_per_100g: 47,
    unit_label: "مل (كوب متوسط)",
    category: "BEVERAGE",
    is_gluten_free: true,
    is_dairy_free: true,
    is_soy_free: true,
    is_nut_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  HEMP_CHIA_SEEDS: {
    code: "HEMP_CHIA_SEEDS",
    name_ar: "بذور الشيا وبذور القنب ودوار الشمس المطحونة",
    name_en: "Chia & Hemp Seed Blend",
    protein_per_100g: 16.5,
    carb_per_100g: 42.1,
    fat_per_100g: 30.7,
    kcal_per_100g: 486,
    unit_label: "جم (1-2 ملعقة طعام)",
    category: "FATS",
    is_vegan: true,
    is_gluten_free: true,
    is_dairy_free: true,
    is_soy_free: true,
    is_nut_free: true,
    is_economic: false,
    is_gout_safe: true,
  },
  RAW_ALMONDS: {
    code: "RAW_ALMONDS",
    is_nut_free: false,
    name_ar: "لوز نيء أو مكسرات مشكلة غير مملحة",
    name_en: "Raw Unsalted Almonds / Mixed Nuts",
    protein_per_100g: 21.2,
    carb_per_100g: 21.6,
    fat_per_100g: 49.9,
    kcal_per_100g: 579,
    unit_label: "جم (حوالي 15-20 حبة)",
    category: "FATS",
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: false,
    is_gout_safe: true,
  },
  FREEKEH_COOKED: {
    code: "FREEKEH_COOKED",
    name_ar: "فريك مصري / برغل مسلوق بالبهارات",
    name_en: "Cooked Freekeh / Bulgur",
    protein_per_100g: 5.5,
    carb_per_100g: 31,
    fat_per_100g: 1,
    kcal_per_100g: 150,
    unit_label: "جم مطبوخ (5-7 ملاعق طعام)",
    category: "CARBS",
    meal_suitability: ["LUNCH", "DINNER"],
    is_gluten_free: false,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  SKIM_MILK: {
    code: "SKIM_MILK",
    name_ar: "حليب بقري خالي الدسم 0%",
    name_en: "Skimmed Milk (0% Fat)",
    protein_per_100g: 3.4,
    carb_per_100g: 5,
    fat_per_100g: 0.1,
    kcal_per_100g: 34,
    unit_label: "مل (كوب متوسط 200 مل)",
    category: "BEVERAGE",
    meal_suitability: ["BREAKFAST", "SNACK"],
    is_gluten_free: true,
    is_dairy: true,
    is_dairy_free: false,
    is_low_lactose: false,
    is_economic: true,
    is_gout_safe: true,
  },
  LACTOSE_FREE_MILK: {
    code: "LACTOSE_FREE_MILK",
    name_ar: "حليب بقري خالي من اللاكتوز (لايت / قليل الدسم)",
    name_en: "Lactose-Free Milk (Low-Fat / Skim)",
    protein_per_100g: 3.4,
    carb_per_100g: 4.8,
    fat_per_100g: 0.5,
    kcal_per_100g: 38,
    unit_label: "مل (كوب متوسط 200 مل)",
    category: "BEVERAGE",
    meal_suitability: ["BREAKFAST", "SNACK"],
    is_gluten_free: true,
    is_dairy: true,
    is_dairy_free: false,
    is_low_lactose: true,
    is_economic: true,
    is_gout_safe: true,
  },
  ALMOND_MILK_UNSWEETENED: {
    code: "ALMOND_MILK_UNSWEETENED",
    name_ar: "حليب لوز غير محلى (خالي من السكر واللاكتوز)",
    name_en: "Unsweetened Almond Milk",
    protein_per_100g: 0.5,
    carb_per_100g: 0.3,
    fat_per_100g: 1.1,
    kcal_per_100g: 13,
    unit_label: "مل (كوب متوسط 200 مل)",
    category: "BEVERAGE",
    meal_suitability: ["BREAKFAST", "SNACK"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_nut_free: false,
    is_economic: false,
    is_gout_safe: true,
  },
  LOW_FAT_MOZZARELLA: {
    code: "LOW_FAT_MOZZARELLA",
    name_ar: "جبن موزاريلا طبيعي قليل الدسم لايت",
    name_en: "Part-Skim Mozzarella Cheese",
    protein_per_100g: 24.3,
    carb_per_100g: 2.8,
    fat_per_100g: 15.9,
    kcal_per_100g: 254,
    fat_tier: FoodFatTier.FATTY,
    unit_label: "جم مبشور",
    category: "PROTEIN",
    meal_suitability: ["BREAKFAST", "DINNER"],
    is_gluten_free: true,
    is_dairy: true,
    is_dairy_free: false,
    is_fish_free: true,
    is_economic: false,
    is_gout_safe: true,
  },
  FRESH_GUAVA: {
    code: "FRESH_GUAVA",
    name_ar: "جوافة طازجة غنية بفيتامين C والألياف",
    name_en: "Fresh Guava",
    protein_per_100g: 2.6,
    carb_per_100g: 14.3,
    fat_per_100g: 1,
    kcal_per_100g: 68,
    unit_label: "ثمرة جوافة متوسطة (~100 جم = 14 جم كارب)",
    category: "CARBS",
    meal_suitability: ["SNACK", "BREAKFAST"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  CHIA_SEEDS: {
    code: "CHIA_SEEDS",
    name_ar: "بذور الشيا الطبيعية الكاملة",
    name_en: "Organic Whole Chia Seeds",
    protein_per_100g: 16.5,
    carb_per_100g: 42.1,
    fat_per_100g: 30.7,
    kcal_per_100g: 486,
    unit_label: "ملعقة صغيرة إلى ملعقة طعام ممسوحة (5 - 10 جم)",
    category: "FATS",
    meal_suitability: ["BREAKFAST", "SNACK"],
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },

  // --- VEGETABLES & SALADS ---
  MEDITERRANEAN_SALAD: {
    code: "MEDITERRANEAN_SALAD",
    name_ar: "طبق سلطة خضراء طازجة (خيار، طماطم، جرجير، بقدونس، رشة ليمون)",
    name_en: "Fresh Mediterranean Green Salad",
    protein_per_100g: 1.5,
    carb_per_100g: 3,
    fat_per_100g: 0.2,
    kcal_per_100g: 20,
    unit_label: "طبق سلطة متوسط مشكل",
    category: "VEGGIES",
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
  SAUTEED_VEGGIES: {
    code: "SAUTEED_VEGGIES",
    name_ar: "طبق خضار سوتيه/مشوي (كوسة، بروكلي، جزر، فلفل ألوان)",
    name_en: "Sautéed Garden Veggies",
    protein_per_100g: 2,
    carb_per_100g: 4,
    fat_per_100g: 0.2,
    kcal_per_100g: 25,
    unit_label: "طبق خضار سوتيه متوسط",
    category: "VEGGIES",
    is_gluten_free: true,
    is_dairy_free: true,
    is_vegan: true,
    is_economic: true,
    is_gout_safe: true,
  },
});

/**
 * Evaluates whether a food code is clinically safe given the client's allergen, intolerance,
 * and clinical context (gout, legumes allergy, favism, celiac/gluten, dairy, eggs, etc.).
 */
export function isFoodClinicallySafe(foodCode, allergenContext = {}) {
  const food = FOOD_SWAP_DATABASE[foodCode];
  if (!food) return false;

  if (allergenContext.isVegan && !food.is_vegan) return false;
  if (allergenContext.isDairyExcluded && food.is_dairy) return false;
  if (allergenContext.isEggsExcluded && (foodCode === "EGGS_OMELETTE" || foodCode === "SHAKSHOUKA_EGGS")) return false;
  if (allergenContext.isFishExcluded && food.is_fish) return false;
  if (allergenContext.isPoultryExcluded && (foodCode === "CHICKEN_BREAST" || foodCode === "SMOKED_TURKEY")) return false;
  if (allergenContext.isRedMeatExcluded && (foodCode === "LEAN_BEEF" || foodCode === "CAMEL_MEAT_LEAN")) return false;
  if (allergenContext.isGout && !food.is_gout_safe) return false;
  // Diabetes: high glycemic foods are excluded from the generated meals, by the same classification
  // the swap engine enforces (ADA Standards of Care), so the plan and the swaps agree.
  if (allergenContext.isDiabetic && getFoodClinicalProperties(foodCode, food)?.glycemic_index === "HIGH") return false;
  // Post-bariatric dumping syndrome: no concentrated sugars in the generated meals.
  if (allergenContext.isDumpingSyndrome && (food.is_simple_sugar === true || foodCode.startsWith("DATES_"))) return false;
  if (allergenContext.isLegumesExcluded && food.is_legume) return false;
  if (allergenContext.isFavism && (food.is_fava || food.is_legume || foodCode === "FOUL_MUDAMMAS")) return false;
  if (allergenContext.isGlutenExcluded && !food.is_gluten_free) return false;
  // Nuts, soy and sesame: a food is excluded when it is known to contain the allergen - flagged
  // false, or named for it. The previous rule excluded every food not explicitly certified free,
  // and only five of the fifty-nine foods here carry that certificate, so an allergic client lost
  // bread, rice and chicken alike and every swap list came back empty.
  if (allergenContext.isSoyExcluded && (food.is_soy_free === false || /SOY|TOFU|EDAMAME/.test(foodCode))) return false;
  if (allergenContext.isNutsExcluded && (food.is_nut_free === false || /PEANUT|ALMOND|WALNUT|CASHEW|PISTACHIO|HAZELNUT|NUT_BUTTER|MIXED_NUTS/.test(foodCode))) return false;
  if (allergenContext.isSesameExcluded && (food.is_sesame_free === false || /SESAME|TAHINI/.test(foodCode))) return false;
  if (allergenContext.isHighPotassium && HIGH_POTASSIUM_FOODS.has(foodCode)) return false;
  // Foods the client said they do not like leave the meals and swaps like a restriction does
  // (enforceClinicalSafety labels that replacement as a preference, not a clinical one).
  if (allergenContext.dislikedFoodCodes?.has(foodCode)) return false;

  return true;
}

/**
 * Generates equivalent smart swaps for a given food item with Dynamic Fat Offset
 * and strict allergen, budget, and disease filtering.
 */
export function generateSmartSwaps(category, baseGrams, baseFoodCode, mealContext = "LUNCH", mealOliveOilGrams = 10, allergenContext = {}) {
  const baseFood = FOOD_SWAP_DATABASE[baseFoodCode];
  if (!baseFood || isNoSwapFood(baseFoodCode)) return [];
  // Only a food eaten the same way with close energy and fat, after the oil the swap tells the
  // client to leave out (swapExchangeRules).
  const baseKcal = (baseGrams / 100) * ((baseFood.protein_per_100g || 0) * 4 + (baseFood.carb_per_100g || 0) * 4 + (baseFood.fat_per_100g || 0) * 9);
  const baseFat = (baseGrams / 100) * (baseFood.fat_per_100g || 0);
  return buildSmartSwapCandidates(category, baseGrams, baseFoodCode, mealContext, mealOliveOilGrams, allergenContext).filter((swap) => {
    const oil = (Number(swap.oil_deduction_g) || 0) - (Number(swap.oil_addition_g) || 0);
    return isEquivalentSwap({
      fromCode: baseFoodCode, toCode: swap.food_code,
      fromKcal: baseKcal, toKcal: swap.calories_kcal - oil * 9, fromFat: baseFat, toFat: swap.fat_g - oil,
    });
  });
}

// USDA FoodData Central medium sizes: baked potato ~173 g, baked sweet potato ~114 g.
const MEDIUM_POTATO_G = 173;
const MEDIUM_SWEET_POTATO_G = 114;
/** Number of medium pieces in a portion, to the nearest half (at least a half). */
const mediumPieces = (grams, mediumG) => Math.max(0.5, Math.round((grams / mediumG) * 2) / 2);

/**
 * Every clinically safe candidate for the meal, matched on the main nutrient only. Clients and
 * coaches see generateSmartSwaps (equivalent swaps only); this full list is the last resort when an
 * unsafe template food must be replaced and no equivalent safe swap exists.
 */
function buildSmartSwapCandidates(category, baseGrams, baseFoodCode, mealContext = "LUNCH", mealOliveOilGrams = 10, allergenContext = {}) {
  const baseFood = FOOD_SWAP_DATABASE[baseFoodCode];
  if (!baseFood) return [];

  const baseProtein = (baseGrams / 100) * (baseFood.protein_per_100g || 0);
  const baseCarbs = (baseGrams / 100) * (baseFood.carb_per_100g || 0);
  const baseFat = (baseGrams / 100) * (baseFood.fat_per_100g || 0);

  const swaps = [];

  if (category === "PROTEIN") {
    let proteinCandidates = [];
    if (mealContext === "BREAKFAST" || mealContext === "DINNER") {
      proteinCandidates = [
        "EGGS_OMELETTE",
        "SHAKSHOUKA_EGGS",
        "LABNEH_LIGHT",
        "COTTAGE_CHEESE",
        "HALLOUMI_LIGHT",
        "FOUL_MUDAMMAS",
        "CANNED_TUNA",
        "SMOKED_TURKEY",
        "CHICKEN_BREAST",
        "LUPINI_BEANS",
        "GREEK_YOGURT",
        "LABAN_RAYEB_LOWFAT",
        "PEA_RICE_PROTEIN_POWDER",
        "MIXED_LEGUMES_STEW",
      ];
      // Meat or fish at dinner is swapped like at lunch (the family rule below keeps each kind
      // with its own).
      if (mealContext === "DINNER") {
        proteinCandidates.push("HAMOUR_FISH", "KANAAD_KINGFISH", "TILAPIA_FISH", "BOURI_FISH", "SALMON_FISH", "CAMEL_MEAT_LEAN", "LEAN_BEEF");
      }
    } else if (mealContext === "LUNCH") {
      proteinCandidates = [
        "CHICKEN_BREAST",
        "HAMOUR_FISH",
        "KANAAD_KINGFISH",
        "TILAPIA_FISH",
        "BOURI_FISH",
        "SALMON_FISH",
        "CAMEL_MEAT_LEAN",
        "LEAN_BEEF",
        "CANNED_TUNA",
      ];
    } else {
      // SNACK
      proteinCandidates = [
        "GREEK_YOGURT",
        "LABAN_RAYEB_LOWFAT",
        "LUPINI_BEANS",
        "WHEY_PROTEIN",
        "PEA_RICE_PROTEIN_POWDER",
        "RAW_ALMONDS",
      ];
    }

    for (const code of proteinCandidates) {
      if (code === baseFoodCode) continue;
      const candidate = FOOD_SWAP_DATABASE[code];
      if (!candidate || candidate.protein_per_100g <= 0) continue;

      // Clinical Safety & Allergen Filters
      if (!isFoodClinicallySafe(code, allergenContext)) continue;
      if (allergenContext.isLowBudget && !candidate.is_economic) continue;

      const equivGrams = Math.round((baseProtein / candidate.protein_per_100g) * 100);
      const candidateProtein = Math.round((equivGrams / 100) * candidate.protein_per_100g);
      const candidateCarbs = Math.round((equivGrams / 100) * candidate.carb_per_100g);
      const candidateFat = Math.round((equivGrams / 100) * candidate.fat_per_100g);

      // Dynamic Fat Offset Calculation
      const extraFatG = candidateFat - baseFat;
      let fatOffsetInstruction = "";
      let oilDeductionG = 0;

      let oilAdditionG = 0;
      if (extraFatG >= 4) {
        oilDeductionG = Math.min(mealOliveOilGrams, Math.round(extraFatG));
        fatOffsetInstruction = ` (يُخصم ${oilDeductionG} جم من زيت الزيتون في الوجبة لموازنة الدهون والسعرات)`;
      } else if (extraFatG <= -4) {
        // A leaner swap gets the missing fat as olive oil (lean protein + a fat exchange), the way
        // labneh, cottage cheese or tuna are eaten anyway.
        oilAdditionG = Math.min(MAX_SWAP_OIL_ADDITION_G, Math.round(-extraFatG));
        fatOffsetInstruction = ` (زوّد ${oilAdditionG} جم زيت زيتون عليه لتعويض الدهون)`;
      }

      let householdDesc = `${equivGrams} جم`;
      if (code === "EGGS_OMELETTE") {
        const eggCount = Math.round(equivGrams / 55);
        householdDesc = `${eggCount} بيضات كاملة مسلوقة أو أومليت (${equivGrams} جم)`;
      } else if (code === "SHAKSHOUKA_EGGS") {
        householdDesc = `${equivGrams} جم طبق شكشوكة بالبيض والطماطم والخضار`;
      } else if (code === "LABNEH_LIGHT") {
        const spoons = Math.round(equivGrams / 30);
        householdDesc = `${equivGrams} جم (${spoons} ملاعق طعام كبيرة لبنة لايت بالزعتر)`;
      } else if (code === "HALLOUMI_LIGHT") {
        householdDesc = `${equivGrams} جم (شريحتان حلوم لايت مشوي)`;
      } else if (code === "LABAN_RAYEB_LOWFAT") {
        householdDesc = `${equivGrams} مل (كوب ونصف لبن رائب قليل الدسم)`;
      } else if (code === "FOUL_MUDAMMAS") {
        householdDesc = `${equivGrams} جم (طبق فول مدمس متبل بالليمون والكمون)`;
      } else if (code === "LUPINI_BEANS") {
        householdDesc = `${equivGrams} جم (كوب تسالي ترمس مسلوق متبل)`;
      } else if (code === "CANNED_TUNA") {
        const cans = (equivGrams / 120).toFixed(1);
        householdDesc = `${equivGrams} جم مصفى (~${cans} علبة تونة)`;
      } else if (code === "COTTAGE_CHEESE") {
        householdDesc = `${equivGrams} جم (نصف كوب إلى كوب متبل بالزعتر)`;
      } else if (code === "HAMOUR_FISH" || code === "KANAAD_KINGFISH" || code === "TILAPIA_FISH" || code === "BOURI_FISH" || code === "SALMON_FISH") {
        householdDesc = `${equivGrams} جم مشوي بالتوابل والليمون (حجم كف اليد)`;
      } else if (code === "CAMEL_MEAT_LEAN") {
        householdDesc = `${equivGrams} جم لحم حاشي هبرة خالي الشحم مطبوخ`;
      } else if (code === "CHICKEN_BREAST" || code === "LEAN_BEEF") {
        householdDesc = `${equivGrams} جم مطبوخ (حجم كف اليد)`;
      } else if (code === "PEA_RICE_PROTEIN_POWDER" || code === "WHEY_PROTEIN") {
        householdDesc = `${equivGrams} جم (${(equivGrams / 30).toFixed(1)} سكوب)`;
      }

      householdDesc += fatOffsetInstruction;

      swaps.push({
        food_code: candidate.code,
        name_ar: candidate.name_ar,
        name_en: candidate.name_en,
        equivalent_grams: equivGrams,
        household_desc: householdDesc,
        fat_tier: candidate.fat_tier,
        oil_deduction_g: oilDeductionG,
        oil_addition_g: oilAdditionG,
        protein_g: candidateProtein,
        carb_g: candidateCarbs,
        fat_g: candidateFat,
        calories_kcal: Math.round(candidateProtein * 4 + candidateCarbs * 4 + candidateFat * 9),
      });
    }
  } else if (category === "CARBS") {
    let carbCandidates = [];
    if (mealContext === "BREAKFAST") {
      // Breakfast: Breads, Toast, Potatoes, Sweet potato, Oats, Dates (NO Rice / Pasta)
      carbCandidates = [
        "BALADI_BREAD",
        "TAMEES_BREAD_WHOLEWHEAT",
        "SAJ_BREAD_WHOLEWHEAT",
        "BROWN_TOAST",
        "ROASTED_POTATOES",
        "SWEET_POTATO",
        "COOKED_QUINOA",
        "ROLLED_OATS",
        "DATES_KHALAS",
      ];
    } else if (mealContext === "LUNCH") {
      // Lunch: Basmati, Kabsa, Egyptian rice, Potatoes, Sweet potatoes, Pasta (NO Toast/Oats)
      carbCandidates = [
        "BASMATI_RICE",
        "KABSA_SPICED_RICE",
        "EGYPTIAN_RICE",
        "ROASTED_POTATOES",
        "SWEET_POTATO",
        "COOKED_QUINOA",
        "WHOLE_WHEAT_PASTA",
      ];
    } else if (mealContext === "DINNER") {
      // Dinner: Breads, Saj, Tamees, Potatoes, Sweet Potatoes, Toast, Oats
      carbCandidates = [
        "BALADI_BREAD",
        "TAMEES_BREAD_WHOLEWHEAT",
        "SAJ_BREAD_WHOLEWHEAT",
        "BROWN_TOAST",
        "ROASTED_POTATOES",
        "SWEET_POTATO",
        "COOKED_QUINOA",
        "ROLLED_OATS",
      ];
    } else {
      // Snack: Dates, Sweet Potato, Oats, Fruit
      carbCandidates = [
        "DATES_KHALAS",
        "SWEET_POTATO",
        "ROLLED_OATS",
        "BANANA_FRESH",
        "APPLE_FRESH",
        "FRESH_GUAVA",
        "ORANGE_FRESH",
        "STRAWBERRY_FRESH",
      ];
    }

    for (const code of carbCandidates) {
      if (code === baseFoodCode) continue;
      const candidate = FOOD_SWAP_DATABASE[code];
      if (!candidate || candidate.carb_per_100g <= 0) continue;

      // Every clinical filter applies here, not gluten alone.
      if (!isFoodClinicallySafe(code, allergenContext)) continue;

      const equivGrams = Math.round((baseCarbs / candidate.carb_per_100g) * 100);
      let householdDesc = `${equivGrams} جم`;

      if (code === "BASMATI_RICE" || code === "KABSA_SPICED_RICE" || code === "EGYPTIAN_RICE") {
        const spoons = Math.round(equivGrams / 25);
        householdDesc = `${equivGrams} جم مطبوخ (${spoons} ملاعق طعام كبيرة)`;
      } else if (code === "BALADI_BREAD") {
        const loaves = (equivGrams / 85).toFixed(1);
        householdDesc = `${equivGrams} جم (~${loaves} رغيف بلدي بالردة)`;
      } else if (code === "TAMEES_BREAD_WHOLEWHEAT") {
        householdDesc = `${equivGrams} جم خبز تميس بر`;
      } else if (code === "SAJ_BREAD_WHOLEWHEAT") {
        const loaves = (equivGrams / 50).toFixed(1);
        householdDesc = `${equivGrams} جم (~${loaves} رغيف صاج بر خفيف)`;
      } else if (code === "BROWN_TOAST") {
        const slices = Math.round(equivGrams / 28);
        householdDesc = `${equivGrams} جم (${slices} شرائح توست بني قمح كامل)`;
      } else if (code === "ROASTED_POTATOES") {
        householdDesc = `${equivGrams} جم (حوالي ${mediumPieces(equivGrams, MEDIUM_POTATO_G)} ثمرة متوسطة مشوية بالأعشاب)`;
      } else if (code === "SWEET_POTATO") {
        householdDesc = `${equivGrams} جم مشوية في الفرن (حوالي ${mediumPieces(equivGrams, MEDIUM_SWEET_POTATO_G)} ثمرة متوسطة)`;
      } else if (code === "ROLLED_OATS") {
        const spoons = Math.round(equivGrams / 10);
        householdDesc = `${equivGrams} جم جاف (${spoons} ملاعق طعام كبيرة)`;
      } else if (code === "DATES_KHALAS") {
        const dateCount = Math.round(equivGrams / 8);
        householdDesc = `${equivGrams} جم (${dateCount} حبات تمر خلاص / سكري)`;
      } else if (code === "COOKED_QUINOA") {
        householdDesc = `${equivGrams} جم كينوا مسلوقة (${Math.round(equivGrams / 25)} ملاعق طعام كبيرة)`;
      } else if (code === "WHOLE_WHEAT_PASTA") {
        const spoons = Math.round(equivGrams / 25);
        householdDesc = `${equivGrams} جم مطبوخة (${spoons} ملاعق طعام)`;
      }

      const candidateProtein = Math.round((equivGrams / 100) * candidate.protein_per_100g);
      const candidateCarbs = Math.round((equivGrams / 100) * candidate.carb_per_100g);
      const candidateFat = Math.round((equivGrams / 100) * candidate.fat_per_100g);

      // A starch that brings its own fat (quinoa, oats) leaves that much of the meal's oil out, like
      // a fattier protein swap does (a starch with fat = a starch + a fat exchange).
      const extraCarbSwapFatG = candidateFat - baseFat;
      const carbOilDeductionG = extraCarbSwapFatG >= 4 ? Math.min(mealOliveOilGrams, Math.round(extraCarbSwapFatG)) : 0;
      if (carbOilDeductionG > 0) {
        householdDesc += ` (يُخصم ${carbOilDeductionG} جم من زيت الزيتون في الوجبة لموازنة الدهون والسعرات)`;
      }

      swaps.push({
        food_code: candidate.code,
        name_ar: candidate.name_ar,
        name_en: candidate.name_en,
        equivalent_grams: equivGrams,
        household_desc: householdDesc,
        oil_deduction_g: carbOilDeductionG,
        protein_g: candidateProtein,
        carb_g: candidateCarbs,
        fat_g: candidateFat,
        calories_kcal: Math.round(candidateProtein * 4 + candidateCarbs * 4 + candidateFat * 9),
      });
    }
  }

  return swaps;
}


export const CULINARY_RECIPES_DATABASE = Object.freeze({
  COTTAGE_CHEESE: {
    title_ar: "موس الجبن القريش الكريمي بالزعتر والبابريكا",
    title_en: "Whipped Savory Cottage Cheese Mousse",
    prep_time_ar: "3 دقائق",
    prep_time_minutes: 3,
    prep_options: [
      {
        id: "WHIPPED_SAVORY_CREAM",
        name_ar: "موس القريش الحادق (Whipped Savory Cream)",
        free_ingredients_ar: "ملعقتان ماء دافئ (أو رشة لبن)، رشة زعتر، كمون، بابريكا، ومكعبات خيار وطماطم",
        technique_ar: "خفق بالشوكة أو الخلاط دقيقة حتى يتحول لموس قشطة ناعم مع الخضار والتوابل وزيت الخطة."
      },
      {
        id: "SWEET_DESSERT_MOUSSE",
        name_ar: "موس التشيز كيك الحلو (Sweet Dessert Mousse)",
        free_ingredients_ar: "ملعقتان ماء دافئ، كيس سكر دايت (ستيفيا)، رشة قرفة أو فانيليا سائلة (أو كاكاو خام)",
        technique_ar: "خفق ناعم جداً بالخلاط؛ يتحول إلى قوام دانيت أو بودينغ شيكولاتة/فانيليا عالي البروتين وخالي من السكر."
      },
      {
        id: "SPICY_COTTAGE_SALAD",
        name_ar: "سلطة قريش جبنة قديمة دايت (Spicy Cottage Salad)",
        free_ingredients_ar: "رشة شطة خفيفة، كمون، طماطم مفرومة، فلفل رومي/حار مقطع ناعم مع قطرات ليمون",
        technique_ar: "هرس بالشوكة مع الخضار؛ يعطي طعم وملمس الجبنة المتبلة دون أملاح زائدة أو دهون."
      }
    ],
    ingredients_breakdown: [
      { name_ar: "جبن قريش طبيعي", portion_desc: "150 جم (أو حسب حصة خطتك)" },
      { name_ar: "زيت زيتون بكر ممتاز", portion_desc: "5-10 جم (حصة دهون الوجبة)" },
      { name_ar: "بهارات وتوابل حرة (Zero-Calorie)", portion_desc: "رشة زعتر بري، بابريكا مدخنة، كمون، فلفل أسود" },
      { name_ar: "خضار طازج", portion_desc: "خيار وطماطم مقطعة مكعبات صغيرة" },
    ],
    cooking_instructions: [
      "ضع الجبن القريش في وعاء عميق مع ملعقتين كبيرتين من الماء الدافئ أو اللبن العادي.",
      "اخفق الجبن بالشوكة أو بالهاند بلندر لمدة دقيقة واحدة حتى يتحول قوامه إلى موس كريمي ناعم تماماً كالقشطة.",
      "أضف الزعتر والبابريكا والكمون، ثم وزّع الخضار المقطع واسكب زيت الزيتون المخصص للوجبة على الوجه.",
    ],
    cooking_tip: "السر في ضرب القريش بالماء الدافئ للتخلص من التكتلات وتحويلها لقوام كريمي غني ومحبب للسان.",
  },
  SHAKSHOUKA_EGGS: {
    title_ar: "شكشوكة البيض العربية بالخضار والكمون",
    title_en: "Traditional Arabic Shakshouka Eggs",
    prep_time_ar: "7 دقائق",
    prep_time_minutes: 7,
    ingredients_breakdown: [
      { name_ar: "بيض كامل طازج", portion_desc: "2 إلى 3 بيضات كاملة (حسب الخطة)" },
      { name_ar: "خضار مقطع ناعم", portion_desc: "طماطم، بصل، فلفل أخضر، بقدونس مفروم" },
      { name_ar: "زيت زيتون للطهي", portion_desc: "مسحة خفيفة (3-5 جم من حصة الوجبة)" },
      { name_ar: "بهارات وتوابل حرة", portion_desc: "كمون، بابريكا، فلفل أسود، ورشة ملح خفيف" },
    ],
    cooking_instructions: [
      "في مقلاة غير لاصقة، شوّح البصل والفلفل مع مسحة زيت الزيتون حتى يذبلا قليلاً.",
      "أضف مكعبات الطماطم والكمون والبابريكا والملح، واتركها تتسبك لمدة دقيقتين على نار متوسطة.",
      "اكسر البيض فوق الخضار، وغطّ المقلاة على نار هادئة لمدة 3-4 دقائق حتى ينضج البيض تماماً.",
    ],
    cooking_tip: "استخدم مقلاة جرانيت أو تيفال غير لاصقة لتسوية الشكشوكة بمسحة زيت واحدة دون أي التصاق.",
  },
  EGGS_OMELETTE: {
    title_ar: "أومليت البيض الذهبي الهش بالأعشاب",
    title_en: "Golden Herb & Veggie Omelette",
    prep_time_ar: "5 دقائق",
    prep_time_minutes: 5,
    prep_options: [
      {
        id: "CREAMY_EGG_SALAD",
        name_ar: "سلطة البيض بالخردل والزبادي (Creamy Egg Salad)",
        free_ingredients_ar: "البيض المسلوق المخصص + ملعقة زبادي عادي + نصف ملعقة مستردة خردل + بابريكا وفلفل أسود",
        technique_ar: "هرس بالشوكة وخلط المكونات، وتؤكل بالملعقة أو تفرد داخل رغيف الخبز البلدي/التوست."
      },
      {
        id: "ONE_PAN_SHAKSHOUKA",
        name_ar: "شكشوكة الطاسة السريعة (One-Pan Shakshouka)",
        free_ingredients_ar: "طماطم مقطعة، فلفل أخضر، بصلة صغيرة، رشة كمون وفلفل أسود، مسحة زيت الخطة",
        technique_ar: "تسبيك الخضار في مقلاة دقيقتين، ثم كسر البيض فوقه وتغطيته على نار هادئة حتى ينضج على البخار."
      },
      {
        id: "FLUFFY_CLOUD_OMELETTE",
        name_ar: "الأومليت الهش المرتفع (Fluffy Cloud Omelette)",
        free_ingredients_ar: "ملعقة ماء بارد، رشة كزبرة يابسة، فلفل أسود، ملح خفيف، ومسحة زيت طهي",
        technique_ar: "خفق البيض مع ملعقة ماء بارد قبل الصب؛ يتبخر الماء أثناء الطهي ليمنح الأومليت حجماً مضاعفاً وقواماً إسفنجياً."
      }
    ],
    ingredients_breakdown: [
      { name_ar: "بيض كامل", portion_desc: "2 إلى 3 بيضات كاملة" },
      { name_ar: "بهارات وتوابل حرة", portion_desc: "فلفل أسود، رشة كزبرة يابسة، كمون، ملح بحري خفيف" },
      { name_ar: "زيت زيتون للطهي", portion_desc: "مسحة طهي خفيفة (2-3 جم)" },
      { name_ar: "خضار ورقي جانبي", portion_desc: "جرجير وطماطم كرزية طازجة" },
    ],
    cooking_instructions: [
      "اخفق البيض جيداً في وعاء مع الفلفل الأسود والكزبرة وملعقة ماء بارد (لزيادة الهشاشة).",
      "سخن المقلاة غير اللاصقة مع مسحة زيت الزيتون على نار متوسطة، ثم اسكب خليط البيض.",
      "اطوِ الأومليت لنصفين عند تماسك القاع، وارفعها مباشرة وقدمها بجانب الجرجير والطماطم.",
    ],
    cooking_tip: "إضافة ملعقة ماء بارد مع خفق البيض يجعل الأومليت هشاً ومنتفخاً دون الحاجة لإضافة حليب أو زبدة زائدة.",
  },
  FOUL_MUDAMMAS: {
    title_ar: "طبق الفول المدمس الإسكندراني المتبل بالليمون والكمون",
    title_en: "Alexandrian Spiced Foul Mudammas",
    prep_time_ar: "4 دقائق",
    prep_time_minutes: 4,
    ingredients_breakdown: [
      { name_ar: "فول مدمس مسلوق", portion_desc: "200-250 جم مدمس ومهروس" },
      { name_ar: "زيت زيتون بكر", portion_desc: "5-10 جم (حصة دهون الوجبة)" },
      { name_ar: "عصير ليمون وتوابل", portion_desc: "عصير نصف ليمونة، كمون مطحون، بابريكا، شطة، رشة ملح" },
      { name_ar: "خضار اختياري", portion_desc: "طماطم وبقدونس مفروم للتزيين" },
    ],
    cooking_instructions: [
      "سخن الفول في وعاء صغير مع ملعقتين ماء دافئ واهرسه بالشوكة حتى تصل للقوام المفضل.",
      "أضف عصير الليمون، الكمون، البابريكا، والملح الخفيف وقلّب جيداً حتى يتشرب النكهة.",
      "اسكب الفول في طبق التقديم وضع زيت الزيتون المخصص للوجبة على الوجه مع رشة بقدونس.",
    ],
    cooking_tip: "إضافة عصير الليمون والكمون في النهاية بعد التسخين يحافظ على نكهة الليمون الطازجة ويساعد في راحة الهضم.",
  },
  LABNEH_LIGHT: {
    title_ar: "طبق اللبنة الشامية اللايت بزيت الزيتون والنعناع",
    title_en: "Levantine Light Labneh with Mint & Olive Oil",
    prep_time_ar: "2 دقيقة",
    prep_time_minutes: 2,
    ingredients_breakdown: [
      { name_ar: "لبنة لايت قليلة الدسم", portion_desc: "150-200 جم (حسب الخطة)" },
      { name_ar: "زيت زيتون بكر ممتاز", portion_desc: "5-10 جم من حصة الوجبة" },
      { name_ar: "توابل حرة", portion_desc: "نعناع مجفف، زعتر شامي، رشة سماق" },
      { name_ar: "خضار طازج", portion_desc: "خيار مقطع شرائح طازجة" },
    ],
    cooking_instructions: [
      "افرد اللبنة اللايت في طبق التقديم بملعقة لعمل تجويف دائري خفيف.",
      "رش النعناع المجفف والزعتر والسماق على سطح اللبنة.",
      "اسكب زيت الزيتون المخصص للوجبة في التجويف وقدمها مع الخيار والخبز المخصص في خطتك.",
    ],
    cooking_tip: "اللبنة اللايت تعطي إحساساً بالانتعاش والشبع وسرعة الامتصاص دون الحاجة لأي طهي على النار.",
  },
  HALLOUMI_LIGHT: {
    title_ar: "شرائح الحلوم اللايت المشوية بالأعشاب والزعتر",
    title_en: "Pan-Seared Light Halloumi with Herbs",
    prep_time_ar: "4 دقائق",
    prep_time_minutes: 4,
    ingredients_breakdown: [
      { name_ar: "جبن حلوم لايت", portion_desc: "80-100 جم شرائح" },
      { name_ar: "أعشاب وتوابل حرة", portion_desc: "زعتر بري، رشة بابريكا، رشة فلفل أسود" },
      { name_ar: "زيت طهي", portion_desc: "مسحة خفيفة من حصة زيت الزيتون (1-2 جم)" },
    ],
    cooking_instructions: [
      "جفف شرائح الحلوم بورق المطبخ لتقليل الرطوبة وضمان التحمير الذهبي المقرمش.",
      "سخن مقلاة غير لاصقة على نار متوسطة مع مسحة زيت زيتون خفيفة جداً.",
      "ضع شرائح الحلوم واشوها لمدة دقيقة ونصف لكل وجه حتى تكتسب لوناً ذهبياً شهياً وقواماً طرياً.",
    ],
    cooking_tip: "لا تترك الحلوم طويلاً على النار حتى لا تفقد طراوتها الداخلية؛ دقيقة ونصف لكل وجه كافية تماماً.",
  },
  CHICKEN_BREAST: {
    title_ar: "صدور دجاج مشوية طرية مقاومة للجفاف",
    title_en: "Juicy Herb & Lemon Grilled Chicken Breast",
    prep_time_ar: "10 دقائق",
    prep_time_minutes: 10,
    prep_options: [
      {
        id: "HOME_PAN_SHAWARMA",
        name_ar: "شاورما الطاسة المنزلية (Home Pan Shawarma)",
        free_ingredients_ar: "خل أبيض، عصير ليمون، بودرة ثوم، بودرة بصل، بابريكا مدخنة، وبهارات شاورما",
        technique_ar: "تقطيع الصدور شرائح رفيعة وتتبيلها بالخل والليمون والتوابل، وتشويحها على مقلاة ساخنة جداً في 4 دقائق."
      },
      {
        id: "GRILLED_CHICKEN_KOFTA",
        name_ar: "كفتة الفراخ المشوية في القلاية/الفرن (Chicken Kofta)",
        free_ingredients_ar: "بقدونس مفروم، بصل مبشور مصفى من الماء، بهارات دجاج، فلفل أسود، ورشة كزبرة",
        technique_ar: "فرم الصدور مع البقدونس والبصل والتوابل، وتشكيلها كأصابع كفتة وشواؤها في الإيرفراير أو الفرن 8 دقائق."
      },
      {
        id: "BUTTERFLY_LEMON_THYME",
        name_ar: "صدور الليمون والزعتر السريعة (Butterfly Cut)",
        free_ingredients_ar: "عصير ليمونة، رشة زعتر بري، فلفل أسود، ورشة ملح خفيف مع مسحة زيت الخطة",
        technique_ar: "شق الصدر عرضياً (فراشة) لتقليل السمك، وشواؤه دقيقتين لكل وجه لحبس السوائل ومنع جفاف النسيج."
      }
    ],
    ingredients_breakdown: [
      { name_ar: "صدور دجاج فيليه", portion_desc: "حسب الجرامات المحددة في خطتك" },
      { name_ar: "تتبيلة خالية من السعرات", portion_desc: "عصير ليمون، ثوم بودرة، بصل بودرة، بابريكا، بهارات فراخ، زعتر، فلفل أسود، رشة كزبرة" },
      { name_ar: "زيت زيتون للتسوية", portion_desc: "5-10 جم من حصة الوجبة للتتبيل" },
    ],
    cooking_instructions: [
      "تبل قطع الدجاج بالتوابل وعصير الليمون ومسحة زيت الزيتون، واضغط عليها لتكون بسماكة متساوية.",
      "سخن الشواية أو المقلاة الجرانيت جيداً قبل وضع الدجاج للحفاظ على السوائل والعصارة بالداخل.",
      "اشوِ الدجاج لمدة 4 دقائق لكل وجه على نار متوسطة إلى عالية، ثم اتركها ترتاح دقيقتين قبل التقطيع.",
    ],
    cooking_tip: "ترك الدجاج يرتاح لمدة دقيقتين بعد الشواء يعيد توزيع العصارة داخل الأنسجة ويمنع جفاف الصدر نهائياً.",
  },
  HAMOUR_FISH: {
    title_ar: "فيليه هامور خليجي مشوي بخلطة الليمون والكمون",
    title_en: "Gulf Grilled Hamour with Lemon-Garlic Glaze",
    prep_time_ar: "8 دقائق",
    prep_time_minutes: 8,
    ingredients_breakdown: [
      { name_ar: "سمك فيليه هامور طازج", portion_desc: "حسب حصة خطتك الموزونة" },
      { name_ar: "بهارات بحرية حرة", portion_desc: "كمون، كزبرة يابسة، لومي مطحون، بابريكا، رشة فلفل أسود" },
      { name_ar: "عصير ليمون وثوم", portion_desc: "عصير ليمونة كاملة مع فص ثوم مهروس" },
      { name_ar: "زيت زيتون للدهن", portion_desc: "حصة زيت الزيتون المخصصة للوجبة" },
    ],
    cooking_instructions: [
      "تبل فيليه الهامور بخليط الليمون والثوم والبهارات البحرية.",
      "ضع السمك على شواية ساخنة مدهونة بمسحة زيت خفيفة أو في القلاية الهوائية على 190°C.",
      "اشوِ لمدة 3-4 دقائق لكل جانب حتى يكتسب لوناً ذهبياً ويتماسك لحم السمك الأبيض الطري.",
    ],
    cooking_tip: "سمك الهامور سريع النضج؛ تجنب الإفراط في الشواء للحفاظ على طراوته وقيمته الغذائية.",
  },
  KANAAD_KINGFISH: {
    title_ar: "ستيك سمك كنعد مشوي ببهارات السمك والكزبرة",
    title_en: "Grilled Kingfish Steak with Fresh Coriander",
    prep_time_ar: "8 دقائق",
    prep_time_minutes: 8,
    ingredients_breakdown: [
      { name_ar: "ستيك كنعد طازج", portion_desc: "شريحة ستيك موزونة حسب الخطة" },
      { name_ar: "توابل بحرية", portion_desc: "كمون، كركم، كزبرة، فلفل أسود، رشة لومي" },
      { name_ar: "ليمون وثوم", portion_desc: "عصير ليمون وثوم بودرة" },
    ],
    cooking_instructions: [
      "تبل شريحة الكنعد بالليمون والبهارات من الجانبين.",
      "اشوِ الكنعد على الجريل أو في الفرن لمدة 4 دقائق لكل جانب حتى ينضج تماماً.",
      "قدمه ساخناً مع الأرز البسمتي والسلطة الخضراء المخصصة في وجبتك.",
    ],
    cooking_tip: "الكنعد غني بالأوميجا 3 الطبيعية، لذا يُفضل شواؤه بدون إضافة دهون زائدة.",
  },
  BOURI_FISH: {
    title_ar: "سمك بوري سنجاري مشوي بالردة والليمون",
    title_en: "Egyptian Bouri Singari with Bran & Lemon",
    prep_time_ar: "12 دقيقة",
    prep_time_minutes: 12,
    ingredients_breakdown: [
      { name_ar: "سمك بوري طازج نظيف", portion_desc: "وزن اللحم الصافي الموزون" },
      { name_ar: "خلطة الخضار والتوابل", portion_desc: "طماطم، فلفل، بصل مفروم، كزبرة خضراء، كمون، ليمون، شطة، ثوم" },
      { name_ar: "ردة ناعمة للشواء", portion_desc: "تغليف خفيف بالردة" },
    ],
    cooking_instructions: [
      "افتح السمك سنجاري واحشُه بخلطة الخضار والتوابل والليمون.",
      "ضع السمك في صينية بالفرن أو اشوِه على صاج ساخن جداً حتى يتحمر وينضج.",
      "اعصر ليموناً طازجاً على الوجه وقدمه مباشرة.",
    ],
    cooking_tip: "شواء البوري بالردة والليمون يمنحه طعماً غنياً دون الحاجة لأي دهون مضافة.",
  },
  TILAPIA_FISH: {
    title_ar: "فيليه بلطي طازج مشوي في القلاية الهوائية",
    title_en: "Air-Fried Crispy Herb Tilapia",
    prep_time_ar: "8 دقائق",
    prep_time_minutes: 8,
    ingredients_breakdown: [
      { name_ar: "فيليه بلطي أبيض", portion_desc: "قطعة فيليه موزونة حسب خطتك" },
      { name_ar: "بهارات تتبيل حرة", portion_desc: "كمون، بابريكا، ثوم بودرة، فلفل أسود، شطة، ليمون" },
      { name_ar: "رذاذ زيت زيتون", portion_desc: "مسحة خفيفة (2-3 جم من حصة الوجبة)" },
    ],
    cooking_instructions: [
      "تبل الفيليه بالليمون والبهارات جيداً من الجانبين.",
      "ضعه في القلاية الهوائية (Airfryer) على حرارة 190°C لمدة 8-10 دقائق.",
      "اقلب الفيليه في منتصف المدة ليصبح مقرمشاً من الخارج وطرياً من الداخل.",
    ],
    cooking_tip: "القلاية الهوائية تمنح السمك قرمشة ممتازة دون أي قلي أو زيوت مهدرجة.",
  },
  SALMON_FISH: {
    title_ar: "سلمون مشوي بالروزماري وقشر الليمون",
    title_en: "Rosemary-Crusted Atlantic Salmon",
    prep_time_ar: "8 دقائق",
    prep_time_minutes: 8,
    ingredients_breakdown: [
      { name_ar: "فيليه سلمون طازج", portion_desc: "قطعة فيليه موزونة حسب الخطة" },
      { name_ar: "أعشاب وتوابل", portion_desc: "روزماري مجفف أو طازج، فلفل أسود، رشة ثوم، بشر ليمون" },
      { name_ar: "عصير ليمون", portion_desc: "عصير نصف ليمونة" },
    ],
    cooking_instructions: [
      "تبل السلمون بالليمون والروزماري وبشر الليمون والفلفل الأسود.",
      "ضع السلمون والجلد لأسفل في مقلاة ساخنة جداً بدون أي زيت (حيث يفرز دهونه الطبيعية).",
      "اطهِ لمدة 3-4 دقائق على جهة الجلد ثم اقلبه دقيقة واحدة فقط.",
    ],
    cooking_tip: "السلمون يحتوي على دهون صحية غنية؛ شوائه على جهة الجلد يمنحه قرمشة طبيعية ونكهة ممتازة.",
  },
  CAMEL_MEAT_LEAN: {
    title_ar: "مكعبات لحم حاشي هبرة مشوحة بالهيل والبهارات العربية",
    title_en: "Seared Lean Hashi Camel Meat",
    prep_time_ar: "12 دقيقة",
    prep_time_minutes: 12,
    ingredients_breakdown: [
      { name_ar: "لحم حاشي هبرة خالي الشحم", portion_desc: "مكعبات صغيرة موزونة حسب خطتك" },
      { name_ar: "بهارات سعودية حرة", portion_desc: "هيل مطحون، قرفة، فلفل أسود، بهارات لحم، بصل وثوم بودرة" },
      { name_ar: "زيت زيتون للتشويح", portion_desc: "5 جم من حصة الوجبة" },
    ],
    cooking_instructions: [
      "تبل مكعبات اللحم بالهيل والبهارات والقليل من الماء والليمون لتطريتها.",
      "في مقلاة ساخنة، شوّح مكعبات اللحم على نار عالية حتى يتغير لونها وتحتفظ بعصارتها.",
      "أضف نصف كوب ماء مغلي وغطّ المقلاة على نار هادئة حتى تنضج تماماً وتصبح طرية.",
    ],
    cooking_tip: "لحم الحاشي من أعلى مصادر البروتين الصافي وأقلها في الدهون؛ تقطيعه مكعبات صغيرة يسرع نضجه.",
  },
  LEAN_BEEF: {
    title_ar: "ستيك لحم بقري بتلو مشوي بالروزماري والثوم",
    title_en: "Rosemary-Seared Lean Beef Steak",
    prep_time_ar: "8 دقائق",
    prep_time_minutes: 8,
    ingredients_breakdown: [
      { name_ar: "ستيك بقري قليل الدسم (95/5)", portion_desc: "شريحة ستيك موزونة حسب الخطة" },
      { name_ar: "توابل الشواء", portion_desc: "فلفل أسود مجروش، روزماري، بودرة ثوم، ملح بحري" },
      { name_ar: "زيت زيتون", portion_desc: "مسحة دهن خفيفة (3 جم)" },
    ],
    cooking_instructions: [
      "جفف شريحة الستيك وتبلها بالفلفل الأسود والروزماري والملح الخفيف.",
      "سخن مقلاة حديد زهر أو شواية جرانيت حتى تصبح ساخنة جداً مع مسحة زيت خفيفة.",
      "اشوِ الستيك لمدة 3-4 دقائق لكل جانب (Medium Well) ثم اتركه يرتاح دقيقتين.",
    ],
    cooking_tip: "عدم تحريك الستيك في الدقيقتين الأوليين يمنحه علامات شواء احترافية ويحبس العصارة بداخله.",
  },
  CANNED_TUNA: {
    title_ar: "سلطة تونة البحر المتوسط بالليمون والكمون والخيار",
    title_en: "Mediterranean Lemon-Cumin Tuna Salad",
    prep_time_ar: "3 دقائق",
    prep_time_minutes: 3,
    ingredients_breakdown: [
      { name_ar: "تونة لايت في الماء", portion_desc: "مصفاة تماماً حسب الجرامات المحددة" },
      { name_ar: "عصير ليمون وتوابل", portion_desc: "عصير ليمونة كاملة، كمون، فلفل أسود، بابريكا، رشة شطة" },
      { name_ar: "خضار طازج مقطع", portion_desc: "خيار، طماطم، بقدونس، فلفل أخضر مقطع ناعم" },
      { name_ar: "زيت زيتون", portion_desc: "حصة زيت الزيتون المخصصة للوجبة" },
    ],
    cooking_instructions: [
      "صفّ التونة تماماً من الماء وافركها بالشوكة في وعاء عميق.",
      "أضف الخضار المقطع، عصير الليمون، الكمون، والبابريكا، وقلّب جيداً.",
      "أضف زيت الزيتون المقترح في خطتك على الوجه وقدمها باردة ومنعشة.",
    ],
    cooking_tip: "عصير الليمون والكمون يزيلان أي زفارة في التونة ويجعلانها سلطة بروتينية مشبعة وفائقة اللذة.",
  },
  ROASTED_POTATOES: {
    title_ar: "بطاطس ودجز مقرمشة بالأعشاب والبابريكا في الإيرفراير",
    title_en: "Crispy Air-Fryer Herb Potato Wedges",
    prep_time_ar: "15 دقيقة",
    prep_time_minutes: 15,
    ingredients_breakdown: [
      { name_ar: "بطاطس طازجة بقشرها", portion_desc: "حسب الجرامات المحددة في خطتك" },
      { name_ar: "بهارات مقرمشة حرة", portion_desc: "بابريكا مدخنة، بودرة ثوم، روزماري، زعتر، فلفل أسود، رشة ملح" },
      { name_ar: "زيت زيتون", portion_desc: "5 جم من حصة زيت الوجبة للتحمير" },
    ],
    cooking_instructions: [
      "قطّع البطاطس إلى أصابع ودجز سميكية واغسلها بماء دافئ وجففها جيداً.",
      "تبل البطاطس بالبابريكا والروزماري والثوم وزيت الزيتون واخلطها حتى تتغلف تماماً.",
      "اخبزها في القلاية الهوائية على حرارة 190°C لمدة 15-18 دقيقة مع رج السلة في المنتصف.",
    ],
    cooking_tip: "تجفيف البطاطس جيداً قبل التتبيل هو السر للحصول على قشرة خارجية مقرمشة وقوام طري من الداخل.",
  },
  SWEET_POTATO: {
    title_ar: "بطاطا حلوة مكرملة مشوية في الفرن بالقرفة",
    title_en: "Cinnamon-Baked Caramelized Sweet Potato",
    prep_time_ar: "20 دقيقة",
    prep_time_minutes: 20,
    ingredients_breakdown: [
      { name_ar: "بطاطا حلوة طازجة", portion_desc: "حسب الجرامات الموزونة في خطتك" },
      { name_ar: "توابل دافئة حرة", portion_desc: "قرفة مطحونة، رشة فانيليا، رشة جوزة الطيب" },
    ],
    cooking_instructions: [
      "اغسل البطاطا وقطّعها شرائح دائرية أو أنصاف.",
      "رش القرفة والفانيليا على الوجه ورتبها في صينية مبطنة بورق زبدة.",
      "اشوِ في الفرن على حرارة 200°C لمدة 18-20 دقيقة حتى تكرمل سكرياتها الطبيعية.",
    ],
    cooking_tip: "البطاطا الحلوة المشوية بالقرفة وجبة طاقة وكارب معقد بطيء الامتصاص وغني بمضادات الأكسدة.",
  },
  KABSA_SPICED_RICE: {
    title_ar: "أرز كبسة نثري خفيف باللومي والهيل والقرفة",
    title_en: "Fragrant Low-Oil Kabsa Basmati Rice",
    prep_time_ar: "15 دقيقة",
    prep_time_minutes: 15,
    ingredients_breakdown: [
      { name_ar: "أرز بسمتي حبة طويلة", portion_desc: "حسب الحصة الموزونة في خطتك" },
      { name_ar: "بهارات كبسة صحيحة", portion_desc: "حبة لومي أسود، عود قرفة، 3 حبات هيل، ورق غار، قرنفل" },
      { name_ar: "ماء مغلي ورشة كركم", portion_desc: "ماء مغلي كافٍ لتسوية الأرز نثرياً" },
      { name_ar: "زيت للطهي", portion_desc: "مسحة زيت خفيفة من حصة الوجبة" },
    ],
    cooking_instructions: [
      "اغسل الأرز وانقعه في ماء دافئ لمدة 10 دقائق ثم صفّه.",
      "في قدر صغير، شوّح البهارات الصحيحة بمسحة زيت خفيفة حتى تفوح رائحتها العطرية.",
      "أضف الأرز والماء المغلي والملح والكركم، واتركه يغلي لدقيقتين ثم هدئ النار تماماً لمدة 12 دقيقة.",
    ],
    cooking_tip: "نقع الأرز البسمتي وطهيه على نار هادئة بالبهارات الصحيحة يجعله نثرياً وخفيفاً دون الحاجة لزيوت زائدة.",
  },
  EGYPTIAN_RICE: {
    title_ar: "أرز مصري مفلفل بالشعرية الخفيفة",
    title_en: "Cooked Egyptian Rice with Golden Vermicelli",
    prep_time_ar: "15 دقيقة",
    prep_time_minutes: 15,
    ingredients_breakdown: [
      { name_ar: "أرز مصري قصير الحبة", portion_desc: "حسب الجرامات الموزونة" },
      { name_ar: "شعرية خفيفة", portion_desc: "ملعقة طعام شعرية محمرة خفيفاً" },
      { name_ar: "ماء مغلي ورشة ملح", portion_desc: "معيار مساوٍ لوزن الأرز" },
      { name_ar: "زيت طهي", portion_desc: "حصة زيت الوجبة" },
    ],
    cooking_instructions: [
      "حمّر الشعرية في المقلاة بمسحة زيت خفيفة حتى تكتسب لوناً ذهبياً.",
      "أضف الأرز المغسول وقلّبه مع الشعرية لدقيقة واحدة ليتغلف بالحرارة.",
      "أضف الماء المغلي والملح، واتركه يتشرب ثم خفف النار تماماً حتى ينضج ويفلفل.",
    ],
    cooking_tip: "تشويح الأرز مع الشعرية قبل إضافة الماء هو سر الفلفلة المثالية دون أن يتعجن.",
  },
  BASMATI_RICE: {
    title_ar: "أرز بسمتي أبيض نثري بالهيل والليمون",
    title_en: "Steamed Cardamom Basmati Rice",
    prep_time_ar: "15 دقيقة",
    prep_time_minutes: 15,
    ingredients_breakdown: [
      { name_ar: "أرز بسمتي أبيض", portion_desc: "الجرامات المحددة في خطتك" },
      { name_ar: "مطيبات حرة", portion_desc: "حبتان هيل، رشة كمون حب، ورقة غار، رشة ملح" },
    ],
    cooking_instructions: [
      "اغسل الأرز وصفّه جيداً.",
      "اغلِ الأرز في ماء وفير مع الهيل وورق الغار والملح كما تسلق المكرونة.",
      "صفّ الأرز بمصفاة بعد 9 دقائق واتركه يتهوى ويتبخر ليكون نثرياً وخفيفاً جداً على المعدة.",
    ],
    cooking_tip: "سلق الأرز البسمتي وتصفيته يقلل من النشا الزائد ويجعله خفيفاً وسهل الهضم لملء الجليكوجين.",
  },
  ROLLED_OATS: {
    title_ar: "بودينغ الشوفان بالقرفة بالماء الساخن (Classic Warm Oats)",
    title_en: "Classic Warm Cinnamon Oatmeal Porridge",
    prep_time_ar: "4 دقائق",
    prep_time_minutes: 4,
    prep_options: [
      {
        id: "CLASSIC_WARM_OATS",
        name_ar: "بودينغ الشوفان بالقرفة بالماء الساخن (Classic Warm Oats)",
        free_ingredients_ar: "ماء مغلي، رشة قرفة مطحونة، رشة فانيليا، سكر ستيفيا دايت، وفاكهة الخطة",
        technique_ar: "طهي الشوفان مع ماء مغلي وقرفة وستيفيا حتى يتشرب ويتضاعف حجمه 3 مرات مع إضافة الفاكهة."
      },
      {
        id: "OVERNIGHT_CHOCOLATE_OATS",
        name_ar: "شوفان الشوكولاتة والزبادي (Overnight Chocolate Oats)",
        free_ingredients_ar: "نصف كوب ماء + علبة زبادي عادي + ملعقة صغيرة كاكاو خام غير محلى + سكر دايت",
        technique_ar: "نقع الشوفان في الماء والزبادي والكاكاو والستيفيا بالثلاجة لساعة؛ يعطي قوام كيك الشوكولاتة الباردة."
      },
      {
        id: "SAVORY_OATS_SOUP",
        name_ar: "شوربة الشوفان المالحة (Savory Oats Soup)",
        free_ingredients_ar: "ماء ساخن، فلفل أسود، كمون مطحون، ورشة بهارات دجاج أو كاري",
        technique_ar: "طهي الشوفان في ماء مع بهارات الدجاج والفلفل الأسود (بديل ساخن للأرز لمن يفضل الإفطار المالح)."
      }
    ],
    ingredients_breakdown: [
      { name_ar: "شوفان كامل الحبة", portion_desc: "حسب الجرامات الجافة في خطتك" },
      { name_ar: "ماء مغلي نقي", portion_desc: "150-200 مل" },
      { name_ar: "توابل حرة", portion_desc: "قرفة مطحونة، رشة فانيليا، سكر ستيفيا دايت خالي السعرات" },
      { name_ar: "إضافات مسموحة", portion_desc: "بذور الشيا أو رشة تفاح/موز مقطع من خطتك" },
    ],
    cooking_instructions: [
      "في وعاء صغير، اخلط الشوفان مع الماء المغلي والقرفة والفانيليا وسكر الستيفيا.",
      "سخن الخليط على نار هادئة لمدة 3 دقائق مع التقليب المستمر حتى يتشرب الماء ويثقل قوامه الكريمي.",
      "اسكب الشوفان في طبق الإفطار وأضف الفاكهة أو المكسرات المحددة في وجبتك.",
    ],
    cooking_tip: "طهي الشوفان بالماء المغلي ورشة القرفة يضاعف حجم الحبوب 3 أضعاف ويعطي شبعاً هائلاً دون الحاجة لألبان مستوردة.",
  },
  DATES_KHALAS: {
    title_ar: "سناك تمر خلاص بذور الشيا والقرفة قبل التمرين",
    title_en: "Energy Date Bites with Chia Seeds & Cinnamon",
    prep_time_ar: "1 دقيقة",
    prep_time_minutes: 1,
    ingredients_breakdown: [
      { name_ar: "تمر خلاص أو سكري", portion_desc: "حسب عدد الحبات الموزونة في خطتك (7-8 جم/حبة)" },
      { name_ar: "بهارات دافئة", portion_desc: "رشة قرفة وبذور شيا خفيفة" },
    ],
    cooking_instructions: [
      "انزع النوى من حبات التمر ورتبها في طبق السناك.",
      "رش القرفة المطحونة وبذور الشيا على حبات التمر.",
      "تناولها قبل تمرينك بـ 30-45 دقيقة مع كوب قهوة سوداء أو ماء لطاقة فورية.",
    ],
    cooking_tip: "التمر يحتوي على جلوكوز وفركتوز طبيعي يمتص بسرعة لملء طاقة العضلات أثناء التمرين القاسي.",
  },
  LUPINI_BEANS: {
    title_ar: "تسالي الترمس المسلوق بالليمون والكمون والشطة",
    title_en: "Spiced Egyptian Lupini Snack",
    prep_time_ar: "1 دقيقة",
    prep_time_minutes: 1,
    ingredients_breakdown: [
      { name_ar: "ترمس حلو مسلوق", portion_desc: "حسب الجرامات المحددة في خطتك" },
      { name_ar: "توابل حرة", portion_desc: "عصير ليمونة كاملة، كمون مطحون، بابريكا، شطة، رشة ملح خفيف" },
    ],
    cooking_instructions: [
      "ضع الترمس المسلوق الجاهز في وعاء التسالي.",
      "اعصر الليمون الطازج وأضف الكمون والشطة والملح الخفيف.",
      "قلّب جيداً وتناوله كسناك عالي البروتين والألياف وقليل السعرات.",
    ],
    cooking_tip: "الترمس من أعظم السناكات البروتينية النباتية؛ غني بالألياف والبروتين ويشبع الشهية فوراً.",
  },
  HIGH_PROTEIN_OAT_PANCAKES: {
    title_ar: "بان كيك الشوفان عالي البروتين بالقرفة والفانيليا",
    title_en: "High-Protein Fluffy Oat Pancakes",
    prep_time_ar: "8 دقائق",
    prep_time_minutes: 8,
    prep_options: [
      {
        id: "CLASSIC_CINNAMON_PANCAKE",
        name_ar: "بان كيك الشوفان الكلاسيكي بالقرفة (Classic Cinnamon)",
        free_ingredients_ar: "رشة قرفة مطحونة، قطرات فانيليا سائلة، كيس ستيفيا، ونصف ملعقة بيكنج بودر",
        technique_ar: "خلط الشوفان المطحون مع بياض البيض وسكر الدايت، والطهي على مقلاة ساخنة مدهونة برذاذ خفيف دقيقة ونصف لكل وجه."
      },
      {
        id: "CHOCOLATE_WHEY_PANCAKE",
        name_ar: "بان كيك الشوكولاتة والواي بروتين (Chocolate Whey Pancake)",
        free_ingredients_ar: "سكوب بروتين شوكولاتة أو ملعقة كاكاو خام، ماء دافئ، رشة بيكنج صودا",
        technique_ar: "خفق المكونات في الخلاط حتى الحصول على مزيج متجانس سميك وصبه على مقلاة تيفال حتى ظهور الفقاعات ثم قلبه."
      }
    ],
    ingredients_breakdown: [
      { name_ar: "شوفان كامل مطحون", portion_desc: "حسب حصة الكارب بالخطة (50-70 جم)" },
      { name_ar: "بياض بيض أو بيض كامل", portion_desc: "3-4 بياض بيض أو بيضتان كاملتان" },
      { name_ar: "مكمل بروتين اختياري", portion_desc: "نصف سكوب إلى سكوب حسب الاحتياج" },
      { name_ar: "منكهات ومحليات حرة", portion_desc: "قرفة، فانيليا، بيكنج بودر، سكر دايت ستيفيا" }
    ],
    cooking_instructions: [
      "في الخلاط الكهربائي، اطحن الشوفان ناعماً ثم أضف بياض البيض ورشة الفانيليا والقرفة والبيكنج بودر وسكر الستيفيا.",
      "اخلط المزيج لمدة 30 ثانية حتى يتكون خليط متجانس متوسط الكثافة.",
      "سخن مقلاة جرانيت أو تيفال غير لاصقة على نار متوسطة مع مسحة زيت خفيفة جداً.",
      "اسكب الخليط لتشكيل أقراص البان كيك، واتركها لمدة دقيقة ونصف حتى تظهر فقاعات على السطح، ثم اقلبها على الوجه الآخر لمدة دقيقة حتى تصبح ذهبية.",
      "قدمها ساخنة وزينها بقطع الفاكهة أو القرفة المحددة في وجبتك."
    ],
    cooking_tip: "إضافة ملعقة صغيرة من البيكنج بودر مع خفق بياض البيض يمنح البان كيك قواماً هشاً ومنتفخاً يشبه البان كيك التقليدي تماماً ولكن بقيمة غذائية رياضية خارقة."
  },
  HEALTHY_BEEF_HAWAWSHI: {
    title_ar: "حواوشي اللحم البقري الدايت بالخبز البلدي على الجريل",
    title_en: "Healthy Grilled Beef Baladi Hawawshi",
    prep_time_ar: "12 دقيقة",
    prep_time_minutes: 12,
    prep_options: [
      {
        id: "GRILLED_STOVE_HAWAWSHI",
        name_ar: "حواوشي الجريل على الطاسة (Stovetop Pan Hawawshi)",
        free_ingredients_ar: "بصل مفروم، فلفل أخضر ورومي مفروم، بهارات حواوشي (كمون، كزبرة، قرفة، جوزة الطيب)، شطة اختيارية",
        technique_ar: "حشو الخبز البلدي بخليط اللحم المفروم النيء والضغط عليه، وتسويته في مقلاة مغطاة ممسوحة برذاذ خفيف 5 دقائق لكل وجه."
      },
      {
        id: "OVEN_CRISP_HAWAWSHI",
        name_ar: "حواوشي الفرن المقرمش (Oven Crisp Hawawshi)",
        free_ingredients_ar: "نفس تتبيلة الخضار والبهارات الحرة مع لفه بورق زبدة",
        technique_ar: "وضعه في فرن ساخن على حرارة 200 درجة لمدة 15 دقيقة حتى يتحمص الخبز ويستوي اللحم من الداخل."
      }
    ],
    ingredients_breakdown: [
      { name_ar: "لحم بقري مفروم قليل الدسم (95/5)", portion_desc: "100-150 جم (حسب حصة البروتين)" },
      { name_ar: "خبز بلدي مصري بالردة", portion_desc: "رغيف بلدي متوسط (حسب حصة الكارب)" },
      { name_ar: "خضار تتبيل مفروم ناعم", portion_desc: "بصل، فلفل أخضر، طماطم صغيرة منزوعة البذر، بقدونس" },
      { name_ar: "توابل حواوشي حرة", portion_desc: "بهار حواوشي، فلفل أسود، كمون، كزبرة جافة، رشة ملح خفيف" }
    ],
    cooking_instructions: [
      "في وعاء، اخلط اللحم المفروم قليل الدسم مع البصل والفلفل المفرومين وتوابل الحواوشي حتى يتجانس الخليط تماماً.",
      "افتح رغيف الخبز البلدي المخصص بالخطة وافرد حشوة اللحم داخله بالتساوي حتى الأطراف.",
      "سخن مقلاة جريل غير لاصقة وادهن الخبز بمسحة خفيفة جداً من زيت الزيتون المخصص لوجبتك.",
      "ضع الرغيف في الطاسة وغطّها على نار هادئة إلى متوسطة لمدة 5-6 دقائق حتى يتحمص القاع ويستوي اللحم.",
      "اقلب الرغيف على الوجه الآخر واضغط عليه برفق، واستمر في الطهي لـ 4 دقائق حتى يكتسب لوناً ذهبياً مقرمشاً وينضج اللحم تماماً."
    ],
    cooking_tip: "فرم البصل والفلفل ناعماً جداً وعصر مائهم الخفيف يضمن نضج اللحم الداخلي وتوزيعه بسلاسة داخل الرغيف مع منح طعم الحواوشي الشرقي الأصلي 100% دون جرام دهون غير محسوب."
  },
});

export function getRecipeDetailsForFood(foodCode) {
  if (!foodCode) return null;
  const upperCode = foodCode.toUpperCase();
  if (CULINARY_RECIPES_DATABASE[upperCode]) {
    return CULINARY_RECIPES_DATABASE[upperCode];
  }
  // Check common aliases (order matters)
  if (upperCode.includes("PANCAKE")) return CULINARY_RECIPES_DATABASE.HIGH_PROTEIN_OAT_PANCAKES;
  if (upperCode.includes("HAWAWSHI")) return CULINARY_RECIPES_DATABASE.HEALTHY_BEEF_HAWAWSHI;
  if (upperCode.includes("SAUTEED") || upperCode.includes("VEGG")) return CULINARY_RECIPES_DATABASE.SAUTEED_VEGGIES;
  if (upperCode.includes("SALAD")) return CULINARY_RECIPES_DATABASE.MEDITERRANEAN_SALAD;
  if (upperCode.includes("COTTAGE") || upperCode.includes("CHEESE")) return CULINARY_RECIPES_DATABASE.COTTAGE_CHEESE;
  if (upperCode.includes("SHAKSHOUKA")) return CULINARY_RECIPES_DATABASE.SHAKSHOUKA_EGGS;
  if (upperCode.includes("EGG") && !upperCode.includes("VEGG")) return CULINARY_RECIPES_DATABASE.EGGS_OMELETTE;
  if (upperCode.includes("FOUL")) return CULINARY_RECIPES_DATABASE.FOUL_MUDAMMAS;
  if (upperCode.includes("LABNEH")) return CULINARY_RECIPES_DATABASE.LABNEH_LIGHT;
  if (upperCode.includes("HALLOUMI")) return CULINARY_RECIPES_DATABASE.HALLOUMI_LIGHT;
  if (upperCode.includes("CHICKEN")) return CULINARY_RECIPES_DATABASE.CHICKEN_BREAST;
  if (upperCode.includes("HAMOUR")) return CULINARY_RECIPES_DATABASE.HAMOUR_FISH;
  if (upperCode.includes("KANAAD")) return CULINARY_RECIPES_DATABASE.KANAAD_KINGFISH;
  if (upperCode.includes("BOURI")) return CULINARY_RECIPES_DATABASE.BOURI_FISH;
  if (upperCode.includes("TILAPIA")) return CULINARY_RECIPES_DATABASE.TILAPIA_FISH;
  if (upperCode.includes("SALMON")) return CULINARY_RECIPES_DATABASE.SALMON_FISH;
  if (upperCode.includes("CAMEL") || upperCode.includes("HASHI")) return CULINARY_RECIPES_DATABASE.CAMEL_MEAT_LEAN;
  if (upperCode.includes("BEEF")) return CULINARY_RECIPES_DATABASE.LEAN_BEEF;
  if (upperCode.includes("TUNA")) return CULINARY_RECIPES_DATABASE.CANNED_TUNA;
  if (upperCode.includes("POTATO") && !upperCode.includes("SWEET")) return CULINARY_RECIPES_DATABASE.ROASTED_POTATOES;
  if (upperCode.includes("SWEET_POTATO")) return CULINARY_RECIPES_DATABASE.SWEET_POTATO;
  if (upperCode.includes("KABSA")) return CULINARY_RECIPES_DATABASE.KABSA_SPICED_RICE;
  if (upperCode.includes("EGYPTIAN_RICE")) return CULINARY_RECIPES_DATABASE.EGYPTIAN_RICE;
  if (upperCode.includes("RICE")) return CULINARY_RECIPES_DATABASE.BASMATI_RICE;
  if (upperCode.includes("OAT")) return CULINARY_RECIPES_DATABASE.ROLLED_OATS;
  if (upperCode.includes("DATE")) return CULINARY_RECIPES_DATABASE.DATES_KHALAS;
  if (upperCode.includes("LUPINI") || upperCode.includes("TERMIS")) return CULINARY_RECIPES_DATABASE.LUPINI_BEANS;

  return null;
}

function formConditionExclusionTokens(medicalConditions) {
  if (!medicalConditions || typeof medicalConditions !== "object" || Array.isArray(medicalConditions)) return [];
  const selected = Array.isArray(medicalConditions.selected) ? medicalConditions.selected.map((s) => String(s).toLowerCase()) : [];
  const tokens = [];
  if (selected.includes("favism_g6pd") || medicalConditions.favism_g6pd === true) tokens.push("FAVISM", "G6PD");
  if (selected.includes("gout") || medicalConditions.gout === true) tokens.push("GOUT");
  return tokens;
}

/**
 * The client's food restrictions as the meal generator filters them (allergies, conditions, diet),
 * from the canonical intake and the raw form answers. Shared by the plan generator and the app's
 * live food swaps, so a swap can never offer what the plan itself would refuse.
 */
export function buildAllergenContext(canonicalIntake = {}, rawIntake = {}) {
  const nutrition = canonicalIntake.nutrition || {};
  const medical = canonicalIntake.medical || {};
  const effectiveRaw = (rawIntake?.answers && typeof rawIntake.answers === 'object')
    ? { ...rawIntake.answers, ...rawIntake }
    : (rawIntake || {});
  const budgetTier = (nutrition.budget || nutrition.budgetTier || "MODERATE").toUpperCase();

  const rawExclusions = [
    ...(nutrition.excludedFoodCodes || []),
    ...(nutrition.excludedFoodsList || []),
    ...(nutrition.excluded_foods || []),
    ...(nutrition.allergies || []),
    ...(nutrition.dislikedFoods || []),
    ...(nutrition.intolerances || []),
    ...(canonicalIntake.medical?.allergies || []),
    ...(canonicalIntake.medical?.conditions || []).map(c => c.conditionCode),
    ...(Array.isArray(effectiveRaw.strict_allergies) ? effectiveRaw.strict_allergies : []),
    ...(Array.isArray(effectiveRaw.allergies_and_dislikes) ? effectiveRaw.allergies_and_dislikes : []),
    ...(Array.isArray(effectiveRaw.nutrition?.strict_allergies) ? effectiveRaw.nutrition.strict_allergies : []),
    ...(Array.isArray(effectiveRaw.nutrition?.allergies) ? effectiveRaw.nutrition.allergies : []),
    ...(Array.isArray(effectiveRaw.nutrition?.excludedFoodsList) ? effectiveRaw.nutrition.excludedFoodsList : []),
    // Intake form conditions that the canonical medical list cannot carry (favism, gout).
    ...formConditionExclusionTokens(effectiveRaw.medical_conditions),
  ];

  const excludedFoods = new Set(
    rawExclusions.map((x) => {
      if (typeof x === "string") return x.toUpperCase();
      if (x && typeof x === "object") return (x.substance || x.code || x.foodCode || x.name || x.conditionCode || "").toUpperCase();
      return "";
    }).filter(Boolean),
  );

  const isGlutenExcluded =
    excludedFoods.has("GLUTEN") ||
    excludedFoods.has("WHEAT") ||
    excludedFoods.has("CELIAC") ||
    excludedFoods.has("BREAD") ||
    excludedFoods.has("BARLEY") ||
    excludedFoods.has("RYE") ||
    excludedFoods.has("GLUTEN_WHEAT") ||
    excludedFoods.has("WHEAT_GLUTEN") ||
    excludedFoods.has("GLUTEN_CELIAC") ||
    excludedFoods.has("CELIAC");

  const isDairyExcluded =
    excludedFoods.has("DAIRY") ||
    excludedFoods.has("MILK") ||
    excludedFoods.has("LACTOSE") ||
    excludedFoods.has("CHEESE") ||
    excludedFoods.has("YOGURT") ||
    excludedFoods.has("WHEY") ||
    excludedFoods.has("DAIRY_LACTOSE");

  const isEggsExcluded =
    excludedFoods.has("EGGS") ||
    excludedFoods.has("EGG") ||
    excludedFoods.has("EGG_WHITE") ||
    excludedFoods.has("EGG_WHITES");

  const isFishExcluded =
    excludedFoods.has("FISH") ||
    excludedFoods.has("FISH_SEAFOOD") ||
    excludedFoods.has("SEAFOOD") ||
    excludedFoods.has("TILAPIA") ||
    excludedFoods.has("SALMON") ||
    excludedFoods.has("TUNA") ||
    excludedFoods.has("FISH_SHELLFISH");

  const isPoultryExcluded =
    excludedFoods.has("POULTRY") ||
    excludedFoods.has("CHICKEN") ||
    excludedFoods.has("TURKEY");

  const isRedMeatExcluded =
    excludedFoods.has("BEEF") ||
    excludedFoods.has("RED_MEAT") ||
    excludedFoods.has("MEAT");

  const isMeatExcluded = isPoultryExcluded && isRedMeatExcluded;

  const isVegan =
    nutrition.dietType === "VEGAN" ||
    excludedFoods.has("VEGAN") ||
    (isMeatExcluded && isDairyExcluded && isEggsExcluded && isFishExcluded);

  const isSoyExcluded =
    excludedFoods.has("SOY") ||
    excludedFoods.has("SOYBEAN") ||
    excludedFoods.has("TOFU");

  const isSesameExcluded =
    excludedFoods.has("SESAME_SEEDS") ||
    excludedFoods.has("SESAME") ||
    excludedFoods.has("TAHINI");

  const isNutsExcluded =
    excludedFoods.has("NUTS") ||
    excludedFoods.has("PEANUTS") ||
    excludedFoods.has("TREE_NUTS") ||
    excludedFoods.has("ALMONDS") ||
    excludedFoods.has("PEANUT") ||
    excludedFoods.has("PEANUTS_TREE_NUTS");

  // Declared in the intake under the bariatric block; not part of the canonical contract.
  const isDumpingSyndrome = effectiveRaw?.medical_conditions?.bariatric?.dumping_syndrome === true;

  const rawSelected = Array.isArray(effectiveRaw?.medical_conditions?.selected) ? effectiveRaw.medical_conditions.selected : [];
  const isDiabetic =
    rawSelected.some((c) => String(c).toLowerCase() === "diabetes") ||
    effectiveRaw?.medical_conditions?.diabetes?.uses_insulin === true ||
    (medical.conditions || []).some((c) => /DIABET|INSULIN_RESISTANCE/.test(String(c.conditionCode || "")));

  const isGout =
    excludedFoods.has("GOUT") ||
    excludedFoods.has("HIGH_URIC_ACID") ||
    excludedFoods.has("URIC_ACID") ||
    (medical.conditions || []).some(c => (c.conditionCode || "").includes("GOUT") || (c.conditionCode || "").includes("URIC"));

  const isFavism =
    excludedFoods.has("FAVISM") ||
    excludedFoods.has("G6PD") ||
    excludedFoods.has("FAVA") ||
    excludedFoods.has("FAVA_BEANS") ||
    (medical.conditions || []).some(c => {
      const code = (c.conditionCode || "").toUpperCase();
      return code.includes("G6PD") || code.includes("FAVISM");
    });

  const isLegumesExcluded =
    isFavism ||
    isGout ||
    excludedFoods.has("LEGUMES") ||
    excludedFoods.has("LENTILS") ||
    excludedFoods.has("CHICKPEAS") ||
    excludedFoods.has("BEANS") ||
    excludedFoods.has("FAVA_BEANS") ||
    excludedFoods.has("LUPIN") ||
    excludedFoods.has("LUPINI");

  const isLowBudget =
    budgetTier === "LOW" ||
    budgetTier === "ECONOMIC" ||
    budgetTier === "SAVER";

  return {
    excludedFoods,
    isVegan,
    isGlutenExcluded,
    isDairyExcluded,
    isEggsExcluded,
    isFishExcluded,
    isPoultryExcluded,
    isRedMeatExcluded,
    isMeatExcluded,
    isSoyExcluded,
    isNutsExcluded,
    isGout,
    isFavism,
    isLegumesExcluded,
    isLowBudget,
    isDumpingSyndrome,
    isDiabetic,
    isSesameExcluded,
    // Kidney disease with a high potassium result: potassium-rich foods leave the plan and swaps.
    isHighPotassium: kidneyPotassium(effectiveRaw, medical).status === "HIGH",
    // Food codes of the foods the client does not like (intake form labels mapped in disliked-foods.js).
    dislikedFoodCodes: new Set([
      ...dislikedFoodCodes(nutrition.dislikedFoods),
      ...dislikedFoodCodes(effectiveRaw.disliked_foods),
    ]),
  };
}

// Potassium-rich foods of this food list (roughly 350-500 mg per 100 g or more; oranges ~180 mg but
// eaten in large portions): limited only with a high result (KDIGO 2024, per person).
export const HIGH_POTASSIUM_FOODS = Object.freeze(new Set([
  "FRESH_AVOCADO", "ROASTED_POTATOES", "SWEET_POTATO", "BANANA_FRESH", "DATES_KHALAS", "ORANGE_FRESH",
]));

/**
 * A kidney client's latest potassium result from the intake (medical_conditions.renal.potassium_mmol_l):
 * HIGH above KIDNEY.HIGH_POTASSIUM_MMOL_L, NORMAL within range, UNKNOWN without a usable number; NONE
 * without kidney disease.
 */
export function kidneyPotassium(effectiveRaw = {}, medical = {}) {
  const selected = Array.isArray(effectiveRaw?.medical_conditions?.selected) ? effectiveRaw.medical_conditions.selected : [];
  const hasKidney = selected.some((c) => /renal|kidney/i.test(String(c)))
    || (medical.conditions || []).some((c) => /KIDNEY|RENAL/.test(String(c?.conditionCode || c || "").toUpperCase()))
    || medical.hasKidneyCondition === true;
  if (!hasKidney) return { status: "NONE", value: null };
  const value = Number(String(effectiveRaw?.medical_conditions?.renal?.potassium_mmol_l ?? "").replace(",", "."));
  if (!Number.isFinite(value) || value < 2 || value > 9) return { status: "UNKNOWN", value: null };
  return { status: value > CLINICAL_GUIDELINES.KIDNEY.HIGH_POTASSIUM_MMOL_L ? "HIGH" : "NORMAL", value };
}

export function buildCulinaryRecipeMeals(universalTargets, canonicalIntake = {}, rawIntake = {}) {
  const { meal_distribution = [] } = universalTargets;
  const nutrition = canonicalIntake.nutrition || {};
  const medical = canonicalIntake.medical || {};
  const training = canonicalIntake.training || {};
  const effectiveRaw = (rawIntake?.answers && typeof rawIntake.answers === 'object')
    ? { ...rawIntake.answers, ...rawIntake }
    : (rawIntake || {});
  const isAdvanced = (training.experience || "").toUpperCase() === "ADVANCED";
  const proteinPowderAvailable = Boolean(nutrition.proteinPowderAvailable ?? nutrition.protein_powder_available ?? true);
  const budgetTier = (nutrition.budget || nutrition.budgetTier || "MODERATE").toUpperCase();

  const allergenContext = buildAllergenContext(canonicalIntake, effectiveRaw);
  const { excludedFoods, isVegan, isGlutenExcluded, isDairyExcluded, isEggsExcluded, isFishExcluded, isPoultryExcluded, isRedMeatExcluded, isMeatExcluded, isSoyExcluded, isNutsExcluded, isGout, isFavism, isLegumesExcluded, isLowBudget, isDumpingSyndrome, isDiabetic, isSesameExcluded } = allergenContext;

  const totalMeals = meal_distribution.length;

  const generatedMeals = meal_distribution.map((mealDist, idx) => {
    const mealNum = mealDist.meal_number || idx + 1;
    const targetP = mealDist.protein_g;
    const targetC = mealDist.carb_g;
    const targetF = mealDist.fat_g;
    const targetKcal = mealDist.calories_kcal;

    let recipeNameAr = "";
    let recipeConceptDesc = "";
    const items = [];

    // =========================================================================
    // CASE A: VEGAN + SOY-FREE + NUT-FREE (Mazen Eldesouki - Case 1)
    // =========================================================================
    if (isVegan) {
      if (mealNum === 1) {
        recipeNameAr = "وجبة الإفطار (شوفان بحليب الشوفان وبذور الشيا وبروتين نباتي)";
        recipeConceptDesc = "إفطار نباتي 100% خالي تماماً من الصويا والمكسرات وحليب اللوز، يعتمد على حليب الشوفان وبذور القنب والشيا لدعم البناء العضلي الصافي.";

        // Oat milk (150 ml = 1.5g P, 10g C, 2.2g F, 68 kcal)
        const milkMl = 150;
        items.push({
          food_code: "OAT_MILK",
          name_ar: "حليب شوفان غير محلى (خالي من المكسرات والصويا)",
          name_en: "Unsweetened Oat Milk",
          category: "BEVERAGE",
          portion_g: milkMl,
          household_measurement: "150 مل (كوب صغير)",
          protein_g: 1.5,
          carb_g: 10,
          fat_g: 2.2,
          calories_kcal: 68,
          swaps: [],
        });

        // Seeds for essential fats
        const seedGrams = Math.max(10, Math.min(25, Math.round((targetF - 2.2) * 0.7 / 0.40)));
        const seedF = Math.round(seedGrams * 0.40);
        const seedP = Math.round(seedGrams * 0.20);
        const seedC = Math.round(seedGrams * 0.15);
        items.push({
          food_code: "HEMP_CHIA_SEEDS",
          name_ar: "بذور الشيا وبذور القنب ودوار الشمس (دهون أوميجا نباتية آمنة خالية من المكسرات)",
          name_en: "Chia & Hemp Seed Blend",
          category: "FATS",
          portion_g: seedGrams,
          household_measurement: `${seedGrams} جم (1.5 ملعقة طعام)`,
          protein_g: seedP,
          carb_g: seedC,
          fat_g: seedF,
          calories_kcal: seedGrams * 5,
          swaps: [],
        });

        // Rolled Oats
        const remC = Math.max(20, targetC - 10 - seedC);
        const oatGrams = Math.round((remC / 0.68));
        const oatP = Math.round(oatGrams * 0.135);
        const oatF = Math.round(oatGrams * 0.06);
        items.push({
          food_code: "ROLLED_OATS",
          name_ar: "شوفان كامل الحبة مطبوخ بالماء وحليب الشوفان مع رشة قرفة وتفاح",
          name_en: "Whole Rolled Oats with Cinnamon & Apple",
          category: "CARBS",
          portion_g: oatGrams,
          household_measurement: `${oatGrams} جم جاف (${Math.round(oatGrams / 10)} ملاعق طعام كبيرة)`,
          protein_g: oatP,
          carb_g: remC,
          fat_g: oatF,
          calories_kcal: Math.round(oatGrams * 3.8),
          swaps: generateSmartSwaps("CARBS", oatGrams, "ROLLED_OATS", "BREAKFAST", 5, allergenContext),
        });

        // Pea & Rice Protein Powder to close protein target
        const remP = Math.max(15, targetP - 1.5 - seedP - oatP);
        const powderGrams = Math.round((remP / 0.80));
        items.push({
          food_code: "PEA_RICE_PROTEIN_POWDER",
          name_ar: "سكوب بروتين نباتي معزول من البازلاء والأرز (Plant Protein Isolate)",
          name_en: "Organic Pea & Rice Protein Isolate Scoop",
          category: "PROTEIN",
          portion_g: powderGrams,
          household_measurement: `${powderGrams} جم (${(powderGrams / 30).toFixed(1)} سكوب)`,
          protein_g: remP,
          carb_g: 1.5,
          fat_g: 0.8,
          calories_kcal: Math.round(powderGrams * 3.5),
          swaps: generateSmartSwaps("PROTEIN", powderGrams, "PEA_RICE_PROTEIN_POWDER", "BREAKFAST", 5, allergenContext),
        });

      } else if (mealNum === 2) {
        const canUseLegumes = !isGout && !isLegumesExcluded && !isFavism;

        if (canUseLegumes) {
          recipeNameAr = "وجبة الغداء (يخنة بقوليات مشكلة مع أرز بسمتي وبروتين نباتي)";
          recipeConceptDesc = "وجبة أداء عضلي غنية بالكاربوهيدرات المعقدة والبروتين النباتي التكاملي لملء مخازن الجليكوجين.";

          // Legumes Stew (250g)
          const legumeGrams = 250;
          const legP = Math.round(legumeGrams * 0.09);
          const legC = Math.round(legumeGrams * 0.20);
          const legF = Math.round(legumeGrams * 0.03);
          items.push({
            food_code: "MIXED_LEGUMES_STEW",
            name_ar: "يخنة البقوليات المشكلة (عدس بني، حمص، فاصوليا حمراء متبلة بالكمون وزيت الزيتون)",
            name_en: "Mixed Legumes Stew",
            category: "PROTEIN",
            portion_g: legumeGrams,
            household_measurement: `${legumeGrams} جم مطبوخ (طبق عميق متبل)`,
            protein_g: legP,
            carb_g: legC,
            fat_g: legF,
            calories_kcal: Math.round(legumeGrams * 1.3),
            swaps: generateSmartSwaps("PROTEIN", legumeGrams, "MIXED_LEGUMES_STEW", "LUNCH", 8, allergenContext),
          });

          // Veggies
          items.push({
            food_code: "SAUTEED_VEGGIES",
            name_ar: "طبق خضار سوتيه مشكل (كوسة، بروكلي، جزر)",
            name_en: "Sautéed Veggies",
            category: "VEGGIES",
            portion_g: 150,
            household_measurement: "طبق خضار سوتيه متوسط",
            protein_g: 2,
            carb_g: 4,
            fat_g: 0,
            calories_kcal: 25,
            swaps: [],
          });

          // Basmati Rice
          const remC = Math.max(10, targetC - legC - 4);
          const riceGrams = Math.round(remC / 0.28);
          const riceP = Math.round(riceGrams * 0.028);
          items.push({
            food_code: "BASMATI_RICE",
            name_ar: "أرز بسمتي أبيض مطبوخ",
            name_en: "Cooked Basmati Rice",
            category: "CARBS",
            portion_g: riceGrams,
            household_measurement: `${riceGrams} جم مطبوخ (${Math.round(riceGrams / 25)} ملاعق كبيرة)`,
            protein_g: riceP,
            carb_g: remC,
            fat_g: 0.8,
            calories_kcal: Math.round(riceGrams * 1.3),
            swaps: generateSmartSwaps("CARBS", riceGrams, "BASMATI_RICE", "LUNCH", 8, allergenContext),
          });

          // Pea & Rice Protein Isolate
          const remP = Math.max(15, targetP - legP - riceP - 2);
          const powderGrams = Math.round(remP / 0.80);
          items.push({
            food_code: "PEA_RICE_PROTEIN_POWDER",
            name_ar: "سكوب بروتين نباتي معزول (Plant Protein Isolate Scoop)",
            name_en: "Plant Protein Isolate Scoop",
            category: "PROTEIN",
            portion_g: powderGrams,
            household_measurement: `${powderGrams} جم (${(powderGrams / 30).toFixed(1)} سكوب مع ماء)`,
            protein_g: remP,
            carb_g: 1,
            fat_g: 0.5,
            calories_kcal: Math.round(powderGrams * 3.5),
            swaps: [],
          });

          // Olive oil
          const remF = Math.max(0, targetF - legF - 0.8 - 0.5);
          const oilGrams = Math.round(remF);
          if (oilGrams > 0) {
            items.push({
              food_code: "OLIVE_OIL",
              name_ar: "زيت زيتون بكر ممتاز للطهي والتتبيل",
              name_en: "Extra Virgin Olive Oil",
              category: "FATS",
              portion_g: oilGrams,
              household_measurement: `${oilGrams} جم (1 ملعقة طعام)`,
              protein_g: 0,
              carb_g: 0,
              fat_g: oilGrams,
              calories_kcal: oilGrams * 9,
              swaps: [],
            });
          }
        } else {
          // CLINICAL PURINE/ALLERGEN SAFETY: Pure Vegan Lunch without Legumes
          recipeNameAr = "وجبة الغداء (أرز بسمتي مع خضار سوتيه وبروتين نباتي معزول)";
          recipeConceptDesc = "وجبة غداء نباتية نقية آمنة لحمض اليوريك والمفاصل، مصممة بأعلى معايير الحماية السريرية مع تغطية كامل الماكروز.";

          // Veggies
          items.push({
            food_code: "SAUTEED_VEGGIES",
            name_ar: "طبق خضار سوتيه مشكل (كوسة، بروكلي، جزر)",
            name_en: "Sautéed Veggies",
            category: "VEGGIES",
            portion_g: 150,
            household_measurement: "طبق خضار سوتيه متوسط",
            protein_g: 2,
            carb_g: 4,
            fat_g: 0,
            calories_kcal: 25,
            swaps: [],
          });

          // Basmati Rice
          const remC = Math.max(15, targetC - 4);
          const riceGrams = Math.round(remC / 0.28);
          const riceP = Math.round(riceGrams * 0.028);
          items.push({
            food_code: "BASMATI_RICE",
            name_ar: "أرز بسمتي أبيض مطبوخ",
            name_en: "Cooked Basmati Rice",
            category: "CARBS",
            portion_g: riceGrams,
            household_measurement: `${riceGrams} جم مطبوخ (${Math.round(riceGrams / 25)} ملاعق كبيرة)`,
            protein_g: riceP,
            carb_g: remC,
            fat_g: 0.8,
            calories_kcal: Math.round(riceGrams * 1.3),
            swaps: generateSmartSwaps("CARBS", riceGrams, "BASMATI_RICE", "LUNCH", 8, allergenContext),
          });

          // Pea & Rice Protein Isolate
          const remP = Math.max(20, targetP - riceP - 2);
          const powderGrams = Math.round(remP / 0.80);
          items.push({
            food_code: "PEA_RICE_PROTEIN_POWDER",
            name_ar: "سكوب بروتين نباتي معزول (Plant Protein Isolate Scoop)",
            name_en: "Plant Protein Isolate Scoop",
            category: "PROTEIN",
            portion_g: powderGrams,
            household_measurement: `${powderGrams} جم (${(powderGrams / 30).toFixed(1)} سكوب مع ماء)`,
            protein_g: remP,
            carb_g: 1,
            fat_g: 0.5,
            calories_kcal: Math.round(powderGrams * 3.5),
            swaps: [],
          });

          // Olive oil
          const remF = Math.max(0, targetF - 0.8 - 0.5);
          const oilGrams = Math.round(remF);
          if (oilGrams > 0) {
            items.push({
              food_code: "OLIVE_OIL",
              name_ar: "زيت زيتون بكر ممتاز للطهي والتتبيل",
              name_en: "Extra Virgin Olive Oil",
              category: "FATS",
              portion_g: oilGrams,
              household_measurement: `${oilGrams} جم (${Math.max(1, Math.round(oilGrams / 10))} ملعقة طعام)`,
              protein_g: 0,
              carb_g: 0,
              fat_g: oilGrams,
              calories_kcal: oilGrams * 9,
              swaps: [],
            });
          }
        }

      } else {
        const canUseLegumes = !isGout && !isLegumesExcluded && !isFavism;

        if (canUseLegumes) {
          recipeNameAr = "وجبة العشاء (يخنة حمص وعدس بالكمون مع بطاطس مشوية وسلطة)";
          recipeConceptDesc = "عشاء نباتي مريح للهضم غني بالألياف والمعادن لتعزيز الاستشفاء الليلي.";

          // Legumes Stew (250g)
          const legumeGrams = 250;
          const legP = Math.round(legumeGrams * 0.09);
          const legC = Math.round(legumeGrams * 0.20);
          const legF = Math.round(legumeGrams * 0.03);
          items.push({
            food_code: "MIXED_LEGUMES_STEW",
            name_ar: "يخنة الحمص والعدس البني بزيت الزيتون والليمون والكمون",
            name_en: "Mixed Chickpeas & Lentils Stew",
            category: "PROTEIN",
            portion_g: legumeGrams,
            household_measurement: `${legumeGrams} جم مطبوخ (طبق عميق متبل)`,
            protein_g: legP,
            carb_g: legC,
            fat_g: legF,
            calories_kcal: Math.round(legumeGrams * 1.3),
            swaps: generateSmartSwaps("PROTEIN", legumeGrams, "MIXED_LEGUMES_STEW", "DINNER", 8, allergenContext),
          });

          // Salad
          items.push({
            food_code: "MEDITERRANEAN_SALAD",
            name_ar: "طبق سلطة خضراء طازجة (خيار، طماطم، جرجير، بقدونس، رشة ليمون)",
            name_en: "Fresh Green Salad",
            category: "VEGGIES",
            portion_g: 150,
            household_measurement: "طبق سلطة خضراء متوسط",
            protein_g: 2,
            carb_g: 4,
            fat_g: 0,
            calories_kcal: 25,
            swaps: [],
          });

          // Roasted Potatoes
          const remC = Math.max(10, targetC - legC - 4);
          const potGrams = Math.round(remC / 0.20);
          const potP = Math.round(potGrams * 0.02);
          items.push({
            food_code: "ROASTED_POTATOES",
            name_ar: "بطاطس ودجز مشوية بالأعشاب في الإيرفراير",
            name_en: "Air-Fryer Herb Roasted Potatoes",
            category: "CARBS",
            portion_g: potGrams,
            household_measurement: `${potGrams} جم (حوالي ${Math.round(potGrams / 150)} ثمرات مشوية بالأعشاب)`,
            protein_g: potP,
            carb_g: remC,
            fat_g: 0.2,
            calories_kcal: Math.round(potGrams * 0.9),
            swaps: generateSmartSwaps("CARBS", potGrams, "ROASTED_POTATOES", "DINNER", 8, allergenContext),
          });

          // Pea & Rice Protein Isolate
          const remP = Math.max(15, targetP - legP - potP - 2);
          const powderGrams = Math.round(remP / 0.80);
          items.push({
            food_code: "PEA_RICE_PROTEIN_POWDER",
            name_ar: "سكوب بروتين نباتي معزول من البازلاء والأرز",
            name_en: "Plant Protein Isolate Scoop",
            category: "PROTEIN",
            portion_g: powderGrams,
            household_measurement: `${powderGrams} جم (${(powderGrams / 30).toFixed(1)} سكوب مع ماء)`,
            protein_g: remP,
            carb_g: 1,
            fat_g: 0.5,
            calories_kcal: Math.round(powderGrams * 3.5),
            swaps: [],
          });

          // Olive oil
          const remF = Math.max(0, targetF - legF - 0.2 - 0.5);
          const oilGrams = Math.round(remF);
          if (oilGrams > 0) {
            items.push({
              food_code: "OLIVE_OIL",
              name_ar: "زيت زيتون بكر ممتاز",
              name_en: "Extra Virgin Olive Oil",
              category: "FATS",
              portion_g: oilGrams,
              household_measurement: `${oilGrams} جم (1 ملعقة طعام)`,
              protein_g: 0,
              carb_g: 0,
              fat_g: oilGrams,
              calories_kcal: oilGrams * 9,
              swaps: [],
            });
          }
        } else {
          // CLINICAL PURINE/ALLERGEN SAFETY: Pure Vegan Dinner without Legumes
          recipeNameAr = "وجبة العشاء (بطاطس مشوية بالأعشاب مع سلطة خضراء وبروتين نباتي)";
          recipeConceptDesc = "عشاء نباتي مريح للهضم وخالي من البيورين ومسببات إجهاد المفاصل، يعزز الاستشفاء العضلي الليلي بأمان سريري تام.";

          // Salad
          items.push({
            food_code: "MEDITERRANEAN_SALAD",
            name_ar: "طبق سلطة خضراء طازجة (خيار، طماطم، جرجير، بقدونس، رشة ليمون)",
            name_en: "Fresh Green Salad",
            category: "VEGGIES",
            portion_g: 150,
            household_measurement: "طبق سلطة خضراء متوسط",
            protein_g: 2,
            carb_g: 4,
            fat_g: 0,
            calories_kcal: 25,
            swaps: [],
          });

          // Roasted Potatoes
          const remC = Math.max(15, targetC - 4);
          const potGrams = Math.round(remC / 0.20);
          const potP = Math.round(potGrams * 0.02);
          items.push({
            food_code: "ROASTED_POTATOES",
            name_ar: "بطاطس ودجز مشوية بالأعشاب في الإيرفراير",
            name_en: "Air-Fryer Herb Roasted Potatoes",
            category: "CARBS",
            portion_g: potGrams,
            household_measurement: `${potGrams} جم (حوالي ${Math.round(potGrams / 150)} ثمرات مشوية بالأعشاب)`,
            protein_g: potP,
            carb_g: remC,
            fat_g: 0.2,
            calories_kcal: Math.round(potGrams * 0.9),
            swaps: generateSmartSwaps("CARBS", potGrams, "ROASTED_POTATOES", "DINNER", 8, allergenContext),
          });

          // Pea & Rice Protein Isolate
          const remP = Math.max(20, targetP - potP - 2);
          const powderGrams = Math.round(remP / 0.80);
          items.push({
            food_code: "PEA_RICE_PROTEIN_POWDER",
            name_ar: "سكوب بروتين نباتي معزول من البازلاء والأرز",
            name_en: "Plant Protein Isolate Scoop",
            category: "PROTEIN",
            portion_g: powderGrams,
            household_measurement: `${powderGrams} جم (${(powderGrams / 30).toFixed(1)} سكوب مع ماء)`,
            protein_g: remP,
            carb_g: 1,
            fat_g: 0.5,
            calories_kcal: Math.round(powderGrams * 3.5),
            swaps: [],
          });

          // Olive oil
          const remF = Math.max(0, targetF - 0.2 - 0.5);
          const oilGrams = Math.round(remF);
          if (oilGrams > 0) {
            items.push({
              food_code: "OLIVE_OIL",
              name_ar: "زيت زيتون بكر ممتاز",
              name_en: "Extra Virgin Olive Oil",
              category: "FATS",
              portion_g: oilGrams,
              household_measurement: `${oilGrams} جم (${Math.max(1, Math.round(oilGrams / 10))} ملعقة طعام)`,
              protein_g: 0,
              carb_g: 0,
              fat_g: oilGrams,
              calories_kcal: oilGrams * 9,
              swaps: [],
            });
          }
        }
      }
    }

    // =========================================================================
    // CASE B: 5 OR 6 MINI-MEALS / POST-BARIATRIC SLEEVE (Dalia Elqadi - Case 2)
    // STRICT TOTAL PLATE WEIGHT CAP: <= 175-180g PER MEAL
    // =========================================================================
    else if (totalMeals >= 5) {
      recipeConceptDesc = "وجبة مركزة عالية الكثافة الغذائية محددة الحجم الصارم (وزن الطبق الإجمالي 165 - 175 جم) لحماية جدار المعدة ومنع التمدد ومتلازمة الإغراق.";

      if (mealNum === 1) {
        recipeNameAr = "الوجبة 1: إفطار بروتيني (بيض ودجاج وبطاطس مهروسة)";
        // 1 Whole egg (50g = 6.5g P, 5g F, 0.5g C, 75 kcal)
        items.push({
          food_code: "EGGS_OMELETTE",
          name_ar: "1 بيضة كاملة مسلوقة أو أومليت خفيف",
          name_en: "1 Whole Egg",
          category: "PROTEIN",
          portion_g: 50,
          household_measurement: "1 بيضة كاملة مسلوقة",
          protein_g: 6.5,
          carb_g: 0.5,
          fat_g: 5,
          calories_kcal: 75,
          swaps: [],
        });

        // Mashed Potato (45g = 9g C, 1g P, 40 kcal)
        items.push({
          food_code: "ROASTED_POTATOES",
          name_ar: "بطاطس مشوية مهروسة ناعمة",
          name_en: "Mashed Roasted Potatoes",
          category: "CARBS",
          portion_g: 45,
          household_measurement: "45 جم (ثلث ثمرة بطاطس مهروسة)",
          protein_g: 1,
          carb_g: 9,
          fat_g: 0.1,
          calories_kcal: 40,
          swaps: [],
        });

        // Chicken Breast bites (55g = 17g P, 1.6g F, 90 kcal)
        items.push({
          food_code: "CHICKEN_BREAST",
          name_ar: "قطع صدور دجاج مشوية مفرومة طرية",
          name_en: "Tender Minced Chicken Breast",
          category: "PROTEIN",
          portion_g: 55,
          household_measurement: "55 جم مطبوخ (قطع صغيرة سهلة الهضم)",
          protein_g: 17,
          carb_g: 0,
          fat_g: 1.6,
          calories_kcal: 90,
          swaps: [],
        });

        if (!isDairyExcluded) {
          items.push({
            food_code: "WHEY_PROTEIN",
            name_ar: "بودرة واي بروتين معزول مدعمة للوجبة",
            name_en: "Whey Isolate Protein Boost",
            category: "PROTEIN",
            portion_g: 15,
            household_measurement: "15 جم (نصف سكوب مخلوط مع البطاطس المهروسة)",
            protein_g: 12,
            carb_g: 0.5,
            fat_g: 0.2,
            calories_kcal: 55,
            swaps: [],
          });
        } else {
          items.push({
            food_code: "PEA_RICE_PROTEIN_POWDER",
            name_ar: "بودرة بروتين نباتي معزول (خالي تماماً من الألبان واللاكتوز)",
            name_en: "Plant-Based Isolate Protein Boost",
            category: "PROTEIN",
            portion_g: 15,
            household_measurement: "15 جم (نصف سكوب بروتين نباتي معزول)",
            protein_g: 12,
            carb_g: 0.5,
            fat_g: 0.2,
            calories_kcal: 55,
            swaps: [],
          });
        }

        // Olive oil (5g)
        items.push({
          food_code: "OLIVE_OIL",
          name_ar: "مسحة زيت زيتون بكر ممتاز",
          name_en: "Extra Virgin Olive Oil",
          category: "FATS",
          portion_g: 5,
          household_measurement: "5 جم (1 ملعقة صغيرة)",
          protein_g: 0,
          carb_g: 0,
          fat_g: 5,
          calories_kcal: 45,
          swaps: [],
        });
        // Total Plate Weight = 55 + 50 + 60 + 12 + 5 = 182g (<= 180g standard).
        // Total Macros = P:37g, C:11g, F:12g, Kcal: ~309 kcal.

      } else if (mealNum === 2) {
        recipeNameAr = "الوجبة 2: سناك بروتيني ناعم (جبن قريش وبطاطا حلوة وبروتين)";

        if (!isDairyExcluded) {
          items.push({
            food_code: "COTTAGE_CHEESE",
            name_ar: "جبن قريش طبيعي ناعم ومهروس بزيت الزيتون",
            name_en: "Whipped Cottage Cheese",
            category: "PROTEIN",
            portion_g: 80,
            household_measurement: "80 جم (ثلث كوب ناعم سهل الهضم)",
            protein_g: 10,
            carb_g: 2.4,
            fat_g: 1.2,
            calories_kcal: 60,
            swaps: [],
          });
        } else {
          items.push({
            food_code: "EGGS_OMELETTE",
            name_ar: "بياض بيض مخفوق مطبوخ ناعم وسهل الهضم (خالي من اللاكتوز)",
            name_en: "Soft Scrambled Egg Whites",
            category: "PROTEIN",
            portion_g: 80,
            household_measurement: "80 جم (بياض بيضتين مطبوخ بزيت زيتون)",
            protein_g: 10,
            carb_g: 0.5,
            fat_g: 0.1,
            calories_kcal: 45,
            swaps: [],
          });
        }

        // Baked Sweet Potato (45g = 10g C, 1g P, 42 kcal)
        items.push({
          food_code: "SWEET_POTATO",
          name_ar: "بطاطا حلوة مشوية مهروسة ناعمة",
          name_en: "Mashed Sweet Potato",
          category: "CARBS",
          portion_g: 45,
          household_measurement: "45 جم (ربع ثمرة بطاطا)",
          protein_g: 1,
          carb_g: 10,
          fat_g: 0.1,
          calories_kcal: 42,
          swaps: [],
        });

        if (!isDairyExcluded) {
          items.push({
            food_code: "WHEY_PROTEIN",
            name_ar: "سكوب واي بروتين معزول (Whey Isolate)",
            name_en: "Whey Isolate Scoop",
            category: "PROTEIN",
            portion_g: 20,
            household_measurement: "20 جم (ثلثي سكوب ناعم)",
            protein_g: 16,
            carb_g: 0.6,
            fat_g: 0.3,
            calories_kcal: 75,
            swaps: [],
          });
        } else {
          items.push({
            food_code: "PEA_RICE_PROTEIN_POWDER",
            name_ar: "سكوب بروتين نباتي معزول (Dairy-Free)",
            name_en: "Plant-Based Isolate Scoop",
            category: "PROTEIN",
            portion_g: 20,
            household_measurement: "20 جم (ثلثي سكوب ناعم)",
            protein_g: 16,
            carb_g: 0.6,
            fat_g: 0.3,
            calories_kcal: 75,
            swaps: [],
          });
        }

        // Tender Chicken Bites (20g = 6.2g P, 0.6g F, 33 kcal)
        items.push({
          food_code: "CHICKEN_BREAST",
          name_ar: "قطع دجاج مشوية طرية خفيفة",
          name_en: "Tender Chicken Bites",
          category: "PROTEIN",
          portion_g: 20,
          household_measurement: "20 جم مطبوخ",
          protein_g: 6.2,
          carb_g: 0,
          fat_g: 0.6,
          calories_kcal: 33,
          swaps: [],
        });

        // Olive oil (5g)
        items.push({
          food_code: "OLIVE_OIL",
          name_ar: "زيت زيتون بكر ممتاز",
          name_en: "Extra Virgin Olive Oil",
          category: "FATS",
          portion_g: 5,
          household_measurement: "5 جم (1 ملعقة صغيرة)",
          protein_g: 0,
          carb_g: 0,
          fat_g: 5,
          calories_kcal: 45,
          swaps: [],
        });
        // Total Plate Weight = 80 + 55 + 20 + 30 + 6 = 191g -> Total Macros: P:36.3g, C:15g, F:8.5g, Kcal: ~291 kcal.

      } else if (mealNum === 4) {
        if (isGout || isFishExcluded) {
          recipeNameAr = "الوجبة 4: وجبة خفيفة (صدور دجاج وبطاطا حلوة)";
          items.push({
            food_code: "CHICKEN_BREAST",
            name_ar: "صدور دجاج مشوية متبلة بالليمون والأعشاب",
            name_en: "Grilled Chicken Breast Cubes",
            category: "PROTEIN",
            portion_g: 80,
            household_measurement: "80 جم مطبوخ مقطع مكعبات",
            protein_g: 24.8,
            carb_g: 0,
            fat_g: 2.4,
            calories_kcal: 120,
            swaps: [],
          });
        } else {
          recipeNameAr = "الوجبة 4: وجبة خفيفة (تونة لايت وبطاطا حلوة)";
          // Canned Tuna (90g = 23.4g P, 0.9g F, 104 kcal)
          items.push({
            food_code: "CANNED_TUNA",
            name_ar: "تونة لايت مصفاة تماماً بالليمون والكمون",
            name_en: "Drained Light Tuna",
            category: "PROTEIN",
            portion_g: 90,
            household_measurement: "90 جم مصفى (ثلثي علبة تونة)",
            protein_g: 23.4,
            carb_g: 0,
            fat_g: 0.9,
            calories_kcal: 104,
            swaps: [],
          });
        }

        // Sweet Potato (50g = 10.5g C, 1g P, 48 kcal)
        items.push({
          food_code: "SWEET_POTATO",
          name_ar: "بطاطا حلوة مشوية مهروسة",
          name_en: "Mashed Sweet Potato",
          category: "CARBS",
          portion_g: 50,
          household_measurement: "50 جم مطبوخة ومهروسة",
          protein_g: 1,
          carb_g: 10.5,
          fat_g: 0.1,
          calories_kcal: 48,
          swaps: [],
        });

        if (!isDairyExcluded) {
          items.push({
            food_code: "WHEY_PROTEIN",
            name_ar: "بودرة بروتين معزول لدعم التارجت",
            name_en: "Protein Isolate Boost",
            category: "PROTEIN",
            portion_g: 15,
            household_measurement: "15 جم (نصف سكوب)",
            protein_g: 12,
            carb_g: 0.5,
            fat_g: 0.2,
            calories_kcal: 55,
            swaps: [],
          });
        } else {
          items.push({
            food_code: "PEA_RICE_PROTEIN_POWDER",
            name_ar: "بودرة بروتين نباتي معزول لدعم التارجت (Dairy-Free)",
            name_en: "Plant-Based Protein Boost",
            category: "PROTEIN",
            portion_g: 15,
            household_measurement: "15 جم (نصف سكوب)",
            protein_g: 12,
            carb_g: 0.5,
            fat_g: 0.2,
            calories_kcal: 55,
            swaps: [],
          });
        }

        // Olive oil (7g)
        items.push({
          food_code: "OLIVE_OIL",
          name_ar: "زيت زيتون بكر ممتاز",
          name_en: "Extra Virgin Olive Oil",
          category: "FATS",
          portion_g: 7,
          household_measurement: "7 جم (1 ملعقة صغيرة)",
          protein_g: 0,
          carb_g: 0,
          fat_g: 7,
          calories_kcal: 63,
          swaps: [],
        });
        // Total Plate Weight = 90 + 50 + 15 + 7 = 162g (<= 180g!).
        // Total Macros = P:36.4g, C:11g, F:8.2g, Kcal: ~270 kcal.

      } else {
        // Meals 3 & 5 (Lunch & Dinner)
        recipeNameAr = `الوجبة ${mealNum}: وجبة دجاج وأرز وخضار طرية`;

        // Tender Chicken Breast (85g = 26.5g P, 2.5g F, 140 kcal)
        items.push({
          food_code: "CHICKEN_BREAST",
          name_ar: "صدور دجاج متبلة مشوية طرية سهلة الهضم",
          name_en: "Tender Grilled Chicken",
          category: "PROTEIN",
          portion_g: 85,
          household_measurement: "85 جم مطبوخ (شريحة طرية سهلة المضغ)",
          protein_g: 26.5,
          carb_g: 0,
          fat_g: 2.5,
          calories_kcal: 140,
          swaps: [],
        });

        // Soft Basmati Rice (45g = 12.6g C, 1.3g P, 58 kcal)
        items.push({
          food_code: "BASMATI_RICE",
          name_ar: "أرز بسمتي أبيض مسلوق طري",
          name_en: "Soft Basmati Rice",
          category: "CARBS",
          portion_g: 45,
          household_measurement: "45 جم مطبوخ (2 ملعقة طعام)",
          protein_g: 1.3,
          carb_g: 12.6,
          fat_g: 0.2,
          calories_kcal: 58,
          swaps: [],
        });

        // Steamed soft zucchini & carrots (20g = 0.5g P, 1g C, 8 kcal)
        items.push({
          food_code: "SAUTEED_VEGGIES",
          name_ar: "كوسة وجزر على البخار ناعم",
          name_en: "Soft Steamed Veggies",
          category: "VEGGIES",
          portion_g: 20,
          household_measurement: "20 جم خضار مطبوخ ناعم",
          protein_g: 0.5,
          carb_g: 1,
          fat_g: 0,
          calories_kcal: 8,
          swaps: [],
        });

        if (!isDairyExcluded) {
          items.push({
            food_code: "WHEY_PROTEIN",
            name_ar: "بروتين معزول مدمج لدعم الاستشفاء",
            name_en: "Protein Boost",
            category: "PROTEIN",
            portion_g: 12,
            household_measurement: "12 جم",
            protein_g: 10,
            carb_g: 0.4,
            fat_g: 0.2,
            calories_kcal: 45,
            swaps: [],
          });
        } else {
          items.push({
            food_code: "PEA_RICE_PROTEIN_POWDER",
            name_ar: "بروتين نباتي معزول مدمج لدعم الاستشفاء (Dairy-Free)",
            name_en: "Plant Protein Boost",
            category: "PROTEIN",
            portion_g: 12,
            household_measurement: "12 جم",
            protein_g: 10,
            carb_g: 0.4,
            fat_g: 0.2,
            calories_kcal: 45,
            swaps: [],
          });
        }

        // Olive oil (7g)
        items.push({
          food_code: "OLIVE_OIL",
          name_ar: "زيت زيتون بكر ممتاز للطهي والتتبيل",
          name_en: "Extra Virgin Olive Oil",
          category: "FATS",
          portion_g: 7,
          household_measurement: "7 جم (1 ملعقة طعام خفيفة)",
          protein_g: 0,
          carb_g: 0,
          fat_g: 7,
          calories_kcal: 63,
          swaps: [],
        });
        // Total Plate Weight = 85 + 45 + 20 + 12 + 7 = 169g (<= 180g!).
        // Total Macros = P:38.3g, C:14g, F:9.9g, Kcal: ~314 kcal.
      }
    }

    // =========================================================================
    // CASE C: 2 LARGE MEALS / INTERMITTENT FASTING (Youssef Kamal - Case 4)
    // =========================================================================
    else if (totalMeals === 2) {
      if (mealNum === 1) {
        recipeNameAr = "الوجبة 1: وجبة الإفطار (كسر الصيام المتكامل)";
        recipeConceptDesc = "وجبة كسر صيام غنية ومتوازنة تجمع بين البيض والجبن والرومي/الواي بروتين لتغطية 85-90 جم بروتين باستمتاع ودون حجم طعام مزعج.";

        // 3 Whole Eggs (165g = 20g P, 15g F, 1g C, 215 kcal)
        items.push({
          food_code: "EGGS_OMELETTE",
          name_ar: "بيض كامل مسلوق أو أومليت بالخضار (3 بيضات كاملة)",
          name_en: "3 Whole Eggs",
          category: "PROTEIN",
          portion_g: 165,
          household_measurement: "3 بيضات كاملة للاستفادة من الفيتامينات والدهون الطبيعية",
          protein_g: 20,
          carb_g: 1,
          fat_g: 15,
          calories_kcal: 215,
          swaps: [],
        });

        let currentP = 20;
        let currentF = 15;
        let currentC = 1;

        if (!isDairyExcluded) {
          // Cottage cheese capped at 150g (18g P, 4.5g C, 2.2g F, 112 kcal)
          items.push({
            food_code: "COTTAGE_CHEESE",
            name_ar: "جبن قريش طبيعي متبل بالزعتر وزيت الزيتون",
            name_en: "Seasoned Cottage Cheese (150g Portion)",
            category: "PROTEIN",
            portion_g: 150,
            household_measurement: "150 جم (نصف كوب متبل)",
            protein_g: 18,
            carb_g: 4.5,
            fat_g: 2.2,
            calories_kcal: 112,
            swaps: [],
          });
          currentP += 18;
          currentF += 2.2;
          currentC += 4.5;

          if (proteinPowderAvailable) {
            items.push({
              food_code: "WHEY_PROTEIN",
              name_ar: "سكوب واي بروتين معزول (Whey Isolate)",
              name_en: "Whey Isolate Scoop",
              category: "PROTEIN",
              portion_g: 30,
              household_measurement: "1 سكوب (30 جم) مع ماء",
              protein_g: 24,
              carb_g: 1,
              fat_g: 0,
              calories_kcal: 100,
              swaps: [],
            });
            currentP += 24;
            currentC += 1;
          }
        }

        // Salad (200g = 3g P, 5g C, 30 kcal)
        items.push({
          food_code: "MEDITERRANEAN_SALAD",
          name_ar: "طبق سلطة خضراء كبير مشكل",
          name_en: "Large Green Salad",
          category: "VEGGIES",
          portion_g: 200,
          household_measurement: "طبق سلطة كبير",
          protein_g: 3,
          carb_g: 5,
          fat_g: 0,
          calories_kcal: 30,
          swaps: [],
        });
        currentP += 3;
        currentC += 5;

        // Baladi Bread to close carb target exactly
        const remC = Math.max(20, targetC - currentC);
        const breadGrams = Math.round(remC / 0.52);
        const breadP = Math.round(breadGrams * 0.09);
        const breadF = Math.round(breadGrams * 0.01);
        items.push({
          food_code: "BALADI_BREAD",
          name_ar: "خبز بلدي مصري بالردة (قمح كامل)",
          name_en: "Egyptian Baladi Bread",
          category: "CARBS",
          portion_g: breadGrams,
          household_measurement: `${breadGrams} جم (~ ${(breadGrams / 85).toFixed(1)} رغيف بلدي)`,
          protein_g: breadP,
          carb_g: remC,
          fat_g: breadF,
          calories_kcal: Math.round(breadGrams * 2.6),
          swaps: generateSmartSwaps("CARBS", breadGrams, "BALADI_BREAD", "BREAKFAST", 10, allergenContext),
        });
        currentP += breadP;
        currentF += breadF;

        // Close remaining Protein via Turkey / Chicken Breast
        const remP = Math.max(0, targetP - currentP);
        if (remP >= 8 && !isPoultryExcluded) {
          const turkeyGrams = Math.round(remP / 0.22);
          items.push({
            food_code: "SMOKED_TURKEY",
            name_ar: "شرائح صدور رومي مدخن فاخرة / صدور دجاج مشوية",
            name_en: "Smoked Turkey / Grilled Chicken Slices",
            category: "PROTEIN",
            portion_g: turkeyGrams,
            household_measurement: `${turkeyGrams} جم (3-4 شرائح)`,
            protein_g: remP,
            carb_g: 1,
            fat_g: 1.5,
            calories_kcal: Math.round(turkeyGrams * 1.1),
            swaps: [],
          });
          currentF += 1.5;
        }

        // Close remaining Fat with Olive oil
        const remF = Math.max(0, targetF - currentF);
        const oilGrams = Math.round(remF);
        if (oilGrams > 0) {
          items.push({
            food_code: "OLIVE_OIL",
            name_ar: "زيت زيتون بكر ممتاز",
            name_en: "Extra Virgin Olive Oil",
            category: "FATS",
            portion_g: oilGrams,
            household_measurement: `${oilGrams} جم (1 ملعقة طعام)`,
            protein_g: 0,
            carb_g: 0,
            fat_g: oilGrams,
            calories_kcal: oilGrams * 9,
            swaps: [],
          });
        }

      } else {
        // Meal 2 (IF Closing Meal)
        recipeNameAr = "الوجبة 2: الوجبة الختامية (صدور دجاج مع أرز بسمتي وخضار)";
        recipeConceptDesc = "وجبة ضخمة ومشبعة تغطي احتياجات الطاقة والاستشفاء العضلي بالكامل قبل بدء ساعات الصيام.";

        // Steamed Veggies (200g = 3g P, 6g C, 35 kcal)
        items.push({
          food_code: "SAUTEED_VEGGIES",
          name_ar: "طبق خضار سوتيه/مشوي مشكل",
          name_en: "Sautéed Veggies",
          category: "VEGGIES",
          portion_g: 200,
          household_measurement: "طبق خضار سوتيه كبير",
          protein_g: 3,
          carb_g: 6,
          fat_g: 0,
          calories_kcal: 35,
          swaps: [],
        });

        // Basmati Rice to close carb target exactly
        const remC = Math.max(20, targetC - 6);
        const riceGrams = Math.round(remC / 0.28);
        const riceP = Math.round(riceGrams * 0.028);
        const riceF = Math.round(riceGrams * 0.004);
        items.push({
          food_code: "BASMATI_RICE",
          name_ar: "أرز بسمتي أبيض مطبوخ",
          name_en: "Cooked Basmati Rice",
          category: "CARBS",
          portion_g: riceGrams,
          household_measurement: `${riceGrams} جم مطبوخ (${Math.round(riceGrams / 25)} ملاعق كبيرة)`,
          protein_g: riceP,
          carb_g: remC,
          fat_g: riceF,
          calories_kcal: Math.round(riceGrams * 1.3),
          swaps: generateSmartSwaps("CARBS", riceGrams, "BASMATI_RICE", "LUNCH", 10, allergenContext),
        });

        // Capped Primary Meat (Chicken Breast: 200g = 62g P, 5g F, 330 kcal)
        const chickenGrams = 200;
        items.push({
          food_code: "CHICKEN_BREAST",
          name_ar: "صدور دجاج متبلة مشوية على الجريل",
          name_en: "Grilled Chicken Breast",
          category: "PROTEIN",
          portion_g: chickenGrams,
          household_measurement: `${chickenGrams} جم مطبوخ (قطعتان متوسطتان)`,
          protein_g: 62,
          carb_g: 0,
          fat_g: 5,
          calories_kcal: 330,
          swaps: generateSmartSwaps("PROTEIN", chickenGrams, "CHICKEN_BREAST", "LUNCH", 10, allergenContext),
        });

        // Secondary Protein source to close remaining protein
        const remP = Math.max(0, targetP - 62 - riceP - 3);
        let secF = 0;
        if (remP >= 15 && !allergenContext.isFishExcluded && !allergenContext.isGout) {
          const tunaGrams = Math.round(remP / 0.26);
          secF = Math.round(tunaGrams * 0.01);
          items.push({
            food_code: "CANNED_TUNA",
            name_ar: "علبة تونة لايت مصفاة بالليمون",
            name_en: "Drained Canned Tuna",
            category: "PROTEIN",
            portion_g: tunaGrams,
            household_measurement: `${tunaGrams} جم مصفى (${(tunaGrams / 140).toFixed(1)} علبة)`,
            protein_g: remP,
            carb_g: 0,
            fat_g: secF,
            calories_kcal: Math.round(tunaGrams * 1.15),
            swaps: [],
          });
        } else if (remP >= 15 && !allergenContext.isRedMeatExcluded && !allergenContext.isGout) {
          const beefGrams = Math.round(remP / 0.29);
          secF = Math.round(beefGrams * 0.06);
          items.push({
            food_code: "LEAN_BEEF",
            name_ar: "لحم بقري مفروم قليل الدسم (95/5)",
            name_en: "Lean Beef (95/5)",
            category: "PROTEIN",
            portion_g: beefGrams,
            household_measurement: `${beefGrams} جم مطبوخ`,
            protein_g: remP,
            carb_g: 0,
            fat_g: secF,
            calories_kcal: Math.round(beefGrams * 1.75),
            swaps: [],
          });
        }

        // Olive oil to close remaining Fat
        const remF = Math.max(0, targetF - 5 - secF - riceF);
        const oilGrams = Math.round(remF);
        if (oilGrams > 0) {
          items.push({
            food_code: "OLIVE_OIL",
            name_ar: "زيت زيتون بكر ممتاز للطهي والتتبيل",
            name_en: "Extra Virgin Olive Oil",
            category: "FATS",
            portion_g: oilGrams,
            household_measurement: `${oilGrams} جم (1 ملعقة طعام كبيرة)`,
            protein_g: 0,
            carb_g: 0,
            fat_g: oilGrams,
            calories_kcal: oilGrams * 9,
            swaps: [],
          });
        }
      }
    }

    // =========================================================================
    // CASE D: STANDARD 3-4 MEALS (Includes Gout, Lactation, Shift Workers, Allergies)
    // COTTAGE CHEESE HARD CAP: 150g (MAX 180g). COMBINES WITH EGGS/CHICKEN/TUNA.
    // =========================================================================
    else {
      if (mealNum === 1) {
        // BREAKFAST
        let currentP = 0;
        let currentF = 0;
        let currentC = 0;

        recipeNameAr = isGlutenExcluded
          ? "وجبة الإفطار (بيض مع صدور دجاج وبطاطس مشوية وسلطة)"
          : (isDairyExcluded
            ? "وجبة الإفطار (بيض مع صدور دجاج/تونة وخبز بلدي)"
            : (isGout
              ? "وجبة الإفطار (بيض مع جبن قريش وصدور دجاج وخبز بلدي)"
              : "وجبة الإفطار (بيض مع جبن قريش متبل بالزعتر وخبز بلدي وسلطة)"));

        recipeConceptDesc = isGout
          ? "سفرة إفطار خالية تماماً من البيورينات العالية واللحوم الحمراء، تعتمد على توليفة البيض والجبن القريش المعتدل (150 جم) والدجاج الصافي لضبط اليوريك أسيد."
          : "سفرة إفطار متوازنة وشهية تمد الجسم بالبروتين عالي الجودة والألياف والشبع مع الاستفادة الكاملة من صفار البيض دون أي هدر.";

        if (!isEggsExcluded) {
          const wholeEggsCount = (targetP >= 55 || isAdvanced) ? 3 : 2;
          const wholeEggsGrams = wholeEggsCount * 55;
          const eggProtein = Math.round(wholeEggsCount * 6.5);
          const eggFat = Math.round(wholeEggsCount * 5.0);

          items.push({
            food_code: "EGGS_OMELETTE",
            name_ar: `بيض كامل مسلوق أو أومليت بالخضار (${wholeEggsCount} بيضات كاملة)`,
            name_en: `${wholeEggsCount} Whole Eggs (Boiled / Omelette)`,
            category: "PROTEIN",
            portion_g: wholeEggsGrams,
            household_measurement: `${wholeEggsCount} بيضات كاملة (صفار وبياض للاستفادة الكاملة من الفيتامينات والدهون الطبيعية دون أي هدر)`,
            protein_g: eggProtein,
            carb_g: 1,
            fat_g: eggFat,
            calories_kcal: Math.round(eggProtein * 4 + eggFat * 9),
            swaps: generateSmartSwaps("PROTEIN", wholeEggsGrams, "EGGS_OMELETTE", "BREAKFAST", 5, allergenContext),
          });
          currentP += eggProtein;
          currentF += eggFat;
          currentC += 1;
        }

        // Salad (150g = 2g P, 4g C, 25 kcal)
        items.push({
          food_code: "MEDITERRANEAN_SALAD",
          name_ar: isGout ? "طبق سلطة خضراء طازجة بدون ملح متبلة برشة ليمون وكمون" : "طبق سلطة خضراء طازجة (خيار، طماطم، جرجير، بقدونس، رشة ليمون)",
          name_en: "Fresh Mediterranean Green Salad",
          category: "VEGGIES",
          portion_g: 150,
          household_measurement: "طبق سلطة خضراء متوسط مشكل",
          protein_g: 2,
          carb_g: 4,
          fat_g: 0,
          calories_kcal: 25,
          swaps: [],
        });
        currentP += 2;
        currentC += 4;

        // Cottage Cheese portion capped strictly at 150g (max 180g)
        let cheeseC = 0;
        let cheeseF = 0;
        let cheeseP = 0;
        if (!isDairyExcluded) {
          const cheeseGrams = 150; // Capped at 150g ideal portion
          cheeseP = Math.round((cheeseGrams / 100) * 12);
          cheeseF = Math.round((cheeseGrams / 100) * 1.5);
          cheeseC = Math.round((cheeseGrams / 100) * 3);
          items.push({
            food_code: "COTTAGE_CHEESE",
            name_ar: isGout ? "جبن قريش طبيعي قليل الملح متبل بزيت الزيتون والنعناع" : "جبن قريش طبيعي متبل برشة زعتر وزيت زيتون خفيف",
            name_en: "Seasoned Cottage Cheese (150g Cap)",
            category: "PROTEIN",
            portion_g: cheeseGrams,
            household_measurement: "150 جم (نصف كوب متبل بالنعناع والزعتر - حجم مثالي مستساغ)",
            protein_g: cheeseP,
            carb_g: cheeseC,
            fat_g: cheeseF,
            calories_kcal: Math.round((cheeseGrams / 100) * 75),
            swaps: generateSmartSwaps("PROTEIN", cheeseGrams, "COTTAGE_CHEESE", "BREAKFAST", 5, allergenContext),
          });
          currentP += cheeseP;
          currentF += cheeseF;
          currentC += cheeseC;
        }

        // Breakfast Carb Selection (exact remaining carb)
        const remC = Math.max(5, targetC - currentC);
        let carbP = 0;
        let carbF = 0;

        if (isGlutenExcluded) {
          const potatoGrams = Math.round(remC / 0.20);
          carbP = Math.round(potatoGrams * 0.02);
          items.push({
            food_code: "ROASTED_POTATOES",
            name_ar: "بطاطس ودجز مشوية بالأعشاب في الإيرفراير (خالية من الجلوتين)",
            name_en: "Air-Fryer Herb Roasted Potatoes (Gluten-Free)",
            category: "CARBS",
            portion_g: potatoGrams,
            household_measurement: `${potatoGrams} جم (حوالي ${Math.round(potatoGrams / 150)} ثمرات بطاطس مشوية بالأعشاب)`,
            protein_g: carbP,
            carb_g: remC,
            fat_g: 0,
            calories_kcal: Math.round(potatoGrams * 0.9),
            swaps: generateSmartSwaps("CARBS", potatoGrams, "ROASTED_POTATOES", "BREAKFAST", 5, allergenContext),
          });
        } else {
          const breadGrams = Math.round(remC / 0.52);
          carbP = Math.round(breadGrams * 0.09);
          carbF = Math.round(breadGrams * 0.01);
          const baladiLoaves = (breadGrams / 85).toFixed(1);
          items.push({
            food_code: "BALADI_BREAD",
            name_ar: "خبز بلدي مصري بالردة (قمح كامل)",
            name_en: "Egyptian Baladi Bread",
            category: "CARBS",
            portion_g: breadGrams,
            household_measurement: `${breadGrams} جم (~${baladiLoaves} رغيف بلدي متوسط)`,
            protein_g: carbP,
            carb_g: remC,
            fat_g: carbF,
            calories_kcal: Math.round(breadGrams * 2.6),
            swaps: generateSmartSwaps("CARBS", breadGrams, "BALADI_BREAD", "BREAKFAST", 5, allergenContext),
          });
        }
        currentP += carbP;
        currentF += carbF;

        // Additional Protein via Chicken Breast slices (to avoid overloading cottage cheese)
        const finalRemP = Math.max(0, targetP - currentP);
        if (finalRemP >= 6) {
          if (!isPoultryExcluded) {
            const chickenGrams = Math.round(finalRemP / 0.31);
            const chkF = Math.round(chickenGrams * 0.03);
            items.push({
              food_code: "CHICKEN_BREAST",
              name_ar: "صدور دجاج مشوية خفيفة للإفطار",
              name_en: "Grilled Chicken Breast Slices",
              category: "PROTEIN",
              portion_g: chickenGrams,
              household_measurement: `${chickenGrams} جم وزن مطبوخ (شريحة خفيفة)`,
              protein_g: finalRemP,
              carb_g: 0,
              fat_g: chkF,
              calories_kcal: Math.round(chickenGrams * 1.65),
              swaps: generateSmartSwaps("PROTEIN", chickenGrams, "CHICKEN_BREAST", "BREAKFAST", 5, allergenContext),
            });
            currentF += chkF;
          } else if (!isFishExcluded && !isGout) {
            const tunaGrams = Math.round(finalRemP / 0.26);
            const tunaF = Math.round(tunaGrams * 0.01);
            items.push({
              food_code: "CANNED_TUNA",
              name_ar: "تونة لايت مصفاة خفيفة",
              name_en: "Drained Light Tuna",
              category: "PROTEIN",
              portion_g: tunaGrams,
              household_measurement: `${tunaGrams} جم مصفى`,
              protein_g: finalRemP,
              carb_g: 0,
              fat_g: tunaF,
              calories_kcal: Math.round(tunaGrams * 1.15),
              swaps: [],
            });
            currentF += tunaF;
          }
        }

        // Fat / Olive oil to close Fat target exactly
        const remF = Math.max(0, targetF - currentF);
        const oilGrams = Math.round(remF);
        if (oilGrams > 0) {
          items.push({
            food_code: "OLIVE_OIL",
            name_ar: "زيت زيتون بكر ممتاز (مسحة خفيفة للطهي أو تتبيل الوجبة)",
            name_en: "Extra Virgin Olive Oil",
            category: "FATS",
            portion_g: oilGrams,
            household_measurement: `${oilGrams} جم (1 ملعقة صغيرة / مسحة طهي خفيفة)`,
            protein_g: 0,
            carb_g: 0,
            fat_g: oilGrams,
            calories_kcal: oilGrams * 9,
            swaps: [],
          });
        }

      } else if (mealNum === 2) {
        // LUNCH
        recipeNameAr = isGout
          ? "وجبة الغداء (صدور دجاج مشوية مع أرز بسمتي وخضار سوتيه)"
          : (isLowBudget && !isFishExcluded
            ? "وجبة الغداء (سمك بلطي مشوي مع أرز وسلطة خضراء)"
            : "وجبة الغداء (صدور دجاج مشوية مع أرز بسمتي وخضار سوتيه)");

        recipeConceptDesc = "وجبة الغداء الرئيسية قبل التمرين غنية بالكاربوهيدرات المعقدة والبروتين الصافي للاستشفاء.";

        // Sautéed Veggies (150g = 2g P, 4g C, 25 kcal)
        items.push({
          food_code: "SAUTEED_VEGGIES",
          name_ar: "طبق خضار سوتيه/مشوي (كوسة، بروكلي، جزر، فلفل ألوان)",
          name_en: "Sautéed Garden Veggies",
          category: "VEGGIES",
          portion_g: 150,
          household_measurement: "طبق خضار سوتيه متوسط مشكل",
          protein_g: 2,
          carb_g: 4,
          fat_g: 0,
          calories_kcal: 25,
          swaps: [],
        });

        // Carb Source (Basmati Rice: 28% C, 2.8% P)
        const remC = Math.max(5, targetC - 4);
        const riceGrams = Math.round(remC / 0.28);
        const riceP = Math.round(riceGrams * 0.028);
        const riceF = Math.round(riceGrams * 0.004);
        const spoons = Math.round(riceGrams / 25);
        items.push({
          food_code: "BASMATI_RICE",
          name_ar: "أرز بسمتي أبيض أو حبة طويلة مطبوخ",
          name_en: "Cooked Basmati Rice",
          category: "CARBS",
          portion_g: riceGrams,
          household_measurement: `${riceGrams} جم وزن مطبوخ (${spoons} ملاعق طعام كبيرة)`,
          protein_g: riceP,
          carb_g: remC,
          fat_g: riceF,
          calories_kcal: Math.round(riceGrams * 1.3),
          swaps: generateSmartSwaps("CARBS", riceGrams, "BASMATI_RICE", "LUNCH", 10, allergenContext),
        });

        // Protein Source: Chicken Breast / Tilapia Fillet (NO BEEF LIVER DAILY)
        const remP = Math.max(15, targetP - 2 - riceP);
        let protF = 0;

        if (isLowBudget && !isFishExcluded && !isGout) {
          // Tilapia Fish Fillet (26% P, 2% F)
          const fishGrams = Math.round(remP / 0.26);
          protF = Math.round(fishGrams * 0.02);
          items.push({
            food_code: "TILAPIA_FISH",
            name_ar: "سمك فيليه بلطي طازج مشوي بالتوابل والليمون (بروتين اقتصادي عالي الجودة وآمن يومياً)",
            name_en: "Fresh Grilled Tilapia Fillet",
            category: "PROTEIN",
            portion_g: fishGrams,
            household_measurement: `${fishGrams} جم مطبوخ (قطعة فيليه كبيرة)`,
            protein_g: remP,
            carb_g: 0,
            fat_g: protF,
            calories_kcal: Math.round(fishGrams * 1.25),
            swaps: generateSmartSwaps("PROTEIN", fishGrams, "TILAPIA_FISH", "LUNCH", 10, allergenContext),
          });
        } else {
          // Chicken Breast (31% P, 3% F)
          const chickenGrams = Math.round(remP / 0.31);
          protF = Math.round(chickenGrams * 0.03);
          items.push({
            food_code: "CHICKEN_BREAST",
            name_ar: "صدور دجاج متبلة مشوية على الجريل",
            name_en: "Grilled Chicken Breast",
            category: "PROTEIN",
            portion_g: chickenGrams,
            household_measurement: `${chickenGrams} جم وزن مطبوخ (حجم كف اليد ونصف)`,
            protein_g: remP,
            carb_g: 0,
            fat_g: protF,
            calories_kcal: Math.round(chickenGrams * 1.65),
            swaps: generateSmartSwaps("PROTEIN", chickenGrams, "CHICKEN_BREAST", "LUNCH", 10, allergenContext),
          });
        }

        // Fat Source: Olive Oil
        const remF = Math.max(0, targetF - protF - riceF);
        const oilGrams = Math.round(remF);
        if (oilGrams > 0) {
          items.push({
            food_code: "OLIVE_OIL",
            name_ar: "زيت زيتون بكر ممتاز للطهي والتتبيل",
            name_en: "Extra Virgin Olive Oil",
            category: "FATS",
            portion_g: oilGrams,
            household_measurement: `${oilGrams} جم (1 ملعقة طعام كبيرة)`,
            protein_g: 0,
            carb_g: 0,
            fat_g: oilGrams,
            calories_kcal: oilGrams * 9,
            swaps: [],
          });
        }

      } else if (mealNum === 3) {
        // DINNER
        recipeNameAr = "وجبة العشاء (صدور دجاج مشوية مع بطاطس مشوية وسلطة)";
        recipeConceptDesc = "وجبة عشاء مريحة للهضم غنية بالبروتين الصافي والكاربوهيدرات النظيفة لدعم الاستشفاء.";

        // Salad (150g = 2g P, 4g C, 25 kcal)
        items.push({
          food_code: "MEDITERRANEAN_SALAD",
          name_ar: "طبق سلطة خضراء مشكل بالخضار الورقي (جرجير، خيار، طماطم)",
          name_en: "Leafy Green Mediterranean Salad",
          category: "VEGGIES",
          portion_g: 150,
          household_measurement: "طبق سلطة خضراء متوسط",
          protein_g: 2,
          carb_g: 4,
          fat_g: 0,
          calories_kcal: 25,
          swaps: [],
        });

        // Carb Source (Potatoes or Baladi Bread)
        const remC = Math.max(5, targetC - 4);
        let carbP = 0;
        let carbF = 0;

        if (isGlutenExcluded) {
          const potatoGrams = Math.round(remC / 0.20);
          carbP = Math.round(potatoGrams * 0.02);
          items.push({
            food_code: "ROASTED_POTATOES",
            name_ar: "بطاطس ودجز مشوية بالأعشاب في الإيرفراير (خالية من الجلوتين)",
            name_en: "Air-Fryer Herb Roasted Potatoes (Gluten-Free)",
            category: "CARBS",
            portion_g: potatoGrams,
            household_measurement: `${potatoGrams} جم (حوالي ${Math.round(potatoGrams / 150)} ثمرات بطاطس مشوية بالأعشاب)`,
            protein_g: carbP,
            carb_g: remC,
            fat_g: 0,
            calories_kcal: Math.round(potatoGrams * 0.9),
            swaps: generateSmartSwaps("CARBS", potatoGrams, "ROASTED_POTATOES", "DINNER", 10, allergenContext),
          });
        } else {
          const breadGrams = Math.round(remC / 0.52);
          carbP = Math.round(breadGrams * 0.09);
          carbF = Math.round(breadGrams * 0.01);
          const baladiLoaves = (breadGrams / 85).toFixed(1);
          items.push({
            food_code: "BALADI_BREAD",
            name_ar: "خبز بلدي مصري بالردة",
            name_en: "Baladi Bread",
            category: "CARBS",
            portion_g: breadGrams,
            household_measurement: `${breadGrams} جم (~${baladiLoaves} رغيف بلدي)`,
            protein_g: carbP,
            carb_g: remC,
            fat_g: carbF,
            calories_kcal: Math.round(breadGrams * 2.6),
            swaps: generateSmartSwaps("CARBS", breadGrams, "BALADI_BREAD", "DINNER", 10, allergenContext),
          });
        }

        // Protein Source: Chicken Breast / Cottage Cheese (capped 150g) + Tuna
        const remP = Math.max(15, targetP - 2 - carbP);
        let protF = 0;

        if (isLowBudget && !isDairyExcluded && !isFishExcluded && !isGout && remP >= 45) {
          // Multi-component economic dinner: 150g cottage cheese (CAPPED) + Canned Tuna
          const cheeseGrams = 150; // Capped strictly at 150g
          const cheeseP = 18;
          const cheeseF = 2.2;
          items.push({
            food_code: "COTTAGE_CHEESE",
            name_ar: "جبن قريش طبيعي متبل بزيت الزيتون والنعناع",
            name_en: "Cottage Cheese with Olive Oil (150g Cap)",
            category: "PROTEIN",
            portion_g: cheeseGrams,
            household_measurement: "150 جم (نصف كوب متبل)",
            protein_g: cheeseP,
            carb_g: 4.5,
            fat_g: cheeseF,
            calories_kcal: 112,
            swaps: [],
          });

          const tunaRemP = Math.max(15, remP - cheeseP);
          const tunaGrams = Math.round(tunaRemP / 0.26);
          const tunaF = Math.round(tunaGrams * 0.01);
          items.push({
            food_code: "CANNED_TUNA",
            name_ar: "تونة لايت قطع مصفاة بالليمون والكمون",
            name_en: "Canned Tuna in Water (Drained)",
            category: "PROTEIN",
            portion_g: tunaGrams,
            household_measurement: `${tunaGrams} جم مصفى (~${(tunaGrams / 140).toFixed(1)} علبة)`,
            protein_g: tunaRemP,
            carb_g: 0,
            fat_g: tunaF,
            calories_kcal: Math.round(tunaGrams * 1.15),
            swaps: [],
          });
          protF = cheeseF + tunaF;

        } else if (!isPoultryExcluded) {
          const chickenGrams = Math.round(remP / 0.31);
          protF = Math.round(chickenGrams * 0.03);
          items.push({
            food_code: "CHICKEN_BREAST",
            name_ar: "صدور دجاج مشوية خفيفة للعشاء",
            name_en: "Grilled Chicken Breast",
            category: "PROTEIN",
            portion_g: chickenGrams,
            household_measurement: `${chickenGrams} جم وزن مطبوخ (حجم كف اليد)`,
            protein_g: remP,
            carb_g: 0,
            fat_g: protF,
            calories_kcal: Math.round(chickenGrams * 1.65),
            swaps: generateSmartSwaps("PROTEIN", chickenGrams, "CHICKEN_BREAST", "DINNER", 10, allergenContext),
          });
        } else if (!isDairyExcluded) {
          // If dairy only, cap cottage cheese at 150g and add egg whites/Greek yogurt if needed
          const cheeseGrams = 150;
          protF = 2.2;
          items.push({
            food_code: "COTTAGE_CHEESE",
            name_ar: "جبن قريش طبيعي متبل بزيت الزيتون والزعتر (150 جم)",
            name_en: "Seasoned Cottage Cheese (150g Cap)",
            category: "PROTEIN",
            portion_g: cheeseGrams,
            household_measurement: "150 جم (نصف كوب متبل)",
            protein_g: Math.min(18, remP),
            carb_g: 4.5,
            fat_g: protF,
            calories_kcal: 112,
            swaps: [],
          });
        }

        // Fat Source: Olive Oil
        const remF = Math.max(0, targetF - protF - carbF);
        const oilGrams = Math.round(remF);
        if (oilGrams > 0) {
          items.push({
            food_code: "OLIVE_OIL",
            name_ar: "زيت زيتون بكر ممتاز",
            name_en: "Extra Virgin Olive Oil",
            category: "FATS",
            portion_g: oilGrams,
            household_measurement: `${oilGrams} جم (1 ملعقة طعام كبيرة)`,
            protein_g: 0,
            carb_g: 0,
            fat_g: oilGrams,
            calories_kcal: oilGrams * 9,
            swaps: [],
          });
        }

      } else {
        // SNACK (Meal 4)
        recipeNameAr = isDairyExcluded
          ? "سناك دجاج مشوي مع بطاطا حلوة مشوية"
          : "سناك زبادي يوناني مع بطاطا حلوة مشوية";
        recipeConceptDesc = "سناك مشبع فيه بروتين ونشويات ودهون صحية، بياخد نصيبه من أكل اليوم.";

        // Fat first: a handful of nuts (seeds for a nut allergy), none for a kidney protein cap
        // since both add protein; the rest of the fat is olive oil on the sweet potato.
        const kidneyProteinCapped = Boolean(universalTargets.clinical_guardrails?.kidney_protein_capped);
        const nutCode = kidneyProteinCapped ? null : isNutsExcluded ? "HEMP_CHIA_SEEDS" : "RAW_ALMONDS";
        const nutFood = nutCode && isFoodClinicallySafe(nutCode, allergenContext) ? FOOD_SWAP_DATABASE[nutCode] : null;
        const nutGrams = nutFood ? Math.min(SNACK_NUT_MAX_G, Math.round((Math.max(0, targetF) / nutFood.fat_per_100g) * 100)) : 0;
        const nutMacros = nutGrams > 0 ? {
          protein_g: Math.round((nutGrams * nutFood.protein_per_100g) / 100),
          carb_g: Math.round((nutGrams * nutFood.carb_per_100g) / 100),
          fat_g: Math.round((nutGrams * nutFood.fat_per_100g) / 100),
        } : { protein_g: 0, carb_g: 0, fat_g: 0 };

        // Carbs
        const remC = Math.max(0, targetC - nutMacros.carb_g);
        const sweetPotatoGrams = Math.round(remC / 0.21);
        items.push({
          food_code: "SWEET_POTATO",
          name_ar: "بطاطا حلوة مشوية مع نصف تفاحة طازجة",
          name_en: "Baked Sweet Potato & Apple",
          category: "CARBS",
          portion_g: sweetPotatoGrams,
          household_measurement: `${sweetPotatoGrams} جم مشوية`,
          protein_g: Math.round(sweetPotatoGrams * 0.02),
          carb_g: remC,
          fat_g: 0.1,
          calories_kcal: Math.round(sweetPotatoGrams * 0.95),
          swaps: generateSmartSwaps("CARBS", sweetPotatoGrams, "SWEET_POTATO", "SNACK", 5, allergenContext),
        });

        // Protein
        const remP = Math.max(10, targetP - Math.round(sweetPotatoGrams * 0.02) - nutMacros.protein_g);
        if (!isDairyExcluded) {
          const yogurtGrams = Math.round(remP / 0.10);
          items.push({
            food_code: "GREEK_YOGURT",
            name_ar: "زبادي يوناني طبيعي قليل الدسم عالي البروتين",
            name_en: "Greek Yogurt",
            category: "PROTEIN",
            portion_g: yogurtGrams,
            household_measurement: `${yogurtGrams} جم (${(yogurtGrams / 170).toFixed(1)} علبة كبيرة)`,
            protein_g: remP,
            carb_g: Math.round(yogurtGrams * 0.035),
            fat_g: 1.5,
            calories_kcal: Math.round(yogurtGrams * 0.70),
            swaps: [],
          });
        } else {
          const chickenGrams = Math.round(remP / 0.31);
          items.push({
            food_code: "CHICKEN_BREAST",
            name_ar: "شرائح صدور دجاج مشوية خفيفة للسناك",
            name_en: "Grilled Chicken Bites",
            category: "PROTEIN",
            portion_g: chickenGrams,
            household_measurement: `${chickenGrams} جم مطبوخ`,
            protein_g: remP,
            carb_g: 0,
            fat_g: 1.5,
            calories_kcal: Math.round(chickenGrams * 1.65),
            swaps: [],
          });
        }

        if (nutGrams > 0) {
          const nutName = nutCode === "RAW_ALMONDS"
            ? { food_code: "RAW_ALMONDS", name_ar: "لوز نيء غير مملح" }
            : { food_code: "HEMP_CHIA_SEEDS", name_ar: "بذور الشيا وبذور دوار الشمس (بديل صحي خالي من المكسرات)" };
          items.push({
            ...nutName,
            name_en: nutFood.name_en,
            category: "FATS",
            portion_g: nutGrams,
            household_measurement: `${nutGrams} جم (حفنة صغيرة)`,
            ...nutMacros,
            calories_kcal: Math.round(nutMacros.protein_g * 4 + nutMacros.carb_g * 4 + nutMacros.fat_g * 9),
            swaps: [],
          });
        }
        const oilGrams = Math.round(targetF - nutMacros.fat_g - 1.6);
        if (oilGrams > 0) {
          items.push({
            food_code: "OLIVE_OIL",
            name_ar: "زيت زيتون بكر ممتاز (على البطاطا الحلوة المشوية)",
            name_en: "Extra Virgin Olive Oil",
            category: "FATS",
            portion_g: oilGrams,
            household_measurement: `${oilGrams} جم`,
            protein_g: 0,
            carb_g: 0,
            fat_g: oilGrams,
            calories_kcal: oilGrams * 9,
            swaps: [],
          });
        }
      }
    }

    const calculatedP = items.reduce((sum, it) => sum + (it.protein_g || 0), 0);
    const calculatedC = items.reduce((sum, it) => sum + (it.carb_g || 0), 0);
    const calculatedF = items.reduce((sum, it) => sum + (it.fat_g || 0), 0);
    const calculatedKcal = items.reduce((sum, it) => sum + (it.calories_kcal || 0), 0);

    // Enrich every item with recipe_details if available
    const enrichedItems = items.map(it => {
      const recipe = getRecipeDetailsForFood(it.food_code);
      return {
        ...it,
        recipe_details: recipe || null,
      };
    });

    return {
      meal_number: mealNum,
      meal_name_ar: mealDist.meal_name_ar,
      recipe_title_ar: recipeNameAr,
      recipe_description_ar: recipeConceptDesc,
      target_macros: {
        protein_g: targetP,
        carb_g: targetC,
        fat_g: targetF,
        calories_kcal: targetKcal,
      },
      actual_macros: {
        protein_g: Math.round(calculatedP),
        carb_g: Math.round(calculatedC),
        fat_g: Math.round(calculatedF),
        calories_kcal: Math.round(calculatedKcal),
      },
      items: enrichedItems,
    };
  });

  // Some meal templates place a food directly (an omelette for a bariatric client, bread at
  // breakfast) without asking the clinical filter. One last pass holds every generated item to the
  // same rules the candidate lists already follow.
  return keepEquivalentSwaps(diversifyDailyProteins(enforceClinicalSafety(generatedMeals, allergenContext)));
}

// One protein food in at most this many meals a day (chicken breast used to fill all three).
export const MAX_MEALS_PER_PROTEIN_FOOD = 2;

/**
 * Daily variety: a protein food found in more than MAX_MEALS_PER_PROTEIN_FOOD meals is changed in the
 * later meals to one of the item's own swaps - equivalent in value, already filtered for the client's
 * restrictions, dislikes and budget - that needs no oil change, is not on that plate and is used the
 * least in the day. The original food stays first in the swap list, so the client can switch back.
 * Protein powder is never changed (isNoSwapFood).
 */
export function diversifyDailyProteins(meals = []) {
  if (!Array.isArray(meals)) return meals;
  const out = meals.map((meal) => ({ ...meal, items: [...(meal.items || [])] }));
  const mealsWith = (code) => out.filter((meal) => meal.items.some((item) => item.food_code === code)).length;
  const noOilChange = (swap) => !(Number(swap?.oil_deduction_g) > 0) && !(Number(swap?.oil_addition_g) > 0);

  for (let m = out.length - 1; m >= 0; m -= 1) {
    const meal = out[m];
    meal.items.forEach((item, index) => {
      if (String(item?.category).toUpperCase() !== "PROTEIN" || isNoSwapFood(item.food_code)) return;
      if (mealsWith(item.food_code) <= MAX_MEALS_PER_PROTEIN_FOOD) return;
      const onPlate = new Set(meal.items.map((i) => i.food_code));
      const choices = (Array.isArray(item.swaps) ? item.swaps : [])
        .filter((swap) => swap?.food_code && FOOD_SWAP_DATABASE[swap.food_code] && noOilChange(swap)
          && !onPlate.has(swap.food_code) && mealsWith(swap.food_code) < MAX_MEALS_PER_PROTEIN_FOOD)
        .sort((a, b) => mealsWith(a.food_code) - mealsWith(b.food_code));
      const chosen = choices[0];
      if (!chosen) return;
      const back = {
        food_code: item.food_code,
        name_ar: item.name_ar,
        name_en: item.name_en,
        equivalent_grams: item.portion_g,
        household_desc: item.household_measurement,
        oil_deduction_g: 0,
        oil_addition_g: 0,
        protein_g: item.protein_g,
        carb_g: item.carb_g,
        fat_g: item.fat_g,
        calories_kcal: item.calories_kcal,
      };
      meal.items[index] = {
        ...item,
        food_code: chosen.food_code,
        name_ar: chosen.name_ar,
        name_en: chosen.name_en,
        portion_g: chosen.equivalent_grams ?? item.portion_g,
        household_measurement: chosen.household_desc ?? item.household_measurement,
        protein_g: chosen.protein_g,
        carb_g: chosen.carb_g,
        fat_g: chosen.fat_g,
        calories_kcal: chosen.calories_kcal,
        swaps: [back, ...item.swaps.filter((swap) => swap !== chosen)],
        replaced_for_variety_from: item.food_code,
      };
    });
  }
  return out;
}
/** Whether the intake declares diabetes or insulin resistance (raw form answers or canonical conditions). */
export function isDiabeticIntake(canonicalIntake = {}, rawIntake = {}) {
  const effectiveRaw = (rawIntake?.answers && typeof rawIntake.answers === "object")
    ? { ...rawIntake.answers, ...rawIntake }
    : (rawIntake || {});
  const selected = Array.isArray(effectiveRaw?.medical_conditions?.selected) ? effectiveRaw.medical_conditions.selected : [];
  return (
    selected.some((c) => String(c).toLowerCase() === "diabetes") ||
    effectiveRaw?.medical_conditions?.diabetes?.uses_insulin === true ||
    (canonicalIntake?.medical?.conditions || []).some((c) => /DIABET|INSULIN_RESISTANCE/.test(String(c?.conditionCode || "")))
  );
}

/**
 * Some meal templates place a fixed carbohydrate (baladi bread at breakfast and dinner) without going
 * through the clinical filter. For a diabetic client, any item the shared classification marks high
 * glycemic is replaced by the first of its own swaps that is not: those swaps were computed for the
 * same meal and the same carbohydrate target, and already filtered for this client.
 */
export function enforceDiabeticCarbChoice(meals = [], isDiabetic = false) {
  if (!isDiabetic || !Array.isArray(meals)) return meals;
  const isHigh = (code) => getFoodClinicalProperties(code, FOOD_SWAP_DATABASE[code])?.glycemic_index === "HIGH";

  return meals.map((meal) => {
    const items = meal.items || [];
    if (!items.some((item) => isHigh(item.food_code))) return meal;

    return {
      ...meal,
      items: items.map((item) => {
        if (!isHigh(item.food_code)) return item;
        const swaps = Array.isArray(item.swaps) ? item.swaps : [];
        const chosen = swaps.find((swap) => swap?.food_code && !isHigh(swap.food_code));
        if (!chosen) {
          return { ...item, glycemic_warning_ar: "صنف عالي المؤشر الجلايسيمي ولا يوجد بديل آمن محسوب له؛ راجعه قبل النشر." };
        }
        return {
          ...item,
          food_code: chosen.food_code,
          name_ar: chosen.name_ar,
          name_en: chosen.name_en,
          portion_g: chosen.equivalent_grams ?? item.portion_g,
          household_measurement: chosen.household_desc ?? item.household_measurement,
          protein_g: chosen.protein_g,
          carb_g: chosen.carb_g,
          fat_g: chosen.fat_g,
          calories_kcal: chosen.calories_kcal,
          swaps: swaps.filter((swap) => swap !== chosen && !isHigh(swap.food_code)),
          replaced_for_diabetes_from: item.food_code,
        };
      }),
    };
  });
}

/**
 * Holds every generated item to the client's clinical profile. An item the profile forbids (an egg
 * dish for an egg allergy, bread for coeliac disease...) is replaced by the first of its own swaps
 * that is safe: those swaps were computed for the same meal and the same macro target. When none is
 * safe, the item stays but is flagged for the coach rather than silently served.
 * Foods this generator does not know are left alone: it cannot judge what it has no record of.
 */
export const MAX_CARB_PORTION_G = 400;
// Potatoes stay on a diabetic's plan, in a moderate portion: up to 200 g a meal, eaten with the
// meal's protein and salad (or boiled and cooled), which blunts the rise in blood sugar.
export const DIABETIC_POTATO_PORTION_G = 200;
const DIABETIC_POTATO_TIP_AR = "البطاطس مسموحة بالكمية دي: كُلها مع البروتين والسلطة في نفس الوجبة، والأفضل مسلوقة ومتسابة تبرد، علشان السكر مايعلاش بسرعة.";
const isPotato = (code) => /POTATO/.test(String(code || ""));

/** Per-food plate limit: the general carbohydrate cap, and a smaller one for potatoes when diabetic. */
// Fruit on one plate: about two medium pieces (a WHO fruit portion is 80 g); dates about 10.
export const MAX_FRUIT_PORTION_G = 250;
export const MAX_DATES_PORTION_G = 80;
// A split part smaller than this is folded into another part with room.
// A split part small in both weight and carbohydrate is a crumb (10 g of apple), not a plate: 35 g of
// oats (a starch exchange is 15 g carbohydrate, ADA/AND lists) or half a guava are real portions.
const MIN_SPLIT_PART_G = 40;
const MIN_SPLIT_PART_CARB_G = 10;
// Folding a small part into the others never takes one of them more than this over its limit.
const SPLIT_SPREAD_MARGIN_G = 10;
const FRESH_FRUIT = new Set(["BANANA_FRESH", "APPLE_FRESH", "FRESH_GUAVA", "ORANGE_FRESH", "STRAWBERRY_FRESH", "WATERMELON_FRESH"]);

export function carbPortionLimit({ diabetic = false } = {}) {
  return (foodCode) => {
    if (FRESH_FRUIT.has(foodCode)) return MAX_FRUIT_PORTION_G;
    if (foodCode === "DATES_KHALAS") return MAX_DATES_PORTION_G;
    return diabetic && isPotato(foodCode) ? DIABETIC_POTATO_PORTION_G : MAX_CARB_PORTION_G;
  };
}

const scaleNumber = (value, factor) => (Number.isFinite(Number(value)) ? Math.round(Number(value) * factor) : value);
const gramsText = (grams, reference) => `${grams} جم${/مطبوخ/.test(String(reference || "")) ? " مطبوخ" : ""}`;

/**
 * A carbohydrate item larger than MAX_CARB_PORTION_G (a bulking plan on three meals put 864 g of
 * rice on one plate) is split over the same food and the foods of its own swap list, all already
 * filtered for the client's allergies and conditions: each part is filled up to the cap, the
 * original first, then the densest swaps. If the list cannot hold it all, every part grows by the
 * same ratio. The meal's macros do not change. With no safe swap the item stays whole and carries a
 * note for the coach. Runs once, on the final meals (after the diabetic choice).
 */
export function splitOversizedPortions(meals = [], maxGrams = MAX_CARB_PORTION_G) {
  if (!Array.isArray(meals)) return meals;
  const limitOf = typeof maxGrams === "function" ? maxGrams : () => maxGrams;
  const diabeticPotatoLimit = limitOf("POTATO") < MAX_CARB_PORTION_G;
  const scaleSwap = (swap, factor) => {
    const grams = scaleNumber(swap.equivalent_grams, factor);
    return { ...swap, equivalent_grams: grams, household_desc: gramsText(grams, swap.household_desc),
      protein_g: scaleNumber(swap.protein_g, factor), carb_g: scaleNumber(swap.carb_g, factor),
      fat_g: scaleNumber(swap.fat_g, factor), calories_kcal: scaleNumber(swap.calories_kcal, factor) };
  };
  const macros = (item, factor) => ({
    protein_g: scaleNumber(item.protein_g, factor), carb_g: scaleNumber(item.carb_g, factor),
    fat_g: scaleNumber(item.fat_g, factor), calories_kcal: scaleNumber(item.calories_kcal, factor),
  });
  // A diabetic's potato swap above the potato limit becomes a mixed plate: the potato limit plus the
  // rest from the item it replaces, same macros in total.
  const mixPotatoSwap = (item, swap) => {
    const limit = limitOf(swap?.food_code);
    const grams = Number(swap?.equivalent_grams);
    if (!diabeticPotatoLimit || !isPotato(swap?.food_code) || !(grams > limit) || isPotato(item?.food_code)) return swap;
    const restGrams = Math.round(Number(item.portion_g) * (1 - limit / grams));
    return { ...swap, equivalent_grams: limit, mixed_with_food_code: item.food_code, mixed_with_grams: restGrams,
      household_desc: `${limit} جم ${swap.name_ar || "بطاطس"} + ${restGrams} جم ${item.name_ar || item.food_code}`,
      diabetic_tip_ar: DIABETIC_POTATO_TIP_AR };
  };
  return meals.map((meal) => {
    if (!Array.isArray(meal?.items)) return meal;
    const items = [];
    let oilCutG = 0;
    for (const rawItem of meal.items) {
      const item = Array.isArray(rawItem?.swaps) && diabeticPotatoLimit ? { ...rawItem, swaps: rawItem.swaps.map((swap) => mixPotatoSwap(rawItem, swap)) } : rawItem;
      const portion = Number(item?.portion_g);
      const swaps = Array.isArray(item?.swaps) ? item.swaps.filter((swap) => !swap?.mixed_with_food_code) : [];
      const seen = new Set([item?.food_code]);
      const partners = swaps
        .filter((swap) => swap?.food_code && Number(swap.equivalent_grams) > 0 && !seen.has(swap.food_code) && seen.add(swap.food_code))
        .sort((a, b) => Number(a.equivalent_grams) - Number(b.equivalent_grams));
      const itemLimit = limitOf(item?.food_code);
      const tip = diabeticPotatoLimit && isPotato(item?.food_code) ? { diabetic_tip_ar: DIABETIC_POTATO_TIP_AR } : {};
      if (item?.category !== "CARBS" || !(portion > itemLimit)) {
        items.push(Object.keys(tip).length ? { ...item, ...tip } : item);
        continue;
      }
      if (partners.length === 0) {
        items.push({ ...item, portion_warning_ar: `حصة ${portion} جم في وجبة واحدة ولا يوجد بديل آمن لتقسيمها مع قيود العميل؛ راجع توزيع الوجبات أو زوّد عددها.` });
        continue;
      }
      // grams of each food that would carry the whole item; shares add up to 1.
      const parts = [{ grams: portion, limit: itemLimit }, ...partners.map((partner) => ({ grams: Number(partner.equivalent_grams), partner, limit: limitOf(partner.food_code) }))];
      let left = 1;
      for (const p of parts) {
        p.share = Math.min(left, p.limit / p.grams);
        left -= p.share;
      }
      if (left > 1e-6) {
        const total = 1 - left;
        for (const p of parts) p.share /= total;
      } else {
        // A last part of a few grams (10 g of apple) is not a plate: its share goes to a part with room
        // under its limit, else is spread over the other non-potato parts (a few grams over a fruit
        // limit; a diabetic's potato limit is never passed). With neither it stays.
        for (const tiny of parts.filter((p) => p.partner && p.share > 1e-6 && p.grams * p.share < MIN_SPLIT_PART_G && (Number(item.carb_g) || 0) * p.share < MIN_SPLIT_PART_CARB_G)) {
          const others = parts.filter((p) => p !== tiny && p.share > 1e-6);
          const roomy = others.find((p) => p.grams * (p.share + tiny.share) <= p.limit);
          const spread = roomy ? [roomy] : others.filter((p) => !isPotato(p.partner?.food_code || item?.food_code));
          if (spread.length === 0) continue;
          const total = spread.reduce((sum, p) => sum + p.share, 0);
          // "A few grams" over a limit means at most SPLIT_SPREAD_MARGIN_G; otherwise the small part stays.
          if (spread.some((p) => p.grams * (p.share + (tiny.share * p.share) / total) > p.limit + SPLIT_SPREAD_MARGIN_G)) continue;
          for (const p of spread) p.share += (tiny.share * p.share) / total;
          tiny.share = 0;
        }
      }
      const overLimit = left > 1e-6
        ? { portion_warning_ar: `البدائل الآمنة المتاحة لا تكفي لتقسيم الحصة تحت الحد؛ راجع عدد الوجبات أو توزيع الكربوهيدرات.` }
        : {};
      parts.filter((p) => p.share > 1e-6).forEach((p) => {
        const grams = scaleNumber(p.grams, p.share);
        if (!p.partner) {
          items.push({ ...item, ...tip, ...overLimit, ...macros(item, p.share), portion_g: grams, household_measurement: gramsText(grams, item.household_measurement),
            swaps: swaps.map((swap) => scaleSwap(swap, p.share)), split_from_portion_g: portion });
        } else {
          // A part carries its own food's macros (the carbohydrate is matched, so the meal's does not
          // change); extra fat it brings leaves its share of the meal's oil out.
          oilCutG += (Number(p.partner.oil_deduction_g) || 0) * p.share;
          const own = scaleSwap(p.partner, p.share);
          items.push({ protein_g: own.protein_g, carb_g: own.carb_g, fat_g: own.fat_g, calories_kcal: own.calories_kcal,
            food_code: p.partner.food_code, name_ar: p.partner.name_ar, name_en: p.partner.name_en,
            category: "CARBS", portion_g: grams, household_measurement: gramsText(grams, p.partner.household_desc), swaps: [],
            ...(diabeticPotatoLimit && isPotato(p.partner.food_code) ? { diabetic_tip_ar: DIABETIC_POTATO_TIP_AR } : {}),
            split_note_ar: "جزء من حصة النشويات في الوجبة، مقسومة على أكتر من صنف علشان الكمية تبقى معقولة في الطبق." });
        }
      });
    }
    const oilIndex = oilCutG >= 1 ? items.findIndex((i) => i?.food_code === "OLIVE_OIL") : -1;
    if (oilIndex >= 0) {
      const oil = items[oilIndex];
      const grams = Math.max(0, Math.round(Number(oil.portion_g) - oilCutG));
      items[oilIndex] = { ...oil, portion_g: grams, fat_g: grams, calories_kcal: grams * 9, household_measurement: `${grams} جم` };
    }
    return { ...meal, items };
  });
}

/**
 * A meal's stored totals (actual_macros) are summed before the last steps - split plates, fat
 * sources, safety swaps - and went stale (1211 stored against 1230 kcal in the items). Recompute
 * them from the items as the final step.
 */
export function refreshActualMacros(meals = []) {
  if (!Array.isArray(meals)) return meals;
  return meals.map((meal) => {
    if (!Array.isArray(meal?.items)) return meal;
    const sum = (key) => meal.items.reduce((total, item) => total + (Number(item?.[key]) || 0), 0);
    return {
      ...meal,
      actual_macros: {
        protein_g: Math.round(sum("protein_g")),
        carb_g: Math.round(sum("carb_g")),
        fat_g: Math.round(sum("fat_g")),
        calories_kcal: Math.round(sum("calories_kcal")),
      },
    };
  });
}

export const MAX_OIL_PER_MEAL_G = 20;
// Olive oil a leaner protein swap may add to make up the fat (about a tablespoon and a half).
const MAX_SWAP_OIL_ADDITION_G = 15;
// Nuts or seeds in the fourth-meal snack: a handful, like the almonds below.
const SNACK_NUT_MAX_G = 30;
// Other fat sources, in order, each capped per meal. Almonds add protein, so never for a kidney
// protein cap.
const FAT_SOURCES = Object.freeze([
  { code: "FRESH_AVOCADO", maxGrams: 100, kidneySafe: true },
  { code: "RAW_ALMONDS", maxGrams: 30, kidneySafe: false },
]);

/**
 * Fat above the oil limit in a meal (a diabetic's carbohydrate ceiling moved 80-90 g of fat a meal
 * into olive oil) is moved to avocado, then almonds, within each one's portion and the client's
 * restrictions; what is left stays in the oil. The meal's fat does not change.
 */
export function diversifyFatSources(meals = [], allergenContext = {}, options = {}) {
  if (!Array.isArray(meals)) return meals;
  return moveFatBeyondOil(meals, allergenContext, options).map(flagHeavyOil);
}

// Olive oil above two tablespoons in one meal is hard to eat; the coach is told why it is there.
export const MAX_COMFORTABLE_OIL_PER_MEAL_G = 30;
export function flagHeavyOil(meal) {
  if (!Array.isArray(meal?.items)) return meal;
  const heavy = meal.items.some((item) => item?.food_code === "OLIVE_OIL" && Number(item.portion_g) > MAX_COMFORTABLE_OIL_PER_MEAL_G && !item.portion_warning_ar);
  if (!heavy) return meal;
  return {
    ...meal,
    items: meal.items.map((item) => (item?.food_code === "OLIVE_OIL" && Number(item.portion_g) > MAX_COMFORTABLE_OIL_PER_MEAL_G && !item.portion_warning_ar
      ? { ...item, portion_warning_ar: `${item.portion_g} جم زيت زيتون في وجبة واحدة كتير على الطعم والهضم؛ القيود الصحية للحالة (سقف البروتين أو الكربوهيدرات أو الحساسية) خلت الدهون هي مصدر الطاقة الباقي. راجع توزيع الطاقة مع الطبيب قبل الاعتماد.` }
      : item)),
  };
}

function moveFatBeyondOil(meals, allergenContext, { kidneyProteinCapped = false, kidneyCondition = false, kidneyPotassiumStatus = "UNKNOWN" } = {}) {
  return meals.map((meal) => {
    const items = Array.isArray(meal?.items) ? meal.items : null;
    const oilIndex = items ? items.findIndex((item) => item?.food_code === "OLIVE_OIL") : -1;
    if (oilIndex < 0) return meal;
    const oil = items[oilIndex];
    let excessFat = Number(oil.fat_g) - MAX_OIL_PER_MEAL_G;
    if (!(excessFat > 0)) return meal;
    const added = [];
    for (const source of FAT_SOURCES) {
      if (excessFat <= 0) break;
      if (kidneyProteinCapped && !source.kidneySafe) continue;
      if (items.some((item) => item?.food_code === source.code)) continue;
      const food = FOOD_SWAP_DATABASE[source.code];
      if (!food || !isFoodClinicallySafe(source.code, allergenContext)) continue;
      // Avocado is rich in potassium: a kidney client keeps a moderate portion (KDIGO 2024).
      // With a normal potassium result nothing is limited.
      const maxGrams = kidneyCondition && kidneyPotassiumStatus !== "NORMAL" && source.code === "FRESH_AVOCADO"
        ? Math.min(source.maxGrams, CLINICAL_GUIDELINES.KIDNEY.AVOCADO_MAX_G_PER_MEAL)
        : source.maxGrams;
      const grams = Math.min(maxGrams, Math.round((excessFat / food.fat_per_100g) * 100));
      if (grams < 10) continue;
      const fat = Math.round((grams * food.fat_per_100g) / 100);
      const protein = Math.round((grams * food.protein_per_100g) / 100);
      const carb = Math.round((grams * food.carb_per_100g) / 100);
      added.push({
        food_code: source.code, name_ar: food.name_ar, name_en: food.name_en, category: "FATS",
        portion_g: grams, household_measurement: `${grams} جم`,
        protein_g: protein, carb_g: carb, fat_g: fat, calories_kcal: Math.round(protein * 4 + carb * 4 + fat * 9), swaps: [],
        fat_source_note_ar: "جزء من دهون الوجبة بدل زيادة زيت الزيتون.",
      });
      excessFat -= fat;
    }
    if (added.length === 0) return meal;
    const oilFat = MAX_OIL_PER_MEAL_G + Math.max(0, Math.round(excessFat));
    const nextOil = { ...oil, portion_g: oilFat, fat_g: oilFat, calories_kcal: oilFat * 9, household_measurement: `${oilFat} جم` };
    const nextItems = [...items];
    nextItems[oilIndex] = nextOil;
    return { ...meal, items: [...nextItems, ...added] };
  });
}

const itemKcal = (item) => Number(item?.calories_kcal)
  || (Number(item?.protein_g) || 0) * 4 + (Number(item?.carb_g) || 0) * 4 + (Number(item?.fat_g) || 0) * 9;

/**
 * Swaps are built from the food database, but a template may state its own macros for an item (a
 * boiled-egg omelette, egg whites under the omelette code). Each item keeps only the swaps that are
 * equivalent to the item as the client sees it (swapExchangeRules), after the oil a swap says to
 * leave out.
 */
export function keepEquivalentSwaps(meals = []) {
  if (!Array.isArray(meals)) return meals;
  return meals.map((meal) => {
    if (!Array.isArray(meal?.items)) return meal;
    return {
      ...meal,
      items: meal.items.map((item) => {
        // Protein powder is never swapped: taken as it is, the coach told when it runs out.
        if (isNoSwapFood(item?.food_code)) return { ...item, swaps: [], swap_note_ar: NO_SWAP_NOTE_AR };
        if (!Array.isArray(item?.swaps) || item.swaps.length === 0) return item;
        const swaps = item.swaps.filter((swap) => {
          const oil = (Number(swap?.oil_deduction_g) || 0) - (Number(swap?.oil_addition_g) || 0);
          return isEquivalentSwap({
            fromCode: item.food_code, toCode: swap?.food_code,
            fromKcal: itemKcal(item), toKcal: itemKcal(swap) - oil * 9,
            fromFat: Number(item.fat_g) || 0, toFat: (Number(swap?.fat_g) || 0) - oil,
          });
        });
        return swaps.length === item.swaps.length ? item : { ...item, swaps };
      }),
    };
  });
}

export function enforceClinicalSafety(meals = [], allergenContext = {}) {
  if (!Array.isArray(meals)) return meals;
  const known = (code) => Boolean(FOOD_SWAP_DATABASE[code]);
  const unsafe = (code) => known(code) && !isFoodClinicallySafe(code, allergenContext);
  // Disliked but clinically fine: replaced when an alternative exists, otherwise kept with a coach note.
  const withoutDislikes = { ...allergenContext, dislikedFoodCodes: undefined };
  const onlyDisliked = (code) => isFoodClinicallySafe(code, withoutDislikes);

  return meals.map((meal) => {
    const items = meal.items || [];
    if (!items.some((item) => unsafe(item.food_code))) return meal;
    // Foods already on this plate: a replacement takes another food when one exists (two items
    // replaced by the same shakshouka made one breakfast hold it twice).
    const onPlate = new Set(items.map((item) => item.food_code));
    const usable = (swap) => swap?.food_code && known(swap.food_code) && !unsafe(swap.food_code);
    const pick = (list) => list.find((swap) => usable(swap) && !onPlate.has(swap.food_code)) || list.find(usable);

    return {
      ...meal,
      items: items.map((item) => {
        if (!unsafe(item.food_code)) return item;
        let swaps = Array.isArray(item.swaps) ? item.swaps : [];
        let chosen = pick(swaps);
        if (!chosen) {
          // Some templates place an item with no swap list at all (the bariatric omelette): compute
          // the equivalents now, for the same portion and meal, already filtered for this client.
          const context = String(meal.meal_context || meal.context || meal.meal_type || "LUNCH").toUpperCase();
          const category = String(item.category || "PROTEIN").toUpperCase();
          swaps = generateSmartSwaps(category, Number(item.portion_g) || 100, item.food_code, context, 0, allergenContext);
          chosen = pick(swaps);
        }
        if (!chosen) {
          // Safety comes before taste: with no equivalent safe swap, take the closest safe food of
          // the same kind first, then the closest in energy.
          const context = String(meal.meal_context || meal.context || meal.meal_type || "LUNCH").toUpperCase();
          const category = String(item.category || "PROTEIN").toUpperCase();
          const kcal = Number(item.calories_kcal) || 1;
          swaps = buildSmartSwapCandidates(category, Number(item.portion_g) || 100, item.food_code, context, 0, allergenContext)
            .filter((swap) => swap?.food_code && known(swap.food_code) && !unsafe(swap.food_code))
            .sort((a, b) => (sharesSwapFamily(item.food_code, b.food_code) - sharesSwapFamily(item.food_code, a.food_code))
              || (Math.abs(a.calories_kcal - kcal) - Math.abs(b.calories_kcal - kcal)));
          chosen = pick(swaps);
        }
        if (!chosen && onlyDisliked(item.food_code)) {
          return {
            ...item,
            preference_note_ar: "المتدرب ذكر إنه مش بيحب الصنف ده، ومفيش بديل مناسب محسوب له؛ راجعه معاه.",
          };
        }
        if (!chosen) {
          return {
            ...item,
            clinically_unsafe: true,
            clinical_warning_ar: "هذا الصنف يتعارض مع الملف الطبي للمتدرب ولا يوجد بديل آمن محسوب له؛ راجعه قبل النشر.",
          };
        }
        onPlate.add(chosen.food_code);
        return {
          ...item,
          food_code: chosen.food_code,
          name_ar: chosen.name_ar,
          name_en: chosen.name_en,
          portion_g: chosen.equivalent_grams ?? item.portion_g,
          household_measurement: chosen.household_desc ?? item.household_measurement,
          protein_g: chosen.protein_g,
          carb_g: chosen.carb_g,
          fat_g: chosen.fat_g,
          calories_kcal: chosen.calories_kcal,
          swaps: swaps.filter((swap) => swap !== chosen && !unsafe(swap.food_code)),
          ...(onlyDisliked(item.food_code)
            ? { replaced_for_preference_from: item.food_code }
            : { replaced_for_clinical_safety_from: item.food_code }),
        };
      }),
    };
  });
}
