/**
 * Automated Pre-Renewal Engine at Week 14 (محرك التجديد الاستباقي للعميل بالأسبوع 14)
 *
 * Monitors trainee progress near completion of 16-week lifecycle:
 *   1. Identifies Trainees entering Weeks 14-15.
 *   2. Recommends Next Evolutionary Phase (Cutting -> Reverse Dieting & Lean Hypertrophy).
 *   3. Generates MAX Early-Bird Renewal Offer with custom discount code and WhatsApp pitch.
 */

export function evaluateClientRenewalEligibility({
  client_id = '1',
  client_name = 'سارة المنصوري',
  phone_number = '01011111110',
  current_week = 14,
  package_tier = 'MAX',
  starting_weight_kg = 88.0,
  current_weight_kg = 74.5,
  initial_goal = 'خسارة دهون وتنشيف',
  adherence_rate_percent = 96
}) {
  const isRenewalWindow = current_week >= 14 && current_week <= 16;
  const weightDropKg = Math.round((starting_weight_kg - current_weight_kg) * 10) / 10;

  let nextPhaseRecommendationAr = '';
  let nextPhaseGoal = '';

  if (initial_goal.includes('دهون') || initial_goal.includes('تنشيف')) {
    nextPhaseGoal = 'الدايت العكسي والبناء العضلي الصافي (Reverse Dieting & Clean Bulk)';
    nextPhaseRecommendationAr = 'الانتقال إلى مرحلة الدايت العكسي لرفع معدل الأيض تدريجياً، تثبيت نسبة الدهون المنخفضة، وبناء كتلة عضلية نقية.';
  } else {
    nextPhaseGoal = 'الفورمة المتقدمة والتكثيف العضلي (Advanced Hypertrophy)';
    nextPhaseRecommendationAr = 'الانتقال لبروتوكول القوة المتقدم وتكثيف كثافة التدريب الرياضي.';
  }

  const discountCode = `KZ-RENEW-${Math.round(weightDropKg)}KG`;
  const discountPercent = 25;

  const renewalPitchAr = `أهلاً يا ${client_name}،\n\nنبارك لك وصولك للأسبوع ${current_week} بنجاح والتزام متميز (خسارة ${weightDropKg} كجم والتزام بنسبة ${adherence_rate_percent}%).\n\nللبناء على هذه النتائج وبدء المرحلة القادمة:\n- ${nextPhaseGoal}\n\nتم إعداد عرض تجديد مبكر لك كأحد مشتركي باقة MAX بخصم ${discountPercent}% بكود: (${discountCode}).\n\nبانتظار تأكيدك لمواصلة التقدم في الدورة التدريبية الجديدة.`;

  const cleanPhone = String(phone_number || '').replace(/[^0-9]/g, '');
  const normalizedPhone = cleanPhone.startsWith('20')
    ? cleanPhone
    : (cleanPhone.startsWith('0') ? '20' + cleanPhone.substring(1) : (cleanPhone ? '20' + cleanPhone : '201011111110'));

  const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(renewalPitchAr)}`;

  return {
    client_id,
    client_name,
    current_week,
    is_renewal_window_active: isRenewalWindow,
    transformation_summary: {
      weight_drop_kg: weightDropKg,
      adherence: `${adherence_rate_percent}%`
    },
    next_phase_recommendation: {
      goal: nextPhaseGoal,
      rationale_ar: nextPhaseRecommendationAr
    },
    offer: {
      discount_percent: discountPercent,
      promo_code: discountCode
    },
    renewal_script_ar: renewalPitchAr,
    whatsapp_dispatch_url: whatsappUrl
  };
}
