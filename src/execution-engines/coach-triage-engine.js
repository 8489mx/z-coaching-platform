/**
 * Coach Daily Triage Cockpit & Capacity Engine
 *
 * Deterministic Client Triage Matrix:
 * 1. RED_FLAG (التدخل العاجل):
 *    - Pending weekly check-ins awaiting approval.
 *    - Reported joint pain / injury flags in workout logs.
 *    - Subscriptions expiring in <= 3 days.
 * 2. YELLOW_FLAG (المتابعة الاستباقية):
 *    - Inactive / no workout logs for >= 3 days.
 *    - Unexplained weight stall (> 2 weeks with high adherence).
 *    - Subscriptions expiring in 4-5 days.
 * 3. GREEN_FLAG (الملتزمون):
 *    - Active, compliant, on-track clients.
 *
 * Provides 1-Tap quick actions for each tier.
 */

export const TRIAGE_TIERS = {
  RED_FLAG: 'RED_FLAG',
  YELLOW_FLAG: 'YELLOW_FLAG',
  GREEN_FLAG: 'GREEN_FLAG'
};

export const QUICK_ACTIONS = {
  APPROVE_CHECKIN: 'APPROVE_CHECKIN',
  DISPATCH_WHATSAPP: 'DISPATCH_WHATSAPP',
  TRIGGER_DELOAD: 'TRIGGER_DELOAD',
  FREEZE_SUBSCRIPTION: 'FREEZE_SUBSCRIPTION',
  VIEW_PROFILE: 'VIEW_PROFILE',
  NO_ACTION: 'NO_ACTION'
};

/**
 * Evaluates a single client and assigns triage category with recommended quick action.
 */
