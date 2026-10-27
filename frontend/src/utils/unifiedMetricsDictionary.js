/**
 * Unified Platform Metrics & Staff Productivity Dictionary (V2)
 *
 * Implements authoritative, deterministic KPIs for executive reporting:
 * 1. Standardized Metric Definitions (MRR, Retention Rate, Churn, Active Counts, Coach Capacity).
 * 2. Multi-Currency MRR separation (EGP vs SAR).
 * 3. Immutable Staff Productivity Attribution (Actions tied strictly to the actor at execution time).
 * 4. Reassignment Invariance: Changing a trainee's assigned coach never alters historical audit records.
 * 5. Zero Emojis and executive mathematical rigor.
 */

export const METRIC_DEFINITIONS = Object.freeze({
  MRR: {
    code: "MRR",
    name_ar: "الإيراد الشهري المتكرر",
    name_en: "Monthly Recurring Revenue",
    formula: "SUM(client.subscription_price / (duration_days / 30)) for active clients",
    unit: "CURRENCY"
  },
  RETENTION_RATE: {
    code: "RETENTION_RATE",
    name_ar: "معدل الاحتفاظ بالتجديدات",
    name_en: "Renewal Retention Rate",
    formula: "ROUND((active_or_renewed_count / total_clients) * 100)",
    unit: "PERCENT"
  },
  EXPIRING_SOON_RATE: {
    code: "EXPIRING_SOON_RATE",
    name_ar: "نسبة الاشتراكات المشرفة على الانتهاء",
    name_en: "Expiring Soon Cohort Share",
    formula: "ROUND((expiring_soon_count / total_clients) * 100)",
    unit: "PERCENT"
  },
  CHURN_RATE: {
    code: "CHURN_RATE",
    name_ar: "معدل الانقطاع والتسرب",
    name_en: "Lapsed Churn Rate",
    formula: "ROUND((expired_count / total_clients) * 100)",
    unit: "PERCENT"
  },
  COACH_CAPACITY: {
    code: "COACH_CAPACITY",
    name_ar: "الطاقة الاستيعابية للمدرب",
    name_en: "Coach Client Capacity",
    formula: "ROUND((active_clients / max_capacity) * 100)",
    unit: "PERCENT"
  }
});

/**
 * Computes deterministic platform executive overview metrics from client list.
 */
export function calculatePlatformOverviewMetrics(clients = []) {
  if (!Array.isArray(clients) || clients.length === 0) {
    return {
      total_clients: 0,
      active_count: 0,
      expiring_soon_count: 0,
      expired_count: 0,
      frozen_count: 0,
      total_mrr: 0,
      mrr_by_currency: { EGP: 0, SAR: 0 },
      retention_rate_pct: 0,
      churn_rate_pct: 0
    };
  }

  let activeCount = 0;
  let expiringSoonCount = 0;
  let expiredCount = 0;
  let frozenCount = 0;
  let totalMrr = 0;
  const mrrByCurrency = { EGP: 0, SAR: 0 };

  for (const c of clients) {
    const status = String(c.status || c.subscription_status || "INACTIVE").toUpperCase();
    const price = Number(c.subscription_price) || 0;
    const durationDays = Number(c.package_details?.duration_days) || 120;
    const months = Math.max(1, durationDays / 30);
    const monthlyFee = price > 0 ? (price / months) : 0;
    const curr = String(c.currency || "EGP").toUpperCase() === "SAR" ? "SAR" : "EGP";

    if (status === "FROZEN") {
      frozenCount += 1;
    } else if (status === "ACTIVE" || status === "RENEWED") {
      activeCount += 1;
      totalMrr += monthlyFee;
      mrrByCurrency[curr] = (mrrByCurrency[curr] || 0) + monthlyFee;
    } else if (status === "EXPIRING_SOON") {
      expiringSoonCount += 1;
      totalMrr += monthlyFee;
      mrrByCurrency[curr] = (mrrByCurrency[curr] || 0) + monthlyFee;
    } else {
      expiredCount += 1;
    }
  }

  const total = clients.length;
  const retentionPct = total > 0 ? Math.round(((activeCount + expiringSoonCount) / total) * 100) : 0;
  const churnPct = total > 0 ? Math.round((expiredCount / total) * 100) : 0;

  return {
    total_clients: total,
    active_count: activeCount,
    expiring_soon_count: expiringSoonCount,
    expired_count: expiredCount,
    frozen_count: frozenCount,
    total_mrr: Math.round(totalMrr),
    mrr_by_currency: {
      EGP: Math.round(mrrByCurrency.EGP || 0),
      SAR: Math.round(mrrByCurrency.SAR || 0)
    },
    retention_rate_pct: retentionPct,
    churn_rate_pct: churnPct
  };
}

/**
 * Calculates coach workload and capacity utilization.
 */
export function calculateCoachCapacity({ maxCapacity = 50, activeClientsCount = 0 } = {}) {
  const cap = Math.max(1, Number(maxCapacity) || 50);
  const active = Math.max(0, Number(activeClientsCount) || 0);
  const remaining = Math.max(0, cap - active);
  const utilizationPct = Math.min(100, Math.round((active / cap) * 100));
  const isFull = active >= cap;

  return {
    max_capacity: cap,
    active_clients: active,
    remaining_capacity: remaining,
    utilization_pct: utilizationPct,
    is_full: isFull,
    status_ar: isFull ? "مكتمل الطاقة الاستيعابية" : `متاح استقبال ${remaining} مشتركين`
  };
}

/**
 * Aggregates staff productivity ledger from raw audit events.
 * Guarantees attribution invariance: actions are credited to the original actor
 * and will never drift if a client is reassigned to another coach later.
 */
export function computeStaffProductivityLedger(auditEvents = []) {
  const staffLedger = {};

  if (!Array.isArray(auditEvents)) {
    return staffLedger;
  }

  for (const event of auditEvents) {
    const actorId = String(event.actor_id || event.userId || event.performed_by || "UNKNOWN_STAFF");
    if (!staffLedger[actorId]) {
      staffLedger[actorId] = {
        actor_id: actorId,
        actor_role: event.userRole || event.actor_role || "STAFF",
        plans_published: 0,
        checkins_approved: 0,
        measurements_corrected: 0,
        freezes_toggled: 0,
        lockouts_resolved: 0,
        total_actions: 0
      };
    }

    const bucket = staffLedger[actorId];
    const eventName = String(event.event || event.action || "").toUpperCase();

    bucket.total_actions += 1;

    if (eventName.includes("PUBLISH") || eventName.includes("PLAN_APPROVE")) {
      bucket.plans_published += 1;
    } else if (eventName.includes("CHECKIN_APPROVE") || eventName.includes("APPROVE_CHECKIN")) {
      bucket.checkins_approved += 1;
    } else if (eventName.includes("MEASUREMENT_CORRECT") || eventName.includes("UPDATE_MEASUREMENTS")) {
      bucket.measurements_corrected += 1;
    } else if (eventName.includes("FREEZE")) {
      bucket.freezes_toggled += 1;
    } else if (eventName.includes("LOCKOUT") || eventName.includes("CLINICAL_UNLOCK")) {
      bucket.lockouts_resolved += 1;
    }
  }

  return staffLedger;
}
