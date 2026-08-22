import crypto from 'crypto';
import { EXPANDED_EXERCISE_CATALOG } from '../constants/exercise-catalog.js';

const SECRET_KEY = process.env.INTAKE_JWT_SECRET || 'antigravity_master_clinical_intake_secret_2026_jwt_fallback';

export const SUPPORTED_PACKAGES = {
  MAX_3_PLUS_1: {
    code: 'MAX_3_PLUS_1',
    id: 'MAX_3_PLUS_1',
    name_ar: 'باقة ماكس للتحول الشامل (Max 3+1)',
    tier: 'MAX',
    duration_months: 4,
    price_egp: 2800,
    price_usd: 95,
    features: ['متابعة يومية عبر الواتساب', 'خطة تغذية مخصصة وتعديل دوري', 'برنامج تدريبي كامل للجيم والبيت', 'تحليل مقاطع الفيديو والتكنيك']
  },
  ELITE_3_PLUS_1: {
    code: 'ELITE_3_PLUS_1',
    id: 'ELITE_3_PLUS_1',
    name_ar: 'باقة إيليت الاحترافية (Elite 3+1)',
    tier: 'ELITE',
    duration_months: 4,
    price_egp: 3500,
    price_usd: 120,
    features: ['متابعة VIP وتدريب شخصي مخصص', 'تعديل فوري للماكروز', 'تحليل حركي متقدم']
  },
  TRANSFORMATION_VIP: {
    code: 'TRANSFORMATION_VIP',
    id: 'TRANSFORMATION_VIP',
    name_ar: 'الباقة البلاتينية للتحول الشامل (VIP Transformation)',
    tier: 'VIP',
    duration_months: 3,
    price_egp: 2800,
    price_usd: 95,
    features: ['متابعة يومية عبر الواتساب', 'خطة تغذية مخصصة وتعديل دوري', 'برنامج تدريبي كامل للجيم والبيت', 'تحليل مقاطع الفيديو والتكنيك']
  },
  FAT_LOSS_EXTREME: {
    code: 'FAT_LOSS_EXTREME',
    id: 'FAT_LOSS_EXTREME',
    name_ar: 'باقة حرق الدهون ونحت القوام (Fat Loss Protocol)',
    tier: 'FAT_LOSS',
    duration_months: 2,
    price_egp: 1900,
    price_usd: 65,
    features: ['متابعة أسبوعية دقيقة', 'خطة عجز سعرات ذكية وبنك سعرات', 'مصفوفة التبديل الغذائي']
  },
  LEAN_BULK_POWER: {
    code: 'LEAN_BULK_POWER',
    id: 'LEAN_BULK_POWER',
    name_ar: 'باقة الضخامة النظيفة والقوة (Hypertrophy Pro)',
    tier: 'BULK',
    duration_months: 3,
    price_egp: 2600,
    price_usd: 90,
    features: ['فائض سعرات محسوب للبناء الصافي', 'تدرج أحمال أسبوعي بمحرك الأوفرلود', 'بروتوكول الديلود الوقائي']
  }
};

export const PAYMENT_METHODS = {
  VODAFONE_CASH: 'VODAFONE_CASH',
  INSTAPAY: 'INSTAPAY',
  STRIPE_CARD: 'STRIPE_CARD'
};

