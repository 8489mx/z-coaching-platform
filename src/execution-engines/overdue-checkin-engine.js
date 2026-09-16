/**
 * Overdue Check-in & Ghosting Prevention Engine
 * Z Coaching Platform - Operations & Client Retention
 *
 * Deterministically detects active clients who missed their scheduled weekly check-in (>48h grace),
 * and generates courteous, high-converting Egyptian WhatsApp nudge messages.
 * Zero emojis, strictly Arabic RTL clinical directives.
 */

export const CHECKIN_CYCLE_DAYS = 7;
export const CHECKIN_GRACE_HOURS = 48; // 2 days grace period
export const OVERDUE_THRESHOLD_DAYS = 9; // 7 days cycle + 2 days grace

/**
 * Evaluates whether an individual client is overdue for their weekly check-in.
 */
export function evaluateClientCheckinOverdue(client = {}, now = new Date()) {
  const status = String(client.status || client.subscription_status || '').toUpperCase();
  const isActive = status === 'ACTIVE' || status === 'EXPIRING_SOON' || status === 'ACTIVE_VIP';

  if (!isActive) {
    return {
      isOverdue: false,
      daysElapsed: 0,
      daysOverdue: 0,
      urgency: 'NONE',
      reason: 'CLIENT_NOT_ACTIVE'
    };
  }

  const nowDate = new Date(now);
  const nowTime = nowDate.getTime();
  const checkins = Array.isArray(client.checkinSubmissions) ? client.checkinSubmissions : [];
  
  let referenceDate = null;
  let isFirstCheckin = false;

  if (checkins.length > 0) {
    // Find most recent checkin
    const sorted = [...checkins].sort((a, b) => {
      const timeB = new Date(b.created_at || b.createdAt || b.submitted_at || 0).getTime();
      const timeA = new Date(a.created_at || a.createdAt || a.submitted_at || 0).getTime();
      return timeB - timeA;
    });
    const latest = sorted[0];
    referenceDate = new Date(latest.created_at || latest.createdAt || latest.submitted_at || 0);
  } else if (client.subscription_start_date) {
    referenceDate = new Date(client.subscription_start_date);
    isFirstCheckin = true;
  } else if (client.created_at || client.createdAt) {
    referenceDate = new Date(client.created_at || client.createdAt);
    isFirstCheckin = true;
  }

  if (!referenceDate || isNaN(referenceDate.getTime())) {
    return {
      isOverdue: false,
      daysElapsed: 0,
      daysOverdue: 0,
      urgency: 'NONE',
      reason: 'NO_VALID_REFERENCE_DATE'
    };
  }

  const diffMs = nowTime - referenceDate.getTime();
  const daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 3600 * 24)));

  // If >= 9 days have passed since last checkin / start date, client is overdue!
  const isOverdue = daysElapsed >= OVERDUE_THRESHOLD_DAYS;
  const daysOverdue = isOverdue ? (daysElapsed - CHECKIN_CYCLE_DAYS) : 0;

  let urgency = 'NONE';
  if (isOverdue) {
    if (daysOverdue >= 7) urgency = 'CRITICAL'; // 14+ days total, high ghosting risk
    else if (daysOverdue >= 4) urgency = 'HIGH';
    else urgency = 'MODERATE';
  }

  return {
    isOverdue,
    daysElapsed,
    daysOverdue,
    isFirstCheckin,
    referenceDate: referenceDate.toISOString(),
    urgency,
    reason: isOverdue ? 'MISSED_CHECKIN_CYCLE' : 'ON_SCHEDULE'
  };
}

/**
 * Filters and ranks all overdue clients from a list of clients.
 */
export function filterOverdueClients(clients = [], now = new Date()) {
  if (!Array.isArray(clients)) return [];

  const results = [];
  for (const client of clients) {
    const audit = evaluateClientCheckinOverdue(client, now);
    if (audit.isOverdue) {
      results.push({
        client,
        ...audit
      });
    }
  }

  // Sort by highest days overdue (most urgent first)
  return results.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

/**
 * Generates an Egyptian WhatsApp nudge message for the overdue client.
 */
export function generateOverdueWhatsAppNudge(client = {}, origin = '') {
  const rawName = client.full_name || client.name || client.user?.full_name || '';
  const cleanName = rawName.replace(/مشترك #\d+/g, '').trim();
  const greeting = cleanName ? `صباح الفل يا ${cleanName}، ` : 'صباح الفل يا بطل، ';

  const rawCode = client.client_code || client.user?.client_code || client.id || '';
  const cleanCode = String(rawCode).replace(/^client[-_]?/i, '').replace('#', '');
  const baseUrl = origin ? origin.replace(/\/+$/, '') : '';
  const checkinUrl = cleanCode ? `${baseUrl}/checkin?code=${cleanCode}` : `${baseUrl}/checkin`;

  return `${greeting}حبينا نطمن عليك! مستنيين شيك إنك وصورك الأسبوعية عشان نراجع التطور في الميزان ومحيطات الجسم ونحدث خطتك للأسبوع الجديد.\n\nرابط تسجيل الشيك إن في دقيقة:\n${checkinUrl}`;
}
