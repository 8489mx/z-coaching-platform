/**
 * Food Swap & Contextual Culinary Pairing Engine
 *
 * 1. Taste Profile Partitioning (Contextual Pairing Guard):
 *    - BREAKFAST_SAVORY_PROTEIN (Eggs, Egg Whites, Cottage Cheese, Turkey, Fava Beans)
 *    - SWEET_SHAKE_PROTEIN (Greek Yogurt, Whey Protein, Casein)
 *    - MAIN_MEAL_PROTEIN (Chicken Breast, Thighs, Lean Beef, Sirloin, White Fish, Shrimp, Salmon, Tuna)
 *    - BREAKFAST_CARB (Oats, Baladi Bread, Whole Wheat Toast, Rice Cakes, Fruits)
 *    - MAIN_CARB (Basmati/White Rice, Potatoes, Sweet Potatoes, Whole Wheat Pasta, Molokhia)
 *    - HEALTHY_FAT (Olive Oil, Almonds, Avocado)
 *
 * 2. Strict Clinical Guardrails (G6PD, Celiac, Gout, Renal eGFR, Lactose, Bariatric)
 * 3. Travel & Dining Mode Hand-Portion Converter (Palm, Fist, Thumb, Cupped Hand)
 * 4. Pre-Engineered Dining Blueprints (Grilled Skewers, Diet Shawarma, Emergency Supermarket)
 */

export const TASTE_PROFILES = {
  FRUIT_CARB: 'FRUIT_CARB',
  BREAKFAST_SAVORY_PROTEIN: 'BREAKFAST_SAVORY_PROTEIN',
  SWEET_SHAKE_PROTEIN: 'SWEET_SHAKE_PROTEIN',
  MAIN_MEAL_PROTEIN: 'MAIN_MEAL_PROTEIN',
  BREAKFAST_CARB: 'BREAKFAST_CARB',
  MAIN_CARB: 'MAIN_CARB',
  HEALTHY_FAT: 'HEALTHY_FAT'
};

