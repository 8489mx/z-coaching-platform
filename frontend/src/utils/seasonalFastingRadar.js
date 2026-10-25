/**
 * Seasonal Fasting Radar & Early Alert Engine
 * 
 * Tracks Gregorian & Hijri seasonal fasting events:
 * 1. Ramadan (شهر رمضان المبارك)
 * 2. Coptic Great Lent (الصوم الكبير للأقباط)
 * 3. Coptic Nativity Fast (صوم الميلاد)
 */

import { ramadanRange, copticFastPeriods } from './fastingCalendarEngine.js';

// Dates are computed by the calendar engine (Umm al-Qura Hijri + Orthodox Easter), not typed, so the
// radar keeps working every year. Covers the current and the next Gregorian year.
export function buildSeasonalFastingCalendar(now = new Date()) {
  const year = new Date(now).getFullYear();
  const toLocal = (d, endOfDay = false) => new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0);
  const seasons = [];
  for (const y of [year - 1, year, year + 1]) {
    const ramadan = ramadanRange(y);
    if (ramadan) {
      seasons.push({ id: `RAMADAN_${y}`, name: 'شهر رمضان', type: 'ISLAMIC', startDate: toLocal(ramadan.start), endDate: toLocal(ramadan.end, true),
        description: 'موسم الصيام وتوزيع وجبات الإفطار والسحور.' });
    }
    for (const p of copticFastPeriods(y)) {
      if (!p.id.endsWith(`_${y}`) || !/GREAT_LENT|NATIVITY|APOSTLES|VIRGIN_MARY|JONAH/.test(p.id)) continue;
      seasons.push({ id: `COPTIC_${p.id}`, name: p.name_ar, type: 'COPTIC', startDate: toLocal(p.start), endDate: toLocal(p.end, true),
        description: p.strict ? 'صيام نباتي صرف بدون لحوم أو أسماك أو ألبان أو بيض.' : 'صيام نباتي، والسمك حسب اختيار المتدرب.' });
    }
  }
  return seasons.sort((a, b) => a.startDate - b.startDate);
}

export const SEASONAL_FASTING_CALENDAR = buildSeasonalFastingCalendar(new Date());

export function getUpcomingFastingAlert(now = new Date()) {
  // When Ramadan and a Coptic fast overlap, Ramadan is reported first (previous behaviour).
  const ordered = [...SEASONAL_FASTING_CALENDAR].sort((a, b) => {
    const activeA = now >= a.startDate && now <= a.endDate;
    const activeB = now >= b.startDate && now <= b.endDate;
    if (activeA !== activeB) return activeA ? -1 : 1;
    if (activeA && a.type !== b.type) return a.type === 'ISLAMIC' ? -1 : 1;
    return a.startDate - b.startDate;
  });
  for (const season of ordered) {
    const diffMs = season.startDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (now >= season.startDate && now <= season.endDate) {
      return {
        isActive: true,
        name: season.name,
        type: season.type,
        statusText: 'الموسم نشط حالياً',
        daysLeft: 0,
        description: season.description
      };
    }

    if (daysLeft > 0 && daysLeft <= 30) {
      return {
        isActive: false,
        name: season.name,
        type: season.type,
        statusText: `متبقي ${daysLeft} يوماً`,
        daysLeft,
        description: season.description
      };
    }
  }

  // إذا لم يكن هناك موسم نشط حالياً أو قادم خلال شهر (30 يوماً أو أقل)، لا يظهر أي رادار أو تنبيه
  return null;
}

/**
 * حساب تفاصيل وعداد الأيام لمحدد الصيام المطلوب بدقة عند النقر
 */
export function getFastingCountdown(fastingType, now = new Date()) {
  if (fastingType === 'INTERMITTENT') {
    return {
      type: 'INTERMITTENT',
      name: 'الصيام المتقطع (Intermittent Fasting)',
      statusText: 'بروتوكول يومي مستمر',
      daysLeft: null,
      isActive: true,
      description: 'بروتوكول تغذوي يومي مستمر قائم على نوافذ الإطعام (16/8 أو 14/10) لضبط مستويات الإنسولين وتحسين الاستجابة الأيضية.'
    };
  }

  const targetType = fastingType === 'COPTIC' ? 'COPTIC' : 'ISLAMIC';
  const relevantSeasons = SEASONAL_FASTING_CALENDAR.filter(s => s.type === targetType);

  // 1. هل الموسم نشط حالياً؟
  const activeSeason = relevantSeasons.find(s => now >= s.startDate && now <= s.endDate);
  if (activeSeason) {
    return {
      type: targetType,
      name: activeSeason.name,
      statusText: 'الموسم نشط حالياً',
      daysLeft: 0,
      isActive: true,
      description: activeSeason.description
    };
  }

  // 2. أقرب موسم قادم
  const upcoming = relevantSeasons.find(s => s.startDate > now) || relevantSeasons[relevantSeasons.length - 1];
  const diffMs = upcoming.startDate.getTime() - now.getTime();
  const daysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    type: targetType,
    name: upcoming.name,
    statusText: `متبقي عليه ${daysLeft} يوماً`,
    daysLeft,
    isActive: false,
    description: upcoming.description
  };
}

