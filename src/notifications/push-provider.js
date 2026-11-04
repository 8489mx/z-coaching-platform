// P2-C7: push delivery provider abstraction (no database import, runnable under
// plain node). Delivery is NEVER reported as success unless a provider actually
// attempted it. When no provider is configured, send() returns a visible
// NOT_CONFIGURED result — never a fake success.
//
// Token shapes:
// - Web Push subscription: a JSON string (or object) with an `endpoint` field.
//   Sent via the `web-push` package (declared in package.json) + VAPID keys
//   from environment (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT).
// - FCM device token: a plain string. Sent via `firebase-admin` when installed,
//   with GOOGLE_APPLICATION_CREDENTIALS pointing at a service-account file.
//   When firebase-admin is absent, the attempt is reported NOT_CONFIGURED.
// Both libraries are loaded lazily so this module stays importable (and the
// server stays bootable) before the owner finishes provider setup.

/**
 * Build the honest delivery report for one notification.
 * sseRecipients: number of live SSE connections the notification reached.
 * pushResults: per-device results from sendPushToDevices (may be empty).
 */
export function buildDeliveryReport({ sseRecipients = 0, pushResults = [] } = {}) {
  const attempted = pushResults.length;
  const delivered = pushResults.filter((r) => r.delivered === true).length;
  const failed = pushResults.filter((r) => r.delivered === false).length;
  // Arabic summary: the coach sees this verbatim in the dashboard, so it
  // must read as a real report — including when it reached nobody live.
  let summary = `تم حفظ الإشعار في صندوق الوارد؛ وصل إلى ${sseRecipients} بث مباشر؛ دفع: ${delivered} تم التسليم، ${failed} فشل، ${attempted} محاولة`;
  if (sseRecipients === 0 && delivered === 0) {
    summary += " (لم يصل إلى أي جهاز مباشر — سيظهر في صندوق الوارد عند فتح التطبيق)";
  }
  return {
    sseRecipients,
    push: { attempted, delivered, failed, results: pushResults },
    summary,
  };
}

/**
 * Send one payload to one device through the configured provider.
 * Returns a result object, never throws for a delivery failure (callers must
 * see failures). Throws only for a programming error (missing token).
 */
export async function sendPushToDevice(device, payload, env = process.env) {
  const rawToken = device && device.token ? String(device.token) : "";
  if (!rawToken) throw new Error("sendPushToDevice: device token is required");
  let subscription = null;
  try {
    const parsed = JSON.parse(rawToken);
    if (parsed && typeof parsed.endpoint === "string") subscription = parsed;
  } catch {
    subscription = null;
  }
  if (subscription) return sendWebPush(subscription, payload, env);
  return sendFcm(device, payload, env);
}

async function sendWebPush(subscription, payload, env) {
  const publicKey = env.VAPID_PUBLIC_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return { delivered: false, channel: "web-push", reason: "NOT_CONFIGURED", detail: "VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY are not set" };
  }
  let webpush;
  try {
    webpush = await import("web-push");
  } catch {
    return { delivered: false, channel: "web-push", reason: "PROVIDER_NOT_INSTALLED", detail: "web-push package is not installed; run npm install" };
  }
  try {
    const lib = webpush.default || webpush;
    lib.setVapidDetails(env.VAPID_SUBJECT || "mailto:coach@z-coaching.local", publicKey, privateKey);
    await lib.sendNotification(subscription, JSON.stringify(payload));
    return { delivered: true, channel: "web-push" };
  } catch (err) {
    // 410 Gone = subscription expired/unsubscribed; the caller prunes it.
    return { delivered: false, channel: "web-push", reason: "SEND_FAILED", detail: err.message || "web-push send failed", statusCode: err.statusCode || null };
  }
}

async function sendFcm(device, payload, env) {
  let admin;
  try {
    admin = await import("firebase-admin");
  } catch {
    return { delivered: false, channel: "fcm", reason: "NOT_CONFIGURED", detail: "firebase-admin is not installed and GOOGLE_APPLICATION_CREDENTIALS is not set; see docs/notifications-setup.md" };
  }
  try {
    const sdk = admin.default || admin;
    if (sdk.apps && sdk.apps.length === 0) {
      sdk.initializeApp({ credential: sdk.credential.applicationDefault() });
    }
    const message = {
      token: device.token,
      notification: { title: payload.title, body: payload.body },
      data: { type: String((payload.payload && payload.payload.type) || "GENERAL") },
    };
    await sdk.messaging().send(message);
    return { delivered: true, channel: "fcm" };
  } catch (err) {
    return { delivered: false, channel: "fcm", reason: "SEND_FAILED", detail: err.message || "FCM send failed", code: err.code || null };
  }
}

/**
 * Send to many devices; one device's failure never blocks the others.
 * Returns the per-device results array (possibly empty when no devices).
 */
export async function sendPushToDevices(devices, payload, env = process.env) {
  const results = [];
  for (const device of devices || []) {
    try {
      const r = await sendPushToDevice(device, payload, env);
      results.push({ tokenPreview: String(device.token).slice(0, 12) + "…", ...r });
    } catch (err) {
      results.push({ tokenPreview: String(device.token).slice(0, 12) + "…", delivered: false, channel: "unknown", reason: "ERROR", detail: err.message });
    }
  }
  return results;
}

/**
 * In-memory stub provider for tests: records attempts, succeeds or fails per
 * token according to `failTokens` (a set of token previews to fail).
 */
export function createStubPushProvider({ failTokens = [] } = {}) {
  // Accept a Set or an Array of tokens to fail.
  const failList = failTokens instanceof Set ? [...failTokens] : (failTokens || []);
  const attempts = [];
  const stub = {
    attempts,
    async send(device, payload) {
      const preview = String(device.token).slice(0, 12);
      attempts.push({ token: device.token, payload });
      if (failList.includes(preview) || failList.includes(device.token)) {
        return { delivered: false, channel: "stub", reason: "SEND_FAILED", detail: "stubbed failure" };
      }
      return { delivered: true, channel: "stub" };
    },
    // Multi-device mirror of sendPushToDevices: one failure never blocks others.
    async sendToDevices(devices, payload) {
      const results = [];
      for (const device of devices || []) {
        results.push(await stub.send(device, payload));
      }
      return results;
    },
  };
  return stub;
}
