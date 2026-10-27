/**
 * Subscription State Governance & Lifecycle Decoupling Engine (V2)
 *
 * Enforces strict architectural separation across three distinct domains:
 * 1. CLIENT_LIFECYCLE_STATUS (ACTIVE | FROZEN | EXPIRING_SOON | EXPIRED | INACTIVE)
 * 2. PLAN_APPROVAL_STATUS (PENDING_COACH_REVIEW | DRAFT | APPROVED | PUBLISHED)
 * 3. PAYMENT_LIFECYCLE_STATUS (PAID | PARTIAL | PENDING | REFUNDED)
 *
 * Implements authoritative renewal date chaining:
 * - Active subscriptions renew from current_end_date forward (no lost days).
 * - Lapsed/expired subscriptions renew from today forward.
 */

export const CLIENT_LIFECYCLE_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  FROZEN: "FROZEN",
  EXPIRING_SOON: "EXPIRING_SOON",
  EXPIRED: "EXPIRED",
  INACTIVE: "INACTIVE"
});

export const PLAN_APPROVAL_STATUS = Object.freeze({
  PENDING_COACH_REVIEW: "PENDING_COACH_REVIEW",
  DRAFT: "DRAFT",
  APPROVED: "APPROVED",
  PUBLISHED: "PUBLISHED"
});

export const PAYMENT_LIFECYCLE_STATUS = Object.freeze({
  PAID: "PAID",
  PARTIAL: "PARTIAL",
  PENDING: "PENDING",
  REFUNDED: "REFUNDED"
});

/**
 * Resolves decoupled operational states for a trainee without terminology collision.
 */
export function resolveTraineeOverallState({
  subscription_status = "ACTIVE",
  subscription_start_date = null,
  subscription_end_date = null,
  plan_approval_status = "PENDING_COACH_REVIEW",
  payment_status = "PENDING",
  now = new Date()
}) {
  const nowDate = now instanceof Date ? now : new Date(now);

  // 1. Resolve Subscription Days Left
  let daysRemaining = 0;
  let clientLifecycle = CLIENT_LIFECYCLE_STATUS.INACTIVE;

  const hasValidStart = subscription_start_date && !isNaN(new Date(subscription_start_date).getTime());
  const hasValidEnd = subscription_end_date && !isNaN(new Date(subscription_end_date).getTime());

  if (subscription_status === CLIENT_LIFECYCLE_STATUS.FROZEN) {
    clientLifecycle = CLIENT_LIFECYCLE_STATUS.FROZEN;
    if (hasValidEnd) {
      const end = new Date(subscription_end_date);
      daysRemaining = Math.max(0, Math.ceil((end.getTime() - nowDate.getTime()) / (1000 * 3600 * 24)));
    }
  } else if (hasValidStart && hasValidEnd) {
    const end = new Date(subscription_end_date);
    daysRemaining = Math.ceil((end.getTime() - nowDate.getTime()) / (1000 * 3600 * 24));

    if (daysRemaining > 7) {
      clientLifecycle = CLIENT_LIFECYCLE_STATUS.ACTIVE;
    } else if (daysRemaining > 0 && daysRemaining <= 7) {
      clientLifecycle = CLIENT_LIFECYCLE_STATUS.EXPIRING_SOON;
    } else {
      clientLifecycle = CLIENT_LIFECYCLE_STATUS.EXPIRED;
    }
  }

  // 2. Validate Plan Status
  const normalizedPlanStatus = Object.values(PLAN_APPROVAL_STATUS).includes(plan_approval_status)
    ? plan_approval_status
    : PLAN_APPROVAL_STATUS.PENDING_COACH_REVIEW;

  // 3. Validate Payment Status
  const normalizedPaymentStatus = Object.values(PAYMENT_LIFECYCLE_STATUS).includes(payment_status)
    ? payment_status
    : (payment_status === "UNPAID" ? PAYMENT_LIFECYCLE_STATUS.PENDING : PAYMENT_LIFECYCLE_STATUS.PENDING);

  return {
    client_lifecycle: clientLifecycle,
    days_remaining: daysRemaining,
    is_active: clientLifecycle === CLIENT_LIFECYCLE_STATUS.ACTIVE || clientLifecycle === CLIENT_LIFECYCLE_STATUS.EXPIRING_SOON,
    is_frozen: clientLifecycle === CLIENT_LIFECYCLE_STATUS.FROZEN,
    is_expiring_soon: clientLifecycle === CLIENT_LIFECYCLE_STATUS.EXPIRING_SOON,
    is_expired: clientLifecycle === CLIENT_LIFECYCLE_STATUS.EXPIRED,
    plan_approval_status: normalizedPlanStatus,
    payment_status: normalizedPaymentStatus,
    can_access_active_program: (clientLifecycle === CLIENT_LIFECYCLE_STATUS.ACTIVE || clientLifecycle === CLIENT_LIFECYCLE_STATUS.EXPIRING_SOON) && normalizedPlanStatus === PLAN_APPROVAL_STATUS.PUBLISHED
  };
}

/**
 * Computes precise renewal start and end dates.
 * - If current subscription is active into the future, chains from end_date.
 * - If lapsed or expired, starts fresh from today.
 */
export function computeRenewalDates({
  currentEndDate = null,
  durationDays = 120,
  explicitEndDate = null,
  now = new Date()
}) {
  const nowDate = now instanceof Date ? now : new Date(now);

  if (explicitEndDate && !isNaN(new Date(explicitEndDate).getTime())) {
    const end = new Date(explicitEndDate);
    const start = (currentEndDate && new Date(currentEndDate) > nowDate) ? new Date(currentEndDate) : nowDate;
    return {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      duration_days: Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24))),
      is_chained_from_active: (currentEndDate && new Date(currentEndDate) > nowDate)
    };
  }

  const addedDays = Number(durationDays) || 120;
  const currentEndValid = currentEndDate && !isNaN(new Date(currentEndDate).getTime());
  const isStillActive = currentEndValid && new Date(currentEndDate) > nowDate;

  let startDate = nowDate;
  let isChained = false;

  if (isStillActive) {
    startDate = new Date(currentEndDate);
    isChained = true;
  }

  const endDate = new Date(startDate.getTime() + (addedDays * 24 * 60 * 60 * 1000));

  return {
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    duration_days: addedDays,
    is_chained_from_active: isChained
  };
}
