/**
 * A meal's totals are the sum of its items - what the client actually eats. The engine's stored
 * meal macros use other names (calories_kcal, protein_g ...) and are computed before the last
 * steps (split plates, fat sources), so screens that read them showed a 500 kcal fallback.
 * Items may use the engine's names (protein_g, carb_g, fat_g, calories_kcal) or the screens'
 * (p, c, f, cal).
 */
export function mealTotalsFromItems(items = []) {
  const sum = (pick) => (Array.isArray(items) ? items : []).reduce((total, item) => total + (Number(pick(item)) || 0), 0);
  const protein = sum((i) => i?.protein_g ?? i?.p);
  const carbs = sum((i) => i?.carb_g ?? i?.c);
  const fats = sum((i) => i?.fat_g ?? i?.f);
  const listed = sum((i) => i?.calories_kcal ?? i?.cal);
  return {
    calories: Math.round(listed > 0 ? listed : protein * 4 + carbs * 4 + fats * 9),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fats: Math.round(fats),
  };
}
