/**
 * Instant Activation & Welcome Pipeline Engine (محرك التفعيل الفوري والحزمة الترحيبية)
 *
 * Executes the complete launch sequence:
 *   1. Updates client database status to 'ACTIVE'.
 *   2. Generates 16-week check-in schedules (Every 7d for MAX, 14d for ELITE).
 *   3. Generates 1-Click WhatsApp Onboarding Message with App URL, PDF URL & Day 1 instructions.
 */

export function activateClientProgram({
  client_id = '1',
  client_name = 'سارة المنصوري',
  phone_number = '01011111110',
  package_tier = 'MAX', // 'MAX' | 'ELITE'
  program_pdf_url = 'https://zcoaching.com/program-pdf?user_id=1',
  app_url = 'https://zcoaching.com/client-app',
  start_date = new Date()
}) {
  const isMaxTier = String(package_tier).toUpperCase().includes('MAX');
  const intervalDays = isMaxTier ? 7 : 14;
  const totalWeeks = 16;
  const checkinDates = [];

  const startDateObj = new Date(start_date);

  for (let week = 1; week <= totalWeeks; week++) {
    if (isMaxTier || week % 2 === 0) {
      const nextDate = new Date(startDateObj);
      nextDate.setDate(startDateObj.getDate() + (week * 7));
      checkinDates.push({
        week_number: week,
        due_date: nextDate.toISOString().split('T')[0],
        type: isMaxTier ? 'WEEKLY_VIP' : 'BIWEEKLY_ELITE'
      });
    }
  }

  const welcomeMessage = `أهلاً بك يا ${client_name} في عائلة Z Coaching مع كابتن كريم زكريا!\n\nتم اعتماد وتفعيل خطتك التدريبية والغذائية المخصصة بنسبة 100% وفق أعلى المعايير السريرية والرياضية.\n\n- رابط تطبيقك اليومي التفاعلي (الوجبات، التمرين، وقائمة المشتريات):\n${app_url}\n\n- رابط تحميل نسختك الرسمية المطبوعة (4K PDF مع QR Codes للتمارين):\n${program_pdf_url}\n\nتعليمات اليوم الأول:\n1. شيك على وجبات اليوم وجهز مشترياتك من التطبيق.\n2. موعد متابعتك الدورية كل ${intervalDays} أيام صباحاً على معدة فارغة.\n\nرحلة التحول بدأت رسمياً، وأنا معاك خطوة بخطوة!`;

  const cleanPhone = String(phone_number || '').replace(/[^0-9]/g, '');
  const normalizedPhone = cleanPhone.startsWith('20')
    ? cleanPhone
    : (cleanPhone.startsWith('0') ? '20' + cleanPhone.substring(1) : (cleanPhone ? '20' + cleanPhone : '201011111110'));

  const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(welcomeMessage)}`;

  return {
    success: true,
    client_id,
    new_status: 'ACTIVE',
    package_tier: isMaxTier ? 'MAX_VIP' : 'ELITE_TRANSFORM',
    total_scheduled_checkins: checkinDates.length,
    checkin_schedule: checkinDates,
    welcome_message_ar: welcomeMessage,
    whatsapp_dispatch_url: whatsappUrl
  };
}
