import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Notification, DeviceToken, User } from "../models/index.js";
import { canAccessClientNotifications } from "../../notifications/notification-access.js";
import { mapLegacyNotificationRow } from "../../notifications/notification-access.js";
import { buildDeliveryReport, sendPushToDevices } from "../../notifications/push-provider.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../../");
// Pre-C7 runtime JSON store. Read once by the migration, then renamed so it
// never migrates twice. New notifications live in the database only.
const legacyNotificationsPath = path.resolve(rootDir, "data/self-hosted-notifications.json");
const legacyMigratedPath = `${legacyNotificationsPath}.migrated`;

// Live Server-Sent Events connections, keyed by client_code.
// Single-process only: connections die on restart and do not cross processes
// (same limitation as before C7; push delivery covers the offline case).
const activeSseConnections = new Map();

/**
 * Resolve the authenticated requester's notification identity from the database.
 * Returns { userId, clientCode, role } or null when the user does not exist.
 * Used by the ownership middleware; the pure comparison lives in
 * notification-access.js so it stays unit-testable without a database.
 */
export const loadRequesterIdentity = async (userId) => {
  if (userId === undefined || userId === null) return null;
  const user = await User.findByPk(userId, { attributes: ["id", "client_code", "role"] });
  if (!user) return null;
  return { userId: user.id, clientCode: user.client_code, role: user.role };
};

/**
 * Resolve an inbox address (client_code or numeric user id string) to a user.
 * Throws when no user matches, so senders never store orphan rows.
 */
const resolveInboxUser = async (clientCode) => {
  const cleanCode = String(clientCode).trim();
  let user = await User.findOne({ where: { client_code: cleanCode }, attributes: ["id", "client_code"] });
  if (!user && /^\d+$/.test(cleanCode)) {
    user = await User.findByPk(parseInt(cleanCode, 10), { attributes: ["id", "client_code"] });
  }
  if (!user) throw new Error(`notification recipient not found: ${cleanCode}`);
  return user;
};

/**
 * Register a live SSE connection for one client. The caller (route) must have
 * already enforced ownership. allowedOrigin is echoed ONLY when the route
 * validated it; untrusted browser origins are rejected at the route (403),
 * never answered with a wildcard.
 */
export const registerSseClient = (clientCode, res, allowedOrigin = null) => {
  const cleanCode = String(clientCode).trim();
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  };
  if (allowedOrigin) headers["Access-Control-Allow-Origin"] = allowedOrigin;
  res.writeHead(200, headers);
  res.write(`data: ${JSON.stringify({ type: "CONNECTED", message: "متصل بالبث المباشر لمنظومة Z Coaching" })}\n\n`);
  if (!activeSseConnections.has(cleanCode)) {
    activeSseConnections.set(cleanCode, new Set());
  }
  activeSseConnections.get(cleanCode).add(res);
  res.on("close", () => {
    const set = activeSseConnections.get(cleanCode);
    if (set) {
      set.delete(res);
      if (set.size === 0) activeSseConnections.delete(cleanCode);
    }
  });
};

/** Broadcast one stored notification to that client's live SSE connections. Returns the recipient count. */
const broadcastSse = (notification) => {
  const connections = activeSseConnections.get(notification.client_code);
  if (!connections || connections.size === 0) return 0;
  let reached = 0;
  for (const clientRes of [...connections]) {
    try {
      clientRes.write(`data: ${JSON.stringify(notification)}\n\n`);
      reached += 1;
    } catch (err) {
      connections.delete(clientRes);
      console.warn("Could not push SSE to client:", err.message);
    }
  }
  if (connections.size === 0) activeSseConnections.delete(notification.client_code);
  return reached;
};

