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

