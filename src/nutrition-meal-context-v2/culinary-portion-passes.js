import { FOOD_SWAP_DATABASE, isFoodClinicallySafe, PROTEIN_PORTION_CAPS_G } from "./build-culinary-meals.js";

// H8 rejected-plans sweep: portion passes that run on the FINAL plate —
// after the recipe build, the carb split, the trims and the protein
// fallback, and before the culinary preflight audits it. Each pass is pure
// (it returns new meal objects) and only touches what it names, so a pass
// that finds nothing changes nothing.

// One whole egg is about 55 g in the recipe book (the breakfast recipe
// portions eggs as count x 55 g); the swap book uses the same 55 g.
const GRAMS_PER_WHOLE_EGG = 55;
const EGGS_OMELETTE = "EGGS_OMELETTE";
const SHAKSHOUKA_EGGS = "SHAKSHOUKA_EGGS";
// Both whole-egg codes (the codebase's own EGG_CODES set in
// derive-plate-flags.js) draw from the same cholesterol budget.
const WHOLE_EGG_CODES = new Set([EGGS_OMELETTE, SHAKSHOUKA_EGGS]);
const OLIVE_OIL = "OLIVE_OIL";
const CHICKEN_BREAST = "CHICKEN_BREAST";
const SWEET_POTATO = "SWEET_POTATO";

// The smallest real serving of a food that is served by the piece or the
// slice. Anything below it is a token, not a portion.
const MIN_REAL_PORTION_G = Object.freeze({
  [CHICKEN_BREAST]: 50,
  [SWEET_POTATO]: 50,
});

// Starch caps for the day reconciliation, from the same numbers the carb
// splitter already uses (rice 250 g, baladi 180 g, oats 80 g, potato 250 g).
const STARCH_CAPS_G = Object.freeze({
  BASMATI_RICE: 250,
  RICE_WHITE_LONG_GRAIN_COOKED: 250,
  EGYPTIAN_RICE: 250,
  BALADI_BREAD: 180,
  BREAD_WHOLE_WHEAT: 180,
  OATS_ROLLED_DRY: 80,
  POTATO_BOILED_WITHOUT_SKIN: 250,
  ROASTED_POTATOES: 250,
  WHOLE_WHEAT_PASTA: 250,
  PASTA_SPAGHETTI_COOKED: 250,
});
const STARCH_CODES = new Set(Object.keys(STARCH_CAPS_G));

function mealCalories(meal) {
  return (meal.items || []).reduce((sum, item) => sum + (Number(item.calories_kcal) || 0), 0);
}

function scaleSwapForRescale(swap, factor) {
  // Same convention as the carb splitter's scaleSwap: a swap's equivalent
  // grams and macros belong to the portion it replaces, so they scale with
  // it — including the oil the swap says to leave out or add. Without this,
  // a capped item keeps swaps sized for its old portion and the swap
  // equivalence check fails (a 120 g tuna offering a 158 g chicken).
  const round1 = (v) => Math.round((Number(v) || 0) * factor * 10) / 10;
  return {
    ...swap,
    equivalent_grams: Math.round((Number(swap.equivalent_grams) || 0) * factor),
    protein_g: round1(swap.protein_g),
    carb_g: round1(swap.carb_g),
    fat_g: round1(swap.fat_g),
    calories_kcal: Math.round((Number(swap.calories_kcal) || 0) * factor),
    ...(Number.isFinite(Number(swap.oil_deduction_g)) ? { oil_deduction_g: round1(swap.oil_deduction_g) } : {}),
    ...(Number.isFinite(Number(swap.oil_addition_g)) ? { oil_addition_g: round1(swap.oil_addition_g) } : {}),
  };
}

function withRescaledItem(item, portionG) {
  const scale = portionG / Math.max(1, Number(item.portion_g) || 1);
  return {
    ...item,
    portion_g: Math.round(portionG),
    protein_g: Math.round((Number(item.protein_g) || 0) * scale * 10) / 10,
    carb_g: Math.round((Number(item.carb_g) || 0) * scale * 10) / 10,
    fat_g: Math.round((Number(item.fat_g) || 0) * scale * 10) / 10,
    calories_kcal: Math.round((Number(item.calories_kcal) || 0) * scale),
    household_measurement: `${Math.round(portionG)} جم`,
    ...(Array.isArray(item.swaps) && item.swaps.length
      ? { swaps: item.swaps.map((swap) => scaleSwapForRescale(swap, scale)) }
      : {}),
  };
}

