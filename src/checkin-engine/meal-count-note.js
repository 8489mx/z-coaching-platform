/**
 * The first plan adds a fourth meal when a day of 3200 kcal or more sits on three meals
 * (build-master-engine-v2). A check-in only rescales the existing meals, so when it takes a
 * three-meal plan past that line the coach is told to add a meal in the editor.
 */
export const MEAL_COUNT_KCAL_LINE = 3200;

/** The coach note for this check-in, or null when none is needed. */
export function mealCountNoteForCheckin({ planTargetKcal, calorieDelta = 0, mealsCount }) {
  const current = Number(planTargetKcal);
  const meals = Number(mealsCount);
  if (!(current > 0) || meals !== 3) return null;
  const next = Math.round(current + (Number(calorieDelta) || 0));
  if (next < MEAL_COUNT_KCAL_LINE) return null;
  return `السعرات هتبقى ${next} سعرة على 3 وجبات، والأطباق هتكبر؛ زوّد وجبة رابعة من المحرر ("إضافة وجبة") ووزّع عليها.`;
}
