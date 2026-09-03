/**
 * Seasonal Fasting Radar & Early Alert Engine
 * 
 * Tracks Gregorian & Hijri seasonal fasting events:
 * 1. Ramadan (شهر رمضان المبارك)
 * 2. Coptic Great Lent (الصوم الكبير للأقباط)
 * 3. Coptic Nativity Fast (صوم الميلاد)
 */

export function getUpcomingFastingAlert(now = new Date()) {
  const seasons = [
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
      name: 'الصوم الكبير (Coptic Great Lent)',
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
      name: 'الصوم الكبير (Coptic Great Lent)',
      type: 'COPTIC',
      startDate: new Date(2027, 2, 8),
      endDate: new Date(2027, 4, 2),
      description: 'صيام نباتي خالي من الروح، يتطلب تأمين بروتين عالي من مصادر نباتية مركبة.'
    }
  ];

  for (const season of seasons) {
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

    if (daysLeft > 0 && daysLeft <= 35) {
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

  const upcoming = seasons.find(s => s.startDate > now) || seasons[0];
  const diffMs = upcoming.startDate.getTime() - now.getTime();
  const daysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    isActive: false,
    name: upcoming.name,
    type: upcoming.type,
    statusText: `متبقي ${daysLeft} يوماً`,
    daysLeft,
    description: upcoming.description
  };
}
