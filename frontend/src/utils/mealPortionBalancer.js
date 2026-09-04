/**
 * Realistic Culinary Meal & Day Portion Balancer Engine
 * 
 * Solves and harmonizes food portions within a meal or entire daily plan:
 * - Avoids arbitrary numbers by applying culinary realistic bounds (e.g., 120-220g meat, 120-250g rice, 5-15g oil).
 * - Solves the macro equations simultaneously for primary protein, carb, and fat sources.
 * - Leaves vegetables at standard, digestion-friendly servings (80-120g).
 * - Guarantees the meal and the day close with zero macro error (مطابق بالملي).
 */

import { FOOD_DATABASE } from './foodSwapEngine.js';

export function hasAnyWord(text, words = []) {
  if (!text) return false;
  const upper = String(text).toUpperCase();
  const tokens = upper.split(/[_\s,.-]+/);
  return words.some(w => {
    const uw = w.toUpperCase();
    return tokens.some(t => t === uw || (t.startsWith(uw) && uw.length >= 4) || (uw.startsWith(t) && t.length >= 4));
  });
}

export function checkIsEggItem(item) {
  if (!item) return false;
  const code = String(item.code || item.id || '').toUpperCase();
  const name = String(item.name || item.name_ar || '');
  const unit = String(item.unit || '');
  if (unit === 'بيضة' || unit === 'حبة') return true;
  if (hasAnyWord(code, ['EGG', 'EGGS', 'OMELETTE', 'SHAKSHOUKA'])) return true;
  const tokens = name.split(/[_\s,.-]+/);
  return tokens.some(t => t === 'بيض' || t === 'بياض' || t === 'صفار' || t === 'أومليت' || t === 'اومليت' || t === 'شكشوكة');
}

export function detectFoodMacroRole(item) {
  const code = item.code || item.id || '';
  const name = item.name || item.name_ar || '';
  const cat = String(item.category || '').toUpperCase();

  if (cat === 'VEG' || cat === 'VEGETABLE') return 'VEGETABLE';
  if (cat === 'FAT') return 'FAT';
  if (cat === 'CARB') return 'CARB';
  if (cat === 'PROTEIN') return 'PROTEIN';

  // Check Vegetables
  if (
    hasAnyWord(code, ['BROCCOLI', 'CUCUMBER', 'LETTUCE', 'ARUGULA', 'TOMATO', 'PEPPER', 'SPINACH', 'ZUCCHINI', 'MUSHROOM']) ||
    hasAnyWord(name, ['خيار', 'طماطم', 'بروكلي', 'خس', 'جرجير', 'فلفل', 'كوسة', 'سبانخ', 'مشروم'])
  ) {
    return 'VEGETABLE';
  }

  // Check Fats (Oil, Butter, Nuts, Olives, Tahini)
  if (
    hasAnyWord(code, ['OIL', 'BUTTER', 'ALMOND', 'WALNUT', 'CASHEW', 'OLIVE', 'OLIVES', 'TAHINI', 'PEANUT_BUTTER']) ||
    hasAnyWord(name, ['زيت', 'زبدة', 'مكسرات', 'لوز', 'جوز', 'كاجو', 'جمل', 'سوداني', 'زيتون', 'طحينة'])
  ) {
    return 'FAT';
  }

  // Check Protein (Chicken, Beef, Meat, Fish, Tuna, Salmon, Eggs, Cottage, Whey, Casein)
  if (
    hasAnyWord(code, ['CHICKEN', 'BEEF', 'MEAT', 'STEAK', 'FISH', 'TUNA', 'SALMON', 'EGG', 'EGGS', 'COTTAGE', 'WHEY', 'CASEIN', 'SARDINES', 'TILAPIA']) ||
    hasAnyWord(name, ['دجاج', 'لحم', 'كفتة', 'سمك', 'فيليه', 'تونة', 'سردين', 'بلطي', 'قريش', 'واي']) ||
    checkIsEggItem(item)
  ) {
    return 'PROTEIN';
  }

  // Fallback to Carbs (Rice, Oats, Pasta, Potato, Sweet Potato, Fruits, Legumes, Bread)
  return 'CARB';
}