export const FOOD_DATABASE = {
  // --- MAIN MEAL PROTEINS ---
  CHICKEN_BREAST: {
    code: 'CHICKEN_BREAST',
    name_ar: 'صدور دجاج مشوية',
    name_en: 'Grilled Chicken Breast',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.MAIN_MEAL_PROTEIN,
    protein_per_100g: 31,
    carbs_per_100g: 0,
    fat_per_100g: 3.5,
    calories_per_100g: 165,
    yield_factor_raw_to_cooked: 0.75,
    allergens: [],
    purine_level: 'LOW_MODERATE',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },
  SKINLESS_CHICKEN_THIGHS: {
    code: 'SKINLESS_CHICKEN_THIGHS',
    name_ar: 'أوراك دجاج مخلية بدون جلد مشوية',
    name_en: 'Grilled Skinless Boneless Chicken Thighs',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.MAIN_MEAL_PROTEIN,
    protein_per_100g: 24,
    carbs_per_100g: 0,
    fat_per_100g: 5.5,
    calories_per_100g: 145,
    yield_factor_raw_to_cooked: 0.75,
    allergens: [],
    purine_level: 'LOW_MODERATE',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },
  LEAN_GROUND_BEEF_95_5: {
    code: 'LEAN_GROUND_BEEF_95_5',
    name_ar: 'لحم بقري مفروم صافي قليل الدسم (95/5)',
    name_en: 'Lean Ground Beef 95/5',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.MAIN_MEAL_PROTEIN,
    protein_per_100g: 26,
    carbs_per_100g: 0,
    fat_per_100g: 6.0,
    calories_per_100g: 165,
    yield_factor_raw_to_cooked: 0.72,
    allergens: [],
    purine_level: 'HIGH',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },
  LEAN_VEAL_BEEF: {
    code: 'LEAN_VEAL_BEEF',
    name_ar: 'لحم بقري بتلو خالي الدهن',
    name_en: 'Lean Veal Beef',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.MAIN_MEAL_PROTEIN,
    protein_per_100g: 26,
    carbs_per_100g: 0,
    fat_per_100g: 4.5,
    calories_per_100g: 150,
    yield_factor_raw_to_cooked: 0.72,
    allergens: [],
    purine_level: 'HIGH',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },
  WHITE_FISH_FILLET: {
    code: 'WHITE_FISH_FILLET',
    name_ar: 'سمك فيليه أبيض مشوي',
    name_en: 'Grilled White Fish Fillet',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.MAIN_MEAL_PROTEIN,
    protein_per_100g: 24,
    carbs_per_100g: 0,
    fat_per_100g: 1.5,
    calories_per_100g: 110,
    yield_factor_raw_to_cooked: 0.80,
    allergens: ['FISH'],
    purine_level: 'LOW',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },
  SHRIMP_GRILLED: {
    code: 'SHRIMP_GRILLED',
    name_ar: 'جمبري مشوي خالي الدسم',
    name_en: 'Grilled Shrimp',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.MAIN_MEAL_PROTEIN,
    protein_per_100g: 24,
    carbs_per_100g: 0.5,
    fat_per_100g: 0.3,
    calories_per_100g: 100,
    yield_factor_raw_to_cooked: 0.75,
    allergens: ['SHELLFISH'],
    purine_level: 'HIGH',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },
  SALMON_ATLANTIC_COOKED: {
    code: 'SALMON_ATLANTIC_COOKED',
    name_ar: 'سلمون نرويجي مشوي',
    name_en: 'Grilled Atlantic Salmon',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.MAIN_MEAL_PROTEIN,
    protein_per_100g: 25,
    carbs_per_100g: 0,
    fat_per_100g: 12.0,
    calories_per_100g: 206,
    yield_factor_raw_to_cooked: 0.82,
    allergens: ['FISH'],
    purine_level: 'MODERATE',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },
  CANNED_TUNA_IN_WATER: {
    code: 'CANNED_TUNA_IN_WATER',
    name_ar: 'تونة مصفاة من الزيت',
    name_en: 'Canned Tuna in Water',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.MAIN_MEAL_PROTEIN,
    protein_per_100g: 26,
    carbs_per_100g: 0,
    fat_per_100g: 1.0,
    calories_per_100g: 115,
    yield_factor_raw_to_cooked: 1.0,
    allergens: ['FISH'],
    purine_level: 'MODERATE',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },

  // --- BREAKFAST SAVORY PROTEINS ---
  WHOLE_EGG: {
    code: 'WHOLE_EGG',
    name_ar: 'بيض كامل مسلوق',
    name_en: 'Whole Boiled Egg',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.BREAKFAST_SAVORY_PROTEIN,
    protein_per_100g: 13,
    carbs_per_100g: 0.8,
    fat_per_100g: 10,
    calories_per_100g: 143,
    yield_factor_raw_to_cooked: 1.0,
    allergens: ['EGGS'],
    purine_level: 'LOW',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },
  EGG_WHITE: {
    code: 'EGG_WHITE',
    name_ar: 'بياض بيض مسلوق',
    name_en: 'Boiled Egg White',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.BREAKFAST_SAVORY_PROTEIN,
    protein_per_100g: 11,
    carbs_per_100g: 0.7,
    fat_per_100g: 0.2,
    calories_per_100g: 52,
    yield_factor_raw_to_cooked: 1.0,
    allergens: ['EGGS'],
    purine_level: 'LOW',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },
  SMOKED_TURKEY_SLICES: {
    code: 'SMOKED_TURKEY_SLICES',
    name_ar: 'شرائح صدور رومي مدخن',
    name_en: 'Smoked Turkey Breast Slices',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.BREAKFAST_SAVORY_PROTEIN,
    protein_per_100g: 22,
    carbs_per_100g: 1.0,
    fat_per_100g: 1.5,
    calories_per_100g: 110,
    yield_factor_raw_to_cooked: 1.0,
    allergens: [],
    purine_level: 'LOW_MODERATE',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },
  COTTAGE_CHEESE_NATURAL: {
    code: 'COTTAGE_CHEESE_NATURAL',
    name_ar: 'جبن قريش طبيعي',
    name_en: 'Natural Low-Fat Cottage Cheese',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.BREAKFAST_SAVORY_PROTEIN,
    protein_per_100g: 13.5,
    carbs_per_100g: 3.5,
    fat_per_100g: 1.2,
    calories_per_100g: 80,
    yield_factor_raw_to_cooked: 1.0,
    allergens: ['DAIRY'],
    purine_level: 'LOW',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: true,
    is_low_lactose: true
  },
  FAVA_BEANS: {
    code: 'FAVA_BEANS',
    name_ar: 'فول مدمس مسلوق',
    name_en: 'Cooked Fava Beans',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.BREAKFAST_SAVORY_PROTEIN,
    protein_per_100g: 8,
    carbs_per_100g: 18,
    fat_per_100g: 1.0,
    calories_per_100g: 110,
    yield_factor_raw_to_cooked: 1.0,
    allergens: ['LEGUMES'],
    purine_level: 'MODERATE',
    is_gluten_free: true,
    is_legume: true,
    is_dairy: false
  },

  // --- SWEET SHAKE PROTEINS ---
  GREEK_YOGURT_NONFAT: {
    code: 'GREEK_YOGURT_NONFAT',
    name_ar: 'زبادي يوناني سادة خالي الدسم',
    name_en: 'Non-Fat Greek Yogurt',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.SWEET_SHAKE_PROTEIN,
    protein_per_100g: 10,
    carbs_per_100g: 3.6,
    fat_per_100g: 0.4,
    calories_per_100g: 59,
    yield_factor_raw_to_cooked: 1.0,
    allergens: ['DAIRY'],
    purine_level: 'LOW',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: true,
    is_low_lactose: true
  },
  WHEY_PROTEIN_ISOLATE: {
    code: 'WHEY_PROTEIN_ISOLATE',
    name_ar: 'واي بروتين أيزوليت باودر',
    name_en: 'Whey Protein Isolate Powder',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.SWEET_SHAKE_PROTEIN,
    protein_per_100g: 80,
    carbs_per_100g: 3,
    fat_per_100g: 1.5,
    calories_per_100g: 375,
    yield_factor_raw_to_cooked: 1.0,
    allergens: ['DAIRY'],
    purine_level: 'LOW',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: true,
    is_low_lactose: true
  },

  // --- BREAKFAST CARBS ---
  EGYPTIAN_BALADI_BREAD: {
    code: 'EGYPTIAN_BALADI_BREAD',
    name_ar: 'خبز بلدي مصري بالردة',
    name_en: 'Egyptian Baladi Flatbread',
    macro_type: 'CARBS',
    taste_profile: TASTE_PROFILES.BREAKFAST_CARB,
    protein_per_100g: 8.5,
    carbs_per_100g: 50,
    fat_per_100g: 1.5,
    calories_per_100g: 250,
    yield_factor_raw_to_cooked: 1.0,
    allergens: ['WHEAT', 'GLUTEN'],
    is_gluten_free: false,
    is_legume: false
  },
  RICE_CAKES: {
    code: 'RICE_CAKES',
    name_ar: 'أقراص أرز مقرمشة (رايس كيك)',
    name_en: 'Plain Rice Cakes',
    macro_type: 'CARBS',
    taste_profile: TASTE_PROFILES.BREAKFAST_CARB,
    protein_per_100g: 8,
    carbs_per_100g: 82,
    fat_per_100g: 1.5,
    calories_per_100g: 375,
    yield_factor_raw_to_cooked: 1.0,
    allergens: [],
    is_gluten_free: true,
    is_legume: false
  },
  ROLLED_OATS_RAW: {
    code: 'ROLLED_OATS_RAW',
    name_ar: 'شوفان حبة كاملة خام',
    name_en: 'Raw Rolled Oats',
    macro_type: 'CARBS',
    taste_profile: TASTE_PROFILES.BREAKFAST_CARB,
    protein_per_100g: 13.5,
    carbs_per_100g: 66,
    fat_per_100g: 6.5,
    calories_per_100g: 380,
    yield_factor_raw_to_cooked: 2.8,
    allergens: ['GLUTEN_CROSS'],
    is_gluten_free: false,
    is_legume: false
  },
  WHOLE_WHEAT_TOAST: {
    code: 'WHOLE_WHEAT_TOAST',
    name_ar: 'توست حبوب كاملة أسمر',
    name_en: 'Whole Wheat Toast',
    macro_type: 'CARBS',
    taste_profile: TASTE_PROFILES.BREAKFAST_CARB,
    protein_per_100g: 10,
    carbs_per_100g: 43,
    fat_per_100g: 3.0,
    calories_per_100g: 240,
    yield_factor_raw_to_cooked: 1.0,
    allergens: ['WHEAT', 'GLUTEN'],
    is_gluten_free: false,
    is_legume: false
  },

  // --- MAIN CARBS ---
  BASMATI_RICE_COOKED: {
    code: 'BASMATI_RICE_COOKED',
    name_ar: 'أرز بسمتي مسلوق',
    name_en: 'Cooked Basmati Rice',
    macro_type: 'CARBS',
    taste_profile: TASTE_PROFILES.MAIN_CARB,
    protein_per_100g: 2.7,
    carbs_per_100g: 28,
    fat_per_100g: 0.4,
    calories_per_100g: 130,
    yield_factor_raw_to_cooked: 2.6,
    allergens: [],
    is_gluten_free: true,
    is_legume: false
  },
  BOILED_POTATOES: {
    code: 'BOILED_POTATOES',
    name_ar: 'بطاطس مسلوقة',
    name_en: 'Boiled Potatoes',
    macro_type: 'CARBS',
    taste_profile: TASTE_PROFILES.MAIN_CARB,
    protein_per_100g: 2.0,
    carbs_per_100g: 20,
    fat_per_100g: 0.1,
    calories_per_100g: 87,
    yield_factor_raw_to_cooked: 1.0,
    allergens: [],
    is_gluten_free: true,
    is_legume: false
  },
  SWEET_POTATO_BAKED: {
    code: 'SWEET_POTATO_BAKED',
    name_ar: 'بطاطا حلوة مشوية',
    name_en: 'Baked Sweet Potato',
    macro_type: 'CARBS',
    taste_profile: TASTE_PROFILES.MAIN_CARB,
    protein_per_100g: 2.0,
    carbs_per_100g: 21,
    fat_per_100g: 0.1,
    calories_per_100g: 90,
    yield_factor_raw_to_cooked: 0.95,
    allergens: [],
    is_gluten_free: true,
    is_legume: false
  },
  WHOLE_WHEAT_PASTA_COOKED: {
    code: 'WHOLE_WHEAT_PASTA_COOKED',
    name_ar: 'مكرونة حبة كاملة مسلوقة',
    name_en: 'Cooked Whole Wheat Pasta',
    macro_type: 'CARBS',
    taste_profile: TASTE_PROFILES.MAIN_CARB,
    protein_per_100g: 5.0,
    carbs_per_100g: 26,
    fat_per_100g: 0.9,
    calories_per_100g: 124,
    yield_factor_raw_to_cooked: 2.2,
    allergens: ['WHEAT', 'GLUTEN'],
    is_gluten_free: false,
    is_legume: false
  },
  PLAIN_MOLOKHIA: {
    code: 'PLAIN_MOLOKHIA',
    name_ar: 'شوربة ملوخية خضراء دايت',
    name_en: 'Plain Molokhia Soup',
    macro_type: 'CARBS',
    taste_profile: TASTE_PROFILES.MAIN_CARB,
    protein_per_100g: 2.5,
    carbs_per_100g: 5.0,
    fat_per_100g: 0.5,
    calories_per_100g: 35,
    yield_factor_raw_to_cooked: 1.0,
    allergens: [],
    is_gluten_free: true,
    is_legume: false
  },

  // --- HEALTHY FATS ---
  EXTRA_VIRGIN_OLIVE_OIL: {
    code: 'EXTRA_VIRGIN_OLIVE_OIL',
    name_ar: 'زيت زيتون بكر ممتاز',
    name_en: 'Extra Virgin Olive Oil',
    macro_type: 'FATS',
    taste_profile: TASTE_PROFILES.HEALTHY_FAT,
    protein_per_100g: 0,
    carbs_per_100g: 0,
    fat_per_100g: 100,
    calories_per_100g: 884,
    allergens: [],
    is_gluten_free: true
  },
  RAW_ALMONDS: {
    code: 'RAW_ALMONDS',
    name_ar: 'لوز نيء غير محمص',
    name_en: 'Raw Almonds',
    macro_type: 'FATS',
    taste_profile: TASTE_PROFILES.HEALTHY_FAT,
    protein_per_100g: 21,
    carbs_per_100g: 22,
    fat_per_100g: 49,
    calories_per_100g: 579,
    allergens: ['TREE_NUTS'],
    is_gluten_free: true
  },
  FRESH_AVOCADO: {
    code: 'FRESH_AVOCADO',
    name_ar: 'أفوكادو طازج',
    name_en: 'Fresh Avocado',
    macro_type: 'FATS',
    taste_profile: TASTE_PROFILES.HEALTHY_FAT,
    protein_per_100g: 2,
    carbs_per_100g: 8.5,
    fat_per_100g: 15,
    calories_per_100g: 160,
    allergens: [],
    is_gluten_free: true
  },
  // --- GULF & EGYPTIAN AUTHENTIC PROTEIN SOURCES ---
  CAMEL_MEAT_HASHI: {
    code: 'CAMEL_MEAT_HASHI',
    name_ar: 'لحم حاشي قليل الدسم (جمل صغير)',
    name_en: 'Lean Hashi Camel Meat',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.MAIN_MEAL_PROTEIN,
    protein_per_100g: 24,
    carbs_per_100g: 0,
    fat_per_100g: 3.0,
    calories_per_100g: 125,
    yield_factor_raw_to_cooked: 0.72,
    allergens: [],
    purine_level: 'HIGH',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },
  HAMOUR_FISH_GRILLED: {
    code: 'HAMOUR_FISH_GRILLED',
    name_ar: 'سمك هامور مشوي على الفحم',
    name_en: 'Grilled Hamour Grouper',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.MAIN_MEAL_PROTEIN,
    protein_per_100g: 22,
    carbs_per_100g: 0,
    fat_per_100g: 1.5,
    calories_per_100g: 105,
    yield_factor_raw_to_cooked: 0.80,
    allergens: ['FISH'],
    purine_level: 'LOW',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },
  KANAAD_KINGFISH_GRILLED: {
    code: 'KANAAD_KINGFISH_GRILLED',
    name_ar: 'سمك كنعد مشوي غني بالأوميجا 3',
    name_en: 'Grilled Kingfish (Kanad)',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.MAIN_MEAL_PROTEIN,
    protein_per_100g: 23,
    carbs_per_100g: 0,
    fat_per_100g: 6.0,
    calories_per_100g: 150,
    yield_factor_raw_to_cooked: 0.80,
    allergens: ['FISH'],
    purine_level: 'MODERATE',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },
  TILAPIA_BOLTI_GRILLED: {
    code: 'TILAPIA_BOLTI_GRILLED',
    name_ar: 'سمك بلطي مشوي بالردة',
    name_en: 'Grilled Tilapia (Bolti)',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.MAIN_MEAL_PROTEIN,
    protein_per_100g: 26,
    carbs_per_100g: 0,
    fat_per_100g: 2.5,
    calories_per_100g: 128,
    yield_factor_raw_to_cooked: 0.80,
    allergens: ['FISH'],
    purine_level: 'LOW',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },
  BOURI_FISH_GRILLED: {
    code: 'BOURI_FISH_GRILLED',
    name_ar: 'سمك بوري مشوي سنجاري لايت',
    name_en: 'Grilled Grey Mullet (Bouri)',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.MAIN_MEAL_PROTEIN,
    protein_per_100g: 21,
    carbs_per_100g: 0,
    fat_per_100g: 5.0,
    calories_per_100g: 135,
    yield_factor_raw_to_cooked: 0.80,
    allergens: ['FISH'],
    purine_level: 'MODERATE',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },
  DIET_BEEF_KOFTA: {
    code: 'DIET_BEEF_KOFTA',
    name_ar: 'كفتة لحم بقري مشوية دايت',
    name_en: 'Grilled Lean Beef Kofta',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.MAIN_MEAL_PROTEIN,
    protein_per_100g: 22,
    carbs_per_100g: 3.0,
    fat_per_100g: 7.0,
    calories_per_100g: 165,
    yield_factor_raw_to_cooked: 0.75,
    allergens: [],
    purine_level: 'HIGH',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },
  GRILLED_BEEF_LIVER: {
    code: 'GRILLED_BEEF_LIVER',
    name_ar: 'كبدة بقري مشوية (غنية بالحديد)',
    name_en: 'Grilled Beef Liver',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.MAIN_MEAL_PROTEIN,
    protein_per_100g: 26,
    carbs_per_100g: 4.0,
    fat_per_100g: 4.5,
    calories_per_100g: 165,
    yield_factor_raw_to_cooked: 0.75,
    allergens: [],
    purine_level: 'HIGH',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },
  CHICKEN_MADHBI: {
    code: 'CHICKEN_MADHBI',
    name_ar: 'دجاج مظبي مشوي على الحجر بدون جلد',
    name_en: 'Chicken Madhbi Skinless',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.MAIN_MEAL_PROTEIN,
    protein_per_100g: 28,
    carbs_per_100g: 0,
    fat_per_100g: 4.0,
    calories_per_100g: 150,
    yield_factor_raw_to_cooked: 0.75,
    allergens: [],
    purine_level: 'LOW_MODERATE',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },
  CHICKEN_SHAWARMA_LEAN: {
    code: 'CHICKEN_SHAWARMA_LEAN',
    name_ar: 'شاورما دجاج بصحن مشوية على الفحم دايت',
    name_en: 'Grilled Lean Chicken Shawarma Platter',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.MAIN_MEAL_PROTEIN,
    protein_per_100g: 25,
    carbs_per_100g: 2.0,
    fat_per_100g: 5.0,
    calories_per_100g: 155,
    yield_factor_raw_to_cooked: 0.85,
    allergens: [],
    purine_level: 'LOW_MODERATE',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },

  // --- ARABIC BREAKFAST & SAVORY PROTEINS ---
  SHAKSHOUKA_EGGS: {
    code: 'SHAKSHOUKA_EGGS',
    name_ar: 'شكشوكة بيض بالطماطم والبصل والكمون',
    name_en: 'Traditional Arabic Shakshuka',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.BREAKFAST_SAVORY_PROTEIN,
    protein_per_100g: 9.5,
    carbs_per_100g: 4.0,
    fat_per_100g: 6.0,
    calories_per_100g: 110,
    yield_factor_raw_to_cooked: 1.0,
    allergens: ['EGGS'],
    purine_level: 'LOW',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },
  EGGS_OMELETTE: {
    code: 'EGGS_OMELETTE',
    name_ar: 'بيض أومليت بالخضار ونقطة زيت زيتون',
    name_en: 'Vegetable Egg Omelette',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.BREAKFAST_SAVORY_PROTEIN,
    protein_per_100g: 11,
    carbs_per_100g: 2.5,
    fat_per_100g: 7.5,
    calories_per_100g: 125,
    yield_factor_raw_to_cooked: 1.0,
    allergens: ['EGGS'],
    purine_level: 'LOW',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: false
  },
  LABNEH_LIGHT: {
    code: 'LABNEH_LIGHT',
    name_ar: 'لبنة خفيفة الدسم بالزعتر وزيت الزيتون',
    name_en: 'Light Labneh',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.BREAKFAST_SAVORY_PROTEIN,
    protein_per_100g: 10,
    carbs_per_100g: 4.0,
    fat_per_100g: 4.5,
    calories_per_100g: 95,
    yield_factor_raw_to_cooked: 1.0,
    allergens: ['DAIRY'],
    purine_level: 'LOW',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: true,
    is_low_lactose: true
  },
  HALLOUMI_LIGHT: {
    code: 'HALLOUMI_LIGHT',
    name_ar: 'جبنة حلوم مشوية لايت',
    name_en: 'Grilled Light Halloumi Cheese',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.BREAKFAST_SAVORY_PROTEIN,
    protein_per_100g: 22,
    carbs_per_100g: 2.0,
    fat_per_100g: 12.0,
    calories_per_100g: 205,
    yield_factor_raw_to_cooked: 1.0,
    allergens: ['DAIRY'],
    purine_level: 'LOW',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: true,
    is_low_lactose: true
  },
  FETA_CHEESE_LIGHT: {
    code: 'FETA_CHEESE_LIGHT',
    name_ar: 'جبنة فيتا لايت قليلة الملح والدسم',
    name_en: 'Light Low-Sodium Feta Cheese',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.BREAKFAST_SAVORY_PROTEIN,
    protein_per_100g: 17,
    carbs_per_100g: 2.0,
    fat_per_100g: 9.0,
    calories_per_100g: 160,
    yield_factor_raw_to_cooked: 1.0,
    allergens: ['DAIRY'],
    purine_level: 'LOW',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: true,
    is_low_lactose: true
  },
  AIRFRYER_FALAFEL: {
    code: 'AIRFRYER_FALAFEL',
    name_ar: 'طعمية (فلافل) بيتي في القلاية الهوائية',
    name_en: 'Air-Fried Homemade Falafel',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.BREAKFAST_SAVORY_PROTEIN,
    protein_per_100g: 12,
    carbs_per_100g: 25,
    fat_per_100g: 4.5,
    calories_per_100g: 190,
    yield_factor_raw_to_cooked: 1.0,
    allergens: ['LEGUMES', 'SESAME'],
    purine_level: 'MODERATE',
    is_gluten_free: true,
    is_legume: true,
    is_dairy: false
  },
  TERMIS_LUPINI: {
    code: 'TERMIS_LUPINI',
    name_ar: 'ترمس بلدي مسلوق بالليمون والكمون (سناك عالي البروتين)',
    name_en: 'Boiled Lupini Beans (Termis)',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.BREAKFAST_SAVORY_PROTEIN,
    protein_per_100g: 16,
    carbs_per_100g: 10,
    fat_per_100g: 3.0,
    calories_per_100g: 120,
    yield_factor_raw_to_cooked: 1.0,
    allergens: ['LEGUMES'],
    purine_level: 'MODERATE',
    is_gluten_free: true,
    is_legume: true,
    is_dairy: false
  },

  // --- TRADITIONAL DAIRY ---
  LOWFAT_LABAN_ROB: {
    code: 'LOWFAT_LABAN_ROB',
    name_ar: 'لبن رائب / روب قليل الدسم',
    name_en: 'Low-Fat Laban / Rob',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.SWEET_SHAKE_PROTEIN,
    protein_per_100g: 4.0,
    carbs_per_100g: 4.5,
    fat_per_100g: 1.2,
    calories_per_100g: 45,
    yield_factor_raw_to_cooked: 1.0,
    allergens: ['DAIRY'],
    purine_level: 'LOW',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: true,
    is_low_lactose: true
  },
  SKIM_MILK: {
    code: 'SKIM_MILK',
    name_ar: 'حليب بقري طازج خالي الدسم',
    name_en: 'Fresh Skimmed Cow Milk',
    macro_type: 'PROTEIN',
    taste_profile: TASTE_PROFILES.SWEET_SHAKE_PROTEIN,
    protein_per_100g: 3.4,
    carbs_per_100g: 4.8,
    fat_per_100g: 0.1,
    calories_per_100g: 35,
    yield_factor_raw_to_cooked: 1.0,
    allergens: ['DAIRY'],
    purine_level: 'LOW',
    is_gluten_free: true,
    is_legume: false,
    is_dairy: true,
    is_low_lactose: false
  },

  // --- GULF & EGYPTIAN MAIN CARBS ---
  KABSA_SPICED_RICE: {
    code: 'KABSA_SPICED_RICE',
    name_ar: 'أرز كبسة / مجبوس خليجي بالبهارات واللومي دايت',
    name_en: 'Diet Spiced Kabsa / Machboos Rice',
    macro_type: 'CARBS',
    taste_profile: TASTE_PROFILES.MAIN_CARB,
    protein_per_100g: 2.9,
    carbs_per_100g: 28,
    fat_per_100g: 1.2,
    calories_per_100g: 134,
    yield_factor_raw_to_cooked: 2.6,
    allergens: [],
    is_gluten_free: true,
    is_legume: false
  },
  EGYPTIAN_RICE_COOKED: {
    code: 'EGYPTIAN_RICE_COOKED',
    name_ar: 'أرز مصري أبيض حبة قصيرة مطبوخ',
    name_en: 'Cooked Short-Grain Egyptian Rice',
    macro_type: 'CARBS',
    taste_profile: TASTE_PROFILES.MAIN_CARB,
    protein_per_100g: 2.5,
    carbs_per_100g: 28,
    fat_per_100g: 0.3,
    calories_per_100g: 130,
    yield_factor_raw_to_cooked: 2.5,
    allergens: [],
    is_gluten_free: true,
    is_legume: false
  },
  FREEKEH_EGYPTIAN_COOKED: {
    code: 'FREEKEH_EGYPTIAN_COOKED',
    name_ar: 'فريك مصري مطبوخ (قمح أخضر بطيء الامتصاص)',
    name_en: 'Cooked Green Wheat Freekeh',
    macro_type: 'CARBS',
    taste_profile: TASTE_PROFILES.MAIN_CARB,
    protein_per_100g: 4.0,
    carbs_per_100g: 24,
    fat_per_100g: 0.8,
    calories_per_100g: 120,
    yield_factor_raw_to_cooked: 2.4,
    allergens: ['WHEAT', 'GLUTEN'],
    is_gluten_free: false,
    is_legume: false
  },
  JAREEH_CRACKED_WHEAT: {
    code: 'JAREEH_CRACKED_WHEAT',
    name_ar: 'جريش قمح مجروش مع اللبن الخفيف',
    name_en: 'Traditional Cracked Wheat Jareesh',
    macro_type: 'CARBS',
    taste_profile: TASTE_PROFILES.MAIN_CARB,
    protein_per_100g: 4.5,
    carbs_per_100g: 21,
    fat_per_100g: 1.5,
    calories_per_100g: 115,
    yield_factor_raw_to_cooked: 2.8,
    allergens: ['WHEAT', 'GLUTEN', 'DAIRY'],
    is_gluten_free: false,
    is_legume: false
  },
  OKRA_BAMIA_TOMATO: {
    code: 'OKRA_BAMIA_TOMATO',
    name_ar: 'بامية مصرية مطبوخة بصلصة خفيفة وثوم',
    name_en: 'Cooked Bamia Okra in Light Tomato Sauce',
    macro_type: 'CARBS',
    taste_profile: TASTE_PROFILES.MAIN_CARB,
    protein_per_100g: 2.0,
    carbs_per_100g: 7.0,
    fat_per_100g: 0.2,
    calories_per_100g: 38,
    yield_factor_raw_to_cooked: 1.0,
    allergens: [],
    is_gluten_free: true,
    is_legume: false
  },

  // --- TRADITIONAL BREADS & PRE-WORKOUT FRUITS ---
  TAMEES_BREAD_BR: {
    code: 'TAMEES_BREAD_BR',
    name_ar: 'خبز تميس بُر بنخالة القمح الكاملة',
    name_en: 'Whole Wheat Tamees Flatbread',
    macro_type: 'CARBS',
    taste_profile: TASTE_PROFILES.BREAKFAST_CARB,
    protein_per_100g: 8.0,
    carbs_per_100g: 48,
    fat_per_100g: 1.5,
    calories_per_100g: 235,
    yield_factor_raw_to_cooked: 1.0,
    allergens: ['WHEAT', 'GLUTEN'],
    is_gluten_free: false,
    is_legume: false
  },
  WHOLE_WHEAT_TORTILLA: {
    code: 'WHOLE_WHEAT_TORTILLA',
    name_ar: 'خبز تورتيلا قمح كامل',
    name_en: 'Whole Wheat Tortilla Wrap',
    macro_type: 'CARBS',
    taste_profile: TASTE_PROFILES.BREAKFAST_CARB,
    protein_per_100g: 8.5,
    carbs_per_100g: 46,
    fat_per_100g: 4.0,
    calories_per_100g: 250,
    yield_factor_raw_to_cooked: 1.0,
    allergens: ['WHEAT', 'GLUTEN'],
    is_gluten_free: false,
    is_legume: false
  },
  DATES_KHALAS: {
    code: 'DATES_KHALAS',
    name_ar: 'تمر خلاص / سكري / عجوة فاخر (قبل التمرين)',
    name_en: 'Saudi Dates (Khalas / Sukkari / Ajwa)',
    macro_type: 'CARBS',
    taste_profile: TASTE_PROFILES.FRUIT_CARB || TASTE_PROFILES.BREAKFAST_CARB,
    protein_per_100g: 2.0,
    carbs_per_100g: 75,
    fat_per_100g: 0.2,
    calories_per_100g: 282,
    yield_factor_raw_to_cooked: 1.0,
    allergens: [],
    is_gluten_free: true,
    is_legume: false
  },

  // --- HEALTHY ARABIC FATS ---
  RAW_TAHINI_SESAME: {
    code: 'RAW_TAHINI_SESAME',
    name_ar: 'طحينة سمسم خام نقية 100%',
    name_en: '100% Pure Raw Sesame Tahini',
    macro_type: 'FATS',
    taste_profile: TASTE_PROFILES.HEALTHY_FAT,
    protein_per_100g: 18,
    carbs_per_100g: 18,
    fat_per_100g: 54,
    calories_per_100g: 600,
    allergens: ['SESAME'],
    is_gluten_free: true
  },
  DARK_CHOCOLATE_85: {
    code: 'DARK_CHOCOLATE_85',
    name_ar: 'شوكولاتة داكنة 85% كاكاو نقي',
    name_en: '85% Dark Chocolate',
    macro_type: 'FATS',
    taste_profile: TASTE_PROFILES.HEALTHY_FAT,
    protein_per_100g: 8.0,
    carbs_per_100g: 28,
    fat_per_100g: 46,
    calories_per_100g: 580,
    allergens: [],
    is_gluten_free: true
  }

};