export function evaluateClientTriageItem(client = {}) {
  const {
    id = '1',
    name = 'المشترك',
    has_pending_checkin = false,
    has_reported_pain = false,
    pain_joint = null,
    subscription_remaining_days = 30,
    days_remaining,
    days_since_last_workout = 0,
    is_weight_stalled = false,
    consecutive_stalls = 0,
    is_frozen = false,
    phone = '01011111110'
  } = client;

  const remainingDays = days_remaining !== undefined ? days_remaining : subscription_remaining_days;

  // 1. Red Flag Checks
  if (has_pending_checkin) {
    return {
      client_id: id,
      name,
      client_name: name,
      phone,
      tier: TRIAGE_TIERS.RED_FLAG,
      urgency: 'HIGH',
      badge_color: '#EF4444',
      badge_label_ar: 'متابعة بانتظار الاعتماد',
      badge_ar: 'متابعة معلقة',
      reason_ar: 'تم إرسال استمارة المتابعة الأسبوعية؛ بانتظار مراجعة الكوتش واعتماد الخطة.',
      primary_action: QUICK_ACTIONS.APPROVE_CHECKIN,
      primary_action_label_ar: 'مراجعة واعتماد',
      action_type: 'APPROVE_CHECKIN'
    };
  }

  if (has_reported_pain) {
    return {
      client_id: id,
      name,
      client_name: name,
      phone,
      tier: TRIAGE_TIERS.RED_FLAG,
      urgency: 'HIGH',
      badge_color: '#EF4444',
      badge_label_ar: 'ألم مفصلي مسجل',
      badge_ar: `ألم مفاصل (${pain_joint || 'عام'})`,
      reason_ar: `تم الإبلاغ عن ألم في مفصل (${pain_joint || 'عام'})؛ يُوصى ببدء بروتوكول تأهيل أو ديلود.`,
      primary_action: QUICK_ACTIONS.TRIGGER_DELOAD,
      primary_action_label_ar: 'تفعيل ديلود / تأهيل',
      action_type: 'TRIGGER_DELOAD'
    };
  }

  if (remainingDays <= 3 && !is_frozen) {
    return {
      client_id: id,
      name,
      client_name: name,
      phone,
      tier: TRIAGE_TIERS.RED_FLAG,
      urgency: 'HIGH',
      badge_color: '#EF4444',
      badge_label_ar: `اشتراك ينتهي (${remainingDays} يوم)`,
      badge_ar: `تجديد (${remainingDays} يوم)`,
      reason_ar: `الاشتراك شارف على الانتهاء (متبقي ${remainingDays} أيام)؛ يُوصى بالتواصل لتجديد الباقة.`,
      primary_action: QUICK_ACTIONS.DISPATCH_WHATSAPP,
      primary_action_label_ar: 'تذكير واتساب بالتجديد',
      action_type: 'RENEWAL_ALERT'
    };
  }

  // 2. Yellow Flag Checks
  if (days_since_last_workout >= 3 && !is_frozen) {
    return {
      client_id: id,
      name,
      client_name: name,
      phone,
      tier: TRIAGE_TIERS.YELLOW_FLAG,
      urgency: 'MEDIUM',
      badge_color: '#F59E0B',
      badge_label_ar: `غياب (${days_since_last_workout} أيام)`,
      badge_ar: 'غياب عن التمرين',
      reason_ar: `لم يتم تسجيل أي نشاط تدريبي منذ ${days_since_last_workout} أيام؛ يُوصى بالاطمئنان والتحفيز.`,
      primary_action: QUICK_ACTIONS.DISPATCH_WHATSAPP,
      primary_action_label_ar: 'رسالة تحفيزية',
      action_type: 'INACTIVITY_REENGAGEMENT'
    };
  }

  if (is_weight_stalled || consecutive_stalls >= 2) {
    return {
      client_id: id,
      name,
      client_name: name,
      phone,
      tier: TRIAGE_TIERS.YELLOW_FLAG,
      urgency: 'MEDIUM',
      badge_color: '#F59E0B',
      badge_label_ar: 'ثبات وزن > أسبوعين',
      badge_ar: 'ثبات وزن',
      reason_ar: 'ثبات الوزن لأكثر من أسبوعين متتاليين؛ يُوصى بتطبيق استراتيجية كسر الثبات.',
      primary_action: QUICK_ACTIONS.DISPATCH_WHATSAPP,
      primary_action_label_ar: 'مراجعة الخطة والكارب',
      action_type: 'PLATEAU_REVIEW'
    };
  }

  if (remainingDays <= 5 && !is_frozen) {
    return {
      client_id: id,
      name,
      client_name: name,
      phone,
      tier: TRIAGE_TIERS.YELLOW_FLAG,
      urgency: 'MEDIUM',
      badge_color: '#F59E0B',
      badge_label_ar: `رادار تجديد (${remainingDays} يوم)`,
      badge_ar: `تجديد قادم (${remainingDays} يوم)`,
      reason_ar: 'تنبيه مبكر لتجهيز مقعد التجديد للمشترك.',
      primary_action: QUICK_ACTIONS.DISPATCH_WHATSAPP,
      primary_action_label_ar: 'تجهيز مقعد التجديد',
      action_type: 'RADAR_RENEWAL_UPCOMING'
    };
  }

  // 3. Green Flag (On Track)
  return {
    client_id: id,
    name,
    client_name: name,
    phone,
    tier: TRIAGE_TIERS.GREEN_FLAG,
    urgency: 'LOW',
    badge_color: '#10B981',
    badge_label_ar: 'ملتزم في المسار',
    badge_ar: 'ملتزم',
    status_ar: is_frozen ? 'مجمد' : 'منتظم ومستقر',
    reason_ar: 'الالتزام والتقدم التدريبي والأيضي يسير بالشكل المثالي.',
    primary_action: QUICK_ACTIONS.VIEW_PROFILE,
    primary_action_label_ar: 'عرض الملف',
    action_type: 'NONE'
  };
}

/**
 * Generates sorted daily coach triage lists.
 */
export function generateDailyCoachTriage(clientsList = []) {
  const list = Array.isArray(clientsList) ? clientsList : [];

  const redFlags = [];
  const yellowFlags = [];
  const greenFlags = [];

  for (const client of list) {
    const item = evaluateClientTriageItem(client);
    if (item.tier === TRIAGE_TIERS.RED_FLAG) {
      redFlags.push(item);
    } else if (item.tier === TRIAGE_TIERS.YELLOW_FLAG) {
      yellowFlags.push(item);
    } else {
      greenFlags.push(item);
    }
  }

  return {
    total_clients: list.length,
    counts: {
      red_flags: redFlags.length,
      yellow_flags: yellowFlags.length,
      green_flags: greenFlags.length
    },
    red_flag_queue: redFlags,
    yellow_flag_queue: yellowFlags,
    green_flag_queue: greenFlags,
    high_priority_queue: redFlags,
    medium_priority_queue: yellowFlags,
    routine_queue: greenFlags,
    total_actions_needed: redFlags.length + yellowFlags.length,
    summary_ar: `لوحة فرز الكوتش: ${redFlags.length} عاجل | ${yellowFlags.length} استباقي | ${greenFlags.length} ملتزم`
  };
}