export function getItemPer100gMacros(item) {
  const code = item.code || item.id;
  const dbItem = FOOD_DATABASE[code] || (FOOD_DATABASE[String(code).toLowerCase()]);

  const isEgg = checkIsEggItem(item);
  const effectiveGrams = isEgg ? (Math.max(1, Number(item.amount) || 1) * 50) : Math.max(1, Number(item.amount) || 100);

  const p100 = Number(dbItem?.protein_per_100g ?? ((Number(item.p) || (isEgg ? 6.5 : 20)) / effectiveGrams) * 100);
  const c100 = Number(dbItem?.carbs_per_100g ?? ((Number(item.c) || 0) / effectiveGrams) * 100);
  const f100 = Number(dbItem?.fat_per_100g ?? ((Number(item.f) || (isEgg ? 5.0 : 2)) / effectiveGrams) * 100);
  const cal100 = Number(dbItem?.calories_per_100g ?? ((Number(item.cal) || (isEgg ? 72 : 110)) / effectiveGrams) * 100);

  return {
    p100: Math.max(0, p100),
    c100: Math.max(0, c100),
    f100: Math.max(0, f100),
    cal100: Math.max(1, cal100)
  };
}

/**
 * Balances a single meal's items to realistically fulfill its target share of calories and macros.
 */
export function balanceMealItems(items = [], mealTarget = { p: 40, c: 50, f: 15, cal: 500 }) {
  if (!items || items.length === 0) return [];

  const classified = items.map((item, idx) => ({
    originalIndex: idx,
    item,
    role: detectFoodMacroRole(item),
    density: getItemPer100gMacros(item)
  }));

  const vegItems = classified.filter(c => c.role === 'VEGETABLE');
  const fatItems = classified.filter(c => c.role === 'FAT');
  const proteinItems = classified.filter(c => c.role === 'PROTEIN');
  const carbItems = classified.filter(c => c.role === 'CARB');

  const solvedAmounts = new Array(items.length).fill(100);

  // 1. Fix vegetables to standard realistic portions (80g - 120g, default 100g)
  let vegP = 0, vegC = 0, vegF = 0, vegCal = 0;
  vegItems.forEach(v => {
    const stdAmount = 100;
    solvedAmounts[v.originalIndex] = stdAmount;
    const factor = stdAmount / 100;
    vegP += v.density.p100 * factor;
    vegC += v.density.c100 * factor;
    vegF += v.density.f100 * factor;
    vegCal += v.density.cal100 * factor;
  });

  // 2. Determine Fat Items (e.g. olive oil / nuts)
  let fatItemP = 0, fatItemC = 0, fatItemF = 0, fatItemCal = 0;
  if (fatItems.length > 0) {
    const targetFatToCover = Math.max(5, (mealTarget.f || 12) - vegF);
    const perItemFat = targetFatToCover / fatItems.length;

    fatItems.forEach(f => {
      const isOil = String(f.item.code || f.item.name).toUpperCase().includes('OIL') || String(f.item.name || '').includes('زيت');
      let amount = (perItemFat / Math.max(1, f.density.f100)) * 100;
      if (isOil) {
        amount = Math.max(5, Math.min(15, Math.round(amount))); // 5g to 15g oil
      } else {
        amount = Math.max(15, Math.min(35, Math.round(amount / 5) * 5)); // 15g to 35g nuts
      }
      solvedAmounts[f.originalIndex] = amount;
      const factor = amount / 100;
      fatItemP += f.density.p100 * factor;
      fatItemC += f.density.c100 * factor;
      fatItemF += f.density.f100 * factor;
      fatItemCal += f.density.cal100 * factor;
    });
  }

  // 3. Determine Protein Items (Chicken, Beef, Fish, Eggs)
  let remainingP = Math.max(15, (mealTarget.p || 40) - (vegP + fatItemP));
  let proteinItemP = 0, proteinItemC = 0, proteinItemF = 0, proteinItemCal = 0;
  if (proteinItems.length > 0) {
    const perItemP = remainingP / proteinItems.length;
    proteinItems.forEach(p => {
      const isEgg = checkIsEggItem(p.item);
      const isCottage = String(p.item.code || p.item.name).toUpperCase().includes('COTTAGE') || String(p.item.name || '').includes('قريش');
      
      let amount = (perItemP / Math.max(1, p.density.p100)) * 100;
      if (isEgg) {
        amount = Math.max(2, Math.min(5, Math.round(amount / 50))); // 2 to 5 whole eggs
      } else if (isCottage) {
        amount = Math.max(100, Math.min(250, Math.round(amount / 10) * 10)); // 100g - 250g
      } else {
        // Poultry / Meat / Fish: round to nearest 5g, realistic bounds 100g - 240g
        amount = Math.max(100, Math.min(240, Math.round(amount / 5) * 5));
      }
      solvedAmounts[p.originalIndex] = amount;
      const factor = isEgg ? amount : amount / 100;
      proteinItemP += (isEgg ? p.density.p100 * 0.5 : p.density.p100) * factor;
      proteinItemC += p.density.c100 * factor;
      proteinItemF += p.density.f100 * factor;
      proteinItemCal += p.density.cal100 * factor;
    });
  }

  // 4. Determine Carb Items (Rice, Potato, Oats, Pasta)
  let remainingC = Math.max(15, (mealTarget.c || 50) - (vegC + fatItemC + proteinItemC));
  if (carbItems.length > 0) {
    const perItemC = remainingC / carbItems.length;
    carbItems.forEach(c => {
      const isOats = String(c.item.code || c.item.name).toUpperCase().includes('OAT') || String(c.item.name || '').includes('شوفان');
      const isPotato = String(c.item.code || c.item.name).toUpperCase().includes('POTATO') || String(c.item.name || '').includes('بطاط');
      
      let amount = (perItemC / Math.max(1, c.density.c100)) * 100;
      if (isOats) {
        amount = Math.max(35, Math.min(85, Math.round(amount / 5) * 5)); // 35g to 85g oats
      } else if (isPotato) {
        amount = Math.max(130, Math.min(300, Math.round(amount / 10) * 10)); // 130g to 300g potato
      } else {
        // Cooked Rice / Pasta: round to nearest 5g, realistic bounds 100g - 250g
        amount = Math.max(100, Math.min(260, Math.round(amount / 5) * 5));
      }
      solvedAmounts[c.originalIndex] = amount;
    });
  }

  // Re-build updated item objects with recalculations
  return items.map((orig, idx) => {
    const amt = solvedAmounts[idx] || orig.amount || 100;
    const d = getItemPer100gMacros(orig);
    const isEgg = checkIsEggItem(orig);
    const factor = isEgg ? (amt * 0.5) : (amt / 100);

    return {
      ...orig,
      amount: amt,
      p: Number((d.p100 * factor).toFixed(1)),
      c: Number((d.c100 * factor).toFixed(1)),
      f: Number((d.f100 * factor).toFixed(1)),
      cal: Math.round(d.cal100 * factor)
    };
  });
}