/**
 * A protein item over its cap is split, not cut: the excess protein moves
 * to a second item from the meal's own vetted swaps (protein-matched), so
 * the meal keeps its protein target. A 236 g tuna becomes 120 g tuna plus
 * a partner; a 192 g cottage cheese becomes 150 g plus a partner. When no
 * swap partner fits (or the partner would itself break its cap), the item
 * is cut to its cap and the meal carries a portion_warning_ar — the coach
 * sees it instead of a silent shortfall.
 */
export function splitOversizedProteinPortions(meals = []) {
  return meals.map((meal) => {
    const items = [...(meal.items || [])];
    const mealCodes = new Set(items.map((i) => i.food_code));
    let changed = false;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const cap = PROTEIN_PORTION_CAPS_G[item.food_code];
      if (!cap || Number(item.portion_g) <= cap) continue;
      const proteinPerGram = (Number(item.protein_g) || 0) / Math.max(1, Number(item.portion_g) || 1);
      const excessProteinG = (Number(item.portion_g) - cap) * proteinPerGram;
      const swaps = Array.isArray(item.swaps) ? item.swaps : [];
      let partner = null;
      for (const swap of swaps) {
        if (!swap || mealCodes.has(swap.food_code)) continue;
        const swapProteinPerGram = (Number(swap.protein_g) || 0) / Math.max(1, Number(swap.equivalent_grams) || 1);
        if (swapProteinPerGram <= 0) continue;
        const partnerPortionG = Math.round(excessProteinG / swapProteinPerGram);
        if (partnerPortionG < 20) continue;
        const partnerCap = PROTEIN_PORTION_CAPS_G[swap.food_code];
        if (partnerCap && partnerPortionG > partnerCap) continue;
        partner = { swap, partnerPortionG };
        break;
      }
      if (partner) {
        const { swap, partnerPortionG } = partner;
        const scale = partnerPortionG / Math.max(1, Number(swap.equivalent_grams) || 1);
        items[i] = withRescaledItem(item, cap);
        items.push({
          food_code: swap.food_code,
          name_ar: swap.name_ar,
          name_en: swap.name_en,
          category: item.category,
          portion_g: partnerPortionG,
          household_measurement: `${partnerPortionG} جم`,
          protein_g: Math.round((Number(swap.protein_g) || 0) * scale * 10) / 10,
          carb_g: Math.round((Number(swap.carb_g) || 0) * scale * 10) / 10,
          fat_g: Math.round((Number(swap.fat_g) || 0) * scale * 10) / 10,
          calories_kcal: Math.round((Number(swap.calories_kcal) || 0) * scale),
          swaps: [],
          split_note_ar: "جزء من حصة البروتين في الوجبة، مقسوم على صنفين علشان الكمية تبقى معقولة في الطبق.",
        });
        mealCodes.add(swap.food_code);
      } else {
        items[i] = {
          ...withRescaledItem(item, cap),
          portion_warning_ar: `الحصة اتقصت لحد ${cap} جم (الحد المعقول للصنف في الوجبة)؛ البروتين الناقص محتاج بديل من المدرب.`,
        };
      }
      changed = true;
    }
    return changed ? { ...meal, items } : meal;
  });
}

/**
 * High cholesterol: whole eggs across the whole day are capped at two
 * (100 g). Both whole-egg codes count — omelette and shakshouka (the
 * codebase's EGG_CODES set) — because a shakshouka is eggs too, and counting
 * only the omelette let a day carry 100 g of omelette plus 62 g of
 * shakshouka past the cap. The cap is spent from the first meal onward —
 * breakfast keeps its eggs; a later whole-egg item that no longer fits is
 * replaced by its first vetted protein swap (protein-matched), because
 * dropping a meal's protein anchor would leave the plate without protein.
 * A remainder under one egg (50 g) is not a serving either, so it is
 * replaced the same way. When no swap partner exists the item is dropped
 * and the preflight flags the shortfall — the coach sees it instead of a
 * silent gap.
 */