/** Prune device tokens the provider reports as permanently invalid (expired web-push subscription, dead FCM token). */
const pruneDeadTokens = async (devices, pushResults) => {
  for (let i = 0; i < devices.length; i += 1) {
    const r = pushResults[i];
    if (!r || r.delivered !== false) continue;
    const dead = r.statusCode === 410 || r.code === "messaging/registration-token-not-registered" || r.code === "messaging/invalid-registration-token";
    if (dead) {
      await DeviceToken.destroy({ where: { id: devices[i].id } }).catch(() => {});
    }
  }
};

/**
 * Core delivery: store in the inbox, broadcast to live SSE connections, then
 * attempt real push to the client's registered devices. Returns the stored
 * notification plus an honest delivery report — never a blanket success.
 */
export const deliverNotification = async ({ clientCode, title, body, payload = {} }) => {
  const user = await resolveInboxUser(clientCode);
  const row = await Notification.create({
    user_id: user.id,
    client_code: user.client_code,
    title,
    body,
    type: payload && typeof payload.type === "string" ? payload.type : "GENERAL",
    payload: payload && typeof payload === "object" ? payload : {},
    is_read: false,
  });
  const notification = row.toJSON ? row.toJSON() : { ...row };
  const sseRecipients = broadcastSse(notification);
  const devices = await DeviceToken.findAll({ where: { user_id: user.id }, raw: true }).catch(() => []);
  const pushResults = await sendPushToDevices(devices, { title, body, payload: notification.payload });
  await pruneDeadTokens(devices, pushResults).catch(() => {});
  return { notification, delivery: buildDeliveryReport({ sseRecipients, pushResults }) };
};

/** Backwards-compatible name: previously JSON + SSE only, now full delivery. */
export const sendSelfHostedNotification = (args) => deliverNotification(args);

export const getClientNotifications = async (clientCode) => {
  const cleanCode = String(clientCode).trim();
  const rows = await Notification.findAll({
    where: { client_code: cleanCode },
    order: [["created_at", "DESC"], ["id", "DESC"]],
    raw: true,
  });
  return rows;
};

export const markNotificationsAsRead = async (clientCode, notificationId = null) => {
  const cleanCode = String(clientCode).trim();
  const where = { client_code: cleanCode, is_read: false };
  if (notificationId !== undefined && notificationId !== null) where.id = notificationId;
  const [updatedCount] = await Notification.update({ is_read: true }, { where });
  return { success: true, updatedCount };
};

/** Event notifications. All are coach-written or system wording — never invented stats. */
export const notifyProgramPublished = (clientCode, planName = "الخطة التدريبية والغذائية") => {
  return deliverNotification({
    clientCode,
    title: "تم اعتماد خطتك التدريبية والغذائية",
    body: `قام الكوتش بمراجعة واعتماد ${planName}. يمكنك الآن مطالعة تفاصيل الجلسات والوجبات المحدثة.`,
    payload: { type: "PROGRAM_PUBLISHED", client_code: String(clientCode).trim() },
  });
};

export const notifyCheckinReviewed = (clientCode, coachFeedbackSummary = "") => {
  const preview = coachFeedbackSummary ? `\nتوجيه الكوتش: ${coachFeedbackSummary.substring(0, 80)}...` : "";
  return deliverNotification({
    clientCode,
    title: "تمت مراجعة تقرير الشيك إن الأسبوعي",
    body: `قام الكوتش بمراجعة قياساتك وصورك وإرفاق التقييم والتعديلات المطلوبة.${preview}`,
    payload: { type: "CHECKIN_REVIEWED", client_code: String(clientCode).trim() },
  });
};

export const notifyCheckinReminder = (clientCode) => {
  return deliverNotification({
    clientCode,
    title: "موعد الشيك إن الأسبوعي اليوم",
    body: "يرجى تسجيل وزن الصباح ورفع صور القياسات الميدانية عبر التطبيق لمتابعة تطورك.",
    payload: { type: "CHECKIN_REMINDER", client_code: String(clientCode).trim() },
  });
};

