/**
 * Plan Merge Engine (Deterministic & Idempotent Master Program Adapter)
 * 
 * Safely merges adaptation engine deltas (macros, training progression, cardio)
 * into an existing Master Program WITHOUT destroying meals or exercise blueprints.
 */

/**
 * Deep merges adaptation recommendations into a master program while guaranteeing
 * zero data loss for existing meals, culinary recipes, and workout exercises.
 * 
 * @param {Object} currentMasterProgram - The full existing master program JSON
 * @param {Object} adaptationResult - The output of buildAdaptedPlan or checkin analysis
 * @param {Object} [customMacros=null] - Optional coach overrides { calories, protein, carbs, fats }
 * @returns {Object} A fresh, deeply merged master program
 */
export function mergeAdaptedPlanIntoProgram(currentMasterProgram, adaptationResult = {}, customMacros = null) {
  if (!currentMasterProgram || typeof currentMasterProgram !== 'object') {
    throw new TypeError('currentMasterProgram must be a valid non-null object');
  }

  // 1. Deep clone original program to guarantee immutability of input
  const merged = JSON.parse(JSON.stringify(currentMasterProgram));

  // 2. Extract final target macros (Coach custom overrides take top priority)
  let finalCalories = null;
  let finalProtein = null;
  let finalCarbs = null;
  let finalFats = null;

  if (customMacros && typeof customMacros === 'object' && Number(customMacros.calories) > 0) {
    finalCalories = Number(customMacros.calories);
    finalProtein = Number(customMacros.protein || adaptationResult?.adapted_nutrition?.protein_g || 140);
    finalCarbs = Number(customMacros.carbs || adaptationResult?.adapted_nutrition?.carbohydrate_g || 200);
    finalFats = Number(customMacros.fats || adaptationResult?.adapted_nutrition?.fat_g || 50);
  } else if (adaptationResult?.adapted_nutrition?.target_calories_kcal) {
    finalCalories = Number(adaptationResult.adapted_nutrition.target_calories_kcal);
    finalProtein = Number(adaptationResult.adapted_nutrition.protein_g);
    finalCarbs = Number(adaptationResult.adapted_nutrition.carbohydrate_g);
    finalFats = Number(adaptationResult.adapted_nutrition.fat_g);
  } else if (adaptationResult?.suggested_calorie_delta) {
    const baseCal = merged.nutrition_program?.macro_targets?.calories_kcal 
      || merged.nutrition?.targets?.calories 
      || 2000;
    finalCalories = baseCal + Number(adaptationResult.suggested_calorie_delta);
    finalCarbs = (merged.nutrition_program?.macro_targets?.carb_g || merged.nutrition?.targets?.carbs || 200)
      + (adaptationResult.suggested_carb_delta_g || Math.round(Number(adaptationResult.suggested_calorie_delta) / 4));
    finalProtein = merged.nutrition_program?.macro_targets?.protein_g || merged.nutrition?.targets?.protein || 140;
    finalFats = merged.nutrition_program?.macro_targets?.fat_g || merged.nutrition?.targets?.fats || 50;
  }

  // 3. Update nutrition targets across all known schema paths WITHOUT touching meals
  if (finalCalories) {
    // Path A: Client Interactive App / Standard Nutrition targets
    if (!merged.nutrition) merged.nutrition = {};
    if (!merged.nutrition.targets) merged.nutrition.targets = {};
    merged.nutrition.targets.calories = finalCalories;
    merged.nutrition.targets.protein = finalProtein;
    merged.nutrition.targets.carbs = finalCarbs;
    merged.nutrition.targets.fats = finalFats;

    // Path B: Clinical Nutrition Program & Stages
    if (!merged.nutrition_program) merged.nutrition_program = {};
    
    // B.1: nutrition_program.targets
    if (!merged.nutrition_program.targets) merged.nutrition_program.targets = {};
    merged.nutrition_program.targets.target_calories = finalCalories;
    merged.nutrition_program.targets.target_calories_kcal = finalCalories;
    merged.nutrition_program.targets.calories_kcal = finalCalories;
    merged.nutrition_program.targets.protein_g = finalProtein;
    merged.nutrition_program.targets.total_protein_g = finalProtein;
    merged.nutrition_program.targets.carbohydrate_g = finalCarbs;
    merged.nutrition_program.targets.carb_g = finalCarbs;
    merged.nutrition_program.targets.total_carbs_g = finalCarbs;
    merged.nutrition_program.targets.fat_g = finalFats;
    merged.nutrition_program.targets.total_fat_g = finalFats;

    // B.2: nutrition_program.macro_targets
    if (!merged.nutrition_program.macro_targets) merged.nutrition_program.macro_targets = {};
    merged.nutrition_program.macro_targets.calories_kcal = finalCalories;
    merged.nutrition_program.macro_targets.protein_g = finalProtein;
    merged.nutrition_program.macro_targets.carbohydrate_g = finalCarbs;
    merged.nutrition_program.macro_targets.carb_g = finalCarbs;
    merged.nutrition_program.macro_targets.fat_g = finalFats;

    // B.3: nutrition_program.quantized_plan.daily_totals
    if (merged.nutrition_program.quantized_plan && merged.nutrition_program.quantized_plan.daily_totals) {
      merged.nutrition_program.quantized_plan.daily_totals.calories_kcal = finalCalories;
      merged.nutrition_program.quantized_plan.daily_totals.protein_g = finalProtein;
      merged.nutrition_program.quantized_plan.daily_totals.carbs_g = finalCarbs;
      merged.nutrition_program.quantized_plan.daily_totals.fat_g = finalFats;
    }
  }

  // 4. Update Training Meso-Cycle with Idempotency & Chronological Order Guarantee
  const targetWeekNumber = Number(adaptationResult?.adapted_week_number) 
    || (Number(merged.current_training_week) ? Number(merged.current_training_week) + 1 : 2);

  merged.current_training_week = targetWeekNumber;

  if (adaptationResult?.adapted_training_week && merged.training_program) {
    if (!Array.isArray(merged.training_program.weeks)) {
      merged.training_program.weeks = [];
    }

    const weeks = merged.training_program.weeks;

    // Idempotency: Locate week by explicit week_number or array index
    const existingIdx = weeks.findIndex(w => 
      Number(w.week_number) === targetWeekNumber || Number(w.week) === targetWeekNumber
    );

    const formattedAdaptedWeek = {
      ...adaptationResult.adapted_training_week,
      week_number: targetWeekNumber
    };

    if (existingIdx !== -1) {
      // Idempotent In-Place Update: Double clicks or retries will safely overwrite the exact same slot
      weeks[existingIdx] = {
        ...weeks[existingIdx],
        ...formattedAdaptedWeek
      };
    } else {
      // Insertion logic:
      const targetSlot = targetWeekNumber - 1;
      if (targetSlot >= 0 && targetSlot < weeks.length) {
        weeks[targetSlot] = {
          ...weeks[targetSlot],
          ...formattedAdaptedWeek
        };
      } else {
        // Append and sort chronologically to prevent gaps or disorder
        weeks.push(formattedAdaptedWeek);
        weeks.sort((a, b) => (Number(a.week_number) || 0) - (Number(b.week_number) || 0));
      }
    }
  }

  // 5. Apply Deload Flag if recommended
  if (adaptationResult?.is_deload_recommended || adaptationResult?.checkinAnalysis?.is_deload_recommended) {
    if (merged.training_program) {
      merged.training_program.is_deload = true;
      merged.training_program.deload_note = "أسبوع تفريغ أحمال تلقائي بناءً على مؤشرات الإجهاد وآلام المفاصل";
    }
  }

  // 6. Update Cardio step target if provided
  if (adaptationResult?.adapted_cardio && merged.cardio_program?.prescription) {
    merged.cardio_program.prescription.daily_step_target = 
      adaptationResult.adapted_cardio.daily_step_target || merged.cardio_program.prescription.daily_step_target;
  }

  // 7. Store Audit Adaptation Metadata
  merged._last_adaptation = {
    action: adaptationResult?.adaptation_action || 'APPROVED',
    reasons: adaptationResult?.adaptation_reasons || [],
    adapted_week: targetWeekNumber,
    timestamp: new Date().toISOString()
  };

  return merged;
}