export function capWholeEggsForCholesterol(meals = [], hasHighCholesterol = false, maxGramsPerDay = 100) {
  if (!hasHighCholesterol) return meals;
  let remaining = maxGramsPerDay;
  return meals.map((meal) => {
    const mealCodes = new Set((meal.items || []).map((i) => i.food_code));
    let changed = false;
    const items = [];
    for (const item of meal.items || []) {
      if (!WHOLE_EGG_CODES.has(item.food_code)) {
        items.push(item);
        continue;
      }
      const grams = Number(item.portion_g) || 0;
      if (grams <= remaining && remaining >= 50) {
        remaining -= grams;
        items.push(item);
        continue;
      }
      if (remaining >= 50) {
        const kept = remaining;
        remaining = 0;
        changed = true;
        items.push(withRescaledItem(item, kept));
        continue;
      }
      // No whole-egg budget left (or less than one egg): replace the
      // whole-egg item with its first vetted protein swap, protein-matched.
      const proteinG = Number(item.protein_g) || 0;
      const swaps = Array.isArray(item.swaps) ? item.swaps : [];
      let replaced = false;
      for (const swap of swaps) {
        if (!swap || mealCodes.has(swap.food_code)) continue;
        const swapProteinPerGram = (Number(swap.protein_g) || 0) / Math.max(1, Number(swap.equivalent_grams) || 1);
        if (swapProteinPerGram <= 0) continue;
        const partnerPortionG = Math.round(proteinG / swapProteinPerGram);
        if (partnerPortionG < 20) continue;
        const partnerCap = PROTEIN_PORTION_CAPS_G[swap.food_code];
        if (partnerCap && partnerPortionG > partnerCap) continue;
        const scale = partnerPortionG / Math.max(1, Number(swap.equivalent_grams) || 1);
        items.push({
          food_code: swap.food_code,
          name_ar: swap.name_ar,
          name_en: swap.name_en,
          category: item.category,
          portion_g: partnerPortionG,
          household_measurement: `${partnerPortionG} جم`,
          protein_g: Math.round((Number(swap.protein_g) || 0) * scale * 10) / 10,
          carb_g: Math.round((Number(swap.carb_g) || 0) * scale * 10) / 10,
          fat_g: Math.round((Number(swap.fat_g) || 0) * scale * 10) / 10,
          calories_kcal: Math.round((Number(swap.calories_kcal) || 0) * scale),
          swaps: [],
          split_note_ar: "البيض الكامل اتبدل ببروتين تاني علشان الكوليسترول — بيضتين في اليوم كله كحد أقصى.",
        });
        mealCodes.add(swap.food_code);
        replaced = true;
        changed = true;
        break;
      }
      if (!replaced) {
        // No partner: the omelette goes, and the preflight flags the
        // shortfall for the coach.
        changed = true;
      }
    }
    return changed ? { ...meal, items } : meal;
  });
}

/**
 * The trim scales portions without renaming them, so a 110 g omelette
 * named "2 Whole Eggs" can come back at 77 g still carrying the old name.
 * The name is derived from the actual grams (55 g per egg, halves allowed)
 * so the plate always tells the truth.
 */
export function renameOmelettesToActualEggs(meals = []) {
  return meals.map((meal) => {
    let changed = false;
    const items = (meal.items || []).map((item) => {
      if (item.food_code !== EGGS_OMELETTE) return item;
      const eggs = Math.round((Number(item.portion_g) / GRAMS_PER_WHOLE_EGG) * 2) / 2;
      const label = eggs === 1 ? "بيضة واحدة" : Number.isInteger(eggs) ? `${eggs} بيضات كاملة` : `${eggs} بيضة`;
      const nameAr = `بيض كامل مسلوق أو أومليت بالخضار (${label})`;
      const nameEn = `${eggs} Whole Egg${eggs === 1 ? "" : "s"} (Boiled / Omelette)`;
      if (item.name_ar === nameAr && item.name_en === nameEn) return item;
      changed = true;
      return {
        ...item,
        name_ar: nameAr,
        name_en: nameEn,
        household_measurement: `${label} (${item.portion_g} جم)`,
      };
    });
    return changed ? { ...meal, items } : meal;
  });
}

/**
 * Token portions are not servings: a 1-2 g smear of olive oil left by the
 * swap-partner oil cut, a 10 g sliver of sweet potato, a sliver of chicken
 * the recipe scaler left behind. They are dropped; the day reconciliation
 * below absorbs the few calories they carried. (The breakfast recipe no
 * longer adds a chicken sliver in the first place — this is the safety net
 * for anything a split or a trim still leaves behind.)
 */
