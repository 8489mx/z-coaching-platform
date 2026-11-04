import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  performDatabaseBackup,
  performPhotosBackup,
  performFullBackup,
  getBackupManifest
} from "../src/api/services/backup.service.js";
import {
  registerDeviceToken,
  sendPushNotification,
  notifyProgramPublished,
  notifyCheckinReviewed,
  notifyCheckinReminder,
  getNotificationsLog
} from "../src/api/services/notification.service.js";
import { deleteAccount, loginFast } from "../src/api/controllers/auth.controller.js";
import { User, Notification, DeviceToken } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("منظومة النسخ الاحتياطي التلقائي (Automated Backup Engine)", async (t) => {
  await t.test("إجراء نسخ احتياطي مضغوط لقاعدة البيانات مع التحقق من التشفير SHA-256", async () => {
    const dbBackup = await performDatabaseBackup();
    assert.equal(dbBackup.success, true);
    assert.ok(dbBackup.backupId.startsWith("db_"));
    assert.ok(fs.existsSync(dbBackup.filePath));
    assert.ok(dbBackup.sizeBytes > 0);
    assert.ok(dbBackup.sha256 && dbBackup.sha256.length === 64);
    assert.ok(typeof dbBackup.statistics.total_users === "number");
  });

  await t.test("أرشفة وفهرسة مجلد صور المشتركين دون المساس بأي صور سابقة", async () => {
    const photosBackup = await performPhotosBackup();
    assert.equal(photosBackup.success, true);
    assert.ok(photosBackup.backupId.startsWith("photos_"));
    assert.ok(typeof photosBackup.totalPhotos === "number");
  });

  await t.test("تنفيذ النسخ الاحتياطي الشامل وتحديث ملف الفهرس (Manifest)", async () => {
    const fullBackup = await performFullBackup("TEST_SUITE_TRIGGER");
    assert.equal(fullBackup.status, "SUCCESS");
    assert.equal(fullBackup.trigger_type, "TEST_SUITE_TRIGGER");
    assert.ok(fullBackup.duration_ms >= 0);

    const manifest = getBackupManifest();
    assert.ok(manifest.backups.length > 0);
    assert.equal(manifest.backups[0].id, fullBackup.id);
  });
});

test("منظومة الإشعارات الحية للمتدرب (Mobile Push Notifications)", async (t) => {
  // P2-C7 REWRITE (intentional behavior change, same precedent as P2-C3/C5
  // test updates): the old block tested the FAKE — registerDeviceToken
  // returned success without storing anything, and notify* returned bare
  // JSON rows with "notif_" ids. The new block tests real behavior: the
  // token is actually stored (and re-registering upserts, never duplicates),
  // sends return { notification, delivery } with honest counts, and inbox
  // rows are database rows with integer ids. Requires a live test database
  // (this file already imports the DB layer), so it stays unrunnable under
  // plain node — see test/p2c7-notifications-real.test.js for the
  // plain-node suite covering ownership, SSE origins, stub push, and
  // delivery-report shape.
  const stamp = Date.now();
  const testClientCode = `P2C7-${stamp}`;
  const testToken = `fcm_test_device_token_${stamp}`;
  const user = await User.create({
    client_code: testClientCode,
    phone_number: `+200000${String(stamp).slice(-9)}`,
    role: "CLIENT",
  });
  t.after(async () => {
    try {
      await Notification.destroy({ where: { user_id: user.id } });
      await DeviceToken.destroy({ where: { user_id: user.id } });
      await user.destroy();
    } catch (_) {
      // Cleanup is best-effort; never fail the suite on it.
    }
  });

  await t.test("تسجيل رمز جهاز المتدرب وتخزينه فعلياً في قاعدة البيانات", async () => {
    const reg = await registerDeviceToken(testClientCode, testToken, {
      platform: "Android",
      model: "Pixel 7"
    }, user.id);
    assert.equal(reg.success, true);
    assert.equal(reg.clientCode, testClientCode);
    assert.equal(reg.tokenRegistered, true);
    // P2-C7: the token must REALLY be stored now (pre-C7 this row never existed).
    const stored = await DeviceToken.findOne({ where: { token: testToken } });
    assert.ok(stored, "device token row must exist in the database");
    assert.equal(stored.user_id, user.id);
    assert.equal(stored.client_code, testClientCode);
    // Re-registering the same token upserts instead of duplicating.
    await registerDeviceToken(testClientCode, testToken, { platform: "Android" }, user.id);
    assert.equal(await DeviceToken.count({ where: { token: testToken } }), 1);
  });

  await t.test("إرسال إشعار تذكير بالشيك إن الأسبوعي وتسجيله في صندوق الوارد", async () => {
    const { notification: reminder, delivery } = await notifyCheckinReminder(testClientCode);
    assert.equal(typeof reminder.id, "number");
    assert.equal(reminder.client_code, testClientCode);
    assert.ok(reminder.title.includes("الشيك إن"));
    // Honest delivery report: no SSE clients are connected in tests, and
    // the test token has no configured provider, so the push attempt is
    // recorded as failed — never reported as delivered.
    assert.equal(delivery.sseRecipients, 0);
    assert.equal(delivery.push.attempted, 1);
    assert.equal(delivery.push.delivered, 0);
    assert.equal(delivery.push.failed, 1);

    const logs = await getNotificationsLog();
    assert.ok(logs.some((l) => l.id === reminder.id));
  });

  await t.test("إرسال إشعار اعتماد ونشر البرنامج التدريبي والغذائي", async () => {
    const { notification: pub, delivery } = await notifyProgramPublished(testClientCode, "برنامج الضخامة العضلية المتطور");
    assert.equal(typeof pub.id, "number");
    assert.equal(pub.client_code, testClientCode);
    assert.ok(pub.title.includes("اعتماد"));
    assert.equal(pub.payload.type, "PROGRAM_PUBLISHED");
    assert.equal(typeof delivery.summary, "string");
  });

  await t.test("إرسال إشعار مراجعة الشيك إن وإرفاق ملخص الكوتش", async () => {
    const { notification: rev } = await notifyCheckinReviewed(testClientCode, "ممتاز يا بطل، تم خفض 100 سعرة حرارية ورفع خطوات النشاط.");
    assert.equal(typeof rev.id, "number");
    assert.equal(rev.client_code, testClientCode);
    assert.equal(rev.payload.type, "CHECKIN_REVIEWED");
  });
});

