/**
 * Scale Truth, Physiological Deception, Fluid Retention & Clinical Adjustment Engine
 * المحور الثالث: فنيات قراءة الميزان، كشف الخداع الفسيولوجي واحتباس السوائل، وقرارات التعديل الإكلينيكي
 * Pure Deterministic Clinical & Metabolic Logic
 * Zero External Dependencies
 */

// 1. شجرة القرار الحتمية للمتابعة الأسبوعية (Scale vs. Waist Truth Matrix)
export function evaluateWeeklyScaleAndWaistTruth({
  weightDeltaKg = 0,
  waistDeltaCm = 0,
  adherencePct = 100,
  consecutiveStallsCount = 0,
  currentCalories = 1800,
  gender = 'MALE',
  isPMSWeek = false,
  stallDurationDays = 7
}) {
  const isMale = String(gender).toUpperCase() === 'MALE';
  const calorieFloor = isMale ? 1600 : 1300;

  // 1. جدار الحماية الهرموني للمتدربات (Female Menstrual Cycle Firewall)
  if (!isMale && isPMSWeek) {
    return {
      decision: 'MENSTRUAL_PMS_HOLD',
      action_type: 'CARB_BUFFER_LOCK',
      calorie_adjustment: 0,
      new_calories: currentCalories,
      calorie_lock: true,
      carb_buffer_added_g: 25,
      diagnosis_ar: 'احتباس سوائل هرموني ناتج عن المرحلة اللوتينية (PMS/Luteal Phase).',
      rationale_ar: 'قفل تلقائي حتمي: يمنع النظام خفض السعرات تماماً لتفادي تدمير الحرق. تم تجاهل زيادة الميزان كاحتباس ماء مؤقت وإضافة 25 جم كارب معقد لتهدئة الشراهة ودعم هرمون السيروتونين.',
      client_message_ar: 'جسمك يمر بتغيرات هرمونية طبيعية تحبس من 1 إلى 2.5 كجم ماء مؤقتاً؛ ثبتنا سعراتك بالكامل مع إضافة كارب نقي لتثبيت طاقتك ومزاجك.'
    };
  }

  // 2. حالة إعادة تشكيل الجسم المثالية (Recomposition: خصر نازل مع ثبات/زيادة الميزان)
  if (weightDeltaKg >= -0.1 && waistDeltaCm <= -1.0 && adherencePct >= 85) {
    return {
      decision: 'RECOMPOSITION_CONFIRMED',
      action_type: 'MAINTAIN_CURRENT_PLAN',
      calorie_adjustment: 0,
      new_calories: currentCalories,
      calorie_lock: true,
      diagnosis_ar: 'إعادة تشكيل جسم أسطورية (Recomposition): حرق دهون حشوية متزامن مع ملء جليكوجين عضلي واحتباس ماء تدريبي.',
      rationale_ar: 'تثبيت السعرات 100% وحظر خفض أي جرام كاربوهيدرات؛ الخصر هو الدليل القطعي على حرق الدهون الصريحة.',
      client_message_ar: 'أداء أسطوري! جسمك حرق دهون صريحة من محيط الخصر وبنى أليافاً عضلية مشدودة بالماء؛ مقاس الخصر هو دليلك الحقيقي وليس رقم الميزان.'
    };
  }

  // 3. حالة النزول السريع الحاد الخطر (Rapid Loss Muscle Wasting Hazard)
  if (weightDeltaKg < -1.5 && adherencePct >= 85) {
    const calorieBump = 125;
    return {
      decision: 'RAPID_LOSS_BUFFER',
      action_type: 'INCREASE_CALORIES',
      calorie_adjustment: calorieBump,
      new_calories: currentCalories + calorieBump,
      diagnosis_ar: 'نزول سريع يتجاوز المعدل الصحي الآمن (> 1.5 كجم/أسبوع)؛ خطر هدم عضلي وهبوط معدل الأيض.',
      rationale_ar: 'رفع السعرات طفيفاً (+125 Kcal) لإبطاء وتيرة النزول للمعدل المستدام (0.5% - 1.0% أسبوعياً) وحماية الكتلة العضلية.',
      client_message_ar: 'النزول ممتاز وسريع! رفعنا السعرات بنسبة بسيطة (+125 سعرة) لحماية كتلتك العضلية وضمان استمرار حرق الدهون بنشاط وقوة.'
    };
  }

  // 4. فحص ظاهرة الووش (The Whoosh Effect) لثبات الميزان القصير (أقل من 10 أيام مع التزام عالي)
  if (Math.abs(weightDeltaKg) <= 0.2 && Math.abs(waistDeltaCm) <= 0.5 && adherencePct >= 90 && stallDurationDays <= 10 && consecutiveStallsCount < 2) {
    return {
      decision: 'WHOOSH_WATER_HOLD',
      action_type: 'MAINTAIN_AND_CALM_CORTISOL',
      calorie_adjustment: 0,
      new_calories: currentCalories,
      diagnosis_ar: 'ظاهرة امتلاء الخلايا الدهنية بالماء (The Whoosh Effect): الخلايا تفرغ الدهون وتحتفظ بالماء مؤقتاً.',
      rationale_ar: 'حظر التسرع بخفض السعرات لتفادي رفع هرمون الكورتيزول الذي يزيد احتباس الماء؛ الميزان سيهبط فجأة في ليلة واحدة بعد اكتمال الدورة.',
      client_message_ar: 'جسمك في مرحلة (Whoosh Effect) يحبس ماء مؤقتاً داخل الخلايا الدهنية بعد حرق الدهون؛ استمر بنفس الخطة وسترى هبوطاً مفاجئاً قريباً.'
    };
  }

  // 5. حالة الثبات الحقيقي والتكيف الأيضي (Confirmed Plateau >= 2 weeks & >= 90% adherence)
  if (Math.abs(weightDeltaKg) <= 0.2 && Math.abs(waistDeltaCm) <= 0.5 && adherencePct >= 90 && consecutiveStallsCount >= 2) {
    // المفاضلة الهندسية: خفض الأكل أم زيادة النشاط؟
    if (currentCalories <= calorieFloor) {
      return {
        decision: 'TRUE_PLATEAU_ACTIVITY_BOOST',
        action_type: 'INCREASE_NEAT_STEPS',
        calorie_adjustment: 0,
        new_calories: currentCalories,
        recommended_step_increase: 2000,
        recommended_cardio_minutes: 15,
        diagnosis_ar: 'ثبات حقيقي مع بلوغ السعرات السقف الأدنى للسلامة الأيضية.',
        rationale_ar: 'المسار A: زيادة النشاط الحركي (+2000 خطوة يومياً أو 15 دقيقة Zone 2) مع حظر تقليص السعرات لحماية هرمونات الغدة الدرقية.',
        client_message_ar: 'سعراتك الحالية في الحد الأدنى الممتاز للحفاظ على طاقتك؛ سنكسر الثبات بزيادة 2,000 خطوة يومياً دون تقليل جرام واحد من طعامك.'
      };
    } else {
      const carbCutGrams = 35;
      const calorieDrop = carbCutGrams * 4; // 140 Kcal
      return {
        decision: 'TRUE_PLATEAU_CARB_TITRATION',
        action_type: 'CUT_CARBS_DEFICIT',
        calorie_adjustment: -calorieDrop,
        new_calories: currentCalories - calorieDrop,
        carb_cut_grams: carbCutGrams,
        diagnosis_ar: 'ثبات حقيقي وتكيف أيضي: السعرات الحالية أصبحت تعادل نقطة الصيانة الجديدة.',
        rationale_ar: 'المسار B: تقليص 35 جم كاربوهيدرات من وجبة العشاء (-140 Kcal) مع تثبيت البروتين والدهون الصحية بالكامل.',
        client_message_ar: 'جسمك تأقلم بنجاح على المرحلة السابقة. طبقنا تعديلاً ذكياً بتقليص بسيط في الكاربوهيدرات لكسر الثبات وإعادة تسريع الحرق.'
      };
    }
  }

  // 6. حالة الخلل في الالتزام والسعرات غير المسجلة (Non-Compliance < 70%)
  if (adherencePct < 70) {
    return {
      decision: 'AUDIT_NON_COMPLIANCE',
      action_type: 'AUDIT_ALERT_MAINTAIN_CALORIES',
      calorie_adjustment: 0,
      new_calories: currentCalories,
      diagnosis_ar: 'خلل في الالتزام وسعرات خفية غير مسجلة (Non-Compliance).',
      rationale_ar: 'حظر خفض السعرات: المشكلة ليست في بطء الحرق بل في السناكس غير المحسوبة؛ تقليل السعرات هنا سيؤدي لانفجار الشراهة.',
      client_message_ar: 'سعراتك الحالية كافية جداً للتنشيف؛ الثبات ناتج عن الوجبات غير المسجلة. لن نخفض سعراتك بل سنركز على الالتزام 100% هذا الأسبوع.'
    };
  }

  // 7. النزول الطبيعي المتوازن (Healthy Sustainable Progress)
  return {
    decision: 'PROGRESS_ON_TRACK',
    action_type: 'MAINTAIN_CURRENT_PLAN',
    calorie_adjustment: 0,
    new_calories: currentCalories,
    diagnosis_ar: 'تقدم مثالي ومستدام في حرق الدهون وحفظ العضلات.',
    rationale_ar: 'الاستمرار بنفس الخطة والسعرات؛ الجسم يستجيب بأفضل صورة فسيولوجية.',
    client_message_ar: 'استمر يا بطل بنفس الخطة والتركيز، تقدمك يسير في المسار الصحي المثالي.'
  };
}

