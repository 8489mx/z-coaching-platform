/**
 * Progression & Deload Engine (single source for the client app, coach screens and API).
 * Backend re-export: src/training-engine-v2/progression/index.js
 *
 * Logging model (one summary per exercise per session, never per set):
 *   { exercise_code, weight_kg, last_set_reps, effort: 'EASY' | 'OK' | 'HARD', rep_min, rep_max, sets }
 * The LAST set is the progression signal: with straight sets at one working weight, if the last (most
 * fatigued) set reaches the top of the rep range, every earlier set did too. Effort maps to reps in reserve
 * so progression respects the RIR floors of the training engine.
 *
 * Science basis: double progression within a rep range; RIR-based effort (Helms et al. 2016); training to
 * failure not required (Refalo et al. 2023); performance decline as the primary fatigue marker, deloads of
 * ~40-50% volume at maintained or slightly reduced load (Bell et al. 2023 deload consensus).
 */

export const EFFORT_LEVELS = Object.freeze({ EASY: 'EASY', OK: 'OK', HARD: 'HARD' });
export const EFFORT_RIR = Object.freeze({ EASY: 3, OK: 1.5, HARD: 0 });
export const EFFORT_LABELS_AR = Object.freeze({
  EASY: 'سهل، كان فيه عدات زيادة',
  OK: 'مناسب',
  HARD: 'صعب، ماكنتش أقدر أكمل',
});

export const PROGRESSION_DECISIONS = Object.freeze({
  INCREASE_WEIGHT: 'INCREASE_WEIGHT',
  ADD_REPS: 'ADD_REPS',
  HOLD_CONSOLIDATE: 'HOLD_CONSOLIDATE',
  HOLD_RETRY: 'HOLD_RETRY',
  REDUCE_WEIGHT: 'REDUCE_WEIGHT',
  EXTEND_REPS_BEFORE_JUMP: 'EXTEND_REPS_BEFORE_JUMP',
  BODYWEIGHT_PROGRESS: 'BODYWEIGHT_PROGRESS',
});

export const DELOAD_STATUS = Object.freeze({ NONE: 'NONE', ACTIVE: 'ACTIVE' });
export const DELOAD_REASONS = Object.freeze({
  SCHEDULED: 'SCHEDULED',
  PERFORMANCE_FATIGUE: 'PERFORMANCE_FATIGUE',
  JOINT_PAIN: 'JOINT_PAIN',
});

const PERFORMANCE_DROP_RATIO = 0.975; // e1RM falling more than 2.5% session to session
const BODYWEIGHT_PATTERN = /PUSH_UP|PULL_UP|CHIN_UP|DIPS|PLANK|DEAD_BUG|BIRD_DOG|NORDIC|SISSY|AIR_SQUAT|BODYWEIGHT|INVERTED_ROW|STOMACH_VACUUM|PALLOF|COPENHAGEN|HANGING_LEG_RAISE|AB_WHEEL/;

/** Smallest practical load jump for the exercise's equipment (kg). 0 = bodyweight. */
export function resolveIncrementKg(exerciseCode = '') {
  const code = String(exerciseCode).toUpperCase();
  if (BODYWEIGHT_PATTERN.test(code) && !/BARBELL|DUMBBELL|MACHINE|CABLE/.test(code)) return 0;
  if (/BARBELL|SMITH|EZ_BAR|T_BAR/.test(code)) return 2.5;
  if (/DUMBBELL|GOBLET|KETTLEBELL|_DB_|DB_/.test(code)) return 2;
  if (/LEG_PRESS|HACK_SQUAT|HIP_THRUST/.test(code)) return 5;
  if (/CABLE|PULLDOWN|ROW|FACE_PULL|PUSHDOWN|MACHINE|PEC_DECK|LEG_CURL|LEG_EXTENSION|CALF/.test(code)) return 2.5;
  return 2.5;
}

const roundDownTo = (value, step) => (step > 0 ? Math.floor(value / step + 1e-9) * step : value);
const round1 = (n) => Math.round(n * 10) / 10;

/** Epley estimate of 1RM including reps in reserve; null for bodyweight or invalid input. */
export function estimateE1RM(weightKg, reps, rir = 0) {
  const w = Number(weightKg);
  const r = Number(reps);
  if (!(w > 0) || !(r > 0)) return null;
  const effective = Math.min(15, r + Math.max(0, Number(rir) || 0));
  return round1(w * (1 + effective / 30));
}

