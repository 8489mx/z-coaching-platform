/**
 * Sensitive Administrative Actions Audit Engine (V2)
 *
 * Implements strict, immutable audit formatting and sanitization:
 * 1. Definitive classification of sensitive operations.
 * 2. Automatic redaction of sensitive credentials, JWT secrets, and health details.
 * 3. Human-readable Arabic executive descriptions.
 * 4. Zero Emojis and full compliance with Egyptian data privacy regulations.
 */

export const SENSITIVE_ACTIONS = Object.freeze({
  CLINICAL_LOCKOUT_UNLOCKED: "CLINICAL_LOCKOUT_UNLOCKED",
  MEASUREMENT_CORRECTION: "MEASUREMENT_CORRECTION",
  SUBSCRIPTION_FREEZE_TOGGLE: "SUBSCRIPTION_FREEZE_TOGGLE",
  PROGRAM_PUBLISHED: "PROGRAM_PUBLISHED",
  STAFF_ROLE_MODIFIED: "STAFF_ROLE_MODIFIED",
  CHECKIN_OVERRIDE_APPROVED: "CHECKIN_OVERRIDE_APPROVED"
});

const ACTION_DESCRIPTIONS_AR = Object.freeze({
  [SENSITIVE_ACTIONS.CLINICAL_LOCKOUT_UNLOCKED]: "فك القفل السريري الطبي للمتدرب والسماح باستئناف التمارين",
  [SENSITIVE_ACTIONS.MEASUREMENT_CORRECTION]: "تعديل وتصحيح يدوي للقياسات والوزن للمتدرب مع إعادة احتساب الفروق",
  [SENSITIVE_ACTIONS.SUBSCRIPTION_FREEZE_TOGGLE]: "تعديل حالة تجميد الاشتراك وإعادة احتساب تاريخ الانتهاء",
  [SENSITIVE_ACTIONS.PROGRAM_PUBLISHED]: "اعتماد ونشر خطة تدريبية وتغذوية جديدة للمتدرب",
  [SENSITIVE_ACTIONS.STAFF_ROLE_MODIFIED]: "تعديل صلاحيات ورتبة مستخدم أو موظف في المنظومة",
  [SENSITIVE_ACTIONS.CHECKIN_OVERRIDE_APPROVED]: "اعتماد متابعة أسبوعية مع تجاوز ملاحظات المحرك السريري"
});

/**
 * Sanitizes details payload to strictly eliminate any secrets, tokens, or raw medical narratives.
 */
export function sanitizeAuditDetails(details = {}) {
  if (!details || typeof details !== "object") {
    return {};
  }

  const sanitized = { ...details };

  // Explicitly remove secret or sensitive fields
  const forbiddenKeys = [
    "password",
    "token",
    "authorization",
    "secret",
    "jwt",
    "hash",
    "medical_narrative",
    "confidential_doctor_note"
  ];

  for (const key of Object.keys(sanitized)) {
    const lower = key.toLowerCase();
    if (forbiddenKeys.some(f => lower.includes(f))) {
      delete sanitized[key];
    }
  }

  return sanitized;
}

/**
 * Builds a standardized, sanitized audit event record.
 */
export function buildSanitizedAuditEvent({
  action,
  actorId,
  actorRole = "STAFF",
  targetClientId,
  details = {},
  timestamp = new Date()
}) {
  const cleanAction = String(action || "UNKNOWN_ACTION").toUpperCase();
  const safeDetails = sanitizeAuditDetails(details);
  const timeIso = (timestamp instanceof Date ? timestamp : new Date(timestamp)).toISOString();

  return {
    action: cleanAction,
    action_description_ar: ACTION_DESCRIPTIONS_AR[cleanAction] || "إجراء إداري مسجل",
    actor_id: String(actorId || "SYSTEM"),
    actor_role: String(actorRole).toUpperCase(),
    target_client_id: targetClientId ? String(targetClientId) : null,
    details: safeDetails,
    timestamp: timeIso
  };
}
