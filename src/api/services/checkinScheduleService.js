/**
 * Check-in Schedule & Cadence Service
 * Z Coaching Platform - Operations & Client Retention Guard (Tier 0 & Tier 1)
 *
 * Single Source of Truth for Check-in Due Dates, Cadence and 72-Hour Submission Window.
 * Strictly deterministic, anchored to the active program activation date.
 * Timezone: Africa/Cairo (process.env.TZ = 'Africa/Cairo')
 * Zero emojis, strictly Arabic clinical directives.
 */

import { CheckinSubmission, Program, User } from "../models/index.js";

export const CADENCE_DAYS = Object.freeze({
  MAX: 7,
  ELITE: 14,
  DEFAULT: 7,
});

export const SUBMISSION_WINDOW_HOURS = 72; // 72 hours window from start of due date
export const CAIRO_TIMEZONE = "Africa/Cairo";

/**
 * Resolves client package cadence in days
 */
export function resolveClientCadenceDays(user = {}, program = {}) {
  const userTier = String(
    user.package_tier ||
    user.subscription_package ||
    user.subscription_tier ||
    user.tier ||
    user.package ||
    program?.program_data?.package_tier ||
    program?.program_data?.subscription_tier ||
    ""
  ).toUpperCase();

  if (userTier.includes("ELITE")) return CADENCE_DAYS.ELITE;
  if (userTier.includes("MAX")) return CADENCE_DAYS.MAX;
  return CADENCE_DAYS.DEFAULT;
}

/**
 * Extracts Cairo calendar date YYYY-MM-DD from any Date or timestamp
 */
export function getCairoDateString(dateInput = new Date()) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Converts Cairo midnight (00:00:00) on a given YYYY-MM-DD date to a UTC Date object
 */
export function cairoMidnightToUTC(ymdStr) {
  if (!ymdStr || typeof ymdStr !== "string") return null;
  const parts = ymdStr.split("-").map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;

  const [year, month, day] = parts;
  // Sample noon UTC on that day to deterministically discover Cairo's UTC offset
  const sampleDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: CAIRO_TIMEZONE,
    hour: "2-digit",
    hour12: false,
  });
  const cairoHour = parseInt(fmt.format(sampleDate), 10);
  const offsetHours = cairoHour - 12; // either +2 or +3

  const utcMs = Date.UTC(year, month - 1, day, 0 - offsetHours, 0, 0);
  return new Date(utcMs);
}

/**
 * Resolves the authoritative Program Activation Date.
 * Priorities:
 * 1. program.program_data.cycle_started_at
 * 2. program.createdAt
 * 3. Fallback: user.subscription_start_date (only if program has no timestamp)
 * Strict validation: Program must be ACTIVE, date must not be in the future, and payment date is strictly NOT used.
 */
export function resolveProgramActivationDate(program, user = null) {
  if (!program) return null;

  // 1. Program must be ACTIVE. Drafts or archived plans are never treated as activated.
  if (program.status && program.status !== "ACTIVE") {
    return null;
  }

  const programData = typeof program.program_data === "string"
    ? JSON.parse(program.program_data)
    : program.program_data || {};

  const nowThreshold = Date.now() + 60000; // Allow 1 minute clock skew

  const recorded = programData.cycle_started_at;
  if (recorded) {
    const d = new Date(recorded);
    if (!Number.isNaN(d.getTime()) && d.getTime() <= nowThreshold) return d;
  }

  if (program.createdAt) {
    const d = new Date(program.createdAt);
    if (!Number.isNaN(d.getTime()) && d.getTime() <= nowThreshold) return d;
  }

  if (user?.subscription_start_date) {
    const d = new Date(user.subscription_start_date);
    if (!Number.isNaN(d.getTime()) && d.getTime() <= nowThreshold) return d;
  }

  return null;
}

/**
 * Adds integer calendar days to a YYYY-MM-DD string cleanly without DST drift
 */
