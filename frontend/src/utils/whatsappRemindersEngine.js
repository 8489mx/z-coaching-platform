export const REMINDER_CATEGORIES = {
  CHECKIN_DUE: 'CHECKIN_DUE',
  CHECKIN_OVERDUE: 'CHECKIN_OVERDUE',
  RENEWAL_UPCOMING: 'RENEWAL_UPCOMING',
  PLAN_PUBLISHED: 'PLAN_PUBLISHED',
  TRAINING_LAUNCH: 'TRAINING_LAUNCH',
  TRAINING_DELOAD: 'TRAINING_DELOAD',
  NUTRITION_MACROS_UPDATE: 'NUTRITION_MACROS_UPDATE',
  NUTRITION_PLATEAU_BREAK: 'NUTRITION_PLATEAU_BREAK',
  CARDIO_PROTOCOL: 'CARDIO_PROTOCOL',
  CARDIO_INTERFERENCE_GUARD: 'CARDIO_INTERFERENCE_GUARD',
  MOTIVATION: 'MOTIVATION'
};

export const TEMPLATE_GROUPS = [
  { id: 'ALL', label: 'كافة النماذج' },
  { id: 'CHECKIN', label: 'التقييم والمتابعة', keys: ['CHECKIN_DUE', 'CHECKIN_OVERDUE', 'PLAN_PUBLISHED'] },
  { id: 'TRAINING', label: 'التدريب والأحمال', keys: ['TRAINING_LAUNCH', 'TRAINING_DELOAD'] },
  { id: 'NUTRITION', label: 'التغذية والماكروز', keys: ['NUTRITION_MACROS_UPDATE', 'NUTRITION_PLATEAU_BREAK'] },
  { id: 'CARDIO', label: 'الكارديو والنشاط', keys: ['CARDIO_PROTOCOL', 'CARDIO_INTERFERENCE_GUARD'] },
  { id: 'RENEWAL', label: 'تجديد الاشتراك', keys: ['RENEWAL_UPCOMING'] },
  { id: 'MOTIVATION', label: 'التحفيز والانضباط', keys: ['MOTIVATION'] }
];