// 2. بروتوكول تدقيق معايير القياسات المعيارية (Standardized Measurement Checklist)
export function validateCheckinMeasurementStandards({
  isMorningPostWakeup = true,
  isFastedAndPostBathroom = true,
  isConsistentMinimalClothing = true,
  isNavelLevelParallelTape = true
}) {
  const violations = [];

  if (!isMorningPostWakeup) {
    violations.push('القياس يجب أن يكون صباحاً فور الاستيقاظ مباشرة.');
  }
  if (!isFastedAndPostBathroom) {
    violations.push('القياس يجب أن يكون بعد استخدام الحمام وقبل شرب أي ماء أو تناول طعام.');
  }
  if (!isConsistentMinimalClothing) {
    violations.push('الوزن يجب أن يكون بأقل ملابس ممكنة ونفس الملابس أسبوعياً.');
  }
  if (!isNavelLevelParallelTape) {
    violations.push('المازورة يجب أن تمر بمنتصف السرة موازية للأرض دون كتم التنفس.');
  }

  const isValid = violations.length === 0;

  return {
    is_valid_standard: isValid,
    status: isValid ? 'STANDARDS_MET' : 'STANDARDS_VIOLATED',
    violations_count: violations.length,
    violations_ar: violations,
    message_ar: isValid
      ? 'تم استيفاء كافة الشروط المعيارية لدقة القياسات.'
      : 'يُرجى إعادة أخذ القياسات وفق الشروط الصارمة لضمان صحة قرار النظام الأوتوماتيكي.'
  };
}