export function dropTokenPortions(meals = []) {
  return meals.map((meal) => {
    const items = (meal.items || []).filter((item) => {
      if (item.food_code === OLIVE_OIL && Number(item.portion_g) < 5) return false;
      const min = MIN_REAL_PORTION_G[item.food_code];
      if (min && Number(item.portion_g) < min) return false;
      return true;
    });
    return items.length === (meal.items || []).length ? meal : { ...meal, items };
  });
}

/**
 * A vegetarian day with no legume at all gets one. The food-selection
 * stage already picks legume patterns for a client with no animal protein,
 * but the served plate is recipe-built and never saw them — eight weeks of
 * protein from eggs and dairy alone. One egg/dairy protein at the main
 * meal becomes the mixed legumes stew, protein-matched, and the meal's
 * starch gives back the stew's extra carbs so the plate stays on target.
 * Gout (or any clinical rule) keeps the stew off the plate instead.
 */
const ANIMAL_PROTEIN_CODES = new Set([
  "CHICKEN_BREAST", "CHICKEN_THIGH_COOKED", "CHICKEN_BREAST_ROASTED_SKINLESS",
  "CANNED_TUNA", "TUNA_LIGHT_CANNED_WATER_DRAINED", "LEAN_BEEF", "BEEF_GROUND_90_LEAN_COOKED",
  "CAMEL_MEAT_LEAN", "TILAPIA_FISH", "TILAPIA_COOKED", "SALMON_FISH", "SALMON_ATLANTIC_COOKED",
  "HAMOUR_FISH", "KANAAD_KINGFISH", "KING_MACKEREL_COOKED", "BOURI_FISH", "SMOKED_TURKEY",
]);
const LEGUME_CODE_PARTS = ["LENTIL", "CHICKPEA", "BEAN", "FAVA", "FOUL", "LUPINI", "MIXED_LEGUMES"];
const REPLACEABLE_EGG_DAIRY = new Set([
  "EGGS_OMELETTE", "EGG_WHOLE_HARD_BOILED", "EGG_WHITE_COOKED", "COTTAGE_CHEESE", "GREEK_YOGURT",
  "GREEK_YOGURT_PLAIN_NONFAT", "LABNEH_LIGHT", "HALLOUMI_LIGHT",
]);
export function ensureLegumeForNoAnimalProtein(meals = [], allergenContext = {}) {
  const allItems = meals.flatMap((meal) => meal.items || []);
  if (allItems.some((item) => ANIMAL_PROTEIN_CODES.has(item.food_code))) return meals;
  if (allItems.some((item) => LEGUME_CODE_PARTS.some((part) => String(item.food_code).includes(part)))) return meals;
  const stew = FOOD_SWAP_DATABASE?.MIXED_LEGUMES_STEW;
  if (!stew || !(stew.protein_per_100g > 0)) return meals;
  if (!isFoodClinicallySafe("MIXED_LEGUMES_STEW", allergenContext)) return meals;
  // Lunch first, then dinner, then breakfast: the main meal carries the stew.
  const mealOrder = [2, 4, 1, 3];
  for (const mealNumber of mealOrder) {
    const mealIndex = meals.findIndex((meal) => meal.meal_number === mealNumber);
    if (mealIndex < 0) continue;
    const meal = meals[mealIndex];
    let targetIndex = -1;
    let targetProtein = 0;
    (meal.items || []).forEach((item, index) => {
      if (item.category === "PROTEIN" && REPLACEABLE_EGG_DAIRY.has(item.food_code) && (Number(item.protein_g) || 0) > targetProtein) {
        targetIndex = index;
        targetProtein = Number(item.protein_g) || 0;
      }
    });
    if (targetIndex < 0) continue;
    const stewGrams = Math.min(300, Math.round(targetProtein / (stew.protein_per_100g / 100)));
    if (stewGrams < 100) continue;
    const replaced = meal.items[targetIndex];
    const stewItem = {
      food_code: "MIXED_LEGUMES_STEW",
      name_ar: stew.name_ar,
      name_en: stew.name_en,
      category: "PROTEIN",
      portion_g: stewGrams,
      household_measurement: `${stewGrams} جم (${stew.unit_label || "طبق بقوليات"})`,
      protein_g: Math.round((stewGrams / 100) * stew.protein_per_100g * 10) / 10,
      carb_g: Math.round((stewGrams / 100) * (stew.carb_per_100g || 0) * 10) / 10,
      fat_g: Math.round((stewGrams / 100) * (stew.fat_per_100g || 0) * 10) / 10,
      calories_kcal: Math.round((stewGrams / 100) * (stew.kcal_per_100g || 0)),
      swaps: [],
      split_note_ar: "البقوليات هي بروتين الوجبة دي — العميل مبياكلش لحوم أو فراخ أو سمك، فالبروتين لازم ييجي من البقوليات مش من البيض والجبنة بس.",
    };
    const items = [...meal.items];
    items[targetIndex] = stewItem;
    // The stew brings carbs the egg did not: the meal's largest starch
    // gives them back, down to its 50 g minimum, so the plate stays on
    // its carb target. Any residual drift is the day reconciliation's job.
    const excessCarbs = Math.max(0, stewItem.carb_g - (Number(replaced.carb_g) || 0));
    if (excessCarbs > 0) {
      let starchIndex = -1;
      let starchCarbs = 0;
      items.forEach((item, index) => {
        if (index === targetIndex) return;
        if (STARCH_CODES.has(item.food_code) && (Number(item.carb_g) || 0) > starchCarbs) {
          starchIndex = index;
          starchCarbs = Number(item.carb_g) || 0;
        }
      });
      if (starchIndex >= 0) {
        const starch = items[starchIndex];
        const carbPerGram = (Number(starch.carb_g) || 0) / Math.max(1, Number(starch.portion_g) || 1);
        if (carbPerGram > 0) {
          const cutGrams = Math.min(Math.max(0, Number(starch.portion_g) - 50), excessCarbs / carbPerGram);
          if (cutGrams >= 1) items[starchIndex] = withRescaledItem(starch, Number(starch.portion_g) - cutGrams);
        }
      }
    }
    const next = [...meals];
    next[mealIndex] = { ...meal, items };
    return next;
  }
  return meals;
}