/**
 * Helper to extract and categorize client fasting profile:
 * - Coptic/Christian Fasting (PESCATARIAN_ALLOWED | STRICT_VEGAN)
 * - Ramadan Fasting (Muslim dry fasting)
 * - Intermittent Fasting (16/8, 14/10, etc.)
 */
export function extractClientFastingProfile(clientOrSubmission = {}, explicitAnswers = null) {
  const answers = explicitAnswers || 
    clientOrSubmission?.answers || 
    clientOrSubmission?.intakeSubmissions?.[0]?.answers || 
    {};

  const rawReligion = answers?.personal?.religion || 
    answers?.religion || 
    clientOrSubmission?.religion || 
    '';
  
  const religion = String(rawReligion).trim().toUpperCase();

  const christianFastingStyle = answers?.personal?.christianFastingStyle || 
    answers?.diet?.christianFastingStyle || 
    answers?.christianFastingStyle || 
    clientOrSubmission?.christianFastingStyle || 
    clientOrSubmission?.christian_fasting_style || 
    'PESCATARIAN_ALLOWED';

  const intermittentFasting = answers?.meal_structure?.intermittent_fasting || 
    answers?.diet?.meal_structure?.intermittent_fasting || 
    answers?.intermittent_fasting || 
    clientOrSubmission?.intermittent_fasting || 
    'none';

  const isCoptic = religion === 'CHRISTIAN';
  const isMuslim = religion === 'MUSLIM' || (!religion && !isCoptic);
  const isIntermittent = Boolean(intermittentFasting && intermittentFasting !== 'none');

  const now = new Date();
  const isRamadanActive = Boolean(SEASONAL_FASTING_CALENDAR.find(s => s.type === 'ISLAMIC' && now >= s.startDate && now <= s.endDate));
  const isCopticActive = Boolean(SEASONAL_FASTING_CALENDAR.find(s => s.type === 'COPTIC' && now >= s.startDate && now <= s.endDate));
  const explicitRamadan = answers?.fasting_mode === 'RAMADAN' || clientOrSubmission?.fasting_mode === 'RAMADAN';
  const explicitCoptic = answers?.fasting_mode === 'COPTIC' || clientOrSubmission?.fasting_mode === 'COPTIC';

  const shouldShowRamadan = isMuslim && (isRamadanActive || explicitRamadan);
  const shouldShowCoptic = isCoptic && (isCopticActive || explicitCoptic);

  let primaryFastingBadge = null;
  if (shouldShowCoptic) {
    primaryFastingBadge = {
      type: 'COPTIC',
      label: christianFastingStyle === 'STRICT_VEGAN' ? 'صيام مسيحي (نباتي صرف)' : 'صيام مسيحي (سمك مسموح)',
      shortLabel: 'صيام مسيحي',
      bg: '#EDE9FE',
      border: '#DDD6FE',
      color: '#6D28D9'
    };
  } else if (shouldShowRamadan) {
    primaryFastingBadge = {
      type: 'RAMADAN',
      label: 'صيام رمضان',
      shortLabel: 'صيام رمضان',
      bg: '#FEF3C7',
      border: '#FDE68A',
      color: '#B45309'
    };
  }

  let intermittentBadge = null;
  if (isIntermittent) {
    const hoursText = intermittentFasting === '16_8' ? '16/8' : (intermittentFasting === '14_10' ? '14/10' : intermittentFasting);
    intermittentBadge = {
      type: 'INTERMITTENT',
      label: `صيام متقطع (${hoursText})`,
      shortLabel: `متقطع ${hoursText}`,
      bg: '#E0F2FE',
      border: '#BAE6FD',
      color: '#0369A1'
    };
  }

  return {
    religion: religion || 'MUSLIM',
    christianFastingStyle,
    intermittentFasting,
    isCoptic,
    isRamadan,
    isIntermittent,
    primaryFastingBadge,
    intermittentBadge
  };
}
