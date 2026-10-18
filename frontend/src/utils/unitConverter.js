/**
 * Unit Converter Utility (Single Source of Truth)
 *
 * System Invariant:
 * Canonical storage is ALWAYS:
 * - Exercise weights: KG
 * - Body weights: KG
 * - Waist and circumferences: CM
 *
 * Conversion is strictly applied at the presentation/input boundary.
 */

export const CONVERSION_CONSTANTS = Object.freeze({
  KG_TO_LB: 2.2046226218,
  LB_TO_KG: 1 / 2.2046226218,
  INCH_TO_CM: 2.54,
  CM_TO_INCH: 1 / 2.54,
});

export const UNIT_TYPES = Object.freeze({
  EXERCISE_WEIGHT: Object.freeze({
    KG: 'kg',
    LB: 'lb',
  }),
  BODY_WEIGHT: Object.freeze({
    KG: 'kg',
    LB: 'lb',
  }),
  MEASUREMENT: Object.freeze({
    CM: 'cm',
    IN: 'in',
  }),
});

export const UNIT_STEPS = Object.freeze({
  exercise_weight: Object.freeze({
    kg: 2.5,
    lb: 5.0,
  }),
  body_weight: Object.freeze({
    kg: 0.5,
    lb: 1.0,
  }),
  measurement: Object.freeze({
    cm: 0.5,
    in: 0.25,
  }),
});

export const UNIT_LABELS_AR = Object.freeze({
  kg: 'كجم',
  lb: 'باوند',
  cm: 'سم',
  in: 'بوصة',
});

export const UNIT_LABELS_EN = Object.freeze({
  kg: 'KG',
  lb: 'LB',
  cm: 'CM',
  in: 'IN',
});

export const DEFAULT_UNIT_PREFERENCES = Object.freeze({
  exercise_weight_unit: 'kg',
  body_weight_unit: 'kg',
  measurement_unit: 'cm',
});

/**
 * Validates and sanitizes a preferences object
 */
export function sanitizeUnitPreferences(prefs = {}) {
  const ex = String(prefs.exercise_weight_unit || '').toLowerCase();
  const bw = String(prefs.body_weight_unit || '').toLowerCase();
  const ms = String(prefs.measurement_unit || '').toLowerCase();

  return {
    exercise_weight_unit: ex === 'lb' ? 'lb' : 'kg',
    body_weight_unit: bw === 'lb' ? 'lb' : 'kg',
    measurement_unit: ms === 'in' ? 'in' : 'cm',
  };
}

/**
 * Pure weight conversions
 */
export function convertKgToLb(kg, precision = 1) {
  if (kg === null || kg === undefined || isNaN(Number(kg))) return null;
  const num = Number(kg);
  const lb = num * CONVERSION_CONSTANTS.KG_TO_LB;
  return Number(lb.toFixed(precision));
}

export function convertLbToKg(lb, precision = 2) {
  if (lb === null || lb === undefined || isNaN(Number(lb))) return null;
  const num = Number(lb);
  const kg = num * CONVERSION_CONSTANTS.LB_TO_KG;
  return Number(kg.toFixed(precision));
}

/**
 * Pure measurement conversions
 */
export function convertCmToIn(cm, precision = 1) {
  if (cm === null || cm === undefined || isNaN(Number(cm))) return null;
  const num = Number(cm);
  const inches = num * CONVERSION_CONSTANTS.CM_TO_INCH;
  return Number(inches.toFixed(precision));
}

export function convertInToCm(inches, precision = 2) {
  if (inches === null || inches === undefined || isNaN(Number(inches))) return null;
  const num = Number(inches);
  const cm = num * CONVERSION_CONSTANTS.INCH_TO_CM;
  return Number(cm.toFixed(precision));
}

/**
 * Exercise Weight: Presentation and Input Parsing
 */
export function formatExerciseWeight(canonicalKg, unit = 'kg', options = {}) {
  if (canonicalKg === null || canonicalKg === undefined || isNaN(Number(canonicalKg))) return '-';
  const val = Number(canonicalKg);
  const includeLabel = options.includeLabel !== false;

  if (unit === 'lb') {
    // Exercise weights in LB: display rounded to nearest 0.5 lb or 1 decimal place
    const lb = Math.round(val * CONVERSION_CONSTANTS.KG_TO_LB * 2) / 2;
    const formatted = lb % 1 === 0 ? lb.toString() : lb.toFixed(1);
    return includeLabel ? `${formatted} ${UNIT_LABELS_AR.lb}` : formatted;
  }

  const formatted = val % 1 === 0 ? val.toString() : val.toFixed(1);
  return includeLabel ? `${formatted} ${UNIT_LABELS_AR.kg}` : formatted;
}