export function addDaysToYmd(ymdStr, daysToAdd) {
  const parts = ymdStr.split("-").map((p) => parseInt(p, 10));
  const [year, month, day] = parts;
  const d = new Date(Date.UTC(year, month - 1, day + daysToAdd, 12, 0, 0));
  return d.toISOString().slice(0, 10);
}

/**
 * Calculates deterministic due date for a specific cycle/week number
 * @param {Date} activationDate
 * @param {number} cycleSequence - 1, 2, 3...
 * @param {number} cadenceDays - 7 or 14
 * @returns {{ ymd: string, opensAt: Date, closesAt: Date }}
 */
export function calculateCycleSchedule(activationDate, cycleSequence, cadenceDays) {
  const activationCairoYmd = getCairoDateString(activationDate);
  const dueCairoYmd = addDaysToYmd(activationCairoYmd, cycleSequence * cadenceDays);

  const windowOpensAt = cairoMidnightToUTC(dueCairoYmd);
  const windowClosesAt = new Date(windowOpensAt.getTime() + SUBMISSION_WINDOW_HOURS * 60 * 60 * 1000);

  return {
    cycleSequence,
    dueCairoYmd,
    windowOpensAt,
    windowClosesAt,
  };
}

/**
 * Determines current check-in eligibility and schedule status for a client.
 * Server is the Single Source of Truth.
 */
