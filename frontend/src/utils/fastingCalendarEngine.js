/**
 * Calendar-Aware Religious Fasting Engine (single source; backend re-export:
 * src/execution-engines/fasting-calendar-engine.js).
 *
 * Dates are COMPUTED, not typed:
 * - Ramadan: Hijri month 9 of the Umm al-Qura calendar (Intl 'islamic-umalqura', the official Saudi
 *   calendar). Local moon-sighting (Egypt, some Gulf states) can differ by one day; the coach override
 *   covers that day and anyone who does not fast (illness, travel, pregnancy, menstruation).
 * - Coptic Orthodox fasts: anchored on Orthodox Easter (Meeus Julian computus + 13 days, valid 1900-2099)
 *   and fixed Coptic-calendar dates:
 *     Jonah (Nineveh)  Easter-69 .. Easter-67   strict vegan
 *     Great Lent       Easter-55 .. Easter-1    strict vegan (includes Holy Week)
 *     Apostles         Easter+50 .. 11 July     client's style (fish usually allowed)
 *     Virgin Mary      7 Aug .. 21 Aug          client's style
 *     Nativity         25 Nov .. 6 Jan          client's style
 *   Weekly Wednesday/Friday fasting is not applied automatically (coach can force it).
 */

import { FOOD_DATABASE, calculateDynamicFoodSwap, isFoodClinicallySafe } from './foodSwapEngine.js';

export const FASTING_MODES = Object.freeze({ NONE: 'NONE', RAMADAN: 'RAMADAN', CHRISTIAN_FAST: 'CHRISTIAN_FAST' });
export const FASTING_DIETS = Object.freeze({ STRICT_VEGAN: 'STRICT_VEGAN', PESCATARIAN: 'PESCATARIAN' });
export const FASTING_OVERRIDES = Object.freeze({ AUTO: 'AUTO', OFF: 'OFF', FORCE_ON: 'FORCE_ON' });

const DAY = 86400000;
const utcDate = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
const addDays = (date, n) => new Date(date.getTime() + n * DAY);

/** Calendar day (UTC midnight) of `date` in the given IANA time zone. */
export function localDay(date = new Date(), timeZone = 'Africa/Cairo') {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(date));
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return utcDate(get('year'), get('month'), get('day'));
}

/** Umm al-Qura Hijri date of a calendar day. */
export function hijriDate(day) {
  const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date(day.getTime() + DAY / 2));
  const get = (t) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get('year') || Number(String(parts.find((p) => p.type === 'relatedYear')?.value || '')), month: get('month'), day: get('day') };
}

export function isRamadanDay(day) {
  return hijriDate(day).month === 9;
}

/** Orthodox (Coptic) Easter Sunday, Gregorian, as UTC midnight. Meeus Julian algorithm + 13 days. */
export function orthodoxEaster(year) {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const dayOfMonth = ((d + e + 114) % 31) + 1;
  return addDays(utcDate(year, month, dayOfMonth), 13);
}

/** Coptic fasting periods touching `year` (Nativity fast of the previous year included for early January). */
export function copticFastPeriods(year) {
  const easter = orthodoxEaster(year);
  const periods = [
    { id: `JONAH_${year}`, name_ar: 'صوم يونان (نينوى)', start: addDays(easter, -69), end: addDays(easter, -67), strict: true },
    { id: `GREAT_LENT_${year}`, name_ar: 'الصوم الكبير', start: addDays(easter, -55), end: addDays(easter, -1), strict: true },
    { id: `APOSTLES_${year}`, name_ar: 'صوم الرسل', start: addDays(easter, 50), end: utcDate(year, 7, 11), strict: false },
    { id: `VIRGIN_MARY_${year}`, name_ar: 'صوم السيدة العذراء', start: utcDate(year, 8, 7), end: utcDate(year, 8, 21), strict: false },
    { id: `NATIVITY_${year}`, name_ar: 'صوم الميلاد', start: utcDate(year, 11, 25), end: utcDate(year + 1, 1, 6), strict: false },
    { id: `NATIVITY_${year - 1}`, name_ar: 'صوم الميلاد', start: utcDate(year - 1, 11, 25), end: utcDate(year, 1, 6), strict: false },
  ];
  return periods.filter((p) => p.start <= p.end);
}

export function findChristianFast(day) {
  return copticFastPeriods(day.getUTCFullYear()).find((p) => day >= p.start && day <= p.end) || null;
}

/** First and last day of the Ramadan that starts in Gregorian `year` (null if none). */
export function ramadanRange(year) {
  let start = null;
  for (let d = utcDate(year, 1, 1); d.getUTCFullYear() === year; d = addDays(d, 1)) {
    if (isRamadanDay(d)) { start = d; break; }
  }
  if (!start) return null;
  let end = start;
  while (isRamadanDay(addDays(end, 1))) end = addDays(end, 1);
  return { start, end };
}