export function generateSecureIntakeToken({
  client_name,
  client_phone,
  client_email,
  package_code,
  package_id,
  payment_method,
  payment_reference,
  expires_in_hours = 72
}) {
  if (!client_name) {
    throw new Error('Client name is required to issue an intake token.');
  }

  const pkgKey = package_code || package_id || 'MAX_3_PLUS_1';
  const selectedPkg = SUPPORTED_PACKAGES[pkgKey] || SUPPORTED_PACKAGES.MAX_3_PLUS_1;
  const expiresAt = new Date(Date.now() + (expires_in_hours * 60 * 60 * 1000));

  const payload = {
    client_name,
    client_phone: client_phone || '',
    client_email: client_email || '',
    package_code: selectedPkg.code,
    package_tier: selectedPkg.tier,
    payment_method: payment_method || 'INSTAPAY',
    payment_reference: payment_reference || '',
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString()
  };

  const payloadString = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(payloadString).digest('hex');
  const encodedPayload = Buffer.from(payloadString).toString('base64url');
  const token = `zcc_${encodedPayload}.${signature}`;

  const intakeUrl = `https://zcoaching.app/intake?token=${token}`;

  const cleanPhone = String(client_phone || '').replace(/[^0-9]/g, '');
  const normalizedPhone = cleanPhone.startsWith('20')
    ? cleanPhone
    : (cleanPhone.startsWith('0') ? '20' + cleanPhone.substring(1) : (cleanPhone ? '20' + cleanPhone : '201011111110'));

  const welcomeMessageAr = `أهلاً بك يا ${client_name} في عائلة Z Coaching مع كابتن كريم زكريا! 🚀\n\nتم تأكيد اشتراكك في ${selectedPkg.name_ar}.\nالخطوة الأولى والأهم هي ملء استمارة الدخول الطبية والتدريبية لتجهيز برنامجك بدقة عبر الرابط المخصص لك:\n${intakeUrl}\n\n(صلاحية الرابط 72 ساعة فقط). ننتظر بياناتك للانطلاق!`;

  return {
    success: true,
    token,
    intake_url: intakeUrl,
    package_details: selectedPkg,
    expires_at: expiresAt.toISOString(),
    whatsapp_dispatch_url: `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(welcomeMessageAr)}`,
    welcome_message_ar: welcomeMessageAr
  };
}

export function validateIntakeToken(tokenString) {
  if (!tokenString || !tokenString.startsWith('zcc_')) {
    return { valid: false, reason: 'INVALID_FORMAT', reason_ar: 'رمز الاستمارة غير صالح أو تالف.', message_ar: 'رمز الاستمارة غير صالح أو تالف.' };
  }

  try {
    const rawToken = tokenString.replace('zcc_', '');
    const [encodedPayload, providedSignature] = rawToken.split('.');

    if (!encodedPayload || !providedSignature) {
      return { valid: false, reason: 'MALFORMED_TOKEN', reason_ar: 'هيكل الرمز غير مكتمل.', message_ar: 'هيكل الرمز غير مكتمل.' };
    }

    const payloadString = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(payloadString).digest('hex');

    if (providedSignature !== expectedSignature) {
      return { valid: false, reason: 'SIGNATURE_MISMATCH', reason_ar: 'فشل التحقق الأمني من الرمز، قد يكون تم التلاعب به.', message_ar: 'فشل التحقق الأمني من الرمز، قد يكون تم التلاعب به.' };
    }

    const payload = JSON.parse(payloadString);
    const now = new Date();
    const expiry = new Date(payload.expires_at);

    if (now > expiry) {
      return { valid: false, reason: 'TOKEN_EXPIRED', reason_ar: 'عذراً، انتهت صلاحية هذا الرابط (72 ساعة). يرجى طلب رابط جديد من المدرب.', message_ar: 'عذراً، انتهت صلاحية هذا الرابط (72 ساعة).' };
    }

    return {
      valid: true,
      entitlement: payload,
      payload,
      reason_ar: 'الرمز صالح ومؤكد أمنياً.',
      message_ar: 'الرمز صالح ومؤكد أمنياً.'
    };
  } catch (err) {
    return { valid: false, reason: 'DECODE_ERROR', reason_ar: 'حدث خطأ أثناء فك تشفير الرمز.', error: err.message, message_ar: 'حدث خطأ أثناء فك تشفير الرمز.' };
  }
}