export function isFoodClinicallySafe(foodItem, clinicalProfile = {}) {
  if (!foodItem) return false;

  const {
    is_g6pd = false,
    is_celiac = false,
    is_lactose_intolerant = false,
    is_gout = false,
    allergies = []
  } = clinicalProfile;

  // 1. G6PD: Ban all legumes
  if (is_g6pd && foodItem.is_legume) return false;

  // 2. CELIAC: Ban gluten
  if (is_celiac && !foodItem.is_gluten_free) return false;

  // 3. GOUT: Ban high purine items
  if (is_gout && foodItem.purine_level === 'HIGH') return false;

  // 4. LACTOSE: Ban non-low-lactose dairy
  if (is_lactose_intolerant && foodItem.is_dairy && !foodItem.is_low_lactose) return false;

  // 5. Explicit Allergies
  if (Array.isArray(allergies)) {
    const allergenUpper = allergies.map(a => a.toUpperCase());
    if (foodItem.allergens && foodItem.allergens.some(a => allergenUpper.includes(a))) {
      return false;
    }
  }

  return true;
}

/**
 * Returns all clinically safe, taste-compatible swap options for a given food.
 */
export function getCompatibleSwaps(foodCode, clinicalProfile = {}, options = {}) {
  const currentFood = FOOD_DATABASE[foodCode];
  if (!currentFood) return [];

  const { enforce_taste_profile = true } = options;

  return Object.values(FOOD_DATABASE).filter(targetFood => {
    if (targetFood.code === currentFood.code) return false;
    if (targetFood.macro_type !== currentFood.macro_type) return false;

    // Check taste profile partitioning
    if (enforce_taste_profile && targetFood.taste_profile !== currentFood.taste_profile) {
      return false;
    }

    // Check clinical safety
    return isFoodClinicallySafe(targetFood, clinicalProfile);
  });
}

