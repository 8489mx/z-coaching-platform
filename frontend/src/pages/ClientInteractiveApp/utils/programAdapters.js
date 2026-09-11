import { getExerciseDisplayNames } from '../../../utils/exerciseTranslator.js';

export function adaptProgramToInteractiveMeals(masterProgram) {
  if (!masterProgram) return [];
  const rawNutrition = masterProgram.nutrition || masterProgram.nutrition_program;
  
  if (masterProgram.nutrition_program && Array.isArray(masterProgram.nutrition_program.culinary_meals) && masterProgram.nutrition_program.culinary_meals.length > 0) {
    return masterProgram.nutrition_program.culinary_meals.map((cm, cmIdx) => ({
      id: cm.id || `m${cm.meal_number || cmIdx + 1}`,
      title: cm.recipe_title_ar || cm.meal_name_ar || cm.title || cm.name || `الوجبة ${cm.meal_number || cmIdx + 1}`,
      workout_timing: cm.timing_relation || cm.workout_timing || 'NONE',
      time: cm.timing || (cmIdx === 0 ? '08:30 ص' : (cmIdx === 1 ? '02:00 م' : (cmIdx === 2 ? '05:30 م' : '09:30 م'))),
      completed: false,
      macros: {
        calories: Math.round(cm.actual_macros?.calories || cm.target_macros?.calories || cm.macros?.calories || 500),
        protein: Math.round(cm.actual_macros?.protein || cm.target_macros?.protein || cm.macros?.protein || 40),
        carbs: Math.round(cm.actual_macros?.carbs || cm.target_macros?.carbs || cm.macros?.carbs || 50),
        fats: Math.round(cm.actual_macros?.fats || cm.target_macros?.fats || cm.macros?.fats || 15)
      },
      items: (cm.items || []).map((it, itIdx) => ({
        id: it.id || `i_${cmIdx + 1}_${itIdx + 1}`,
        code: it.food_code || it.code,
        name: it.name_ar || it.name || it.name_en || 'صنف غذائي',
        amount: Number(it.portion_g || it.amount || 100),
        unit: it.unit || 'جم',
        p: Number((it.protein_g ?? it.p ?? 0).toFixed ? (it.protein_g ?? it.p ?? 0).toFixed(1) : (it.protein_g ?? it.p ?? 0)),
        c: Number((it.carb_g ?? it.c ?? 0).toFixed ? (it.carb_g ?? it.c ?? 0).toFixed(1) : (it.carb_g ?? it.c ?? 0)),
        f: Number((it.fat_g ?? it.f ?? 0).toFixed ? (it.fat_g ?? it.f ?? 0).toFixed(1) : (it.fat_g ?? it.f ?? 0)),
        cal: Math.round(it.calories_kcal ?? it.cal ?? 0),
        category: it.category || 'MAIN',
        taste_profile: it.taste_profile
      }))
    }));
  }

  if (rawNutrition?.meals && Array.isArray(rawNutrition.meals) && rawNutrition.meals.length > 0) {
    return rawNutrition.meals.map((m, mIdx) => ({
      ...m,
      id: m.id || `m${mIdx + 1}`,
      title: m.title || m.name || `الوجبة ${mIdx + 1}`,
      completed: !!m.completed,
      items: (m.items || []).map((it, itIdx) => ({
        ...it,
        id: it.id || `i_${mIdx + 1}_${itIdx + 1}`,
        code: it.code || it.food_code,
        name: it.name || it.name_ar || 'صنف غذائي',
        amount: Number(it.amount || it.portion_g || 100),
        unit: it.unit || 'جم'
      }))
    }));
  }

  return [];
}

export function adaptSessionToInteractiveWorkout(session, index = 0) {
  if (!session) return null;
  const title = session.session_name || session.name || session.title || `اليوم التدريبي ${index + 1}`;
  const warmupProtocol = session.warmup_protocol || session.warmupProtocol || 'إحماء عام 5 دقائق + حركات الإطالة والتفعيل الديناميكي';
  
  const rawExercises = session.exercises || [];
  const exercises = rawExercises.map((ex, exIdx) => {
    const names = getExerciseDisplayNames(ex);
    const exId = String(ex.id || ex.exercise_code || ex.code || `ex_${index}_${exIdx}`);
    const presc = ex.prescription || {};
    const numSets = presc.sets || (Array.isArray(ex.sets) ? ex.sets.length : (Number(ex.sets || ex.prescribed_sets) || 3));
    const targetReps = (presc.target_min && presc.target_max)
      ? `${presc.target_min}-${presc.target_max}`
      : (ex.reps || ex.target_reps || '10-12');
    const restSec = Number(presc.rest_seconds || ex.rest_seconds || ex.restDurationSec || ex.rest_sec) || 75;
    const targetRir = presc.target_rir !== undefined ? presc.target_rir : (ex.rir !== undefined ? ex.rir : 2);
    const safety = ex.safety_note || ex.safetyNote || ex.cue || 'الحفاظ على المدى الحركي الكامل والتحكم في الوزن بالنزول';
    const targetWeight = ex.working_weight_kg || ex.weight || '0';

    let sets = [];
    if (Array.isArray(ex.sets) && ex.sets.length > 0 && typeof ex.sets[0] === 'object') {
      sets = ex.sets.map((s, sIdx) => ({
        setNum: s.setNum || s.set_number || sIdx + 1,
        weight: String(s.weight || targetWeight),
        reps: String(s.reps || targetReps),
        prevBest: s.prevBest || `${s.weight || targetWeight}kg × ${s.reps || targetReps}`,
        completed: Boolean(s.completed)
      }));
    } else {
      for (let i = 1; i <= numSets; i++) {
        sets.push({
          setNum: i,
          weight: String(targetWeight),
          reps: String(targetReps),
          prevBest: `${targetWeight}kg × ${targetReps}`,
          completed: false
        });
      }
    }

    const videoUrl = ex.video_url || (ex.video_id ? `https://www.youtube.com/watch?v=${ex.video_id}` : '');
    const cues = ex.cues_ar || ex.cues || safety;
    const mistakes = ex.mistakes_ar || ex.mistakes || '';
    const imgStretch = ex.image_stretch || (ex.images && ex.images[0]) || `/exercises/${exId}/0.jpg`;
    const imgContraction = ex.image_contraction || (ex.images && ex.images[1]) || `/exercises/${exId}/1.jpg`;

    return {
      id: exId,
      code: ex.code || ex.exercise_code || exId,
      name: names.nameEn,
      nameEn: names.nameEn,
      nameAr: names.nameAr,
      isCompound: Boolean(ex.isCompound ?? (ex.muscle === 'CHEST' || ex.muscle === 'BACK' || ex.muscle === 'LEGS')),
      restDurationSec: restSec,
      targetRir: targetRir,
      prescription: presc,
      safetyNote: safety,
      cues_ar: cues,
      mistakes_ar: mistakes,
      video_url: videoUrl,
      video_id: ex.video_id || '',
      image_stretch: imgStretch,
      image_contraction: imgContraction,
      targetSets: numSets,
      targetReps: targetReps,
      targetWeight: targetWeight,
      completed: Boolean(ex.completed || (sets.length > 0 && sets.every(s => s.completed))),
      sets
    };
  });

  return {
    title,
    duration: session.duration || '55 دقيقة',
    warmupProtocol,
    exercises: exercises.length > 0 ? exercises : undefined
  };
}
