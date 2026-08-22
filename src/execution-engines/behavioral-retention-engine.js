/**
 * Automated Behavioral & Retention Engine (محرك الاستبقاء والتحفيز السلوكي الذكي)
 *
 * 1. 48-Hour Churn Prevention Radar:
 *    - Inactive >= 48 hours -> CRITICAL alert + WhatsApp outreach template.
 *    - Inactive 24-48 hours -> AT_RISK alert.
 * 2. Package-Aware Check-in Webhook Scheduler:
 *    - MAX: Every 7 days morning reminder.
 *    - ELITE: Every 14 days morning reminder.
 * 3. Dopamine & Milestone Celebration Loops:
 *    - PR on main lift or 14-day 100% adherence streak.
 * 4. Cohort Retention & Transformation Velocity Analytics.
 */

export const RETENTION_RISK_LEVELS = {
  ACTIVE_ENGAGED: 'ACTIVE_ENGAGED',
  AT_RISK_24H: 'AT_RISK_24H',
  CRITICAL_INACTIVE_48H: 'CRITICAL_INACTIVE_48H',
  CHURNED: 'CHURNED'
};

/**
 * Evaluates a client's churn risk based on the time elapsed since their last logged activity.
 *
 * @param {Object} params
 * @param {string} params.client_name
 * @param {string} params.phone_number
 * @param {string} params.package_tier - 'max' | 'elite'
 * @param {Date|string|number} params.last_activity_date
 * @param {number} [params.current_week_number=1]
 * @returns {Object}
 */
export function evaluateClientActivityChurnRisk({
  client_name,
  phone_number,
  package_tier = 'max',
  last_activity_date,
  current_week_number = 1,
  reference_time = new Date()
}) {
  const lastActive = new Date(last_activity_date);
  const now = new Date(reference_time);
  const diffMs = Math.max(0, now.getTime() - lastActive.getTime());
  const hoursInactive = Math.floor(diffMs / (1000 * 60 * 60));

  let riskLevel = RETENTION_RISK_LEVELS.ACTIVE_ENGAGED;
  let alertRequired = false;
  let whatsappTemplate = null;

  if (hoursInactive >= 72) {
    riskLevel = RETENTION_RISK_LEVELS.CHURNED;
    alertRequired = true;
    whatsappTemplate = `مساء الفل يا ${client_name}! بقالنا 3 أيام مفتقدين وجودك وتسجيلك للوجبات والتمرين. حابب أطمن عليك، هل في أي ظرف أو ضغط شغل معطلك؟ فكرك إحنا في الأسبوع ${current_week_number} والهدف قريب جداً! قولي لو محتاج نعدل أي حاجة في الجدول لتناسب وقتك.`;
  } else if (hoursInactive >= 48) {
    riskLevel = RETENTION_RISK_LEVELS.CRITICAL_INACTIVE_48H;
    alertRequired = true;
    whatsappTemplate = `يا هلا يا ${client_name}! لاحظت إنك مسجلتش تمرين أو وجبات آخر 48 ساعة. طمني عليك وعلى صحتك، كل حاجة ماشية تمام؟ متقلقش لو يوم وقع منك، الأهم نرجع ونكمل فوراً. مستني رسالتك!`;
  } else if (hoursInactive >= 24) {
    riskLevel = RETENTION_RISK_LEVELS.AT_RISK_24H;
    alertRequired = false;
    whatsappTemplate = `عاش يا بطل! متنساش تسجل تمرينك ووجبات النهاردة في التطبيق عشان نفضل على نفس وتيرة الالتزام.`;
  }

  const cleanPhone = String(phone_number || '').replace(/[^0-9]/g, '');
  const whatsappUrl = whatsappTemplate ? `https://wa.me/2${cleanPhone}?text=${encodeURIComponent(whatsappTemplate)}` : null;

  return {
    client_name,
    phone_number,
    package_tier,
    hours_inactive: hoursInactive,
    risk_level: riskLevel,
    alert_required: alertRequired,
    whatsapp_template: whatsappTemplate,
    whatsapp_url: whatsappUrl,
    current_week_number
  };
}

/**
 * Generates automated check-in reminder schedules based on subscription package tier.
 */
