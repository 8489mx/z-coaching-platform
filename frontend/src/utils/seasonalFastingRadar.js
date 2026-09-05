/**
 * Seasonal Fasting Radar & Early Alert Engine
 * 
 * Tracks Gregorian & Hijri seasonal fasting events:
 * 1. Ramadan (شهر رمضان المبارك)
 * 2. Coptic Great Lent (الصوم الكبير للأقباط)
 * 3. Coptic Nativity Fast (صوم الميلاد)
 */

export const SEASONAL_FASTING_CALENDAR = [
  {
    id: 'RAMADAN_2026',
    name: 'شهر رمضان المبارك 1447هـ',
    type: 'ISLAMIC',
    startDate: new Date(2026, 1, 18),
    endDate: new Date(2026, 2, 20),
    description: 'موسم الصيام الجاف (Dry Fasting) مع جدولة نوافذ الإفطار والسحور والترطيب الليلي.'
  },
  {
    id: 'COPTIC_LENT_2026',
    name: 'الصوم الكبير للأقباط',
    type: 'COPTIC',
    startDate: new Date(2026, 1, 16),
    endDate: new Date(2026, 3, 12),
    description: 'صيام صيامي نباتي خالي من اللحوم والألبان مع التركيز على البقوليات والبروتين النباتي الكامل.'
  },
  {
    id: 'COPTIC_NATIVITY_2026',
    name: 'صوم الميلاد المجيد',
    type: 'COPTIC',
    startDate: new Date(2026, 10, 25),
    endDate: new Date(2027, 0, 7),
    description: 'صيام صيامي نباتي مع السماح بالأسماك والمأكولات البحرية لتأمين احتياج البروتين الكامل.'
  },
  {
    id: 'RAMADAN_2027',
    name: 'شهر رمضان المبارك 1448هـ',
    type: 'ISLAMIC',
    startDate: new Date(2027, 1, 8),
    endDate: new Date(2027, 2, 9),
    description: 'موسم الصيام الجاف وتوزيع وجبات الإفطار وبعد التمرين والسحور.'
  },
  {
    id: 'COPTIC_LENT_2027',
    name: 'الصوم الكبير للأقباط',
    type: 'COPTIC',
    startDate: new Date(2027, 2, 8),
    endDate: new Date(2027, 4, 2),
    description: 'صيام نباتي خالي من الروح، يتطلب تأمين بروتين عالي من مصادر نباتية مركبة.'
  }
];

export function getUpcomingFastingAlert(now = new Date()) {
  for (const season of SEASONAL_FASTING_CALENDAR) {
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
  const isRamadan = religion === 'MUSLIM' || (!religion && !isCoptic);
  const isIntermittent = Boolean(intermittentFasting && intermittentFasting !== 'none');

  let primaryFastingBadge = null;
  if (isCoptic) {
    primaryFastingBadge = {
      type: 'COPTIC',
      label: christianFastingStyle === 'STRICT_VEGAN' ? 'صيام مسيحي (نباتي صرف)' : 'صيام مسيحي (سمك مسموح)',
      shortLabel: 'صيام مسيحي',
      bg: '#EDE9FE',
      border: '#DDD6FE',
      color: '#6D28D9'
    };
  } else if (isRamadan) {
    primaryFastingBadge = {
      type: 'RAMADAN',
      label: 'صيام شهر رمضان المبارك',
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
