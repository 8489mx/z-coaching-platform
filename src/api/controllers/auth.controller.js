import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../models/index.js";
import { recordFailedAttempt, resetAttempts } from "../middlewares/rateLimiter.js";
import { recordAuditEvent } from "../services/auditLog.service.js";
import { generateCsrfToken } from "../middlewares/csrfProtection.js";

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

export const registerFast = async (req, res) => {
  try {
    const { client_code, phone_number, full_name } = req.body;
    
    if (!client_code || !phone_number) {
      return res.status(400).json({ error: "client_code and phone_number are required" });
    }

    const existingUser = await User.findOne({ where: { client_code } });
    if (existingUser) {
      return res.status(400).json({ error: "Client code already registered" });
    }

    const newUser = await User.create({ client_code, phone_number, full_name });
    const token = generateToken(newUser);

    return res.status(201).json({ user: newUser, token });
  } catch (err) {
    console.error("registerFast error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const loginFast = async (req, res) => {
  const ip = req.clientIp || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  try {
    const { client_code, phone_number } = req.body;

    if (!client_code || !phone_number) {
      return res.status(400).json({ error: "يرجى إدخال كود المشترك ورقم الهاتف المسجل معاً" });
    }

    const cleanCode = String(client_code).trim().replace(/^#+/, '').replace(/^client[-_]?/i, '');
    const cleanPhoneDigits = String(phone_number).replace(/\D/g, '');

    // Query user by client_code or id
    let user = await User.findOne({ where: { client_code: cleanCode } }) || 
               await User.findOne({ where: { id: isNaN(parseInt(cleanCode, 10)) ? 0 : parseInt(cleanCode, 10) } });

    if (user) {
      const userPhoneDigits = String(user.phone_number || '').replace(/\D/g, '');
      const isPhoneMatch = (
        user.phone_number === phone_number.trim() ||
        userPhoneDigits === cleanPhoneDigits ||
        (cleanPhoneDigits.length >= 8 && userPhoneDigits.endsWith(cleanPhoneDigits.slice(-8))) ||
        (userPhoneDigits.length >= 8 && cleanPhoneDigits.endsWith(userPhoneDigits.slice(-8)))
      );

      if (!isPhoneMatch) {
        user = null;
      }
    }
    
    if (!user) {
      await recordFailedAttempt(ip, client_code);
      return res.status(401).json({ 
        error: "بيانات الدخول غير صحيحة. يرجى التأكد من كتابة كود المشترك ورقم الهاتف المسجل بشكل دقيق." 
      });
    }

    if (user.subscription_status === 'DEACTIVATED') {
      return res.status(403).json({ 
        error: "تم إغلاق هذا الحساب بناءً على طلبكم المسبق لحذف الحساب. لإعادة التفعيل واستعادة البيانات يرجى التواصل مع الإدارة." 
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


