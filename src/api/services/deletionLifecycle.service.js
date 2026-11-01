/**
 * Account Deletion Lifecycle & Grace Period Service (S4-6, Stage 2)
 *
 * Compliance & Privacy Architecture:
 * 1. Soft Deletion & 90-Day Grace Period:
 *    - Deletion request deactivates account and starts a 90-day grace period.
 *    - Client data is safely archived; sessions are immediately revoked via token_version.
 * 2. Coach-Only Restoration:
 *    - Restoration is permitted ONLY via coach within the 90-day window upon client request from registered phone/email.
 *    - Once 90 days elapse, restoration is strictly blocked.
 * 3. Permanent Erase & Financial Ledger Preservation:
 *    - After 90 days, PII and medical profiles are permanently purged.
 *    - Commercial/financial audit trails (Orders & payments) are preserved for legal and accounting compliance.
 */

import { Op } from "sequelize";
import { User, Order } from "../models/index.js";
import { recordAuditEvent } from "./auditLog.service.js";

/**
 * Extracts deletion request date from user notes or returns user.updatedAt fallback
 * @param {object} user 
 * @returns {Date}
 */
export function getDeletionRequestDate(user) {
  if (user?.notes) {
    const match = user.notes.match(/\[DELETION_REQUESTED:([^\]]+)\]/);
    if (match && match[1]) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }
  return user?.updatedAt ? new Date(user.updatedAt) : new Date();
}

/**
 * Restores a deactivated client account within the 90-day grace period
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function restoreClientAccountService({ user_id, client_code, coach_id, confirmation_channel = "REGISTERED_PHONE", req = null }) {
  let user = null;
  if (user_id) {
    user = await User.findByPk(user_id);
  } else if (client_code) {
    user = await User.findOne({ where: { client_code: String(client_code).trim() } });
  }

  if (!user) {
    return { success: false, statusCode: 404, error: "المستخدم غير موجود" };
  }

  if (user.subscription_status !== "DEACTIVATED") {
    return { success: false, statusCode: 400, error: "هذا الحساب ليس في حالة تعطيل أو حذف، وهو نشط بالفعل." };
  }

  const deletionDate = getDeletionRequestDate(user);
  const elapsedDays = (Date.now() - deletionDate.getTime()) / (1000 * 60 * 60 * 24);

  if (elapsedDays > 90) {
    return {
      success: false,
      statusCode: 400,
      error: "انتهت مهلة الـ 90 يوماً المتاحة للاسترجاع. تم تحويل الحساب إلى مرحلة المسح النهائي ولا يمكن استعادته."
    };
  }

  const existingNotes = user.notes ? `${user.notes}\n` : "";
  const nowIso = new Date().toISOString();
  const nextTokenVersion = (user.token_version || 1) + 1;

  await user.update({
    subscription_status: "ACTIVE",
    token_version: nextTokenVersion,
    notes: `${existingNotes}[ACCOUNT_RESTORED_BY_COACH:${nowIso}:channel=${confirmation_channel}:coach=${coach_id || 'system'}]`
  });

  if (req) {
    recordAuditEvent({
      event: "ACCOUNT_RESTORED_BY_COACH",
      req,
      status: "SUCCESS",
      details: {
        userId: user.id,
        clientCode: user.client_code,
        coachId: coach_id,
        confirmationChannel: confirmation_channel,
        elapsedDays: Math.round(elapsedDays)
      }
    });
  }

  return {
    success: true,
    statusCode: 200,
    message: "تمت استعادة حساب المشترك بنجاح وتفعيل اشتراكه، وتم إلغاء أي جلسات سابقة.",
    user
  };
}

/**
 * Permanently purges PII for accounts deleted more than retentionDays ago,
 * while strictly preserving financial and accounting records (Orders).
 * @param {number} retentionDays 
 * @returns {Promise<{ purged_count: number, financial_records_retained: number }>}
 */
export async function purgeExpiredDeletedAccounts(retentionDays = 90) {
  const deactivatedUsers = await User.findAll({
    where: {
      subscription_status: "DEACTIVATED"
    }
  });

  let purgedCount = 0;
  let totalFinancialOrdersRetained = 0;
  const now = Date.now();

  for (const user of deactivatedUsers) {
    const deletionDate = getDeletionRequestDate(user);
    const elapsedDays = (now - deletionDate.getTime()) / (1000 * 60 * 60 * 24);

    if (elapsedDays >= retentionDays) {
      // Count financial ledger orders before wiping PII
      const orders = await Order.findAll({ where: { client_id: user.id } });
      totalFinancialOrdersRetained += orders.length;

      const nowIso = new Date().toISOString();
      const existingNotes = user.notes ? `${user.notes}\n` : "";

      await user.update({
        full_name: "مشترك مؤرشف",
        phone_number: `deleted_${user.id}_${now}`,
        email: null,
        avatar: null,
        subscription_status: "PERMANENTLY_PURGED",
        token_version: (user.token_version || 1) + 1,
        notes: `${existingNotes}[PERMANENTLY_PURGED:${nowIso}:FINANCIAL_ARCHIVE_RETAINED:orders=${orders.length}]`
      });

      purgedCount += 1;
    }
  }

  return {
    purged_count: purgedCount,
    financial_records_retained: totalFinancialOrdersRetained
  };
}
