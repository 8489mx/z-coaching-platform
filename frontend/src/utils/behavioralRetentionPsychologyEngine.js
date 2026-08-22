/**
 * Behavioral Retention, Clinical Communication & Psychology Engine
 * المحور الرابع: هندسة سلوك المتدرب، التواصل الإكلينيكي الذكي، ومضاعفة معدل تجديد الاشتراكات
 * Pure Deterministic Behavioral, Retention & Communication Logic
 * Zero External Dependencies
 */

// 1. إطار هيكلة الرد على المتابعات الأسبوعية (The 4-Step Clinical Feedback Framework)
export function compileFourStepFeedback({
  clientName = 'يا بطل',
  microWin,
  physiologicalWhy,
  actionableDirective,
  psychologicalReassurance
}) {
  const step1 = microWin || 'عاش يا بطل، التزامك بالأوزان والتمارين هذا الأسبوع كان ممتازاً ومؤشراً قوياً على بناء القوة.';
  const step2 = physiologicalWhy || 'تغيرات القياسات طبيعية تماماً ومطابقة لنمط استجابة جسمك في هذه المرحلة.';
  const step3 = actionableDirective || 'الخطة للأسبوع الجديد: الاستمرار بنفس السعرات والماكروز مع التركيز على زيادة تكرار إضافي في التمارين.';
  const step4 = psychologicalReassurance || 'ملتزمين بالخطة حرفياً، ومستني أشوف أداءك المميز في تمرين الغد. أسبوع قوي يا وحش!';

  const fullText = [
    `[توثيق الإنجاز]: ${step1}`,
    `[التحليل الفسيولوجي]: ${step2}`,
    `[التوجيه التنفيذي]: ${step3}`,
    `[التثبيت النفسي]: ${step4}`
  ].join('\n\n');

  return {
    client_name: clientName,
    step_1_micro_win: step1,
    step_2_physiological_why: step2,
    step_3_actionable_directive: step3,
    step_4_psychological_reassurance: step4,
    formatted_feedback_text: fullText,
    estimated_audio_duration_seconds: 75
  };
}

// 2. رادار التدخل المبكر لمنع انسحاب المشتركين (Pre-Churn Warning System)
export function evaluatePreChurnSignals({
  consecutiveInactiveDays = 0,
  checkinWordCount = 20,
  lowSleepEnergyStreakDays = 0
}) {
  const flags = [];

  // إشارة 1: غياب عن التسجيل 3 أيام متتالية
  if (consecutiveInactiveDays >= 3) {
    flags.push({
      signal_type: 'INACTIVITY_3_DAYS',
      severity: 'HIGH_RISK',
      psychological_meaning_ar: 'بداية فقدان الشغف أو مواجهة ضغط عمل مفاجئ.',
      recommended_action_ar: 'إطلاق رسالة دعم ودية وسريعة لتعديل الجدول واختصار مدة التمرين إلى 30 دقيقة منعاً للانقطاع الكامل.',
      trigger_script_type: 'RE_ENGAGEMENT_TOUCHPOINT'
    });
  }

  // إشارة 2: إجابات التشك إن مقتضبة جداً (أقل من 6 كلمات)
  if (checkinWordCount < 6) {
    flags.push({
      signal_type: 'TERSE_CHECKIN_ANSWERS',
      severity: 'MEDIUM_RISK',
      psychological_meaning_ar: 'تسرب الملل وغياب الدافع الداخلي للمتابعة.',
      recommended_action_ar: 'طلب فيديو لآخر جولة تمرين لتصحيح التكنيك وإعادة إشعال الحماس التفاعلي.',
      trigger_script_type: 'VIDEO_CHECK_REQUEST'
    });
  }

  // إشارة 3: هبوط النوم والطاقة لـ 5 أيام متتالية
  if (lowSleepEnergyStreakDays >= 5) {
    flags.push({
      signal_type: 'CHRONIC_LOW_SLEEP_ENERGY_5_DAYS',
      severity: 'CRITICAL_RISK',
      psychological_meaning_ar: 'إجهاد عصبي تراكمي وإحباط من الالتزام تحت الضغط.',
      recommended_action_ar: 'تفعيل يوم ريفيد نظيف فوري دون انتظار موعد المتابعة الأسبوعية لخفض الكورتيزول واستعادة النشاط.',
      trigger_script_type: 'EMERGENCY_REFEED_DISPATCH'
    });
  }

  const isAtRisk = flags.length > 0;

  return {
    is_at_risk: isAtRisk,
    risk_level: flags.some((f) => f.severity === 'CRITICAL_RISK')
      ? 'CRITICAL'
      : flags.some((f) => f.severity === 'HIGH_RISK')
      ? 'HIGH'
      : isAtRisk
      ? 'MODERATE'
      : 'HEALTHY',
    detected_flags_count: flags.length,
    detected_flags: flags
  };
}

