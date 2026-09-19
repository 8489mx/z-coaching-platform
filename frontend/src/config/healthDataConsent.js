/**
 * Health-data processing consent (PDPL: Saudi Personal Data Protection Law, and Egypt's Law 151/2020).
 * Single source for the intake form and the intake API; the backend imports this file.
 * Bump the version when the consent text changes so new submissions record which text was accepted.
 */
export const HEALTH_DATA_CONSENT_VERSION = 'PDPL-2026-09';

export const HEALTH_DATA_CONSENT_TEXT_AR = 'أوافق على أن تجمع Z Coaching بياناتي الصحية (القياسات، الحالة الطبية، الإصابات، الأدوية، والصور) وتعالجها لغرض واحد فقط هو تصميم برنامجي التدريبي والغذائي ومتابعته. تُحفظ بياناتي الطبية مشفرة، ولا تُشارك مع أي طرف ثالث، ومن حقي أن أطلب الاطلاع عليها أو تصحيحها أو حذفها في أي وقت.';

/** True when the intake answers carry an accepted consent (any version). */
export function hasHealthDataConsent(answers) {
  const consent = answers?.health_data_consent;
  return !!(consent && consent.accepted === true && consent.version && consent.accepted_at);
}

export function buildHealthDataConsent(now = new Date()) {
  return { accepted: true, version: HEALTH_DATA_CONSENT_VERSION, accepted_at: now.toISOString() };
}
