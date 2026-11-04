import test from "node:test";
import assert from "node:assert/strict";
import {
  canAccessClientNotifications,
  resolveSseOrigin,
  mapLegacyNotificationRow,
} from "../src/notifications/notification-access.js";
import {
  buildDeliveryReport,
  createStubPushProvider,
} from "../src/notifications/push-provider.js";

// P2-C7: plain-node suite for the real notification behavior. Imports ONLY
// the pure modules (no model chain, no sequelize), so it runs under plain
// node. Live-DB behavior (token rows, inbox rows, purge, backup) is covered
// by the rewritten block in test/backup-and-notifications-soft-delete.test.js
// and needs a full environment.

test("P2-C7 ownership: only the inbox owner may read a client's notifications", async (t) => {
  const owner = { userId: 7, clientCode: "882", role: "CLIENT" };
  const otherClient = { userId: 9, clientCode: "913", role: "CLIENT" };
  const admin = { userId: 1, clientCode: "001", role: "ADMIN" };
  const coach = { userId: 2, clientCode: "002", role: "COACH" };

  await t.test("owner by client_code is allowed", () => {
    assert.equal(canAccessClientNotifications(owner, "882"), true);
  });

  await t.test("owner by numeric user id string is allowed", () => {
    assert.equal(canAccessClientNotifications(owner, "7"), true);
  });

  await t.test("another client is denied, even with a valid login", () => {
    assert.equal(canAccessClientNotifications(otherClient, "882"), false);
  });

  await t.test("ADMIN and COACH have NO bypass in this helper (client routes are owner-only)", () => {
    assert.equal(canAccessClientNotifications(admin, "882"), false);
    assert.equal(canAccessClientNotifications(coach, "882"), false);
  });

  await t.test("admin routes do not use this helper at all — they are gated by requireAdmin", () => {
    // The helper answers only "is this the owner?". An admin reading their
    // own code passes; reading another client's code fails here, and the
    // /history route (requireAdmin) is what serves admins instead.
    assert.equal(canAccessClientNotifications(admin, "001"), true);
    assert.equal(canAccessClientNotifications(admin, "882"), false);
  });

  await t.test("missing requester or missing code is denied (fail closed)", () => {
    assert.equal(canAccessClientNotifications(null, "882"), false);
    assert.equal(canAccessClientNotifications(owner, ""), false);
    assert.equal(canAccessClientNotifications(owner, null), false);
  });
});

test("P2-C7 SSE origin: never a wildcard, trusted origins echoed, others rejected", async (t) => {
  await t.test("no Origin (mobile app / curl) is allowed with no header to echo", () => {
    const d = resolveSseOrigin(undefined, "app.karimzakaria.com");
    assert.equal(d.allowed, true);
    assert.equal(d.echoOrigin, null);
  });

  await t.test("localhost and loopback origins are allowed and echoed", () => {
    for (const origin of ["http://localhost:3000", "http://127.0.0.1:5173", "http://[::1]:3000"]) {
      const d = resolveSseOrigin(origin, "app.karimzakaria.com");
      assert.equal(d.allowed, true, origin);
      assert.equal(d.echoOrigin, origin, origin);
    }
  });

  await t.test("same-host origin is allowed and echoed", () => {
    const d = resolveSseOrigin("https://app.karimzakaria.com", "app.karimzakaria.com");
    assert.equal(d.allowed, true);
    assert.equal(d.echoOrigin, "https://app.karimzakaria.com");
  });

  await t.test("untrusted third-party origin is rejected (fail closed)", () => {
    const d = resolveSseOrigin("https://evil.example.com", "app.karimzakaria.com");
    assert.equal(d.allowed, false);
    assert.equal(d.echoOrigin, null);
  });

  await t.test("no wildcard is ever echoed", () => {
    for (const origin of [undefined, "http://localhost:3000", "https://app.karimzakaria.com", "https://evil.example.com"]) {
      const d = resolveSseOrigin(origin, "app.karimzakaria.com");
      assert.notEqual(d.echoOrigin, "*");
    }
  });
});

test("P2-C7 stub push provider: attempts recorded, failures visible, no blanket success", async (t) => {
  await t.test("one failing token does not block other devices", async () => {
    const stub = createStubPushProvider({ failTokens: new Set(["dead-token"]) });
    const results = await stub.sendToDevices(
      [
        { id: 1, token: "dead-token", platform: "Mobile" },
        { id: 2, token: "good-token", platform: "Mobile" },
      ],
      { title: "t", body: "b" }
    );
    assert.equal(results.length, 2);
    assert.equal(results[0].delivered, false);
    assert.equal(results[1].delivered, true);
    assert.equal(stub.attempts.length, 2);
  });

  await t.test("delivery report counts attempted / delivered / failed honestly", () => {
    const report = buildDeliveryReport({
      sseRecipients: 0,
      pushResults: [
        { delivered: true },
        { delivered: false, reason: "PROVIDER_NOT_INSTALLED" },
      ],
    });
    assert.equal(report.sseRecipients, 0);
    assert.equal(report.push.attempted, 2);
    assert.equal(report.push.delivered, 1);
    assert.equal(report.push.failed, 1);
    assert.match(report.summary, /1/);
    assert.match(report.summary, /فشل/);
  });

  await t.test("a send reaching nobody says so in its summary", () => {
    const report = buildDeliveryReport({ sseRecipients: 0, pushResults: [] });
    assert.match(report.summary, /لم يصل/);
    assert.equal(report.push.attempted, 0);
  });
});

test("P2-C7 legacy row mapping: maps real rows, never invents values", async (t) => {
  await t.test("a complete legacy row maps to an inbox row", () => {
    const mapped = mapLegacyNotificationRow({
      id: "notif_abc",
      client_code: "882",
      title: "موعد الشيك إن الأسبوعي اليوم",
      body: "يرجى تسجيل وزن الصباح.",
      payload: { type: "CHECKIN_REMINDER" },
      is_read: false,
      created_at: "2026-10-01T08:00:00.000Z",
    });
    assert.ok(mapped);
    assert.equal(mapped.client_code, "882");
    assert.equal(mapped.title, "موعد الشيك إن الأسبوعي اليوم");
    assert.equal(mapped.type, "CHECKIN_REMINDER");
    assert.equal(mapped.is_read, false);
  });

  await t.test("a row without a usable client code or title is dropped, not invented", () => {
    assert.equal(mapLegacyNotificationRow({ title: "x" }), null);
    assert.equal(mapLegacyNotificationRow({ client_code: "882" }), null);
    assert.equal(mapLegacyNotificationRow({ client_code: "   ", title: "x" }), null);
    assert.equal(mapLegacyNotificationRow(null), null);
  });

  await t.test("payload type falls back to GENERAL, never to an invented type", () => {
    const mapped = mapLegacyNotificationRow({ client_code: "882", title: "t", body: "b" });
    assert.equal(mapped.type, "GENERAL");
  });
});
