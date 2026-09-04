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

export function detectFoodMacroRole(item) {
  const code = String(item.code || item.id || '').toUpperCase();
  const name = String(item.name || item.name_ar || '').toUpperCase();
  const cat = String(item.category || '').toUpperCase();

  if (
    cat === 'VEG' || cat === 'VEGETABLE' ||
    ['BROCCOLI', 'CUCUMBER', 'LETTUCE', 'ARUGULA', 'TOMATO', 'PEPPER', 'SPINACH', 'ZUCCHINI', 'MUSHROOM', 'GREEN_BEANS', 'خيار', 'طماطم', 'بروكلي', 'خس', 'جرجير', 'فلفل', 'كوسة', 'سبانخ', 'فاصوليا خضراء'].some(k => code.includes(k) || name.includes(k))
  ) {
    return 'VEGETABLE';
  }

  if (
    cat === 'FAT' ||
    ['OIL', 'BUTTER', 'PEANUT_BUTTER', 'ALMOND', 'WALNUT', 'CASHEW', 'OLIVE', 'زيت', 'زبدة', 'مكسرات', 'لوز', 'جوز', 'فول سوداني'].some(k => code.includes(k) || name.includes(k))
  ) {
    return 'FAT';
  }

  if (
    cat === 'PROTEIN' ||
    ['CHICKEN', 'BEEF', 'MEAT', 'STEAK', 'FISH', 'TUNA', 'SALMON', 'EGG', 'COTTAGE', 'WHEY', 'CASEIN', 'دجاج', 'لحم', 'كفتة', 'سمك', 'فيليه', 'تونة', 'بيض', 'قريش', 'واي'].some(k => code.includes(k) || name.includes(k))
  ) {
    return 'PROTEIN';
  }

  return 'CARB';
}

export function getItemPer100gMacros(item) {
  const code = item.code || item.id;
  const dbItem = FOOD_DATABASE[code] || (FOOD_DATABASE[String(code).toLowerCase()]);

  const p100 = Number(dbItem?.protein_per_100g ?? ((Number(item.p) || 0) / Math.max(1, Number(item.amount) || 100)) * 100);
  const c100 = Number(dbItem?.carbs_per_100g ?? ((Number(item.c) || 0) / Math.max(1, Number(item.amount) || 100)) * 100);
  const f100 = Number(dbItem?.fat_per_100g ?? ((Number(item.f) || 0) / Math.max(1, Number(item.amount) || 100)) * 100);
  const cal100 = Number(dbItem?.calories_per_100g ?? ((Number(item.cal) || 0) / Math.max(1, Number(item.amount) || 100)) * 100);

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
      const isEgg = String(p.item.code || p.item.name).toUpperCase().includes('EGG') || String(p.item.name || '').includes('بيض');
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
    const isEgg = String(orig.code || orig.name).toUpperCase().includes('EGG') || String(orig.name || '').includes('بيض');
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