/** Sanitises one logged exercise; returns null when unusable. */
export function normalizeLoggedExercise(raw = {}) {
  const code = String(raw.exercise_code || raw.code || '').trim();
  const reps = Math.round(Number(raw.last_set_reps ?? raw.reps));
  const weight = Number(raw.weight_kg ?? raw.weight ?? 0);
  const effort = EFFORT_LEVELS[String(raw.effort || 'OK').toUpperCase()] || EFFORT_LEVELS.OK;
  let repMin = Math.round(Number(raw.rep_min));
  let repMax = Math.round(Number(raw.rep_max));
  if (!code || !Number.isFinite(reps) || reps < 0 || reps > 100) return null;
  if (!Number.isFinite(weight) || weight < 0 || weight > 500) return null;
  if (!(repMin > 0)) repMin = 8;
  if (!(repMax >= repMin)) repMax = repMin + 2;
  return {
    exercise_code: code,
    name: raw.name ? String(raw.name).slice(0, 120) : null,
    weight_kg: round1(weight),
    last_set_reps: reps,
    effort,
    rep_min: repMin,
    rep_max: repMax,
    sets: Number.isFinite(Number(raw.sets)) ? Math.round(Number(raw.sets)) : null,
  };
}

/**
 * Next-session decision for one exercise from its latest logged summary.
 * @returns {{decision, next_weight_kg, next_rep_min, next_rep_max, next_rep_target, stall_count, directive_ar}}
 */
export function evaluateExercise({
  exercise_code,
  rep_min,
  rep_max,
  weight_kg,
  last_set_reps,
  effort = 'OK',
  stall_count = 0,
  is_unreliable_data = false,
  joint_pain_reported = false,
}) {
  const increment = resolveIncrementKg(exercise_code);
  const weight = Number(weight_kg) || 0;
  const reps = Number(last_set_reps) || 0;
  const hard = effort === EFFORT_LEVELS.HARD;
  const base = { next_rep_min: rep_min, next_rep_max: rep_max, next_weight_kg: weight, stall_count: 0 };

  // Guard: Incomplete or unreliable training data
  if (is_unreliable_data || (weight === 0 && increment > 0 && reps > 0) || reps < 0) {
    return {
      ...base,
      decision: PROGRESSION_DECISIONS.HOLD_CONSOLIDATE,
      next_rep_target: rep_min,
      requires_coach_review: true,
      directive_ar: 'بيانات التسجيل غير مكتملة أو غير مؤكدة: استمر على نفس الوزن والتركيز على إتقان الحركة والتسجيل الدقيق الجلسة القادمة.',
    };
  }

  // Guard: Reported joint pain contraindication
  if (joint_pain_reported) {
    const safeWeight = reps < rep_min ? Math.max(increment, round1(roundDownTo(weight * 0.9, increment))) : weight;
    return {
      ...base,
      next_weight_kg: safeWeight,
      decision: reps < rep_min ? PROGRESSION_DECISIONS.REDUCE_WEIGHT : PROGRESSION_DECISIONS.HOLD_CONSOLIDATE,
      next_rep_target: rep_min,
      requires_coach_review: true,
      directive_ar: 'تم رصد ألم أو إجهاد مفصلي في المتابعة: حظر زيادة الوزن للحفاظ على سلامة المفصل ومراجعة المدرب.',
    };
  }

  if (increment === 0 || weight === 0) {
    const target = reps >= rep_max && !hard ? rep_max + 2 : Math.min(rep_max, reps + 1);
    return {
      ...base,
      decision: PROGRESSION_DECISIONS.BODYWEIGHT_PROGRESS,
      next_rep_target: Math.max(rep_min, target),
      directive_ar: reps >= rep_max && !hard
        ? `وصلت لآخر النطاق بوزن الجسم: زود عدتين أو انزل أبطأ (4 ثوانٍ) في الجلسة الجاية.`
        : `استهدف ${Math.max(rep_min, target)} عدات في آخر مجموعة الجلسة الجاية.`,
    };
  }

  if (reps >= rep_max && hard) {
    return { ...base, decision: PROGRESSION_DECISIONS.HOLD_CONSOLIDATE, next_rep_target: rep_max,
      directive_ar: `وصلت لـ ${rep_max} عدات بس بصعوبة: ثبت ${weight} كجم الجلسة الجاية لحد ما تبقى مريحة، وبعدها نزود.` };
  }

  if (reps >= rep_max) {
    // Dumbbell jumps above 10% of the load: extend reps first (rep-extension bridge) to earn the jump.
    const jumpRatio = increment / weight;
    if (/DUMBBELL|GOBLET|KETTLEBELL/.test(String(exercise_code).toUpperCase()) && jumpRatio > 0.1 && reps < rep_max + 2) {
      return { ...base, decision: PROGRESSION_DECISIONS.EXTEND_REPS_BEFORE_JUMP, next_rep_target: rep_max + 2,
        directive_ar: `قفزة الدمبل التالية كبيرة (${Math.round(jumpRatio * 100)}%): استهدف ${rep_max + 2} عدات بنفس ${weight} كجم أولاً، وبعدها انقل للوزن الأتقل.` };
    }
    const next = round1(weight + increment);
    return { ...base, decision: PROGRESSION_DECISIONS.INCREASE_WEIGHT, next_weight_kg: next, next_rep_target: rep_min,
      directive_ar: `ممتاز! زود الوزن إلى ${next} كجم وابدأ من ${rep_min} عدات.` };
  }

  if (reps >= rep_min) {
    const target = Math.min(rep_max, reps + 1);
    return { ...base, decision: PROGRESSION_DECISIONS.ADD_REPS, next_rep_target: target,
      directive_ar: `نفس الوزن ${weight} كجم، والهدف ${target} عدات في آخر مجموعة.` };
  }

  const stalls = (Number(stall_count) || 0) + 1;
  if (stalls >= 2) {
    const reduced = Math.max(increment, round1(roundDownTo(weight * 0.9, increment)));
    return { ...base, decision: PROGRESSION_DECISIONS.REDUCE_WEIGHT, next_weight_kg: reduced, next_rep_target: rep_min, stall_count: 0,
      directive_ar: `ماوصلتش لـ ${rep_min} عدات مرتين ورا بعض: نزل الوزن إلى ${reduced} كجم وابني من جديد بتكنيك نظيف.` };
  }
  return { ...base, decision: PROGRESSION_DECISIONS.HOLD_RETRY, next_rep_target: rep_min, stall_count: stalls,
    directive_ar: `ماوصلتش لـ ${rep_min} عدات: جرب نفس ${weight} كجم تاني الجلسة الجاية مع نوم وأكل كويس قبل التمرين.` };
}