export async function evaluateClientCheckinSchedule(userId, now = new Date()) {
  const cleanId = String(userId).replace("#", "").trim();
  let user = await User.findOne({ where: { client_code: cleanId } });
  if (!user && !Number.isNaN(Number(cleanId))) {
    user = await User.findByPk(parseInt(cleanId, 10));
  }
  if (!user) {
    return {
      allowed: false,
      code: "USER_NOT_FOUND",
      error_ar: "المتدرب غير موجود في النظام",
    };
  }

  const activeProgram = await Program.findOne({
    where: { user_id: user.id, status: "ACTIVE" },
    order: [["id", "DESC"]],
  });

  if (!activeProgram) {
    return {
      allowed: false,
      code: "NO_ACTIVE_PROGRAM",
      error_ar: "لا يوجد برنامج تدريبي نشط معتمد لهذا المتدرب بعد",
      user,
    };
  }

  const activationDate = resolveProgramActivationDate(activeProgram, user);
  if (!activationDate) {
    return {
      allowed: false,
      code: "NO_ACTIVATION_DATE",
      error_ar: "لم يتم تسجيل تاريخ تفعيل معتمد للبرنامج التدريبي",
      user,
      program: activeProgram,
    };
  }

  const cadenceDays = resolveClientCadenceDays(user, activeProgram);
  const nowDate = now instanceof Date ? now : new Date(now);
  const nowMs = nowDate.getTime();

  // Find all previous check-in submissions
  const existingCheckins = await CheckinSubmission.findAll({
    where: { user_id: user.id },
    order: [["week_number", "ASC"]],
  });

  const submittedWeeks = new Set(existingCheckins.map((c) => Number(c.week_number)));

  // Calculate days elapsed from activation in Cairo days
  const activationCairoYmd = getCairoDateString(activationDate);
  const activationMidnightUtc = cairoMidnightToUTC(activationCairoYmd);
  const daysElapsedSinceActivation = Math.max(0, Math.floor((nowMs - activationMidnightUtc.getTime()) / (24 * 60 * 60 * 1000)));

  // Determine current active cycle sequence for this program
  // Cycle 1 due at day cadenceDays, Cycle 2 at day 2*cadenceDays, etc.
  let targetCycle = Math.max(1, Math.floor(daysElapsedSinceActivation / cadenceDays));
  if (daysElapsedSinceActivation < cadenceDays) {
    targetCycle = 1;
  }

  // Calculate schedule for target cycle
  const currentSchedule = calculateCycleSchedule(activationDate, targetCycle, cadenceDays);
  const opensAtMs = currentSchedule.windowOpensAt.getTime();
  const closesAtMs = currentSchedule.windowClosesAt.getTime();

  // Multi-cycle handling: checkins prior to current program activation increment cumulative week
  const activationMs = activationDate.getTime();
  const priorCheckins = existingCheckins.filter((c) => {
    const cTime = new Date(c.createdAt || c.created_at || 0).getTime();
    return cTime < activationMs;
  });
  const priorWeeks = priorCheckins.length > 0 ? Math.max(...priorCheckins.map((c) => Number(c.week_number) || 0)) : 0;
  const authoritativeWeekNumber = priorWeeks + targetCycle;

  // Check if targetCycle is already submitted
  const isAlreadySubmitted = submittedWeeks.has(authoritativeWeekNumber);

  // Check coach override (stored in program_data.checkin_overrides or user.notes)
  const progData = typeof activeProgram.program_data === "string"
    ? JSON.parse(activeProgram.program_data)
    : activeProgram.program_data || {};
  const overrides = progData.checkin_overrides || {};
  const cycleOverride = overrides[String(targetCycle)] || overrides[targetCycle];
  const hasValidOverride = cycleOverride && (!cycleOverride.expires_at || new Date(cycleOverride.expires_at).getTime() > nowMs);

  let status = "UPCOMING";
  let allowed = false;
  let code = "CHECKIN_WINDOW_NOT_OPEN";
  let messageAr = `نافذة المتابعة مغلقة حالياً. تفتح المتابعة القادمة يوم ${currentSchedule.dueCairoYmd} الساعة 00:00 بتوقيت القاهرة.`;

  if (isAlreadySubmitted) {
    status = "SUBMITTED";
    allowed = false;
    code = "DUPLICATE_CHECKIN_SUBMISSION";
    messageAr = `تم إرسال متابعة الدورة (${targetCycle}) مسبقاً وهي مسجلة في سجل المتابعات.`;
  } else if (hasValidOverride) {
    status = "OPEN";
    allowed = true;
    code = "COACH_OVERRIDE_ACTIVE";
    messageAr = "تم فتح نافذة المتابعة باستثناء معتمد من المدرب.";
  } else if (nowMs < opensAtMs) {
    status = "UPCOMING";
    allowed = false;
    code = "CHECKIN_WINDOW_NOT_OPEN";
    const hoursToOpen = Math.max(1, Math.round((opensAtMs - nowMs) / (60 * 60 * 1000)));
    messageAr = `موعد استحقاق المتابعة لم يحن بعد (متبقي ${hoursToOpen} ساعة حتى بداية موعد الاستحقاق).`;
  } else if (nowMs >= opensAtMs && nowMs <= closesAtMs) {
    status = "OPEN";
    allowed = true;
    code = "CHECKIN_WINDOW_OPEN";
    const hoursRemaining = Math.max(1, Math.round((closesAtMs - nowMs) / (60 * 60 * 1000)));
    messageAr = `نافذة تسجيل المتابعة مفتوحة الآن (متبقي ${hoursRemaining} ساعة على انتهاء فترة السماح 72 ساعة).`;
  } else {
    // nowMs > closesAtMs
    status = "EXPIRED";
    allowed = false;
    code = "CHECKIN_WINDOW_EXPIRED";
    const daysLate = Math.floor((nowMs - closesAtMs) / (24 * 60 * 60 * 1000)) + 1;
    messageAr = `انتهت فترة السماح لتسجيل المتابعة (متأخر ${daysLate} يوم عن نافذة الـ 72 ساعة). يرجى التواصل مع الكوتش كريم زكريا.`;
  }

  return {
    allowed,
    status,
    code,
    message_ar: messageAr,
    tier: cadenceDays === 14 ? "ELITE" : "MAX",
    cadence_days: cadenceDays,
    cycle_sequence: targetCycle,
    expected_week_number: authoritativeWeekNumber,
    program_activated_at: activationDate.toISOString(),
    scheduled_due_date: currentSchedule.dueCairoYmd,
    window_opens_at: currentSchedule.windowOpensAt.toISOString(),
    window_closes_at: currentSchedule.windowClosesAt.toISOString(),
    has_override: Boolean(hasValidOverride),
    user_id: user.id,
    program_id: activeProgram.id,
  };
}
