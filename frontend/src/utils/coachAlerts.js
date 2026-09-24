/**
 * Every note the plan engine leaves for the coach, in one list: why the goal was changed or
 * suggested, the diabetic carbohydrate ceiling, a high fat share, and meal items that need a look
 * (a portion the safe swaps could not split, an item flagged unsafe, a high glycemic item with no
 * alternative). The coach editor shows them above the nutrition plan.
 */
export function collectCoachAlerts(programData = {}) {
  const nutrition = programData.nutrition_program || programData.nutrition || {};
  const targets = nutrition.targets || {};
  const guardrails = programData.clinical_guardrails || targets.clinical_guardrails || nutrition.clinical_guardrails || {};
  const alerts = [];
  if (targets.goal_redirect?.reason_ar) alerts.push(targets.goal_redirect.reason_ar);
  if (guardrails.diabetic_carb_cap_note_ar) alerts.push(guardrails.diabetic_carb_cap_note_ar);
  if (guardrails.coach_review_high_fat_ar) alerts.push(guardrails.coach_review_high_fat_ar);
  if (guardrails.energy_balance_note_ar) alerts.push(guardrails.energy_balance_note_ar);
  if (targets.meal_count_note_ar) alerts.push(targets.meal_count_note_ar);
  if (targets.plate_capacity_note_ar) alerts.push(targets.plate_capacity_note_ar);
  const meals = Array.isArray(nutrition.culinary_meals) ? nutrition.culinary_meals : [];
  meals.forEach((meal, index) => {
    for (const item of meal?.items || []) {
      const name = item.name_ar || item.food_code;
      for (const note of [item.portion_warning_ar, item.portion_note_ar, item.clinical_warning_ar, item.glycemic_warning_ar]) {
        if (note) alerts.push(`الوجبة ${index + 1} - ${name}: ${note}`);
      }
    }
  });
  return [...new Set(alerts)];
}
