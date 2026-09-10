import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../../");
const dataDir = path.resolve(rootDir, "data");
const notificationsDbPath = path.resolve(dataDir, "self-hosted-notifications.json");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// قراءة قاعدة بيانات الإشعارات الذاتية المستقلة
const readNotificationsDb = () => {
  try {
    if (fs.existsSync(notificationsDbPath)) {
      return JSON.parse(fs.readFileSync(notificationsDbPath, "utf-8"));
    }
  } catch (err) {
    console.warn("Notice reading notifications DB:", err.message);
  }
  return { notifications: [] };
};

// حفظ قاعدة بيانات الإشعارات
const saveNotificationsDb = (db) => {
  try {
    fs.writeFileSync(notificationsDbPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save notifications DB:", err);
  }
};

// خريطة اتصالات البث المباشر النشطة (SSE Clients)
const activeSseConnections = new Map();

/**
 * 1. تسجيل اتصال بث مباشر (Server-Sent Events) لمتدرب محدد
 * يتم الإرسال اللحظي مباشرة من خادمك إلى تطبيق المتدرب دون أي وسيط خارجي
 */
export const registerSseClient = (clientCode, res) => {
  const cleanCode = String(clientCode).trim();
  
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*"
  });

  res.write(`data: ${JSON.stringify({ type: "CONNECTED", message: "متصل بالبث المباشر لمنظومة Z Coaching الذاتية" })}\n\n`);

  if (!activeSseConnections.has(cleanCode)) {
    activeSseConnections.set(cleanCode, new Set());
  }
  activeSseConnections.get(cleanCode).add(res);

  res.on("close", () => {
    const set = activeSseConnections.get(cleanCode);
    if (set) {
      set.delete(res);
      if (set.size === 0) {
        activeSseConnections.delete(cleanCode);
      }
    }
  });
};

/**
 * 2. إرسال إشعار لحظي ذاتي لمتدرب وحفظه في صندوق الوارد بالمنظومة
 * مستقل بنسبة 100% عن أي خدمة خارجية (بدون كوتا أو اشتراكات أو حدود إرسال)
 */
export const sendSelfHostedNotification = ({ clientCode, title, body, payload = {} }) => {
  const cleanCode = String(clientCode).trim();
  const db = readNotificationsDb();

  const notification = {
    id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    client_code: cleanCode,
    title,
    body,
    payload,
    is_read: false,
    created_at: new Date().toISOString()
  };

  db.notifications.unshift(notification);

  // حفظ حتى 1,000 إشعار داخل الخادم
  if (db.notifications.length > 1000) {
    db.notifications.length = 1000;
  }

  saveNotificationsDb(db);

  // البث الفوري عبر الاتصال المباشر (SSE) إذا كان تطبيق المتدرب مفتوحاً
  const connections = activeSseConnections.get(cleanCode);
  if (connections && connections.size > 0) {
    for (const clientRes of connections) {
      try {
        clientRes.write(`data: ${JSON.stringify(notification)}\n\n`);
      } catch (err) {
        console.warn("Could not push SSE to client:", err.message);
      }
    }
  }

  return notification;
};

/**
 * 3. استرجاع قائمة إشعارات المتدرب (الواردة وغير المقروءة)
 */
export const getClientNotifications = (clientCode) => {
  const cleanCode = String(clientCode).trim();
  const db = readNotificationsDb();
  return db.notifications.filter(n => n.client_code === cleanCode);
};

/**
 * 4. تحديد إشعار أو كافة إشعارات العميل كمقروءة
 */
export const markNotificationsAsRead = (clientCode, notificationId = null) => {
  const cleanCode = String(clientCode).trim();
  const db = readNotificationsDb();
  let updatedCount = 0;

  for (const n of db.notifications) {
    if (n.client_code === cleanCode) {
      if (!notificationId || n.id === notificationId) {
        if (!n.is_read) {
          n.is_read = true;
          updatedCount++;
        }
      }
    }
  }

  if (updatedCount > 0) {
    saveNotificationsDb(db);
  }

  return { success: true, updatedCount };
};

/**
 * 5. إشعارات الأحداث التدريبية والسريرية المعتمدة
 */
export const notifyProgramPublished = (clientCode, planName = "الخطة التدريبية والغذائية") => {
  return sendSelfHostedNotification({
    clientCode,
    title: "تم اعتماد خطتك التدريبية والغذائية",
    body: `قام الكوتش بمراجعة واعتماد ${planName}. يمكنك الآن مطالعة تفاصيل الجلسات والوجبات المحدثة.`,
    payload: { type: "PROGRAM_PUBLISHED", client_code: clientCode }
  });
};

export const notifyCheckinReviewed = (clientCode, coachFeedbackSummary = "") => {
  const preview = coachFeedbackSummary ? `\nتوجيه الكوتش: ${coachFeedbackSummary.substring(0, 80)}...` : "";
  return sendSelfHostedNotification({
    clientCode,
    title: "تمت مراجعة تقرير الشيك إن الأسبوعي",
    body: `قام الكوتش بمراجعة قياساتك وصورك وإرفاق التقييم والتعديلات المطلوبة.${preview}`,
    payload: { type: "CHECKIN_REVIEWED", client_code: clientCode }
  });
};

export const notifyCheckinReminder = (clientCode) => {
  return sendSelfHostedNotification({
    clientCode,
    title: "موعد الشيك إن الأسبوعي اليوم",
    body: "يرجى تسجيل وزن الصباح ورفع صور القياسات الميدانية عبر التطبيق لمتابعة تطورك.",
    payload: { type: "CHECKIN_REMINDER", client_code: clientCode }
  });
};

export const getNotificationsLog = () => {
  return readNotificationsDb().notifications;
};

// توافقية استدعاء تسجيل الأجهزة القديم لمنع أي خطأ
export const registerDeviceToken = async (clientCode, token, deviceInfo = {}) => {
  return { success: true, clientCode: String(clientCode).trim(), tokenRegistered: true, mode: "SELF_HOSTED" };
};

export const sendPushNotification = async ({ clientCode, title, body, payload = {} }) => {
  return sendSelfHostedNotification({ clientCode, title, body, payload });
};
