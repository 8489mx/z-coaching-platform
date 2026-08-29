/**
 * WhatsApp Message Generator
 * Creates pre-filled WhatsApp action links based on clinical triage status.
 */

export function generateWhatsAppLink(phone = '', messageAr = '') {
  let cleanPhone = String(phone).replace(/\D/g, '');
  if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
    cleanPhone = '2' + cleanPhone;
  }
  const encodedMessage = encodeURIComponent(messageAr);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

export function getTriageWhatsAppAction(client = {}, triageType = 'DEFAULT') {
  const name = client.name || 'يا بطل';
  const daysRemaining = client.days_remaining !== undefined ? client.days_remaining : (client.subscription_remaining_days || 3);
  const phone = client.phone || '01000000000';

  let message = '';
  switch (triageType) {
    case 'RENEWAL_ALERT':
      message = `عاش يا ${name}! حققنا إنجازات ممتازة الشهر ده. اشتراكك بينتهي خلال ${daysRemaining} أيام، جهزت لك مقعدك في باقة الشهر الجديد عشان نكمل التطور، جاهز نجدد؟`;
      break;
    case 'RADAR_RENEWAL_UPCOMING':
      message = `يا بطل! ${name}، فخور جداً بالتزامك. باقتك هتنتهي قريب، حبيت أديك خبر مبكر عشان أأكد حجز مكانك في الشهر الجاي ومفيش يوم يضيع من التطور.`;
      break;
    case 'APPROVE_CHECKIN':
      message = 'يا وحش! شفت التشك إن بتاعك وراجعته بالمللي. التطور ممتاز، خطتك الجديدة جاهزة على التطبيق. راجعها وقولي لو في أي استفسار.';
      break;
    case 'PLATEAU_REVIEW':
      message = `صباح الفل يا ${name}. لاحظت ثبات في الميزان الأسبوعين اللي فاتوا، وده طبيعي جداً. عايزك تطمني على التزامك بخطواتك ونومك، ومفيش أي تغيير في الخطة لحد ما نشوف نتيجة الأسبوع ده.`;
      break;
    default:
      message = `أهلاً يا ${name}، طمني عليك أخبارك إيه في التمرين؟`;
  }

  return {
    url: generateWhatsAppLink(phone, message),
    message_text: message
  };
}