/**
 * Calculates deterministic dynamic food swap with taste profile pairing guard.
 */

// Alias mapping for gold catalog standard IDs
FOOD_DATABASE.grilled_chicken_breast = FOOD_DATABASE.CHICKEN_BREAST;
FOOD_DATABASE.lean_ground_beef_95 = FOOD_DATABASE.LEAN_GROUND_BEEF_95_5;
FOOD_DATABASE.tilapia_fillet_grilled = FOOD_DATABASE.WHITE_FISH_FILLET;
FOOD_DATABASE.cottage_cheese = FOOD_DATABASE.COTTAGE_CHEESE_NATURAL;
FOOD_DATABASE.whole_eggs = FOOD_DATABASE.WHOLE_EGG;
FOOD_DATABASE.greek_yogurt_0pct = FOOD_DATABASE.GREEK_YOGURT_NONFAT;
FOOD_DATABASE.egyptian_baladi_bread = FOOD_DATABASE.EGYPTIAN_BALADI_BREAD;
FOOD_DATABASE.cooked_basmati_rice = FOOD_DATABASE.BASMATI_RICE_COOKED;
FOOD_DATABASE.cooked_potatoes = FOOD_DATABASE.BOILED_POTATOES;
FOOD_DATABASE.raw_rolled_oats = FOOD_DATABASE.ROLLED_OATS_RAW;
FOOD_DATABASE.extra_virgin_olive_oil = FOOD_DATABASE.EXTRA_VIRGIN_OLIVE_OIL;


