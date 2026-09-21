/**
 * Runs "run-due cycles" every day, so a long subscription moves to its next cycle without the
 * coach remembering the button. The run is exactly the coach's action: every safety gate (medical
 * review, pain, deload, subscription, no recent check-in) still holds, and gated clients get a draft
 * waiting for the coach with the reason stated.
 */
import { User } from "../models/index.js";
import { runDueCycles } from "../controllers/program.controller.js";

const RUN_HOUR_CAIRO = 4; // after the 03:00 backup
const CHECK_EVERY_MS = 1000 * 60 * 30;

let timer = null;
let lastRunDay = null;

function cairoParts(now) {
  const local = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
  return { hour: local.getHours(), day: `${local.getFullYear()}-${local.getMonth() + 1}-${local.getDate()}` };
}

/** True once per Cairo day, at or after the run hour. */
export function shouldRunDueCycles(now, lastDay) {
  const { hour, day } = cairoParts(now);
  return hour >= RUN_HOUR_CAIRO && day !== lastDay;
}

/**
 * One run, as the first admin account. Returns the run-due response body, or null when there is no
 * admin to act as.
 */
export async function runDueCyclesNow({ run = runDueCycles, findActor = () => User.findOne({ where: { role: "ADMIN" }, order: [["id", "ASC"]] }) } = {}) {
  const actor = await findActor();
  if (!actor) {
    console.warn("[CYCLE SCHEDULER] No admin account to run due cycles as; skipped.");
    return null;
  }
  const out = { status: 200, body: null };
  const res = { status(code) { out.status = code; return res; }, json(body) { out.body = body; return res; } };
  await run({ user: { id: actor.id, role: "ADMIN" } }, res);
  if (out.status !== 200) throw new Error(out.body?.error || `run-due returned ${out.status}`);
  console.log(`[CYCLE SCHEDULER] ${out.body?.message_ar || "done"}`);
  return out.body;
}

export function initDailyCycleScheduler() {
  if (timer) clearInterval(timer);
  timer = setInterval(async () => {
    const now = new Date();
    if (!shouldRunDueCycles(now, lastRunDay)) return;
    lastRunDay = cairoParts(now).day;
    try {
      await runDueCyclesNow();
    } catch (err) {
      console.error("[CYCLE SCHEDULER ERROR]", err);
    }
  }, CHECK_EVERY_MS);
  console.log("[CYCLE SCHEDULER] Initialized: due training cycles are prepared daily at 04:00 Africa/Cairo.");
}