/**
 * The served day must land within 30 kcal of its target. Each meal sits a
 * few kcal over its own target (the trim stops at a 3 g per-macro rounding
 * threshold), and the residuals add up to +16..+64 a day. The excess is
 * shaved from the largest starch and oil donors — at most 25% of any one
 * item, never below the food's minimum (50 g starch, 5 g oil) — and a
 * shortfall is topped up the same way, bounded by the food's cap. Nothing
 * is invented: only food already on the plate moves.
 * Alt 2 (LO-1 / HO-4): the shave is meal-aware and macro-aware. The old
 * largest-first order cut whichever meal held the biggest donor, so a main
 * meal that was already under target lost its rice while breakfast kept its
 * overshoot (the meal kcal see-saw). Now the shave budget is split across
 * the meals that are over their own target, in proportion to their overage,
 * and under-target meals are left alone unless their room is the only way
 * left to land the day. Within a meal, donors are cut in harm order: a
 * donor that carries a macro the meal is short on costs more (protein x3,
 * carbs x2, fat x1 per kcal), so oil goes first when fat is over and rice
 * before bread when protein is short — and a donor carrying a macro the
 * meal is already over on costs less (x-1), so a carb cut lands in carbs
 * while fats stay locked. On a harm tie, the donor carrying the least
 * protein and carbs per kcal goes first — oil is pure fat, so cutting
 * it costs no protein and no carbs. Day macro targets are the sum of the
 * per-meal target_macros already on the meals — no new arguments. A meal
 * without targets falls back to the legacy largest-first order.
 *
 * Shared single-target engine: the exported day function below runs this
 * once for the whole day, and the per-meal pass calls it once per meal
 * with that meal's own target (same donor machinery, same caps).
 */