/**
 * Weight for the first session after a deload.
 * - scheduled deload after progress: last successful weight (week 1 targets RIR 3, so reps rise naturally)
 * - exercise that stalled or dropped: 10% under the weight it stalled at
 * - joint pain: 20% under (the injury firewall may also swap the exercise)
 * - break longer than 14 days: 10% under (20% after 28 days)
 * Never above the last successful weight.
 */
export function buildPostDeloadTarget({ exercise_code, last_success_weight_kg, stall_weight_kg = null, affected = false, reason = DELOAD_REASONS.SCHEDULED, days_since_last_session = 0 }) {
  const increment = resolveIncrementKg(exercise_code);
  const lastSuccess = Number(last_success_weight_kg) || 0;
  if (!(lastSuccess > 0) || increment === 0) return { weight_kg: lastSuccess, rule: 'UNCHANGED' };
  let weight = lastSuccess;
  let rule = 'LAST_SUCCESS';
  if (affected && reason === DELOAD_REASONS.JOINT_PAIN) {
    weight = lastSuccess * 0.8;
    rule = 'PAIN_MINUS_20';
  } else if (affected) {
    weight = (Number(stall_weight_kg) || lastSuccess) * 0.9;
    rule = 'STALL_MINUS_10';
  }
  if (days_since_last_session > 28) { weight = Math.min(weight, lastSuccess * 0.8); rule = 'LONG_BREAK_MINUS_20'; }
  else if (days_since_last_session > 14) { weight = Math.min(weight, lastSuccess * 0.9); rule = 'BREAK_MINUS_10'; }
  const rounded = Math.max(increment, round1(roundDownTo(weight, increment)));
  return { weight_kg: Math.min(lastSuccess, rounded), rule };
}

/** Is an entry inside an approved deload window? */
function inDeloadWindow(date, windows) {
  const t = new Date(date).getTime();
  return windows.find((w) => t >= new Date(w.starts_at).getTime() && t < new Date(w.ends_at).getTime()) || null;
}

/**
 * Replays the workout log history into the current per-exercise state.
 * @param {Object} input
 * @param {Array<{created_at, week_number, is_deload?, logged_exercises}>} input.logs
 * @param {Array<{starts_at, ends_at, reason, affected_exercises?}>} [input.deload_windows]  coach-approved deloads
 * @param {string|Date} [input.now]
 */