// Gulf and Egyptian Authentic Aliases
FOOD_DATABASE.camel_meat_hashi = FOOD_DATABASE.CAMEL_MEAT_HASHI;
FOOD_DATABASE.CAMEL_MEAT_LEAN = FOOD_DATABASE.CAMEL_MEAT_HASHI;
FOOD_DATABASE.hamour_fish_grilled = FOOD_DATABASE.HAMOUR_FISH_GRILLED;
FOOD_DATABASE.HAMOUR_FISH = FOOD_DATABASE.HAMOUR_FISH_GRILLED;
FOOD_DATABASE.kanaad_kingfish_grilled = FOOD_DATABASE.KANAAD_KINGFISH_GRILLED;
FOOD_DATABASE.KANAAD_KINGFISH = FOOD_DATABASE.KANAAD_KINGFISH_GRILLED;
FOOD_DATABASE.tilapia_bolti_grilled = FOOD_DATABASE.TILAPIA_BOLTI_GRILLED;
FOOD_DATABASE.TILAPIA_FISH = FOOD_DATABASE.TILAPIA_BOLTI_GRILLED;
FOOD_DATABASE.bouri_fish_grilled = FOOD_DATABASE.BOURI_FISH_GRILLED;
FOOD_DATABASE.BOURI_FISH = FOOD_DATABASE.BOURI_FISH_GRILLED;
FOOD_DATABASE.kabsa_spiced_rice = FOOD_DATABASE.KABSA_SPICED_RICE;
FOOD_DATABASE.egyptian_rice_cooked = FOOD_DATABASE.EGYPTIAN_RICE_COOKED;
FOOD_DATABASE.EGYPTIAN_RICE = FOOD_DATABASE.EGYPTIAN_RICE_COOKED;
FOOD_DATABASE.dates_khalas = FOOD_DATABASE.DATES_KHALAS;
FOOD_DATABASE.shakshouka_eggs = FOOD_DATABASE.SHAKSHOUKA_EGGS;
FOOD_DATABASE.eggs_omelette = FOOD_DATABASE.EGGS_OMELETTE;
FOOD_DATABASE.labneh_light = FOOD_DATABASE.LABNEH_LIGHT;
FOOD_DATABASE.halloumi_light = FOOD_DATABASE.HALLOUMI_LIGHT;
FOOD_DATABASE.feta_cheese_light = FOOD_DATABASE.FETA_CHEESE_LIGHT;
FOOD_DATABASE.tamees_bread_br = FOOD_DATABASE.TAMEES_BREAD_BR;
FOOD_DATABASE.raw_tahini_sesame = FOOD_DATABASE.RAW_TAHINI_SESAME;

export function calculateDynamicFoodSwap({
  current_food_code,
  current_portion_g,
  target_food_code,
  clinical_profile = {},
  enforce_taste_profile = true
}) {
  const currentFood = FOOD_DATABASE[current_food_code];
  const targetFood = FOOD_DATABASE[target_food_code];

  if (!currentFood) {
    throw new Error(`Current food '${current_food_code}' not found in database.`);
  }
  if (!targetFood) {
    throw new Error(`Target replacement food '${target_food_code}' not found in database.`);
  }

  if (currentFood.macro_type !== targetFood.macro_type) {
    throw new Error(`Invalid Swap: Cannot swap ${currentFood.macro_type} (${currentFood.name_ar}) with ${targetFood.macro_type} (${targetFood.name_ar}).`);
  }

  // 1. Clinical Safety Guardrail Check (Highest Priority Safety Tier)
  if (!isFoodClinicallySafe(targetFood, clinical_profile)) {
    throw new Error(`Clinical Guardrail Violation: '${targetFood.name_ar}' is strictly contraindicated for client's medical conditions.`);
  }

  // 2. Taste Profile & Culinary Pairing Guard Check
  if (enforce_taste_profile && currentFood.taste_profile !== targetFood.taste_profile) {
    throw new Error(`Culinary Pairing Incompatibility: Cannot swap '${currentFood.name_ar}' (${currentFood.taste_profile}) with '${targetFood.name_ar}' (${targetFood.taste_profile}). Use compatible taste category.`);
  }

  let targetMacroGrams = 0;
  let replacementDensityPer100g = 0;

  if (currentFood.macro_type === 'PROTEIN') {
    targetMacroGrams = (current_portion_g * currentFood.protein_per_100g) / 100;
    replacementDensityPer100g = targetFood.protein_per_100g;
  } else if (currentFood.macro_type === 'CARBS') {
    targetMacroGrams = (current_portion_g * currentFood.carbs_per_100g) / 100;
    replacementDensityPer100g = targetFood.carbs_per_100g;
  } else if (currentFood.macro_type === 'FATS') {
    targetMacroGrams = (current_portion_g * currentFood.fat_per_100g) / 100;
    replacementDensityPer100g = targetFood.fat_per_100g;
  }

  const calculatedGrams = Math.round(targetMacroGrams * (100 / replacementDensityPer100g));

  let clinicalNote = null;
  if (clinical_profile.is_bariatric && calculatedGrams > 150) {
    clinicalNote = `تنبيه تكميم المعدة: وزن البديل (${calculatedGrams}g) يتجاوز سعة الوجبة (150g). يُنصح بتقسيم الوجبة على دفعتين.`;
  }

  const resultMacros = {
    protein_g: Math.round(((calculatedGrams * targetFood.protein_per_100g) / 100) * 10) / 10,
    carbs_g: Math.round(((calculatedGrams * targetFood.carbs_per_100g) / 100) * 10) / 10,
    fat_g: Math.round(((calculatedGrams * targetFood.fat_per_100g) / 100) * 10) / 10,
    calories_kcal: Math.round((calculatedGrams * targetFood.calories_per_100g) / 100)
  };

  return {
    success: true,
    current_food: {
      code: currentFood.code,
      name_ar: currentFood.name_ar,
      taste_profile: currentFood.taste_profile,
      portion_g: current_portion_g
    },
    replacement_food: {
      code: targetFood.code,
      name_ar: targetFood.name_ar,
      taste_profile: targetFood.taste_profile,
      portion_g: calculatedGrams,
      macros: resultMacros
    },
    clinical_note: clinicalNote
  };
}

