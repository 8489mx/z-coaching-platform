/**
 * Phase 2 follow-up auto-apply: pure gate, digest, and bulk selection.
 *
 * No database, no network, no mutation. The controller is the only place
 * that writes, and it must call buildAdaptedPlan first and pass its result
 * here: a shadow (Phase 1) GREEN prediction alone is never eligible.
 * Every blocked reason is a code the coach can see; nothing is clamped
 * silently and nothing is applied on an engine error (the caller keeps
 * the check-in PENDING_REVIEW and logs, it does not fall back to the
 * shadow prediction).
 */
import { FOLLOW_UP_TRIAGE } from "./coach-triage-engine.js";

function finiteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Base targets from the same program paths buildAdaptedPlan reads, so the
 * delta the gate checks is the delta against the plan the client is on.
 */
export function baseTargetsFromProgram(programData = {}) {
  const data = programData && typeof programData === "object" ? programData : {};
  const calories =
    finiteNumber(data.nutrition_program?.macro_targets?.calories_kcal) ??
    finiteNumber(data.nutrition_program?.targets?.calories_kcal) ??
    finiteNumber(data.nutrition_program?.targets?.target_calories_kcal) ??
    finiteNumber(data.nutrition_program?.targets?.target_calories) ??
    finiteNumber(data.nutrition_program?.target_calories_kcal) ??
    finiteNumber(data.nutrition?.targets?.calories) ??
    finiteNumber(data.nutrition_program?.stages?.energy_target?.target_calories) ??
    finiteNumber(data.nutrition_program?.stages?.energy_target?.target_calories_kcal) ??
    2000;
  const steps =
    finiteNumber(data.cardio_program?.prescription?.daily_step_target) ?? 8000;
  return Object.freeze({ baseCaloriesKcal: calories, baseSteps: steps });
}

function adaptedReasons(adapted) {
  return Array.isArray(adapted?.adaptation_reasons) ? adapted.adaptation_reasons : [];
}

function hasBiomechanicalSwap(adapted) {
  const weeks = adapted?.adapted_training_week;
  const sessions = Array.isArray(weeks?.sessions) ? weeks.sessions : [];
  return sessions.some((session) =>
    (Array.isArray(session?.exercises) ? session.exercises : []).some(
      (ex) => ex?.is_biomechanical_swap === true,
    ),
  );
}

/**
 * Derive the classifier's `proposed` signals plus the extra engine flags
 * the classifier does not carry (deload / refeed), from one adapted plan.
 */
export function deriveEngineProposed({ adapted = null, baseCaloriesKcal = 2000, baseSteps = 8000 } = {}) {
  if (!adapted || typeof adapted !== "object") {
    return Object.freeze({
      proposed: Object.freeze({
        requires_coach_approval: false,
        calorie_delta: 0,
        steps_delta: 0,
        floor_or_ceiling_clamp: false,
        alignment_conflict: false,
        exercise_substitution: false,
        diet_break_eligible: false,
      }),
      engine_flags: Object.freeze({
        requires_coach_approval: false,
        alignment_conflict: false,
        diet_break_eligible: false,
        floor_or_ceiling_clamp: false,
        exercise_substitution: false,
        deload_recommended: false,
        refeed_configured: false,
      }),
      calorie_delta: 0,
      steps_delta: 0,
    });
  }
  const nutrition = adapted.adapted_nutrition && typeof adapted.adapted_nutrition === "object"
    ? adapted.adapted_nutrition
    : {};
  const calorieDelta =
    (finiteNumber(nutrition.target_calories_kcal) ?? baseCaloriesKcal) - baseCaloriesKcal;
  const stepsDelta =
    (finiteNumber(adapted.adapted_cardio?.daily_step_target) ?? baseSteps) - baseSteps;
  const reasons = adaptedReasons(adapted);
  const floorOrCeilingClamp = reasons.some(
    (r) =>
      r?.floor_locked === true ||
      ["CALORIE_CEILING_REACHED", "FAT_SHARE_LIMIT_REACHED"].includes(r?.code),
  );
  const exerciseSubstitution =
    adapted.adaptation_action === "SUBSTITUTE_INJURED_EXERCISE" ||
    reasons.some((r) => r?.code === "BIOMECHANICAL_INJURY_FIREWALL_SWAPPED") ||
    hasBiomechanicalSwap(adapted);
  const engineFlags = Object.freeze({
    requires_coach_approval: adapted.requires_coach_approval === true,
    alignment_conflict: nutrition.alignment_conflict === true,
    diet_break_eligible:
      adapted.is_diet_break_recommended === true ||
      adapted.adaptation_action === "SCHEDULE_DIET_BREAK",
    floor_or_ceiling_clamp: floorOrCeilingClamp,
    exercise_substitution: exerciseSubstitution,
    deload_recommended:
      adapted.is_deload_recommended === true ||
      adapted.adaptation_action === "SCHEDULE_DELOAD",
    refeed_configured: nutrition.refeed_config !== null && nutrition.refeed_config !== undefined,
  });
  const proposed = Object.freeze({
    requires_coach_approval: engineFlags.requires_coach_approval,
    calorie_delta: calorieDelta,
    steps_delta: stepsDelta,
    floor_or_ceiling_clamp: engineFlags.floor_or_ceiling_clamp,
    alignment_conflict: engineFlags.alignment_conflict,
    exercise_substitution: engineFlags.exercise_substitution,
    diet_break_eligible: engineFlags.diet_break_eligible,
  });
  return Object.freeze({ proposed, engine_flags: engineFlags, calorie_delta: calorieDelta, steps_delta: stepsDelta });
}