export function buildProgressionState({ logs = [], deload_windows = [], now = new Date() } = {}) {
  const exercises = {};
  const ordered = [...logs].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  let lastDeload = null;

  for (const log of ordered) {
    const window = inDeloadWindow(log.created_at, deload_windows);
    const isDeloadEntry = Boolean(log.is_deload) || (Number(log.week_number) === 5 && log.phase !== 'CONSOLIDATION' && log.is_deload !== false && (log.phase === 'DELOAD' || log.is_deload === true || log.is_planned_deload === true)) || Boolean(window);
    if (isDeloadEntry) lastDeload = { reason: window?.reason || DELOAD_REASONS.SCHEDULED, affected: window?.affected_exercises || [], at: log.created_at };

    for (const raw of Array.isArray(log.logged_exercises) ? log.logged_exercises : []) {
      const entry = normalizeLoggedExercise(raw);
      if (!entry) continue;
      const s = exercises[entry.exercise_code] || (exercises[entry.exercise_code] = {
        exercise_code: entry.exercise_code, name: entry.name, history: [], stall_count: 0, drop_streak: 0,
        last_success_weight_kg: null, stall_weight_kg: null, best_e1rm: null, pending_post_deload: null,
      });
      s.name = entry.name || s.name;
      const e1rm = estimateE1RM(entry.weight_kg, entry.last_set_reps, EFFORT_RIR[entry.effort]);
      const previous = s.history.filter((h) => !h.is_deload).slice(-1)[0];

      if (isDeloadEntry) {
        s.history.push({ date: log.created_at, week_number: log.week_number, ...entry, e1rm, is_deload: true, decision: 'DELOAD' });
        const lastDecision = previous?.decision;
        s.pending_post_deload = {
          reason: lastDeload.reason,
          affected: lastDeload.affected.includes(entry.exercise_code) || s.drop_streak >= 2 || s.stall_count >= 1 ||
            lastDecision === PROGRESSION_DECISIONS.HOLD_RETRY || lastDecision === PROGRESSION_DECISIONS.REDUCE_WEIGHT,
        };
        continue;
      }

      s.pending_post_deload = null;
      s.drop_streak = previous?.e1rm && e1rm && e1rm < previous.e1rm * PERFORMANCE_DROP_RATIO ? s.drop_streak + 1 : 0;
      const decision = evaluateExercise({ ...entry, stall_count: s.stall_count });
      if (entry.last_set_reps >= entry.rep_min) s.last_success_weight_kg = entry.weight_kg;
      if (entry.last_set_reps < entry.rep_min) s.stall_weight_kg = entry.weight_kg;
      s.stall_count = decision.stall_count;
      if (e1rm && (!s.best_e1rm || e1rm > s.best_e1rm)) s.best_e1rm = e1rm;
      s.target = { weight_kg: decision.next_weight_kg, rep_min: decision.next_rep_min, rep_max: decision.next_rep_max, rep_target: decision.next_rep_target, directive_ar: decision.directive_ar, decision: decision.decision };
      s.history.push({ date: log.created_at, week_number: log.week_number, ...entry, e1rm, is_deload: false, decision: decision.decision });
    }
  }

  const nowMs = new Date(now).getTime();
  for (const s of Object.values(exercises)) {
    const last = s.history[s.history.length - 1];
    const lastWorking = s.history.filter((h) => !h.is_deload).slice(-1)[0] || last;
    const daysSince = last ? (nowMs - new Date(last.date).getTime()) / 86400000 : 0;
    if (s.pending_post_deload || daysSince > 14) {
      const post = buildPostDeloadTarget({
        exercise_code: s.exercise_code,
        last_success_weight_kg: s.last_success_weight_kg ?? lastWorking?.weight_kg,
        stall_weight_kg: s.stall_weight_kg,
        affected: Boolean(s.pending_post_deload?.affected),
        reason: s.pending_post_deload?.reason || DELOAD_REASONS.SCHEDULED,
        days_since_last_session: daysSince,
      });
      const repMin = lastWorking?.rep_min ?? 8;
      const repMax = lastWorking?.rep_max ?? 10;
      s.target = { weight_kg: post.weight_kg, rep_min: repMin, rep_max: repMax, rep_target: repMax, decision: 'POST_DELOAD_RESET', rule: post.rule,
        directive_ar: post.rule === 'LAST_SUCCESS'
          ? `بداية دورة جديدة: ارجع لآخر وزن ناجح ${post.weight_kg} كجم، والعدات هتطلع أكتر بعد الاستشفاء.`
          : `بداية دورة جديدة: ابدأ بـ ${post.weight_kg} كجم (أخف من آخر وزن) وابني الزخم من جديد.` };
    }
    s.history = s.history.slice(-12);
  }

  const activeWindow = deload_windows.find((w) => nowMs >= new Date(w.starts_at).getTime() && nowMs < new Date(w.ends_at).getTime());
  return {
    exercises,
    deload: activeWindow
      ? { status: DELOAD_STATUS.ACTIVE, reason: activeWindow.reason, ends_at: activeWindow.ends_at, affected_exercises: activeWindow.affected_exercises || [] }
      : { status: DELOAD_STATUS.NONE },
    // A deload just finished (or a long break): the next session starts a new mesocycle from week 1.
    new_cycle_ready: !activeWindow && Object.values(exercises).some((s) => s.target?.decision === 'POST_DELOAD_RESET'),
    stalled_exercises: Object.values(exercises).filter((s) => s.stall_count >= 1).map((s) => s.exercise_code),
    dropping_exercises: Object.values(exercises).filter((s) => s.drop_streak >= 2).map((s) => s.exercise_code),
  };
}

