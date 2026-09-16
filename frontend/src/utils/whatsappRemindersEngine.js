export const REMINDER_CATEGORIES = {
  CHECKIN_DUE: 'CHECKIN_DUE',
  CHECKIN_OVERDUE: 'CHECKIN_OVERDUE',
  RENEWAL_UPCOMING: 'RENEWAL_UPCOMING',
  PLAN_PUBLISHED: 'PLAN_PUBLISHED',
  MOTIVATION: 'MOTIVATION'
};

export const MESSAGE_TEMPLATES = {
  [REMINDER_CATEGORIES.CHECKIN_DUE]: {
    id: REMINDER_CATEGORIES.CHECKIN_DUE,
    title: 'تذكير موعد التقييم الأسبوعي (شيك إن)',
    category_label: 'شيك إن مستحق',
    category: REMINDER_CATEGORIES.CHECKIN_DUE,
    template: 'أهلاً بحضرتك يا {client_name}، اليوم هو موعد التقييم الأسبوعي الدوري لمتابعة خطتك. يرجى تسجيل وزنك على الريق وتدوين مقاساتك وصور التطور عبر الاستمارة في التطبيق: {checkin_url}، حتى نراجع مؤشرات الأسبوع ونحدث أهداف السعرات والتمارين للأسبوع القادم.'
  },
  [REMINDER_CATEGORIES.CHECKIN_OVERDUE]: {
    id: REMINDER_CATEGORIES.CHECKIN_OVERDUE,
    title: 'تنبيه تأخر إرسال التقييم الأسبوعي',
    category_label: 'تقييم متأخر',
    category: REMINDER_CATEGORIES.CHECKIN_OVERDUE,
    template: 'أهلاً يا {client_name}، لاحظت تأخر إرسال التقييم الأسبوعي حتى الآن. الالتزام بتسجيل الأوزان والملاحظات هو الأساس لضبط العجز والسعرات بدقة وتفادي أي ثبات فسيولوجي. يرجى تعبئة الاستمارة عبر الرابط: {checkin_url} لنستمر في التطوير دون انقطاع.'
  },
  [REMINDER_CATEGORIES.RENEWAL_UPCOMING]: {
    id: REMINDER_CATEGORIES.RENEWAL_UPCOMING,
    title: 'تذكير اقتراب انتهاء الاشتراك والتجديد',
    category_label: 'تجديد قريب',
    category: REMINDER_CATEGORIES.RENEWAL_UPCOMING,
    template: 'تحياتي يا {client_name}، أحييك على الجهد والالتزام الممتاز خلال الفترة الماضية. اشتراكك الحالي في {package_name} يتبقى عليه {days_left} أيام. أحببت إبلاغك مسبقاً لتأكيد رغبتك في التجديد سواء على نفس الباقة أو الترقية، لضمان استمرار متابعتك وتحديث خطتك دون توقف. رابط التجديد: {renewal_url}'
  },
  [REMINDER_CATEGORIES.PLAN_PUBLISHED]: {
    id: REMINDER_CATEGORIES.PLAN_PUBLISHED,
    title: 'إشعار اعتماد ونشر الخطة الجديدة',
    category_label: 'الخطة جاهزة',
    category: REMINDER_CATEGORIES.PLAN_PUBLISHED,
    template: 'أهلاً يا {client_name}، تم الانتهاء من مراجعة تقييمك واعتماد خطتك التدريبية والغذائية المحدثة على التطبيق. تم ضبط أهداف الماكروز وتكنيك الجداول للأسبوع الجديد. يمكنك فتح حسابك الآن عبر الرابط: {app_url} للاطلاع على التعديلات والبدء فوراً.'
  },
  [REMINDER_CATEGORIES.MOTIVATION]: {
    id: REMINDER_CATEGORIES.MOTIVATION,
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
  if (clean.startsWith('01') && clean.length === 11) {
    clean = '2' + clean;
  }
  return clean;
}

export function generateWhatsAppUrl(phone, msg = '') {
  const cleanPhone = formatWhatsAppPhone(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

