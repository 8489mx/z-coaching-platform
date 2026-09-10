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
import { User } from "../src/api/models/index.js";
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
  const testClientCode = "999";
  const testToken = "fcm_test_device_token_sample_12345";

  await t.test("تسجيل وتخزين رمز جهاز المتدرب بنجاح", async () => {
    const reg = await registerDeviceToken(testClientCode, testToken, {
      platform: "Android",
      model: "Pixel 7"
    });
    assert.equal(reg.success, true);
    assert.equal(reg.clientCode, testClientCode);
    assert.equal(reg.tokenRegistered, true);
  });

  await t.test("إرسال إشعار تذكير بالشيك إن الأسبوعي وتسجيله في سجل الإشعارات", async () => {
    const reminder = await notifyCheckinReminder(testClientCode);
    assert.ok(reminder.id.startsWith("notif_"));
    assert.equal(reminder.client_code, testClientCode);
    assert.ok(reminder.title.includes("الشيك إن"));

    const logs = getNotificationsLog();
    assert.ok(logs.some(l => l.id === reminder.id));
  });

  await t.test("إرسال إشعار اعتماد ونشر البرنامج التدريبي والغذائي", async () => {
    const pub = await notifyProgramPublished(testClientCode, "برنامج الضخامة العضلية المتطور");
    assert.ok(pub.id.startsWith("notif_"));
    assert.equal(pub.client_code, testClientCode);
    assert.ok(pub.title.includes("اعتماد"));
    assert.equal(pub.payload.type, "PROGRAM_PUBLISHED");
  });

  await t.test("إرسال إشعار مراجعة الشيك إن وإرفاق ملخص الكوتش", async () => {
    const rev = await notifyCheckinReviewed(testClientCode, "ممتاز يا بطل، تم خفض 100 سعرة حرارية ورفع خطوات النشاط.");
    assert.ok(rev.id.startsWith("notif_"));
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
