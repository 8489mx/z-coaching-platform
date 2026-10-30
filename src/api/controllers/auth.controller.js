import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../models/index.js";
import { recordFailedAttempt, resetAttempts } from "../middlewares/rateLimiter.js";
import { recordAuditEvent } from "../services/auditLog.service.js";
import { generateCsrfToken } from "../middlewares/csrfProtection.js";
import { serializeUserUnitPreferences, parseUserUnitPreferences } from "../../../frontend/src/utils/unitConverter.js";

const generateToken = (userOrId, tokenVersion = 1) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("FATAL: JWT_SECRET environment variable is not defined");
  }
  const id = (userOrId && typeof userOrId === 'object') ? userOrId.id : userOrId;
  const version = (userOrId && typeof userOrId === 'object') ? (userOrId.token_version || 1) : (tokenVersion || 1);
  return jwt.sign({ id, token_version: version }, secret, {
    expiresIn: "30d",
  });
};

// Shared client lookup for the code + phone flows: the code is cleaned the
// same way loginFast always cleaned it, and the phone matches on full digits
// or the last 8 digits either way (the same lenient matching loginFast used
// before passwords existed). Returns the user or null; never throws for a
// missing user, so callers answer with the same generic 401 either way.
const findClientByCodeAndPhone = async (client_code, phone_number) => {
  const cleanCode = String(client_code).trim().replace(/^#+/, '').replace(/^client[-_]?/i, '');
  const cleanPhoneDigits = String(phone_number).replace(/\D/g, '');

  const user = await User.findOne({ where: { client_code: cleanCode } }) ||
             await User.findOne({ where: { id: isNaN(parseInt(cleanCode, 10)) ? 0 : parseInt(cleanCode, 10) } });
  if (!user) return null;

  const userPhoneDigits = String(user.phone_number || '').replace(/\D/g, '');
  const isPhoneMatch = (
    user.phone_number === String(phone_number).trim() ||
    userPhoneDigits === cleanPhoneDigits ||
    (cleanPhoneDigits.length >= 8 && userPhoneDigits.endsWith(cleanPhoneDigits.slice(-8))) ||
    (userPhoneDigits.length >= 8 && cleanPhoneDigits.endsWith(userPhoneDigits.slice(-8)))
  );
  return isPhoneMatch ? user : null;
};

// S4-2: one-time password setup for accounts created without one (coach
// addClient / intake / program generation all create password-less users).
// Proved by the same code + phone pair loginFast used to accept, usable only
// while the account has NO password: once a password exists, changing it
// requires an authenticated session (changePassword) or a coach reset, so
// code + phone alone can never overwrite a chosen secret.
export const setClientPassword = async (req, res) => {
  const ip = req.clientIp || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  try {
    const { client_code, phone_number, new_password } = req.body;

    if (!client_code || !phone_number || !new_password) {
      return res.status(400).json({ error: "يرجى إدخال كود المشترك ورقم الهاتف وكلمة المرور الجديدة معاً" });
    }

    const user = await findClientByCodeAndPhone(client_code, phone_number);

    if (!user) {
      await recordFailedAttempt(ip, client_code);
      return res.status(401).json({
        error: "بيانات الدخول غير صحيحة. يرجى التأكد من كتابة كود المشترك ورقم الهاتف المسجل بشكل دقيق."
      });
    }

    // Staff accounts must never be set up through the client flow.
    if (user.role === 'ADMIN' || user.role === 'COACH') {
      await recordFailedAttempt(ip, client_code);
      return res.status(403).json({
        error: "حسابات الكوتش والإدارة تسجل الدخول بالبريد الإلكتروني وكلمة المرور فقط."
      });
    }

    if (user.subscription_status === 'DEACTIVATED') {
      return res.status(403).json({
        error: "تم إغلاق هذا الحساب بناءً على طلبكم المسبق لحذف الحساب. لإعادة التفعيل واستعادة البيانات يرجى التواصل مع الإدارة."
      });
    }

    if (user.password) {
      return res.status(403).json({
        code: "PASSWORD_ALREADY_SET",
        error: "هذا الحساب له كلمة مرور بالفعل. لتغييرها سجّل الدخول ثم غيّرها من حسابك، أو اطلب من الكوتش إعادة تعيينها."
      });
    }

    // Same strength rules as changePassword: min 8 chars, common-password blocklist.
    const weakPasswords = ["123456", "12345678", "123456789", "password", "admin", "root", "toor", "12345", "qwerty", "secret"];
    if (new_password.length < 8) {
      return res.status(400).json({ error: "يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف" });
    }
    if (weakPasswords.includes(new_password.toLowerCase())) {
      return res.status(400).json({ error: "كلمة المرور ضعيفة جداً وشائعة، يرجى اختيار كلمة مرور قوية" });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    const nextVersion = (user.token_version || 1) + 1;
    await user.update({ password: hashedPassword, token_version: nextVersion });

    recordAuditEvent({
      event: 'CLIENT_PASSWORD_SET',
      req,
      status: 'SUCCESS',
      details: { userId: user.id }
    });

    resetAttempts(ip);
    const token = generateToken(user.id, nextVersion);
    return res.status(200).json({ user, token });
  } catch (err) {
    console.error("setClientPassword error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// S4-2: coach/admin reset of a client's password (the recovery path: there is
// no SMS/email delivery channel, so a forgotten password is reset by the
// coach, who already issues the client's code). Revokes every session, so a
// token issued before the reset stops working immediately.
export const resetClientPassword = async (req, res) => {
  try {
    const { user_id, client_code, new_password } = req.body || {};

    if (!new_password || (!user_id && !client_code)) {
      return res.status(400).json({ error: "كلمة المرور الجديدة ومعرّف العميل (user_id أو client_code) مطلوبان معاً" });
    }

    const user = user_id
      ? await User.findByPk(user_id)
      : await User.findOne({ where: { client_code: String(client_code).trim() } });
    if (!user) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    if (user.role !== "CLIENT") {
      return res.status(403).json({ error: "إعادة تعيين كلمة المرور من هنا متاحة لحسابات المتدربين فقط." });
    }

    if (user.subscription_status === 'DEACTIVATED') {
      return res.status(403).json({
        error: "تم إغلاق هذا الحساب بناءً على طلبكم المسبق لحذف الحساب. لإعادة التفعيل واستعادة البيانات يرجى التواصل مع الإدارة."
      });
    }

    // Same strength rules as changePassword: min 8 chars, common-password blocklist.
    const weakPasswords = ["123456", "12345678", "123456789", "password", "admin", "root", "toor", "12345", "qwerty", "secret"];
    if (new_password.length < 8) {
      return res.status(400).json({ error: "يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف" });
    }
    if (weakPasswords.includes(new_password.toLowerCase())) {
      return res.status(400).json({ error: "كلمة المرور ضعيفة جداً وشائعة، يرجى اختيار كلمة مرور قوية" });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    const nextVersion = (user.token_version || 1) + 1;
    await user.update({ password: hashedPassword, token_version: nextVersion });

    recordAuditEvent({
      event: 'CLIENT_PASSWORD_RESET_BY_COACH',
      req,
      status: 'SUCCESS',
      details: { userId: user.id, resetBy: req.user?.id }
    });

    return res.status(200).json({
      success: true,
      message: "تم إعادة تعيين كلمة مرور المتدرب بنجاح، وإلغاء جميع جلساته النشطة. أبلغ المتدرب بكلمة المرور المؤقتة ليغيّرها بعد أول دخول."
    });
  } catch (err) {
    console.error("resetClientPassword error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const loginFast = async (req, res) => {
  const ip = req.clientIp || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  try {
    const { client_code, phone_number, password } = req.body;

    if (!client_code || !phone_number) {
      return res.status(400).json({ error: "يرجى إدخال كود المشترك ورقم الهاتف المسجل معاً" });
    }

    const user = await findClientByCodeAndPhone(client_code, phone_number);

    if (!user) {
      await recordFailedAttempt(ip, client_code);
      return res.status(401).json({ 
        error: "بيانات الدخول غير صحيحة. يرجى التأكد من كتابة كود المشترك ورقم الهاتف المسجل بشكل دقيق." 
      });
    }

    // Staff accounts must never authenticate with a code + phone pair (no secret involved).
    if (user.role === 'ADMIN' || user.role === 'COACH') {
      await recordFailedAttempt(ip, client_code);
      recordAuditEvent({
        event: 'STAFF_LOGIN_FAST_BLOCKED',
        req,
        status: 'BLOCKED',
        details: { userId: user.id }
      });
      return res.status(403).json({
        error: "حسابات الكوتش والإدارة تسجل الدخول بالبريد الإلكتروني وكلمة المرور فقط."
      });
    }

    if (user.subscription_status === 'DEACTIVATED') {
      return res.status(403).json({
        error: "تم إغلاق هذا الحساب بناءً على طلبكم المسبق لحذف الحساب. لإعادة التفعيل واستعادة البيانات يرجى التواصل مع الإدارة."
      });
    }

    // S4-2: code + phone alone is not a secret (codes are sequential from
    // 1000, phones match on the last 8 digits). Once the client has chosen
    // a password it is required on every login; a password-less account
    // must set one first (setClientPassword) and never gets a token here.
    // Wrong passwords answer with the same generic 401 as a wrong code or
    // phone, so the response never says which part was wrong.
    if (!user.password) {
      return res.status(403).json({
        code: "PASSWORD_NOT_SET",
        error: "هذا الحساب ليس له كلمة مرور بعد. اختر كلمة مرور أولاً ثم سجّل الدخول بها."
      });
    }

    const isPasswordMatch = await bcrypt.compare(password || "", user.password);
    if (!isPasswordMatch) {
      await recordFailedAttempt(ip, client_code);
      return res.status(401).json({
        error: "بيانات الدخول غير صحيحة. يرجى التأكد من كتابة كود المشترك ورقم الهاتف وكلمة المرور بشكل دقيق."
      });
    }

    resetAttempts(ip);
    const token = generateToken(user);
    return res.status(200).json({ user, token });
  } catch (err) {
    console.error("loginFast error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const loginEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.subscription_status === 'DEACTIVATED') {
      return res.status(403).json({ 
        error: "تم إغلاق هذا الحساب بناءً على طلبكم المسبق لحذف الحساب. لإعادة التفعيل واستعادة البيانات يرجى التواصل مع الإدارة." 
      });
    }

    const token = generateToken(user);
    return res.status(200).json({ user, token });
  } catch (err) {
    console.error("loginEmail error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({ user });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * طلب حذف الحساب من جانب المتدرب (Soft Deletion حصراً)
 * يستوفي متطلبات متجر أبل ومتجر جوجل دون حذف أي بيانات أو صور فعلياً
 * تظل كافة البيانات والصور وسجلات التمارين والتغذية محفوظة بالكامل للأبد للكوتش
 */
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.user_id;
    const clientCode = req.body?.client_code;

    let user = null;
    if (userId) {
      user = await User.findByPk(userId);
    }
    if (!user && clientCode) {
      user = await User.findOne({ where: { client_code: String(clientCode).trim() } });
    }

    if (!user) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    // تعطيل الحساب صلب المنظومة دون حذف أي سجلات أو مجلدات صور
    const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const existingNotes = user.notes ? `${user.notes}\n` : '';
    await user.update({
      subscription_status: 'DEACTIVATED',
      notes: `${existingNotes}[تم طلب حذف الحساب من تطبيق الهاتف الذكي في ${dateStr} - الحساب معطل مع الحفاظ على الأرشيف]`
    });

    recordAuditEvent({
      event: 'ACCOUNT_DEACTIVATED_APP_STORE_COMPLIANCE',
      req,
      status: 'SUCCESS',
      details: {
        userId: user.id,
        clientCode: user.client_code
      }
    });

    return res.status(200).json({
      success: true,
      message: "تم حذف الحساب وإلغاء تسجيل الدخول بنجاح وفق سياسة الخصوصية المعتمدة."
    });
  } catch (err) {
    console.error("deleteAccount error:", err);
    return res.status(500).json({ error: "فشل تنفيذ العملية: " + err.message });
  }
};

/**
 * تغيير كلمة المرور مع إلغاء كافة الجلسات النشطة الأخرى فوراً (Session Revocation)
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: "كلمة المرور الحالية وكلمة المرور الجديدة مطلوبتان معاً" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    // التحقق من كلمة المرور الحالية
    if (user.password) {
      const isMatch = await bcrypt.compare(current_password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "كلمة المرور الحالية غير صحيحة" });
      }
    }

    // معايير قوة كلمة المرور
    const weakPasswords = ["123456", "12345678", "123456789", "password", "admin", "root", "toor", "12345", "qwerty", "secret"];
    if (new_password.length < 8) {
      return res.status(400).json({ error: "يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف" });
    }
    if (weakPasswords.includes(new_password.toLowerCase())) {
      return res.status(400).json({ error: "كلمة المرور ضعيفة جداً وشائعة، يرجى اختيار كلمة مرور قوية" });
    }
    if (current_password === new_password) {
      return res.status(400).json({ error: "كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور الحالية" });
    }

    // تشفير كلمة المرور الجديدة ورفع إصدار التوكن لإلغاء جميع الجلسات القديمة
    const hashedPassword = await bcrypt.hash(new_password, 10);
    const nextVersion = (user.token_version || 1) + 1;

    await user.update({
      password: hashedPassword,
      token_version: nextVersion
    });

    recordAuditEvent({
      event: 'PASSWORD_CHANGE_SESSION_REVOKED',
      req,
      status: 'SUCCESS',
      details: {
        userId: user.id,
        new_token_version: nextVersion
      }
    });

    // إصدار توكن جديد محدث للجلسة الحالية
    const freshToken = generateToken(user.id, nextVersion);

    return res.status(200).json({
      success: true,
      message: "تم تغيير كلمة المرور بنجاح، وإلغاء كافة الجلسات النشطة على الأجهزة الأخرى.",
      token: freshToken
    });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ error: "فشل تغيير كلمة المرور: " + err.message });
  }
};

/**
 * تسجيل الخروج من كافة الأجهزة وإلغاء الجلسات النشطة (Revoke All Sessions)
 */
export const logoutAll = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    const nextVersion = (user.token_version || 1) + 1;
    await user.update({ token_version: nextVersion });

    recordAuditEvent({
      event: 'LOGOUT_ALL_SESSIONS',
      req,
      status: 'SUCCESS',
      details: {
        userId: user.id,
        new_token_version: nextVersion
      }
    });

    return res.status(200).json({
      success: true,
      message: "تم تسجيل الخروج من كافة الأجهزة وإلغاء جميع الجلسات النشطة بنجاح."
    });
  } catch (err) {
    console.error("logoutAll error:", err);
    return res.status(500).json({ error: "فشل تسجيل الخروج: " + err.message });
  }
};

/**
 * نقطة الحصول على توكن CSRF للعمليات التحويلية
 */
export const getCsrfTokenController = (req, res) => {
  const identifier = req.user?.id || req.ip || 'guest';
  const csrfToken = generateCsrfToken(identifier);
  return res.status(200).json({
    csrf_token: csrfToken
  });
};

/**
 * تحديث تفضيلات وحدات القياس للمتدرب (أوزان التمارين، وزن الجسم، المقاسات)
 */
export const updatePreferences = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: "المستخدم غير موجود" });

    const newPrefs = req.body || {};
    user.notes = serializeUserUnitPreferences(user.notes, newPrefs);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "تم حفظ تفضيلات وحدات القياس بنجاح",
      preferences: parseUserUnitPreferences(user.notes),
      user,
    });
  } catch (err) {
    console.error("updatePreferences error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


