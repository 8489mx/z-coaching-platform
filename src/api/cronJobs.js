import cron from 'node-cron';
import db from './config/database.js'; // Assuming src/api/config/database.js

// نصوص الرسائل القابلة للتعديل بالكامل من الكوتش (لن يتدخل الذكاء الاصطناعي في تأليفها)
// بدون أي إيموجي (Zero Emojis Rule)
export const MESSAGE_TEMPLATES = {
  // رسالة قبل انتهاء الاشتراك بـ 3 أيام
  RENEWAL_OFFER: (clientName, daysLeft) => 
    `أهلاً يا بطل ${clientName}!\n` +
    `متبقي ${daysLeft} أيام على نهاية اشتراكك الحالي. فخور جداً بالتزامك والتطور اللي وصلنا له!\n` +
    `عشان نكمل مسيرتنا ونبدأ مرحلة جديدة (سواء تنشيف متقدم أو بناء عضلي صافي)، جهزتلك عرض تجديد خاص جداً بخصم 25% لو تم التجديد قبل انتهاء الباقة.\n` +
    `كلمني هنا لو جاهز نكسر أرقام جديدة الشهر الجاي!`,

  // رسالة قبل التقييم (Check-in) بيوم
  CHECKIN_REMINDER: (clientName, checkinDay) =>
    `صباح الفل يا ${clientName}!\n` +
    `بفكرك إن بكرة (${checkinDay}) هو يوم التقييم بتاعنا.\n` +
    `مهم جداً تصور نفس الصور بنفس الإضاءة، وتاخد المقاسات وتوزن على الريق بعد دخول الحمام.\n` +
    `مستني التحديث بتاعك عشان نظبط الخطة للأسبوع الجاي ونستمر في التقدم.`,

  // رسالة عدم النشاط (إذا لم يفتح التطبيق لمدة 3 أيام)
  INACTIVITY_NUDGE: (clientName) =>
    `عاش يا ${clientName}، مختفي بقالك 3 أيام!\n` +
    `أتمنى تكون بخير، عارف إن الدنيا ممكن تلهينا، بس التزامنا هو اللي هيوصلنا للهدف.\n` +
    `طمني عليك، ولو فيه أي عائق موقفك، كلمني وهنظبط الخطة عشان تناسب ظروفك الحالية.\n` +
    `يالا نرجع أقوى!`
};

export const startCronJobs = () => {
  // 1. فحص يومي لاشتراكات توشك على الانتهاء (يعمل الساعة 10 صباحاً يومياً)
  cron.schedule('0 10 * * *', async () => {
    try {
      const { data: clients, error } = await db
        .from('clients')
        .select('*')
        .eq('status', 'ACTIVE');
      
      if (error) throw error;

      clients.forEach(client => {
        // حساب الأيام المتبقية
        const endDate = new Date(client.subscriptionEndDate);
        const today = new Date();
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 3) {
          const message = MESSAGE_TEMPLATES.RENEWAL_OFFER(client.name, diffDays);
          sendWhatsAppMessage(client.phone, message);
        }
      });
    } catch (err) {
      console.error('Error in Renewal Cron:', err);
    }
  });

  // 2. فحص يومي للتذكير بالتقييم (يعمل الساعة 9 صباحاً يومياً)
  cron.schedule('0 9 * * *', async () => {
    try {
      const { data: clients, error } = await db
        .from('clients')
        .select('*')
        .eq('status', 'ACTIVE');
      
      if (error) throw error;

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      clients.forEach(client => {
        if (client.nextCheckinDate === tomorrowStr) {
          const message = MESSAGE_TEMPLATES.CHECKIN_REMINDER(client.name, tomorrowStr);
          sendWhatsAppMessage(client.phone, message);
        }
      });
    } catch (err) {
      console.error('Error in Checkin Cron:', err);
    }
  });

  // 3. فحص يومي لعدم النشاط (يعمل الساعة 8 مساءً)
  cron.schedule('0 20 * * *', async () => {
    try {
      const { data: clients, error } = await db
        .from('clients')
        .select('*')
        .eq('status', 'ACTIVE');
      
      if (error) throw error;

      const today = new Date();
      
      clients.forEach(client => {
        const lastActive = new Date(client.lastActiveDate);
        const diffTime = today - lastActive;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 3) {
          const message = MESSAGE_TEMPLATES.INACTIVITY_NUDGE(client.name);
          sendWhatsAppMessage(client.phone, message);
        }
      });
    } catch (err) {
      console.error('Error in Inactivity Cron:', err);
    }
  });
};

// محاكاة دالة إرسال الواتساب (سيتم ربطها بـ API الواتساب الفعلي لاحقاً)
function sendWhatsAppMessage(phone, message) {
  console.log(`[WHATSAPP DISPATCH] To: ${phone}`);
  console.log(message);
  console.log('-----------------------------------');
}