export function parseExerciseWeightToCanonicalKg(inputValue, unit = 'kg') {
  if (inputValue === null || inputValue === undefined || inputValue === '') return null;
  const val = Number(inputValue);
  if (isNaN(val) || val < 0) return null;

  if (unit === 'lb') {
    return Number((val * CONVERSION_CONSTANTS.LB_TO_KG).toFixed(2));
  }
  return Number(val.toFixed(2));
}

/**
 * Body Weight: Presentation and Input Parsing
 */
export function formatBodyWeight(canonicalKg, unit = 'kg', options = {}) {
  if (canonicalKg === null || canonicalKg === undefined || isNaN(Number(canonicalKg))) return '-';
  const val = Number(canonicalKg);
  const includeLabel = options.includeLabel !== false;

  if (unit === 'lb') {
    const lb = (val * CONVERSION_CONSTANTS.KG_TO_LB).toFixed(1);
    return includeLabel ? `${lb} ${UNIT_LABELS_AR.lb}` : lb;
  }

  const kg = val.toFixed(1);
  return includeLabel ? `${kg} ${UNIT_LABELS_AR.kg}` : kg;
}

export function parseBodyWeightToCanonicalKg(inputValue, unit = 'kg') {
  if (inputValue === null || inputValue === undefined || inputValue === '') return null;
  const val = Number(inputValue);
  if (isNaN(val) || val <= 0) return null;

  if (unit === 'lb') {
    return Number((val * CONVERSION_CONSTANTS.LB_TO_KG).toFixed(2));
  }
  return Number(val.toFixed(2));
}

/**
 * Measurement (Waist): Presentation and Input Parsing
 */
export function formatMeasurement(canonicalCm, unit = 'cm', options = {}) {
  if (canonicalCm === null || canonicalCm === undefined || isNaN(Number(canonicalCm))) return '-';
  const val = Number(canonicalCm);
  const includeLabel = options.includeLabel !== false;

  if (unit === 'in') {
    const inches = (val * CONVERSION_CONSTANTS.CM_TO_INCH).toFixed(1);
    return includeLabel ? `${inches} ${UNIT_LABELS_AR.in}` : inches;
  }

  const cm = val.toFixed(1);
  return includeLabel ? `${cm} ${UNIT_LABELS_AR.cm}` : cm;
}

export function parseMeasurementToCanonicalCm(inputValue, unit = 'cm') {
  if (inputValue === null || inputValue === undefined || inputValue === '') return null;
  const val = Number(inputValue);
  if (isNaN(val) || val <= 0) return null;

  if (unit === 'in') {
    return Number((val * CONVERSION_CONSTANTS.INCH_TO_CM).toFixed(2));
  }
  return Number(val.toFixed(2));
}

/**
 * Increments or decrements a value based on unit rules
 */
export function stepExerciseWeight(currentVal, direction = 1, unit = 'kg') {
  const step = UNIT_STEPS.exercise_weight[unit] || 2.5;
  const next = Math.max(0, (Number(currentVal) || 0) + direction * step);
  return unit === 'lb' ? Math.round(next * 2) / 2 : Number(next.toFixed(1));
}

export function stepBodyWeight(currentVal, direction = 1, unit = 'kg') {
  const step = UNIT_STEPS.body_weight[unit] || 0.5;
  const next = Math.max(0, (Number(currentVal) || 0) + direction * step);
  return Number(next.toFixed(1));
}

export function stepMeasurement(currentVal, direction = 1, unit = 'cm') {
  const step = UNIT_STEPS.measurement[unit] || 0.5;
  const next = Math.max(0, (Number(currentVal) || 0) + direction * step);
  return Number(next.toFixed(2));
}

/**
 * Parse preferences from user notes tag without modifying DB schema
 */
export function parseUserUnitPreferences(notes = '') {
  const match = String(notes || '').match(/\[UNIT_PREFERENCES:(.*?)\]/);
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      return sanitizeUnitPreferences(parsed);
    } catch (_) {}
  }
  return { ...DEFAULT_UNIT_PREFERENCES };
}

/**
 * Serialize preferences into user notes tag
 */
export function serializeUserUnitPreferences(notes = '', preferences = {}) {
  const cleanNotes = String(notes || '').replace(/\[UNIT_PREFERENCES:.*?\]/g, '').trim();
  const safe = sanitizeUnitPreferences(preferences);
  const tag = `[UNIT_PREFERENCES:${JSON.stringify(safe)}]`;
  return cleanNotes ? `${cleanNotes}\n${tag}` : tag;
}