/**
 * تقييم سعة الاستيعاب للكوتش لتفادي هبوط جودة المتابعة (Coach Capacity & Bandwidth)
 */
export function evaluateCoachCapacity({
  activeClientsCount = 0,
  maxCapacityCap = 50,
  pendingCheckinsCount = 0
}) {
  if (maxCapacityCap <= 0) {
    throw new Error('maxCapacityCap must be greater than zero.');
  }

  const utilizationRatePct = Math.round((activeClientsCount / maxCapacityCap) * 100);
  const remainingSlots = Math.max(0, maxCapacityCap - activeClientsCount);

  let status = 'OPTIMAL_CAPACITY';
  let canAcceptNewClients = true;
  let alertSeverity = 'NORMAL';
  let message_ar = `السعة ممتازة: لديك ${remainingSlots} مقعد شاغر لاستقبال مشتركين جدد.`;

  if (activeClientsCount >= maxCapacityCap) {
    status = 'CAPACITY_REACHED';
    canAcceptNewClients = false;
    alertSeverity = 'CRITICAL';
    message_ar = 'تم بلوغ السعة القصوى! يُنصح بإيقاف الاشتراكات الجديدة أو فتح قائمة انتظار (Waitlist) للحفاظ على جودة المتابعة.';
  } else if (utilizationRatePct >= 85) {
    status = 'NEAR_CAPACITY';
    alertSeverity = 'WARNING';
    message_ar = `أوشكت السعة على الامتلاء (${utilizationRatePct}%). متبقي ${remainingSlots} مقاعد فقط.`;
  }

  const estimatedTriageMinutes = pendingCheckinsCount * 4;

  return {
    active_clients_count: activeClientsCount,
    max_capacity_cap: maxCapacityCap,
    remaining_slots: remainingSlots,
    utilization_rate_pct: utilizationRatePct,
    can_accept_new_clients: canAcceptNewClients,
    status,
    alert_severity: alertSeverity,
    pending_checkins_count: pendingCheckinsCount,
    estimated_daily_triage_minutes: estimatedTriageMinutes,
    message_ar
  };
}

/**
 * حساب مؤشرات استبقاء المشتركين ومعدل التجديد والانسحاب (Retention & Churn Analytics)
 */
export function calculateRetentionAndChurn({
  startPeriodClientsCount = 0,
  renewedClientsCount = 0,
  churnedClientsCount = 0,
  newClientsCount = 0,
  averageSubscriptionPrice = 0
}) {
  const eligibleForRenewal = renewedClientsCount + churnedClientsCount;
  
  const renewalRatePct = eligibleForRenewal > 0
    ? Math.round((renewedClientsCount / eligibleForRenewal) * 100)
    : 100;

  const churnRatePct = 100 - renewalRatePct;

  const estimatedLifetimeMonths = churnRatePct > 0
    ? +((100 / churnRatePct)).toFixed(1)
    : 12.0;

  const customerLifetimeValue = Math.round(estimatedLifetimeMonths * averageSubscriptionPrice);

  const totalActiveEnd = (startPeriodClientsCount - churnedClientsCount) + newClientsCount;
  const estimatedMRR = totalActiveEnd * averageSubscriptionPrice;

  return {
    active_clients_total: totalActiveEnd,
    renewal_rate_pct: renewalRatePct,
    churn_rate_pct: churnRatePct,
    estimated_lifetime_months: estimatedLifetimeMonths,
    customer_lifetime_value: customerLifetimeValue,
    estimated_mrr: estimatedMRR,
    health_rating: renewalRatePct >= 80 ? 'EXCELLENT' : renewalRatePct >= 60 ? 'HEALTHY' : 'NEEDS_RETENTION_BOOST'
  };
}
