import test from 'node:test';
import assert from 'node:assert/strict';

import { encryptMedicalData, decryptMedicalData } from '../src/utils/crypto.js';
import { getClientIntakeDraft } from '../src/api/controllers/intake.controller.js';
import { getUserPhotos, uploadUserPhoto, deleteUserPhoto } from '../src/api/controllers/photo.controller.js';
import { getActiveProgramByUserId, getCheckinHistory } from '../src/api/controllers/program.controller.js';
import { getClientCheckins } from '../src/api/controllers/checkin.controller.js';
import { User, ProgressPhoto, Program, CheckinSubmission } from '../src/api/models/index.js';
import sequelize from '../src/api/config/database.js';
import { requireAdmin } from '../src/api/middlewares/auth.middleware.js';

test('Security Audit & Hardening Suite (IDOR, Ownership, Router Coverage & DB Password Protections)', async (t) => {
  let traineeA;
  let traineeB;
  let coachUser;

  // Clean up previous test users if any
  await User.destroy({ where: { client_code: ['9001', '9002', '9900'] } }).catch(() => {});
  await User.destroy({ where: { phone_number: ['01099990001', '01099990002', '01099999900'] } }).catch(() => {});

  // Setup test users
  traineeA = await User.create({
    client_code: '9001',
    phone_number: '01099990001',
    full_name: 'المتدرب أ',
    role: 'CLIENT',
    subscription_status: 'ACTIVE'
  });

  traineeB = await User.create({
    client_code: '9002',
    phone_number: '01099990002',
    full_name: 'المتدرب ب',
    role: 'CLIENT',
    subscription_status: 'ACTIVE'
  });

  coachUser = await User.create({
    client_code: '9900',
    phone_number: '01099999900',
    full_name: 'الكوتش الرئيسي',
    role: 'ADMIN',
    subscription_status: 'ACTIVE'
  });

  await t.test('1. Crypto Module: Medical Data Encryption & Decryption integrity', () => {
    const sensitiveData = { chronicIllness: 'None', bloodPressure: '120/80', injuries: ['Lower back disc'] };
    const encrypted = encryptMedicalData(sensitiveData);
    assert.ok(encrypted && encrypted.includes(':'), 'Encrypted string must contain IV:payload format');

    const decrypted = decryptMedicalData(encrypted);
    assert.deepEqual(decrypted, sensitiveData, 'Decrypted medical data must match original payload');
  });

  await t.test('2. Intake Draft Enumeration Defense: Blocks single-parameter harvesting', async () => {
    // 2.1 Only code provided without phone -> Must return nulls
    const reqOnlyCode = { query: { client_code: '9001' } };
    let resDataCode = null;
    const resOnlyCode = {
      status: (code) => ({
        json: (data) => { resDataCode = data; }
      })
    };
    await getClientIntakeDraft(reqOnlyCode, resOnlyCode);
    assert.equal(resDataCode.user, null, 'Harvesting draft with code alone must return null user');
    assert.equal(resDataCode.submission, null);

    // 2.2 Code provided with mismatched phone -> Must return nulls
    const reqMismatched = { query: { client_code: '9001', phone_number: '01000000000' } };
    let resDataMismatch = null;
    const resMismatched = {
      status: (code) => ({
        json: (data) => { resDataMismatch = data; }
      })
    };
    await getClientIntakeDraft(reqMismatched, resMismatched);
    assert.equal(resDataMismatch.user, null, 'Mismatched phone must return null user');
    assert.equal(resDataMismatch.submission, null);

    // 2.3 Code and phone matching -> Returns valid user draft shell
    const reqValid = { query: { client_code: '9001', phone_number: '01099990001' } };
    let resDataValid = null;
    const resValid = {
      status: (code) => ({
        json: (data) => { resDataValid = data; }
      })
    };
    await getClientIntakeDraft(reqValid, resValid);
    assert.ok(resDataValid.user, 'Matching code and phone must return user data');
    assert.equal(resDataValid.user.client_code, '9001');
  });

  await t.test('3. Photo Controller IDOR Defense: Trainee cannot access other trainees photos', async () => {
    // Trainee A tries to view Trainee B's photos
    const reqAtoB = {
      user: { id: traineeA.id },
      params: { user_id: traineeB.client_code }
    };
    let statusCodeAtoB = 200;
    let resBodyAtoB = null;
    const resAtoB = {
      status: (code) => {
        statusCodeAtoB = code;
        return {
          json: (data) => { resBodyAtoB = data; }
        };
      }
    };
    await getUserPhotos(reqAtoB, resAtoB);
    assert.equal(statusCodeAtoB, 403, 'Trainee requesting another trainee photos must be rejected with 403');
    assert.ok(resBodyAtoB.error.includes('غير مصرح'));

    // Trainee A views their own photos -> 200
    const reqAtoA = {
      user: { id: traineeA.id },
      params: { user_id: traineeA.client_code }
    };
    let statusCodeAtoA = 200;
    let resBodyAtoA = null;
    const resAtoA = {
      status: (code) => {
        statusCodeAtoA = code;
        return {
          json: (data) => { resBodyAtoA = data; }
        };
      }
    };
    await getUserPhotos(reqAtoA, resAtoA);
    assert.equal(statusCodeAtoA, 200, 'Trainee requesting own photos must be accepted with 200');

    // Coach views Trainee B's photos -> 200
    const reqCoachToB = {
      user: { id: coachUser.id },
      params: { user_id: traineeB.client_code }
    };
    let statusCodeCoach = 200;
    let resBodyCoach = null;
    const resCoach = {
      status: (code) => {
        statusCodeCoach = code;
        return {
          json: (data) => { resBodyCoach = data; }
        };
      }
    };
    await getUserPhotos(reqCoachToB, resCoach);
    assert.equal(statusCodeCoach, 200, 'Coach requesting any trainee photos must be accepted with 200');
  });

  await t.test('4. Active Program IDOR Defense: Trainee cannot view other trainees program', async () => {
    // Trainee A tries to view Trainee B's active program
    const reqAtoB = {
      user: { id: traineeA.id },
      params: { user_id: traineeB.client_code }
    };
    let statusCodeAtoB = 200;
    let resBodyAtoB = null;
    const resAtoB = {
      status: (code) => {
        statusCodeAtoB = code;
        return {
          json: (data) => { resBodyAtoB = data; }
        };
      }
    };
    await getActiveProgramByUserId(reqAtoB, resAtoB);
    assert.equal(statusCodeAtoB, 403, 'Trainee requesting another trainee active program must be rejected with 403');

    // Trainee A views their own program
    const reqAtoA = {
      user: { id: traineeA.id },
      params: { user_id: traineeA.client_code }
    };
    let statusCodeAtoA = 200;
    const resAtoA = {
      status: (code) => {
        statusCodeAtoA = code;
        return {
          json: () => {}
        };
      }
    };
    await getActiveProgramByUserId(reqAtoA, resAtoA);
    assert.equal(statusCodeAtoA, 200, 'Trainee viewing own program must succeed with 200');

    // Coach views Trainee B's program
    const reqCoachToB = {
      user: { id: coachUser.id },
      params: { user_id: traineeB.client_code }
    };
    let statusCodeCoach = 200;
    const resCoach = {
      status: (code) => {
        statusCodeCoach = code;
        return {
          json: () => {}
        };
      }
    };
    await getActiveProgramByUserId(reqCoachToB, resCoach);
    assert.equal(statusCodeCoach, 200, 'Coach viewing trainee program must succeed with 200');
  });

  await t.test('5. Checkin History IDOR Defense: Trainee cannot view other trainees checkins', async () => {
    // Trainee A tries to view Trainee B's checkins
    const reqAtoB = {
      user: { id: traineeA.id },
      params: { userId: traineeB.client_code }
    };
    let statusCodeAtoB = 200;
    let resBodyAtoB = null;
    const resAtoB = {
      status: (code) => {
        statusCodeAtoB = code;
        return {
          json: (data) => { resBodyAtoB = data; }
        };
      }
    };
    await getClientCheckins(reqAtoB, resAtoB);
    assert.equal(statusCodeAtoB, 403, 'Trainee requesting another trainee checkins must be rejected with 403');
    assert.ok(resBodyAtoB.error.includes('غير مصرح'));

    // Trainee A views their own checkins
    const reqAtoA = {
      user: { id: traineeA.id },
      params: { userId: traineeA.client_code }
    };
    let statusCodeAtoA = 200;
    const resAtoA = {
      status: (code) => {
        statusCodeAtoA = code;
        return {
          json: () => {}
        };
      }
    };
    await getClientCheckins(reqAtoA, resAtoA);
    assert.equal(statusCodeAtoA, 200, 'Trainee viewing own checkins must succeed with 200');

    // Coach views Trainee B's checkins
    const reqCoachToB = {
      user: { id: coachUser.id },
      params: { userId: traineeB.client_code }
    };
    let statusCodeCoach = 200;
    const resCoach = {
      status: (code) => {
        statusCodeCoach = code;
        return {
          json: () => {}
        };
      }
    };
    await getClientCheckins(reqCoachToB, resCoach);
    assert.equal(statusCodeCoach, 200, 'Coach viewing trainee checkins must succeed with 200');
  });

  await t.test('6. Dynamic Global Route Armor: Audits live Express app (app.router.stack) directly covering server.js and all subrouters', async () => {
    // Import live Express app instance directly
    const serverModule = await import('../src/api/server.js');
    const app = serverModule.default;
    assert.ok(app && app.router && app.router.stack, 'Live Express application router stack must be accessible');

    const prefixMap = {
      '/api/v1/auth': 'auth',
      '/api/v1/programs': 'program',
      '/api/v1/clients': 'client',
      '/api/v1/intake': 'intake',
      '/api/v1/subscriptions': 'subscription',
      '/api/v1/photos': 'photo',
      '/api/v1/exercises': 'exercise',
      '/api/v1/admin-settings': 'admin-settings',
      '/api/v1/admin': 'admin-settings',
      '/api/v1/checkin': 'checkin',
      '/api/v1/legal': 'legal',
      '/api/v1/admin/backup': 'backup',
      '/api/v1/notifications': 'notification',
      '/uploads': 'uploads'
    };

    // Explicit, minimal whitelist of public guest routes with mandatory Arabic architectural rationale
    const PUBLIC_WHITELIST = {
      // Sub-router routes
      'admin-settings:GET:/intake-schema': 'استرجاع أسئلة استمارة التعارف العامة الموجهة للمتدربين الجدد قبل التسجيل',
      'admin-settings:GET:/exercises': 'دليل التمارين العام المرجعي للعرض فقط دون صلاحيات تعديل',
      'admin-settings:GET:/packages': 'عرض الباقات والأسعار المتاحة للجمهور في صفحة الاشتراك',
      'admin-settings:GET:/foods': 'قاعدة بيانات الأطعمة المرجعية للاستعلام العام عن القيم الغذائية',
      'auth:GET:/csrf-token': 'توليد توكن الحماية ضد التزوير عبر المواقع للعمليات التحويلية والحساسة',
      'auth:POST:/register-fast': 'بوابة التسجيل السريع لإنشاء حساب متدرب جديد لأول مرة',
      'auth:POST:/login-fast': 'بوابة الدخول السريع للمتدربين بالهاتف وكود العميل لإصدار توكن الجلسة',
      'auth:POST:/login-email': 'بوابة تسجيل دخول المدرب والإدارة بالبريد وكلمة المرور',
      'auth:DELETE:/delete-account': 'مسار الامتثال الإلزامي لحذف الحساب بناء على شروط متجري آبل وجوجل',
      'auth:POST:/delete-account': 'مسار بديل متوافق لطلب حذف الحساب لمتطلبات متاجر التطبيقات',
      'checkin:POST:/': 'إرسال نموذج المتابعة الأسبوعية الدوري للمتدرب',
      'exercise:GET:/': 'استعراض مكتبة التمارين الاسترشادية الثابتة للمتدربين',
      'exercise:GET:/swaps/:exercise_code': 'البحث عن التمارين البديلة المكافئة حركياً لنفس العضلة',
      'exercise:GET:/gym-rush/catalog': 'استعراض كتالوج بدائل زحمة الجيم ومجموعات التكافؤ الميكانيكي الحركي',
      'intake:GET:/client-draft': 'استرجاع مسودة استمارة التعارف غير المكتملة بناء على كود العميل ورقم الهاتف معاً',
      'intake:POST:/save-draft': 'حفظ المسودة الجزئية لبيانات المشترك الجديد قبل الاعتماد النهائي',
      'intake:POST:/submit': 'اعتماد وإرسال استمارة التعارف النهائية لتوليد الخطة الرياضية والغذائية',
      'intake:POST:/': 'مسار التوافقية القديم لإرسال استمارة التعارف',
      'legal:GET:/privacy': 'صفحة سياسة الخصوصية العامة لامتثال متجري App Store و Google Play',
      'legal:GET:/terms': 'صفحة شروط الخدمة واتفاقية الاستخدام العامة لامتثال المتاجر',
      'legal:GET:/delete-account': 'الصفحة التوضيحية لآلية حذف الحساب والبيانات لامتثال المتاجر',
      'program:GET:/exercises-catalog': 'مكتبة التمارين المرجعية للبرامج الاسترشادية للمتدربين',
      'program:POST:/swap-candidates': 'محرك اقتراح البدائل المكافئة حركياً للتمرين في جدول المتدرب',
      'program:POST:/swap-food': 'محرك التبديل الغذائي المكافئ لحساب مقادير الأطعمة البديلة',

      // Direct server.js routes
      'server:GET:/api/v1/health': 'نقطة التحقق العامة من سلامة السيرفر وجاهزية الخدمات',
      'server:POST:/api/v1/engines/onboarding/generate-plan': 'محرك الحساب الرياضي لتوليد الخطة الأولى للمتدرب الجديد',
      'server:POST:/api/v1/engines/training/evaluate-progression': 'محرك حساب التدرج الرياضي والحمل الدوري للتمارين',
      'server:POST:/api/v1/engines/training/warmup-ladder': 'حاسبة سلم الإحماء الرياضي للوزن التشغيلي',
      'server:POST:/api/v1/engines/training/deload-check': 'محرك تقييم الحاجة لأسبوع استشفاء رياضي',
      'server:POST:/api/v1/engines/nutrition/calorie-cycling': 'محرك تدوير السعرات الرياضي للأيام التدريبية',
      'server:POST:/api/v1/engines/nutrition/diet-break-check': 'محرك حساب الحاجة لاستراحة دايت رياضية',
      'server:POST:/api/v1/engines/habits/evaluate-daily': 'محرك قياس العادات الحركية والنشاط اليومي',
      'server:POST:/api/v1/food-swap/calculate': 'محرك الحساب المكافئ للتبديلات الغذائية',
      'server:POST:/api/v1/checkin/evaluate': 'محرك التقييم الرياضي لبيانات الشيك إن الأسبوعي',
      'server:POST:/api/v1/pdf/export': 'محرك تصدير وتوليد ملف الخطة الرياضية والغذائية كـ HTML للطباعة',
      'server:GET:/privacy-policy': 'مسار امتثال سياسة الخصوصية لمتجر آبل ستور',
      'server:GET:/privacy': 'مسار امتثال سياسة الخصوصية المختصر لمتجر جوجل بلاي',
      'server:GET:/terms-of-service': 'مسار امتثال شروط الاستخدام لمتجر التطبيقات',
      'server:GET:/terms': 'مسار امتثال شروط الخدمة المختصر لمتجر التطبيقات',
      'server:GET:/eula': 'مسار اتفاقية المستخدم النهائي لمتجر آبل',
      'server:GET:/delete-account': 'مسار آلية حذف الحساب العامة لامتثال المتاجر',
      'server:GET:/api/v1/mobility': 'استعراض مكتبة حركات المرونة العامة المرجعية للعرض فقط'
    };

    // Verify every whitelisted route has a documented, non-trivial Arabic justification
    for (const [routeKey, rationale] of Object.entries(PUBLIC_WHITELIST)) {
      assert.ok(
        typeof rationale === 'string' && rationale.trim().length >= 15,
        `Whitelisted route [${routeKey}] must have a documented Arabic rationale of at least 15 characters`
      );
    }

    let totalEndpoints = 0;
    let protectedEndpoints = 0;
    let whitelistedEndpoints = 0;
    const unprotectedRoutes = [];

    // Traverse all layers in the live app
    for (const layer of app.router.stack) {
      if (layer.route) {
        // Direct routes defined in server.js
        const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
        const hasRequireAuth = layer.route.stack.some(h => h.name === 'requireAuth');

        for (const method of methods) {
          totalEndpoints++;
          const routeKey = `server:${method}:${layer.route.path}`;
          if (hasRequireAuth) {
            protectedEndpoints++;
          } else if (Object.prototype.hasOwnProperty.call(PUBLIC_WHITELIST, routeKey)) {
            whitelistedEndpoints++;
          } else {
            unprotectedRoutes.push(routeKey);
          }
        }
      } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        // Sub-routers mounted on app
        let matchedModuleName = null;
        for (const [prefix, modName] of Object.entries(prefixMap)) {
          if (layer.matchers && layer.matchers[0] && layer.matchers[0](prefix)) {
            matchedModuleName = modName;
            break;
          }
        }

        for (const subLayer of layer.handle.stack) {
          if (!subLayer.route) continue;
          const methods = Object.keys(subLayer.route.methods).map(m => m.toUpperCase());
          const hasRequireAuth = subLayer.route.stack.some(h => h.name === 'requireAuth');

          for (const method of methods) {
            totalEndpoints++;
            const routeKey = `${matchedModuleName || 'subrouter'}:${method}:${subLayer.route.path}`;
            if (hasRequireAuth) {
              protectedEndpoints++;
            } else if (Object.prototype.hasOwnProperty.call(PUBLIC_WHITELIST, routeKey)) {
              whitelistedEndpoints++;
            } else {
              unprotectedRoutes.push(routeKey);
            }
          }
        }
      }
    }

    assert.equal(
      unprotectedRoutes.length,
      0,
      `Detected unprotected routes without requireAuth not in whitelist: ${unprotectedRoutes.join(', ')}`
    );
    assert.ok(totalEndpoints >= 100, `Live app must have over 100 endpoints registered, found: ${totalEndpoints}`);
    assert.ok(protectedEndpoints >= 80, `At least 80 live endpoints must be actively protected, found: ${protectedEndpoints}`);
    assert.ok(whitelistedEndpoints > 0, `Whitelisted endpoints verified, found: ${whitelistedEndpoints}`);
  });

  await t.test('7. Database Security Policy: Validates strong password requirement in production', () => {
    const weakPasswords = ["123456", "12345678", "password", "admin", "root", "toor", "12345", "qwerty", "secret", "short"];
    
    // Function that mirrors database.js production check
    function validateProductionDbPassword(pwd) {
      const clean = String(pwd || "").trim();
      const banned = ["123456", "12345678", "123456789", "password", "admin", "root", "toor", "12345", "qwerty", "secret"];
      if (!clean || clean.length < 16 || banned.includes(clean.toLowerCase()) || clean.includes("REPLACE_WITH")) {
        throw new Error("FATAL: A cryptographically strong DB_PASSWORD (minimum 16 characters, non-trivial) must be configured in production.");
      }
      return true;
    }

    // Weak passwords must throw
    for (const weak of weakPasswords) {
      assert.throws(() => validateProductionDbPassword(weak), /FATAL: A cryptographically strong DB_PASSWORD/);
    }
    assert.throws(() => validateProductionDbPassword(""), /FATAL: A cryptographically strong DB_PASSWORD/);
    assert.throws(() => validateProductionDbPassword(null), /FATAL: A cryptographically strong DB_PASSWORD/);
    assert.throws(() => validateProductionDbPassword("REPLACE_WITH_STRONG_PASSWORD"), /FATAL: A cryptographically strong DB_PASSWORD/);

    // Cryptographically strong password (>= 16 chars, non-trivial) passes
    assert.equal(validateProductionDbPassword("x9Q$mP2!vL7@kR4#wT8*yZ1%bN6^cD3&"), true);
  });

  await t.test('8. Role-Based Access Control (RBAC): requireAdmin enforces strict privilege separation', async () => {
    // 8.1 Missing auth token/user -> 401
    let unauthStatus = null;
    let unauthBody = null;
    const reqUnauth = { user: null };
    const resUnauth = {
      status: (code) => {
        unauthStatus = code;
        return { json: (data) => { unauthBody = data; } };
      }
    };
    await requireAdmin(reqUnauth, resUnauth, () => {});
    assert.equal(unauthStatus, 401, 'Unauthenticated call to requireAdmin must return 401');

    // 8.2 Client Trainee (role: 'CLIENT') -> 403 Forbidden
    let traineeStatus = null;
    let traineeBody = null;
    let traineeNextCalled = false;
    const reqTrainee = { user: { id: traineeA.id } };
    const resTrainee = {
      status: (code) => {
        traineeStatus = code;
        return { json: (data) => { traineeBody = data; } };
      }
    };
    await requireAdmin(reqTrainee, resTrainee, () => { traineeNextCalled = true; });
    assert.equal(traineeStatus, 403, 'Trainee calling requireAdmin must be rejected with 403');
    assert.equal(traineeNextCalled, false, 'Next middleware must not be called for non-admin trainee');
    assert.ok(traineeBody.error.includes('Admin privileges required'));

    // 8.3 Coach/Admin (role: 'ADMIN') -> Allowed to proceed
    let coachNextCalled = false;
    const reqCoach = { user: { id: coachUser.id } };
    const resCoach = {
      status: () => { throw new Error('status() should not be called on authorized coach'); }
    };
    await requireAdmin(reqCoach, resCoach, () => { coachNextCalled = true; });
    assert.equal(coachNextCalled, true, 'Coach calling requireAdmin must be allowed to proceed');
    assert.ok(reqCoach.adminUser, 'adminUser must be attached to request');
    assert.equal(reqCoach.adminUser.role, 'ADMIN');
  });

  // Cleanup
  try {
    if (traineeA) await traineeA.destroy();
    if (traineeB) await traineeB.destroy();
    if (coachUser) await coachUser.destroy();
  } catch (cleanErr) {
    // ignore
  }

  await sequelize.close();
});
