import express from "express";
import {
  registerSseClient,
  sendSelfHostedNotification,
  getClientNotifications,
  markNotificationsAsRead,
  getNotificationsLog,
  notifyCheckinReminder,
  notifyCoachNote,
  registerDeviceToken,
  loadRequesterIdentity,
} from "../services/notification.service.js";
import { canAccessClientNotifications, resolveSseOrigin } from "../../notifications/notification-access.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * P2-C7 ownership gate for client-scoped routes. Pre-C7 these routes accepted
 * any valid login for any client_code (live privacy hole). Now the requested
 * code must be the requester's own client_code (or numeric user id). ADMIN /
 * COACH bypass applies ONLY on admin routes (history, send, remind-checkin),
 * never here.
 */
const requireNotificationOwner = async (req, res, next) => {
  try {
    const requestedCode = req.params.clientCode || req.body?.client_code;
    if (!requestedCode) {
      return res.status(400).json({ error: "client_code is required" });
    }
    const identity = await loadRequesterIdentity(req.user?.id);
    if (!identity) {
      return res.status(401).json({ error: "Unauthorized: user not found" });
    }
    if (!canAccessClientNotifications(identity, requestedCode)) {
      return res.status(403).json({ error: "غير مصرح لك بالوصول إلى إشعارات متدرب آخر" });
    }
    req.notificationIdentity = identity;
    return next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Live stream of the client's own notifications (SSE). Ownership enforced
 * before registration; the Origin header is validated and echoed only when
 * trusted — never a wildcard (pre-C7 answered `*` to everyone).
 */
router.get("/stream/:clientCode", requireAuth, requireNotificationOwner, (req, res) => {
  const { clientCode } = req.params;
  const origin = req.header("Origin");
  const decision = resolveSseOrigin(origin, req.hostname);
  if (!decision.allowed) {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  registerSseClient(clientCode, res, decision.echoOrigin);
});

/**
 * The client's own inbox, newest first.
 */
router.get("/client/:clientCode", requireAuth, requireNotificationOwner, async (req, res) => {
  try {
    const { clientCode } = req.params;
    const notifications = await getClientNotifications(clientCode);
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    return res.status(200).json({
      success: true,
      client_code: clientCode,
      unread_count: unreadCount,
      notifications,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Mark the client's own notification(s) as read.
 */
router.post("/mark-read", requireAuth, requireNotificationOwner, async (req, res) => {
  try {
    const { client_code, notification_id } = req.body;
    const result = await markNotificationsAsRead(client_code, notification_id);
    return res.status(200).json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Coach/admin manual send (note to a client). Reports REAL delivery: inbox
 * saved + live streams reached + push attempts/deliveries/failures. A send
 * that reaches nobody says so — never a blanket "broadcast succeeded".
 */
router.post("/send", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { client_code, title, body, payload } = req.body;
    if (!client_code || !title || !body) {
      return res.status(400).json({ error: "client_code, title, and body are required" });
    }
    const { notification, delivery } = await sendSelfHostedNotification({
      clientCode: client_code,
      title,
      body,
      payload,
    });
    return res.status(200).json({ success: true, message: delivery.summary, notification, delivery });
  } catch (err) {
    if (/recipient not found/.test(err.message)) {
      return res.status(404).json({ success: false, error: "المتدرب غير موجود" });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Coach/admin check-in reminder to one client (also wired to the overdue
 * cards on the coach command center). Same honest delivery report.
 */
router.post("/remind-checkin", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { client_code } = req.body;
    if (!client_code) {
      return res.status(400).json({ error: "client_code is required" });
    }
    const { notification, delivery } = await notifyCheckinReminder(client_code);
    return res.status(200).json({ success: true, message: delivery.summary, notification, delivery });
  } catch (err) {
    if (/recipient not found/.test(err.message)) {
      return res.status(404).json({ success: false, error: "المتدرب غير موجود" });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Coach note endpoint (same delivery path as /send, explicit type).
 */
router.post("/note", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { client_code, title, body } = req.body;
    if (!client_code || !title || !body) {
      return res.status(400).json({ error: "client_code, title, and body are required" });
    }
    const { notification, delivery } = await notifyCoachNote(client_code, title, body);
    return res.status(200).json({ success: true, message: delivery.summary, notification, delivery });
  } catch (err) {
    if (/recipient not found/.test(err.message)) {
      return res.status(404).json({ success: false, error: "المتدرب غير موجود" });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Admin history: all clients' inbox rows (admin-only by requireAdmin).
 */
router.get("/history", requireAuth, requireAdmin, async (req, res) => {
  try {
    const logs = await getNotificationsLog();
    return res.status(200).json({ success: true, total: logs.length, notifications: logs });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Device-token registration. The token is stored ONLY against the
 * authenticated user: the stored client_code is the requester's own code,
 * and a body code for another client is rejected (403).
 */
router.post("/register-token", requireAuth, async (req, res) => {
  try {
    const { client_code, token, device_info } = req.body;
    if (!token) {
      return res.status(400).json({ error: "token is required" });
    }
    const identity = await loadRequesterIdentity(req.user?.id);
    if (!identity) {
      return res.status(401).json({ error: "Unauthorized: user not found" });
    }
    if (client_code && !canAccessClientNotifications(identity, client_code)) {
      return res.status(403).json({ error: "غير مصرح لك بتسجيل جهاز لمتدرب آخر" });
    }
    const result = await registerDeviceToken(identity.clientCode, token, device_info, identity.userId);
    return res.status(200).json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
