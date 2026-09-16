/**
 * Check-in Approval WhatsApp Summary Generator (Frontend)
 * Generates structured, motivating Egyptian Arabic messages summarizing weekly check-in reviews.
 * Zero Emojis enforced.
 */

export function generateCheckinApprovalWhatsAppMessage(options = {}) {
  const {
    clientName = 'يا بطل',
    clientCode = '',
    weekNumber = 1,
    currentWeight,
    weightDiff,
    waistCurrent,
    waistDiff,
    macros = {},
    cardioTarget = '',
    coachNotes = '',
    appBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://zakaria.fit'
  } = options;

  const firstName = clientName ? clientName.trim().split(' ')[0] : 'يا بطل';
  const cleanCode = String(clientCode || '').replace(/^client[-_]?/i, '').replace('#', '');
  const appUrl = cleanCode ? `${appBaseUrl}/client?code=${cleanCode}` : `${appBaseUrl}/client`;

  // Weight progression text
  let weightLine = null;
  if (currentWeight !== undefined && currentWeight !== null) {
    if (weightDiff !== undefined && weightDiff !== null && weightDiff !== 0) {
      const sign = weightDiff > 0 ? '+' : '';
      weightLine = `• الميزان الحالي: ${currentWeight} كجم (${sign}${weightDiff} كجم عن الأسبوع السابق)`;
    } else {
      weightLine = `• الميزان الحالي: ${currentWeight} كجم (ثبات ممتاز)`;
    }
  }

  // Waist progression text
  let waistLine = null;
  if (waistCurrent !== undefined && waistCurrent !== null) {
    if (waistDiff !== undefined && waistDiff !== null && waistDiff !== 0) {
      const sign = waistDiff > 0 ? '+' : '';
      waistLine = `• محيط الخصر: ${waistCurrent} سم (${sign}${waistDiff} سم)`;
    } else {
      waistLine = `• محيط الخصر: ${waistCurrent} سم`;
    }
  }

  // Target macros
  let macrosLine = null;
  if (macros && (macros.calories || macros.protein)) {
    const cals = macros.calories ? `${macros.calories} سعرة` : '';
    const p = macros.protein ? `بروتين ${macros.protein} جم` : '';
    const c = macros.carbs ? `كارب ${macros.carbs} جم` : '';
    const f = macros.fats ? `دهون ${macros.fats} جم` : '';
    const macroParts = [p, c, f].filter(Boolean).join(' | ');
    macrosLine = `• الأهداف الغذائية المعتمدة: ${cals}${macroParts ? ` (${macroParts})` : ''}`;
  }

  // Cardio line
  let cardioLine = null;
  if (cardioTarget && cardioTarget.trim()) {
    cardioLine = `• خطة الكارديو والنشاط: ${cardioTarget.trim()}`;
  }

  const updates = [weightLine, waistLine, macrosLine, cardioLine].filter(Boolean);

  const parts = [
    `عاش يا ${firstName}! تم مراجعة واعتماد تقييمك للأسبوع ${weekNumber} بنجاح.`
  ];

  if (updates.length > 0) {
    parts.push('');
    parts.push('موجز التحديثات الميدانية:');
    updates.forEach(u => parts.push(u));
  }

  if (coachNotes && coachNotes.trim()) {
    parts.push('');
    parts.push('توجيهات الكوتش للأسبوع الجديد:');
    parts.push(coachNotes.trim());
  }

  parts.push('');
  parts.push('تقدر تفتح تطبيقك وتشوف كل تفاصيل الخطة المحدثة من هنا:');
  parts.push(appUrl);
  parts.push('');
  parts.push('استمر بنفس العزيمة والتركيز يا بطل، أسبوع أقوى بإذن الله!');

  return parts.join('\n');
}
