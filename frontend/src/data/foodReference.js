/**
 * Canonical per-100g macro reference for every food code that has a USDA equivalent.
 * Source: U.S. Department of Agriculture, FoodData Central (SR Legacy 2018-04, Foundation Foods,
 * FNDDS). fdc_id links each row to its record. Groups that contain an item of the curated core
 * catalog (data/catalogs/core-global-food-batch-v1.json) take that item's documented record.
 * Weights are as-eaten (cooked where the code is cooked).
 *
 * SINGLE SOURCE OF TRUTH for these codes: every food table in the app (swap engine,
 * culinary meal builder, JSON catalogs) must carry exactly these values.
 * test/food-reference-guard.test.js fails if any table drifts from this file.
 *
 * Codes NOT listed here (supplements, branded "light" products, composite/regional
 * dishes, baladi bread, camel meat) keep their current label/recipe-based values
 * and are pending a documented reference.
 */
export const FOOD_REFERENCE = Object.freeze({
  // CHICKEN_BREAST — SR_LEGACY Chicken, broilers or fryers, breast, meat only, cooked, roasted (curated core catalog)
  CHICKEN_BREAST: { kcal: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, fdc_id: 171477 },
  CHICKEN_BREAST_COOKED: { kcal: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, fdc_id: 171477 },
  CHICKEN_BREAST_GRILLED: { kcal: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, fdc_id: 171477 },
  CHICKEN_BREAST_ROASTED_SKINLESS: { kcal: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, fdc_id: 171477 },
  GRILLED_CHICKEN_BREAST: { kcal: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, fdc_id: 171477 },
  // CHICKEN_THIGH_SKINLESS — SR_LEGACY Chicken, broilers or fryers, thigh, meat only, cooked, roasted
  CHICKEN_THIGHS_SKINLESS: { kcal: 179, protein: 24.8, carbs: 0, fat: 8.2, fiber: 0, fdc_id: 172388 },
  SKINLESS_CHICKEN_THIGHS: { kcal: 179, protein: 24.8, carbs: 0, fat: 8.2, fiber: 0, fdc_id: 172388 },
  // CHICKEN_LIVER — SR_LEGACY Chicken, liver, all classes, cooked, simmered
  CHICKEN_LIVER_GRILLED: { kcal: 167, protein: 24.5, carbs: 0.9, fat: 6.5, fiber: 0, fdc_id: 171061 },
  // TURKEY_BREAST_ROASTED — SR_LEGACY Turkey, whole, breast, meat only, cooked, roasted
  FRESH_TURKEY_BREAST: { kcal: 147, protein: 30.1, carbs: 0, fat: 2.1, fiber: 0, fdc_id: 171496 },
  // TURKEY_BREAST_DELI — SR_LEGACY Turkey breast, sliced, prepackaged
  SMOKED_TURKEY: { kcal: 106, protein: 14.8, carbs: 2.2, fat: 3.8, fiber: 0, fdc_id: 172941 },
  SMOKED_TURKEY_BREAST: { kcal: 106, protein: 14.8, carbs: 2.2, fat: 3.8, fiber: 0, fdc_id: 172941 },
  SMOKED_TURKEY_SLICES: { kcal: 106, protein: 14.8, carbs: 2.2, fat: 3.8, fiber: 0, fdc_id: 172941 },
  // BEEF_GROUND_95 — SR_LEGACY Beef, ground, 95% lean meat / 5% fat, patty, cooked, broiled
  LEAN_GROUND_BEEF_95_5: { kcal: 174, protein: 26.3, carbs: 0, fat: 6.8, fiber: 0, fdc_id: 171791 },
  LEAN_GROUND_BEEF_95: { kcal: 174, protein: 26.3, carbs: 0, fat: 6.8, fiber: 0, fdc_id: 171791 },
  LEAN_BEEF: { kcal: 174, protein: 26.3, carbs: 0, fat: 6.8, fiber: 0, fdc_id: 171791 },
  // BEEF_GROUND_90 — SR_LEGACY Beef, ground, 90% lean meat / 10% fat, crumbles, cooked, pan-browned (curated core catalog)
  GROUND_BEEF_90_10: { kcal: 230, protein: 28.5, carbs: 0, fat: 12, fiber: 0, fdc_id: 171794 },
  BEEF_GROUND_90_LEAN_COOKED: { kcal: 230, protein: 28.5, carbs: 0, fat: 12, fiber: 0, fdc_id: 171794 },
  // BEEF_SIRLOIN — SR_LEGACY Beef, top sirloin, steak, separable lean only, trimmed to 0" fat, all grades, cooked, broiled
  BEEF_SIRLOIN_STEAK: { kcal: 183, protein: 30.6, carbs: 0, fat: 5.8, fiber: 0, fdc_id: 168634 },
  BEEF_TOP_SIRLOIN_LEAN: { kcal: 183, protein: 30.6, carbs: 0, fat: 5.8, fiber: 0, fdc_id: 168634 },
  // VEAL_LEAN — SR_LEGACY Veal, leg (top round), separable lean only, cooked, roasted
  LEAN_VEAL_BEEF: { kcal: 150, protein: 28.1, carbs: 0, fat: 3.4, fiber: 0, fdc_id: 173822 },
  // BEEF_LIVER — SR_LEGACY Beef, variety meats and by-products, liver, cooked, braised
  BEEF_LIVER_ALEXANDRIAN: { kcal: 191, protein: 29.1, carbs: 5.1, fat: 5.3, fiber: 0, fdc_id: 168626 },
  GRILLED_BEEF_LIVER: { kcal: 191, protein: 29.1, carbs: 5.1, fat: 5.3, fiber: 0, fdc_id: 168626 },
  // LAMB_LEAN — SR_LEGACY Lamb, leg, whole (shank and sirloin), separable lean only, trimmed to 1/4" fat, choice, cooked, roasted
  LEAN_LAMB_LOIN: { kcal: 191, protein: 28.3, carbs: 0, fat: 7.7, fiber: 0, fdc_id: 174314 },
  // PIGEON — SR_LEGACY Dove, cooked (includes squab)
  GRILLED_PIGEON_LEAN: { kcal: 213, protein: 23.9, carbs: 0, fat: 13, fiber: 0, fdc_id: 169905 },
  // TILAPIA — SR_LEGACY Fish, tilapia, cooked, dry heat
  TILAPIA_BOLTI_GRILLED: { kcal: 128, protein: 26.2, carbs: 0, fat: 2.7, fiber: 0, fdc_id: 175177 },
  TILAPIA_COOKED: { kcal: 128, protein: 26.2, carbs: 0, fat: 2.7, fiber: 0, fdc_id: 175177 },
  TILAPIA_FILLET_GRILLED: { kcal: 128, protein: 26.2, carbs: 0, fat: 2.7, fiber: 0, fdc_id: 175177 },
  TILAPIA_FISH: { kcal: 128, protein: 26.2, carbs: 0, fat: 2.7, fiber: 0, fdc_id: 175177 },
  // SALMON — SR_LEGACY Fish, salmon, Atlantic, farmed, cooked, dry heat
  SALMON_ATLANTIC_COOKED: { kcal: 206, protein: 22.1, carbs: 0, fat: 12.4, fiber: 0, fdc_id: 175168 },
  SALMON_FILLET_NORWEGIAN: { kcal: 206, protein: 22.1, carbs: 0, fat: 12.4, fiber: 0, fdc_id: 175168 },
  SALMON_FISH: { kcal: 206, protein: 22.1, carbs: 0, fat: 12.4, fiber: 0, fdc_id: 175168 },
  // MULLET — SR_LEGACY Fish, mullet, striped, cooked, dry heat
  BOURI_FISH: { kcal: 150, protein: 24.8, carbs: 0, fat: 4.9, fiber: 0, fdc_id: 175124 },
  BOURI_FISH_EGYPTIAN: { kcal: 150, protein: 24.8, carbs: 0, fat: 4.9, fiber: 0, fdc_id: 175124 },
  BOURI_FISH_GRILLED: { kcal: 150, protein: 24.8, carbs: 0, fat: 4.9, fiber: 0, fdc_id: 175124 },
  // GROUPER — SR_LEGACY Fish, grouper, mixed species, cooked, dry heat
  HAMOUR_FISH: { kcal: 118, protein: 24.8, carbs: 0, fat: 1.3, fiber: 0, fdc_id: 171963 },
  HAMOUR_FISH_GRILLED: { kcal: 118, protein: 24.8, carbs: 0, fat: 1.3, fiber: 0, fdc_id: 171963 },
  HAMOUR_FISH_GULF: { kcal: 118, protein: 24.8, carbs: 0, fat: 1.3, fiber: 0, fdc_id: 171963 },
  NAJIL_RED_FISH: { kcal: 118, protein: 24.8, carbs: 0, fat: 1.3, fiber: 0, fdc_id: 171963 },
  // KINGFISH — SR_LEGACY Fish, mackerel, king, cooked, dry heat
  KANAAD_KINGFISH: { kcal: 134, protein: 26, carbs: 0, fat: 2.6, fiber: 0, fdc_id: 174236 },
  KANAAD_KINGFISH_GRILLED: { kcal: 134, protein: 26, carbs: 0, fat: 2.6, fiber: 0, fdc_id: 174236 },
  KANAAD_KINGFISH_GULF: { kcal: 134, protein: 26, carbs: 0, fat: 2.6, fiber: 0, fdc_id: 174236 },
  // WHITE_FISH — SR_LEGACY Fish, cod, Atlantic, cooked, dry heat
  WHITE_FISH_FILLET: { kcal: 105, protein: 22.8, carbs: 0, fat: 0.9, fiber: 0, fdc_id: 171956 },
  // SHRIMP — SR_LEGACY Crustaceans, shrimp, cooked
  SHRIMP_GRILLED: { kcal: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: null, fdc_id: 175180 },
  GRILLED_SHRIMP: { kcal: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: null, fdc_id: 175180 },
  // TUNA_CANNED_WATER — SR_LEGACY Fish, tuna, light, canned in water, drained solids (Includes foods for USDA's Food Distribution Program) (curated core catalog)
  CANNED_TUNA: { kcal: 86, protein: 19.4, carbs: 0, fat: 1, fiber: 0, fdc_id: 173709 },
  CANNED_TUNA_IN_WATER: { kcal: 86, protein: 19.4, carbs: 0, fat: 1, fiber: 0, fdc_id: 173709 },
  CANNED_TUNA_WATER: { kcal: 86, protein: 19.4, carbs: 0, fat: 1, fiber: 0, fdc_id: 173709 },
  TUNA_CANNED_IN_WATER: { kcal: 86, protein: 19.4, carbs: 0, fat: 1, fiber: 0, fdc_id: 173709 },
  TUNA_LIGHT_CANNED_WATER_DRAINED: { kcal: 86, protein: 19.4, carbs: 0, fat: 1, fiber: 0, fdc_id: 173709 },
  // EGG_WHOLE_BOILED — SR_LEGACY Egg, whole, cooked, hard-boiled (curated core catalog)
  WHOLE_EGG: { kcal: 155, protein: 12.6, carbs: 1.1, fat: 10.6, fiber: 0, fdc_id: 173424 },
  WHOLE_EGGS: { kcal: 155, protein: 12.6, carbs: 1.1, fat: 10.6, fiber: 0, fdc_id: 173424 },
  WHOLE_EGGS_BOILED: { kcal: 155, protein: 12.6, carbs: 1.1, fat: 10.6, fiber: 0, fdc_id: 173424 },
  EGG_WHOLE_HARD_BOILED: { kcal: 155, protein: 12.6, carbs: 1.1, fat: 10.6, fiber: 0, fdc_id: 173424 },
  // EGG_WHITE — FNDDS Egg, white, cooked, no added fat (curated core catalog)
  EGG_WHITE: { kcal: 52, protein: 10.7, carbs: 2.4, fat: 0, fiber: 0, fdc_id: 2707170 },
  EGG_WHITE_COOKED: { kcal: 52, protein: 10.7, carbs: 2.4, fat: 0, fiber: 0, fdc_id: 2707170 },
  EGG_WHITES_BOILED: { kcal: 52, protein: 10.7, carbs: 2.4, fat: 0, fiber: 0, fdc_id: 2707170 },
  LIQUID_EGG_WHITES: { kcal: 52, protein: 10.7, carbs: 2.4, fat: 0, fiber: 0, fdc_id: 2707170 },
  // EGG_OMELET — SR_LEGACY Egg, whole, cooked, omelet
  EGGS_OMELETTE: { kcal: 154, protein: 10.6, carbs: 0.6, fat: 11.7, fiber: 0, fdc_id: 172185 },
  // COTTAGE_2 — SR_LEGACY Cheese, cottage, lowfat, 2% milkfat (curated core catalog)
  COTTAGE_CHEESE: { kcal: 81, protein: 10.5, carbs: 4.8, fat: 2.3, fiber: 0, fdc_id: 172182 },
  COTTAGE_CHEESE_LOW_FAT_2_PERCENT: { kcal: 81, protein: 10.5, carbs: 4.8, fat: 2.3, fiber: 0, fdc_id: 172182 },
  COTTAGE_CHEESE_NATURAL: { kcal: 81, protein: 10.5, carbs: 4.8, fat: 2.3, fiber: 0, fdc_id: 172182 },
  COTTAGE_CHEESE_QAREESH: { kcal: 81, protein: 10.5, carbs: 4.8, fat: 2.3, fiber: 0, fdc_id: 172182 },
  CHEESE_COTTAGE_LOW_FAT: { kcal: 81, protein: 10.5, carbs: 4.8, fat: 2.3, fiber: 0, fdc_id: 172182 },
  // GREEK_YOGURT_NONFAT — SR_LEGACY Yogurt, Greek, plain, nonfat (Includes foods for USDA's Food Distribution Program) (curated core catalog)
  GREEK_YOGURT: { kcal: 59, protein: 10.2, carbs: 3.6, fat: 0.4, fiber: 0, fdc_id: 170894 },
  GREEK_YOGURT_0_FAT: { kcal: 59, protein: 10.2, carbs: 3.6, fat: 0.4, fiber: 0, fdc_id: 170894 },
  GREEK_YOGURT_0PCT: { kcal: 59, protein: 10.2, carbs: 3.6, fat: 0.4, fiber: 0, fdc_id: 170894 },
  GREEK_YOGURT_NONFAT: { kcal: 59, protein: 10.2, carbs: 3.6, fat: 0.4, fiber: 0, fdc_id: 170894 },
  GREEK_YOGURT_PLAIN_NONFAT: { kcal: 59, protein: 10.2, carbs: 3.6, fat: 0.4, fiber: 0, fdc_id: 170894 },
  YOGURT_GREEK_PLAIN_NONFAT: { kcal: 59, protein: 10.2, carbs: 3.6, fat: 0.4, fiber: 0, fdc_id: 170894 },
  // YOGURT_LOWFAT — SR_LEGACY Yogurt, plain, low fat (curated core catalog)
  YOGURT_PLAIN_LOW_FAT: { kcal: 63, protein: 5.3, carbs: 7, fat: 1.6, fiber: 0, fdc_id: 170886 },
  // MOZZARELLA_PART_SKIM — SR_LEGACY Cheese, mozzarella, part skim milk
  LOW_FAT_MOZZARELLA: { kcal: 254, protein: 24.3, carbs: 2.8, fat: 15.9, fiber: 0, fdc_id: 170847 },
  // SKIM_MILK — SR_LEGACY Milk, nonfat, fluid, with added vitamin A and vitamin D (fat free or skim)
  SKIM_MILK: { kcal: 34, protein: 3.4, carbs: 5, fat: 0.1, fiber: 0, fdc_id: 171269 },
  // LABAN_LOWFAT — SR_LEGACY Milk, buttermilk, fluid, cultured, lowfat
  LABAN_RAYEB_LOWFAT: { kcal: 40, protein: 3.3, carbs: 4.8, fat: 1.1, fiber: 0, fdc_id: 170874 },
  LOWFAT_LABAN_ROB: { kcal: 40, protein: 3.3, carbs: 4.8, fat: 1.1, fiber: 0, fdc_id: 170874 },
  // RICE_WHITE_LONG — SR_LEGACY Rice, white, long-grain, regular, unenriched, cooked without salt (curated core catalog)
  BASMATI_RICE: { kcal: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4, fdc_id: 169757 },
  BASMATI_RICE_COOKED: { kcal: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4, fdc_id: 169757 },
  COOKED_BASMATI_RICE: { kcal: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4, fdc_id: 169757 },
  RICE_WHITE_COOKED: { kcal: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4, fdc_id: 169757 },
  RICE_WHITE_LONG_GRAIN_COOKED: { kcal: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4, fdc_id: 169757 },
  // RICE_WHITE_SHORT — SR_LEGACY Rice, white, short-grain, enriched, cooked
  EGYPTIAN_RICE: { kcal: 130, protein: 2.4, carbs: 28.7, fat: 0.2, fiber: null, fdc_id: 168882 },
  EGYPTIAN_RICE_COOKED: { kcal: 130, protein: 2.4, carbs: 28.7, fat: 0.2, fiber: null, fdc_id: 168882 },
  // RICE_BROWN — SR_LEGACY Rice, brown, long-grain, cooked (Includes foods for USDA's Food Distribution Program)
  BROWN_BASMATI_RICE: { kcal: 123, protein: 2.7, carbs: 25.6, fat: 1, fiber: 1.6, fdc_id: 169704 },
  BROWN_RICE_COOKED: { kcal: 123, protein: 2.7, carbs: 25.6, fat: 1, fiber: 1.6, fdc_id: 169704 },
  // POTATO_BOILED — SR_LEGACY Potatoes, boiled, cooked without skin, flesh, without salt (curated core catalog)
  BOILED_POTATOES: { kcal: 86, protein: 1.7, carbs: 20, fat: 0.1, fiber: 1.8, fdc_id: 170440 },
  COOKED_POTATOES: { kcal: 86, protein: 1.7, carbs: 20, fat: 0.1, fiber: 1.8, fdc_id: 170440 },
  POTATO_BOILED_WITHOUT_SKIN: { kcal: 86, protein: 1.7, carbs: 20, fat: 0.1, fiber: 1.8, fdc_id: 170440 },
  POTATO_BAKED: { kcal: 86, protein: 1.7, carbs: 20, fat: 0.1, fiber: 1.8, fdc_id: 170440 },
  // POTATO_BAKED_SKIN — SR_LEGACY Potatoes, baked, flesh and skin, without salt
  ROASTED_POTATOES: { kcal: 93, protein: 2.5, carbs: 21.2, fat: 0.1, fiber: 2.2, fdc_id: 170093 },
  POTATOES_ROASTED_AIRFRY: { kcal: 93, protein: 2.5, carbs: 21.2, fat: 0.1, fiber: 2.2, fdc_id: 170093 },
  AIRFRYER_POTATO_WEDGES: { kcal: 93, protein: 2.5, carbs: 21.2, fat: 0.1, fiber: 2.2, fdc_id: 170093 },
  // SWEET_POTATO — SR_LEGACY Sweet potato, cooked, baked in skin, flesh, without salt
  SWEET_POTATO: { kcal: 90, protein: 2, carbs: 20.7, fat: 0.2, fiber: 3.3, fdc_id: 168483 },
  SWEET_POTATO_BAKED: { kcal: 90, protein: 2, carbs: 20.7, fat: 0.2, fiber: 3.3, fdc_id: 168483 },
  // PASTA_WHITE — FNDDS Pasta, cooked (curated core catalog)
  COOKED_WHITE_PASTA: { kcal: 157, protein: 5.8, carbs: 30.7, fat: 0.9, fiber: 1.8, fdc_id: 2708357 },
  PASTA_SPAGHETTI_COOKED: { kcal: 157, protein: 5.8, carbs: 30.7, fat: 0.9, fiber: 1.8, fdc_id: 2708357 },
  // PASTA_WHOLE_WHEAT — SR_LEGACY Pasta, whole-wheat, cooked (Includes foods for USDA's Food Distribution Program)
  WHOLE_WHEAT_PASTA: { kcal: 149, protein: 6, carbs: 30.1, fat: 1.7, fiber: 3.9, fdc_id: 168910 },
  WHOLE_WHEAT_PASTA_COOKED: { kcal: 149, protein: 6, carbs: 30.1, fat: 1.7, fiber: 3.9, fdc_id: 168910 },
  PASTA_WHOLE_WHEAT_COOKED: { kcal: 149, protein: 6, carbs: 30.1, fat: 1.7, fiber: 3.9, fdc_id: 168910 },
  // OATS_DRY — FOUNDATION_FOOD Oats, whole grain, rolled, old fashioned (curated core catalog)
  OATS_ROLLED_DRY: { kcal: 379, protein: 13.5, carbs: 68.7, fat: 5.9, fiber: 10.4, fdc_id: 2346396 },
  OATS_ROLLED_RAW: { kcal: 379, protein: 13.5, carbs: 68.7, fat: 5.9, fiber: 10.4, fdc_id: 2346396 },
  RAW_ROLLED_OATS: { kcal: 379, protein: 13.5, carbs: 68.7, fat: 5.9, fiber: 10.4, fdc_id: 2346396 },
  ROLLED_OATS: { kcal: 379, protein: 13.5, carbs: 68.7, fat: 5.9, fiber: 10.4, fdc_id: 2346396 },
  ROLLED_OATS_RAW: { kcal: 379, protein: 13.5, carbs: 68.7, fat: 5.9, fiber: 10.4, fdc_id: 2346396 },
  ROLLED_OATS_WHOLE: { kcal: 379, protein: 13.5, carbs: 68.7, fat: 5.9, fiber: 10.4, fdc_id: 2346396 },
  // BULGUR — SR_LEGACY Bulgur, cooked
  COOKED_BULGUR: { kcal: 83, protein: 3.1, carbs: 18.6, fat: 0.2, fiber: 4.5, fdc_id: 170287 },
  // QUINOA — SR_LEGACY Quinoa, cooked
  COOKED_QUINOA: { kcal: 120, protein: 4.4, carbs: 21.3, fat: 1.9, fiber: 2.8, fdc_id: 168917 },
  COOKED_QUINOA_GRAIN: { kcal: 120, protein: 4.4, carbs: 21.3, fat: 1.9, fiber: 2.8, fdc_id: 168917 },
  // BREAD_WHOLE_WHEAT — SR_LEGACY Bread, whole-wheat, commercially prepared (curated core catalog)
  BREAD_WHOLE_WHEAT: { kcal: 252, protein: 12.5, carbs: 42.7, fat: 3.5, fiber: 6, fdc_id: 172688 },
  WHOLE_WHEAT_TOAST: { kcal: 252, protein: 12.5, carbs: 42.7, fat: 3.5, fiber: 6, fdc_id: 172688 },
  WHOLE_WHEAT_TOAST_BROWN: { kcal: 252, protein: 12.5, carbs: 42.7, fat: 3.5, fiber: 6, fdc_id: 172688 },
  BROWN_TOAST: { kcal: 252, protein: 12.5, carbs: 42.7, fat: 3.5, fiber: 6, fdc_id: 172688 },
  // PITA_WHOLE_WHEAT — SR_LEGACY Bread, pita, whole-wheat
  SAJ_BREAD_WHOLEWHEAT: { kcal: 262, protein: 9.8, carbs: 55.9, fat: 1.7, fiber: 6.1, fdc_id: 174916 },
  SAJ_REGAG_BREAD_BROWN: { kcal: 262, protein: 9.8, carbs: 55.9, fat: 1.7, fiber: 6.1, fdc_id: 174916 },
  TAMEES_BREAD_BR: { kcal: 262, protein: 9.8, carbs: 55.9, fat: 1.7, fiber: 6.1, fdc_id: 174916 },
  TAMEES_BREAD_WHOLEWHEAT: { kcal: 262, protein: 9.8, carbs: 55.9, fat: 1.7, fiber: 6.1, fdc_id: 174916 },
  // TORTILLA_WW — SR_LEGACY Tortillas, ready-to-bake or -fry, whole wheat
  WHOLE_WHEAT_TORTILLA: { kcal: 310, protein: 9.8, carbs: 45.9, fat: 9.8, fiber: 9.8, fdc_id: 174081 },
  // RICE_CAKES — SR_LEGACY Snacks, rice cakes, brown rice, plain, unsalted
  RICE_CAKES: { kcal: 387, protein: 8.2, carbs: 81.5, fat: 2.8, fiber: 4.2, fdc_id: 170250 },
  RICE_CAKES_CRISPY: { kcal: 387, protein: 8.2, carbs: 81.5, fat: 2.8, fiber: 4.2, fdc_id: 170250 },
  // CORN_FLAKES — SR_LEGACY Cereals ready-to-eat, RALSTON Corn Flakes
  SUGAR_FREE_CORNFLAKES: { kcal: 384, protein: 5.9, carbs: 88, fat: 0.9, fiber: 2.7, fdc_id: 174648 },
  // POPCORN_AIR — SR_LEGACY Snacks, popcorn, air-popped
  AIR_POPPED_POPCORN: { kcal: 387, protein: 12.9, carbs: 77.8, fat: 4.5, fiber: 14.5, fdc_id: 167959 },
  // CHICKPEAS — SR_LEGACY Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt (curated core catalog)
  CHICKPEAS_MATURE_COOKED: { kcal: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, fdc_id: 173757 },
  COOKED_CHICKPEAS: { kcal: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, fdc_id: 173757 },
  COOKED_CHICKPEAS_HOMMOS: { kcal: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, fdc_id: 173757 },
  // LENTILS — SR_LEGACY Lentils, mature seeds, cooked, boiled, without salt (curated core catalog)
  COOKED_LENTILS: { kcal: 116, protein: 9, carbs: 20.1, fat: 0.4, fiber: 7.9, fdc_id: 172421 },
  COOKED_LENTILS_BROWN: { kcal: 116, protein: 9, carbs: 20.1, fat: 0.4, fiber: 7.9, fdc_id: 172421 },
  LENTILS_MATURE_COOKED: { kcal: 116, protein: 9, carbs: 20.1, fat: 0.4, fiber: 7.9, fdc_id: 172421 },
  // FAVA — SR_LEGACY Broadbeans (fava beans), mature seeds, cooked, boiled, without salt (curated core catalog)
  FAVA_BEANS: { kcal: 110, protein: 7.6, carbs: 19.7, fat: 0.4, fiber: 5.4, fdc_id: 173753 },
  FAVA_BEANS_MATURE_COOKED: { kcal: 110, protein: 7.6, carbs: 19.7, fat: 0.4, fiber: 5.4, fdc_id: 173753 },
  // NAVY_BEANS — SR_LEGACY Beans, navy, mature seeds, cooked, boiled, without salt
  COOKED_WHITE_BEANS: { kcal: 140, protein: 8.2, carbs: 26.1, fat: 0.6, fiber: 10.5, fdc_id: 173746 },
  // LUPINI — SR_LEGACY Lupins, mature seeds, cooked, boiled, without salt
  LUPINI_BEANS: { kcal: 119, protein: 15.6, carbs: 9.9, fat: 2.9, fiber: 2.8, fdc_id: 172424 },
  LUPINI_BEANS_TERMIS: { kcal: 119, protein: 15.6, carbs: 9.9, fat: 2.9, fiber: 2.8, fdc_id: 172424 },
  TERMIS_LUPINI: { kcal: 119, protein: 15.6, carbs: 9.9, fat: 2.9, fiber: 2.8, fdc_id: 172424 },
  // OLIVE_OIL — SR_LEGACY Oil, olive, salad or cooking (curated core catalog)
  EXTRA_VIRGIN_OLIVE_OIL: { kcal: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, fdc_id: 171413 },
  OLIVE_OIL: { kcal: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, fdc_id: 171413 },
  // SUNFLOWER_OIL — SR_LEGACY Oil, sunflower, linoleic, (approx. 65%) (curated core catalog)
  SUNFLOWER_OIL: { kcal: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, fdc_id: 171025 },
  // COCONUT_OIL — SR_LEGACY Oil, coconut
  VIRGIN_COCONUT_OIL: { kcal: 892, protein: 0, carbs: 0, fat: 99.1, fiber: 0, fdc_id: 171412 },
  // BUTTER — SR_LEGACY Butter oil, anhydrous
  NATURAL_BUTTER_GHEE: { kcal: 876, protein: 0.3, carbs: 0, fat: 99.5, fiber: 0, fdc_id: 173412 },
  // GHEE — SR_LEGACY Butter oil, anhydrous
  PURE_GHEE_BUTTER: { kcal: 876, protein: 0.3, carbs: 0, fat: 99.5, fiber: 0, fdc_id: 173412 },
  // ALMONDS — SR_LEGACY Nuts, almonds
  ALMONDS_RAW: { kcal: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fiber: 12.5, fdc_id: 170567 },
  RAW_ALMONDS: { kcal: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fiber: 12.5, fdc_id: 170567 },
  RAW_ALMONDS_UNSALTED: { kcal: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fiber: 12.5, fdc_id: 170567 },
  // CASHEWS — SR_LEGACY Nuts, cashew nuts, raw
  RAW_CASHEWS: { kcal: 553, protein: 18.2, carbs: 30.2, fat: 43.9, fiber: 3.3, fdc_id: 170162 },
  // WALNUTS — SR_LEGACY Nuts, walnuts, english
  RAW_WALNUTS: { kcal: 654, protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7, fdc_id: 170187 },
  RAW_WALNUTS_OMEGA3: { kcal: 654, protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7, fdc_id: 170187 },
  // PEANUT_BUTTER — SR_LEGACY Peanut butter, smooth style, without salt
  NATURAL_PEANUT_BUTTER: { kcal: 598, protein: 22.2, carbs: 22.3, fat: 51.4, fiber: 5, fdc_id: 172470 },
  PEANUT_BUTTER: { kcal: 598, protein: 22.2, carbs: 22.3, fat: 51.4, fiber: 5, fdc_id: 172470 },
  // CHIA — SR_LEGACY Seeds, chia seeds, dried
  CHIA_SEEDS: { kcal: 486, protein: 16.5, carbs: 42.1, fat: 30.7, fiber: 34.4, fdc_id: 170554 },
  CHIA_HEMP_SEEDS_GROUND: { kcal: 486, protein: 16.5, carbs: 42.1, fat: 30.7, fiber: 34.4, fdc_id: 170554 },
  HEMP_CHIA_SEEDS: { kcal: 486, protein: 16.5, carbs: 42.1, fat: 30.7, fiber: 34.4, fdc_id: 170554 },
  // TAHINI — SR_LEGACY Seeds, sesame butter, tahini, from roasted and toasted kernels (most common type)
  PURE_TAHINI_SESAME: { kcal: 595, protein: 17, carbs: 21.2, fat: 53.8, fiber: 9.3, fdc_id: 170189 },
  RAW_TAHINI: { kcal: 595, protein: 17, carbs: 21.2, fat: 53.8, fiber: 9.3, fdc_id: 170189 },
  RAW_TAHINI_SESAME: { kcal: 595, protein: 17, carbs: 21.2, fat: 53.8, fiber: 9.3, fdc_id: 170189 },
  // OLIVES — SR_LEGACY Olives, ripe, canned (small-extra large)
  NATURAL_OLIVES: { kcal: 116, protein: 0.8, carbs: 6, fat: 10.9, fiber: 1.6, fdc_id: 169094 },
  // AVOCADO — SR_LEGACY Avocados, raw, all commercial varieties
  FRESH_AVOCADO: { kcal: 160, protein: 2, carbs: 8.5, fat: 14.7, fiber: 6.7, fdc_id: 171705 },
  // DARK_CHOCOLATE_70_85 — SR_LEGACY Chocolate, dark, 70-85% cacao solids
  DARK_CHOCOLATE_85: { kcal: 598, protein: 7.8, carbs: 45.9, fat: 42.6, fiber: 10.9, fdc_id: 170273 },
  DARK_CHOCOLATE_85_PERCENT: { kcal: 598, protein: 7.8, carbs: 45.9, fat: 42.6, fiber: 10.9, fdc_id: 170273 },
  // HONEY — SR_LEGACY Honey
  PURE_BEE_HONEY: { kcal: 304, protein: 0.3, carbs: 82.4, fat: 0, fiber: 0.2, fdc_id: 169640 },
  // SUGAR — SR_LEGACY Sugars, granulated
  TABLE_SUGAR: { kcal: 387, protein: 0, carbs: 100, fat: 0, fiber: 0, fdc_id: 169655 },
  // DATES — SR_LEGACY Dates, deglet noor
  DATES_KHALAS: { kcal: 282, protein: 2.5, carbs: 75, fat: 0.4, fiber: 8, fdc_id: 171726 },
  SAUDI_DATES_PREMIUM: { kcal: 282, protein: 2.5, carbs: 75, fat: 0.4, fiber: 8, fdc_id: 171726 },
  // APPLE — SR_LEGACY Apples, raw, with skin (Includes foods for USDA's Food Distribution Program) (curated core catalog)
  APPLE: { kcal: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, fdc_id: 171688 },
  APPLE_FRESH: { kcal: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, fdc_id: 171688 },
  APPLE_RAW_WITH_SKIN: { kcal: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, fdc_id: 171688 },
  FRESH_APPLES_SKIN: { kcal: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, fdc_id: 171688 },
  // BANANA — FOUNDATION_FOOD Bananas, ripe and slightly ripe, raw (curated core catalog)
  BANANA: { kcal: 88, protein: 0.7, carbs: 23, fat: 0.3, fiber: 1.7, fdc_id: 1105314 },
  BANANA_FRESH: { kcal: 88, protein: 0.7, carbs: 23, fat: 0.3, fiber: 1.7, fdc_id: 1105314 },
  BANANA_RAW: { kcal: 88, protein: 0.7, carbs: 23, fat: 0.3, fiber: 1.7, fdc_id: 1105314 },
  FRESH_BANANAS: { kcal: 88, protein: 0.7, carbs: 23, fat: 0.3, fiber: 1.7, fdc_id: 1105314 },
  // ORANGE — SR_LEGACY Oranges, raw, all commercial varieties (curated core catalog)
  ORANGE: { kcal: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4, fdc_id: 169097 },
  ORANGE_FRESH: { kcal: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4, fdc_id: 169097 },
  ORANGE_RAW: { kcal: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4, fdc_id: 169097 },
  FRESH_ORANGES_VIT_C: { kcal: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4, fdc_id: 169097 },
  // STRAWBERRIES — SR_LEGACY Strawberries, raw
  STRAWBERRIES: { kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2, fdc_id: 167762 },
  STRAWBERRY_FRESH: { kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2, fdc_id: 167762 },
  FRESH_STRAWBERRIES_BERRIES: { kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2, fdc_id: 167762 },
  // BLUEBERRIES — SR_LEGACY Blueberries, raw
  FRESH_BLUEBERRIES: { kcal: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4, fdc_id: 171711 },
  // GRAPES — SR_LEGACY Grapes, red or green (European type, such as Thompson seedless), raw
  FRESH_GRAPES: { kcal: 69, protein: 0.7, carbs: 18.1, fat: 0.2, fiber: 0.9, fdc_id: 174683 },
  FRESH_GRAPES_SWEET: { kcal: 69, protein: 0.7, carbs: 18.1, fat: 0.2, fiber: 0.9, fdc_id: 174683 },
  // WATERMELON — SR_LEGACY Watermelon, raw
  FRESH_WATERMELON: { kcal: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4, fdc_id: 167765 },
  FRESH_WATERMELON_SUMMER: { kcal: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4, fdc_id: 167765 },
  WATERMELON_FRESH: { kcal: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4, fdc_id: 167765 },
  // CANTALOUPE — SR_LEGACY Melons, cantaloupe, raw
  FRESH_CANTALOUPE: { kcal: 34, protein: 0.8, carbs: 8.2, fat: 0.2, fiber: 0.9, fdc_id: 169092 },
  FRESH_CANTALOUPE_MELON: { kcal: 34, protein: 0.8, carbs: 8.2, fat: 0.2, fiber: 0.9, fdc_id: 169092 },
  // KIWI — SR_LEGACY Kiwifruit, green, raw
  FRESH_KIWI: { kcal: 61, protein: 1.1, carbs: 14.7, fat: 0.5, fiber: 3, fdc_id: 168153 },
  FRESH_KIWI_ACTINIDIN: { kcal: 61, protein: 1.1, carbs: 14.7, fat: 0.5, fiber: 3, fdc_id: 168153 },
  // GUAVA — SR_LEGACY Guavas, common, raw
  FRESH_GUAVA: { kcal: 68, protein: 2.6, carbs: 14.3, fat: 1, fiber: 5.4, fdc_id: 173044 },
  // POMEGRANATE — SR_LEGACY Pomegranates, raw
  FRESH_POMEGRANATE: { kcal: 83, protein: 1.7, carbs: 18.7, fat: 1.2, fiber: 4, fdc_id: 169134 },
  FRESH_POMEGRANATE_ARILS: { kcal: 83, protein: 1.7, carbs: 18.7, fat: 1.2, fiber: 4, fdc_id: 169134 },
  // PINEAPPLE — SR_LEGACY Pineapple, raw, all varieties
  FRESH_PINEAPPLE_BROMELAIN: { kcal: 50, protein: 0.5, carbs: 13.1, fat: 0.1, fiber: 1.4, fdc_id: 169124 },
  // BROCCOLI — SR_LEGACY Broccoli, cooked, boiled, drained, without salt
  BROCCOLI_STEAMED: { kcal: 35, protein: 2.4, carbs: 7.2, fat: 0.4, fiber: 3.3, fdc_id: 169967 },
  STEAMED_BROCCOLI: { kcal: 35, protein: 2.4, carbs: 7.2, fat: 0.4, fiber: 3.3, fdc_id: 169967 },
  // CAULIFLOWER — SR_LEGACY Cauliflower, cooked, boiled, drained, without salt
  STEAMED_CAULIFLOWER: { kcal: 23, protein: 1.8, carbs: 4.1, fat: 0.5, fiber: 2.3, fdc_id: 170397 },
  // SPINACH — SR_LEGACY Spinach, cooked, boiled, drained, without salt
  FRESH_SPINACH: { kcal: 23, protein: 3, carbs: 3.8, fat: 0.3, fiber: 2.4, fdc_id: 168463 },
  SPINACH_STEAMED_LEAF: { kcal: 23, protein: 3, carbs: 3.8, fat: 0.3, fiber: 2.4, fdc_id: 168463 },
  // GREEN_BEANS — SR_LEGACY Beans, snap, green, cooked, boiled, drained, without salt
  GREEN_BEANS: { kcal: 35, protein: 1.9, carbs: 7.9, fat: 0.3, fiber: 3.2, fdc_id: 169141 },
  GREEN_BEANS_STEAMED: { kcal: 35, protein: 1.9, carbs: 7.9, fat: 0.3, fiber: 3.2, fdc_id: 169141 },
  // ZUCCHINI — SR_LEGACY Squash, summer, zucchini, includes skin, cooked, boiled, drained, without salt
  SAUTEED_ZUCCHINI: { kcal: 15, protein: 1.1, carbs: 2.7, fat: 0.4, fiber: 1, fdc_id: 169292 },
  ZUCCHINI_SAUTEED: { kcal: 15, protein: 1.1, carbs: 2.7, fat: 0.4, fiber: 1, fdc_id: 169292 },
  // EGGPLANT — SR_LEGACY Eggplant, cooked, boiled, drained, without salt
  GRILLED_EGGPLANT: { kcal: 35, protein: 0.8, carbs: 8.7, fat: 0.2, fiber: 2.5, fdc_id: 169229 },
  GRILLED_EGGPLANT_BABA_GHANOUJ: { kcal: 35, protein: 0.8, carbs: 8.7, fat: 0.2, fiber: 2.5, fdc_id: 169229 },
  // MUSHROOMS — SR_LEGACY Mushrooms, white, stir-fried
  FRESH_MUSHROOMS: { kcal: 26, protein: 3.6, carbs: 4, fat: 0.3, fiber: 1.8, fdc_id: 169253 },
  FRESH_MUSHROOMS_SAUTEED: { kcal: 26, protein: 3.6, carbs: 4, fat: 0.3, fiber: 1.8, fdc_id: 169253 },
  // BEETS — SR_LEGACY Beets, cooked, boiled, drained
  BOILED_BEETROOT: { kcal: 44, protein: 1.7, carbs: 10, fat: 0.2, fiber: 2, fdc_id: 169146 },
  // CARROTS — FOUNDATION_FOOD Carrots, mature, raw (curated core catalog)
  CARROT_RAW: { kcal: 45, protein: 0.9, carbs: 10.3, fat: 0.4, fiber: 3.1, fdc_id: 2258586 },
  FRESH_CARROTS_RAW: { kcal: 45, protein: 0.9, carbs: 10.3, fat: 0.4, fiber: 3.1, fdc_id: 2258586 },
  // CUCUMBER — SR_LEGACY Cucumber, with peel, raw (curated core catalog)
  CUCUMBER_WITH_PEEL_RAW: { kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, fdc_id: 168409 },
  CUCUMBERS_FRESH: { kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, fdc_id: 168409 },
  FRESH_CUCUMBER: { kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, fdc_id: 168409 },
  // TOMATO — SR_LEGACY Tomatoes, red, ripe, raw, year round average (curated core catalog)
  FRESH_TOMATOES: { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, fdc_id: 170457 },
  TOMATO_RED_RAW: { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, fdc_id: 170457 },
  // BELL_PEPPER — SR_LEGACY Peppers, sweet, red, raw
  BELL_PEPPERS: { kcal: 26, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1, fdc_id: 170108 },
  // LETTUCE — SR_LEGACY Lettuce, iceberg (includes crisphead types), raw
  ICEBERG_LETTUCE: { kcal: 14, protein: 0.9, carbs: 3, fat: 0.1, fiber: 1.2, fdc_id: 169248 },
  // ARUGULA — SR_LEGACY Arugula, raw
  FRESH_ARUGULA: { kcal: 25, protein: 2.6, carbs: 3.7, fat: 0.7, fiber: 1.6, fdc_id: 169387 },
});