export const MESSAGE_TEMPLATES = {
  // 1. التقييم الأسبوعي
  [REMINDER_CATEGORIES.CHECKIN_DUE]: {
    id: REMINDER_CATEGORIES.CHECKIN_DUE,
    group: 'CHECKIN',
    title: 'تذكير موعد التقييم الأسبوعي (شيك إن)',
    category_label: 'شيك إن مستحق',
    category: REMINDER_CATEGORIES.CHECKIN_DUE,
    template: 'أهلاً بحضرتك يا {client_name}، اليوم هو موعد التقييم الأسبوعي الدوري لمتابعة خطتك. يرجى تسجيل وزنك على الريق وتدوين مقاساتك وصور التطور عبر الاستمارة في التطبيق: {checkin_url}، حتى نراجع مؤشرات الأسبوع ونحدث أهداف السعرات والتمارين للأسبوع القادم.'
  },
  [REMINDER_CATEGORIES.CHECKIN_OVERDUE]: {
    id: REMINDER_CATEGORIES.CHECKIN_OVERDUE,
    group: 'CHECKIN',
    title: 'تنبيه تأخر إرسال التقييم الأسبوعي',
    category_label: 'تقييم متأخر',
    category: REMINDER_CATEGORIES.CHECKIN_OVERDUE,
    template: 'أهلاً يا {client_name}، لاحظت تأخر إرسال التقييم الأسبوعي حتى الآن. الالتزام بتسجيل الأوزان والملاحظات هو الأساس لضبط العجز والسعرات بدقة وتفادي أي ثبات فسيولوجي. يرجى تعبئة الاستمارة عبر الرابط: {checkin_url} لنستمر في التطوير دون انقطاع.'
  },
  [REMINDER_CATEGORIES.PLAN_PUBLISHED]: {
    id: REMINDER_CATEGORIES.PLAN_PUBLISHED,
    group: 'CHECKIN',
    title: 'إشعار اعتماد ونشر الخطة الجديدة',
    category_label: 'الخطة جاهزة',
    category: REMINDER_CATEGORIES.PLAN_PUBLISHED,
    template: 'أهلاً يا {client_name}، تم الانتهاء من مراجعة تقييمك واعتماد خطتك التدريبية والغذائية المحدثة على التطبيق. تم ضبط أهداف الماكروز وتكنيك الجداول للأسبوع الجديد. يمكنك فتح حسابك الآن عبر الرابط: {app_url} للاطلاع على التعديلات والبدء فوراً.'
  },

  // 2. التدريب والأحمال
  [REMINDER_CATEGORIES.TRAINING_LAUNCH]: {
    id: REMINDER_CATEGORIES.TRAINING_LAUNCH,
    group: 'TRAINING',
    title: 'إشعار انطلاق جدول التمارين وتوزيع الأيام',
    category_label: 'بدء التدريب',
    category: REMINDER_CATEGORIES.TRAINING_LAUNCH,
    template: 'أهلاً يا {client_name}، تم إعداد وتفعيل جدول تمارينك الرياضية بنظام {training_split} بمعدل {training_days} أسبوعياً على التطبيق. يرجى التركيز في الأسبوع الأول على ضبط مسار الحركة والتكنيك، مع ترك احتياطي تكرارات RIR 2-3 لتفادي الإجهاد المفاجئ. يمكنك معاينة التمارين وبدائل الأجهزة عبر الرابط: {app_url}'
  },
  [REMINDER_CATEGORIES.TRAINING_DELOAD]: {
    id: REMINDER_CATEGORIES.TRAINING_DELOAD,
    group: 'TRAINING',
    title: 'توجيهات أسبوع كسر الإجهاد والتفريغ (Deload)',
    category_label: 'أسبوع ديلود',
    category: REMINDER_CATEGORIES.TRAINING_DELOAD,
    template: 'تحياتي يا {client_name}، وفقاً لمؤشرات إجهادك وتدرج الأحمال خلال الأسابيع الماضية، ندخل هذا الأسبوع في مرحلة التفريغ (Deload). سنقوم بتخفيض عدد المجموعات الإجمالية بنسبة 50% مع الحفاظ التام على أوزانك المعتادة لتسريع الاستشفاء العصبي وتجديد مخازن الجليكوجين دون أي فقدان عضلي. تفاصيل جدولك متاحة على التطبيق: {app_url}'
  },

  // 3. التغذية والماكروز
  [REMINDER_CATEGORIES.NUTRITION_MACROS_UPDATE]: {
    id: REMINDER_CATEGORIES.NUTRITION_MACROS_UPDATE,
    group: 'NUTRITION',
    title: 'إشعار تحديث أهداف السعرات والماكروز',
    category_label: 'تحديث ماكروز',
    category: REMINDER_CATEGORIES.NUTRITION_MACROS_UPDATE,
    template: 'أهلاً يا {client_name}، بناءً على آخر قراءة لميزانك ومعدلات نزولك، تم تعديل خطتك الغذائية لتصبح: {calories} سعرة حرارية يومياً، موزعة على {protein} جرام بروتين، و{carbs} جرام كاربوهيدرات، و{fats} جرام دهون صحية. يرجى الالتزام بالكميات الموزونة بدقة عبر وجباتك في التطبيق: {app_url}'
  },
  [REMINDER_CATEGORIES.NUTRITION_PLATEAU_BREAK]: {
    id: REMINDER_CATEGORIES.NUTRITION_PLATEAU_BREAK,
    group: 'NUTRITION',
    title: 'بروتوكول كسر ثبات الوزن وإعادة التحميل (Refeed)',
    category_label: 'كسر ثبات الوزن',
    category: REMINDER_CATEGORIES.NUTRITION_PLATEAU_BREAK,
    template: 'أهلاً يا {client_name}، بعد مراجعة ثبات الوزن الأخير، سنطبق بروتوكول إعادة التحميل (Refeed) برفع حصة الكاربوهيدرات النقية لمدة 48 ساعة بهدف رفع معدلات هرمون اللبتين وتحفيز الحرق الفسيولوجي، مع الحفاظ على حصة البروتين عند {protein} جرام وضبط الماء عند 3.5 لتر يومياً. التفاصيل الكاملة متاحة بحسابك: {app_url}'
  },

  // 4. الكارديو والنشاط
  [REMINDER_CATEGORIES.CARDIO_PROTOCOL]: {
    id: REMINDER_CATEGORIES.CARDIO_PROTOCOL,
    group: 'CARDIO',
    title: 'توجيهات الكارديو والنشاط اليومي (NEAT)',
    category_label: 'بروتوكول كارديو',
    category: REMINDER_CATEGORIES.CARDIO_PROTOCOL,
    template: 'تحياتي يا {client_name}، مستهدفك الأسبوعي للكارديو هو {cardio_sessions}، بالإضافة لمعدل نشاط حركي يومي مستهدف قدره {daily_steps}. يفضل أداء الكارديو بشدة منخفضة وثابتة (LISS) كالمشي السريع لدعم حرق الدهون دون التأثير على استشفاء أليافك العضلية. تفاصيل الجلسات في التطبيق: {app_url}'
  },
  [REMINDER_CATEGORIES.CARDIO_INTERFERENCE_GUARD]: {
    id: REMINDER_CATEGORIES.CARDIO_INTERFERENCE_GUARD,
    group: 'CARDIO',
    title: 'تنبيه فصل الكارديو لمنع التعارض مع البناء العضلي',
    category_label: 'حماية التداخل',
    category: REMINDER_CATEGORIES.CARDIO_INTERFERENCE_GUARD,
    template: 'أهلاً يا {client_name}، للتأكد من أقصى استفادة بنائية وتجنب ظاهرة التداخل (Interference Effect)، يرجى الحرص على أداء الكارديو بعد حصة الحديد مباشرة أو بفارق زمني لا يقل عن 6 ساعات، مع تجنب أداء الكارديو عالي الشدة قبل تمارين المقاومة لضمان توجيه الطاقة لمسار البناء العضلي ومخازن ATP.'
  },

  // 5. تجديد الاشتراك
  [REMINDER_CATEGORIES.RENEWAL_UPCOMING]: {
    id: REMINDER_CATEGORIES.RENEWAL_UPCOMING,
    group: 'RENEWAL',
    title: 'تذكير اقتراب انتهاء الاشتراك والتجديد',
    category_label: 'تجديد قريب',
    category: REMINDER_CATEGORIES.RENEWAL_UPCOMING,
    template: 'تحياتي يا {client_name}، أحييك على الجهد والالتزام الممتاز خلال الفترة الماضية. اشتراكك الحالي في {package_name} يتبقى عليه {days_left} أيام. أحببت إبلاغك مسبقاً لتأكيد رغبتك في التجديد سواء على نفس الباقة أو الترقية، لضمان استمرار متابعتك وتحديث خطتك دون توقف. رابط التجديد: {renewal_url}'
  },

  // 6. التحفيز العام
  [REMINDER_CATEGORIES.MOTIVATION]: {
    id: REMINDER_CATEGORIES.MOTIVATION,
    group: 'MOTIVATION',
    title: 'رسالة متابعة وانضباط أسبوعي',
    category_label: 'تحفيز ومتابعة',
    category: REMINDER_CATEGORIES.MOTIVATION,
    template: 'مساء الخير يا {client_name}، أردت الاطمئنان على سير تمرينك والتزامك بوجبات اليوم. الاستمرارية والانضباط في التفاصيل اليومية هما الفارق الحقيقي في النتائج. مستمرون معاً نحو نسختك الأقوى.'
  }
};

export function compileReminderMessage(template = '', data = {}) {
  let result = String(template || '');
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value !== undefined && value !== null ? String(value) : '');
  }
  return result;
}

export function formatWhatsAppPhone(phone) {
  let clean = String(phone || '').replace(/\D/g, '');
  if (clean.startsWith('00')) {
    clean = clean.substring(2);
  }
  // مصري محلي يبدأ بـ 01 وطوله 11 رقماً
  if (clean.startsWith('01') && clean.length === 11) {
    clean = '2' + clean;
  }
  // سعودي محلي يبدأ بـ 05 وطوله 10 أرقام
  else if (clean.startsWith('05') && clean.length === 10) {
    clean = '966' + clean.substring(1);
  }
  // سعودي يبدأ بـ 5 وطوله 9 أرقام
  else if (clean.startsWith('5') && clean.length === 9) {
    clean = '966' + clean;
  }
  return clean;
}

export function generateWhatsAppUrl(phone, msg = '') {
  const cleanPhone = formatWhatsAppPhone(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}