/**
 * Converts gram weights into intuitive visual hand portions for travel/dining.
 */
export function convertGramsToHandPortions(grams, macroType, foodCode = '') {
  const g = Number(grams) || 0;
  const upperType = String(macroType).toUpperCase();

  if (upperType === 'PROTEIN') {
    // 1 Palm = ~100-120g cooked meat/fish/poultry (~25-30g Protein)
    const palms = Math.round((g / 110) * 10) / 10;
    return {
      hand_unit: 'PALM',
      portions_count: palms,
      label_ar: `${palms} كف اليد (سُمك ومساحة الكف بدون الأصابع)`,
      label_en: `${palms} Palm(s)`,
      guide_ar: 'كف اليد الواحد يعادل حوالي 100-120 جرام مطبوخ (~25-30 جم بروتين صافي).'
    };
  }

  if (upperType === 'CARBS') {
    // 1 Cupped Fist = ~130-150g cooked rice/potato (~35-40g Carbs)
    const fists = Math.round((g / 140) * 10) / 10;
    return {
      hand_unit: 'FIST',
      portions_count: fists,
      label_ar: `${fists} قبضة اليد (حجم قبضة اليد المضمومة)`,
      label_en: `${fists} Fist(s)`,
      guide_ar: 'قبضة اليد الواحدة تعادل حوالي 130-150 جرام أرز أو بطاطس مطبوخة (~35-40 جم كارب).'
    };
  }

  if (upperType === 'FATS') {
    // 1 Thumb Tip = ~10-14g fat (1 tablespoon oil/butter/peanut butter)
    const thumbs = Math.round((g / 12) * 10) / 10;
    return {
      hand_unit: 'THUMB',
      portions_count: thumbs,
      label_ar: `${thumbs} عقلة الإبهام (حجم عقلة الإبهام العلوية)`,
      label_en: `${thumbs} Thumb(s)`,
      guide_ar: 'عقلة الإبهام الواحدة تعادل حوالي 10-12 جرام زيت زيتون أو زبدة (~1 ملعقة طعام).'
    };
  }

  return {
    hand_unit: 'PORTION',
    portions_count: 1,
    label_ar: `${g} جرام`,
    label_en: `${g}g`,
    guide_ar: 'حصة قياسية'
  };
}

/**
 * Returns pre-engineered Dining Out & Travel Blueprints.
 */
export function getTravelDiningBlueprints() {
  return [
    {
      id: 'GRILLED_SKEWERS_BLUEPRINT',
      title_ar: 'خطة مطاعم المشويات (Grilled Skewers Blueprint)',
      title_en: 'Grilled Skewers Restaurant Blueprint',
      suitability_ar: 'مطاعم الكباب، المشويات، الكبابجي، والشيش طاووق',
      ordered_items_ar: [
        '2 سيخ شيش طاووق أو كباب لحم مشوي صافي (~200g لحم مشوي).',
        'طبق سلطة خضراء بلدي كبير (طماطم، خيار، جرجير، بقدونس بدون زيوت).',
        'نصف رغيف خبز بلدي أو 4-5 ملاعق طعام أرز مشويات أصفر.'
      ],
      golden_rules_ar: [
        'اطلب اللحم أو الدجاج مشوياً بدون دهن أو لية ضاني زائدة.',
        'استبدل صوص الطحينة الدسم بسلطة خضراء أو سلطة زبادي بالخيار.'
      ],
      estimated_macros: {
        calories_kcal: 490,
        protein_g: 46,
        carbs_g: 38,
        fat_g: 14
      }
    },
    {
      id: 'DIET_SHAWARMA_BLUEPRINT',
      title_ar: 'خطة صحن الشاورما الدايت (Diet Shawarma Blueprint)',
      title_en: 'Diet Shawarma Plate Blueprint',
      suitability_ar: 'مطاعم الشاورما السورية والعربية',
      ordered_items_ar: [
        'صحن شاورما دجاج عربي صافي بالوزن (~180g دجاج مقطع).',
        'خبز تورتيلا خفيف واحد أو حبة بطاطس مشوية.',
        'سلطة فتوش أو خضراء بدون الخبز المقلي وبدون دبس رمان محلى.'
      ],
      golden_rules_ar: [
        'اطلب الصحن بدون تومية مايونيز دسمة؛ واطلب صوص زبادي بالثوم والليمون بدلاً منها.',
        'امتنع عن تناول الخبز المقلي المضاف في السلطات.'
      ],
      estimated_macros: {
        calories_kcal: 510,
        protein_g: 48,
        carbs_g: 40,
        fat_g: 16
      }
    },
    {
      id: 'EMERGENCY_SUPERMARKET_BLUEPRINT',
      title_ar: 'خطة سناك السوبر ماركت والسفر الطارئ (Emergency Travel Snack)',
      title_en: 'Emergency Travel & Supermarket Snack',
      suitability_ar: 'أثناء السفر، المطارات، محطات القطار، ومحلات السوبر ماركت',
      ordered_items_ar: [
        'علبة تونة لايت مفتتة بالماء ومصفاة (أو كوب زبادي يوناني 150g عالي البروتين).',
        'كيس رايس كيك صغير (3-4 أقراص) أو ثمرة موز طازجة.',
        'زجاجة ماء معدنية كبيرة (1 لتر) + قهوة سوداء سادة بدون سكر.'
      ],
      golden_rules_ar: [
        'تأكد من اختيار التونة المعبأة في الماء فقط وليس الزيت.',
        'اختر الزبادي اليوناني السادة خالي النكهات المحلاة بالسكر.'
      ],
      estimated_macros: {
        calories_kcal: 275,
        protein_g: 32,
        carbs_g: 28,
        fat_g: 2.5
      }
    }
  ];
}

export const PORTION_DISPLAY_MODES = {
  GRAMS: 'GRAMS',
  HAND_PORTIONS: 'HAND_PORTIONS',
  DUAL: 'DUAL'
};

/**
 * Enhanced portion visualizer delivering both precision scale grams and intuitive hand metrics.
 */