/** Coach note inside the app. Title/body are the coach's own words. */
export const notifyCoachNote = (clientCode, title, body) => {
  return deliverNotification({
    clientCode,
    title,
    body,
    payload: { type: "COACH_NOTE", client_code: String(clientCode).trim() },
  });
};

export const getNotificationsLog = async () => {
  return Notification.findAll({ order: [["created_at", "DESC"], ["id", "DESC"]], raw: true });
};

/**
 * Register a push device token. REAL storage (pre-C7 this returned success
 * without storing anything). The token is stored ONLY against the authenticated
 * user: the caller must pass the requester's user id, and the stored
 * client_code is that user's own code — a body-supplied code for another
 * client is rejected by the route before this runs.
 */
export const registerDeviceToken = async (clientCode, token, deviceInfo = {}, userId = null) => {
  if (userId === undefined || userId === null) {
    throw new Error("registerDeviceToken requires the authenticated user id");
  }
  const cleanToken = String(token || "").trim();
  if (!cleanToken) throw new Error("device token is required");
  const user = await User.findByPk(userId, { attributes: ["id", "client_code"] });
  if (!user) throw new Error("authenticated user not found");
  const platform = deviceInfo && deviceInfo.platform ? String(deviceInfo.platform).slice(0, 32) : null;
  const existing = await DeviceToken.findOne({ where: { token: cleanToken } });
  if (existing) {
    await existing.update({ user_id: user.id, client_code: user.client_code, platform, last_seen_at: new Date() });
  } else {
    await DeviceToken.create({ user_id: user.id, client_code: user.client_code, token: cleanToken, platform });
  }
  return { success: true, clientCode: user.client_code, tokenRegistered: true, mode: "DB" };
};

/**
 * Real push entry point (pre-C7 this only wrote JSON + SSE). Creates the inbox
 * row and attempts push to the client's devices, reporting real counts.
 */
export const sendPushNotification = async ({ clientCode, title, body, payload = {} }) => {
  return deliverNotification({ clientCode, title, body, payload });
};

/**
 * One-time migration of the pre-C7 JSON store into the database. Runs at
 * server boot after sync (guarded: a failure logs and never blocks boot).
 * Rows that cannot map to a user are counted as skipped, never invented.
 * The JSON file is renamed to *.migrated so it never migrates twice.
 */
export const migrateLegacyNotifications = async () => {
  if (!fs.existsSync(legacyNotificationsPath)) return { migrated: 0, skipped: 0, ran: false };
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(legacyNotificationsPath, "utf-8"));
  } catch (err) {
    console.warn("P2-C7: legacy notifications file unreadable, skipping migration:", err.message);
    return { migrated: 0, skipped: 0, ran: false };
  }
  const rows = Array.isArray(parsed.notifications) ? parsed.notifications : [];
  let migrated = 0;
  let skipped = 0;
  const userCache = new Map();
  for (const rawRow of rows) {
    const mapped = mapLegacyNotificationRow(rawRow);
    if (!mapped) { skipped += 1; continue; }
    try {
      if (!userCache.has(mapped.client_code)) {
        const user = await User.findOne({ where: { client_code: mapped.client_code }, attributes: ["id", "client_code"] });
        userCache.set(mapped.client_code, user || null);
      }
      const user = userCache.get(mapped.client_code);
      if (!user) { skipped += 1; continue; }
      await Notification.create({ user_id: user.id, ...mapped });
      migrated += 1;
    } catch (err) {
      skipped += 1;
      console.warn("P2-C7: skipping legacy notification row:", err.message);
    }
  }
  try {
    fs.renameSync(legacyNotificationsPath, legacyMigratedPath);
  } catch (err) {
    console.warn("P2-C7: could not rename legacy notifications file:", err.message);
  }
  console.log(`P2-C7: migrated ${migrated} legacy notifications, skipped ${skipped}.`);
  return { migrated, skipped, ran: true };
};

// Re-exported for the route layer (ownership lives in the routes, the pure
// comparison lives in notification-access.js).
export { canAccessClientNotifications };