test("آلية حذف الحساب الصامت والمحمي (Soft Deletion Compliance)", async (t) => {
  const mockCode = "TEST_DEL_777";
  const mockPhone = "01099887766";

  // إعداد مستخدم تجريبي
  let testUser = await User.findOne({ where: { client_code: mockCode } });
  if (!testUser) {
    testUser = await User.create({
      client_code: mockCode,
      phone_number: mockPhone,
      full_name: "عميل تجربة الحذف الصامت",
      subscription_status: "ACTIVE"
    });
  } else {
    await testUser.update({ subscription_status: "ACTIVE" });
  }

  // محاكاة استدعاء deleteAccount من تطبيق الهاتف
  const reqMock = {
    body: { client_code: mockCode }
  };
  let resStatus = 0;
  let resBody = null;
  const resMock = {
    status: (code) => {
      resStatus = code;
      return {
        json: (data) => {
          resBody = data;
          return data;
        }
      };
    }
  };

  await deleteAccount(reqMock, resMock);

  await t.test("إرجاع رسالة نجاح للمتجر وتطبيق العميل (Apple/Google Policy)", () => {
    assert.equal(resStatus, 200);
    assert.equal(resBody.success, true);
    assert.ok(resBody.message.includes("تم حذف الحساب"));
  });

  await t.test("بقاء سجل المستخدم وبياناته كاملة في قاعدة البيانات للكوتش دون حذف فيزيائي", async () => {
    const userInDb = await User.findOne({ where: { client_code: mockCode } });
    assert.ok(userInDb !== null, "المستخدم يجب ألا يُحذف نهائياً من قاعدة البيانات");
    assert.equal(userInDb.subscription_status, "DEACTIVATED", "يجب أن تتحول حالته إلى DEACTIVATED فقط");
    assert.ok(userInDb.notes.includes("تم طلب حذف الحساب"), "يجب توثيق طلب الحذف داخل الملاحظات كأرشيف دائم");
  });

  await t.test("منع تسجيل الدخول للحساب المعطل مع إرجاع تنبيه إرشادي سليم", async () => {
    let loginStatus = 0;
    let loginBody = null;
    const loginReq = {
      body: { client_code: mockCode, phone_number: mockPhone },
      clientIp: "127.0.0.1"
    };
    const loginRes = {
      status: (code) => {
        loginStatus = code;
        return {
          json: (data) => {
            loginBody = data;
            return data;
          }
        };
      }
    };

    await loginFast(loginReq, loginRes);
    assert.equal(loginStatus, 403, "يجب منع العميل من تسجيل الدخول بحالة 403");
    assert.ok(loginBody.error.includes("تم إغلاق هذا الحساب"));
  });

  // تنظيف السجل التجريبي
  await testUser.destroy().catch(() => {});
  await sequelize.close().catch(() => {});
});