export function generateInitialPlan({
  name,
  gender = 'MALE',
  age,
  weightKg,
  heightCm,
  activityLevel = 'SEDENTARY',
  goal = 'FAT_LOSS',
  trainingDaysPerWeek = 4,
  environment = 'GYM',
  medicalFlags = [],
  splitPreference = 'AUTO'
}) {
  if (!weightKg || !heightCm || !age) {
    throw new Error('Weight, height, and age are required for baseline calculations.');
  }

  const isMale = gender.toUpperCase() === 'MALE';
  let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  bmr = isMale ? bmr + 5 : bmr - 161;

  const activityMultipliers = { SEDENTARY: 1.2, LIGHT: 1.375, MODERATE: 1.55, HEAVY: 1.725 };
  const multiplier = activityMultipliers[activityLevel.toUpperCase()] || 1.2;
  const tdee = Math.round(bmr * multiplier);

  let targetCalories = tdee;
  if (goal === 'FAT_LOSS') targetCalories = Math.round(tdee * 0.78);
  else if (goal === 'AGGRESSIVE_CUT') targetCalories = Math.round(tdee * 0.70);
  else if (goal === 'LEAN_BULK') targetCalories = Math.round(tdee * 1.10);

  const absoluteFloor = isMale ? 1500 : 1200;
  targetCalories = Math.max(absoluteFloor, targetCalories);

  const hasRenalIssue = medicalFlags.includes('RENAL_INSUFFICIENCY');
  let proteinRatio = goal === 'LEAN_BULK' ? 1.8 : 2.2;
  if (hasRenalIssue) proteinRatio = 1.1;

  const targetProteinGrams = Math.round(weightKg * proteinRatio);
  const proteinKcal = targetProteinGrams * 4;

  let targetFatGrams = Math.round(weightKg * 0.8);
  if ((targetFatGrams * 9) < (targetCalories * 0.20)) {
    targetFatGrams = Math.round((targetCalories * 0.20) / 9);
  }
  const fatKcal = targetFatGrams * 9;

  const remainingKcal = Math.max(0, targetCalories - (proteinKcal + fatKcal));
  const targetCarbGrams = Math.round(remainingKcal / 4);

  const isBeginnerEater = medicalFlags.includes('LOW_FIBER_DIET_HISTORY');
  const targetFiberGrams = isBeginnerEater ? 20 : Math.round((targetCalories / 1000) * 14);

  let trainingSplit = {
    id: 'upper_lower',
    name_ar: 'تقسيم علوي / سفلي',
    frequency: `${trainingDaysPerWeek} أيام أسبوعياً`,
    schedule_blueprint: [],
    focus_target_ar: 'توازن عام لكامل الجسم'
  };

  const pref = (splitPreference || 'AUTO').toUpperCase();

  if (pref === 'ARNOLD' || (pref === 'AUTO' && trainingDaysPerWeek === 6 && isMale)) {
    trainingSplit = {
      id: 'arnold_split',
      name_ar: 'التقسيم الكلاسيكي (Arnold Split 6x)',
      frequency: '6 أيام أسبوعياً',
      schedule_blueprint: ['صدر وظهر (A)', 'أكتاف وذراعين (A)', 'أرجل وبطن (A)', 'صدر وظهر (B)', 'أكتاف وذراعين (B)', 'أرجل وبطن (B)'],
      focus_target_ar: 'تركيز مكثف على نمو الذراعين والأكتاف وضخ الدم'
    };
  } else if (pref === 'UL_ARMS' || (pref === 'AUTO' && trainingDaysPerWeek === 5 && isMale)) {
    trainingSplit = {
      id: 'ul_arms_hybrid',
      name_ar: 'علوي / سفلي + ذراعين ونقاط ضعف (UL+A 5x)',
      frequency: '5 أيام أسبوعياً',
      schedule_blueprint: ['جسم علوي (A)', 'جسم سفلي (A)', 'جسم علوي (B)', 'جسم سفلي (B)', 'ذراعين وأكتاف جانبية وبطن'],
      focus_target_ar: 'تطور شامل مع استهداف نقاط الضعف دون إجهاد المفاصل'
    };
  } else if (pref === 'FEMALE_GLUTE' || (pref === 'AUTO' && !isMale && trainingDaysPerWeek >= 4)) {
    trainingSplit = {
      id: 'female_glute_specialized',
      name_ar: 'التقسيم المتخصص لأسفل الجسم والجلوتس (Glute-Hypertrophy Focus)',
      frequency: `${trainingDaysPerWeek} أيام أسبوعياً`,
      schedule_blueprint: trainingDaysPerWeek === 5
        ? ['جلوتس وهامسترينج', 'جسم علوي كامل وتناسق', 'جلوتس وكوادز', 'راحة واستشفاء', 'جلوتس ومؤخرة بتركيز كابل', 'عضلات الجذع والبطن وكارديو خفيف']
        : ['جلوتس وهامسترينج', 'جسم علوي كامل وتناسق', 'جلوتس وكوادز', 'جسم كامل مع تركيز جلوتس وبطن'],
      focus_target_ar: 'تشكيل ورفع عضلات الأرجل والجلوتس مع شد ورشاقة الخصر والظهر'
    };
  } else if (trainingDaysPerWeek === 2) {
    trainingSplit = {
      id: 'full_body_2x',
      name_ar: 'تمرين شامل مرتين أسبوعياً (Full Body 2x)',
      frequency: 'يومان أسبوعياً',
      schedule_blueprint: ['Full Body A', 'Full Body B'],
      focus_target_ar: 'كفاءة زمنية قصوى لأصحاب الانشغال الشديد'
    };
  } else if (trainingDaysPerWeek === 3) {
    trainingSplit = {
      id: 'full_body_3x',
      name_ar: 'تمرين شامل 3 أيام (Full Body 3x)',
      frequency: '3 أيام أسبوعياً',
      schedule_blueprint: ['Full Body A', 'Full Body B', 'Full Body C'],
      focus_target_ar: 'تحفيز مسارات البناء 3 مرات أسبوعياً'
    };
  } else if (trainingDaysPerWeek === 4) {
    trainingSplit = {
      id: 'upper_lower_4x',
      name_ar: 'تقسيم علوي / سفلي (Upper / Lower 4x)',
      frequency: '4 أيام أسبوعياً',
      schedule_blueprint: ['جسم علوي (A)', 'جسم سفلي (A)', 'جسم علوي (B)', 'جسم سفلي (B)'],
      focus_target_ar: 'الاستشفاء المثالي والبناء العضلي المتوازن'
    };
  } else {
    trainingSplit = {
      id: 'ppl_split',
      name_ar: 'دفع / سحب / أرجل (PPL Split)',
      frequency: `${trainingDaysPerWeek} أيام أسبوعياً`,
      schedule_blueprint: ['Push (دفع)', 'Pull (سحب)', 'Legs (أرجل)', 'Push (دفع)', 'Pull (سحب)', 'Legs (أرجل)'].slice(0, trainingDaysPerWeek),
      focus_target_ar: 'عزل المجموعات العضلية المترابطة'
    };
  }

  let recommendedExercises = [];
  if (Array.isArray(EXPANDED_EXERCISE_CATALOG)) {
    if (trainingSplit.id === 'arnold_split') {
      recommendedExercises = EXPANDED_EXERCISE_CATALOG.filter((e) =>
        ['arnold_pullover', 'bayesian_cable_curl', 'cross_body_triceps_ext', 'behind_back_lateral_raise'].includes(e.id)
      );
    } else if (trainingSplit.id === 'female_glute_specialized') {
      recommendedExercises = EXPANDED_EXERCISE_CATALOG.filter((e) =>
        e.target_muscle && e.target_muscle.includes('GLUTES')
      );
    } else if (trainingSplit.id === 'ul_arms_hybrid') {
      recommendedExercises = EXPANDED_EXERCISE_CATALOG.filter((e) =>
        ['bayesian_cable_curl', 'cross_body_triceps_ext', 'behind_back_lateral_raise'].includes(e.id)
      );
    } else {
      recommendedExercises = EXPANDED_EXERCISE_CATALOG.slice(0, 3);
    }
  }

  trainingSplit.recommended_exercises = recommendedExercises;

  return {
    client_name: name,
    bmr: Math.round(bmr),
    tdee,
    daily_targets: {
      calories: targetCalories,
      protein_grams: targetProteinGrams,
      carbs_grams: targetCarbGrams,
      fats_grams: targetFatGrams,
      fiber_grams: targetFiberGrams,
      target_fiber_g: targetFiberGrams,
      water_liters: +((weightKg * 0.04) + 0.5).toFixed(1)
    },
    training_split: { ...trainingSplit, environment },
    clinical_notes: hasRenalIssue ? ['تم خفض البروتين تلقائياً إلى 1.1 جم/كجم لحماية الكلى مع حظر الكرياتين.'] : []
  };
}
