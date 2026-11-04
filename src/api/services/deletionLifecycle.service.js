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
import fs from "fs";
import path from "path";
import {
  User,
  Order,
  Program,
  IntakeSubmission,
  CheckinSubmission,
  ProgressPhoto,
  WorkoutLog,
  NutritionPlan,
  WorkoutPlan,
  Notification,
  DeviceToken,
} from "../models/index.js";
import { PROGRESS_PHOTOS_DIR } from "../utils/photoStorage.js";
import { recordAuditEvent } from "./auditLog.service.js";
import { cleanOldBackupsFromDisk } from "./backup.service.js";

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

  // P0-A5: a permanently purged account must never come back, even if some
  // other path flipped its status back to DEACTIVATED after the purge. The
  // notes marker is the durable proof of purge; it wins over the status.
  if (user.subscription_status === "PERMANENTLY_PURGED" || String(user.notes || "").includes("[PERMANENTLY_PURGED:")) {
    return {
      success: false,
      statusCode: 410,
      error: "تم مسح هذا الحساب نهائياً بعد انتهاء مهلة الـ 90 يوماً ولا يمكن استعادته."
    };
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
 * P0-A5: the old version scrubbed only the User row, leaving programs,
 * intake answers, check-ins, workout logs, plans, photo rows AND photo
 * files behind forever. This version erases all of them; only the archived
 * User stub (no name, no email, no phone, no password) and the Orders stay.
 * @param {number} retentionDays
 * @returns {Promise<{ purged_count: number, financial_records_retained: number, related_records_deleted: number, photo_files_deleted: number }>}
 */
export async function purgeExpiredDeletedAccounts(retentionDays = 90) {
  const deactivatedUsers = await User.findAll({
    where: {
      subscription_status: "DEACTIVATED"
    }
  });

  let purgedCount = 0;
  let totalFinancialOrdersRetained = 0;
  let totalRelatedRecordsDeleted = 0;
  let totalPhotoFilesDeleted = 0;
  const now = Date.now();

  for (const user of deactivatedUsers) {
    const deletionDate = getDeletionRequestDate(user);
    const elapsedDays = (now - deletionDate.getTime()) / (1000 * 60 * 60 * 24);

    if (elapsedDays >= retentionDays) {
      // Count financial ledger orders before wiping PII (Orders are kept).
      const orders = await Order.findAll({ where: { client_id: user.id } });
      totalFinancialOrdersRetained += orders.length;

      const clientCode = user.client_code;

      // Erase related personal/health rows. Children first: check-ins
      // reference programs (adapted_program_id) and logs reference programs.
      totalRelatedRecordsDeleted += await WorkoutLog.destroy({ where: { user_id: user.id } });
      totalRelatedRecordsDeleted += await CheckinSubmission.destroy({ where: { user_id: user.id } });
      totalRelatedRecordsDeleted += await Program.destroy({ where: { user_id: user.id } });
      totalRelatedRecordsDeleted += await IntakeSubmission.destroy({ where: { user_id: user.id } });
      totalRelatedRecordsDeleted += await NutritionPlan.destroy({ where: { user_id: user.id } });
      totalRelatedRecordsDeleted += await WorkoutPlan.destroy({ where: { user_id: user.id } });
      totalRelatedRecordsDeleted += await ProgressPhoto.destroy({ where: { user_id: user.id } });
      // P2-C7: the inbox and its device tokens die with the account. Pre-C7
      // the JSON notification file survived purges entirely.
      totalRelatedRecordsDeleted += await Notification.destroy({ where: { user_id: user.id } });
      totalRelatedRecordsDeleted += await DeviceToken.destroy({ where: { user_id: user.id } });

      // Erase the photo files themselves, not just their rows.
      if (clientCode) {
        try {
          const clientPhotosDir = path.join(PROGRESS_PHOTOS_DIR, String(clientCode));
          const entries = fs.readdirSync(clientPhotosDir, { withFileTypes: true });
          totalPhotoFilesDeleted += entries.filter((e) => e.isFile()).length;
          fs.rmSync(clientPhotosDir, { recursive: true, force: true });
        } catch {
          // No photo folder for this client: nothing to erase.
        }
      }

      const nowIso = new Date().toISOString();
      const existingNotes = user.notes ? `${user.notes}\n` : "";

      await user.update({
        full_name: "مشترك مؤرشف",
        phone_number: `deleted_${user.id}_${now}`,
        email: null,
        password: null,
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
    financial_records_retained: totalFinancialOrdersRetained,
    related_records_deleted: totalRelatedRecordsDeleted,
    photo_files_deleted: totalPhotoFilesDeleted,
  };
}

// ---------------------------------------------------------------------------
// Daily purge scheduler (purge-wiring follow-up to P0-A5).
// The purge needs a live database, so — like the cycle scheduler and unlike
// the backup scheduler — it is started only on the success path of server
// bootstrap, never in the mock-persistence fallback.
// Runs once a day at 05:00 Africa/Cairo, after the 03:00 backup and the
// 04:00 cycle run: the night's backup exists before any destructive erase,
// and cycle preparation never races an erase. The check runs every 30
// minutes and fires at or after the run hour, so a mid-day restart still
// gets that day's run.
// ---------------------------------------------------------------------------

const PURGE_RUN_HOUR_CAIRO = 5;
const PURGE_CHECK_EVERY_MS = 1000 * 60 * 30;

let purgeTimer = null;
let purgeLastRunDay = null;

function purgeCairoParts(now) {
  const local = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
  return { hour: local.getHours(), day: `${local.getFullYear()}-${local.getMonth() + 1}-${local.getDate()}` };
}

/** True once per Cairo day, at or after the run hour. */
export function shouldRunDailyPurge(now, lastDay) {
  const { hour, day } = purgeCairoParts(now);
  return hour >= PURGE_RUN_HOUR_CAIRO && day !== lastDay;
}

/**
 * One daily run: purge 90-day-expired deactivated accounts (default window,
 * unchanged) and prune backups older than 365 days (default retention,
 * unchanged). Counts only are logged — never personal data.
 */
export async function runDailyPurgeNow() {
  let purgeResult = null;
  try {
    purgeResult = await purgeExpiredDeletedAccounts();
    console.log(`[PURGE SCHEDULER] Purged ${purgeResult.purged_count} expired accounts (${purgeResult.related_records_deleted} related records, ${purgeResult.photo_files_deleted} photo files, ${purgeResult.financial_records_retained} financial records retained).`);
  } catch (err) {
    console.error("[PURGE SCHEDULER ERROR] Daily purge failed:", err);
  }
  let prunedCount = 0;
  try {
    prunedCount = cleanOldBackupsFromDisk();
    console.log(`[PURGE SCHEDULER] Pruned ${prunedCount} backup files older than 365 days.`);
  } catch (err) {
    console.error("[PURGE SCHEDULER ERROR] Daily backup pruning failed:", err);
  }
  return { purge: purgeResult, pruned_backups: prunedCount };
}

export function initDailyPurgeScheduler() {
  if (purgeTimer) clearInterval(purgeTimer);
  purgeTimer = setInterval(async () => {
    const now = new Date();
    if (!shouldRunDailyPurge(now, purgeLastRunDay)) return;
    purgeLastRunDay = purgeCairoParts(now).day;
    await runDailyPurgeNow();
  }, PURGE_CHECK_EVERY_MS);
  console.log("[PURGE SCHEDULER] Initialized: expired-account purge and backup pruning run daily at 05:00 Africa/Cairo.");
}
