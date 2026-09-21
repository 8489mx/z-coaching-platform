/**
 * Whether a cardio modality suits a client, for the coach's cardio choice. Clinical reasons block
 * an option (the coach sees why); equipment the client may not own only warns when it is a home
 * gym, and blocks when the client trains with bands or minimal equipment.
 *
 * profile: the plan's client_profile ({ injuries, conditions, bmi, training_environment,
 * is_pregnant }) plus optional { hiit_banned } from the cardio guardrails.
 */
const HIGH_IMPACT = new Set(['burpees_bodyweight', 'jump_rope']);
const MACHINES = new Set(['incline_treadmill', 'elliptical', 'stationary_bike', 'stairmaster', 'rowing_machine', 'assault_bike']);

const has = (list, pattern) => (Array.isArray(list) ? list : []).some((v) => pattern.test(String(v || '')));

export function evaluateCardioModality(optionId, profile = {}) {
  const id = String(optionId || '');
  const injuries = profile.injuries || [];
  const conditions = profile.conditions || [];
  const knee = has(injuries, /knee|ركب/i);
  const back = has(injuries, /back|spine|disc|ظهر|فقر|ديسك/i);
  const shoulder = has(injuries, /shoulder|كتف/i);
  const asthma = profile.hiit_banned === true || has(conditions, /asthma|respirat|ربو|تنفس/i);
  const heart = has(conditions, /hypertension|heart|cardiac|ضغط|قلب/i);
  const blocked = [];

  if (knee && (HIGH_IMPACT.has(id) || id === 'stairmaster')) blocked.push('إصابة الركبة: قفز أو صعود سلم بيحمّل الركبة.');
  if (back && (id === 'burpees_bodyweight' || id === 'rowing_machine')) blocked.push('إصابة الظهر: انحناء متكرر تحت حمل.');
  if (shoulder && (id === 'burpees_bodyweight' || id === 'mountain_climbers')) blocked.push('إصابة الكتف: وزن الجسم كله على الكتفين.');
  if (Number(profile.bmi) >= 35 && HIGH_IMPACT.has(id)) blocked.push(`مؤشر كتلة الجسم ${profile.bmi}: صدمة القفز على المفاصل عالية.`);
  if (asthma && (id === 'assault_bike' || HIGH_IMPACT.has(id))) blocked.push('الربو: الكارديو عالي الشدة ممكن يسبب نوبة ضيق تنفس.');
  if (heart && (id === 'assault_bike' || id === 'burpees_bodyweight')) blocked.push('الضغط أو القلب: مجهود أقصى وارتفاع حاد في الضغط.');
  if (profile.is_pregnant === true && (HIGH_IMPACT.has(id) || id === 'assault_bike' || id === 'mountain_climbers')) blocked.push('الحمل: صدمات وشدة عالية.');

  const environment = String(profile.training_environment || '').toLowerCase();
  if (MACHINES.has(id) && (environment === 'calisthenics_bands' || environment === 'minimal_equipment')) {
    blocked.push('العميل بيتمرن بأوزان جسم وأحبال أو أدوات بسيطة: مفيش جهاز.');
  }
  if (blocked.length > 0) return { allowed: false, reasons_ar: blocked };
  if (MACHINES.has(id) && environment === 'home_gym') {
    return { allowed: true, warning_ar: 'محتاج جهاز؛ اتأكد إن العميل عنده في البيت.' };
  }
  return { allowed: true };
}
