/**
 * Circadian & Lab Trigger Engine (محرك مواعيد الكافيين وتنبيه إعادة الفحوصات)
 *
 * 1. Caffeine Cutoff Calculator:
 *    - Strictly calculates caffeine stop time (default 6 hours prior to bedtime as per coach protocol) to protect deep slow-wave / delta sleep.
 * 2. Lab Re-Test Scheduler:
 *    - Detects initial abnormal biomarkers (HbA1c >= 5.7%, Vit D < 30, Ferritin < 30).
 *    - Triggers automated re-test milestone at Week 10 for client app & coach center.
 */

/**
 * Computes exact caffeine cutoff time (default 6 hours prior to bedtime).
 * @param {string} bedtimeStr - e.g. "23:00" or "00:30"
 * @param {number} bufferHours - hours before bedtime to cut caffeine (default: 6)
 */
export function getCaffeineCutoffTime(bedtimeStr = "23:00", bufferHours = 6) {
  const parts = String(bedtimeStr || "23:00").split(":");
  let hours = parseInt(parts[0], 10);
  let minutes = parseInt(parts[1] || "0", 10);

  if (isNaN(hours)) hours = 23;
  if (isNaN(minutes)) minutes = 0;

  // Subtract bufferHours (default 6 hours as per coach protocol)
  let cutoffHours = hours - bufferHours;
  if (cutoffHours < 0) {
    cutoffHours = 24 + cutoffHours;
  }

  const formattedHours24 = String(cutoffHours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const time24 = `${formattedHours24}:${formattedMinutes}`;

  // 12-hour format in Arabic
  const periodAr = cutoffHours >= 12 ? 'مساءً' : 'صباحاً';
  const displayHour = cutoffHours % 12 === 0 ? 12 : cutoffHours % 12;
  const time12Ar = `الساعة ${displayHour}:${formattedMinutes} ${periodAr}`;

  return {
    bedtime_24h: `${String(hours).padStart(2, '0')}:${formattedMinutes}`,
    caffeine_cutoff_24h: time24,
    caffeine_cutoff_display_ar: time12Ar,
    buffer_hours: bufferHours,
    directive_ar: `موعد إيقاف الكافيين والمنبهات: ${time12Ar} (قبل موعد النوم بـ ${bufferHours} ساعات لحماية جودة النوم العميق وموازنة الكورتيزول).`
  };
}

/**
 * Evaluates whether a client requires an automated Week 10 Bloodwork Re-Test Trigger.
 */
export function evaluateLabReTestTrigger({
  client_id = '1',
  client_name = 'سارة المنصوري',
  current_week = 10,
  baseline_biomarkers = {
    hba1c_percent: 5.9,
    vitamin_d3_ng_ml: 22,
    ferritin_ng_ml: 18
  }
}) {
  const flags = [];

  if (baseline_biomarkers.hba1c_percent && baseline_biomarkers.hba1c_percent >= 5.7) {
    flags.push({ marker: 'HbA1c (السكر التراكمي)', baseline_value: `${baseline_biomarkers.hba1c_percent}%`, target: '< 5.6%' });
  }

  if (baseline_biomarkers.vitamin_d3_ng_ml && baseline_biomarkers.vitamin_d3_ng_ml < 30) {
    flags.push({ marker: 'Vitamin D3 (فيتامين د)', baseline_value: `${baseline_biomarkers.vitamin_d3_ng_ml} ng/mL`, target: '40 - 60 ng/mL' });
  }

  if (baseline_biomarkers.ferritin_ng_ml && baseline_biomarkers.ferritin_ng_ml < 30) {
    flags.push({ marker: 'Serum Ferritin (مخزون الحديد)', baseline_value: `${baseline_biomarkers.ferritin_ng_ml} ng/mL`, target: '> 50 ng/mL' });
  }

  const shouldTriggerReTest = flags.length > 0 && current_week >= 10;

  return {
    client_id,
    client_name,
    current_week,
    has_abnormal_baseline_markers: flags.length > 0,
    monitored_markers_count: flags.length,
    monitored_markers: flags,
    trigger_retest_alert: shouldTriggerReTest,
    target_retest_week: 10,
    notification_card: shouldTriggerReTest ? {
      title_ar: 'موعد إعادة التحاليل المخبرية الدورية (الأسبوع 10)',
      description_ar: `حان وقت إعادة فحص المؤشرات المخبرية لمقارنة التحسن الفسيولوجي الملحوظ: (${flags.map(f => f.marker).join('، ')}).`,
      action_label_ar: 'رفع نتائج التحاليل الجديدة'
    } : null,
    coach_alert_ar: shouldTriggerReTest ? `تنبيه الأسبوع 10: المشترك ${client_name} مستحق لإعادة فحص (${flags.map(f => f.marker).join('، ')}).` : null
  };
}