// 3. هندسة رسائل التجديد المعتمدة على خارطة الطريق (Roadmap-Based Renewal)
export function generateRoadmapRenewalScript({
  clientName = 'يا بطل',
  daysRemaining = 3,
  monthlyMilestones = 'نزول 4 كجم دهون وزيادة القوة بنسبة 20%',
  nextPhaseGoal = 'تفصيل وتقسيم العضلات ورفع أوزان الدفع'
}) {
  if (daysRemaining > 3 && daysRemaining <= 5) {
    return {
      stage: 'RADAR_1_MILESTONE_CELEBRATION',
      days_remaining: daysRemaining,
      subject_ar: 'مراجعة إنجاز الشهر وإعداد المرحلة القادمة',
      message_ar: `عاش يا ${clientName}! بنهاية الشهر الحالي حققنا إنجازاً ملموساً (${monthlyMilestones}). جهز نفسك للمرحلة القادمة لنقل لياقتك لمستوى أعلى تماماً.`
    };
  }

  if (daysRemaining <= 3 && daysRemaining > 0) {
    return {
      stage: 'RADAR_2_SEAT_RESERVATION_ROADMAP',
      days_remaining: daysRemaining,
      subject_ar: 'حجز مقعد الشهر الجديد ومتابعة خارطة الطريق',
      message_ar: `عاش يا ${clientName}! حققنا الهدف المطلوب في مرحلة التأسيس بنجاح. المرحلة القادمة (Phase 2): هنركز على ${nextPhaseGoal}. أنا بجهز مقاعد المشتركين للشهر الجديد، جهزت لك مكانك عشان نكمل التطور بدون أي انقطاع؟`
    };
  }

  return {
    stage: 'EXPIRATION_DAY_ACTION',
    days_remaining: 0,
    subject_ar: 'تأكيد تجديد الاشتراك وتفعيل التطبيق',
    message_ar: `صباح الخير يا ${clientName}، اليوم هو موعد تجديد اشتراكك لمواصلة رحلة التطور. تم تجهيز خطتك الجديدة بالكامل؛ يُرجى تأكيد التحويل للاستمرار في متابعة تمارينك ووجباتك على التطبيق دون توقف.`
  };
}

// 4. سيكولوجية إدارة الانتكاسات وقاعدة عدم تفويت يومين (The "Never Miss Twice" Protocol)
export function handleBingeRelapseRecovery({
  bingeMealsCount = 1,
  missedWorkoutDays = 1
}) {
  return {
    strategy: 'ANTI_GUILT_NEXT_MEAL_RESET',
    guilt_free_policy_ar: 'إلغاء مشاعر الذنب تماماً: لا عقاب، لا زيادة كارديو انتقامية لتعويض الأكل، ولا تجويع في اليوم التالي.',
    next_meal_rule_ar: 'العودة الفورية للخطة في الوجبة التالية مباشرة دون أي تقليل في السعرات.',
    never_miss_twice_rule_ar: missedWorkoutDays >= 1
      ? 'مسموح بيوم غياب واحد لظرف طارئ، لكن يُمنع تماماً تفويت يومين متتاليين؛ حتى لو كان البديل تمرين 15 دقيقة فقط في المنزل.'
      : 'استمرارية ممتازة، لا يوجد تفويت متتالٍ.',
    coaching_cue_ar: 'الاستمرارية والانضباط طويل المدى هو ما يصنع النتائج، وليس مثالية أسبوع واحد.'
  };
}

// 5. مكتبة قوالب رسائل الواتساب الجاهزة للأتمتة (Plug-and-Play WhatsApp Scripts Matrix)
export const WHATSAPP_TEMPLATES = {
  DAY_1_ONBOARDING_KICKOFF: {
    title_ar: 'رسالة الترحيب والانطلاق (Day 1)',
    template: (name, appUrl = 'https://zcoaching.com/app') =>
      `أهلاً بك يا ${name} في منظومتك التدريبية المتكاملة!\n\nتم رفع خطتك المخصصة بالكامل على التطبيق:\n${appUrl}\n\nالسعرات والماكروز تم ضبطها بالمللي بناءً على قياساتك، وجدول التمرين مدعم بفيديوهات الشرح والتكنيك لكل حركة.\n\nخطوتنا الأولى: شاهد تمرين اليوم واقرأ كروت الوجبات، وتذكر: الالتزام هو مفتاح النتيجة. يلا نبدأ رحلة التغيير الحقيقي!`
  },
  SCALE_STALL_REASSURANCE: {
    title_ar: 'رسالة كسر ثبات الميزان والاطمئنان',
    template: (name) =>
      `صباح الخير يا ${name}!\n\nشفت قياسات التشك إن اليوم، وعايزك تطمن تماماً: ثبات رقم الميزان مع نزول الخصر معناه إن جسمك بيمر بعملية إعادة تشكيل (Body Recomposition) احترافية؛ الدهون بتنزل والعضلات بتتشبع بالماء والجليكوجين.\n\nمستمرون بنفس السعرات، وجسمك هيفرغ المية دي فجأة في الميزان الجاي. خلي تركيزك كله في أوزان الجيم اليوم!`
  },
  RE_ENGAGEMENT_TOUCHPOINT: {
    title_ar: 'رسالة استعادة المتدرب المنقطع',
    template: (name) =>
      `طمني عليك يا ${name}، لاحظت غيابك عن تسجيل التمارين في التطبيق بقالك يومين.\n\nلو في أي ضغط شغل أو إرهاق مفيش مشكلة تماماً، هدفنا الاستمرارية مش المثالية.\n\nكلمنا وخلينا نعدل أوقات التمرين للأيام الجاية بما يناسب ظروفك الحالية.`
  }
};

export function getPlugAndPlayWhatsAppScript({
  scriptType = 'DAY_1_ONBOARDING_KICKOFF',
  clientName = 'يا بطل',
  customParam = ''
}) {
  const tmpl = WHATSAPP_TEMPLATES[scriptType];
  if (!tmpl) {
    return {
      success: false,
      message_ar: 'نوع القالب غير موجود.'
    };
  }

  const messageText = tmpl.template(clientName, customParam);
  const encodedUrl = `https://wa.me/?text=${encodeURIComponent(messageText)}`;

  return {
    success: true,
    script_type: scriptType,
    title_ar: tmpl.title_ar,
    message_text: messageText,
    whatsapp_direct_url: encodedUrl
  };
}
