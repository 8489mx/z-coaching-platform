/**
 * Intake Preflight & Biomechanical Clinical Audit Engine
 * Z Coaching Platform - Enterprise Decision Architecture
 *
 * Evaluates submitted intake answers, audits biomechanical joint pain restrictions,
 * calculates projected metabolic targets, identifies clinical contraindications,
 * and recommends exact safe exercise swaps prior to plan generation.
 * Zero emojis, strictly Arabic RTL clinical directives.
 */

export function unwrapIntakeAnswers(payload = {}) {
  if (!payload || typeof payload !== 'object') return {};
  const outer = payload.answers && typeof payload.answers === 'object' && !Array.isArray(payload.answers)
    ? { ...payload, ...payload.answers }
    : payload;
  if (outer.answers && typeof outer.answers === 'object' && !Array.isArray(outer.answers)) {
    return { ...outer, ...outer.answers };
  }
  return outer;
}

export function auditIntakeClinicalAndBiomechanicalSafety(rawPayload = {}) {
  const answers = unwrapIntakeAnswers(rawPayload);

  // 1. Biometrics & Core Profile
  const weight = Number(answers.body?.weightKg || answers.weight_kg || answers.weight || 75);
  const height = Number(answers.body?.heightCm || answers.height_cm || answers.height || 175);
  const age = Number(answers.personal?.age || answers.age || 28);
  const rawSex = String(answers.personal?.sex || answers.sex || answers.gender || 'MALE').toUpperCase();
  const isMale = !rawSex.includes('FEMALE') && !rawSex.includes('WOMAN');
  const bmi = weight > 0 && height > 0 ? Number((weight / ((height / 100) ** 2)).toFixed(1)) : 24.5;

  const rawGoal = String(answers.primary_goal || answers.goal_type || 'fat_loss').toLowerCase();
  const neat = String(answers.neat_level || 'sedentary').toLowerCase();
  const daysPerWeek = Number(answers.training_logistics?.days_per_week || answers.available_days_per_week || 4);
  const env = String(answers.training_environment || 'commercial_gym').toLowerCase();
  const isHome = ['home_gym', 'minimal_equipment', 'calisthenics_bands'].includes(env);

  // 2. Projected Metabolic Targets (BMR & TDEE)
  const bmr = isMale
    ? Math.round(10 * weight + 6.25 * height - 5 * age + 5)
    : Math.round(10 * weight + 6.25 * height - 5 * age - 161);

  let activityFactor = 1.35;
  if (neat.includes('moderate')) activityFactor = 1.45;
  if (neat.includes('very') || neat.includes('active')) activityFactor = 1.60;
  if (daysPerWeek >= 4) activityFactor += 0.05;

  const tdee = Math.round(bmr * activityFactor);

  let targetCalories = tdee;
  let effectiveGoalLabel = 'صحة ولياقة عامة';

  if (rawGoal.includes('fat') || rawGoal.includes('loss') || (rawGoal.includes('coach') && bmi >= 28)) {
    const deficit = Math.min(650, Math.max(350, Math.round(tdee * 0.22)));
    targetCalories = Math.max(isMale ? 1500 : 1200, tdee - deficit);
    effectiveGoalLabel = 'نزول دهون ووزن';
  } else if (rawGoal.includes('bulk') || rawGoal.includes('muscle') || rawGoal.includes('lean')) {
    targetCalories = Math.round(tdee + 250);
    effectiveGoalLabel = 'زيادة عضل ووزن';
  } else if (rawGoal.includes('recomp')) {
    targetCalories = Math.round(tdee - 150);
    effectiveGoalLabel = 'نزول دهون مع شد وبناء عضل';
  }

  // Protein, Carbs, Fats calculation
  const proteinG = Math.round(weight * (rawGoal.includes('bulk') ? 2.0 : 2.2));
  let fatG = Math.round((targetCalories * 0.25) / 9);
  let carbsG = Math.max(50, Math.round((targetCalories - (proteinG * 4) - (fatG * 9)) / 4));

  // 3. Clinical Medical Conditions Audit
  const selectedConditions = Array.isArray(answers.medical_conditions?.selected)
    ? answers.medical_conditions.selected.map(c => String(c).toLowerCase())
    : (Array.isArray(answers.medical?.conditions) ? answers.medical.conditions.map(c => String(c).toLowerCase()) : []);

  const hasDiabetes = selectedConditions.includes('diabetes');
  const hasHypertension = selectedConditions.includes('hypertension') || answers.medical?.hasHypertension === true;
  const hasHeartCondition = selectedConditions.includes('heart_condition') || answers.medical?.hasHeartCondition === true;
  const hasGout = selectedConditions.includes('gout');
  const hasAsthma = selectedConditions.includes('asthma');
  const hasBariatric = selectedConditions.includes('bariatric_surgery');
  const hasThyroid = selectedConditions.includes('thyroid');
  const hasFavism = selectedConditions.includes('favism_g6pd');

  const clinicalAlerts = [];
  const nutritionalDirectives = [];

  // Diabetes & Insulin Resistance Rule: Max 45% of total calories from carbohydrates
  if (hasDiabetes) {
    const maxCarbKcal = targetCalories * 0.45;
    const maxCarbGram = Math.floor(maxCarbKcal / 4);
    if (carbsG > maxCarbGram) {
      const trimmedCarb = carbsG - maxCarbGram;
      carbsG = maxCarbGram;
      fatG += Math.round((trimmedCarb * 4) / 9);
    }
    clinicalAlerts.push('تشخيص سكري / مقاومة أنسولين: تم تفعيل سقف الكربوهيدرات الصارم (≤45% من السعرات) ونظام المؤشر الجلايسيمي المنخفض.');
    nutritionalDirectives.push('استبعاد السكريات الحرة وحصر البطاطس والنشويات سريعة الامتصاص في حصص محددة مسبقاً.');
  }

  // Hypertension & Heart Condition
  if (hasHypertension || hasHeartCondition) {
    clinicalAlerts.push('مؤشر ضغط دم / قلب: استبعاد تمارين الانحدار، حظر ضغط فالسالفا، وقصر الكارديو على Zone 2 الخفيف.');
    nutritionalDirectives.push('ضبط الصوديوم، التركيز على مصادر البوتاسيوم الطبيعية، واستهلاك سوائل منتظم.');
  }

  // Gout
  if (hasGout) {
    clinicalAlerts.push('نقرس ويوريك أسيد: اعتدال مصادر اللحوم الحمراء والتركيز على الدواجن، البيض، والألبان مع ماء لا يقل عن 3.5 لتر.');
  }

  // Bariatric
  if (hasBariatric) {
    clinicalAlerts.push('تكميم معدة: توزيع السعرات على 4-5 وجبات صغيرة الحجم وفصل السوائل عن الوجبات بنصف ساعة.');
  }

  // 4. Biomechanical & Joint Pain Restrictions Audit
  const injuriesMap = answers.injuries_map || {};
  const hasInjuries = injuriesMap.has_injuries !== false && (
    (Array.isArray(injuriesMap.selected_areas) && injuriesMap.selected_areas.length > 0 && !injuriesMap.selected_areas.includes('none')) ||
    (Array.isArray(answers.injuries) && answers.injuries.length > 0 && !answers.injuries.includes('none'))
  );

  const rawAreas = [
    ...(Array.isArray(injuriesMap.selected_areas) ? injuriesMap.selected_areas : []),
    ...(Array.isArray(answers.injuries) ? answers.injuries : [])
  ].map(a => String(a).toLowerCase()).filter(a => a && a !== 'none');

  const jointRestrictions = [];
  const exerciseSwaps = [];

  // A. Lower Back / Spine Injury
  if (rawAreas.some(a => a.includes('spine') || a.includes('back') || a.includes('lumbar'))) {
    jointRestrictions.push({
      joint: 'العمود الفقري وأسفل الظهر',
      risk_mechanism: 'التحميل المحوري الرأسي وقوى القص القطنية',
      directive_ar: 'استبعاد السكوات بالبار الخلفي والرفعة الميتة المحورية واستبدالها بالدعم الصدري وتثبيت الحوض.'
    });
    exerciseSwaps.push({
      contraindicated: 'سكوات بالبار الخلفي (Back Squat)',
      safe_alternative: isHome ? 'جوبلت سكوات بالدمبل (Goblet Squat)' : 'مكبس الأرجل بزاوية آمنة (Leg Press Machine)',
      reason: 'إلغاء التحميل الرأسي على الفقرات القطنية'
    });
    exerciseSwaps.push({
      contraindicated: 'رفعة ميتة بالبار (Deadlift)',
      safe_alternative: isHome ? 'جلوت بريدج (Glute Bridge)' : 'هيب ثرست بالبار (Barbell Hip Thrust)',
      reason: 'استهداف السلسلة الخلفية بدون عزم دوران على أسفل الظهر'
    });
    exerciseSwaps.push({
      contraindicated: 'تجديف بالبار منحنياً (Barbell Bent-Over Row)',
      safe_alternative: isHome ? 'تجديف بذراع واحدة بالدمبل مدعوماً (One-Arm DB Row)' : 'تجديف مدعوم الصدر بالجهاز (Chest-Supported Row)',
      reason: 'حماية عضلات أسفل الظهر من الإجهاد الإيزومتري المجهد'
    });
  }

  // B. Knee Joint Injury
  if (rawAreas.some(a => a.includes('knee'))) {
    jointRestrictions.push({
      joint: 'مفصل الركبة والرباط الصليبي',
      risk_mechanism: 'قوى القص الأمامية وثني الركبة الحاد تحت وزن حر',
      directive_ar: 'استبعاد الطعنات الحركية والسكوات العميق والهاك سكوات، واستبدالها بحركات السلسلة المغلقة المستقرة.'
    });
    exerciseSwaps.push({
      contraindicated: 'طعنات المشي بالدمبل (Walking Lunges)',
      safe_alternative: isHome ? 'جلوت بريدج أرضي' : 'هيب ثرست بالجهاز أو المكبس الآمن',
      reason: 'إلغاء قوى القص المفاجئة على صابونة وأربطة الركبة'
    });
    exerciseSwaps.push({
      contraindicated: 'سكوات عميق / هاك سكوات (Hack Squat)',
      safe_alternative: isHome ? 'جوبلت سكوات بمدى آمن' : 'مكبس أرجل بوضع قدمين مرتفع (High-Foot Leg Press)',
      reason: 'توزيع الحمل على عضلات الفخذ والمقعدة دون إجهاد أوتار الركبة'
    });
  }

  // C. Shoulder Joint Injury
  if (rawAreas.some(a => a.includes('shoulder') || a.includes('cuff'))) {
    jointRestrictions.push({
      joint: 'مفصل الكتف والكفة المدورة',
      risk_mechanism: 'الانضغاط تحت الأخرمي وفرط التمدد الأفقي بالبار',
      directive_ar: 'استبعاد ضغط البنش بالبار وضغط الكتف الرأسي بالبار، مع تفعيل الدوران الخارجي وضغط الدمبل الأرضي.'
    });
    exerciseSwaps.push({
      contraindicated: 'ضغط صدر بالبار المستوي (Barbell Bench Press)',
      safe_alternative: isHome ? 'ضغط صدر أرضي بالدمبل (DB Floor Press)' : 'ضغط صدر بالجهاز المقيد (Machine Chest Press)',
      reason: 'حماية المحفظة الأمامية للكتف ومنع فرط الامتداد'
    });
    exerciseSwaps.push({
      contraindicated: 'ضغط كتف رأسي بالبار (Overhead Barbell Press)',
      safe_alternative: 'دوران خارجي للكفة المدورة بالكيبل / حبل المقاومة (Rotator Cuff External Rotation)',
      reason: 'تجنب اختناق أوتار الكتف وتقوية العضلات المثبتة'
    });
  }

  // D. Core / Abdominal Wall Injury
  if (rawAreas.some(a => a.includes('core') || a.includes('hernia') || a.includes('diastasis'))) {
    jointRestrictions.push({
      joint: 'الجدار البطني وأسفل البطن',
      risk_mechanism: 'ارتفاع الضغط داخل البطن وقوى الانثناء المباشرة',
      directive_ar: 'استبعاد طحن البطن العنيف والتركيز على الثبات المضاد للتمدد (Anti-Extension).'
    });
    exerciseSwaps.push({
      contraindicated: 'طحن البطن المائل / المعكوس (Decline Crunch)',
      safe_alternative: 'تمرين الحشرة الميتة (Dead Bug) وتثبيت البلانك المعدل',
      reason: 'تفعيل الجدار الداخلي للبطن دون ضغط على الفتق أو الانفصال'
    });
  }

  // 5. Strict Allergies & Fasting Exclusions
  const strictAllergies = Array.isArray(answers.strict_allergies)
    ? answers.strict_allergies.filter(a => a && a !== 'none')
    : [];

  const excludedFoods = [];
  const ALLERGY_LABELS_AR = {
    eggs: 'البيض ومنتجاته',
    dairy_lactose: 'الألبان والأجبان واللاكتوز',
    gluten_celiac: 'القمح والجلوتين وحبوب السيلياك',
    peanuts_tree_nuts: 'الفول السوداني والمكسرات',
    fish_shellfish: 'الأسماك والقشريات البحرية',
    soy: 'فول الصويا ومشتقاته',
    sesame_seeds: 'السمسم والطحينة والحلويات الطحينية',
    favism_g6pd: 'الفول والبقوليات الحبة الكاملة (أنيميا الفول)',
    strawberries_berries: 'الفراولة والتوتيات',
    tropical_fruits_mango: 'المانجو والكيوي والفواكه الاستوائية'
  };

  strictAllergies.forEach(code => {
    if (ALLERGY_LABELS_AR[code]) {
      excludedFoods.push(ALLERGY_LABELS_AR[code]);
    }
  });

  // Fasting Profile
  const religion = String(answers.religion || '').toUpperCase();
  const christianStyle = String(answers.christianFastingStyle || '').toUpperCase();
  let fastingLabel = 'نظام تغذية اعتيادي';

  if (religion === 'MUSLIM' || answers.is_ramadan) {
    fastingLabel = 'صيام رمضان المبارك (وجبات ليلية مكثفة)';
  } else if (religion === 'CHRISTIAN' || christianStyle) {
    fastingLabel = christianStyle === 'STRICT_VEGAN'
      ? 'صيام مسيحي نباتي صرف (Strict Vegan)'
      : 'صيام مسيحي نباتي مع أسماك (Pescatarian)';
  }

  return {
    client_name: answers.personal?.firstName || answers.full_name || 'مشترك جديد',
    client_code: answers.client_code || answers.id || '',
    is_ready_for_draft: weight > 30 && height > 100,
    biometrics: {
      weight_kg: weight,
      height_cm: height,
      age: age,
      is_male: isMale,
      bmi: bmi
    },
    targets: {
      effective_goal_label: effectiveGoalLabel,
      bmr: bmr,
      tdee: tdee,
      calories: targetCalories,
      protein_g: proteinG,
      carbs_g: carbsG,
      fats_g: fatG
    },
    has_injuries: hasInjuries,
    joint_restrictions: jointRestrictions,
    exercise_swaps: exerciseSwaps,
    has_medical_conditions: selectedConditions.length > 0,
    clinical_alerts: clinicalAlerts,
    nutritional_directives: nutritionalDirectives,
    strict_allergies: excludedFoods,
    fasting_mode: fastingLabel,
    precaution_summary_ar: hasInjuries || selectedConditions.length > 0
      ? `تم رصد ${jointRestrictions.length} محاذير حركية و${clinicalAlerts.length} ضوابط سريرية؛ المحرك مجهز لاستبدال التمارين المجهدة وتعديل الماكروز فوراً.`
      : 'لا توجد إصابات أو موانع طبية مسجلة؛ المشترك مؤهل للبرنامج التدريبي والغذائي الكامل دون قيود استثنائية.'
  };
}