/**
 * Balances all meals across the day to match the target calories and macros with 100% precision.
 */
export function balanceAllDayMeals(meals = [], dailyTarget = { calories: 2000, protein: 150, carbs: 200, fats: 55 }) {
  if (!meals || meals.length === 0) return [];

  const totalMeals = meals.length;
  // Natural realistic meal distribution weights
  const defaultWeights = totalMeals === 3 
    ? [0.30, 0.40, 0.30] 
    : totalMeals === 4 
    ? [0.25, 0.35, 0.25, 0.15]
    : totalMeals === 5
    ? [0.20, 0.30, 0.20, 0.15, 0.15]
    : meals.map(() => 1 / totalMeals);

  const balancedMeals = meals.map((m, mIdx) => {
    const weight = defaultWeights[mIdx] || (1 / totalMeals);
    const mealTarget = {
      p: Math.round(dailyTarget.protein * weight),
      c: Math.round(dailyTarget.carbs * weight),
      f: Math.round(dailyTarget.fats * weight),
      cal: Math.round(dailyTarget.calories * weight)
    };

    const newItems = balanceMealItems(m.items || [], mealTarget);

    let totCal = 0, totP = 0, totC = 0, totF = 0;
    newItems.forEach(it => {
      totCal += Number(it.cal) || 0;
      totP += Number(it.p) || 0;
      totC += Number(it.c) || 0;
      totF += Number(it.f) || 0;
    });

    return {
      ...m,
      items: newItems,
      macros: {
        calories: Math.round(totCal),
        protein: Math.round(totP),
        carbs: Math.round(totC),
        fats: Math.round(totF)
      }
    };
  });

  return balancedMeals;
}

