/**
 * Pure backup sanitizers (P0-A5). No imports: safe to unit-test under plain node.
 *
 * A sanitized backup payload must contain NO password, NO client email,
 * NO phone number, and NO health field, while keeping every table's shape so
 * a future restore tolerates the missing keys (absent key, never an invented
 * value). Financial rows are kept (amounts, references, status, client link)
 * with only their contact fields removed from the backup copy.
 */

// User contact/credential fields. `password` is the real model field; the old
// code excluded a nonexistent `password_hash` column, so hashes leaked.
export const USER_SECRET_KEYS = ["password", "password_hash", "email", "phone_number"];

// Intake health content: the full questionnaire answers + clinical notes.
export const INTAKE_HEALTH_KEYS = ["answers", "coach_notes"];

// Check-in health content: body measurements, symptoms, biofeedback and notes.
export const CHECKIN_HEALTH_KEYS = [
  "daily_weights_kg",
  "average_weight_kg",
  "weight_change_kg",
  "waist_circumference_cm",
  "biofeedback",
  "pain_reports",
  "analysis_output",
  "coach_notes",
  "lifestyle_variance",
  "bowel_regularity",
  "sleep_stress_composite",
  "menstrual_phase",
  "next_week_notes",
];

// Health keys embedded in Program.program_data.client (allergies, conditions,
// body metrics) plus the top-level medical-review confirmation object.
export const PROGRAM_CLIENT_HEALTH_KEYS = [
  "allergies",
  "medical_conditions",
  "conditions",
  "diseases",
  "injuries",
  "injury",
  "medications",
  "medication",
  "health_notes",
  "clinical_notes",
  "medical_history",
  "chronic_diseases",
  "diabetes",
  "hypertension",
  "weight",
  "weight_kg",
  "height",
  "height_cm",
  "bmi",
  "body_fat",
  "pain",
  "limitations",
];

// Free-text notes on photo/workout rows can carry clinical notes.
export const NOTE_KEY = ["notes"];

// Order contact fields (financial fields themselves are kept).
export const ORDER_CONTACT_KEYS = ["customer_name", "phone_number"];

function strip(row, keys) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return row;
  const copy = { ...row };
  for (const key of keys) delete copy[key];
  return copy;
}

function stripProgramHealth(row) {
  if (!row || typeof row !== "object") return row;
  const copy = { ...row };
  const data = copy.program_data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    let cloned;
    try {
      cloned = JSON.parse(JSON.stringify(data));
    } catch {
      cloned = { ...data };
    }
    if (cloned.client && typeof cloned.client === "object") {
      for (const key of PROGRAM_CLIENT_HEALTH_KEYS) delete cloned.client[key];
    }
    delete cloned.medical_review_confirmation;
    copy.program_data = cloned;
  }
  return copy;
}

/**
 * Sanitize a full backup payload. Unknown tables pass through untouched;
 * known tables lose only the listed keys, never whole rows.
 */
export function sanitizeBackupPayload(data) {
  const d = data || {};
  return {
    users: (d.users || []).map((u) => strip(u, USER_SECRET_KEYS)),
    programs: (d.programs || []).map(stripProgramHealth),
    intakes: (d.intakes || []).map((r) => strip(r, INTAKE_HEALTH_KEYS)),
    checkins: (d.checkins || []).map((r) => strip(r, CHECKIN_HEALTH_KEYS)),
    photos: (d.photos || []).map((r) => strip(r, NOTE_KEY)),
    workoutLogs: (d.workoutLogs || []).map((r) => strip(r, NOTE_KEY)),
    orders: (d.orders || []).map((r) => strip(r, ORDER_CONTACT_KEYS)),
    nutritionPlans: (d.nutritionPlans || []).map((r) => ({ ...r })),
    workoutPlans: (d.workoutPlans || []).map((r) => ({ ...r })),
    rateLimits: (d.rateLimits || []).map((r) => ({ ...r })),
  };
}