/**
 * The single gate for auto-apply. Eligible only when every condition holds:
 * re-checked triage is GREEN, an adapted plan exists, the check-in was not
 * already applied, no WITHHELD stage, no safety correction, no engine flag,
 * and both deltas are inside the unchanged green caps (200 kcal / 1000 steps).
 */
export function decideFollowUpAutoApply({
  triage = null,
  adapted = null,
  baseCaloriesKcal = 2000,
  baseSteps = 8000,
  alreadyApplied = false,
  withheldStage = false,
} = {}) {
  const blocked = [];
  if (!triage || typeof triage !== "object") blocked.push("TRIAGE_MISSING");
  else if (triage.tier !== "GREEN") blocked.push("NOT_GREEN");
  if (!adapted || typeof adapted !== "object") blocked.push("ADAPTED_PLAN_MISSING");
  if (alreadyApplied === true) blocked.push("ALREADY_APPLIED");
  if (withheldStage === true) blocked.push("WITHHELD_STAGE");
  if (triage && triage.safety_correction !== null && triage.safety_correction !== undefined) {
    blocked.push("SAFETY_CORRECTION_PRESENT");
  }

  const derived = deriveEngineProposed({ adapted, baseCaloriesKcal, baseSteps });
  const flags = derived.engine_flags;
  if (flags.requires_coach_approval) blocked.push("REQUIRES_COACH_APPROVAL");
  if (flags.alignment_conflict) blocked.push("MACRO_ALIGNMENT_CONFLICT");
  if (flags.diet_break_eligible) blocked.push("DIET_BREAK_ELIGIBLE");
  if (flags.floor_or_ceiling_clamp) blocked.push("FLOOR_OR_CEILING_CLAMP");
  if (flags.exercise_substitution) blocked.push("EXERCISE_SUBSTITUTION");
  if (flags.deload_recommended) blocked.push("DELOAD_RECOMMENDED");
  if (flags.refeed_configured) blocked.push("REFEED_CONFIGURED");
  if (
    Math.abs(derived.calorie_delta) > FOLLOW_UP_TRIAGE.GREEN_MAX_CALORIE_DELTA_KCAL ||
    Math.abs(derived.steps_delta) > FOLLOW_UP_TRIAGE.GREEN_MAX_STEPS_DELTA
  ) {
    blocked.push("PROPOSED_CHANGE_EXCEEDS_GREEN_CAP");
  }

  return Object.freeze({
    eligible: blocked.length === 0,
    blocked_reasons: Object.freeze(blocked),
    proposed: derived.proposed,
    engine_flags: flags,
    calorie_delta: derived.calorie_delta,
    steps_delta: derived.steps_delta,
  });
}

const BLOCKED_REASON_MESSAGES_AR = Object.freeze({
  NOT_GREEN: "التصنيف ليس أخضر؛ الحالة تحتاج مراجعة الكوتش.",
  REQUIRES_COACH_APPROVAL: "محرك التكييف طلب مراجعة الكوتش لهذه المتابعة.",
  MACRO_ALIGNMENT_CONFLICT: "تعارض في ميزانية الماكروز؛ إعادة الموازنة تحتاج مراجعة الكوتش.",
  DIET_BREAK_ELIGIBLE: "أهلية استراحة دايت؛ رفع السعرات للصيانة قرار الكوتش.",
  FLOOR_OR_CEILING_CLAMP: "التعديل المقترح اصطدم بالحد الأدنى أو السقف؛ لا تطبيق تلقائي عند الحدود.",
  EXERCISE_SUBSTITUTION: "تغيير في قائمة التمارين يتجاوز تقدم الأحمال؛ استبدال التمارين قرار الكوتش.",
  DELOAD_RECOMMENDED: "توصية بأسبوع استشفاء (تخفيف حمل)؛ قرار الكوتش قبل التطبيق.",
  REFEED_CONFIGURED: "يوم إعادة شحن مقترح؛ قرار الكوتش قبل التطبيق.",
  WITHHELD_STAGE: "مرحلة محجوبة في الخطة النشطة المخزنة؛ لا تطبيق تلقائي على خطة محجوبة.",
  SAFETY_CORRECTION_PRESENT: "تصحيح سلامة مسجل؛ الحالة تحتاج مراجعة الكوتش.",
  PROPOSED_CHANGE_EXCEEDS_GREEN_CAP: "حجم التغير المقترح فوق حد التطبيق التلقائي؛ يحتاج مراجعة الكوتش.",
  ALREADY_APPLIED: "المتابعة مطبقة مسبقًا؛ لا تطبيق مكرر.",
  ADAPTED_PLAN_MISSING: "لا توجد خطة معدلة من المحرك؛ لا تطبيق تلقائي بلا نتيجة محرك.",
  TRIAGE_MISSING: "لا يوجد تصنيف للمتابعة؛ لا تطبيق تلقائي بلا تصنيف.",
});