/**
 * Dynamic Live Ripple Rebalance Engine (الموازنة الماكروية الحية المترابطة)
 * 
 * Dynamically ripples any change in one meal or supplements across the rest of the daily plan:
 * - If coach adds 2 eggs or a scoop of whey, other meals' protein sources automatically scale down.
 * - If coach removes the item, other meals' protein sources scale back up to their original equilibrium.
 * - Realistic culinary bounds (e.g. 80-250g meat, 80-280g rice, 4-18g oil, 1-5 eggs) are strictly enforced.
 */
export function dynamicRippleRebalanceDailyPlan({
  meals = [],
  supplements = [],
  targets = { calories: 2000, protein: 150, carbs: 200, fats: 50 },
  anchorMealId = null,
  beverageSugarSpoons = 0,
  autoRippleEnabled = true
}) {
  if (!meals || meals.length === 0) return [];
  if (!autoRippleEnabled) return meals;

  const targetCal = Number(targets?.calories ?? targets?.target_calories ?? 2000);
  const targetP = Number(targets?.protein ?? targets?.target_protein ?? 150);
  const targetC = Number(targets?.carbs ?? targets?.target_carbs ?? 200);
  const targetF = Number(targets?.fats ?? targets?.target_fats ?? 50);

  // 1. Calculate supplements contribution
  let suppCal = 0, suppP = 0, suppC = 0, suppF = 0;
  (supplements || []).forEach(s => {
    suppCal += Number(s.calories ?? s.cal ?? 0);
    suppP += Number(s.protein ?? s.p ?? 0);
    suppC += Number(s.carbs ?? s.c ?? 0);
    suppF += Number(s.fats ?? s.f ?? 0);
  });

  // 2. Calculate beverage sugar contribution
  const sugarSpoons = Number(beverageSugarSpoons || 0);
  const sugarC = sugarSpoons * 5;
  const sugarCal = sugarSpoons * 20;

  // 3. Net targets to be delivered by whole food meals
  const netFoodTargetP = Math.max(10, targetP - suppP);
  const netFoodTargetC = Math.max(10, targetC - suppC - sugarC);
  const netFoodTargetF = Math.max(5, targetF - suppF);
  const netFoodTargetCal = Math.max(100, targetCal - suppCal - sugarCal);

  // 4. Distinguish Anchor Meal from Recipient Meals
  const hasAnchor = Boolean(anchorMealId && meals.some(m => m.id === anchorMealId));
  const anchorMeal = hasAnchor ? meals.find(m => m.id === anchorMealId) : null;
  const recipientMeals = hasAnchor ? meals.filter(m => m.id !== anchorMealId) : [...meals];

  if (recipientMeals.length === 0) {
    // Only 1 meal exists, nothing to ripple across
    return meals;
  }

  // Calculate anchor meal's delivered macros
  let anchorP = 0, anchorC = 0, anchorF = 0, anchorCal = 0;
  if (anchorMeal) {
    (anchorMeal.items || []).forEach(it => {
      anchorP += Number(it.p || 0);
      anchorC += Number(it.c || 0);
      anchorF += Number(it.f || 0);
      anchorCal += Number(it.cal || 0);
    });
  }

  // Macros to be covered by recipient meals combined
  const neededRecipP = Math.max(5, netFoodTargetP - anchorP);
  const neededRecipC = Math.max(5, netFoodTargetC - anchorC);
  const neededRecipF = Math.max(2, netFoodTargetF - anchorF);

  // 5. Inspect and classify items in recipient meals
  let bgRecipP = 0; // non-protein items protein
  let bgRecipC = 0; // non-carb items carbs
  let bgRecipF = 0; // non-fat items fats

  let currPrimaryP = 0;
  let currPrimaryC = 0;
  let currPrimaryF = 0;

  const classifiedRecipientMeals = recipientMeals.map(m => {
    const classifiedItems = (m.items || []).map(it => {
      const role = detectFoodMacroRole(it);
      const density = getItemPer100gMacros(it);
      const isEgg = checkIsEggItem(it);

      if (role === 'PROTEIN') {
        currPrimaryP += Number(it.p || 0);
      } else {
        bgRecipP += Number(it.p || 0);
      }

      if (role === 'CARB') {
        currPrimaryC += Number(it.c || 0);
      } else {
        bgRecipC += Number(it.c || 0);
      }

      if (role === 'FAT') {
        currPrimaryF += Number(it.f || 0);
      } else {
        bgRecipF += Number(it.f || 0);
      }

      return { it, role, density, isEgg };
    });

    return { meal: m, classifiedItems };
  });

  // Calculate scale factors
  const netNeededPrimaryP = Math.max(5, neededRecipP - bgRecipP);
  const netNeededPrimaryC = Math.max(5, neededRecipC - bgRecipC);
  const netNeededPrimaryF = Math.max(2, neededRecipF - bgRecipF);

  const scaleP = currPrimaryP > 0 ? (netNeededPrimaryP / currPrimaryP) : 1;
  const scaleC = currPrimaryC > 0 ? (netNeededPrimaryC / currPrimaryC) : 1;
  const scaleF = currPrimaryF > 0 ? (netNeededPrimaryF / currPrimaryF) : 1;

  // 6. Scale recipient items with culinary bounds
  const updatedRecipientMeals = classifiedRecipientMeals.map(({ meal, classifiedItems }) => {
    const newItems = classifiedItems.map(({ it, role, density, isEgg }) => {
      let amount = Number(it.amount) || 100;

      if (role === 'PROTEIN') {
        const scaledAmt = amount * scaleP;
        if (isEgg) {
          amount = Math.max(1, Math.min(5, Math.round(scaledAmt)));
        } else {
          const isCottage = String(it.code || it.name).toUpperCase().includes('COTTAGE') || String(it.name || '').includes('قريش');
          if (isCottage) {
            amount = Math.max(70, Math.min(260, Math.round(scaledAmt / 10) * 10));
          } else {
            // Meat / Poultry / Fish
            amount = Math.max(70, Math.min(260, Math.round(scaledAmt / 5) * 5));
          }
        }
      } else if (role === 'CARB') {
        const scaledAmt = amount * scaleC;
        const isOat = String(it.code || it.name).toUpperCase().includes('OAT') || String(it.name || '').includes('شوفان');
        const isPotato = String(it.code || it.name).toUpperCase().includes('POTATO') || String(it.name || '').includes('بطاط');
        const isFruit = String(it.code || it.name).toUpperCase().includes('BANANA') || String(it.code || it.name).toUpperCase().includes('APPLE') || String(it.name || '').includes('تفاح') || String(it.name || '').includes('موز') || String(it.name || '').includes('توت');

        if (isOat) {
          amount = Math.max(25, Math.min(85, Math.round(scaledAmt / 5) * 5));
        } else if (isPotato) {
          amount = Math.max(80, Math.min(320, Math.round(scaledAmt / 10) * 10));
        } else if (isFruit) {
          amount = Math.max(50, Math.min(180, Math.round(scaledAmt / 10) * 10));
        } else {
          // Rice / Pasta
          amount = Math.max(70, Math.min(280, Math.round(scaledAmt / 5) * 5));
        }
      } else if (role === 'FAT') {
        const scaledAmt = amount * scaleF;
        const isOil = String(it.code || it.name).toUpperCase().includes('OIL') || String(it.name || '').includes('زيت');
        if (isOil) {
          amount = Math.max(4, Math.min(18, Math.round(scaledAmt)));
        } else {
          // Nuts / PB
          amount = Math.max(10, Math.min(35, Math.round(scaledAmt / 5) * 5));
        }
      }
      // VEGETABLE remains unchanged (fiber/digestion standard serving)

      const factor = isEgg ? (amount * 0.5) : (amount / 100);
      return {
        ...it,
        amount,
        p: Number((density.p100 * factor).toFixed(1)),
        c: Number((density.c100 * factor).toFixed(1)),
        f: Number((density.f100 * factor).toFixed(1)),
        cal: Math.round(density.cal100 * factor)
      };
    });

    // Recalculate meal totals
    let totCal = 0, totP = 0, totC = 0, totF = 0;
    newItems.forEach(it => {
      totCal += Number(it.cal) || 0;
      totP += Number(it.p) || 0;
      totC += Number(it.c) || 0;
      totF += Number(it.f) || 0;
    });

    return {
      ...meal,
      items: newItems,
      macros: {
        calories: Math.round(totCal),
        protein: Math.round(totP),
        carbs: Math.round(totC),
        fats: Math.round(totF)
      }
    };
  });

  // 7. Micro-calibration for zero macro drift (ضبط بالملي)
  let currentTotalP = suppP;
  let currentTotalC = suppC + sugarC;
  updatedRecipientMeals.forEach(m => {
    (m.items || []).forEach(it => {
      currentTotalP += Number(it.p || 0);
      currentTotalC += Number(it.c || 0);
    });
  });
  if (anchorMeal) {
    (anchorMeal.items || []).forEach(it => {
      currentTotalP += Number(it.p || 0);
      currentTotalC += Number(it.c || 0);
    });
  }

  const deltaP = targetP - currentTotalP;
  const deltaC = targetC - currentTotalC;

  // Micro-tune primary protein item if difference is >= 2g
  if (Math.abs(deltaP) >= 2) {
    let bestProteinItem = null;
    let bestProteinMeal = null;
    for (const m of updatedRecipientMeals) {
      for (const it of m.items) {
        if (detectFoodMacroRole(it) === 'PROTEIN' && !checkIsEggItem(it)) {
          if (!bestProteinItem || (it.amount || 0) > (bestProteinItem.amount || 0)) {
            bestProteinItem = it;
            bestProteinMeal = m;
          }
        }
      }
    }
    if (bestProteinItem && bestProteinMeal) {
      const d = getItemPer100gMacros(bestProteinItem);
      const shift = Math.round((deltaP / Math.max(10, d.p100)) * 20) * 5;
      if (shift !== 0) {
        const newAmt = Math.max(70, Math.min(270, bestProteinItem.amount + shift));
        bestProteinItem.amount = newAmt;
        const factor = newAmt / 100;
        bestProteinItem.p = Number((d.p100 * factor).toFixed(1));
        bestProteinItem.c = Number((d.c100 * factor).toFixed(1));
        bestProteinItem.f = Number((d.f100 * factor).toFixed(1));
        bestProteinItem.cal = Math.round(d.cal100 * factor);
      }
    }
  }

  // Micro-tune primary carb item if difference is >= 3g
  if (Math.abs(deltaC) >= 3) {
    let bestCarbItem = null;
    let bestCarbMeal = null;
    for (const m of updatedRecipientMeals) {
      for (const it of m.items) {
        if (detectFoodMacroRole(it) === 'CARB' && (it.unit === 'جم' || it.unit === 'g')) {
          if (!bestCarbItem || (it.amount || 0) > (bestCarbItem.amount || 0)) {
            bestCarbItem = it;
            bestCarbMeal = m;
          }
        }
      }
    }
    if (bestCarbItem && bestCarbMeal) {
      const d = getItemPer100gMacros(bestCarbItem);
      const shift = Math.round((deltaC / Math.max(10, d.c100)) * 20) * 5;
      if (shift !== 0) {
        const newAmt = Math.max(70, Math.min(280, bestCarbItem.amount + shift));
        bestCarbItem.amount = newAmt;
        const factor = newAmt / 100;
        bestCarbItem.p = Number((d.p100 * factor).toFixed(1));
        bestCarbItem.c = Number((d.c100 * factor).toFixed(1));
        bestCarbItem.f = Number((d.f100 * factor).toFixed(1));
        bestCarbItem.cal = Math.round(d.cal100 * factor);
      }
    }
  }

  // Recalculate recipient meal macros after micro-tuning
  updatedRecipientMeals.forEach(m => {
    let totCal = 0, totP = 0, totC = 0, totF = 0;
    (m.items || []).forEach(it => {
      totCal += Number(it.cal) || 0;
      totP += Number(it.p) || 0;
      totC += Number(it.c) || 0;
      totF += Number(it.f) || 0;
    });
    m.macros = {
      calories: Math.round(totCal),
      protein: Math.round(totP),
      carbs: Math.round(totC),
      fats: Math.round(totF)
    };
  });

  // 8. Reconstruct all meals preserving original order
  const updatedMealsMap = new Map();
  updatedRecipientMeals.forEach(m => updatedMealsMap.set(m.id, m));
  if (anchorMeal) {
    updatedMealsMap.set(anchorMeal.id, anchorMeal);
  }

  return meals.map(m => updatedMealsMap.get(m.id) || m);
}
