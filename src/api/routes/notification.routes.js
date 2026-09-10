import express from "express";
import {
  registerSseClient,
  sendSelfHostedNotification,
  getClientNotifications,
  markNotificationsAsRead,
  getNotificationsLog,
  notifyCheckinReminder,
  registerDeviceToken
} from "../services/notification.service.js";

const router = express.Router();

/**
 * بث مباشر لحظي للإشعارات عبر Server-Sent Events مباشرة من سيرفرك لهاتف المتدرب
 * (بدون فايربيس - بدون وسيط خارجي - بدون كوتا أو حدود)
 */
router.get("/stream/:clientCode", (req, res) => {
  const { clientCode } = req.params;
  if (!clientCode) {
    return res.status(400).end("clientCode is required");
  }
  registerSseClient(clientCode, res);
});

/**
 * جلب قائمة الإشعارات وصندوق الوارد لمتدرب محدد
 */
router.get("/client/:clientCode", (req, res) => {
  try {
    const { clientCode } = req.params;
    const notifications = getClientNotifications(clientCode);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    return res.status(200).json({
      success: true,
      client_code: clientCode,
      unread_count: unreadCount,
      notifications
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * تحديد إشعار أو كافة الإشعارات كمقروءة
 */
router.post("/mark-read", (req, res) => {
  try {
    const { client_code, notification_id } = req.body;
    if (!client_code) {
      return res.status(400).json({ error: "client_code is required" });
    }

    const result = markNotificationsAsRead(client_code, notification_id);
    return res.status(200).json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * إرسال إشعار يدوي ذاتي فوري
 */
router.post("/send", (req, res) => {
  try {
    const { client_code, title, body, payload } = req.body;
    if (!client_code || !title || !body) {
      return res.status(400).json({ error: "client_code, title, and body are required" });
    }

    const notification = sendSelfHostedNotification({
      clientCode: client_code,
      title,
      body,
      payload
    });

    return res.status(200).json({ success: true, message: "تم بث وحفظ الإشعار بنجاح", notification });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * إرسال تذكير بالشيك إن
 */
router.post("/remind-checkin", (req, res) => {
  try {
    const { client_code } = req.body;
    if (!client_code) {
      return res.status(400).json({ error: "client_code is required" });
    }

    const result = notifyCheckinReminder(client_code);
    return res.status(200).json({ success: true, message: "تم إرسال تذكير الشيك إن", notification: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * استعراض سجل الإشعارات
 */
router.get("/history", (req, res) => {
  try {
    const logs = getNotificationsLog();
    return res.status(200).json({ success: true, total: logs.length, notifications: logs });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * التوافقية مع مسار تسجيل الأجهزة
 */
router.post("/register-token", async (req, res) => {
  const { client_code, token, device_info } = req.body;
  const result = await registerDeviceToken(client_code, token, device_info);
  return res.status(200).json({ success: true, result });
});

export default router;