export function generatePackageCheckinSchedule(packageTier = 'max', currentWeekNumber = 1) {
  const isMax = String(packageTier).toLowerCase().includes('max');
  const intervalDays = isMax ? 7 : 14;
  const isCheckinDueThisWeek = isMax ? true : (currentWeekNumber % 2 === 0);

  const reminderMessage = `صباح الخير يا بطل! النهاردة موعد تقرير المتابعة الأسبوعية للأسبوع ${currentWeekNumber}. يُرجى تسجيل الوزن الصائم صباحاً بعد الحمام ومقاسات الوسط والـ Biofeedback من خلال اللينك: /check-in`;

  return {
    package_tier: isMax ? 'max' : 'elite',
    checkin_interval_days: intervalDays,
    is_checkin_due_this_week: isCheckinDueThisWeek,
    morning_reminder_time: '08:00 AM',
    reminder_template_ar: reminderMessage
  };
}

/**
 * Checks for Personal Records (PR) and compliance milestones to trigger Dopamine celebration loops.
 */
export function evaluateMilestonesAndPRs({
  current_exercise_name,
  logged_weight_kg,
  previous_best_weight_kg = 0,
  consecutive_100_percent_weeks = 0
}) {
  const isNewPR = Number(logged_weight_kg) > Number(previous_best_weight_kg) && previous_best_weight_kg > 0;
  const isStreakMilestone = consecutive_100_percent_weeks >= 2;

  let celebration = null;
  if (isNewPR) {
    celebration = {
      type: 'PERSONAL_RECORD',
      title_ar: 'رقم قياسي جديد (New PR)!',
      message_ar: `عاش يا وحش! حطمت رقمك السابق في ${current_exercise_name} ووصلت لـ ${logged_weight_kg} كجم! القوة العضلية في تطور مستمر.`,
      badge_color: '#F59E0B'
    };
  } else if (isStreakMilestone) {
    celebration = {
      type: 'CONSISTENCY_STREAK',
      title_ar: 'وسام الالتزام الحديدي!',
      message_ar: `التزام بنسبة 100% لمدة ${consecutive_100_percent_weeks} أسابيع متتالية! هذه الاستمرارية هي السر الحقيقي للتحول الكامل.`,
      badge_color: '#10B981'
    };
  }

  return {
    has_celebration: celebration !== null,
    celebration
  };
}

/**
 * Calculates cohort transformation velocity and identifies high drop-off risk phases (e.g. Weeks 4-6).
 */
export function calculateCohortRetentionAnalytics(clientList = []) {
  const totalClients = clientList.length || 1;
  let activeCount = 0;
  let atRiskCount = 0;
  let criticalCount = 0;

  // Distribution by Mesocycle phase
  const phaseDistribution = {
    // PHASE 1 BASELINE (weeks 1-4)
    weeks_1_4: 0,
    // PHASE 2 (weeks 5-10) - Known critical zone
    weeks_5_10: 0,
    // PHASE 3 (weeks 11-12)
    weeks_11_12: 0,
    // PHASE 4 (weeks 13-16)
    weeks_13_16: 0
  };

  clientList.forEach(c => {
    const week = Number(c.current_week || 1);
    if (week <= 4) phaseDistribution.weeks_1_4++;
    else if (week <= 10) phaseDistribution.weeks_5_10++;
    else if (week <= 12) phaseDistribution.weeks_11_12++;
    else phaseDistribution.weeks_13_16++;

    const hours = Number(c.hours_inactive || 0);
    if (hours >= 48) criticalCount++;
    else if (hours >= 24) atRiskCount++;
    else activeCount++;
  });

  const overallRetentionRate = Math.round((activeCount / totalClients) * 100);

  return {
    total_clients: totalClients,
    active_count: activeCount,
    at_risk_count: atRiskCount,
    critical_inactive_count: criticalCount,
    overall_retention_rate_percent: overallRetentionRate,
    phase_distribution: phaseDistribution,
    critical_drop_off_warning: 'ملاحظة تحليلات الأفواج: الأسابيع 4-6 هي أكثر فتراتmesocycle حرجة في التزام المتدربين — ينصح بتفعيل التدخل الاستباقي.'
  };
}