function reconcileMealsToTarget(meals = [], targetCalories = 0, toleranceKcal = 30) {
  if (!Number.isFinite(targetCalories) || targetCalories <= 0) return meals;
  const served = meals.reduce((sum, meal) => sum + mealCalories(meal), 0);
  const drift = served - targetCalories;
  if (Math.abs(drift) <= toleranceKcal) return meals;

  const shave = drift > 0;
  const mealMacro = (meal, key) => (meal.items || []).reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
  // A macro's weight is signed: a short macro is protected when cutting
  // (protein x3, carbs x2, fat x1 per kcal) and sought when topping up,
  // while a macro already over target is cut first (x-1) and never added
  // to. A carb titration lowers the carb targets, so the served carbs sit
  // over them and starch — not oil — takes the cut, which is what makes a
  // carb cut land in carbs while fats stay locked.
  const mealStats = meals.map((meal) => {
    const target = meal?.target_macros || null;
    const kcalTarget = target ? Number(target.calories_kcal) : NaN;
    const macroWeight = (key, shortWeight) => {
      const targetValue = target ? Number(target[key]) : NaN;
      if (!Number.isFinite(targetValue)) return 0;
      const servedValue = mealMacro(meal, key);
      if (servedValue < targetValue) return shortWeight;
      if (servedValue > targetValue) return -1;
      return 0;
    };
    return {
      kcalDelta: Number.isFinite(kcalTarget) ? mealCalories(meal) - kcalTarget : null,
      proteinWeight: macroWeight("protein_g", 3),
      carbWeight: macroWeight("carb_g", 2),
      fatWeight: macroWeight("fat_g", 1),
    };
  });
  const hasMealTargets = mealStats.every((stats) => stats.kcalDelta !== null);

  // Per-meal kcal budgets, in proportion to how far each meal is over
  // (shave) or under (top-up) its own target. Null means legacy order.
  let budgets = null;
  if (hasMealTargets) {
    const total = mealStats.reduce((sum, stats) => sum + Math.max(0, shave ? stats.kcalDelta : -stats.kcalDelta), 0);
    if (total > 0) {
      budgets = mealStats.map((stats) => Math.max(0, shave ? stats.kcalDelta : -stats.kcalDelta) / total * Math.abs(drift));
    }
  }

  const donors = [];
  meals.forEach((meal, mealIndex) => {
    (meal.items || []).forEach((item, itemIndex) => {
      const kcalPerGram = (Number(item.calories_kcal) || 0) / Math.max(1, Number(item.portion_g) || 1);
      if (kcalPerGram <= 0) return;
      const isStarch = STARCH_CODES.has(item.food_code);
      const isOil = item.food_code === OLIVE_OIL;
      if (!isStarch && !isOil) return;
      const stats = mealStats[mealIndex];
      const proteinPerKcal = (Number(item.protein_g) || 0) / Math.max(1, Number(item.calories_kcal) || 1);
      const carbPerKcal = (Number(item.carb_g) || 0) / Math.max(1, Number(item.calories_kcal) || 1);
      const fatPerKcal = (Number(item.fat_g) || 0) / Math.max(1, Number(item.calories_kcal) || 1);
      const macroWeight = proteinPerKcal * stats.proteinWeight
        + carbPerKcal * stats.carbWeight
        + fatPerKcal * stats.fatWeight;
      donors.push({
        mealIndex,
        itemIndex,
        portionG: Number(item.portion_g) || 0,
        kcalPerGram,
        macroWeight,
        proteinCarbPerKcal: proteinPerKcal + carbPerKcal,
        donorKcal: Number(item.calories_kcal) || 0,
        minG: isOil ? 5 : 50,
        maxG: isOil ? Infinity : (STARCH_CAPS_G[item.food_code] ?? Infinity),
      });
    });
  });
  if (budgets) {
    // Shave: cut the least-harmful donor first. Top-up: add the donor that
    // carries the macros the meal is short on first. On a harm tie, the
    // donor that carries the least protein and carbs per kcal goes first:
    // oil is pure fat, so cutting it costs no protein and no carbs, and
    // adding it disturbs neither. Bigger donor first on a full tie, so the
    // move lands in as few items as possible.
    donors.sort((a, b) => (shave ? a.macroWeight - b.macroWeight : b.macroWeight - a.macroWeight)
      || a.proteinCarbPerKcal - b.proteinCarbPerKcal
      || b.donorKcal - a.donorKcal);
  } else {
    donors.sort((a, b) => b.donorKcal - a.donorKcal);
  }

  let remaining = Math.abs(drift);
  const adjustments = new Map();
  const spentKcal = new Map();
  const roomFor = (donor) => {
    const key = `${donor.mealIndex}:${donor.itemIndex}`;
    const already = Math.abs(adjustments.get(key) || 0);
    const portionNow = donor.portionG + (adjustments.get(key) || 0);
    if (shave) {
      return Math.max(0, Math.min(donor.portionG * 0.25 - already, portionNow - donor.minG));
    }
    return Math.max(0, Math.min(donor.portionG * 0.25 - already, donor.maxG - portionNow));
  };
  const applyPass = (respectBudgets) => {
    for (const donor of donors) {
      if (remaining <= 0) break;
      const key = `${donor.mealIndex}:${donor.itemIndex}`;
      const budgetLeft = respectBudgets && budgets
        ? budgets[donor.mealIndex] - (spentKcal.get(donor.mealIndex) || 0)
        : Infinity;
      if (budgetLeft <= 0) continue;
      const room = roomFor(donor);
      if (room <= 0) continue;
      const grams = Math.min(room, remaining / donor.kcalPerGram, budgetLeft / donor.kcalPerGram);
      if (grams < 1) continue;
      adjustments.set(key, (adjustments.get(key) || 0) + (shave ? -grams : grams));
      spentKcal.set(donor.mealIndex, (spentKcal.get(donor.mealIndex) || 0) + grams * donor.kcalPerGram);
      remaining -= grams * donor.kcalPerGram;
    }
  };
  if (budgets) {
    applyPass(true);
    if (remaining > 0) applyPass(false);
  } else {
    applyPass(false);
  }
  if (adjustments.size === 0) return meals;
  return meals.map((meal, mealIndex) => {
    let changed = false;
    const items = (meal.items || []).map((item, itemIndex) => {
      const delta = adjustments.get(`${mealIndex}:${itemIndex}`);
      if (!delta) return item;
      changed = true;
      return withRescaledItem(item, Math.max(1, Math.round((Number(item.portion_g) || 0) + delta)));
    });
    return changed ? { ...meal, items } : meal;
  });
}

