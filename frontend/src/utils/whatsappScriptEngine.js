/**
 * WhatsApp Coaching Script Engine (محرك صياغة رسائل الواتساب التوجيهية الذكية)
 *
 * Formulates highly engaging, personalized coaching directives based on Engine 7 outcomes:
 *   - ON_TRACK
 *   - METABOLIC_PLATEAU
 *   - FATIGUE_RECOVERY (Refeed Day / Diet Break)
 *   - JOINT_PAIN_SWAP
 */

export function generateWhatsAppCoachingScript({
  client_name = 'يا بطل',
  phone_number = '01011111110',
  decision_scenario = 'ON_TRACK',
  weight_loss_kg = 0.8,
  waist_loss_cm = 1.5,
  neat_step_delta = 1500,
  affected_joint = 'الركبة',
  offending_exercise = 'الهاك سكوات',
  replacement_exercise = 'الليج بريس بمسند عالي'
}) {
  const scenario = String(decision_scenario).toUpperCase();
  let scriptText = '';

  if (scenario === 'ON_TRACK') {
    scriptText = `عاش يا ${client_name}! استجابة ممتازة ونزول ${weight_loss_kg} كجم مع خسارة ${waist_loss_cm} سم من الخصر. ده معدل مثالي بيأكد إننا بنخسر دهون صافية ومحافظين على الكتلة العضلية تماماً.\n\nمكملين بنفس السعرات والتمارين، استمر بنفس الالتزام الحديدي!`;
  } else if (scenario === 'METABOLIC_PLATEAU' || scenario === 'PLATEAU_DETECTED') {
    scriptText = `صباح الفل يا ${client_name}. ثبات الميزان طبيعي جداً بعد فترة التزام نتيجة التكيف الأيضي الطبيعي للجسم.\n\nرفعتلك خطوات الـ NEAT بمقدار +${neat_step_delta} خطوة يومياً كحل أول لتنشيط الحرق بدون ما نقلل أكلك أو نخسر طاقة التمرين. شيك على التطبيق هتلاقي الخطة متحدثة!`;
  } else if (scenario === 'FATIGUE_RECOVERY' || scenario === 'REFEED_TRIGGERED' || scenario === 'DIET_BREAK') {
    scriptText = `ألف سلامة عليك يا ${client_name}. درجات الطاقة والجوع في المتابعة بتوضح وجود إجهاد عصبي تراكمي.\n\nفعلتلك يوم إعادة تغذية (Refeed Day) عالي الكارب لشحن الجليكوجين العضلي وتنشيط هرمونات الحرق (Leptin و T3). راجع وجبات بكرة في التطبيق وبالتوفيق يا وحش!`;
  } else if (scenario === 'JOINT_PAIN_SWAP' || scenario === 'JOINT_DISCOMFORT') {
    scriptText = `سلامتك يا ${client_name}. بخصوص ألم ${affected_joint} أثناء تمرين ${offending_exercise}، تم استبداله فوراً بـ ${replacement_exercise} وضخ بروتوكول تأهيلي خاص في قسم الإحماء لحماية المفصل.\n\nصحتك وسلامة مفاصلك دايماً رقم واحد في خطتنا.`;
  } else {
    scriptText = `مساء الخير يا ${client_name}! تم اعتماد تقرير المتابعة الأسبوعية وتحديث برنامجك في التطبيق. مكملين بقوة نحو الهدف!`;
  }

  const rawPhone = String(phone_number || '').replace(/[^0-9]/g, '');
  const normalizedPhone = rawPhone.startsWith('20')
    ? rawPhone
    : (rawPhone.startsWith('0') ? '20' + rawPhone.substring(1) : (rawPhone ? '20' + rawPhone : '201011111110'));
  const encodedMessage = encodeURIComponent(scriptText);
  const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;

  return {
    scenario,
    client_name,
    phone_number: normalizedPhone,
    script_text: scriptText,
    whatsapp_url: whatsappUrl
  };
}