/**
 * Fasting context for a client on a date.
 * @param {Object} p
 * @param {'MUSLIM'|'CHRISTIAN'|'OTHER'} p.religion
 * @param {'PESCATARIAN_ALLOWED'|'STRICT_VEGAN'} [p.christian_fasting_style]
 * @param {'AUTO'|'OFF'|'FORCE_ON'} [p.override]   coach override
 * @param {Date|string} [p.date]
 * @param {string} [p.time_zone]
 */
export function resolveFastingContext({ religion, christian_fasting_style = 'PESCATARIAN_ALLOWED', override = FASTING_OVERRIDES.AUTO, date = new Date(), time_zone = 'Africa/Cairo' } = {}) {
  const day = localDay(date, time_zone);
  const rel = String(religion || '').toUpperCase();
  const clientDiet = String(christian_fasting_style).toUpperCase() === 'STRICT_VEGAN' ? FASTING_DIETS.STRICT_VEGAN : FASTING_DIETS.PESCATARIAN;
  const none = (reason_ar, source = 'CALENDAR') => ({ active: false, mode: FASTING_MODES.NONE, diet: null, period_name_ar: null, source, override, reason_ar });

  if (override === FASTING_OVERRIDES.OFF) return none('تم إيقاف الصيام يدوياً من الكوتش (مرض، سفر، أو عذر شرعي).', 'COACH_OVERRIDE');

  if (rel === 'MUSLIM') {
    const inRamadan = isRamadanDay(day);
    if (inRamadan || override === FASTING_OVERRIDES.FORCE_ON) {
      return { active: true, mode: FASTING_MODES.RAMADAN, diet: null, period_name_ar: 'شهر رمضان', source: inRamadan ? 'CALENDAR' : 'COACH_OVERRIDE', override,
        reason_ar: inRamadan ? 'اليوم من شهر رمضان حسب تقويم أم القرى.' : 'تم تفعيل وضع رمضان يدوياً من الكوتش.' };
    }
    return none('لا يوجد صيام اليوم.');
  }

  if (rel === 'CHRISTIAN') {
    const period = findChristianFast(day);
    if (period || override === FASTING_OVERRIDES.FORCE_ON) {
      const diet = period?.strict ? FASTING_DIETS.STRICT_VEGAN : clientDiet;
      return { active: true, mode: FASTING_MODES.CHRISTIAN_FAST, diet, period_name_ar: period?.name_ar || 'صيام بتفعيل الكوتش', source: period ? 'CALENDAR' : 'COACH_OVERRIDE', override,
        reason_ar: period
          ? `${period.name_ar}: ${diet === FASTING_DIETS.STRICT_VEGAN ? 'نباتي صرف بدون لحوم أو أسماك أو بيض أو ألبان' : 'نباتي مع السمك، بدون لحوم أو بيض أو ألبان'}.`
          : 'تم تفعيل الصيام يدوياً من الكوتش.' };
    }
    return none('لا يوجد صيام اليوم.');
  }

  return none('لا يوجد صيام ديني في ملف المتدرب.');
}

// ---------- Food rules during a Christian fast ----------
const MEAT_PATTERN = /CHICKEN|BEEF|LAMB|TURKEY|LIVER|VEAL|KOFTA|CAMEL|MEAT|SAUSAGE|BURGER|PASTRAMI|BASTERMA|DUCK|RABBIT|PIGEON|KABSA_CHICKEN|KABSA_LAMB|MACHBOOS_CHICKEN|HAREES|MADROOBA|WHEY|CASEIN|COLLAGEN/;
const FISH_PATTERN = /FISH|TUNA|SALMON|SHRIMP|SARDINE|MACKEREL|TILAPIA|BOURI|HAMOUR|KANAAD|NAJIL|SEAFOOD|CALAMARI|CRAB|KINGFISH/;
const EGG_PATTERN = /EGG(?!PLANT)/;
const DAIRY_PATTERN = /MILK|YOGURT|CHEESE|LABAN|BUTTER|GHEE|CREAM|LABNEH|KAREISH|MOLOKHIA_TAQLIYA|MADROOBA/;
// Plant foods whose names borrow dairy words (peanut butter, almond/oat/soy/coconut milk, tahini).
const PLANT_LOOKALIKE_PATTERN = /PEANUT|ALMOND|CASHEW|NUT_BUTTER|OAT_MILK|SOY|COCONUT|RICE_MILK|TAHINI|SESAME/;

export function classifyAnimalProduct(food = {}) {
  const code = String(food.code || '').toUpperCase();
  const allergens = (food.allergens || []).map((a) => String(a).toUpperCase());
  return {
    meat: MEAT_PATTERN.test(code),
    fish: FISH_PATTERN.test(code) || allergens.includes('FISH') || allergens.includes('SHELLFISH'),
    egg: EGG_PATTERN.test(code) || allergens.includes('EGGS'),
    dairy: Boolean(food.is_dairy) || (DAIRY_PATTERN.test(code) && !PLANT_LOOKALIKE_PATTERN.test(code)) || allergens.includes('DAIRY'),
  };
}