export function formatItemPortionDisplay({
  food_code = '',
  amount_g = 100,
  unit = 'جم',
  macro_type = 'PROTEIN',
  food_state = 'COOKED'
}, mode = PORTION_DISPLAY_MODES.DUAL) {
  const g = Number(amount_g) || 0;
  const upperCode = String(food_code).toUpperCase();

  // 1. Calculate Raw vs Cooked Equivalents
  let rawCookedNote = '';
  if (['CHICKEN_BREAST', 'SKINLESS_CHICKEN_THIGHS', 'LEAN_GROUND_BEEF_95_5', 'LEAN_VEAL_BEEF'].some(c => upperCode.includes(c))) {
    const rawG = Math.round(g / 0.75);
    rawCookedNote = `${g} جم مطبوخ (${rawG} جم نيئ)`;
  } else if (['WHITE_FISH_FILLET', 'SHRIMP_GRILLED', 'SALMON_ATLANTIC_COOKED'].some(c => upperCode.includes(c))) {
    const rawG = Math.round(g / 0.80);
    rawCookedNote = `${g} جم مطبوخ (${rawG} جم نيئ)`;
  } else if (['BASMATI_RICE_COOKED', 'WHOLE_WHEAT_PASTA_COOKED'].some(c => upperCode.includes(c))) {
    const rawG = Math.round(g / 2.5);
    rawCookedNote = `${g} جم مطبوخ (${rawG} جم نيئ)`;
  } else if (upperCode.includes('ROLLED_OATS')) {
    const cookedG = Math.round(g * 2.8);
    rawCookedNote = `${g} جم نيئ جاف (~ ${cookedG} جم بعد الطهي)`;
  } else if (upperCode.includes('SWEET_POTATO') || upperCode.includes('BOILED_POTATOES')) {
    rawCookedNote = `${g} جم مشوي/مسلوق`;
  } else {
    rawCookedNote = `${g} ${unit}`;
  }

  // 2. Calculate Hand Metric Description
  let handDesc = '';
  if (upperCode.includes('CHICKEN') || upperCode.includes('BEEF') || upperCode.includes('FISH') || upperCode.includes('SALMON') || upperCode.includes('SHRIMP')) {
    const palms = Math.round((g / 110) * 10) / 10;
    handDesc = palms >= 0.8 && palms <= 1.2 ? 'ما يعادل كف اليد كاملاً' : `ما يعادل ${palms} كف اليد`;
  } else if (upperCode.includes('EGG_WHITE')) {
    const count = Math.max(1, Math.round(g / 33));
    handDesc = `ما يعادل بياض ${count} بيضات مسلوقة`;
  } else if (upperCode.includes('WHOLE_EGG')) {
    const count = Math.max(1, Math.round(g / 50));
    handDesc = `ما يعادل ${count} حبات بيض كامل`;
  } else if (upperCode.includes('COTTAGE_CHEESE')) {
    const spoons = Math.max(1, Math.round(g / 40));
    handDesc = `ما يعادل ${spoons} ملاعق طعام كبيرة هرمية`;
  } else if (upperCode.includes('GREEK_YOGURT')) {
    handDesc = 'ما يعادل علبة زبادي قياسية';
  } else if (upperCode.includes('TURKEY')) {
    const slices = Math.max(1, Math.round(g / 30));
    handDesc = `ما يعادل ${slices} شرائح رومي مدخن`;
  } else if (upperCode.includes('FAVA_BEANS')) {
    const spoons = Math.max(1, Math.round(g / 30));
    handDesc = `ما يعادل ${spoons} ملاعق طعام فول`;
  } else if (upperCode.includes('RICE') || upperCode.includes('PASTA')) {
    const spoons = Math.max(1, Math.round(g / 30));
    handDesc = `ما يعادل قبضة يد مغلقة أو ${spoons} ملاعق طعام ممسوحة`;
  } else if (upperCode.includes('POTATO')) {
    handDesc = 'ما يعادل حبة متوسطة بحجم قبضة اليد';
  } else if (upperCode.includes('BALADI_BREAD')) {
    const loaves = Math.round((g / 100) * 10) / 10;
    handDesc = loaves === 1 ? 'ما يعادل رغيف بلدي كامل' : `ما يعادل ${loaves} رغيف بلدي`;
  } else if (upperCode.includes('TOAST')) {
    const slices = Math.max(1, Math.round(g / 35));
    handDesc = `ما يعادل ${slices} شريحة توست أسمر`;
  } else if (upperCode.includes('RICE_CAKES')) {
    const cakes = Math.max(1, Math.round(g / 9));
    handDesc = `ما يعادل ${cakes} أقراص رايس كيك`;
  } else if (upperCode.includes('OATS')) {
    const spoons = Math.max(1, Math.round(g / 10));
    handDesc = `ما يعادل ${spoons} ملاعق طعام ممسوحة`;
  } else if (upperCode.includes('OLIVE_OIL')) {
    handDesc = 'ما يعادل عقلة الإبهام أو ملعقة طعام واحدة';
  } else if (upperCode.includes('ALMONDS')) {
    const count = Math.max(1, Math.round(g * 0.8));
    handDesc = `ما يعادل قبضة صغيرة مفرودة (~${count} حبة)`;
  } else if (upperCode.includes('AVOCADO')) {
    handDesc = 'ما يعادل نصف حبة أفوكادو متوسطة';
  } else if (upperCode.includes('MOLOKHIA') || upperCode.includes('SALAD') || upperCode.includes('VEGETABLES')) {
    handDesc = 'ما يعادل كفين مضمومين معاً (حجم حر)';
  } else {
    const genericPortion = convertGramsToHandPortions(g, macro_type);
    handDesc = genericPortion.label_ar;
  }

  // 3. Render according to requested mode
  if (mode === PORTION_DISPLAY_MODES.GRAMS) {
    return {
      mode,
      primary_text: rawCookedNote,
      secondary_text: null,
      raw_cooked_text: rawCookedNote,
      hand_text: handDesc
    };
  }

  if (mode === PORTION_DISPLAY_MODES.HAND_PORTIONS) {
    return {
      mode,
      primary_text: `[ ${handDesc} ]`,
      secondary_text: rawCookedNote,
      raw_cooked_text: rawCookedNote,
      hand_text: handDesc
    };
  }

  // Default DUAL Mode
  return {
    mode: PORTION_DISPLAY_MODES.DUAL,
    primary_text: rawCookedNote,
    secondary_text: `[ ${handDesc} ]`,
    raw_cooked_text: rawCookedNote,
    hand_text: handDesc
  };
}


export const GOLD_FOOD_CATALOG = [
  {
    "id": "grilled_chicken_breast",
    "name_ar": "صدور دجاج مشوية",
    "name_en": "Skinless Chicken Breast",
    "primary_macro": "PROTEIN",
    "taste_profile": "MAIN_SAVORY_PROTEIN",
    "cultural_tag": "ALL",
    "calories_per_100g": 165,
    "protein_per_100g": 31,
    "carbs_per_100g": 0,
    "fats_per_100g": 3.6,
    "yield_factor": 0.75,
    "hand_portion_equivalent": "1 كف يد = 100 جم مطبوخ (31 جم بروتين)",
    "culinary_hacks": [
      "تقطيع الصدر شرائح رفيعة للشواء السريع في 4 دقائق لمنع جفاف السوائل.",
      "تتبيل بـ ليمون، ثوم بودرة، وبابريكا مدخنة مع ملعقة خل قبل الشواء."
    ]
  },
  {
    "id": "lean_ground_beef_95",
    "name_ar": "لحم بقري مفروم صافي (95/5)",
    "name_en": "Lean Ground Beef 95/5",
    "primary_macro": "PROTEIN",
    "taste_profile": "MAIN_SAVORY_PROTEIN",
    "cultural_tag": "ALL",
    "calories_per_100g": 165,
    "protein_per_100g": 26,
    "carbs_per_100g": 0,
    "fats_per_100g": 6,
    "yield_factor": 0.72,
    "hand_portion_equivalent": "1 كف يد = 100 جم مطبوخ (26 جم بروتين)",
    "culinary_hacks": [
      "تشكيلها كأصابع كفتة مع بقدونس وبصل مصفى وشواؤها في الفرن أو القلاية بدون دهون إضافية."
    ]
  },
  {
    "id": "tilapia_fillet_grilled",
    "name_ar": "سمك فيليه بلطي مشوي",
    "name_en": "Grilled Tilapia Fillet",
    "primary_macro": "PROTEIN",
    "taste_profile": "MAIN_SAVORY_PROTEIN",
    "cultural_tag": "EGYPTIAN_GULF",
    "calories_per_100g": 125,
    "protein_per_100g": 26,
    "carbs_per_100g": 0,
    "fats_per_100g": 2.5,
    "yield_factor": 0.8,
    "hand_portion_equivalent": "1 كف يد مفرود = 110 جم مطبوخ (28 جم بروتين)",
    "culinary_hacks": [
      "تتبيل بالليمون والكمون والثوم والكزبرة وقلي هوائي على 190°C لـ 8 دقائق."
    ]
  },
  {
    "id": "cottage_cheese",
    "name_ar": "جبن قريش طبيعي",
    "name_en": "Natural Cottage Cheese",
    "primary_macro": "PROTEIN",
    "taste_profile": "BREAKFAST_SAVORY_PROTEIN",
    "cultural_tag": "EGYPTIAN",
    "calories_per_100g": 85,
    "protein_per_100g": 12,
    "carbs_per_100g": 3.5,
    "fats_per_100g": 2,
    "yield_factor": 1,
    "hand_portion_equivalent": "3 ملاعق طعام كبيرة = 100 جم",
    "culinary_hacks": [
      "خفق بالهاند بلندر مع ملعقتين ماء دافئ وزعتر وبابريكا لتحويلها لقشطة ناعمة.",
      "خلطها مع رشة سكر دايت وقرفة أو كاكاو خام لعمل موس تشيز كيك حلو."
    ]
  },
  {
    "id": "whole_eggs",
    "name_ar": "بيض كامل",
    "name_en": "Whole Eggs",
    "primary_macro": "PROTEIN",
    "taste_profile": "BREAKFAST_SAVORY_PROTEIN",
    "cultural_tag": "ALL",
    "calories_per_100g": 145,
    "protein_per_100g": 12.5,
    "carbs_per_100g": 0.8,
    "fats_per_100g": 10,
    "unit_weight_g": 50,
    "yield_factor": 1,
    "hand_portion_equivalent": "2 بيضة متوسطة = حصة بروتين ودهون متوازنة",
    "culinary_hacks": [
      "خفق البيض مع ملعقة ماء بارد قبل الطهي لصنع أومليت هش ومضاعف الحجم.",
      "هرس البيض المسلوق مع نصف ملعقة مستردة وزبادي كبديل صحي للمايونيز."
    ]
  },
  {
    "id": "greek_yogurt_0pct",
    "name_ar": "زبادي يوناني خالي الدسم",
    "name_en": "0% Fat Plain Greek Yogurt",
    "primary_macro": "PROTEIN",
    "taste_profile": "SWEET_SHAKE_PROTEIN",
    "cultural_tag": "ALL",
    "calories_per_100g": 59,
    "protein_per_100g": 10,
    "carbs_per_100g": 3.6,
    "fats_per_100g": 0.4,
    "yield_factor": 1,
    "hand_portion_equivalent": "كوب متوسط = 170 جم (17 جم بروتين بطيء الامتصاص)"
  },
  {
    "id": "egyptian_baladi_bread",
    "name_ar": "عيش بلدي مصري كامل",
    "name_en": "Egyptian Baladi Bread",
    "primary_macro": "CARB",
    "taste_profile": "BREAKFAST_MAIN_CARB",
    "cultural_tag": "EGYPTIAN",
    "calories_per_100g": 250,
    "protein_per_100g": 8.5,
    "carbs_per_100g": 50,
    "fats_per_100g": 1.2,
    "fiber_per_100g": 6,
    "unit_weight_g": 100,
    "yield_factor": 1,
    "hand_portion_equivalent": "نصف رغيف بلدي = 25 جم كارب معقد وغني بالردة"
  },
  {
    "id": "cooked_basmati_rice",
    "name_ar": "أرز بسمتي مطبوخ",
    "name_en": "Cooked Basmati Rice",
    "primary_macro": "CARB",
    "taste_profile": "MAIN_SAVORY_CARB",
    "cultural_tag": "ALL",
    "calories_per_100g": 130,
    "protein_per_100g": 2.5,
    "carbs_per_100g": 28,
    "fats_per_100g": 0.4,
    "raw_to_cooked_ratio": 2.6,
    "yield_factor": 2.6,
    "hand_portion_equivalent": "1 قبضة يد مطبوخة = 130 جم (36 جم كارب)"
  },
  {
    "id": "cooked_potatoes",
    "name_ar": "بطاطس مسلوقة أو مشوية في الإيرفراير",
    "name_en": "Cooked / Air-Fried Potatoes",
    "primary_macro": "CARB",
    "taste_profile": "MAIN_SAVORY_CARB",
    "cultural_tag": "ALL",
    "calories_per_100g": 87,
    "protein_per_100g": 2,
    "carbs_per_100g": 20,
    "fats_per_100g": 0.1,
    "fiber_per_100g": 1.8,
    "yield_factor": 1,
    "hand_portion_equivalent": "1 ثمرة بطاطس متوسطة = قبضة يد (أعلى مؤشر شبع)",
    "culinary_hacks": [
      "تقطيع ودجز ورش بابريكا وروزماري ومسحة زيت وقليها في الإيرفراير 15 دقيقة."
    ]
  },
  {
    "id": "raw_rolled_oats",
    "name_ar": "شوفان كامل الحبة جاف",
    "name_en": "Rolled Oats Raw",
    "primary_macro": "CARB",
    "taste_profile": "BREAKFAST_SWEET_CARB",
    "cultural_tag": "ALL",
    "calories_per_100g": 380,
    "protein_per_100g": 13.5,
    "carbs_per_100g": 66,
    "fats_per_100g": 6.5,
    "fiber_per_100g": 10,
    "yield_factor": 2.8,
    "hand_portion_equivalent": "4 ملاعق طعام كبيرة ممسوحة = 40 جم جاف"
  },
  {
    "id": "extra_virgin_olive_oil",
    "name_ar": "زيت زيتون بكر ممتاز",
    "name_en": "Extra Virgin Olive Oil",
    "primary_macro": "FAT",
    "taste_profile": "HEALTHY_FAT",
    "cultural_tag": "ALL",
    "calories_per_100g": 900,
    "protein_per_100g": 0,
    "carbs_per_100g": 0,
    "fats_per_100g": 100,
    "hand_portion_equivalent": "1 ملعقة طعام = عقلة إصبع الإبهام (~10 جم دهون صحية)"
  }
];

