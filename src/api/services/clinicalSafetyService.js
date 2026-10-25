import { CheckinSubmission } from "../models/index.js";

/**
 * Checks if a trainee has an active, unresolved clinical safety lockout
 * (e.g. exertional chest pain, syncope, or cardiac red flags) across any check-in submissions.
 *
 * @param {number|string} userId - User primary key or client ID
 * @returns {Promise<{ locked: boolean, checkin_id?: number, week_number?: number, directive_ar?: string, locked_at?: string, error?: boolean }>}
 */
export async function getActiveClinicalLockout(userId) {
  try {
    if (!userId) {
      return { locked: false };
    }

    const checkins = await CheckinSubmission.findAll({
      where: { user_id: userId },
      order: [["week_number", "DESC"], ["id", "DESC"]],
    });

    for (const c of checkins) {
      const analysis = c.analysis_output;
      if (analysis?.training_locked === true) {
        if (!analysis.clinical_unlock || analysis.clinical_unlock.unlocked !== true) {
          return {
            locked: true,
            checkin_id: c.id,
            week_number: c.week_number,
            directive_ar: analysis.emergency_directive_ar || "إيقاف النشاط التدريبي فوراً والرجوع للطبيب المعالج.",
            locked_at: c.createdAt || c.created_at || null,
          };
        }
      }
    }

    return { locked: false };
  } catch (err) {
    console.error("getActiveClinicalLockout error:", err);
    // Safe failure: if checking fails due to database/server error, do not assume unlocked
    return {
      locked: true,
      error: true,
      directive_ar: "تعذر التحقق من الأمان السريري نتيجة خطأ تقني. يرجى مراجعة المدرب قبل بدء التمرين.",
      locked_at: new Date().toISOString(),
    };
  }
}
