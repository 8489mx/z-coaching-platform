/**
 * Medical-condition pills of the deep intake form (FullIntakeForm.jsx).
 * Kept in a plain module so the options are testable without rendering
 * the form. Keys are the values the form stores in
 * medical_conditions.selected; the adapter maps them to canonical
 * condition codes (HIGH_CHOLESTEROL / OSTEOPOROSIS included — S1 item 15:
 * the engine already accepted those codes, the form could not send them;
 * EPILEPSY / DEPRESSION_ANXIETY added in Batch 1 the same way).
 */
export const MEDICAL_CONDITION_OPTIONS = Object.freeze([
  { key: "bariatric_surgery", label: "تكميم معدة / تحويل مسار" },
  { key: "diabetes", label: "سكري / مقاومة أنسولين" },
  { key: "favism_g6pd", label: "أنيميا الفول (G6PD)" },
  { key: "renal", label: "أمراض الكلى / ضعف وظائف الكلى" },
  { key: "hepatic", label: "أمراض الكبد / دهون على الكبد" },
  { key: "thyroid", label: "اضطرابات الغدة الدرقية" },
  { key: "gi_tract", label: "قولون عصبي / ارتجاع مريء" },
  { key: "hypertension", label: "ضغط دم مرتفع" },
  { key: "gout", label: "نقرس / يوريك أسيد مرتفع" },
  { key: "asthma", label: "ربو / حساسية صدر" },
  { key: "heart_condition", label: "مرض في القلب (مشخص من دكتور)" },
  { key: "high_cholesterol", label: "كوليسترول مرتفع" },
  { key: "osteoporosis", label: "هشاشة عظام" },
  { key: "epilepsy", label: "صرع" },
  { key: "depression_anxiety", label: "اكتئاب / قلق" },
]);

/**
 * Dietary-preference pills (S1 item 9). "vegetarian" means no meat or fish
 * (eggs and dairy stay); the adapter maps it to the full meat/fish
 * exclusion, mirroring how C13's vegetarianism was encoded via disliked
 * foods. "none" is the default (no preference).
 */
export const DIETARY_PREFERENCE_OPTIONS = Object.freeze([
  { key: "none", label: "عادي — آكل كل حاجة" },
  { key: "vegetarian", label: "نباتي — لا آكل لحوم أو أسماك" },
]);