/**
 * Context-Aware Food Swap & Portion Converter Engine
 * Pure Deterministic Math - USDA Macro Densities
 */
export function calculateEquivalentSwap({
  sourceFoodId,
  sourceGrams,
  targetFoodId,
  foodCatalog = GOLD_FOOD_CATALOG,
  enforceTasteProfile = true,
  displayMode = 'GRAMS' // 'GRAMS' | 'HAND_PORTIONS'
}) {
  const catalog = (foodCatalog && foodCatalog.length > 0) ? foodCatalog : GOLD_FOOD_CATALOG;
  const sourceFood = catalog.find((f) => f.id === sourceFoodId || f.code === sourceFoodId);
  const targetFood = catalog.find((f) => f.id === targetFoodId || f.code === targetFoodId);

  if (!sourceFood || !targetFood) {
    throw new Error(`Invalid food ID: ${sourceFoodId} or ${targetFoodId}`);
  }

  // Normalize taste profile and primary macro comparison
  const sourceTaste = sourceFood.taste_profile;
  const targetTaste = targetFood.taste_profile;

  // Taste profile collision check
  if (enforceTasteProfile && sourceTaste !== targetTaste) {
    return {
      success: false,
      error_code: 'INCOMPATIBLE_TASTE_PROFILE',
      message: `لا يمكن استبدال صنف (${sourceFood.name_ar}) بصنف (${targetFood.name_ar}) لاختلاف طبيعة الاستخدام والوجبة.`
    };
  }

  const primaryMacro = sourceFood.primary_macro || sourceFood.macro_type;
  let sourceMacroDensity = 0;
  let targetMacroDensity = 0;

  if (primaryMacro === 'PROTEIN') {
    sourceMacroDensity = sourceFood.protein_per_100g !== undefined ? sourceFood.protein_per_100g : 0;
    targetMacroDensity = targetFood.protein_per_100g !== undefined ? targetFood.protein_per_100g : 0;
  } else if (primaryMacro === 'CARB') {
    sourceMacroDensity = sourceFood.carbs_per_100g !== undefined ? sourceFood.carbs_per_100g : 0;
    targetMacroDensity = targetFood.carbs_per_100g !== undefined ? targetFood.carbs_per_100g : 0;
  } else if (primaryMacro === 'FAT') {
    sourceMacroDensity = sourceFood.fats_per_100g !== undefined ? sourceFood.fats_per_100g : (sourceFood.fat_per_100g !== undefined ? sourceFood.fat_per_100g : 0);
    targetMacroDensity = targetFood.fats_per_100g !== undefined ? targetFood.fats_per_100g : (targetFood.fat_per_100g !== undefined ? targetFood.fat_per_100g : 0);
  }

  if (targetMacroDensity <= 0) {
    throw new Error(`Target food density is zero for primary macro: ${primaryMacro}`);
  }

  // Weight Calculation: Target = Source * (Density_Source / Density_Target)
  const exactTargetGrams = (sourceGrams * sourceMacroDensity) / targetMacroDensity;
  const roundedTargetGrams = Math.round(exactTargetGrams / 5) * 5; // Clean 5g rounding

  // Macro yield verification
  const resultingProtein = +((roundedTargetGrams * targetFood.protein_per_100g) / 100).toFixed(1);
  const resultingCarbs = +((roundedTargetGrams * targetFood.carbs_per_100g) / 100).toFixed(1);
  const resultingFats = +((roundedTargetGrams * (targetFood.fats_per_100g || targetFood.fat_per_100g || 0)) / 100).toFixed(1);
  const resultingCalories = Math.round((roundedTargetGrams * targetFood.calories_per_100g) / 100);

  return {
    success: true,
    source_food: {
      id: sourceFood.id,
      name: sourceFood.name_ar,
      grams: sourceGrams
    },
    target_food: {
      id: targetFood.id,
      name: targetFood.name_ar,
      calculated_grams: roundedTargetGrams,
      hand_portion: targetFood.hand_portion_equivalent || 'معيار يدوي غير محدد',
      culinary_hacks: targetFood.culinary_hacks || []
    },
    macros: {
      calories: resultingCalories,
      protein: resultingProtein,
      carbs: resultingCarbs,
      fats: resultingFats
    },
    display_mode: displayMode
  };
}

export function getEligibleSwaps(sourceFoodId, foodCatalog = GOLD_FOOD_CATALOG) {
  const catalog = (foodCatalog && foodCatalog.length > 0) ? foodCatalog : GOLD_FOOD_CATALOG;
  const sourceFood = catalog.find((f) => f.id === sourceFoodId || f.code === sourceFoodId);
  if (!sourceFood) return [];

  const sourceTaste = sourceFood.taste_profile;
  const sourceMacro = sourceFood.primary_macro || sourceFood.macro_type;

  return catalog.filter((item) => 
    (item.id !== sourceFood.id && item.code !== sourceFood.id) && 
    (item.taste_profile === sourceTaste) &&
    ((item.primary_macro || item.macro_type) === sourceMacro)
  );
}
