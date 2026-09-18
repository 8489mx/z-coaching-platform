/**
 * Set (or rotate) the email + password of a staff account (ADMIN / COACH).
 *
 * Staff accounts can no longer log in with client code + phone (login-fast);
 * they must use POST /api/v1/auth/login-email. Run this interactively on each
 * environment (local and production) before deploying that change:
 *
 *   node --env-file=.env scripts/set-staff-credentials.js COACH-KZ
 *
 * The password is typed hidden, never echoed or logged, and stored as a bcrypt
 * hash. token_version is incremented so every previously issued session for
 * this account is revoked immediately.
 */
import readline from "node:readline";
import bcrypt from "bcrypt";
import sequelize from "../src/api/config/database.js";
import { User } from "../src/api/models/index.js";

const WEAK_PASSWORDS = ["123456", "12345678", "123456789", "password", "admin", "root", "toor", "12345", "qwerty", "secret"];
const MIN_PASSWORD_LENGTH = 12;

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (text) => {
        if (text.includes(question)) rl.output.write(text);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

function validatePassword(pwd) {
  if (pwd.length < MIN_PASSWORD_LENGTH) return `كلمة المرور يجب ألا تقل عن ${MIN_PASSWORD_LENGTH} حرفاً.`;
  if (WEAK_PASSWORDS.includes(pwd.toLowerCase())) return "كلمة المرور شائعة وضعيفة.";
  if (!/[A-Za-z]/.test(pwd) || !/\d/.test(pwd)) return "كلمة المرور يجب أن تحتوي على حروف وأرقام معاً.";
  return null;
}

async function main() {
  if (!process.stdin.isTTY) {
    console.error("يجب تشغيل السكربت من طرفية تفاعلية (TTY) لإدخال كلمة المرور بشكل مخفي.");
    process.exit(1);
  }

  const clientCode = process.argv[2] || await ask("كود حساب الكوتش/الإدارة (مثال: COACH-KZ): ");
  const user = await User.findOne({ where: { client_code: clientCode } });
  if (!user) {
    console.error(`لا يوجد حساب بالكود ${clientCode}.`);
    process.exit(1);
  }
  if (user.role !== "ADMIN" && user.role !== "COACH") {
    console.error(`الحساب ${clientCode} ليس حساب كوتش أو إدارة (الدور الحالي: ${user.role}).`);
    process.exit(1);
  }

  const emailPrompt = user.email ? `البريد الإلكتروني [${user.email}]: ` : "البريد الإلكتروني: ";
  const email = (await ask(emailPrompt)) || user.email;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("بريد إلكتروني غير صالح.");
    process.exit(1);
  }

  const password = await ask("كلمة المرور الجديدة: ", { hidden: true });
  const problem = validatePassword(password);
  if (problem) {
    console.error(problem);
    process.exit(1);
  }
  const confirm = await ask("تأكيد كلمة المرور: ", { hidden: true });
  if (confirm !== password) {
    console.error("كلمتا المرور غير متطابقتين.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  const nextVersion = (user.token_version || 1) + 1;
  await user.update({ email, password: hash, token_version: nextVersion });

  console.log(`تم تحديث بيانات دخول ${clientCode} (${email}) وإلغاء كل الجلسات السابقة (token_version = ${nextVersion}).`);
}

main()
  .catch((err) => {
    console.error("فشل تحديث بيانات الدخول:", err.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close().catch(() => {}));
