// P0-A11: the final cardio check. It runs on the FINAL cardio sessions (after
// the HIIT->LISS overlay and day assignment), not on the upstream schedule —
// the structural cardio preflight never inspects modality, intensity,
// duration, or day, so it cannot catch a bad session the pipeline itself
// produced or a hand-edited one. Every bound here is stated by the codebase
// already: V2 modalities are LISS/STEPS and V2 intensities are LOW/MODERATE
// (weekly-cardio-schedule domain typedef); duration must not exceed the
// client's own prescribed session max when one is known (cardio-prescription
// max_duration_minutes); a session without a day is a scheduling failure
// unless its reason code says the schedule is sequence-based, where no day
// is assigned by design. No new medical limit is invented: a bound that is
// genuinely absent is simply not enforced, and the report says so by
// omission (no violation is raised for it). A failing plan is reported, not
// fixed up here; the caller withholds it via the existing review mechanism.

const ALLOWED_MODALITIES = new Set(["LISS", "STEPS"]);
const ALLOWED_INTENSITIES = new Set(["LOW", "MODERATE"]);
const KNOWN_DAYS = new Set([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);
const SEQUENCE_REASON = "CARDIO_SESSION_SEQUENCE_REQUIRED";

/**
 * @param {Array} sessions final cardio sessions
 * @param {Object} [context]
 * @param {number} [context.maxDurationMinutes] the client's prescribed per-session max, when known
 * @returns {{ status: "PASSED"|"REVIEW_REQUIRED", violations: Array }}
 */
export function evaluateFinalCardioPlan(sessions, context = {}) {
  const violations = [];
  const push = (code, sequence, message, messageAr) =>
    violations.push(Object.freeze({ code, severity: "REVIEW", session_sequence: sequence, message, message_ar: messageAr }));

  const maxDuration = context.maxDurationMinutes;

  for (const session of sessions || []) {
    const sequence = session?.sequence ?? null;

    const modality = String(session?.modality_type || "").toUpperCase();
    if (!ALLOWED_MODALITIES.has(modality)) {
      push("FINAL_CARDIO_MODALITY", sequence,
        `Final cardio contains modality ${modality || "(missing)"}; V2 cardio allows LISS or STEPS only.`,
        `الكارديو النهائي فيه نوع ${modality || "(غير محدد)"} وهو مش من الأنواع المسموحة (LISS أو STEPS) — الخطة تحتاج مراجعة مدرب قبل التسليم.`);
    }

    const intensity = String(session?.intensity || "").toUpperCase();
    if (!ALLOWED_INTENSITIES.has(intensity)) {
      push("FINAL_CARDIO_INTENSITY", sequence,
        `Final cardio contains intensity ${intensity || "(missing)"}; V2 cardio allows LOW or MODERATE only.`,
        `الكارديو النهائي فيه شدة ${intensity || "(غير محددة)"} وهي مش من الشدات المسموحة (LOW أو MODERATE) — الخطة تحتاج مراجعة مدرب قبل التسليم.`);
    }

    const duration = session?.duration_minutes;
    if (!Number.isInteger(duration) || duration <= 0) {
      push("FINAL_CARDIO_DURATION", sequence,
        "Final cardio session has no positive duration.",
        "جلسة الكارديو النهائية ملهاش مدة صحيحة — الخطة تحتاج مراجعة مدرب قبل التسليم.");
    } else if (typeof maxDuration === "number" && maxDuration > 0 && duration > maxDuration) {
      push("FINAL_CARDIO_DURATION", sequence,
        `Final cardio session is ${duration} minutes, over the client's prescribed ${maxDuration}-minute session max.`,
        `جلسة الكارديو النهائية ${duration} دقيقة وهي أطول من الحد المسموح للعميل (${maxDuration} دقيقة) — الخطة تحتاج مراجعة مدرب قبل التسليم.`);
    }

    const day = String(session?.scheduled_day || "").toUpperCase();
    if (!KNOWN_DAYS.has(day) && session?.schedule_reason_code !== SEQUENCE_REASON) {
      push("FINAL_CARDIO_DAY", sequence,
        "Final cardio session has no scheduled day.",
        "جلسة الكارديو النهائية ملهاش يوم محدد — الخطة تحتاج مراجعة مدرب قبل التسليم.");
    }
  }

  return Object.freeze({
    status: violations.length > 0 ? "REVIEW_REQUIRED" : "PASSED",
    violations: Object.freeze(violations),
  });
}
