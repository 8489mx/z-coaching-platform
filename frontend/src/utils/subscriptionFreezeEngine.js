/**
 * Subscription Freeze Governance Engine (V2)
 *
 * Implements strict, auditable subscription freezing policies:
 * 1. Package-based freeze allowances (14 days for 4M, 28 days for 8M, 45 days for 12M).
 * 2. Same-day ceil rounding (at least 1 compensatory day to preserve trainee rights).
 * 3. Immutable structured freeze ledger (records, timestamps, reasons, and actors).
 * 4. Allowance exhaustion checks and remaining balance calculation.
 */

export const FREEZE_POLICIES = Object.freeze({
  ALLOWANCE_BY_PACKAGE: Object.freeze({
    MAX_3_PLUS_1: 14,
    ELITE_3_PLUS_1: 14,
    MAX_6M_PLUS_2: 28,
    ELITE_6M_PLUS_2: 28,
    MAX_YEARLY: 45,
    ELITE_YEARLY: 45,
    MAX_1M_TRIAL: 0,
    MAX: 14,
    ELITE: 14,
    DEFAULT: 14
  }),
  MIN_SINGLE_FREEZE_DAYS: 1,
  DEFAULT_REASON: "طلب المشترك"
});

/**
 * Returns the maximum allowable freeze days for a given package code.
 */
export function getFreezeAllowanceForPackage(packageCode) {
  if (!packageCode) return FREEZE_POLICIES.ALLOWANCE_BY_PACKAGE.DEFAULT;
  const clean = String(packageCode).trim().toUpperCase();
  return FREEZE_POLICIES.ALLOWANCE_BY_PACKAGE[clean] ?? FREEZE_POLICIES.ALLOWANCE_BY_PACKAGE.DEFAULT;
}

/**
 * Parses structured freeze history from user notes or JSON string.
 */
export function parseFreezeHistory(notes = "") {
  const defaultState = {
    records: [],
    used_days: 0,
    active_freeze_start: null
  };

  if (!notes || typeof notes !== "string") {
    return defaultState;
  }

  let state = { ...defaultState };

  // 1. Look for structured JSON block: [FREEZE_HISTORY:{...}]
  const prefix = "[FREEZE_HISTORY:";
  const idx = notes.indexOf(prefix);
  if (idx !== -1) {
    const after = notes.slice(idx + prefix.length);
    let depth = 0;
    let endIdx = -1;
    for (let i = 0; i < after.length; i++) {
      if (after[i] === "{") depth++;
      else if (after[i] === "}") {
        depth--;
        if (depth === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }
    if (endIdx !== -1) {
      try {
        const parsed = JSON.parse(after.slice(0, endIdx));
        if (parsed && typeof parsed === "object") {
          state.records = Array.isArray(parsed.records) ? parsed.records : [];
          state.used_days = Number(parsed.used_days) ?? state.records.reduce((sum, r) => sum + (Number(r.days) || 0), 0);
        }
      } catch {
        // Fallback
      }
    }
  }

  // 2. Check for active unclosed freeze start: [FREEZE_START:iso]
  const activeStartMatch = notes.match(/\[FREEZE_START:(.*?)\]/);
  if (activeStartMatch && activeStartMatch[1]) {
    const d = new Date(activeStartMatch[1]);
    if (!isNaN(d.getTime())) {
      state.active_freeze_start = d.toISOString();
    }
  }

  return state;
}

/**
 * Serializes structured freeze history into tag format.
 */
export function serializeFreezeHistory(historyObj = {}) {
  const records = Array.isArray(historyObj.records) ? historyObj.records : [];
  const usedDays = Number(historyObj.used_days) ?? records.reduce((sum, r) => sum + (Number(r.days) || 0), 0);

  const payload = {
    records,
    used_days: usedDays,
    last_updated: new Date().toISOString()
  };

  return `[FREEZE_HISTORY:${JSON.stringify(payload)}]`;
}

/**
 * Computes exact elapsed calendar days for a freeze interval, applying same-day ceil rounding.
 */
export function calculateFreezeDays(startDate, endDate = new Date()) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 1;
  }

  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) {
    return FREEZE_POLICIES.MIN_SINGLE_FREEZE_DAYS;
  }

  // Same-day or partial day rounds up to full compensatory day
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(FREEZE_POLICIES.MIN_SINGLE_FREEZE_DAYS, days);
}

/**
 * Evaluates whether a client is eligible to initiate a new freeze.
 */
