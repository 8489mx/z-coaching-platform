/**
 * Where a client stands inside the current training cycle (mesocycle), and when the coach has to act.
 *
 * The plan a client trains on covers a fixed number of weeks (five by default: four of loading and
 * one deload). Nothing in the system used to notice when those weeks run out, so a client on a long
 * subscription could keep opening a finished plan. This reads the answer from the plan itself and
 * the date it started; no new column, no new table.
 */

const DEFAULT_CYCLE_WEEKS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;
const ATTENTION_WINDOW_DAYS = 7;

export const CYCLE_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  ENDING_SOON: "ENDING_SOON",
  ENDED: "ENDED",
});

/** The weeks this plan was built for, whichever shape the training block uses. */
function resolveTotalWeeks(programData = {}) {
  const training = programData.training_program || programData.training || {};
  const weeks = Array.isArray(training.weeks) ? training.weeks.length : 0;
  return weeks > 0 ? weeks : DEFAULT_CYCLE_WEEKS;
}

/** The day the client started this cycle: recorded on the plan, else the day the plan was created. */
function resolveStartDate(program) {
  const recorded = program?.program_data?.cycle_started_at;
  const candidate = recorded ? new Date(recorded) : new Date(program?.createdAt || Date.now());
  return Number.isNaN(candidate.getTime()) ? new Date() : candidate;
}

/**
 * @returns {{cycle_number:number,total_weeks:number,current_week:number,weeks_remaining:number,
 *   days_remaining:number,started_on:string,ends_on:string,status:string,needs_new_cycle:boolean,message_ar:string}}
 */
export function resolveTrainingCycleStatus(program, now = new Date()) {
  const programData = program?.program_data || {};
  const totalWeeks = resolveTotalWeeks(programData);
  const startedAt = resolveStartDate(program);
  const endsAt = new Date(startedAt.getTime() + totalWeeks * 7 * DAY_MS);

  const daysElapsed = Math.floor((now.getTime() - startedAt.getTime()) / DAY_MS);
  const currentWeek = Math.min(totalWeeks, Math.max(1, Math.floor(daysElapsed / 7) + 1));
  const daysRemaining = Math.ceil((endsAt.getTime() - now.getTime()) / DAY_MS);

  const status = daysRemaining <= 0
    ? CYCLE_STATUS.ENDED
    : daysRemaining <= ATTENTION_WINDOW_DAYS
      ? CYCLE_STATUS.ENDING_SOON
      : CYCLE_STATUS.ACTIVE;

  const messages = {
    [CYCLE_STATUS.ACTIVE]: `الأسبوع ${currentWeek} من ${totalWeeks} في الدورة الحالية.`,
    [CYCLE_STATUS.ENDING_SOON]: `الدورة الحالية تنتهي خلال ${daysRemaining} يوم، والمتدرب يحتاج دورة جديدة بعدها.`,
    [CYCLE_STATUS.ENDED]: daysRemaining === 0
      ? "الدورة الحالية انتهت اليوم، والمتدرب بلا دورة جديدة."
      : `الدورة الحالية انتهت منذ ${Math.abs(daysRemaining)} يوم، والمتدرب ما زال على خطة منتهية.`,
  };

  return {
    cycle_number: Number(programData.cycle_number) > 0 ? Number(programData.cycle_number) : 1,
    total_weeks: totalWeeks,
    current_week: currentWeek,
    weeks_remaining: Math.max(0, Math.ceil(daysRemaining / 7)),
    days_remaining: daysRemaining,
    started_on: startedAt.toISOString().slice(0, 10),
    ends_on: endsAt.toISOString().slice(0, 10),
    status,
    needs_new_cycle: status !== CYCLE_STATUS.ACTIVE,
    message_ar: messages[status],
  };
}

/**
 * A plan's cycle starts the day the client receives it. A draft can wait days for the coach (a
 * medical review, a pain flag); counting from the day it was prepared would start the client in
 * week two. Called when a draft is published; returns a copy with the start date set.
 */
export function startCycleOnPublish(programData, now = new Date()) {
  if (!programData || typeof programData !== "object") return programData;
  return { ...programData, cycle_started_at: new Date(now.getTime()).toISOString() };
}

/** True when the coach should see this client in the "needs a new cycle" list. */
export function needsCoachAttention(program, now = new Date()) {
  return resolveTrainingCycleStatus(program, now).needs_new_cycle;
}

const RENEWAL_WINDOW_DAYS = 14;

export const SUBSCRIPTION_STATE = Object.freeze({
  ACTIVE: "ACTIVE",
  ENDING_SOON: "ENDING_SOON",
  ENDED: "ENDED",
  OPEN: "OPEN",
});

/**
 * Where the client stands in their subscription. A client whose months run out without anyone
 * noticing is a client lost in silence, so the coach is told two weeks ahead.
 * A client with no end date recorded is treated as open, never as expired.
 */
export function resolveSubscriptionState(user, now = new Date()) {
  const raw = user?.subscription_end_date;
  if (!raw) return { status: SUBSCRIPTION_STATE.OPEN, days_remaining: null, ends_on: null, message_ar: "لا يوجد تاريخ انتهاء مسجّل للاشتراك." };

  const endsAt = new Date(raw);
  if (Number.isNaN(endsAt.getTime())) {
    return { status: SUBSCRIPTION_STATE.OPEN, days_remaining: null, ends_on: null, message_ar: "تاريخ انتهاء الاشتراك غير صالح في ملف المتدرب." };
  }

  const daysRemaining = Math.ceil((endsAt.getTime() - now.getTime()) / DAY_MS);
  const status = daysRemaining <= 0
    ? SUBSCRIPTION_STATE.ENDED
    : daysRemaining <= RENEWAL_WINDOW_DAYS
      ? SUBSCRIPTION_STATE.ENDING_SOON
      : SUBSCRIPTION_STATE.ACTIVE;

  const messages = {
    [SUBSCRIPTION_STATE.ACTIVE]: `الاشتراك سارٍ حتى ${endsAt.toISOString().slice(0, 10)}.`,
    [SUBSCRIPTION_STATE.ENDING_SOON]: `اشتراك المتدرب ينتهي خلال ${daysRemaining} يوم، كلّمه في التجديد.`,
    [SUBSCRIPTION_STATE.ENDED]: daysRemaining === 0
      ? "اشتراك المتدرب ينتهي اليوم."
      : `اشتراك المتدرب انتهى منذ ${Math.abs(daysRemaining)} يوم.`,
  };

  return { status, days_remaining: daysRemaining, ends_on: endsAt.toISOString().slice(0, 10), message_ar: messages[status] };
}

/** True when the coach should hear about this subscription now. */
export function subscriptionNeedsAttention(user, now = new Date()) {
  const state = resolveSubscriptionState(user, now);
  return state.status === SUBSCRIPTION_STATE.ENDING_SOON || state.status === SUBSCRIPTION_STATE.ENDED;
}