/**
 * Early-deload recommendation for the coach (never applied automatically).
 * Primary signal: performance dropping 2 sessions in a row on 2+ exercises, confirmed by check-in fatigue.
 * Joint pain >= 7/10 alone is enough.
 * @param {Object} input
 * @param {Object} input.state             buildProgressionState() result
 * @param {Object} [input.biofeedback]     1-5 scale: energy_level, sleep_quality
 * @param {number} [input.sleep_stress_composite] 1-5
 * @param {number} [input.max_pain_level] 0-10
 */
export function evaluateDeloadTrigger({ state, biofeedback = {}, sleep_stress_composite = null, max_pain_level = 0 }) {
  if (state?.deload?.status === DELOAD_STATUS.ACTIVE) return { recommended: false, reasons_ar: [], affected_exercises: [] };
  const dropping = state?.dropping_exercises || [];
  const fatigueSignals = [];
  if (Number(biofeedback.energy_level) <= 2) fatigueSignals.push('طاقة منخفضة');
  if (Number(biofeedback.sleep_quality) <= 2) fatigueSignals.push('نوم سيئ');
  if (sleep_stress_composite !== null && Number(sleep_stress_composite) <= 2) fatigueSignals.push('نوم وتوتر مرتفع');

  if (Number(max_pain_level) >= 7) {
    return { recommended: true, reason: DELOAD_REASONS.JOINT_PAIN, affected_exercises: dropping,
      reasons_ar: [`ألم مفصلي ${max_pain_level}/10 في المتابعة`] };
  }
  if (dropping.length >= 2 && fatigueSignals.length > 0) {
    return { recommended: true, reason: DELOAD_REASONS.PERFORMANCE_FATIGUE, affected_exercises: dropping,
      reasons_ar: [`تراجع الأداء جلستين متتاليتين في ${dropping.length} تمارين`, ...fatigueSignals] };
  }
  return { recommended: false, reasons_ar: [], affected_exercises: [] };
}

/** Deload version of a session: ~40% fewer sets, RIR 4, same technique. */
export function applyDeloadToSession(workoutSession) {
  if (!workoutSession || !workoutSession.exercises) return workoutSession;
  const adjustedExercises = workoutSession.exercises.map((ex) => ({
    ...ex,
    sets: Math.max(1, Math.round((Number(ex.sets) || 0) * 0.6)),
    target_rir: Math.max((ex.target_rir || 2) + 2, 4),
    cue: '[أسبوع استشفاء] أداء سلس بتركيز حركي كامل دون الوصول للإنهاك.',
  }));
  return {
    ...workoutSession,
    is_deload: true,
    title_ar: `${workoutSession.title_ar || 'تمرين اليوم'} (أسبوع الاستشفاء - Deload)`,
    exercises: adjustedExercises,
  };
}

/**
 * What the client is told about today's effort, by declared readiness. One wording for the web app,
 * the API (client_view) and the phone: a training rule written twice is a rule that drifts.
 * Basis: autoregulation by session RPE/RIR (Zourdos 2016, Helms 2018) — on a depleted day the load
 * comes down and failure is avoided, rather than the session being skipped.
 */
export const READINESS_GUIDANCE_AR = Object.freeze({
  OPTIMAL: 'قاعدة الجاهزية (RPE): اضبط أوزانك وفق طاقتك الحالية مع إبقاء 1-2 تكرار في الاحتياط قبل الفشل العضلي بتكنيك آمن ومحكم.',
  FATIGUED: 'توجيه فسيولوجي ليوم الإجهاد: طاقتك تتأثر بنومك وضغوط يومك وهذا تذبذب عصبي طبيعي مؤقت. من الاحترافية خفض الأوزان بنسبة 10-20% والتركيز على المدى الحركي الكامل وتفادي الوصول للفشل العضلي التام اليوم. قوتك الحقيقية ستعود بكامل كفاءتها الأسبوع القادم.',
});