export function isFoodAllowedDuringFast(food, context) {
  if (!context?.active || context.mode !== FASTING_MODES.CHRISTIAN_FAST) return true;
  const a = classifyAnimalProduct(food);
  if (a.meat || a.egg || a.dairy) return false;
  if (a.fish && context.diet === FASTING_DIETS.STRICT_VEGAN) return false;
  return true;
}

const MAX_SUBSTITUTE_PORTION_G = 350;

function pickSubstitute(food, portion, context, clinicalProfile) {
  const candidates = Object.values(FOOD_DATABASE).filter((f) => f && f.code && f.code === f.code.toUpperCase() && !f.alias_of
    && f.code !== food.code && f.macro_type === food.macro_type
    && isFoodAllowedDuringFast(f, context) && isFoodClinicallySafe(f, clinicalProfile));
  candidates.sort((x, y) => Number(y.taste_profile === food.taste_profile) - Number(x.taste_profile === food.taste_profile));
  for (const target of candidates) {
    try {
      const r = calculateDynamicFoodSwap({ current_food_code: food.code, current_portion_g: portion, target_food_code: target.code, clinical_profile: clinicalProfile, enforce_taste_profile: false });
      if (r?.replacement_food) return r.replacement_food;
    } catch { /* candidate not swappable, try the next */ }
  }
  return null;
}

/**
 * Applies the fasting context to the client's meals.
 * - Christian fast: every animal item not allowed by the fast is replaced by an allowed item of the same
 *   macro type (portion matched by the swap engine, respecting clinical constraints). With no safe
 *   substitute the item stays, flagged for the coach (e.g. favism + vegan: all plant proteins are legumes).
 * - Ramadan: meals become Iftar / snack / Suhoor, same foods and daily totals.
 */
export function applyFastingToMeals(meals = [], context, clinicalProfile = {}) {
  if (!context?.active) return meals;

  if (context.mode === FASTING_MODES.RAMADAN) {
    const n = meals.length;
    return meals.map((meal, i) => {
      const isFirst = i === 0;
      const isLast = i === n - 1 && n > 1;
      const title = isFirst ? 'الإفطار (ابدأ بتمرتين وماء ثم الوجبة)' : isLast ? 'السحور (قبل الفجر بساعة)' : (n > 3 ? `سناك بعد التراويح ${i}` : 'سناك بعد التراويح');
      const time = isFirst ? 'عند أذان المغرب' : isLast ? 'قبل الفجر' : 'بعد التراويح';
      return { ...meal, title, time, ramadan_slot: isFirst ? 'IFTAR' : isLast ? 'SUHOOR' : 'SNACK' };
    });
  }

  return meals.map((meal) => {
    const items = (meal.items || []).map((item) => {
      const food = FOOD_DATABASE[item.code];
      if (!food || isFoodAllowedDuringFast(food, context)) return item;
      const sub = pickSubstitute(food, Number(item.amount) || 100, context, clinicalProfile);
      if (!sub) return { ...item, fasting_blocked: true, fasting_note_ar: 'لا يوجد بديل صيامي آمن لحالتك الصحية، راجع الكابتن.' };
      // Plant proteins are less dense: cap the plate at a realistic portion and say how to close the gap.
      const scale = sub.portion_g > MAX_SUBSTITUTE_PORTION_G ? MAX_SUBSTITUTE_PORTION_G / sub.portion_g : 1;
      const r1 = (n) => Math.round(n * scale * 10) / 10;
      const proteinGap = Math.round((sub.macros.protein_g - r1(sub.macros.protein_g)) * 10) / 10;
      return {
        ...item,
        code: sub.code,
        name: sub.name_ar,
        amount: Math.round(sub.portion_g * scale),
        p: r1(sub.macros.protein_g),
        c: r1(sub.macros.carbs_g),
        f: r1(sub.macros.fat_g),
        cal: Math.round(sub.macros.calories_kcal * scale),
        fasting_substituted_from: { code: item.code, name: item.name, amount: item.amount },
        ...(proteinGap > 0 ? { fasting_protein_gap_g: proteinGap, fasting_note_ar: `ينقص ${proteinGap} جم بروتين عن الوجبة الأصلية: أضف سكوب بروتين نباتي أو حصة بقوليات في وجبة أخرى.` } : {}),
      };
    });
    const sum = (k) => Math.round(items.reduce((s, it) => s + (Number(it[k]) || 0), 0));
    return { ...meal, items, macros: { ...(meal.macros || {}), calories: sum('cal'), protein: sum('p'), carbs: sum('c'), fats: sum('f') } };
  });
}

/** Ramadan cardio timing (no daytime intervals while fasting). */
export const RAMADAN_CARDIO_GUIDANCE_AR = 'رمضان: الكارديو بعد الإفطار بساعة ونصف على الأقل أو مشي خفيف قبل المغرب بـ 30 دقيقة، ولا فترات عالية الشدة أثناء الصيام. اشرب 2.5-3 لتر بين الإفطار والسحور.';