export function evaluateFreezeEligibility({ packageCode, notes = "", requestedDays = 1, currentStatus = "ACTIVE" }) {
  if (currentStatus === "FROZEN") {
    return {
      eligible: false,
      reason_code: "ALREADY_FROZEN",
      message_ar: "الاشتراك مجمد بالفعل، يجب الاستئناف أولاً قبل تجميد جديد",
      remaining_days: 0,
      total_allowance: getFreezeAllowanceForPackage(packageCode),
      used_days: 0
    };
  }

  const totalAllowance = getFreezeAllowanceForPackage(packageCode);
  const history = parseFreezeHistory(notes);
  const usedDays = history.used_days;
  const remainingDays = Math.max(0, totalAllowance - usedDays);

  if (remainingDays <= 0) {
    return {
      eligible: false,
      reason_code: "FREEZE_ALLOWANCE_DEPLETED",
      message_ar: `تم استهلاك كامل رصيد التجميد المسموح به لهذه الباقة (${totalAllowance} يوم)`,
      remaining_days: 0,
      total_allowance: totalAllowance,
      used_days: usedDays
    };
  }

  if (requestedDays > remainingDays) {
    return {
      eligible: false,
      reason_code: "EXCEEDS_REMAINING_ALLOWANCE",
      message_ar: `الأيام المطلوبة (${requestedDays} يوم) تتجاوز الرصيد المتبقي المتاح (${remainingDays} يوم)`,
      remaining_days: remainingDays,
      total_allowance: totalAllowance,
      used_days: usedDays
    };
  }

  return {
    eligible: true,
    reason_code: "ELIGIBLE",
    message_ar: `التجميد متاح (المتبقي: ${remainingDays} من إجمالي ${totalAllowance} يوم)`,
    remaining_days: remainingDays,
    total_allowance: totalAllowance,
    used_days: usedDays
  };
}

/**
 * Initiates a freeze action, updating notes and setting subscription_status to FROZEN.
 */
export function applyFreezeStart({ client, reason = FREEZE_POLICIES.DEFAULT_REASON, performedBy = "COACH", now = new Date() }) {
  const currentNotes = client.notes || "";
  const eligibility = evaluateFreezeEligibility({
    packageCode: client.subscription_package || client.package_tier,
    notes: currentNotes,
    currentStatus: client.subscription_status
  });

  if (!eligibility.eligible) {
    return {
      success: false,
      error: eligibility.message_ar,
      reason_code: eligibility.reason_code
    };
  }

  const startDateIso = (now instanceof Date ? now : new Date(now)).toISOString();
  let updatedNotes = currentNotes;

  // Clean old active marker if present
  updatedNotes = updatedNotes.replace(/\[FREEZE_START:.*?\]/g, "").trim();
  updatedNotes = `${updatedNotes}\n[FREEZE_START:${startDateIso}]`.trim();

  return {
    success: true,
    subscription_status: "FROZEN",
    freeze_start_date: startDateIso,
    updated_notes: updatedNotes,
    remaining_days: eligibility.remaining_days,
    message_ar: `تم تجميد الاشتراك بنجاح. الرصيد المتبقي: ${eligibility.remaining_days} يوم`
  };
}

/**
 * Resumes a frozen subscription, calculating consumed days, extending end date,
 * and appending an immutable audit record to the structured ledger.
 */
export function applyFreezeResume({ client, now = new Date(), options = {} }) {
  const currentNotes = client.notes || "";
  const history = parseFreezeHistory(currentNotes);
  const nowDate = now instanceof Date ? now : new Date(now);

  const startDateStr = history.active_freeze_start || options.freezeStartDate;
  if (!startDateStr) {
    // If no explicit start date recorded, fallback safely to activating without extension
    let cleanNotes = currentNotes.replace(/\[FREEZE_START:.*?\]/g, "").trim();
    return {
      success: true,
      subscription_status: "ACTIVE",
      freeze_days_added: 0,
      updated_notes: cleanNotes,
      updated_end_date: client.subscription_end_date,
      message_ar: "تم استئناف وتفعيل الاشتراك بنجاح"
    };
  }

  const calculatedDays = calculateFreezeDays(startDateStr, nowDate);
  const totalAllowance = getFreezeAllowanceForPackage(client.subscription_package || client.package_tier);
  const remainingBefore = Math.max(0, totalAllowance - history.used_days);

  // Cap added days to remaining allowance if enforced
  const effectiveDaysAdded = Math.min(calculatedDays, remainingBefore > 0 ? remainingBefore : calculatedDays);

  let newEndDate = client.subscription_end_date ? new Date(client.subscription_end_date) : null;
  if (newEndDate && !isNaN(newEndDate.getTime())) {
    newEndDate = new Date(newEndDate.getTime() + (effectiveDaysAdded * 24 * 60 * 60 * 1000));
  }

  // Create audit record
  const newRecord = {
    id: `frz_${Date.now()}`,
    start: startDateStr,
    end: nowDate.toISOString(),
    days: effectiveDaysAdded,
    reason: options.reason || FREEZE_POLICIES.DEFAULT_REASON,
    performed_by: options.performedBy || "COACH"
  };

  const updatedRecords = [...history.records, newRecord];
  const newUsedDays = history.used_days + effectiveDaysAdded;

  // Build clean notes with updated history block
  let cleanNotes = currentNotes
    .replace(/\[FREEZE_START:.*?\]/g, "")
    .replace(/\[FREEZE_HISTORY:\{[\s\S]*?\}\]/g, "")
    .trim();

  const serializedHistory = serializeFreezeHistory({
    records: updatedRecords,
    used_days: newUsedDays
  });

  cleanNotes = `${cleanNotes}\n${serializedHistory}`.trim();

  return {
    success: true,
    subscription_status: "ACTIVE",
    freeze_days_added: effectiveDaysAdded,
    updated_end_date: newEndDate ? newEndDate.toISOString() : null,
    updated_notes: cleanNotes,
    history: {
      records: updatedRecords,
      used_days: newUsedDays,
      remaining_days: Math.max(0, totalAllowance - newUsedDays)
    },
    message_ar: `تم استئناف الاشتراك بنجاح وإضافة ${effectiveDaysAdded} أيام تعويضية لتاريخ الانتهاء`
  };
}