/**
 * B4-3 (Option A): the served day must land within 30 kcal of its target —
 * and so must each meal. The day pass only fires when the DAY drifts
 * past tolerance, so a single meal can sit 30-40 kcal off its own target
 * while the day looks fine (C13 m2 -43, C13 m3 +38, C20 m2 +33 on the
 * 20-client matrix). After the unchanged day pass, each meal carrying its
 * own target_macros is reconciled to that target when it is further off
 * than the smaller of 30 kcal and 10% of its target — the same donor
 * machinery, the same 25% per-item cap and minimums, the meal's own
 * harm-order ranking. Meals without targets are skipped, and a meal with
 * no starch/oil donor on the plate is left alone (the snack builder owns
 * that case: it must not emit a sub-minimum starch in the first place).
 * The day is re-checked once at the end, and the day pass runs once more
 * only if the per-meal moves pushed the day itself past tolerance.
 * Disclosed trade-off: a top-up adds the donor's macros with its kcal —
 * C13 m2 has no fat donor, so its top-up adds ~+8 g carbs to a meal
 * already over its carb target. Measured on the matrix, the day effect
 * is small, not the feared one: m3's bread shave takes ~-7 g carbs back,
 * so C13 day carbs move only +20.3 -> +20.5. The systematic fat
 * shortfall behind it is a separate package (pipeline portion solver).
 */
export function reconcileDayCaloriesToTarget(meals = [], targetCalories = 0, toleranceKcal = 30) {
  if (!Number.isFinite(targetCalories) || targetCalories <= 0) return meals;
  let result = reconcileMealsToTarget(meals, targetCalories, toleranceKcal);
  const perMeal = result.map((meal) => {
    const target = meal?.target_macros || null;
    const kcalTarget = target ? Number(target.calories_kcal) : NaN;
    if (!Number.isFinite(kcalTarget) || kcalTarget <= 0) return meal;
    const drift = mealCalories(meal) - kcalTarget;
    if (Math.abs(drift) <= Math.min(30, kcalTarget * 0.1)) return meal;
    return reconcileMealsToTarget([meal], kcalTarget, 0)[0];
  });
  if (perMeal.some((meal, index) => meal !== result[index])) result = perMeal;
  const dayAfter = result.reduce((sum, meal) => sum + mealCalories(meal), 0);
  if (Math.abs(dayAfter - targetCalories) > toleranceKcal) {
    result = reconcileMealsToTarget(result, targetCalories, toleranceKcal);
  }
  return result;
}