/**
 * Blocked triage: when the gate refuses an otherwise GREEN re-check
 * (deload and refeed are engine-only flags the classifier does not carry,
 * so a re-check can stay GREEN while the gate blocks), the stored triage
 * must become YELLOW with the blocked reasons, never stay GREEN in the
 * coach digest. The input triage is never mutated.
 */
export function buildBlockedTriage({ triage = null, blockedReasons = [] } = {}) {
  const reasons = Array.isArray(triage?.reasons) ? [...triage.reasons] : [];
  const codes = Array.isArray(blockedReasons) ? blockedReasons : [];
  for (const code of codes) {
    reasons.push({
      code,
      message_ar: BLOCKED_REASON_MESSAGES_AR[code] || "تم حظر التطبيق التلقائي لمراجعة الكوتش.",
    });
  }
  return Object.freeze({
    ...(triage && typeof triage === "object" ? triage : {}),
    tier: "YELLOW",
    reasons: Object.freeze(reasons),
    habit_nudge: false,
    auto_apply_blocked: true,
    auto_apply_blocked_reasons: Object.freeze([...codes]),
  });
}

function digestEntry(checkin) {
  const triage =
    checkin?.analysis_output && typeof checkin.analysis_output === "object"
      ? checkin.analysis_output.triage
      : null;
  const tier = triage?.tier ?? null;
  const reasons = Array.isArray(triage?.reasons) ? triage.reasons.map((r) => r?.code).filter(Boolean) : [];
  return {
    checkin_id: checkin?.id ?? null,
    user_id: checkin?.user_id ?? null,
    week_number: checkin?.week_number ?? null,
    status: checkin?.status ?? null,
    tier,
    reason_codes: reasons,
    program_id: triage?.auto_apply?.program_id ?? checkin?.adapted_program_id ?? null,
  };
}

/**
 * Coach digest: a read-only grouping, never a send. Unknown triage fails
 * closed into the yellow pending queue so an unclassified check-in is
 * never silently treated as green.
 */
export function buildCoachDigest(checkins = []) {
  const rows = Array.isArray(checkins) ? checkins : [];
  const autoApplied = [];
  const yellowPending = [];
  const redPending = [];
  const greenPending = [];
  for (const checkin of rows) {
    const entry = digestEntry(checkin);
    if (checkin?.status === "AUTO_APPLIED") {
      autoApplied.push(entry);
    } else if (checkin?.status === "PENDING_REVIEW") {
      if (entry.tier === "RED") redPending.push(entry);
      else if (entry.tier === "GREEN") greenPending.push(entry);
      else {
        if (entry.tier === null) entry.reason_codes = ["UNKNOWN_TRIAGE"];
        yellowPending.push(entry);
      }
    }
  }
  return Object.freeze({
    total: rows.length,
    counts: Object.freeze({
      total: rows.length,
      auto_applied: autoApplied.length,
      yellow_pending: yellowPending.length,
      red_pending: redPending.length,
      green_pending: greenPending.length,
    }),
    auto_applied: Object.freeze(autoApplied),
    yellow_pending: Object.freeze(yellowPending),
    red_pending: Object.freeze(redPending),
    green_pending: Object.freeze(greenPending),
  });
}

/**
 * Bulk approve selection: only PENDING_REVIEW check-ins whose stored
 * triage tier is YELLOW. Everything else is returned as skipped with a
 * reason, never silently approved. The endpoint itself approves the
 * selected rows as a review only: it does not merge an adapted plan,
 * exactly like a single approve without apply_program_adaptation.
 */
export function selectYellowForBulkApprove(checkins = [], requestedIds = []) {
  const byId = new Map();
  for (const checkin of Array.isArray(checkins) ? checkins : []) {
    if (checkin?.id !== undefined && checkin?.id !== null) byId.set(checkin.id, checkin);
  }
  const selectedIds = [];
  const skipped = [];
  const seen = new Set();
  for (const id of Array.isArray(requestedIds) ? requestedIds : []) {
    if (seen.has(id)) continue;
    seen.add(id);
    const checkin = byId.get(id);
    if (!checkin) {
      skipped.push({ checkin_id: id, reason: "NOT_FOUND" });
      continue;
    }
    const tier = checkin.analysis_output?.triage?.tier ?? null;
    if (checkin.status !== "PENDING_REVIEW") {
      skipped.push({ checkin_id: id, reason: "NOT_PENDING_REVIEW" });
    } else if (tier !== "YELLOW") {
      skipped.push({ checkin_id: id, reason: tier === null ? "TRIAGE_UNKNOWN" : "NOT_YELLOW" });
    } else {
      selectedIds.push(id);
    }
  }
  return Object.freeze({ selected_ids: Object.freeze(selectedIds), skipped: Object.freeze(skipped) });
}
